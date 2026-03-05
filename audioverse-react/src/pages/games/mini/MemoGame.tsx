/**
 * MemoGame — real-time memory / memo card game for 1-4 players.
 *
 * Controls:
 *   Group 0: W/A/S/D  + Space (flip)
 *   Group 1: Arrows   + Enter (flip)
 *   Group 2: I/J/K/L  + U (flip)
 *   Group 3: Numpad 8/4/5/6 + Numpad 0 (flip)
 * Gamepads: D-pad + A button.
 *
 * Rules:
 *  - Grid of face-down cards with matching pairs.
 *  - Players move cursors simultaneously and flip cards in real time.
 *  - Match a pair → keep them face-up, score a point, possible power-up spawn.
 *  - No match → cards flip back after 1 s.
 *  - Combo: successive matches without a miss multiply score.
 *  - Power-ups: Peek, Freeze, Shuffle, Double.
 *  - 3 currencies: coins (matched pairs), gems (perfect matches), stars (board clears).
 *  - Timer countdown. Game ends when time runs out or all pairs found.
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
const CW = 800
const CH = 600
const CARD_W = 70
const CARD_H = 90
const GAP = 10
const FLIP_MS = 150
const MISMATCH_DELAY = 1000
const POWERUP_CHANCE = 0.3
const PEEK_DURATION = 500
const FREEZE_DURATION = 2000

// ─── Shapes & palette ────────────────────────────────────────
type ShapeKind = 'circle' | 'triangle' | 'square' | 'diamond' | 'star' | 'hexagon' | 'cross' | 'heart'
const SHAPES: ShapeKind[] = ['circle', 'triangle', 'square', 'diamond', 'star', 'hexagon', 'cross', 'heart']
const SHAPE_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e91e63']

type PowerKind = 'peek' | 'freeze' | 'shuffle' | 'double'

// ─── Keyboard mappings ───────────────────────────────────────
interface KBAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'flip' }
const KB_MAP = new Map<string, KBAction>([
  ['w', { group: 0, action: 'up' }], ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }], ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'flip' }],
  ['ArrowUp', { group: 1, action: 'up' }], ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }], ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'flip' }],
  ['i', { group: 2, action: 'up' }], ['k', { group: 2, action: 'down' }],
  ['j', { group: 2, action: 'left' }], ['l', { group: 2, action: 'right' }],
  ['u', { group: 2, action: 'flip' }],
  ['8', { group: 3, action: 'up' }], ['5', { group: 3, action: 'down' }],
  ['4', { group: 3, action: 'left' }], ['6', { group: 3, action: 'right' }],
  ['0', { group: 3, action: 'flip' }],
])

// ─── Types ───────────────────────────────────────────────────
interface Card {
  id: number
  pairId: number
  shape: ShapeKind
  color: string
  faceUp: boolean
  matched: boolean
  /** 0 = face-down, 1 = face-up, between = animating */
  flipProgress: number
  flipDir: 1 | -1
  col: number
  row: number
}

interface PowerUp {
  kind: PowerKind
  col: number
  row: number
  spawnedAt: number
}

interface Cursor {
  col: number
  row: number
  flipped: Card[]      // cards this player currently has flipped (max 2)
  mismatchAt: number   // timestamp when mismatch detected (0 = none)
  score: number
  combo: number
  coins: number
  gems: number
  stars: number
  frozenUntil: number
  doubleNext: boolean
  activePower: PowerKind | null
  playerIndex: number
  name: string
  color: string
  input: PlayerSlot['input']
  missCount: number
}

interface GameState {
  cards: Card[]
  cursors: Cursor[]
  powerUps: PowerUp[]
  cols: number
  rows: number
  totalPairs: number
  matchedPairs: number
  timer: number        // seconds remaining
  maxTime: number
  gameOver: boolean
  winner: number | null
  coop: boolean
  peekUntil: number    // timestamp until peek ends
  lastTick: number
}

// ─── Grid sizing helpers ─────────────────────────────────────
function parseBoardSize(s: string): [number, number] {
  if (s === '6x6') return [6, 6]
  if (s === '4x6') return [4, 6]
  return [4, 4]
}

function boardTimeLimit(s: string, custom?: number): number {
  if (custom) return custom
  if (s === '6x6') return 180
  if (s === '4x6') return 120
  return 60
}

