/**
 * SumoGame — Push opponents off the circular arena, 2-8 players.
 * Circle shrinks over time. Last player standing wins. Bump into others to push them.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, gamepadDir } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const W = 640, H = 640
const CX = W / 2, CY = H / 2
const INITIAL_R = 260, MIN_R = 80, SHRINK_RATE = 0.15
const PLAYER_R = 14, SPEED = 3.5, PUSH_FORCE = 6, MASS = 1, FRICTION = 0.92

interface Fighter {
  x: number; y: number; vx: number; vy: number
  color: string; name: string; playerIndex: number; alive: boolean; input: PlayerSlot['input']
}

function dist(a: {x:number;y:number}, b: {x:number;y:number}) { return Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2) }

function spawnFighters(players: PlayerSlot[]): Fighter[] {
  return players.map((p, i) => {
    const angle = (i / players.length) * Math.PI * 2
    return { x: CX + Math.cos(angle)*100, y: CY + Math.sin(angle)*100, vx: 0, vy: 0, color: p.color || PLAYER_COLORS[p.index] || '#fff', name: p.name, playerIndex: p.index, alive: true, input: p.input }
  })
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function SumoGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fightersRef = useRef<Fighter[]>(spawnFighters(players))
  const arenaRRef = useRef(INITIAL_R)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [scores, setScores] = useState<{idx:number;name:string;color:string;alive:boolean}[]>([])
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Input
  useEffect(() => {
    const pressed = new Set<string>()
    const kd = (e: KeyboardEvent) => pressed.add(e.key)
    const ku = (e: KeyboardEvent) => pressed.delete(e.key)
    let raf = 0
    const poll = () => {
      for (const f of fightersRef.current) {
        if (!f.alive) continue
        if (f.input.type === 'keyboard') {
          const g = (f.input as {type:'keyboard';group:number}).group
          let ax = 0, ay = 0
          for (const [key, m] of KEY_LOOKUP) { if (m.group === g && pressed.has(key)) { ax += m.dir.dx; ay += m.dir.dy } }
          if (ax || ay) { const mag = Math.sqrt(ax*ax+ay*ay); f.vx += ax/mag*0.5; f.vy += ay/mag*0.5 }
        } else {
          const gp = padsRef.current.find(p => p.index === (f.input as {type:'gamepad';padIndex:number}).padIndex)
          if (gp) { const d = gamepadDir(gp); if (d) { f.vx += d.dx*0.5; f.vy += d.dy*0.5 } }
        }
      }
      raf = requestAnimationFrame(poll)
    }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    raf = requestAnimationFrame(poll)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); cancelAnimationFrame(raf) }
  }, [])

  // Game loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const fighters = fightersRef.current
      const alive = fighters.filter(f => f.alive)

      // Shrink
      if (arenaRRef.current > MIN_R) arenaRRef.current -= SHRINK_RATE / 60

      // Physics
      for (const f of alive) {
        f.vx *= FRICTION; f.vy *= FRICTION
        const speed = Math.sqrt(f.vx*f.vx + f.vy*f.vy)
        if (speed > SPEED) { f.vx = f.vx/speed*SPEED; f.vy = f.vy/speed*SPEED }
        f.x += f.vx; f.y += f.vy
      }

      // Push collisions
      for (let i = 0; i < alive.length; i++) {
        for (let j = i + 1; j < alive.length; j++) {
          const a = alive[i], b = alive[j]
          const d = dist(a, b)
          if (d < PLAYER_R * 2) {
            const nx = (b.x - a.x) / (d || 1), ny = (b.y - a.y) / (d || 1)
            const overlap = PLAYER_R * 2 - d
            a.x -= nx * overlap / 2; a.y -= ny * overlap / 2
            b.x += nx * overlap / 2; b.y += ny * overlap / 2
            // Elastic-ish push
            const relVx = a.vx - b.vx, relVy = a.vy - b.vy
            const dot = relVx * nx + relVy * ny
            if (dot > 0) {
              a.vx -= dot * nx * PUSH_FORCE / MASS; a.vy -= dot * ny * PUSH_FORCE / MASS
              b.vx += dot * nx * PUSH_FORCE / MASS; b.vy += dot * ny * PUSH_FORCE / MASS
            }
          }
        }
      }

      // Out of arena
      for (const f of alive) {
        const d = dist(f, { x: CX, y: CY })
        if (d > arenaRRef.current) f.alive = false
      }

      const remaining = fighters.filter(f => f.alive)
      setScores(fighters.map(f => ({ idx: f.playerIndex, name: f.name, color: f.color, alive: f.alive })))

      if (remaining.length <= 1) {
        setGameOver(true)
        setWinner(remaining.length === 1 ? remaining[0].name : 'Nobody')
        return
      }

      // Draw
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      ctx.fillStyle = '#0a0a0a'; ctx.fillRect(0, 0, W, H)

      // Arena
      const ar = arenaRRef.current
      ctx.beginPath(); ctx.arc(CX, CY, ar, 0, Math.PI * 2)
      ctx.fillStyle = '#1a1a2e'; ctx.fill()
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.stroke()

      // Danger zone pulsing
      if (ar < INITIAL_R * 0.5) {
        ctx.beginPath(); ctx.arc(CX, CY, ar, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(231,76,60,${0.3 + Math.sin(Date.now()/200)*0.2})`; ctx.lineWidth = 6; ctx.stroke()
      }

      // Fighters
      for (const f of fighters) {
        if (!f.alive) continue
        ctx.beginPath(); ctx.arc(f.x, f.y, PLAYER_R, 0, Math.PI * 2)
        ctx.fillStyle = f.color; ctx.fill()
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${f.playerIndex + 1}`, f.x, f.y + 4)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    fightersRef.current = spawnFighters(players); arenaRRef.current = INITIAL_R
    setGameOver(false); setWinner(null); setScores([])
  }, [players])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (gameOver && (e.key===' '||e.key==='Enter')) restart() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [gameOver, restart])

  return (
    <div className={css.container}>
      <div className={css.scoreboard}>
        {scores.map(s => (
          <div key={s.idx} className={`${css.scoreItem} ${!s.alive?css.dead:''}`}>
            <span className={css.scoreColor} style={{background:s.color}} />
            <span>{s.name}</span>
            <span className={css.scoreValue}>{s.alive?'✓':'✗'}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Sumo canvas"/>
      {isPaused && (
        <PauseMenu
          onResume={resume}
          onBack={onBack}
          players={players}
        />
      )}
      {gameOver && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver','Game Over!')}</h2>
          {winner && <p className={css.winnerText}>🏋️ {winner} {t('miniGames.wins','wins')}!</p>}
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain','Play Again')}</button>
            <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu','Back to Menu')}</button>
          </div>
          <p className={css.overlayHint}>{t('miniGames.pressRestart','Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
