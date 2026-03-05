/**
 * LeagueOfLegendsGame — top-down MOBA mini-game for 1-4 players.
 *
 * Controls:
 *   Group 0: WASD (move) + 1/2/3 (abilities) + Q (shop)
 *   Group 1: Arrow keys (move) + 7/8/9 (abilities) + 0 (shop)
 *   Gamepad: Left stick (move) + X/Y/B (abilities) + LB (shop)
 *
 * Rules:
 *  - 3-lane MOBA with jungle. Champions level up, buy items, cast abilities.
 *  - Destroy enemy towers, then the enemy Nexus to win.
 *  - Minions auto-spawn and push lanes. Neutral camps give gold & XP.
 *  - 3 currencies: coins (gold from kills), gems (champion mastery), stars (victories).
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
const MAP_W = 1200
const MAP_H = 900
const TICK_MS = 33 // ~30fps
const MINION_SPAWN_MS = 10000
const MANA_REGEN = 1 / 30 // per tick (~1/s)
const AUTO_RANGE = 60
const BASE_HP = 200
const TOWER_HP = 120
const TOWER_RANGE = 100
const TOWER_DMG = 8
const CAMP_GOLD = 30
const CAMP_XP = 25
const MINION_GOLD = 15
const MINION_XP = 10
const CHAMP_KILL_GOLD = 50
const CHAMP_KILL_XP = 60

// ─── Types ───────────────────────────────────────────────────
interface Vec { x: number; y: number }

interface Item { name: string; atkBonus: number; hpBonus: number; speedBonus: number; apBonus: number; cost: number }

const SHOP_ITEMS: Item[] = [
  { name: 'Sword', atkBonus: 5, hpBonus: 0, speedBonus: 0, apBonus: 0, cost: 100 },
  { name: 'Shield', atkBonus: 0, hpBonus: 30, speedBonus: 0, apBonus: 0, cost: 100 },
  { name: 'Boots', atkBonus: 0, hpBonus: 0, speedBonus: 1, apBonus: 0, cost: 75 },
  { name: 'Staff', atkBonus: 0, hpBonus: 0, speedBonus: 0, apBonus: 10, cost: 150 },
]

interface Champion {
  x: number; y: number
  team: number
  hp: number; maxHp: number; mana: number; maxMana: number
  atk: number; ap: number; speed: number
  level: number; xp: number; xpToNext: number
  gold: number; gems: number; stars: number
  items: Item[]
  alive: boolean; respawnTimer: number
  facingX: number; facingY: number
  abilityCooldowns: [number, number, number]
  playerIndex: number; name: string; color: string
  input: PlayerSlot['input']; isAI: boolean
  kills: number; deaths: number
  autoAttackTimer: number
}

interface Minion {
  x: number; y: number; team: number
  hp: number; maxHp: number; atk: number
  lane: number; alive: boolean
}

interface Tower {
  x: number; y: number; team: number
  hp: number; maxHp: number; alive: boolean
  lane: number; order: number
  attackTimer: number
}

interface Base {
  x: number; y: number; team: number
  hp: number; maxHp: number; alive: boolean
}

interface Projectile {
  x: number; y: number; dx: number; dy: number
  team: number; damage: number; range: number; traveled: number
  fromChampion: number
}

interface Camp {
  x: number; y: number; hp: number; maxHp: number; alive: boolean; respawnTimer: number
}

interface GameState {
  champions: Champion[]
  minions: Minion[]
  towers: Tower[]
  bases: Base[]
  projectiles: Projectile[]
  camps: Camp[]
  tick: number
  gameOver: boolean
  winningTeam: number | null
  minionSpawnTimer: number
}

// ─── Lane Waypoints ──────────────────────────────────────────
const LANE_PATHS: Vec[][] = [
  // Top lane
  [{ x: 80, y: 80 }, { x: 300, y: 80 }, { x: 600, y: 80 }, { x: 900, y: 80 }, { x: 1120, y: 80 }],
  // Mid lane
  [{ x: 80, y: 820 }, { x: 300, y: 620 }, { x: 600, y: 450 }, { x: 900, y: 280 }, { x: 1120, y: 80 }],
  // Bot lane
  [{ x: 80, y: 820 }, { x: 300, y: 820 }, { x: 600, y: 820 }, { x: 900, y: 820 }, { x: 1120, y: 820 }],
]

// ─── Helpers ─────────────────────────────────────────────────
function dist(a: Vec, b: Vec) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function normalize(dx: number, dy: number): Vec {
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  return { x: dx / len, y: dy / len }
}

function levelUpXp(level: number) { return 50 + level * 30 }

function createTowers(team: number): Tower[] {
  const towers: Tower[] = []
  const flip = team === 0 ? 1 : -1
  // 3 towers per lane
  for (let lane = 0; lane < 3; lane++) {
    for (let order = 0; order < 3; order++) {
      const path = LANE_PATHS[lane]
      const idx = team === 0 ? 1 + order : path.length - 2 - order
      const wp = path[clamp(idx, 0, path.length - 1)]
      const ox = (team === 0 ? 40 : -40) * (order + 1) * flip
      towers.push({
        x: clamp(wp.x + ox * 0.3, 30, MAP_W - 30),
        y: wp.y,
        team, hp: TOWER_HP, maxHp: TOWER_HP, alive: true,
        lane, order, attackTimer: 0,
      })
    }
  }
  return towers
}

function createCamps(): Camp[] {
  // Jungle camps between lanes
  return [
    { x: 350, y: 300, hp: 60, maxHp: 60, alive: true, respawnTimer: 0 },
    { x: 850, y: 300, hp: 60, maxHp: 60, alive: true, respawnTimer: 0 },
    { x: 350, y: 600, hp: 60, maxHp: 60, alive: true, respawnTimer: 0 },
    { x: 850, y: 600, hp: 60, maxHp: 60, alive: true, respawnTimer: 0 },
    { x: 600, y: 450, hp: 80, maxHp: 80, alive: true, respawnTimer: 0 }, // center camp
  ]
}

function createChampion(player: PlayerSlot, team: number, isAI: boolean): Champion {
  const baseX = team === 0 ? 60 : MAP_W - 60
  const baseY = team === 0 ? MAP_H - 60 : 60
  return {
    x: baseX + (Math.random() - 0.5) * 40,
    y: baseY + (Math.random() - 0.5) * 40,
    team, hp: 100, maxHp: 100, mana: 50, maxMana: 50,
    atk: 10, ap: 15, speed: 3,
    level: 1, xp: 0, xpToNext: levelUpXp(1),
    gold: 0, gems: 0, stars: 0,
    items: [], alive: true, respawnTimer: 0,
    facingX: team === 0 ? 1 : -1, facingY: 0,
    abilityCooldowns: [0, 0, 0],
    playerIndex: player.index, name: player.name,
    color: player.color || PLAYER_COLORS[player.index] || '#fff',
    input: player.input, isAI,
    kills: 0, deaths: 0, autoAttackTimer: 0,
  }
}

function spawnMinions(state: GameState) {
  for (let team = 0; team < 2; team++) {
    for (let lane = 0; lane < 3; lane++) {
      const path = LANE_PATHS[lane]
      const start = team === 0 ? path[0] : path[path.length - 1]
      for (let i = 0; i < 3; i++) {
        state.minions.push({
          x: start.x + (Math.random() - 0.5) * 10,
          y: start.y + (Math.random() - 0.5) * 10,
          team, hp: 30, maxHp: 30, atk: 4, lane, alive: true,
        })
      }
    }
  }
}

function initState(players: PlayerSlot[], _config?: GameConfig): GameState {
  // _config?.laneCount available for ARAM mode
  const team0: PlayerSlot[] = []
  const team1: PlayerSlot[] = []
  // Divide players into 2 teams
  players.forEach((p, i) => (i % 2 === 0 ? team0 : team1).push(p))
  // Fill with AI to ensure at least 1 per team
  const champions: Champion[] = []
  team0.forEach(p => champions.push(createChampion(p, 0, false)))
  team1.forEach(p => champions.push(createChampion(p, 1, false)))
  // Add AI bots if teams are small
  while (champions.filter(c => c.team === 0).length < 2) {
    const idx = champions.length
    const bot: PlayerSlot = { index: idx, name: `Bot ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], input: { type: 'keyboard', group: -1 }, joined: true, ready: true }
    champions.push(createChampion(bot, 0, true))
  }
  while (champions.filter(c => c.team === 1).length < 2) {
    const idx = champions.length
    const bot: PlayerSlot = { index: idx, name: `Bot ${idx + 1}`, color: PLAYER_COLORS[idx % PLAYER_COLORS.length], input: { type: 'keyboard', group: -1 }, joined: true, ready: true }
    champions.push(createChampion(bot, 1, true))
  }

  const towers = [...createTowers(0), ...createTowers(1)]
  const bases: Base[] = [
    { x: 60, y: MAP_H - 60, team: 0, hp: BASE_HP, maxHp: BASE_HP, alive: true },
    { x: MAP_W - 60, y: 60, team: 1, hp: BASE_HP, maxHp: BASE_HP, alive: true },
  ]
  const state: GameState = {
    champions, minions: [], towers, bases,
    projectiles: [], camps: createCamps(),
    tick: 0, gameOver: false, winningTeam: null,
    minionSpawnTimer: 0,
  }
  spawnMinions(state)
  return state
}

// ─── Input tracking ──────────────────────────────────────────
interface InputState {
  dx: number; dy: number
  ability1: boolean; ability2: boolean; ability3: boolean
  shop: boolean
}

const KB_GROUPS: Record<string, { group: number; field: keyof InputState; value: number | boolean }>[] = [
  // Group 0
  { w: { group: 0, field: 'dy', value: -1 }, s: { group: 0, field: 'dy', value: 1 },
    a: { group: 0, field: 'dx', value: -1 }, d: { group: 0, field: 'dx', value: 1 },
    '1': { group: 0, field: 'ability1', value: true },
    '2': { group: 0, field: 'ability2', value: true },
    '3': { group: 0, field: 'ability3', value: true },
    q: { group: 0, field: 'shop', value: true } },
  // Group 1
  { ArrowUp: { group: 1, field: 'dy', value: -1 }, ArrowDown: { group: 1, field: 'dy', value: 1 },
    ArrowLeft: { group: 1, field: 'dx', value: -1 }, ArrowRight: { group: 1, field: 'dx', value: 1 },
    '7': { group: 1, field: 'ability1', value: true },
    '8': { group: 1, field: 'ability2', value: true },
    '9': { group: 1, field: 'ability3', value: true },
    '0': { group: 1, field: 'shop', value: true } },
]

const KEY_MAP = new Map<string, { group: number; field: keyof InputState; value: number | boolean }>()
for (const map of KB_GROUPS) {
  for (const [key, val] of Object.entries(map)) KEY_MAP.set(key, val)
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function LeagueOfLegendsGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const inputsRef = useRef<Map<number, InputState>>(new Map())
  const keysDown = useRef<Set<string>>(new Set())
  const [hud, setHud] = useState<{ champs: { name: string; hp: number; maxHp: number; mana: number; maxMana: number; gold: number; level: number; kills: number; deaths: number; team: number; color: string; items: string[] }[] }>({ champs: [] })
  const [gameOver, setGameOver] = useState(false)
  const [winnerTeam, setWinnerTeam] = useState<number | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Keyboard input ────────────────────────────────────────
  useEffect(() => {
    function onDown(e: KeyboardEvent) { keysDown.current.add(e.key) }
    function onUp(e: KeyboardEvent) { keysDown.current.delete(e.key) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ── Build inputs each tick from keys held ─────────────────
  function buildInputs() {
    const map = new Map<number, InputState>()
    // Init per group
    for (let g = 0; g < 4; g++) map.set(g, { dx: 0, dy: 0, ability1: false, ability2: false, ability3: false, shop: false })
    for (const key of keysDown.current) {
      const m = KEY_MAP.get(key)
      if (!m) continue
      const inp = map.get(m.group)!
      ;(inp as Record<keyof InputState, number | boolean>)[m.field] = m.value
    }
    // Gamepad inputs
    for (const gp of padsRef.current) {
      const inp: InputState = { dx: 0, dy: 0, ability1: false, ability2: false, ability3: false, shop: false }
      if (gp.up) inp.dy = -1
      if (gp.down) inp.dy = 1
      if (gp.left) inp.dx = -1
      if (gp.right) inp.dx = 1
      inp.ability1 = gp.x
      inp.ability2 = gp.y
      inp.ability3 = gp.b
      inp.shop = gp.lb
      map.set(100 + gp.index, inp) // gamepad uses 100+padIndex
    }
    inputsRef.current = map
  }

  function getInput(champ: Champion): InputState {
    if (champ.input.type === 'keyboard') return inputsRef.current.get(champ.input.group) ?? { dx: 0, dy: 0, ability1: false, ability2: false, ability3: false, shop: false }
    if (champ.input.type === 'gamepad') return inputsRef.current.get(100 + champ.input.padIndex) ?? { dx: 0, dy: 0, ability1: false, ability2: false, ability3: false, shop: false }
    return { dx: 0, dy: 0, ability1: false, ability2: false, ability3: false, shop: false }
  }

  // ── AI logic ──────────────────────────────────────────────
  function aiInput(champ: Champion, st: GameState): InputState {
    const inp: InputState = { dx: 0, dy: 0, ability1: false, ability2: false, ability3: false, shop: false }
    if (!champ.alive) return inp
    // Low HP → retreat to base
    const base = st.bases.find(b => b.team === champ.team)!
    if (champ.hp < champ.maxHp * 0.25) {
      const d = normalize(base.x - champ.x, base.y - champ.y)
      inp.dx = d.x > 0.3 ? 1 : d.x < -0.3 ? -1 : 0
      inp.dy = d.y > 0.3 ? 1 : d.y < -0.3 ? -1 : 0
      // Shop when near base
      if (dist(champ, base) < 80 && champ.gold >= 75) inp.shop = true
      return inp
    }
    // Find nearest enemy (minion or champion)
    let nearest: Vec | null = null; let nearDist = Infinity
    for (const m of st.minions) {
      if (m.team === champ.team || !m.alive) continue
      const d = dist(champ, m)
      if (d < nearDist) { nearDist = d; nearest = m }
    }
    for (const c of st.champions) {
      if (c.team === champ.team || !c.alive) continue
      const d = dist(champ, c)
      if (d < nearDist) { nearDist = d; nearest = c }
    }
    for (const tw of st.towers) {
      if (tw.team === champ.team || !tw.alive) continue
      const d = dist(champ, tw)
      if (d < nearDist) { nearDist = d; nearest = tw }
    }
    if (nearest && nearDist < 300) {
      const d = normalize(nearest.x - champ.x, nearest.y - champ.y)
      inp.dx = d.x > 0.3 ? 1 : d.x < -0.3 ? -1 : 0
      inp.dy = d.y > 0.3 ? 1 : d.y < -0.3 ? -1 : 0
      if (nearDist < 80) {
        if (champ.abilityCooldowns[0] <= 0 && champ.mana >= 10) inp.ability1 = true
        else if (champ.abilityCooldowns[1] <= 0 && champ.mana >= 15) inp.ability2 = true
        else if (champ.abilityCooldowns[2] <= 0 && champ.mana >= 20) inp.ability3 = true
      }
    } else {
      // Walk a lane toward enemy base
      const lane = champ.playerIndex % 3
      const path = LANE_PATHS[lane]
      const target = champ.team === 0 ? path[path.length - 1] : path[0]
      const d = normalize(target.x - champ.x, target.y - champ.y)
      inp.dx = d.x > 0.3 ? 1 : d.x < -0.3 ? -1 : 0
      inp.dy = d.y > 0.3 ? 1 : d.y < -0.3 ? -1 : 0
    }
    return inp
  }

  // ── Game Tick ─────────────────────────────────────────────
  useEffect(() => {
    function gameTick() {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      st.tick++
      buildInputs()

      // ── Minion spawning ────────────────────────────────
      st.minionSpawnTimer += TICK_MS
      if (st.minionSpawnTimer >= MINION_SPAWN_MS) {
        st.minionSpawnTimer = 0
        spawnMinions(st)
      }

      // ── Champion updates ───────────────────────────────
      for (const champ of st.champions) {
        // Cooldowns
        for (let i = 0; i < 3; i++) {
          if (champ.abilityCooldowns[i] > 0) champ.abilityCooldowns[i]--
        }
        // Respawn
        if (!champ.alive) {
          champ.respawnTimer--
          if (champ.respawnTimer <= 0) {
            champ.alive = true
            const base = st.bases.find(b => b.team === champ.team)!
            champ.x = base.x + (Math.random() - 0.5) * 30
            champ.y = base.y + (Math.random() - 0.5) * 30
            champ.hp = champ.maxHp
            champ.mana = champ.maxMana
          }
          continue
        }

        // Mana regen
        champ.mana = Math.min(champ.maxMana, champ.mana + MANA_REGEN)

        // Heal near base
        const ownBase = st.bases.find(b => b.team === champ.team)!
        if (dist(champ, ownBase) < 80) {
          champ.hp = Math.min(champ.maxHp, champ.hp + 0.5)
          champ.mana = Math.min(champ.maxMana, champ.mana + 0.3)
        }

        const inp = champ.isAI ? aiInput(champ, st) : getInput(champ)

        // Movement
        if (inp.dx !== 0 || inp.dy !== 0) {
          const n = normalize(inp.dx, inp.dy)
          champ.x = clamp(champ.x + n.x * champ.speed, 10, MAP_W - 10)
          champ.y = clamp(champ.y + n.y * champ.speed, 10, MAP_H - 10)
          champ.facingX = n.x
          champ.facingY = n.y
        }

        // Shop
        if (inp.shop && dist(champ, ownBase) < 80) {
          for (const item of SHOP_ITEMS) {
            if (champ.gold >= item.cost) {
              champ.gold -= item.cost
              champ.atk += item.atkBonus
              champ.maxHp += item.hpBonus; champ.hp += item.hpBonus
              champ.speed += item.speedBonus
              champ.ap += item.apBonus
              champ.items.push(item)
              break // buy one at a time
            }
          }
        }

        // Abilities
        if (inp.ability1 && champ.abilityCooldowns[0] <= 0 && champ.mana >= 10) {
          // Q — dash forward 80px, damage first enemy
          champ.mana -= 10
          champ.abilityCooldowns[0] = 30 // ~1s cooldown
          const dashDist = 80
          const nx = champ.facingX || 1; const ny = champ.facingY
          const n = normalize(nx, ny)
          champ.x = clamp(champ.x + n.x * dashDist, 10, MAP_W - 10)
          champ.y = clamp(champ.y + n.y * dashDist, 10, MAP_H - 10)
          // Damage first enemy in dash path
          for (const enemy of st.champions) {
            if (enemy.team === champ.team || !enemy.alive) continue
            if (dist(champ, enemy) < 30) {
              enemy.hp -= champ.atk + champ.ap * 0.5
              break
            }
          }
          for (const m of st.minions) {
            if (m.team === champ.team || !m.alive) continue
            if (dist(champ, m) < 30) { m.hp -= champ.atk + champ.ap * 0.5; break }
          }
        }

        if (inp.ability2 && champ.abilityCooldowns[1] <= 0 && champ.mana >= 15) {
          // W — AOE circle 40px radius
          champ.mana -= 15
          champ.abilityCooldowns[1] = 45
          const dmg = champ.ap * 0.8
          for (const enemy of st.champions) {
            if (enemy.team === champ.team || !enemy.alive) continue
            if (dist(champ, enemy) < 40) enemy.hp -= dmg
          }
          for (const m of st.minions) {
            if (m.team === champ.team || !m.alive) continue
            if (dist(champ, m) < 40) m.hp -= dmg
          }
          for (const c of st.camps) {
            if (!c.alive) continue
            if (dist(champ, c) < 40) c.hp -= dmg
          }
        }

        if (inp.ability3 && champ.abilityCooldowns[2] <= 0 && champ.mana >= 20) {
          // E — ranged skillshot
          champ.mana -= 20
          champ.abilityCooldowns[2] = 60
          const n = normalize(champ.facingX || 1, champ.facingY)
          st.projectiles.push({
            x: champ.x, y: champ.y,
            dx: n.x * 6, dy: n.y * 6,
            team: champ.team, damage: champ.ap,
            range: 200, traveled: 0, fromChampion: champ.playerIndex,
          })
        }

        // Auto-attack
        if (inp.dx === 0 && inp.dy === 0) {
          champ.autoAttackTimer++
          if (champ.autoAttackTimer >= 15) {
            champ.autoAttackTimer = 0
            // Attack nearest enemy in range
            let target: { obj: { hp: number }; dist: number } | null = null
            for (const enemy of st.champions) {
              if (enemy.team === champ.team || !enemy.alive) continue
              const d = dist(champ, enemy)
              if (d < AUTO_RANGE && (!target || d < target.dist)) target = { obj: enemy, dist: d }
            }
            for (const m of st.minions) {
              if (m.team === champ.team || !m.alive) continue
              const d = dist(champ, m)
              if (d < AUTO_RANGE && (!target || d < target.dist)) target = { obj: m, dist: d }
            }
            for (const tw of st.towers) {
              if (tw.team === champ.team || !tw.alive) continue
              const d = dist(champ, tw)
              if (d < AUTO_RANGE && (!target || d < target.dist)) target = { obj: tw, dist: d }
            }
            for (const c of st.camps) {
              if (!c.alive) continue
              const d = dist(champ, c)
              if (d < AUTO_RANGE && (!target || d < target.dist)) target = { obj: c, dist: d }
            }
            for (const b of st.bases) {
              if (b.team === champ.team || !b.alive) continue
              const d = dist(champ, b)
              if (d < AUTO_RANGE && (!target || d < target.dist)) target = { obj: b, dist: d }
            }
            if (target) {
              target.obj.hp -= champ.atk
            }
          }
        } else {
          champ.autoAttackTimer = 0
        }
      }

      // ── Projectiles ────────────────────────────────────
      for (let i = st.projectiles.length - 1; i >= 0; i--) {
        const p = st.projectiles[i]
        p.x += p.dx; p.y += p.dy; p.traveled += Math.sqrt(p.dx * p.dx + p.dy * p.dy)
        if (p.traveled >= p.range || p.x < 0 || p.x > MAP_W || p.y < 0 || p.y > MAP_H) {
          st.projectiles.splice(i, 1); continue
        }
        // Hit check
        let hit = false
        for (const enemy of st.champions) {
          if (enemy.team === p.team || !enemy.alive) continue
          if (dist(p, enemy) < 12) { enemy.hp -= p.damage; hit = true; break }
        }
        if (!hit) {
          for (const m of st.minions) {
            if (m.team === p.team || !m.alive) continue
            if (dist(p, m) < 8) { m.hp -= p.damage; hit = true; break }
          }
        }
        if (hit) st.projectiles.splice(i, 1)
      }

      // ── Tower attacks ──────────────────────────────────
      for (const tw of st.towers) {
        if (!tw.alive) continue
        tw.attackTimer++
        if (tw.attackTimer < 20) continue
        // Find nearest enemy in range
        let nearest: { hp: number } | null = null; let nearDist = Infinity
        for (const m of st.minions) {
          if (m.team === tw.team || !m.alive) continue
          const d = dist(tw, m)
          if (d < TOWER_RANGE && d < nearDist) { nearest = m; nearDist = d }
        }
        for (const c of st.champions) {
          if (c.team === tw.team || !c.alive) continue
          const d = dist(tw, c)
          if (d < TOWER_RANGE && d < nearDist) { nearest = c; nearDist = d }
        }
        if (nearest) { nearest.hp -= TOWER_DMG; tw.attackTimer = 0 }
      }

      // ── Minion AI ──────────────────────────────────────
      for (const m of st.minions) {
        if (!m.alive) continue
        // Walk along lane toward enemy base
        const path = LANE_PATHS[m.lane]
        const waypoints = m.team === 0 ? path : [...path].reverse()
        // Find next waypoint
        let target = waypoints[waypoints.length - 1]
        for (const wp of waypoints) {
          if (dist(m, wp) > 20) { target = wp; break }
        }
        // Check for nearby enemy to attack
        let enemy: { hp: number } | null = null; let eDist = Infinity
        for (const other of st.minions) {
          if (other.team === m.team || !other.alive) continue
          const d = dist(m, other)
          if (d < 30 && d < eDist) { enemy = other; eDist = d }
        }
        for (const c of st.champions) {
          if (c.team === m.team || !c.alive) continue
          const d = dist(m, c)
          if (d < 30 && d < eDist) { enemy = c; eDist = d }
        }
        for (const tw of st.towers) {
          if (tw.team === m.team || !tw.alive) continue
          const d = dist(m, tw)
          if (d < 30 && d < eDist) { enemy = tw; eDist = d }
        }
        if (enemy) {
          enemy.hp -= m.atk * 0.05
        } else {
          const n = normalize(target.x - m.x, target.y - m.y)
          m.x += n.x * 1.2
          m.y += n.y * 1.2
        }
      }

      // ── Camp respawns ──────────────────────────────────
      for (const c of st.camps) {
        if (!c.alive) {
          c.respawnTimer--
          if (c.respawnTimer <= 0) { c.alive = true; c.hp = c.maxHp }
        }
      }

      // ── Death checks ───────────────────────────────────
      // Minions
      for (const m of st.minions) {
        if (m.alive && m.hp <= 0) {
          m.alive = false
          // Credit gold/xp to nearby enemy champions
          for (const c of st.champions) {
            if (c.team !== m.team && c.alive && dist(c, m) < 150) {
              c.gold += MINION_GOLD
              c.xp += MINION_XP
            }
          }
        }
      }
      // Remove dead minions periodically
      if (st.tick % 30 === 0) {
        st.minions = st.minions.filter(m => m.alive)
      }
      // Camps
      for (const c of st.camps) {
        if (c.alive && c.hp <= 0) {
          c.alive = false
          c.respawnTimer = 300 // ~10s
          for (const ch of st.champions) {
            if (ch.alive && dist(ch, c) < 80) {
              ch.gold += CAMP_GOLD; ch.xp += CAMP_XP
            }
          }
        }
      }
      // Towers
      for (const tw of st.towers) {
        if (tw.alive && tw.hp <= 0) {
          tw.alive = false
          for (const c of st.champions) {
            if (c.team !== tw.team && c.alive && dist(c, tw) < 200) c.gold += 50
          }
        }
      }
      // Champions
      for (const c of st.champions) {
        if (c.alive && c.hp <= 0) {
          c.alive = false; c.deaths++
          c.respawnTimer = 90 + c.level * 10 // ~3-5s
          // Credit killer
          for (const killer of st.champions) {
            if (killer.team !== c.team && killer.alive && dist(killer, c) < 200) {
              killer.kills++; killer.gold += CHAMP_KILL_GOLD; killer.xp += CHAMP_KILL_XP
              killer.gems += 1
              break
            }
          }
        }
      }
      // Level ups
      for (const c of st.champions) {
        while (c.xp >= c.xpToNext && c.level < 18) {
          c.xp -= c.xpToNext; c.level++
          c.xpToNext = levelUpXp(c.level)
          c.maxHp += 15; c.hp = Math.min(c.hp + 15, c.maxHp)
          c.atk += 2; c.ap += 3
          c.maxMana += 5; c.mana = Math.min(c.mana + 5, c.maxMana)
        }
      }
      // Bases
      for (const b of st.bases) {
        if (b.alive && b.hp <= 0) {
          b.alive = false
          st.gameOver = true
          st.winningTeam = b.team === 0 ? 1 : 0
          // Award stars
          for (const c of st.champions) {
            if (c.team === st.winningTeam) c.stars += 1
          }
        }
      }

      // ── Check tower gate logic ─────────────────────────
      // Base can only take damage if at least 1 tower of defending team is down per lane
      for (const b of st.bases) {
        if (!b.alive) continue
        const hasPath = st.towers.filter(tw => tw.team === b.team && tw.alive).length < 9
        if (!hasPath) b.hp = Math.max(b.hp, 1) // prevent base damage if all towers up
      }

      // ── HUD update ────────────────────────────────────
      setHud({
        champs: st.champions.filter(c => !c.isAI).map(c => ({
          name: c.name, hp: Math.ceil(c.hp), maxHp: c.maxHp,
          mana: Math.ceil(c.mana), maxMana: c.maxMana,
          gold: c.gold, level: c.level,
          kills: c.kills, deaths: c.deaths,
          team: c.team, color: c.color,
          items: c.items.map(it => it.name),
        })),
      })

      if (st.gameOver) {
        setGameOver(true)
        setWinnerTeam(st.winningTeam)
      }
    }

    const timer = setInterval(gameTick, TICK_MS)
    return () => clearInterval(timer)
    // Mount-only: game loop timer initialized once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ─────────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = CW; canvas.height = CH

      // Camera follows first human champion
      const hero = st.champions.find(c => !c.isAI) ?? st.champions[0]
      const camX = clamp(hero.x - CW / 2, 0, MAP_W - CW)
      const camY = clamp(hero.y - CH / 2, 0, MAP_H - CH)
      ctx.save()
      ctx.translate(-camX, -camY)

      // ── Background ────────────────────────────────────
      ctx.fillStyle = '#1a3a1a'
      ctx.fillRect(0, 0, MAP_W, MAP_H)

      // Lanes (paths)
      ctx.strokeStyle = '#4a3a2a'
      ctx.lineWidth = 20
      for (const path of LANE_PATHS) {
        ctx.beginPath()
        ctx.moveTo(path[0].x, path[0].y)
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y)
        ctx.stroke()
      }

      // Jungle (green patches)
      ctx.fillStyle = '#0d4a0d'
      ctx.fillRect(200, 180, 250, 180)
      ctx.fillRect(750, 180, 250, 180)
      ctx.fillRect(200, 540, 250, 180)
      ctx.fillRect(750, 540, 250, 180)

      // ── Camps ──────────────────────────────────────────
      for (const c of st.camps) {
        if (!c.alive) continue
        ctx.fillStyle = '#a06020'
        ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(c.x - 10, c.y + 8, 5, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(c.x + 10, c.y + 6, 5, 0, Math.PI * 2); ctx.fill()
        // HP bar
        ctx.fillStyle = '#333'; ctx.fillRect(c.x - 12, c.y - 16, 24, 3)
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(c.x - 12, c.y - 16, 24 * (c.hp / c.maxHp), 3)
      }

      // ── Bases ──────────────────────────────────────────
      for (const b of st.bases) {
        ctx.fillStyle = b.team === 0 ? '#2980b9' : '#c0392b'
        ctx.globalAlpha = b.alive ? 1 : 0.3
        ctx.beginPath(); ctx.arc(b.x, b.y, 30, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
        // HP bar
        if (b.alive) {
          ctx.fillStyle = '#333'; ctx.fillRect(b.x - 25, b.y - 40, 50, 5)
          ctx.fillStyle = '#2ecc71'; ctx.fillRect(b.x - 25, b.y - 40, 50 * (b.hp / b.maxHp), 5)
        }
        ctx.globalAlpha = 1
      }

      // ── Towers ─────────────────────────────────────────
      for (const tw of st.towers) {
        if (!tw.alive) { ctx.fillStyle = '#333'; ctx.globalAlpha = 0.2 } else {
          ctx.fillStyle = tw.team === 0 ? '#5dade2' : '#e74c3c'; ctx.globalAlpha = 1
        }
        ctx.fillRect(tw.x - 6, tw.y - 6, 12, 12)
        if (tw.alive) {
          ctx.fillStyle = '#333'; ctx.fillRect(tw.x - 8, tw.y - 14, 16, 3)
          ctx.fillStyle = '#2ecc71'; ctx.fillRect(tw.x - 8, tw.y - 14, 16 * (tw.hp / tw.maxHp), 3)
        }
        ctx.globalAlpha = 1
      }

      // ── Minions ────────────────────────────────────────
      for (const m of st.minions) {
        if (!m.alive) continue
        ctx.fillStyle = m.team === 0 ? '#85c1e9' : '#f1948a'
        ctx.beginPath(); ctx.arc(m.x, m.y, 3, 0, Math.PI * 2); ctx.fill()
      }

      // ── Projectiles ───────────────────────────────────
      for (const p of st.projectiles) {
        ctx.fillStyle = '#f1c40f'
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill()
        ctx.shadowColor = '#f1c40f'; ctx.shadowBlur = 6; ctx.fill(); ctx.shadowBlur = 0
      }

      // ── Champions ─────────────────────────────────────
      for (const c of st.champions) {
        if (!c.alive) continue
        ctx.fillStyle = c.color
        ctx.beginPath(); ctx.arc(c.x, c.y, 10, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = c.team === 0 ? '#2980b9' : '#c0392b'
        ctx.lineWidth = 2; ctx.stroke()
        // HP bar
        ctx.fillStyle = '#333'; ctx.fillRect(c.x - 12, c.y - 18, 24, 3)
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(c.x - 12, c.y - 18, 24 * (c.hp / c.maxHp), 3)
        // Mana bar
        ctx.fillStyle = '#333'; ctx.fillRect(c.x - 12, c.y - 14, 24, 2)
        ctx.fillStyle = '#3498db'; ctx.fillRect(c.x - 12, c.y - 14, 24 * (c.mana / c.maxMana), 2)
        // Level badge
        ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${c.level}`, c.x, c.y + 3)
      }

      ctx.restore()

      // ── Minimap (bottom-right) ─────────────────────────
      const mmW = 140; const mmH = 105
      const mmX = CW - mmW - 8; const mmY = CH - mmH - 8
      ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(mmX, mmY, mmW, mmH)
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(mmX, mmY, mmW, mmH)
      const sx = mmW / MAP_W; const sy = mmH / MAP_H
      // Towers on minimap
      for (const tw of st.towers) {
        if (!tw.alive) continue
        ctx.fillStyle = tw.team === 0 ? '#5dade2' : '#e74c3c'
        ctx.fillRect(mmX + tw.x * sx - 1, mmY + tw.y * sy - 1, 3, 3)
      }
      // Bases on minimap
      for (const b of st.bases) {
        ctx.fillStyle = b.team === 0 ? '#2980b9' : '#c0392b'
        ctx.beginPath(); ctx.arc(mmX + b.x * sx, mmY + b.y * sy, 4, 0, Math.PI * 2); ctx.fill()
      }
      // Champions on minimap
      for (const c of st.champions) {
        if (!c.alive) continue
        ctx.fillStyle = c.color
        ctx.beginPath(); ctx.arc(mmX + c.x * sx, mmY + c.y * sy, 3, 0, Math.PI * 2); ctx.fill()
      }
      // Camera viewport
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.5
      ctx.strokeRect(mmX + camX * sx, mmY + camY * sy, CW * sx, CH * sy)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Restart ────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinnerTeam(null)
    setHud({ champs: [] })
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
      {/* HUD */}
      <div className={styles.scoreboard}>
        {hud.champs.map((c, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: c.color }} />
            <span>{c.name}</span>
            <span style={{ color: '#2ecc71', fontSize: '0.8rem' }}>♥{c.hp}/{c.maxHp}</span>
            <span style={{ color: '#3498db', fontSize: '0.8rem' }}>◆{c.mana}/{c.maxMana}</span>
            <span style={{ color: '#f1c40f', fontSize: '0.8rem' }}>🪙{c.gold}</span>
            <span style={{ fontSize: '0.8rem' }}>Lv{c.level}</span>
            <span style={{ fontSize: '0.8rem' }}>{c.kills}/{c.deaths}</span>
            {c.items.length > 0 && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>[{c.items.join(',')}]</span>}
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="League Of Legends canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winnerTeam != null && (
            <p className={styles.winnerText}>
              🏆 {winnerTeam === 0 ? t('miniGames.blueTeam', 'Blue Team') : t('miniGames.redTeam', 'Red Team')} {t('miniGames.wins', 'wins')}!
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
