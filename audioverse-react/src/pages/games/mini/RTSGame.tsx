/**
 * RTSGame — Red Alert / StarCraft / Age of Empires inspired real-time strategy.
 *
 * Top-down canvas RTS with base building, resource gathering, army building,
 * and era advancement through 4 ages: Stone → Medieval → Industrial → Modern.
 *
 * Controls:
 *   Camera: WASD / Arrows / gamepad stick
 *   Select: Space / Enter / gamepad A
 *   Build menu: E / Shift / gamepad X
 *   Train units: 1 / 2 / 3 / gamepad buttons
 *   Advance age: Q / Ctrl / gamepad Y
 *
 * Currencies: coins (gold), gems (crystals), stars (era completions).
 * Supports single / couch / online, VS deathmatch & coop vs AI.
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
const VIEW_W = 800
const VIEW_H = 600
const MAP_W = 1600
const MAP_H = 1200
const TICK_MS = 100
const FOG_RANGE = 200
const AGE_NAMES = ['Stone', 'Medieval', 'Industrial', 'Modern']
const AGE_COST = [
  { gold: 0, crystal: 0 },
  { gold: 200, crystal: 100 },
  { gold: 500, crystal: 300 },
  { gold: 1000, crystal: 600 },
]
const WORLD_COLORS: Record<string, { ground: string; accent: string }> = {
  temperate: { ground: '#2d5a1e', accent: '#3a7a2a' },
  desert:    { ground: '#c2a64e', accent: '#d4b96a' },
  snow:      { ground: '#dce6ec', accent: '#f0f4f7' },
  alien:     { ground: '#3c1f5e', accent: '#5a2d8a' },
}

// ─── Types ───────────────────────────────────────────────────
type UnitType = 'worker' | 'infantry' | 'archer' | 'vehicle' | 'super'
type BuildingType = 'townCenter' | 'barracks' | 'factory' | 'tower' | 'wall'

interface Unit {
  id: number; type: UnitType; owner: number
  x: number; y: number; hp: number; maxHp: number
  tx: number; ty: number // target
  atk: number; range: number; speed: number
  carryGold: number; carryCrystal: number; carryMax: number
  cooldown: number; age: number
}

interface Building {
  id: number; type: BuildingType; owner: number
  x: number; y: number; w: number; h: number
  hp: number; maxHp: number; atk: number; range: number
  age: number; cooldown: number
}

interface Resource {
  x: number; y: number; type: 'gold' | 'crystal'; amount: number
}

interface PlayerState {
  gold: number; crystal: number; age: number
  coins: number; gems: number; stars: number
  alive: boolean; color: string; name: string
  buildMode: number; selectedUnit: number; selectedBuilding: number
}

interface Camera { x: number; y: number; cursorX: number; cursorY: number }

interface GameState {
  units: Unit[]; buildings: Building[]; resources: Resource[]
  players: PlayerState[]; cameras: Camera[]
  nextId: number; gameOver: boolean; winner: number | null
  tick: number; worldTheme: string; gameMode: string
}

// ─── Unit/Building templates ─────────────────────────────────
const UNIT_TEMPLATES: Record<UnitType, Omit<Unit, 'id' | 'owner' | 'x' | 'y' | 'tx' | 'ty' | 'cooldown' | 'age'>> = {
  worker:   { type: 'worker',   hp: 30,  maxHp: 30,  atk: 3,  range: 10,  speed: 1.5, carryGold: 0, carryCrystal: 0, carryMax: 10 },
  infantry: { type: 'infantry', hp: 60,  maxHp: 60,  atk: 8,  range: 14,  speed: 1.8, carryGold: 0, carryCrystal: 0, carryMax: 0 },
  archer:   { type: 'archer',   hp: 40,  maxHp: 40,  atk: 10, range: 80,  speed: 1.4, carryGold: 0, carryCrystal: 0, carryMax: 0 },
  vehicle:  { type: 'vehicle',  hp: 120, maxHp: 120, atk: 18, range: 60,  speed: 2.2, carryGold: 0, carryCrystal: 0, carryMax: 0 },
  super:    { type: 'super',    hp: 200, maxHp: 200, atk: 30, range: 50,  speed: 1.6, carryGold: 0, carryCrystal: 0, carryMax: 0 },
}
const UNIT_COSTS: Record<UnitType, { gold: number; crystal: number; minAge: number }> = {
  worker:   { gold: 50,  crystal: 0,   minAge: 1 },
  infantry: { gold: 60,  crystal: 10,  minAge: 1 },
  archer:   { gold: 80,  crystal: 30,  minAge: 2 },
  vehicle:  { gold: 150, crystal: 80,  minAge: 3 },
  super:    { gold: 300, crystal: 200, minAge: 4 },
}
const BUILDING_TEMPLATES: Record<BuildingType, { w: number; h: number; hp: number; atk: number; range: number; minAge: number; costG: number; costC: number }> = {
  townCenter: { w: 24, h: 24, hp: 500, atk: 0,  range: 0,   minAge: 1, costG: 0,   costC: 0 },
  barracks:   { w: 18, h: 18, hp: 300, atk: 0,  range: 0,   minAge: 1, costG: 100, costC: 30 },
  factory:    { w: 18, h: 18, hp: 350, atk: 0,  range: 0,   minAge: 3, costG: 200, costC: 100 },
  tower:      { w: 10, h: 10, hp: 200, atk: 12, range: 100, minAge: 1, costG: 80,  costC: 40 },
  wall:       { w: 16, h: 6,  hp: 150, atk: 0,  range: 0,   minAge: 1, costG: 30,  costC: 0 },
}
const BUILD_ORDER: BuildingType[] = ['barracks', 'tower', 'factory', 'wall']

// ─── Helpers ─────────────────────────────────────────────────
let _gid = 1
function nid() { return _gid++ }
function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function spawnUnit(type: UnitType, owner: number, x: number, y: number, age: number): Unit {
  const t = UNIT_TEMPLATES[type]
  return { ...t, id: nid(), owner, x, y, tx: x, ty: y, cooldown: 0, age }
}

function spawnBuilding(type: BuildingType, owner: number, x: number, y: number, age: number): Building {
  const t = BUILDING_TEMPLATES[type]
  return { id: nid(), type, owner, x, y, w: t.w, h: t.h, hp: t.hp, maxHp: t.hp, atk: t.atk, range: t.range, age, cooldown: 0 }
}

function generateResources(): Resource[] {
  const res: Resource[] = []
  const clusters = 12
  for (let c = 0; c < clusters; c++) {
    const cx = 60 + Math.random() * (MAP_W - 120)
    const cy = 60 + Math.random() * (MAP_H - 120)
    const rtype = c % 3 === 0 ? 'crystal' : 'gold'
    const count = 4 + Math.floor(Math.random() * 4)
    for (let i = 0; i < count; i++) {
      res.push({ x: cx + (Math.random() - 0.5) * 40, y: cy + (Math.random() - 0.5) * 40, type: rtype, amount: 200 + Math.floor(Math.random() * 300) })
    }
  }
  return res
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  _gid = 1
  const theme = (config.worldTheme as string) || 'temperate'
  const startAge = Number(config.startingAge) || 1
  const mode = (config.gameMode as string) || 'skirmish'
  const ps: PlayerState[] = players.map((p, i) => ({
    gold: 300, crystal: 100, age: startAge,
    coins: 0, gems: 0, stars: 0,
    alive: true, color: p.color || PLAYER_COLORS[i] || '#fff', name: p.name,
    buildMode: -1, selectedUnit: -1, selectedBuilding: -1,
  }))
  const units: Unit[] = []
  const buildings: Building[] = []
  const corners = [
    { x: 80, y: 80 }, { x: MAP_W - 80, y: MAP_H - 80 },
    { x: MAP_W - 80, y: 80 }, { x: 80, y: MAP_H - 80 },
  ]
  for (let i = 0; i < players.length; i++) {
    const c = corners[i % 4]
    buildings.push(spawnBuilding('townCenter', i, c.x, c.y, startAge))
    for (let w = 0; w < 3; w++) {
      units.push(spawnUnit('worker', i, c.x + 30 + w * 12, c.y + 30, startAge))
    }
  }
  // AI players for coop
  if (mode === 'coop-campaign' && players.length < 4) {
    const aiIdx = players.length
    const c = corners[aiIdx % 4]
    ps.push({ gold: 500, crystal: 200, age: startAge + 1, coins: 0, gems: 0, stars: 0, alive: true, color: '#666', name: 'AI Enemy', buildMode: -1, selectedUnit: -1, selectedBuilding: -1 })
    buildings.push(spawnBuilding('townCenter', aiIdx, c.x, c.y, startAge))
    for (let w = 0; w < 5; w++) units.push(spawnUnit('infantry', aiIdx, c.x + 30 + w * 12, c.y + 30, startAge))
    units.push(spawnUnit('worker', aiIdx, c.x + 30, c.y + 50, startAge))
  }
  const cameras: Camera[] = ps.map((_, i) => {
    const c = corners[i % 4]
    return { x: clamp(c.x - VIEW_W / 2, 0, MAP_W - VIEW_W), y: clamp(c.y - VIEW_H / 2, 0, MAP_H - VIEW_H), cursorX: c.x, cursorY: c.y }
  })
  return { units, buildings, resources: generateResources(), players: ps, cameras, nextId: _gid, gameOver: false, winner: null, tick: 0, worldTheme: theme, gameMode: mode }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function RTSGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const [hud, setHud] = useState<{ gold: number; crystal: number; age: number; coins: number; gems: number; stars: number }>({ gold: 300, crystal: 100, age: 1, coins: 0, gems: 0, stars: 0 })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Input handling ──────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key.toLowerCase()); handleAction(e.key.toLowerCase()) }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  function handleAction(key: string) {
    const st = stateRef.current
    if (st.gameOver) return
    const p0 = st.players[0]
    if (!p0 || !p0.alive) return
    const cam = st.cameras[0]
    if (key === ' ' || key === 'enter') {
      // Select or command
      const wx = cam.cursorX, wy = cam.cursorY
      if (p0.buildMode >= 0) {
        placeBuild(st, 0, wx, wy)
        p0.buildMode = -1
      } else {
        const u = st.units.find(u => u.owner === 0 && dist(u, { x: wx, y: wy }) < 12)
        if (u) { p0.selectedUnit = u.id; p0.selectedBuilding = -1 }
        else {
          const b = st.buildings.find(b => b.owner === 0 && wx >= b.x - b.w / 2 && wx <= b.x + b.w / 2 && wy >= b.y - b.h / 2 && wy <= b.y + b.h / 2)
          if (b) { p0.selectedBuilding = b.id; p0.selectedUnit = -1 }
          else if (p0.selectedUnit >= 0) {
            const su = st.units.find(u => u.id === p0.selectedUnit)
            if (su) { su.tx = wx; su.ty = wy }
          }
        }
      }
    } else if (key === 'e' || key === 'shift') {
      p0.buildMode = (p0.buildMode + 1) % BUILD_ORDER.length
    } else if (key === '1') { trainUnit(st, 0, 'infantry') }
    else if (key === '2') { trainUnit(st, 0, 'archer') }
    else if (key === '3') { trainUnit(st, 0, 'vehicle') }
    else if (key === 'q' || key === 'control') { advanceAge(st, 0) }
  }

  function placeBuild(st: GameState, owner: number, x: number, y: number) {
    const p = st.players[owner]
    const btype = BUILD_ORDER[p.buildMode]
    if (!btype) return
    const tmpl = BUILDING_TEMPLATES[btype]
    if (p.age < tmpl.minAge || p.gold < tmpl.costG || p.crystal < tmpl.costC) return
    p.gold -= tmpl.costG; p.crystal -= tmpl.costC
    st.buildings.push(spawnBuilding(btype, owner, x, y, p.age))
  }

  function trainUnit(st: GameState, owner: number, type: UnitType) {
    const p = st.players[owner]
    const cost = UNIT_COSTS[type]
    if (p.age < cost.minAge || p.gold < cost.gold || p.crystal < cost.crystal) return
    const b = st.buildings.find(b => b.owner === owner && (
      (type === 'worker' && b.type === 'townCenter') ||
      ((type === 'infantry' || type === 'archer' || type === 'super') && (b.type === 'barracks' || b.type === 'townCenter')) ||
      (type === 'vehicle' && b.type === 'factory')
    ))
    if (!b) return
    p.gold -= cost.gold; p.crystal -= cost.crystal
    p.coins += 1
    st.units.push(spawnUnit(type, owner, b.x + b.w / 2 + 8, b.y + b.h / 2 + 8, p.age))
  }

  function advanceAge(st: GameState, owner: number) {
    const p = st.players[owner]
    if (p.age >= 4) return
    const cost = AGE_COST[p.age]
    if (p.gold < cost.gold || p.crystal < cost.crystal) return
    p.gold -= cost.gold; p.crystal -= cost.crystal
    p.age++; p.stars += 1; p.gems += 2
  }

  // ─── Gamepad polling ─────────────────────────────────────
  useEffect(() => {
    let raf = 0
    let prevBtns = [false, false, false, false]
    function poll() {
      const st = stateRef.current
      if (st.gameOver) { raf = requestAnimationFrame(poll); return }
      const gp = padsRef.current[0]
      if (gp) {
        const cam = st.cameras[0]
        if (gp.left) cam.cursorX -= 4
        if (gp.right) cam.cursorX += 4
        if (gp.up) cam.cursorY -= 4
        if (gp.down) cam.cursorY += 4
        cam.cursorX = clamp(cam.cursorX, 0, MAP_W)
        cam.cursorY = clamp(cam.cursorY, 0, MAP_H)
        // A = select
        if (gp.a && !prevBtns[0]) handleAction(' ')
        // X = build
        if (gp.x && !prevBtns[1]) handleAction('e')
        // Y = age
        if (gp.y && !prevBtns[2]) handleAction('q')
        // B = train infantry
        if (gp.b && !prevBtns[3]) handleAction('1')
        prevBtns = [!!gp.a, !!gp.x, !!gp.y, !!gp.b]
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Game tick ────────────────────────────────────────────
  useEffect(() => {
    function gameTick() {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      st.tick++

      // Camera follow cursor (keyboard)
      const keys = keysRef.current
      const cam = st.cameras[0]
      if (cam) {
        const spd = 5
        if (keys.has('w') || keys.has('arrowup')) cam.cursorY -= spd
        if (keys.has('s') || keys.has('arrowdown')) cam.cursorY += spd
        if (keys.has('a') || keys.has('arrowleft')) cam.cursorX -= spd
        if (keys.has('d') || keys.has('arrowright')) cam.cursorX += spd
        cam.cursorX = clamp(cam.cursorX, 0, MAP_W)
        cam.cursorY = clamp(cam.cursorY, 0, MAP_H)
        // Scroll camera toward cursor
        const targetCX = clamp(cam.cursorX - VIEW_W / 2, 0, MAP_W - VIEW_W)
        const targetCY = clamp(cam.cursorY - VIEW_H / 2, 0, MAP_H - VIEW_H)
        cam.x += (targetCX - cam.x) * 0.15
        cam.y += (targetCY - cam.y) * 0.15
      }

      // Unit AI
      for (const u of st.units) {
        if (u.hp <= 0) continue
        u.cooldown = Math.max(0, u.cooldown - 1)
        const p = st.players[u.owner]
        if (!p || !p.alive) continue

        // Workers: harvest or return resources
        if (u.type === 'worker') {
          if (u.carryGold >= u.carryMax || u.carryCrystal >= u.carryMax) {
            // Return to TC
            const tc = st.buildings.find(b => b.owner === u.owner && b.type === 'townCenter' && b.hp > 0)
            if (tc) {
              if (dist(u, tc) < 20) {
                p.gold += u.carryGold; p.crystal += u.carryCrystal
                p.coins += Math.floor((u.carryGold + u.carryCrystal) / 50)
                u.carryGold = 0; u.carryCrystal = 0
              } else { moveToward(u, tc.x, tc.y) }
            }
          } else {
            // Find nearest resource
            const near = st.resources.filter(r => r.amount > 0).sort((a, b) => dist(u, a) - dist(u, b))[0]
            if (near && dist(u, near) < 12) {
              const take = Math.min(2, near.amount)
              near.amount -= take
              if (near.type === 'gold') u.carryGold += take; else u.carryCrystal += take
            } else if (near) { moveToward(u, near.x, near.y) }
          }
          continue
        }

        // Combat units: attack enemies in range, else move to target
        const enemies = st.units.filter(e => e.owner !== u.owner && e.hp > 0)
        const eBuildings = st.buildings.filter(b => b.owner !== u.owner && b.hp > 0)
        const inRange = enemies.find(e => dist(u, e) < u.range)
        if (inRange && u.cooldown === 0) {
          inRange.hp -= u.atk; u.cooldown = 5
          if (inRange.hp <= 0) { p.coins += 2; p.gems += 1 }
        } else {
          const bInRange = eBuildings.find(b => dist(u, { x: b.x, y: b.y }) < u.range)
          if (bInRange && u.cooldown === 0) {
            bInRange.hp -= u.atk; u.cooldown = 5
          } else if (dist(u, { x: u.tx, y: u.ty }) > 4) {
            moveToward(u, u.tx, u.ty)
          } else if (enemies.length > 0) {
            // Auto-aggro nearest
            const nearest = enemies.sort((a, b) => dist(u, a) - dist(u, b))[0]
            moveToward(u, nearest.x, nearest.y)
          }
        }
      }

      // Tower attacks
      for (const b of st.buildings) {
        if (b.hp <= 0 || b.atk === 0) continue
        b.cooldown = Math.max(0, b.cooldown - 1)
        if (b.cooldown > 0) continue
        const enemy = st.units.find(u => u.owner !== b.owner && u.hp > 0 && dist(u, { x: b.x, y: b.y }) < b.range)
        if (enemy) { enemy.hp -= b.atk; b.cooldown = 8 }
      }

      // Remove dead
      st.units = st.units.filter(u => u.hp > 0)
      st.buildings = st.buildings.filter(b => b.hp > 0)
      st.resources = st.resources.filter(r => r.amount > 0)

      // AI logic (simple: train units, send toward enemies)
      for (let i = 0; i < st.players.length; i++) {
        const p = st.players[i]
        if (!p.alive) continue
        const isAI = i >= players.length // AI players are indices beyond human count
        if (!isAI) continue
        if (st.tick % 20 === 0 && p.gold >= 60) trainUnit(st, i, 'infantry')
        if (st.tick % 40 === 0 && p.age >= 2 && p.gold >= 80) trainUnit(st, i, 'archer')
        if (st.tick % 60 === 0 && p.age < 4) advanceAge(st, i)
        // Send units toward enemy bases
        const myUnits = st.units.filter(u => u.owner === i && u.type !== 'worker')
        const enemyTC = st.buildings.find(b => b.owner !== i && b.type === 'townCenter' && b.hp > 0)
        if (enemyTC && myUnits.length > 5) {
          for (const u of myUnits) {
            if (dist(u, { x: u.tx, y: u.ty }) < 8) { u.tx = enemyTC.x + (Math.random() - 0.5) * 40; u.ty = enemyTC.y + (Math.random() - 0.5) * 40 }
          }
        }
      }

      // Check win: player whose all TCs destroyed is eliminated
      for (let i = 0; i < st.players.length; i++) {
        if (!st.players[i].alive) continue
        const hasTc = st.buildings.some(b => b.owner === i && b.type === 'townCenter')
        if (!hasTc) st.players[i].alive = false
      }
      const alive = st.players.filter(p => p.alive)
      if (st.gameMode === 'coop-campaign') {
        const aiAlive = st.players.filter((p, i) => i >= players.length && p.alive)
        const humansAlive = st.players.filter((p, i) => i < players.length && p.alive)
        if (aiAlive.length === 0) { st.gameOver = true; st.winner = 0 }
        if (humansAlive.length === 0) { st.gameOver = true; st.winner = -1 }
      } else {
        if (alive.length <= 1) {
          st.gameOver = true
          st.winner = alive.length === 1 ? st.players.indexOf(alive[0]) : null
        }
      }

      // Update HUD
      const p0 = st.players[0]
      if (p0) setHud({ gold: p0.gold, crystal: p0.crystal, age: p0.age, coins: p0.coins, gems: p0.gems, stars: p0.stars })

      if (st.gameOver) {
        setGameOver(true)
        if (st.winner != null && st.winner >= 0) setWinner(st.players[st.winner]?.name ?? 'Unknown')
        else if (st.winner === -1) setWinner(null)
      }
    }

    const timerId = setInterval(gameTick, TICK_MS)
    return () => clearInterval(timerId)
  }, [])

  function moveToward(u: Unit, tx: number, ty: number) {
    const dx = tx - u.x, dy = ty - u.y
    const d = Math.hypot(dx, dy)
    if (d < 1) return
    u.x += (dx / d) * u.speed
    u.y += (dy / d) * u.speed
  }

  // ─── Render ──────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      const cam = st.cameras[0] || { x: 0, y: 0, cursorX: 400, cursorY: 300 }

      canvas.width = VIEW_W
      canvas.height = VIEW_H

      // Ground
      const theme = WORLD_COLORS[st.worldTheme] || WORLD_COLORS.temperate
      ctx.fillStyle = theme.ground
      ctx.fillRect(0, 0, VIEW_W, VIEW_H)

      // Ground detail grid
      ctx.strokeStyle = theme.accent
      ctx.lineWidth = 0.3
      for (let gx = -cam.x % 40; gx < VIEW_W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, VIEW_H); ctx.stroke()
      }
      for (let gy = -cam.y % 40; gy < VIEW_H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(VIEW_W, gy); ctx.stroke()
      }

      // Fog of war: compute visibility from player 0 units
      const myUnits = st.units.filter(u => u.owner === 0)
      const myBuildings = st.buildings.filter(b => b.owner === 0)

      function isVisible(wx: number, wy: number): boolean {
        for (const u of myUnits) { if (dist(u, { x: wx, y: wy }) < FOG_RANGE) return true }
        for (const b of myBuildings) { if (dist({ x: b.x, y: b.y }, { x: wx, y: wy }) < FOG_RANGE + 40) return true }
        return false
      }

      // Resources
      for (const r of st.resources) {
        const sx = r.x - cam.x, sy = r.y - cam.y
        if (sx < -10 || sx > VIEW_W + 10 || sy < -10 || sy > VIEW_H + 10) continue
        if (!isVisible(r.x, r.y)) continue
        ctx.fillStyle = r.type === 'gold' ? '#f1c40f' : '#00e5ff'
        ctx.beginPath()
        ctx.arc(sx, sy, 3 + r.amount / 150, 0, Math.PI * 2)
        ctx.fill()
      }

      // Buildings
      for (const b of st.buildings) {
        const sx = b.x - cam.x - b.w / 2, sy = b.y - cam.y - b.h / 2
        if (sx < -40 || sx > VIEW_W + 40 || sy < -40 || sy > VIEW_H + 40) continue
        if (b.owner !== 0 && !isVisible(b.x, b.y)) continue
        const pColor = st.players[b.owner]?.color || '#888'
        ctx.fillStyle = b.type === 'townCenter' ? pColor
          : b.type === 'barracks' ? '#c0392b'
          : b.type === 'factory' ? '#7f8c8d'
          : b.type === 'tower' ? '#8e44ad'
          : '#95a5a6'
        ctx.fillRect(sx, sy, b.w, b.h)
        // Outline with player color
        ctx.strokeStyle = pColor; ctx.lineWidth = 2
        ctx.strokeRect(sx, sy, b.w, b.h)
        // HP bar
        if (b.hp < b.maxHp) {
          const ratio = b.hp / b.maxHp
          ctx.fillStyle = '#333'; ctx.fillRect(sx, sy - 5, b.w, 3)
          ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : '#e74c3c'
          ctx.fillRect(sx, sy - 5, b.w * ratio, 3)
        }
        // Selection highlight
        if (st.players[0]?.selectedBuilding === b.id) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([3, 3])
          ctx.strokeRect(sx - 2, sy - 2, b.w + 4, b.h + 4)
          ctx.setLineDash([])
        }
      }

      // Units
      for (const u of st.units) {
        const sx = u.x - cam.x, sy = u.y - cam.y
        if (sx < -20 || sx > VIEW_W + 20 || sy < -20 || sy > VIEW_H + 20) continue
        if (u.owner !== 0 && !isVisible(u.x, u.y)) continue
        const pColor = st.players[u.owner]?.color || '#888'
        ctx.fillStyle = pColor
        if (u.type === 'worker') {
          ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2); ctx.fill()
          // Carry indicator
          if (u.carryGold > 0 || u.carryCrystal > 0) {
            ctx.fillStyle = u.carryGold > 0 ? '#f1c40f' : '#00e5ff'
            ctx.beginPath(); ctx.arc(sx, sy - 5, 2, 0, Math.PI * 2); ctx.fill()
          }
        } else if (u.type === 'infantry') {
          ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill()
        } else if (u.type === 'archer') {
          ctx.beginPath()
          ctx.moveTo(sx, sy - 5); ctx.lineTo(sx - 4, sy + 4); ctx.lineTo(sx + 4, sy + 4)
          ctx.closePath(); ctx.fill()
        } else if (u.type === 'vehicle') {
          ctx.fillRect(sx - 5, sy - 3, 10, 6)
        } else if (u.type === 'super') {
          ctx.beginPath(); ctx.arc(sx, sy, 8, 0, Math.PI * 2); ctx.fill()
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke()
        }
        // HP bar for combat units
        if (u.type !== 'worker' && u.hp < u.maxHp) {
          const ratio = u.hp / u.maxHp
          ctx.fillStyle = '#333'; ctx.fillRect(sx - 6, sy - 10, 12, 2)
          ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : '#e74c3c'
          ctx.fillRect(sx - 6, sy - 10, 12 * ratio, 2)
        }
        // Selection ring
        if (st.players[0]?.selectedUnit === u.id) {
          ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.setLineDash([2, 2])
          ctx.beginPath(); ctx.arc(sx, sy, 10, 0, Math.PI * 2); ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Fog overlay
      const fogRes = 20
      for (let fx = 0; fx < VIEW_W; fx += fogRes) {
        for (let fy = 0; fy < VIEW_H; fy += fogRes) {
          if (!isVisible(fx + cam.x, fy + cam.y)) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)'
            ctx.fillRect(fx, fy, fogRes, fogRes)
          }
        }
      }

      // Cursor
      const cx = cam.cursorX - cam.x, cy = cam.cursorY - cam.y
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy)
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx, cy + 8)
      ctx.stroke()

      // Build ghost
      const p0 = st.players[0]
      if (p0 && p0.buildMode >= 0) {
        const btype = BUILD_ORDER[p0.buildMode]
        const tmpl = BUILDING_TEMPLATES[btype]
        ctx.fillStyle = 'rgba(255,255,255,0.25)'
        ctx.fillRect(cx - tmpl.w / 2, cy - tmpl.h / 2, tmpl.w, tmpl.h)
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1
        ctx.strokeRect(cx - tmpl.w / 2, cy - tmpl.h / 2, tmpl.w, tmpl.h)
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText(btype, cx, cy + tmpl.h / 2 + 12)
      }

      // Minimap (bottom-right)
      const mmW = 120, mmH = 90, mmX = VIEW_W - mmW - 8, mmY = VIEW_H - mmH - 8
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(mmX, mmY, mmW, mmH)
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(mmX, mmY, mmW, mmH)
      const scaleX = mmW / MAP_W, scaleY = mmH / MAP_H
      for (const b of st.buildings) {
        ctx.fillStyle = st.players[b.owner]?.color || '#888'
        ctx.fillRect(mmX + b.x * scaleX - 1, mmY + b.y * scaleY - 1, 3, 3)
      }
      for (const u of st.units) {
        ctx.fillStyle = st.players[u.owner]?.color || '#888'
        ctx.fillRect(mmX + u.x * scaleX, mmY + u.y * scaleY, 1, 1)
      }
      // Camera viewport on minimap
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5
      ctx.strokeRect(mmX + cam.x * scaleX, mmY + cam.y * scaleY, VIEW_W * scaleX, VIEW_H * scaleY)

      // HUD text
      ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left'
      const p = st.players[0]
      if (p) {
        ctx.fillText(`Age: ${AGE_NAMES[p.age - 1] || '?'} (${p.age}/4)`, 8, 18)
        ctx.fillStyle = '#f1c40f'; ctx.fillText(`Gold: ${p.gold}`, 8, 34)
        ctx.fillStyle = '#00e5ff'; ctx.fillText(`Crystal: ${p.crystal}`, 8, 50)
        ctx.fillStyle = '#ffd700'; ctx.fillText(`Coins: ${p.coins}`, 8, 66)
        ctx.fillStyle = '#e91e63'; ctx.fillText(`Gems: ${p.gems}`, 120, 66)
        ctx.fillStyle = '#ffeb3b'; ctx.fillText(`Stars: ${p.stars}`, 220, 66)
        const unitCount = st.units.filter(u => u.owner === 0).length
        ctx.fillStyle = '#aaa'; ctx.fillText(`Units: ${unitCount}`, 8, 82)
        // Build hint
        ctx.fillStyle = '#888'; ctx.font = '11px monospace'
        ctx.fillText('[E]Build [1]Inf [2]Arch [3]Veh [Q]Age', 8, VIEW_H - 10)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ─────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false); setWinner(null)
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
      {/* HUD bar */}
      <div className={styles.scoreboard}>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#f1c40f' }} />
          <span>Gold</span>
          <span className={styles.scoreValue}>{hud.gold}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#00e5ff' }} />
          <span>Crystal</span>
          <span className={styles.scoreValue}>{hud.crystal}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#fff' }} />
          <span>Age {hud.age}</span>
          <span className={styles.scoreValue}>{AGE_NAMES[hud.age - 1]}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#ffd700' }} />
          <span>Coins</span>
          <span className={styles.scoreValue}>{hud.coins}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#e91e63' }} />
          <span>Gems</span>
          <span className={styles.scoreValue}>{hud.gems}</span>
        </div>
        <div className={styles.scoreItem}>
          <span className={styles.scoreColor} style={{ background: '#ffeb3b' }} />
          <span>Stars</span>
          <span className={styles.scoreValue}>{hud.stars}</span>
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="R T S canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.defeat', 'Defeat')}</p>}
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
