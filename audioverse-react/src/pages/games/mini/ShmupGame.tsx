/**
 * ShmupGame — classic vertical scrolling shoot 'em up for 1-4 players.
 *
 * Controls:
 *   Group 0: W/A/S/D + Space (fire)
 *   Group 1: Arrow keys + Enter (fire)
 *   Gamepads: D-pad/stick + A button (fire)
 *
 * Rules:
 *  - Dodge enemy bullets, destroy enemies, collect power-ups.
 *  - 3 stages of increasing difficulty, boss at end of each.
 *  - Lives system with respawn invincibility.
 *  - VS: compete for highest score. Coop: shared screen combined firepower.
 *  - Currencies: coins (enemies), gems (bosses), stars (stage clears).
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
const SHIP_SIZE = 12
const BULLET_R = 3
const ENEMY_BULLET_R = 2
const POWERUP_SIZE = 10
const STAR_COUNT = 80
const SCROLL_SPEED = 1.5
const FIRE_INTERVAL = 150        // ms between player bullets
const ENEMY_SPAWN_BASE = 900     // ms base spawn interval
const BOSS_INTERVAL = 30_000     // ms between bosses
const RESPAWN_MS = 1000
const INVULN_MS = 2000
const COMBO_WINDOW = 1000        // ms
const POWERUP_CHANCE = 0.05

type WeaponLevel = 0 | 1 | 2     // single, spread, laser

interface Ship {
  x: number; y: number
  vx: number; vy: number
  lives: number; score: number
  weapon: WeaponLevel; speed: number
  bombs: number; shield: boolean
  alive: boolean; respawnAt: number; invulnUntil: number
  lastFire: number; combo: number; comboTimer: number
  color: string; name: string; index: number
  input: PlayerSlot['input']
  coins: number; gems: number; stars: number
}

interface Bullet { x: number; y: number; vx: number; vy: number; dmg: number; isLaser?: boolean }
interface EBullet { x: number; y: number; vx: number; vy: number }

type EnemyKind = 'fighter' | 'zigzag' | 'heavy' | 'boss'
interface Enemy {
  x: number; y: number; hp: number; maxHp: number
  kind: EnemyKind; size: number; color: string
  spawnTime: number; lastShot: number; phase: number
}

interface PowerUp { x: number; y: number; kind: 'P' | 'S' | 'B' | 'Shield'; vy: number }

interface Star { x: number; y: number; speed: number; bright: number }

interface GameState {
  ships: Ship[]; bullets: Bullet[]; eBullets: EBullet[]
  enemies: Enemy[]; powerUps: PowerUp[]; stars: Star[]
  stage: number; stageTimer: number; bossActive: boolean
  gameOver: boolean; victory: boolean; time: number
  autoFire: boolean; gameMode: string
}

// ─── Helpers ─────────────────────────────────────────────────
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi))

function makeStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    x: rand(0, W), y: rand(0, H), speed: rand(0.5, 3), bright: rand(0.3, 1),
  }))
}

function spawnShip(p: PlayerSlot, total: number, idx: number): Ship {
  const spacing = W / (total + 1)
  return {
    x: spacing * (idx + 1), y: H - 60,
    vx: 0, vy: 0, lives: 3, score: 0,
    weapon: 0, speed: 3, bombs: 1, shield: false,
    alive: true, respawnAt: 0, invulnUntil: 0,
    lastFire: 0, combo: 0, comboTimer: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, index: p.index, input: p.input,
    coins: 0, gems: 0, stars: 0,
  }
}

function spawnEnemy(stage: number, time: number): Enemy {
  const r = Math.random()
  if (r < 0.5) return { x: rand(20, W - 20), y: -10, hp: 1, maxHp: 1, kind: 'fighter', size: 6, color: '#e74c3c', spawnTime: time, lastShot: time, phase: 0 }
  if (r < 0.8) return { x: rand(20, W - 20), y: -10, hp: 2 + stage, maxHp: 2 + stage, kind: 'zigzag', size: 5, color: '#f1c40f', spawnTime: time, lastShot: time, phase: 0 }
  return { x: rand(30, W - 30), y: -10, hp: 5 + stage * 2, maxHp: 5 + stage * 2, kind: 'heavy', size: 10, color: '#95a5a6', spawnTime: time, lastShot: time, phase: 0 }
}

function spawnBoss(stage: number, time: number): Enemy {
  return {
    x: W / 2, y: -40, hp: 30 + stage * 15, maxHp: 30 + stage * 15,
    kind: 'boss', size: 30, color: '#8e44ad',
    spawnTime: time, lastShot: time, phase: 0,
  }
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  return {
    ships: players.map((p, i) => spawnShip(p, players.length, i)),
    bullets: [], eBullets: [], enemies: [], powerUps: [],
    stars: makeStars(),
    stage: 1, stageTimer: 0, bossActive: false,
    gameOver: false, victory: false, time: 0,
    autoFire: config.autoFire !== 'off',
    gameMode: config.gameMode || 'arcade',
  }
}

// ─── Key maps ────────────────────────────────────────────────
const MOVE_KEYS: Record<string, { group: number; dx: number; dy: number }> = {
  w: { group: 0, dx: 0, dy: -1 }, s: { group: 0, dx: 0, dy: 1 },
  a: { group: 0, dx: -1, dy: 0 }, d: { group: 0, dx: 1, dy: 0 },
  ArrowUp: { group: 1, dx: 0, dy: -1 }, ArrowDown: { group: 1, dx: 0, dy: 1 },
  ArrowLeft: { group: 1, dx: -1, dy: 0 }, ArrowRight: { group: 1, dx: 1, dy: 0 },
}
const FIRE_KEYS: Record<string, number> = { ' ': 0, Enter: 1 }

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function ShmupGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysDown = useRef(new Set<string>())
  const [hud, setHud] = useState({ scores: [] as { name: string; score: number; lives: number; color: string; weapon: WeaponLevel; bombs: number; stage: number }[], gameOver: false, victory: false, winner: '' })
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: hud.gameOver })

  // ── Keyboard input ──
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysDown.current.add(e.key) }
    const up = (e: KeyboardEvent) => { keysDown.current.delete(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Main loop ──
  useEffect(() => {
    let raf = 0
    let lastTime = performance.now()
    let lastSpawn = 0
    let nextBoss = BOSS_INTERVAL

    function loop(now: number) {
      raf = requestAnimationFrame(loop)
      if (pauseRef.current) { lastTime = now; return }
      const dt = Math.min(now - lastTime, 50)
      lastTime = now
      const st = stateRef.current
      if (st.gameOver || st.victory) return

      st.time += dt
      st.stageTimer += dt

      // ── Star scroll ──
      for (const s of st.stars) {
        s.y += s.speed * SCROLL_SPEED * (dt / 16)
        if (s.y > H) { s.y = 0; s.x = rand(0, W) }
      }

      // ── Ship input & movement ──
      const keys = keysDown.current
      const currentPads = padsRef.current
      for (const ship of st.ships) {
        if (!ship.alive) {
          if (ship.respawnAt > 0 && st.time >= ship.respawnAt) {
            if (ship.lives > 0) {
              ship.alive = true; ship.respawnAt = 0
              ship.invulnUntil = st.time + INVULN_MS
              ship.x = W / 2; ship.y = H - 60
              ship.weapon = 0; ship.shield = false
            }
          }
          continue
        }
        let mx = 0, my = 0, firing = false
        // Keyboard
        if (ship.input.type === 'keyboard') {
          const g = ship.input.group
          for (const [key, m] of Object.entries(MOVE_KEYS)) {
            if (m.group === g && keys.has(key)) { mx += m.dx; my += m.dy }
          }
          for (const [key, fg] of Object.entries(FIRE_KEYS)) {
            if (fg === g && keys.has(key)) firing = true
          }
        }
        // Gamepad
        if (ship.input.type === 'gamepad') {
          const gp = currentPads.find(p => p.index === (ship.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) my -= 1; if (gp.down) my += 1
            if (gp.left) mx -= 1; if (gp.right) mx += 1
            if (gp.a) firing = true
          }
        }
        if (st.autoFire) firing = true

        const spd = ship.speed * (dt / 4)
        ship.x = Math.max(SHIP_SIZE, Math.min(W - SHIP_SIZE, ship.x + mx * spd))
        ship.y = Math.max(SHIP_SIZE, Math.min(H - SHIP_SIZE, ship.y + my * spd))

        // ── Fire ──
        if (firing && now - ship.lastFire > FIRE_INTERVAL) {
          ship.lastFire = now
          if (ship.weapon === 0) {
            st.bullets.push({ x: ship.x, y: ship.y - SHIP_SIZE, vx: 0, vy: -6, dmg: 1 })
          } else if (ship.weapon === 1) {
            st.bullets.push({ x: ship.x, y: ship.y - SHIP_SIZE, vx: 0, vy: -6, dmg: 0.7 })
            st.bullets.push({ x: ship.x, y: ship.y - SHIP_SIZE, vx: -1.5, vy: -5.5, dmg: 0.7 })
            st.bullets.push({ x: ship.x, y: ship.y - SHIP_SIZE, vx: 1.5, vy: -5.5, dmg: 0.7 })
          } else {
            st.bullets.push({ x: ship.x, y: ship.y - SHIP_SIZE, vx: 0, vy: -8, dmg: 0.4, isLaser: true })
          }
        }

        // ── Bomb ──
        // (bomb via X button on gamepad or B key — handled as special)
        if (ship.input.type === 'gamepad') {
          const gp = currentPads.find(p => p.index === (ship.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp?.b && ship.bombs > 0) { ship.bombs--; st.enemies.length = 0; st.eBullets.length = 0 }
        }
        if (ship.input.type === 'keyboard') {
          const bKey = ship.input.group === 0 ? 'q' : 'Backspace'
          if (keys.has(bKey) && ship.bombs > 0) { ship.bombs--; st.enemies.length = 0; st.eBullets.length = 0; keys.delete(bKey) }
        }

        // combo decay
        if (st.time - ship.comboTimer > COMBO_WINDOW) ship.combo = 0
      }

      // ── Move player bullets ──
      for (let i = st.bullets.length - 1; i >= 0; i--) {
        const b = st.bullets[i]
        b.x += b.vx * (dt / 16); b.y += b.vy * (dt / 16)
        if (b.y < -10 || b.x < -10 || b.x > W + 10) st.bullets.splice(i, 1)
      }

      // ── Enemy spawn ──
      const spawnInterval = ENEMY_SPAWN_BASE - st.stage * 150
      if (!st.bossActive && st.time - lastSpawn > Math.max(300, spawnInterval)) {
        lastSpawn = st.time
        st.enemies.push(spawnEnemy(st.stage, st.time))
      }

      // ── Boss spawn ──
      if (!st.bossActive && st.stageTimer >= nextBoss) {
        st.bossActive = true
        st.enemies.push(spawnBoss(st.stage, st.time))
        nextBoss = st.stageTimer + BOSS_INTERVAL
      }

      // ── Move enemies ──
      for (let i = st.enemies.length - 1; i >= 0; i--) {
        const e = st.enemies[i]
        const age = st.time - e.spawnTime
        if (e.kind === 'fighter') {
          e.y += 1.2 * (dt / 16)
        } else if (e.kind === 'zigzag') {
          e.y += 0.8 * (dt / 16)
          e.x += Math.sin(age / 300) * 2
        } else if (e.kind === 'heavy') {
          e.y += 0.4 * (dt / 16)
        } else if (e.kind === 'boss') {
          if (e.y < 60) e.y += 0.5 * (dt / 16)
          e.x = W / 2 + Math.sin(age / 800) * 200
        }
        if (e.y > H + 40 && e.kind !== 'boss') { st.enemies.splice(i, 1); continue }

        // ── Enemy shooting ──
        const shootInterval = e.kind === 'fighter' ? 2000 : e.kind === 'heavy' ? 1500 : e.kind === 'boss' ? 600 : 9999
        if (st.time - e.lastShot > shootInterval) {
          e.lastShot = st.time
          if (e.kind === 'fighter') {
            st.eBullets.push({ x: e.x, y: e.y + e.size, vx: 0, vy: 3 })
          } else if (e.kind === 'heavy') {
            st.eBullets.push({ x: e.x, y: e.y + e.size, vx: 0, vy: 2.5 })
            st.eBullets.push({ x: e.x, y: e.y + e.size, vx: -1.5, vy: 2 })
            st.eBullets.push({ x: e.x, y: e.y + e.size, vx: 1.5, vy: 2 })
          } else if (e.kind === 'boss') {
            e.phase++
            if (e.phase % 3 === 0) {
              // circle burst
              for (let a = 0; a < 12; a++) {
                const angle = (a / 12) * Math.PI * 2
                st.eBullets.push({ x: e.x, y: e.y + e.size, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5 })
              }
            } else {
              // aimed at nearest ship
              const alive = st.ships.filter(s => s.alive)
              if (alive.length) {
                const target = alive[randInt(0, alive.length)]
                const dx = target.x - e.x, dy = target.y - e.y
                const len = Math.sqrt(dx * dx + dy * dy) || 1
                st.eBullets.push({ x: e.x, y: e.y + e.size, vx: (dx / len) * 3, vy: (dy / len) * 3 })
              }
            }
          }
        }
      }

      // ── Move enemy bullets ──
      for (let i = st.eBullets.length - 1; i >= 0; i--) {
        const b = st.eBullets[i]
        b.x += b.vx * (dt / 16); b.y += b.vy * (dt / 16)
        if (b.y > H + 10 || b.y < -10 || b.x < -10 || b.x > W + 10) st.eBullets.splice(i, 1)
      }

      // ── Bullet-enemy collision ──
      for (let bi = st.bullets.length - 1; bi >= 0; bi--) {
        const b = st.bullets[bi]
        for (let ei = st.enemies.length - 1; ei >= 0; ei--) {
          const e = st.enemies[ei]
          const dx = b.x - e.x, dy = b.y - e.y
          if (Math.abs(dx) < e.size && Math.abs(dy) < e.size) {
            e.hp -= b.dmg
            if (!b.isLaser) { st.bullets.splice(bi, 1) }
            if (e.hp <= 0) {
              const isBoss = e.kind === 'boss'
              // reward all ships in coop, or nearest ship in vs
              const alive = st.ships.filter(s => s.alive)
              for (const ship of alive) {
                ship.combo++; ship.comboTimer = st.time
                const pts = (isBoss ? 100 : e.kind === 'heavy' ? 10 : e.kind === 'zigzag' ? 5 : 3) * Math.max(1, ship.combo)
                ship.score += pts
                ship.coins += isBoss ? 0 : 1
                if (isBoss) ship.gems += 1
                if (st.gameMode === 'vs-score') break // only reward closest in vs
              }
              // power-up drop
              if (Math.random() < POWERUP_CHANCE || isBoss) {
                const kinds: PowerUp['kind'][] = ['P', 'S', 'B', 'Shield']
                st.powerUps.push({ x: e.x, y: e.y, kind: kinds[randInt(0, kinds.length)], vy: 1.5 })
              }
              st.enemies.splice(ei, 1)
              if (isBoss) {
                st.bossActive = false
                // stage clear
                for (const ship of alive) ship.stars += 1
                if (st.stage >= 3) {
                  st.victory = true
                } else {
                  st.stage++; st.stageTimer = 0
                }
              }
            }
            break
          }
        }
      }

      // ── Enemy bullet → ship collision ──
      for (let bi = st.eBullets.length - 1; bi >= 0; bi--) {
        const b = st.eBullets[bi]
        for (const ship of st.ships) {
          if (!ship.alive || st.time < ship.invulnUntil) continue
          const dx = b.x - ship.x, dy = b.y - ship.y
          if (Math.abs(dx) < SHIP_SIZE && Math.abs(dy) < SHIP_SIZE) {
            st.eBullets.splice(bi, 1)
            if (ship.shield) { ship.shield = false } else {
              ship.alive = false; ship.lives--
              ship.respawnAt = ship.lives > 0 ? st.time + RESPAWN_MS : 0
              ship.combo = 0
            }
            break
          }
        }
      }

      // ── Enemy body → ship collision ──
      for (const e of st.enemies) {
        for (const ship of st.ships) {
          if (!ship.alive || st.time < ship.invulnUntil) continue
          const dx = e.x - ship.x, dy = e.y - ship.y
          if (Math.abs(dx) < e.size + SHIP_SIZE / 2 && Math.abs(dy) < e.size + SHIP_SIZE / 2) {
            if (ship.shield) { ship.shield = false } else {
              ship.alive = false; ship.lives--
              ship.respawnAt = ship.lives > 0 ? st.time + RESPAWN_MS : 0
              ship.combo = 0
            }
          }
        }
      }

      // ── Power-up collection ──
      for (let pi = st.powerUps.length - 1; pi >= 0; pi--) {
        const pu = st.powerUps[pi]
        pu.y += pu.vy * (dt / 16)
        if (pu.y > H + 20) { st.powerUps.splice(pi, 1); continue }
        for (const ship of st.ships) {
          if (!ship.alive) continue
          if (Math.abs(pu.x - ship.x) < 14 && Math.abs(pu.y - ship.y) < 14) {
            if (pu.kind === 'P') ship.weapon = Math.min(2, ship.weapon + 1) as WeaponLevel
            else if (pu.kind === 'S') ship.speed += 0.5
            else if (pu.kind === 'B') ship.bombs++
            else if (pu.kind === 'Shield') ship.shield = true
            st.powerUps.splice(pi, 1)
            break
          }
        }
      }

      // ── Game over check ──
      const aliveShips = st.ships.filter(s => s.alive || s.lives > 0)
      if (aliveShips.length === 0) st.gameOver = true

      // ── Update HUD ──
      setHud({
        scores: st.ships.map(s => ({ name: s.name, score: s.score, lives: s.lives, color: s.color, weapon: s.weapon, bombs: s.bombs, stage: st.stage })),
        gameOver: st.gameOver, victory: st.victory,
        winner: st.gameMode === 'vs-score' ? (st.ships.reduce((a, b) => a.score > b.score ? a : b)).name : '',
      })
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [pauseRef])

  // ── Render ──
  useEffect(() => {
    let raf = 0
    function draw() {
      raf = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const st = stateRef.current

      canvas.width = W; canvas.height = H
      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, W, H)

      // stars
      for (const s of st.stars) {
        ctx.globalAlpha = s.bright; ctx.fillStyle = '#fff'
        ctx.fillRect(s.x, s.y, 1.5, 1.5)
      }
      ctx.globalAlpha = 1

      // power-ups
      for (const pu of st.powerUps) {
        ctx.fillStyle = pu.kind === 'P' ? '#2ecc71' : pu.kind === 'S' ? '#3498db' : pu.kind === 'B' ? '#e74c3c' : '#1abc9c'
        ctx.fillRect(pu.x - POWERUP_SIZE / 2, pu.y - POWERUP_SIZE / 2, POWERUP_SIZE, POWERUP_SIZE)
        ctx.fillStyle = '#fff'; ctx.font = '8px monospace'; ctx.textAlign = 'center'
        ctx.fillText(pu.kind === 'Shield' ? '🛡' : pu.kind, pu.x, pu.y + 3)
      }

      // enemies
      for (const e of st.enemies) {
        ctx.fillStyle = e.color
        if (e.kind === 'fighter') {
          ctx.beginPath()
          ctx.moveTo(e.x, e.y + e.size); ctx.lineTo(e.x - e.size, e.y - e.size); ctx.lineTo(e.x + e.size, e.y - e.size)
          ctx.closePath(); ctx.fill()
        } else if (e.kind === 'zigzag') {
          ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(Math.PI / 4)
          ctx.fillRect(-e.size, -e.size, e.size * 2, e.size * 2)
          ctx.restore()
        } else if (e.kind === 'heavy') {
          ctx.fillRect(e.x - e.size / 2, e.y - e.size * 0.4, e.size, e.size * 0.8)
        } else if (e.kind === 'boss') {
          ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2); ctx.fill()
          // hp bar
          ctx.fillStyle = '#333'; ctx.fillRect(e.x - 30, e.y - e.size - 10, 60, 5)
          ctx.fillStyle = '#e74c3c'; ctx.fillRect(e.x - 30, e.y - e.size - 10, 60 * (e.hp / e.maxHp), 5)
        }
      }

      // enemy bullets
      ctx.fillStyle = '#e74c3c'
      for (const b of st.eBullets) {
        ctx.beginPath(); ctx.arc(b.x, b.y, ENEMY_BULLET_R, 0, Math.PI * 2); ctx.fill()
      }

      // player bullets
      for (const b of st.bullets) {
        if (b.isLaser) {
          ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2
          ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x, b.y - 30); ctx.stroke()
        } else {
          ctx.fillStyle = '#f1c40f'
          ctx.beginPath(); ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2); ctx.fill()
        }
      }

      // ships
      for (const ship of st.ships) {
        if (!ship.alive) continue
        const blink = st.time < ship.invulnUntil && Math.floor(st.time / 80) % 2 === 0
        if (blink) ctx.globalAlpha = 0.4
        ctx.fillStyle = ship.color
        ctx.beginPath()
        ctx.moveTo(ship.x, ship.y - SHIP_SIZE)
        ctx.lineTo(ship.x - SHIP_SIZE / 2, ship.y + SHIP_SIZE / 2)
        ctx.lineTo(ship.x + SHIP_SIZE / 2, ship.y + SHIP_SIZE / 2)
        ctx.closePath(); ctx.fill()
        if (ship.shield) {
          ctx.strokeStyle = '#1abc9c'; ctx.lineWidth = 1.5
          ctx.beginPath(); ctx.arc(ship.x, ship.y, SHIP_SIZE + 3, 0, Math.PI * 2); ctx.stroke()
        }
        ctx.globalAlpha = 1
      }

      // HUD on canvas
      ctx.fillStyle = '#fff'; ctx.font = '12px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`STAGE ${st.stage}/3`, 10, 18)
      let hx = W - 10
      ctx.textAlign = 'right'
      for (const ship of st.ships) {
        const lifeStr = '♥'.repeat(Math.max(0, ship.lives))
        const wpn = ['•', '⋮', '═'][ship.weapon]
        ctx.fillStyle = ship.color
        ctx.fillText(`${ship.name}: ${ship.score}  ${lifeStr}  W:${wpn}  B:${ship.bombs}`, hx, 18)
        hx -= 250
      }
      ctx.textAlign = 'left'
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setHud({ scores: [], gameOver: false, victory: false, winner: '' })
  }, [players, config])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((hud.gameOver || hud.victory) && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hud.gameOver, hud.victory, handleRestart])

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        {hud.scores.map((s, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>{s.score}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={W} height={H}  role="img" aria-label="Shmup canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {(hud.gameOver || hud.victory) && (
        <div className={styles.overlay}>
          <h2>{hud.victory ? t('miniGames.victory', 'Victory!') : t('miniGames.gameOver', 'Game Over!')}</h2>
          {hud.winner && <p className={styles.winnerText}>🏆 {hud.winner} {t('miniGames.wins', 'wins')}!</p>}
          {!hud.winner && hud.scores.length > 0 && (
            <p className={styles.winnerText}>{t('miniGames.finalScore', 'Score')}: {hud.scores.reduce((a, b) => a.score > b.score ? a : b).score}</p>
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
