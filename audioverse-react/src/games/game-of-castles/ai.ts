/**
 * ai.ts — AI player strategy, decision-making, and difficulty scaling.
 */
import type {
  GameState, Hero, CreatureStack,
} from './types'
import { DIFFICULTY_MODS } from './constants'
import { ALL_CREATURES, getCreaturesForFaction } from './factions'
import { calcArmyPower, getSkillLevel, calcVisionRange } from './heroes'
import { canRecruit, canHireHero } from './economy'
import { getBuildingsForFaction, canBuild } from './buildings'
import { isPassable, getMovementCost } from './mapGenerator'
import { initCombat, executeAction, getActiveStack } from './combat'
import type { CombatAction } from './combat'

// ═════════════════════════════════════════════════════════════
//  AI STRATEGY
// ═════════════════════════════════════════════════════════════
export type AIGoal = 'expand' | 'build' | 'recruit' | 'attack' | 'defend' | 'explore'

export interface AIDecision {
  heroId: string
  actions: AIHeroAction[]
}

export interface AIHeroAction {
  type: 'move' | 'enter_town' | 'attack_army' | 'pickup_treasure' | 'capture_mine'
  targetX: number
  targetY: number
  targetId?: string
}

// ═════════════════════════════════════════════════════════════
//  AI TURN PLANNING
// ═════════════════════════════════════════════════════════════

/** Plan the AI player's full turn — building, recruiting, hero movement */
export function planAITurn(state: GameState, playerId: number): AITurnPlan {
  const difficulty = state.difficulty
  const mods = DIFFICULTY_MODS[difficulty]

  const myTowns = state.towns.filter(t => t.owner === playerId)
  const myHeroes = state.heroes.filter(h => h.owner === playerId && h.alive)
  const myResources = state.resources[playerId]

  const plan: AITurnPlan = {
    buildActions: [],
    recruitActions: [],
    heroActions: [],
    hireHero: false,
  }

  // ── 1. Town Building ──
  for (const town of myTowns) {
    const builtIds = new Set(town.buildings.filter(b => b.built).map(b => b.buildingId))
    const _available = getBuildingsForFaction(town.faction)
    void _available

    // Priority: income → dwellings → fort → mage guild
    const priorities = [
      'town_hall', 'city_hall', 'capitol',
      `${town.faction}_tier2`, `${town.faction}_tier3`, `${town.faction}_tier4`,
      'fort', 'citadel', 'castle_walls',
      `${town.faction}_tier5`, `${town.faction}_tier6`, `${town.faction}_tier7`,
      'mage_guild_1', 'mage_guild_2', 'mage_guild_3',
      'marketplace', 'tavern', 'blacksmith',
    ]

    for (const buildingId of priorities) {
      if (builtIds.has(buildingId)) continue
      const result = canBuild(buildingId, builtIds, myResources)
      if (result.ok) {
        plan.buildActions.push({ townId: town.id, buildingId })
        break // one building per town per day
      }
    }
  }

  // ── 2. Recruitment ──
  for (const town of myTowns) {
    const creatures = getCreaturesForFaction(town.faction)
    // Recruit from highest tier to lowest
    for (const c of [...creatures].reverse()) {
      const pool = town.creaturePool.find(p => p.creatureId === c.id)
      const available = pool?.available ?? 0
      if (available <= 0) continue
      const check = canRecruit(town, c.id, available, myResources)
      if (check.ok) {
        plan.recruitActions.push({ townId: town.id, creatureId: c.id, count: available })
      }
    }
  }

  // ── 3. Hire hero if we have fewer than 2 and can afford ──
  if (myHeroes.length < 2 && myTowns.length > 0) {
    if (canHireHero(myTowns[0], myResources)) {
      plan.hireHero = true
    }
  }

  // ── 4. Hero movement decisions ──
  for (const hero of myHeroes) {
    const actions = planHeroActions(state, hero, playerId, mods)
    plan.heroActions.push({ heroId: hero.id, actions })
  }

  return plan
}

export interface AITurnPlan {
  buildActions: { townId: string; buildingId: string }[]
  recruitActions: { townId: string; creatureId: string; count: number }[]
  heroActions: { heroId: string; actions: AIHeroAction[] }[]
  hireHero: boolean
}

