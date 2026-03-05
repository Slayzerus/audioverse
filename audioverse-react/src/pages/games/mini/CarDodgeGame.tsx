/**
 * CarDodgeGame — old handheld LCD-style car dodging game for 1-8 players.
 *
 * Controls (per keyboard group):
 *   Group 0: A/D move lanes, W boost
 *   Group 1: ←/→ move lanes, ↑ boost
 *   Group 2: J/L move lanes, I boost
 *   Group 3: Numpad 4/6 move lanes, 8 boost
 * Gamepads: D-pad left/right or left stick, A to boost.
 *
 * Rules:
 *  - Vertical scrolling road with configurable lanes (3-5).
 *  - Player car (colored rect 30×50) at bottom, moves between lanes.
 *  - Obstacles (gray cars, red barriers, dark oil patches) scroll downward.
 *  - Collectibles: coins (yellow circles), fuel (green rects), gems (cyan diamonds).
 *  - Speed increases over time; fuel decreases → game over on fuel=0 or collision.
 *  - VS: side-by-side, compete for distance. Coop: shared road, survive together.
 *  - Currencies: coins (pickups), gems (distance milestones), stars (records beaten).
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
const CAR_W = 30
const CAR_H = 50
const OBS_W = 28
const OBS_H = 45
const COLLECT_R = 10
const BASE_SPEED = 2.5
const MAX_SPEED = 9
const SPEED_ACCEL = 0.003
const FUEL_DRAIN = 0.04
const FUEL_PICKUP = 20
const BOOST_MULT = 1.8
const BOOST_FUEL_COST = 0.15
const GEM_DISTANCE = 500
const SPAWN_INTERVAL_BASE = 60 // frames
const SPAWN_INTERVAL_MIN = 18

// ─── Keyboard mappings ──────────────────────────────────────
type Action = 'left' | 'right' | 'boost'
const KEY_MAP = new Map<string, { group: number; action: Action }>()
;([ ['a',0,'left'],['d',0,'right'],['w',0,'boost'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['ArrowLeft',1,'left'],['ArrowRight',1,'right'],['ArrowUp',1,'boost'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['j',2,'left'],['l',2,'right'],['i',2,'boost'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
;([ ['4',3,'left'],['6',3,'right'],['8',3,'boost'] ] as const)
  .forEach(([k,g,a]) => KEY_MAP.set(k, { group: g, action: a }))
// Space / Enter as boost for group 0/1
KEY_MAP.set(' ', { group: 0, action: 'boost' })
KEY_MAP.set('Enter', { group: 1, action: 'boost' })

// ─── Types ───────────────────────────────────────────────────
interface Obstacle { x: number; y: number; kind: 'car' | 'barrier' | 'oil' }
interface Collectible { x: number; y: number; kind: 'coin' | 'fuel' | 'gem' }

interface CarPlayer {
  lane: number
  x: number
  y: number
  fuel: number
  distance: number
  coins: number
  gems: number
  stars: number
  alive: boolean
  boosting: boolean
  color: string
  name: string
  playerIndex: number
  input: PlayerSlot['input']
  bestDistance: number
  lastGemDist: number
}

interface GameState {
  players: CarPlayer[]
  obstacles: Obstacle[]
  collectibles: Collectible[]
  laneCount: number
  speed: number
  frame: number
  gameOver: boolean
  winner: number | null
  roadOffset: number
  laneWidth: number
  roadLeft: number
}

// ─── Helpers ─────────────────────────────────────────────────
function laneX(lane: number, roadLeft: number, laneW: number): number {
  return roadLeft + lane * laneW + laneW / 2
}

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function initState(players: PlayerSlot[], laneCount: number, startSpeed: number): GameState {
  const laneWidth = Math.floor(W / (players.length > 1 ? 1 : 1) / laneCount)
  const roadWidth = laneWidth * laneCount
  const roadLeft = (W - roadWidth) / 2
  const carPlayers: CarPlayer[] = players.map((p, _i) => ({
    lane: Math.floor(laneCount / 2),
    x: laneX(Math.floor(laneCount / 2), roadLeft, laneWidth) - CAR_W / 2,
    y: H - CAR_H - 30,
    fuel: 100,
    distance: 0,
    coins: 0,
    gems: 0,
    stars: 0,
    alive: true,
    boosting: false,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name,
    playerIndex: p.index,
    input: p.input,
    bestDistance: 0,
    lastGemDist: 0,
  }))
  const speed = startSpeed === 1 ? BASE_SPEED * 0.6 : startSpeed === 3 ? BASE_SPEED * 1.3 : BASE_SPEED
  return {
    players: carPlayers,
    obstacles: [],
    collectibles: [],
    laneCount,
    speed,
    frame: 0,
    gameOver: false,
    winner: null,
    roadOffset: 0,
    laneWidth,
    roadLeft,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function CarDodgeGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const laneCount = config?.laneCount ?? 3
  const startSpeed = config?.startSpeed === 'slow' ? 1 : config?.startSpeed === 'fast' ? 3 : 2
  const stateRef = useRef<GameState>(initState(players, laneCount, startSpeed))
  const keysDown = useRef(new Set<string>())
  const [scores, setScores] = useState<{ idx: number; name: string; distance: number; coins: number; gems: number; stars: number; alive: boolean; color: string }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ─── Keyboard input ─────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysDown.current.add(e.key) }
    const up = (e: KeyboardEvent) => { keysDown.current.delete(e.key) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Lane-change on keydown (edge-triggered)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const m = KEY_MAP.get(e.key)
      if (!m) return
      const st = stateRef.current
      for (const cp of st.players) {
        if (!cp.alive) continue
        if (cp.input.type === 'keyboard' && cp.input.group === m.group) {
          if (m.action === 'left' && cp.lane > 0) {
            cp.lane--
            cp.x = laneX(cp.lane, st.roadLeft, st.laneWidth) - CAR_W / 2
          } else if (m.action === 'right' && cp.lane < st.laneCount - 1) {
            cp.lane++
            cp.x = laneX(cp.lane, st.roadLeft, st.laneWidth) - CAR_W / 2
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
    const prevPadLane: Record<number, 'left' | 'right' | null> = {}

    function tick() {
      if (pauseRef.current) { raf = requestAnimationFrame(tick); return }
      const st = stateRef.current
      if (st.gameOver) return
      st.frame++

      // Speed ramp
      if (st.speed < MAX_SPEED) st.speed += SPEED_ACCEL

      const spawnInt = Math.max(SPAWN_INTERVAL_MIN, Math.floor(SPAWN_INTERVAL_BASE - st.speed * 4))

      // Gamepad lane changes (edge-triggered)
      const currentPads = padsRef.current
      for (const cp of st.players) {
        if (!cp.alive || cp.input.type !== 'gamepad') continue
        const gp = currentPads.find(p => p.index === (cp.input as { type: 'gamepad'; padIndex: number }).padIndex)
        if (!gp) continue
        const dir = gp.left ? 'left' : gp.right ? 'right' : null
        const prev = prevPadLane[cp.playerIndex] ?? null
        if (dir && dir !== prev) {
          if (dir === 'left' && cp.lane > 0) { cp.lane--; cp.x = laneX(cp.lane, st.roadLeft, st.laneWidth) - CAR_W / 2 }
          if (dir === 'right' && cp.lane < st.laneCount - 1) { cp.lane++; cp.x = laneX(cp.lane, st.roadLeft, st.laneWidth) - CAR_W / 2 }
        }
        prevPadLane[cp.playerIndex] = dir
        cp.boosting = gp.a
      }

      // Keyboard boost (held)
      for (const cp of st.players) {
        if (!cp.alive || cp.input.type !== 'keyboard') continue
        const grp = cp.input.group
        cp.boosting = false
        for (const [key, m] of KEY_MAP) {
          if (m.group === grp && m.action === 'boost' && keysDown.current.has(key)) {
            cp.boosting = true
            break
          }
        }
      }

      // Update players
      for (const cp of st.players) {
        if (!cp.alive) continue
        const spd = cp.boosting ? st.speed * BOOST_MULT : st.speed
        cp.distance += spd
        cp.fuel -= FUEL_DRAIN + (cp.boosting ? BOOST_FUEL_COST : 0)
        if (cp.fuel <= 0) { cp.fuel = 0; cp.alive = false; continue }
        // Gem milestones
        if (cp.distance - cp.lastGemDist >= GEM_DISTANCE) {
          cp.gems++
          cp.lastGemDist += GEM_DISTANCE
        }
      }

      // Move obstacles & collectibles down
      const moveDown = st.speed
      st.roadOffset = (st.roadOffset + moveDown) % 40
      for (const o of st.obstacles) o.y += moveDown
      for (const c of st.collectibles) c.y += moveDown
      st.obstacles = st.obstacles.filter(o => o.y < H + 60)
      st.collectibles = st.collectibles.filter(c => c.y < H + 30)

      // Spawn
      if (st.frame % spawnInt === 0) {
        const lane = Math.floor(Math.random() * st.laneCount)
        const cx = laneX(lane, st.roadLeft, st.laneWidth) - OBS_W / 2
        const r = Math.random()
        if (r < 0.55) {
          st.obstacles.push({ x: cx, y: -OBS_H, kind: Math.random() < 0.6 ? 'car' : Math.random() < 0.5 ? 'barrier' : 'oil' })
        } else if (r < 0.80) {
          st.collectibles.push({ x: cx + (OBS_W - COLLECT_R * 2) / 2, y: -COLLECT_R * 2, kind: 'coin' })
        } else if (r < 0.93) {
          st.collectibles.push({ x: cx, y: -16, kind: 'fuel' })
        } else {
          st.collectibles.push({ x: cx + (OBS_W - COLLECT_R * 2) / 2, y: -COLLECT_R * 2, kind: 'gem' })
        }
      }

      // Collision & collection checks
      for (const cp of st.players) {
        if (!cp.alive) continue
        // Obstacles
        for (const o of st.obstacles) {
          const ow = o.kind === 'oil' ? 18 : OBS_W
          const oh = o.kind === 'oil' ? 18 : OBS_H
          if (rectsOverlap(cp.x, cp.y, CAR_W, CAR_H, o.x, o.y, ow, oh)) {
            cp.alive = false
            break
          }
        }
        if (!cp.alive) continue
        // Collectibles
        st.collectibles = st.collectibles.filter(c => {
          const cr = COLLECT_R
          const ccx = c.x + cr
          const ccy = c.y + cr
          const px = cp.x + CAR_W / 2
          const py = cp.y + CAR_H / 2
          const dx = ccx - px
          const dy = ccy - py
          if (Math.sqrt(dx * dx + dy * dy) < cr + CAR_W / 2) {
            if (c.kind === 'coin') cp.coins++
            else if (c.kind === 'fuel') cp.fuel = Math.min(100, cp.fuel + FUEL_PICKUP)
            else if (c.kind === 'gem') cp.gems++
            return false
          }
          return true
        })
      }

      // Star for beating own record
      for (const cp of st.players) {
        if (cp.distance > cp.bestDistance + 1000) {
          cp.stars++
          cp.bestDistance = cp.distance
        }
      }

      // Game over check
      const alive = st.players.filter(p => p.alive)
      if (alive.length === 0) {
        st.gameOver = true
        // Winner = furthest distance
        const sorted = [...st.players].sort((a, b) => b.distance - a.distance)
        st.winner = sorted[0].playerIndex
      } else if (st.players.length > 1 && alive.length <= 1) {
        st.gameOver = true
        st.winner = alive[0]?.playerIndex ?? null
      }

      // Scores
      setScores(st.players.map(p => ({
        idx: p.playerIndex, name: p.name, distance: Math.floor(p.distance),
        coins: p.coins, gems: p.gems, stars: p.stars, alive: p.alive, color: p.color,
      })))

      if (st.gameOver) {
        setGameOver(true)
        const w = st.players.find(p => p.playerIndex === st.winner)
        setWinner(w?.name ?? null)
        return
      }

      // ─── Draw ────────────────────────────────────────────
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(tick); return }
      const ctx = canvas.getContext('2d')!
      canvas.width = W; canvas.height = H

      // Background
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, W, H)

      // Road
      ctx.fillStyle = '#333'
      ctx.fillRect(st.roadLeft, 0, st.laneWidth * st.laneCount, H)

      // Lane dashes
      ctx.setLineDash([20, 15])
      ctx.strokeStyle = '#666'
      ctx.lineWidth = 2
      for (let i = 1; i < st.laneCount; i++) {
        const lx = st.roadLeft + i * st.laneWidth
        ctx.beginPath()
        ctx.moveTo(lx, -40 + (st.roadOffset % 35))
        ctx.lineTo(lx, H + 40)
        ctx.stroke()
      }
      ctx.setLineDash([])

      // Road edges
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 3
      ctx.strokeRect(st.roadLeft, 0, st.laneWidth * st.laneCount, H)

      // Obstacles
      for (const o of st.obstacles) {
        if (o.kind === 'car') { ctx.fillStyle = '#888'; ctx.fillRect(o.x, o.y, OBS_W, OBS_H) }
        else if (o.kind === 'barrier') { ctx.fillStyle = '#c0392b'; ctx.fillRect(o.x, o.y, OBS_W, OBS_H) }
        else { ctx.fillStyle = '#2c2c1a'; ctx.beginPath(); ctx.arc(o.x + 9, o.y + 9, 9, 0, Math.PI * 2); ctx.fill() }
      }

      // Collectibles
      for (const c of st.collectibles) {
        if (c.kind === 'coin') {
          ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(c.x + COLLECT_R, c.y + COLLECT_R, COLLECT_R, 0, Math.PI * 2); ctx.fill()
        } else if (c.kind === 'fuel') {
          ctx.fillStyle = '#27ae60'; ctx.fillRect(c.x, c.y, 16, 16)
        } else {
          // Diamond
          ctx.fillStyle = '#00e5ff'
          ctx.beginPath()
          ctx.moveTo(c.x + COLLECT_R, c.y)
          ctx.lineTo(c.x + COLLECT_R * 2, c.y + COLLECT_R)
          ctx.lineTo(c.x + COLLECT_R, c.y + COLLECT_R * 2)
          ctx.lineTo(c.x, c.y + COLLECT_R)
          ctx.closePath(); ctx.fill()
        }
      }

      // Player cars
      for (const cp of st.players) {
        ctx.globalAlpha = cp.alive ? 1 : 0.25
        ctx.fillStyle = cp.color
        ctx.fillRect(cp.x, cp.y, CAR_W, CAR_H)
        // Windshield
        ctx.fillStyle = '#222'
        ctx.fillRect(cp.x + 4, cp.y + 4, CAR_W - 8, 12)
        ctx.globalAlpha = 1
      }

      // Fuel bars
      for (const cp of st.players) {
        if (!cp.alive) continue
        const bx = cp.x - 2
        const by = cp.y + CAR_H + 4
        ctx.fillStyle = '#444'
        ctx.fillRect(bx, by, CAR_W + 4, 5)
        ctx.fillStyle = cp.fuel > 25 ? '#2ecc71' : '#e74c3c'
        ctx.fillRect(bx, by, (CAR_W + 4) * (cp.fuel / 100), 5)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, laneCount, startSpeed)
    setGameOver(false)
    setWinner(null)
    setScores([])
  }, [players, laneCount, startSpeed])

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
            <span className={styles.scoreValue}>{s.distance}m</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Car Dodge canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && scores.length === 1 && (
            <p className={styles.winnerText}>
              {t('miniGames.finalScore', 'Score')}: {scores[0]?.distance ?? 0}m
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
