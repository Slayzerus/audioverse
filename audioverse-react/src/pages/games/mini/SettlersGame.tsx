/**
 * SettlersGame — Settlers-style indirect-control settlement builder for 1-4 players.
 *
 * Place buildings and set priorities — workers (small AI dots) do everything
 * automatically.  You do NOT directly control units.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D cursor, E cycle building, Space place, Q toggle priority
 *   Group 1: Arrow keys cursor, Shift cycle, Enter place, Ctrl toggle priority
 * Gamepads: D-pad cursor, X cycle building, A place, Y toggle priority
 *
 * Resources: wood (forests), stone (mountains), food (farms/mills),
 *            soldiers (barracks).
 * Currencies: coins (trade goods), gems (rare resources),
 *             stars (settlement milestones).
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
const CW = 800, CH = 600, CELL = 16
const COLS = 50, ROWS = 35, HUD_H = 40
const TICK_MS = 150
const WORK_TICKS = 8
const BARRACKS_INTERVAL = 30
const MAX_WORKERS = 20

// Terrain
const T_PLAINS = 0, T_FOREST = 1, T_MOUNTAIN = 2, T_WATER = 3
const TERRAIN_COLORS = ['#4a7c3f', '#2d5a1e', '#7a7a7a', '#2980b9']

// Building types
const B_HQ = 0, B_WOODCUTTER = 1, B_STONECUTTER = 2, B_FARM = 3
const B_BARRACKS = 4, B_MILL = 5, B_ROAD = 6

const PLACEABLE = [B_ROAD, B_WOODCUTTER, B_STONECUTTER, B_FARM, B_BARRACKS, B_MILL]
const B_LABELS = ['HQ', 'Woodcutter', 'Stonecutter', 'Farm', 'Barracks', 'Mill', 'Road']
const B_COLORS = ['#fff', '#8B4513', '#888', '#DAA520', '#c0392b', '#D2B48C', '#666']
const B_HP = [50, 10, 10, 8, 15, 10, 5]
const B_COST: Record<number, [number, number]> = {
  [B_WOODCUTTER]: [2, 1], [B_STONECUTTER]: [1, 2], [B_FARM]: [3, 1],
  [B_BARRACKS]: [2, 3], [B_MILL]: [4, 2], [B_ROAD]: [0, 1],
}

// ─── Interfaces ──────────────────────────────────────────────
interface Building { type: number; x: number; y: number; owner: number; hp: number; maxHp: number; priority: boolean; prodTimer: number }
interface Worker { x: number; y: number; owner: number; carrying: number; state: number; workLeft: number; path: number[]; pi: number; bldgIdx: number }
interface SoldierUnit { x: number; y: number; owner: number; hp: number }
interface PState {
  wood: number; stone: number; food: number; soldiers: number
  coins: number; gems: number; stars: number
  cx: number; cy: number; selIdx: number
  deliveries: number; buildCount: number
}
interface GState {
  terrain: number[][]; buildings: Building[]; workers: Worker[]; soldiers: SoldierUnit[]
  ps: PState[]; over: boolean; winner: number | null; tick: number; mode: string
}

// ─── HQ spawn positions ─────────────────────────────────────
const HQ_POS = [
  { x: 5, y: 5 }, { x: COLS - 6, y: ROWS - 6 },
  { x: COLS - 6, y: 5 }, { x: 5, y: ROWS - 6 },
]

// ─── Terrain generation ─────────────────────────────────────
function genTerrain(n: number): number[][] {
  const t: number[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T_PLAINS))
  const clusters: [number, number, number, number][] = []
  for (let i = 0; i < 8; i++) clusters.push([T_FOREST, 3 + Math.floor(Math.random() * (COLS - 6)), 3 + Math.floor(Math.random() * (ROWS - 6)), 3 + Math.floor(Math.random() * 4)])
  for (let i = 0; i < 5; i++) clusters.push([T_MOUNTAIN, 3 + Math.floor(Math.random() * (COLS - 6)), 3 + Math.floor(Math.random() * (ROWS - 6)), 2 + Math.floor(Math.random() * 3)])
  for (let i = 0; i < 3; i++) clusters.push([T_WATER, 3 + Math.floor(Math.random() * (COLS - 6)), 3 + Math.floor(Math.random() * (ROWS - 6)), 2 + Math.floor(Math.random() * 2)])
  for (const [type, cx, cy, size] of clusters) {
    for (let dy = -size; dy <= size; dy++) for (let dx = -size; dx <= size; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && Math.abs(dx) + Math.abs(dy) <= size + Math.floor(Math.random() * 2))
        t[ny][nx] = type
    }
  }
  // Clear terrain around HQ positions
  for (let p = 0; p < n; p++) {
    const h = HQ_POS[p]
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const nx = h.x + dx, ny = h.y + dy
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) t[ny][nx] = T_PLAINS
    }
  }
  return t
}

// ─── BFS pathfinding along roads / buildings ─────────────────
function findPath(buildings: Building[], fx: number, fy: number, tx: number, ty: number, owner: number): number[] {
  const walkable = new Set<number>()
  for (const b of buildings) if (b.owner === owner && b.hp > 0) walkable.add(b.y * COLS + b.x)
  const start = fy * COLS + fx, end = ty * COLS + tx
  walkable.add(start)
  walkable.add(end)
  if (start === end) return [start]
  const visited = new Set<number>([start])
  const prev = new Map<number, number>()
  const queue = [start]
  while (queue.length > 0) {
    const cur = queue.shift()!
    if (cur === end) {
      const p: number[] = []
      let c = end
      while (c !== start) { p.unshift(c); c = prev.get(c)! }
      p.unshift(start)
      return p
    }
    const cx = cur % COLS, cy = (cur - cx) / COLS
    for (const [ddx, ddy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cx + ddx, ny = cy + ddy
      if (nx < 0 || nx >= COLS || ny < 0 || ny >= ROWS) continue
      const nk = ny * COLS + nx
      if (visited.has(nk) || !walkable.has(nk)) continue
      visited.add(nk)
      prev.set(nk, cur)
      queue.push(nk)
    }
  }
  return []
}

// ─── Helpers ─────────────────────────────────────────────────
function nearTerrain(terrain: number[][], x: number, y: number, type: number): boolean {
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
    const nx = x + dx, ny = y + dy
    if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && terrain[ny][nx] === type) return true
  }
  return false
}

function playerByGroup(players: PlayerSlot[], group: number): number {
  return players.findIndex(p => p.input.type === 'keyboard' && p.input.group === group)
}

function doAction(st: GState, pIdx: number, action: string, players: PlayerSlot[]) {
  const p = st.ps[pIdx]
  if (!p) return
  if (action === 'cycle') {
    p.selIdx = (p.selIdx + 1) % PLACEABLE.length
  } else if (action === 'place') {
    const bType = PLACEABLE[p.selIdx]
    const cost = B_COST[bType]
    if (!cost || p.wood < cost[0] || p.stone < cost[1]) return
    if (st.terrain[p.cy]?.[p.cx] === T_WATER) return
    if (st.buildings.some(b => b.x === p.cx && b.y === p.cy && b.hp > 0)) return
    if (bType === B_WOODCUTTER && !nearTerrain(st.terrain, p.cx, p.cy, T_FOREST)) return
    if (bType === B_STONECUTTER && !nearTerrain(st.terrain, p.cx, p.cy, T_MOUNTAIN)) return
    if (bType === B_MILL && !st.buildings.some(b => b.type === B_FARM && b.owner === pIdx && Math.abs(b.x - p.cx) + Math.abs(b.y - p.cy) <= 3)) return
    // Must be adjacent to own infrastructure
    if (!st.buildings.some(b => b.owner === pIdx && b.hp > 0 && Math.abs(b.x - p.cx) + Math.abs(b.y - p.cy) === 1)) return
    p.wood -= cost[0]; p.stone -= cost[1]
    st.buildings.push({ type: bType, x: p.cx, y: p.cy, owner: pIdx, hp: B_HP[bType], maxHp: B_HP[bType], priority: false, prodTimer: 0 })
    p.buildCount++
    // Spawn worker for production buildings
    if (bType !== B_ROAD && st.workers.filter(w => w.owner === pIdx).length < MAX_WORKERS) {
      const hq = st.buildings.find(b => b.type === B_HQ && b.owner === pIdx)
      if (hq) st.workers.push({ x: hq.x, y: hq.y, owner: pIdx, carrying: -1, state: 0, workLeft: 0, path: [], pi: 0, bldgIdx: -1 })
    }
  } else if (action === 'priority') {
    const b = st.buildings.find(bl => bl.x === p.cx && bl.y === p.cy && bl.owner === pIdx)
    if (b) b.priority = !b.priority
  }
  void players // referenced for type-check only
}

// ─── Init game state ─────────────────────────────────────────
function initState(players: PlayerSlot[], config: GameConfig): GState {
  const n = players.length
  const terrain = genTerrain(n)
  const buildings: Building[] = []
  const workers: Worker[] = []
  const ps: PState[] = []
  const mul = config.startingResources === 'high' ? 2 : config.startingResources === 'low' ? 0.5 : 1
  for (let i = 0; i < n; i++) {
    const h = HQ_POS[i]
    buildings.push({ type: B_HQ, x: h.x, y: h.y, owner: i, hp: B_HP[B_HQ], maxHp: B_HP[B_HQ], priority: false, prodTimer: 0 })
    // Starting roads around HQ
    for (const [dx, dy] of [[1, 0], [2, 0], [-1, 0], [0, 1], [0, 2], [0, -1]]) {
      buildings.push({ type: B_ROAD, x: h.x + dx, y: h.y + dy, owner: i, hp: B_HP[B_ROAD], maxHp: B_HP[B_ROAD], priority: false, prodTimer: 0 })
    }
    for (let w = 0; w < 3; w++) {
      workers.push({ x: h.x, y: h.y, owner: i, carrying: -1, state: 0, workLeft: 0, path: [], pi: 0, bldgIdx: -1 })
    }
    ps.push({ wood: Math.round(20 * mul), stone: Math.round(15 * mul), food: Math.round(10 * mul),
      soldiers: 0, coins: 0, gems: 0, stars: 0, cx: h.x, cy: h.y, selIdx: 0, deliveries: 0, buildCount: 0 })
  }
  return { terrain, buildings, workers, soldiers: [], ps, over: false, winner: null, tick: 0, mode: config.gameMode || 'build' }
}

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function SettlersGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GState>(initState(players, config))
  const [hudData, setHudData] = useState<PState[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const prevBtns = useRef<Map<number, Set<string>>>(new Map())

  // ── Keyboard input ─────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.over) return
      const k = e.key
      // Group 0: WASD + E / Space / Q
      const p0 = playerByGroup(players, 0)
      if (p0 >= 0 && p0 < st.ps.length) {
        const p = st.ps[p0]
        if (k === 'w' || k === 'W') { if (p.cy > 0) p.cy--; return }
        if (k === 's' || k === 'S') { if (p.cy < ROWS - 1) p.cy++; return }
        if (k === 'a' || k === 'A') { if (p.cx > 0) p.cx--; return }
        if (k === 'd' || k === 'D') { if (p.cx < COLS - 1) p.cx++; return }
        if (k === 'e' || k === 'E') { doAction(st, p0, 'cycle', players); return }
        if (k === ' ') { e.preventDefault(); doAction(st, p0, 'place', players); return }
        if (k === 'q' || k === 'Q') { doAction(st, p0, 'priority', players); return }
      }
      // Group 1: Arrows + Shift / Enter / Ctrl
      const p1 = playerByGroup(players, 1)
      if (p1 >= 0 && p1 < st.ps.length) {
        const p = st.ps[p1]
        if (k === 'ArrowUp') { if (p.cy > 0) p.cy--; return }
        if (k === 'ArrowDown') { if (p.cy < ROWS - 1) p.cy++; return }
        if (k === 'ArrowLeft') { if (p.cx > 0) p.cx--; return }
        if (k === 'ArrowRight') { if (p.cx < COLS - 1) p.cx++; return }
        if (k === 'Shift') { doAction(st, p1, 'cycle', players); return }
        if (k === 'Enter') { doAction(st, p1, 'place', players); return }
        if (k === 'Control') { doAction(st, p1, 'priority', players); return }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [players])

  // ── Gamepad action polling (edge-detected A/X/Y) ───────────
  useEffect(() => {
    let raf = 0
    function poll() {
      const st = stateRef.current
      if (!st.over && !pauseRef.current) {
        const cur = padsRef.current
        for (const gp of cur) {
          const pIdx = players.findIndex(p => p.input.type === 'gamepad' && p.input.padIndex === gp.index)
          if (pIdx < 0 || pIdx >= st.ps.length) continue
          const prev = prevBtns.current.get(gp.index) || new Set<string>()
          const now = new Set<string>()
          if (gp.a) now.add('a')
          if (gp.x) now.add('x')
          if (gp.y) now.add('y')
          if (now.has('a') && !prev.has('a')) doAction(st, pIdx, 'place', players)
          if (now.has('x') && !prev.has('x')) doAction(st, pIdx, 'cycle', players)
          if (now.has('y') && !prev.has('y')) doAction(st, pIdx, 'priority', players)
          prevBtns.current.set(gp.index, now)
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [players])

  // ── Game tick ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.over) return
      st.tick++

      // Gamepad cursor movement (held = move each tick)
      for (const gp of padsRef.current) {
        const pIdx = players.findIndex(p => p.input.type === 'gamepad' && p.input.padIndex === gp.index)
        if (pIdx < 0 || pIdx >= st.ps.length) continue
        const p = st.ps[pIdx]
        if (gp.up && p.cy > 0) p.cy--
        if (gp.down && p.cy < ROWS - 1) p.cy++
        if (gp.left && p.cx > 0) p.cx--
        if (gp.right && p.cx < COLS - 1) p.cx++
      }

      // --- Worker AI ---
      for (const w of st.workers) {
        const ps = st.ps[w.owner]
        if (!ps) continue
        if (w.state === 0) {
          // Find a production building to serve (prioritised first)
          const prods = st.buildings
            .filter(b => b.owner === w.owner && b.hp > 0 && b.type !== B_HQ && b.type !== B_ROAD && b.type !== B_BARRACKS)
            .sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0))
          for (const b of prods) {
            if (b.type === B_WOODCUTTER && !nearTerrain(st.terrain, b.x, b.y, T_FOREST)) continue
            if (b.type === B_STONECUTTER && !nearTerrain(st.terrain, b.x, b.y, T_MOUNTAIN)) continue
            const bi = st.buildings.indexOf(b)
            if (st.workers.filter(wk => wk.bldgIdx === bi && wk !== w && wk.state !== 0).length >= 2) continue
            const path = findPath(st.buildings, w.x, w.y, b.x, b.y, w.owner)
            if (path.length > 0) { w.path = path; w.pi = 0; w.state = 1; w.bldgIdx = bi; break }
          }
        } else if (w.state === 1) {
          // Walk to building
          if (w.pi < w.path.length - 1) { w.pi++; w.x = w.path[w.pi] % COLS; w.y = (w.path[w.pi] - w.x) / COLS }
          if (w.pi >= w.path.length - 1) { w.state = 2; w.workLeft = WORK_TICKS }
        } else if (w.state === 2) {
          // Working
          w.workLeft--
          if (w.workLeft <= 0) {
            const b = st.buildings[w.bldgIdx]
            if (b) {
              if (b.type === B_WOODCUTTER) w.carrying = 0
              else if (b.type === B_STONECUTTER) w.carrying = 1
              else w.carrying = 2 // farm / mill → food
              // Mill doubles output
              if (b.type === B_MILL) { ps.food++ }
            }
            const hq = st.buildings.find(bh => bh.owner === w.owner && bh.type === B_HQ && bh.hp > 0)
            if (hq) {
              const path = findPath(st.buildings, w.x, w.y, hq.x, hq.y, w.owner)
              if (path.length > 0) { w.path = path; w.pi = 0; w.state = 3 }
              else { w.state = 0; w.carrying = -1; w.bldgIdx = -1 }
            } else { w.state = 0; w.carrying = -1; w.bldgIdx = -1 }
          }
        } else if (w.state === 3) {
          // Walk to HQ
          if (w.pi < w.path.length - 1) { w.pi++; w.x = w.path[w.pi] % COLS; w.y = (w.path[w.pi] - w.x) / COLS }
          if (w.pi >= w.path.length - 1) {
            if (w.carrying === 0) ps.wood++
            else if (w.carrying === 1) ps.stone++
            else if (w.carrying === 2) ps.food++
            w.carrying = -1
            ps.deliveries++
            ps.coins++
            if (ps.deliveries % 3 === 0) ps.gems++
            if ([10, 25, 50, 100].includes(ps.deliveries)) ps.stars++
            w.state = 0; w.bldgIdx = -1
          }
        }
      }

      // --- Barracks auto-produce soldiers ---
      for (const b of st.buildings) {
        if (b.type !== B_BARRACKS || b.hp <= 0) continue
        b.prodTimer++
        const ps = st.ps[b.owner]
        if (b.prodTimer >= BARRACKS_INTERVAL && ps && ps.food >= 2) {
          ps.food -= 2; ps.soldiers++
          st.soldiers.push({ x: b.x, y: b.y, owner: b.owner, hp: 5 })
          b.prodTimer = 0
        }
      }

      // --- Soldier AI: move + attack ---
      for (const s of st.soldiers) {
        if (s.hp <= 0) continue
        let tgt: Building | null = null, minD = Infinity
        for (const b of st.buildings) {
          if (b.owner === s.owner || b.hp <= 0) continue
          const d = Math.abs(b.x - s.x) + Math.abs(b.y - s.y)
          if (d < minD) { minD = d; tgt = b }
        }
        if (tgt) {
          if (minD <= 1) {
            tgt.hp--
            if (tgt.hp <= 0 && tgt.type === B_HQ) st.ps[s.owner].stars += 5
          } else {
            if (tgt.x > s.x) s.x++; else if (tgt.x < s.x) s.x--
            else if (tgt.y > s.y) s.y++; else if (tgt.y < s.y) s.y--
          }
        }
        // Attack enemy workers in range
        for (const ew of st.workers) {
          if (ew.owner !== s.owner && Math.abs(ew.x - s.x) + Math.abs(ew.y - s.y) <= 1) {
            // Remove worker
            ew.state = -1
          }
        }
      }
      st.soldiers = st.soldiers.filter(s => s.hp > 0)
      st.workers = st.workers.filter(w => (w.state as number) !== -1)

      // --- Milestone stars ---
      for (const p of st.ps) {
        if (p.buildCount >= 1) p.stars = Math.max(p.stars, 1)
        if (p.buildCount >= 5) p.stars = Math.max(p.stars, 2)
        if (p.buildCount >= 10) p.stars = Math.max(p.stars, 3)
      }

      // --- Win conditions ---
      if (st.mode === 'vs-conquest' && players.length > 1) {
        const alive = st.buildings.filter(b => b.type === B_HQ && b.hp > 0)
        if (alive.length <= 1) { st.over = true; st.winner = alive.length === 1 ? alive[0].owner : null }
      } else if (st.mode === 'coop-settlement') {
        const total = st.ps.reduce((s, p) => s + p.wood + p.stone + p.food, 0)
        if (total >= 200) { st.over = true; st.winner = -1 }
      } else if (st.mode === 'build') {
        if (st.ps.some(p => p.stars >= 10)) { st.over = true; st.winner = st.ps.findIndex(p => p.stars >= 10) }
      }

      setHudData(st.ps.map(p => ({ ...p })))
      if (st.over) {
        setGameOver(true)
        if (st.winner != null && st.winner >= 0) setWinner(players[st.winner]?.name ?? `Player ${st.winner + 1}`)
        else if (st.winner === -1) setWinner(t('miniGames.coopWin', 'Everyone'))
      }
    }, TICK_MS)
    return () => clearInterval(timer)
  }, [players, t])

  // ── Canvas rendering ───────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = CW; canvas.height = CH

      // Terrain
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        ctx.fillStyle = TERRAIN_COLORS[st.terrain[y][x]]
        ctx.fillRect(x * CELL, HUD_H + y * CELL, CELL, CELL)
      }

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= COLS; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, HUD_H); ctx.lineTo(x * CELL, HUD_H + ROWS * CELL); ctx.stroke() }
      for (let y = 0; y <= ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, HUD_H + y * CELL); ctx.lineTo(CW, HUD_H + y * CELL); ctx.stroke() }

      // Buildings
      for (const b of st.buildings) {
        if (b.hp <= 0 && b.type !== B_HQ) continue
        const px = b.x * CELL, py = HUD_H + b.y * CELL
        const pc = PLAYER_COLORS[b.owner] || '#fff'
        if (b.type === B_HQ) {
          ctx.fillStyle = b.hp > 0 ? pc : '#333'
          ctx.fillRect(px - 4, py - 4, 24, 24)
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(px - 4, py - 4, 24, 24)
          ctx.fillStyle = '#fff'; ctx.font = 'bold 8px monospace'; ctx.fillText('HQ', px, py + 10)
        } else if (b.type === B_ROAD) {
          ctx.fillStyle = '#999'
          ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, 3, 0, Math.PI * 2); ctx.fill()
        } else {
          ctx.fillStyle = B_COLORS[b.type]
          ctx.fillRect(px + 2, py + 2, 12, 12)
          ctx.strokeStyle = pc; ctx.lineWidth = 1; ctx.strokeRect(px + 2, py + 2, 12, 12)
          if (b.priority) { ctx.fillStyle = '#ff0'; ctx.font = 'bold 10px sans-serif'; ctx.fillText('!', px + 5, py) }
        }
      }

      // Workers (tiny colored dots, 3px)
      for (const w of st.workers) {
        ctx.fillStyle = PLAYER_COLORS[w.owner] || '#fff'
        ctx.beginPath()
        ctx.arc(w.x * CELL + CELL / 2, HUD_H + w.y * CELL + CELL / 2, 3, 0, Math.PI * 2)
        ctx.fill()
        // Resource indicator
        if (w.carrying >= 0) {
          ctx.fillStyle = ['#8B4513', '#ccc', '#DAA520'][w.carrying]
          ctx.fillRect(w.x * CELL + CELL / 2 - 1, HUD_H + w.y * CELL + CELL / 2 - 5, 3, 3)
        }
      }

      // Soldiers (diamonds)
      for (const s of st.soldiers) {
        const sx = s.x * CELL + CELL / 2, sy = HUD_H + s.y * CELL + CELL / 2
        ctx.fillStyle = PLAYER_COLORS[s.owner] || '#fff'
        ctx.beginPath()
        ctx.moveTo(sx, sy - 5); ctx.lineTo(sx + 5, sy); ctx.lineTo(sx, sy + 5); ctx.lineTo(sx - 5, sy)
        ctx.closePath(); ctx.fill()
        ctx.strokeStyle = '#c00'; ctx.lineWidth = 1; ctx.stroke()
      }

      // Cursors (one per player)
      for (let i = 0; i < st.ps.length; i++) {
        const p = st.ps[i]
        const blink = Math.floor(Date.now() / 300) % 2 === 0
        ctx.strokeStyle = blink ? (PLAYER_COLORS[i] || '#fff') : '#fff'
        ctx.lineWidth = 2
        ctx.strokeRect(p.cx * CELL, HUD_H + p.cy * CELL, CELL, CELL)
        // Selected building label
        ctx.fillStyle = '#fff'
        ctx.font = '9px monospace'
        ctx.fillText(B_LABELS[PLACEABLE[p.selIdx]], p.cx * CELL, HUD_H + p.cy * CELL - 3)
      }

      // HUD bar
      ctx.fillStyle = 'rgba(0,0,0,0.88)'
      ctx.fillRect(0, 0, CW, HUD_H)
      ctx.textBaseline = 'top'
      const segW = CW / Math.max(st.ps.length, 1)
      for (let i = 0; i < st.ps.length; i++) {
        const p = st.ps[i]
        const x0 = i * segW + 4
        ctx.fillStyle = PLAYER_COLORS[i] || '#fff'
        ctx.font = 'bold 10px monospace'
        ctx.fillText(players[i]?.name || `P${i + 1}`, x0, 2)
        ctx.fillStyle = '#ccc'
        ctx.font = '9px monospace'
        ctx.fillText(`W:${p.wood} S:${p.stone} F:${p.food} Sol:${p.soldiers}`, x0, 14)
        ctx.fillText(`\u{1FA99}${p.coins} \u{1F48E}${p.gems} \u2B50${p.stars}`, x0, 26)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [players])

  // ── Restart ────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHudData([])
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
      {/* Resource HUD (also drawn on canvas, this provides accessible alt) */}
      <div className={styles.scoreboard}>
        {hudData.map((p, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: PLAYER_COLORS[i] }} />
            <span>{players[i]?.name}</span>
            <span className={styles.scoreValue}>🪙{p.coins} 💎{p.gems} ⭐{p.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Settlers canvas"/>

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
