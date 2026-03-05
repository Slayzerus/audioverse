/**
 * ArcheryGame — 1-4 players. Moving targets, press action to shoot. Accuracy scoring. 10 rounds.
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

const W=640,H=480,ROUNDS=10,TARGET_R=40
interface Archer{color:string;name:string;idx:number;input:PlayerSlot['input'];score:number;aimX:number;aimY:number}
interface Target{x:number;y:number;vx:number;vy:number}

interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function ArcheryGame({players,config:_config,onBack}:Props){
  useGameFocusLock();
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const archersRef=useRef<Archer[]>(players.map(p=>({color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,score:0,aimX:W/2,aimY:H/2})))
  const targetRef=useRef<Target>({x:W/2,y:H/3,vx:2,vy:1.5})
  const roundRef=useRef(0)
  const [gameOver,setGameOver]=useState(false)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;score:number}[]>([])
  const [shotResults,setShotResults]=useState<{x:number;y:number;color:string;pts:number}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const cooldownRef=useRef<Map<number,number>>(new Map())

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      const now=performance.now()
      for(const a of archersRef.current){
        if(a.input.type==='keyboard'){const g=(a.input as{type:'keyboard';group:number}).group
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){a.aimX+=m.dir.dx*3;a.aimY+=m.dir.dy*3}}
          for(const[key,ag]of ACTION_KEYS){if(ag===g&&pressed.has(key)){
            const cd=cooldownRef.current.get(a.idx)??0
            if(now-cd>500){cooldownRef.current.set(a.idx,now);shoot(a)}}}
        }else{const gp=padsRef.current.find(g=>g.index===(a.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){const d=gamepadDir(gp);if(d){a.aimX+=d.dx*3;a.aimY+=d.dy*3}
            if(gp.a){const cd=cooldownRef.current.get(a.idx)??0;if(now-cd>500){cooldownRef.current.set(a.idx,now);shoot(a)}}}}
        a.aimX=Math.max(0,Math.min(W,a.aimX));a.aimY=Math.max(0,Math.min(H,a.aimY))}
      raf=requestAnimationFrame(poll)}
    const shoot=(a:Archer)=>{
      const tgt=targetRef.current;const dx=a.aimX-tgt.x,dy=a.aimY-tgt.y,d=Math.sqrt(dx*dx+dy*dy)
      let pts=0;if(d<TARGET_R*0.2)pts=10;else if(d<TARGET_R*0.5)pts=7;else if(d<TARGET_R)pts=4;else if(d<TARGET_R*1.5)pts=1
      a.score+=pts;setShotResults(prev=>[...prev.slice(-10),{x:a.aimX,y:a.aimY,color:a.color,pts}])
      roundRef.current++;setScores(archersRef.current.map(a2=>({idx:a2.idx,name:a2.name,color:a2.color,score:a2.score})))
      if(roundRef.current>=ROUNDS*players.length)setGameOver(true)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[players.length])

  useEffect(()=>{
    let raf=0
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const tgt=targetRef.current;tgt.x+=tgt.vx;tgt.y+=tgt.vy
      if(tgt.x<TARGET_R||tgt.x>W-TARGET_R)tgt.vx*=-1
      if(tgt.y<TARGET_R||tgt.y>H*0.7-TARGET_R)tgt.vy*=-1
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#1a3a1a';ctx.fillRect(0,0,W,H)
      // Target
      const rings=[{r:TARGET_R,c:'#fff'},{r:TARGET_R*0.75,c:'#333'},{r:TARGET_R*0.5,c:'#e74c3c'},{r:TARGET_R*0.2,c:'#f1c40f'}]
      for(const ring of rings){ctx.beginPath();ctx.arc(tgt.x,tgt.y,ring.r,0,Math.PI*2);ctx.fillStyle=ring.c;ctx.fill()}
      // Shot results
      for(const s of shotResults){ctx.beginPath();ctx.arc(s.x,s.y,4,0,Math.PI*2);ctx.fillStyle=s.color;ctx.fill()
        ctx.fillStyle=s.color;ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(`+${s.pts}`,s.x,s.y-8)}
      // Crosshairs
      for(const a of archersRef.current){ctx.strokeStyle=a.color;ctx.lineWidth=2
        ctx.beginPath();ctx.moveTo(a.aimX-10,a.aimY);ctx.lineTo(a.aimX+10,a.aimY);ctx.stroke()
        ctx.beginPath();ctx.moveTo(a.aimX,a.aimY-10);ctx.lineTo(a.aimX,a.aimY+10);ctx.stroke()
        ctx.beginPath();ctx.arc(a.aimX,a.aimY,6,0,Math.PI*2);ctx.stroke()}
      // Round counter
      ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.textAlign='center'
      ctx.fillText(`Shot ${Math.min(roundRef.current,ROUNDS*players.length)} / ${ROUNDS*players.length}`,W/2,H-20)
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[players.length, shotResults])

  const sorted=[...archersRef.current].sort((a,b)=>b.score-a.score)
  const restart=useCallback(()=>{archersRef.current.forEach(a=>{a.score=0;a.aimX=W/2;a.aimY=H/2});roundRef.current=0;setShotResults([]);setGameOver(false);setScores([])},[])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={css.scoreItem}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span><span className={css.scoreValue}>{s.score}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Archery canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2><p className={css.winnerText}>🎯 {sorted[0].name} {t('miniGames.wins','wins')}! ({sorted[0].score} pts)</p><div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
