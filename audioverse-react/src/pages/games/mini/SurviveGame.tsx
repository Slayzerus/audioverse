/**
 * SurviveGame — 2-8 players. Projectiles fly from edges. Dodge to survive. Last alive wins.
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

const W = 640, H = 480, PR = 10, SPEED = 3, PROJ_R = 5, PROJ_SPEED = 3

interface P { x:number;y:number;color:string;idx:number;name:string;alive:boolean;input:PlayerSlot['input'] }
interface Proj { x:number;y:number;vx:number;vy:number }

function spawn(ps:PlayerSlot[]):P[] {
  return ps.map((p,i)=>{const a=(i/ps.length)*Math.PI*2;return{x:W/2+Math.cos(a)*60,y:H/2+Math.sin(a)*40,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,input:p.input}})
}

function spawnProj():Proj {
  const side=Math.floor(Math.random()*4)
  let x=0,y=0,vx=0,vy=0
  if(side===0){x=0;y=Math.random()*H;vx=PROJ_SPEED;vy=(Math.random()-0.5)*2}
  else if(side===1){x=W;y=Math.random()*H;vx=-PROJ_SPEED;vy=(Math.random()-0.5)*2}
  else if(side===2){x=Math.random()*W;y=0;vx=(Math.random()-0.5)*2;vy=PROJ_SPEED}
  else{x=Math.random()*W;y=H;vx=(Math.random()-0.5)*2;vy=-PROJ_SPEED}
  return{x,y,vx,vy}
}

export default function SurviveGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({ps:spawn(players),projs:[] as Proj[],keys:new Set<string>(),frame:0})

  const restart=useCallback(()=>{state.current={ps:spawn(players),projs:[],keys:new Set(),frame:0};setWinner(null)},[players])

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
      const padsSnap=padsRef.current
      // Spawn projectiles increasingly
      const spawnRate=Math.max(5,30-Math.floor(s.frame/120))
      if(s.frame%spawnRate===0) s.projs.push(spawnProj())

      for(const p of s.ps){
        if(!p.alive) continue
        let dx=0,dy=0
        if(p.input.type==='keyboard'){for(const [code,v] of KEY_LOOKUP)if(v.group===p.input.group&&s.keys.has(code)){dx+=v.dir.dx;dy+=v.dir.dy}}
        else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d){dx=d.dx;dy=d.dy}}}
        p.x+=dx*SPEED;p.y+=dy*SPEED
        p.x=Math.max(PR,Math.min(W-PR,p.x));p.y=Math.max(PR,Math.min(H-PR,p.y))
      }
      // Move projectiles
      s.projs=s.projs.filter(proj=>{
        proj.x+=proj.vx;proj.y+=proj.vy
        return proj.x>-20&&proj.x<W+20&&proj.y>-20&&proj.y<H+20
      })
      // Check collisions
      for(const p of s.ps){
        if(!p.alive) continue
        for(const proj of s.projs){
          const dx=p.x-proj.x,dy=p.y-proj.y
          if(dx*dx+dy*dy<(PR+PROJ_R)*(PR+PROJ_R)){p.alive=false;break}
        }
      }
      const alive=s.ps.filter(p=>p.alive)
      if(alive.length<=1&&s.ps.length>1){setWinner(alive[0]?alive[0].name:'Draw');return}
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H)
      // Warning border
      const intensity=Math.min(1,s.frame/1800)
      ctx.strokeStyle=`rgba(231,76,60,${intensity*0.5})`;ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4)
      // Projectiles
      ctx.fillStyle='#e74c3c'
      for(const proj of s.projs){ctx.beginPath();ctx.arc(proj.x,proj.y,PROJ_R,0,Math.PI*2);ctx.fill()}
      // Players
      for(const p of s.ps){
        if(!p.alive) continue
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-PR-3)
      }
      // Wave indicator
      ctx.fillStyle='#aaa';ctx.font='14px monospace';ctx.textAlign='right';ctx.fillText(`Wave ${Math.floor(s.frame/300)+1}`,W-10,20)
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Survive canvas"/>
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
