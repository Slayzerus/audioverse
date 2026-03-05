/**
 * SnakesGame — classic Snake for 1-8 couch players.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D
 *   Group 1: Arrow keys
 *   Group 2: I/J/K/L
 *   Group 3: Numpad 8/4/5(down)/6
 * Gamepads: D-pad or left stick.
 *
 * Rules:
 *  - Each player is a snake that grows when eating food (green dots).
 *  - Hitting a wall, yourself, or another snake → death.
 *  - Last snake alive wins (or highest score if solo).
 *  - Speed increases as snakes grow.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  PLAYER_COLORS,
  DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT,
  type Dir, type GameConfig, type PlayerSlot,
} from './types'
import { useGamepads } from './useGamepads'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import styles from './SnakesGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

// ─── Game Constants ──────────────────────────────────────────
const CELL = 16        // px per cell
const MIN_COLS = 40
const MIN_ROWS = 30
const INITIAL_LENGTH = 4
const BASE_TICK_MS = 120
const MIN_TICK_MS = 50
const FOOD_COUNT = 3
const SPEED_UP_EVERY = 5 // speed up after every N foods eaten globally

// ─── Keyboard mappings per group ─────────────────────────────
const KB_DIR_MAP: Record<string, { group: number; dir: Dir }>[] = [
  // Group 0 — WASD
  { w: { group: 0, dir: DIR_UP }, s: { group: 0, dir: DIR_DOWN }, a: { group: 0, dir: DIR_LEFT }, d: { group: 0, dir: DIR_RIGHT } },
  // Group 1 — Arrows
  { ArrowUp: { group: 1, dir: DIR_UP }, ArrowDown: { group: 1, dir: DIR_DOWN }, ArrowLeft: { group: 1, dir: DIR_LEFT }, ArrowRight: { group: 1, dir: DIR_RIGHT } },
  // Group 2 — IJKL
  { i: { group: 2, dir: DIR_UP }, k: { group: 2, dir: DIR_DOWN }, j: { group: 2, dir: DIR_LEFT }, l: { group: 2, dir: DIR_RIGHT } },
  // Group 3 — Numpad
  { '8': { group: 3, dir: DIR_UP }, '5': { group: 3, dir: DIR_DOWN }, '4': { group: 3, dir: DIR_LEFT }, '6': { group: 3, dir: DIR_RIGHT } },
]

// Flatten for quick lookup
const KEY_LOOKUP = new Map<string, { group: number; dir: Dir }>()
for (const map of KB_DIR_MAP) {
  for (const [key, val] of Object.entries(map)) {
    KEY_LOOKUP.set(key, val)
  }
}

// ─── Types ───────────────────────────────────────────────────
interface Snake {
  segments: { x: number; y: number }[]
  dir: Dir
  nextDir: Dir
  alive: boolean
  score: number
  color: string
  playerIndex: number
  name: string
  input: PlayerSlot['input']
}

interface Food {
  x: number
  y: number
}

interface GameState {
  snakes: Snake[]
  foods: Food[]
  cols: number
  rows: number
  tickMs: number
  totalFoodEaten: number
  gameOver: boolean
  winner: number | null // playerIndex or null for solo
}

// ─── Helpers ─────────────────────────────────────────────────
function opposite(d: Dir): Dir {
  return { dx: -d.dx, dy: -d.dy }
}
function sameDir(a: Dir, b: Dir) {
  return a.dx === b.dx && a.dy === b.dy
}

function randomEmpty(cols: number, rows: number, occupied: Set<string>): { x: number; y: number } {
  let x: number, y: number
  let tries = 0
  do {
    x = Math.floor(Math.random() * cols)
    y = Math.floor(Math.random() * rows)
    tries++
  } while (occupied.has(`${x},${y}`) && tries < 500)
  return { x, y }
}

function occupiedSet(snakes: Snake[], foods: Food[]): Set<string> {
  const s = new Set<string>()
  for (const snake of snakes) {
    for (const seg of snake.segments) s.add(`${seg.x},${seg.y}`)
  }
  for (const f of foods) s.add(`${f.x},${f.y}`)
  return s
}

function spawnSnake(player: PlayerSlot, cols: number, rows: number, idx: number, _total: number): Snake {
  // Distribute starting positions evenly
  const margin = 4
  const positions = [
    { x: margin, y: margin, dir: DIR_RIGHT },
    { x: cols - margin - 1, y: rows - margin - 1, dir: DIR_LEFT },
    { x: cols - margin - 1, y: margin, dir: DIR_DOWN },
    { x: margin, y: rows - margin - 1, dir: DIR_UP },
    { x: Math.floor(cols / 2), y: margin, dir: DIR_DOWN },
    { x: Math.floor(cols / 2), y: rows - margin - 1, dir: DIR_UP },
    { x: margin, y: Math.floor(rows / 2), dir: DIR_RIGHT },
    { x: cols - margin - 1, y: Math.floor(rows / 2), dir: DIR_LEFT },
  ]
  const pos = positions[idx % positions.length]
  const segments: { x: number; y: number }[] = []
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    segments.push({
      x: pos.x - pos.dir.dx * i,
      y: pos.y - pos.dir.dy * i,
    })
  }
  return {
    segments,
    dir: pos.dir,
    nextDir: pos.dir,
    alive: true,
    score: 0,
    color: player.color || PLAYER_COLORS[player.index] || '#fff',
    playerIndex: player.index,
    name: player.name,
    input: player.input,
  }
}

function initState(players: PlayerSlot[]): GameState {
  const cols = MIN_COLS
  const rows = MIN_ROWS
  const snakes = players.map((p, i) => spawnSnake(p, cols, rows, i, players.length))
  const occ = occupiedSet(snakes, [])
  const foods: Food[] = []
  for (let i = 0; i < FOOD_COUNT; i++) {
    foods.push(randomEmpty(cols, rows, occ))
    occ.add(`${foods[i].x},${foods[i].y}`)
  }
  return { snakes, foods, cols, rows, tickMs: BASE_TICK_MS, totalFoodEaten: 0, gameOver: false, winner: null }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function SnakesGame({ players, config: _config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players))
  const [scores, setScores] = useState<{ index: number; name: string; score: number; alive: boolean; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // --- Direction input ---
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mapping = KEY_LOOKUP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (const snake of st.snakes) {
        if (!snake.alive) continue
        if (snake.input.type === 'keyboard' && snake.input.group === mapping.group) {
          if (!sameDir(mapping.dir, opposite(snake.dir))) {
            snake.nextDir = mapping.dir
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // --- Gamepad direction polling ---
  useEffect(() => {
    let raf = 0
    function pollDirs() {
      const st = stateRef.current
      const currentPads = padsRef.current
      for (const snake of st.snakes) {
        if (!snake.alive || snake.input.type !== 'gamepad') continue
        const inp = snake.input as { type: 'gamepad'; padIndex: number }
        const gp = currentPads.find(p => p.index === inp.padIndex)
        if (!gp) continue
        let dir: Dir | null = null
        if (gp.up) dir = DIR_UP
        else if (gp.down) dir = DIR_DOWN
        else if (gp.left) dir = DIR_LEFT
        else if (gp.right) dir = DIR_RIGHT
        if (dir && !sameDir(dir, opposite(snake.dir))) {
          snake.nextDir = dir
        }
      }
      raf = requestAnimationFrame(pollDirs)
    }
    raf = requestAnimationFrame(pollDirs)
    return () => cancelAnimationFrame(raf)
  }, [])

  // --- Game tick ---
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>

    function tick() {
      if (pauseRef.current) { timerId = setTimeout(tick, stateRef.current.tickMs); return }
      const st = stateRef.current
      if (st.gameOver) return

      // Move snakes
      for (const snake of st.snakes) {
        if (!snake.alive) continue
        snake.dir = snake.nextDir
        const head = snake.segments[0]
        const newHead = { x: head.x + snake.dir.dx, y: head.y + snake.dir.dy }

        // Wall collision
        if (newHead.x < 0 || newHead.x >= st.cols || newHead.y < 0 || newHead.y >= st.rows) {
          snake.alive = false
          continue
        }

        // Self collision
        if (snake.segments.some(s => s.x === newHead.x && s.y === newHead.y)) {
          snake.alive = false
          continue
        }

        // Other snake collision (check heads of already-moved snakes + bodies)
        for (const other of st.snakes) {
          if (other === snake || !other.alive) continue
          if (other.segments.some(s => s.x === newHead.x && s.y === newHead.y)) {
            snake.alive = false
            break
          }
        }
        if (!snake.alive) continue

        snake.segments.unshift(newHead)

        // Check food
        const foodIdx = st.foods.findIndex(f => f.x === newHead.x && f.y === newHead.y)
        if (foodIdx !== -1) {
          snake.score++
          st.totalFoodEaten++
          // Replace food
          const occ = occupiedSet(st.snakes, st.foods)
          st.foods[foodIdx] = randomEmpty(st.cols, st.rows, occ)
          // Speed up
          if (st.totalFoodEaten % SPEED_UP_EVERY === 0) {
            st.tickMs = Math.max(MIN_TICK_MS, st.tickMs - 5)
          }
        } else {
          snake.segments.pop()
        }
      }

      // Check game over
      const alive = st.snakes.filter(s => s.alive)
      if (st.snakes.length === 1) {
        // Solo mode — game over when dead
        if (alive.length === 0) {
          st.gameOver = true
          st.winner = null
        }
      } else {
        // Multiplayer — last snake standing wins
        if (alive.length <= 1) {
          st.gameOver = true
          st.winner = alive.length === 1 ? alive[0].playerIndex : null
        }
      }

      // Update scoreboard
      setScores(st.snakes.map(s => ({ index: s.playerIndex, name: s.name, score: s.score, alive: s.alive, color: s.color })))

      if (st.gameOver) {
        setGameOver(true)
        if (st.winner != null) {
          const w = st.snakes.find(s => s.playerIndex === st.winner)
          setWinner(w?.name ?? `Player ${st.winner + 1}`)
        }
        return
      }

      timerId = setTimeout(tick, st.tickMs)
    }

    timerId = setTimeout(tick, stateRef.current.tickMs)
    return () => clearTimeout(timerId)
  }, [])

  // --- Render canvas ---
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      canvas.width = st.cols * CELL
      canvas.height = st.rows * CELL

      // Background
      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid lines (subtle)
      ctx.strokeStyle = '#1a1a1a'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= st.cols; x++) {
        ctx.beginPath()
        ctx.moveTo(x * CELL, 0)
        ctx.lineTo(x * CELL, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y <= st.rows; y++) {
        ctx.beginPath()
        ctx.moveTo(0, y * CELL)
        ctx.lineTo(canvas.width, y * CELL)
        ctx.stroke()
      }

      // Food
      for (const food of st.foods) {
        ctx.fillStyle = '#2ecc71'
        ctx.beginPath()
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 2, 0, Math.PI * 2)
        ctx.fill()
        // glow
        ctx.shadowColor = '#2ecc71'
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0
      }

      // Snakes
      for (const snake of st.snakes) {
        if (!snake.alive) {
          // Draw dead snake faded
          ctx.globalAlpha = 0.2
        }
        for (let i = 0; i < snake.segments.length; i++) {
          const seg = snake.segments[i]
          const isHead = i === 0
          ctx.fillStyle = snake.color
          if (isHead) {
            // Head slightly larger
            ctx.fillRect(seg.x * CELL, seg.y * CELL, CELL, CELL)
            // Eyes
            ctx.fillStyle = '#000'
            const ex = seg.x * CELL + CELL * 0.3
            const ey = seg.y * CELL + CELL * 0.3
            ctx.fillRect(ex, ey, 3, 3)
            ctx.fillRect(ex + CELL * 0.35, ey, 3, 3)
          } else {
            ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
          }
        }
        ctx.globalAlpha = 1
      }

      // Border
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, canvas.width, canvas.height)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // --- Restart ---
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players)
    setGameOver(false)
    setWinner(null)
    setScores([])
  }, [players])

  // Keyboard restart / back
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) {
        handleRestart()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {scores.map(s => (
          <div key={s.index} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>{s.score}</span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Snakes canvas"/>

      {isPaused && (
        <PauseMenu
          onResume={resume}
          onBack={onBack}
          players={players}
        />
      )}
      {/* Game Over overlay */}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && scores.length === 1 && (
            <p className={styles.winnerText}>
              {t('miniGames.finalScore', 'Score')}: {scores[0]?.score ?? 0}
            </p>
          )}
          <div className={styles.overlayActions}>
            <button className={styles.restartBtn} onClick={handleRestart}>
              {t('miniGames.playAgain', 'Play Again')}
            </button>
            <button className={styles.backBtnOverlay} onClick={onBack}>
              {t('miniGames.backToMenu', 'Back to Menu')}
            </button>
          </div>
          <p className={styles.overlayHint}>
            {t('miniGames.pressRestart', 'Press Space or Enter to restart')}
          </p>
        </div>
      )}
    </div>
  )
}
