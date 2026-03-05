/**
 * PuzzleGame — sliding puzzle with real-time competitive twist for 1-8 players.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D (move cursor), Space (slide tile)
 *   Group 1: Arrows (move cursor), Enter (slide tile)
 *   Group 2: I/J/K/L (move cursor), U (slide tile)
 *   Gamepad: D-pad (move cursor), A (slide tile)
 *
 * Rules:
 *  - Each player has their own board (VS) or shares one (Coop).
 *  - Slide numbered tiles into the empty slot to sort them in order.
 *  - Fastest solver with fewest moves wins.
 *  - Power-ups: freeze, shuffle opponent, peek (ghost solution).
 *  - Combo: consecutive slides without pause = bonus points.
 *  - 3 currencies: coins (puzzles solved), gems (perfect/min-move solves), stars (speed records).
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
const SHUFFLE_MOVES = 200
const COMBO_WINDOW_MS = 1200
const FREEZE_DURATION_MS = 2000
const PEEK_DURATION_MS = 1500
const POWERUP_CHANCE = 0.12

type PowerUpKind = 'freeze' | 'shuffle' | 'peek'

// ─── Keyboard mappings ──────────────────────────────────────
interface KeyAction { group: number; dir?: { dx: number; dy: number }; action?: 'slide' }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, dir: { dx: 0, dy: -1 } }], ['s', { group: 0, dir: { dx: 0, dy: 1 } }],
  ['a', { group: 0, dir: { dx: -1, dy: 0 } }], ['d', { group: 0, dir: { dx: 1, dy: 0 } }],
  [' ', { group: 0, action: 'slide' }],
  ['ArrowUp', { group: 1, dir: { dx: 0, dy: -1 } }], ['ArrowDown', { group: 1, dir: { dx: 0, dy: 1 } }],
  ['ArrowLeft', { group: 1, dir: { dx: -1, dy: 0 } }], ['ArrowRight', { group: 1, dir: { dx: 1, dy: 0 } }],
  ['Enter', { group: 1, action: 'slide' }],
  ['i', { group: 2, dir: { dx: 0, dy: -1 } }], ['k', { group: 2, dir: { dx: 0, dy: 1 } }],
  ['j', { group: 2, dir: { dx: -1, dy: 0 } }], ['l', { group: 2, dir: { dx: 1, dy: 0 } }],
  ['u', { group: 2, action: 'slide' }],
])

// ─── Types ───────────────────────────────────────────────────
interface BoardState {
  grid: number[] // tile values (0 = empty)
  size: number
  emptyIdx: number
  cursorIdx: number
  moves: number
  solved: boolean
  frozen: boolean
  frozenUntil: number
  peeking: boolean
  peekUntil: number
  combo: number
  lastSlideTime: number
  coins: number
  gems: number
  stars: number
  playerIndex: number
  color: string
  name: string
  input: PlayerSlot['input']
}

interface PowerUp {
  boardIdx: number
  tileIdx: number
  kind: PowerUpKind
  spawned: number
}

interface GameState {
  boards: BoardState[]
  powerUps: PowerUp[]
  startTime: number
  elapsed: number
  gameOver: boolean
  winner: number | null
  coop: boolean
}

// ─── Helpers ─────────────────────────────────────────────────
function solvedGrid(size: number): number[] {
  const arr: number[] = []
  for (let i = 1; i < size * size; i++) arr.push(i)
  arr.push(0)
  return arr
}

function isSolved(grid: number[], size: number): boolean {
  const target = solvedGrid(size)
  return grid.every((v, i) => v === target[i])
}

function shuffleGrid(size: number): { grid: number[]; emptyIdx: number } {
  const grid = solvedGrid(size)
  let emptyIdx = size * size - 1
  for (let m = 0; m < SHUFFLE_MOVES; m++) {
    const row = Math.floor(emptyIdx / size)
    const col = emptyIdx % size
    const neighbors: number[] = []
    if (row > 0) neighbors.push(emptyIdx - size)
    if (row < size - 1) neighbors.push(emptyIdx + size)
    if (col > 0) neighbors.push(emptyIdx - 1)
    if (col < size - 1) neighbors.push(emptyIdx + 1)
    const pick = neighbors[Math.floor(Math.random() * neighbors.length)]
    grid[emptyIdx] = grid[pick]
    grid[pick] = 0
    emptyIdx = pick
  }
  return { grid, emptyIdx }
}

function createBoard(player: PlayerSlot, size: number): BoardState {
  const { grid, emptyIdx } = shuffleGrid(size)
  return {
    grid, size, emptyIdx, cursorIdx: 0,
    moves: 0, solved: false,
    frozen: false, frozenUntil: 0,
    peeking: false, peekUntil: 0,
    combo: 0, lastSlideTime: 0,
    coins: 0, gems: 0, stars: 0,
    playerIndex: player.index,
    color: player.color || PLAYER_COLORS[player.index] || '#fff',
    name: player.name,
    input: player.input,
  }
}

function minMoves(size: number): number {
  // rough heuristic — not exact solver, but decent benchmark
  return size * size * 2
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const size = Number(config.gridSize) || 4
  const coop = config.gameMode === 'coop-solve'
  const boards = coop
    ? [createBoard(players[0], size)] // shared board in coop
    : players.map(p => createBoard(p, size))
  return {
    boards, powerUps: [], startTime: Date.now(), elapsed: 0,
    gameOver: false, winner: null, coop,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function PuzzleGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState<{ index: number; name: string; color: string; moves: number; coins: number; gems: number; stars: number; solved: boolean }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Slide logic ───────────────────────────────────────────
  const slideTile = useCallback((board: BoardState) => {
    const now = Date.now()
    if (board.frozen && now < board.frozenUntil) return
    board.frozen = false
    const size = board.size
    const cr = Math.floor(board.cursorIdx / size)
    const cc = board.cursorIdx % size
    const er = Math.floor(board.emptyIdx / size)
    const ec = board.emptyIdx % size
    const dist = Math.abs(cr - er) + Math.abs(cc - ec)
    if (dist !== 1) return
    // swap
    board.grid[board.emptyIdx] = board.grid[board.cursorIdx]
    board.grid[board.cursorIdx] = 0
    board.emptyIdx = board.cursorIdx
    board.moves++
    // combo
    if (now - board.lastSlideTime < COMBO_WINDOW_MS) {
      board.combo++
      board.coins += board.combo
    } else {
      board.combo = 0
    }
    board.lastSlideTime = now
    board.coins++
    // check solved
    if (isSolved(board.grid, size)) {
      board.solved = true
      board.coins += 10
      if (board.moves <= minMoves(size)) board.gems += 5
    }
    // power-up spawn
    if (Math.random() < POWERUP_CHANCE && stateRef.current.boards.length > 1) {
      const kinds: PowerUpKind[] = ['freeze', 'shuffle', 'peek']
      stateRef.current.powerUps.push({
        boardIdx: board.playerIndex,
        tileIdx: Math.floor(Math.random() * size * size),
        kind: kinds[Math.floor(Math.random() * kinds.length)],
        spawned: now,
      })
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
        if (board.solved) continue
        const isOwner = st.coop
          ? true
          : board.input.type === 'keyboard' && board.input.group === mapping.group
        if (!isOwner) continue
        if (mapping.dir) {
          const size = board.size
          const cr = Math.floor(board.cursorIdx / size)
          const cc = board.cursorIdx % size
          const nr = cr + mapping.dir.dy
          const nc = cc + mapping.dir.dx
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            board.cursorIdx = nr * size + nc
          }
        }
        if (mapping.action === 'slide') {
          slideTile(board)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slideTile, pauseRef])

  // ── Main game loop ────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    const prevPad: Record<number, { a: boolean; up: boolean; down: boolean; left: boolean; right: boolean }> = {}

    function tick() {
      if (pauseRef.current) { raf = requestAnimationFrame(tick); return }
      const st = stateRef.current
      const now = Date.now()
      st.elapsed = (now - st.startTime) / 1000

      // Gamepad input
      for (const pad of padsRef.current) {
        const prev = prevPad[pad.index] || { a: false, up: false, down: false, left: false, right: false }
        for (const board of st.boards) {
          if (board.solved) continue
          const isOwner = st.coop
            ? true
            : board.input.type === 'gamepad' && board.input.padIndex === pad.index
          if (!isOwner) continue
          const size = board.size
          const cr = Math.floor(board.cursorIdx / size)
          const cc = board.cursorIdx % size
          if (pad.up && !prev.up && cr > 0) board.cursorIdx -= size
          if (pad.down && !prev.down && cr < size - 1) board.cursorIdx += size
          if (pad.left && !prev.left && cc > 0) board.cursorIdx -= 1
          if (pad.right && !prev.right && cc < size - 1) board.cursorIdx += 1
          if (pad.a && !prev.a) slideTile(board)
        }
        prevPad[pad.index] = { a: pad.a, up: pad.up, down: pad.down, left: pad.left, right: pad.right }
      }

      // Power-up expiry & freeze/peek timers
      for (const board of st.boards) {
        if (board.frozen && now >= board.frozenUntil) board.frozen = false
        if (board.peeking && now >= board.peekUntil) board.peeking = false
      }

      // Apply power-ups on cursor hit
      st.powerUps = st.powerUps.filter(pu => {
        const board = st.boards.find(b => b.playerIndex === pu.boardIdx)
        if (!board) return false
        if (board.cursorIdx === pu.tileIdx) {
          // apply to opponents in VS, to self for peek
          if (pu.kind === 'freeze') {
            st.boards.filter(b => b.playerIndex !== board.playerIndex).forEach(b => {
              b.frozen = true; b.frozenUntil = now + FREEZE_DURATION_MS
            })
          } else if (pu.kind === 'shuffle') {
            st.boards.filter(b => b.playerIndex !== board.playerIndex).forEach(b => {
              const sh = shuffleGrid(b.size)
              b.grid = sh.grid; b.emptyIdx = sh.emptyIdx
            })
          } else if (pu.kind === 'peek') {
            board.peeking = true; board.peekUntil = now + PEEK_DURATION_MS
          }
          return false
        }
        return now - pu.spawned < 8000
      })

      // Win check
      if (!st.gameOver) {
        if (st.coop) {
          if (st.boards[0].solved) {
            st.gameOver = true
            st.winner = -1
          }
        } else {
          const solvedBoard = st.boards.find(b => b.solved)
          if (solvedBoard) {
            st.gameOver = true
            st.winner = solvedBoard.playerIndex
            solvedBoard.stars += 3
          }
        }
      }

      // Update HUD
      setHud(st.boards.map(b => ({
        index: b.playerIndex, name: b.name, color: b.color,
        moves: b.moves, coins: b.coins, gems: b.gems, stars: b.stars, solved: b.solved,
      })))
      if (st.gameOver && !gameOver) {
        setGameOver(true)
        setWinner(st.winner === -1 ? t('miniGames.teamWins', 'Team wins!') : st.boards.find(b => b.playerIndex === st.winner)?.name || null)
      }

      // ── Draw ──────────────────────────────────────────────
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(tick); return }
      const ctx = canvas.getContext('2d')!
      canvas.width = W; canvas.height = H
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H)

      const boardCount = st.boards.length
      const boardW = Math.min(Math.floor((W - 20) / boardCount) - 10, 400)
      const startX = (W - boardCount * (boardW + 10) + 10) / 2

      for (let bi = 0; bi < boardCount; bi++) {
        const board = st.boards[bi]
        const size = board.size
        const tileSize = Math.floor(boardW / size)
        const bx = startX + bi * (boardW + 10)
        const by = 60

        // Board background
        ctx.fillStyle = board.frozen ? '#442222' : '#222244'
        ctx.fillRect(bx, by, size * tileSize, size * tileSize)

        // Tiles
        for (let ti = 0; ti < size * size; ti++) {
          const val = board.grid[ti]
          const row = Math.floor(ti / size)
          const col = ti % size
          const tx = bx + col * tileSize
          const ty = by + row * tileSize
          if (val !== 0) {
            const hue = (val / (size * size)) * 280
            ctx.fillStyle = `hsl(${hue}, 60%, 45%)`
            ctx.fillRect(tx + 1, ty + 1, tileSize - 2, tileSize - 2)
            ctx.fillStyle = '#fff'
            ctx.font = `bold ${Math.max(12, tileSize / 3)}px monospace`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(String(val), tx + tileSize / 2, ty + tileSize / 2)
          }
        }

        // Peek ghost
        if (board.peeking) {
          ctx.globalAlpha = 0.25
          const target = solvedGrid(size)
          for (let ti = 0; ti < size * size; ti++) {
            const val = target[ti]
            if (val === 0) continue
            const row = Math.floor(ti / size)
            const col = ti % size
            const tx = bx + col * tileSize
            const ty = by + row * tileSize
            ctx.fillStyle = '#0f0'
            ctx.font = `bold ${Math.max(10, tileSize / 4)}px monospace`
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
            ctx.fillText(String(val), tx + tileSize / 2, ty + tileSize / 2 + tileSize / 4)
          }
          ctx.globalAlpha = 1
        }

        // Cursor
        const curRow = Math.floor(board.cursorIdx / size)
        const curCol = board.cursorIdx % size
        ctx.strokeStyle = board.color
        ctx.lineWidth = 3
        ctx.strokeRect(bx + curCol * tileSize, by + curRow * tileSize, tileSize, tileSize)

        // Power-ups on this board
        for (const pu of st.powerUps) {
          if (pu.boardIdx !== board.playerIndex) continue
          const pr = Math.floor(pu.tileIdx / size)
          const pc = pu.tileIdx % size
          ctx.fillStyle = pu.kind === 'freeze' ? '#00bfff' : pu.kind === 'shuffle' ? '#ff6600' : '#00ff88'
          ctx.beginPath()
          ctx.arc(bx + pc * tileSize + tileSize / 2, by + pr * tileSize + tileSize / 2, tileSize / 5, 0, Math.PI * 2)
          ctx.fill()
        }

        // Player name label
        ctx.fillStyle = board.color
        ctx.font = 'bold 14px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(board.name, bx + (size * tileSize) / 2, by - 8)

        // Frozen indicator
        if (board.frozen) {
          ctx.fillStyle = 'rgba(0,191,255,0.25)'
          ctx.fillRect(bx, by, size * tileSize, size * tileSize)
          ctx.fillStyle = '#00bfff'; ctx.font = 'bold 24px sans-serif'
          ctx.fillText('❄ FROZEN', bx + (size * tileSize) / 2, by + (size * tileSize) / 2)
        }
      }

      // Timer
      ctx.fillStyle = '#ccc'; ctx.font = 'bold 16px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`⏱ ${st.elapsed.toFixed(1)}s`, 10, 20)

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gameOver, pauseRef, slideTile, t])

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
          <div key={s.index} className={`${styles.scoreItem} ${s.solved ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span title="Moves">🔢{s.moves}</span>
            <span style={{ color: '#f1c40f' }} title="Coins">🪙{s.coins}</span>
            <span style={{ color: '#e74c3c' }} title="Gems">💎{s.gems}</span>
            <span style={{ color: '#f39c12' }} title="Stars">⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Puzzle canvas"/>

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
