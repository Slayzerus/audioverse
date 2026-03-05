/**
 * HockeyGame — Air hockey for 2-4 players. Hit the puck into opponents' goals.
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

const W=640,H=480,PADDLE_R=18,PUCK_R=10,SPEED=4,GOAL_W=120,MAX_SCORE=5
interface Paddle{x:number;y:number;vx:number;vy:number;color:string;name:string;idx:number;score:number;input:PlayerSlot['input']}
interface Puck{x:number;y:number;vx:number;vy:number}

function spawnPaddles(players:PlayerSlot[]):Paddle[]{
  const pos=[[80,H/2],[W-80,H/2],[W/2,80],[W/2,H-80]]
  return players.map((p,i)=>({x:pos[i][0],y:pos[i][1],vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,score:0,input:p.input}))
}

interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function HockeyGame({players,config:_config,onBack}:Props){
  useGameFocusLock();
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const paddlesRef=useRef(spawnPaddles(players))
  const puckRef=useRef<Puck>({x:W/2,y:H/2,vx:3,vy:2})
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;score:number}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const p of paddlesRef.current){
        if(p.input.type==='keyboard'){const g=(p.input as{type:'keyboard';group:number}).group;let vx=0,vy=0
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){vx+=m.dir.dx;vy+=m.dir.dy}}
          const mag=Math.sqrt(vx*vx+vy*vy)||1;p.vx=vx?vx/mag*SPEED:0;p.vy=vy?vy/mag*SPEED:0
        }else{const gp=padsRef.current.find(g=>g.index===(p.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){const d=gamepadDir(gp);if(d){p.vx=d.dx*SPEED;p.vy=d.dy*SPEED}else{p.vx=0;p.vy=0}}}}
      raf=requestAnimationFrame(poll)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[])

  useEffect(()=>{
    let raf=0
    const resetPuck=()=>{puckRef.current={x:W/2,y:H/2,vx:(Math.random()-0.5)*4,vy:(Math.random()-0.5)*4}}
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const paddles=paddlesRef.current,pk=puckRef.current
      for(const p of paddles){p.x=Math.max(PADDLE_R,Math.min(W-PADDLE_R,p.x+p.vx));p.y=Math.max(PADDLE_R,Math.min(H-PADDLE_R,p.y+p.vy))}
      pk.x+=pk.vx;pk.y+=pk.vy;pk.vx*=0.999;pk.vy*=0.999
      // Goals: left=P0, right=P1, top=P2(if 3+), bottom=P3(if 4)
      const goalY1=H/2-GOAL_W/2,goalY2=H/2+GOAL_W/2
      const goalX1=W/2-GOAL_W/2,goalX2=W/2+GOAL_W/2
      let scored=-1
      if(pk.x<PUCK_R){if(pk.y>goalY1&&pk.y<goalY2&&paddles.length>=2){scored=0;resetPuck()}else{pk.vx=Math.abs(pk.vx);pk.x=PUCK_R}}
      if(pk.x>W-PUCK_R){if(pk.y>goalY1&&pk.y<goalY2&&paddles.length>=2){scored=1;resetPuck()}else{pk.vx=-Math.abs(pk.vx);pk.x=W-PUCK_R}}
      if(pk.y<PUCK_R){if(pk.x>goalX1&&pk.x<goalX2&&paddles.length>=3){scored=2;resetPuck()}else{pk.vy=Math.abs(pk.vy);pk.y=PUCK_R}}
      if(pk.y>H-PUCK_R){if(pk.x>goalX1&&pk.x<goalX2&&paddles.length>=4){scored=3;resetPuck()}else{pk.vy=-Math.abs(pk.vy);pk.y=H-PUCK_R}}
      // Score goes to everyone except the scored-on player
      if(scored>=0){for(const p of paddles){if(paddles.indexOf(p)!==scored)p.score++}}
      // Paddle-puck collision
      for(const p of paddles){const dx=pk.x-p.x,dy=pk.y-p.y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<PADDLE_R+PUCK_R&&d>0){const nx=dx/d,ny=dy/d;pk.vx=nx*5+p.vx*0.5;pk.vy=ny*5+p.vy*0.5;pk.x=p.x+nx*(PADDLE_R+PUCK_R+1);pk.y=p.y+ny*(PADDLE_R+PUCK_R+1)}}
      setScores(paddles.map(p=>({idx:p.idx,name:p.name,color:p.color,score:p.score})))
      const w=paddles.find(p=>p.score>=MAX_SCORE)
      if(w){setGameOver(true);setWinner(w.name);return}
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#0a1628';ctx.fillRect(0,0,W,H)
      // Center line
      ctx.strokeStyle='#224';ctx.lineWidth=2;ctx.beginPath();ctx.arc(W/2,H/2,60,0,Math.PI*2);ctx.stroke()
      ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke()
      // Goals
      ctx.fillStyle='#e74c3c44';if(paddles.length>=2){ctx.fillRect(0,goalY1,6,GOAL_W);ctx.fillRect(W-6,goalY1,6,GOAL_W)}
      if(paddles.length>=3)ctx.fillRect(goalX1,0,GOAL_W,6)
      if(paddles.length>=4)ctx.fillRect(goalX1,H-6,GOAL_W,6)
      // Paddles
      for(const p of paddles){ctx.beginPath();ctx.arc(p.x,p.y,PADDLE_R,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke()
        ctx.fillStyle='#000';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(`${p.idx+1}`,p.x,p.y+4)}
      // Puck
      ctx.beginPath();ctx.arc(pk.x,pk.y,PUCK_R,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill()
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const restart=useCallback(()=>{paddlesRef.current=spawnPaddles(players);puckRef.current={x:W/2,y:H/2,vx:3,vy:2};setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={css.scoreItem}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span><span className={css.scoreValue}>{s.score}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Hockey canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>🏒 {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