// ─── Shuffle ─────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Init ────────────────────────────────────────────────────
function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const boardSize = config.boardSize ?? '4x4'
  const [gridCols, gridRows] = parseBoardSize(boardSize)
  const totalPairs = (gridCols * gridRows) / 2
  const coop = config.gameMode === 'coop-clear'

  // Build symbol pool
  const symbolPool: { shape: ShapeKind; color: string }[] = []
  for (let i = 0; i < SHAPES.length; i++) {
    for (let j = 0; j < SHAPE_COLORS.length; j++) {
      symbolPool.push({ shape: SHAPES[i], color: SHAPE_COLORS[j] })
    }
  }
  const chosen = shuffle(symbolPool).slice(0, totalPairs)

  // Create card pairs
  let cards: Card[] = []
  let id = 0
  for (let p = 0; p < totalPairs; p++) {
    for (let copy = 0; copy < 2; copy++) {
      cards.push({
        id: id++, pairId: p,
        shape: chosen[p].shape, color: chosen[p].color,
        faceUp: false, matched: false,
        flipProgress: 0, flipDir: 1,
        col: 0, row: 0,
      })
    }
  }
  cards = shuffle(cards)
  // Assign grid positions
  let idx = 0
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      cards[idx].col = c
      cards[idx].row = r
      idx++
    }
  }

  // Create cursors for each player
  const startPositions = [[0, 0], [gridCols - 1, gridRows - 1], [gridCols - 1, 0], [0, gridRows - 1]]
  const cursors: Cursor[] = players.map((p, i) => ({
    col: startPositions[i % startPositions.length][0],
    row: startPositions[i % startPositions.length][1],
    flipped: [],
    mismatchAt: 0,
    score: 0,
    combo: 0,
    coins: 0,
    gems: 0,
    stars: 0,
    frozenUntil: 0,
    doubleNext: false,
    activePower: null,
    playerIndex: p.index,
    name: p.name,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    input: p.input,
    missCount: 0,
  }))

  const maxTime = boardTimeLimit(boardSize, config.timeLimit ? Number(config.timeLimit) : undefined)

  return {
    cards, cursors, powerUps: [],
    cols: gridCols, rows: gridRows,
    totalPairs, matchedPairs: 0,
    timer: maxTime, maxTime,
    gameOver: false, winner: null,
    coop,
    peekUntil: 0,
    lastTick: performance.now(),
  }
}

// ─── Drawing helpers ─────────────────────────────────────────
function gridOrigin(cols: number, rows: number): { ox: number; oy: number } {
  const totalW = cols * (CARD_W + GAP) - GAP
  const totalH = rows * (CARD_H + GAP) - GAP
  return { ox: (CW - totalW) / 2, oy: (CH - totalH) / 2 + 20 }
}

function cardRect(col: number, row: number, ox: number, oy: number) {
  return {
    x: ox + col * (CARD_W + GAP),
    y: oy + row * (CARD_H + GAP),
  }
}

function drawShape(ctx: CanvasRenderingContext2D, shape: ShapeKind, cx: number, cy: number, r: number, color: string) {
  ctx.fillStyle = color
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  switch (shape) {
    case 'circle':
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill(); break
    case 'square':
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2); break
    case 'triangle':
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx - r, cy + r); ctx.lineTo(cx + r, cy + r); ctx.closePath(); ctx.fill(); break
    case 'diamond':
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx, cy + r); ctx.lineTo(cx - r, cy); ctx.closePath(); ctx.fill(); break
    case 'star': {
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const a1 = (Math.PI * 2 * i) / 5 - Math.PI / 2
        const a2 = a1 + Math.PI / 5
        ctx.lineTo(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r)
        ctx.lineTo(cx + Math.cos(a2) * r * 0.45, cy + Math.sin(a2) * r * 0.45)
      }
      ctx.closePath(); ctx.fill(); break
    }
    case 'hexagon': {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6 - Math.PI / 6
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r)
      }
      ctx.closePath(); ctx.fill(); break
    }
    case 'cross':
      ctx.fillRect(cx - r * 0.3, cy - r, r * 0.6, r * 2)
      ctx.fillRect(cx - r, cy - r * 0.3, r * 2, r * 0.6)
      break
    case 'heart': {
      ctx.beginPath()
      ctx.moveTo(cx, cy + r * 0.7)
      ctx.bezierCurveTo(cx - r * 1.2, cy - r * 0.2, cx - r * 0.6, cy - r, cx, cy - r * 0.4)
      ctx.bezierCurveTo(cx + r * 0.6, cy - r, cx + r * 1.2, cy - r * 0.2, cx, cy + r * 0.7)
      ctx.fill(); break
    }
  }
}

