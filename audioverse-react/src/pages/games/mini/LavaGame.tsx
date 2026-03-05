/**
 * LavaGame — Floor is Lava. 2-8 players. Platforms disappear. Last on a platform wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, ACTION_KEYS } from './inputMaps'
import css from './SharedGame.module.css'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W=640,H=480,PR=10,GRAVITY=0.3,JUMP=-7,SPEED=3
const PLAT_W=60,PLAT_H=12
interface Plat{x:number;y:number;alive:boolean;timer:number}
interface Runner{x:number;y:number;vx:number;vy:number;color:string;name:string;idx:number;input:PlayerSlot['input'];alive:boolean;grounded:boolean}

function makePlatforms():Plat[]{
  const ps:Plat[]=[]
  for(let r=0;r<5;r++)for(let c=0;c<6;c++){
    ps.push({x:40+c*(PLAT_W+20),y:100+r*75,alive:true,timer:300+Math.random()*600})}
  return ps
}

function spawnRunners(players:PlayerSlot[]):Runner[]{
  return players.map((p,i)=>({x:80+i*70,y:60,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,alive:true,grounded:false}))
}

interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function LavaGame({players,config:_config,onBack}:Props){
  useGameFocusLock();
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const runnersRef=useRef(spawnRunners(players))
  const platsRef=useRef(makePlatforms())
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;alive:boolean}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const inputRef=useRef<Map<number,{left:boolean;right:boolean;jump:boolean}>>(new Map())

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const r of runnersRef.current){const inp={left:false,right:false,jump:false}
        if(r.input.type==='keyboard'){const g=(r.input as{type:'keyboard';group:number}).group
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){if(m.dir.dx<0)inp.left=true;if(m.dir.dx>0)inp.right=true;if(m.dir.dy<0)inp.jump=true}}
          for(const[key,ag]of ACTION_KEYS){if(ag===g&&pressed.has(key))inp.jump=true}
        }else{const gp=padsRef.current.find(g=>g.index===(r.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){if(gp.left)inp.left=true;if(gp.right)inp.right=true;if(gp.up||gp.a)inp.jump=true}}
        inputRef.current.set(r.idx,inp)}
      raf=requestAnimationFrame(poll)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[])

  useEffect(()=>{
    let raf=0
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const runners=runnersRef.current,plats=platsRef.current
      // Decay platforms
      for(const p of plats){if(p.alive){p.timer--;if(p.timer<=0)p.alive=false}}
      for(const r of runners){if(!r.alive)continue
        const inp=inputRef.current.get(r.idx)
        if(inp){if(inp.left)r.vx=-SPEED;else if(inp.right)r.vx=SPEED;else r.vx*=0.8
          if(inp.jump&&r.grounded){r.vy=JUMP;r.grounded=false}}
        r.vy+=GRAVITY;r.x+=r.vx;r.y+=r.vy;r.grounded=false
        // Platform collision
        for(const p of plats){if(!p.alive)continue
          if(r.vy>=0&&r.x>p.x&&r.x<p.x+PLAT_W&&r.y+PR>=p.y&&r.y+PR<=p.y+PLAT_H+r.vy+2){
            r.y=p.y-PR;r.vy=0;r.grounded=true}}
        r.x=Math.max(PR,Math.min(W-PR,r.x))
        if(r.y>H+20)r.alive=false}
      const alive=runners.filter(r=>r.alive)
      setScores(runners.map(r=>({idx:r.idx,name:r.name,color:r.color,alive:r.alive})))
      if(alive.length<=1){setGameOver(true);setWinner(alive.length===1?alive[0].name:'Nobody');return}
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      // Lava background
      ctx.fillStyle='#1a0500';ctx.fillRect(0,0,W,H)
      ctx.fillStyle=`hsl(${10+Math.sin(Date.now()/300)*10},90%,30%)`;ctx.fillRect(0,H-30,W,30)
      // Lava glow
      const grad=ctx.createLinearGradient(0,H-80,0,H);grad.addColorStop(0,'transparent');grad.addColorStop(1,'rgba(255,80,0,0.3)')
      ctx.fillStyle=grad;ctx.fillRect(0,H-80,W,80)
      // Platforms
      for(const p of plats){if(!p.alive)continue
        const danger=p.timer<120;ctx.fillStyle=danger?`rgba(139,69,19,${0.5+Math.sin(Date.now()/100)*0.3})`:'#8B4513'
        ctx.fillRect(p.x,p.y,PLAT_W,PLAT_H);ctx.strokeStyle='#654321';ctx.lineWidth=1;ctx.strokeRect(p.x,p.y,PLAT_W,PLAT_H)}
      // Runners
      for(const r of runners){if(!r.alive)continue;ctx.beginPath();ctx.arc(r.x,r.y,PR,0,Math.PI*2);ctx.fillStyle=r.color;ctx.fill()
        ctx.fillStyle='#000';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(`${r.idx+1}`,r.x,r.y+3)}
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const restart=useCallback(()=>{runnersRef.current=spawnRunners(players);platsRef.current=makePlatforms();setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={`${css.scoreItem} ${!s.alive?css.dead:''}`}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Lava canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>🌋 {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
