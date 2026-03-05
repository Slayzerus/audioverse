/**
 * HorizonChaseGame — retro pseudo-3D racing for 1-8 couch players.
 *
 * Controls:
 *   Keyboard group 0: A/D lane change, Space turbo
 *   Keyboard group 1: Left/Right lane change, Enter turbo
 *   Keyboard group 2: J/L lane change, H turbo
 *   Keyboard group 3: Numpad 4/6 lane change, Numpad 0 turbo
 *   Gamepad: D-pad left/right lane change, A turbo
 *
 * Rules:
 *  - Road scrolls toward the player (pseudo-3D perspective).
 *  - 5 lanes, dodge AI cars and obstacles by lane-changing.
 *  - Collect coins and fuel cans. Turbo pickups give boost uses.
 *  - Compete for position against AI racers over N laps.
 *  - Collisions slow the player. Fuel running out = race over.
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
const LANES = 5
const LANE_W = 80
const ROAD_W_BOTTOM = LANES * LANE_W
const ROAD_W_TOP = 60
const HORIZON_Y = 160
const CAR_W = 30
const CAR_H = 18
const BASE_SPEED = 3
const SPEED_INCREMENT = 0.003
const TURBO_MULT = 2.2
const TURBO_DUR = 40
const SEGMENT_LEN = 200
const TRACK_LEN = 100 // segments per lap
const AI_COUNT = 6
const FUEL_MAX = 1000

// ─── Types ───────────────────────────────────────────────────
interface RacerObj {
  lane: number; targetLane: number; laneSmooth: number
  speed: number; distance: number; lap: number
  turboUses: number; turboTimer: number
  fuel: number; slowTimer: number
  alive: boolean; finished: boolean; position: number
  color: string; name: string; index: number
  input: PlayerSlot['input'] | 'ai'
  coins: number; gems: number; stars: number
  laneCooldown: number
}

interface RoadObj {
  type: 'car' | 'rock' | 'oil' | 'coin' | 'fuel' | 'turbo'
  lane: number; dist: number; collected: boolean; color: string
}

interface GameState {
  racers: RacerObj[]
  objects: RoadObj[]
  curve: number; curveTarget: number; curveTimer: number
  totalLaps: number; tick: number
  gameOver: boolean; winner: string | null
}

// KB maps
const KB_LANE: Record<string, { group: number; dir: number }> = {
  a: { group: 0, dir: -1 }, d: { group: 0, dir: 1 },
  ArrowLeft: { group: 1, dir: -1 }, ArrowRight: { group: 1, dir: 1 },
  j: { group: 2, dir: -1 }, l: { group: 2, dir: 1 },
  '4': { group: 3, dir: -1 }, '6': { group: 3, dir: 1 },
}
const KB_TURBO: Record<string, number> = { ' ': 0, Enter: 1, h: 2, '0': 3 }

// ─── Helpers ─────────────────────────────────────────────────
function spawnObjects(lap: number): RoadObj[] {
  const objs: RoadObj[] = []
  const totalDist = TRACK_LEN * SEGMENT_LEN
  const intensity = 1 + lap * 0.3
  for (let d = SEGMENT_LEN * 5; d < totalDist; d += SEGMENT_LEN * (1.5 / intensity)) {
    const lane = Math.floor(Math.random() * LANES)
    const r = Math.random()
    if (r < 0.2) objs.push({ type: 'coin', lane, dist: d, collected: false, color: '#f1c40f' })
    else if (r < 0.3) objs.push({ type: 'fuel', lane, dist: d, collected: false, color: '#e74c3c' })
    else if (r < 0.35) objs.push({ type: 'turbo', lane, dist: d, collected: false, color: '#9b59b6' })
    else if (r < 0.55) objs.push({ type: 'rock', lane, dist: d, collected: false, color: '#7f8c8d' })
    else if (r < 0.65) objs.push({ type: 'oil', lane, dist: d, collected: false, color: '#2c3e50' })
    else objs.push({ type: 'car', lane, dist: d, collected: false, color: ['#c0392b', '#27ae60', '#2980b9', '#8e44ad'][Math.floor(Math.random() * 4)] })
  }
  return objs
}

function initState(players: PlayerSlot[], totalLaps: number): GameState {
  const racers: RacerObj[] = players.map((p, i) => ({
    lane: Math.floor(LANES / 2), targetLane: Math.floor(LANES / 2), laneSmooth: Math.floor(LANES / 2),
    speed: BASE_SPEED, distance: 0, lap: 0,
    turboUses: 2, turboTimer: 0, fuel: FUEL_MAX, slowTimer: 0,
    alive: true, finished: false, position: i + 1,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, index: p.index, input: p.input,
    coins: 0, gems: 0, stars: 0, laneCooldown: 0,
  }))
  // AI racers
  for (let i = 0; i < AI_COUNT; i++) {
    racers.push({
      lane: Math.floor(Math.random() * LANES), targetLane: Math.floor(Math.random() * LANES),
      laneSmooth: Math.floor(Math.random() * LANES),
      speed: BASE_SPEED * (0.85 + Math.random() * 0.3), distance: 0, lap: 0,
      turboUses: 0, turboTimer: 0, fuel: FUEL_MAX * 10, slowTimer: 0,
      alive: true, finished: false, position: players.length + i + 1,
      color: ['#95a5a6', '#bdc3c7', '#7f8c8d', '#636e72', '#dfe6e9', '#b2bec3'][i % 6],
      name: `AI ${i + 1}`, index: -(i + 1), input: 'ai',
      coins: 0, gems: 0, stars: 0, laneCooldown: 0,
    })
  }
  return {
    racers, objects: spawnObjects(0),
    curve: 0, curveTarget: 0, curveTimer: 0,
    totalLaps, tick: 0, gameOver: false, winner: null,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function HorizonChaseGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const totalLaps = config?.laps ?? 5
  const stateRef = useRef<GameState>(initState(players, totalLaps))
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

      // Road curves
      st.curveTimer++
      if (st.curveTimer > 120) {
        st.curveTarget = (Math.random() - 0.5) * 4
        st.curveTimer = 0
      }
      st.curve += (st.curveTarget - st.curve) * 0.02

      const lapDist = TRACK_LEN * SEGMENT_LEN

      for (const racer of st.racers) {
        if (!racer.alive || racer.finished) continue
        racer.laneCooldown = Math.max(0, racer.laneCooldown - 1)
        racer.slowTimer = Math.max(0, racer.slowTimer - 1)
        if (racer.turboTimer > 0) racer.turboTimer--

        let laneDir = 0
        let turboPressed = false

        if (racer.input === 'ai') {
          // AI lane changes to dodge obstacles
          if (st.tick % 30 === 0) {
            const ahead = st.objects.filter(o => !o.collected && o.dist > racer.distance && o.dist < racer.distance + 2000 && o.lane === racer.lane && (o.type === 'car' || o.type === 'rock' || o.type === 'oil'))
            if (ahead.length > 0) {
              laneDir = racer.lane > LANES / 2 ? -1 : 1
            }
          }
        } else if ((racer.input as PlayerSlot['input']).type === 'keyboard') {
          const grp = (racer.input as { type: 'keyboard'; group: number }).group
          for (const [key, val] of Object.entries(KB_LANE)) {
            if (val.group === grp && keys.has(key)) laneDir = val.dir
          }
          for (const [key, grpI] of Object.entries(KB_TURBO)) {
            if (grpI === grp && keys.has(key)) turboPressed = true
          }
        } else if ((racer.input as PlayerSlot['input']).type === 'gamepad') {
          const gp = currentPads.find(g => g.index === (racer.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.left) laneDir = -1
            if (gp.right) laneDir = 1
            if (gp.a) turboPressed = true
          }
        }

        // Lane change
        if (laneDir !== 0 && racer.laneCooldown <= 0) {
          racer.targetLane = Math.max(0, Math.min(LANES - 1, racer.targetLane + laneDir))
          racer.laneCooldown = 12
        }
        racer.laneSmooth += (racer.targetLane - racer.laneSmooth) * 0.15

        // Turbo
        if (turboPressed && racer.turboUses > 0 && racer.turboTimer <= 0) {
          racer.turboTimer = TURBO_DUR
          racer.turboUses--
        }

        // Speed
        const speedMul = racer.turboTimer > 0 ? TURBO_MULT : 1
        const slowMul = racer.slowTimer > 0 ? 0.5 : 1
        const currentSpeed = (racer.speed + st.tick * SPEED_INCREMENT * 0.01) * speedMul * slowMul
        racer.distance += currentSpeed

        // Fuel
        if (racer.input !== 'ai') {
          racer.fuel -= 0.5
          if (racer.fuel <= 0) { racer.alive = false; continue }
        }

        // Object collisions
        for (const obj of st.objects) {
          if (obj.collected) continue
          const dDist = Math.abs(obj.dist - racer.distance)
          if (dDist < 30 && Math.abs(obj.lane - racer.targetLane) < 1) {
            obj.collected = true
            switch (obj.type) {
              case 'coin': racer.coins++; break
              case 'fuel': racer.fuel = Math.min(FUEL_MAX, racer.fuel + 200); break
              case 'turbo': racer.turboUses++; break
              case 'car': case 'rock': racer.slowTimer = 40; break
              case 'oil': racer.slowTimer = 60; break
            }
          }
        }

        // Lap completion
        if (racer.distance >= lapDist) {
          racer.lap++
          racer.distance -= lapDist
          if (racer.lap >= st.totalLaps) {
            racer.finished = true
            if (racer.index >= 0) racer.stars++
          }
        }
      }

      // Position tracking
      const sorted = [...st.racers].sort((a, b) => {
        if (a.finished !== b.finished) return a.finished ? -1 : 1
        if (a.lap !== b.lap) return b.lap - a.lap
        return b.distance - a.distance
      })
      sorted.forEach((r, i) => { r.position = i + 1 })

      // Gems for human positions
      const humanFinished = st.racers.filter(r => r.index >= 0 && r.finished)
      for (const r of humanFinished) {
        if (r.gems === 0) { // award once
          if (r.position === 1) r.gems = 3
          else if (r.position <= 3) r.gems = 2
          else r.gems = 1
        }
      }

      // Game over
      const humanRacers = st.racers.filter(r => r.index >= 0)
      if (humanRacers.every(r => r.finished || !r.alive)) {
        st.gameOver = true
        const best = humanRacers.filter(r => r.finished).sort((a, b) => a.position - b.position)
        st.winner = best.length > 0 ? best[0].name : null
      }

      setScores(humanRacers.map(r => ({
        index: r.index, name: r.name, score: r.position, alive: r.alive && !r.finished,
        color: r.color, coins: r.coins, gems: r.gems, stars: r.stars,
      })))
      if (st.gameOver) { setGameOver(true); setWinner(st.winner) }

      // ─── Draw ────────────────────────
      const canvas = canvasRef.current; if (!canvas) return
      const ctx = canvas.getContext('2d'); if (!ctx) return
      canvas.width = W; canvas.height = H

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y)
      skyGrad.addColorStop(0, '#1a237e')
      skyGrad.addColorStop(1, '#e65100')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, W, HORIZON_Y)

      // Ground
      ctx.fillStyle = '#2e7d32'
      ctx.fillRect(0, HORIZON_Y, W, H - HORIZON_Y)

      // Road perspective
      const cx = W / 2 + st.curve * 30
      for (let row = 0; row < H - HORIZON_Y; row++) {
        const t_val = row / (H - HORIZON_Y)
        const roadW = ROAD_W_TOP + (ROAD_W_BOTTOM - ROAD_W_TOP) * t_val
        const y = HORIZON_Y + row
        const x0 = cx - roadW / 2 + st.curve * (1 - t_val) * 50
        // Road surface — alternate stripe colors
        const stripePhase = Math.floor((row + st.tick * 3) / 12) % 2
        ctx.fillStyle = stripePhase === 0 ? '#555' : '#4a4a4a'
        ctx.fillRect(x0, y, roadW, 1)
        // Lane dividers
        ctx.fillStyle = stripePhase === 0 ? '#ddd' : 'transparent'
        const lw = roadW / LANES
        for (let l = 1; l < LANES; l++) {
          ctx.fillRect(x0 + l * lw - 1, y, 2, 1)
        }
        // Road edges
        ctx.fillStyle = (Math.floor(row / 8) % 2 === 0) ? '#c0392b' : '#fff'
        ctx.fillRect(x0 - 4, y, 4, 1)
        ctx.fillRect(x0 + roadW, y, 4, 1)
      }

      // Draw leading human racer's view objects
      const mainRacer = st.racers.find(r => r.index >= 0 && (r.alive || r.finished))
      if (mainRacer) {
        // Objects in view
        for (const obj of st.objects) {
          if (obj.collected) continue
          const relDist = obj.dist - mainRacer.distance
          if (relDist < 50 || relDist > 5000) continue
          const perspective = 1 - relDist / 5000
          if (perspective <= 0) continue
          const y = HORIZON_Y + (H - HORIZON_Y) * perspective
          const roadW = ROAD_W_TOP + (ROAD_W_BOTTOM - ROAD_W_TOP) * perspective
          const x0 = cx - roadW / 2 + st.curve * (1 - perspective) * 50
          const lw = roadW / LANES
          const ox = x0 + (obj.lane + 0.5) * lw
          const size = 8 * perspective + 4
          ctx.fillStyle = obj.color
          if (obj.type === 'car') {
            ctx.fillRect(ox - size, y - size * 1.2, size * 2, size * 1.2)
          } else if (obj.type === 'coin' || obj.type === 'fuel' || obj.type === 'turbo') {
            ctx.beginPath(); ctx.arc(ox, y - size / 2, size / 2, 0, Math.PI * 2); ctx.fill()
          } else {
            ctx.fillRect(ox - size / 2, y - size / 2, size, size)
          }
        }

        // Player car at bottom
        const playerY = H - 60
        const playerRoadW = ROAD_W_BOTTOM
        const playerX0 = cx - playerRoadW / 2
        const playerLaneW = playerRoadW / LANES
        const px = playerX0 + (mainRacer.laneSmooth + 0.5) * playerLaneW
        ctx.fillStyle = mainRacer.color
        ctx.fillRect(px - CAR_W / 2, playerY - CAR_H, CAR_W, CAR_H)
        // Windshield
        ctx.fillStyle = '#aad'
        ctx.fillRect(px - CAR_W / 4, playerY - CAR_H + 3, CAR_W / 2, CAR_H / 3)
        // Turbo flame
        if (mainRacer.turboTimer > 0) {
          ctx.fillStyle = '#f39c12'
          ctx.fillRect(px - 4, playerY, 8, 10)
        }

        // HUD
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 16px monospace'
        ctx.fillText(`Lap ${Math.min(mainRacer.lap + 1, st.totalLaps)}/${st.totalLaps}`, 10, 30)
        ctx.fillText(`Pos: ${mainRacer.position}/${st.racers.length}`, 10, 50)
        ctx.fillText(`Turbo: ${mainRacer.turboUses}`, 10, 70)

        // Fuel bar
        ctx.fillStyle = '#600'
        ctx.fillRect(W - 120, 10, 100, 12)
        ctx.fillStyle = mainRacer.fuel > 200 ? '#2ecc71' : '#e74c3c'
        ctx.fillRect(W - 120, 10, 100 * (mainRacer.fuel / FUEL_MAX), 12)
        ctx.fillStyle = '#fff'
        ctx.font = '10px monospace'
        ctx.fillText('FUEL', W - 120, 34)
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [players, totalLaps])

  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, totalLaps)
    setGameOver(false); setWinner(null); setScores([])
  }, [players, totalLaps])

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
            <span className={styles.scoreValue}>P{s.score}</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>🪙{s.coins} 💎{s.gems} ⭐{s.stars}</span>
          </div>
        ))}
      </div>
      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Horizon Chase canvas"/>
      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}
      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.raceOver', 'Race Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.noFinish', 'No one finished!')}</p>}
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
