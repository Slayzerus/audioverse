/**
 * SporeGame — eat-and-grow (agar.io / Shark style) for 1-8 players.
 *
 * Large world (2000×2000), camera follows player and zooms out as player grows.
 * Eat smaller things, avoid bigger ones.
 *
 * Controls:
 *   Group 0: W/A/S/D move, Space boost, Q split, E eject mass
 *   Group 1: Arrows move, Enter boost, Shift eject mass
 *   Gamepad: D-pad/stick move, A boost, Y split, X eject mass
 *
 * Currencies: coins (food eaten), gems (creature kills), stars (size milestones).
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
const CANVAS_W = 800
const CANVAS_H = 600
const TICK_MS = 16
const FOOD_COUNT = 200
const AI_COUNT_BASE = 15
const SIZE_MILESTONES = [15, 25, 40, 60, 80, 100]
const WORLD_SIZES: Record<string, number> = { small: 1200, medium: 2000, large: 3000 }
const GROWTH_RATES: Record<string, number> = { slow: 0.5, normal: 1, fast: 2 }

// ─── Types ───────────────────────────────────────────────────
interface Blob {
  x: number; y: number; vx: number; vy: number
  radius: number; color: string
  id: number; isPlayer: boolean; playerIndex: number
  name: string; alive: boolean
  coins: number; gems: number; stars: number
  milestonesHit: Set<number>
  input: PlayerSlot['input'] | null
  splitTimer: number
  splitPair: number | null
  speed: number
}

interface FoodDot {
  x: number; y: number; radius: number; color: string; id: number
}

interface GameState {
  blobs: Blob[]
  food: FoodDot[]
  worldSize: number
  growthRate: number
  gameMode: string
  gameOver: boolean
  winner: string | null
  nextId: number
}

// ─── Helpers ─────────────────────────────────────────────────
const FOOD_COLORS = ['#2ecc71', '#e74c3c', '#3498db', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c']
const AI_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#d35400', '#16a085', '#7f8c8d']

function randInWorld(size: number) { return Math.random() * size }

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function spawnFood(n: number, worldSize: number, startId: number): FoodDot[] {
  const food: FoodDot[] = []
  for (let i = 0; i < n; i++) {
    food.push({
      x: randInWorld(worldSize), y: randInWorld(worldSize),
      radius: 2 + Math.random() * 2,
      color: FOOD_COLORS[Math.floor(Math.random() * FOOD_COLORS.length)],
      id: startId + i,
    })
  }
  return food
}

function spawnAI(count: number, worldSize: number, startId: number): Blob[] {
  const ais: Blob[] = []
  for (let i = 0; i < count; i++) {
    const r = 6 + Math.random() * 30
    ais.push({
      x: randInWorld(worldSize), y: randInWorld(worldSize), vx: 0, vy: 0,
      radius: r, color: AI_COLORS[i % AI_COLORS.length],
      id: startId + i, isPlayer: false, playerIndex: -1,
      name: `AI-${i + 1}`, alive: true,
      coins: 0, gems: 0, stars: 0,
      milestonesHit: new Set(), input: null,
      splitTimer: 0, splitPair: null,
      speed: Math.max(1, 4 - r * 0.03),
    })
  }
  return ais
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const worldSize = WORLD_SIZES[config.worldSize as string] ?? 2000
  const growthRate = GROWTH_RATES[config.growthRate as string] ?? 1
  const gameMode = String(config.gameMode || 'survival')
  let nextId = 1

  const playerBlobs: Blob[] = players.map((p, i) => {
    const b: Blob = {
      x: worldSize / 2 + (i - players.length / 2) * 60,
      y: worldSize / 2,
      vx: 0, vy: 0, radius: 8,
      color: p.color || PLAYER_COLORS[p.index] || '#fff',
      id: nextId++, isPlayer: true, playerIndex: p.index,
      name: p.name, alive: true,
      coins: 0, gems: 0, stars: 0,
      milestonesHit: new Set(), input: p.input,
      splitTimer: 0, splitPair: null,
      speed: 3.5,
    }
    return b
  })

  const ais = spawnAI(AI_COUNT_BASE, worldSize, nextId)
  nextId += AI_COUNT_BASE
  const food = spawnFood(FOOD_COUNT, worldSize, nextId)
  nextId += FOOD_COUNT

  return {
    blobs: [...playerBlobs, ...ais],
    food,
    worldSize,
    growthRate,
    gameMode,
    gameOver: false,
    winner: null,
    nextId,
  }
}

// ─── Keyboard maps ───────────────────────────────────────────
interface KeyAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'boost' | 'split' | 'eject' }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, action: 'up' }], ['s', { group: 0, action: 'down' }],
  ['a', { group: 0, action: 'left' }], ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'boost' }], ['q', { group: 0, action: 'split' }],
  ['e', { group: 0, action: 'eject' }],
  ['ArrowUp', { group: 1, action: 'up' }], ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }], ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'boost' }], ['Shift', { group: 1, action: 'eject' }],
])

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function SporeGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const [hud, setHud] = useState<{ name: string; radius: number; coins: number; gems: number; stars: number; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Continuous keyboard tracking ──
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key) }
    const up = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ── Game tick ──
  useEffect(() => {
    let timer = 0
    function tick() {
      if (pauseRef.current) { timer = window.setTimeout(tick, TICK_MS); return }
      const st = stateRef.current
      if (st.gameOver) return

      const keys = keysRef.current
      const currentPads = padsRef.current

      // Player movement from keys
      for (const blob of st.blobs) {
        if (!blob.alive || !blob.isPlayer || !blob.input) continue
        let dx = 0, dy = 0
        if (blob.input.type === 'keyboard') {
          const g = blob.input.group
          for (const [key, act] of KEY_MAP) {
            if (act.group !== g || !keys.has(key)) continue
            if (act.action === 'up') dy -= 1
            else if (act.action === 'down') dy += 1
            else if (act.action === 'left') dx -= 1
            else if (act.action === 'right') dx += 1
            else if (act.action === 'boost' && blob.radius > 10) {
              blob.radius -= 0.3 * st.growthRate
              blob.speed = Math.min(blob.speed + 0.5, 6)
            } else if (act.action === 'split' && blob.radius > 16 && blob.splitTimer <= 0) {
              // Split
              const newB: Blob = { ...blob, id: st.nextId++, radius: blob.radius / 2, splitTimer: 300, splitPair: blob.id,
                x: blob.x + (dx || 1) * 20, y: blob.y + (dy || 0) * 20,
                milestonesHit: new Set(blob.milestonesHit) }
              blob.radius /= 2
              blob.splitTimer = 300
              blob.splitPair = newB.id
              st.blobs.push(newB)
            } else if (act.action === 'eject' && blob.radius > 10) {
              blob.radius -= 2 * st.growthRate
              const ejected: FoodDot = { x: blob.x + dx * 30, y: blob.y + dy * 30, radius: 4, color: blob.color, id: st.nextId++ }
              st.food.push(ejected)
            }
          }
        } else if (blob.input.type === 'gamepad') {
          const gp = currentPads.find(p => p.index === (blob.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) dy -= 1
            if (gp.down) dy += 1
            if (gp.left) dx -= 1
            if (gp.right) dx += 1
            if (gp.a && blob.radius > 10) { blob.radius -= 0.3 * st.growthRate; blob.speed = Math.min(blob.speed + 0.5, 6) }
            if (gp.y && blob.radius > 16 && blob.splitTimer <= 0) {
              const newB: Blob = { ...blob, id: st.nextId++, radius: blob.radius / 2, splitTimer: 300, splitPair: blob.id,
                x: blob.x + 20, y: blob.y, milestonesHit: new Set(blob.milestonesHit) }
              blob.radius /= 2; blob.splitTimer = 300; blob.splitPair = newB.id
              st.blobs.push(newB)
            }
            if (gp.x && blob.radius > 10) {
              blob.radius -= 2 * st.growthRate
              st.food.push({ x: blob.x + dx * 30, y: blob.y + dy * 30, radius: 4, color: blob.color, id: st.nextId++ })
            }
          }
        }
        const len = Math.hypot(dx, dy) || 1
        blob.vx = (dx / len) * blob.speed
        blob.vy = (dy / len) * blob.speed
        if (dx === 0 && dy === 0) { blob.vx *= 0.9; blob.vy *= 0.9 }
      }

      // AI movement
      for (const ai of st.blobs) {
        if (!ai.alive || ai.isPlayer) continue
        // Simple: move toward nearest smaller food/blob, flee from bigger
        let targetX = ai.x, targetY = ai.y
        let minDist = Infinity
        // Look for food
        for (const f of st.food) {
          const d = dist(ai, f)
          if (d < minDist) { minDist = d; targetX = f.x; targetY = f.y }
        }
        // flee from bigger blobs nearby
        for (const other of st.blobs) {
          if (other === ai || !other.alive) continue
          if (other.radius > ai.radius * 1.1 && dist(ai, other) < 200) {
            targetX = ai.x - (other.x - ai.x)
            targetY = ai.y - (other.y - ai.y)
            break
          }
        }
        const dx = targetX - ai.x, dy = targetY - ai.y
        const len = Math.hypot(dx, dy) || 1
        ai.vx = (dx / len) * ai.speed
        ai.vy = (dy / len) * ai.speed
      }

      // Move all blobs
      for (const blob of st.blobs) {
        if (!blob.alive) continue
        blob.x += blob.vx
        blob.y += blob.vy
        blob.x = Math.max(0, Math.min(st.worldSize, blob.x))
        blob.y = Math.max(0, Math.min(st.worldSize, blob.y))
        blob.speed = Math.max(1, 4 - blob.radius * 0.02)
        if (blob.splitTimer > 0) blob.splitTimer--
        // Merge split halves
        if (blob.splitTimer <= 0 && blob.splitPair != null) {
          const pair = st.blobs.find(b => b.id === blob.splitPair && b.alive)
          if (pair && dist(blob, pair) < blob.radius + pair.radius) {
            blob.radius = Math.sqrt(blob.radius ** 2 + pair.radius ** 2)
            pair.alive = false
            blob.splitPair = null
          }
        }
      }

      // Eat food
      for (const blob of st.blobs) {
        if (!blob.alive) continue
        for (let i = st.food.length - 1; i >= 0; i--) {
          const f = st.food[i]
          if (dist(blob, f) < blob.radius) {
            blob.radius += f.radius * 0.3 * st.growthRate
            blob.coins++
            st.food.splice(i, 1)
          }
        }
      }

      // Replenish food
      while (st.food.length < FOOD_COUNT * 0.6) {
        st.food.push(...spawnFood(10, st.worldSize, st.nextId))
        st.nextId += 10
      }

      // Blob vs blob
      for (let i = 0; i < st.blobs.length; i++) {
        const a = st.blobs[i]
        if (!a.alive) continue
        for (let j = i + 1; j < st.blobs.length; j++) {
          const b = st.blobs[j]
          if (!b.alive) continue
          if (a.splitPair === b.id || b.splitPair === a.id) continue
          const d = dist(a, b)
          if (d < Math.max(a.radius, b.radius)) {
            if (a.radius > b.radius * 1.1) {
              a.radius += b.radius * 0.5 * st.growthRate
              b.alive = false
              a.gems++
            } else if (b.radius > a.radius * 1.1) {
              b.radius += a.radius * 0.5 * st.growthRate
              a.alive = false
              b.gems++
            }
          }
        }
      }

      // Milestones
      for (const blob of st.blobs) {
        if (!blob.alive) continue
        for (const m of SIZE_MILESTONES) {
          if (blob.radius >= m && !blob.milestonesHit.has(m)) {
            blob.milestonesHit.add(m)
            blob.stars++
          }
        }
      }

      // Respawn dead AI
      const aliveAI = st.blobs.filter(b => !b.isPlayer && b.alive).length
      if (aliveAI < AI_COUNT_BASE * 0.5) {
        const spawn = spawnAI(3, st.worldSize, st.nextId)
        st.nextId += 3
        st.blobs.push(...spawn)
      }

      // Check game over
      const alivePlayers = st.blobs.filter(b => b.isPlayer && b.alive)
      if (alivePlayers.length === 0) {
        st.gameOver = true
        const best = st.blobs.filter(b => b.isPlayer).reduce((a, b) =>
          (a.coins + a.gems * 10 + a.stars * 50) > (b.coins + b.gems * 10 + b.stars * 50) ? a : b)
        st.winner = best.name
        setGameOver(true)
        setWinner(best.name)
      } else if (st.gameMode === 'vs-biggest' && alivePlayers.some(b => b.radius >= 120)) {
        st.gameOver = true
        const biggest = alivePlayers.reduce((a, b) => a.radius > b.radius ? a : b)
        st.winner = biggest.name
        setGameOver(true)
        setWinner(biggest.name)
      }

      // HUD update
      setHud(st.blobs.filter(b => b.isPlayer).map(b => ({
        name: b.name, radius: Math.round(b.radius), coins: b.coins, gems: b.gems, stars: b.stars, color: b.color,
      })))

      timer = window.setTimeout(tick, TICK_MS)
    }
    timer = window.setTimeout(tick, TICK_MS)
    return () => clearTimeout(timer)
  }, [])

  // ── Render ──
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = CANVAS_W; canvas.height = CANVAS_H

      // Camera: follow first alive player, zoom out with size
      const cam = st.blobs.find(b => b.isPlayer && b.alive) || st.blobs.find(b => b.isPlayer) || st.blobs[0]
      if (!cam) { raf = requestAnimationFrame(draw); return }
      const zoom = Math.max(0.3, Math.min(1, 20 / (cam.radius + 10)))
      const cx = cam.x, cy = cam.y

      ctx.fillStyle = '#0a0a1a'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      ctx.save()
      ctx.translate(CANVAS_W / 2, CANVAS_H / 2)
      ctx.scale(zoom, zoom)
      ctx.translate(-cx, -cy)

      // Grid
      ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1
      const gridStep = 80
      for (let x = 0; x <= st.worldSize; x += gridStep) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, st.worldSize); ctx.stroke()
      }
      for (let y = 0; y <= st.worldSize; y += gridStep) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(st.worldSize, y); ctx.stroke()
      }

      // World border
      ctx.strokeStyle = '#e74c3c'; ctx.lineWidth = 3
      ctx.strokeRect(0, 0, st.worldSize, st.worldSize)

      // Food
      for (const f of st.food) {
        const fdx = f.x - cx, fdy = f.y - cy
        if (Math.abs(fdx) > CANVAS_W / zoom || Math.abs(fdy) > CANVAS_H / zoom) continue
        ctx.fillStyle = f.color
        ctx.beginPath(); ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2); ctx.fill()
      }

      // Blobs
      const sorted = [...st.blobs].filter(b => b.alive).sort((a, b) => a.radius - b.radius)
      for (const blob of sorted) {
        // Danger coloring for non-camera blobs
        let drawColor = blob.color
        if (blob !== cam && cam) {
          if (blob.radius < cam.radius * 0.8) drawColor = '#2ecc71' // safe
          else if (blob.radius < cam.radius) drawColor = '#f1c40f' // slightly smaller
          else drawColor = '#e74c3c' // danger
          if (blob.isPlayer) drawColor = blob.color // other players keep color
        }

        ctx.fillStyle = drawColor
        ctx.globalAlpha = blob.alive ? 1 : 0.3
        ctx.beginPath(); ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2); ctx.fill()
        // Outline
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke()
        // Name
        ctx.fillStyle = '#fff'; ctx.font = `${Math.max(10, blob.radius * 0.5)}px sans-serif`; ctx.textAlign = 'center'
        ctx.fillText(blob.name, blob.x, blob.y + 4)
        ctx.globalAlpha = 1
      }

      ctx.restore()

      // Minimap
      const mmSize = 120, mmX = CANVAS_W - mmSize - 10, mmY = 10
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(mmX, mmY, mmSize, mmSize)
      ctx.strokeStyle = '#555'; ctx.lineWidth = 1
      ctx.strokeRect(mmX, mmY, mmSize, mmSize)
      for (const blob of st.blobs) {
        if (!blob.alive) continue
        const bx = mmX + (blob.x / st.worldSize) * mmSize
        const by = mmY + (blob.y / st.worldSize) * mmSize
        ctx.fillStyle = blob.isPlayer ? blob.color : '#555'
        ctx.beginPath(); ctx.arc(bx, by, blob.isPlayer ? 3 : 1, 0, Math.PI * 2); ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

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
      <div className={styles.scoreboard}>
        {hud.map((p, i) => (
          <div key={i} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name} (r:{p.radius})</span>
            <span className={styles.scoreValue}>🪙{p.coins} 💎{p.gems} ⭐{p.stars}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Spore canvas"/>
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
