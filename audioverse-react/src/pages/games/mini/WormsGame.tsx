/**
 * WormsGame — real-time Worms-inspired artillery/action game for 1-4 players.
 *
 * All players move simultaneously (NOT turn-based). Weapons have cooldowns.
 * Destructible terrain, gravity, projectile physics, explosions.
 *
 * Controls:
 *   Group 0: A/D move, W jump, Q/E aim, Space shoot, Tab switch worm
 *   Group 1: Arrows move, Up jump, Shift/Ctrl aim, Enter shoot, / switch worm
 *   Gamepad: left stick move, A jump, X shoot, right stick aim, Y switch worm
 *
 * Currencies: coins (damage dealt), gems (kills), stars (wins).
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
const GRAVITY = 0.25
const WORM_R = 8
const MOVE_SPEED = 2
const JUMP_VY = -5.5
const PROJ_SPEED = 7
const PROJ_R = 3
const EXPLODE_R = 28
const EXPLODE_DMG = 35
const COOLDOWN_MS = 1000
const TICK_MS = 16 // ~60fps
const AI_SHOOT_INTERVAL = 2000
const AI_WAVE_INTERVAL = 8000
const TERRAIN_RES = 2 // each terrain cell = 2px

const TERRAIN_COLS = Math.ceil(W / TERRAIN_RES)
const TERRAIN_ROWS = Math.ceil(H / TERRAIN_RES)

// ─── Types ───────────────────────────────────────────────────
interface Worm {
  x: number; y: number; vx: number; vy: number
  hp: number; maxHp: number; alive: boolean
  teamIndex: number; grounded: boolean
}

interface Projectile {
  x: number; y: number; vx: number; vy: number
  teamIndex: number
}

interface Team {
  worms: Worm[]
  activeIdx: number
  aimAngle: number // radians
  lastShot: number
  color: string
  name: string
  playerIndex: number
  input: PlayerSlot['input']
  kills: number
  damageDealt: number
  isAI: boolean
  aiTimer: number
}

interface GameState {
  terrain: boolean[][] // true = solid
  teams: Team[]
  projectiles: Projectile[]
  gameOver: boolean
  winner: number | null
  mode: string
  coopWave: number
  coopTimer: number
  tick: number
}

// ─── Terrain generation ──────────────────────────────────────
function generateTerrain(type: string): boolean[][] {
  const t: boolean[][] = Array.from({ length: TERRAIN_ROWS }, () => Array(TERRAIN_COLS).fill(false))
  const groundBase = Math.floor(TERRAIN_ROWS * 0.6)
  for (let col = 0; col < TERRAIN_COLS; col++) {
    let surface = groundBase
    if (type === 'hills') {
      surface = groundBase - Math.floor(
        Math.sin(col * 0.04) * 12 +
        Math.sin(col * 0.09) * 6 +
        Math.sin(col * 0.02) * 18
      )
    } else if (type === 'islands') {
      const island1 = col > TERRAIN_COLS * 0.1 && col < TERRAIN_COLS * 0.35
      const island2 = col > TERRAIN_COLS * 0.45 && col < TERRAIN_COLS * 0.55
      const island3 = col > TERRAIN_COLS * 0.65 && col < TERRAIN_COLS * 0.9
      if (!island1 && !island2 && !island3) { surface = TERRAIN_ROWS; }
      else { surface = groundBase - Math.floor(Math.sin(col * 0.06) * 10); }
    }
    for (let row = surface; row < TERRAIN_ROWS; row++) {
      t[row][col] = true
    }
  }
  return t
}

function terrainSurface(terrain: boolean[][], px: number): number {
  const col = Math.floor(px / TERRAIN_RES)
  if (col < 0 || col >= TERRAIN_COLS) return H
  for (let row = 0; row < TERRAIN_ROWS; row++) {
    if (terrain[row][col]) return row * TERRAIN_RES
  }
  return H
}

function isTerrainSolid(terrain: boolean[][], px: number, py: number): boolean {
  const col = Math.floor(px / TERRAIN_RES)
  const row = Math.floor(py / TERRAIN_RES)
  if (col < 0 || col >= TERRAIN_COLS || row < 0 || row >= TERRAIN_ROWS) return false
  return terrain[row][col]
}

function explodeTerrain(terrain: boolean[][], cx: number, cy: number, radius: number) {
  const r = Math.ceil(radius / TERRAIN_RES)
  const cc = Math.floor(cx / TERRAIN_RES)
  const cr = Math.floor(cy / TERRAIN_RES)
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= r * r) {
        const rr = cr + dy, rc = cc + dx
        if (rr >= 0 && rr < TERRAIN_ROWS && rc >= 0 && rc < TERRAIN_COLS) {
          terrain[rr][rc] = false
        }
      }
    }
  }
}

// ─── Spawn helpers ───────────────────────────────────────────
function spawnWorm(teamIndex: number, x: number, terrain: boolean[][]): Worm {
  const surface = terrainSurface(terrain, x)
  return { x, y: surface - WORM_R - 1, vx: 0, vy: 0, hp: 100, maxHp: 100, alive: true, teamIndex, grounded: false }
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const mode = config.gameMode || 'real-time-battle'
  const terrainType = config.terrainType || 'hills'
  const wormsPerTeam = Number(config.wormsPerTeam) || 3
  const terrain = generateTerrain(terrainType)

  const teams: Team[] = players.map((p, i) => {
    const startX = (W / (players.length + 1)) * (i + 1)
    const worms: Worm[] = []
    for (let w = 0; w < wormsPerTeam; w++) {
      worms.push(spawnWorm(i, startX + (w - 1) * 30, terrain))
    }
    return {
      worms, activeIdx: 0, aimAngle: -Math.PI / 4,
      lastShot: 0, color: p.color || PLAYER_COLORS[p.index] || '#fff',
      name: p.name, playerIndex: p.index, input: p.input,
      kills: 0, damageDealt: 0, isAI: p.input.type === 'remote', aiTimer: 0,
    }
  })

  return {
    terrain, teams, projectiles: [], gameOver: false, winner: null,
    mode, coopWave: 0, coopTimer: 0, tick: 0,
  }
}

// ─── Input state ─────────────────────────────────────────────
interface InputMap { left: boolean; right: boolean; jump: boolean; shoot: boolean; aimUp: boolean; aimDown: boolean; switchWorm: boolean }
const emptyInput = (): InputMap => ({ left: false, right: false, jump: false, shoot: false, aimUp: false, aimDown: false, switchWorm: false })

// ─── Component ───────────────────────────────────────────────
interface Props { players: PlayerSlot[]; config?: GameConfig; onBack: () => void }

export default function WormsGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const inputsRef = useRef<Map<number, InputMap>>(new Map())
  const keysRef = useRef<Set<string>>(new Set())
  const [scoreboard, setScoreboard] = useState<{ idx: number; name: string; color: string; hp: number; kills: number; alive: boolean }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [currencies, setCurrencies] = useState<{ coins: number; gems: number; stars: number }>({ coins: 0, gems: 0, stars: 0 })
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // --- Key tracking ---
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keysRef.current.add(e.key)
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // --- Build per-team input from keys + gamepads ---
  function pollInputs() {
    const keys = keysRef.current
    const padSnaps = padsRef.current
    const map = new Map<number, InputMap>()

    for (const team of stateRef.current.teams) {
      const inp = emptyInput()
      if (team.input.type === 'keyboard') {
        const g = (team.input as { type: 'keyboard'; group: number }).group
        if (g === 0) {
          inp.left = keys.has('a') || keys.has('A')
          inp.right = keys.has('d') || keys.has('D')
          inp.jump = keys.has('w') || keys.has('W')
          inp.shoot = keys.has(' ')
          inp.aimUp = keys.has('q') || keys.has('Q')
          inp.aimDown = keys.has('e') || keys.has('E')
          inp.switchWorm = keys.has('Tab')
        } else if (g === 1) {
          inp.left = keys.has('ArrowLeft')
          inp.right = keys.has('ArrowRight')
          inp.jump = keys.has('ArrowUp')
          inp.shoot = keys.has('Enter')
          inp.aimUp = keys.has('Shift')
          inp.aimDown = keys.has('Control')
          inp.switchWorm = keys.has('/')
        }
      } else if (team.input.type === 'gamepad') {
        const pi = (team.input as { type: 'gamepad'; padIndex: number }).padIndex
        const gp = padSnaps.find(p => p.index === pi)
        if (gp) {
          inp.left = gp.left
          inp.right = gp.right
          inp.jump = gp.a
          inp.shoot = gp.x
          inp.switchWorm = gp.y
          // Right stick for aim via raw gamepad axes
          const raw = navigator.getGamepads?.()?.[pi]
          if (raw && raw.axes.length >= 4) {
            inp.aimUp = raw.axes[3] < -0.4
            inp.aimDown = raw.axes[3] > 0.4
          }
        }
      }
      map.set(team.playerIndex, inp)
    }
    inputsRef.current = map
  }

  // --- Consume one-shot keys (switch worm, shoot edge) ---
  const prevShoot = useRef<Map<number, boolean>>(new Map())
  const prevSwitch = useRef<Map<number, boolean>>(new Map())

  function isEdge(map: React.RefObject<Map<number, boolean>>, idx: number, cur: boolean): boolean {
    const prev = map.current?.get(idx) ?? false
    map.current?.set(idx, cur)
    return cur && !prev
  }

  // --- Game loop ---
  useEffect(() => {
    function tick() {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return
      const now = performance.now()
      st.tick++

      pollInputs()

      // ── Update each team ──
      for (const team of st.teams) {
        if (team.worms.every(w => !w.alive)) continue
        const inp = inputsRef.current.get(team.playerIndex) ?? emptyInput()

        // AI input override for coop bots
        if (team.isAI) {
          team.aiTimer += TICK_MS
          const active = team.worms[team.activeIdx]
          if (active?.alive) {
            // Simple AI: walk randomly, shoot periodically
            inp.left = Math.sin(st.tick * 0.02 + team.playerIndex) > 0.3
            inp.right = Math.sin(st.tick * 0.02 + team.playerIndex) < -0.3
            if (team.aiTimer > AI_SHOOT_INTERVAL) { inp.shoot = true; team.aiTimer = 0 }
          }
        }

        // Aim adjustment
        if (inp.aimUp) team.aimAngle = Math.max(team.aimAngle - 0.04, -Math.PI * 0.9)
        if (inp.aimDown) team.aimAngle = Math.min(team.aimAngle + 0.04, Math.PI * 0.1)

        // Switch active worm (edge-triggered)
        if (isEdge(prevSwitch, team.playerIndex, inp.switchWorm)) {
          let next = (team.activeIdx + 1) % team.worms.length
          let tries = team.worms.length
          while (!team.worms[next].alive && tries-- > 0) next = (next + 1) % team.worms.length
          team.activeIdx = next
        }

        const worm = team.worms[team.activeIdx]
        if (!worm || !worm.alive) continue

        // Horizontal movement
        if (inp.left) worm.vx = -MOVE_SPEED
        else if (inp.right) worm.vx = MOVE_SPEED
        else worm.vx *= 0.7

        // Jump
        if (inp.jump && worm.grounded) { worm.vy = JUMP_VY; worm.grounded = false }

        // Shoot (edge-triggered with cooldown)
        if (isEdge(prevShoot, team.playerIndex, inp.shoot || false) && now - team.lastShot >= COOLDOWN_MS) {
          team.lastShot = now
          st.projectiles.push({
            x: worm.x + Math.cos(team.aimAngle) * (WORM_R + 4),
            y: worm.y + Math.sin(team.aimAngle) * (WORM_R + 4),
            vx: Math.cos(team.aimAngle) * PROJ_SPEED,
            vy: Math.sin(team.aimAngle) * PROJ_SPEED,
            teamIndex: team.playerIndex,
          })
        }
      }

      // ── Physics for worms ──
      for (const team of st.teams) {
        for (const w of team.worms) {
          if (!w.alive) continue
          w.vy += GRAVITY
          w.x += w.vx; w.y += w.vy
          // Terrain collision
          w.grounded = false
          if (isTerrainSolid(st.terrain, w.x, w.y + WORM_R)) {
            // Push up
            while (isTerrainSolid(st.terrain, w.x, w.y + WORM_R) && w.y > 0) w.y -= 1
            w.vy = 0; w.grounded = true
          }
          // Side collisions
          if (isTerrainSolid(st.terrain, w.x - WORM_R, w.y)) w.x += 2
          if (isTerrainSolid(st.terrain, w.x + WORM_R, w.y)) w.x -= 2
          // Ceiling
          if (isTerrainSolid(st.terrain, w.x, w.y - WORM_R)) { w.y += 2; w.vy = Math.abs(w.vy) * 0.3 }
          // Out of bounds
          if (w.x < WORM_R) w.x = WORM_R
          if (w.x > W - WORM_R) w.x = W - WORM_R
          if (w.y > H + 50) { w.hp = 0; w.alive = false }
        }
      }

      // ── Projectile physics ──
      const expPositions: { x: number; y: number; teamIdx: number }[] = []
      st.projectiles = st.projectiles.filter(p => {
        p.vy += GRAVITY * 0.5
        p.x += p.vx; p.y += p.vy
        // Out of bounds
        if (p.x < 0 || p.x > W || p.y > H + 20) return false
        // Terrain hit
        if (isTerrainSolid(st.terrain, p.x, p.y)) {
          expPositions.push({ x: p.x, y: p.y, teamIdx: p.teamIndex })
          return false
        }
        // Worm hit (not own team)
        for (const team of st.teams) {
          for (const w of team.worms) {
            if (!w.alive) continue
            const dx = p.x - w.x, dy = p.y - w.y
            if (dx * dx + dy * dy < (WORM_R + PROJ_R) * (WORM_R + PROJ_R)) {
              expPositions.push({ x: p.x, y: p.y, teamIdx: p.teamIndex })
              return false
            }
          }
        }
        return true
      })

      // ── Explosions ──
      for (const exp of expPositions) {
        explodeTerrain(st.terrain, exp.x, exp.y, EXPLODE_R)
        // Damage nearby worms
        for (const team of st.teams) {
          for (const w of team.worms) {
            if (!w.alive) continue
            const dx = exp.x - w.x, dy = exp.y - w.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < EXPLODE_R * 1.5) {
              const dmg = Math.round(EXPLODE_DMG * (1 - dist / (EXPLODE_R * 1.5)))
              w.hp -= dmg
              // Knockback
              const angle = Math.atan2(dy, dx)
              w.vx -= Math.cos(angle) * 4
              w.vy -= Math.sin(angle) * 4
              // Track damage for shooter team
              const shooter = st.teams.find(t => t.playerIndex === exp.teamIdx)
              if (shooter && team.playerIndex !== exp.teamIdx) shooter.damageDealt += dmg
              if (w.hp <= 0) {
                w.hp = 0; w.alive = false
                if (shooter && team.playerIndex !== exp.teamIdx) shooter.kills++
              }
            }
          }
        }
      }

      // ── Coop wave spawning ──
      if (st.mode === 'coop-survival') {
        st.coopTimer += TICK_MS
        if (st.coopTimer >= AI_WAVE_INTERVAL) {
          st.coopTimer = 0; st.coopWave++
          const waveCount = 1 + st.coopWave
          const aiTeamIdx = 100 + st.coopWave
          const aiWorms: Worm[] = []
          for (let i = 0; i < waveCount; i++) {
            const ax = 50 + Math.random() * (W - 100)
            aiWorms.push({ x: ax, y: -20, vx: 0, vy: 0, hp: 60, maxHp: 60, alive: true, teamIndex: aiTeamIdx, grounded: false })
          }
          st.teams.push({
            worms: aiWorms, activeIdx: 0, aimAngle: Math.PI / 4,
            lastShot: 0, color: '#666', name: `Wave ${st.coopWave}`,
            playerIndex: aiTeamIdx, input: { type: 'remote', windowId: '' },
            kills: 0, damageDealt: 0, isAI: true, aiTimer: 0,
          })
        }
      }

      // ── Check game over ──
      const humanTeams = st.teams.filter(t => !t.isAI)
      const aliveHumans = humanTeams.filter(t => t.worms.some(w => w.alive))
      if (st.mode === 'coop-survival') {
        if (aliveHumans.length === 0) { st.gameOver = true; st.winner = null }
      } else {
        // VS: non-AI teams – last standing wins
        const aliveNonAI = st.teams.filter(t => !t.isAI && t.worms.some(w => w.alive))
        if (st.teams.filter(t => !t.isAI).length > 1 && aliveNonAI.length <= 1) {
          st.gameOver = true
          st.winner = aliveNonAI.length === 1 ? aliveNonAI[0].playerIndex : null
        } else if (st.teams.filter(t => !t.isAI).length === 1 && aliveNonAI.length === 0) {
          st.gameOver = true; st.winner = null
        }
      }

      // ── Update scoreboard ──
      const sb = st.teams.filter(t => !t.isAI).map(t => ({
        idx: t.playerIndex, name: t.name, color: t.color,
        hp: t.worms.reduce((s, w) => s + Math.max(0, w.hp), 0),
        kills: t.kills,
        alive: t.worms.some(w => w.alive),
      }))
      setScoreboard(sb)

      if (st.gameOver) {
        setGameOver(true)
        // Compute currencies
        let totalCoins = 0, totalGems = 0, totalStars = 0
        for (const team of humanTeams) {
          totalCoins += team.damageDealt
          totalGems += team.kills
        }
        if (st.winner != null) {
          const w = st.teams.find(t => t.playerIndex === st.winner)
          setWinner(w?.name ?? `Player ${(st.winner ?? 0) + 1}`)
          totalStars = 1
        }
        setCurrencies({ coins: totalCoins, gems: totalGems, stars: totalStars })
      }
    }

    const timerId = setInterval(tick, TICK_MS)
    return () => clearInterval(timerId)
    // Mount-only: game loop timer initialized once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Render ---
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current
      canvas.width = W; canvas.height = H

      // Sky
      ctx.fillStyle = '#0a0a2e'
      ctx.fillRect(0, 0, W, H)

      // Terrain
      for (let row = 0; row < TERRAIN_ROWS; row++) {
        for (let col = 0; col < TERRAIN_COLS; col++) {
          if (!st.terrain[row][col]) continue
          // Top few rows = grass green, rest = brown
          const surfRow = row * TERRAIN_RES
          ctx.fillStyle = surfRow < H * 0.65 ? '#3a7a3a' : '#6b4226'
          ctx.fillRect(col * TERRAIN_RES, row * TERRAIN_RES, TERRAIN_RES, TERRAIN_RES)
        }
      }

      // Projectiles
      ctx.fillStyle = '#ff0'
      for (const p of st.projectiles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, PROJ_R, 0, Math.PI * 2)
        ctx.fill()
      }

      // Worms
      for (const team of st.teams) {
        for (let i = 0; i < team.worms.length; i++) {
          const w = team.worms[i]
          if (!w.alive) continue
          const isActive = i === team.activeIdx && !team.isAI

          // Body
          ctx.fillStyle = team.color
          ctx.globalAlpha = isActive ? 1 : 0.7
          ctx.beginPath()
          ctx.arc(w.x, w.y, WORM_R, 0, Math.PI * 2)
          ctx.fill()

          // Active highlight ring
          if (isActive) {
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.beginPath()
            ctx.arc(w.x, w.y, WORM_R + 3, 0, Math.PI * 2)
            ctx.stroke()
          }

          // HP bar
          ctx.globalAlpha = 1
          const barW = 20, barH = 3
          const hpRatio = Math.max(0, w.hp / w.maxHp)
          ctx.fillStyle = '#333'
          ctx.fillRect(w.x - barW / 2, w.y - WORM_R - 8, barW, barH)
          ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f1c40f' : '#e74c3c'
          ctx.fillRect(w.x - barW / 2, w.y - WORM_R - 8, barW * hpRatio, barH)

          // Aim line for active non-AI worm
          if (isActive) {
            ctx.strokeStyle = 'rgba(255,255,255,0.5)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(w.x, w.y)
            ctx.lineTo(w.x + Math.cos(team.aimAngle) * 25, w.y + Math.sin(team.aimAngle) * 25)
            ctx.stroke()
          }
        }
      }

      // Cooldown indicators
      const now = performance.now()
      for (const team of st.teams) {
        if (team.isAI) continue
        const w = team.worms[team.activeIdx]
        if (!w?.alive) continue
        const cdLeft = Math.max(0, COOLDOWN_MS - (now - team.lastShot))
        if (cdLeft > 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.3)'
          ctx.fillRect(w.x - 10, w.y + WORM_R + 4, 20 * (cdLeft / COOLDOWN_MS), 2)
        }
      }

      // Border
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // --- Restart ---
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    prevShoot.current.clear()
    prevSwitch.current.clear()
    setGameOver(false)
    setWinner(null)
    setCurrencies({ coins: 0, gems: 0, stars: 0 })
    setScoreboard([])
  }, [players, config])

  // Keyboard restart
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
        {scoreboard.map(s => (
          <div key={s.idx} className={`${styles.scoreItem} ${!s.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span className={styles.scoreValue}>HP:{s.hp} K:{s.kills}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Worms canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          <p style={{ color: '#ccc', fontSize: 14 }}>
            🪙 {currencies.coins} coins &nbsp; 💎 {currencies.gems} gems &nbsp; ⭐ {currencies.stars} stars
          </p>
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
