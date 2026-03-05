/**
 * NoTimeToRelaxGame — life/vacation simulation for 1-4 couch players.
 *
 * Controls:
 *   Group 0: WASD + Space (interact)
 *   Group 1: Arrow keys + Enter (interact)
 * Gamepads: left stick move, A button interact.
 *
 * Rules:
 *  - Top-down vacation town with locations: Office, Beach, Restaurant, Gym, Home, Park
 *  - Each player manages Energy, Happiness, Money, Stress
 *  - Each location adjusts stats when a player is inside
 *  - VS: highest total happiness wins. Locations cap at 2 players.
 *  - Coop: reach collective happiness target together.
 *  - 3 currencies: coins (work), gems (happiness milestones), stars (vacation goals)
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
const H = 500
const PLAYER_R = 10
const MOVE_SPD = 3
const TICK_MS = 1000           // 1 real second = 1 game hour
const HOURS_PER_DAY = 24
const LOC_CAPACITY = 2         // max players per location in VS

// ─── Locations ───────────────────────────────────────────────
interface Location {
  id: string; label: string; x: number; y: number; w: number; h: number; color: string
}

const LOCATIONS: Location[] = [
  { id: 'office',     label: 'Office',     x: 30,  y: 30,  w: 120, h: 90,  color: '#888' },
  { id: 'beach',      label: 'Beach',      x: 200, y: 30,  w: 140, h: 90,  color: '#f0d9a0' },
  { id: 'restaurant', label: 'Restaurant', x: 400, y: 30,  w: 130, h: 90,  color: '#8B4513' },
  { id: 'gym',        label: 'Gym',        x: 580, y: 30,  w: 110, h: 90,  color: '#c0392b' },
  { id: 'home',       label: 'Home',       x: 30,  y: 340, w: 120, h: 90,  color: '#3498db' },
  { id: 'park',       label: 'Park',       x: 200, y: 340, w: 140, h: 90,  color: '#27ae60' },
]

// ─── Stat effects per location (per game-hour tick) ──────────
const EFFECTS: Record<string, { energy: number; happiness: number; money: number; stress: number }> = {
  office:     { energy: -2,  happiness: -1, money: 30,  stress: 5  },
  beach:      { energy: -1,  happiness: 4,  money: 0,   stress: -4 },
  restaurant: { energy: 5,   happiness: 3,  money: -15, stress: -1 },
  gym:        { energy: -3,  happiness: 3,  money: 0,   stress: -5 },
  home:       { energy: 8,   happiness: -2, money: 0,   stress: -1 },
  park:       { energy: 0,   happiness: 4,  money: 0,   stress: -3 },
}

// ─── KB mappings ─────────────────────────────────────────────
const KB_MOVE: Record<string, { group: number; dx: number; dy: number }> = {
  w: { group: 0, dx: 0, dy: -1 }, a: { group: 0, dx: -1, dy: 0 },
  s: { group: 0, dx: 0, dy: 1 },  d: { group: 0, dx: 1, dy: 0 },
  ArrowUp: { group: 1, dx: 0, dy: -1 }, ArrowLeft: { group: 1, dx: -1, dy: 0 },
  ArrowDown: { group: 1, dx: 0, dy: 1 }, ArrowRight: { group: 1, dx: 1, dy: 0 },
}
const KB_ACTION: Record<string, number> = { ' ': 0, Enter: 1 }

// ─── Player state ────────────────────────────────────────────
interface PState {
  x: number; y: number; energy: number; happiness: number; money: number; stress: number
  coins: number; gems: number; stars: number
  insideLoc: string | null; color: string; name: string; idx: number
  input: PlayerSlot['input']; totalHappiness: number
  happinessMilestone: number; vacGoals: number
}

interface GState {
  players: PState[]; hour: number; day: number; totalHours: number
  maxHours: number; gameOver: boolean; mode: string; coopTarget: number
}

// ─── Helpers ─────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }

function spawnPos(idx: number): { x: number; y: number } {
  const positions = [
    { x: 400, y: 250 }, { x: 450, y: 280 },
    { x: 350, y: 280 }, { x: 400, y: 310 },
  ]
  return positions[idx % positions.length]
}

function initPlayer(p: PlayerSlot, idx: number): PState {
  const pos = spawnPos(idx)
  return {
    x: pos.x, y: pos.y, energy: 80, happiness: 50, money: 100, stress: 10,
    coins: 0, gems: 0, stars: 0,
    insideLoc: null, color: p.color || PLAYER_COLORS[p.index] || '#fff',
    name: p.name, idx: p.index, input: p.input, totalHappiness: 0,
    happinessMilestone: 50, vacGoals: 0,
  }
}

function insideLocation(px: number, py: number): string | null {
  for (const loc of LOCATIONS) {
    if (px >= loc.x && px <= loc.x + loc.w && py >= loc.y && py <= loc.y + loc.h) return loc.id
  }
  return null
}

function countInLoc(players: PState[], locId: string, exclude: number): number {
  return players.filter(p => p.insideLoc === locId && p.idx !== exclude).length
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function NoTimeToRelaxGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const actionRef = useRef<Set<number>>(new Set())    // groups that just pressed action

  const mode = config?.gameMode ?? 'competitive'
  const durationMin = Number(config?.gameDuration ?? 5)
  const season = config?.season ?? 'summer'
  const maxHours = durationMin * 60  // each second = 1 game hour

  const stateRef = useRef<GState>({
    players: players.map((p, i) => initPlayer(p, i)),
    hour: 8, day: 1, totalHours: 0, maxHours,
    gameOver: false, mode,
    coopTarget: players.length * 400,
  })

  const [hud, setHud] = useState({ day: 1, hour: 8, players: stateRef.current.players.map(hudSnap) })
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)

  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  function hudSnap(p: PState) {
    return { name: p.name, color: p.color, energy: p.energy, happiness: p.happiness,
      money: p.money, stress: p.stress, coins: p.coins, gems: p.gems, stars: p.stars,
      totalHappiness: p.totalHappiness }
  }

  // ─── Keyboard input ─────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key in KB_ACTION) actionRef.current.add(KB_ACTION[e.key])
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // ─── Bot AI ──────────────────────────────────
  function botTick(p: PState, st: GState) {
    // Simple AI: pick a location based on lowest stat
    let target: Location | null = null
    if (p.energy < 25) target = LOCATIONS.find(l => l.id === 'home')!
    else if (p.stress > 70) target = LOCATIONS.find(l => l.id === 'park')!
    else if (p.money < 50) target = LOCATIONS.find(l => l.id === 'office')!
    else if (p.happiness < 40) target = LOCATIONS.find(l => l.id === 'beach')!
    else if (p.energy < 50) target = LOCATIONS.find(l => l.id === 'restaurant')!
    else target = LOCATIONS.find(l => l.id === 'gym')!

    if (!target) return

    // Check capacity in VS
    if (st.mode === 'competitive' && countInLoc(st.players, target.id, p.idx) >= LOC_CAPACITY) {
      target = LOCATIONS.find(l => countInLoc(st.players, l.id, p.idx) < LOC_CAPACITY) || target
    }

    const cx = target.x + target.w / 2
    const cy = target.y + target.h / 2
    const dx = cx - p.x
    const dy = cy - p.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 5) {
      p.x += (dx / dist) * MOVE_SPD
      p.y += (dy / dist) * MOVE_SPD
    }
    // Enter location if on it
    const loc = insideLocation(p.x, p.y)
    if (loc && loc === target.id) p.insideLoc = loc
    else p.insideLoc = null
  }

  // ─── Movement loop (60fps) ──────────────────
  useEffect(() => {
    let raf = 0
    function frame() {
      if (pauseRef.current || stateRef.current.gameOver) { raf = requestAnimationFrame(frame); return }
      const st = stateRef.current
      const keys = keysRef.current
      const currentPads = padsRef.current
      const acts = actionRef.current

      for (const p of st.players) {
        // Bot movement
        if (p.input.type === 'keyboard' && p.input.group === undefined) { botTick(p, st); continue }
        if (p.input.type !== 'keyboard' && p.input.type !== 'gamepad') { botTick(p, st); continue }

        let dx = 0, dy = 0, acted = false

        if (p.input.type === 'keyboard') {
          const g = (p.input as { type: 'keyboard'; group: number }).group
          for (const [key, m] of Object.entries(KB_MOVE)) {
            if (m.group === g && keys.has(key)) { dx += m.dx; dy += m.dy }
          }
          if (acts.has(g)) acted = true
        } else {
          const gi = (p.input as { type: 'gamepad'; padIndex: number }).padIndex
          const gp = currentPads.find(pad => pad.index === gi)
          if (gp) {
            if (gp.up) dy = -1; if (gp.down) dy = 1
            if (gp.left) dx = -1; if (gp.right) dx = 1
            if (gp.a) acted = true
          }
        }

        if (dx || dy) {
          const len = Math.sqrt(dx * dx + dy * dy)
          p.x = clamp(p.x + (dx / len) * MOVE_SPD, PLAYER_R, W - PLAYER_R)
          p.y = clamp(p.y + (dy / len) * MOVE_SPD, PLAYER_R, H - PLAYER_R)
        }

        // Interact / enter location
        const loc = insideLocation(p.x, p.y)
        if (acted && loc) {
          if (st.mode !== 'competitive' || countInLoc(st.players, loc, p.idx) < LOC_CAPACITY) {
            p.insideLoc = loc
          }
        } else if (!loc) {
          p.insideLoc = null
        }

        // forced home if energy 0
        if (p.energy <= 0) {
          const home = LOCATIONS.find(l => l.id === 'home')!
          p.x = home.x + home.w / 2; p.y = home.y + home.h / 2
          p.insideLoc = 'home'
        }
      }

      acts.clear()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ─── Game hour tick ─────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return

      st.totalHours++
      st.hour++
      if (st.hour >= HOURS_PER_DAY) { st.hour = 0; st.day++ }

      // Apply location effects
      for (const p of st.players) {
        if (p.insideLoc && EFFECTS[p.insideLoc]) {
          const e = EFFECTS[p.insideLoc]
          p.energy    = clamp(p.energy + e.energy, 0, 100)
          p.happiness = clamp(p.happiness + e.happiness, 0, 100)
          p.money     = clamp(p.money + e.money, 0, 9999)
          p.stress    = clamp(p.stress + e.stress, 0, 100)
          if (e.money > 0) p.coins += e.money
        }
        // Stress penalty
        if (p.stress >= 100) p.happiness = clamp(p.happiness - 3, 0, 100)
        // Accumulate total happiness
        p.totalHappiness += Math.max(0, p.happiness - 30)
        // Gems: happiness milestones
        if (p.totalHappiness >= p.happinessMilestone) {
          p.gems++
          p.happinessMilestone += 100
        }
        // Stars: vacation goals (beach + park combo with happiness > 60)
        if ((p.insideLoc === 'beach' || p.insideLoc === 'park') && p.happiness > 60 && p.stress < 30) {
          p.vacGoals++
          if (p.vacGoals % 10 === 0) p.stars++
        }
      }

      // Check game over
      if (st.totalHours >= st.maxHours) {
        st.gameOver = true
        setGameOver(true)
        if (st.mode === 'coop') {
          const totalH = st.players.reduce((s, p) => s + p.totalHappiness, 0)
          setWinner(totalH >= st.coopTarget ? 'Team wins!' : 'Team fell short...')
        } else {
          const best = st.players.reduce((a, b) => a.totalHappiness > b.totalHappiness ? a : b)
          setWinner(best.name)
        }
      }

      setHud({ day: st.day, hour: st.hour, players: st.players.map(hudSnap) })
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  // ─── Canvas render ──────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const cvs = canvasRef.current
      if (!cvs) { raf = requestAnimationFrame(draw); return }
      const ctx = cvs.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      cvs.width = W; cvs.height = H

      // Sky colour based on time of day & season
      const nightFactor = st.hour >= 20 || st.hour < 6 ? 0.3 : st.hour >= 18 ? 0.6 : 1
      const seasonBase = season === 'winter' ? '#b0c4de' : season === 'spring' ? '#98fb98' : '#87ceeb'
      ctx.fillStyle = seasonBase
      ctx.globalAlpha = nightFactor
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1
      // Dark overlay at night
      if (nightFactor < 1) {
        ctx.fillStyle = '#000'
        ctx.globalAlpha = 1 - nightFactor
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 1
      }

      // Ground
      ctx.fillStyle = '#3a5a28'
      ctx.globalAlpha = 0.3
      ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 1

      // Roads (simple cross)
      ctx.fillStyle = '#555'
      ctx.fillRect(0, H / 2 - 15, W, 30)
      ctx.fillRect(W / 2 - 15, 0, 30, H)

      // Locations
      for (const loc of LOCATIONS) {
        ctx.fillStyle = loc.color
        ctx.fillRect(loc.x, loc.y, loc.w, loc.h)
        ctx.strokeStyle = '#222'
        ctx.lineWidth = 2
        ctx.strokeRect(loc.x, loc.y, loc.w, loc.h)
        ctx.fillStyle = '#fff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(loc.label, loc.x + loc.w / 2, loc.y + loc.h / 2 + 4)
        // Capacity indicator in VS
        if (st.mode === 'competitive') {
          const cnt = st.players.filter(p => p.insideLoc === loc.id).length
          ctx.font = '10px sans-serif'
          ctx.fillStyle = cnt >= LOC_CAPACITY ? '#e74c3c' : '#aaa'
          ctx.fillText(`${cnt}/${LOC_CAPACITY}`, loc.x + loc.w / 2, loc.y + loc.h - 8)
        }
      }

      // Players
      for (const p of st.players) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, PLAYER_R, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        // Name tag
        ctx.fillStyle = '#fff'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(p.name, p.x, p.y - PLAYER_R - 4)
        // Small stat bars above player
        const bw = 24, bh = 3, bx = p.x - bw / 2, by = p.y - PLAYER_R - 16
        // energy bar (green)
        ctx.fillStyle = '#555'; ctx.fillRect(bx, by, bw, bh)
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(bx, by, bw * (p.energy / 100), bh)
        // happiness bar (yellow)
        ctx.fillStyle = '#555'; ctx.fillRect(bx, by - 5, bw, bh)
        ctx.fillStyle = '#f1c40f'; ctx.fillRect(bx, by - 5, bw * (p.happiness / 100), bh)
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [season])

  // ─── Restart ────────────────────────────────
  const handleRestart = useCallback(() => {
    const st = stateRef.current
    const fresh = players.map((p, i) => initPlayer(p, i))
    st.players = fresh; st.hour = 8; st.day = 1; st.totalHours = 0; st.gameOver = false
    setGameOver(false); setWinner(null)
    setHud({ day: 1, hour: 8, players: fresh.map(hudSnap) })
  }, [players])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  // ─── Time display helper ───────────────────
  const timeStr = `${String(hud.hour).padStart(2, '0')}:00`
  const remaining = Math.max(0, maxHours - stateRef.current.totalHours)
  const remMin = Math.floor(remaining / 60)
  const remSec = remaining % 60

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.scoreboard}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 'bold' }}>Day {hud.day}</span>
          <span>{timeStr}</span>
          <span style={{ color: '#f39c12' }}>⏱ {remMin}:{String(remSec).padStart(2, '0')}</span>
        </div>
        {hud.players.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, fontSize: 11 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: p.color }} />
            <span style={{ width: 60, fontWeight: 600 }}>{p.name}</span>
            <StatBar label="E" value={p.energy} max={100} color="#2ecc71" />
            <StatBar label="H" value={p.happiness} max={100} color="#f1c40f" />
            <StatBar label="$" value={p.money} max={1000} color="#3498db" />
            <StatBar label="S" value={p.stress} max={100} color="#e74c3c" />
            <span title="Coins" style={{ color: '#f1c40f' }}>🪙{p.coins}</span>
            <span title="Gems" style={{ color: '#e91e63' }}>💎{p.gems}</span>
            <span title="Stars" style={{ color: '#fff' }}>⭐{p.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="No Time To Relax canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && (
            <p className={styles.winnerText}>
              {mode === 'coop' ? winner : `🏆 ${winner} ${t('miniGames.wins', 'wins')}!`}
            </p>
          )}
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            {hud.players.map((p, i) => (
              <div key={i} style={{ color: p.color }}>
                {p.name}: Total Happiness {p.totalHappiness} | 🪙{p.coins} 💎{p.gems} ⭐{p.stars}
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
          <p className={styles.overlayHint}>
            {t('miniGames.pressRestart', 'Press Space or Enter to restart')}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Stat bar sub-component ──────────────────────────────────
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span style={{ fontSize: 9, color: '#aaa' }}>{label}</span>
      <span style={{ width: 36, height: 6, background: '#333', borderRadius: 3, display: 'inline-block', position: 'relative' }}>
        <span style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, display: 'block' }} />
      </span>
    </span>
  )
}
