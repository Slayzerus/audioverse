/**
 * AutoSurvivorsGame — Vampire Survivors-style auto-shoot + auto-gather game.
 *
 * Three modes:
 *   - Gather: collect resources, no enemies. Race for most coins/gems/stars.
 *   - Survival: auto-shoot enemies, waves escalate. Survive as long as possible.
 *   - Combo: both gather and survival combined.
 *
 * Controls:
 *   Group 0: W/A/S/D
 *   Group 1: Arrow keys
 *   Group 2: I/J/K/L
 *   Group 3: Numpad 8/4/5/6
 *   Gamepads: left stick / D-pad.
 *
 * Currencies: coins (kills), gems (boss drops), stars (wave completions).
 * Supports single, couch co-op, and VS modes.
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
const WORLD_W = 2000
const WORLD_H = 2000
const PLAYER_R = 12
const SHOOT_CD = 800          // ms auto-shoot cooldown
const PROJ_SPEED = 5
const PROJ_R = 3
const PICKUP_RADIUS = 60
const ATTRACT_ACCEL = 0.4
const WAVE_DURATION = 30_000  // ms between waves
const BOSS_INTERVAL = 60_000  // ms between boss spawns
const AOE_INTERVAL = 5_000    // ms between area blasts
const ORBIT_SPEED = 0.04      // rad per frame
const ORBIT_DIST = 40
const ORBIT_R = 6
const HEART_DROP = 0.01       // 1 % drop rate
const TICK_MS = 16             // ~60 fps

// ─── Keyboard mappings ───────────────────────────────────────
type Vec2 = { x: number; y: number }

const KB_MAP: Record<string, { group: number; dx: number; dy: number }> = {
  w: { group: 0, dx: 0, dy: -1 }, s: { group: 0, dx: 0, dy: 1 },
  a: { group: 0, dx: -1, dy: 0 }, d: { group: 0, dx: 1, dy: 0 },
  ArrowUp: { group: 1, dx: 0, dy: -1 }, ArrowDown: { group: 1, dx: 0, dy: 1 },
  ArrowLeft: { group: 1, dx: -1, dy: 0 }, ArrowRight: { group: 1, dx: 1, dy: 0 },
  i: { group: 2, dx: 0, dy: -1 }, k: { group: 2, dx: 0, dy: 1 },
  j: { group: 2, dx: -1, dy: 0 }, l: { group: 2, dx: 1, dy: 0 },
  '8': { group: 3, dx: 0, dy: -1 }, '5': { group: 3, dx: 0, dy: 1 },
  '4': { group: 3, dx: -1, dy: 0 }, '6': { group: 3, dx: 1, dy: 0 },
}

// ─── Types ───────────────────────────────────────────────────
type EnemyKind = 'slime' | 'bat' | 'skeleton' | 'boss'

interface Enemy {
  x: number; y: number; hp: number; maxHp: number
  kind: EnemyKind; speed: number; damage: number; r: number
}

type CollectibleKind = 'coin' | 'xp' | 'heart'

interface Collectible {
  x: number; y: number; kind: CollectibleKind; r: number
  vx: number; vy: number; attracted: boolean
}

type UpgradeId = 'multishot' | 'atkspeed' | 'radius' | 'maxhp' | 'orbit' | 'aoe'

interface Upgrade { id: UpgradeId; label: string; icon: string }

const ALL_UPGRADES: Upgrade[] = [
  { id: 'multishot', label: '+1 Projectile', icon: '🔫' },
  { id: 'atkspeed', label: '+20% Atk Speed', icon: '⚡' },
  { id: 'radius', label: '+30% Pickup Radius', icon: '🧲' },
  { id: 'maxhp', label: '+1 Max HP', icon: '❤️' },
  { id: 'orbit', label: 'Orbiting Shield', icon: '🛡️' },
  { id: 'aoe', label: 'Area Blast', icon: '💥' },
]

interface Projectile { x: number; y: number; vx: number; vy: number; owner: number }

interface PlayerState {
  x: number; y: number
  hp: number; maxHp: number
  speed: number; color: string
  name: string; index: number
  input: PlayerSlot['input']
  alive: boolean
  // auto-shoot
  shootCd: number; projectiles: number; atkSpeedMult: number
  // auto-gather
  pickupRadius: number
  // progression
  xp: number; xpToNext: number; level: number
  kills: number; coins: number; gems: number; stars: number
  upgrades: UpgradeId[]
  // specials
  hasOrbit: boolean; orbitAngle: number
  hasAoe: boolean; aoeCd: number; aoeFlash: number
  // movement input
  moveX: number; moveY: number
}

interface GameState {
  players: PlayerState[]
  enemies: Enemy[]
  collectibles: Collectible[]
  projectiles: Projectile[]
  wave: number; waveTimer: number
  bossTimer: number; elapsed: number
  gameOver: boolean
  mode: 'gather' | 'survival' | 'combo'
  playerMode: string // 'vs' | 'coop'
  choosingUpgrade: number | null  // player index choosing
  upgradeChoices: Upgrade[]
}

// ─── Helpers ─────────────────────────────────────────────────
function dist(a: Vec2, b: Vec2) {
  const dx = a.x - b.x, dy = a.y - b.y
  return Math.sqrt(dx * dx + dy * dy)
}

function norm(v: Vec2): Vec2 {
  const len = Math.sqrt(v.x * v.x + v.y * v.y)
  return len > 0 ? { x: v.x / len, y: v.y / len } : { x: 0, y: 0 }
}

function randRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function spawnEnemy(px: number, py: number, wave: number, boss: boolean): Enemy {
  if (boss) {
    return { x: px + randRange(-400, 400), y: py + randRange(-400, 400), hp: 50, maxHp: 50, kind: 'boss', speed: 0.6, damage: 5, r: 20 }
  }
  const roll = Math.random()
  if (roll < 0.5) return { x: 0, y: 0, hp: 3, maxHp: 3, kind: 'slime', speed: 0.5 + wave * 0.05, damage: 1, r: 6 }
  if (roll < 0.8) return { x: 0, y: 0, hp: 2, maxHp: 2, kind: 'bat', speed: 1.4 + wave * 0.05, damage: 1, r: 4 }
  return { x: 0, y: 0, hp: 8, maxHp: 8, kind: 'skeleton', speed: 0.8 + wave * 0.04, damage: 2, r: 5 }
}

function placeEnemyAtEdge(e: Enemy, cx: number, cy: number) {
  const side = Math.floor(Math.random() * 4)
  const margin = 50
  switch (side) {
    case 0: e.x = cx + randRange(-CW / 2 - margin, CW / 2 + margin); e.y = cy - CH / 2 - margin; break
    case 1: e.x = cx + randRange(-CW / 2 - margin, CW / 2 + margin); e.y = cy + CH / 2 + margin; break
    case 2: e.x = cx - CW / 2 - margin; e.y = cy + randRange(-CH / 2 - margin, CH / 2 + margin); break
    default: e.x = cx + CW / 2 + margin; e.y = cy + randRange(-CH / 2 - margin, CH / 2 + margin); break
  }
  e.x = clamp(e.x, 0, WORLD_W)
  e.y = clamp(e.y, 0, WORLD_H)
}

function randomUpgrades(exclude: UpgradeId[]): Upgrade[] {
  const pool = ALL_UPGRADES.filter(u => !exclude.includes(u.id) || u.id === 'multishot' || u.id === 'atkspeed' || u.id === 'radius' || u.id === 'maxhp')
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}

function xpNeeded(level: number) {
  return 5 + level * 3
}

function initPlayer(p: PlayerSlot): PlayerState {
  return {
    x: WORLD_W / 2 + (p.index - 1.5) * 60,
    y: WORLD_H / 2,
    hp: 5, maxHp: 5, speed: 2.5,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, index: p.index,
    input: p.input, alive: true,
    shootCd: 0, projectiles: 1, atkSpeedMult: 1,
    pickupRadius: PICKUP_RADIUS,
    xp: 0, xpToNext: xpNeeded(1), level: 1,
    kills: 0, coins: 0, gems: 0, stars: 0,
    upgrades: [],
    hasOrbit: false, orbitAngle: 0,
    hasAoe: false, aoeCd: 0, aoeFlash: 0,
    moveX: 0, moveY: 0,
  }
}

function initState(players: PlayerSlot[], mode: string, playerMode: string): GameState {
  const gm = (mode === 'gather' || mode === 'survival' || mode === 'combo') ? mode as GameState['mode'] : 'combo'
  const ps = players.map(p => initPlayer(p))
  const collectibles: Collectible[] = []
  // Scatter initial collectibles
  for (let i = 0; i < 30; i++) {
    collectibles.push({ x: randRange(50, WORLD_W - 50), y: randRange(50, WORLD_H - 50), kind: Math.random() < 0.5 ? 'coin' : 'xp', r: Math.random() < 0.5 ? 4 : 3, vx: 0, vy: 0, attracted: false })
  }
  return {
    players: ps, enemies: [], collectibles, projectiles: [],
    wave: 1, waveTimer: WAVE_DURATION, bossTimer: BOSS_INTERVAL,
    elapsed: 0, gameOver: false, mode: gm,
    playerMode: playerMode || 'coop',
    choosingUpgrade: null, upgradeChoices: [],
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function AutoSurvivorsGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mode = config?.gameMode ?? 'combo'
  const playerMode = config?.playerMode ?? 'coop'
  const stateRef = useRef<GameState>(initState(players, mode, playerMode))
  const keysDown = useRef<Set<string>>(new Set())
  const [hud, setHud] = useState<PlayerState[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [upgradeUI, setUpgradeUI] = useState<{ player: number; choices: Upgrade[] } | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Keyboard input ──────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => keysDown.current.add(e.key)
    const up = (e: KeyboardEvent) => keysDown.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Apply upgrade choice ────────────────────────────────
  const applyUpgrade = useCallback((upgradeId: UpgradeId) => {
    const st = stateRef.current
    if (st.choosingUpgrade == null) return
    const p = st.players.find(pl => pl.index === st.choosingUpgrade)
    if (!p) return
    p.upgrades.push(upgradeId)
    switch (upgradeId) {
      case 'multishot': p.projectiles++; break
      case 'atkspeed': p.atkSpeedMult *= 1.2; break
      case 'radius': p.pickupRadius = Math.round(p.pickupRadius * 1.3); break
      case 'maxhp': p.maxHp++; p.hp = Math.min(p.hp + 1, p.maxHp); break
      case 'orbit': p.hasOrbit = true; break
      case 'aoe': p.hasAoe = true; p.aoeCd = AOE_INTERVAL; break
    }
    st.choosingUpgrade = null
    st.upgradeChoices = []
    setUpgradeUI(null)
  }, [])

  // ── Main game loop ──────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const spawnRateMult = config?.spawnRate === 'slow' ? 0.6 : config?.spawnRate === 'frenzy' ? 1.8 : 1
    const hasEnemies = mode !== 'gather'
    const hasGather = mode !== 'survival'

    function tick() {
      if (pauseRef.current) { timer = setTimeout(tick, TICK_MS); return }
      const st = stateRef.current
      if (st.gameOver || st.choosingUpgrade != null) { timer = setTimeout(tick, TICK_MS); return }

      const dt = TICK_MS
      st.elapsed += dt

      // ── Read inputs ──
      for (const p of st.players) {
        if (!p.alive) continue
        let mx = 0, my = 0
        if (p.input.type === 'keyboard') {
          const g = p.input.group
          for (const [key, m] of Object.entries(KB_MAP)) {
            if (m.group === g && keysDown.current.has(key)) { mx += m.dx; my += m.dy }
          }
        } else if (p.input.type === 'gamepad') {
          const gp = padsRef.current.find(pad => pad.index === (p.input as { padIndex: number }).padIndex)
          if (gp) {
            if (gp.left) mx -= 1; if (gp.right) mx += 1
            if (gp.up) my -= 1; if (gp.down) my += 1
          }
        }
        const n = norm({ x: mx, y: my })
        p.moveX = n.x; p.moveY = n.y
      }

      // ── Move players ──
      for (const p of st.players) {
        if (!p.alive) continue
        p.x = clamp(p.x + p.moveX * p.speed, PLAYER_R, WORLD_W - PLAYER_R)
        p.y = clamp(p.y + p.moveY * p.speed, PLAYER_R, WORLD_H - PLAYER_R)
      }

      // ── Wave timer ──
      if (hasEnemies) {
        st.waveTimer -= dt
        if (st.waveTimer <= 0) {
          st.wave++
          st.waveTimer = WAVE_DURATION
          // Award stars to all alive players
          for (const p of st.players) { if (p.alive) p.stars++ }
        }
        // Spawn enemies for current wave
        const target = Math.round(st.wave * 10 * spawnRateMult)
        while (st.enemies.length < target) {
          const alivePlayers = st.players.filter(p => p.alive)
          if (alivePlayers.length === 0) break
          const ref = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
          const e = spawnEnemy(ref.x, ref.y, st.wave, false)
          placeEnemyAtEdge(e, ref.x, ref.y)
          st.enemies.push(e)
        }
        // Boss spawn
        st.bossTimer -= dt
        if (st.bossTimer <= 0) {
          st.bossTimer = BOSS_INTERVAL
          const alivePlayers = st.players.filter(p => p.alive)
          if (alivePlayers.length > 0) {
            const ref = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
            const boss = spawnEnemy(ref.x, ref.y, st.wave, true)
            placeEnemyAtEdge(boss, ref.x, ref.y)
            st.enemies.push(boss)
          }
        }
      }

      // ── Spawn collectibles periodically (gather/combo) ──
      if (hasGather && st.collectibles.length < 40 + st.wave * 5) {
        if (Math.random() < 0.05) {
          const kind: CollectibleKind = Math.random() < 0.5 ? 'coin' : 'xp'
          st.collectibles.push({ x: randRange(50, WORLD_W - 50), y: randRange(50, WORLD_H - 50), kind, r: kind === 'coin' ? 4 : 3, vx: 0, vy: 0, attracted: false })
        }
      }

      // ── Auto-shoot (each alive player) ──
      if (hasEnemies) {
        for (const p of st.players) {
          if (!p.alive) continue
          p.shootCd -= dt
          if (p.shootCd <= 0 && st.enemies.length > 0) {
            p.shootCd = SHOOT_CD / p.atkSpeedMult
            // Find nearest enemy
            let nearest: Enemy | null = null, bestD = Infinity
            for (const e of st.enemies) {
              const d = dist(p, e)
              if (d < bestD) { bestD = d; nearest = e }
            }
            if (nearest) {
              const dir = norm({ x: nearest.x - p.x, y: nearest.y - p.y })
              const spread = p.projectiles
              for (let i = 0; i < spread; i++) {
                const angle = Math.atan2(dir.y, dir.x) + (i - (spread - 1) / 2) * 0.15
                st.projectiles.push({ x: p.x, y: p.y, vx: Math.cos(angle) * PROJ_SPEED, vy: Math.sin(angle) * PROJ_SPEED, owner: p.index })
              }
            }
          }
        }
      }

      // ── Move projectiles ──
      for (let i = st.projectiles.length - 1; i >= 0; i--) {
        const pr = st.projectiles[i]
        pr.x += pr.vx; pr.y += pr.vy
        if (pr.x < -50 || pr.x > WORLD_W + 50 || pr.y < -50 || pr.y > WORLD_H + 50) {
          st.projectiles.splice(i, 1)
        }
      }

      // ── Projectile-enemy collision ──
      for (let pi = st.projectiles.length - 1; pi >= 0; pi--) {
        const pr = st.projectiles[pi]
        for (let ei = st.enemies.length - 1; ei >= 0; ei--) {
          const e = st.enemies[ei]
          if (dist(pr, e) < e.r + PROJ_R) {
            e.hp--
            st.projectiles.splice(pi, 1)
            if (e.hp <= 0) {
              // Drops
              const killer = st.players.find(p => p.index === pr.owner)
              if (killer) { killer.kills++; killer.coins++ }
              if (e.kind === 'boss') {
                // Boss drops gems
                for (let g = 0; g < 5; g++) {
                  st.collectibles.push({ x: e.x + randRange(-20, 20), y: e.y + randRange(-20, 20), kind: 'xp', r: 3, vx: 0, vy: 0, attracted: false })
                }
                if (killer) killer.gems += 3
              }
              // Heart drop chance
              if (Math.random() < HEART_DROP) {
                st.collectibles.push({ x: e.x, y: e.y, kind: 'heart', r: 4, vx: 0, vy: 0, attracted: false })
              }
              // XP drop
              st.collectibles.push({ x: e.x, y: e.y, kind: 'xp', r: 3, vx: 0, vy: 0, attracted: false })
              st.enemies.splice(ei, 1)
            }
            break
          }
        }
      }

      // ── Move enemies toward nearest player ──
      for (const e of st.enemies) {
        let nearest: PlayerState | null = null, bestD = Infinity
        for (const p of st.players) {
          if (!p.alive) continue
          const d = dist(p, e)
          if (d < bestD) { bestD = d; nearest = p }
        }
        if (nearest) {
          const dir = norm({ x: nearest.x - e.x, y: nearest.y - e.y })
          e.x += dir.x * e.speed; e.y += dir.y * e.speed
        }
      }

      // ── Enemy-player collision ──
      for (const e of st.enemies) {
        for (const p of st.players) {
          if (!p.alive) continue
          if (dist(p, e) < PLAYER_R + e.r) {
            p.hp -= e.damage
            // Knockback enemy
            const dir = norm({ x: e.x - p.x, y: e.y - p.y })
            e.x += dir.x * 30; e.y += dir.y * 30
            if (p.hp <= 0) { p.hp = 0; p.alive = false }
          }
        }
      }

      // ── Orbiting shield ──
      for (const p of st.players) {
        if (!p.alive || !p.hasOrbit) continue
        p.orbitAngle += ORBIT_SPEED
        const ox = p.x + Math.cos(p.orbitAngle) * ORBIT_DIST
        const oy = p.y + Math.sin(p.orbitAngle) * ORBIT_DIST
        for (let ei = st.enemies.length - 1; ei >= 0; ei--) {
          if (dist({ x: ox, y: oy }, st.enemies[ei]) < ORBIT_R + st.enemies[ei].r) {
            st.enemies[ei].hp -= 2
            if (st.enemies[ei].hp <= 0) {
              p.kills++; p.coins++
              st.collectibles.push({ x: st.enemies[ei].x, y: st.enemies[ei].y, kind: 'xp', r: 3, vx: 0, vy: 0, attracted: false })
              st.enemies.splice(ei, 1)
            }
          }
        }
      }

      // ── Area blast ──
      for (const p of st.players) {
        if (!p.alive || !p.hasAoe) continue
        p.aoeCd -= dt
        if (p.aoeCd <= 0) {
          p.aoeCd = AOE_INTERVAL
          p.aoeFlash = 300
          const blastR = 80
          for (let ei = st.enemies.length - 1; ei >= 0; ei--) {
            if (dist(p, st.enemies[ei]) < blastR) {
              st.enemies[ei].hp -= 3
              if (st.enemies[ei].hp <= 0) {
                p.kills++; p.coins++
                st.collectibles.push({ x: st.enemies[ei].x, y: st.enemies[ei].y, kind: 'xp', r: 3, vx: 0, vy: 0, attracted: false })
                st.enemies.splice(ei, 1)
              }
            }
          }
        }
        if (p.aoeFlash > 0) p.aoeFlash -= dt
      }

      // ── Auto-gather (attract + collect) ──
      for (const p of st.players) {
        if (!p.alive) continue
        for (let ci = st.collectibles.length - 1; ci >= 0; ci--) {
          const c = st.collectibles[ci]
          const d = dist(p, c)
          if (d < p.pickupRadius) {
            c.attracted = true
            const dir = norm({ x: p.x - c.x, y: p.y - c.y })
            c.vx += dir.x * ATTRACT_ACCEL; c.vy += dir.y * ATTRACT_ACCEL
          }
          if (c.attracted) {
            c.x += c.vx; c.y += c.vy
          }
          if (d < PLAYER_R + c.r) {
            // Collect
            switch (c.kind) {
              case 'coin': p.coins++; break
              case 'xp':
                p.xp++
                if (p.xp >= p.xpToNext) {
                  p.xp = 0; p.level++; p.xpToNext = xpNeeded(p.level)
                  // Trigger upgrade choice
                  st.choosingUpgrade = p.index
                  st.upgradeChoices = randomUpgrades(p.upgrades)
                  setUpgradeUI({ player: p.index, choices: st.upgradeChoices })
                }
                break
              case 'heart': p.hp = Math.min(p.hp + 1, p.maxHp); break
            }
            st.collectibles.splice(ci, 1)
          }
        }
      }

      // ── Game over check ──
      const alive = st.players.filter(p => p.alive)
      if (alive.length === 0) {
        st.gameOver = true
        setGameOver(true)
        // Winner by score
        const best = [...st.players].sort((a, b) => (b.kills * st.wave) - (a.kills * st.wave))[0]
        if (st.players.length > 1) setWinner(best?.name ?? null)
        return
      }

      // Update HUD
      setHud(st.players.map(p => ({ ...p })))
      timer = setTimeout(tick, TICK_MS)
    }

    timer = setTimeout(tick, TICK_MS)
    return () => clearTimeout(timer)
  // Mount-only: game loop timer initialized once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render canvas ───────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      canvas.width = CW; canvas.height = CH

      // Camera follows first alive player (or first player)
      const cam = st.players.find(p => p.alive) || st.players[0]
      const camX = clamp(cam.x - CW / 2, 0, WORLD_W - CW)
      const camY = clamp(cam.y - CH / 2, 0, WORLD_H - CH)

      ctx.save()
      ctx.translate(-camX, -camY)

      // Background
      ctx.fillStyle = '#0a0a14'
      ctx.fillRect(camX, camY, CW, CH)

      // Grid
      ctx.strokeStyle = '#141428'
      ctx.lineWidth = 0.5
      const gs = 40
      const sx = Math.floor(camX / gs) * gs, sy = Math.floor(camY / gs) * gs
      for (let x = sx; x < camX + CW; x += gs) { ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + CH); ctx.stroke() }
      for (let y = sy; y < camY + CH; y += gs) { ctx.beginPath(); ctx.moveTo(camX, y); ctx.lineTo(camX + CW, y); ctx.stroke() }

      // World border
      ctx.strokeStyle = '#333'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, WORLD_W, WORLD_H)

      // Collectibles
      for (const c of st.collectibles) {
        if (c.x < camX - 20 || c.x > camX + CW + 20 || c.y < camY - 20 || c.y > camY + CH + 20) continue
        if (c.kind === 'coin') {
          ctx.fillStyle = '#f1c40f'
          ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill()
        } else if (c.kind === 'xp') {
          ctx.fillStyle = '#00e5ff'
          ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(Math.PI / 4)
          ctx.fillRect(-c.r, -c.r, c.r * 2, c.r * 2)
          ctx.restore()
        } else if (c.kind === 'heart') {
          ctx.fillStyle = '#e74c3c'
          ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Enemies
      for (const e of st.enemies) {
        if (e.x < camX - 30 || e.x > camX + CW + 30 || e.y < camY - 30 || e.y > camY + CH + 30) continue
        switch (e.kind) {
          case 'slime':
            ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill(); break
          case 'bat':
            ctx.fillStyle = '#9b59b6'
            ctx.beginPath(); ctx.moveTo(e.x, e.y - e.r); ctx.lineTo(e.x - e.r, e.y + e.r); ctx.lineTo(e.x + e.r, e.y + e.r); ctx.closePath(); ctx.fill(); break
          case 'skeleton':
            ctx.fillStyle = '#ecf0f1'; ctx.fillRect(e.x - 2.5, e.y - 4, 5, 8); break
          case 'boss':
            ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill()
            ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2; ctx.stroke()
            // HP bar
            ctx.fillStyle = '#333'; ctx.fillRect(e.x - 15, e.y - e.r - 8, 30, 4)
            ctx.fillStyle = '#e74c3c'; ctx.fillRect(e.x - 15, e.y - e.r - 8, 30 * (e.hp / e.maxHp), 4)
            break
        }
      }

      // Projectiles
      for (const pr of st.projectiles) {
        if (pr.x < camX - 10 || pr.x > camX + CW + 10 || pr.y < camY - 10 || pr.y > camY + CH + 10) continue
        const owner = st.players.find(p => p.index === pr.owner)
        ctx.fillStyle = owner?.color ?? '#fff'
        ctx.beginPath(); ctx.arc(pr.x, pr.y, PROJ_R, 0, Math.PI * 2); ctx.fill()
      }

      // Players
      for (const p of st.players) {
        if (!p.alive) continue
        // AOE flash
        if (p.aoeFlash > 0) {
          ctx.fillStyle = `rgba(255,200,0,${p.aoeFlash / 600})`
          ctx.beginPath(); ctx.arc(p.x, p.y, 80, 0, Math.PI * 2); ctx.fill()
        }
        // Pickup radius hint
        ctx.strokeStyle = `${p.color}33`; ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(p.x, p.y, p.pickupRadius, 0, Math.PI * 2); ctx.stroke()
        // Body
        ctx.fillStyle = p.color
        ctx.beginPath(); ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2); ctx.fill()
        // Eyes
        ctx.fillStyle = '#000'
        ctx.beginPath(); ctx.arc(p.x - 3, p.y - 3, 2, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(p.x + 3, p.y - 3, 2, 0, Math.PI * 2); ctx.fill()
        // Orbit
        if (p.hasOrbit) {
          const ox = p.x + Math.cos(p.orbitAngle) * ORBIT_DIST
          const oy = p.y + Math.sin(p.orbitAngle) * ORBIT_DIST
          ctx.fillStyle = '#3498db'
          ctx.beginPath(); ctx.arc(ox, oy, ORBIT_R, 0, Math.PI * 2); ctx.fill()
        }
        // Name tag
        ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
        ctx.fillText(p.name, p.x, p.y - PLAYER_R - 6)
      }

      ctx.restore()

      // ── HUD (screen-space) ──
      const hudPlayers = st.players
      const hudW = CW / hudPlayers.length
      for (let i = 0; i < hudPlayers.length; i++) {
        const p = hudPlayers[i]
        const hx = i * hudW + 8
        ctx.fillStyle = p.color; ctx.font = 'bold 11px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(p.name, hx, 16)
        // Hearts
        for (let h = 0; h < p.maxHp; h++) {
          ctx.fillStyle = h < p.hp ? '#e74c3c' : '#333'
          ctx.fillText('♥', hx + h * 12, 30)
        }
        // XP bar
        ctx.fillStyle = '#333'; ctx.fillRect(hx, 34, 80, 4)
        ctx.fillStyle = '#00e5ff'; ctx.fillRect(hx, 34, 80 * (p.xp / p.xpToNext), 4)
        // Stats
        ctx.fillStyle = '#aaa'; ctx.font = '9px monospace'
        ctx.fillText(`Lv${p.level}  W${st.wave}  K${p.kills}`, hx, 48)
        ctx.fillText(`🪙${p.coins} 💎${p.gems} ⭐${p.stars}`, hx, 58)
        // Upgrade icons
        const unique = [...new Set(p.upgrades)]
        const iconStr = unique.map(u => ALL_UPGRADES.find(a => a.id === u)?.icon ?? '').join('')
        if (iconStr) { ctx.fillStyle = '#ddd'; ctx.fillText(iconStr, hx, 70) }
      }

      // Time survived
      ctx.fillStyle = '#ccc'; ctx.font = '10px monospace'; ctx.textAlign = 'right'
      const sec = Math.floor(st.elapsed / 1000)
      ctx.fillText(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`, CW - 8, 16)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Restart ─────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, mode, playerMode)
    setGameOver(false); setWinner(null); setHud([]); setUpgradeUI(null)
  }, [players, mode, playerMode])

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
        {hud.map(p => (
          <div key={p.index} className={`${styles.scoreItem} ${!p.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name}</span>
            <span className={styles.scoreValue}>K{p.kills} Lv{p.level}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={CW} height={CH}  role="img" aria-label="Auto Survivors canvas"/>

      {/* Upgrade choice overlay */}
      {upgradeUI && (
        <div className={styles.overlay}>
          <h2>⬆️ Level Up! — {players.find(p => p.index === upgradeUI.player)?.name}</h2>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            {upgradeUI.choices.map(u => (
              <button key={u.id} className={styles.restartBtn} onClick={() => applyUpgrade(u.id)}>
                {u.icon} {u.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {hud.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center' }}>
              {hud.map(p => (
                <span key={p.index} style={{ color: p.color, fontWeight: 700 }}>
                  {p.name}: K{p.kills} W{stateRef.current.wave} 🪙{p.coins} 💎{p.gems} ⭐{p.stars}
                </span>
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
          <p className={styles.overlayHint}>{t('miniGames.pressRestart', 'Press Space or Enter to restart')}</p>
        </div>
      )}
    </div>
  )
}
