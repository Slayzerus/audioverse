/**
 * Pure game logic functions for Eight Minute Empire (Danger Zone).
 */

import { PLAYER_COLORS, type PlayerSlot } from '../../pages/games/mini/types'
import type {
  CardDef, CombatMode, GameState, MapTemplate,
  PlayerState, Terrain, Territory, TurnMode,
} from './dangeZoneTypes'
import { createDeck } from './dangeZoneTypes'

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════

export const MARKET_SIZE = 6
export const CARD_COSTS = [0, 1, 1, 2, 3, 5]
export const ROUNDS_BY_PLAYERS: Record<number, number> = { 2: 13, 3: 10, 4: 8 }

export const TERRAIN_PASSABLE: Record<Terrain, boolean> = {
  plains: true, forest: true, mountain: true, water: false, desert: true,
}

// ══════════════════════════════════════════════════════════════
//  MAP GENERATION
// ══════════════════════════════════════════════════════════════

function mapDims(size: string): { cols: number; rows: number } {
  if (size === 'small') return { cols: 6, rows: 4 }
  if (size === 'large') return { cols: 10, rows: 6 }
  return { cols: 8, rows: 5 }
}

export function generateMap(cols: number, rows: number, playerCount: number) {
  const grid: Territory[][] = []
  const contCount = rows <= 4 ? 2 : 3
  const contSize = Math.ceil(rows / contCount)
  for (let r = 0; r < rows; r++) {
    const row: Territory[] = []
    const continent = Math.min(contCount - 1, Math.floor(r / contSize))
    for (let c = 0; c < cols; c++) {
      const rng = Math.random()
      let terrain: Terrain = 'plains'
      if (rng < 0.10) terrain = 'water'
      else if (rng < 0.25) terrain = 'mountain'
      else if (rng < 0.38) terrain = 'forest'
      else if (rng < 0.48) terrain = 'desert'
      row.push({
        col: c, row: r, terrain, continent,
        armies: new Array(playerCount).fill(0),
        cities: new Array(playerCount).fill(0),
      })
    }
    grid.push(row)
  }
  // Ensure starting corners are passable
  const corners = [
    { c: 0, r: 0 }, { c: cols - 1, r: rows - 1 },
    { c: cols - 1, r: 0 }, { c: 0, r: rows - 1 },
  ]
  for (let i = 0; i < playerCount && i < corners.length; i++) {
    grid[corners[i].r][corners[i].c].terrain = 'plains'
  }
  return { grid, continentCount: contCount }
}

export function placeStartingForces(grid: Territory[][], playerCount: number) {
  const rows = grid.length, cols = grid[0].length
  const corners = [
    { c: 0, r: 0 }, { c: cols - 1, r: rows - 1 },
    { c: cols - 1, r: 0 }, { c: 0, r: rows - 1 },
  ]
  for (let i = 0; i < playerCount; i++) {
    const s = corners[i % corners.length]
    grid[s.r][s.c].armies[i] = 3
    grid[s.r][s.c].cities[i] = 1
  }
}

export function getAdjacent(grid: Territory[][], c: number, r: number): Territory[] {
  const out: Territory[] = []
  if (r > 0) out.push(grid[r - 1][c])
  if (r < grid.length - 1) out.push(grid[r + 1][c])
  if (c > 0) out.push(grid[r][c - 1])
  if (c < grid[0].length - 1) out.push(grid[r][c + 1])
  return out
}

export function getController(t: Territory): number {
  let best = -1, bestCount = 0, tied = false
  for (let i = 0; i < t.armies.length; i++) {
    const total = t.armies[i] + t.cities[i]
    if (total > bestCount) { best = i; bestCount = total; tied = false }
    else if (total === bestCount && total > 0) { tied = true }
  }
  return tied ? -1 : (bestCount > 0 ? best : -1)
}

// ══════════════════════════════════════════════════════════════
//  SCORING
// ══════════════════════════════════════════════════════════════

