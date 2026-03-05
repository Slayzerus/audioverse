/**
 * RaceGame — Top-down race for 2-8 players. Navigate around the oval track. 3 laps to win.
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

const W = 700, H = 500, SPEED = 3
const CX = W/2, CY = H/2, RX = 260, RY = 180, TRACK_W = 60
const LAPS_TO_WIN = 3

interface Racer { x:number;y:number;vx:number;vy:number;color:string;name:string;idx:number;input:PlayerSlot['input'];lap:number;angle:number;lastCheckpoint:number }

function spawn(players:PlayerSlot[]):Racer[] {
  return players.map((p,i)=>({x:CX,y:CY-RY-TRACK_W/2+i*8,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,lap:0,angle:Math.PI/2,lastCheckpoint:0}))
}

interface Props { players:PlayerSlot[];config?:GameConfig;onBack:()=>void }

export default function RaceGame({players,config:_config,onBack}:Props) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const racersRef=useRef(spawn(players))
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;lap:number}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const r of racersRef.current){
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
      const racers=racersRef.current
      for(const r of racers){
        r.x=Math.max(4,Math.min(W-4,r.x+r.vx));r.y=Math.max(4,Math.min(H-4,r.y+r.vy))
        // Track angle for lap detection
        const a=Math.atan2(r.y-CY,r.x-CX)
        const checkpoint=Math.floor(((a+Math.PI)/(Math.PI*2))*4)
        if(checkpoint===0&&r.lastCheckpoint===3) r.lap++
        if(checkpoint===3&&r.lastCheckpoint===0&&r.lap>0) r.lap--
        r.lastCheckpoint=checkpoint
      }
      setScores(racers.map(r=>({idx:r.idx,name:r.name,color:r.color,lap:r.lap})))
      const w=racers.find(r=>r.lap>=LAPS_TO_WIN)
      if(w){setGameOver(true);setWinner(w.name);return}

      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#1a3a1a';ctx.fillRect(0,0,W,H)
      // Track
      ctx.strokeStyle='#333';ctx.lineWidth=TRACK_W
      ctx.beginPath();ctx.ellipse(CX,CY,RX,RY,0,0,Math.PI*2);ctx.stroke()
      ctx.strokeStyle='#555';ctx.lineWidth=TRACK_W-4
      ctx.beginPath();ctx.ellipse(CX,CY,RX,RY,0,0,Math.PI*2);ctx.stroke()
      // Center line
      ctx.strokeStyle='#fffa';ctx.lineWidth=1;ctx.setLineDash([10,10])
      ctx.beginPath();ctx.ellipse(CX,CY,RX,RY,0,0,Math.PI*2);ctx.stroke()
      ctx.setLineDash([])
      // Start/finish
      ctx.fillStyle='#fff';ctx.fillRect(CX-2,CY-RY-TRACK_W/2,4,TRACK_W)
      // Racers
      for(const r of racers){ctx.beginPath();ctx.arc(r.x,r.y,8,0,Math.PI*2);ctx.fillStyle=r.color;ctx.fill()
        ctx.fillStyle='#000';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(`${r.idx+1}`,r.x,r.y+3)}
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const restart=useCallback(()=>{racersRef.current=spawn(players);setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={css.scoreItem}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span><span className={css.scoreValue}>Lap {s.lap}/{LAPS_TO_WIN}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Race canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>🏎️ {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
