/**
 * FishingGame — 1-4 players. Fish swim past, press action at the right moment to catch. Most fish in 45s wins.
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

const W=640,H=480,ROUND_SEC=45,HOOK_SPEED=3
interface Fisher{x:number;hookY:number;color:string;name:string;idx:number;input:PlayerSlot['input'];score:number;casting:boolean;catchAnim:number}
interface Fish{x:number;y:number;vx:number;size:number;color:string;caught:boolean}

function makeFish():Fish{
  const y=120+Math.random()*(H-160);return{x:Math.random()>0.5?-20:W+20,y,vx:(Math.random()*1.5+0.5)*(Math.random()>0.5?1:-1),size:8+Math.random()*12,color:['#3498db','#e67e22','#2ecc71','#e74c3c','#9b59b6'][Math.floor(Math.random()*5)],caught:false}
}

interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function FishingGame({players,config:_config,onBack}:Props){
  useGameFocusLock();
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const fishersRef=useRef<Fisher[]>(players.map((p,i)=>({x:60+i*(W-120)/(Math.max(players.length-1,1)),hookY:80,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,score:0,casting:false,catchAnim:0})))
  const fishRef=useRef<Fish[]>(Array.from({length:8},makeFish))
  const startRef=useRef(performance.now())
  const [timeLeft,setTimeLeft]=useState(ROUND_SEC)
  const [gameOver,setGameOver]=useState(false)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;score:number}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  useEffect(()=>{
    const pressed=new Set<string>()
    const prevPad=new Map<number,boolean>()
    const kd=(e:KeyboardEvent)=>{pressed.add(e.key)
      for(const[key,g]of ACTION_KEYS){if(e.key===key){const f=fishersRef.current.find(f2=>f2.input.type==='keyboard'&&(f2.input as{type:'keyboard';group:number}).group===g);if(f)f.casting=true}}}
    const ku=(e:KeyboardEvent)=>{pressed.delete(e.key)
      for(const[key,g]of ACTION_KEYS){if(e.key===key){const f=fishersRef.current.find(f2=>f2.input.type==='keyboard'&&(f2.input as{type:'keyboard';group:number}).group===g);if(f)f.casting=false}}}
    let raf=0
    const poll=()=>{
      for(const f of fishersRef.current){
        if(f.input.type==='keyboard'){const g=(f.input as{type:'keyboard';group:number}).group
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){f.x+=m.dir.dx*HOOK_SPEED}}}
        else{const gp=padsRef.current.find(g=>g.index===(f.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){const d=gamepadDir(gp);if(d)f.x+=d.dx*HOOK_SPEED
            const isA=gp.a;const wasA=prevPad.get(f.idx)??false
            if(isA&&!wasA)f.casting=true;if(!isA&&wasA)f.casting=false
            prevPad.set(f.idx,isA)}}
        f.x=Math.max(20,Math.min(W-20,f.x))}
      raf=requestAnimationFrame(poll)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[])

  useEffect(()=>{
    let raf=0
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const elapsed=(performance.now()-startRef.current)/1000;const left=Math.max(0,ROUND_SEC-elapsed)
      setTimeLeft(Math.ceil(left))
      if(left<=0){setGameOver(true);setScores(fishersRef.current.map(f=>({idx:f.idx,name:f.name,color:f.color,score:f.score})));return}
      const fs=fishRef.current
      // Move fish
      for(const f of fs){if(f.caught)continue;f.x+=f.vx;if(f.x<-40||f.x>W+40){Object.assign(f,makeFish())}}
      // Spawn more
      if(fs.filter(f=>!f.caught).length<6)fs.push(makeFish())
      // Hook + catch
      for(const fisher of fishersRef.current){
        if(fisher.catchAnim>0){fisher.catchAnim--;continue}
        if(fisher.casting){fisher.hookY=Math.min(H-40,fisher.hookY+2)
          for(let i=fs.length-1;i>=0;i--){const f=fs[i];if(f.caught)continue
            const dx=fisher.x-f.x,dy=fisher.hookY-f.y
            if(Math.sqrt(dx*dx+dy*dy)<f.size+6){f.caught=true;fisher.score++;fisher.catchAnim=30;fisher.hookY=80;break}}}
        else{fisher.hookY=Math.max(80,fisher.hookY-3)}}
      setScores(fishersRef.current.map(f=>({idx:f.idx,name:f.name,color:f.color,score:f.score})))
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      // Sky
      ctx.fillStyle='#87CEEB';ctx.fillRect(0,0,W,80)
      // Water
      ctx.fillStyle='#1a5276';ctx.fillRect(0,80,W,H-80)
      // Waves
      ctx.strokeStyle='#2980b9';ctx.lineWidth=2;for(let x=0;x<W;x+=30){ctx.beginPath();ctx.arc(x+Math.sin(Date.now()/500+x)*5,82,8,Math.PI,0);ctx.stroke()}
      // Fish
      for(const f of fs){if(f.caught)continue
        ctx.fillStyle=f.color;ctx.beginPath()
        ctx.ellipse(f.x,f.y,f.size,f.size*0.5,0,0,Math.PI*2);ctx.fill()
        ctx.beginPath();const tailDir=f.vx>0?1:-1;ctx.moveTo(f.x-tailDir*f.size,f.y);ctx.lineTo(f.x-tailDir*(f.size+8),f.y-5);ctx.lineTo(f.x-tailDir*(f.size+8),f.y+5);ctx.fill()
        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(f.x+tailDir*f.size*0.4,f.y-f.size*0.15,2,0,Math.PI*2);ctx.fill()}
      // Fishers
      for(const fisher of fishersRef.current){
        ctx.strokeStyle=fisher.color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fisher.x,60);ctx.lineTo(fisher.x,fisher.hookY);ctx.stroke()
        ctx.fillStyle=fisher.color;ctx.fillRect(fisher.x-8,50,16,12)
        ctx.fillStyle='#888';ctx.beginPath();ctx.arc(fisher.x,fisher.hookY,4,0,Math.PI*2);ctx.fill()
        if(fisher.catchAnim>0){ctx.fillStyle='#f1c40f';ctx.font='bold 16px sans-serif';ctx.textAlign='center';ctx.fillText('🎣',fisher.x,45)}}
      // Timer
      ctx.fillStyle='#fff';ctx.font='18px monospace';ctx.textAlign='center';ctx.fillText(`${Math.ceil(left)}s`,W/2,25)
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const sorted=[...fishersRef.current].sort((a,b)=>b.score-a.score)
  const restart=useCallback(()=>{fishersRef.current.forEach((f,i)=>{f.score=0;f.hookY=80;f.casting=false;f.catchAnim=0;f.x=60+i*(W-120)/(Math.max(players.length-1,1))});fishRef.current=Array.from({length:8},makeFish);startRef.current=performance.now();setGameOver(false);setScores([])},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}><span className={css.roundInfo}>⏱ {timeLeft}s</span>{scores.map(s=><div key={s.idx} className={css.scoreItem}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span><span className={css.scoreValue}>🐟{s.score}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Fishing canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2><p className={css.winnerText}>🎣 {sorted[0].name} {t('miniGames.wins','wins')}! ({sorted[0].score} fish)</p><div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