export function calcScore(st: GameState, pi: number): number {
  let score = 0
  const ps = st.players[pi]
  for (const row of st.territories) {
    for (const t of row) {
      if (getController(t) === pi) score++
    }
  }
  for (let ci = 0; ci < st.continentCount; ci++) {
    let total = 0, owned = 0
    for (const row of st.territories) {
      for (const t of row) {
        if (t.continent === ci) { total++; if (getController(t) === pi) owned++ }
      }
    }
    if (owned > total / 2) score += 3
  }
  for (const row of st.territories) {
    for (const t of row) {
      const cc = t.cities[pi]
      if (cc > 0) {
        const engBonus = ps.abilities.filter(a => a === 'engineer').length
        score += cc * (1 + engBonus) // engineer: cities give +N extra VP each
      }
    }
  }
  for (const ab of ps.abilities) {
    if (ab === 'elixir') score += 1
    if (ab === 'mountain_vp') {
      for (const row of st.territories)
        for (const t of row) if (t.terrain === 'mountain' && getController(t) === pi) score++
    }
    if (ab === 'forest_vp') {
      for (const row of st.territories)
        for (const t of row) if (t.terrain === 'forest' && getController(t) === pi) score++
    }
    if (ab === 'desert_vp') {
      for (const row of st.territories)
        for (const t of row) if (t.terrain === 'desert' && getController(t) === pi) score++
    }
  }
  return score
}

// ══════════════════════════════════════════════════════════════
//  GAME INIT
// ══════════════════════════════════════════════════════════════

export function initState(
  players: PlayerSlot[],
  config: Record<string, string>,
  customCards?: Omit<CardDef, 'id'>[],
  customMap?: MapTemplate,
): GameState {
  const playerCount = players.length
  const turnMode: TurnMode = config.turnMode === 'real-time' ? 'real-time' : 'turn-based'
  const combatMode: CombatMode = config.combatMode === 'immediate' ? 'immediate' : 'classic'

  let grid: Territory[][]
  let cols: number
  let rows: number
  let continentCount: number

  if (customMap) {
    cols = customMap.cols
    rows = customMap.rows
    grid = []
    for (let r = 0; r < rows; r++) {
      const row: Territory[] = []
      for (let c = 0; c < cols; c++) {
        row.push({
          col: c, row: r,
          terrain: customMap.terrains[r]?.[c] || 'plains',
          continent: customMap.continents[r]?.[c] || 0,
          armies: new Array(playerCount).fill(0),
          cities: new Array(playerCount).fill(0),
        })
      }
      grid.push(row)
    }
    // Count unique continents
    const cSet = new Set<number>()
    for (const row of customMap.continents) for (const c of row) cSet.add(c)
    continentCount = cSet.size
    // Place starting forces at custom positions
    for (let i = 0; i < playerCount && i < customMap.startPositions.length; i++) {
      const sp = customMap.startPositions[i]
      if (sp && grid[sp.row]?.[sp.col]) {
        grid[sp.row][sp.col].armies[i] = 3
        grid[sp.row][sp.col].cities[i] = 1
        grid[sp.row][sp.col].terrain = grid[sp.row][sp.col].terrain === 'water' ? 'plains' : grid[sp.row][sp.col].terrain
      }
    }
    // Fallback: if not enough start positions
    if (customMap.startPositions.length < playerCount) {
      const corners = [
        { c: 0, r: 0 }, { c: cols - 1, r: rows - 1 },
        { c: cols - 1, r: 0 }, { c: 0, r: rows - 1 },
      ]
      for (let i = customMap.startPositions.length; i < playerCount; i++) {
        const s = corners[i % corners.length]
        grid[s.r][s.c].armies[i] = 3
        grid[s.r][s.c].cities[i] = 1
      }
    }
  } else {
    const dims = mapDims(config.mapSize || 'medium')
    cols = dims.cols; rows = dims.rows
    const gen = generateMap(cols, rows, playerCount)
    grid = gen.grid; continentCount = gen.continentCount
    placeStartingForces(grid, playerCount)
  }

  const deck = createDeck(customCards)
  const market: (CardDef | null)[] = []
  for (let i = 0; i < MARKET_SIZE; i++) market.push(deck.pop() || null)
  const pStates: PlayerState[] = players.map((p, i) => ({
    index: i, name: p.name, color: p.color || PLAYER_COLORS[i] || '#fff',
    coins: 9, cardsBought: 0, abilities: [], alive: true,
    boughtThisRound: false, pendingAction: null, actionStep: 0, moveSource: null,
    cursorCol: i === 0 ? 0 : cols - 1, cursorRow: i === 0 ? 0 : rows - 1, score: 0,
  }))
  const maxRounds = ROUNDS_BY_PLAYERS[playerCount] || 10
  const endTime = turnMode === 'real-time'
    ? Date.now() + (Number(config.gameDuration) || 8) * 60_000
    : Date.now() + 3600_000
  return {
    territories: grid, cols, rows, players: pStates,
    deck, market, turnMode, combatMode,
    currentPlayer: 0, round: 1, maxRounds,
    endTime, gameOver: false, winner: null,
    log: ['Game started!'], continentCount,
  }
}

