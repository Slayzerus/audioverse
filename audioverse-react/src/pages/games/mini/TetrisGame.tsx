/**
 * TetrisGame — Tetris/PuyoPuyo-inspired puzzle for 1-4 couch players.
 *
 * Controls (per keyboard group):
 *   Group 0: A/D move, W rotate, S soft drop, Space hard drop
 *   Group 1: ←/→ move, ↑ rotate, ↓ soft drop, Enter hard drop
 *   Group 2: J/L move, I rotate, K soft drop
 * Gamepads: D-pad move/soft-drop, A rotate, Y hard drop.
 *
 * Rules:
 *  - Each player owns a 10×20 grid displayed side by side.
 *  - 7 standard tetriminos (I, O, T, S, Z, J, L) as colored rectangles.
 *  - Completed lines clear and award points.
 *  - VS mode: clearing 2+ lines sends garbage to opponent(s).
 *  - Coop mode: shared score target.
 *  - Speed increases over time.
 *  - Currencies: coins (piece placed), gems (combos), stars (lines cleared).
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PLAYER_COLORS, type GameConfig, PlayerSlot } from './types'
import { useGamepads } from './useGamepads'
import { usePause } from './usePause'
import PauseMenu from './PauseMenu'
import styles from './SharedGame.module.css'
import { useGameFocusLock } from '../../../hooks/useGameFocusLock'

// ─── Constants ───────────────────────────────────────────────
const COLS = 10
const ROWS = 20
const CELL = 24
const BOARD_GAP = 16
const BASE_TICK_MS = 800
const MIN_TICK_MS = 100
const SPEED_UP_EVERY = 10 // lines

// ─── Tetrimino definitions ──────────────────────────────────
type Shape = number[][]
interface Tetrimino { shape: Shape; color: string }

const TETRIMINOS: Tetrimino[] = [
  { shape: [[1,1,1,1]],             color: '#00f0f0' }, // I
  { shape: [[1,1],[1,1]],           color: '#f0f000' }, // O
  { shape: [[0,1,0],[1,1,1]],       color: '#a000f0' }, // T
  { shape: [[0,1,1],[1,1,0]],       color: '#00f000' }, // S
  { shape: [[1,1,0],[0,1,1]],       color: '#f00000' }, // Z
  { shape: [[1,0,0],[1,1,1]],       color: '#0000f0' }, // J
  { shape: [[0,0,1],[1,1,1]],       color: '#f0a000' }, // L
]

function rotateShape(s: Shape): Shape {
  const rows = s.length, cols = s[0].length
  const r: Shape = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      r[x][rows - 1 - y] = s[y][x]
  return r
}

// ─── Keyboard mappings ──────────────────────────────────────
type Action = 'left' | 'right' | 'rotate' | 'softDrop' | 'hardDrop'
const KEY_MAP = new Map<string, { group: number; action: Action }>()
// Group 0 — WASD + Space
;([ ['a',0,'left'],['d',0,'right'],['w',0,'rotate'],['s',0,'softDrop'],[' ',0,'hardDrop'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
// Group 1 — Arrows + Enter
;([ ['ArrowLeft',1,'left'],['ArrowRight',1,'right'],['ArrowUp',1,'rotate'],['ArrowDown',1,'softDrop'],['Enter',1,'hardDrop'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
// Group 2 — IJKL
;([ ['j',2,'left'],['l',2,'right'],['i',2,'rotate'],['k',2,'softDrop'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))

// ─── Per-player board state ─────────────────────────────────
interface Piece { shape: Shape; color: string; x: number; y: number }
interface Board {
  grid: (string | null)[][] // null = empty, string = color
  piece: Piece | null
  alive: boolean
  score: number
  linesCleared: number
  coins: number
  gems: number
  stars: number
  combo: number
  tickMs: number
  playerIndex: number
  name: string
  color: string
  input: PlayerSlot['input']
  pendingGarbage: number
}

function emptyGrid(): (string | null)[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null))
}

function randomPiece(): Piece {
  const t = TETRIMINOS[Math.floor(Math.random() * TETRIMINOS.length)]
  return { shape: t.shape, color: t.color, x: Math.floor((COLS - t.shape[0].length) / 2), y: 0 }
}

function collides(grid: (string | null)[][], piece: Piece): boolean {
  for (let py = 0; py < piece.shape.length; py++)
    for (let px = 0; px < piece.shape[py].length; px++) {
      if (!piece.shape[py][px]) continue
      const gx = piece.x + px, gy = piece.y + py
      if (gx < 0 || gx >= COLS || gy >= ROWS) return true
      if (gy >= 0 && grid[gy][gx]) return true
    }
  return false
}

function lockPiece(board: Board) {
  const p = board.piece!
  for (let py = 0; py < p.shape.length; py++)
    for (let px = 0; px < p.shape[py].length; px++) {
      if (!p.shape[py][px]) continue
      const gy = p.y + py, gx = p.x + px
      if (gy >= 0 && gy < ROWS && gx >= 0 && gx < COLS)
        board.grid[gy][gx] = p.color
    }
}

function clearLines(board: Board): number {
  let cleared = 0
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board.grid[y].every(c => c !== null)) {
      board.grid.splice(y, 1)
      board.grid.unshift(Array(COLS).fill(null))
      cleared++
      y++ // re-check same row
    }
  }
  return cleared
}

function addGarbage(board: Board, lines: number) {
  const hole = Math.floor(Math.random() * COLS)
  for (let i = 0; i < lines; i++) {
    board.grid.shift()
    const row: (string | null)[] = Array(COLS).fill('#888')
    row[hole] = null
    board.grid.push(row)
  }
}

function initBoard(player: PlayerSlot): Board {
  return {
    grid: emptyGrid(),
    piece: randomPiece(),
    alive: true,
    score: 0,
    linesCleared: 0,
    coins: 0,
    gems: 0,
    stars: 0,
    combo: 0,
    tickMs: BASE_TICK_MS,
    playerIndex: player.index,
    name: player.name,
    color: player.color || PLAYER_COLORS[player.index] || '#fff',
    input: player.input,
    pendingGarbage: 0,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function TetrisGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boardsRef = useRef<Board[]>(players.map(p => initBoard(p)))
  const [scores, setScores] = useState<{ idx: number; name: string; score: number; coins: number; gems: number; stars: number; alive: boolean; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  const gameMode = config?.gameMode ?? 'classic'
  const isCoop = gameMode === 'coop'
  const isVs = gameMode === 'battle'

  // ─── Input handler ─────────────────────────────────────────
  const applyAction = useCallback((board: Board, action: Action) => {
    if (!board.alive || !board.piece) return
    const p = board.piece
    if (action === 'left') {
      p.x--; if (collides(board.grid, p)) p.x++
    } else if (action === 'right') {
      p.x++; if (collides(board.grid, p)) p.x--
    } else if (action === 'rotate') {
      const prev = p.shape; p.shape = rotateShape(p.shape)
      if (collides(board.grid, p)) p.shape = prev
    } else if (action === 'softDrop') {
      p.y++; if (collides(board.grid, p)) { p.y--; /* don't lock on soft drop */ }
    } else if (action === 'hardDrop') {
      while (!collides(board.grid, { ...p, y: p.y + 1 })) p.y++
      finishPiece(board)
    }
  }, [])

  // Lock piece, clear lines, send garbage, spawn next
  const finishPiece = useCallback((board: Board) => {
    lockPiece(board)
    board.coins += 1
    const lines = clearLines(board)
    if (lines > 0) {
      board.combo += 1
      board.stars += lines
      board.gems += board.combo
      const pts = [0, 100, 300, 500, 800][Math.min(lines, 4)]
      board.score += pts * board.combo
      board.linesCleared += lines
      // speed up
      if (board.linesCleared % SPEED_UP_EVERY === 0)
        board.tickMs = Math.max(MIN_TICK_MS, board.tickMs - 50)
      // VS garbage
      if (isVs && lines >= 2) {
        const garbage = lines - 1
        boardsRef.current.forEach(b => {
          if (b !== board && b.alive) b.pendingGarbage += garbage
        })
      }
    } else {
      board.combo = 0
    }
    // apply pending garbage
    if (board.pendingGarbage > 0) {
      addGarbage(board, board.pendingGarbage)
      board.pendingGarbage = 0
    }
    // spawn next
    const next = randomPiece()
    if (collides(board.grid, next)) { board.alive = false; board.piece = null }
    else board.piece = next
  }, [isVs])

  // ─── Keyboard input ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const m = KEY_MAP.get(e.key)
      if (!m) return
      for (const b of boardsRef.current)
        if (b.alive && b.input.type === 'keyboard' && b.input.group === m.group)
          applyAction(b, m.action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [applyAction])

  // ─── Gamepad polling ───────────────────────────────────────
  useEffect(() => {
    let raf = 0
    const held = new Map<number, Set<string>>()
    function poll() {
      const cur = padsRef.current
      for (const b of boardsRef.current) {
        if (!b.alive || b.input.type !== 'gamepad') continue
        const pi = (b.input as { type: 'gamepad'; padIndex: number }).padIndex
        const gp = cur.find(p => p.index === pi)
        if (!gp) continue
        if (!held.has(pi)) held.set(pi, new Set())
        const h = held.get(pi)!
        const check = (name: string, pressed: boolean, action: Action) => {
          if (pressed && !h.has(name)) { h.add(name); applyAction(b, action) }
          if (!pressed) h.delete(name)
        }
        check('left', gp.left, 'left')
        check('right', gp.right, 'right')
        check('down', gp.down, 'softDrop')
        check('a', gp.a, 'rotate')
        check('y', gp.y, 'hardDrop')
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [applyAction])

  // ─── Game tick (gravity) ───────────────────────────────────
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    function scheduleTick(board: Board) {
      const id = setTimeout(() => {
        if (pauseRef.current) { scheduleTick(board); return }
        if (!board.alive || !board.piece) { checkEnd(); return }
        board.piece.y++
        if (collides(board.grid, board.piece)) {
          board.piece.y--
          finishPiece(board)
        }
        updateScoreboard()
        checkEnd()
        if (board.alive) scheduleTick(board)
      }, board.tickMs)
      timers.push(id)
    }
    function checkEnd() {
      const boards = boardsRef.current
      const alive = boards.filter(b => b.alive)
      if (boards.length === 1 && alive.length === 0) {
        setGameOver(true)
        setWinner(null)
      } else if (boards.length > 1 && alive.length <= 1) {
        setGameOver(true)
        setWinner(alive.length === 1 ? alive[0].name : null)
      }
    }
    function updateScoreboard() {
      const boards = boardsRef.current
      if (isCoop) {
        const total = boards.reduce((s, b) => s + b.score, 0)
        setScores(boards.map(b => ({ idx: b.playerIndex, name: b.name, score: total, coins: b.coins, gems: b.gems, stars: b.stars, alive: b.alive, color: b.color })))
      } else {
        setScores(boards.map(b => ({ idx: b.playerIndex, name: b.name, score: b.score, coins: b.coins, gems: b.gems, stars: b.stars, alive: b.alive, color: b.color })))
      }
    }
    boardsRef.current.forEach(b => scheduleTick(b))
    return () => timers.forEach(clearTimeout)
  }, [finishPiece, isCoop])

  // ─── Render ────────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const boards = boardsRef.current
      const totalW = boards.length * COLS * CELL + (boards.length - 1) * BOARD_GAP
      canvas.width = totalW
      canvas.height = ROWS * CELL

      ctx.fillStyle = '#111'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      boards.forEach((board, bi) => {
        const ox = bi * (COLS * CELL + BOARD_GAP)

        // grid background
        ctx.fillStyle = '#0a0a0a'
        ctx.fillRect(ox, 0, COLS * CELL, ROWS * CELL)

        // grid lines
        ctx.strokeStyle = '#1a1a1a'
        ctx.lineWidth = 0.5
        for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(ox + x * CELL, 0); ctx.lineTo(ox + x * CELL, ROWS * CELL); ctx.stroke() }
        for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(ox, y * CELL); ctx.lineTo(ox + COLS * CELL, y * CELL); ctx.stroke() }

        // locked cells
        for (let y = 0; y < ROWS; y++)
          for (let x = 0; x < COLS; x++) {
            const c = board.grid[y][x]
            if (c) {
              ctx.fillStyle = c
              ctx.fillRect(ox + x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2)
            }
          }

        // active piece + ghost
        if (board.piece && board.alive) {
          // ghost
          let ghostY = board.piece.y
          while (!collides(board.grid, { ...board.piece, y: ghostY + 1 })) ghostY++
          ctx.globalAlpha = 0.2
          for (let py = 0; py < board.piece.shape.length; py++)
            for (let px = 0; px < board.piece.shape[py].length; px++)
              if (board.piece.shape[py][px]) {
                ctx.fillStyle = board.piece.color
                ctx.fillRect(ox + (board.piece.x + px) * CELL + 1, (ghostY + py) * CELL + 1, CELL - 2, CELL - 2)
              }
          ctx.globalAlpha = 1.0
          // piece
          for (let py = 0; py < board.piece.shape.length; py++)
            for (let px = 0; px < board.piece.shape[py].length; px++)
              if (board.piece.shape[py][px]) {
                ctx.fillStyle = board.piece.color
                ctx.fillRect(ox + (board.piece.x + px) * CELL + 1, (board.piece.y + py) * CELL + 1, CELL - 2, CELL - 2)
              }
        }

        // dead overlay
        if (!board.alive) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)'
          ctx.fillRect(ox, 0, COLS * CELL, ROWS * CELL)
          ctx.fillStyle = '#f00'
          ctx.font = 'bold 20px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText('OUT', ox + COLS * CELL / 2, ROWS * CELL / 2)
        }

        // border
        ctx.strokeStyle = board.color
        ctx.lineWidth = 2
        ctx.strokeRect(ox, 0, COLS * CELL, ROWS * CELL)

        // player label
        ctx.fillStyle = board.color
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(board.name, ox + COLS * CELL / 2, ROWS * CELL + 14)
      })

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    boardsRef.current = players.map(p => initBoard(p))
    setGameOver(false)
    setWinner(null)
    setScores([])
  }, [players])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {scores.map(s => (
          <div key={s.idx} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>{s.score}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Tetris canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

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
            <button className={styles.restartBtn} onClick={handleRestart}>{t('miniGames.playAgain', 'Play Again')}</button>
            <button className={styles.backBtnOverlay} onClick={onBack}>{t('miniGames.backToMenu', 'Back to Menu')}</button>
          </div>
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
