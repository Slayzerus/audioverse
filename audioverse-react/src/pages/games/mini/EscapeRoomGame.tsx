/**
 * EscapeRoomGame — series of puzzle challenges to escape rooms.
 *
 * 10 room types: find-key, pattern-match, number-code, slider-puzzle,
 * wire-connect, memory-sequence, maze, weight, logic-gate, boss.
 *
 * Controls:
 *   Group 0: W/A/S/D move cursor, Space interact, E use/pick up, H hint
 *   Group 1: Arrows move cursor, Enter interact, Shift use/pick up, H hint
 *   Gamepad: D-pad move, A interact, X use/pick up, Y hint
 *
 * VS: race through rooms, first to escape wins.
 * Coop: solve together, share clues.
 *
 * Currencies: coins (rooms cleared), gems (no-hint clears), stars (speedruns).
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
const CELL = 40
const COLS = W / CELL  // 20
const ROWS = H / CELL  // 15
const TICK_MS = 16
const ROOM_TIME_BASE = 90_000 // 90s default per room
const HINT_COST_MAP: Record<string, number> = { free: 0, cheap: 5, expensive: 20 }

// ─── Puzzle types ────────────────────────────────────────────
type PuzzleType =
  | 'find-key' | 'pattern-match' | 'number-code' | 'slider'
  | 'wire-connect' | 'memory-sequence' | 'maze' | 'weight'
  | 'logic-gate' | 'boss'

const PUZZLE_ORDER: PuzzleType[] = [
  'find-key', 'pattern-match', 'number-code', 'slider',
  'wire-connect', 'memory-sequence', 'maze', 'weight',
  'logic-gate', 'boss',
]

// ─── Types ───────────────────────────────────────────────────
interface RoomObject {
  x: number; y: number; w: number; h: number
  kind: 'key' | 'lock' | 'switch' | 'plate' | 'slider-block' | 'numpad' | 'compartment' | 'wall' | 'door' | 'clue'
  color: string
  active: boolean
  value?: number
  id: number
}

interface PlayerState {
  cx: number; cy: number
  heldItem: RoomObject | null
  solved: boolean
  coins: number; gems: number; stars: number
  hintsUsed: number
  roomsCleared: number
  color: string; name: string; index: number
  input: PlayerSlot['input']
}

interface RoomState {
  puzzle: PuzzleType
  objects: RoomObject[]
  solution: number[] // expected sequence / code
  playerInput: number[]
  timer: number // ms remaining
  failed: boolean
  completed: boolean
  showSequence: boolean
  sequenceIdx: number
  sequenceTimer: number
}

interface GameState {
  players: PlayerState[]
  room: RoomState
  roomIndex: number
  totalRooms: number
  gameOver: boolean
  winner: string | null
  gameMode: string
  hintCost: number
  difficulty: string
}

// ─── Helpers ─────────────────────────────────────────────────
let nextObjId = 1
function makeObj(kind: RoomObject['kind'], x: number, y: number, color: string, w = 1, h = 1): RoomObject {
  return { x, y, w, h, kind, color, active: false, value: 0, id: nextObjId++ }
}

function generateRoom(puzzle: PuzzleType, _difficulty: string): RoomState {
  const objects: RoomObject[] = []
  let solution: number[] = []

  // Walls border
  for (let c = 0; c < COLS; c++) { objects.push(makeObj('wall', c, 0, '#555')); objects.push(makeObj('wall', c, ROWS - 1, '#555')) }
  for (let r = 1; r < ROWS - 1; r++) { objects.push(makeObj('wall', 0, r, '#555')); objects.push(makeObj('wall', COLS - 1, r, '#555')) }

  // Door (locked)
  objects.push(makeObj('door', COLS - 2, 1, '#8B4513'))

  switch (puzzle) {
    case 'find-key': {
      // Key hidden behind movable objects
      const kx = 3 + Math.floor(Math.random() * 5)
      const ky = 3 + Math.floor(Math.random() * 5)
      objects.push(makeObj('key', kx, ky, '#f1c40f'))
      // Blockers
      for (let i = 0; i < 6; i++) objects.push(makeObj('compartment', 2 + i * 2, 5, '#777'))
      objects.push(makeObj('lock', COLS - 3, 2, '#aaa'))
      solution = [1] // just need to find key and use lock
      break
    }
    case 'pattern-match': {
      const len = 4
      solution = Array.from({ length: len }, () => Math.floor(Math.random() * 4))
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f']
      for (let i = 0; i < 4; i++) {
        objects.push(makeObj('switch', 4 + i * 3, 10, colors[i]))
        objects[objects.length - 1].value = i
      }
      break
    }
    case 'number-code': {
      const code = Math.floor(1000 + Math.random() * 9000)
      solution = String(code).split('').map(Number)
      objects.push(makeObj('clue', 5, 3, '#fff'))
      objects[objects.length - 1].value = code
      // Numpad
      for (let d = 0; d < 10; d++) {
        const obj = makeObj('numpad', 8 + (d % 3) * 2, 8 + Math.floor(d / 3) * 2, '#ccc')
        obj.value = d
        objects.push(obj)
      }
      break
    }
    case 'slider': {
      for (let i = 0; i < 5; i++) {
        objects.push(makeObj('slider-block', 6 + i, 7, '#e67e22'))
      }
      // Clear path = move blocks up/down
      solution = [1]
      break
    }
    case 'wire-connect': {
      const pairs = 4
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f']
      for (let i = 0; i < pairs; i++) {
        objects.push(makeObj('switch', 3, 3 + i * 3, colors[i]))
        objects[objects.length - 1].value = i
        objects.push(makeObj('switch', 16, 3 + i * 3, colors[i]))
        objects[objects.length - 1].value = i + 10
      }
      solution = [0, 1, 2, 3]
      break
    }
    case 'memory-sequence': {
      const len = 5
      solution = Array.from({ length: len }, () => Math.floor(Math.random() * 4))
      const colors = ['#e74c3c', '#3498db', '#2ecc71', '#9b59b6']
      for (let i = 0; i < 4; i++) {
        objects.push(makeObj('plate', 5 + i * 3, 10, colors[i]))
        objects[objects.length - 1].value = i
      }
      break
    }
    case 'maze': {
      // Simple maze walls
      const maze = [
        [3, 3], [4, 3], [5, 3], [5, 4], [5, 5], [7, 3], [7, 4], [7, 5], [7, 6],
        [9, 5], [10, 5], [11, 5], [11, 6], [11, 7], [13, 3], [13, 4], [13, 5],
        [3, 8], [4, 8], [6, 8], [7, 8], [8, 8], [10, 8], [11, 8],
        [5, 10], [6, 10], [7, 10], [9, 10], [10, 10], [12, 10], [13, 10],
      ]
      for (const [mx, my] of maze) objects.push(makeObj('wall', mx, my, '#444'))
      objects.push(makeObj('key', 14, 11, '#f1c40f'))
      solution = [1]
      break
    }
    case 'weight': {
      const target = 3 + Math.floor(Math.random() * 3)
      solution = [target]
      for (let i = 0; i < 6; i++) {
        objects.push(makeObj('slider-block', 3 + i * 2, 5, '#1abc9c'))
      }
      objects.push(makeObj('plate', 10, 11, '#3498db'))
      objects[objects.length - 1].value = target
      break
    }
    case 'logic-gate': {
      const bits = 4
      solution = Array.from({ length: bits }, () => Math.round(Math.random()))
      for (let i = 0; i < bits; i++) {
        const sw = makeObj('switch', 5 + i * 3, 7, '#e74c3c')
        sw.value = 0
        objects.push(sw)
      }
      break
    }
    case 'boss': {
      // Combination: key + code + switches
      objects.push(makeObj('key', 4, 4, '#f1c40f'))
      objects.push(makeObj('lock', COLS - 3, 2, '#aaa'))
      for (let i = 0; i < 3; i++) {
        const sw = makeObj('switch', 6 + i * 3, 10, '#e74c3c')
        sw.value = 0
        objects.push(sw)
      }
      solution = [1, 1, 1]
      break
    }
  }

  return {
    puzzle,
    objects,
    solution,
    playerInput: [],
    timer: ROOM_TIME_BASE,
    failed: false,
    completed: false,
    showSequence: puzzle === 'memory-sequence' || puzzle === 'pattern-match',
    sequenceIdx: 0,
    sequenceTimer: 0,
  }
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const totalRooms = Number(config.roomCount) || 10
  const gameMode = String(config.gameMode || 'adventure')
  const difficulty = String(config.difficulty || 'normal')
  const hintCost = HINT_COST_MAP[config.hintCost as string] ?? 5
  const pStates: PlayerState[] = players.map((p, i) => ({
    cx: 2, cy: Math.min(2 + i * 2, ROWS - 3),
    heldItem: null, solved: false,
    coins: 0, gems: 0, stars: 0, hintsUsed: 0, roomsCleared: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, index: p.index, input: p.input,
  }))
  return {
    players: pStates,
    room: generateRoom(PUZZLE_ORDER[0], difficulty),
    roomIndex: 0,
    totalRooms,
    gameOver: false,
    winner: null,
    gameMode,
    hintCost,
    difficulty,
  }
}

// ─── Keyboard maps ───────────────────────────────────────────
interface KeyAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'interact' | 'use' | 'hint' }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, action: 'up' }], ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }], ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'interact' }], ['e', { group: 0, action: 'use' }],
  ['h', { group: 0, action: 'hint' }],
  ['ArrowUp', { group: 1, action: 'up' }], ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }], ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'interact' }], ['Shift', { group: 1, action: 'use' }],
])

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function EscapeRoomGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState({ roomIndex: 0, timer: ROOM_TIME_BASE, players: [] as { name: string; coins: number; gems: number; stars: number; color: string }[] })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [hint, setHint] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Apply action to player ──
  const applyAction = useCallback((playerIdx: number, action: string) => {
    const st = stateRef.current
    if (st.gameOver || st.room.completed || st.room.failed) return
    const p = st.players.find(pl => pl.index === playerIdx)
    if (!p) return
    const room = st.room

    switch (action) {
      case 'up': if (p.cy > 1) p.cy--; break
      case 'down': if (p.cy < ROWS - 2) p.cy++; break
      case 'left': if (p.cx > 1) p.cx--; break
      case 'right': if (p.cx < COLS - 2) p.cx++; break
      case 'interact': {
        // Find object at cursor
        const obj = room.objects.find(o => o.x === p.cx && o.y === p.cy && o.kind !== 'wall')
        if (!obj) break
        if (obj.kind === 'key') {
          p.heldItem = obj
          room.objects = room.objects.filter(o => o.id !== obj.id)
        } else if (obj.kind === 'lock' && p.heldItem?.kind === 'key') {
          p.heldItem = null
          obj.active = true
          // Check if puzzle solved
          if (room.puzzle === 'find-key' || room.puzzle === 'maze' || room.puzzle === 'boss') {
            room.playerInput.push(1)
          }
        } else if (obj.kind === 'switch') {
          obj.active = !obj.active
          obj.value = obj.active ? 1 : 0
          room.playerInput = room.objects.filter(o => o.kind === 'switch').map(o => o.value ?? 0)
        } else if (obj.kind === 'plate') {
          room.playerInput.push(obj.value ?? 0)
        } else if (obj.kind === 'numpad') {
          room.playerInput.push(obj.value ?? 0)
        } else if (obj.kind === 'slider-block') {
          // Push block up
          const target = room.objects.find(o => o.x === obj.x && o.y === obj.y - 1)
          if (!target || target.kind !== 'wall') {
            obj.y = Math.max(1, obj.y - 1)
          }
          if (room.puzzle === 'slider' || room.puzzle === 'weight') {
            // Check if path cleared or plates satisfied
            const blocksOnPlate = room.objects.filter(o => o.kind === 'slider-block').filter(b => {
              return room.objects.some(pl => pl.kind === 'plate' && pl.x === b.x && pl.y === b.y)
            })
            if (room.puzzle === 'weight') {
              const plate = room.objects.find(o => o.kind === 'plate')
              if (plate && blocksOnPlate.length === (plate.value ?? 3)) {
                room.playerInput = [blocksOnPlate.length]
              }
            } else {
              const pathClear = !room.objects.some(o => o.kind === 'slider-block' && o.y === 7 && o.x >= 6 && o.x <= 10)
              if (pathClear) room.playerInput = [1]
            }
          }
        }

        // Check solution
        if (room.solution.length > 0 && room.playerInput.length >= room.solution.length) {
          const match = room.solution.every((v, i) => room.playerInput[i] === v)
          if (match) room.completed = true
        }
        break
      }
      case 'use': {
        if (p.heldItem) {
          // Drop item at cursor
          p.heldItem.x = p.cx
          p.heldItem.y = p.cy
          room.objects.push(p.heldItem)
          p.heldItem = null
        }
        break
      }
      case 'hint': {
        if (p.coins >= st.hintCost || st.hintCost === 0) {
          p.coins -= st.hintCost
          p.hintsUsed++
          setHint(`Hint: ${room.puzzle} — solution involves ${room.solution.length} steps`)
          setTimeout(() => setHint(null), 4000)
        }
        break
      }
    }
  }, [])

  // ── Keyboard input ──
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const mapping = KEY_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (const p of st.players) {
        if (p.input.type === 'keyboard' && p.input.group === mapping.group) {
          applyAction(p.index, mapping.action)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [applyAction])

  // ── Gamepad polling ──
  useEffect(() => {
    let raf = 0
    let lastFrame = 0
    function poll(time: number) {
      if (time - lastFrame > 120) {
        lastFrame = time
        const st = stateRef.current
        const currentPads = padsRef.current
        for (const p of st.players) {
          if (p.input.type !== 'gamepad') continue
          const gp = currentPads.find(pad => pad.index === (p.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (!gp) continue
          if (gp.up) applyAction(p.index, 'up')
          else if (gp.down) applyAction(p.index, 'down')
          else if (gp.left) applyAction(p.index, 'left')
          else if (gp.right) applyAction(p.index, 'right')
          if (gp.a) applyAction(p.index, 'interact')
          if (gp.x) applyAction(p.index, 'use')
          if (gp.y) applyAction(p.index, 'hint')
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [applyAction])

  // ── Game tick ──
  useEffect(() => {
    let timer = 0
    function tick() {
      if (pauseRef.current) { timer = window.setTimeout(tick, TICK_MS); return }
      const st = stateRef.current
      if (st.gameOver) return

      const room = st.room

      // Sequence showing (memory / pattern)
      if (room.showSequence) {
        room.sequenceTimer += TICK_MS
        if (room.sequenceTimer > 800) {
          room.sequenceTimer = 0
          room.sequenceIdx++
          if (room.sequenceIdx >= room.solution.length) {
            room.showSequence = false
            room.sequenceIdx = 0
          }
        }
        timer = window.setTimeout(tick, TICK_MS)
        updateHud(st)
        return
      }

      // Timer countdown
      room.timer -= TICK_MS
      if (room.timer <= 0) {
        room.failed = true
        room.timer = 0
        // Restart room after brief delay
        setTimeout(() => {
          room.failed = false
          const newRoom = generateRoom(PUZZLE_ORDER[st.roomIndex % PUZZLE_ORDER.length], st.difficulty)
          stateRef.current.room = newRoom
          for (const p of st.players) { p.cx = 2; p.cy = 2; p.heldItem = null }
        }, 1500)
      }

      // Room completed
      if (room.completed) {
        for (const p of st.players) {
          p.roomsCleared++
          p.coins += 10
          if (p.hintsUsed === 0) p.gems += 5
        }
        st.roomIndex++
        if (st.roomIndex >= st.totalRooms) {
          st.gameOver = true
          // Speedrun star
          for (const p of st.players) p.stars++
          const best = st.players.reduce((a, b) => (a.coins + a.gems * 5 + a.stars * 20) > (b.coins + b.gems * 5 + b.stars * 20) ? a : b)
          st.winner = best.name
          setGameOver(true)
          setWinner(best.name)
          return
        }
        // Next room
        const newRoom = generateRoom(PUZZLE_ORDER[st.roomIndex % PUZZLE_ORDER.length], st.difficulty)
        stateRef.current.room = newRoom
        for (const p of st.players) { p.cx = 2; p.cy = 2; p.heldItem = null; p.hintsUsed = 0 }
      }

      updateHud(st)
      timer = window.setTimeout(tick, TICK_MS)
    }

    function updateHud(st: GameState) {
      setHud({
        roomIndex: st.roomIndex,
        timer: st.room.timer,
        players: st.players.map(p => ({ name: p.name, coins: p.coins, gems: p.gems, stars: p.stars, color: p.color })),
      })
    }

    timer = window.setTimeout(tick, TICK_MS)
    return () => clearTimeout(timer)
  }, [])

  // ── Render ──
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = W; canvas.height = H

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      const room = st.room

      // Draw objects
      for (const obj of room.objects) {
        const ox = obj.x * CELL, oy = obj.y * CELL
        switch (obj.kind) {
          case 'wall':
            ctx.fillStyle = obj.color
            ctx.fillRect(ox, oy, CELL, CELL)
            break
          case 'door':
            ctx.fillStyle = room.completed ? '#2ecc71' : '#8B4513'
            ctx.fillRect(ox, oy, CELL, CELL * 2)
            ctx.fillStyle = '#f1c40f'
            ctx.beginPath(); ctx.arc(ox + CELL - 6, oy + CELL, 4, 0, Math.PI * 2); ctx.fill()
            break
          case 'key':
            ctx.fillStyle = '#f1c40f'
            ctx.beginPath(); ctx.arc(ox + CELL / 2, oy + CELL / 2, CELL / 3, 0, Math.PI * 2); ctx.fill()
            ctx.fillRect(ox + CELL / 2 - 2, oy + CELL / 2, 4, CELL / 2)
            break
          case 'lock':
            ctx.fillStyle = obj.active ? '#2ecc71' : '#aaa'
            ctx.fillRect(ox + 4, oy + 4, CELL - 8, CELL - 8)
            ctx.strokeStyle = '#666'; ctx.lineWidth = 2
            ctx.beginPath(); ctx.arc(ox + CELL / 2, oy + 4, 8, Math.PI, 0); ctx.stroke()
            break
          case 'switch':
            ctx.fillStyle = obj.active ? '#2ecc71' : obj.color
            ctx.beginPath(); ctx.arc(ox + CELL / 2, oy + CELL / 2, CELL / 3, 0, Math.PI * 2); ctx.fill()
            break
          case 'plate':
            ctx.fillStyle = '#3498db'
            ctx.fillRect(ox + 2, oy + CELL - 8, CELL - 4, 6)
            break
          case 'slider-block':
            ctx.fillStyle = '#e67e22'
            ctx.fillRect(ox + 2, oy + 2, CELL - 4, CELL - 4)
            break
          case 'numpad':
            ctx.fillStyle = '#ccc'
            ctx.fillRect(ox + 4, oy + 4, CELL - 8, CELL - 8)
            ctx.fillStyle = '#111'; ctx.font = '14px monospace'; ctx.textAlign = 'center'
            ctx.fillText(String(obj.value ?? 0), ox + CELL / 2, oy + CELL / 2 + 5)
            break
          case 'compartment':
            ctx.fillStyle = '#777'
            ctx.fillRect(ox + 1, oy + 1, CELL - 2, CELL - 2)
            break
          case 'clue':
            ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'left'
            ctx.fillText(`Code: ${obj.value}`, ox, oy + CELL / 2)
            break
        }
      }

      // Sequence highlight
      if (room.showSequence && room.sequenceIdx < room.solution.length) {
        const targetVal = room.solution[room.sequenceIdx]
        const highlightObj = room.objects.find(o => (o.kind === 'plate' || o.kind === 'switch') && o.value === targetVal)
        if (highlightObj) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 3
          ctx.strokeRect(highlightObj.x * CELL - 2, highlightObj.y * CELL - 2, CELL + 4, CELL + 4)
        }
      }

      // Draw players
      for (const p of st.players) {
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.cx * CELL + CELL / 2, p.cy * CELL + CELL / 2, CELL / 2 - 4, 0, Math.PI * 2)
        ctx.fill()
        // Held item indicator
        if (p.heldItem) {
          ctx.fillStyle = '#f1c40f'
          ctx.beginPath()
          ctx.arc(p.cx * CELL + CELL - 4, p.cy * CELL + 4, 5, 0, Math.PI * 2)
          ctx.fill()
        }
        // Name
        ctx.fillStyle = '#fff'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(p.name, p.cx * CELL + CELL / 2, p.cy * CELL - 4)
      }

      // Timer bar
      const timerPct = room.timer / ROOM_TIME_BASE
      ctx.fillStyle = '#333'
      ctx.fillRect(0, H - 8, W, 8)
      ctx.fillStyle = timerPct > 0.3 ? '#2ecc71' : '#e74c3c'
      ctx.fillRect(0, H - 8, W * timerPct, 8)

      // Room label
      ctx.fillStyle = '#fff'; ctx.font = '14px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`Room ${st.roomIndex + 1}/${st.totalRooms} — ${room.puzzle}`, 10, H - 14)

      // Failed overlay
      if (room.failed) {
        ctx.fillStyle = 'rgba(200,0,0,0.4)'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#fff'; ctx.font = '28px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('TIME UP — Restarting…', W / 2, H / 2)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHint(null)
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
        {hud.players.map((p, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className={styles.scoreValue}>🪙{p.coins} 💎{p.gems} ⭐{p.stars}</span>
          </div>
        ))}
        <div className={styles.scoreItem}>
          <span>⏱ {Math.ceil(hud.timer / 1000)}s</span>
          <span>Room {hud.roomIndex + 1}</span>
        </div>
      </div>
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Escape Room canvas"/>
      {hint && (
        <div style={{ position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50)', background: '#333', color: '#f1c40f', padding: '8px 20px', borderRadius: 8, fontSize: 14 }}>
          {hint}
        </div>
      )}
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
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