// ══════════════════════════════════════════════════════════════
//  GAME ACTIONS
// ══════════════════════════════════════════════════════════════

export function buyCard(st: GameState, pi: number, marketIdx: number): boolean {
  const ps = st.players[pi]
  const card = st.market[marketIdx]
  if (!card) return false
  if (st.turnMode === 'turn-based') {
    if (st.currentPlayer !== pi) return false
    if (ps.boughtThisRound) return false
  }
  const cost = CARD_COSTS[marketIdx] ?? 5
  if (ps.coins < cost) return false
  ps.coins -= cost
  ps.coins += card.coins
  if (card.special) ps.abilities.push(card.special)
  ps.cardsBought++
  const incomeCount = ps.abilities.filter(a => a === 'income').length
  if (incomeCount > 0 && card.special !== 'income') ps.coins += incomeCount
  ps.pendingAction = card
  ps.actionStep = 0
  ps.moveSource = null
  st.market[marketIdx] = null
  if (st.turnMode === 'real-time') refillMarket(st)
  ps.boughtThisRound = true
  st.log.push(`${ps.name} buys "${card.name}" (${card.emoji})`)
  return true
}

export function refillMarket(st: GameState) {
  const newMarket: (CardDef | null)[] = []
  for (const c of st.market) { if (c) newMarket.push(c) }
  while (newMarket.length < MARKET_SIZE) newMarket.push(st.deck.pop() || null)
  st.market = newMarket
}

export function resolveCombat(st: GameState, col: number, row: number) {
  if (st.combatMode !== 'immediate') return
  const t = st.territories[row][col]
  // Diplomat: if any player present has diplomat, no combat on their territories
  const present = t.armies.map((a, i) => ({ idx: i, armies: a })).filter(p => p.armies > 0)
  if (present.length < 2) return
  // Check if any present player has diplomat — they prevent combat
  for (const p of present) {
    if (st.players[p.idx]?.abilities.includes('diplomat')) return
  }
  present.sort((a, b) => b.armies - a.armies)
  for (let i = 0; i < present.length; i++) {
    for (let j = i + 1; j < present.length; j++) {
      const a = present[i], d = present[j]
      if (a.armies <= 0 || d.armies <= 0) continue
      const aLoss = Math.ceil(d.armies / 2)
      const dLoss = Math.ceil(a.armies / 2)
      const defFortify = st.players[d.idx]?.abilities.filter(ab => ab === 'fortify').length || 0
      a.armies = Math.max(0, a.armies - Math.max(1, aLoss))
      d.armies = Math.max(0, d.armies - Math.max(1, dLoss - defFortify))
    }
  }
  for (const p of present) t.armies[p.idx] = p.armies
}

