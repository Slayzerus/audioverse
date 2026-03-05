/**
 * JoustGame — 2-8 players. Flap to fly, collide from above to eliminate. Last alive wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, ACTION_KEYS, gamepadDir } from './inputMaps'
import css from './SharedGame.module.css'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W = 640, H = 480, PR = 12, GRAVITY = 0.25, FLAP = -5.5, MAX_VY = 6
interface P { x:number;y:number;vx:number;vy:number;color:string;idx:number;name:string;alive:boolean;input:PlayerSlot['input'] }

function spawn(ps:PlayerSlot[]):P[] {
  return ps.map((p,i)=>{const a=(i/ps.length)*Math.PI*2;return{x:W/2+Math.cos(a)*140,y:H/2+Math.sin(a)*80,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,input:p.input}})
}

export default function JoustGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t} = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [winner,setWinner] = useState<string|null>(null)
  const pads = useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state = useRef({ps:spawn(players),keys:new Set<string>(),frame:0})

  const restart = useCallback(()=>{state.current={ps:spawn(players),keys:new Set(),frame:0};setWinner(null)},[players])

  useEffect(()=>{
    const kd=(e:KeyboardEvent)=>state.current.keys.add(e.code)
    const ku=(e:KeyboardEvent)=>state.current.keys.delete(e.code)
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku)}
  },[])

  // Platforms
  const platforms = useRef([{x:100,y:380,w:120},{x:420,y:380,w:120},{x:220,y:280,w:200},{x:50,y:180,w:100},{x:490,y:180,w:100}])

  useEffect(()=>{
    if(winner) return
    const id = setInterval(()=>{
      if (pauseRef.current) return
      const s = state.current; s.frame++
      const padsSnap = padsRef.current
      for(const p of s.ps){
        if(!p.alive) continue
        let dx=0
        if(p.input.type==='keyboard'){
          for(const [code,v] of KEY_LOOKUP) if(v.group===p.input.group && s.keys.has(code)){dx+=v.dir.dx}
          for(const [code,g] of ACTION_KEYS) if(g===p.input.group && s.keys.has(code)){p.vy=FLAP;s.keys.delete(code)}
        } else if(p.input.type==='gamepad'){
          const gp=padsSnap[p.input.padIndex]; if(gp){const d=gamepadDir(gp);if(d)dx=d.dx;if(gp.a)p.vy=FLAP}
        }
        p.vx=dx*3; p.vy=Math.min(p.vy+GRAVITY,MAX_VY); p.x+=p.vx; p.y+=p.vy
        // Walls
        if(p.x<PR)p.x=PR; if(p.x>W-PR)p.x=W-PR
        // Floor
        if(p.y>H-PR){p.y=H-PR;p.vy=0}
        // Platforms
        for(const pl of platforms.current){
          if(p.vy>=0 && p.y+PR>=pl.y && p.y+PR<=pl.y+10 && p.x>pl.x && p.x<pl.x+pl.w){p.y=pl.y-PR;p.vy=0}
        }
      }
      // Collision - higher player wins
      const alive=s.ps.filter(p=>p.alive)
      for(let i=0;i<alive.length;i++) for(let j=i+1;j<alive.length;j++){
        const a=alive[i],b=alive[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<PR*2){
          if(a.y<b.y-4)b.alive=false
          else if(b.y<a.y-4)a.alive=false
          else{a.vx=-dx/d*5;a.vy=-3;b.vx=dx/d*5;b.vy=-3}
        }
      }
      const rem=s.ps.filter(p=>p.alive)
      if(rem.length<=1 && s.ps.length>1){setWinner(rem[0]?rem[0].name:'Draw');return}
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,W,H)
      // Platforms
      ctx.fillStyle='#555'
      for(const pl of platforms.current) ctx.fillRect(pl.x,pl.y,pl.w,8)
      for(const p of s.ps){
        if(!p.alive) continue
        ctx.fillStyle=p.color; ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        // Wings
        const wing=Math.sin(s.frame*0.3)*4
        ctx.strokeStyle=p.color;ctx.lineWidth=2
        ctx.beginPath();ctx.moveTo(p.x-PR,p.y);ctx.lineTo(p.x-PR-8,p.y-wing);ctx.stroke()
        ctx.beginPath();ctx.moveTo(p.x+PR,p.y);ctx.lineTo(p.x+PR+8,p.y-wing);ctx.stroke()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-PR-4)
      }
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Joust canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {winner&&<div className={css.overlay}><div className={css.winnerText}>{winner} {t('miniGames.wins','wins')}!</div>
    <div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.restart','Restart')}</button>
    <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.back','Back')}</button></div></div>}
  </div>)
}
