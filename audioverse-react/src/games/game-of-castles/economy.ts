/**
 * economy.ts — Resource management, income, recruitment, trading.
 */
import type {
  ResourceBundle, Town, Hero, CreatureStack,
} from './types'
import { EMPTY_RESOURCES } from './types'
import { MINE_INCOME, MARKET_RATE, TAVERN_HERO_COST, START_RESOURCES } from './constants'
import { ALL_CREATURES, getCreaturesForFaction } from './factions'
import { ALL_BUILDINGS, calcTownIncome } from './buildings'
import { getSkillLevel } from './heroes'

// ═════════════════════════════════════════════════════════════
//  RESOURCE UTILITIES
// ═════════════════════════════════════════════════════════════
export function addResources(a: ResourceBundle, b: Partial<ResourceBundle>): ResourceBundle {
  return {
    gold: a.gold + (b.gold || 0),
    wood: a.wood + (b.wood || 0),
    ore: a.ore + (b.ore || 0),
    crystals: a.crystals + (b.crystals || 0),
    gems: a.gems + (b.gems || 0),
    mercury: a.mercury + (b.mercury || 0),
    sulfur: a.sulfur + (b.sulfur || 0),
  }
}

export function subtractResources(a: ResourceBundle, b: ResourceBundle): ResourceBundle {
  return {
    gold: a.gold - b.gold,
    wood: a.wood - b.wood,
    ore: a.ore - b.ore,
    crystals: a.crystals - b.crystals,
    gems: a.gems - b.gems,
    mercury: a.mercury - b.mercury,
    sulfur: a.sulfur - b.sulfur,
  }
}

export function canAfford(resources: ResourceBundle, cost: ResourceBundle): boolean {
  return (
    resources.gold >= cost.gold &&
    resources.wood >= cost.wood &&
    resources.ore >= cost.ore &&
    resources.crystals >= cost.crystals &&
    resources.gems >= cost.gems &&
    resources.mercury >= cost.mercury &&
    resources.sulfur >= cost.sulfur
  )
}

export function getStartingResources(): ResourceBundle {
  return { ...START_RESOURCES }
}

// ═════════════════════════════════════════════════════════════
//  DAILY INCOME
// ═════════════════════════════════════════════════════════════
export function calcDailyIncome(
  towns: Town[],
  mines: { owner: number | null; resourceType: keyof ResourceBundle }[],
  heroes: Hero[],
): ResourceBundle {
  let income: ResourceBundle = { ...EMPTY_RESOURCES }

  // Town income (from buildings like Village Hall -> Capitol)
  for (const town of towns) {
    const townIncome = calcTownIncome(town.buildings)
    income = addResources(income, townIncome)
  }

  // Mine income
  for (const mine of mines) {
    const amount = MINE_INCOME[mine.resourceType] || 0
    income = addResources(income, { [mine.resourceType]: amount })
  }

  // Hero estates skill
  for (const hero of heroes) {
    if (!hero.alive) continue
    const estatesLevel = getSkillLevel(hero, 'estates')
    if (estatesLevel > 0) {
      const bonus = [0, 125, 250, 500][estatesLevel]
      income = addResources(income, { gold: bonus })
    }
  }

  return income
}

// ═════════════════════════════════════════════════════════════
//  CREATURE RECRUITMENT
// ═════════════════════════════════════════════════════════════

/** Check if a creature can be recruited from a town */
export function canRecruit(
  town: Town,
  creatureId: string,
  count: number,
  playerResources: ResourceBundle,
): { ok: boolean; reason: string; totalCost: ResourceBundle } {
  const cDef = ALL_CREATURES[creatureId]
  if (!cDef) return { ok: false, reason: 'Unknown creature', totalCost: EMPTY_RESOURCES }

  // Check if the town has the creature dwelling built
  const tierBuilding = town.buildings.find(b => {
    const bDef = ALL_BUILDINGS[b.buildingId]
    return bDef && bDef.creatureTier === cDef.tier && b.built
  })
  if (!tierBuilding) return { ok: false, reason: 'No dwelling built', totalCost: EMPTY_RESOURCES }

  // Check available pool
  const poolEntry = town.creaturePool.find(p => p.creatureId === creatureId)
  const available = poolEntry?.available ?? 0
  if (count > available) return { ok: false, reason: `Only ${available} available`, totalCost: EMPTY_RESOURCES }

  // Cost
  const totalCost: ResourceBundle = {
    gold: cDef.cost.gold * count,
    wood: cDef.cost.wood * count,
    ore: cDef.cost.ore * count,
    crystals: cDef.cost.crystals * count,
    gems: cDef.cost.gems * count,
    mercury: cDef.cost.mercury * count,
    sulfur: cDef.cost.sulfur * count,
  }

  if (!canAfford(playerResources, totalCost)) {
    return { ok: false, reason: 'Not enough resources', totalCost }
  }

  return { ok: true, reason: '', totalCost }
}

