/**
 * ShipsGame — naval combat for 1-8 couch players.
 *
 * Controls:
 *   Keyboard group 0: W/A/S/D move, Q/E rotate, Space fire
 *   Keyboard group 1: Arrows move, ,/. rotate, Enter fire
 *   Keyboard group 2: I/J/K/L move, U/O rotate, H fire
 *   Keyboard group 3: Numpad 8/4/5/6 move, 7/9 rotate, 0 fire
 *   Gamepad: D-pad/stick move, LB/RB rotate, A fire
 *
 * Rules:
 *  - Ships sail on a blue ocean, firing broadsides (left+right of ship).
 *  - Collect treasure chests for gold. Sink enemy ships for gems.
 *  - Wind periodically drifts all ships.
 *  - Islands block movement. Ship upgrades auto-apply at gold thresholds.
 *  - VS: players fight each other + AI. Coop: team vs AI pirates.
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
const SHIP_W = 40
const SHIP_H = 15
const PROJ_SPEED = 6
const PROJ_LIFE = 80
const MOVE_SPEED = 2.5
const ROT_SPEED = 0.04
const FIRE_COOLDOWN = 30
const TREASURE_SIZE = 12
const ISLAND_COUNT = 4
const AI_SHIPS = 4
const WIND_CHANGE = 600

// ─── Types ───────────────────────────────────────────────────
interface Ship {
  x: number; y: number; angle: number; hp: number; maxHp: number
  vx: number; vy: number; speed: number
  color: string; name: string; index: number
  input: PlayerSlot['input'] | 'ai'
  fireCooldown: number; alive: boolean
  coins: number; gems: number; stars: number
  upgradeLevel: number; sinkAnim: number
}

interface Projectile {
  x: number; y: number; vx: number; vy: number
  life: number; owner: number
}

interface Treasure { x: number; y: number; collected: boolean }
interface Island { x: number; y: number; w: number; h: number }

interface GameState {
  ships: Ship[]
  projectiles: Projectile[]
  treasures: Treasure[]
  islands: Island[]
  wind: { dx: number; dy: number }
  windTimer: number
  tick: number
  gameOver: boolean
  winner: string | null
  mapsCleared: number
}

// KB maps
const KB_MOVE: Record<string, { group: number; dx: number; dy: number }> = {
  w: { group: 0, dx: 0, dy: -1 }, s: { group: 0, dx: 0, dy: 1 },
  a: { group: 0, dx: -1, dy: 0 }, d: { group: 0, dx: 1, dy: 0 },
  ArrowUp: { group: 1, dx: 0, dy: -1 }, ArrowDown: { group: 1, dx: 0, dy: 1 },
  ArrowLeft: { group: 1, dx: -1, dy: 0 }, ArrowRight: { group: 1, dx: 1, dy: 0 },
  i: { group: 2, dx: 0, dy: -1 }, k: { group: 2, dx: 0, dy: 1 },
  j: { group: 2, dx: -1, dy: 0 }, l: { group: 2, dx: 1, dy: 0 },
  '8': { group: 3, dx: 0, dy: -1 }, '5': { group: 3, dx: 0, dy: 1 },
  '4': { group: 3, dx: -1, dy: 0 }, '6': { group: 3, dx: 1, dy: 0 },
}
const KB_ROT: Record<string, { group: number; dir: number }> = {
  q: { group: 0, dir: -1 }, e: { group: 0, dir: 1 },
  ',': { group: 1, dir: -1 }, '.': { group: 1, dir: 1 },
  u: { group: 2, dir: -1 }, o: { group: 2, dir: 1 },
  '7': { group: 3, dir: -1 }, '9': { group: 3, dir: 1 },
}
const KB_FIRE: Record<string, number> = { ' ': 0, Enter: 1, h: 2, '0': 3 }

// ─── Helpers ─────────────────────────────────────────────────
function rng(min: number, max: number) { return min + Math.random() * (max - min) }

function makeIslands(): Island[] {
  const arr: Island[] = []
  for (let i = 0; i < ISLAND_COUNT; i++) {
    arr.push({ x: rng(80, W - 160), y: rng(80, H - 160), w: rng(50, 120), h: rng(40, 90) })
  }
  return arr
}

function makeTreasures(count: number, islands: Island[]): Treasure[] {
  const arr: Treasure[] = []
  for (let i = 0; i < count; i++) {
    let x: number, y: number, ok: boolean
    let tries = 0
    do {
      x = rng(20, W - 20); y = rng(20, H - 20); ok = true
      for (const isl of islands) {
        if (x > isl.x - 10 && x < isl.x + isl.w + 10 && y > isl.y - 10 && y < isl.y + isl.h + 10) ok = false
      }
      tries++
    } while (!ok && tries < 100)
    arr.push({ x, y, collected: false })
  }
  return arr
}

function makeAI(count: number): Ship[] {
  return Array.from({ length: count }, (_, i) => ({
    x: rng(100, W - 100), y: rng(100, H - 100), angle: Math.random() * Math.PI * 2,
    hp: 3, maxHp: 3, vx: 0, vy: 0, speed: MOVE_SPEED * 0.7,
    color: '#c0392b', name: `Pirate ${i + 1}`, index: -(i + 1),
    input: 'ai' as const, fireCooldown: 0, alive: true,
    coins: 0, gems: 0, stars: 0, upgradeLevel: 0, sinkAnim: 0,
  }))
}

function initState(players: PlayerSlot[], enemyCount: number | string): GameState {
  const islands = makeIslands()
  const ships: Ship[] = players.map((p, i) => ({
    x: 60 + i * 80, y: H - 60, angle: -Math.PI / 2,
    hp: 5, maxHp: 5, vx: 0, vy: 0, speed: MOVE_SPEED,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, index: p.index, input: p.input,
    fireCooldown: 0, alive: true,
    coins: 0, gems: 0, stars: 0, upgradeLevel: 0, sinkAnim: 0,
  }))
  const aiCount = enemyCount === 'few' ? 2 : enemyCount === 'many' ? 6 : AI_SHIPS
  return {
    ships: [...ships, ...makeAI(aiCount)],
    projectiles: [], treasures: makeTreasures(8, islands), islands,
    wind: { dx: 0, dy: 0 }, windTimer: 0, tick: 0,
    gameOver: false, winner: null, mapsCleared: 0,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function ShipsGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const enemyCount = config?.enemyCount ?? 'normal'
  const stateRef = useRef<GameState>(initState(players, enemyCount))
  const keysRef = useRef<Set<string>>(new Set())
  const [scores, setScores] = useState<{ index: number; name: string; score: number; alive: boolean; color: string; coins: number; gems: number; stars: number }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads); padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  useEffect(() => {
    const down = (e: KeyboardEvent) => keysRef.current.add(e.key)
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Game loop
  useEffect(() => {
    let raf = 0
    function loop() {
      raf = requestAnimationFrame(loop)
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      st.tick++

      const keys = keysRef.current
      const currentPads = padsRef.current

      // Wind
      st.windTimer++
      if (st.windTimer > WIND_CHANGE) {
        st.wind = { dx: (Math.random() - 0.5) * 0.6, dy: (Math.random() - 0.5) * 0.6 }
        st.windTimer = 0
      }

      for (const ship of st.ships) {
        if (!ship.alive) { ship.sinkAnim = Math.min(ship.sinkAnim + 0.02, 1); continue }
        ship.fireCooldown = Math.max(0, ship.fireCooldown - 1)

        let mdx = 0, mdy = 0, rotDir = 0, fire = false

        if (ship.input === 'ai') {
          // Simple AI: move toward nearest treasure or player, fire periodically
          const target = st.treasures.find(tr => !tr.collected)
          if (target) {
            const dx = target.x - ship.x, dy = target.y - ship.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 5) { mdx = dx / dist; mdy = dy / dist }
          }
          if (st.tick % 60 < 5) fire = true
          const desiredAngle = Math.atan2(mdy, mdx)
          let diff = desiredAngle - ship.angle
          while (diff > Math.PI) diff -= Math.PI * 2
          while (diff < -Math.PI) diff += Math.PI * 2
          rotDir = diff > 0 ? 1 : -1
        } else if ((ship.input as PlayerSlot['input']).type === 'keyboard') {
          const grp = (ship.input as { type: 'keyboard'; group: number }).group
          for (const [key, val] of Object.entries(KB_MOVE)) {
            if (val.group === grp && keys.has(key)) { mdx += val.dx; mdy += val.dy }
          }
          for (const [key, val] of Object.entries(KB_ROT)) {
            if (val.group === grp && keys.has(key)) rotDir = val.dir
          }
          for (const [key, grpI] of Object.entries(KB_FIRE)) {
            if (grpI === grp && keys.has(key)) fire = true
          }
        } else if ((ship.input as PlayerSlot['input']).type === 'gamepad') {
          const gp = currentPads.find(g => g.index === (ship.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) mdy = -1; if (gp.down) mdy = 1
            if (gp.left) mdx = -1; if (gp.right) mdx = 1
            if (gp.lb) rotDir = -1; if (gp.rb) rotDir = 1
            if (gp.a) fire = true
          }
        }

        // Rotate
        ship.angle += rotDir * ROT_SPEED

        // Move
        const len = Math.sqrt(mdx * mdx + mdy * mdy)
        if (len > 0) {
          ship.vx = (mdx / len) * ship.speed
          ship.vy = (mdy / len) * ship.speed
        } else {
          ship.vx *= 0.95; ship.vy *= 0.95
        }
        // Wind
        ship.vx += st.wind.dx * 0.05
        ship.vy += st.wind.dy * 0.05

        const nx = ship.x + ship.vx
        const ny = ship.y + ship.vy

        // Island collision
        let blocked = false
        for (const isl of st.islands) {
          if (nx > isl.x - SHIP_W / 2 && nx < isl.x + isl.w + SHIP_W / 2 &&
              ny > isl.y - SHIP_H / 2 && ny < isl.y + isl.h + SHIP_H / 2) {
            blocked = true; break
          }
        }
        if (!blocked) {
          ship.x = Math.max(SHIP_W / 2, Math.min(W - SHIP_W / 2, nx))
          ship.y = Math.max(SHIP_H / 2, Math.min(H - SHIP_H / 2, ny))
        }

        // Fire broadside
        if (fire && ship.fireCooldown <= 0) {
          const perp = ship.angle + Math.PI / 2
          const projCount = 1 + ship.upgradeLevel
          for (let side = -1; side <= 1; side += 2) {
            for (let p = 0; p < projCount; p++) {
              const spread = (p - (projCount - 1) / 2) * 0.15
              st.projectiles.push({
                x: ship.x, y: ship.y,
                vx: Math.cos(perp * side + spread) * PROJ_SPEED * side,
                vy: Math.sin(perp * side + spread) * PROJ_SPEED * side,
                life: PROJ_LIFE, owner: ship.index,
              })
            }
          }
          ship.fireCooldown = FIRE_COOLDOWN
        }

        // Treasure pickup
        for (const tr of st.treasures) {
          if (tr.collected) continue
          const dx = ship.x - tr.x, dy = ship.y - tr.y
          if (dx * dx + dy * dy < 400) {
            tr.collected = true
            ship.coins++
            // Auto-upgrade
            if (ship.coins % 5 === 0 && ship.upgradeLevel < 3) ship.upgradeLevel++
          }
        }
      }

      // Projectile update
      for (const proj of st.projectiles) {
        proj.x += proj.vx; proj.y += proj.vy; proj.life--
        // Hit detection
        for (const ship of st.ships) {
          if (!ship.alive || ship.index === proj.owner) continue
          const dx = proj.x - ship.x, dy = proj.y - ship.y
          if (Math.abs(dx) < SHIP_W / 2 && Math.abs(dy) < SHIP_H / 2) {
            ship.hp--
            proj.life = 0
            if (ship.hp <= 0) {
              ship.alive = false
              const shooter = st.ships.find(s => s.index === proj.owner)
              if (shooter) shooter.gems++
            }
          }
        }
      }
      st.projectiles = st.projectiles.filter(p => p.life > 0 && p.x > -20 && p.x < W + 20 && p.y > -20 && p.y < H + 20)

      // Respawn treasures
      if (st.treasures.every(tr => tr.collected)) {
        st.treasures = makeTreasures(8, st.islands)
        st.mapsCleared++
        for (const s of st.ships) { if (s.alive && s.index >= 0) s.stars++ }
      }

      // Game over: all human players dead or all AI dead
      const humanAlive = st.ships.filter(s => s.index >= 0 && s.alive)
      const aiAlive = st.ships.filter(s => s.index < 0 && s.alive)
      if (humanAlive.length === 0) {
        st.gameOver = true; st.winner = null
      } else if (aiAlive.length === 0 && st.ships.some(s => s.index < 0)) {
        st.gameOver = true
        const best = humanAlive.reduce((a, b) => (a.coins + a.gems) > (b.coins + b.gems) ? a : b)
        st.winner = best.name
      } else if (players.length > 1 && humanAlive.length === 1 && aiAlive.length === 0) {
        st.gameOver = true; st.winner = humanAlive[0].name
      }

      setScores(st.ships.filter(s => s.index >= 0).map(s => ({
        index: s.index, name: s.name, score: s.coins + s.gems, alive: s.alive,
        color: s.color, coins: s.coins, gems: s.gems, stars: s.stars,
      })))

      if (st.gameOver) { setGameOver(true); setWinner(st.winner) }

      // ─── Draw ────────────────────────
      const canvas = canvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d'); if (!ctx) return
      canvas.width = W; canvas.height = H

      // Water
      ctx.fillStyle = '#0a3d62'
      ctx.fillRect(0, 0, W, H)
      // Wave pattern
      ctx.strokeStyle = 'rgba(100,180,255,0.15)'
      ctx.lineWidth = 2
      for (let wy = 0; wy < H; wy += 30) {
        ctx.beginPath()
        for (let wx = 0; wx < W; wx += 4) {
          ctx.lineTo(wx, wy + Math.sin((wx + st.tick * 2) * 0.02) * 5)
        }
        ctx.stroke()
      }

      // Islands
      for (const isl of st.islands) {
        ctx.fillStyle = '#8B6914'
        ctx.fillRect(isl.x, isl.y, isl.w, isl.h)
        ctx.fillStyle = '#2d6b22'
        ctx.fillRect(isl.x + 5, isl.y + 5, isl.w - 10, isl.h - 10)
      }

      // Treasures
      for (const tr of st.treasures) {
        if (tr.collected) continue
        ctx.fillStyle = '#f1c40f'
        ctx.fillRect(tr.x - TREASURE_SIZE / 2, tr.y - TREASURE_SIZE / 2, TREASURE_SIZE, TREASURE_SIZE)
      }

      // Projectiles
      ctx.fillStyle = '#fff'
      for (const proj of st.projectiles) {
        ctx.beginPath()
        ctx.arc(proj.x, proj.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Ships
      for (const ship of st.ships) {
        ctx.save()
        ctx.translate(ship.x, ship.y)
        ctx.rotate(ship.angle)
        ctx.globalAlpha = ship.alive ? 1 : Math.max(0, 1 - ship.sinkAnim)
        const scale = ship.alive ? 1 : Math.max(0.2, 1 - ship.sinkAnim * 0.8)
        ctx.scale(scale, scale)
        ctx.fillStyle = ship.color
        ctx.fillRect(-SHIP_W / 2, -SHIP_H / 2, SHIP_W, SHIP_H)
        // Bow
        ctx.fillStyle = '#fff'
        ctx.fillRect(SHIP_W / 2 - 4, -2, 6, 4)
        ctx.restore()
        // HP bar
        if (ship.alive && ship.hp < ship.maxHp) {
          const bw = 30
          ctx.fillStyle = '#600'
          ctx.fillRect(ship.x - bw / 2, ship.y - SHIP_H - 6, bw, 4)
          ctx.fillStyle = '#2ecc71'
          ctx.fillRect(ship.x - bw / 2, ship.y - SHIP_H - 6, bw * (ship.hp / ship.maxHp), 4)
        }
      }

      // Wind indicator
      ctx.fillStyle = '#aaa'
      ctx.font = '12px monospace'
      ctx.fillText(`Wind: ${st.wind.dx > 0 ? '→' : '←'} ${st.wind.dy > 0 ? '↓' : '↑'}`, W - 110, 20)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [players, enemyCount])

  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, enemyCount)
    setGameOver(false); setWinner(null); setScores([])
  }, [players, enemyCount])

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
            <span className={styles.scoreValue}>{s.score}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Ships canvas"/>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && scores.length > 0 && (
            <p className={styles.winnerText}>{t('miniGames.finalScore', 'Score')}: {scores[0]?.score ?? 0}</p>
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
