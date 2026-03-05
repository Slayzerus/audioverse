/**
 * CaptureGame — 2-8 players. Zones on the map, stand on them to capture. Most zones at 60s wins.
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

const W = 640, H = 480, PR = 10, SPEED = 3, GAME_TIME = 60, ZONE_SIZE = 50

interface P { x:number;y:number;color:string;idx:number;name:string;input:PlayerSlot['input'] }
interface Zone { x:number;y:number;owner:number;progress:number }

function makeZones():Zone[] {
  const zones:Zone[]=[]
  for(let r=0;r<3;r++) for(let c=0;c<4;c++){
    zones.push({x:80+c*150,y:80+r*140,owner:-1,progress:0})
  }
  return zones
}

export default function CaptureGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({ps:players.map((p,i):P=>({x:W/2+((i%2)*2-1)*100,y:H/2+(Math.floor(i/2)%2*2-1)*80,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,input:p.input})),zones:makeZones(),keys:new Set<string>(),frame:0,timeLeft:GAME_TIME})

  const restart=useCallback(()=>{state.current={ps:players.map((p,i):P=>({x:W/2+((i%2)*2-1)*100,y:H/2+(Math.floor(i/2)%2*2-1)*80,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,input:p.input})),zones:makeZones(),keys:new Set(),frame:0,timeLeft:GAME_TIME};setWinner(null)},[players])

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
      if(s.frame%60===0)s.timeLeft--
      if(s.timeLeft<=0){
        const scores=new Map<number,number>()
        s.ps.forEach(p=>scores.set(p.idx,0))
        s.zones.forEach(z=>{if(z.owner>=0)scores.set(z.owner,(scores.get(z.owner)??0)+1)})
        let best=-1,bestScore=-1;for(const [idx,sc] of scores)if(sc>bestScore){bestScore=sc;best=idx}
        const wp=s.ps.find(p=>p.idx===best);setWinner(wp?.name??`P${best+1}`);return
      }
      const padsSnap=padsRef.current
      for(const p of s.ps){
        let dx=0,dy=0
        if(p.input.type==='keyboard'){for(const [code,v] of KEY_LOOKUP)if(v.group===p.input.group&&s.keys.has(code)){dx+=v.dir.dx;dy+=v.dir.dy}}
        else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d){dx=d.dx;dy=d.dy}}}
        p.x+=dx*SPEED;p.y+=dy*SPEED
        p.x=Math.max(PR,Math.min(W-PR,p.x));p.y=Math.max(PR,Math.min(H-PR,p.y))
      }
      // Zone capture logic
      for(const z of s.zones){
        const occupants=s.ps.filter(p=>Math.abs(p.x-z.x)<ZONE_SIZE/2&&Math.abs(p.y-z.y)<ZONE_SIZE/2)
        if(occupants.length===1){
          const occ=occupants[0]
          if(z.owner===occ.idx){z.progress=Math.min(1,z.progress+0.01)}
          else{z.progress-=0.02;if(z.progress<=0){z.owner=occ.idx;z.progress=0.01}}
        }
      }
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,W,H)
      // Zones
      for(const z of s.zones){
        ctx.strokeStyle=z.owner>=0?PLAYER_COLORS[z.owner]:'#555';ctx.lineWidth=3
        ctx.strokeRect(z.x-ZONE_SIZE/2,z.y-ZONE_SIZE/2,ZONE_SIZE,ZONE_SIZE)
        if(z.owner>=0){ctx.globalAlpha=0.3;ctx.fillStyle=PLAYER_COLORS[z.owner];ctx.fillRect(z.x-ZONE_SIZE/2,z.y-ZONE_SIZE/2,ZONE_SIZE,ZONE_SIZE);ctx.globalAlpha=1}
      }
      // Players
      for(const p of s.ps){
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-PR-3)
      }
      ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(`${s.timeLeft}s`,W/2,25)
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Capture canvas"/>
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