/** Recruit creatures into a hero's army or town garrison */
export function recruitCreatures(
  town: Town,
  creatureId: string,
  count: number,
  targetArmy: (CreatureStack | null)[],
): { army: (CreatureStack | null)[]; town: Town; cost: ResourceBundle } {
  const cDef = ALL_CREATURES[creatureId]!
  const cost: ResourceBundle = {
    gold: cDef.cost.gold * count,
    wood: cDef.cost.wood * count,
    ore: cDef.cost.ore * count,
    crystals: cDef.cost.crystals * count,
    gems: cDef.cost.gems * count,
    mercury: cDef.cost.mercury * count,
    sulfur: cDef.cost.sulfur * count,
  }

  // Find existing stack or empty slot
  const army = targetArmy.map(s => s ? { ...s } : null)
  let placed = false

  for (let i = 0; i < army.length; i++) {
    if (army[i] && army[i]!.creatureId === creatureId) {
      army[i] = { ...army[i]!, count: army[i]!.count + count }
      placed = true
      break
    }
  }

  if (!placed) {
    for (let i = 0; i < army.length; i++) {
      if (!army[i]) {
        army[i] = {
          creatureId,
          count,
          statusEffects: [],
          morale: 0,
          luck: 0,
          hasActed: false,
          hasRetaliated: false,
          shotsLeft: cDef.shots,
        }
        placed = true
        break
      }
    }
  }

  // Update town pool
  const newPool = town.creaturePool.map(p =>
    p.creatureId === creatureId ? { ...p, available: Math.max(0, p.available - count) } : p
  )

  return {
    army: army as (CreatureStack | null)[],
    town: { ...town, creaturePool: newPool },
    cost,
  }
}

// ═════════════════════════════════════════════════════════════
//  CREATURE GROWTH (weekly)
// ═════════════════════════════════════════════════════════════
export function applyWeeklyGrowth(town: Town): Town {
  const faction = town.faction
  const creatures = getCreaturesForFaction(faction)
  const newPool = [...town.creaturePool.map(p => ({ ...p }))]

  // Calculate growth bonus from fort level
  let growthBonus = 0
  for (const tb of town.buildings) {
    if (!tb.built) continue
    const bDef = ALL_BUILDINGS[tb.buildingId]
    if (bDef?.effects.creatureGrowthBonus) {
      growthBonus = Math.max(growthBonus, bDef.effects.creatureGrowthBonus)
    }
  }

  for (const c of creatures) {
    // Only grow if dwelling is built
    const hasDwelling = town.buildings.some(b => {
      const bDef = ALL_BUILDINGS[b.buildingId]
      return bDef && bDef.creatureTier === c.tier && b.built
    })
    if (!hasDwelling) continue

    const baseGrowth = c.growth
    const bonusGrowth = Math.floor(baseGrowth * growthBonus / 100)
    const existing = newPool.find(p => p.creatureId === c.id)
    if (existing) {
      existing.available += baseGrowth + bonusGrowth
    } else {
      newPool.push({ creatureId: c.id, available: baseGrowth + bonusGrowth })
    }
  }

  return { ...town, creaturePool: newPool }
}

// ═════════════════════════════════════════════════════════════
//  MARKETPLACE TRADING
// ═════════════════════════════════════════════════════════════
export function getTradeRate(town: Town): number {
  const hasMarketplace = town.buildings.some(b => b.buildingId === 'marketplace' && b.built)
  if (!hasMarketplace) return 0 // can't trade
  // Check for multiple marketplaces (player-wide)
  return MARKET_RATE
}

export function canTrade(
  sellType: keyof ResourceBundle,
  buyType: keyof ResourceBundle,
  sellAmount: number,
  resources: ResourceBundle,
  rate: number,
): { ok: boolean; buyAmount: number } {
  if (rate <= 0) return { ok: false, buyAmount: 0 }
  if (resources[sellType] < sellAmount) return { ok: false, buyAmount: 0 }

  // Gold trades at 1:1 ratio for gold side
  let buyAmount: number
  if (sellType === 'gold') {
    buyAmount = Math.floor(sellAmount / (rate * 100)) // e.g., 500 gold → 1 resource at rate 5
  } else if (buyType === 'gold') {
    buyAmount = sellAmount * 100 // 1 resource → 100 gold
  } else {
    buyAmount = Math.floor(sellAmount / rate) // resource→resource at ratio
  }

  return { ok: buyAmount > 0, buyAmount }
}

export function executeTrade(
  sellType: keyof ResourceBundle,
  buyType: keyof ResourceBundle,
  sellAmount: number,
  buyAmount: number,
  resources: ResourceBundle,
): ResourceBundle {
  const result = { ...resources }
  result[sellType] -= sellAmount
  result[buyType] += buyAmount
  return result
}

