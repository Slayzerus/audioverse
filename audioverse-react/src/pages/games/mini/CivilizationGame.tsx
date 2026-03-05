/**
 * CivilizationGame — 4X strategy mini-game inspired by Civilization.
 *
 * Canvas 800×600, hex-ish grid approximated with offset squares (50 px each).
 * Scrollable map 32×24, viewport 16×12.
 *
 * Controls:
 *   WASD / Arrows / gamepad D-pad — move cursor / scroll
 *   Space / Enter / gamepad A      — select unit/city, move, attack
 *   E / Shift / gamepad X          — build / found city / improve tile
 *   Q / Ctrl / gamepad Y           — next idle unit
 *
 * Victory: Domination (capture all capitals), Science (all 5 techs), Score.
 *
 * Currencies (tracked per player):
 *   gold  (coins)   — from cities & mines
 *   gems  (culture) — border growth
 *   stars (VP)      — victory points
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
const TILE = 50
const MAP_W = 32
const MAP_H = 24
const VIEW_W = 16
const VIEW_H = 12
const CANVAS_W = VIEW_W * TILE // 800
const CANVAS_H = VIEW_H * TILE // 600
const TICK_MS_DEFAULT = 500

// ─── Terrain ─────────────────────────────────────────────────
enum Terrain { Grassland, Forest, Mountain, Desert, Water, Tundra }
const TERRAIN_COLORS: Record<Terrain, string> = {
  [Terrain.Grassland]: '#4a7c3f',
  [Terrain.Forest]:    '#2d5a27',
  [Terrain.Mountain]:  '#888',
  [Terrain.Desert]:    '#d4b96a',
  [Terrain.Water]:     '#2980b9',
  [Terrain.Tundra]:    '#9cc5d8',
}
const TERRAIN_FOOD: Record<Terrain, number> = {
  [Terrain.Grassland]: 2, [Terrain.Forest]: 1, [Terrain.Mountain]: 0,
  [Terrain.Desert]: 0, [Terrain.Water]: 0, [Terrain.Tundra]: 0,
}
const TERRAIN_GOLD: Record<Terrain, number> = {
  [Terrain.Grassland]: 1, [Terrain.Forest]: 0, [Terrain.Mountain]: 2,
  [Terrain.Desert]: 0, [Terrain.Water]: 0, [Terrain.Tundra]: 0,
}

// ─── Tech tree ───────────────────────────────────────────────
const TECHS = ['archery', 'construction', 'currency', 'engineering', 'military'] as const
type TechId = typeof TECHS[number]
const TECH_COST: Record<TechId, number> = {
  archery: 20, construction: 35, currency: 50, engineering: 70, military: 100,
}

// ─── Unit types ──────────────────────────────────────────────
type UnitKind = 'warrior' | 'archer' | 'settler' | 'builder'
const UNIT_STATS: Record<UnitKind, { hp: number; atk: number; range: number; buildTurns: number }> = {
  warrior: { hp: 10, atk: 3, range: 1, buildTurns: 3 },
  archer:  { hp: 7,  atk: 4, range: 2, buildTurns: 4 },
  settler: { hp: 5,  atk: 0, range: 0, buildTurns: 6 },
  builder: { hp: 5,  atk: 0, range: 0, buildTurns: 4 },
}

// ─── Improvement ─────────────────────────────────────────────
type Improvement = 'farm' | 'mine' | 'none'

// ─── Interfaces ──────────────────────────────────────────────
interface Unit {
  id: number
  kind: UnitKind
  owner: number
  x: number; y: number
  hp: number; maxHp: number
  atk: number; range: number
  moved: boolean
}

interface City {
  id: number
  owner: number
  x: number; y: number
  name: string
  population: number
  food: number
  isCapital: boolean
  buildQueue: UnitKind | null
  buildProgress: number
  borderRadius: number
}

interface Tile {
  terrain: Terrain
  improvement: Improvement
  visible: boolean[]   // per player
  explored: boolean[]  // per player
  owner: number        // -1 = none
}

interface PlayerState {
  gold: number
  gems: number
  stars: number
  science: number
  techs: Set<TechId>
  alive: boolean
  color: string
  name: string
  input: PlayerSlot['input']
  isBot: boolean
}

interface CursorState {
  x: number; y: number
  selectedUnit: number | null  // unit id
  selectedCity: number | null  // city id
}

interface GameState {
  map: Tile[][]
  units: Unit[]
  cities: City[]
  players: PlayerState[]
  cursors: CursorState[]
  camX: number; camY: number   // shared camera (Player 1 drives in SP)
  turn: number
  nextUnitId: number
  nextCityId: number
  gameOver: boolean
  winner: number | null
  winCondition: string
  tickMs: number
  paused: boolean
}

// ─── Map generation ──────────────────────────────────────────
function generateMap(numPlayers: number): Tile[][] {
  const map: Tile[][] = []
  for (let y = 0; y < MAP_H; y++) {
    const row: Tile[] = []
    for (let x = 0; x < MAP_W; x++) {
      const r = Math.random()
      let terrain: Terrain
      if (r < 0.30) terrain = Terrain.Grassland
      else if (r < 0.50) terrain = Terrain.Forest
      else if (r < 0.62) terrain = Terrain.Mountain
      else if (r < 0.72) terrain = Terrain.Desert
      else if (r < 0.85) terrain = Terrain.Water
      else terrain = Terrain.Tundra
      row.push({
        terrain,
        improvement: 'none',
        visible: Array(numPlayers).fill(false),
        explored: Array(numPlayers).fill(false),
        owner: -1,
      })
    }
    map.push(row)
  }
  return map
}

// ─── Visibility helpers ──────────────────────────────────────
function resetVisibility(state: GameState) {
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++)
      for (let p = 0; p < state.players.length; p++)
        state.map[y][x].visible[p] = false
}

function revealAround(state: GameState, px: number, py: number, owner: number, radius: number) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = px + dx, ny = py + dy
      if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) {
        state.map[ny][nx].visible[owner] = true
        state.map[ny][nx].explored[owner] = true
      }
    }
  }
}

function updateVisibility(state: GameState) {
  resetVisibility(state)
  for (const u of state.units) revealAround(state, u.x, u.y, u.owner, 2)
  for (const c of state.cities) revealAround(state, c.x, c.y, c.owner, c.borderRadius + 1)
}

// ─── Distance ────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.abs(ax - bx) + Math.abs(ay - by)
}

// ─── Init ────────────────────────────────────────────────────
function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const n = players.length
  const map = generateMap(n)
  const tickMs = config.gameSpeed === 'slow' ? 800 : config.gameSpeed === 'fast' ? 300 : TICK_MS_DEFAULT

  const pStates: PlayerState[] = players.map((p, i) => ({
    gold: 10, gems: 0, stars: 0, science: 0,
    techs: new Set<TechId>(),
    alive: true,
    color: p.color || PLAYER_COLORS[i] || '#fff',
    name: p.name,
    input: p.input,
    isBot: p.input.type === 'gamepad' ? false : p.name.startsWith('Bot'),
  }))

  // Starting positions in corners
  const starts = [
    { x: 4, y: 4 }, { x: MAP_W - 5, y: MAP_H - 5 },
    { x: MAP_W - 5, y: 4 }, { x: 4, y: MAP_H - 5 },
  ]

  const units: Unit[] = []
  const cities: City[] = []
  let uid = 1, cid = 1

  const cityNames = ['Alexandria', 'Babylon', 'Constantinople', 'Delhi']

  for (let i = 0; i < n; i++) {
    const sp = starts[i % starts.length]
    // Ensure land
    map[sp.y][sp.x].terrain = Terrain.Grassland
    map[sp.y + 1][sp.x].terrain = Terrain.Grassland
    map[sp.y][sp.x + 1].terrain = Terrain.Grassland

    cities.push({
      id: cid++, owner: i, x: sp.x, y: sp.y,
      name: cityNames[i] || `City ${i + 1}`,
      population: 1, food: 0, isCapital: true,
      buildQueue: null, buildProgress: 0, borderRadius: 2,
    })

    // Warrior
    units.push({
      id: uid++, kind: 'warrior', owner: i,
      x: sp.x + 1, y: sp.y, hp: 10, maxHp: 10, atk: 3, range: 1, moved: false,
    })
    // Settler
    units.push({
      id: uid++, kind: 'settler', owner: i,
      x: sp.x, y: sp.y + 1, hp: 5, maxHp: 5, atk: 0, range: 0, moved: false,
    })

    // Mark territory
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const nx = sp.x + dx, ny = sp.y + dy
        if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) map[ny][nx].owner = i
      }
  }

  const cursors: CursorState[] = players.map((_, i) => ({
    x: starts[i % starts.length].x, y: starts[i % starts.length].y,
    selectedUnit: null, selectedCity: null,
  }))

  const gs: GameState = {
    map, units, cities, players: pStates, cursors,
    camX: Math.max(0, starts[0].x - Math.floor(VIEW_W / 2)),
    camY: Math.max(0, starts[0].y - Math.floor(VIEW_H / 2)),
    turn: 1, nextUnitId: uid, nextCityId: cid,
    gameOver: false, winner: null, winCondition: '',
    tickMs, paused: false,
  }
  updateVisibility(gs)
  return gs
}

// ─── Keyboard groups ─────────────────────────────────────────
interface KBAction { group: number; action: string }
const KB_MAP = new Map<string, KBAction>()
const bindKB = (keys: string[], group: number, action: string) =>
  keys.forEach(k => KB_MAP.set(k, { group, action }))
bindKB(['w', 'W'], 0, 'up');    bindKB(['s', 'S'], 0, 'down')
bindKB(['a', 'A'], 0, 'left');  bindKB(['d', 'D'], 0, 'right')
bindKB([' '], 0, 'select');     bindKB(['e', 'E'], 0, 'action')
bindKB(['q', 'Q'], 0, 'next')
bindKB(['ArrowUp'], 1, 'up');   bindKB(['ArrowDown'], 1, 'down')
bindKB(['ArrowLeft'], 1, 'left'); bindKB(['ArrowRight'], 1, 'right')
bindKB(['Enter'], 1, 'select'); bindKB(['Shift'], 1, 'action')
bindKB(['Control'], 1, 'next')

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function CivilizationGame({ players, config: rawConfig, onBack }: Props) {
  useGameFocusLock();
  const cfg = rawConfig ?? {}
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, cfg))
  const [hud, setHud] = useState({ gold: 0, gems: 0, stars: 0, science: 0, turn: 1, pop: 0, unit: '', tech: '' })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [winCond, setWinCond] = useState('')
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Process input for a player ────────────────────────
  const processAction = useCallback((pIdx: number, action: string) => {
    const st = stateRef.current
    if (st.gameOver || st.paused) return
    const cur = st.cursors[pIdx]
    if (!cur) return

    if (action === 'up')    cur.y = Math.max(0, cur.y - 1)
    if (action === 'down')  cur.y = Math.min(MAP_H - 1, cur.y + 1)
    if (action === 'left')  cur.x = Math.max(0, cur.x - 1)
    if (action === 'right') cur.x = Math.min(MAP_W - 1, cur.x + 1)

    // Keep camera centered on active player cursor (P0 drives camera)
    if (pIdx === 0) {
      st.camX = Math.max(0, Math.min(MAP_W - VIEW_W, cur.x - Math.floor(VIEW_W / 2)))
      st.camY = Math.max(0, Math.min(MAP_H - VIEW_H, cur.y - Math.floor(VIEW_H / 2)))
    }

    if (action === 'select') {
      // If a unit is selected, try to move/attack
      if (cur.selectedUnit != null) {
        const unit = st.units.find(u => u.id === cur.selectedUnit)
        if (unit && !unit.moved) {
          const target = st.units.find(u => u.x === cur.x && u.y === cur.y && u.owner !== pIdx)
          if (target && dist(unit.x, unit.y, cur.x, cur.y) <= unit.range) {
            // Attack
            target.hp -= unit.atk
            if (target.hp <= 0) {
              st.units = st.units.filter(u => u.id !== target.id)
              st.players[pIdx].stars += 2
            }
            unit.moved = true
            cur.selectedUnit = null
          } else if (!target && st.map[cur.y][cur.x].terrain !== Terrain.Water &&
                     dist(unit.x, unit.y, cur.x, cur.y) === 1) {
            // Move
            unit.x = cur.x; unit.y = cur.y; unit.moved = true
            cur.selectedUnit = null
          } else {
            cur.selectedUnit = null
          }
        } else {
          cur.selectedUnit = null
        }
      } else {
        // Select unit or city at cursor
        const unit = st.units.find(u => u.x === cur.x && u.y === cur.y && u.owner === pIdx)
        if (unit) { cur.selectedUnit = unit.id; cur.selectedCity = null }
        else {
          const city = st.cities.find(c => c.x === cur.x && c.y === cur.y && c.owner === pIdx)
          if (city) { cur.selectedCity = city.id; cur.selectedUnit = null }
        }
      }
    }

    if (action === 'action') {
      // Settler → found city
      const unit = st.units.find(u => u.id === cur.selectedUnit)
      if (unit && unit.kind === 'settler' && unit.owner === pIdx) {
        const existing = st.cities.find(c => c.x === unit.x && c.y === unit.y)
        if (!existing && st.map[unit.y][unit.x].terrain !== Terrain.Water) {
          st.cities.push({
            id: st.nextCityId++, owner: pIdx, x: unit.x, y: unit.y,
            name: `City ${st.nextCityId}`, population: 1, food: 0,
            isCapital: false, buildQueue: null, buildProgress: 0, borderRadius: 1,
          })
          st.units = st.units.filter(u => u.id !== unit.id)
          cur.selectedUnit = null
          st.players[pIdx].stars += 3
          // Claim territory
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const nx = unit.x + dx, ny = unit.y + dy
              if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) st.map[ny][nx].owner = pIdx
            }
        }
      }
      // Builder → improve tile
      if (unit && unit.kind === 'builder' && unit.owner === pIdx) {
        const tile = st.map[unit.y][unit.x]
        if (tile.terrain === Terrain.Grassland && tile.improvement === 'none') {
          tile.improvement = 'farm'; unit.moved = true
        } else if (tile.terrain === Terrain.Mountain && tile.improvement === 'none') {
          tile.improvement = 'mine'; unit.moved = true
        }
      }
      // City → cycle build queue
      if (cur.selectedCity != null) {
        const city = st.cities.find(c => c.id === cur.selectedCity && c.owner === pIdx)
        if (city) {
          const order: (UnitKind | null)[] = [null, 'warrior', 'archer', 'settler', 'builder']
          const idx = order.indexOf(city.buildQueue)
          city.buildQueue = order[(idx + 1) % order.length]
          city.buildProgress = 0
        }
      }
    }

    if (action === 'next') {
      // Cycle to next idle unit
      const myUnits = st.units.filter(u => u.owner === pIdx && !u.moved)
      if (myUnits.length > 0) {
        const curIdx = myUnits.findIndex(u => u.id === cur.selectedUnit)
        const next = myUnits[(curIdx + 1) % myUnits.length]
        cur.selectedUnit = next.id; cur.selectedCity = null
        cur.x = next.x; cur.y = next.y
      }
    }
  }, [])

  // ─── Keyboard input ────────────────────────────────────
  useEffect(() => {
    const held = new Map<string, ReturnType<typeof setInterval>>()
    function onDown(e: KeyboardEvent) {
      const mapping = KB_MAP.get(e.key)
      if (!mapping) return
      e.preventDefault()
      const st = stateRef.current
      for (let i = 0; i < st.players.length; i++) {
        const inp = st.players[i].input
        if (inp.type === 'keyboard' && inp.group === mapping.group) {
          processAction(i, mapping.action)
          // Repeat for movement
          if (['up', 'down', 'left', 'right'].includes(mapping.action)) {
            const key = `${i}_${mapping.action}`
            if (!held.has(key))
              held.set(key, setInterval(() => processAction(i, mapping.action), 120))
          }
        }
      }
    }
    function onUp(e: KeyboardEvent) {
      const mapping = KB_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (let i = 0; i < st.players.length; i++) {
        const inp = st.players[i].input
        if (inp.type === 'keyboard' && inp.group === mapping.group) {
          const key = `${i}_${mapping.action}`
          if (held.has(key)) { clearInterval(held.get(key)); held.delete(key) }
        }
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      held.forEach(v => clearInterval(v))
    }
  }, [processAction])

  // ─── Gamepad polling ───────────────────────────────────
  useEffect(() => {
    let last = 0
    let raf = 0
    function poll(ts: number) {
      if (ts - last > 140) {
        last = ts
        const st = stateRef.current
        const curPads = padsRef.current
        for (let i = 0; i < st.players.length; i++) {
          if (st.players[i].input.type !== 'gamepad') continue
          const pi = (st.players[i].input as { type: 'gamepad'; padIndex: number }).padIndex
          const gp = curPads.find(p => p.index === pi)
          if (!gp) continue
          if (gp.up) processAction(i, 'up')
          else if (gp.down) processAction(i, 'down')
          else if (gp.left) processAction(i, 'left')
          else if (gp.right) processAction(i, 'right')
          if (gp.a) processAction(i, 'select')
          if (gp.x) processAction(i, 'action')
          if (gp.y) processAction(i, 'next')
        }
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [processAction])

  // ─── Game tick (city production, growth, science, AI, victory) ──
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    function tick() {
      if (pauseRef.current) { timer = setTimeout(tick, stateRef.current.tickMs); return }
      const st = stateRef.current
      if (st.gameOver) return

      st.turn++

      // Reset unit movement
      for (const u of st.units) u.moved = false

      // Per-player city processing
      for (let p = 0; p < st.players.length; p++) {
        if (!st.players[p].alive) continue
        const myCities = st.cities.filter(c => c.owner === p)

        for (const city of myCities) {
          // Gold from adjacent tiles
          let tileGold = 0, tileFood = 0
          for (let dy = -city.borderRadius; dy <= city.borderRadius; dy++)
            for (let dx = -city.borderRadius; dx <= city.borderRadius; dx++) {
              const nx = city.x + dx, ny = city.y + dy
              if (nx < 0 || nx >= MAP_W || ny < 0 || ny >= MAP_H) continue
              const tile = st.map[ny][nx]
              tileGold += TERRAIN_GOLD[tile.terrain]
              tileFood += TERRAIN_FOOD[tile.terrain]
              if (tile.improvement === 'farm') tileFood += 2
              if (tile.improvement === 'mine') tileGold += 3
            }
          st.players[p].gold += tileGold + 2 // base income
          st.players[p].science += city.population
          st.players[p].gems += 1

          // Population growth
          city.food += tileFood
          const growthThreshold = city.population * 8
          if (city.food >= growthThreshold) {
            city.population++
            city.food -= growthThreshold
            st.players[p].stars += 1
          }

          // Border expansion via culture
          if (st.players[p].gems > 0 && st.players[p].gems % 15 === 0 && city.borderRadius < 4) {
            city.borderRadius++
            for (let dy2 = -city.borderRadius; dy2 <= city.borderRadius; dy2++)
              for (let dx2 = -city.borderRadius; dx2 <= city.borderRadius; dx2++) {
                const nx2 = city.x + dx2, ny2 = city.y + dy2
                if (nx2 >= 0 && nx2 < MAP_W && ny2 >= 0 && ny2 < MAP_H && st.map[ny2][nx2].owner === -1)
                  st.map[ny2][nx2].owner = p
              }
          }

          // Build queue
          if (city.buildQueue) {
            city.buildProgress++
            if (city.buildProgress >= UNIT_STATS[city.buildQueue].buildTurns) {
              const stats = UNIT_STATS[city.buildQueue]
              // Find empty adjacent tile
              let placed = false
              for (const [ddx, ddy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
                const sx = city.x + ddx, sy = city.y + ddy
                if (sx >= 0 && sx < MAP_W && sy >= 0 && sy < MAP_H &&
                    st.map[sy][sx].terrain !== Terrain.Water &&
                    !st.units.some(u => u.x === sx && u.y === sy)) {
                  st.units.push({
                    id: st.nextUnitId++, kind: city.buildQueue, owner: p,
                    x: sx, y: sy, hp: stats.hp, maxHp: stats.hp,
                    atk: stats.atk, range: stats.range, moved: false,
                  })
                  placed = true; break
                }
              }
              if (placed) { city.buildProgress = 0; city.buildQueue = null }
            }
          }
        }

        // Auto-research tech
        const unresearched = TECHS.filter(t => !st.players[p].techs.has(t))
        if (unresearched.length > 0) {
          const next = unresearched[0]
          if (st.players[p].science >= TECH_COST[next]) {
            st.players[p].science -= TECH_COST[next]
            st.players[p].techs.add(next)
            st.players[p].stars += 5
            // Tech bonuses
            if (next === 'currency') st.players[p].gold += 20
          }
        }
      }

      // ── Simple AI (for bot players) ────────────────────
      for (let p = 0; p < st.players.length; p++) {
        if (!st.players[p].isBot || !st.players[p].alive) continue
        const myCities = st.cities.filter(c => c.owner === p)
        const myUnits = st.units.filter(u => u.owner === p && !u.moved)

        // Ensure cities are building
        for (const city of myCities) {
          if (!city.buildQueue) {
            const hasSettler = st.units.some(u => u.owner === p && u.kind === 'settler')
            city.buildQueue = myCities.length < 3 && !hasSettler ? 'settler' : 'warrior'
          }
        }

        // Move units toward nearest enemy
        for (const unit of myUnits) {
          if (unit.kind === 'settler') {
            // Found city if far from own cities
            const nearOwn = myCities.some(c => dist(c.x, c.y, unit.x, unit.y) < 6)
            if (!nearOwn && st.map[unit.y][unit.x].terrain !== Terrain.Water) {
              st.cities.push({
                id: st.nextCityId++, owner: p, x: unit.x, y: unit.y,
                name: `Bot City ${st.nextCityId}`, population: 1, food: 0,
                isCapital: false, buildQueue: null, buildProgress: 0, borderRadius: 1,
              })
              st.units = st.units.filter(u => u.id !== unit.id)
              continue
            }
            // Wander
            const dx = Math.sign(MAP_W / 2 - unit.x) || 1
            const ny = unit.y, nx = unit.x + dx
            if (nx >= 0 && nx < MAP_W && st.map[ny][nx].terrain !== Terrain.Water)
              { unit.x = nx; unit.moved = true }
            continue
          }
          if (unit.kind === 'builder') {
            const tile = st.map[unit.y][unit.x]
            if (tile.terrain === Terrain.Grassland && tile.improvement === 'none')
              { tile.improvement = 'farm'; unit.moved = true; continue }
            if (tile.terrain === Terrain.Mountain && tile.improvement === 'none')
              { tile.improvement = 'mine'; unit.moved = true; continue }
            // Wander to improvable tile
            const dx = (Math.random() > 0.5 ? 1 : -1)
            const nx = Math.max(0, Math.min(MAP_W - 1, unit.x + dx))
            if (st.map[unit.y][nx].terrain !== Terrain.Water)
              { unit.x = nx; unit.moved = true }
            continue
          }
          // Combat unit AI — find nearest enemy
          const enemies = st.units.filter(u => u.owner !== p)
          const enemyCities = st.cities.filter(c => c.owner !== p)
          let bestTarget: { x: number; y: number } | null = null
          let bestDist = Infinity
          for (const e of enemies) {
            const d = dist(unit.x, unit.y, e.x, e.y)
            if (d < bestDist) { bestDist = d; bestTarget = { x: e.x, y: e.y } }
          }
          for (const ec of enemyCities) {
            const d = dist(unit.x, unit.y, ec.x, ec.y)
            if (d < bestDist) { bestDist = d; bestTarget = { x: ec.x, y: ec.y } }
          }

          if (bestTarget) {
            // Attack if in range
            const inRange = enemies.find(e => dist(unit.x, unit.y, e.x, e.y) <= unit.range)
            if (inRange) {
              inRange.hp -= unit.atk
              if (inRange.hp <= 0) {
                st.units = st.units.filter(u => u.id !== inRange.id)
                st.players[p].stars += 2
              }
              unit.moved = true
            } else {
              // Move toward target
              const mdx = Math.sign(bestTarget.x - unit.x)
              const mdy = Math.sign(bestTarget.y - unit.y)
              const nx = unit.x + mdx, ny = unit.y + mdy
              if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H &&
                  st.map[ny][nx].terrain !== Terrain.Water &&
                  !st.units.some(u => u.x === nx && u.y === ny && u.owner === p)) {
                unit.x = nx; unit.y = ny; unit.moved = true
              }
            }
          }
        }

        // Capture undefended cities
        for (const city of [...st.cities]) {
          if (city.owner === p) continue
          const captor = st.units.find(u => u.owner === p && u.x === city.x && u.y === city.y && u.atk > 0)
          if (captor) {
            city.owner = p
            st.players[p].stars += 10
          }
        }
      }

      // ── Capture cities for human players too ───────────
      for (const city of [...st.cities]) {
        const captor = st.units.find(u => u.owner !== city.owner && u.x === city.x && u.y === city.y && u.atk > 0)
        if (captor) {
          const prevOwner = city.owner
          city.owner = captor.owner
          st.players[captor.owner].stars += 10
          // Check if capital
          if (city.isCapital) {
            const hasOtherCities = st.cities.some(c => c.owner === prevOwner && c.id !== city.id)
            if (!hasOtherCities) st.players[prevOwner].alive = false
          }
        }
      }

      updateVisibility(st)

      // ── Victory check ──────────────────────────────────
      const gameMode = cfg.gameMode || 'domination'
      const alivePlayers = st.players.filter(p => p.alive)

      if (gameMode === 'domination' || gameMode === 'timed-score') {
        // Domination: only one player has capitals
        const capitalOwners = new Set(st.cities.filter(c => c.isCapital).map(c => c.owner))
        if (capitalOwners.size === 1) {
          const w = [...capitalOwners][0]
          st.gameOver = true; st.winner = w; st.winCondition = 'Domination'
        }
        if (alivePlayers.length <= 1 && st.players.length > 1) {
          const w = st.players.findIndex(p => p.alive)
          st.gameOver = true; st.winner = w; st.winCondition = 'Domination'
        }
      }
      if (gameMode === 'science') {
        for (let p = 0; p < st.players.length; p++) {
          if (st.players[p].techs.size >= TECHS.length) {
            st.gameOver = true; st.winner = p; st.winCondition = 'Science'
            break
          }
        }
      }
      if (gameMode === 'timed-score' && st.turn >= 200) {
        let best = -1, bestStars = -1
        for (let p = 0; p < st.players.length; p++) {
          if (st.players[p].stars > bestStars) { bestStars = st.players[p].stars; best = p }
        }
        st.gameOver = true; st.winner = best; st.winCondition = 'Score'
      }

      // ── Update HUD state ───────────────────────────────
      const p0 = st.players[0]
      const selUnit = st.units.find(u => u.id === st.cursors[0]?.selectedUnit)
      const totalPop = st.cities.filter(c => c.owner === 0).reduce((s, c) => s + c.population, 0)
      const unresearched0 = TECHS.filter(tech => !p0.techs.has(tech))
      setHud({
        gold: p0.gold, gems: p0.gems, stars: p0.stars, science: p0.science,
        turn: st.turn, pop: totalPop,
        unit: selUnit ? `${selUnit.kind} ${selUnit.hp}/${selUnit.maxHp}` : '',
        tech: unresearched0.length > 0 ? `${unresearched0[0]} (${TECH_COST[unresearched0[0]]}🔬)` : 'All researched!',
      })

      if (st.gameOver) {
        setGameOver(true)
        if (st.winner != null) setWinner(st.players[st.winner].name)
        setWinCond(st.winCondition)
        return
      }

      timer = setTimeout(tick, st.tickMs)
    }

    timer = setTimeout(tick, stateRef.current.tickMs)
    return () => clearTimeout(timer)
  }, [cfg, pauseRef])

  // ─── Canvas render ─────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = CANVAS_W; canvas.height = CANVAS_H
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      const camX = st.camX, camY = st.camY
      const p0 = 0 // viewport player

      // Draw tiles
      for (let vy = 0; vy < VIEW_H; vy++) {
        for (let vx = 0; vx < VIEW_W; vx++) {
          const mx = camX + vx, my = camY + vy
          if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) continue
          const tile = st.map[my][mx]
          const px = vx * TILE, py = vy * TILE

          if (!tile.explored[p0]) {
            // Unexplored = black
            ctx.fillStyle = '#000'; ctx.fillRect(px, py, TILE, TILE)
            continue
          }

          // Terrain
          ctx.fillStyle = TERRAIN_COLORS[tile.terrain]
          ctx.fillRect(px, py, TILE, TILE)

          // Improvement
          if (tile.improvement === 'farm') {
            ctx.fillStyle = 'rgba(255,220,50,0.3)'; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
            ctx.strokeStyle = '#aa0'; ctx.strokeRect(px + 5, py + 5, TILE - 10, TILE - 10)
          }
          if (tile.improvement === 'mine') {
            ctx.fillStyle = 'rgba(180,180,180,0.4)'; ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
            ctx.fillStyle = '#555'; ctx.fillRect(px + 18, py + 18, 14, 14)
          }

          // Territory overlay
          if (tile.owner >= 0 && tile.owner < st.players.length) {
            ctx.fillStyle = st.players[tile.owner].color + '22'
            ctx.fillRect(px, py, TILE, TILE)
          }

          // Fog overlay (explored but not visible)
          if (!tile.visible[p0]) {
            ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(px, py, TILE, TILE)
          }

          // Grid lines
          ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5
          ctx.strokeRect(px, py, TILE, TILE)
        }
      }

      // Draw cities
      for (const city of st.cities) {
        const sx = city.x - camX, sy = city.y - camY
        if (sx < 0 || sx >= VIEW_W || sy < 0 || sy >= VIEW_H) continue
        if (!st.map[city.y][city.x].visible[p0] && !st.map[city.y][city.x].explored[p0]) continue
        const px = sx * TILE + TILE / 2, py = sy * TILE + TILE / 2
        ctx.fillStyle = st.players[city.owner]?.color || '#fff'
        ctx.fillRect(px - 10, py - 10, 20, 20)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
        ctx.strokeRect(px - 10, py - 10, 20, 20)
        if (city.isCapital) {
          ctx.fillStyle = '#ffd700'
          ctx.beginPath(); ctx.arc(px, py - 14, 4, 0, Math.PI * 2); ctx.fill()
        }
        // Population text
        ctx.fillStyle = '#fff'; ctx.font = '9px monospace'; ctx.textAlign = 'center'
        ctx.fillText(`${city.population}`, px, py + 4)
      }

      // Draw units
      for (const unit of st.units) {
        const sx = unit.x - camX, sy = unit.y - camY
        if (sx < 0 || sx >= VIEW_W || sy < 0 || sy >= VIEW_H) continue
        if (!st.map[unit.y][unit.x].visible[p0]) continue
        const px = sx * TILE + TILE / 2, py = sy * TILE + TILE / 2
        ctx.fillStyle = st.players[unit.owner]?.color || '#fff'

        if (unit.kind === 'warrior') {
          ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill()
        } else if (unit.kind === 'archer') {
          ctx.beginPath()
          ctx.moveTo(px, py - 6); ctx.lineTo(px + 6, py + 6); ctx.lineTo(px - 6, py + 6)
          ctx.closePath(); ctx.fill()
        } else if (unit.kind === 'settler') {
          ctx.fillRect(px - 6, py - 6, 12, 12)
        } else if (unit.kind === 'builder') {
          // Diamond
          ctx.beginPath()
          ctx.moveTo(px, py - 5); ctx.lineTo(px + 5, py)
          ctx.lineTo(px, py + 5); ctx.lineTo(px - 5, py)
          ctx.closePath(); ctx.fill()
        }

        // HP bar
        if (unit.hp < unit.maxHp) {
          const barW = 14, barH = 3
          const bx = px - barW / 2, by = py - 13
          ctx.fillStyle = '#300'; ctx.fillRect(bx, by, barW, barH)
          ctx.fillStyle = '#0f0'; ctx.fillRect(bx, by, barW * (unit.hp / unit.maxHp), barH)
        }
      }

      // Draw cursors
      for (let i = 0; i < st.cursors.length; i++) {
        const cur = st.cursors[i]
        const sx = cur.x - camX, sy = cur.y - camY
        if (sx < 0 || sx >= VIEW_W || sy < 0 || sy >= VIEW_H) continue
        ctx.strokeStyle = st.players[i]?.color || '#fff'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 3])
        ctx.strokeRect(sx * TILE + 2, sy * TILE + 2, TILE - 4, TILE - 4)
        ctx.setLineDash([])
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, cfg)
    setGameOver(false); setWinner(null); setWinCond('')
    setHud({ gold: 0, gems: 0, stars: 0, science: 0, turn: 1, pop: 0, unit: '', tech: '' })
  }, [players, cfg])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.scoreboard}>
        <div className={styles.scoreItem}>
          <span>💰</span><span>{hud.gold}</span>
        </div>
        <div className={styles.scoreItem}>
          <span>💎</span><span>{hud.gems}</span>
        </div>
        <div className={styles.scoreItem}>
          <span>⭐</span><span>{hud.stars}</span>
        </div>
        <div className={styles.scoreItem}>
          <span>🔬</span><span>{hud.science}</span>
        </div>
        <div className={styles.scoreItem}>
          <span>👥</span><span>{hud.pop}</span>
        </div>
        <div className={styles.scoreItem}>
          <span>Turn</span><span>{hud.turn}</span>
        </div>
        {hud.unit && (
          <div className={styles.scoreItem}>
            <span>⚔️ {hud.unit}</span>
          </div>
        )}
        <div className={styles.scoreItem}>
          <span>📜 {hud.tech}</span>
        </div>
      </div>

      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className={styles.canvas}  role="img" aria-label="Civilization canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && (
            <p className={styles.winnerText}>
              🏆 {winner} {t('miniGames.wins', 'wins')}! ({winCond})
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