// ═════════════════════════════════════════════════════════════
//  HERO AI — MOVEMENT & TARGETING
// ═════════════════════════════════════════════════════════════
function planHeroActions(
  state: GameState,
  hero: Hero,
  playerId: number,
  mods: (typeof DIFFICULTY_MODS)[keyof typeof DIFFICULTY_MODS],
): AIHeroAction[] {
  const actions: AIHeroAction[] = []
  const power = calcArmyPower(hero.army) * mods.aiArmyMult

  // Find nearest targets by priority
  type Target = { type: AIHeroAction['type']; x: number; y: number; id?: string; priority: number; dist: number }
  const targets: Target[] = []

  // Uncollected treasures
  for (const t of state.treasures) {
    if (t.collected) continue
    const dist = Math.abs(t.x - hero.x) + Math.abs(t.y - hero.y)
    targets.push({ type: 'pickup_treasure', x: t.x, y: t.y, id: t.id, priority: 3, dist })
  }

  // Unowned mines
  for (const m of state.mines) {
    if (m.owner === playerId) continue
    const dist = Math.abs(m.x - hero.x) + Math.abs(m.y - hero.y)
    const guardPower = m.guardArmy ? calcArmyPower(m.guardArmy) : 0
    if (power > guardPower * 1.3) {
      targets.push({ type: 'capture_mine', x: m.x, y: m.y, id: m.id, priority: 5, dist })
    }
  }

  // Enemy heroes (if we're stronger)
  for (const eh of state.heroes) {
    if (eh.owner === playerId || !eh.alive) continue
    const dist = Math.abs(eh.x - hero.x) + Math.abs(eh.y - hero.y)
    const enemyPower = calcArmyPower(eh.army)
    if (power > enemyPower * mods.aiArmyMult) {
      targets.push({ type: 'attack_army', x: eh.x, y: eh.y, id: eh.id, priority: 8, dist })
    }
  }

  // Neutral armies on the map (if weak enough)
  for (const obj of state.mapObjects) {
    if (obj.type !== 'neutral_army' || obj.visited) continue
    const dist = Math.abs(obj.x - hero.x) + Math.abs(obj.y - hero.y)
    const guardPower = obj.army ? calcArmyPower(obj.army) : 0
    if (power > guardPower * 1.5) {
      targets.push({ type: 'attack_army', x: obj.x, y: obj.y, id: obj.id, priority: 2, dist })
    }
  }

  // Own towns to visit (for recruitment)
  for (const town of state.towns) {
    if (town.owner !== playerId) continue
    const dist = Math.abs(town.x - hero.x) + Math.abs(town.y - hero.y)
    if (dist > 0) {
      const hasCreatures = town.creaturePool.some(c => c.available > 0)
      if (hasCreatures) {
        targets.push({ type: 'enter_town', x: town.x, y: town.y, id: town.id, priority: 4, dist })
      }
    }
  }

  // Sort by priority (high first), then distance (close first)
  targets.sort((a, b) => b.priority - a.priority || a.dist - b.dist)

  // Pick best target
  const best = targets[0]
  if (best) {
    // Move toward target
    const path = findPath(state, hero.x, hero.y, best.x, best.y)
    if (path.length > 0) {
      // Move along path up to movement points
      let remaining = hero.movementPoints
      for (const step of path) {
        const terrain = state.map.cells[step.y][step.x].terrain
        const cost = getMovementCost(terrain, getSkillLevel(hero, 'pathfinding'))
        if (remaining < cost) break
        remaining -= cost
        actions.push({
          type: step.x === best.x && step.y === best.y ? best.type : 'move',
          targetX: step.x,
          targetY: step.y,
          targetId: step.x === best.x && step.y === best.y ? best.id : undefined,
        })
      }
    }
  } else {
    // Explore — move to nearest unexplored area
    const visionRange = calcVisionRange(hero)
    for (let r = visionRange + 1; r < state.map.rows; r++) {
      let found = false
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const nx = hero.x + dx
          const ny = hero.y + dy
          if (nx >= 0 && nx < state.map.cols && ny >= 0 && ny < state.map.rows) {
            if (!state.map.cells[ny][nx].explored[playerId] && isPassable(state.map, nx, ny)) {
              actions.push({ type: 'move', targetX: nx, targetY: ny })
              found = true
            }
          }
        }
      }
      if (found) break
    }
  }

  return actions
}

