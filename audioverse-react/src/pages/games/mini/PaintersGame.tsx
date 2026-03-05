/**
 * PaintersGame — Territory control for 2-8 players.
 * Move over tiles to paint them your colour. 30-second round. Most tiles wins.
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

const COLS = 40, ROWS = 30, CELL = 16
const W = COLS * CELL, H = ROWS * CELL
const SPEED = 3
const ROUND_SEC = 30

interface Painter {
  x: number; y: number; vx: number; vy: number
  color: string; name: string; playerIndex: number; input: PlayerSlot['input']
}

function spawnPainters(players: PlayerSlot[]): Painter[] {
  const corners = [[1,1],[COLS-2,1],[1,ROWS-2],[COLS-2,ROWS-2],[COLS/2,1],[COLS/2,ROWS-2],[1,ROWS/2],[COLS-2,ROWS/2]]
  return players.map((p, i) => {
    const c = corners[i % corners.length]
    return { x: c[0]*CELL+CELL/2, y: c[1]*CELL+CELL/2, vx: 0, vy: 0, color: p.color || PLAYER_COLORS[p.index] || '#fff', name: p.name, playerIndex: p.index, input: p.input }
  })
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function PaintersGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const paintersRef = useRef<Painter[]>(spawnPainters(players))
  const gridRef = useRef<(number|null)[]>(new Array(COLS * ROWS).fill(null))
  const startRef = useRef(performance.now())
  const [timeLeft, setTimeLeft] = useState(ROUND_SEC)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string|null>(null)
  const [scores, setScores] = useState<{idx:number;name:string;count:number;color:string}[]>([])
  const pads = useGamepads(); const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Input
  useEffect(() => {
    const pressed = new Set<string>()
    const kd = (e: KeyboardEvent) => pressed.add(e.key)
    const ku = (e: KeyboardEvent) => pressed.delete(e.key)
    let raf = 0
    const poll = () => {
      for (const p of paintersRef.current) {
        if (p.input.type === 'keyboard') {
          const g = (p.input as {type:'keyboard';group:number}).group
          let vx = 0, vy = 0
          for (const [key, m] of KEY_LOOKUP) { if (m.group === g && pressed.has(key)) { vx += m.dir.dx; vy += m.dir.dy } }
          const mag = Math.sqrt(vx*vx+vy*vy) || 1; p.vx = vx/mag*SPEED; p.vy = vy/mag*SPEED
          if (vx === 0 && vy === 0) { p.vx = 0; p.vy = 0 }
        } else {
          const gp = padsRef.current.find(g => g.index === (p.input as {type:'gamepad';padIndex:number}).padIndex)
          if (gp) { const d = gamepadDir(gp); if (d) { p.vx = d.dx*SPEED; p.vy = d.dy*SPEED } else { p.vx = 0; p.vy = 0 } }
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
      const painters = paintersRef.current; const grid = gridRef.current
      const elapsed = (performance.now() - startRef.current) / 1000
      const left = Math.max(0, ROUND_SEC - elapsed)
      setTimeLeft(Math.ceil(left))

      // Move + paint
      for (const p of painters) {
        p.x = Math.max(0, Math.min(W, p.x + p.vx))
        p.y = Math.max(0, Math.min(H, p.y + p.vy))
        const col = Math.floor(p.x / CELL), row = Math.floor(p.y / CELL)
        if (col >= 0 && col < COLS && row >= 0 && row < ROWS) {
          grid[row * COLS + col] = p.playerIndex
        }
      }

      // Scores
      const counts = new Map<number, number>()
      for (const v of grid) { if (v !== null) counts.set(v, (counts.get(v) ?? 0) + 1) }
      const sc = painters.map(p => ({ idx: p.playerIndex, name: p.name, count: counts.get(p.playerIndex) ?? 0, color: p.color }))
      sc.sort((a, b) => b.count - a.count)
      setScores(sc)

      if (left <= 0) {
        setGameOver(true); setWinner(sc[0].name); return
      }

      // Draw
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(loop); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(loop); return }
      c.width = W; c.height = H
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H)
      // Grid
      for (let r = 0; r < ROWS; r++) for (let col = 0; col < COLS; col++) {
        const owner = grid[r * COLS + col]
        if (owner !== null) {
          ctx.fillStyle = PLAYER_COLORS[owner] + '88'
          ctx.fillRect(col * CELL, r * CELL, CELL, CELL)
        }
      }
      // Grid lines
      ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5
      for (let x = 0; x <= W; x += CELL) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y <= H; y += CELL) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      // Painters
      for (const p of painters) {
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = p.color; ctx.fill()
        ctx.fillStyle = '#000'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${p.playerIndex + 1}`, p.x, p.y + 3)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    paintersRef.current = spawnPainters(players); gridRef.current = new Array(COLS * ROWS).fill(null)
    startRef.current = performance.now(); setGameOver(false); setWinner(null); setScores([]); setTimeLeft(ROUND_SEC)
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
          <div key={s.idx} className={css.scoreItem}>
            <span className={css.scoreColor} style={{background:s.color}} />
            <span>{s.name}</span>
            <span className={css.scoreValue}>{s.count}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Painters canvas"/>
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
          {winner && <p className={css.winnerText}>🎨 {winner} {t('miniGames.wins','wins')}!</p>}
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
