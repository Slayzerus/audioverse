/**
 * DoomGame — Doom-inspired FPS with raycasting pseudo-3D.
 *
 * Controls (per keyboard group):
 *   Group 0: W/S forward/back, A/D turn, Space shoot, E weapon swap, Q use/door
 *   Group 1: Arrows forward/back/turn, Enter shoot, Shift weapon swap, Ctrl use
 * Gamepads: left stick move/turn, A/RT shoot, X weapon swap, Y use
 *
 * Modes:
 *  - Campaign: clear 3 levels of enemies, find exits
 *  - VS Deathmatch: kill other players on same map (split-screen raycasting)
 *  - Co-op Survival: navigate & fight together
 *
 * Currencies: coins (from kills), gems (secret areas), stars (level completions)
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
const CW = 800, CH = 600
const MAP_W = 16, MAP_H = 16
const FOV = Math.PI / 3          // 60°
const NUM_RAYS = 200
const MAX_DEPTH = 20
const MINI_SIZE = 120             // minimap px
const MOVE_SPEED = 0.04
const TURN_SPEED = 0.04
const VERT_PITCH_MAX = 80         // max crosshair offset px

// Weapons: { name, damage, cooldownMs, spread, ammoUse, range }
const WEAPONS = [
  { name: 'Fist', damage: 1, cooldown: 100, spread: 0, ammoUse: 0, range: 1.2, icon: '👊' },
  { name: 'Pistol', damage: 3, cooldown: 500, spread: 0, ammoUse: 1, range: 15, icon: '🔫' },
  { name: 'Shotgun', damage: 5, cooldown: 1000, spread: 3, ammoUse: 2, range: 8, icon: '💥' },
  { name: 'Rocket', damage: 10, cooldown: 2000, spread: 0, ammoUse: 5, range: 15, icon: '🚀' },
] as const

// ─── Map templates (16×16) ──────────────────────────────────
const LEVEL_MAPS: string[][] = [
  // Level 1 — simple corridors
  [
    '################',
    '#..............#',
    '#..##....##..*.#',
    '#..#......#....#',
    '#..#..EE..#..###',
    '#.....E........#',
    '#..####..####..#',
    '#..#........#..#',
    '#..#..*..*..#..#',
    '#..####..####..#',
    '#......E.......#',
    '#..##......##..#',
    '#..#...EE...#..#',
    '#..*........*..#',
    '#.............X#',
    '################',
  ],
  // Level 2 — more enemies, secrets
  [
    '################',
    '#..*...........#',
    '#.####..####.*.#',
    '#.#..E....E.#..#',
    '#.#.........#..#',
    '#.####..##.##..#',
    '#.........E....#',
    '#..##.####.##..#',
    '#..#...*..E.#..#',
    '#..##.####.##..#',
    '#..........E...#',
    '#.####..####.*.#',
    '#.#.EE....EE.#.#',
    '#.#..........#.#',
    '#..*........X*.#',
    '################',
  ],
  // Level 3 — boss level
  [
    '################',
    '#..*..........X#',
    '#.####.####.####',
    '#.#.E....E....##',
    '#.#...........##',
    '#.####.B.####..#',
    '#..........E...#',
    '#.##.######.##.#',
    '#.#..*....*..#.#',
    '#.##.######.##.#',
    '#.........E....#',
    '#.####.####.####',
    '#.#..EE..EE..#.#',
    '#.#..........#.#',
    '#..*........*..#',
    '################',
  ],
]

// ─── Types ───────────────────────────────────────────────────
interface Vec2 { x: number; y: number }
interface Enemy {
  x: number; y: number; hp: number; maxHp: number
  kind: 'imp' | 'demon' | 'boss'; speed: number; damage: number
  attackCd: number; alive: boolean; alertTimer: number
}
interface Pickup { x: number; y: number; kind: 'health' | 'ammo' | 'armor'; taken: boolean }
interface Projectile { x: number; y: number; dx: number; dy: number; damage: number; owner: number; life: number }
interface DoomPlayer {
  idx: number; x: number; y: number; angle: number; pitch: number
  hp: number; maxHp: number; armor: number; ammo: number
  weaponIdx: number; shootCd: number; alive: boolean
  color: string; name: string; input: PlayerSlot['input']
  kills: number; coins: number; gems: number; stars: number
}
interface GS {
  players: DoomPlayer[]; enemies: Enemy[]; pickups: Pickup[]; projectiles: Projectile[]
  map: string[]; level: number; maxLevel: number
  mode: string; gameOver: boolean; winner: number | null; time: number
  secretsFound: Set<string>
}

// ─── Helpers ─────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
function distV(a: Vec2, b: Vec2) { return Math.hypot(a.x - b.x, a.y - b.y) }
function isWall(map: string[], mx: number, my: number) {
  if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return true
  return map[my][mx] === '#'
}

function spawnEnemies(map: string[], level: number): Enemy[] {
  const enemies: Enemy[] = []
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === 'E') {
        const roll = Math.random()
        const kind = level >= 3 && roll < 0.1 ? 'boss' : roll < 0.5 ? 'imp' : 'demon'
        const hp = kind === 'boss' ? 50 : kind === 'demon' ? 20 : 10
        const speed = kind === 'boss' ? 0.008 : kind === 'demon' ? 0.025 : 0.015
        const dmg = kind === 'boss' ? 5 : kind === 'demon' ? 4 : 2
        enemies.push({ x: x + 0.5, y: y + 0.5, hp, maxHp: hp, kind, speed, damage: dmg, attackCd: 0, alive: true, alertTimer: 0 })
      } else if (map[y][x] === 'B') {
        enemies.push({ x: x + 0.5, y: y + 0.5, hp: 50, maxHp: 50, kind: 'boss', speed: 0.008, damage: 5, attackCd: 0, alive: true, alertTimer: 0 })
      }
    }
  }
  return enemies
}

function spawnPickups(map: string[]): Pickup[] {
  const pickups: Pickup[] = []
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      if (map[y][x] === '.' && Math.random() < 0.06) {
        const r = Math.random()
        const kind = r < 0.4 ? 'health' : r < 0.75 ? 'ammo' : 'armor'
        pickups.push({ x: x + 0.5, y: y + 0.5, kind, taken: false })
      }
    }
  }
  return pickups
}

function spawnPlayer(p: PlayerSlot, map: string[], idx: number): DoomPlayer {
  // Find empty spots for spawning
  const spawns: Vec2[] = []
  for (let y = 1; y < MAP_H - 1; y++) {
    for (let x = 1; x < MAP_W - 1; x++) {
      if (map[y][x] === '.' && x < 4 && y > MAP_H - 4) spawns.push({ x: x + 0.5, y: y + 0.5 })
    }
  }
  if (spawns.length === 0) spawns.push({ x: 1.5, y: MAP_H - 1.5 })
  const sp = spawns[idx % spawns.length]
  return {
    idx, x: sp.x, y: sp.y, angle: 0, pitch: 0,
    hp: 100, maxHp: 100, armor: 0, ammo: 30,
    weaponIdx: 1, shootCd: 0, alive: true,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, input: p.input,
    kills: 0, coins: 0, gems: 0, stars: 0,
  }
}

function initState(players: PlayerSlot[], config: GameConfig): GS {
  const level = 1
  const map = LEVEL_MAPS[0].slice()
  const mode = (config.gameMode as string) || 'campaign'
  const weaponStart = (config.weaponStart as string) || 'pistol'
  const ps = players.map((p, i) => {
    const pl = spawnPlayer(p, map, i)
    if (weaponStart === 'fist-only') { pl.weaponIdx = 0; pl.ammo = 0 }
    else if (weaponStart === 'shotgun') { pl.weaponIdx = 2; pl.ammo = 40 }
    return pl
  })
  return {
    players: ps, enemies: spawnEnemies(map, level), pickups: spawnPickups(map),
    projectiles: [], map, level, maxLevel: 3, mode,
    gameOver: false, winner: null, time: 0, secretsFound: new Set(),
  }
}

// ─── Raycasting ──────────────────────────────────────────────
function castRay(map: string[], ox: number, oy: number, angle: number): { dist: number; side: number; mapX: number; mapY: number } {
  const sinA = Math.sin(angle), cosA = Math.cos(angle)
  const dx = cosA, dy = sinA
  let t = 0
  const step = 0.02
  while (t < MAX_DEPTH) {
    const cx = ox + dx * t, cy = oy + dy * t
    const mx = Math.floor(cx), my = Math.floor(cy)
    if (mx < 0 || mx >= MAP_W || my < 0 || my >= MAP_H) return { dist: t, side: 0, mapX: mx, mapY: my }
    if (map[my][mx] === '#') {
      const fracX = cx - mx
      const side = (fracX < 0.01 || fracX > 0.99) ? 0 : 1
      return { dist: t, side, mapX: mx, mapY: my }
    }
    t += step
  }
  return { dist: MAX_DEPTH, side: 0, mapX: 0, mapY: 0 }
}

// ─── Input state ────────────────────────────────────────────
interface InputState {
  forward: boolean; backward: boolean; turnLeft: boolean; turnRight: boolean
  pitchUp: boolean; pitchDown: boolean; shoot: boolean; weaponSwitch: boolean; use: boolean
}
function emptyInput(): InputState {
  return { forward: false, backward: false, turnLeft: false, turnRight: false, pitchUp: false, pitchDown: false, shoot: false, weaponSwitch: false, use: false }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function DoomGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GS>(initState(players, config))
  const inputsRef = useRef<Map<number, InputState>>(new Map())
  const weaponSwitchLockRef = useRef<Set<number>>(new Set())
  const useLockRef = useRef<Set<number>>(new Set())
  const [hud, setHud] = useState<{ hp: number; ammo: number; weapon: string; kills: number; coins: number; gems: number; stars: number; level: number }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Init inputs
  useEffect(() => {
    for (const p of players) {
      inputsRef.current.set(p.index, emptyInput())
    }
  }, [players])

  // ─── Keyboard input ─────────────────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent, down: boolean) {
      const st = stateRef.current
      for (const pl of st.players) {
        if (!pl.alive) continue
        const inp = inputsRef.current.get(pl.idx)
        if (!inp) continue
        if (pl.input.type === 'keyboard' && pl.input.group === 0) {
          if (e.key === 'w' || e.key === 'W') inp.forward = down
          if (e.key === 's' || e.key === 'S') inp.backward = down
          if (e.key === 'a' || e.key === 'A') inp.turnLeft = down
          if (e.key === 'd' || e.key === 'D') inp.turnRight = down
          if (e.key === ' ') inp.shoot = down
          if (e.key === 'e' || e.key === 'E') inp.weaponSwitch = down
          if (e.key === 'q' || e.key === 'Q') inp.use = down
        }
        if (pl.input.type === 'keyboard' && pl.input.group === 1) {
          if (e.key === 'ArrowUp') inp.forward = down
          if (e.key === 'ArrowDown') inp.backward = down
          if (e.key === 'ArrowLeft') inp.turnLeft = down
          if (e.key === 'ArrowRight') inp.turnRight = down
          if (e.key === 'Enter') inp.shoot = down
          if (e.key === 'Shift') inp.weaponSwitch = down
          if (e.key === 'Control') inp.use = down
        }
        // Vertical pitch (both groups)
        if (pl.input.type === 'keyboard') {
          if (e.key === 'r' || e.key === 'R' || e.key === 'PageUp') inp.pitchUp = down
          if (e.key === 'f' || e.key === 'F' || e.key === 'PageDown') inp.pitchDown = down
        }
      }
    }
    const onDown = (e: KeyboardEvent) => handler(e, true)
    const onUp = (e: KeyboardEvent) => handler(e, false)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ─── Gamepad polling ─────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function poll() {
      const st = stateRef.current
      const currentPads = padsRef.current
      for (const pl of st.players) {
        if (pl.input.type !== 'gamepad') continue
        const inp = inputsRef.current.get(pl.idx) ?? emptyInput()
        const padIdx = (pl.input as { type: 'gamepad'; padIndex: number }).padIndex
        const gp = currentPads.find(p => p.index === padIdx)
        if (!gp) continue
        inp.forward = gp.up
        inp.backward = gp.down
        inp.turnLeft = gp.left
        inp.turnRight = gp.right
        inp.shoot = gp.a
        inp.weaponSwitch = gp.x
        inp.use = gp.y
        // right stick Y for pitch
        const raw = navigator.getGamepads?.()[padIdx]
        if (raw && raw.axes.length >= 4) {
          inp.pitchUp = raw.axes[3] < -0.3
          inp.pitchDown = raw.axes[3] > 0.3
        }
        inputsRef.current.set(pl.idx, inp)
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Game loop ───────────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now()
    let raf = 0

    function loop(now: number) {
      const dtRaw = now - lastTime
      lastTime = now
      if (pauseRef.current || stateRef.current.gameOver) { raf = requestAnimationFrame(loop); return }
      const dt = Math.min(dtRaw, 50) // cap delta
      const st = stateRef.current
      st.time += dt

      // ── Update each player ──
      for (const pl of st.players) {
        if (!pl.alive) continue
        const inp = inputsRef.current.get(pl.idx) ?? emptyInput()

        // Turning
        if (inp.turnLeft) pl.angle -= TURN_SPEED * (dt / 16)
        if (inp.turnRight) pl.angle += TURN_SPEED * (dt / 16)

        // Pitch
        if (inp.pitchUp) pl.pitch = clamp(pl.pitch - 2 * (dt / 16), -VERT_PITCH_MAX, VERT_PITCH_MAX)
        if (inp.pitchDown) pl.pitch = clamp(pl.pitch + 2 * (dt / 16), -VERT_PITCH_MAX, VERT_PITCH_MAX)

        // Movement
        const speed = MOVE_SPEED * (dt / 16)
        let mx = 0, my = 0
        if (inp.forward) { mx += Math.cos(pl.angle) * speed; my += Math.sin(pl.angle) * speed }
        if (inp.backward) { mx -= Math.cos(pl.angle) * speed * 0.6; my -= Math.sin(pl.angle) * speed * 0.6 }
        const nx = pl.x + mx, ny = pl.y + my
        const margin = 0.2
        if (!isWall(st.map, Math.floor(nx + margin * Math.sign(mx)), Math.floor(pl.y))) pl.x = nx
        if (!isWall(st.map, Math.floor(pl.x), Math.floor(ny + margin * Math.sign(my)))) pl.y = ny

        // Shooting
        pl.shootCd = Math.max(0, pl.shootCd - dt)
        if (inp.shoot && pl.shootCd <= 0) {
          const w = WEAPONS[pl.weaponIdx]
          if (pl.ammo >= w.ammoUse || w.ammoUse === 0) {
            pl.ammo -= w.ammoUse
            pl.shootCd = w.cooldown
            if (pl.weaponIdx === 0) {
              // Fist — melee hit
              for (const en of st.enemies) {
                if (!en.alive) continue
                if (distV(pl, en) < w.range) { en.hp -= w.damage; if (en.hp <= 0) { en.alive = false; pl.kills++; pl.coins += 5 } }
              }
              // VS: hit other players
              if (st.mode === 'vs-deathmatch') {
                for (const op of st.players) {
                  if (op.idx === pl.idx || !op.alive) continue
                  if (distV(pl, op) < w.range) {
                    const dmg = pl.armor > 0 ? Math.ceil(w.damage * 0.5) : w.damage
                    op.hp -= dmg; if (op.hp <= 0) { op.alive = false; pl.kills++; pl.coins += 10 }
                  }
                }
              }
            } else if (w.spread > 0) {
              // Shotgun — spread
              for (let i = 0; i < w.spread; i++) {
                const a = pl.angle + (i - 1) * 0.12
                st.projectiles.push({ x: pl.x, y: pl.y, dx: Math.cos(a) * 0.15, dy: Math.sin(a) * 0.15, damage: Math.ceil(w.damage / w.spread), owner: pl.idx, life: 600 })
              }
            } else {
              // Pistol / Rocket
              st.projectiles.push({ x: pl.x, y: pl.y, dx: Math.cos(pl.angle) * 0.15, dy: Math.sin(pl.angle) * 0.15, damage: w.damage, owner: pl.idx, life: 1200 })
            }
          }
        }

        // Weapon switch (edge triggered)
        if (inp.weaponSwitch) {
          if (!weaponSwitchLockRef.current.has(pl.idx)) {
            weaponSwitchLockRef.current.add(pl.idx)
            pl.weaponIdx = (pl.weaponIdx + 1) % WEAPONS.length
          }
        } else {
          weaponSwitchLockRef.current.delete(pl.idx)
        }

        // Use / door (check for exit)
        if (inp.use) {
          if (!useLockRef.current.has(pl.idx)) {
            useLockRef.current.add(pl.idx)
            const tileX = Math.floor(pl.x), tileY = Math.floor(pl.y)
            // Check surrounding tiles for exit
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const cx = tileX + dx, cy = tileY + dy
                if (cx >= 0 && cx < MAP_W && cy >= 0 && cy < MAP_H && st.map[cy][cx] === 'X') {
                  // Level complete
                  pl.stars++
                  if (st.level < st.maxLevel) {
                    // Advance level
                    st.level++
                    const nextMap = LEVEL_MAPS[st.level - 1].slice()
                    st.map = nextMap
                    st.enemies = spawnEnemies(nextMap, st.level)
                    st.pickups = spawnPickups(nextMap)
                    st.projectiles = []
                    // Respawn players
                    for (const p2 of st.players) {
                      const sp = spawnPlayer(players[p2.idx] || players[0], nextMap, p2.idx)
                      p2.x = sp.x; p2.y = sp.y; p2.angle = 0
                      p2.hp = Math.min(p2.hp + 30, p2.maxHp) // heal on level up
                    }
                  } else {
                    // All levels cleared — win
                    st.gameOver = true
                    st.winner = pl.idx
                  }
                }
              }
            }
          }
        } else {
          useLockRef.current.delete(pl.idx)
        }

        // Pickups
        for (const pk of st.pickups) {
          if (pk.taken) continue
          if (distV(pl, pk) < 0.6) {
            pk.taken = true
            if (pk.kind === 'health') pl.hp = Math.min(pl.hp + 20, pl.maxHp)
            else if (pk.kind === 'ammo') pl.ammo += 10
            else if (pk.kind === 'armor') pl.armor = Math.min(pl.armor + 30, 100)
          }
        }

        // Secret areas (tiles marked * give gems once)
        const tKey = `${Math.floor(pl.x)},${Math.floor(pl.y)}`
        const tileChar = st.map[Math.floor(pl.y)]?.[Math.floor(pl.x)]
        if (tileChar === '*' && !st.secretsFound.has(tKey)) {
          st.secretsFound.add(tKey)
          pl.gems += 3
        }
      }

      // ── Projectiles ──
      for (let i = st.projectiles.length - 1; i >= 0; i--) {
        const b = st.projectiles[i]
        b.x += b.dx * (dt / 16); b.y += b.dy * (dt / 16); b.life -= dt
        if (b.life <= 0 || isWall(st.map, Math.floor(b.x), Math.floor(b.y))) {
          // Rocket AOE
          if (WEAPONS[3] && b.damage >= 10) {
            for (const en of st.enemies) { if (en.alive && distV(b, en) < 2) { en.hp -= 5; if (en.hp <= 0) { en.alive = false; const own = st.players.find(p => p.idx === b.owner); if (own) { own.kills++; own.coins += 5 } } } }
            for (const op of st.players) { if (op.alive && op.idx !== b.owner && distV(b, op) < 2) { op.hp -= 5 } }
          }
          st.projectiles.splice(i, 1); continue
        }
        // Hit enemies
        let hit = false
        for (const en of st.enemies) {
          if (!en.alive) continue
          if (distV(b, en) < 0.5) {
            en.hp -= b.damage
            if (en.hp <= 0) { en.alive = false; const own = st.players.find(p => p.idx === b.owner); if (own) { own.kills++; own.coins += 5 } }
            hit = true; break
          }
        }
        // Hit players (VS)
        if (!hit && st.mode === 'vs-deathmatch') {
          for (const op of st.players) {
            if (op.idx === b.owner || !op.alive) continue
            if (distV(b, op) < 0.4) {
              const dmg = op.armor > 0 ? Math.ceil(b.damage * 0.5) : b.damage
              op.hp -= dmg; if (op.armor > 0) op.armor = Math.max(0, op.armor - b.damage)
              if (op.hp <= 0) { op.alive = false; const own = st.players.find(p => p.idx === b.owner); if (own) { own.kills++; own.coins += 10 } }
              hit = true; break
            }
          }
        }
        if (hit) st.projectiles.splice(i, 1)
      }

      // ── Enemies AI ──
      for (const en of st.enemies) {
        if (!en.alive) continue
        // Find nearest alive player
        let nearest: DoomPlayer | null = null, nd = Infinity
        for (const pl of st.players) {
          if (!pl.alive) continue
          const d = distV(en, pl)
          if (d < nd) { nd = d; nearest = pl }
        }
        if (!nearest) continue

        en.attackCd = Math.max(0, en.attackCd - dt)

        // Line of sight check (simple)
        const hasLos = nd < 8
        if (hasLos || en.alertTimer > 0) {
          if (hasLos) en.alertTimer = 3000
          en.alertTimer -= dt

          // Move toward player
          const dx = nearest.x - en.x, dy = nearest.y - en.y
          const dist = Math.hypot(dx, dy)
          if (dist > 0.8) {
            const nx = en.x + (dx / dist) * en.speed * (dt / 16)
            const ny = en.y + (dy / dist) * en.speed * (dt / 16)
            if (!isWall(st.map, Math.floor(nx), Math.floor(en.y))) en.x = nx
            if (!isWall(st.map, Math.floor(en.x), Math.floor(ny))) en.y = ny
          }

          // Attack
          if (nd < (en.kind === 'boss' ? 6 : 1.2) && en.attackCd <= 0) {
            en.attackCd = en.kind === 'boss' ? 2000 : 1000
            if (en.kind === 'boss') {
              // Boss shoots fireball
              const a = Math.atan2(dy, dx)
              st.projectiles.push({ x: en.x, y: en.y, dx: Math.cos(a) * 0.08, dy: Math.sin(a) * 0.08, damage: en.damage, owner: -1, life: 2000 })
            } else {
              // Melee
              const dmg = nearest.armor > 0 ? Math.ceil(en.damage * 0.5) : en.damage
              nearest.hp -= dmg
              if (nearest.armor > 0) nearest.armor = Math.max(0, nearest.armor - en.damage)
              if (nearest.hp <= 0) nearest.alive = false
            }
          }
        } else {
          // Patrol randomly
          en.alertTimer -= dt
          if (Math.random() < 0.01) {
            const a = Math.random() * Math.PI * 2
            const nx = en.x + Math.cos(a) * en.speed * (dt / 16)
            const ny = en.y + Math.sin(a) * en.speed * (dt / 16)
            if (!isWall(st.map, Math.floor(nx), Math.floor(ny))) { en.x = nx; en.y = ny }
          }
        }
      }

      // ── Game over checks ──
      const alivePlayers = st.players.filter(p => p.alive)
      if (st.mode === 'vs-deathmatch') {
        if (st.players.length > 1 && alivePlayers.length <= 1) {
          st.gameOver = true
          st.winner = alivePlayers.length === 1 ? alivePlayers[0].idx : null
        }
      } else {
        if (alivePlayers.length === 0) {
          st.gameOver = true
          st.winner = null
        }
      }

      // ── Render ──
      render(st)

      // ── HUD update ──
      setHud(st.players.map(p => ({
        hp: p.hp, ammo: p.ammo, weapon: WEAPONS[p.weaponIdx].name,
        kills: p.kills, coins: p.coins, gems: p.gems, stars: p.stars, level: st.level,
      })))

      if (st.gameOver) {
        setGameOver(true)
        if (st.winner != null) {
          const w = st.players.find(p => p.idx === st.winner)
          setWinner(w?.name ?? `Player ${st.winner! + 1}`)
        }
      }

      raf = requestAnimationFrame(loop)
    }

    function render(st: GS) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width = CW; canvas.height = CH

      const viewCount = st.mode === 'vs-deathmatch' && st.players.length > 1 ? st.players.length : 1
      const viewW = viewCount <= 2 ? CW / viewCount : CW / 2
      const viewH = viewCount <= 2 ? CH : CH / 2

      for (let vi = 0; vi < (viewCount > 1 ? st.players.length : 1); vi++) {
        const pl = viewCount > 1 ? st.players[vi] : st.players.find(p => p.alive) || st.players[0]
        const vx = viewCount <= 2 ? vi * viewW : (vi % 2) * viewW
        const vy = viewCount <= 2 ? 0 : Math.floor(vi / 2) * viewH

        ctx.save()
        ctx.beginPath()
        ctx.rect(vx, vy, viewW, viewH)
        ctx.clip()

        // Ceiling
        ctx.fillStyle = '#1a1a3a'
        ctx.fillRect(vx, vy, viewW, viewH / 2 + pl.pitch)
        // Floor
        ctx.fillStyle = '#333'
        ctx.fillRect(vx, vy + viewH / 2 + pl.pitch, viewW, viewH / 2 - pl.pitch)

        // ── Raycasting walls ──
        const rayCount = Math.floor(NUM_RAYS * (viewW / CW))
        const colW = viewW / rayCount
        const depthBuf: number[] = []
        for (let i = 0; i < rayCount; i++) {
          const rayAngle = pl.angle - FOV / 2 + (i / rayCount) * FOV
          const hit = castRay(st.map, pl.x, pl.y, rayAngle)
          const perpDist = hit.dist * Math.cos(rayAngle - pl.angle) // fix fisheye
          depthBuf.push(perpDist)
          const lineH = Math.min(viewH * 3, viewH / (perpDist + 0.001))
          const drawY = vy + (viewH - lineH) / 2 + pl.pitch

          // Wall color varies by side and distance
          const shade = clamp(1 - perpDist / MAX_DEPTH, 0.15, 1)
          const r = hit.side === 0 ? Math.floor(160 * shade) : Math.floor(120 * shade)
          const g = hit.side === 0 ? Math.floor(130 * shade) : Math.floor(100 * shade)
          const b = hit.side === 0 ? Math.floor(100 * shade) : Math.floor(80 * shade)
          ctx.fillStyle = `rgb(${r},${g},${b})`
          ctx.fillRect(vx + i * colW, drawY, colW + 1, lineH)
        }

        // ── Render sprites (enemies + pickups + other players) ──
        interface Sprite { x: number; y: number; color: string; size: number; hpFrac?: number; label?: string }
        const sprites: Sprite[] = []
        for (const en of st.enemies) {
          if (!en.alive) continue
          const col = en.kind === 'boss' ? '#ff2222' : en.kind === 'demon' ? '#662222' : '#cc4444'
          const sz = en.kind === 'boss' ? 0.9 : 0.6
          sprites.push({ x: en.x, y: en.y, color: col, size: sz, hpFrac: en.hp / en.maxHp })
        }
        for (const pk of st.pickups) {
          if (pk.taken) continue
          const col = pk.kind === 'health' ? '#22ff22' : pk.kind === 'ammo' ? '#ffff22' : '#2288ff'
          sprites.push({ x: pk.x, y: pk.y, color: col, size: 0.3 })
        }
        // Other players in coop / vs
        if (viewCount <= 1) {
          for (const op of st.players) {
            if (op.idx === pl.idx || !op.alive) continue
            sprites.push({ x: op.x, y: op.y, color: op.color, size: 0.5, label: op.name })
          }
        }

        // Sort back to front
        sprites.sort((a, b) => {
          const dA = Math.hypot(a.x - pl.x, a.y - pl.y)
          const dB = Math.hypot(b.x - pl.x, b.y - pl.y)
          return dB - dA
        })

        for (const sp of sprites) {
          const dx = sp.x - pl.x, dy = sp.y - pl.y
          const dist = Math.hypot(dx, dy)
          if (dist < 0.2 || dist > MAX_DEPTH) continue
          // Transform to view space
          const sprAngle = Math.atan2(dy, dx) - pl.angle
          // Normalize angle
          let normAngle = sprAngle
          while (normAngle < -Math.PI) normAngle += 2 * Math.PI
          while (normAngle > Math.PI) normAngle -= 2 * Math.PI
          if (Math.abs(normAngle) > FOV / 2 + 0.2) continue

          const screenX = vx + viewW / 2 + (normAngle / FOV) * viewW
          const height = (viewH / dist) * sp.size
          const width = height * 0.6
          const screenY = vy + (viewH - height) / 2 + pl.pitch

          // Depth test
          const rayIdx = Math.floor(((screenX - vx) / viewW) * rayCount)
          if (rayIdx >= 0 && rayIdx < depthBuf.length && depthBuf[rayIdx] < dist) continue

          ctx.fillStyle = sp.color
          ctx.fillRect(screenX - width / 2, screenY, width, height)

          // HP bar for enemies
          if (sp.hpFrac !== undefined && sp.hpFrac < 1) {
            const barW = width * 1.2, barH = 4
            ctx.fillStyle = '#600'
            ctx.fillRect(screenX - barW / 2, screenY - 8, barW, barH)
            ctx.fillStyle = '#f00'
            ctx.fillRect(screenX - barW / 2, screenY - 8, barW * sp.hpFrac, barH)
          }
        }

        // ── Projectiles (simple dots) ──
        for (const b of st.projectiles) {
          const dx = b.x - pl.x, dy = b.y - pl.y
          const dist = Math.hypot(dx, dy)
          if (dist < 0.1 || dist > MAX_DEPTH) continue
          const sprAngle = Math.atan2(dy, dx) - pl.angle
          let normAngle = sprAngle
          while (normAngle < -Math.PI) normAngle += 2 * Math.PI
          while (normAngle > Math.PI) normAngle -= 2 * Math.PI
          if (Math.abs(normAngle) > FOV / 2) continue
          const sx = vx + viewW / 2 + (normAngle / FOV) * viewW
          const sy = vy + viewH / 2 + pl.pitch
          const r = Math.max(2, 6 / dist)
          ctx.fillStyle = b.owner === -1 ? '#ff8800' : '#ffff00'
          ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill()
        }

        // ── Crosshair ──
        const cx = vx + viewW / 2, cy = vy + viewH / 2 + pl.pitch
        ctx.strokeStyle = '#0f0'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 4, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 10, cy); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(cx, cy - 4); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 10); ctx.stroke()

        // ── Minimap ──
        const mmx = vx + viewW - MINI_SIZE - 8, mmy = vy + 8
        const cs = MINI_SIZE / MAP_W
        ctx.globalAlpha = 0.6
        ctx.fillStyle = '#000'
        ctx.fillRect(mmx, mmy, MINI_SIZE, MINI_SIZE)
        for (let my = 0; my < MAP_H; my++) {
          for (let mx = 0; mx < MAP_W; mx++) {
            if (st.map[my][mx] === '#') { ctx.fillStyle = '#555'; ctx.fillRect(mmx + mx * cs, mmy + my * cs, cs, cs) }
            if (st.map[my][mx] === 'X') { ctx.fillStyle = '#0f0'; ctx.fillRect(mmx + mx * cs, mmy + my * cs, cs, cs) }
          }
        }
        // Enemies on minimap
        for (const en of st.enemies) {
          if (!en.alive) continue
          ctx.fillStyle = en.kind === 'boss' ? '#f00' : '#c44'
          ctx.fillRect(mmx + en.x * cs - 1, mmy + en.y * cs - 1, 3, 3)
        }
        // Players on minimap
        for (const p of st.players) {
          if (!p.alive) continue
          ctx.fillStyle = p.color
          ctx.beginPath(); ctx.arc(mmx + p.x * cs, mmy + p.y * cs, 3, 0, Math.PI * 2); ctx.fill()
          // Direction arrow
          ctx.strokeStyle = p.color; ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(mmx + p.x * cs, mmy + p.y * cs)
          ctx.lineTo(mmx + (p.x + Math.cos(p.angle) * 1.5) * cs, mmy + (p.y + Math.sin(p.angle) * 1.5) * cs)
          ctx.stroke()
        }
        ctx.globalAlpha = 1

        // ── Per-view HUD ──
        if (pl.alive) {
          ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'left'
          ctx.fillText(`HP: ${pl.hp}/${pl.maxHp}  Armor: ${pl.armor}  Ammo: ${pl.ammo}`, vx + 8, vy + viewH - 36)
          ctx.fillText(`${WEAPONS[pl.weaponIdx].icon} ${WEAPONS[pl.weaponIdx].name}  Kills: ${pl.kills}`, vx + 8, vy + viewH - 20)
          ctx.fillText(`💰${pl.coins} 💎${pl.gems} ⭐${pl.stars}  Lv ${st.level}/${st.maxLevel}`, vx + 8, vy + viewH - 4)
          // HP bar
          const barW = 120, barH = 8
          ctx.fillStyle = '#600'; ctx.fillRect(vx + 8, vy + viewH - 52, barW, barH)
          ctx.fillStyle = pl.hp > 30 ? '#0c0' : '#f00'
          ctx.fillRect(vx + 8, vy + viewH - 52, barW * (pl.hp / pl.maxHp), barH)
        } else {
          ctx.fillStyle = '#f00'; ctx.font = '16px monospace'; ctx.textAlign = 'center'
          ctx.fillText('DEAD', vx + viewW / 2, vy + viewH / 2)
        }

        // Weapon flash
        if (pl.shootCd > WEAPONS[pl.weaponIdx].cooldown * 0.7) {
          ctx.fillStyle = 'rgba(255,200,50,0.3)'
          ctx.fillRect(vx, vy + viewH * 0.6, viewW, viewH * 0.4)
        }

        // View border for split screen
        if (viewCount > 1) {
          ctx.strokeStyle = '#444'; ctx.lineWidth = 2
          ctx.strokeRect(vx, vy, viewW, viewH)
        }

        ctx.restore()
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [players])

  // ─── Restart ─────────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    weaponSwitchLockRef.current.clear()
    useLockRef.current.clear()
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
      {/* HUD scoreboard */}
      <div className={styles.scoreboard}>
        {hud.map((h, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: stateRef.current.players[i]?.color }} />
            <span>{stateRef.current.players[i]?.name}</span>
            <span className={styles.scoreValue}>💰{h.coins} 💎{h.gems} ⭐{h.stars} K:{h.kills}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={CW} height={CH}  role="img" aria-label="Doom canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && hud.length === 1 && (
            <p className={styles.winnerText}>
              Kills: {hud[0]?.kills ?? 0} | 💰{hud[0]?.coins ?? 0} 💎{hud[0]?.gems ?? 0} ⭐{hud[0]?.stars ?? 0}
            </p>
          )}
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