// ═════════════════════════════════════════════════════════════
//  PATHFINDING (A*)
// ═════════════════════════════════════════════════════════════
function findPath(
  state: GameState,
  sx: number, sy: number,
  tx: number, ty: number,
): { x: number; y: number }[] {
  const { cols, rows } = state.map
  const open: { x: number; y: number; g: number; h: number; f: number; parent: string | null }[] = []
  const closed = new Set<string>()
  const cameFrom = new Map<string, string>()

  const h = (x: number, y: number) => Math.abs(x - tx) + Math.abs(y - ty)
  const key = (x: number, y: number) => `${x},${y}`

  const gScores = new Map<string, number>()
  gScores.set(key(sx, sy), 0)
  open.push({ x: sx, y: sy, g: 0, h: h(sx, sy), f: h(sx, sy), parent: null })

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f)
    const current = open.shift()!
    const ck = key(current.x, current.y)

    if (current.x === tx && current.y === ty) {
      // Reconstruct path
      const path: { x: number; y: number }[] = []
      let k: string | undefined = ck
      while (k) {
        const [px, py] = k.split(',').map(Number)
        if (px !== sx || py !== sy) path.unshift({ x: px, y: py })
        k = cameFrom.get(k)
      }
      return path
    }

    closed.add(ck)

    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = current.x + dx
      const ny = current.y + dy
      const nk = key(nx, ny)

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue
      if (closed.has(nk)) continue
      if (!isPassable(state.map, nx, ny) && !(nx === tx && ny === ty)) continue

      const moveCost = getMovementCost(state.map.cells[ny][nx].terrain, 0)
      const tentG = current.g + moveCost

      if (!gScores.has(nk) || tentG < gScores.get(nk)!) {
        gScores.set(nk, tentG)
        cameFrom.set(nk, ck)
        open.push({ x: nx, y: ny, g: tentG, h: h(nx, ny), f: tentG + h(nx, ny), parent: ck })
      }
    }
  }

  return [] // no path found
}

// ═════════════════════════════════════════════════════════════
//  AI COMBAT — auto-resolve turn-based combat actions
// ═════════════════════════════════════════════════════════════
export function aiCombatAction(state: import('./combat').CombatStack, allStacks: import('./combat').CombatStack[], _hero: Hero | null): CombatAction {
  const enemySide = state.side === 'attacker' ? 'defender' : 'attacker'
  const enemies = allStacks.filter(s => s.side === enemySide && s.count > 0)
  if (enemies.length === 0) return { type: 'wait' }

  const def = ALL_CREATURES[state.creatureId]!

  // Ranged units: shoot weakest enemy
  if (def.shots > 0 && state.shotsLeft > 0) {
    const adjacent = allStacks.filter(s =>
      s.side === enemySide && s.count > 0 &&
      Math.abs(s.x - state.x) <= 1 && Math.abs(s.y - state.y) <= 1
    )
    if (adjacent.length === 0) {
      // Sort enemies by current strength (weakest first for efficient kills)
      enemies.sort((a, b) => {
        const aHp = a.currentHp + (a.count - 1) * ALL_CREATURES[a.creatureId]!.hp
        const bHp = b.currentHp + (b.count - 1) * ALL_CREATURES[b.creatureId]!.hp
        return aHp - bHp
      })
      return { type: 'shoot', targetStackId: enemies[0].id }
    }
  }

  // Melee: attack adjacent if possible
  const adjacent = enemies.filter(e =>
    Math.abs(e.x - state.x) <= 1 && Math.abs(e.y - state.y) <= 1
  )
  if (adjacent.length > 0) {
    // Attack weakest adjacent
    adjacent.sort((a, b) => {
      const aHp = a.currentHp + (a.count - 1) * ALL_CREATURES[a.creatureId]!.hp
      const bHp = b.currentHp + (b.count - 1) * ALL_CREATURES[b.creatureId]!.hp
      return aHp - bHp
    })
    return { type: 'attack', targetStackId: adjacent[0].id }
  }

  // Move toward nearest enemy and attack
  let nearest = enemies[0]
  let nearestDist = Infinity
  for (const e of enemies) {
    const d = Math.abs(e.x - state.x) + Math.abs(e.y - state.y)
    if (d < nearestDist) {
      nearestDist = d
      nearest = e
    }
  }

  // Move adjacent to nearest enemy
  return { type: 'attack', targetStackId: nearest.id, targetX: nearest.x, targetY: nearest.y }
}

/** Auto-resolve an entire combat (for quick resolve or AI vs AI) */
export function autoResolveCombat(
  attackerHero: Hero | null,
  defenderHero: Hero | null,
  attackerArmy: (CreatureStack | null)[],
  defenderArmy: (CreatureStack | null)[],
): import('./types').CombatState {
  let combat = initCombat(attackerArmy, defenderArmy, attackerHero, defenderHero)

  let safety = 0
  while (!combat.finished && safety < 500) {
    const active = getActiveStack(combat)
    if (!active) break

    const action = aiCombatAction(active, combat.stacks, active.side === 'attacker' ? attackerHero : defenderHero)
    combat = executeAction(combat, action, attackerHero, defenderHero)
    safety++
  }

  return combat
}
