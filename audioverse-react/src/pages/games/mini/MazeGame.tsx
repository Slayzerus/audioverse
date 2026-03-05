/**
 * MazeGame — 2-4 players race through a random maze. First to reach the exit wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, gamepadDir } from './inputMaps'
import css from './SharedGame.module.css'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const COLS=21,ROWS=15,CELL=28,W=COLS*CELL,H=ROWS*CELL,SPEED=2.5,PR=8

function generateMaze():{walls:boolean[][]} {
  const walls:boolean[][]=Array.from({length:ROWS},()=>Array(COLS).fill(true))
  const visited:boolean[][]=Array.from({length:ROWS},()=>Array(COLS).fill(false))
  function carve(r:number,c:number){visited[r][c]=true;walls[r][c]=false
    const dirs=[[0,2],[0,-2],[2,0],[-2,0]].sort(()=>Math.random()-0.5)
    for(const[dr,dc]of dirs){const nr=r+dr,nc=c+dc
      if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&!visited[nr][nc]){walls[r+dr/2][c+dc/2]=false;carve(nr,nc)}}}
  carve(1,1);walls[ROWS-2][COLS-2]=false;walls[ROWS-2][COLS-3]=false
  return{walls}
}

interface Runner{x:number;y:number;vx:number;vy:number;color:string;name:string;idx:number;input:PlayerSlot['input'];finished:boolean;finishTime:number}
interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function MazeGame({players,config:_config,onBack}:Props){
  useGameFocusLock();
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const mazeRef=useRef(generateMaze())
  const runnersRef=useRef<Runner[]>(players.map((p,i)=>({x:CELL*1.5,y:CELL*1.5+i*10,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,finished:false,finishTime:0})))
  const startRef=useRef(performance.now())
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const r of runnersRef.current){if(r.finished)continue
        if(r.input.type==='keyboard'){const g=(r.input as{type:'keyboard';group:number}).group;let vx=0,vy=0
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){vx+=m.dir.dx;vy+=m.dir.dy}}
          const mag=Math.sqrt(vx*vx+vy*vy)||1;r.vx=vx?vx/mag*SPEED:0;r.vy=vy?vy/mag*SPEED:0
        }else{const gp=padsRef.current.find(g=>g.index===(r.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){const d=gamepadDir(gp);if(d){r.vx=d.dx*SPEED;r.vy=d.dy*SPEED}else{r.vx=0;r.vy=0}}}}
      raf=requestAnimationFrame(poll)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[])

  useEffect(()=>{
    let raf=0
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const runners=runnersRef.current,{walls}=mazeRef.current
      for(const r of runners){if(r.finished)continue
        const nx=r.x+r.vx,ny=r.y+r.vy
        const col=Math.floor(nx/CELL),row=Math.floor(ny/CELL)
        if(col>=0&&col<COLS&&row>=0&&row<ROWS&&!walls[row][col]){r.x=nx;r.y=ny}
        else{/* try slide */ const col2=Math.floor(r.x/CELL),row2=Math.floor((r.y+r.vy)/CELL)
          if(row2>=0&&row2<ROWS&&!walls[row2][col2])r.y+=r.vy
          else{const col3=Math.floor((r.x+r.vx)/CELL),row3=Math.floor(r.y/CELL)
            if(col3>=0&&col3<COLS&&!walls[row3][col3])r.x+=r.vx}}
        // Check finish
        if(Math.floor(r.x/CELL)===COLS-2&&Math.floor(r.y/CELL)===ROWS-2){r.finished=true;r.finishTime=performance.now()-startRef.current}}
      if(runners.some(r=>r.finished)&&!gameOver){const w=runners.filter(r=>r.finished).sort((a,b)=>a.finishTime-b.finishTime)[0]
        setGameOver(true);setWinner(w.name)}
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#111';ctx.fillRect(0,0,W,H)
      for(let r=0;r<ROWS;r++)for(let col=0;col<COLS;col++){if(walls[r][col]){ctx.fillStyle='#2c3e50';ctx.fillRect(col*CELL,r*CELL,CELL,CELL)}}
      // Exit marker
      ctx.fillStyle='#2ecc71';ctx.fillRect((COLS-2)*CELL+4,(ROWS-2)*CELL+4,CELL-8,CELL-8)
      ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('EXIT',(COLS-2)*CELL+CELL/2,(ROWS-2)*CELL+CELL/2+4)
      for(const r of runners){if(r.finished)continue;ctx.beginPath();ctx.arc(r.x,r.y,PR,0,Math.PI*2);ctx.fillStyle=r.color;ctx.fill()
        ctx.fillStyle='#000';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(`${r.idx+1}`,r.x,r.y+3)}
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[gameOver])

  const restart=useCallback(()=>{mazeRef.current=generateMaze();runnersRef.current=players.map((p,i)=>({x:CELL*1.5,y:CELL*1.5+i*10,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,finished:false,finishTime:0}));startRef.current=performance.now();setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Maze canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>🏃‍♂️ {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
