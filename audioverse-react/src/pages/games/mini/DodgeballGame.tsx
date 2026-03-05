/**
 * DodgeballGame — 2-8 players. Balls bounce around. Get hit = eliminated. Last alive wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, gamepadDir } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W = 640, H = 480, PR = 10, SPEED = 3, BALL_R = 8, BALL_SPEED = 3.5
interface Player { x:number;y:number;vx:number;vy:number;color:string;name:string;idx:number;alive:boolean;input:PlayerSlot['input'] }
interface Ball { x:number;y:number;vx:number;vy:number }

function spawn(players:PlayerSlot[]):Player[] {
  return players.map((p,i)=>{const a=(i/players.length)*Math.PI*2;return{x:W/2+Math.cos(a)*120,y:H/2+Math.sin(a)*120,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,alive:true,input:p.input}})
}
function makeBalls(n:number):Ball[] {
  return Array.from({length:n},()=>({x:W/2+(Math.random()-0.5)*100,y:H/2+(Math.random()-0.5)*100,vx:(Math.random()-0.5)*BALL_SPEED*2,vy:(Math.random()-0.5)*BALL_SPEED*2}))
}

interface Props { players:PlayerSlot[];config?:GameConfig;onBack:()=>void }

export default function DodgeballGame({players,config:_config,onBack}:Props) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const playersRef=useRef(spawn(players))
  const ballsRef=useRef(makeBalls(3))
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;alive:boolean}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const frameRef=useRef(0)
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const p of playersRef.current){if(!p.alive)continue
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
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const ps=playersRef.current,bs=ballsRef.current
      frameRef.current++
      // add ball every 300 frames
      if(frameRef.current%300===0) bs.push(...makeBalls(1))
      for(const p of ps){if(!p.alive)continue;p.x=Math.max(PR,Math.min(W-PR,p.x+p.vx));p.y=Math.max(PR,Math.min(H-PR,p.y+p.vy))}
      for(const b of bs){b.x+=b.vx;b.y+=b.vy;if(b.x<BALL_R||b.x>W-BALL_R)b.vx*=-1;if(b.y<BALL_R||b.y>H-BALL_R)b.vy*=-1}
      for(const p of ps){if(!p.alive)continue;for(const b of bs){const dx=p.x-b.x,dy=p.y-b.y;if(Math.sqrt(dx*dx+dy*dy)<PR+BALL_R){p.alive=false;break}}}
      const alive=ps.filter(p=>p.alive)
      setScores(ps.map(p=>({idx:p.idx,name:p.name,color:p.color,alive:p.alive})))
      if(alive.length<=1){setGameOver(true);setWinner(alive.length===1?alive[0].name:'Nobody');return}
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#0a0a18';ctx.fillRect(0,0,W,H)
      for(const b of bs){ctx.beginPath();ctx.arc(b.x,b.y,BALL_R,0,Math.PI*2);ctx.fillStyle='#e74c3c';ctx.fill();ctx.shadowColor='#e74c3c';ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0}
      for(const p of ps){if(!p.alive)continue;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill()
        ctx.fillStyle='#000';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(`${p.idx+1}`,p.x,p.y+3)}
      ctx.strokeStyle='#333';ctx.lineWidth=2;ctx.strokeRect(0,0,W,H)
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const restart=useCallback(()=>{playersRef.current=spawn(players);ballsRef.current=makeBalls(3);frameRef.current=0;setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={`${css.scoreItem} ${!s.alive?css.dead:''}`}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Dodgeball canvas"/>
    {isPaused && (
      <PauseMenu
        onResume={resume}
        onBack={onBack}
        players={players}
      />
    )}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>⚾ {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
