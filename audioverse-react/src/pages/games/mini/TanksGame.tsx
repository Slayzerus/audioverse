/**
 * TanksGame — 2-8 players. Move + rotate turret, fire bullets that ricochet once off walls.
 * 3 lives each. Last alive wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useMiniGameFocusTrap } from '../../../hooks/useMiniGameFocusTrap'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, ACTION_KEYS } from './inputMaps'
import css from './SharedGame.module.css'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'

const W=640,H=480,TANK_R=12,SPEED=2.5,BULLET_SPD=5,BULLET_BOUNCES=1
interface Tank{x:number;y:number;vx:number;vy:number;angle:number;color:string;name:string;idx:number;lives:number;input:PlayerSlot['input'];lastShot:number;inv:number}
interface Bullet{x:number;y:number;vx:number;vy:number;owner:number;bounces:number;life:number;color:string}

function spawn(players:PlayerSlot[]):Tank[]{
  return players.map((p,i)=>{const a=(i/players.length)*Math.PI*2
    return{x:W/2+Math.cos(a)*150,y:H/2+Math.sin(a)*150,vx:0,vy:0,angle:a+Math.PI,color:p.color||PLAYER_COLORS[p.index]||'#fff',name:p.name,idx:p.index,lives:3,input:p.input,lastShot:0,inv:60}})
}
interface Props{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}

export default function TanksGame({players,config:_config,onBack}:Props){
  const{t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const tanksRef=useRef(spawn(players))
  const bulletsRef=useRef<Bullet[]>([])
  const frameRef=useRef(0)
  const [gameOver,setGameOver]=useState(false)
  const [winner,setWinner]=useState<string|null>(null)
  const [scores,setScores]=useState<{idx:number;name:string;color:string;lives:number}[]>([])
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const inputRef=useRef<Map<number,{left:boolean;right:boolean;up:boolean;down:boolean;action:boolean}>>(new Map())

  // Trap focus within the mini-game while active
  useMiniGameFocusTrap(true, 'tanks-')

  useEffect(()=>{
    const pressed=new Set<string>()
    const kd=(e:KeyboardEvent)=>pressed.add(e.key),ku=(e:KeyboardEvent)=>pressed.delete(e.key)
    let raf=0
    const poll=()=>{
      for(const t2 of tanksRef.current){const inp={left:false,right:false,up:false,down:false,action:false}
        if(t2.input.type==='keyboard'){const g=(t2.input as{type:'keyboard';group:number}).group
          for(const[key,m]of KEY_LOOKUP){if(m.group===g&&pressed.has(key)){if(m.dir.dx<0)inp.left=true;if(m.dir.dx>0)inp.right=true;if(m.dir.dy<0)inp.up=true;if(m.dir.dy>0)inp.down=true}}
          for(const[key,ag]of ACTION_KEYS){if(ag===g&&pressed.has(key))inp.action=true}
        }else{const gp=padsRef.current.find(p=>p.index===(t2.input as{type:'gamepad';padIndex:number}).padIndex)
          if(gp){if(gp.left)inp.left=true;if(gp.right)inp.right=true;if(gp.up)inp.up=true;if(gp.down)inp.down=true;if(gp.a)inp.action=true}}
        inputRef.current.set(t2.idx,inp)}
      raf=requestAnimationFrame(poll)}
    window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);raf=requestAnimationFrame(poll)
    return()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);cancelAnimationFrame(raf)}
  },[])

  useEffect(()=>{
    let raf=0
    const loop=()=>{
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const tanks=tanksRef.current,bullets=bulletsRef.current;const frame=++frameRef.current
      const alive=tanks.filter(t2=>t2.lives>0)
      if(alive.length<=1){setGameOver(true);setWinner(alive.length===1?alive[0].name:'Nobody');setScores(tanks.map(t2=>({idx:t2.idx,name:t2.name,color:t2.color,lives:t2.lives})));return}
      for(const t2 of alive){const inp=inputRef.current.get(t2.idx)
        if(inp){if(inp.left)t2.angle-=0.06;if(inp.right)t2.angle+=0.06
          if(inp.up){t2.vx+=Math.cos(t2.angle)*0.15;t2.vy+=Math.sin(t2.angle)*0.15}
          if(inp.down){t2.vx-=Math.cos(t2.angle)*0.08;t2.vy-=Math.sin(t2.angle)*0.08}
          if(inp.action&&frame-t2.lastShot>20){t2.lastShot=frame;bullets.push({x:t2.x+Math.cos(t2.angle)*16,y:t2.y+Math.sin(t2.angle)*16,vx:Math.cos(t2.angle)*BULLET_SPD,vy:Math.sin(t2.angle)*BULLET_SPD,owner:t2.idx,bounces:0,life:120,color:t2.color})}
        }
        t2.vx*=0.95;t2.vy*=0.95
        const spd=Math.sqrt(t2.vx*t2.vx+t2.vy*t2.vy);if(spd>SPEED){t2.vx=t2.vx/spd*SPEED;t2.vy=t2.vy/spd*SPEED}
        t2.x=Math.max(TANK_R,Math.min(W-TANK_R,t2.x+t2.vx));t2.y=Math.max(TANK_R,Math.min(H-TANK_R,t2.y+t2.vy))
        if(t2.inv>0)t2.inv--}
      // Bullets
      for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.x+=b.vx;b.y+=b.vy;b.life--
        if(b.x<4||b.x>W-4){b.vx*=-1;b.bounces++;b.x=Math.max(4,Math.min(W-4,b.x))}
        if(b.y<4||b.y>H-4){b.vy*=-1;b.bounces++;b.y=Math.max(4,Math.min(H-4,b.y))}
        if(b.bounces>BULLET_BOUNCES||b.life<=0){bullets.splice(i,1);continue}
        for(const t2 of alive){if(t2.inv>0||t2.idx===b.owner)continue
          const dx=t2.x-b.x,dy=t2.y-b.y;if(Math.sqrt(dx*dx+dy*dy)<TANK_R){t2.lives--;t2.inv=60;t2.x=W/2;t2.y=H/2;t2.vx=0;t2.vy=0;bullets.splice(i,1);break}}}
      setScores(tanks.map(t2=>({idx:t2.idx,name:t2.name,color:t2.color,lives:t2.lives})))
      const c=canvasRef.current;if(!c){raf=requestAnimationFrame(loop);return}
      const ctx=c.getContext('2d')!;c.width=W;c.height=H
      ctx.fillStyle='#0a0f0a';ctx.fillRect(0,0,W,H)
      ctx.strokeStyle='#1a2a1a';ctx.lineWidth=1;for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke()}
      for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
      for(const t2 of tanks){if(t2.lives<=0)continue;if(t2.inv>0&&frame%6<3)continue
        ctx.save();ctx.translate(t2.x,t2.y);ctx.rotate(t2.angle)
        ctx.fillStyle=t2.color;ctx.fillRect(-TANK_R,-TANK_R*0.7,TANK_R*2,TANK_R*1.4)
        ctx.fillRect(TANK_R-2,-3,10,6)
        ctx.restore();ctx.fillStyle='#fff';ctx.font='bold 8px sans-serif';ctx.textAlign='center';ctx.fillText(`${t2.idx+1}`,t2.x,t2.y-TANK_R-4)}
      for(const b of bullets){ctx.beginPath();ctx.arc(b.x,b.y,3,0,Math.PI*2);ctx.fillStyle=b.color;ctx.fill()}
      raf=requestAnimationFrame(loop)}
    raf=requestAnimationFrame(loop);return()=>cancelAnimationFrame(raf)
  },[])

  const restart=useCallback(()=>{tanksRef.current=spawn(players);bulletsRef.current=[];frameRef.current=0;setGameOver(false);setWinner(null)},[players])
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(gameOver&&(e.key===' '||e.key==='Enter'))restart()};window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn)},[gameOver,restart])

  return(<div className={css.container}>
    <div className={css.scoreboard}>{scores.map(s=><div key={s.idx} className={`${css.scoreItem} ${s.lives<=0?css.dead:''}`}><span className={css.scoreColor} style={{background:s.color}}/><span>{s.name}</span><span className={css.scoreValue}>{'❤️'.repeat(Math.max(0,s.lives))}</span></div>)}</div>
    <canvas ref={canvasRef} className={css.canvas} role="img" aria-label="Tanks canvas"/>
    {isPaused && (<PauseMenu onResume={resume} onBack={onBack} players={players} />)}
    {gameOver&&<div className={css.overlay}><h2>{t('miniGames.gameOver','Game Over!')}</h2>{winner&&<p className={css.winnerText}>🔫 {winner} {t('miniGames.wins','wins')}!</p>}<div className={css.overlayActions}><button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button><button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button></div><p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p></div>}
  </div>)
}
