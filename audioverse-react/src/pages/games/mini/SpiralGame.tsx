/**
 * SpiralGame — 2-8 players navigate a shrinking arena. Walls close in. Touch wall = eliminated.
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

const W = 640, H = 480, PR = 8, SPEED = 3, SHRINK_RATE = 0.15

interface P { x:number;y:number;color:string;idx:number;name:string;alive:boolean;input:PlayerSlot['input'] }

function spawn(ps:PlayerSlot[]):P[] {
  return ps.map((p,i)=>{const a=(i/ps.length)*Math.PI*2;return{x:W/2+Math.cos(a)*80,y:H/2+Math.sin(a)*60,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,input:p.input}})
}

export default function SpiralGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({ps:spawn(players),keys:new Set<string>(),frame:0,border:0})

  const restart=useCallback(()=>{state.current={ps:spawn(players),keys:new Set(),frame:0,border:0};setWinner(null)},[players])

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
      const s=state.current;s.frame++
      s.border+=SHRINK_RATE
      const padsSnap=padsRef.current
      for(const p of s.ps){
        if(!p.alive)continue
        let dx=0,dy=0
        if(p.input.type==='keyboard'){
          for(const [code,v] of KEY_LOOKUP) if(v.group===p.input.group&&s.keys.has(code)){dx+=v.dir.dx;dy+=v.dir.dy}
        } else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d){dx=d.dx;dy=d.dy}}}
        p.x+=dx*SPEED;p.y+=dy*SPEED
        // Check wall collision
        if(p.x-PR<s.border||p.x+PR>W-s.border||p.y-PR<s.border||p.y+PR>H-s.border) p.alive=false
      }
      // Also add obstacles: rotating bars
      const angle=s.frame*0.01
      const barLen=Math.min(W/2-s.border-20, 120)
      const cx=W/2,cy=H/2
      const bx1=cx+Math.cos(angle)*barLen,by1=cy+Math.sin(angle)*barLen
      const bx2=cx-Math.cos(angle)*barLen,by2=cy-Math.sin(angle)*barLen
      for(const p of s.ps){
        if(!p.alive) continue
        // Point-to-line distance for rotating bar
        const dx=bx2-bx1,dy=by2-by1,len=Math.sqrt(dx*dx+dy*dy)
        if(len>0){
          const t=Math.max(0,Math.min(1,((p.x-bx1)*dx+(p.y-by1)*dy)/(len*len)))
          const px=bx1+t*dx,py=by1+t*dy
          const dist=Math.sqrt((p.x-px)**2+(p.y-py)**2)
          if(dist<PR+3) p.alive=false
        }
      }
      const alive=s.ps.filter(p=>p.alive)
      if(alive.length<=1&&s.ps.length>1){setWinner(alive[0]?alive[0].name:'Draw');return}
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#111';ctx.fillRect(0,0,W,H)
      // Danger zone
      ctx.fillStyle='#e74c3c';ctx.fillRect(0,0,W,s.border);ctx.fillRect(0,H-s.border,W,s.border)
      ctx.fillRect(0,0,s.border,H);ctx.fillRect(W-s.border,0,s.border,H)
      // Rotating bar
      ctx.strokeStyle='#e74c3c';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(bx1,by1);ctx.lineTo(bx2,by2);ctx.stroke()
      // Players
      for(const p of s.ps){
        if(!p.alive) continue
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-PR-3)
      }
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Spiral canvas"/>
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
