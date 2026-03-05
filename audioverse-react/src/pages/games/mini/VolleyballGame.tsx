/**
 * VolleyballGame — 2-4 players, side-view volleyball with gravity. Score by landing ball on opponent's side.
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

const W=640,H=400,GRAVITY=0.25,JUMP=-6,PR=14,BALL_R=10,SPEED=3.5,NET_H=120,MAX_SCORE=7
interface Player2{x:number;y:number;vx:number;vy:number;color:string;name:string;idx:number;input:PlayerSlot['input'];score:number;grounded:boolean;team:number}
interface Ball2{x:number;y:number;vx:number;vy:number}

function spawnPlayers(players:PlayerSlot[]):Player2[]{
  return players.map((p,i)=>{const team=i%2;const xBase=team===0?W*0.25:W*0.75
    return{x:xBase+(i<2?0:(i%2===0?-30:30)),y:H-PR-40,vx:0,vy:0,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,input:p.input,score:0,grounded:true,team}})
}

interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function VolleyballGame({players,config:_config,onBack}:Props){
  useGameFocusLock();
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const playersRef=useRef(spawnPlayers(players))
  const ballRef=useRef<Ball2>({x:W*0.25,y:100,vx:2,vy:0})
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;score:number}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const inputRef=useRef<Map<number,{left:boolean;right:boolean;jump:boolean}>>(new Map())

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const p of playersRef.current){const inp={left:false,right:false,jump:false}
        if(p.input.type==='keyboard'){const g=(p.input as{type:'keyboard';group:number}).group
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){if(m.dir.dx<0)inp.left=true;if(m.dir.dx>0)inp.right=true;if(m.dir.dy<0)inp.jump=true}}
          for(const[key,ag]of ACTION_KEYS){if(ag===g&&pressed.has(key))inp.jump=true}
        }else{const gp=padsRef.current.find(g=>g.index===(p.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){if(gp.left)inp.left=true;if(gp.right)inp.right=true;if(gp.up||gp.a)inp.jump=true}}
        inputRef.current.set(p.idx,inp)}
      raf=requestAnimationFrame(poll)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[])

  useEffect(()=>{
    let raf=0
    const groundY=H-40
    const resetBall=(side:number)=>{ballRef.current={x:side===0?W*0.25:W*0.75,y:100,vx:side===0?2:-2,vy:0}}
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const ps=playersRef.current,b=ballRef.current
      for(const p of ps){const inp=inputRef.current.get(p.idx)
        if(inp){if(inp.left)p.vx=-SPEED;else if(inp.right)p.vx=SPEED;else p.vx=0
          if(inp.jump&&p.grounded){p.vy=JUMP;p.grounded=false}}
        p.vy+=GRAVITY;p.x+=p.vx;p.y+=p.vy
        // Keep on own side
        const minX=p.team===0?PR:W/2+6+PR;const maxX=p.team===0?W/2-6-PR:W-PR
        p.x=Math.max(minX,Math.min(maxX,p.x))
        if(p.y>=groundY-PR){p.y=groundY-PR;p.vy=0;p.grounded=true}}
      // Ball physics
      b.vy+=GRAVITY*0.6;b.x+=b.vx;b.y+=b.vy
      if(b.x<BALL_R){b.vx=Math.abs(b.vx);b.x=BALL_R}
      if(b.x>W-BALL_R){b.vx=-Math.abs(b.vx);b.x=W-BALL_R}
      if(b.y<BALL_R){b.vy=Math.abs(b.vy)}
      // Net collision
      if(Math.abs(b.x-W/2)<6+BALL_R&&b.y>groundY-NET_H){b.vx=b.x<W/2?-Math.abs(b.vx):Math.abs(b.vx)}
      // Player-ball collision
      for(const p of ps){const dx=b.x-p.x,dy=b.y-p.y,d=Math.sqrt(dx*dx+dy*dy)
        if(d<PR+BALL_R&&d>0){const nx=dx/d,ny=dy/d;b.vx=nx*4+p.vx*0.3;b.vy=ny*4-2;b.x=p.x+nx*(PR+BALL_R+1);b.y=p.y+ny*(PR+BALL_R+1)}}
      // Ball hits ground
      if(b.y>=groundY-BALL_R){
        if(b.x<W/2){/* Team 0 side — team 1 scores */for(const p of ps)if(p.team===1)p.score++;resetBall(0)}
        else{for(const p of ps)if(p.team===0)p.score++;resetBall(1)}}
      // Unique scores per team
      const t0=ps.filter(p=>p.team===0),t1=ps.filter(p=>p.team===1)
      const s0=t0[0]?.score??0,s1=t1[0]?.score??0
      setScores(ps.map(p=>({idx:p.idx,name:p.name,color:p.color,score:p.score})))
      if(s0>=MAX_SCORE){setGameOver(true);setWinner('Team 1');return}
      if(s1>=MAX_SCORE){setGameOver(true);setWinner('Team 2');return}
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#87CEEB';ctx.fillRect(0,0,W,H)
      ctx.fillStyle='#8B4513';ctx.fillRect(0,groundY,W,H-groundY)
      // Net
      ctx.fillStyle='#333';ctx.fillRect(W/2-3,groundY-NET_H,6,NET_H)
      ctx.strokeStyle='#666';ctx.lineWidth=1;for(let y=groundY-NET_H;y<groundY;y+=10){ctx.beginPath();ctx.moveTo(W/2-3,y);ctx.lineTo(W/2+3,y);ctx.stroke()}
      // Players
      for(const p of ps){ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fillStyle=p.color;ctx.fill()
        ctx.fillStyle='#000';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.fillText(`${p.idx+1}`,p.x,p.y+3)}
      // Ball
      ctx.beginPath();ctx.arc(b.x,b.y,BALL_R,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#ccc';ctx.lineWidth=1;ctx.stroke()
      // Score
      ctx.fillStyle='#000';ctx.font='bold 24px sans-serif';ctx.textAlign='center'
      ctx.fillText(`${s0}`,W*0.25,35);ctx.fillText(`${s1}`,W*0.75,35)
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const restart=useCallback(()=>{playersRef.current=spawnPlayers(players);ballRef.current={x:W*0.25,y:100,vx:2,vy:0};setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={css.scoreItem}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span><span className={css.scoreValue}>{s.score}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Volleyball canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>🏐 {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