// ═════════════════════════════════════════════════════════════
//  BUILDING PURCHASE
// ═════════════════════════════════════════════════════════════
export function purchaseBuilding(
  town: Town,
  buildingId: string,
  resources: ResourceBundle,
): { town: Town; resources: ResourceBundle; success: boolean } {
  const bDef = ALL_BUILDINGS[buildingId]
  if (!bDef) return { town, resources, success: false }

  if (!canAfford(resources, bDef.cost)) return { town, resources, success: false }

  // Check prerequisites
  const builtIds = new Set(town.buildings.filter(b => b.built).map(b => b.buildingId))
  for (const prereq of bDef.prerequisites) {
    if (!builtIds.has(prereq)) return { town, resources, success: false }
  }

  // Build
  const newBuildings = town.buildings.map(b =>
    b.buildingId === buildingId ? { ...b, built: true } : b
  )

  // If not in list yet, add it
  if (!newBuildings.some(b => b.buildingId === buildingId)) {
    newBuildings.push({ buildingId, built: true, level: 1 })
  }

  // Update town metadata
  const newTown = { ...town, buildings: newBuildings }

  // Fort level
  if (bDef.effects.fortLevel) {
    newTown.fortLevel = Math.max(newTown.fortLevel, bDef.effects.fortLevel)
  }
  // Mage guild
  if (bDef.effects.mageGuild) {
    newTown.mageGuildLevel = Math.max(newTown.mageGuildLevel, bDef.effects.mageGuild)
  }

  const newResources = subtractResources(resources, bDef.cost)
  return { town: newTown, resources: newResources, success: true }
}

// ═════════════════════════════════════════════════════════════
//  HERO HIRING
// ═════════════════════════════════════════════════════════════
export function canHireHero(town: Town, resources: ResourceBundle): boolean {
  const hasTavern = town.buildings.some(b => b.buildingId === 'tavern' && b.built)
  return hasTavern && resources.gold >= TAVERN_HERO_COST
}

// ═════════════════════════════════════════════════════════════
//  ARMY MANAGEMENT
// ═════════════════════════════════════════════════════════════
export function mergeArmyStacks(army: (CreatureStack | null)[]): (CreatureStack | null)[] {
  const merged: (CreatureStack | null)[] = Array(7).fill(null)
  const groups = new Map<string, CreatureStack>()

  for (const s of army) {
    if (!s) continue
    const existing = groups.get(s.creatureId)
    if (existing) {
      existing.count += s.count
    } else {
      groups.set(s.creatureId, { ...s })
    }
  }

  let idx = 0
  for (const stack of groups.values()) {
    if (idx < 7) {
      merged[idx] = stack
      idx++
    }
  }

  return merged
}

export function splitStack(
  army: (CreatureStack | null)[],
  fromSlot: number,
  toSlot: number,
  count: number,
): (CreatureStack | null)[] {
  const result = army.map(s => s ? { ...s } : null)
  const source = result[fromSlot]
  if (!source || source.count <= count) return result
  if (result[toSlot] !== null) return result // target must be empty

  result[toSlot] = { ...source, count }
  result[fromSlot] = { ...source, count: source.count - count }
  return result
}

export function swapArmySlots(
  army: (CreatureStack | null)[],
  a: number,
  b: number,
): (CreatureStack | null)[] {
  const result = [...army]
  const temp = result[a]
  result[a] = result[b]
  result[b] = temp
  return result
}

/** Transfer army between hero and town garrison */
export function transferStack(
  sourceArmy: (CreatureStack | null)[],
  targetArmy: (CreatureStack | null)[],
  sourceSlot: number,
  targetSlot: number,
): { source: (CreatureStack | null)[]; target: (CreatureStack | null)[] } {
  const src = sourceArmy.map(s => s ? { ...s } : null)
  const tgt = targetArmy.map(s => s ? { ...s } : null)

  if (!src[sourceSlot]) return { source: src, target: tgt }

  if (tgt[targetSlot] && tgt[targetSlot]!.creatureId === src[sourceSlot]!.creatureId) {
    // Merge same creature type
    tgt[targetSlot] = { ...tgt[targetSlot]!, count: tgt[targetSlot]!.count + src[sourceSlot]!.count }
    src[sourceSlot] = null
  } else if (!tgt[targetSlot]) {
    // Move to empty slot
    tgt[targetSlot] = src[sourceSlot]
    src[sourceSlot] = null
  } else {
    // Swap different creatures
    const temp = tgt[targetSlot]
    tgt[targetSlot] = src[sourceSlot]
    src[sourceSlot] = temp
  }

  return { source: src, target: tgt }
}
