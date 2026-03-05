/**
 * MasterOfOrionGame — 4X space strategy for 1-8 players.
 *
 * Controls (per keyboard group):
 *   Group 0: WASD scroll map, Space/E select/build
 *   Group 1: Arrows scroll map, Enter select, Shift build
 *   Group 2: IJKL scroll map
 *   Group 3: Numpad 8/4/5/6 scroll map
 * Gamepads: D-pad/left stick scroll, A select, X build.
 *
 * Rules:
 *  - Star map with 12-20 systems, each with 0-3 planets.
 *  - Colonize planets, build structures (Factory, Lab, Farm, Shipyard).
 *  - Ships: Scout, Fighter, Colony Ship, Battleship.
 *  - Tech tree: Shields, Weapons, Engines, Ecology, Mega-weapons.
 *  - Combat auto-resolves when fleets meet.
 *  - Win: domination (60% systems), science (all 5 techs), or timer high score.
 *  - Currencies: coins (production), gems (rare minerals), stars (conquests/techs).
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
const MAP_W = 1200
const MAP_H = 900
const SCROLL_SPD = 3
const TICK_MS = 500
const STAR_R = 6
const SHIP_SIZE = 4
const TECHS = ['Shields', 'Weapons', 'Engines', 'Ecology', 'Mega-weapons'] as const
type Tech = typeof TECHS[number]
const TECH_COSTS = [80, 120, 180, 250, 400]
type BuildingType = 'Factory' | 'Lab' | 'Farm' | 'Shipyard'
type ShipType = 'Scout' | 'Fighter' | 'Colony' | 'Battleship'
const SHIP_COST: Record<ShipType, number> = { Scout: 20, Fighter: 40, Colony: 60, Battleship: 100 }
const SHIP_POWER: Record<ShipType, number> = { Scout: 1, Fighter: 3, Colony: 0, Battleship: 8 }
const SHIP_SPEED: Record<ShipType, number> = { Scout: 3, Fighter: 2, Colony: 1.2, Battleship: 1.5 }

// ─── Keyboard mappings ──────────────────────────────────────
type Action = 'up' | 'down' | 'left' | 'right' | 'select' | 'build'
const KEY_MAP = new Map<string, { group: number; action: Action }>()
;([ ['w',0,'up'],['s',0,'down'],['a',0,'left'],['d',0,'right'],[' ',0,'select'],['e',0,'build'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['ArrowUp',1,'up'],['ArrowDown',1,'down'],['ArrowLeft',1,'left'],['ArrowRight',1,'right'],['Enter',1,'select'],['Shift',1,'build'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['i',2,'up'],['k',2,'down'],['j',2,'left'],['l',2,'right'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['8',3,'up'],['5',3,'down'],['4',3,'left'],['6',3,'right'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))

// ─── Types ───────────────────────────────────────────────────
interface OrbitPlanet {
  orbitR: number
  angle: number
  size: number
  pop: number
  maxPop: number
  owner: number // -1 unowned, playerIndex or AI index
  buildings: BuildingType[]
  producing: ShipType | null
  productionProgress: number
}

interface StarSystem {
  x: number; y: number
  name: string
  color: string
  planets: OrbitPlanet[]
}

interface Ship {
  type: ShipType
  owner: number
  x: number; y: number
  targetSystem: number
  arrived: boolean
}

interface PlayerState {
  index: number
  name: string
  color: string
  input: PlayerSlot['input']
  coins: number
  gems: number
  stars: number
  research: number
  techsResearched: Tech[]
  researchTarget: number // index into TECHS
  alive: boolean
  camX: number
  camY: number
  selectedSystem: number
  isAI: boolean
}

interface GameState {
  systems: StarSystem[]
  ships: Ship[]
  players: PlayerState[]
  tick: number
  gameOver: boolean
  winner: number | null
  gameMode: string
  timerTicks: number
}

// ─── Helpers ─────────────────────────────────────────────────
function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2)
}

const STAR_NAMES = [
  'Sol', 'Orion', 'Antares', 'Sirius', 'Betelgeuse', 'Rigel', 'Vega', 'Altair',
  'Proxima', 'Polaris', 'Deneb', 'Spica', 'Aldebaran', 'Kepler', 'Andromeda',
  'Centauri', 'Canopus', 'Arcturus', 'Capella', 'Procyon',
]

function initState(humanPlayers: PlayerSlot[], galaxySize: string, startSystems: number, gameMode: string): GameState {
  const sysCount = galaxySize === 'small' ? 12 : galaxySize === 'large' ? 20 : 16
  const systems: StarSystem[] = []
  for (let i = 0; i < sysCount; i++) {
    const nPlanets = Math.floor(Math.random() * 4) // 0-3
    const planets: OrbitPlanet[] = []
    for (let p = 0; p < nPlanets; p++) {
      planets.push({
        orbitR: 16 + p * 12,
        angle: Math.random() * Math.PI * 2,
        size: 3 + Math.random() * 3,
        pop: 0, maxPop: 8 + Math.floor(Math.random() * 8),
        owner: -1,
        buildings: [],
        producing: null,
        productionProgress: 0,
      })
    }
    systems.push({
      x: 60 + Math.random() * (MAP_W - 120),
      y: 60 + Math.random() * (MAP_H - 120),
      name: STAR_NAMES[i % STAR_NAMES.length],
      color: ['#fff5b0', '#ffd280', '#aaccff', '#ffaaaa', '#aaffaa'][Math.floor(Math.random() * 5)],
      planets,
    })
  }

  // Create players
  const allPlayers: PlayerState[] = humanPlayers.map((p, i) => ({
    index: i,
    name: p.name,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    input: p.input,
    coins: 100, gems: 0, stars: 0,
    research: 0,
    techsResearched: [],
    researchTarget: 0,
    alive: true,
    camX: 0, camY: 0,
    selectedSystem: -1,
    isAI: false,
  }))

  // Add 1-2 AI opponents
  const aiCount = Math.max(1, 3 - humanPlayers.length)
  for (let i = 0; i < aiCount; i++) {
    const idx = allPlayers.length
    allPlayers.push({
      index: idx,
      name: `AI ${i + 1}`,
      color: PLAYER_COLORS[(humanPlayers.length + i) % PLAYER_COLORS.length],
      input: { type: 'keyboard', group: -1 },
      coins: 100, gems: 0, stars: 0,
      research: 0,
      techsResearched: [],
      researchTarget: 0,
      alive: true,
      camX: 0, camY: 0,
      selectedSystem: -1,
      isAI: true,
    })
  }

  // Assign starting systems
  const ships: Ship[] = []
  for (const pl of allPlayers) {
    const usedSystems = new Set(systems.flatMap((s) => s.planets.filter(p => p.owner !== -1).map(() => systems.indexOf(s))))
    for (let c = 0; c < Math.min(startSystems, sysCount); c++) {
      let sysIdx = (pl.index * 3 + c) % systems.length
      while (usedSystems.has(sysIdx)) sysIdx = (sysIdx + 1) % systems.length
      const sys = systems[sysIdx]
      if (sys.planets.length === 0) {
        sys.planets.push({
          orbitR: 16, angle: 0, size: 5, pop: 3, maxPop: 12,
          owner: pl.index, buildings: ['Factory'], producing: null, productionProgress: 0,
        })
      } else {
        sys.planets[0].owner = pl.index
        sys.planets[0].pop = 3
        sys.planets[0].buildings = ['Factory']
      }
      usedSystems.add(sysIdx)
      pl.camX = sys.x - W / 2
      pl.camY = sys.y - H / 2
    }
    // Starting scout
    const homeSys = systems.find(s => s.planets.some(p => p.owner === pl.index))
    if (homeSys) {
      ships.push({ type: 'Scout', owner: pl.index, x: homeSys.x + 20, y: homeSys.y, targetSystem: -1, arrived: true })
    }
  }

  const timerTicks = gameMode === 'timed-score' ? 600 : 0 // 600 ticks = ~5min at 500ms
  return { systems, ships, players: allPlayers, tick: 0, gameOver: false, winner: null, gameMode, timerTicks }
}

function ownedSystems(systems: StarSystem[], owner: number): number {
  return systems.filter(s => s.planets.some(p => p.owner === owner)).length
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function MasterOfOrionGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const galaxySize = config?.galaxySize ?? 'medium'
  const startSystems = config?.startingSystems ?? 1
  const gameMode = config?.gameMode ?? 'conquest'
  const stateRef = useRef<GameState>(initState(players, galaxySize, startSystems, gameMode))
  const keysDown = useRef(new Set<string>())
  const [scores, setScores] = useState<{ idx: number; name: string; systems: number; coins: number; gems: number; stars: number; techs: number; alive: boolean; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Keyboard ───────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysDown.current.add(e.key)
    const up = (e: KeyboardEvent) => keysDown.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Select / Build (edge-triggered)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const m = KEY_MAP.get(e.key)
      if (!m) return
      const st = stateRef.current
      for (const pl of st.players) {
        if (pl.isAI || !pl.alive) continue
        if (pl.input.type !== 'keyboard' || pl.input.group !== m.group) continue
        if (m.action === 'select') {
          // Find nearest system on screen
          let best = -1, bestD = 80
          for (let i = 0; i < st.systems.length; i++) {
            const s = st.systems[i]
            const sx = s.x - pl.camX
            const sy = s.y - pl.camY
            if (sx < 0 || sx > W || sy < 0 || sy > H) continue
            const d = dist(sx, sy, W / 2, H / 2)
            if (d < bestD) { bestD = d; best = i }
          }
          if (best >= 0) pl.selectedSystem = best
        }
        if (m.action === 'build' && pl.selectedSystem >= 0) {
          const sys = st.systems[pl.selectedSystem]
          const myPlanet = sys.planets.find(p => p.owner === pl.index)
          if (myPlanet) {
            // Cycle through build actions
            if (myPlanet.buildings.length < 4) {
              const opts: BuildingType[] = ['Factory', 'Lab', 'Farm', 'Shipyard']
              const next = opts.find(b => !myPlanet.buildings.includes(b))
              if (next && pl.coins >= 30) {
                pl.coins -= 30
                myPlanet.buildings.push(next)
              }
            } else if (!myPlanet.producing && myPlanet.buildings.includes('Shipyard')) {
              // Build a fighter
              if (pl.coins >= SHIP_COST.Fighter) {
                pl.coins -= SHIP_COST.Fighter
                myPlanet.producing = 'Fighter'
                myPlanet.productionProgress = 0
              }
            }
          } else {
            // Send colony ship if available
            const colonyShip = st.ships.find(s => s.type === 'Colony' && s.owner === pl.index && s.arrived)
            if (colonyShip && sys.planets.length > 0) {
              const emptyPlanet = sys.planets.find(p => p.owner === -1)
              if (emptyPlanet) {
                emptyPlanet.owner = pl.index
                emptyPlanet.pop = 2
                emptyPlanet.buildings = ['Factory']
                st.ships = st.ships.filter(s => s !== colonyShip)
                pl.stars++
              }
            } else {
              // Send fleet to selected system
              const myShips = st.ships.filter(s => s.owner === pl.index && s.arrived && s.type !== 'Colony')
              if (myShips.length > 0) {
                myShips[0].targetSystem = pl.selectedSystem
                myShips[0].arrived = false
              }
            }
          }
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ─── Game loop ──────────────────────────────────────────
  useEffect(() => {
    let raf = 0

    // Tick-based logic (strategy ticks)
    const tickTimer = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      st.tick++

      // Timer mode
      if (st.timerTicks > 0) st.timerTicks--

      // Production & growth per system
      for (const sys of st.systems) {
        for (const pl of sys.planets) {
          if (pl.owner < 0) continue
          const ownerState = st.players[pl.owner]
          if (!ownerState) continue
          const hasFactory = pl.buildings.includes('Factory')
          const hasLab = pl.buildings.includes('Lab')
          const hasFarm = pl.buildings.includes('Farm')
          // Production → coins
          if (hasFactory) ownerState.coins += 2 + Math.floor(pl.pop * 0.5)
          // Research
          if (hasLab) ownerState.research += 1 + Math.floor(pl.pop * 0.3)
          // Growth
          if (hasFarm && pl.pop < pl.maxPop) pl.pop += 0.2
          // Rare minerals (gems)
          if (Math.random() < 0.03) ownerState.gems++
          // Ship production
          if (pl.producing) {
            pl.productionProgress++
            if (pl.productionProgress >= 6) {
              st.ships.push({ type: pl.producing, owner: pl.owner, x: sys.x + 15, y: sys.y, targetSystem: -1, arrived: true })
              pl.producing = null
              pl.productionProgress = 0
            }
          }
        }
      }

      // Tech research
      for (const pl of st.players) {
        if (!pl.alive) continue
        if (pl.researchTarget < TECHS.length && !pl.techsResearched.includes(TECHS[pl.researchTarget])) {
          if (pl.research >= TECH_COSTS[pl.researchTarget]) {
            pl.research -= TECH_COSTS[pl.researchTarget]
            pl.techsResearched.push(TECHS[pl.researchTarget])
            pl.stars++
            pl.researchTarget++
          }
        }
      }

      // Move ships toward targets
      for (const ship of st.ships) {
        if (ship.arrived || ship.targetSystem < 0) continue
        const tgt = st.systems[ship.targetSystem]
        if (!tgt) { ship.arrived = true; continue }
        const dx = tgt.x - ship.x
        const dy = tgt.y - ship.y
        const d = Math.sqrt(dx * dx + dy * dy)
        const spd = SHIP_SPEED[ship.type]
        if (d < spd * 2) {
          ship.x = tgt.x + 10
          ship.y = tgt.y
          ship.arrived = true
        } else {
          ship.x += (dx / d) * spd
          ship.y += (dy / d) * spd
        }
      }

      // Combat at systems
      for (let si = 0; si < st.systems.length; si++) {
        const sys = st.systems[si]
        const nearbyShips = st.ships.filter(s => s.arrived && dist(s.x, s.y, sys.x, sys.y) < 30)
        const owners = [...new Set(nearbyShips.map(s => s.owner))]
        if (owners.length < 2) continue
        // Resolve combat — compare total power
        for (const atk of owners) {
          for (const def of owners) {
            if (atk === def) continue
            const atkPwr = nearbyShips.filter(s => s.owner === atk).reduce((s, sh) => s + SHIP_POWER[sh.type], 0)
            const defPwr = nearbyShips.filter(s => s.owner === def).reduce((s, sh) => s + SHIP_POWER[sh.type], 0)
            if (atkPwr > defPwr) {
              // Destroy defender ships
              st.ships = st.ships.filter(s => !(s.owner === def && dist(s.x, s.y, sys.x, sys.y) < 30))
              // Capture planets
              for (const p of sys.planets) {
                if (p.owner === def) {
                  p.owner = atk
                  const atkPlayer = st.players[atk]
                  if (atkPlayer) atkPlayer.stars++
                }
              }
            }
          }
        }
      }

      // AI logic (simple)
      for (const pl of st.players) {
        if (!pl.isAI || !pl.alive) continue
        // Build factories / labs
        for (const sys of st.systems) {
          for (const planet of sys.planets) {
            if (planet.owner !== pl.index) continue
            if (planet.buildings.length < 4 && pl.coins >= 30) {
              const opts: BuildingType[] = ['Factory', 'Lab', 'Shipyard', 'Farm']
              const next = opts.find(b => !planet.buildings.includes(b))
              if (next) { pl.coins -= 30; planet.buildings.push(next) }
            }
            if (!planet.producing && planet.buildings.includes('Shipyard') && pl.coins >= SHIP_COST.Fighter) {
              pl.coins -= SHIP_COST.Fighter
              planet.producing = 'Fighter'
              planet.productionProgress = 0
            }
          }
        }
        // Send idle ships to expand
        const idleShips = st.ships.filter(s => s.owner === pl.index && s.arrived && s.targetSystem < 0)
        for (const ship of idleShips) {
          const targets = st.systems.filter((s, i) => !s.planets.some(p => p.owner === pl.index) && i !== ship.targetSystem)
          if (targets.length > 0) {
            const tgt = targets[Math.floor(Math.random() * targets.length)]
            ship.targetSystem = st.systems.indexOf(tgt)
            ship.arrived = false
          }
        }
      }

      // Win conditions
      const totalSys = st.systems.length
      for (const pl of st.players) {
        if (!pl.alive) continue
        const owned = ownedSystems(st.systems, pl.index)
        if (st.gameMode === 'conquest' && owned >= Math.ceil(totalSys * 0.6)) {
          st.gameOver = true; st.winner = pl.index; break
        }
        if (st.gameMode === 'science' && pl.techsResearched.length >= TECHS.length) {
          st.gameOver = true; st.winner = pl.index; break
        }
      }
      if (st.gameMode === 'timed-score' && st.timerTicks <= 0) {
        st.gameOver = true
        const sorted = [...st.players].sort((a, b) => {
          const aScore = ownedSystems(st.systems, a.index) * 100 + a.coins + a.gems * 10 + a.stars * 50
          const bScore = ownedSystems(st.systems, b.index) * 100 + b.coins + b.gems * 10 + b.stars * 50
          return bScore - aScore
        })
        st.winner = sorted[0]?.index ?? null
      }

      // Eliminate players with no systems and no ships
      for (const pl of st.players) {
        if (!pl.alive) continue
        const owned = ownedSystems(st.systems, pl.index)
        const hasShips = st.ships.some(s => s.owner === pl.index)
        if (owned === 0 && !hasShips) pl.alive = false
      }

      // Scores
      setScores(st.players.map(pl => ({
        idx: pl.index, name: pl.name, systems: ownedSystems(st.systems, pl.index),
        coins: Math.floor(pl.coins), gems: pl.gems, stars: pl.stars,
        techs: pl.techsResearched.length, alive: pl.alive, color: pl.color,
      })))

      if (st.gameOver) {
        setGameOver(true)
        const w = st.players.find(p => p.index === st.winner)
        setWinner(w?.name ?? null)
      }
    }, TICK_MS)

    // ─── Render loop ──────────────────────────────────────
    function draw() {
      const st = stateRef.current
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')!
      canvas.width = W; canvas.height = H

      // Camera (first human player)
      const human = st.players.find(p => !p.isAI)
      const camX = human?.camX ?? 0
      const camY = human?.camY ?? 0

      // Scroll camera
      if (human) {
        if (human.input.type === 'keyboard') {
          const grp = human.input.group
          for (const [key, m] of KEY_MAP) {
            if (m.group !== grp || !keysDown.current.has(key)) continue
            if (m.action === 'up') human.camY -= SCROLL_SPD
            if (m.action === 'down') human.camY += SCROLL_SPD
            if (m.action === 'left') human.camX -= SCROLL_SPD
            if (m.action === 'right') human.camX += SCROLL_SPD
          }
        } else if (human.input.type === 'gamepad') {
          const gp = padsRef.current.find(p => p.index === (human.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) human.camY -= SCROLL_SPD
            if (gp.down) human.camY += SCROLL_SPD
            if (gp.left) human.camX -= SCROLL_SPD
            if (gp.right) human.camX += SCROLL_SPD
            // Gamepad select
            if (gp.a) {
              let best = -1, bestD = 80
              for (let i = 0; i < st.systems.length; i++) {
                const s = st.systems[i]
                const sx = s.x - human.camX
                const sy = s.y - human.camY
                if (sx < 0 || sx > W || sy < 0 || sy > H) continue
                const d = dist(sx, sy, W / 2, H / 2)
                if (d < bestD) { bestD = d; best = i }
              }
              if (best >= 0) human.selectedSystem = best
            }
            if (gp.x && human.selectedSystem >= 0) {
              const sys = st.systems[human.selectedSystem]
              const myPlanet = sys.planets.find(p => p.owner === human.index)
              if (myPlanet && myPlanet.buildings.length < 4 && human.coins >= 30) {
                const opts: BuildingType[] = ['Factory', 'Lab', 'Farm', 'Shipyard']
                const next = opts.find(b => !myPlanet.buildings.includes(b))
                if (next) { human.coins -= 30; myPlanet.buildings.push(next) }
              }
            }
          }
        }
        human.camX = Math.max(0, Math.min(MAP_W - W, human.camX))
        human.camY = Math.max(0, Math.min(MAP_H - H, human.camY))
      }

      // Background
      ctx.fillStyle = '#08080f'
      ctx.fillRect(0, 0, W, H)

      // Background stars
      ctx.fillStyle = '#fff'
      for (let i = 0; i < 200; i++) {
        const sx = ((i * 7919 + 31) % MAP_W) - camX
        const sy = ((i * 6271 + 17) % MAP_H) - camY
        if (sx < -5 || sx > W + 5 || sy < -5 || sy > H + 5) continue
        ctx.globalAlpha = 0.2 + (i % 5) * 0.15
        ctx.fillRect(sx, sy, 1, 1)
      }
      ctx.globalAlpha = 1

      // Systems
      for (let si = 0; si < st.systems.length; si++) {
        const sys = st.systems[si]
        const sx = sys.x - camX
        const sy = sys.y - camY
        if (sx < -50 || sx > W + 50 || sy < -50 || sy > H + 50) continue

        // Star
        ctx.fillStyle = sys.color
        ctx.beginPath(); ctx.arc(sx, sy, STAR_R, 0, Math.PI * 2); ctx.fill()
        // Glow
        ctx.shadowColor = sys.color; ctx.shadowBlur = 10
        ctx.beginPath(); ctx.arc(sx, sy, STAR_R - 1, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        // Planets
        for (const pl of sys.planets) {
          pl.angle += 0.005
          const px = sx + Math.cos(pl.angle) * pl.orbitR
          const py = sy + Math.sin(pl.angle) * pl.orbitR
          // Orbit line
          ctx.strokeStyle = 'rgba(255,255,255,0.1)'
          ctx.lineWidth = 0.5
          ctx.beginPath(); ctx.arc(sx, sy, pl.orbitR, 0, Math.PI * 2); ctx.stroke()
          // Planet
          ctx.fillStyle = pl.owner >= 0 ? (st.players[pl.owner]?.color ?? '#888') : '#555'
          ctx.beginPath(); ctx.arc(px, py, pl.size, 0, Math.PI * 2); ctx.fill()
          // Owner ring
          if (pl.owner >= 0) {
            ctx.strokeStyle = st.players[pl.owner]?.color ?? '#fff'
            ctx.lineWidth = 1.5
            ctx.beginPath(); ctx.arc(px, py, pl.size + 3, 0, Math.PI * 2); ctx.stroke()
          }
        }

        // System name
        ctx.fillStyle = '#aaa'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(sys.name, sx, sy + STAR_R + 14)

        // Selection ring
        if (human && human.selectedSystem === si) {
          ctx.strokeStyle = '#f1c40f'
          ctx.lineWidth = 1.5
          ctx.setLineDash([4, 3])
          ctx.beginPath(); ctx.arc(sx, sy, STAR_R + 20, 0, Math.PI * 2); ctx.stroke()
          ctx.setLineDash([])
        }
      }

      // Ships
      for (const ship of st.ships) {
        const sx = ship.x - camX
        const sy = ship.y - camY
        if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue
        const sz = ship.type === 'Battleship' ? 10 : ship.type === 'Colony' ? 8 : ship.type === 'Fighter' ? 6 : SHIP_SIZE
        ctx.fillStyle = st.players[ship.owner]?.color ?? '#fff'
        ctx.beginPath()
        ctx.moveTo(sx + sz, sy)
        ctx.lineTo(sx - sz * 0.5, sy - sz * 0.4)
        ctx.lineTo(sx - sz * 0.5, sy + sz * 0.4)
        ctx.closePath(); ctx.fill()
      }

      // HUD: selected system info
      if (human && human.selectedSystem >= 0) {
        const sys = st.systems[human.selectedSystem]
        ctx.fillStyle = 'rgba(0,0,0,0.7)'
        ctx.fillRect(5, H - 90, 220, 85)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(`★ ${sys.name}`, 12, H - 72)
        ctx.font = '10px sans-serif'
        let yy = H - 58
        for (const pl of sys.planets) {
          const ownerName = pl.owner >= 0 ? st.players[pl.owner]?.name ?? '?' : 'unclaimed'
          ctx.fillText(`Planet: pop ${Math.floor(pl.pop)} / ${pl.maxPop} — ${ownerName}`, 12, yy)
          yy += 12
        }
        if (sys.planets.length === 0) ctx.fillText('No planets', 12, yy)
      }

      // Tech HUD
      if (human) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(W - 180, 5, 175, 22)
        ctx.fillStyle = '#0ff'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`Tech: ${human.techsResearched.length}/${TECHS.length} | Research: ${Math.floor(human.research)}`, W - 10, 20)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => { clearInterval(tickTimer); cancelAnimationFrame(raf) }
  }, [])

  // ─── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, galaxySize, startSystems, gameMode)
    setGameOver(false)
    setWinner(null)
    setScores([])
  }, [players, galaxySize, startSystems, gameMode])

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
            <span className={styles.scoreValue}>⭐{s.systems}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} 🏆{s.stars} 🔬{s.techs}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Master Of Orion canvas"/>

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
