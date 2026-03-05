/**
 * CollectGame — 2-8 players. Coins spawn, grab before others. 60s timer, most coins wins.
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

const W = 640, H = 480, PR = 10, SPEED = 3.5, COIN_R = 7, MAX_COINS = 8, GAME_TIME = 60
interface P { x:number;y:number;color:string;idx:number;name:string;score:number;input:PlayerSlot['input'] }
interface Coin { x:number;y:number }

function spawn(ps:PlayerSlot[]):P[] {
  return ps.map((p,i)=>{const a=(i/ps.length)*Math.PI*2;return{x:W/2+Math.cos(a)*150,y:H/2+Math.sin(a)*120,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,score:0,input:p.input}})
}

function randCoin():Coin { return {x:40+Math.random()*(W-80),y:40+Math.random()*(H-80)} }

export default function CollectGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({ps:spawn(players),coins:Array.from({length:MAX_COINS},randCoin),keys:new Set<string>(),frame:0,timeLeft:GAME_TIME})

  const restart=useCallback(()=>{state.current={ps:spawn(players),coins:Array.from({length:MAX_COINS},randCoin),keys:new Set(),frame:0,timeLeft:GAME_TIME};setWinner(null)},[players])

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
      if(s.frame%60===0) s.timeLeft--
      if(s.timeLeft<=0){const best=s.ps.reduce((a,b)=>a.score>b.score?a:b);setWinner(best.name);return}
      const padsSnap=padsRef.current
      for(const p of s.ps){
        let dx=0,dy=0
        if(p.input.type==='keyboard'){
          for(const [code,v] of KEY_LOOKUP) if(v.group===p.input.group&&s.keys.has(code)){dx+=v.dir.dx;dy+=v.dir.dy}
        } else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d){dx=d.dx;dy=d.dy}}}
        p.x+=dx*SPEED;p.y+=dy*SPEED
        p.x=Math.max(PR,Math.min(W-PR,p.x));p.y=Math.max(PR,Math.min(H-PR,p.y))
      }
      // Coin collection
      s.coins=s.coins.filter(c=>{
        for(const p of s.ps){const dx=p.x-c.x,dy=p.y-c.y;if(dx*dx+dy*dy<(PR+COIN_R)*(PR+COIN_R)){p.score++;return false}}
        return true
      })
      while(s.coins.length<MAX_COINS) s.coins.push(randCoin())
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#1a2a1a';ctx.fillRect(0,0,W,H)
      // Coins
      ctx.fillStyle='#ffd700'
      for(const c of s.coins){ctx.beginPath();ctx.arc(c.x,c.y,COIN_R,0,Math.PI*2);ctx.fill()}
      // Players
      for(const p of s.ps){
        ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(`${p.name}:${p.score}`,p.x,p.y-PR-4)
      }
      // Timer
      ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.textAlign='center';ctx.fillText(`${s.timeLeft}s`,W/2,30)
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Collect canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {winner&&<div className={css.overlay}><div className={css.winnerText}>{winner} {t('miniGames.wins','wins')}!</div>
    <div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.restart','Restart')}</button>
    <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.back','Back')}</button></div></div>}
  </div>)
}
