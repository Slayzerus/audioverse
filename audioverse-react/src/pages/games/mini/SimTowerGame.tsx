/**
 * SimTowerGame — build and manage a skyscraper for 1-4 players.
 *
 * Controls (per keyboard group):
 *   Group 0: W/A/S/D (move cursor), Space (place), E (cycle type), Q (demolish)
 *   Group 1: Arrows (move cursor), Enter (place), Shift (cycle type), Ctrl (demolish)
 *   Gamepad: D-pad (move cursor), A (place), X (cycle type), Y (demolish)
 *
 * Rules:
 *  - Side-view building cross-section, scrollable vertically.
 *  - Place floor types: Office, Shop, Residential, Restaurant, Lobby, Elevator.
 *  - People (tiny dots) move between floors and visit shops/offices.
 *  - Happiness affected by elevator wait, variety, and building quality.
 *  - Income ticks per floor; expenses for maintenance.
 *  - Star rating 1-5 based on building performance.
 *  - VS: separate buildings, highest star rating wins. Coop: shared building.
 *  - 3 currencies: coins (rental income), gems (milestones), stars (star ratings).
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
const TILE_W = 60
const TILE_H = 30
const COLS = 12  // building width
const TICK_MS = 1000
const PERSON_SPEED = 0.5
const INCOME_INTERVAL_S = 5
const MILESTONE_THRESHOLDS = [5, 10, 20, 30, 50]

// ─── Floor types ─────────────────────────────────────────────
const EMPTY = 0
const LOBBY = 1
const OFFICE = 2
const SHOP = 3
const RESIDENTIAL = 4
const RESTAURANT = 5
const ELEVATOR = 6

type FloorType = typeof EMPTY | typeof LOBBY | typeof OFFICE | typeof SHOP
  | typeof RESIDENTIAL | typeof RESTAURANT | typeof ELEVATOR

const BUILDABLE: FloorType[] = [LOBBY, OFFICE, SHOP, RESIDENTIAL, RESTAURANT, ELEVATOR]

const FLOOR_NAMES: Record<number, string> = {
  [LOBBY]: 'Lobby', [OFFICE]: 'Office', [SHOP]: 'Shop',
  [RESIDENTIAL]: 'Residential', [RESTAURANT]: 'Restaurant', [ELEVATOR]: 'Elevator',
}

const FLOOR_COLORS: Record<number, string> = {
  [EMPTY]: '#1a1a2e', [LOBBY]: '#7f8c8d', [OFFICE]: '#3498db',
  [SHOP]: '#f1c40f', [RESIDENTIAL]: '#2ecc71', [RESTAURANT]: '#e67e22', [ELEVATOR]: '#9b59b6',
}

const BUILD_COST: Record<number, number> = {
  [LOBBY]: 50, [OFFICE]: 100, [SHOP]: 120, [RESIDENTIAL]: 80, [RESTAURANT]: 150, [ELEVATOR]: 200,
}

const INCOME_PER_TICK: Record<number, number> = {
  [OFFICE]: 8, [SHOP]: 12, [RESIDENTIAL]: 0, [RESTAURANT]: 6, [LOBBY]: 0, [ELEVATOR]: 0,
}

const MAINTENANCE: Record<number, number> = {
  [OFFICE]: 2, [SHOP]: 3, [RESIDENTIAL]: 1, [RESTAURANT]: 4, [LOBBY]: 0, [ELEVATOR]: 5,
}

// ─── Keyboard mappings ──────────────────────────────────────
interface KeyAction { group: number; dir?: { dx: number; dy: number }; action?: 'place' | 'cycle' | 'demolish' }
const KEY_MAP = new Map<string, KeyAction>([
  ['w', { group: 0, dir: { dx: 0, dy: -1 } }], ['s', { group: 0, dir: { dx: 0, dy: 1 } }],
  ['a', { group: 0, dir: { dx: -1, dy: 0 } }], ['d', { group: 0, dir: { dx: 1, dy: 0 } }],
  [' ', { group: 0, action: 'place' }], ['e', { group: 0, action: 'cycle' }], ['q', { group: 0, action: 'demolish' }],
  ['ArrowUp', { group: 1, dir: { dx: 0, dy: -1 } }], ['ArrowDown', { group: 1, dir: { dx: 0, dy: 1 } }],
  ['ArrowLeft', { group: 1, dir: { dx: -1, dy: 0 } }], ['ArrowRight', { group: 1, dir: { dx: 1, dy: 0 } }],
  ['Enter', { group: 1, action: 'place' }], ['Shift', { group: 1, action: 'cycle' }], ['Control', { group: 1, action: 'demolish' }],
])

// ─── Types ──────────────────────────────────────────────────
interface Person {
  x: number
  y: number // floor row
  targetY: number
  inElevator: boolean
  happiness: number
  home: number // row
  activity: 'idle' | 'moving' | 'shopping' | 'working'
  timer: number
}

interface CursorState {
  col: number
  row: number
  tool: number // index into BUILDABLE
  playerIndex: number
}

interface BuildingState {
  grid: FloorType[] // rows * COLS, row 0 = ground
  maxFloors: number
  cursors: CursorState[]
  people: Person[]
  coins: number
  gems: number
  stars: number
  totalIncome: number
  happiness: number
  population: number
  starRating: number
  milestonesHit: number
  tickTimer: number
  incomeTimer: number
  elapsed: number
  startTime: number
  scrollY: number
  playerIndex: number
  color: string
  name: string
  input: PlayerSlot['input']
}

interface GameState {
  buildings: BuildingState[]
  gameOver: boolean
  winner: number | null
  coop: boolean
  gameDuration: number
}

// ─── Helpers ────────────────────────────────────────────────
function idx(row: number, col: number): number { return row * COLS + col }

function countType(grid: FloorType[], type: FloorType): number {
  return grid.filter(t => t === type).length
}

function hasElevatorOnRow(grid: FloorType[], row: number): boolean {
  for (let c = 0; c < COLS; c++) if (grid[idx(row, c)] === ELEVATOR) return true
  return false
}

function calcStarRating(b: BuildingState): number {
  const height = Math.max(1, ...Array.from({ length: b.maxFloors }, (_, r) => {
    for (let c = 0; c < COLS; c++) if (b.grid[idx(r, c)] !== EMPTY) return r + 1
    return 0
  }))
  const variety = new Set(b.grid.filter(t => t !== EMPTY)).size
  const popScore = Math.min(b.population / 20, 1)
  const happyScore = b.happiness / 100
  const varScore = Math.min(variety / 5, 1)
  const heightScore = Math.min(height / 15, 1)
  return Math.min(5, Math.max(1, Math.round((popScore + happyScore + varScore + heightScore) * 1.25)))
}

function createBuilding(player: PlayerSlot, maxFloors: number, startMoney: number): BuildingState {
  const grid: FloorType[] = new Array(maxFloors * COLS).fill(EMPTY)
  // Place lobby on ground floor center
  const lobbyStart = Math.floor(COLS / 2) - 2
  for (let c = lobbyStart; c < lobbyStart + 4 && c < COLS; c++) {
    grid[idx(0, c)] = LOBBY
  }
  return {
    grid, maxFloors,
    cursors: [{ col: Math.floor(COLS / 2), row: 1, tool: 0, playerIndex: player.index }],
    people: [],
    coins: startMoney, gems: 0, stars: 0,
    totalIncome: 0, happiness: 70, population: 0,
    starRating: 1, milestonesHit: 0,
    tickTimer: 0, incomeTimer: 0,
    elapsed: 0, startTime: Date.now(),
    scrollY: 0,
    playerIndex: player.index,
    color: player.color || PLAYER_COLORS[player.index] || '#fff',
    name: player.name, input: player.input,
  }
}

function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const maxFloors = Number(config.maxFloors) || 30
  const startMap: Record<string, number> = { low: 200, normal: 500, rich: 1000 }
  const startMoney = startMap[config.startingMoney] || 500
  const coop = config.gameMode === 'coop-tower'
  const gameDuration = config.difficulty === 'easy' ? 600 : config.difficulty === 'hard' ? 180 : 300

  const buildings = coop
    ? [createBuilding(players[0], maxFloors, startMoney * players.length)]
    : players.map(p => createBuilding(p, maxFloors, startMoney))

  // In coop, add all player cursors to shared building
  if (coop && players.length > 1) {
    for (let i = 1; i < players.length; i++) {
      buildings[0].cursors.push({ col: Math.floor(COLS / 2) + i, row: 1, tool: 0, playerIndex: players[i].index })
    }
  }

  return { buildings, gameOver: false, winner: null, coop, gameDuration }
}

// ─── Component ──────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function SimTowerGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const [hud, setHud] = useState<{ index: number; name: string; color: string; coins: number; gems: number; stars: number; population: number; rating: number }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const [timer, setTimer] = useState(stateRef.current.gameDuration)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })

  // ── Place / cycle / demolish ──────────────────────────────
  const doAction = useCallback((building: BuildingState, cursor: CursorState, action: 'place' | 'cycle' | 'demolish') => {
    if (action === 'cycle') {
      cursor.tool = (cursor.tool + 1) % BUILDABLE.length
      return
    }
    const i = idx(cursor.row, cursor.col)
    if (action === 'demolish') {
      if (building.grid[i] !== EMPTY) {
        building.grid[i] = EMPTY
        building.coins += 10 // salvage
      }
      return
    }
    // Place
    const type = BUILDABLE[cursor.tool]
    const cost = BUILD_COST[type]
    if (building.coins < cost) return
    if (building.grid[i] !== EMPTY) return
    // Lobby must be on ground floor
    if (type === LOBBY && cursor.row !== 0) return
    // Everything else needs ground floor lobby to exist
    if (type !== LOBBY) {
      let hasLobby = false
      for (let c = 0; c < COLS; c++) if (building.grid[idx(0, c)] === LOBBY) { hasLobby = true; break }
      if (!hasLobby) return
    }
    building.grid[i] = type
    building.coins -= cost
    // Residential adds people
    if (type === RESIDENTIAL) {
      const newPeople = 2 + Math.floor(Math.random() * 3)
      for (let p = 0; p < newPeople; p++) {
        building.people.push({
          x: cursor.col + Math.random(), y: cursor.row,
          targetY: cursor.row, inElevator: false,
          happiness: 80, home: cursor.row,
          activity: 'idle', timer: 0,
        })
      }
      building.population += newPeople
    }
  }, [])

  // ── Input handling ────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (pauseRef.current) return
      const mapping = KEY_MAP.get(e.key)
      if (!mapping) return
      const st = stateRef.current
      for (const building of st.buildings) {
        for (const cursor of building.cursors) {
          const isOwner = st.coop
            ? true
            : building.input.type === 'keyboard' && building.input.group === mapping.group
          // In coop, match cursor to player's keyboard group
          if (st.coop) {
            const player = players.find(p => p.index === cursor.playerIndex)
            if (player?.input.type !== 'keyboard' || player.input.group !== mapping.group) continue
          }
          if (!st.coop && !isOwner) continue
          if (mapping.dir) {
            cursor.col = Math.max(0, Math.min(COLS - 1, cursor.col + mapping.dir.dx))
            cursor.row = Math.max(0, Math.min(building.maxFloors - 1, cursor.row + mapping.dir.dy))
          }
          if (mapping.action) doAction(building, cursor, mapping.action)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doAction, pauseRef, players])

  // ── Main game loop ────────────────────────────────────────
  useEffect(() => {
    let raf = 0
    let lastTick = Date.now()
    let lastIncome = Date.now()
    const prevPad: Record<number, { a: boolean; x: boolean; y: boolean; up: boolean; down: boolean; left: boolean; right: boolean }> = {}

    function tick() {
      if (pauseRef.current) { raf = requestAnimationFrame(tick); return }
      const st = stateRef.current
      const now = Date.now()

      // Timer
      for (const building of st.buildings) {
        building.elapsed = (now - building.startTime) / 1000
      }
      const remaining = Math.max(0, st.gameDuration - (st.buildings[0]?.elapsed || 0))
      setTimer(Math.ceil(remaining))

      // Gamepad input
      for (const pad of padsRef.current) {
        const prev = prevPad[pad.index] || { a: false, x: false, y: false, up: false, down: false, left: false, right: false }
        for (const building of st.buildings) {
          for (const cursor of building.cursors) {
            let isOwner = false
            if (st.coop) {
              const player = players.find(p => p.index === cursor.playerIndex)
              isOwner = player?.input.type === 'gamepad' && player.input.padIndex === pad.index
            } else {
              isOwner = building.input.type === 'gamepad' && building.input.padIndex === pad.index
            }
            if (!isOwner) continue
            if (pad.up && !prev.up) cursor.row = Math.min(building.maxFloors - 1, cursor.row + 1)
            if (pad.down && !prev.down) cursor.row = Math.max(0, cursor.row - 1)
            if (pad.left && !prev.left) cursor.col = Math.max(0, cursor.col - 1)
            if (pad.right && !prev.right) cursor.col = Math.min(COLS - 1, cursor.col + 1)
            if (pad.a && !prev.a) doAction(building, cursor, 'place')
            if (pad.x && !prev.x) doAction(building, cursor, 'cycle')
            if (pad.y && !prev.y) doAction(building, cursor, 'demolish')
          }
        }
        prevPad[pad.index] = { a: pad.a, x: pad.x, y: pad.y, up: pad.up, down: pad.down, left: pad.left, right: pad.right }
      }

      // Simulation tick
      if (now - lastTick >= TICK_MS) {
        lastTick = now
        for (const building of st.buildings) {
          // Move people
          for (const person of building.people) {
            if (person.activity === 'idle') {
              // Decide to go somewhere
              if (Math.random() < 0.15) {
                const shopRows: number[] = []
                const officeRows: number[] = []
                for (let r = 0; r < building.maxFloors; r++) {
                  for (let c = 0; c < COLS; c++) {
                    if (building.grid[idx(r, c)] === SHOP) shopRows.push(r)
                    if (building.grid[idx(r, c)] === OFFICE) officeRows.push(r)
                  }
                }
                const targets = [...shopRows, ...officeRows, person.home]
                person.targetY = targets[Math.floor(Math.random() * targets.length)]
                person.activity = person.targetY !== person.y ? 'moving' : 'idle'
              }
            } else if (person.activity === 'moving') {
              // Move via elevator
              if (person.y !== person.targetY) {
                const hasElev = hasElevatorOnRow(building.grid, Math.floor(person.y))
                if (hasElev) {
                  person.y += person.targetY > person.y ? PERSON_SPEED : -PERSON_SPEED
                  if (Math.abs(person.y - person.targetY) < PERSON_SPEED) {
                    person.y = person.targetY
                    person.activity = 'shopping'
                    person.timer = 3 + Math.floor(Math.random() * 5)
                  }
                } else {
                  // No elevator — unhappy
                  person.happiness = Math.max(0, person.happiness - 5)
                  person.activity = 'idle'
                }
              }
            } else {
              person.timer--
              if (person.timer <= 0) {
                person.activity = 'idle'
                person.targetY = person.home
              }
            }
          }

          // Happiness
          const avgHappy = building.people.length > 0
            ? building.people.reduce((s, p) => s + p.happiness, 0) / building.people.length
            : 70
          const restaurantBonus = countType(building.grid, RESTAURANT) * 3
          building.happiness = Math.min(100, Math.round(avgHappy + restaurantBonus))

          // Star rating
          building.starRating = calcStarRating(building)
        }
      }

      // Income tick
      if (now - lastIncome >= INCOME_INTERVAL_S * 1000) {
        lastIncome = now
        for (const building of st.buildings) {
          let income = 0
          let maint = 0
          for (let i = 0; i < building.grid.length; i++) {
            const t = building.grid[i]
            income += INCOME_PER_TICK[t] || 0
            maint += MAINTENANCE[t] || 0
          }
          const footTrafficBonus = Math.min(building.population * 0.5, 20)
          building.coins += Math.max(0, Math.round(income + footTrafficBonus - maint))
          building.totalIncome += income

          // Milestone gems
          const floorCount = building.grid.filter(t => t !== EMPTY).length
          while (building.milestonesHit < MILESTONE_THRESHOLDS.length &&
                 floorCount >= MILESTONE_THRESHOLDS[building.milestonesHit]) {
            building.gems += 5
            building.milestonesHit++
          }

          // Stars from rating
          if (building.starRating >= 3) building.stars = Math.max(building.stars, building.starRating - 2)
          if (building.starRating >= 5) building.stars = Math.max(building.stars, 5)
        }
      }

      // Game over
      if (!st.gameOver && remaining <= 0) {
        st.gameOver = true
        if (st.coop) {
          st.winner = -1
        } else if (st.buildings.length > 1) {
          st.buildings.sort((a, b) => b.starRating - a.starRating || b.population - a.population)
          st.winner = st.buildings[0].playerIndex
        } else {
          st.winner = st.buildings[0].playerIndex
        }
      }

      // HUD
      setHud(st.buildings.map(b => ({
        index: b.playerIndex, name: b.name, color: b.color,
        coins: b.coins, gems: b.gems, stars: b.stars,
        population: b.population, rating: b.starRating,
      })))
      if (st.gameOver && !gameOver) {
        setGameOver(true)
        if (st.winner === -1) {
          setWinner(t('miniGames.teamWins', 'Team wins!'))
        } else {
          setWinner(st.buildings.find(b => b.playerIndex === st.winner)?.name || null)
        }
      }

      // ── Draw ──────────────────────────────────────────────
      const canvas = canvasRef.current
      if (!canvas) { raf = requestAnimationFrame(tick); return }
      const ctx = canvas.getContext('2d')!
      canvas.width = W; canvas.height = H
      ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0, 0, W, H)

      const buildingCount = st.buildings.length
      const maxBuildW = Math.floor((W - 20) / buildingCount) - 10
      const bStartX = (W - buildingCount * (maxBuildW + 10) + 10) / 2

      for (let bi = 0; bi < buildingCount; bi++) {
        const building = st.buildings[bi]
        const tw = Math.min(TILE_W, Math.floor(maxBuildW / COLS))
        const th = TILE_H
        const visibleRows = Math.floor((H - 80) / th)
        const scrollRow = Math.max(0, Math.min(building.maxFloors - visibleRows,
          (building.cursors[0]?.row || 0) - Math.floor(visibleRows / 2)))
        const bx = bStartX + bi * (maxBuildW + 10)
        const by = H - 40

        // Ground line
        ctx.fillStyle = '#3a2a1a'; ctx.fillRect(bx, by, COLS * tw, 4)

        // Floors (bottom-up)
        for (let r = scrollRow; r < Math.min(building.maxFloors, scrollRow + visibleRows); r++) {
          const fy = by - (r - scrollRow + 1) * th
          for (let c = 0; c < COLS; c++) {
            const type = building.grid[idx(r, c)]
            const tx = bx + c * tw
            if (type !== EMPTY) {
              ctx.fillStyle = FLOOR_COLORS[type]
              ctx.fillRect(tx + 1, fy + 1, tw - 2, th - 2)
              if (type === ELEVATOR) {
                ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1
                ctx.strokeRect(tx + tw / 3, fy + 2, tw / 3, th - 4)
              }
            }
            ctx.strokeStyle = '#222'; ctx.lineWidth = 0.5
            ctx.strokeRect(tx, fy, tw, th)
          }
          // Floor number
          ctx.fillStyle = '#555'; ctx.font = '9px monospace'; ctx.textAlign = 'right'
          ctx.fillText(`${r}F`, bx - 2, fy + th / 2 + 3)
        }

        // People
        ctx.fillStyle = '#fff'
        for (const person of building.people) {
          if (person.y < scrollRow || person.y >= scrollRow + visibleRows) continue
          const px = bx + person.x * tw
          const py = by - (person.y - scrollRow + 1) * th + th / 2
          ctx.beginPath()
          ctx.arc(px, py, 2, 0, Math.PI * 2)
          ctx.fill()
        }

        // Cursors
        for (const cursor of building.cursors) {
          if (cursor.row < scrollRow || cursor.row >= scrollRow + visibleRows) continue
          const cx = bx + cursor.col * tw
          const cy = by - (cursor.row - scrollRow + 1) * th
          const pColor = players.find(p => p.index === cursor.playerIndex)?.color || '#fff'
          ctx.strokeStyle = pColor; ctx.lineWidth = 2
          ctx.strokeRect(cx, cy, tw, th)
          // Tool label
          ctx.fillStyle = pColor; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'
          ctx.fillText(FLOOR_NAMES[BUILDABLE[cursor.tool]], cx + tw / 2, cy - 2)
        }

        // Building label
        ctx.fillStyle = building.color; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'
        ctx.fillText(`${building.name} ★${building.starRating}`, bx + (COLS * tw) / 2, 20)

        // Happiness bar
        const barW = COLS * tw
        ctx.fillStyle = '#333'; ctx.fillRect(bx, 28, barW, 6)
        const hpct = building.happiness / 100
        ctx.fillStyle = hpct > 0.6 ? '#2ecc71' : hpct > 0.3 ? '#f39c12' : '#e74c3c'
        ctx.fillRect(bx, 28, barW * hpct, 6)
      }

      // Timer
      const mins = Math.floor(remaining / 60)
      const secs = Math.ceil(remaining) % 60
      ctx.fillStyle = '#ccc'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left'
      ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, 10, 18)

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [gameOver, pauseRef, doAction, players, t])

  // ── Restart ───────────────────────────────────────────────
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHud([])
    setTimer(stateRef.current.gameDuration)
  }, [players, config])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver && (e.key === ' ' || e.key === 'Enter')) handleRestart()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, handleRestart])

  // Timer display
  const mins = Math.floor(timer / 60)
  const secs = timer % 60

  return (
    <div className={styles.container}>
      <div className={styles.scoreboard}>
        <span style={{ color: '#ccc', fontWeight: 700, marginRight: 8 }}>
          ⏱ {mins}:{secs.toString().padStart(2, '0')}
        </span>
        {hud.map(s => (
          <div key={s.index} className={styles.scoreItem}>
            <span className={styles.scoreColor} style={{ background: s.color }} />
            <span>{s.name}</span>
            <span title="Rating">★{s.rating}</span>
            <span title="Population">👤{s.population}</span>
            <span style={{ color: '#f1c40f' }} title="Coins">🪙{s.coins}</span>
            <span style={{ color: '#e74c3c' }} title="Gems">💎{s.gems}</span>
            <span style={{ color: '#f39c12' }} title="Stars">⭐{s.stars}</span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Sim Tower canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && hud.length > 0 && (
            <p className={styles.winnerText}>
              ★{hud[0]?.rating ?? 1} | 👤{hud[0]?.population ?? 0} | 🪙{hud[0]?.coins ?? 0}
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
