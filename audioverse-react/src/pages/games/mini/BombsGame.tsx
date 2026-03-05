/**
 * BombsGame — 2-4 players. Place bombs that explode in cross pattern after timer. Don't get caught!
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

const W = 640, H = 480, CELL = 40, COLS = 16, ROWS = 12, PR = 14, SPEED = 2.5, FUSE = 120, BLAST_R = 3, BLAST_DUR = 20

interface P { x:number;y:number;color:string;idx:number;name:string;alive:boolean;input:PlayerSlot['input'] }
interface Bomb { x:number;y:number;timer:number;owner:number }
interface Blast { cx:number;cy:number;timer:number }

function spawn(ps:PlayerSlot[]):P[] {
  const corners=[[1,1],[COLS-2,1],[1,ROWS-2],[COLS-2,ROWS-2],[COLS/2|0,1],[COLS/2|0,ROWS-2],[1,ROWS/2|0],[COLS-2,ROWS/2|0]]
  return ps.map((p,i)=>({x:(corners[i][0]+0.5)*CELL,y:(corners[i][1]+0.5)*CELL,color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,alive:true,input:p.input}))
}

function makeWalls():Set<string> {
  const walls=new Set<string>()
  // Border walls
  for(let c=0;c<COLS;c++){walls.add(`${c},0`);walls.add(`${c},${ROWS-1}`)}
  for(let r=0;r<ROWS;r++){walls.add(`0,${r}`);walls.add(`${COLS-1},${r}`)}
  // Grid walls (every other cell)
  for(let r=2;r<ROWS-1;r+=2) for(let c=2;c<COLS-1;c+=2) walls.add(`${c},${r}`)
  return walls
}

export default function BombsGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({ps:spawn(players),bombs:[] as Bomb[],blasts:[] as Blast[],walls:makeWalls(),keys:new Set<string>(),frame:0})

  const restart=useCallback(()=>{state.current={ps:spawn(players),bombs:[],blasts:[],walls:makeWalls(),keys:new Set(),frame:0};setWinner(null)},[players])

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
      for(const p of s.ps){
        if(!p.alive) continue
        let dx=0,dy=0,action=false
        if(p.input.type==='keyboard'){
          for(const [code,v] of KEY_LOOKUP)if(v.group===p.input.group&&s.keys.has(code)){dx+=v.dir.dx;dy+=v.dir.dy}
          for(const [code,g] of ACTION_KEYS)if(g===p.input.group&&s.keys.has(code)){action=true;s.keys.delete(code)}
        } else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d){dx=d.dx;dy=d.dy};if(gp.a)action=true}}
        const nx=p.x+dx*SPEED,ny=p.y+dy*SPEED
        const col=Math.floor(nx/CELL),row=Math.floor(ny/CELL)
        if(!s.walls.has(`${col},${row}`)){p.x=nx;p.y=ny}
        p.x=Math.max(CELL+PR,Math.min((COLS-1)*CELL-PR,p.x))
        p.y=Math.max(CELL+PR,Math.min((ROWS-1)*CELL-PR,p.y))
        if(action){
          const bc=Math.floor(p.x/CELL),br=Math.floor(p.y/CELL)
          if(!s.bombs.some(b=>b.x===bc&&b.y===br))s.bombs.push({x:bc,y:br,timer:FUSE,owner:p.idx})
        }
      }
      // Update bombs
      s.bombs=s.bombs.filter(b=>{
        b.timer--
        if(b.timer<=0){
          // Explode in cross pattern
          const dirs=[[0,0],[1,0],[-1,0],[0,1],[0,-1]]
          for(const [ddx,ddy] of dirs){
            for(let i=0;i<=BLAST_R;i++){
              const bx=b.x+ddx*i,by=b.y+ddy*i
              if(s.walls.has(`${bx},${by}`))break
              s.blasts.push({cx:bx,cy:by,timer:BLAST_DUR})
            }
          }
          return false
        }
        return true
      })
      // Update blasts
      s.blasts=s.blasts.filter(b=>{b.timer--;return b.timer>0})
      // Check player-blast collisions
      for(const p of s.ps){
        if(!p.alive) continue
        const pc=Math.floor(p.x/CELL),pr=Math.floor(p.y/CELL)
        if(s.blasts.some(b=>b.cx===pc&&b.cy===pr))p.alive=false
      }
      const alive=s.ps.filter(p=>p.alive)
      if(alive.length<=1&&s.ps.length>1){setWinner(alive[0]?alive[0].name:'Draw');return}
      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#1a2a1a';ctx.fillRect(0,0,W,H)
      // Walls
      for(const w of s.walls){const [c,r]=w.split(',').map(Number);ctx.fillStyle='#555';ctx.fillRect(c*CELL,r*CELL,CELL,CELL)}
      // Blasts
      ctx.fillStyle='#ff6600'
      for(const b of s.blasts) ctx.fillRect(b.cx*CELL+2,b.cy*CELL+2,CELL-4,CELL-4)
      // Bombs
      ctx.fillStyle='#333'
      for(const b of s.bombs){ctx.beginPath();ctx.arc((b.x+0.5)*CELL,(b.y+0.5)*CELL,CELL/3,0,Math.PI*2);ctx.fill()
        if(b.timer<40){ctx.fillStyle='#f00';ctx.beginPath();ctx.arc((b.x+0.5)*CELL,(b.y+0.5)*CELL-CELL/3,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#333'}}
      // Players
      for(const p of s.ps){if(!p.alive)continue;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,PR,0,Math.PI*2);ctx.fill()
        ctx.fillStyle='#fff';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(p.name,p.x,p.y-PR-3)}
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Bombs canvas"/>
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
