/**
 * BounceGame — 2-4 players. Each player has a paddle at a side, ball bounces.
 * Miss the ball = lose a point. First to lose 5 = eliminated. Last alive wins.
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

const W = 640, H = 480, PAD_W = 10, PAD_H = 60, BALL_R = 8, BALL_SPEED = 4, PAD_SPEED = 5, MAX_LIVES = 5

interface Paddle { pos:number; lives:number; side:'left'|'right'|'top'|'bottom'; color:string; idx:number; name:string; alive:boolean; input:PlayerSlot['input'] }
interface Ball { x:number;y:number;vx:number;vy:number }

function makeBall():Ball { const a=Math.random()*Math.PI*2;return{x:W/2,y:H/2,vx:Math.cos(a)*BALL_SPEED,vy:Math.sin(a)*BALL_SPEED} }

export default function BounceGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })

  const sides:('left'|'right'|'top'|'bottom')[]=['left','right','top','bottom']
  const initPaddles=useCallback(()=>players.map((p,i):Paddle=>({pos:i%2===0?H/2:W/2,lives:MAX_LIVES,side:sides[i%4],color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,input:p.input})),[players])

  const state=useRef({paddles:initPaddles(),ball:makeBall(),keys:new Set<string>()})
  const restart=useCallback(()=>{state.current={paddles:initPaddles(),ball:makeBall(),keys:new Set()};setWinner(null)},[initPaddles])

  useEffect(()=>{
    const kd=(e:KeyboardEvent)=>state.current.keys.add(e.code)
    const ku=(e:KeyboardEvent)=>state.current.keys.delete(e.code)
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)}
  },[])

  useEffect(()=>{
    if(winner) return
    const id=setInterval(()=>{
      if (pauseRef.current) return
      const s=state.current; const padsSnap=padsRef.current
      // Move paddles
      for(const p of s.paddles){
        if(!p.alive) continue
        let move=0
        if(p.input.type==='keyboard'){
          for(const [code,v] of KEY_LOOKUP) if(v.group===p.input.group&&s.keys.has(code)){
            move+=(p.side==='left'||p.side==='right')?v.dir.dy:v.dir.dx
          }
        } else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d)move=(p.side==='left'||p.side==='right')?d.dy:d.dx}}
        p.pos+=move*PAD_SPEED
        const maxP=(p.side==='left'||p.side==='right')?H:W
        p.pos=Math.max(PAD_H/2,Math.min(maxP-PAD_H/2,p.pos))
      }
      // Move ball
      const b=s.ball; b.x+=b.vx; b.y+=b.vy
      // Check paddle hits & wall bounces
      for(const p of s.paddles){
        if(!p.alive) continue
        if(p.side==='left'&&b.x-BALL_R<=PAD_W&&b.vx<0){if(Math.abs(b.y-p.pos)<PAD_H/2){b.vx=-b.vx;b.x=PAD_W+BALL_R}else if(b.x<0){p.lives--;b.x=W/2;b.y=H/2}}
        if(p.side==='right'&&b.x+BALL_R>=W-PAD_W&&b.vx>0){if(Math.abs(b.y-p.pos)<PAD_H/2){b.vx=-b.vx;b.x=W-PAD_W-BALL_R}else if(b.x>W){p.lives--;b.x=W/2;b.y=H/2}}
        if(p.side==='top'&&b.y-BALL_R<=PAD_W&&b.vy<0){if(Math.abs(b.x-p.pos)<PAD_H/2){b.vy=-b.vy;b.y=PAD_W+BALL_R}else if(b.y<0){p.lives--;b.x=W/2;b.y=H/2}}
        if(p.side==='bottom'&&b.y+BALL_R>=H-PAD_W&&b.vy>0){if(Math.abs(b.x-p.pos)<PAD_H/2){b.vy=-b.vy;b.y=H-PAD_W-BALL_R}else if(b.y>H){p.lives--;b.x=W/2;b.y=H/2}}
        if(p.lives<=0)p.alive=false
      }
      // Default wall bounces (no paddle)
      if(b.y<BALL_R){b.vy=Math.abs(b.vy);b.y=BALL_R}
      if(b.y>H-BALL_R){b.vy=-Math.abs(b.vy);b.y=H-BALL_R}
      if(b.x<BALL_R){b.vx=Math.abs(b.vx);b.x=BALL_R}
      if(b.x>W-BALL_R){b.vx=-Math.abs(b.vx);b.x=W-BALL_R}

      const alive=s.paddles.filter(p=>p.alive)
      if(alive.length<=1&&s.paddles.length>1){setWinner(alive[0]?alive[0].name:'Draw');return}

      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#0a0a2a';ctx.fillRect(0,0,W,H)
      for(const p of s.paddles){
        if(!p.alive) continue
        ctx.fillStyle=p.color
        if(p.side==='left')ctx.fillRect(0,p.pos-PAD_H/2,PAD_W,PAD_H)
        if(p.side==='right')ctx.fillRect(W-PAD_W,p.pos-PAD_H/2,PAD_W,PAD_H)
        if(p.side==='top')ctx.fillRect(p.pos-PAD_H/2,0,PAD_H,PAD_W)
        if(p.side==='bottom')ctx.fillRect(p.pos-PAD_H/2,H-PAD_W,PAD_H,PAD_W)
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center'
        ctx.fillText(`${p.name}:${p.lives}`,p.side==='left'?30:p.side==='right'?W-30:p.pos,p.side==='top'?25:p.side==='bottom'?H-15:p.pos)
      }
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(b.x,b.y,BALL_R,0,Math.PI*2);ctx.fill()
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players,initPaddles])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Bounce canvas"/>
    {isPaused && (
      <PauseMenu
        onResume={resume}
        onBack={onBack}
        players={players}
      />
    )}
    {winner&&<div className={css.overlay}><div className={css.winnerText}>{winner} {t('miniGames.wins','wins')}!</div>
    <div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.restart','Restart')}</button>
    <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.back','Back')}</button></div></div>}
  </div>)
}
