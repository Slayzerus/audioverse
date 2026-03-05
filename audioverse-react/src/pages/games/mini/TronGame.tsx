/**
 * TronGame — Light Cycles for 2-8 players.
 * Each player leaves a trail. Hit any trail or wall → death.
 * Last player alive wins.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type Dir, type GameConfig, PlayerSlot, DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT } from './types'
import { useGamepads } from './useGamepads'
import { KEY_LOOKUP, gamepadDir } from './inputMaps'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import css from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

const CELL = 6
const COLS = 100
const ROWS = 80
const TICK_MS = 50

interface Bike {
  x: number; y: number
  dir: Dir; nextDir: Dir
  trail: { x: number; y: number }[]
  alive: boolean
  color: string
  name: string
  playerIndex: number
  input: PlayerSlot['input']
}

function opposite(d: Dir): Dir { return { dx: -d.dx, dy: -d.dy } }
function sameDir(a: Dir, b: Dir) { return a.dx === b.dx && a.dy === b.dy }

function spawnBike(p: PlayerSlot, idx: number): Bike {
  const positions = [
    { x: 15, y: 15, dir: DIR_RIGHT },
    { x: COLS - 16, y: ROWS - 16, dir: DIR_LEFT },
    { x: COLS - 16, y: 15, dir: DIR_DOWN },
    { x: 15, y: ROWS - 16, dir: DIR_UP },
    { x: Math.floor(COLS/2), y: 15, dir: DIR_DOWN },
    { x: Math.floor(COLS/2), y: ROWS - 16, dir: DIR_UP },
    { x: 15, y: Math.floor(ROWS/2), dir: DIR_RIGHT },
    { x: COLS - 16, y: Math.floor(ROWS/2), dir: DIR_LEFT },
  ]
  const pos = positions[idx % positions.length]
  return { x: pos.x, y: pos.y, dir: pos.dir, nextDir: pos.dir, trail: [{ x: pos.x, y: pos.y }], alive: true, color: p.color || PLAYER_COLORS[p.index] || '#fff', name: p.name, playerIndex: p.index, input: p.input }
}

interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function TronGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bikesRef = useRef<Bike[]>(players.map((p, i) => spawnBike(p, i)))
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const m = KEY_LOOKUP.get(e.key); if (!m) return
      for (const b of bikesRef.current) {
        if (!b.alive || b.input.type !== 'keyboard') continue
        if ((b.input as {type:'keyboard';group:number}).group === m.group && !sameDir(m.dir, opposite(b.dir))) b.nextDir = m.dir
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Gamepad
  useEffect(() => {
    let raf = 0
    const poll = () => {
      for (const b of bikesRef.current) {
        if (!b.alive || b.input.type !== 'gamepad') continue
        const gp = padsRef.current.find(p => p.index === (b.input as {type:'gamepad';padIndex:number}).padIndex)
        if (!gp) continue
        const d = gamepadDir(gp)
        if (d && !sameDir(d, opposite(b.dir))) b.nextDir = d
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Occupied lookup
  const occupiedRef = useRef(new Set<string>())
  useEffect(() => {
    const s = new Set<string>()
    for (const b of bikesRef.current) for (const t of b.trail) s.add(`${t.x},${t.y}`)
    occupiedRef.current = s
  }, [])

  // Tick
  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>
    const tick = () => {
      if (pauseRef.current) { tid = setTimeout(tick, TICK_MS); return }
      const bikes = bikesRef.current
      const occ = occupiedRef.current
      for (const b of bikes) {
        if (!b.alive) continue
        b.dir = b.nextDir
        b.x += b.dir.dx; b.y += b.dir.dy
        if (b.x < 0 || b.x >= COLS || b.y < 0 || b.y >= ROWS || occ.has(`${b.x},${b.y}`)) { b.alive = false; continue }
        occ.add(`${b.x},${b.y}`)
        b.trail.push({ x: b.x, y: b.y })
      }
      const alive = bikes.filter(b => b.alive)
      if (alive.length <= 1) {
        setGameOver(true)
        if (alive.length === 1) setWinner(alive[0].name)
        return
      }
      tid = setTimeout(tick, TICK_MS)
    }
    tid = setTimeout(tick, TICK_MS)
    return () => clearTimeout(tid)
  }, [])

  // Draw
  useEffect(() => {
    let raf = 0
    const draw = () => {
      const c = canvasRef.current; if (!c) { raf = requestAnimationFrame(draw); return }
      const ctx = c.getContext('2d'); if (!ctx) { raf = requestAnimationFrame(draw); return }
      c.width = COLS * CELL; c.height = ROWS * CELL
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, c.width, c.height)
      // Grid dots
      ctx.fillStyle = '#151530'
      for (let x = 0; x < COLS; x += 5) for (let y = 0; y < ROWS; y += 5) ctx.fillRect(x*CELL, y*CELL, 1, 1)
      for (const b of bikesRef.current) {
        ctx.fillStyle = b.alive ? b.color : `${b.color}33`
        for (const t of b.trail) ctx.fillRect(t.x*CELL, t.y*CELL, CELL, CELL)
        if (b.alive) {
          ctx.shadowColor = b.color; ctx.shadowBlur = 10
          ctx.fillRect(b.x*CELL, b.y*CELL, CELL, CELL)
          ctx.shadowBlur = 0
        }
      }
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, c.width, c.height)
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  const restart = useCallback(() => {
    occupiedRef.current = new Set<string>()
    bikesRef.current = players.map((p, i) => spawnBike(p, i))
    for (const b of bikesRef.current) occupiedRef.current.add(`${b.x},${b.y}`)
    setGameOver(false); setWinner(null)
  }, [players])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) restart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, restart])

  return (
    <div className={css.container}>
      <canvas ref={canvasRef} className={css.canvas}  role="img" aria-label="Tron canvas"/>
      {isPaused && (
        <PauseMenu
          onResume={resume}
          onBack={onBack}
          players={players}
        />
      )}
      {gameOver && (
        <div className={css.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={css.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          <div className={css.overlayActions}>
            <button className={css.restartBtn} onClick={restart}>{t('miniGames.playAgain', 'Play Again')}</button>
            <button className={css.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu', 'Back to Menu')}</button>
          </div>
          <p className={css.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
