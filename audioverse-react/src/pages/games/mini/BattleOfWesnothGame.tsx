/**
 * BattleOfWesnothGame — Battle-of-Wesnoth-inspired real-time hex strategy.
 *
 * Controls (per keyboard group):
 *   Group 0: WASD move cursor, Space select/move, E recruit, Tab cycle unit type
 *   Group 1: Arrows move cursor, Enter select/move, Shift recruit, Ctrl cycle
 * Gamepads: left stick move, A select/move, X recruit, Y cycle unit type
 *
 * Real-time: units act with cooldowns, simultaneous action.
 * Currencies: coins (villages captured), gems (units leveled), stars (victories).
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
const HEX_R = 24
const HEX_W = HEX_R * 2
const HEX_H = Math.sqrt(3) * HEX_R
const GOLD_TICK_MS = 10_000
const RECRUIT_COST = 10
const START_GOLD = 30

// Grid sizes by config
const GRID_SIZES: Record<string, { cols: number; rows: number }> = {
  small: { cols: 8, rows: 6 },
  medium: { cols: 10, rows: 8 },
  large: { cols: 12, rows: 10 },
}

// Terrain types
type Terrain = 'plains' | 'forest' | 'mountain' | 'water' | 'village' | 'castle'
const TERRAIN_COLORS: Record<Terrain, string> = {
  plains: '#7ec850', forest: '#2d6a1e', mountain: '#888',
  water: '#3b8beb', village: '#8b6914', castle: '#c0a040',
}

// Unit types
interface UnitDef { name: string; hp: number; atk: number; range: number; moveRange: number; cooldown: number; shape: 'circle' | 'triangle' | 'diamond' }
const UNIT_DEFS: UnitDef[] = [
  { name: 'Warrior', hp: 30, atk: 8, range: 1, moveRange: 1, cooldown: 3000, shape: 'circle' },
  { name: 'Archer',  hp: 20, atk: 6, range: 2, moveRange: 1, cooldown: 4000, shape: 'triangle' },
  { name: 'Cavalry', hp: 25, atk: 7, range: 1, moveRange: 2, cooldown: 3000, shape: 'diamond' },
]

// ─── Keyboard mappings ───────────────────────────────────────
interface KBAction { group: number; action: 'up' | 'down' | 'left' | 'right' | 'select' | 'recruit' | 'cycle' }
const KB_MAP: Record<string, KBAction> = {
  w: { group: 0, action: 'up' }, s: { group: 0, action: 'down' },
  a: { group: 0, action: 'left' }, d: { group: 0, action: 'right' },
  ' ': { group: 0, action: 'select' }, e: { group: 0, action: 'recruit' },
  Tab: { group: 0, action: 'cycle' },
  ArrowUp: { group: 1, action: 'up' }, ArrowDown: { group: 1, action: 'down' },
  ArrowLeft: { group: 1, action: 'left' }, ArrowRight: { group: 1, action: 'right' },
  Enter: { group: 1, action: 'select' }, Shift: { group: 1, action: 'recruit' },
  Control: { group: 1, action: 'cycle' },
}

// ─── Types ───────────────────────────────────────────────────
interface HexCell { col: number; row: number; terrain: Terrain; owner: number }

interface Unit {
  id: number; col: number; row: number; owner: number
  type: number; hp: number; maxHp: number; atk: number
  range: number; moveRange: number; cooldown: number
  lastAction: number; level: number; xp: number
}

interface PlayerState {
  gold: number; coins: number; gems: number; stars: number
  villages: number; kills: number; unitCount: number; alive: boolean
  name: string; color: string; selectedType: number
  cursorCol: number; cursorRow: number; selectedUnit: number | null
}

interface GameState {
  grid: HexCell[][]; units: Unit[]; players: PlayerState[]
  cols: number; rows: number; nextId: number
  gameOver: boolean; winnerIdx: number | null; tick: number
  coop: boolean; survival: boolean; waveTimer: number; wave: number
  goldPerVillage: number; lastGoldTick: number
}

// ─── Hex math helpers ────────────────────────────────────────
function hexToPixel(col: number, row: number): { x: number; y: number } {
  const x = col * HEX_W * 0.75 + HEX_R + 20
  const y = row * HEX_H + (col % 2 === 1 ? HEX_H / 2 : 0) + HEX_R + 20
  return { x, y }
}

function hexDist(c1: number, r1: number, c2: number, r2: number): number {
  // Offset coords → cube coords
  const toC = (c: number, r: number) => {
    const x = c
    const z = r - (c - (c & 1)) / 2
    const y = -x - z
    return { x, y, z }
  }
  const a = toC(c1, r1), b = toC(c2, r2)
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.z - b.z))
}

function hexNeighbors(col: number, row: number, cols: number, rows: number): { col: number; row: number }[] {
  const even = col % 2 === 0
  const dirs = even
    ? [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]]
    : [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]]
  return dirs.map(([dc, dr]) => ({ col: col + dc, row: row + dr }))
    .filter(h => h.col >= 0 && h.col < cols && h.row >= 0 && h.row < rows)
}

function drawHex(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6
    const px = cx + r * Math.cos(angle)
    const py = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
  }
  ctx.closePath()
}

// ─── Map generation ──────────────────────────────────────────
function generateGrid(cols: number, rows: number, playerCount: number, coop: boolean): HexCell[][] {
  const grid: HexCell[][] = []
  for (let c = 0; c < cols; c++) {
    grid[c] = []
    for (let r = 0; r < rows; r++) {
      const rng = Math.random()
      let terrain: Terrain = 'plains'
      if (rng < 0.12) terrain = 'forest'
      else if (rng < 0.17) terrain = 'mountain'
      else if (rng < 0.22) terrain = 'water'
      else if (rng < 0.30) terrain = 'village'
      grid[c][r] = { col: c, row: r, terrain, owner: -1 }
    }
  }
  // Place castles for each player in corners
  const castlePositions = [
    { c: 1, r: 1 }, { c: cols - 2, r: rows - 2 },
    { c: cols - 2, r: 1 }, { c: 1, r: rows - 2 },
  ]
  const totalPlayers = coop ? playerCount + 1 : playerCount
  for (let i = 0; i < Math.min(totalPlayers, 4); i++) {
    const pos = castlePositions[i]
    grid[pos.c][pos.r] = { col: pos.c, row: pos.r, terrain: 'castle', owner: i }
    // Clear around castle
    for (const n of hexNeighbors(pos.c, pos.r, cols, rows)) {
      if (grid[n.col][n.row].terrain === 'mountain' || grid[n.col][n.row].terrain === 'water') {
        grid[n.col][n.row].terrain = 'plains'
      }
    }
  }
  return grid
}

// ─── Init ────────────────────────────────────────────────────
function initState(players: PlayerSlot[], config: GameConfig): GameState {
  const mapSize = (config.mapSize as string) || 'medium'
  const { cols, rows } = GRID_SIZES[mapSize] || GRID_SIZES.medium
  const coop = config.gameMode === 'coop-campaign' || config.gameMode === 'survival'
  const survival = config.gameMode === 'survival'
  const goldPerVillage = Number(config.goldPerVillage) || 2

  const grid = generateGrid(cols, rows, players.length, coop)
  const pStates: PlayerState[] = []
  const units: Unit[] = []
  let nextId = 0

  const castlePositions = [
    { c: 1, r: 1 }, { c: cols - 2, r: rows - 2 },
    { c: cols - 2, r: 1 }, { c: 1, r: rows - 2 },
  ]

  players.forEach((p, i) => {
    const color = p.color || PLAYER_COLORS[p.index] || '#fff'
    const pos = castlePositions[i % 4]
    pStates.push({
      gold: START_GOLD, coins: 0, gems: 0, stars: 0,
      villages: 0, kills: 0, unitCount: 0, alive: true,
      name: p.name, color, selectedType: 0,
      cursorCol: pos.c, cursorRow: pos.r, selectedUnit: null,
    })
    // Spawn initial warrior
    units.push({
      id: nextId++, col: pos.c, row: pos.r, owner: i,
      type: 0, hp: 30, maxHp: 30, atk: 8,
      range: 1, moveRange: 1, cooldown: 3000,
      lastAction: 0, level: 1, xp: 0,
    })
  })

  // AI faction for coop / survival
  if (coop) {
    const aiIdx = players.length
    const aiPos = castlePositions[Math.min(aiIdx, 3)]
    pStates.push({
      gold: 50, coins: 0, gems: 0, stars: 0,
      villages: 0, kills: 0, unitCount: 0, alive: true,
      name: 'AI Faction', color: '#888', selectedType: 0,
      cursorCol: aiPos.c, cursorRow: aiPos.r, selectedUnit: null,
    })
    for (let u = 0; u < 3; u++) {
      const nb = hexNeighbors(aiPos.c, aiPos.r, cols, rows)
      const sp = nb[u % nb.length] || aiPos
      units.push({
        id: nextId++, col: sp.col, row: sp.row, owner: aiIdx,
        type: u % 3, hp: UNIT_DEFS[u % 3].hp, maxHp: UNIT_DEFS[u % 3].hp,
        atk: UNIT_DEFS[u % 3].atk, range: UNIT_DEFS[u % 3].range,
        moveRange: UNIT_DEFS[u % 3].moveRange, cooldown: UNIT_DEFS[u % 3].cooldown,
        lastAction: 0, level: 1, xp: 0,
      })
    }
  }

  return {
    grid, units, players: pStates, cols, rows, nextId,
    gameOver: false, winnerIdx: null, tick: 0,
    coop, survival, waveTimer: 0, wave: 0,
    goldPerVillage, lastGoldTick: 0,
  }
}

// ─── Component ───────────────────────────────────────────────
interface Props {
  players: PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}

export default function BattleOfWesnothGame({ players, config = {}, onBack }: Props) {
  useGameFocusLock();
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<GameState>(initState(players, config))
  const keysRef = useRef<Set<string>>(new Set())
  const [hud, setHud] = useState<PlayerState[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<string | null>(null)
  const pads = useGamepads()
  const padsRef = useRef(pads)
  padsRef.current = pads
  const { isPaused, pauseRef, resume } = usePause({ onBack, disabled: gameOver })
  const cooldownRef = useRef<Record<string, number>>({})

  // ── Key events ──
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key === 'Tab') e.preventDefault()
    }
    const onUp = (e: KeyboardEvent) => { keysRef.current.delete(e.key) }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [])

  // ── Recruit helper ──
  const recruitUnit = useCallback((st: GameState, pIdx: number) => {
    const ps = st.players[pIdx]
    if (!ps || !ps.alive || ps.gold < RECRUIT_COST) return
    const castle = st.grid[ps.cursorCol]?.[ps.cursorRow]
    if (!castle || castle.terrain !== 'castle' || castle.owner !== pIdx) return
    if (st.units.some(u => u.col === ps.cursorCol && u.row === ps.cursorRow)) return
    const def = UNIT_DEFS[ps.selectedType]
    ps.gold -= RECRUIT_COST
    st.units.push({
      id: st.nextId++, col: ps.cursorCol, row: ps.cursorRow, owner: pIdx,
      type: ps.selectedType, hp: def.hp, maxHp: def.hp, atk: def.atk,
      range: def.range, moveRange: def.moveRange, cooldown: def.cooldown,
      lastAction: st.tick, level: 1, xp: 0,
    })
    ps.unitCount++
  }, [])

  // ── Select / move / attack helper ──
  const handleSelect = useCallback((st: GameState, pIdx: number, now: number) => {
    const ps = st.players[pIdx]
    if (!ps || !ps.alive) return
    const { cursorCol, cursorRow, selectedUnit } = ps
    const unitOnCursor = st.units.find(u => u.col === cursorCol && u.row === cursorRow && u.hp > 0)

    if (selectedUnit != null) {
      const sel = st.units.find(u => u.id === selectedUnit)
      if (!sel || sel.hp <= 0) { ps.selectedUnit = null; return }
      // If clicking enemy in range → attack
      if (unitOnCursor && unitOnCursor.owner !== pIdx) {
        const d = hexDist(sel.col, sel.row, cursorCol, cursorRow)
        if (d <= sel.range && now - sel.lastAction >= sel.cooldown) {
          // Attack
          let dmg = sel.atk
          const targetCell = st.grid[cursorCol]?.[cursorRow]
          if (targetCell?.terrain === 'forest' && Math.random() < 0.2) dmg = 0 // dodge
          unitOnCursor.hp -= dmg
          // Counter-attack
          if (unitOnCursor.hp > 0 && hexDist(sel.col, sel.row, cursorCol, cursorRow) <= unitOnCursor.range) {
            sel.hp -= Math.max(0, unitOnCursor.atk - 2)
          }
          sel.lastAction = now
          // XP & leveling
          if (unitOnCursor.hp <= 0) {
            sel.xp += 10
            st.players[pIdx].kills++
            if (sel.xp >= sel.level * 20) {
              sel.level++; sel.maxHp += 5; sel.hp = Math.min(sel.hp + 10, sel.maxHp)
              sel.atk += 1; st.players[pIdx].gems++
            }
          }
          ps.selectedUnit = null
          return
        }
      }
      // If clicking empty passable hex in move range → move
      const cell = st.grid[cursorCol]?.[cursorRow]
      if (cell && cell.terrain !== 'mountain' && cell.terrain !== 'water' && !unitOnCursor) {
        const d = hexDist(sel.col, sel.row, cursorCol, cursorRow)
        if (d <= sel.moveRange && now - sel.lastAction >= sel.cooldown) {
          sel.col = cursorCol; sel.row = cursorRow; sel.lastAction = now
          // Capture village
          if (cell.terrain === 'village' && cell.owner !== pIdx) {
            if (cell.owner >= 0) st.players[cell.owner].villages--
            cell.owner = pIdx; ps.villages++; ps.coins++
          }
          // Heal on village
          if (cell.terrain === 'village' && cell.owner === pIdx) {
            sel.hp = Math.min(sel.hp + 3, sel.maxHp)
          }
          ps.selectedUnit = null
          return
        }
      }
      ps.selectedUnit = null
    } else {
      // Select own unit
      if (unitOnCursor && unitOnCursor.owner === pIdx) {
        ps.selectedUnit = unitOnCursor.id
      }
    }
  }, [])

  // ── Main game loop ──
  useEffect(() => {
    const DT = 1000 / 20
    let timer = 0

    function gameTick() {
      if (pauseRef.current) { timer = window.setTimeout(gameTick, DT); return }
      const st = stateRef.current
      if (st.gameOver) return
      st.tick += DT
      const now = st.tick
      const cd = cooldownRef.current
      const humanCount = players.length

      // ── Player input ──
      players.forEach((p, i) => {
        const ps = st.players[i]
        if (!ps || !ps.alive) return
        let dx = 0, dy = 0
        let selectPressed = false, recruitPressed = false, cyclePressed = false

        if (p.input.type === 'keyboard') {
          const keys = keysRef.current
          for (const [key, mapping] of Object.entries(KB_MAP)) {
            if (mapping.group !== p.input.group || !keys.has(key)) continue
            if (mapping.action === 'up') dy -= 1
            else if (mapping.action === 'down') dy += 1
            else if (mapping.action === 'left') dx -= 1
            else if (mapping.action === 'right') dx += 1
            else if (mapping.action === 'select') selectPressed = true
            else if (mapping.action === 'recruit') recruitPressed = true
            else if (mapping.action === 'cycle') cyclePressed = true
          }
        } else if (p.input.type === 'gamepad') {
          const gp = padsRef.current.find(g => g.index === (p.input as { type: 'gamepad'; padIndex: number }).padIndex)
          if (gp) {
            if (gp.up) dy -= 1; if (gp.down) dy += 1
            if (gp.left) dx -= 1; if (gp.right) dx += 1
            if (gp.a) selectPressed = true
            if (gp.x) recruitPressed = true
            if (gp.y) cyclePressed = true
          }
        }

        // Move cursor (with cooldown so it doesn't fly)
        const moveKey = `move_${i}`
        if ((dx || dy) && (!cd[moveKey] || now - cd[moveKey] > 150)) {
          ps.cursorCol = Math.max(0, Math.min(st.cols - 1, ps.cursorCol + dx))
          ps.cursorRow = Math.max(0, Math.min(st.rows - 1, ps.cursorRow + dy))
          cd[moveKey] = now
        }

        const selKey = `sel_${i}`
        if (selectPressed && (!cd[selKey] || now - cd[selKey] > 250)) {
          handleSelect(st, i, now); cd[selKey] = now
        }
        const recKey = `rec_${i}`
        if (recruitPressed && (!cd[recKey] || now - cd[recKey] > 400)) {
          recruitUnit(st, i); cd[recKey] = now
        }
        const cycKey = `cyc_${i}`
        if (cyclePressed && (!cd[cycKey] || now - cd[cycKey] > 300)) {
          ps.selectedType = (ps.selectedType + 1) % UNIT_DEFS.length
          cd[cycKey] = now
        }
      })

      // ── Gold income ──
      if (now - st.lastGoldTick >= GOLD_TICK_MS) {
        st.lastGoldTick = now
        st.players.forEach(ps => {
          if (!ps.alive) return
          ps.gold += ps.villages * st.goldPerVillage
        })
      }

      // ── AI behavior ──
      for (let ai = humanCount; ai < st.players.length; ai++) {
        const ps = st.players[ai]
        if (!ps.alive) continue
        // AI recruit periodically
        if (Math.random() < 0.02 && ps.gold >= RECRUIT_COST) {
          // Find own castle
          for (let c = 0; c < st.cols; c++) {
            for (let r = 0; r < st.rows; r++) {
              if (st.grid[c][r].terrain === 'castle' && st.grid[c][r].owner === ai) {
                if (!st.units.some(u => u.col === c && u.row === r)) {
                  ps.cursorCol = c; ps.cursorRow = r
                  ps.selectedType = Math.floor(Math.random() * UNIT_DEFS.length)
                  recruitUnit(st, ai)
                }
              }
            }
          }
        }
        // AI move units toward nearest enemy
        const aiUnits = st.units.filter(u => u.owner === ai && u.hp > 0)
        for (const u of aiUnits) {
          if (now - u.lastAction < u.cooldown) continue
          // Find nearest enemy unit
          let bestDist = 999; let bestTarget: Unit | null = null
          for (const eu of st.units) {
            if (eu.owner === ai || eu.hp <= 0) continue
            if (st.coop && eu.owner >= humanCount) continue // don't attack allies
            const d = hexDist(u.col, u.row, eu.col, eu.row)
            if (d < bestDist) { bestDist = d; bestTarget = eu }
          }
          if (bestTarget) {
            if (bestDist <= u.range) {
              // Attack
              bestTarget.hp -= u.atk
              if (bestTarget.hp > 0 && hexDist(u.col, u.row, bestTarget.col, bestTarget.row) <= bestTarget.range) {
                u.hp -= Math.max(0, bestTarget.atk - 2)
              }
              u.lastAction = now
              if (bestTarget.hp <= 0) { ps.kills++; u.xp += 10 }
            } else {
              // Move toward enemy
              const neighbors = hexNeighbors(u.col, u.row, st.cols, st.rows)
              let best = { col: u.col, row: u.row }; let bd = bestDist
              for (const n of neighbors) {
                const cell = st.grid[n.col][n.row]
                if (cell.terrain === 'mountain' || cell.terrain === 'water') continue
                if (st.units.some(uu => uu.col === n.col && uu.row === n.row && uu.hp > 0)) continue
                const d = hexDist(n.col, n.row, bestTarget.col, bestTarget.row)
                if (d < bd) { bd = d; best = n }
              }
              if (best.col !== u.col || best.row !== u.row) {
                u.col = best.col; u.row = best.row; u.lastAction = now
                // Capture village
                const cell = st.grid[u.col][u.row]
                if (cell.terrain === 'village' && cell.owner !== ai) {
                  if (cell.owner >= 0) st.players[cell.owner].villages--
                  cell.owner = ai; ps.villages++; ps.coins++
                }
              }
            }
          }
        }
      }

      // ── Survival waves ──
      if (st.survival) {
        st.waveTimer += DT
        if (st.waveTimer >= 15_000) {
          st.waveTimer = 0; st.wave++
          const edges = [{ c: 0, r: 0 }, { c: st.cols - 1, r: 0 }, { c: 0, r: st.rows - 1 }, { c: st.cols - 1, r: st.rows - 1 }]
          const aiIdx = st.players.length - 1
          for (let w = 0; w < st.wave + 1; w++) {
            const e = edges[w % edges.length]
            const cell = st.grid[e.c][e.r]
            if (cell.terrain !== 'mountain' && cell.terrain !== 'water') {
              const tp = Math.floor(Math.random() * 3)
              const def = UNIT_DEFS[tp]
              st.units.push({
                id: st.nextId++, col: e.c, row: e.r, owner: aiIdx,
                type: tp, hp: def.hp, maxHp: def.hp, atk: def.atk,
                range: def.range, moveRange: def.moveRange, cooldown: def.cooldown,
                lastAction: now, level: 1, xp: 0,
              })
            }
          }
        }
      }

      // ── Remove dead units ──
      st.units = st.units.filter(u => u.hp > 0)

      // ── Update player unit counts ──
      st.players.forEach((ps, i) => {
        ps.unitCount = st.units.filter(u => u.owner === i).length
      })

      // ── Win condition: capture all enemy castles ──
      if (st.coop) {
        const humansAlive = st.players.filter((p, i) => i < humanCount && p.alive)
        // Check if human castles are captured
        let _humanCastles = 0, aiCastles = 0
        for (let c = 0; c < st.cols; c++) {
          for (let r = 0; r < st.rows; r++) {
            if (st.grid[c][r].terrain === 'castle') {
              if (st.grid[c][r].owner < humanCount) _humanCastles++
              else aiCastles++
            }
          }
        }
        if (aiCastles === 0 || (humansAlive.length === 0 && st.units.filter(u => u.owner < humanCount).length === 0)) {
          st.gameOver = true
          if (aiCastles === 0) {
            humansAlive.forEach(p => p.stars++)
            st.winnerIdx = 0
          }
        }
      } else {
        // VS mode — check per-player castle ownership
        for (const ps of st.players) {
          if (!ps.alive) continue
          const idx = st.players.indexOf(ps)
          const ownsCastle = (() => {
            for (let c = 0; c < st.cols; c++)
              for (let r = 0; r < st.rows; r++)
                if (st.grid[c][r].terrain === 'castle' && st.grid[c][r].owner === idx) return true
            return false
          })()
          const hasUnits = st.units.some(u => u.owner === idx && u.hp > 0)
          if (!ownsCastle && !hasUnits) ps.alive = false
        }
        const remaining = st.players.filter(p => p.alive)
        if (remaining.length <= 1 && st.players.length > 1) {
          st.gameOver = true
          if (remaining.length === 1) {
            remaining[0].stars++
            st.winnerIdx = st.players.indexOf(remaining[0])
          }
        } else if (st.players.length === 1 && !st.players[0].alive) {
          st.gameOver = true
        }
      }

      // ── HUD update ──
      setHud(st.players.map(p => ({ ...p })))
      if (st.gameOver) {
        setGameOver(true)
        if (st.winnerIdx != null) setWinner(st.players[st.winnerIdx]?.name ?? null)
        return
      }

      timer = window.setTimeout(gameTick, DT)
    }

    timer = window.setTimeout(gameTick, DT)
    return () => clearTimeout(timer)
  // Mount-only effect — deps intentionally empty: game tick loop reads all state from stateRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      canvas.width = W; canvas.height = H

      // Background
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, W, H)

      // Draw hex grid
      for (let c = 0; c < st.cols; c++) {
        for (let r = 0; r < st.rows; r++) {
          const cell = st.grid[c][r]
          const { x, y } = hexToPixel(c, r)

          // Fill hex
          drawHex(ctx, x, y, HEX_R - 1)
          ctx.fillStyle = TERRAIN_COLORS[cell.terrain]
          ctx.fill()

          // Owner border for villages and castles
          if ((cell.terrain === 'village' || cell.terrain === 'castle') && cell.owner >= 0) {
            drawHex(ctx, x, y, HEX_R - 1)
            ctx.strokeStyle = st.players[cell.owner]?.color || '#fff'
            ctx.lineWidth = 3
            ctx.stroke()
          } else {
            drawHex(ctx, x, y, HEX_R - 1)
            ctx.strokeStyle = '#333'
            ctx.lineWidth = 1
            ctx.stroke()
          }

          // Castle icon
          if (cell.terrain === 'castle') {
            ctx.fillStyle = '#fff'
            ctx.font = '12px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🏰', x, y)
          }
          // Village icon
          if (cell.terrain === 'village') {
            ctx.fillStyle = '#fff'
            ctx.font = '10px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('🏠', x, y)
          }
        }
      }

      // Draw units
      for (const u of st.units) {
        const { x, y } = hexToPixel(u.col, u.row)
        const color = st.players[u.owner]?.color || '#fff'
        const def = UNIT_DEFS[u.type]
        ctx.fillStyle = color

        if (def.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(x, y, 10, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke()
        } else if (def.shape === 'triangle') {
          ctx.beginPath()
          ctx.moveTo(x, y - 10); ctx.lineTo(x - 8, y + 6); ctx.lineTo(x + 8, y + 6)
          ctx.closePath(); ctx.fill()
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke()
        } else if (def.shape === 'diamond') {
          ctx.beginPath()
          ctx.moveTo(x, y - 10); ctx.lineTo(x + 8, y); ctx.lineTo(x, y + 10); ctx.lineTo(x - 8, y)
          ctx.closePath(); ctx.fill()
          ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke()
        }

        // HP bar
        const barW = 16, barH = 3
        ctx.fillStyle = '#300'
        ctx.fillRect(x - barW / 2, y - 15, barW, barH)
        ctx.fillStyle = u.hp > u.maxHp * 0.5 ? '#0f0' : u.hp > u.maxHp * 0.25 ? '#ff0' : '#f00'
        ctx.fillRect(x - barW / 2, y - 15, barW * (u.hp / u.maxHp), barH)

        // Level indicator
        if (u.level > 1) {
          ctx.fillStyle = '#ff0'
          ctx.font = 'bold 8px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(`L${u.level}`, x, y + 16)
        }
      }

      // Draw player cursors
      st.players.forEach((ps, i) => {
        if (!ps.alive || i >= players.length) return // only human cursors
        const { x, y } = hexToPixel(ps.cursorCol, ps.cursorRow)
        drawHex(ctx, x, y, HEX_R + 2)
        ctx.strokeStyle = ps.color
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Selected unit highlight
        if (ps.selectedUnit != null) {
          const su = st.units.find(u => u.id === ps.selectedUnit)
          if (su) {
            const sp = hexToPixel(su.col, su.row)
            drawHex(ctx, sp.x, sp.y, HEX_R + 3)
            ctx.strokeStyle = '#fff'
            ctx.lineWidth = 2
            ctx.setLineDash([2, 2])
            ctx.stroke()
            ctx.setLineDash([])
          }
        }

        // Show selected unit type near cursor
        ctx.fillStyle = ps.color
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(UNIT_DEFS[ps.selectedType].name, x, y + HEX_R + 12)
      })

      // Border
      ctx.strokeStyle = '#444'
      ctx.lineWidth = 2
      ctx.strokeRect(0, 0, W, H)

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  // Mount-only effect — deps intentionally empty: continuous RAF render loop reads from stateRef
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Restart ──
  const handleRestart = useCallback(() => {
    stateRef.current = initState(players, config)
    setGameOver(false)
    setWinner(null)
    setHud([])
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
      {/* HUD */}
      <div className={styles.scoreboard}>
        {hud.filter((_, i) => i < players.length).map((p, i) => (
          <div key={i} className={`${styles.scoreItem} ${!p.alive ? styles.dead : ''}`}>
            <span className={styles.scoreColor} style={{ background: p.color }} />
            <span>{p.name}</span>
            <span title="Gold">💰{p.gold}</span>
            <span title="Villages (coins)">🪙{p.coins}</span>
            <span title="Leveled (gems)">💎{p.gems}</span>
            <span title="Stars">⭐{p.stars}</span>
            <span style={{ fontSize: '0.75em', opacity: 0.7 }}>
              ⚔{p.unitCount} 🏠{p.villages} 💀{p.kills}
            </span>
          </div>
        ))}
      </div>

      <canvas ref={canvasRef} className={styles.canvas}  role="img" aria-label="Battle Of Wesnoth canvas"/>

      {isPaused && <PauseMenu onResume={resume} onBack={onBack} players={players} />}

      {gameOver && (
        <div className={styles.overlay}>
          <h2>{t('miniGames.gameOver', 'Game Over!')}</h2>
          {winner && <p className={styles.winnerText}>🏆 {winner} {t('miniGames.wins', 'wins')}!</p>}
          {!winner && <p className={styles.winnerText}>{t('miniGames.defeated', 'Defeated!')}</p>}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '1.1rem' }}>
            {hud.filter((_, i) => i < players.length).map((p, i) => (
              <div key={i} style={{ color: p.color, textAlign: 'center' }}>
                <div>{p.name}</div>
                <div>🪙{p.coins} 💎{p.gems} ⭐{p.stars}</div>
                <div style={{ fontSize: '0.8em' }}>💰{p.gold} ⚔{p.unitCount} 💀{p.kills}</div>
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