export function executeAction(st: GameState, pi: number, col: number, row: number): boolean {
  const ps = st.players[pi]
  if (!ps.pendingAction) return false
  const card = ps.pendingAction
  const t = st.territories[row]?.[col]
  if (!t) return false
  const extraDeploy = ps.abilities.filter(a => a === 'extra_deploy').length
  const extraMove = ps.abilities.filter(a => a === 'extra_move').length
    + ps.abilities.filter(a => a === 'cavalry').length * 2 // cavalry: +2 per ability
  const canSwim = ps.abilities.includes('scout')
  const siegeBonus = ps.abilities.filter(a => a === 'siege').length
    + ps.abilities.filter(a => a === 'warlord').length // warlord: +1 destroy

  switch (card.action) {
    case 'deploy': {
      if (t.cities[pi] <= 0) return false
      const amount = card.value + extraDeploy
      t.armies[pi] += amount
      resolveCombat(st, col, row)
      st.log.push(`${ps.name} deploys ${amount} armies at (${col},${row})`)
      ps.pendingAction = null
      return true
    }
    case 'move': {
      if (ps.actionStep === 0) {
        if (t.armies[pi] <= 0) return false
        ps.moveSource = { col, row }
        ps.actionStep = 1
        return true
      } else {
        if (!ps.moveSource) { ps.pendingAction = null; return false }
        const dist = bfsDist(st.territories, ps.moveSource.col, ps.moveSource.row, col, row, canSwim)
        const maxDist = card.value + extraMove
        if (dist < 0 || dist > maxDist) return false
        const src = st.territories[ps.moveSource.row][ps.moveSource.col]
        const moveCount = src.armies[pi]
        src.armies[pi] = 0
        t.armies[pi] += moveCount
        resolveCombat(st, col, row)
        st.log.push(`${ps.name} moves ${moveCount} armies to (${col},${row})`)
        ps.pendingAction = null
        ps.moveSource = null
        return true
      }
    }
    case 'build': {
      if (t.armies[pi] <= 0 && t.cities[pi] <= 0) return false
      if (!TERRAIN_PASSABLE[t.terrain] && !canSwim) return false
      t.cities[pi]++
      st.log.push(`${ps.name} builds a city at (${col},${row})`)
      ps.pendingAction = null
      return true
    }
    case 'destroy': {
      let hasAdjacentArmy = t.armies[pi] > 0
      if (!hasAdjacentArmy) {
        for (const adj of getAdjacent(st.territories, col, row)) {
          if (adj.armies[pi] > 0) { hasAdjacentArmy = true; break }
        }
      }
      if (!hasAdjacentArmy) return false
      const destroyAmount = card.value + siegeBonus
      let destroyed = 0
      for (let i = 0; i < t.armies.length; i++) {
        if (i === pi) continue
        const rem = Math.min(t.armies[i], destroyAmount - destroyed)
        if (rem > 0) { t.armies[i] -= rem; destroyed += rem }
        if (destroyed >= destroyAmount) break
      }
      st.log.push(`${ps.name} destroys ${destroyed} enemies at (${col},${row})`)
      ps.pendingAction = null
      return true
    }
  }
  return false
}

export function bfsDist(grid: Territory[][], sc: number, sr: number, dc: number, dr: number, canSwim: boolean): number {
  if (sc === dc && sr === dr) return 0
  const rows = grid.length, cols = grid[0].length
  const visited = Array.from({ length: rows }, () => new Array(cols).fill(false))
  const queue: { c: number; r: number; d: number }[] = [{ c: sc, r: sr, d: 0 }]
  visited[sr][sc] = true
  while (queue.length > 0) {
    const cur = queue.shift()!
    for (const adj of getAdjacent(grid, cur.c, cur.r)) {
      if (visited[adj.row][adj.col]) continue
      if (!TERRAIN_PASSABLE[adj.terrain] && !canSwim) continue
      visited[adj.row][adj.col] = true
      if (adj.col === dc && adj.row === dr) return cur.d + 1
      queue.push({ c: adj.col, r: adj.row, d: cur.d + 1 })
    }
  }
  return -1
}

export function skipAction(ps: PlayerState) {
  ps.pendingAction = null
  ps.moveSource = null
  ps.actionStep = 0
}

