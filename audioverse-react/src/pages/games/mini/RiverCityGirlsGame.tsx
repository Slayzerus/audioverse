/**
 * RiverCityGirlsGame — side-scrolling beat 'em up for 1-4 players.
 *
 * Controls:
 *   Group 0: WASD move, Space punch, E kick, Q special
 *   Group 1: Arrows move, Enter punch, Shift kick, Ctrl special
 *   Gamepad: stick move, X punch, A kick, Y special
 *
 * Modes: story-coop (clear waves), vs-brawl (PvP), survival (endless).
 * Currencies: coins (enemy kills), gems (combos), stars (boss kills).
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
const W = 800, H = 400
const GROUND_Y = 180 // top of walkable area
const GROUND_BOTTOM = 350
const PW = 20, PH = 40, HEAD_R = 8
const TICK = 1000 / 60
const COMBO_WINDOW = 500 // ms to chain hits
const SPECIAL_COST = 40

// ─── Types ───────────────────────────────────────────────────
interface Fighter {
  x: number; y: number; vx: number
  hp: number; maxHp: number; sp: number
  lives: number; alive: boolean; respawnTimer: number
  color: string; name: string; playerIndex: number
  input: PlayerSlot['input']
  facing: 1 | -1
  attacking: string | null // 'punch1'|'punch2'|'punch3'|'kick'|'special'|'jumpkick'
  attackTimer: number
  comboCount: number; comboTimer: number; maxCombo: number
  inAir: boolean; jumpVy: number
  kills: number; xp: number; level: number
  iFrames: number
  coins: number; gems: number; stars: number
}

interface Enemy {
  x: number; y: number; hp: number; maxHp: number
  type: 'thug' | 'runner' | 'boss'
  alive: boolean; facing: 1 | -1
  attackTimer: number; hitTimer: number
  speed: number; damage: number; w: number; h: number
}

interface GameState {
  fighters: Fighter[]
  enemies: Enemy[]
  wave: number; maxWaves: number
  enemiesToSpawn: number; spawnTimer: number
  scrollX: number; waveCleared: boolean; waveClearTimer: number
  gameOver: boolean; victory: boolean
  mode: string; difficulty: string
  tick: number
}

// ─── Keyboard Mappings ───────────────────────────────────────
interface KeyAction { group: number; action: string }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, action: 'up' }], ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }], ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'punch' }], ['e', { group: 0, action: 'kick' }],
  ['q', { group: 0, action: 'special' }],
  ['ArrowUp', { group: 1, action: 'up' }], ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }], ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'punch' }], ['Shift', { group: 1, action: 'kick' }],
  ['Control', { group: 1, action: 'special' }],
])

// ─── Helpers ─────────────────────────────────────────────────
function spawnFighter(p: PlayerSlot, idx: number, lives: number): Fighter {
  return {
    x: 60 + idx * 50, y: 260, vx: 0,
    hp: 100, maxHp: 100, sp: 0, lives, alive: true, respawnTimer: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, playerIndex: p.index, input: p.input,
    facing: 1, attacking: null, attackTimer: 0,
    comboCount: 0, comboTimer: 0, maxCombo: 0,
    inAir: false, jumpVy: 0,
    kills: 0, xp: 0, level: 1, iFrames: 0,
    coins: 0, gems: 0, stars: 0,
  }
}

function spawnEnemy(wave: number, scrollX: number, type: 'thug' | 'runner' | 'boss'): Enemy {
  const fromRight = Math.random() > 0.5
  const x = fromRight ? scrollX + W + 20 : scrollX - 30
  const y = GROUND_Y + 40 + Math.random() * (GROUND_BOTTOM - GROUND_Y - 60)
  const stats = type === 'boss'
    ? { hp: 200, speed: 0.6, damage: 20, w: 36, h: 56 }
    : type === 'runner'
    ? { hp: 30, speed: 2.0 + wave * 0.1, damage: 8, w: 18, h: 36 }
    : { hp: 50, speed: 0.8 + wave * 0.05, damage: 12, w: 22, h: 42 }
  return {
    x, y, hp: stats.hp, maxHp: stats.hp, type, alive: true,
    facing: fromRight ? -1 : 1, attackTimer: 0, hitTimer: 0,
    speed: stats.speed, damage: stats.damage, w: stats.w, h: stats.h,
  }
}

function enemyWaveCount(wave: number, difficulty: string): number {
  const base = 3 + wave * 2
  const mult = difficulty === 'hard' ? 1.5 : difficulty === 'easy' ? 0.7 : 1
  return Math.ceil(base * mult)
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const mode = (config.gameMode as string) || 'story-coop'
  const lives = Number(config.lives) || 3
  const maxWaves = mode === 'survival' ? 9999 : (Number(config.waveCount) || 5)
  const difficulty = (config.difficulty as string) || 'normal'
  const fighters = players.map((p, i) => spawnFighter(p, i, lives))
  return {
    fighters, enemies: [], wave: 1, maxWaves,
    enemiesToSpawn: enemyWaveCount(1, difficulty), spawnTimer: 0,
    scrollX: 0, waveCleared: false, waveClearTimer: 0,
    gameOver: false, victory: false, mode, difficulty, tick: 0,
  }
}

// ─── Attack hit detection ────────────────────────────────────
function attackRect(f: Fighter, atk: string): { x: number; y: number; w: number; h: number } {
  const reach = atk === 'special' ? 60 : atk.startsWith('punch') ? 28 : 35
  const hh = atk === 'special' ? 50 : 20
  return {
    x: f.facing === 1 ? f.x + PW : f.x - reach,
    y: f.y + PH / 2 - hh / 2,
    w: reach, h: hh,
  }
}

function rectsOverlap(a: { x: number; y: number; w: number; h: number },
                      b: { x: number; y: number; w: number; h: number }) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function attackDamage(atk: string): number {
  if (atk === 'punch1') return 10
  if (atk === 'punch2') return 12
  if (atk === 'punch3') return 18
  if (atk === 'kick' || atk === 'jumpkick') return 20
  if (atk === 'special') return 35
  return 10
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function RiverCityGirlsGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const [scoreboard, setScoreboard] = useState<Fighter[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [victory, setVictory] = useState(false)
  const [waveDisplay, setWaveDisplay] = useState(1)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Key tracking ───────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); e.preventDefault() }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Input helpers ──────────────────────────────────────
  function isPressed(input: PlayerSlot['input'], action: string): boolean {
    if (input.type === 'keyboard') {
      for (const [key, m] of KEY_MAP) {
        if (m.group === input.group && m.action === action && keysRef.current.has(key)) return true
      }
      return false
    }
    if (input.type === 'gamepad') {
      const gp = padsRef.current.find(p => p.index === input.padIndex)
      if (!gp) return false
      if (action === 'up') return gp.up
      if (action === 'down') return gp.down
      if (action === 'left') return gp.left
      if (action === 'right') return gp.right
      if (action === 'punch') return gp.x
      if (action === 'kick') return gp.a
      if (action === 'special') return gp.y
    }
    return false
  }

  // ── Game loop ──────────────────────────────────────────
  useEffect(() => {
    const prevAttack = new Map<number, Set<string>>()

    function tick() {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      st.tick++
      const isVs = st.mode === 'vs-brawl'

      // ── Fighter update ────────────────────
      for (const f of st.fighters) {
        if (!f.alive) {
          if (f.lives > 0) {
            f.respawnTimer -= TICK
            if (f.respawnTimer <= 0) {
              f.alive = true; f.hp = f.maxHp; f.sp = 0
              f.x = st.scrollX + 60; f.y = 260; f.iFrames = 90
            }
          }
          continue
        }
        if (f.iFrames > 0) f.iFrames--

        // Movement
        const spd = 2.5
        let dx = 0, dy = 0
        if (isPressed(f.input, 'left')) { dx = -spd; f.facing = -1 }
        if (isPressed(f.input, 'right')) { dx = spd; f.facing = 1 }
        if (isPressed(f.input, 'up')) dy = -spd
        if (isPressed(f.input, 'down')) dy = spd
        if (f.attacking) { dx *= 0.3; dy *= 0.3 }
        f.x += dx; f.y += dy
        f.x = Math.max(st.scrollX, Math.min(st.scrollX + W - PW, f.x))
        f.y = Math.max(GROUND_Y, Math.min(GROUND_BOTTOM, f.y))

        // Jump
        if (isPressed(f.input, 'up') && !f.inAir && !f.attacking) {
          f.inAir = true; f.jumpVy = -6
        }
        if (f.inAir) {
          f.jumpVy += 0.3
          f.y += f.jumpVy
          if (f.y >= GROUND_BOTTOM) { f.y = GROUND_BOTTOM; f.inAir = false; f.jumpVy = 0 }
        }

        // Combo timer
        if (f.comboTimer > 0) {
          f.comboTimer -= TICK
          if (f.comboTimer <= 0) {
            if (f.comboCount >= 3) f.gems++
            f.comboCount = 0
          }
        }

        // Attack input (edge detect)
        const prev = prevAttack.get(f.playerIndex) ?? new Set()
        const punchNow = isPressed(f.input, 'punch')
        const kickNow = isPressed(f.input, 'kick')
        const specialNow = isPressed(f.input, 'special')

        if (f.attackTimer > 0) { f.attackTimer -= TICK }
        else { f.attacking = null }

        if (!f.attacking || f.attackTimer <= 0) {
          if (punchNow && !prev.has('punch')) {
            if (f.comboTimer > 0 && f.comboCount === 1) { f.attacking = 'punch2'; f.attackTimer = 180 }
            else if (f.comboTimer > 0 && f.comboCount >= 2) { f.attacking = 'punch3'; f.attackTimer = 250 }
            else { f.attacking = 'punch1'; f.attackTimer = 150 }
            f.comboCount++; f.comboTimer = COMBO_WINDOW
            if (f.comboCount > f.maxCombo) f.maxCombo = f.comboCount
          } else if (kickNow && !prev.has('kick')) {
            f.attacking = f.inAir ? 'jumpkick' : 'kick'
            f.attackTimer = 300
          } else if (specialNow && !prev.has('special') && f.sp >= SPECIAL_COST) {
            f.attacking = 'special'; f.attackTimer = 400; f.sp -= SPECIAL_COST
          }
        }

        const newPrev = new Set<string>()
        if (punchNow) newPrev.add('punch')
        if (kickNow) newPrev.add('kick')
        if (specialNow) newPrev.add('special')
        prevAttack.set(f.playerIndex, newPrev)

        // Hit enemies
        if (f.attacking && f.attackTimer > 0) {
          const atkBox = attackRect(f, f.attacking)
          for (const e of st.enemies) {
            if (!e.alive || e.hitTimer > 0) continue
            const eBox = { x: e.x, y: e.y, w: e.w, h: e.h }
            if (rectsOverlap(atkBox, eBox)) {
              const dmg = attackDamage(f.attacking!)
              e.hp -= dmg; e.hitTimer = 15
              e.x += f.facing * 8
              f.sp = Math.min(100, f.sp + 5)
              if (e.hp <= 0) {
                e.alive = false; f.kills++; f.coins++
                f.xp += e.type === 'boss' ? 30 : 10
                if (e.type === 'boss') f.stars++
                // Level up
                if (f.xp >= f.level * 50) { f.level++; f.maxHp += 10; f.hp = Math.min(f.hp + 10, f.maxHp) }
              }
            }
          }
          // VS: hit other fighters
          if (isVs) {
            for (const other of st.fighters) {
              if (other === f || !other.alive || other.iFrames > 0) continue
              const oBox = { x: other.x, y: other.y, w: PW, h: PH }
              if (rectsOverlap(atkBox, oBox)) {
                const dmg = attackDamage(f.attacking!)
                other.hp -= dmg; other.iFrames = 30
                other.x += f.facing * 10
                f.sp = Math.min(100, f.sp + 5)
                f.comboCount++; f.comboTimer = COMBO_WINDOW
                if (f.comboCount > f.maxCombo) f.maxCombo = f.comboCount
                if (other.hp <= 0) {
                  other.alive = false; other.lives--; other.respawnTimer = 2000
                  f.kills++; f.coins++
                }
              }
            }
          }
        }
      }

      // ── Enemy AI ──────────────────────────
      for (const e of st.enemies) {
        if (!e.alive) continue
        if (e.hitTimer > 0) { e.hitTimer--; continue }
        // Find nearest alive fighter
        let nearest: Fighter | null = null; let nd = Infinity
        for (const f of st.fighters) {
          if (!f.alive) continue
          const dist = Math.abs(f.x - e.x) + Math.abs(f.y - e.y)
          if (dist < nd) { nd = dist; nearest = f }
        }
        if (!nearest) continue
        e.facing = nearest.x > e.x ? 1 : -1
        const dx = nearest.x - e.x, dy = nearest.y - e.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 30) {
          e.x += (dx / dist) * e.speed
          e.y += (dy / dist) * e.speed
        } else if (e.attackTimer <= 0) {
          // Hit the player
          if (nearest.iFrames <= 0) {
            nearest.hp -= e.damage; nearest.iFrames = 30
            nearest.x += e.facing * 6
            if (nearest.hp <= 0) {
              nearest.alive = false; nearest.lives--; nearest.respawnTimer = 2000
            }
          }
          e.attackTimer = 60
        }
        if (e.attackTimer > 0) e.attackTimer--
      }

      // ── Spawning ──────────────────────────
      if (!isVs && st.enemiesToSpawn > 0) {
        st.spawnTimer -= TICK
        if (st.spawnTimer <= 0) {
          const isBoss = st.wave % 5 === 0 && st.enemiesToSpawn === 1
          const type = isBoss ? 'boss' : Math.random() > 0.6 ? 'runner' : 'thug'
          st.enemies.push(spawnEnemy(st.wave, st.scrollX, type))
          st.enemiesToSpawn--
          st.spawnTimer = 800
        }
      }

      // ── Wave check ────────────────────────
      if (!isVs && st.enemiesToSpawn === 0 && st.enemies.every(e => !e.alive)) {
        if (!st.waveCleared) {
          st.waveCleared = true; st.waveClearTimer = 90
        }
        st.waveClearTimer--
        if (st.waveClearTimer <= 0) {
          if (st.wave >= st.maxWaves) {
            st.gameOver = true; st.victory = true
          } else {
            st.wave++; st.waveCleared = false
            st.enemiesToSpawn = enemyWaveCount(st.wave, st.difficulty)
            st.spawnTimer = 600
            // Scroll right in coop
            if (st.mode === 'story-coop') st.scrollX += 200
          }
        }
      }

      // ── Game over check ───────────────────
      const alive = st.fighters.filter(f => f.alive || f.lives > 0)
      if (!isVs && alive.length === 0) { st.gameOver = true; st.victory = false }
      if (isVs) {
        const standing = st.fighters.filter(f => f.alive || f.lives > 0)
        if (standing.length <= 1) { st.gameOver = true; st.victory = false }
      }

      // Update React state
      setScoreboard([...st.fighters])
      setWaveDisplay(st.wave)
      if (st.gameOver) { setGameOver(true); setVictory(st.victory) }
    }

    const timer = setInterval(tick, TICK)
    return () => clearInterval(timer)
    // Mount-only: game loop timer initialized once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Render ─────────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = W; canvas.height = H

      const ox = -st.scrollX // camera offset

      // Sky
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      // Building silhouettes (background)
      ctx.fillStyle = '#16213e'
      for (let bx = Math.floor(st.scrollX / 120) * 120; bx < st.scrollX + W + 120; bx += 120) {
        const bh = 60 + ((bx * 7) % 80)
        ctx.fillRect(bx + ox, GROUND_Y - bh + 20, 100, bh)
        // windows
        ctx.fillStyle = '#e2d96c33'
        for (let wy = GROUND_Y - bh + 30; wy < GROUND_Y; wy += 18) {
          for (let wx = bx + 10; wx < bx + 90; wx += 20) {
            ctx.fillRect(wx + ox, wy, 8, 10)
          }
        }
        ctx.fillStyle = '#16213e'
      }

      // Ground
      ctx.fillStyle = '#555'
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y)
      // Sidewalk lines
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 1
      ctx.setLineDash([10, 6])
      ctx.beginPath(); ctx.moveTo(0, 270); ctx.lineTo(W, 270); ctx.stroke()
      ctx.setLineDash([])

      // Enemies
      for (const e of st.enemies) {
        if (!e.alive) continue
        const ex = e.x + ox
        if (ex < -50 || ex > W + 50) continue
        ctx.fillStyle = e.type === 'boss' ? '#8b0000' : e.type === 'runner' ? '#ff6347' : '#c0392b'
        ctx.fillRect(ex, e.y, e.w, e.h)
        // head
        ctx.beginPath()
        ctx.arc(ex + e.w / 2, e.y - 6, e.w / 3, 0, Math.PI * 2)
        ctx.fill()
        // HP bar
        ctx.fillStyle = '#333'
        ctx.fillRect(ex - 2, e.y - 16, e.w + 4, 4)
        ctx.fillStyle = '#e74c3c'
        ctx.fillRect(ex - 2, e.y - 16, (e.w + 4) * (e.hp / e.maxHp), 4)
        // Hit flash
        if (e.hitTimer > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.5)'
          ctx.fillRect(ex, e.y, e.w, e.h)
        }
      }

      // Fighters
      for (const f of st.fighters) {
        if (!f.alive && f.respawnTimer > 0) continue
        const fx = f.x + ox
        const jumpOff = f.inAir ? f.jumpVy * -3 : 0
        const alpha = f.iFrames > 0 && f.iFrames % 4 < 2 ? 0.3 : 1
        ctx.globalAlpha = alpha
        // Body
        ctx.fillStyle = f.color
        ctx.fillRect(fx, f.y + jumpOff, PW, PH)
        // Head
        ctx.beginPath()
        ctx.arc(fx + PW / 2, f.y + jumpOff - HEAD_R + 2, HEAD_R, 0, Math.PI * 2)
        ctx.fill()
        // Eyes
        ctx.fillStyle = '#000'
        const eyeX = fx + (f.facing === 1 ? PW * 0.6 : PW * 0.2)
        ctx.fillRect(eyeX, f.y + jumpOff - HEAD_R + 1, 3, 3)
        // Attack visual
        if (f.attacking && f.attackTimer > 0) {
          const atk = attackRect(f, f.attacking)
          ctx.fillStyle = f.attacking === 'special' ? 'rgba(255,255,0,0.5)' : 'rgba(255,255,255,0.35)'
          ctx.fillRect(atk.x + ox, atk.y + jumpOff, atk.w, atk.h)
        }
        ctx.globalAlpha = 1
        // HP bar above head
        const barW = 30, barH = 4
        const barX = fx + PW / 2 - barW / 2, barY = f.y + jumpOff - HEAD_R * 2 - 6
        ctx.fillStyle = '#333'; ctx.fillRect(barX, barY, barW, barH)
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(barX, barY, barW * (f.hp / f.maxHp), barH)
        // SP bar
        ctx.fillStyle = '#333'; ctx.fillRect(barX, barY + 5, barW, 3)
        ctx.fillStyle = '#3498db'; ctx.fillRect(barX, barY + 5, barW * (f.sp / 100), 3)
        // Combo text
        if (f.comboCount >= 2 && f.comboTimer > 0) {
          ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 12px sans-serif'
          ctx.fillText(`${f.comboCount}x`, fx + PW / 2 - 8, barY - 4)
        }
      }

      // Wave banner
      if (st.waveCleared && st.waveClearTimer > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(0, H / 2 - 30, W, 60)
        ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`Wave ${st.wave} Cleared!`, W / 2, H / 2 + 8)
        ctx.textAlign = 'start'
      }

      // HUD: wave counter
      ctx.fillStyle = '#eee'; ctx.font = 'bold 14px sans-serif'
      ctx.fillText(`Wave ${st.wave}${st.mode !== 'survival' ? '/' + st.maxWaves : ''}`, 10, 20)

      // Border
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2
      ctx.strokeRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Restart ────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false); setVictory(false); setScoreboard([])
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
      {/* Scoreboard */}
      <div className={styles.scoreboard}>
        {scoreboard.map(f => (
          <div key={f.playerIndex} className={`${styles.scoreItem} ${!f.alive && f.lives <= 0 ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: f.color }} />
            <span>{f.name}</span>
            <span className={styles.scoreValue}>K:{f.kills}</span>
            <span style={{ color: '#f1c40f', fontSize: '0.8rem' }}>🪙{f.coins}</span>
            <span style={{ color: '#e91e63', fontSize: '0.8rem' }}>💎{f.gems}</span>
            <span style={{ color: '#ffd700', fontSize: '0.8rem' }}>⭐{f.stars}</span>
            <span style={{ color: '#aaa', fontSize: '0.75rem' }}>L{f.level} ♥{f.lives}</span>
          </div>
        ))}
      </div>

      <div className={styles.roundInfo}>
        {t('miniGames.wave', 'Wave')} {waveDisplay}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={W} height={H}  role="img" aria-label="River City Girls canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{victory ? t('miniGames.victory', 'Victory!') : t('miniGames.gameOver', 'Game Over!')}</h2>
          {/* Final stats */}
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {scoreboard.map(f => (
              <div key={f.playerIndex} style={{ textAlign: 'center', color: f.color }}>
                <div style={{ fontWeight: 700 }}>{f.name}</div>
                <div>Kills: {f.kills} | Combo: {f.maxCombo}x</div>
                <div>🪙{f.coins} 💎{f.gems} ⭐{f.stars}</div>
              </div>
            ))}
          </div>
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
