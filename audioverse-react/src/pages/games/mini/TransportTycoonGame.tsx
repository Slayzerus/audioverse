/**
 * TransportTycoonGame — transport network building for 1-4 players.
 *
 * Controls:
 *   Keyboard group 0: WASD + Space (select) + E (buy vehicle) + Q (upgrade)
 *   Keyboard group 1: Arrows + Enter (select) + Shift (buy) + Ctrl (upgrade)
 *   Gamepads: Left stick/D-pad + A (select) + X (buy vehicle) + Y (upgrade)
 *
 * Rules:
 *  - Build routes between cities, buy vehicles to haul cargo.
 *  - Vehicles auto-travel routes, earning revenue on delivery.
 *  - VS: compete for most money. Coop: hit shared revenue target.
 *  - Cities grow when well-connected, generating more cargo.
 *
 * Currencies:
 *  - Coins: earned from cargo delivery (revenue).
 *  - Gems: earned from milestone achievements.
 *  - Stars: earned from completing full network connections.
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
const CITY_RADIUS = 15
const CURSOR_SIZE = 10
const VEHICLE_SIZE = 8
const ROUTE_COST_PER_TILE = 100
const VEHICLE_COST = 200
const UPGRADE_COST = 150
const GAME_DURATION_MS = 5 * 60 * 1000
const TICK_MS = 50
const VEHICLE_SPEED = 1.2
const WIN_MONEY = 5000
const COOP_REVENUE_TARGET = 8000
const SELECT_RANGE = 30

// ─── City names ──────────────────────────────────────────────
const CITY_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// ─── Types ───────────────────────────────────────────────────
interface City {
  x: number; y: number
  label: string
  supply: number
  demand: number
  growth: number
}

interface Route {
  from: number; to: number
  owner: number
  distance: number
}

interface Vehicle {
  routeIdx: number
  owner: number
  progress: number     // 0..1 along route
  direction: 1 | -1
  speed: number
  cargo: number
  level: number
  color: string
}

interface Cursor {
  x: number; y: number
  selectedCity: number | null
}

interface PlayerState {
  money: number
  coins: number
  gems: number
  stars: number
  vehicles: number
  routeCount: number
  revenuePerMin: number
  color: string
  name: string
  input: PlayerSlot['input']
  cursor: Cursor
}

interface GameState {
  cities: City[]
  routes: Route[]
  vehicles: Vehicle[]
  players: PlayerState[]
  elapsedMs: number
  gameOver: boolean
  winner: string | null
  mode: string
}

// ─── Helpers ─────────────────────────────────────────────────
function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function generateCities(count: number): City[] {
  const cities: City[] = []
  const margin = 60
  for (let i = 0; i < count; i++) {
    let x: number, y: number, tries = 0
    do {
      x = margin + Math.random() * (W - margin * 2)
      y = margin + Math.random() * (H - margin * 2)
      tries++
    } while (tries < 200 && cities.some(c => dist(c.x, c.y, x, y) < 80))
    cities.push({
      x, y,
      label: CITY_LABELS[i] || `${i}`,
      supply: 2 + Math.floor(Math.random() * 4),
      demand: 2 + Math.floor(Math.random() * 4),
      growth: 1,
    })
  }
  return cities
}

function nearestCity(cx: number, cy: number, cities: City[]): number | null {
  let best = -1, bestD = Infinity
  for (let i = 0; i < cities.length; i++) {
    const d = dist(cx, cy, cities[i].x, cities[i].y)
    if (d < SELECT_RANGE && d < bestD) { bestD = d; best = i }
  }
  return best >= 0 ? best : null
}

function routeExists(routes: Route[], a: number, b: number): boolean {
  return routes.some(r => (r.from === a && r.to === b) || (r.from === b && r.to === a))
}

function initState(players: PlayerSlot[], mode: string, mapCities: number): GameState {
  const cities = generateCities(mapCities)
  const pStates: PlayerState[] = players.map((p, i) => ({
    money: 1000,
    coins: 0, gems: 0, stars: 0,
    vehicles: 0, routeCount: 0, revenuePerMin: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name,
    input: p.input,
    cursor: {
      x: W / 2 + (i - players.length / 2) * 80,
      y: H / 2,
      selectedCity: null,
    },
  }))
  return {
    cities, routes: [], vehicles: [], players: pStates,
    elapsedMs: 0, gameOver: false, winner: null, mode,
  }
}

// ─── Key mappings ────────────────────────────────────────────
interface ActionKey { group: number; action: string }

const ACTION_KEYS = new Map<string, ActionKey>([
  // Group 0 — WASD
  ['w', { group: 0, action: 'up' }],
  ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }],
  ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'select' }],
  ['e', { group: 0, action: 'buy' }],
  ['q', { group: 0, action: 'upgrade' }],
  // Group 1 — Arrows
  ['ArrowUp', { group: 1, action: 'up' }],
  ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }],
  ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'select' }],
  ['Shift', { group: 1, action: 'buy' }],
  ['Control', { group: 1, action: 'upgrade' }],
])

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function TransportTycoonGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mode = config?.gameMode ?? 'vs-tycoon'
  const mapCities = config?.mapSize === 'small' ? 6 : config?.mapSize === 'large' ? 12 : 8
  const startCash = config?.startingCash ?? 1000
  const stateRef = useRef<GameState>(initState(players, mode, mapCities))

  // Apply startingCash override
  useEffect(() => {
    stateRef.current.players.forEach(p => { p.money = startCash })
  }, [startCash])

  const [hud, setHud] = useState<{ money: number; vehicles: number; routes: number; rpm: number; coins: number; gems: number; stars: number; color: string; name: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS)

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Hold key states for smooth movement
  const keysDown = useRef(new Set<string>())

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keysDown.current.add(e.key)
    const onUp = (e: KeyboardEvent) => keysDown.current.delete(e.key)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // One-shot action keys (select / buy / upgrade)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mapping = ACTION_KEYS.get(e.key)
      if (!mapping) return
      if (mapping.action !== 'select' && mapping.action !== 'buy' && mapping.action !== 'upgrade') return
      const st = stateRef.current
      if (st.gameOver) return
      for (const ps of st.players) {
        if (ps.input.type !== 'keyboard') continue
        if ((ps.input as { type: 'keyboard'; group: number }).group !== mapping.group) continue
        handleAction(st, ps, mapping.action)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  // Mount-only effect — deps intentionally empty: handler reads from stateRef (always current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Gamepad one-shot edge detection refs
  const padEdges = useRef<Map<number, { a: boolean; x: boolean; y: boolean }>>(new Map())

  function handleAction(st: GameState, ps: PlayerState, action: string) {
    if (action === 'select') {
      const city = nearestCity(ps.cursor.x, ps.cursor.y, st.cities)
      if (city === null) { ps.cursor.selectedCity = null; return }
      if (ps.cursor.selectedCity === null) {
        ps.cursor.selectedCity = city
      } else {
        const from = ps.cursor.selectedCity
        const to = city
        ps.cursor.selectedCity = null
        if (from === to) return
        if (routeExists(st.routes, from, to)) return
        const d = dist(st.cities[from].x, st.cities[from].y, st.cities[to].x, st.cities[to].y)
        const cost = Math.round((d / 10) * ROUTE_COST_PER_TILE / 10)
        if (ps.money < cost) return
        ps.money -= cost
        st.routes.push({ from, to, owner: st.players.indexOf(ps), distance: d })
        ps.routeCount++
        // Milestone: gems for every 3 routes
        if (ps.routeCount % 3 === 0) ps.gems++
        // Star check: connected all cities?
        checkNetworkCompletion(st, ps)
      }
    } else if (action === 'buy') {
      const city = nearestCity(ps.cursor.x, ps.cursor.y, st.cities)
      if (city === null) return
      const ownerIdx = st.players.indexOf(ps)
      const playerRoutes = st.routes.map((r, i) => ({ ...r, idx: i })).filter(r => r.owner === ownerIdx)
      const routeAtCity = playerRoutes.find(r => r.from === city || r.to === city)
      if (!routeAtCity) return
      if (ps.money < VEHICLE_COST) return
      ps.money -= VEHICLE_COST
      st.vehicles.push({
        routeIdx: routeAtCity.idx,
        owner: ownerIdx,
        progress: 0,
        direction: 1,
        speed: VEHICLE_SPEED,
        cargo: 1,
        level: 1,
        color: ps.color,
      })
      ps.vehicles++
      // Gem for first vehicle
      if (ps.vehicles === 1) ps.gems++
    } else if (action === 'upgrade') {
      const ownerIdx = st.players.indexOf(ps)
      const v = st.vehicles.find(v => v.owner === ownerIdx && v.level < 3)
      if (!v) return
      if (ps.money < UPGRADE_COST) return
      ps.money -= UPGRADE_COST
      v.level++
      v.speed *= 1.4
      v.cargo++
      if (v.level === 3) ps.gems++
    }
  }

  function checkNetworkCompletion(st: GameState, ps: PlayerState) {
    const ownerIdx = st.players.indexOf(ps)
    const myRoutes = st.routes.filter(r => r.owner === ownerIdx)
    // Build adjacency and check if all cities are reachable
    const adj = new Map<number, Set<number>>()
    for (const r of myRoutes) {
      if (!adj.has(r.from)) adj.set(r.from, new Set())
      if (!adj.has(r.to)) adj.set(r.to, new Set())
      adj.get(r.from)!.add(r.to)
      adj.get(r.to)!.add(r.from)
    }
    if (adj.size < st.cities.length) return
    // BFS from first city
    const visited = new Set<number>()
    const queue = [0]
    visited.add(0)
    while (queue.length > 0) {
      const cur = queue.shift()!
      for (const nb of adj.get(cur) ?? []) {
        if (!visited.has(nb)) { visited.add(nb); queue.push(nb) }
      }
    }
    if (visited.size === st.cities.length) {
      ps.stars++
    }
  }

  // ─── Game loop ─────────────────────────────────────────────
  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>

    function tick() {
      if (pauseRef.current) { timerId = setTimeout(tick, TICK_MS); return }
      const st = stateRef.current
      if (st.gameOver) return

      st.elapsedMs += TICK_MS

      // Cursor movement — keyboard
      const cursorSpeed = 4
      for (const ps of st.players) {
        if (ps.input.type === 'keyboard') {
          const g = (ps.input as { type: 'keyboard'; group: number }).group
          const keys = keysDown.current
          if (g === 0) {
            if (keys.has('w')) ps.cursor.y = Math.max(0, ps.cursor.y - cursorSpeed)
            if (keys.has('s')) ps.cursor.y = Math.min(H, ps.cursor.y + cursorSpeed)
            if (keys.has('a')) ps.cursor.x = Math.max(0, ps.cursor.x - cursorSpeed)
            if (keys.has('d')) ps.cursor.x = Math.min(W, ps.cursor.x + cursorSpeed)
          } else if (g === 1) {
            if (keys.has('ArrowUp')) ps.cursor.y = Math.max(0, ps.cursor.y - cursorSpeed)
            if (keys.has('ArrowDown')) ps.cursor.y = Math.min(H, ps.cursor.y + cursorSpeed)
            if (keys.has('ArrowLeft')) ps.cursor.x = Math.max(0, ps.cursor.x - cursorSpeed)
            if (keys.has('ArrowRight')) ps.cursor.x = Math.min(W, ps.cursor.x + cursorSpeed)
          }
        }
      }

      // Cursor movement + actions — gamepad
      for (const ps of st.players) {
        if (ps.input.type !== 'gamepad') continue
        const gIdx = (ps.input as { type: 'gamepad'; padIndex: number }).padIndex
        const gp = padsRef.current.find(p => p.index === gIdx)
        if (!gp) continue
        if (gp.up) ps.cursor.y = Math.max(0, ps.cursor.y - cursorSpeed)
        if (gp.down) ps.cursor.y = Math.min(H, ps.cursor.y + cursorSpeed)
        if (gp.left) ps.cursor.x = Math.max(0, ps.cursor.x - cursorSpeed)
        if (gp.right) ps.cursor.x = Math.min(W, ps.cursor.x + cursorSpeed)
        // Edge detection for actions
        const prev = padEdges.current.get(gIdx) ?? { a: false, x: false, y: false }
        if (gp.a && !prev.a) handleAction(st, ps, 'select')
        if (gp.x && !prev.x) handleAction(st, ps, 'buy')
        if (gp.y && !prev.y) handleAction(st, ps, 'upgrade')
        padEdges.current.set(gIdx, { a: gp.a, x: gp.x, y: gp.y })
      }

      // Move vehicles
      for (const v of st.vehicles) {
        const route = st.routes[v.routeIdx]
        if (!route) continue
        const step = (v.speed * TICK_MS) / (route.distance * 10)
        v.progress += step * v.direction
        if (v.progress >= 1) {
          v.progress = 1; v.direction = -1
          deliverCargo(st, v, route.to)
        } else if (v.progress <= 0) {
          v.progress = 0; v.direction = 1
          deliverCargo(st, v, route.from)
        }
      }

      // City growth
      if (st.elapsedMs % 5000 < TICK_MS) {
        for (let i = 0; i < st.cities.length; i++) {
          const connections = st.routes.filter(r => r.from === i || r.to === i).length
          if (connections > 0) {
            st.cities[i].growth = Math.min(3, 1 + connections * 0.2)
            st.cities[i].supply = Math.min(10, st.cities[i].supply + 0.3 * connections)
          }
        }
      }

      // Win conditions
      const remaining = GAME_DURATION_MS - st.elapsedMs
      setTimeLeft(Math.max(0, remaining))

      if (st.mode === 'coop-network') {
        const totalCoins = st.players.reduce((s, p) => s + p.coins, 0)
        if (totalCoins >= COOP_REVENUE_TARGET) {
          st.gameOver = true
          st.winner = t('miniGames.teamWins', 'Team Wins!')
        }
      } else {
        // VS / free-build
        const rich = st.players.find(p => p.money + p.coins >= WIN_MONEY)
        if (rich) {
          st.gameOver = true
          st.winner = rich.name
        }
      }

      if (remaining <= 0 && !st.gameOver) {
        st.gameOver = true
        if (st.mode === 'coop-network') {
          const totalCoins = st.players.reduce((s, p) => s + p.coins, 0)
          st.winner = totalCoins >= COOP_REVENUE_TARGET
            ? t('miniGames.teamWins', 'Team Wins!')
            : t('miniGames.timesUp', "Time's Up!")
        } else {
          const best = [...st.players].sort((a, b) => (b.money + b.coins) - (a.money + a.coins))[0]
          st.winner = best.name
        }
      }

      // Update HUD
      setHud(st.players.map(p => ({
        money: Math.round(p.money), vehicles: p.vehicles, routes: p.routeCount,
        rpm: Math.round(p.revenuePerMin), coins: p.coins, gems: p.gems, stars: p.stars,
        color: p.color, name: p.name,
      })))

      if (st.gameOver) {
        setGameOver(true)
        setWinner(st.winner)
        return
      }
      timerId = setTimeout(tick, TICK_MS)
    }

    timerId = setTimeout(tick, TICK_MS)
    return () => clearTimeout(timerId)
  // Mount-only effect — deps intentionally empty: game tick loop reads all state from stateRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function deliverCargo(st: GameState, v: Vehicle, cityIdx: number) {
    const route = st.routes[v.routeIdx]
    if (!route) return
    const ps = st.players[v.owner]
    if (!ps) return
    const revenue = Math.round(route.distance * v.cargo * 0.1)
    ps.money += revenue
    ps.coins += revenue
    // Track revenue/min approximation
    const mins = Math.max(1, st.elapsedMs / 60000)
    ps.revenuePerMin = Math.round(ps.coins / mins)
    // Supply/demand interaction
    const city = st.cities[cityIdx]
    if (city) city.demand = Math.max(1, city.demand - 0.1)
  }

  // ─── Render ────────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      canvas.width = W
      canvas.height = H

      // Background — terrain
      ctx.fillStyle = '#1a2a1a'
      ctx.fillRect(0, 0, W, H)

      // Subtle grid
      ctx.strokeStyle = '#223322'
      ctx.lineWidth = 0.5
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke()
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
      }

      // Routes
      for (const route of st.routes) {
        const from = st.cities[route.from]
        const to = st.cities[route.to]
        const color = st.players[route.owner]?.color ?? '#666'
        ctx.strokeStyle = color
        ctx.lineWidth = 3
        ctx.globalAlpha = 0.7
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
        ctx.globalAlpha = 1
        // Rail ties
        const dx = to.x - from.x, dy = to.y - from.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const nx = -dy / len, ny = dx / len
        for (let t = 0.1; t < 1; t += 20 / len) {
          const px = from.x + dx * t, py = from.y + dy * t
          ctx.strokeStyle = color
          ctx.lineWidth = 1
          ctx.globalAlpha = 0.3
          ctx.beginPath()
          ctx.moveTo(px + nx * 5, py + ny * 5)
          ctx.lineTo(px - nx * 5, py - ny * 5)
          ctx.stroke()
          ctx.globalAlpha = 1
        }
      }

      // Cities
      for (let i = 0; i < st.cities.length; i++) {
        const c = st.cities[i]
        const r = CITY_RADIUS * c.growth
        // Glow
        ctx.shadowColor = '#4a8'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#3a7a4a'
        ctx.beginPath()
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        // Border
        ctx.strokeStyle = '#6c6'
        ctx.lineWidth = 2
        ctx.stroke()
        // Label
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${12 * c.growth}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(c.label, c.x, c.y)
        // Supply indicator
        ctx.fillStyle = '#fc0'
        ctx.font = '9px sans-serif'
        ctx.fillText(`📦${Math.round(c.supply)}`, c.x, c.y - r - 8)
      }

      // Vehicles
      for (const v of st.vehicles) {
        const route = st.routes[v.routeIdx]
        if (!route) continue
        const from = st.cities[route.from]
        const to = st.cities[route.to]
        const px = from.x + (to.x - from.x) * v.progress
        const py = from.y + (to.y - from.y) * v.progress
        const sz = VEHICLE_SIZE + v.level * 2
        ctx.fillStyle = v.color
        ctx.fillRect(px - sz / 2, py - sz / 2, sz, sz)
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 1
        ctx.strokeRect(px - sz / 2, py - sz / 2, sz, sz)
      }

      // Player cursors
      for (const ps of st.players) {
        ctx.strokeStyle = ps.color
        ctx.lineWidth = 2
        // Crosshair
        ctx.beginPath()
        ctx.moveTo(ps.cursor.x - CURSOR_SIZE, ps.cursor.y)
        ctx.lineTo(ps.cursor.x + CURSOR_SIZE, ps.cursor.y)
        ctx.moveTo(ps.cursor.x, ps.cursor.y - CURSOR_SIZE)
        ctx.lineTo(ps.cursor.x, ps.cursor.y + CURSOR_SIZE)
        ctx.stroke()
        // Selection highlight
        if (ps.cursor.selectedCity !== null) {
          const sc = st.cities[ps.cursor.selectedCity]
          if (sc) {
            ctx.strokeStyle = ps.color
            ctx.lineWidth = 3
            ctx.setLineDash([4, 4])
            ctx.beginPath()
            ctx.arc(sc.x, sc.y, CITY_RADIUS * sc.growth + 6, 0, Math.PI * 2)
            ctx.stroke()
            ctx.setLineDash([])
            // Line from selected city to cursor
            ctx.strokeStyle = ps.color
            ctx.lineWidth = 1
            ctx.globalAlpha = 0.5
            ctx.beginPath()
            ctx.moveTo(sc.x, sc.y)
            ctx.lineTo(ps.cursor.x, ps.cursor.y)
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      // Timer
      const secs = Math.ceil(Math.max(0, GAME_DURATION_MS - st.elapsedMs) / 1000)
      const mm = String(Math.floor(secs / 60)).padStart(2, '0')
      const ss = String(secs % 60).padStart(2, '0')
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 16px monospace'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText(`${mm}:${ss}`, W - 10, 10)

      // Border
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, mode, mapCities)
    stateRef.current.players.forEach(p => { p.money = startCash })
    setGameOver(false)
    setWinner(null)
    setHud([])
    setTimeLeft(GAME_DURATION_MS)
  }, [players, mode, mapCities, startCash])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  const formatTime = (ms: number) => {
    const s = Math.ceil(ms / 1000)
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.scoreboard}>
        {hud.map((h, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: h.color }} />
            <span>{h.name}</span>
            <span className={styles.scoreValue} title="Money">${h.money}</span>
            <span className={styles.scoreValue} title="Coins">🪙{h.coins}</span>
            <span className={styles.scoreValue} title="Gems">💎{h.gems}</span>
            <span className={styles.scoreValue} title="Stars">⭐{h.stars}</span>
            <span className={styles.scoreValue} title="Vehicles">🚐{h.vehicles}</span>
            <span className={styles.scoreValue} title="Routes">🛤️{h.routes}</span>
          </div>
        ))}
        <div className={styles.scoreItem}>
          <span>⏱️ {formatTime(timeLeft)}</span>
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Transport Tycoon canvas"/>

      {isPaused && (
        <PauseMenu onResume={resume} onBack={onBack} players={players} />
      )}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {hud.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '1rem' }}>
              {hud.map((h, i) => (
                <div key={i} style={{ color: h.color }}>
                  {h.name}: ${h.money + h.coins} | 🪙{h.coins} 💎{h.gems} ⭐{h.stars}
                </div>
              ))}
            </div>
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
