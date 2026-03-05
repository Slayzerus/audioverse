/**
 * PipesGame — rotational pipe connection puzzle for 1-8 players.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D (move cursor), Space (rotate CW), E (rotate CCW)
 *   Group 1: Arrows (move cursor), Enter (rotate CW), Shift (rotate CCW)
 *   Gamepad: D-pad (move cursor), A (rotate CW), X (rotate CCW)
 *
 * Rules:
 *  - Grid of pipe pieces, source(s) and target(s).
 *  - Rotate pieces to connect source → target before water fills dead ends.
 *  - Water starts flowing after countdown; must complete path in time.
 *  - VS: separate boards, race to connect. Coop: shared board.
 *  - 3 currencies: coins (levels cleared), gems (no-mistake clears), stars (perfect scores).
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
const W = 800
const H = 600
const COUNTDOWN_S = 7
const FLOW_STEP_MS_MAP: Record<string, number> = { slow: 600, normal: 350, fast: 180 }

// ─── Pipe definitions ───────────────────────────────────────
// Connections as bitmask: UP=1, RIGHT=2, DOWN=4, LEFT=8
const UP = 1, RIGHT = 2, DOWN = 4, LEFT = 8
type PipeType = 'empty' | 'straight' | 'corner' | 'tee' | 'cross' | 'source' | 'target'

interface PipePiece {
  type: PipeType
  connections: number // bitmask after rotation
  baseConnections: number
  rotation: number // 0-3
  filled: boolean
  flowProgress: number // 0-1 for animation
}

// Base connection masks (before rotation)
const PIPE_BASES: Record<string, number> = {
  straight: UP | DOWN,       // ─ vertical
  corner: UP | RIGHT,        // └
  tee: UP | RIGHT | DOWN,    // ┬
  cross: UP | RIGHT | DOWN | LEFT, // +
  source: UP | RIGHT | DOWN | LEFT,
  target: UP | RIGHT | DOWN | LEFT,
}

function rotateConnections(base: number, rot: number): number {
  let c = base
  for (let i = 0; i < rot; i++) {
    let n = 0
    if (c & UP) n |= RIGHT
    if (c & RIGHT) n |= DOWN
    if (c & DOWN) n |= LEFT
    if (c & LEFT) n |= UP
    c = n
  }
  return c
}

// ─── Keyboard mappings ──────────────────────────────────────
interface KeyAction { group: number; dir?: { dx: number; dy: number }; action?: 'rotateCW' | 'rotateCCW' }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, dir: { dx: 0, dy: -1 } }], ['s', { group: 0, dir: { dx: 0, dy: 1 } }],
  ['a', { group: 0, dir: { dx: -1, dy: 0 } }], ['d', { group: 0, dir: { dx: 1, dy: 0 } }],
  [' ', { group: 0, action: 'rotateCW' }], ['e', { group: 0, action: 'rotateCCW' }],
  ['ArrowUp', { group: 1, dir: { dx: 0, dy: -1 } }], ['ArrowDown', { group: 1, dir: { dx: 0, dy: 1 } }],
  ['ArrowLeft', { group: 1, dir: { dx: -1, dy: 0 } }], ['ArrowRight', { group: 1, dir: { dx: 1, dy: 0 } }],
  ['Enter', { group: 1, action: 'rotateCW' }], ['Shift', { group: 1, action: 'rotateCCW' }],
])

// ─── Types ──────────────────────────────────────────────────
const OPPOSITE: Record<number, number> = { [UP]: DOWN, [DOWN]: UP, [LEFT]: RIGHT, [RIGHT]: LEFT }

interface BoardState {
  grid: PipePiece[]
  cols: number
  rows: number
  sourceIdx: number
  targetIdx: number
  cursorIdx: number
  rotations: number // total rotations made
  mistakes: number
  level: number
  completed: boolean
  failed: boolean
  flowStarted: boolean
  flowFrontier: number[]
  flowTimer: number
  coins: number
  gems: number
  stars: number
  playerIndex: number
  color: string
  name: string
  input: PlayerSlot['input']
}

interface GameState {
  boards: BoardState[]
  countdown: number
  startTime: number
  elapsed: number
  gameOver: boolean
  winner: number | null
  coop: boolean
  flowSpeed: number
}

// ─── Board generation ───────────────────────────────────────
function generateBoard(cols: number, rows: number): { grid: PipePiece[]; sourceIdx: number; targetIdx: number } {
  const total = cols * rows
  const grid: PipePiece[] = Array.from({ length: total }, () => ({
    type: 'empty', connections: 0, baseConnections: 0, rotation: 0, filled: false, flowProgress: 0,
  }))

  // Place source (left column) and target (right column)
  const sourceIdx = Math.floor(Math.random() * rows) * cols
  const targetIdx = Math.floor(Math.random() * rows) * cols + (cols - 1)
  grid[sourceIdx] = { type: 'source', connections: PIPE_BASES.source, baseConnections: PIPE_BASES.source, rotation: 0, filled: false, flowProgress: 0 }
  grid[targetIdx] = { type: 'target', connections: PIPE_BASES.target, baseConnections: PIPE_BASES.target, rotation: 0, filled: false, flowProgress: 0 }

  // Generate a solvable path using random walk then fill remaining with random pipes
  const visited = new Set<number>([sourceIdx])
  const path = [sourceIdx]
  let cur = sourceIdx

  while (cur !== targetIdx) {
    const cr = Math.floor(cur / cols), cc = cur % cols
    const neighbors: { idx: number; dir: number }[] = []
    if (cr > 0 && !visited.has(cur - cols)) neighbors.push({ idx: cur - cols, dir: UP })
    if (cr < rows - 1 && !visited.has(cur + cols)) neighbors.push({ idx: cur + cols, dir: DOWN })
    if (cc > 0 && !visited.has(cur - 1)) neighbors.push({ idx: cur - 1, dir: LEFT })
    if (cc < cols - 1 && !visited.has(cur + 1)) neighbors.push({ idx: cur + 1, dir: RIGHT })

    // Bias toward target
    const tcol = targetIdx % cols
    neighbors.sort((a, b) => {
      const ac = a.idx % cols, bc = b.idx % cols
      return Math.abs(bc - tcol) - Math.abs(ac - tcol)
    })

    if (neighbors.length === 0) break // dead end, accept partial
    const pick = neighbors[Math.random() < 0.6 ? 0 : Math.floor(Math.random() * neighbors.length)]
    visited.add(pick.idx)
    path.push(pick.idx)
    cur = pick.idx
  }

  // Build connection masks along the path
  for (let i = 0; i < path.length; i++) {
    const idx = path[i]
    if (grid[idx].type === 'source' || grid[idx].type === 'target') continue
    let mask = 0
    if (i > 0) {
      const prev = path[i - 1]
      if (prev === idx - 1) mask |= LEFT
      if (prev === idx + 1) mask |= RIGHT
      if (prev === idx - cols) mask |= UP
      if (prev === idx + cols) mask |= DOWN
    }
    if (i < path.length - 1) {
      const next = path[i + 1]
      if (next === idx - 1) mask |= LEFT
      if (next === idx + 1) mask |= RIGHT
      if (next === idx - cols) mask |= UP
      if (next === idx + cols) mask |= DOWN
    }
    // Determine pipe type and base rotation
    let type: PipeType = 'straight'
    const count = [UP, RIGHT, DOWN, LEFT].filter(d => mask & d).length
    if (count === 4) type = 'cross'
    else if (count === 3) type = 'tee'
    else if (count === 2) {
      const dirs = [UP, RIGHT, DOWN, LEFT].filter(d => mask & d)
      if ((dirs[0] | dirs[1]) === (UP | DOWN) || (dirs[0] | dirs[1]) === (LEFT | RIGHT)) type = 'straight'
      else type = 'corner'
    }
    grid[idx] = { type, connections: mask, baseConnections: mask, rotation: 0, filled: false, flowProgress: 0 }
  }

  // Fill empty cells with random pipe pieces
  const pipeTypes: PipeType[] = ['straight', 'corner', 'tee', 'cross']
  for (let i = 0; i < total; i++) {
    if (grid[i].type !== 'empty') continue
    const pt = pipeTypes[Math.floor(Math.random() * pipeTypes.length)]
    const base = PIPE_BASES[pt]
    grid[i] = { type: pt, connections: base, baseConnections: base, rotation: 0, filled: false, flowProgress: 0 }
  }

  // Randomly rotate all non-source/target pieces
  for (let i = 0; i < total; i++) {
    if (grid[i].type === 'source' || grid[i].type === 'target') continue
    const rot = Math.floor(Math.random() * 4)
    grid[i].rotation = rot
    grid[i].connections = rotateConnections(grid[i].baseConnections, rot)
  }

  return { grid, sourceIdx, targetIdx }
}

function createBoard(player: PlayerSlot, cols: number, rows: number): BoardState {
  const { grid, sourceIdx, targetIdx } = generateBoard(cols, rows)
  return {
    grid, cols, rows, sourceIdx, targetIdx, cursorIdx: 0,
    rotations: 0, mistakes: 0, level: 1,
    completed: false, failed: false,
    flowStarted: false, flowFrontier: [sourceIdx], flowTimer: 0,
    coins: 0, gems: 0, stars: 0,
    playerIndex: player.index,
    color: player.color || PLAYER_COLORS[player.index] || '#fff',
    name: player.name, input: player.input,
  }
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const sizeStr = String(config.gridSize || '8x8')
  const cols = parseInt(sizeStr) || 8
  const rows = cols
  const coop = config.gameMode === 'coop-plumb'
  const boards = coop
    ? [createBoard(players[0], cols, rows)]
    : players.map(p => createBoard(p, cols, rows))
  return {
    boards, countdown: COUNTDOWN_S, startTime: Date.now(), elapsed: 0,
    gameOver: false, winner: null, coop,
    flowSpeed: FLOW_STEP_MS_MAP[config.flowSpeed] || FLOW_STEP_MS_MAP.normal,
  }
}

// ─── Check full connection from source to target ────────────
function isFullyConnected(board: BoardState): boolean {
  const { grid, cols, sourceIdx, targetIdx } = board
  const visited = new Set<number>()
  const queue = [sourceIdx]
  visited.add(sourceIdx)
  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur === targetIdx) return true
    const cr = Math.floor(cur / cols), cc = cur % cols
    const conn = grid[cur].connections
    const adj: { idx: number; dir: number }[] = []
    if (cr > 0) adj.push({ idx: cur - cols, dir: UP })
    if (cr < board.rows - 1) adj.push({ idx: cur + cols, dir: DOWN })
    if (cc > 0) adj.push({ idx: cur - 1, dir: LEFT })
    if (cc < cols - 1) adj.push({ idx: cur + 1, dir: RIGHT })
    for (const { idx, dir } of adj) {
      if (visited.has(idx)) continue
      if (!(conn & dir)) continue
      if (!(grid[idx].connections & OPPOSITE[dir])) continue
      visited.add(idx)
      queue.push(idx)
    }
  }
  return false
}

// ─── Component ──────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function PipesGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState<{ index: number; name: string; color: string; coins: number; gems: number; stars: number; level: number }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Rotate logic ──────────────────────────────────────────
  const rotatePiece = useCallback((board: BoardState, clockwise: boolean) => {
    if (board.completed || board.failed) return
    const piece = board.grid[board.cursorIdx]
    if (piece.type === 'source' || piece.type === 'target') return
    piece.rotation = (piece.rotation + (clockwise ? 1 : 3)) % 4
    piece.connections = rotateConnections(piece.baseConnections, piece.rotation)
    board.rotations++
    // Check completion
    if (isFullyConnected(board)) {
      board.completed = true
      board.coins += 10 + board.level * 5
      if (board.mistakes === 0) board.gems += 5
      board.stars++
    }
  }, [])

  // ── Input handling ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const mapping = KEY_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (const board of st.boards) {
        if (board.completed || board.failed) continue
        const isOwner = st.coop
          ? true
          : board.input.type === 'keyboard' && board.input.group === mapping.group
        if (!isOwner) continue
        if (mapping.dir) {
          const cr = Math.floor(board.cursorIdx / board.cols)
          const cc = board.cursorIdx % board.cols
          const nr = cr + mapping.dir.dy
          const nc = cc + mapping.dir.dx
          if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
            board.cursorIdx = nr * board.cols + nc
          }
        }
        if (mapping.action === 'rotateCW') rotatePiece(board, true)
        if (mapping.action === 'rotateCCW') rotatePiece(board, false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [rotatePiece, pauseRef])

  // ── Main game loop ────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    let lastFlow = Date.now()
    const prevPad: Record<number, { a: boolean; x: boolean; up: boolean; down: boolean; left: boolean; right: boolean }> = {}

    function tick() {
      if (pauseRef.current) { raf = requestAnimationFrame(tick); return }
      const st = stateRef.current
      const now = Date.now()
      st.elapsed = (now - st.startTime) / 1000

      // Countdown
      st.countdown = Math.max(0, COUNTDOWN_S - st.elapsed)

      // Gamepad
      for (const pad of padsRef.current) {
        const prev = prevPad[pad.index] || { a: false, x: false, up: false, down: false, left: false, right: false }
        for (const board of st.boards) {
          if (board.completed || board.failed) continue
          const isOwner = st.coop
            ? true
            : board.input.type === 'gamepad' && board.input.padIndex === pad.index
          if (!isOwner) continue
          const cr = Math.floor(board.cursorIdx / board.cols)
          const cc = board.cursorIdx % board.cols
          if (pad.up && !prev.up && cr > 0) board.cursorIdx -= board.cols
          if (pad.down && !prev.down && cr < board.rows - 1) board.cursorIdx += board.cols
          if (pad.left && !prev.left && cc > 0) board.cursorIdx -= 1
          if (pad.right && !prev.right && cc < board.cols - 1) board.cursorIdx += 1
          if (pad.a && !prev.a) rotatePiece(board, true)
          if (pad.x && !prev.x) rotatePiece(board, false)
        }
        prevPad[pad.index] = { a: pad.a, x: pad.x, up: pad.up, down: pad.down, left: pad.left, right: pad.right }
      }

      // Flow simulation after countdown
      if (st.countdown <= 0 && now - lastFlow >= st.flowSpeed) {
        lastFlow = now
        for (const board of st.boards) {
          if (board.completed || board.failed) continue
          board.flowStarted = true
          const nextFrontier: number[] = []
          for (const idx of board.flowFrontier) {
            board.grid[idx].filled = true
            board.grid[idx].flowProgress = 1
            if (idx === board.targetIdx) { board.completed = true; board.coins += 15; board.stars++; continue }
            const cr = Math.floor(idx / board.cols), cc = idx % board.cols
            const conn = board.grid[idx].connections
            const adj: { idx: number; dir: number }[] = []
            if (cr > 0) adj.push({ idx: idx - board.cols, dir: UP })
            if (cr < board.rows - 1) adj.push({ idx: idx + board.cols, dir: DOWN })
            if (cc > 0) adj.push({ idx: idx - 1, dir: LEFT })
            if (cc < board.cols - 1) adj.push({ idx: idx + 1, dir: RIGHT })
            let expanded = false
            for (const { idx: ni, dir } of adj) {
              if (board.grid[ni].filled) continue
              if (!(conn & dir)) continue
              if (!(board.grid[ni].connections & OPPOSITE[dir])) continue
              nextFrontier.push(ni)
              expanded = true
            }
            if (!expanded && !board.completed && idx !== board.sourceIdx) {
              // Dead end reached
              board.mistakes++
            }
          }
          if (nextFrontier.length === 0 && !board.completed) {
            board.failed = true
          }
          board.flowFrontier = nextFrontier
        }
      }

      // Win/lose check
      if (!st.gameOver) {
        const allDone = st.boards.every(b => b.completed || b.failed)
        if (allDone) {
          st.gameOver = true
          const solved = st.boards.filter(b => b.completed)
          if (solved.length > 0) {
            solved.sort((a, b) => a.rotations - b.rotations)
            st.winner = solved[0].playerIndex
          }
        }
      }

      // HUD
      setHud(st.boards.map(b => ({
        index: b.playerIndex, name: b.name, color: b.color,
        coins: b.coins, gems: b.gems, stars: b.stars, level: b.level,
      })))
      if (st.gameOver && !gameOver) {
        setGameOver(true)
        setWinner(st.winner != null ? st.boards.find(b => b.playerIndex === st.winner)?.name || null : null)
      }

      // ── Draw ──────────────────────────────────────────────
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(tick); return }
      const ctx = canvas.getContext('2d')!
      canvas.width = W; canvas.height = H
      ctx.fillStyle = '#0d1117'; ctx.fillRect(0, 0, W, H)

      const boardCount = st.boards.length
      const maxBoardW = Math.floor((W - 20) / boardCount) - 10
      const startX = (W - boardCount * (maxBoardW + 10) + 10) / 2

      for (let bi = 0; bi < boardCount; bi++) {
        const board = st.boards[bi]
        const { cols, rows, grid } = board
        const tileSize = Math.min(Math.floor(maxBoardW / cols), Math.floor((H - 80) / rows))
        const bx = startX + bi * (maxBoardW + 10)
        const by = 50

        for (let i = 0; i < cols * rows; i++) {
          const piece = grid[i]
          const row = Math.floor(i / cols), col = i % cols
          const tx = bx + col * tileSize, ty = by + row * tileSize

          // Background
          ctx.fillStyle = piece.type === 'source' ? '#1a5c1a' : piece.type === 'target' ? '#5c1a1a' : '#1a1a2e'
          ctx.fillRect(tx, ty, tileSize, tileSize)
          ctx.strokeStyle = '#333'; ctx.lineWidth = 1
          ctx.strokeRect(tx, ty, tileSize, tileSize)

          // Draw pipe connections as lines
          const cx = tx + tileSize / 2, cy = ty + tileSize / 2
          ctx.strokeStyle = piece.filled ? '#3498db' : '#888'
          ctx.lineWidth = piece.filled ? 4 : 2
          ctx.beginPath()
          if (piece.connections & UP) { ctx.moveTo(cx, cy); ctx.lineTo(cx, ty) }
          if (piece.connections & DOWN) { ctx.moveTo(cx, cy); ctx.lineTo(cx, ty + tileSize) }
          if (piece.connections & LEFT) { ctx.moveTo(cx, cy); ctx.lineTo(tx, cy) }
          if (piece.connections & RIGHT) { ctx.moveTo(cx, cy); ctx.lineTo(tx + tileSize, cy) }
          ctx.stroke()

          // Source / target markers
          if (piece.type === 'source') {
            ctx.fillStyle = '#2ecc71'; ctx.fillRect(tx + 4, ty + 4, tileSize - 8, tileSize - 8)
            ctx.fillStyle = '#fff'; ctx.font = `bold ${tileSize / 3}px sans-serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText('S', cx, cy)
          }
          if (piece.type === 'target') {
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(tx + 4, ty + 4, tileSize - 8, tileSize - 8)
            ctx.fillStyle = '#fff'; ctx.font = `bold ${tileSize / 3}px sans-serif`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText('T', cx, cy)
          }
        }

        // Cursor
        const curRow = Math.floor(board.cursorIdx / cols), curCol = board.cursorIdx % cols
        ctx.strokeStyle = board.color; ctx.lineWidth = 3
        ctx.strokeRect(bx + curCol * tileSize, by + curRow * tileSize, tileSize, tileSize)

        // Player label
        ctx.fillStyle = board.color; ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(board.name, bx + (cols * tileSize) / 2, by - 6)

        // Status
        if (board.completed) {
          ctx.fillStyle = 'rgba(46,204,113,0.3)'; ctx.fillRect(bx, by, cols * tileSize, rows * tileSize)
          ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 22px sans-serif'
          ctx.fillText('✓ CONNECTED', bx + (cols * tileSize) / 2, by + (rows * tileSize) / 2)
        }
        if (board.failed) {
          ctx.fillStyle = 'rgba(231,76,60,0.3)'; ctx.fillRect(bx, by, cols * tileSize, rows * tileSize)
          ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 22px sans-serif'
          ctx.fillText('✗ DEAD END', bx + (cols * tileSize) / 2, by + (rows * tileSize) / 2)
        }
      }

      // Countdown / timer
      ctx.fillStyle = '#ccc'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'
      if (st.countdown > 0) {
        ctx.fillStyle = '#f39c12'
        ctx.fillText(`💧 Water in ${Math.ceil(st.countdown)}s...`, 10, 24)
      } else {
        ctx.fillText(`⏱ ${st.elapsed.toFixed(1)}s`, 10, 24)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gameOver, pauseRef, rotatePiece, t])

  // ── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHud([])
  }, [players, config])

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
        {hud.map(s => (
          <div key={s.index} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span title="Level">Lv{s.level}</span>
            <span style={{ color: '#f1c40f' }} title="Coins">🪙{s.coins}</span>
            <span style={{ color: '#e74c3c' }} title="Gems">💎{s.gems}</span>
            <span style={{ color: '#f39c12' }} title="Stars">⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Pipes canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
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
