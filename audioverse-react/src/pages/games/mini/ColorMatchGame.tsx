/**
 * ColorMatchGame — 2-8 players. Color word appears. Press direction matching the actual color (not the word).
 * Directions mapped to colors. Fastest correct answer scores. 10 rounds.
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

const W = 640, H = 480, ROUNDS = 10
const COLORS = [
  { name: 'RED', hex: '#e74c3c', dir: 'up' },
  { name: 'BLUE', hex: '#3498db', dir: 'down' },
  { name: 'GREEN', hex: '#2ecc71', dir: 'left' },
  { name: 'YELLOW', hex: '#f1c40f', dir: 'right' },
]

interface P { color:string;idx:number;name:string;score:number;input:PlayerSlot['input'];answered:boolean }
interface Round { word:string;displayColor:string;correctDir:string }

function makeRound():Round {
  const wordIdx=Math.floor(Math.random()*COLORS.length)
  let colorIdx=Math.floor(Math.random()*COLORS.length)
  // Ensure mismatch at least sometimes
  if(Math.random()>0.3) while(colorIdx===wordIdx) colorIdx=Math.floor(Math.random()*COLORS.length)
  return { word:COLORS[wordIdx].name, displayColor:COLORS[colorIdx].hex, correctDir:COLORS[colorIdx].dir }
}

function dirFromInput(dx:number,dy:number):string|null {
  if(dy<0) return 'up'; if(dy>0) return 'down'; if(dx<0) return 'left'; if(dx>0) return 'right'
  return null
}

export default function ColorMatchGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({
    ps:players.map(p=>({color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,score:0,input:p.input,answered:false})) as P[],
    round:makeRound(),roundNum:1,phase:'show' as 'show'|'result',timer:0,msg:'',keys:new Set<string>(),prevDirs:new Map<number,string|null>()
  })

  const restart=useCallback(()=>{
    state.current={ps:players.map(p=>({color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,score:0,input:p.input,answered:false})),
      round:makeRound(),roundNum:1,phase:'show',timer:0,msg:'',keys:new Set(),prevDirs:new Map()}
    setWinner(null)
  },[players])

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
      const s=state.current;s.timer++
      const padsSnap=padsRef.current

      if(s.phase==='show'){
        // Check player input
        for(const p of s.ps){
          if(p.answered) continue
          let dir:string|null=null
          if(p.input.type==='keyboard'){
            for(const [code,v] of KEY_LOOKUP) if(v.group===p.input.group&&s.keys.has(code)){
              dir=dirFromInput(v.dir.dx,v.dir.dy)
            }
          } else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp){const d=gamepadDir(gp);if(d)dir=dirFromInput(d.dx,d.dy)}}
          // Only register on "fresh" press
          const prev=s.prevDirs.get(p.idx)
          if(dir&&dir!==prev){
            p.answered=true
            if(dir===s.round.correctDir){p.score++;s.msg=`${p.name} correct!`}
            else s.msg=`${p.name} wrong!`
          }
          s.prevDirs.set(p.idx,dir)
        }
        // All answered or timeout
        if(s.ps.every(p=>p.answered)||s.timer>180){s.phase='result';s.timer=0}
      } else {
        if(s.timer>60){
          if(s.roundNum>=ROUNDS){const best=s.ps.reduce((a,b)=>a.score>b.score?a:b);setWinner(best.name);return}
          s.roundNum++;s.round=makeRound();s.phase='show';s.timer=0;s.msg='';s.ps.forEach(p=>p.answered=false);s.prevDirs.clear()
        }
      }

      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,W,H)
      // Instructions
      ctx.fillStyle='#aaa';ctx.font='14px sans-serif';ctx.textAlign='center'
      ctx.fillText('⬆ RED   ⬇ BLUE   ⬅ GREEN   ➡ YELLOW',W/2,30)
      // Word in wrong color
      ctx.fillStyle=s.round.displayColor;ctx.font='bold 72px sans-serif';ctx.textAlign='center'
      ctx.fillText(s.round.word,W/2,H/2-20)
      // Message
      ctx.fillStyle='#fff';ctx.font='24px sans-serif';ctx.fillText(s.msg,W/2,H/2+40)
      // Scores
      const n=s.ps.length;const gap=W/(n+1)
      for(let i=0;i<n;i++){
        const p=s.ps[i]
        ctx.fillStyle=p.color;ctx.font='16px monospace';ctx.textAlign='center'
        ctx.fillText(`${p.name}: ${p.score}`,gap*(i+1),H-30)
        if(p.answered){ctx.fillStyle='#2ecc71';ctx.fillText('✓',gap*(i+1),H-50)}
      }
      ctx.fillStyle='#aaa';ctx.font='14px monospace';ctx.fillText(`Round ${s.roundNum}/${ROUNDS}`,W/2,H-10)
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Color Match canvas"/>
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