export function advanceTurn(st: GameState) {
  if (st.turnMode !== 'turn-based') return
  const allBought = st.players.every(p => p.boughtThisRound || !p.alive)
  if (allBought) {
    refillMarket(st)
    st.round++
    for (const p of st.players) {
      p.boughtThisRound = false
      const inc = p.abilities.filter(a => a === 'income').length
      p.coins += inc
      // Merchant: +1 coin per city
      const merchantCount = p.abilities.filter(a => a === 'merchant').length
      if (merchantCount > 0) {
        let cityTotal = 0
        for (const row of st.territories) for (const t of row) cityTotal += t.cities[p.index]
        p.coins += merchantCount * cityTotal
      }
    }
    st.currentPlayer = 0
    if (st.round > st.maxRounds) endGame(st)
  } else {
    let next = (st.currentPlayer + 1) % st.players.length
    let safety = 0
    while ((st.players[next].boughtThisRound || !st.players[next].alive) && safety < st.players.length) {
      next = (next + 1) % st.players.length; safety++
    }
    st.currentPlayer = next
  }
}

export function endGame(st: GameState) {
  st.gameOver = true
  let bestScore = -1, bestName = ''
  for (const p of st.players) {
    p.score = calcScore(st, p.index)
    if (p.score > bestScore) { bestScore = p.score; bestName = p.name }
  }
  st.winner = bestName
  st.log.push(`Game over! ${bestName} wins with ${bestScore} VP!`)
}

// ══════════════════════════════════════════════════════════════
//  SIMPLE BOT AI
// ══════════════════════════════════════════════════════════════

export function botTurn(st: GameState, pi: number) {
  const ps = st.players[pi]
  if (!ps.alive || ps.boughtThisRound) return
  let bestIdx = -1, bestScore = -999
  for (let i = 0; i < st.market.length; i++) {
    const card = st.market[i]
    if (!card) continue
    const cost = CARD_COSTS[i] ?? 5
    if (cost > ps.coins) continue
    let score = card.value + card.coins * 2
    if (card.action === 'deploy') score += 3
    if (card.action === 'move') score += 2
    if (card.special) score += 2
    score -= cost
    if (score > bestScore) { bestScore = score; bestIdx = i }
  }
  if (bestIdx < 0) { ps.boughtThisRound = true; return }
  buyCard(st, pi, bestIdx)
  if (ps.pendingAction) {
    const card = ps.pendingAction
    if (card.action === 'deploy') {
      for (const row of st.territories) {
        for (const t of row) {
          if (t.cities[pi] > 0) { executeAction(st, pi, t.col, t.row); return }
        }
      }
      skipAction(ps)
    } else if (card.action === 'move') {
      let bestSrc: Territory | null = null, mostArmies = 0
      for (const row of st.territories)
        for (const t of row) if (t.armies[pi] > mostArmies) { mostArmies = t.armies[pi]; bestSrc = t }
      if (bestSrc && mostArmies > 0) {
        executeAction(st, pi, bestSrc.col, bestSrc.row)
        const adjs = getAdjacent(st.territories, bestSrc.col, bestSrc.row).filter(a => TERRAIN_PASSABLE[a.terrain])
        const target = adjs.find(a => getController(a) !== pi) || adjs[0]
        if (target) executeAction(st, pi, target.col, target.row)
        else skipAction(ps)
      } else skipAction(ps)
    } else if (card.action === 'build') {
      for (const row of st.territories) {
        for (const t of row) {
          if (t.armies[pi] > 0 && t.cities[pi] === 0) { executeAction(st, pi, t.col, t.row); return }
        }
      }
      skipAction(ps)
    } else if (card.action === 'destroy') {
      for (const row of st.territories) {
        for (const t of row) {
          const hasEnemy = t.armies.some((a, i) => i !== pi && a > 0)
          if (!hasEnemy) continue
          if (getAdjacent(st.territories, t.col, t.row).some(a => a.armies[pi] > 0) || t.armies[pi] > 0) {
            executeAction(st, pi, t.col, t.row); return
          }
        }
      }
      skipAction(ps)
    }
  }
}
