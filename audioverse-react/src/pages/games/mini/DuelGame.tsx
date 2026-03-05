/**
 * DuelGame — 2-8 players. Quick-draw duel: wait for signal, first to press wins a point. Best of 5 rounds.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { ACTION_KEYS } from './inputMaps'
import css from './SharedGame.module.css'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W = 640, H = 480, ROUNDS = 5

interface P { color:string;idx:number;name:string;score:number;input:PlayerSlot['input'];pressed:boolean }

export default function DuelGame({players,config:_config,onBack}:{players:PlayerSlot[];config?:GameConfig;onBack:()=>void}) {
  useGameFocusLock();
  const {t}=useTranslation()
  const canvasRef=useRef<HTMLCanvasElement>(null)
  const [winner,setWinner]=useState<string|null>(null)
  const pads=useGamepads();const padsRef=useRef(pads);padsRef.current=pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: !!winner })
  const state=useRef({
    ps:players.map(p=>({color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,score:0,input:p.input,pressed:false})) as P[],
    phase:'wait' as 'wait'|'ready'|'go'|'result',
    timer:0,delay:120+Math.random()*180,round:1,msg:'',keys:new Set<string>(),tooEarly:new Set<number>()
  })

  const restart=useCallback(()=>{
    state.current={ps:players.map(p=>({color:p.color||PLAYER_COLORS[p.index]||'#fff',idx:p.index,name:p.name,score:0,input:p.input,pressed:false})),
      phase:'wait',timer:0,delay:120+Math.random()*180,round:1,msg:'',keys:new Set(),tooEarly:new Set()}
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

      const checkAction=(p:P):boolean=>{
        if(p.input.type==='keyboard'){for(const [code,g] of ACTION_KEYS)if(g===p.input.group&&s.keys.has(code)){s.keys.delete(code);return true}}
        else if(p.input.type==='gamepad'){const gp=padsSnap[p.input.padIndex];if(gp&&gp.a)return true}
        return false
      }

      if(s.phase==='wait'){
        s.msg='Get ready...'
        if(s.timer>60){s.phase='ready';s.timer=0;s.delay=120+Math.random()*180;s.tooEarly.clear();s.ps.forEach(p=>p.pressed=false)}
      } else if(s.phase==='ready'){
        s.msg='Wait...'
        // Check for early press
        for(const p of s.ps){if(!p.pressed&&checkAction(p)){p.pressed=true;s.tooEarly.add(p.idx)}}
        if(s.timer>s.delay){s.phase='go';s.timer=0}
      } else if(s.phase==='go'){
        s.msg='🔫 DRAW!'
        let firstIdx=-1
        for(const p of s.ps){
          if(!p.pressed&&!s.tooEarly.has(p.idx)&&checkAction(p)){p.pressed=true;if(firstIdx===-1)firstIdx=p.idx}
        }
        if(firstIdx>=0){
          const w=s.ps.find(p=>p.idx===firstIdx)!;w.score++
          s.msg=`${w.name} wins the draw!`
          s.phase='result';s.timer=0
        }
        if(s.timer>180){s.msg='Too slow! No point.';s.phase='result';s.timer=0}
      } else if(s.phase==='result'){
        if(s.timer>90){
          if(s.round>=ROUNDS){
            const best=s.ps.reduce((a,b)=>a.score>b.score?a:b)
            setWinner(best.name);return
          }
          s.round++;s.phase='wait';s.timer=0
        }
      }

      // Draw
      const ctx=canvasRef.current?.getContext('2d');if(!ctx)return
      ctx.fillStyle='#2a1a0a';ctx.fillRect(0,0,W,H)
      // Players as cowboys
      const n=s.ps.length;const gap=W/(n+1)
      for(let i=0;i<n;i++){
        const p=s.ps[i],x=gap*(i+1),y=H*0.6
        ctx.fillStyle=p.color
        ctx.fillRect(x-15,y-40,30,60)
        // Hat
        ctx.fillRect(x-20,y-50,40,12)
        ctx.fillStyle='#fff';ctx.font='14px monospace';ctx.textAlign='center'
        ctx.fillText(p.name,x,y+35)
        ctx.fillText(`${p.score}`,x,y-55)
        if(s.tooEarly.has(p.idx)){ctx.fillStyle='#e74c3c';ctx.fillText('TOO EARLY!',x,y+50)}
      }
      // Message
      ctx.fillStyle=s.phase==='go'?'#e74c3c':'#fff';ctx.font='36px monospace';ctx.textAlign='center'
      ctx.fillText(s.msg,W/2,80)
      ctx.fillStyle='#aaa';ctx.font='16px monospace';ctx.fillText(`Round ${s.round}/${ROUNDS}`,W/2,H-20)
    },1000/60)
    return()=>clearInterval(id)
  },[winner,pads,players])

  return(<div className={css.container}>
    <canvas ref={canvasRef} width={W} height={H} className={css.canvas} role="img" aria-label="Duel canvas"/>
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