function drawPowerIcon(ctx: CanvasRenderingContext2D, kind: PowerKind, cx: number, cy: number, r: number) {
  ctx.fillStyle = '#fff'
  ctx.font = `${r * 1.4}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const icons: Record<PowerKind, string> = { peek: '👁', freeze: '❄', shuffle: '🔀', double: '×2' }
  ctx.fillText(icons[kind], cx, cy)
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function MemoGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState<{ name: string; score: number; combo: number; coins: number; gems: number; stars: number; color: string; power: PowerKind | null }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [timerDisplay, setTimerDisplay] = useState(stateRef.current.timer)
  const [pairsLeft, setPairsLeft] = useState(stateRef.current.totalPairs)

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Flip a card for a cursor ──────────────────────────────
  const tryFlip = useCallback((cursor: Cursor) => {
    const st = stateRef.current
    const now = performance.now()
    if (cursor.frozenUntil > now) return
    if (cursor.flipped.length >= 2) return

    const card = st.cards.find(c => c.col === cursor.col && c.row === cursor.row && !c.matched && !c.faceUp)
    if (!card) return

    card.faceUp = true
    card.flipProgress = 0
    card.flipDir = 1
    cursor.flipped.push(card)

    if (cursor.flipped.length === 2) {
      const [a, b] = cursor.flipped
      if (a.pairId === b.pairId) {
        // Match!
        a.matched = true
        b.matched = true
        cursor.combo++
        const pts = cursor.doubleNext ? 2 : 1
        const comboMul = cursor.combo
        cursor.score += pts * comboMul
        cursor.coins += pts
        if (cursor.missCount === 0) cursor.gems += 1
        cursor.doubleNext = false
        st.matchedPairs++

        // Maybe spawn power-up on one of the matched positions
        const powersEnabled = config.powerUps !== 'off'
        if (powersEnabled && Math.random() < POWERUP_CHANCE) {
          const kinds: PowerKind[] = ['peek', 'freeze', 'shuffle', 'double']
          st.powerUps.push({
            kind: kinds[Math.floor(Math.random() * kinds.length)],
            col: a.col, row: a.row,
            spawnedAt: now,
          })
        }

        cursor.flipped = []

        // Check board clear
        if (st.matchedPairs >= st.totalPairs) {
          for (const c of st.cursors) c.stars += 1
          st.gameOver = true
          if (st.coop) {
            st.winner = -1 // coop win
          } else {
            const best = st.cursors.reduce((a, b) => a.score > b.score ? a : b)
            st.winner = best.playerIndex
          }
        }
      } else {
        // Mismatch
        cursor.mismatchAt = now
        cursor.combo = 0
        cursor.missCount++
      }
    }
  }, [config])

  // ─── Activate power-up ─────────────────────────────────────
  const activatePower = useCallback((cursor: Cursor, pu: PowerUp) => {
    const st = stateRef.current
    const now = performance.now()
    switch (pu.kind) {
      case 'peek':
        st.peekUntil = now + PEEK_DURATION
        break
      case 'freeze':
        for (const c of st.cursors) {
          if (c.playerIndex !== cursor.playerIndex) c.frozenUntil = now + FREEZE_DURATION
        }
        break
      case 'shuffle': {
        const faceDown = st.cards.filter(c => !c.matched && !c.faceUp)
        const positions = faceDown.map(c => ({ col: c.col, row: c.row }))
        const shuffled = shuffle(positions)
        faceDown.forEach((c, i) => { c.col = shuffled[i].col; c.row = shuffled[i].row })
        break
      }
      case 'double':
        cursor.doubleNext = true
        break
    }
    cursor.activePower = pu.kind
    setTimeout(() => { cursor.activePower = null }, 1500)
  }, [])

  // ─── Keyboard input ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current || stateRef.current.gameOver) return
      const mapping = KB_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      const now = performance.now()

      for (const cursor of st.cursors) {
        if (cursor.input.type !== 'keyboard' || cursor.input.group !== mapping.group) continue
        if (cursor.frozenUntil > now && mapping.action !== 'flip') continue

        if (mapping.action === 'flip') {
          tryFlip(cursor)
          // Check power-up pickup
          const puIdx = st.powerUps.findIndex(p => p.col === cursor.col && p.row === cursor.row)
          if (puIdx !== -1) {
            activatePower(cursor, st.powerUps[puIdx])
            st.powerUps.splice(puIdx, 1)
          }
        } else {
          const dir = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[mapping.action]!
          const nc = cursor.col + dir[0]
          const nr = cursor.row + dir[1]
          if (nc >= 0 && nc < st.cols && nr >= 0 && nr < st.rows) {
            cursor.col = nc
            cursor.row = nr
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [tryFlip, activatePower])

  // ─── Gamepad polling ───────────────────────────────────────
  useEffect(() => {
    const held = new Set<string>()
    let raf = 0
    function poll() {
      const st = stateRef.current
      if (!pauseRef.current && !st.gameOver) {
        const now = performance.now()
        const currentPads = padsRef.current
        for (const cursor of st.cursors) {
          if (cursor.input.type !== 'gamepad') continue
          const pi = (cursor.input as { type: 'gamepad'; padIndex: number }).padIndex
          const gp = currentPads.find(p => p.index === pi)
          if (!gp) continue
          const frozen = cursor.frozenUntil > now

          // Movement — edge-triggered
          const dirs = [
            { key: `${pi}-up`, pressed: gp.up, dc: 0, dr: -1 },
            { key: `${pi}-down`, pressed: gp.down, dc: 0, dr: 1 },
            { key: `${pi}-left`, pressed: gp.left, dc: -1, dr: 0 },
            { key: `${pi}-right`, pressed: gp.right, dc: 1, dr: 0 },
          ]
          for (const d of dirs) {
            if (d.pressed && !held.has(d.key) && !frozen) {
              const nc = cursor.col + d.dc
              const nr = cursor.row + d.dr
              if (nc >= 0 && nc < st.cols && nr >= 0 && nr < st.rows) {
                cursor.col = nc; cursor.row = nr
              }
            }
            if (d.pressed) held.add(d.key); else held.delete(d.key)
          }

          // Flip — edge-triggered on A button
          const flipKey = `${pi}-a`
          if (gp.a && !held.has(flipKey)) {
            tryFlip(cursor)
            const puIdx = st.powerUps.findIndex(p => p.col === cursor.col && p.row === cursor.row)
            if (puIdx !== -1) { activatePower(cursor, st.powerUps[puIdx]); st.powerUps.splice(puIdx, 1) }
          }
          if (gp.a) held.add(flipKey); else held.delete(flipKey)
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [tryFlip, activatePower])

  // ─── Game loop (timer + mismatch flip-back) ────────────────
  useEffect(() => {
    let raf = 0
    function tick() {
      const st = stateRef.current
      const now = performance.now()
      if (!pauseRef.current && !st.gameOver) {
        // Timer
        const dt = (now - st.lastTick) / 1000
        st.timer = Math.max(0, st.timer - dt)
        if (st.timer <= 0) {
          st.gameOver = true
          if (st.coop) {
            st.winner = null // coop fail
          } else {
            const best = st.cursors.reduce((a, b) => a.score > b.score ? a : b)
            st.winner = best.playerIndex
          }
        }

        // Handle mismatch flip-back
        for (const cursor of st.cursors) {
          if (cursor.mismatchAt > 0 && now - cursor.mismatchAt > MISMATCH_DELAY) {
            for (const card of cursor.flipped) {
              card.faceUp = false
              card.flipProgress = 1
              card.flipDir = -1
            }
            cursor.flipped = []
            cursor.mismatchAt = 0
          }
        }

        // Animate card flips
        for (const card of st.cards) {
          if (card.flipDir === 1 && card.flipProgress < 1) {
            card.flipProgress = Math.min(1, card.flipProgress + dt / (FLIP_MS / 1000))
          } else if (card.flipDir === -1 && card.flipProgress > 0) {
            card.flipProgress = Math.max(0, card.flipProgress - dt / (FLIP_MS / 1000))
          }
        }

        // Update HUD state
        setTimerDisplay(Math.ceil(st.timer))
        setPairsLeft(st.totalPairs - st.matchedPairs)
        setHud(st.cursors.map(c => ({
          name: c.name, score: c.score, combo: c.combo,
          coins: c.coins, gems: c.gems, stars: c.stars,
          color: c.color, power: c.activePower,
        })))

        if (st.gameOver) {
          setGameOver(true)
          if (st.winner != null && st.winner >= 0) {
            const w = st.cursors.find(c => c.playerIndex === st.winner)
            setWinner(w?.name ?? `Player ${(st.winner ?? 0) + 1}`)
          } else if (st.coop && st.winner === -1) {
            setWinner(t('miniGames.teamWins', 'Team'))
          }
        }
      }
      st.lastTick = now
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [t])

  // ─── Render ────────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      const now = performance.now()
      canvas.width = CW
      canvas.height = CH

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, CW, CH)

      const { ox, oy } = gridOrigin(st.cols, st.rows)
      const peeking = st.peekUntil > now

      // Draw cards
      for (const card of st.cards) {
        const { x, y } = cardRect(card.col, card.row, ox, oy)
        const showFace = card.faceUp || card.matched || peeking

        // Flip animation: horizontal scale
        const prog = card.faceUp || card.matched ? card.flipProgress : (1 - card.flipProgress)
        const scaleX = Math.abs(Math.cos((1 - prog) * Math.PI / 2))
        const cx = x + CARD_W / 2
        const cy = y + CARD_H / 2

        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(Math.max(0.05, scaleX), 1)
        ctx.translate(-CARD_W / 2, -CARD_H / 2)

        if (card.matched) {
          // Matched: dim background, show symbol
          ctx.fillStyle = '#16213e'
          ctx.globalAlpha = 0.5
          ctx.fillRect(0, 0, CARD_W, CARD_H)
          ctx.globalAlpha = 1
          drawShape(ctx, card.shape, CARD_W / 2, CARD_H / 2, 18, card.color)
        } else if (showFace) {
          // Face-up card
          ctx.fillStyle = '#0f3460'
          ctx.fillRect(0, 0, CARD_W, CARD_H)
          ctx.strokeStyle = '#e94560'
          ctx.lineWidth = 2
          ctx.strokeRect(0, 0, CARD_W, CARD_H)
          drawShape(ctx, card.shape, CARD_W / 2, CARD_H / 2, 20, card.color)
        } else {
          // Face-down card back
          ctx.fillStyle = '#533483'
          ctx.fillRect(0, 0, CARD_W, CARD_H)
          ctx.strokeStyle = '#7b2d8e'
          ctx.lineWidth = 2
          ctx.strokeRect(0, 0, CARD_W, CARD_H)
          ctx.fillStyle = '#ddd'
          ctx.font = 'bold 28px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', CARD_W / 2, CARD_H / 2)
        }

        ctx.restore()
      }

      // Draw power-ups
      for (const pu of st.powerUps) {
        const { x, y } = cardRect(pu.col, pu.row, ox, oy)
        ctx.fillStyle = 'rgba(255,215,0,0.35)'
        ctx.fillRect(x, y, CARD_W, CARD_H)
        drawPowerIcon(ctx, pu.kind, x + CARD_W / 2, y + CARD_H / 2, 16)
      }

      // Draw cursors
      for (const cursor of st.cursors) {
        const { x, y } = cardRect(cursor.col, cursor.row, ox, oy)
        const frozen = cursor.frozenUntil > now
        ctx.strokeStyle = frozen ? '#88f' : cursor.color
        ctx.lineWidth = 3
        ctx.setLineDash(frozen ? [4, 4] : [])
        ctx.strokeRect(x - 3, y - 3, CARD_W + 6, CARD_H + 6)
        ctx.setLineDash([])
        // Player label
        ctx.fillStyle = cursor.color
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(cursor.name, x + CARD_W / 2, y - 6)
      }

      // HUD bar at top
      ctx.fillStyle = 'rgba(0,0,0,0.6)'
      ctx.fillRect(0, 0, CW, 22)
      ctx.font = 'bold 13px sans-serif'
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'left'
      ctx.fillStyle = '#f1c40f'
      ctx.fillText(`⏱ ${Math.ceil(st.timer)}s`, 8, 12)
      ctx.textAlign = 'right'
      ctx.fillStyle = '#aaa'
      ctx.fillText(`Pairs: ${st.matchedPairs}/${st.totalPairs}`, CW - 8, 12)

      // Border
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, CW, CH)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHud([])
    setTimerDisplay(stateRef.current.timer)
    setPairsLeft(stateRef.current.totalPairs)
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
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {hud.map((h, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: h.color }} />
            <span>{h.name}</span>
            <span className={styles.scoreValue}>{h.score}</span>
            {h.combo > 1 && <span style={{ color: '#f1c40f', fontSize: '0.8rem' }}>×{h.combo}</span>}
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🪙{h.coins} 💎{h.gems} ⭐{h.stars}</span>
            {h.power && <span style={{ fontSize: '0.75rem' }}>🔋{h.power}</span>}
          </div>
        ))}
        <div className={styles.scoreItem}>
          <span style={{ color: '#f1c40f' }}>⏱ {timerDisplay}s</span>
          <span style={{ color: '#aaa', marginLeft: 8 }}>Left: {pairsLeft}</span>
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Memo canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && hud.length === 1 && (
            <p className={styles.winnerText}>{t('miniGames.finalScore', 'Score')}: {hud[0]?.score ?? 0}</p>
          )}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '1rem', color: '#ccc' }}>
            {hud.map((h, i) => (
              <span key={i} style={{ color: h.color }}>
                {h.name}: 🪙{h.coins} 💎{h.gems} ⭐{h.stars}
              </span>
            ))}
          </div>
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
