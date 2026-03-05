/**
 * TagGame — Tag / "It" for 2-8 players.
 * One player is "it" (red glow). Touch another player → they become "it".
 * The player who was "it" the longest loses. Round = 60 seconds.
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

const W = 640, H = 480
const PLAYER_R = 12, SPEED = 3.5
const ROUND_SEC = 60
const TAG_COOLDOWN_MS = 500

interface Runner {
  x: number; y: number; vx: number; vy: number
  color: string; playerIndex: number; name: string; isIt: boolean; itTime: number
  input: PlayerSlot['input']; lastTagAt: number
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

function spawnRunners(players: PlayerSlot[]): Runner[] {
  return players.map((p, i) => {
    const angle = (i / players.length) * Math.PI * 2
    const cx = W / 2 + Math.cos(angle) * 120
    const cy = H / 2 + Math.sin(angle) * 120
    return { x: cx, y: cy, vx: 0, vy: 0, color: p.color || PLAYER_COLORS[p.index] || '#fff', playerIndex: p.index, name: p.name, isIt: i === 0, itTime: 0, input: p.input, lastTagAt: 0 }
  })
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function TagGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runnersRef = useRef<Runner[]>(spawnRunners(players))
  const startRef = useRef(performance.now())
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC)
  const [gameOver, setGameOver] = useState(false)
  const [loser, setLoser] = useState<string | null>(null)
  const [scores, setScores] = useState<{idx:number;name:string;time:number;color:string;isIt:boolean}[]>([])
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Input
  useEffect(() => {
    const pressed = new Set<string>()
    const onDown = (e: KeyboardEvent) => { pressed.add(e.key) }
    const onUp = (e: KeyboardEvent) => { pressed.delete(e.key) }
    let raf = 0
    const poll = () => {
      for (const r of runnersRef.current) {
        if (r.input.type === 'keyboard') {
          const g = (r.input as {type:'keyboard';group:number}).group
          let vx = 0, vy = 0
          for (const [key, m] of KEY_LOOKUP) { if (m.group === g && pressed.has(key)) { vx += m.dir.dx; vy += m.dir.dy } }
          const mag = Math.sqrt(vx*vx+vy*vy) || 1; r.vx = vx/mag*SPEED; r.vy = vy/mag*SPEED
          if (vx === 0 && vy === 0) { r.vx = 0; r.vy = 0 }
        } else {
          const gp = padsRef.current.find(p => p.index === (r.input as {type:'gamepad';padIndex:number}).padIndex)
          if (gp) {
            const d = gamepadDir(gp)
            if (d) { r.vx = d.dx * SPEED; r.vy = d.dy * SPEED } else { r.vx = 0; r.vy = 0 }
          }
        }
      }
      raf = requestAnimationFrame(poll)
    }
    window.addEventListener('keydown', onDown); window.addEventListener('keyup', onUp)
    raf = requestAnimationFrame(poll)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); cancelAnimationFrame(raf) }
  }, [])

  // Game loop
  useEffect(() => {
    let raf = 0
    const loop = () => {
      if (pauseRef.current) { raf = requestAnimationFrame(loop); return }
      const runners = runnersRef.current
      const now = performance.now()
      const elapsed = (now - startRef.current) / 1000
      const left = Math.max(0, ROUND_SEC - elapsed)
      setTimeLeft(Math.ceil(left))

      // Move
      for (const r of runners) {
        r.x = Math.max(PLAYER_R, Math.min(W - PLAYER_R, r.x + r.vx))
        r.y = Math.max(PLAYER_R, Math.min(H - PLAYER_R, r.y + r.vy))
      }

      // Accumulate "it" time
      for (const r of runners) { if (r.isIt) r.itTime += 1/60 }

      // Tag detection
      const itPlayer = runners.find(r => r.isIt)
      if (itPlayer && now - itPlayer.lastTagAt > TAG_COOLDOWN_MS) {
        for (const r of runners) {
          if (r === itPlayer) continue
          if (dist(itPlayer, r) < PLAYER_R * 2) {
            itPlayer.isIt = false; r.isIt = true; r.lastTagAt = now; break
          }
        }
      }

      setScores(runners.map(r => ({ idx: r.playerIndex, name: r.name, time: r.itTime, color: r.color, isIt: r.isIt })))

      if (left <= 0) {
        setGameOver(true)
        const worst = [...runners].sort((a, b) => b.itTime - a.itTime)[0]
        setLoser(worst.name)
        return
      }

      // Draw
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      ctx.fillStyle = '#0a160a'; ctx.fillRect(0, 0, W, H)
      // Timer
      ctx.fillStyle = '#555'; ctx.font = '20px monospace'; ctx.textAlign = 'center'
      ctx.fillText(`${Math.ceil(left)}s`, W / 2, 28)
      // Runners
      for (const r of runners) {
        ctx.beginPath(); ctx.arc(r.x, r.y, PLAYER_R, 0, Math.PI * 2)
        ctx.fillStyle = r.color; ctx.fill()
        if (r.isIt) {
          ctx.shadowColor = '#e74c3c'; ctx.shadowBlur = 20
          ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3; ctx.stroke()
          ctx.shadowBlur = 0
          // "IT" label
          ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText('IT', r.x, r.y - PLAYER_R - 5)
        }
        // Player number
        ctx.fillStyle = '#000'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${r.playerIndex + 1}`, r.x, r.y + 4)
      }
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, W, H)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    runnersRef.current = spawnRunners(players); startRef.current = performance.now()
    setGameOver(false); setLoser(null); setScores([]); setTimeLeft(ROUND_SEC)
  }, [players])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (gameOver && (e.key===' '||e.key==='Enter')) restart() }
    window.addEventListener('keydown', fn); return () => window.removeEventListener('keydown', fn)
  }, [gameOver, restart])

  return (
    <div className={css.container}>
      <div className={css.scoreboard}>
        <span className={css.roundInfo}>⏱ {timeLeft}s</span>
        {scores.map(s => (
          <div key={s.idx} className={`${css.scoreItem} ${s.isIt ? '' : ''}`}>
            <span className={css.scoreColor} style={{background:s.color}} />
            <span>{s.name}</span>
            <span className={css.scoreValue}>{s.time.toFixed(1)}s</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Tag canvas"/>
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
          {loser && <p className={css.winnerText}>😈 {loser} {t('miniGames.loses','loses')} ({t('miniGames.mostItTime','most time as "It"')})!</p>}
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
