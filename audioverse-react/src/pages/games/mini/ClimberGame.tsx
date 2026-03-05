/**
 * ClimberGame — 2-4 players. Auto-scrolling vertical climb. Jump between platforms. Fall off screen = eliminated.
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

const W = 640, H = 480, PR = 10, GRAVITY = 0.3, JUMP = -7, MOVE_SPEED = 3, SCROLL_SPEED = 0.5
const PLAT_W = 80, PLAT_H = 8

interface P { x:number;y:number;vy:number;color:string;idx:number;name:string;alive:boolean;onGround:boolean;input:PlayerSlot['input'] }
interface Plat { x:number;y:number;w:number }

function makePlatforms():Plat[] {
  const plats:Plat[]=[]
  for(let i=0;i<20;i++){
    plats.push({x:Math.random()*(W-PLAT_W),y:H-60-i*50,w:60+Math.random()*60})
  }
  // Starting floor
  plats.push({x:0,y:H-20,w:W})
  return plats
}

export default function ClimberGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({
    ps:players.map((p,i):P=>({x:W/2+(i-players.length/2)*40,y:H-40,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,onGround:false,input:p.input})),
    platforms:makePlatforms(),keys:new Set<string>(),frame:0,scrollY:0,topPlatY:-900
  })

  const restart=useCallback(()=>{state.current={
    ps:players.map((p,i):P=>({x:W/2+(i-players.length/2)*40,y:H-40,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,onGround:false,input:p.input})),
    platforms:makePlatforms(),keys:new Set(),frame:0,scrollY:0,topPlatY:-900};setWinner(null)},[players])

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
      const scrollAccel=Math.min(2,SCROLL_SPEED+s.frame*0.0005)
      s.scrollY+=scrollAccel
      const padsSnap=padsRef.current

      for(const p of s.ps){
        if(!p.alive) continue
        let dx=0,jump=false
        if(p.input.type==='keyboard'){
          for(const [code,v] of KEY_LOOKUP)if(v.group===p.input.group&&s.keys.has(code))dx+=v.dir.dx
          for(const [code,g] of ACTION_KEYS)if(g===p.input.group&&s.keys.has(code)){jump=true;s.keys.delete(code)}
        } else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d)dx=d.dx;if(gp.a)jump=true}}
        p.x+=dx*MOVE_SPEED
        if(p.x<PR)p.x=PR;if(p.x>W-PR)p.x=W-PR
        if(jump&&p.onGround){p.vy=JUMP;p.onGround=false}
        p.vy+=GRAVITY;p.y+=p.vy
        p.onGround=false
        // Platform collision
        for(const pl of s.platforms){
          const platScreenY=pl.y+s.scrollY
          if(p.vy>=0&&p.y+PR>=platScreenY&&p.y+PR<=platScreenY+PLAT_H+4&&p.x>pl.x-PR&&p.x<pl.x+pl.w+PR){
            p.y=platScreenY-PR;p.vy=0;p.onGround=true
          }
        }
        // Fall off screen
        if(p.y>H+30) p.alive=false
      }
      // Generate new platforms as we scroll
      while(s.topPlatY+s.scrollY>-50){
        s.topPlatY-=40+Math.random()*30
        s.platforms.push({x:Math.random()*(W-PLAT_W),y:s.topPlatY,w:50+Math.random()*70})
      }
      // Remove old platforms
      s.platforms=s.platforms.filter(pl=>pl.y+s.scrollY<H+100)

      const alive=s.ps.filter(p=>p.alive)
      if(alive.length<=1&&s.ps.length>1){setWinner(alive[0]?alive[0].name:'Draw');return}
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#0a1a2a';ctx.fillRect(0,0,W,H)
      // Platforms
      ctx.fillStyle='#4a6';for(const pl of s.platforms){const sy=pl.y+s.scrollY;ctx.fillRect(pl.x,sy,pl.w,PLAT_H)}
      // Danger zone at bottom
      ctx.fillStyle='rgba(231,76,60,0.3)';ctx.fillRect(0,H-30,W,30)
      // Players
      for(const p of s.ps){if(!p.alive)continue;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-PR-3)}
      // Height
      ctx.fillStyle='#aaa';ctx.font='14px monospace';ctx.textAlign='right';ctx.fillText(`${Math.floor(s.scrollY)}m`,W-10,20)
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Climber canvas"/>
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
