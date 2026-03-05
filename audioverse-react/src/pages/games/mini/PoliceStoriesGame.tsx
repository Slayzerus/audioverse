/**
 * PoliceStoriesGame — Police Stories-inspired top-down tactical shooter for 1-4 players.
 *
 * Controls (per keyboard group):
 *   Group 0: WASD move, Space shoot, E action (open door / arrest / rescue)
 *   Group 1: Arrow keys move, Enter shoot, Shift action
 * Gamepads: left stick move, right stick aim, X shoot, Y action
 *
 * Modes:
 *  - Coop Raid: clear rooms, neutralize enemies, rescue hostages
 *  - VS Cops & Robbers: cops arrest robbers, robbers escape to exit
 *
 * Currencies: coins (arrests), gems (perfect clears), stars (missions completed)
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
const W = 800, H = 600
const PLAYER_R = 12
const ENEMY_R = 10
const HOSTAGE_R = 10
const BULLET_R = 3
const BULLET_SPEED = 8
const MOVE_SPEED = 2.5
const ENEMY_SPEED = 1.2
const ENEMY_SIGHT = 150
const ENEMY_SHOOT_CD = 60
const DOOR_W = 6
const DOOR_LEN = 40
const INTERACT_DIST = 40
const ARREST_TIME = 45 // frames to arrest

// ─── Keyboard mappings ──────────────────────────────────────
type Action = 'up' | 'down' | 'left' | 'right' | 'shoot' | 'action'
const KEY_MAP: Record<string, { group: number; action: Action }> = {
  w: { group: 0, action: 'up' }, s: { group: 0, action: 'down' },
  a: { group: 0, action: 'left' }, d: { group: 0, action: 'right' },
  ' ': { group: 0, action: 'shoot' }, e: { group: 0, action: 'action' },
  ArrowUp: { group: 1, action: 'up' }, ArrowDown: { group: 1, action: 'down' },
  ArrowLeft: { group: 1, action: 'left' }, ArrowRight: { group: 1, action: 'right' },
  Enter: { group: 1, action: 'shoot' }, Shift: { group: 1, action: 'action' },
}

// ─── Types ───────────────────────────────────────────────────
interface Vec { x: number; y: number }

interface Room {
  x: number; y: number; w: number; h: number
  cleared: boolean
}

interface Door {
  x: number; y: number; horizontal: boolean
  open: boolean; roomA: number; roomB: number
}

interface Player {
  x: number; y: number; aimX: number; aimY: number
  alive: boolean; color: string; name: string; index: number
  input: PlayerSlot['input']; team: 'cop' | 'robber'
  kills: number; arrests: number; hostagesSaved: number
  coins: number; gems: number; stars: number
  shootCd: number; arrestProgress: number
  escaped: boolean
}

interface Enemy {
  x: number; y: number; aimX: number; aimY: number
  alive: boolean; alerted: boolean; roomIdx: number
  patrolTarget: Vec; shootCd: number; arrested: boolean
}

interface Hostage {
  x: number; y: number; rescued: boolean; roomIdx: number
}

interface Bullet {
  x: number; y: number; vx: number; vy: number
  owner: number // player index, -1 for enemy
}

interface Wall { x: number; y: number; w: number; h: number }

interface GameState {
  players: Player[]; enemies: Enemy[]; hostages: Hostage[]
  bullets: Bullet[]; rooms: Room[]; doors: Door[]; walls: Wall[]
  exitZone: { x: number; y: number; w: number; h: number } | null
  mode: string; gameOver: boolean; winner: string | null
  frame: number; perfectClear: boolean
}

// ─── Map generation ─────────────────────────────────────────
function generateMap(mapSize: string, hostageCount: number, mode: string, _playerCount: number) {
  const roomCount = mapSize === 'small' ? 4 : mapSize === 'large' ? 6 : 5
  const rooms: Room[] = []
  const walls: Wall[] = []
  const doors: Door[] = []

  // Create rooms in a grid-like layout
  const cols = roomCount <= 4 ? 2 : 3
  const rows = Math.ceil(roomCount / cols)
  const rw = Math.floor((W - 40) / cols)
  const rh = Math.floor((H - 40) / rows)

  for (let i = 0; i < roomCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    rooms.push({
      x: 20 + col * rw, y: 20 + row * rh,
      w: rw, h: rh, cleared: false,
    })
  }

  // Build walls from room edges
  const WALL_T = 6
  for (const r of rooms) {
    walls.push({ x: r.x, y: r.y, w: r.w, h: WALL_T })           // top
    walls.push({ x: r.x, y: r.y + r.h - WALL_T, w: r.w, h: WALL_T }) // bottom
    walls.push({ x: r.x, y: r.y, w: WALL_T, h: r.h })           // left
    walls.push({ x: r.x + r.w - WALL_T, y: r.y, w: WALL_T, h: r.h }) // right
  }

  // Create doors between adjacent rooms
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i], b = rooms[j]
      // Horizontal neighbor
      if (Math.abs((a.x + a.w) - b.x) < WALL_T + 2 && Math.abs(a.y - b.y) < rh / 2) {
        const dy = Math.max(a.y, b.y) + Math.min(a.h, b.h) / 2 - DOOR_LEN / 2
        doors.push({ x: a.x + a.w - WALL_T, y: dy, horizontal: false, open: false, roomA: i, roomB: j })
      }
      // Vertical neighbor
      if (Math.abs((a.y + a.h) - b.y) < WALL_T + 2 && Math.abs(a.x - b.x) < rw / 2) {
        const dx = Math.max(a.x, b.x) + Math.min(a.w, b.w) / 2 - DOOR_LEN / 2
        doors.push({ x: dx, y: a.y + a.h - WALL_T, horizontal: true, open: false, roomA: i, roomB: j })
      }
    }
  }

  // Place enemies (1-2 per room except first)
  const enemies: Enemy[] = []
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i]
    const count = 1 + (i % 2)
    for (let j = 0; j < count; j++) {
      const ex = r.x + 30 + Math.random() * (r.w - 60)
      const ey = r.y + 30 + Math.random() * (r.h - 60)
      enemies.push({
        x: ex, y: ey, aimX: 1, aimY: 0,
        alive: true, alerted: false, roomIdx: i,
        patrolTarget: { x: r.x + 30 + Math.random() * (r.w - 60), y: r.y + 30 + Math.random() * (r.h - 60) },
        shootCd: ENEMY_SHOOT_CD, arrested: false,
      })
    }
  }

  // Place hostages in random rooms (not first)
  const hostages: Hostage[] = []
  const hCount = Number(hostageCount) || 0
  for (let i = 0; i < hCount; i++) {
    const ri = 1 + (i % (rooms.length - 1))
    const r = rooms[ri]
    hostages.push({
      x: r.x + r.w / 2 + (Math.random() - 0.5) * 40,
      y: r.y + r.h / 2 + (Math.random() - 0.5) * 40,
      rescued: false, roomIdx: ri,
    })
  }

  // Exit zone (for VS mode)
  let exitZone: GameState['exitZone'] = null
  if (mode === 'vs-cops-robbers') {
    const lastRoom = rooms[rooms.length - 1]
    exitZone = { x: lastRoom.x + lastRoom.w - 50, y: lastRoom.y + lastRoom.h - 50, w: 40, h: 40 }
  }

  return { rooms, walls, doors, enemies, hostages, exitZone }
}

function playerInRoom(px: number, py: number, room: Room): boolean {
  return px > room.x && px < room.x + room.w && py > room.y && py < room.y + room.h
}

function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function normalize(dx: number, dy: number): Vec {
  const len = Math.hypot(dx, dy)
  return len > 0 ? { x: dx / len, y: dy / len } : { x: 1, y: 0 }
}

function circleRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw))
  const closestY = Math.max(ry, Math.min(cy, ry + rh))
  return Math.hypot(cx - closestX, cy - closestY) < r
}

// ─── Init state ─────────────────────────────────────────────
function initState(players: PlayerSlot[], config?: GameConfig): GameState {
  const mode = config?.gameMode || 'coop-raid'
  const mapSize = config?.mapSize || 'medium'
  const hostageCount = config?.hostageCount ?? 2
  const { rooms, walls, doors, enemies, hostages, exitZone } = generateMap(mapSize, hostageCount, mode, players.length)

  const spawnRoom = rooms[0]
  const ps: Player[] = players.map((p, i) => ({
    x: spawnRoom.x + 40 + (i % 2) * 40,
    y: spawnRoom.y + 40 + Math.floor(i / 2) * 40,
    aimX: 1, aimY: 0,
    alive: true,
    color: mode === 'vs-cops-robbers'
      ? (i < Math.ceil(players.length / 2) ? '#3498db' : '#e74c3c')
      : (p.color || PLAYER_COLORS[p.index] || '#fff'),
    name: p.name, index: p.index, input: p.input,
    team: mode === 'vs-cops-robbers'
      ? (i < Math.ceil(players.length / 2) ? 'cop' as const : 'robber' as const)
      : 'cop' as const,
    kills: 0, arrests: 0, hostagesSaved: 0,
    coins: 0, gems: 0, stars: 0,
    shootCd: 0, arrestProgress: 0, escaped: false,
  }))

  // Robbers start in last room in VS mode
  if (mode === 'vs-cops-robbers') {
    const lastRoom = rooms[rooms.length - 1]
    ps.filter(p => p.team === 'robber').forEach((p, i) => {
      p.x = lastRoom.x + 40 + i * 30
      p.y = lastRoom.y + lastRoom.h / 2
    })
  }

  rooms[0].cleared = true
  return { players: ps, enemies, hostages, bullets: [], rooms, doors, walls, exitZone, mode, gameOver: false, winner: null, frame: 0, perfectClear: true }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function PoliceStoriesGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysDown = useRef(new Set<string>())
  const [scores, setScores] = useState<Player[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Key input ───────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysDown.current.add(e.key) }
    const up   = (e: KeyboardEvent) => { keysDown.current.delete(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const isAction = useCallback((p: Player, action: Action) => {
    if (p.input.type === 'keyboard') {
      for (const [key, m] of Object.entries(KEY_MAP)) {
        if (m.group === p.input.group && m.action === action && keysDown.current.has(key)) return true
      }
    } else if (p.input.type === 'gamepad') {
      const gp = padsRef.current.find(g => g.index === (p.input as { padIndex: number }).padIndex)
      if (!gp) return false
      if (action === 'up') return gp.up
      if (action === 'down') return gp.down
      if (action === 'left') return gp.left
      if (action === 'right') return gp.right
      if (action === 'shoot') return gp.x
      if (action === 'action') return gp.y
    }
    return false
  }, [])

  // ── Shoot cooldowns ─────────────────────────────────────
  const shootCd = useRef<number[]>(players.map(() => 0))

  // ── Main game loop ──────────────────────────────────────
  useEffect(() => {
    let raf = 0
    const FIXED_DT = 1000 / 60
    let lastTime = performance.now()
    let accumulator = 0

    function wallCollision(x: number, y: number, r: number, st: GameState): Vec {
      let nx = x, ny = y
      for (const w of st.walls) {
        // Skip wall segments that overlap with open doors
        let blocked = false
        for (const d of st.doors) {
          if (!d.open) continue
          if (d.horizontal) {
            if (Math.abs(w.y - d.y) < 10 && w.x < d.x + DOOR_LEN && w.x + w.w > d.x) blocked = true
          } else {
            if (Math.abs(w.x - d.x) < 10 && w.y < d.y + DOOR_LEN && w.y + w.h > d.y) blocked = true
          }
        }
        if (blocked) continue
        if (circleRect(nx, ny, r, w.x, w.y, w.w, w.h)) {
          const cx = w.x + w.w / 2, cy = w.y + w.h / 2
          const dx = nx - cx, dy = ny - cy
          if (Math.abs(dx) / w.w > Math.abs(dy) / w.h) {
            nx = dx > 0 ? w.x + w.w + r : w.x - r
          } else {
            ny = dy > 0 ? w.y + w.h + r : w.y - r
          }
        }
      }
      return { x: nx, y: ny }
    }

    function update(st: GameState) {
      st.frame++

      // Update players
      for (let pi = 0; pi < st.players.length; pi++) {
        const p = st.players[pi]
        if (!p.alive || p.escaped) continue

        // Movement
        let dx = 0, dy = 0
        if (isAction(p, 'left')) dx -= 1
        if (isAction(p, 'right')) dx += 1
        if (isAction(p, 'up')) dy -= 1
        if (isAction(p, 'down')) dy += 1
        if (dx || dy) {
          const n = normalize(dx, dy)
          const newPos = wallCollision(p.x + n.x * MOVE_SPEED, p.y + n.y * MOVE_SPEED, PLAYER_R, st)
          p.x = newPos.x; p.y = newPos.y
          // Aim follows movement unless gamepad right stick overrides
          p.aimX = n.x; p.aimY = n.y
        }

        // Gamepad right stick aim — use d-pad/left stick as aim fallback
        if (p.input.type === 'gamepad') {
          const gp = padsRef.current.find(g => g.index === (p.input as { padIndex: number }).padIndex)
          if (gp) {
            let rx = 0, ry = 0
            if (gp.right) rx = 1; else if (gp.left) rx = -1
            if (gp.down) ry = 1; else if (gp.up) ry = -1
            if (rx || ry) { const an = normalize(rx, ry); p.aimX = an.x; p.aimY = an.y }
          }
        }

        // Clamp to canvas
        p.x = Math.max(PLAYER_R, Math.min(W - PLAYER_R, p.x))
        p.y = Math.max(PLAYER_R, Math.min(H - PLAYER_R, p.y))

        // Shooting
        if (p.shootCd > 0) p.shootCd--
        if (isAction(p, 'shoot') && p.shootCd <= 0) {
          st.bullets.push({ x: p.x + p.aimX * (PLAYER_R + 4), y: p.y + p.aimY * (PLAYER_R + 4), vx: p.aimX * BULLET_SPEED, vy: p.aimY * BULLET_SPEED, owner: p.index })
          p.shootCd = 15
        }

        // Action: open doors, arrest enemies, rescue hostages
        if (isAction(p, 'action')) {
          // Door interaction
          for (const door of st.doors) {
            const doorCenter: Vec = door.horizontal
              ? { x: door.x + DOOR_LEN / 2, y: door.y + DOOR_W / 2 }
              : { x: door.x + DOOR_W / 2, y: door.y + DOOR_LEN / 2 }
            if (dist({ x: p.x, y: p.y }, doorCenter) < INTERACT_DIST) {
              door.open = true
            }
          }
          // Arrest enemies
          for (const en of st.enemies) {
            if (!en.alive || en.arrested) continue
            if (dist({ x: p.x, y: p.y }, { x: en.x, y: en.y }) < INTERACT_DIST) {
              p.arrestProgress++
              if (p.arrestProgress >= ARREST_TIME) {
                en.arrested = true; en.alive = false
                p.arrests++; p.coins++
                p.arrestProgress = 0
              }
            }
          }
          // Rescue hostages
          for (const h of st.hostages) {
            if (h.rescued) continue
            if (dist({ x: p.x, y: p.y }, { x: h.x, y: h.y }) < INTERACT_DIST) {
              h.rescued = true; p.hostagesSaved++; p.coins++
            }
          }
          // VS: cops arrest robbers
          if (st.mode === 'vs-cops-robbers' && p.team === 'cop') {
            for (const other of st.players) {
              if (other.team !== 'robber' || !other.alive) continue
              if (dist({ x: p.x, y: p.y }, { x: other.x, y: other.y }) < INTERACT_DIST) {
                other.alive = false; p.arrests++; p.coins++
              }
            }
          }
        } else {
          st.players[pi].arrestProgress = 0
        }

        // VS: robber escape check
        if (st.mode === 'vs-cops-robbers' && p.team === 'robber' && st.exitZone) {
          const ez = st.exitZone
          if (p.x > ez.x && p.x < ez.x + ez.w && p.y > ez.y && p.y < ez.y + ez.h) {
            p.escaped = true; p.stars++
          }
        }
      }

      // Update enemies (AI)
      for (const en of st.enemies) {
        if (!en.alive || en.arrested) continue
        const room = st.rooms[en.roomIdx]

        // Check if any player is in sight
        let target: Player | null = null
        for (const p of st.players) {
          if (!p.alive) continue
          if (st.mode === 'vs-cops-robbers' && p.team === 'robber') continue
          if (dist({ x: en.x, y: en.y }, { x: p.x, y: p.y }) < ENEMY_SIGHT) {
            // Check if player is in same room or adjacent open room
            if (playerInRoom(p.x, p.y, room)) {
              target = p; en.alerted = true; break
            }
            for (const d of st.doors) {
              if (!d.open) continue
              if ((d.roomA === en.roomIdx || d.roomB === en.roomIdx)) {
                const otherIdx = d.roomA === en.roomIdx ? d.roomB : d.roomA
                if (playerInRoom(p.x, p.y, st.rooms[otherIdx])) {
                  target = p; en.alerted = true; break
                }
              }
            }
            if (target) break
          }
        }

        if (target) {
          // Chase and shoot
          const n = normalize(target.x - en.x, target.y - en.y)
          en.aimX = n.x; en.aimY = n.y
          const newPos = wallCollision(en.x + n.x * ENEMY_SPEED, en.y + n.y * ENEMY_SPEED, ENEMY_R, st)
          en.x = newPos.x; en.y = newPos.y
          en.shootCd--
          if (en.shootCd <= 0) {
            st.bullets.push({ x: en.x + n.x * (ENEMY_R + 3), y: en.y + n.y * (ENEMY_R + 3), vx: n.x * BULLET_SPEED * 0.7, vy: n.y * BULLET_SPEED * 0.7, owner: -1 })
            en.shootCd = ENEMY_SHOOT_CD
          }
        } else {
          // Patrol within room
          const d = dist({ x: en.x, y: en.y }, en.patrolTarget)
          if (d < 8) {
            en.patrolTarget = { x: room.x + 30 + Math.random() * (room.w - 60), y: room.y + 30 + Math.random() * (room.h - 60) }
          }
          const n = normalize(en.patrolTarget.x - en.x, en.patrolTarget.y - en.y)
          en.aimX = n.x; en.aimY = n.y
          en.x += n.x * ENEMY_SPEED * 0.4
          en.y += n.y * ENEMY_SPEED * 0.4
        }
      }

      // Update bullets
      for (let i = st.bullets.length - 1; i >= 0; i--) {
        const b = st.bullets[i]
        b.x += b.vx; b.y += b.vy
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) { st.bullets.splice(i, 1); continue }

        // Wall collision (skip open door segments)
        let hitWall = false
        for (const w of st.walls) {
          let doorOpen = false
          for (const d of st.doors) {
            if (!d.open) continue
            if (d.horizontal && Math.abs(w.y - d.y) < 10 && w.x < d.x + DOOR_LEN && w.x + w.w > d.x) doorOpen = true
            if (!d.horizontal && Math.abs(w.x - d.x) < 10 && w.y < d.y + DOOR_LEN && w.y + w.h > d.y) doorOpen = true
          }
          if (doorOpen) continue
          if (circleRect(b.x, b.y, BULLET_R, w.x, w.y, w.w, w.h)) { hitWall = true; break }
        }
        if (hitWall) { st.bullets.splice(i, 1); continue }

        // Hit players
        if (b.owner === -1) {
          for (const p of st.players) {
            if (!p.alive) continue
            if (dist({ x: b.x, y: b.y }, { x: p.x, y: p.y }) < PLAYER_R + BULLET_R) {
              p.alive = false; st.perfectClear = false
              st.bullets.splice(i, 1); break
            }
          }
        } else {
          // Player bullet hits enemies
          for (const en of st.enemies) {
            if (!en.alive) continue
            if (dist({ x: b.x, y: b.y }, { x: en.x, y: en.y }) < ENEMY_R + BULLET_R) {
              en.alive = false
              const shooter = st.players.find(p => p.index === b.owner)
              if (shooter) { shooter.kills++; shooter.coins++ }
              st.bullets.splice(i, 1); break
            }
          }
          // Hit hostages — penalty!
          for (const h of st.hostages) {
            if (h.rescued) continue
            if (dist({ x: b.x, y: b.y }, { x: h.x, y: h.y }) < HOSTAGE_R + BULLET_R) {
              h.rescued = true // removed from play
              st.perfectClear = false
              const shooter = st.players.find(p => p.index === b.owner)
              if (shooter) shooter.coins = Math.max(0, shooter.coins - 2)
              st.bullets.splice(i, 1); break
            }
          }
          // VS: hit other-team players
          if (st.mode === 'vs-cops-robbers') {
            for (const p of st.players) {
              if (!p.alive || p.index === b.owner) continue
              const shooter = st.players.find(s => s.index === b.owner)
              if (shooter && shooter.team === p.team) continue
              if (dist({ x: b.x, y: b.y }, { x: p.x, y: p.y }) < PLAYER_R + BULLET_R) {
                p.alive = false
                if (shooter) { shooter.kills++; shooter.coins++ }
                st.bullets.splice(i, 1); break
              }
            }
          }
        }
      }

      // Mark rooms as cleared
      for (let ri = 0; ri < st.rooms.length; ri++) {
        if (st.rooms[ri].cleared) continue
        const enemiesInRoom = st.enemies.filter(e => e.roomIdx === ri && e.alive && !e.arrested)
        if (enemiesInRoom.length === 0) st.rooms[ri].cleared = true
      }

      // Win conditions
      if (!st.gameOver) {
        if (st.mode === 'coop-raid') {
          const allEnemiesDone = st.enemies.every(e => !e.alive || e.arrested)
          const allHostagesDone = st.hostages.length === 0 || st.hostages.every(h => h.rescued)
          const allPlayersDead = st.players.every(p => !p.alive)
          if (allEnemiesDone && allHostagesDone) {
            st.gameOver = true; st.winner = 'Team'
            for (const p of st.players) {
              p.stars++
              if (st.perfectClear) p.gems++
            }
          } else if (allPlayersDead) {
            st.gameOver = true; st.winner = null
          }
        } else {
          // VS cops & robbers
          const robbersAlive = st.players.filter(p => p.team === 'robber' && p.alive && !p.escaped)
          const robbersEscaped = st.players.filter(p => p.team === 'robber' && p.escaped)
          const copsAlive = st.players.filter(p => p.team === 'cop' && p.alive)
          if (robbersAlive.length === 0) {
            st.gameOver = true
            if (robbersEscaped.length > 0) {
              st.winner = 'Robbers'
              robbersEscaped.forEach(p => { p.stars++; p.gems++ })
            } else {
              st.winner = 'Cops'
              copsAlive.forEach(p => { p.stars++; p.gems++ })
            }
          } else if (copsAlive.length === 0) {
            st.gameOver = true; st.winner = 'Robbers'
            st.players.filter(p => p.team === 'robber').forEach(p => p.stars++)
          }
        }
      }
    }

    function render() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const st = stateRef.current
      canvas.width = W; canvas.height = H

      // Background
      ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0, 0, W, H)

      // Determine which rooms the alive players are in
      const playerRooms = new Set<number>()
      for (const p of st.players) {
        if (!p.alive) continue
        for (let ri = 0; ri < st.rooms.length; ri++) {
          if (playerInRoom(p.x, p.y, st.rooms[ri])) playerRooms.add(ri)
        }
        // Also add adjacent rooms through open doors
        for (const d of st.doors) {
          if (!d.open) continue
          if (playerRooms.has(d.roomA)) playerRooms.add(d.roomB)
          if (playerRooms.has(d.roomB)) playerRooms.add(d.roomA)
        }
      }

      // Draw rooms
      for (let ri = 0; ri < st.rooms.length; ri++) {
        const r = st.rooms[ri]
        const visible = playerRooms.has(ri)
        ctx.fillStyle = visible ? (r.cleared ? '#2a2a3e' : '#222238') : '#111122'
        ctx.fillRect(r.x, r.y, r.w, r.h)
      }

      // Draw walls
      ctx.fillStyle = '#444'
      for (const w of st.walls) {
        // Skip wall segments covered by open doors
        let doorOpen = false
        for (const d of st.doors) {
          if (!d.open) continue
          if (d.horizontal && Math.abs(w.y - d.y) < 10 && w.x < d.x + DOOR_LEN && w.x + w.w > d.x) doorOpen = true
          if (!d.horizontal && Math.abs(w.x - d.x) < 10 && w.y < d.y + DOOR_LEN && w.y + w.h > d.y) doorOpen = true
        }
        if (!doorOpen) ctx.fillRect(w.x, w.y, w.w, w.h)
      }

      // Draw doors
      for (const d of st.doors) {
        if (d.open) {
          ctx.fillStyle = '#5a3a1a'
          if (d.horizontal) ctx.fillRect(d.x, d.y - 1, DOOR_LEN, 3)
          else ctx.fillRect(d.x - 1, d.y, 3, DOOR_LEN)
        } else {
          ctx.fillStyle = '#8B4513'
          if (d.horizontal) ctx.fillRect(d.x, d.y, DOOR_LEN, DOOR_W)
          else ctx.fillRect(d.x, d.y, DOOR_W, DOOR_LEN)
        }
      }

      // Exit zone (VS mode)
      if (st.exitZone) {
        ctx.fillStyle = 'rgba(46,204,113,0.3)'; ctx.fillRect(st.exitZone.x, st.exitZone.y, st.exitZone.w, st.exitZone.h)
        ctx.strokeStyle = '#2ecc71'; ctx.lineWidth = 2; ctx.strokeRect(st.exitZone.x, st.exitZone.y, st.exitZone.w, st.exitZone.h)
        ctx.fillStyle = '#2ecc71'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('EXIT', st.exitZone.x + st.exitZone.w / 2, st.exitZone.y + st.exitZone.h / 2 + 3)
      }

      // Draw hostages (yellow circles) — only in visible rooms
      for (const h of st.hostages) {
        if (h.rescued) continue
        if (!playerRooms.has(h.roomIdx)) continue
        ctx.fillStyle = '#f1c40f'
        ctx.beginPath(); ctx.arc(h.x, h.y, HOSTAGE_R, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText('H', h.x, h.y + 3)
      }

      // Draw enemies (red circles) — only in visible rooms
      for (const en of st.enemies) {
        if (!en.alive || en.arrested) continue
        if (!playerRooms.has(en.roomIdx)) continue
        ctx.fillStyle = en.alerted ? '#ff3333' : '#cc4444'
        ctx.beginPath(); ctx.arc(en.x, en.y, ENEMY_R, 0, Math.PI * 2); ctx.fill()
        // Aim line
        ctx.strokeStyle = '#ff6666'; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(en.x, en.y)
        ctx.lineTo(en.x + en.aimX * 15, en.y + en.aimY * 15); ctx.stroke()
      }

      // Draw bullets
      for (const b of st.bullets) {
        ctx.fillStyle = b.owner === -1 ? '#ff4444' : '#ffff00'
        ctx.beginPath(); ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2); ctx.fill()
      }

      // Draw players
      for (const p of st.players) {
        if (!p.alive) continue
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2); ctx.fill()
        // Aim direction line
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + p.aimX * (PLAYER_R + 10), p.y + p.aimY * (PLAYER_R + 10)); ctx.stroke()
        // Name
        ctx.fillStyle = '#fff'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(p.name, p.x, p.y - PLAYER_R - 4)
        // Arrest progress bar
        if (p.arrestProgress > 0) {
          const barW = 24 * (p.arrestProgress / ARREST_TIME)
          ctx.fillStyle = '#2ecc71'; ctx.fillRect(p.x - 12, p.y + PLAYER_R + 2, barW, 3)
          ctx.strokeStyle = '#196'; ctx.lineWidth = 1; ctx.strokeRect(p.x - 12, p.y + PLAYER_R + 2, 24, 3)
        }
      }

      // Fog overlay for non-visible rooms
      for (let ri = 0; ri < st.rooms.length; ri++) {
        if (playerRooms.has(ri)) continue
        const r = st.rooms[ri]
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12)
      }

      // HUD
      ctx.font = '12px monospace'; ctx.textAlign = 'left'
      st.players.forEach((p, i) => {
        ctx.fillStyle = p.color
        const status = p.escaped ? ' (Escaped)' : (!p.alive ? ' (Dead)' : '')
        const txt = `${p.name}${status}: 🪙${p.coins} 💎${p.gems} ⭐${p.stars}`
        ctx.fillText(txt, 8, 16 + i * 16)
      })

      // Mission status
      if (st.mode === 'coop-raid') {
        const enemiesLeft = st.enemies.filter(e => e.alive && !e.arrested).length
        const hostagesLeft = st.hostages.filter(h => !h.rescued).length
        ctx.fillStyle = '#aaa'; ctx.font = '11px sans-serif'; ctx.textAlign = 'right'
        ctx.fillText(`Enemies: ${enemiesLeft}  Hostages: ${hostagesLeft}`, W - 10, 16)
      }
    }

    function loop(now: number) {
      if (pauseRef.current) { lastTime = now; raf = requestAnimationFrame(loop); return }
      const st = stateRef.current
      if (st.gameOver) {
        setScores([...st.players]); setGameOver(true)
        setWinner(st.winner)
        render(); return
      }
      accumulator += now - lastTime; lastTime = now
      while (accumulator >= FIXED_DT) { update(st); accumulator -= FIXED_DT }
      setScores([...st.players])
      render()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [isAction])

  // ── Restart ─────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    shootCd.current = players.map(() => 0)
    setGameOver(false); setWinner(null); setScores([])
  }, [players, config])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {scores.map(s => (
          <div key={s.index} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>{s.arrests}A {s.kills}K</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Police Stories canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.missionFailed', 'Mission Failed')}</p>}
          <div style={{ display: 'flex', gap: '2rem', marginTop: 8 }}>
            {scores.map(s => (
              <div key={s.index} style={{ color: s.color, textAlign: 'center', fontSize: 12 }}>
                <div>{s.name}</div>
                <div>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</div>
              </div>
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
