/**
 * SimCityGame — top-down city builder for 1-4 players.
 *
 * Controls:
 *   Group 0: W/A/S/D (move), Space (build), E (cycle tool), Q (demolish)
 *   Group 1: Arrows (move), Enter (build), Shift (cycle tool), Ctrl (demolish)
 *   Gamepad: D-pad/stick (move), A (build), X (cycle tool), Y (demolish)
 *
 * Rules:
 *  - Build residential, commercial, industrial, road, park & power zones.
 *  - Residential generates population (needs road + commercial nearby).
 *  - Commercial generates revenue (coins). Industrial generates jobs.
 *  - Power plants power all zones within 5 tiles.
 *  - Disasters strike every ~60s: fire (destroys a building), traffic (reduces revenue).
 *  - 3 currencies: coins (tax revenue), gems (milestones), stars (population goals).
 *  - VS: separate grids, highest population wins. Coop: shared grid, reach target together.
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
const TILE = 40
const COLS = 20
const ROWS = 15
const W = COLS * TILE  // 800
const H = ROWS * TILE  // 600
const GAME_DURATION_S = 300 // 5 minutes default
const TICK_MS = 500
const DISASTER_INTERVAL_S = 60
const POWER_RANGE = 5

// ─── Tile types ──────────────────────────────────────────────
const EMPTY = 0
const RESIDENTIAL = 1
const COMMERCIAL = 2
const INDUSTRIAL = 3
const ROAD = 4
const PARK = 5
const POWER = 6
const WATER = 7 // cosmetic / natural

type TileType = typeof EMPTY | typeof RESIDENTIAL | typeof COMMERCIAL
  | typeof INDUSTRIAL | typeof ROAD | typeof PARK | typeof POWER | typeof WATER

const ZONE_NAMES: Record<number, string> = {
  [RESIDENTIAL]: 'Residential',
  [COMMERCIAL]: 'Commercial',
  [INDUSTRIAL]: 'Industrial',
  [ROAD]: 'Road',
  [PARK]: 'Park',
  [POWER]: 'Power Plant',
}

const ZONE_COLORS: Record<number, string> = {
  [EMPTY]: '#4a7a3a',       // green grass
  [RESIDENTIAL]: '#3498db', // blue
  [COMMERCIAL]: '#f1c40f',  // yellow
  [INDUSTRIAL]: '#7f8c8d',  // gray
  [ROAD]: '#34495e',        // dark gray
  [PARK]: '#2ecc71',        // bright green
  [POWER]: '#e67e22',       // orange
  [WATER]: '#00bcd4',       // cyan
}

const BUILDABLE_ZONES: TileType[] = [RESIDENTIAL, COMMERCIAL, INDUSTRIAL, ROAD, PARK, POWER]
const BUILD_COST: Record<number, number> = {
  [RESIDENTIAL]: 50,
  [COMMERCIAL]: 80,
  [INDUSTRIAL]: 70,
  [ROAD]: 10,
  [PARK]: 30,
  [POWER]: 200,
}

// ─── Keyboard mappings ──────────────────────────────────────
interface ActionMap { group: number; action: 'up' | 'down' | 'left' | 'right' | 'build' | 'cycle' | 'demolish' }
const KEY_MAP = new Map<string, ActionMap>([
  // Group 0 — WASD + Space/E/Q
  ['w', { group: 0, action: 'up' }],
  ['a', { group: 0, action: 'left' }],
  ['s', { group: 0, action: 'down' }],
  ['d', { group: 0, action: 'right' }],
  [' ', { group: 0, action: 'build' }],
  ['e', { group: 0, action: 'cycle' }],
  ['q', { group: 0, action: 'demolish' }],
  // Group 1 — Arrows + Enter/Shift/Control
  ['ArrowUp', { group: 1, action: 'up' }],
  ['ArrowDown', { group: 1, action: 'down' }],
  ['ArrowLeft', { group: 1, action: 'left' }],
  ['ArrowRight', { group: 1, action: 'right' }],
  ['Enter', { group: 1, action: 'build' }],
  ['Shift', { group: 1, action: 'cycle' }],
  ['Control', { group: 1, action: 'demolish' }],
])

// ─── Types ───────────────────────────────────────────────────
interface Cursor {
  x: number
  y: number
  tool: number       // index into BUILDABLE_ZONES
  color: string
  playerIndex: number
  input: PlayerSlot['input']
}

interface CityGrid {
  tiles: TileType[][]
  owner: (number | null)[][] // playerIndex who placed it
  overlay: (string | null)[][] // fire/pollution overlay color
}

interface PlayerStats {
  index: number
  name: string
  color: string
  coins: number
  gems: number
  stars: number
  population: number
  buildings: number
}

interface Disaster {
  type: 'fire' | 'traffic'
  x: number
  y: number
  timer: number  // ticks remaining
}

interface GameState {
  grids: CityGrid[]        // 1 for coop, N for vs
  cursors: Cursor[]
  stats: PlayerStats[]
  disasters: Disaster[]
  timer: number             // seconds remaining
  gameOver: boolean
  winner: number | null
  tickCount: number
  disasterCooldown: number
  mode: 'free-build' | 'vs-mayor' | 'coop-city'
  popTarget: number
}

// ─── Helpers ─────────────────────────────────────────────────
function createGrid(): CityGrid {
  const tiles: TileType[][] = []
  const owner: (number | null)[][] = []
  const overlay: (string | null)[][] = []
  for (let y = 0; y < ROWS; y++) {
    tiles.push(Array(COLS).fill(EMPTY))
    owner.push(Array(COLS).fill(null))
    overlay.push(Array(COLS).fill(null))
  }
  // Sprinkle a few water tiles
  for (let i = 0; i < 5; i++) {
    const wx = Math.floor(Math.random() * COLS)
    const wy = Math.floor(Math.random() * ROWS)
    tiles[wy][wx] = WATER
  }
  return { tiles, owner, overlay }
}

function adjacentTiles(x: number, y: number): { x: number; y: number }[] {
  const a: { x: number; y: number }[] = []
  if (x > 0) a.push({ x: x - 1, y })
  if (x < COLS - 1) a.push({ x: x + 1, y })
  if (y > 0) a.push({ x, y: y - 1 })
  if (y < ROWS - 1) a.push({ x, y: y + 1 })
  return a
}

function tilesInRange(cx: number, cy: number, range: number): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = []
  for (let dy = -range; dy <= range; dy++) {
    for (let dx = -range; dx <= range; dx++) {
      const nx = cx + dx
      const ny = cy + dy
      if (nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS) {
        if (Math.abs(dx) + Math.abs(dy) <= range) {
          result.push({ x: nx, y: ny })
        }
      }
    }
  }
  return result
}

function isPowered(grid: CityGrid, x: number, y: number): boolean {
  for (let py = 0; py < ROWS; py++) {
    for (let px = 0; px < COLS; px++) {
      if (grid.tiles[py][px] === POWER) {
        if (Math.abs(px - x) + Math.abs(py - y) <= POWER_RANGE) return true
      }
    }
  }
  return false
}

function calcPopulation(grid: CityGrid): number {
  let pop = 0
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid.tiles[y][x] !== RESIDENTIAL) continue
      if (!isPowered(grid, x, y)) continue
      const adj = adjacentTiles(x, y)
      const hasRoad = adj.some(a => grid.tiles[a.y][a.x] === ROAD)
      if (!hasRoad) continue
      let boost = 1
      const nearby = tilesInRange(x, y, 3)
      for (const n of nearby) {
        if (grid.tiles[n.y][n.x] === COMMERCIAL) boost += 0.3
        if (grid.tiles[n.y][n.x] === PARK) boost += 0.5
        if (grid.tiles[n.y][n.x] === ROAD) boost += 0.1
      }
      pop += Math.floor(10 * boost)
    }
  }
  return pop
}

function calcRevenue(grid: CityGrid, population: number): number {
  let rev = 0
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (grid.tiles[y][x] !== COMMERCIAL) continue
      if (!isPowered(grid, x, y)) continue
      rev += Math.floor(5 + population * 0.02)
    }
  }
  return rev
}

function initState(players: PlayerSlot[], config?: GameConfig): GameState {
  const mode = (config?.gameMode as GameState['mode']) ?? 'free-build'
  const duration = (config?.gameDuration as number) ?? GAME_DURATION_S
  const isVs = mode === 'vs-mayor'

  const grids: CityGrid[] = isVs ? players.map(() => createGrid()) : [createGrid()]
  const cursors: Cursor[] = players.map((p, _i) => ({
    x: Math.floor(COLS / 2),
    y: Math.floor(ROWS / 2),
    tool: 0,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    playerIndex: p.index,
    input: p.input,
  }))
  const stats: PlayerStats[] = players.map(p => ({
    index: p.index,
    name: p.name,
    color: p.color || PLAYER_COLORS[p.index] || '#fff',
    coins: 500,
    gems: 0,
    stars: 0,
    population: 0,
    buildings: 0,
  }))

  return {
    grids,
    cursors,
    stats,
    disasters: [],
    timer: duration,
    gameOver: false,
    winner: null,
    tickCount: 0,
    disasterCooldown: DISASTER_INTERVAL_S * (1000 / TICK_MS),
    mode,
    popTarget: 500,
  }
}

// ─── Milestone / star thresholds ─────────────────────────────
const GEM_MILESTONES = [50, 150, 300, 500, 800]
const STAR_THRESHOLDS = [100, 250, 500]

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function SimCityGame({ players, config, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState<PlayerStats[]>([])
  const [timer, setTimer] = useState(stateRef.current.timer)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // Track key-down edges for action keys
  const keysDown = useRef(new Set<string>())

  // ── Keyboard input ────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mapped = KEY_MAP.get(e.key)
      if (!mapped) return
      e.preventDefault()
      if (keysDown.current.has(e.key)) return // prevent repeat
      keysDown.current.add(e.key)

      const st = stateRef.current
      if (st.gameOver) return

      for (const cur of st.cursors) {
        if (cur.input.type !== 'keyboard') continue
        if (cur.input.group !== mapped.group) continue
        handleAction(st, cur, mapped.action)
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      keysDown.current.delete(e.key)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  // ── Gamepad polling ───────────────────────────────────────
  const padPrev = useRef<Map<number, { a: boolean; x: boolean; y: boolean; up: boolean; down: boolean; left: boolean; right: boolean }>>(new Map())

  useEffect(() => {
    let raf = 0
    function poll() {
      const st = stateRef.current
      if (st.gameOver) { raf = requestAnimationFrame(poll); return }
      const current = padsRef.current
      for (const cur of st.cursors) {
        if (cur.input.type !== 'gamepad') continue
        const padIdx = (cur.input as { type: 'gamepad'; padIndex: number }).padIndex
        const gp = current.find(p => p.index === padIdx)
        if (!gp) continue
        const prev = padPrev.current.get(padIdx) ?? { a: false, x: false, y: false, up: false, down: false, left: false, right: false }

        // Movement edges
        if (gp.up && !prev.up) handleAction(st, cur, 'up')
        if (gp.down && !prev.down) handleAction(st, cur, 'down')
        if (gp.left && !prev.left) handleAction(st, cur, 'left')
        if (gp.right && !prev.right) handleAction(st, cur, 'right')
        // Button edges
        if (gp.a && !prev.a) handleAction(st, cur, 'build')
        if (gp.x && !prev.x) handleAction(st, cur, 'cycle')
        if (gp.y && !prev.y) handleAction(st, cur, 'demolish')

        padPrev.current.set(padIdx, { a: gp.a, x: gp.x, y: gp.y, up: gp.up, down: gp.down, left: gp.left, right: gp.right })
      }
      raf = requestAnimationFrame(poll)
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Action handler ────────────────────────────────────────
  function handleAction(st: GameState, cur: Cursor, action: string) {
    const gridIdx = st.mode === 'vs-mayor' ? st.cursors.indexOf(cur) : 0
    const grid = st.grids[gridIdx] ?? st.grids[0]
    const pStat = st.stats.find(s => s.index === cur.playerIndex)!

    switch (action) {
      case 'up':    cur.y = Math.max(0, cur.y - 1); break
      case 'down':  cur.y = Math.min(ROWS - 1, cur.y + 1); break
      case 'left':  cur.x = Math.max(0, cur.x - 1); break
      case 'right': cur.x = Math.min(COLS - 1, cur.x + 1); break
      case 'cycle':
        cur.tool = (cur.tool + 1) % BUILDABLE_ZONES.length
        break
      case 'build': {
        const tile = grid.tiles[cur.y][cur.x]
        if (tile !== EMPTY && tile !== ROAD) break
        const zone = BUILDABLE_ZONES[cur.tool]
        const cost = BUILD_COST[zone] ?? 50
        if (pStat.coins < cost) break
        if (tile === ROAD && zone === ROAD) break // already road
        pStat.coins -= cost
        grid.tiles[cur.y][cur.x] = zone
        grid.owner[cur.y][cur.x] = cur.playerIndex
        pStat.buildings++
        break
      }
      case 'demolish': {
        const tile = grid.tiles[cur.y][cur.x]
        if (tile === EMPTY || tile === WATER) break
        grid.tiles[cur.y][cur.x] = EMPTY
        grid.owner[cur.y][cur.x] = null
        grid.overlay[cur.y][cur.x] = null
        pStat.coins += 5 // small refund
        break
      }
    }
  }

  // ── Economy / disaster tick ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      if (pauseRef.current) return
      const st = stateRef.current
      if (st.gameOver) return

      st.tickCount++

      // Timer countdown (every 2 ticks = 1 second at 500ms tick)
      if (st.tickCount % 2 === 0) {
        st.timer--
        setTimer(st.timer)
      }

      // Per-grid economy
      for (let gi = 0; gi < st.grids.length; gi++) {
        const grid = st.grids[gi]
        const relevantStats = st.mode === 'vs-mayor'
          ? [st.stats[gi]]
          : st.stats

        for (const ps of relevantStats) {
          const pop = calcPopulation(grid)
          const rev = calcRevenue(grid, pop)
          ps.population = pop
          ps.coins += rev

          // Industrial pollution overlay
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              if (grid.tiles[y][x] === INDUSTRIAL) {
                for (const adj of adjacentTiles(x, y)) {
                  if (grid.tiles[adj.y][adj.x] === RESIDENTIAL && !grid.overlay[adj.y][adj.x]) {
                    grid.overlay[adj.y][adj.x] = 'rgba(80,80,40,0.35)'
                  }
                }
              }
            }
          }

          // Gem milestones
          const buildCount = ps.buildings
          const gemsEarned = GEM_MILESTONES.filter(m => buildCount >= m).length
          ps.gems = gemsEarned

          // Star thresholds
          const starsEarned = STAR_THRESHOLDS.filter(th => pop >= th).length
          ps.stars = starsEarned
        }
      }

      // Disasters
      st.disasterCooldown--
      if (st.disasterCooldown <= 0) {
        const disFreq = (config?.disasterFrequency as string) ?? 'low'
        if (disFreq !== 'none') {
          const gi = Math.floor(Math.random() * st.grids.length)
          const grid = st.grids[gi]
          const bx = Math.floor(Math.random() * COLS)
          const by = Math.floor(Math.random() * ROWS)
          if (Math.random() < 0.5 && grid.tiles[by][bx] > EMPTY && grid.tiles[by][bx] !== WATER) {
            // Fire — destroy building
            grid.overlay[by][bx] = 'rgba(255,60,20,0.7)'
            st.disasters.push({ type: 'fire', x: bx, y: by, timer: 10 })
            setTimeout(() => {
              grid.tiles[by][bx] = EMPTY
              grid.owner[by][bx] = null
              grid.overlay[by][bx] = null
            }, 5000)
          } else {
            // Traffic — mark random roads
            st.disasters.push({ type: 'traffic', x: bx, y: by, timer: 12 })
          }
          const interval = disFreq === 'high'
            ? DISASTER_INTERVAL_S * 0.5
            : DISASTER_INTERVAL_S
          st.disasterCooldown = interval * (1000 / TICK_MS)
        } else {
          st.disasterCooldown = 9999
        }
      }

      // Tick down active disasters
      for (let i = st.disasters.length - 1; i >= 0; i--) {
        st.disasters[i].timer--
        if (st.disasters[i].timer <= 0) st.disasters.splice(i, 1)
      }

      // Game over check
      if (st.timer <= 0) {
        st.gameOver = true
        if (st.mode === 'vs-mayor') {
          const sorted = [...st.stats].sort((a, b) => b.population - a.population)
          st.winner = sorted[0].index
        } else if (st.mode === 'coop-city') {
          const totalPop = st.stats.reduce((s, p) => s + p.population, 0)
          if (totalPop >= st.popTarget) st.winner = -1 // team win
        }
        setGameOver(true)
        if (st.winner != null) {
          if (st.winner === -1) {
            setWinner(t('miniGames.teamWins', 'Team wins!'))
          } else {
            const w = st.stats.find(s => s.index === st.winner)
            setWinner(w?.name ?? `Player ${(st.winner ?? 0) + 1}`)
          }
        }
      }

      setHud([...st.stats.map(s => ({ ...s }))])
    }, TICK_MS)

    return () => clearInterval(id)
  }, [config, t])

  // ── Canvas render ─────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(draw); return }
      const ctx = canvas.getContext('2d')
      if (!ctx) { raf = requestAnimationFrame(draw); return }
      const st = stateRef.current

      // For VS, draw first player's grid (could split-screen later)
      const grid = st.grids[0]
      canvas.width = W
      canvas.height = H

      // Background grass
      ctx.fillStyle = ZONE_COLORS[EMPTY]
      ctx.fillRect(0, 0, W, H)

      // Grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'
      ctx.lineWidth = 0.5
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * TILE, 0); ctx.lineTo(x * TILE, H); ctx.stroke()
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * TILE); ctx.lineTo(W, y * TILE); ctx.stroke()
      }

      // Tiles
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = grid.tiles[y][x]
          if (tile === EMPTY) continue
          const tx = x * TILE
          const ty = y * TILE
          ctx.fillStyle = ZONE_COLORS[tile] ?? '#888'
          ctx.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2)

          // Power indicator: small lightning bolt for powered zones
          if (tile >= RESIDENTIAL && tile <= PARK && isPowered(grid, x, y)) {
            ctx.fillStyle = '#ff0'
            ctx.font = '10px sans-serif'
            ctx.fillText('⚡', tx + 2, ty + 12)
          }

          // Overlay (pollution / fire)
          if (grid.overlay[y][x]) {
            ctx.fillStyle = grid.overlay[y][x]!
            ctx.fillRect(tx + 1, ty + 1, TILE - 2, TILE - 2)
          }
        }
      }

      // Disaster markers
      for (const dis of st.disasters) {
        const dx = dis.x * TILE
        const dy = dis.y * TILE
        if (dis.type === 'fire') {
          ctx.fillStyle = 'rgba(255,60,20,0.5)'
          ctx.fillRect(dx, dy, TILE, TILE)
          ctx.fillStyle = '#fff'
          ctx.font = '18px sans-serif'
          ctx.fillText('🔥', dx + 10, dy + 28)
        } else {
          ctx.fillStyle = 'rgba(255,200,0,0.3)'
          ctx.fillRect(dx, dy, TILE, TILE)
          ctx.fillStyle = '#fff'
          ctx.font = '14px sans-serif'
          ctx.fillText('🚗', dx + 10, dy + 26)
        }
      }

      // Cursors
      for (const cur of st.cursors) {
        const cx = cur.x * TILE
        const cy = cur.y * TILE
        ctx.strokeStyle = cur.color
        ctx.lineWidth = 3
        ctx.strokeRect(cx + 2, cy + 2, TILE - 4, TILE - 4)

        // Tool preview icon
        const zone = BUILDABLE_ZONES[cur.tool]
        ctx.fillStyle = ZONE_COLORS[zone]
        ctx.globalAlpha = 0.4
        ctx.fillRect(cx + 4, cy + 4, TILE - 8, TILE - 8)
        ctx.globalAlpha = 1
      }

      // Border
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [])

  // ── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHud([])
    setTimer(stateRef.current.timer)
  }, [players, config])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  // ── Format timer ──────────────────────────────────────────
  const mins = Math.floor(Math.max(0, timer) / 60)
  const secs = Math.max(0, timer) % 60

  return (
    <div className={styles.container}>
      {/* HUD */}
      <div className={styles.scoreboard}>
        <span style={{ color: '#ccc', fontWeight: 700, marginRight: 8 }}>
          ⏱ {mins}:{secs.toString().padStart(2, '0')}
        </span>
        {hud.map(s => (
          <div key={s.index} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span style={{ color: '#f1c40f' }} title="Coins">🪙{s.coins}</span>
            <span style={{ color: '#e74c3c' }} title="Gems">💎{s.gems}</span>
            <span style={{ color: '#f39c12' }} title="Stars">⭐{s.stars}</span>
            <span style={{ color: '#3498db' }} title="Population">👤{s.population}</span>
            <span style={{ color: '#aaa', fontSize: '0.8em' }}>
              [{ZONE_NAMES[BUILDABLE_ZONES[stateRef.current.cursors.find(c => c.playerIndex === s.index)?.tool ?? 0]] ?? 'Road'}]
            </span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Sim City canvas"/>

      {isPaused && (
        <PauseMenu onResume={resume} onBack={onBack} players={players} />
      )}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {winner.includes('Team') ? '' : t('miniGames.wins', 'wins')}!</p>}
          {!winner && hud.length > 0 && (
            <p className={styles.winnerText}>
              {t('miniGames.finalScore', 'Score')}: 👤{hud[0]?.population ?? 0} | 🪙{hud[0]?.coins ?? 0}
            </p>
          )}
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
