/**
 * DragRacingGame — quarter-mile drag racing for 1-4 players.
 *
 * Controls:
 *   Group 0: WASD + Space (action) + E (NOS)
 *   Group 1: Arrows + Enter (action) + Shift (NOS)
 *   Gamepads: D-pad/stick (navigate), A/Cross (action), X/Square (NOS)
 *
 * Two phases: GARAGE (upgrade car) and RACE (quarter-mile).
 * Currencies: coins (race winnings), gems (perfect shifts), stars (tournament wins).
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
const CAR_W = 60
const CAR_H = 25
const WHEEL_R = 6
const LANE_H = 100
const TRACK_PX = 700          // usable track pixels (left margin → finish)
const TRACK_LEFT = 60
const FINISH_X = TRACK_LEFT + TRACK_PX
const QUARTER_MILE_FT = 1320  // feet in a quarter mile
const GEARS = 5
const MAX_RPM = 10000
const SHIFT_GREEN_LO = 7500
const SHIFT_GREEN_HI = 9000
const SHIFT_YELLOW_LO = 6000
const NOS_DURATION_MS = 1500
const NOS_BOOST = 0.45
const COUNTDOWN_STEP_MS = 1000
const FALSE_START_PENALTY_MS = 500
const PERFECT_LAUNCH_BONUS = 0.15
const TICK_MS = 16             // ~60 fps

// ─── Upgrade definitions ────────────────────────────────────
interface UpgradeDef { name: string; maxLv: number; costs: number[]; desc: string }
const UPGRADES: UpgradeDef[] = [
  { name: 'Engine',  maxLv: 5, costs: [50, 100, 200, 400, 800], desc: '+10% top speed' },
  { name: 'Turbo',   maxLv: 3, costs: [100, 250, 500],          desc: '+15% boost' },
  { name: 'Tires',   maxLv: 3, costs: [75, 150, 300],           desc: '+grip / launch' },
  { name: 'Weight',  maxLv: 3, costs: [100, 200, 400],          desc: '+acceleration' },
  { name: 'NOS',     maxLv: 3, costs: [150, 300, 600],          desc: '+1 nitrous charge' },
]

// ─── Car state ──────────────────────────────────────────────
interface CarState {
  playerIndex: number
  name: string
  color: string
  input: PlayerSlot['input']
  // upgrades (current level, 0 = stock)
  engineLv: number; turboLv: number; tiresLv: number; weightLv: number; nosLv: number
  // race state
  distanceFt: number; speedMph: number; gear: number; rpm: number
  nosCharges: number; nosActive: boolean; nosTimer: number
  finished: boolean; finishTimeMs: number; finishSpeedMph: number
  falseStart: boolean; penaltyTimer: number
  perfectLaunch: boolean; launched: boolean
  wheelieTimer: number
  // economy
  coins: number; gems: number; stars: number
  // garage cursor
  upgradeCursor: number
}

interface Particle { x: number; y: number; life: number; vx: number; vy: number; alpha: number }

type Phase = 'garage' | 'countdown' | 'racing' | 'results'

interface GameSt {
  cars: CarState[]
  phase: Phase
  countdownStep: number       // 3=red1,2=red2,1=yellow,0=green,-1=go
  raceTimeMs: number
  raceNumber: number
  totalRaces: number
  tournamentScores: number[]  // cumulative per player
  particles: Particle[]
  gameOver: boolean
}

// ─── Helpers ─────────────────────────────────────────────────
function topSpeed(car: CarState): number {
  return 120 + car.engineLv * 12 + car.turboLv * 8
}
function accelFactor(car: CarState): number {
  return 1 + car.weightLv * 0.15 + car.tiresLv * 0.08
}
function gripFactor(car: CarState): number {
  return 1 + car.tiresLv * 0.12
}
function maxNos(car: CarState): number { return car.nosLv }

function shiftQuality(rpm: number): 'perfect' | 'good' | 'bad' {
  if (rpm >= SHIFT_GREEN_LO && rpm <= SHIFT_GREEN_HI) return 'perfect'
  if (rpm >= SHIFT_YELLOW_LO) return 'good'
  return 'bad'
}

function makeCar(p: PlayerSlot, startCoins: number): CarState {
  return {
    playerIndex: p.index, name: p.name,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    input: p.input,
    engineLv: 0, turboLv: 0, tiresLv: 0, weightLv: 0, nosLv: 0,
    distanceFt: 0, speedMph: 0, gear: 1, rpm: 0,
    nosCharges: 0, nosActive: false, nosTimer: 0,
    finished: false, finishTimeMs: 0, finishSpeedMph: 0,
    falseStart: false, penaltyTimer: 0,
    perfectLaunch: false, launched: false, wheelieTimer: 0,
    coins: startCoins, gems: 0, stars: 0,
    upgradeCursor: 0,
  }
}

function resetCarRace(car: CarState) {
  car.distanceFt = 0; car.speedMph = 0; car.gear = 1; car.rpm = 0
  car.nosCharges = maxNos(car); car.nosActive = false; car.nosTimer = 0
  car.finished = false; car.finishTimeMs = 0; car.finishSpeedMph = 0
  car.falseStart = false; car.penaltyTimer = 0
  car.perfectLaunch = false; car.launched = false; car.wheelieTimer = 0
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function DragRacingGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads

  const startMoney = config?.startingMoney === 'rich' ? 500 : config?.startingMoney === 'low' ? 50 : 200
  const totalRaces = Number(config?.raceCount) || 3
  const gameMode = config?.gameMode || 'single-race'
  const isTournament = gameMode === 'tournament'
  const isCoop = gameMode === 'coop-relay'

  const initState = useCallback((): GameSt => {
    const cars = players.map(p => makeCar(p, startMoney))
    return {
      cars, phase: 'garage', countdownStep: 3, raceTimeMs: 0,
      raceNumber: 1, totalRaces: isTournament ? 5 : totalRaces,
      tournamentScores: players.map(() => 0),
      particles: [], gameOver: false,
    }
  }, [players, startMoney, totalRaces, isTournament])

  const stRef = useRef<GameSt>(initState())
  const [phase, setPhase] = useState<Phase>('garage')
  const [, forceRender] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // key state maps
  const keysDown = useRef<Set<string>>(new Set())
  const keysJustPressed = useRef<Set<string>>(new Set())

  // ── Input: keyboard ────────────────────────────────────────
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysDown.current.add(e.key)
      keysJustPressed.current.add(e.key)
    }
    const onUp = (e: KeyboardEvent) => { keysDown.current.delete(e.key) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ── Query input helpers ────────────────────────────────────
  function actionPressed(car: CarState): boolean {
    if (car.input.type === 'keyboard') {
      const g = car.input.group
      if (g === 0) return keysJustPressed.current.has(' ')
      if (g === 1) return keysJustPressed.current.has('Enter')
      return false
    }
    if (car.input.type === 'gamepad') {
      const gp = padsRef.current.find(p => p.index === (car.input as { type: 'gamepad'; padIndex: number }).padIndex)
      return !!gp?.a
    }
    return false
  }

  function nosPressed(car: CarState): boolean {
    if (car.input.type === 'keyboard') {
      const g = car.input.group
      if (g === 0) return keysJustPressed.current.has('e') || keysJustPressed.current.has('E')
      if (g === 1) return keysJustPressed.current.has('Shift')
      return false
    }
    if (car.input.type === 'gamepad') {
      const gp = padsRef.current.find(p => p.index === (car.input as { type: 'gamepad'; padIndex: number }).padIndex)
      return !!gp?.x
    }
    return false
  }

  function navDir(car: CarState): 'up' | 'down' | null {
    if (car.input.type === 'keyboard') {
      const g = car.input.group
      if (g === 0) {
        if (keysJustPressed.current.has('w') || keysJustPressed.current.has('W')) return 'up'
        if (keysJustPressed.current.has('s') || keysJustPressed.current.has('S')) return 'down'
      }
      if (g === 1) {
        if (keysJustPressed.current.has('ArrowUp')) return 'up'
        if (keysJustPressed.current.has('ArrowDown')) return 'down'
      }
      return null
    }
    if (car.input.type === 'gamepad') {
      const gp = padsRef.current.find(p => p.index === (car.input as { type: 'gamepad'; padIndex: number }).padIndex)
      if (gp?.up) return 'up'
      if (gp?.down) return 'down'
    }
    return null
  }

  // ── Game loop ──────────────────────────────────────────────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    let countdownTimer: ReturnType<typeof setTimeout> | null = null

    function startCountdown() {
      const st = stRef.current
      st.phase = 'countdown'; st.countdownStep = 3
      setPhase('countdown')
      let step = 3
      const advance = () => {
        if (pauseRef.current) { countdownTimer = setTimeout(advance, 100); return }
        step--
        st.countdownStep = step
        forceRender(n => n + 1)
        if (step > 0) { countdownTimer = setTimeout(advance, COUNTDOWN_STEP_MS) }
        else { st.phase = 'racing'; st.raceTimeMs = 0; setPhase('racing'); tick() }
      }
      countdownTimer = setTimeout(advance, COUNTDOWN_STEP_MS)
    }

    function tick() {
      if (pauseRef.current) { timer = setTimeout(tick, TICK_MS); return }
      const st = stRef.current
      if (st.phase !== 'racing') return

      const dt = TICK_MS / 1000
      st.raceTimeMs += TICK_MS

      for (const car of st.cars) {
        if (car.finished) continue
        if (car.penaltyTimer > 0) { car.penaltyTimer -= TICK_MS; continue }

        // ── Launch detection ──
        if (!car.launched && actionPressed(car)) {
          if (st.countdownStep > 0) {
            // false start
            car.falseStart = true; car.penaltyTimer = FALSE_START_PENALTY_MS
          } else {
            car.launched = true
            // perfect launch if pressed within 200ms of green
            if (st.raceTimeMs < 200) { car.perfectLaunch = true; car.wheelieTimer = 600 }
          }
        }
        if (!car.launched) continue

        // ── RPM & gear logic ──
        const gearTopSpeed = topSpeed(car) * (car.gear / GEARS)
        const accel = (35 + car.gear * 15) * accelFactor(car) * (car.perfectLaunch ? (1 + PERFECT_LAUNCH_BONUS) : 1)
        car.rpm += accel * dt * 800
        if (car.rpm > MAX_RPM) car.rpm = MAX_RPM

        // ── Shift ──
        if (car.gear < GEARS && actionPressed(car)) {
          const q = shiftQuality(car.rpm)
          if (q === 'perfect') {
            car.gems++
            car.rpm = car.rpm * 0.45
          } else if (q === 'good') {
            car.rpm = car.rpm * 0.35
          } else {
            car.rpm = car.rpm * 0.2
            car.speedMph *= 0.85
          }
          car.gear++
        }

        // ── NOS ──
        if (nosPressed(car) && car.nosCharges > 0 && !car.nosActive) {
          car.nosActive = true; car.nosTimer = NOS_DURATION_MS; car.nosCharges--
          // spawn smoke particles
          for (let i = 0; i < 8; i++) {
            st.particles.push({ x: carScreenX(car) - 5, y: carScreenY(car, st.cars.indexOf(car)) + CAR_H, life: 400 + Math.random() * 300, vx: -Math.random() * 40, vy: (Math.random() - 0.5) * 20, alpha: 0.7 })
          }
        }
        if (car.nosActive) {
          car.nosTimer -= TICK_MS
          if (car.nosTimer <= 0) car.nosActive = false
        }

        // ── Speed calculation ──
        const rpmFraction = car.rpm / MAX_RPM
        let targetSpeed = gearTopSpeed * rpmFraction
        if (car.nosActive) targetSpeed *= (1 + NOS_BOOST + car.turboLv * 0.05)
        const grip = gripFactor(car)
        car.speedMph += (targetSpeed - car.speedMph) * Math.min(1, dt * 3 * grip)
        if (car.speedMph < 0) car.speedMph = 0

        // ── Distance ──
        const feetPerSec = car.speedMph * 5280 / 3600
        car.distanceFt += feetPerSec * dt

        // ── Wheelie timer ──
        if (car.wheelieTimer > 0) car.wheelieTimer -= TICK_MS

        // ── Launch smoke ──
        if (car.launched && car.distanceFt < 30) {
          if (Math.random() < 0.3) {
            const ci = st.cars.indexOf(car)
            st.particles.push({ x: carScreenX(car) - 3, y: carScreenY(car, ci) + CAR_H + 2, life: 300, vx: -15 - Math.random() * 10, vy: (Math.random() - 0.5) * 8, alpha: 0.5 })
          }
        }

        // ── Finish ──
        if (car.distanceFt >= QUARTER_MILE_FT) {
          car.finished = true; car.finishTimeMs = st.raceTimeMs; car.finishSpeedMph = car.speedMph; car.distanceFt = QUARTER_MILE_FT
        }
      }

      // ── Update particles ──
      st.particles = st.particles.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= TICK_MS; p.alpha *= 0.96; return p.life > 0 })

      // ── Check race end ──
      const allDone = st.cars.every(c => c.finished)
      if (allDone) {
        raceFinished()
        return
      }

      forceRender(n => n + 1)
      timer = setTimeout(tick, TICK_MS)
    }

    function raceFinished() {
      const st = stRef.current
      // Award coins by placement
      const sorted = [...st.cars].sort((a, b) => a.finishTimeMs - b.finishTimeMs)
      const prizes = [100, 60, 30, 10]
      sorted.forEach((car, i) => {
        car.coins += prizes[i] || 10
        if (isTournament) st.tournamentScores[car.playerIndex] += (sorted.length - i)
      })
      if (isTournament && st.raceNumber >= st.totalRaces) {
        // Tournament over — award stars to winner
        let bestIdx = 0
        st.tournamentScores.forEach((s, i) => { if (s > st.tournamentScores[bestIdx]) bestIdx = i })
        st.cars[bestIdx].stars++
        st.gameOver = true
        setGameOver(true)
        setWinner(st.cars[bestIdx].name)
      } else if (isCoop) {
        // Coop: check combined time vs target
        const combined = st.cars.reduce((s, c) => s + c.finishTimeMs, 0)
        const target = st.cars.length * 12000
        st.gameOver = true
        setGameOver(true)
        setWinner(combined <= target ? t('miniGames.coopWin', 'Team wins!') : t('miniGames.coopLose', 'Too slow!'))
      } else if (!isTournament) {
        st.gameOver = true
        setGameOver(true)
        setWinner(sorted[0].name)
      }
      st.phase = 'results'; setPhase('results')
      forceRender(n => n + 1)
    }

    // Garage action handler
    function garageAction() {
      const st = stRef.current
      if (st.phase !== 'garage') return
      for (const car of st.cars) {
        const dir = navDir(car)
        if (dir === 'up') car.upgradeCursor = Math.max(0, car.upgradeCursor - 1)
        if (dir === 'down') car.upgradeCursor = Math.min(UPGRADES.length, car.upgradeCursor + 1)
        if (actionPressed(car)) {
          if (car.upgradeCursor === UPGRADES.length) {
            // "Ready" button — start race
            st.cars.forEach(c => resetCarRace(c))
            startCountdown()
            return
          }
          const upg = UPGRADES[car.upgradeCursor]
          const lv = getUpgLevel(car, car.upgradeCursor)
          if (lv < upg.maxLv) {
            const cost = upg.costs[lv]
            if (car.coins >= cost) {
              car.coins -= cost
              setUpgLevel(car, car.upgradeCursor, lv + 1)
            }
          }
        }
      }
      keysJustPressed.current.clear()
      forceRender(n => n + 1)
    }

    // Garage polling
    let garageRaf: ReturnType<typeof setInterval> | null = null
    if (stRef.current.phase === 'garage') {
      garageRaf = setInterval(garageAction, 100)
    }

    return () => {
      clearTimeout(timer)
      if (countdownTimer) clearTimeout(countdownTimer)
      if (garageRaf) clearInterval(garageRaf)
    }
  // Phase-trigger effect — game tick restarts only on phase change; reads from stRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // clear just-pressed keys after each tick
  useEffect(() => {
    const id = setInterval(() => { keysJustPressed.current.clear() }, TICK_MS + 2)
    return () => clearInterval(id)
  }, [])

  // ── Helpers for upgrades ───────────────────────────────────
  function getUpgLevel(car: CarState, idx: number): number {
    return [car.engineLv, car.turboLv, car.tiresLv, car.weightLv, car.nosLv][idx]
  }
  function setUpgLevel(car: CarState, idx: number, lv: number) {
    if (idx === 0) car.engineLv = lv
    else if (idx === 1) car.turboLv = lv
    else if (idx === 2) car.tiresLv = lv
    else if (idx === 3) car.weightLv = lv
    else if (idx === 4) car.nosLv = lv
  }

  function carScreenX(car: CarState): number {
    return TRACK_LEFT + (car.distanceFt / QUARTER_MILE_FT) * TRACK_PX
  }
  function carScreenY(_car: CarState, laneIdx: number): number {
    const totalLanes = stRef.current.cars.length
    const laneStart = (H - totalLanes * LANE_H) / 2
    return laneStart + laneIdx * LANE_H + (LANE_H - CAR_H) / 2
  }

  // ── Canvas rendering ──────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      canvas.width = W; canvas.height = H
      const st = stRef.current

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      if (st.phase === 'garage') {
        drawGarage(ctx, st)
      } else {
        drawRace(ctx, st)
      }

      raf = requestAnimationFrame(draw)
    }

    function drawGarage(ctx: CanvasRenderingContext2D, st: GameSt) {
      ctx.fillStyle = '#eee'; ctx.font = 'bold 22px monospace'; ctx.textAlign = 'center'
      ctx.fillText(`🏁 GARAGE — Race ${st.raceNumber}/${st.totalRaces}`, W / 2, 35)

      const colW = W / st.cars.length
      st.cars.forEach((car, ci) => {
        const cx = ci * colW + colW / 2
        const baseY = 60
        // Car preview
        drawCar(ctx, cx - CAR_W / 2, baseY + 10, car, 0, false)
        // Stats
        ctx.fillStyle = '#ccc'; ctx.font = '12px monospace'; ctx.textAlign = 'center'
        ctx.fillText(`Top: ${topSpeed(car).toFixed(0)} mph`, cx, baseY + 65)
        ctx.fillText(`Coins: ${car.coins}`, cx, baseY + 80)
        ctx.fillText(`Gems: ${car.gems}  Stars: ${car.stars}`, cx, baseY + 95)
        // Upgrade list
        UPGRADES.forEach((upg, ui) => {
          const y = baseY + 120 + ui * 50
          const lv = getUpgLevel(car, ui)
          const selected = car.upgradeCursor === ui
          ctx.fillStyle = selected ? '#ffeb3b' : '#aaa'
          ctx.font = selected ? 'bold 13px monospace' : '12px monospace'
          ctx.textAlign = 'left'
          const tx = ci * colW + 10
          ctx.fillText(`${selected ? '▸ ' : '  '}${upg.name} Lv${lv}/${upg.maxLv}`, tx, y)
          ctx.fillStyle = '#888'; ctx.font = '10px monospace'
          ctx.fillText(`  ${upg.desc}`, tx, y + 14)
          if (lv < upg.maxLv) {
            ctx.fillStyle = car.coins >= upg.costs[lv] ? '#2ecc71' : '#e74c3c'
            ctx.fillText(`  Cost: ${upg.costs[lv]}`, tx, y + 27)
          } else {
            ctx.fillStyle = '#666'; ctx.fillText('  MAX', tx, y + 27)
          }
        })
        // Ready button
        const ry = baseY + 120 + UPGRADES.length * 50
        const readySel = car.upgradeCursor === UPGRADES.length
        ctx.fillStyle = readySel ? '#2ecc71' : '#555'
        ctx.font = readySel ? 'bold 14px monospace' : '13px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`${readySel ? '▸ ' : '  '}[ RACE! ]`, ci * colW + 10, ry)
      })
    }

    function drawRace(ctx: CanvasRenderingContext2D, st: GameSt) {
      const totalLanes = st.cars.length
      const laneStart = (H - totalLanes * LANE_H) / 2

      // Road
      ctx.fillStyle = '#333'
      ctx.fillRect(0, laneStart - 5, W, totalLanes * LANE_H + 10)

      // Lane lines
      ctx.strokeStyle = '#555'; ctx.setLineDash([12, 8]); ctx.lineWidth = 1
      for (let i = 1; i < totalLanes; i++) {
        const ly = laneStart + i * LANE_H
        ctx.beginPath(); ctx.moveTo(0, ly); ctx.lineTo(W, ly); ctx.stroke()
      }
      ctx.setLineDash([])

      // Start line
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(TRACK_LEFT, laneStart - 5); ctx.lineTo(TRACK_LEFT, laneStart + totalLanes * LANE_H + 5); ctx.stroke()

      // Finish line (checkered)
      for (let r = 0; r < totalLanes * LANE_H / 8; r++) {
        for (let c = 0; c < 3; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#fff' : '#000'
          ctx.fillRect(FINISH_X + c * 8, laneStart + r * 8, 8, 8)
        }
      }

      // Cars & HUD
      st.cars.forEach((car, ci) => {
        const sx = carScreenX(car)
        const sy = carScreenY(car, ci)
        drawCar(ctx, sx - CAR_W, sy, car, car.wheelieTimer, car.nosActive)

        // RPM bar
        const barX = sx - CAR_W
        const barY = sy + CAR_H + 12
        const barW = CAR_W + 20
        const barH = 8
        ctx.fillStyle = '#222'; ctx.fillRect(barX, barY, barW, barH)
        const rpmFrac = car.rpm / MAX_RPM
        const rpmColor = car.rpm >= SHIFT_GREEN_LO ? (car.rpm <= SHIFT_GREEN_HI ? '#2ecc71' : '#e74c3c') : (car.rpm >= SHIFT_YELLOW_LO ? '#f1c40f' : '#3498db')
        ctx.fillStyle = rpmColor; ctx.fillRect(barX, barY, barW * rpmFrac, barH)
        ctx.strokeStyle = '#555'; ctx.strokeRect(barX, barY, barW, barH)

        // Gear + speed text
        ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; ctx.textAlign = 'left'
        ctx.fillText(`G${car.gear} ${car.speedMph.toFixed(0)}mph`, barX, barY + 20)
        if (car.nosCharges > 0) {
          ctx.fillStyle = '#00bcd4'
          ctx.fillText(`NOS:${'●'.repeat(car.nosCharges)}`, barX + 90, barY + 20)
        }

        // Name
        ctx.fillStyle = car.color; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'left'
        ctx.fillText(car.name, barX, sy - 5)

        // Finish time
        if (car.finished) {
          ctx.fillStyle = '#ffeb3b'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'
          ctx.fillText(`${(car.finishTimeMs / 1000).toFixed(3)}s @ ${car.finishSpeedMph.toFixed(0)}mph`, W / 2, sy + CAR_H / 2 + 4)
        }
      })

      // Particles (tire smoke)
      for (const p of st.particles) {
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = '#999'
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1

      // Countdown / traffic light
      if (st.phase === 'countdown' || (st.phase === 'racing' && st.raceTimeMs < 800)) {
        drawTrafficLight(ctx, st.countdownStep)
      }

      // Race timer
      ctx.fillStyle = '#eee'; ctx.font = '14px monospace'; ctx.textAlign = 'right'
      ctx.fillText(`Time: ${(st.raceTimeMs / 1000).toFixed(2)}s`, W - 15, 25)
      ctx.textAlign = 'left'
      ctx.fillText(`Race ${st.raceNumber}/${st.totalRaces}`, 15, 25)

      // Results overlay
      if (st.phase === 'results') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(W / 4, H / 4, W / 2, H / 2)
        ctx.fillStyle = '#fff'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center'
        ctx.fillText('🏁 RACE COMPLETE', W / 2, H / 4 + 35)
        const sorted = [...st.cars].sort((a, b) => a.finishTimeMs - b.finishTimeMs)
        sorted.forEach((car, i) => {
          ctx.fillStyle = car.color; ctx.font = '14px monospace'
          ctx.fillText(`${i + 1}. ${car.name} — ${(car.finishTimeMs / 1000).toFixed(3)}s (${car.finishSpeedMph.toFixed(0)}mph)`, W / 2, H / 4 + 70 + i * 24)
        })
        ctx.fillStyle = '#aaa'; ctx.font = '12px monospace'
        if (!st.gameOver) {
          ctx.fillText('Press Action to continue to garage', W / 2, H / 4 + H / 2 - 25)
        }
      }
    }

    function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, car: CarState, wheelieT: number, nosActive: boolean) {
      ctx.save()
      // Wheelie tilt
      if (wheelieT > 0) {
        const tilt = -0.12 * (wheelieT / 600)
        ctx.translate(x + CAR_W, y + CAR_H)
        ctx.rotate(tilt)
        ctx.translate(-(x + CAR_W), -(y + CAR_H))
      }
      // Body
      ctx.fillStyle = car.color
      ctx.fillRect(x, y, CAR_W, CAR_H)
      // Windshield
      ctx.fillStyle = '#222'
      ctx.fillRect(x + CAR_W - 15, y + 3, 10, CAR_H - 6)
      // Wheels
      ctx.fillStyle = '#111'
      ctx.beginPath(); ctx.arc(x + 12, y + CAR_H + 2, WHEEL_R, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + CAR_W - 12, y + CAR_H + 2, WHEEL_R, 0, Math.PI * 2); ctx.fill()
      // NOS flame
      if (nosActive) {
        ctx.fillStyle = '#ff6600'
        ctx.beginPath()
        ctx.moveTo(x, y + 6); ctx.lineTo(x - 14, y + CAR_H / 2); ctx.lineTo(x, y + CAR_H - 6)
        ctx.fill()
        ctx.fillStyle = '#ffcc00'
        ctx.beginPath()
        ctx.moveTo(x, y + 9); ctx.lineTo(x - 8, y + CAR_H / 2); ctx.lineTo(x, y + CAR_H - 9)
        ctx.fill()
      }
      ctx.restore()
    }

    function drawTrafficLight(ctx: CanvasRenderingContext2D, step: number) {
      const lx = W / 2 - 20, ly = 45, lw = 40, lh = 100, r = 12
      ctx.fillStyle = '#222'; ctx.fillRect(lx, ly, lw, lh)
      ctx.strokeStyle = '#444'; ctx.strokeRect(lx, ly, lw, lh)
      // Red 1
      ctx.fillStyle = step >= 3 ? '#e74c3c' : '#441111'; ctx.beginPath(); ctx.arc(lx + lw / 2, ly + 20, r, 0, Math.PI * 2); ctx.fill()
      // Red 2 / yellow
      ctx.fillStyle = step === 2 ? '#e74c3c' : step === 1 ? '#f1c40f' : '#443311'; ctx.beginPath(); ctx.arc(lx + lw / 2, ly + 50, r, 0, Math.PI * 2); ctx.fill()
      // Green
      ctx.fillStyle = step <= 0 ? '#2ecc71' : '#114411'; ctx.beginPath(); ctx.arc(lx + lw / 2, ly + 80, r, 0, Math.PI * 2); ctx.fill()
    }

    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  // Phase-trigger effect — render loop restarts only on phase change; reads from stRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── Next race / restart ────────────────────────────────────
  const handleNextRace = useCallback(() => {
    const st = stRef.current
    if (st.gameOver) return
    st.raceNumber++
    st.cars.forEach(c => resetCarRace(c))
    st.phase = 'garage'; st.particles = []
    setPhase('garage')
    forceRender(n => n + 1)
  }, [])

  const handleRestart = useCallback(() => {
    stRef.current = initState()
    setPhase('garage'); setGameOver(false); setWinner(null)
    forceRender(n => n + 1)
  }, [initState])

  // Results-phase key handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const st = stRef.current
      if (st.phase === 'results') {
        if (e.key === ' ' || e.key === 'Enter') {
          if (st.gameOver) handleRestart()
          else handleNextRace()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleRestart, handleNextRace])

  return (
    <div className={styles.container}>
      {/* HUD scoreboard */}
      <div className={styles.scoreboard}>
        {stRef.current.cars.map(c => (
          <div key={c.playerIndex} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: c.color }} />
            <span>{c.name}</span>
            <span className={styles.scoreValue}>💰{c.coins} 💎{c.gems} ⭐{c.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas} width={W} height={H}  role="img" aria-label="Drag Racing canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
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
