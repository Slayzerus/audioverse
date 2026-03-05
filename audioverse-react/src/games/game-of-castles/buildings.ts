/**
 * buildings.ts — Town building tree system.
 *
 * Universal buildings (available to all factions) + creature dwellings (per tier).
 * Each building has prerequisites, cost, and effects.
 */
import type { BuildingDef, BuildingId, FactionId, ResourceBundle, Town, TownBuilding } from './types'
import { EMPTY_RESOURCES } from './types'

// ─── Helper ──────────────────────────────────────────────────
function res(gold: number, extra?: Partial<ResourceBundle>): ResourceBundle {
  return { ...EMPTY_RESOURCES, gold, ...extra }
}

// ═════════════════════════════════════════════════════════════
//  UNIVERSAL BUILDINGS (all factions)
// ═════════════════════════════════════════════════════════════
const UNIVERSAL: BuildingDef[] = [
  // ── Fortifications ──
  {
    id: 'fort', name: 'Fort', description: 'Basic walls. Allows garrison defense.',
    cost: res(5000, { wood: 5, ore: 5 }), prerequisites: [],
    creatureTier: 0, effects: { fortLevel: 1 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'citadel', name: 'Citadel', description: 'Upgraded walls with moat. +50% creature growth.',
    cost: res(10000, { wood: 5, ore: 5 }), prerequisites: ['fort'],
    creatureTier: 0, effects: { fortLevel: 2, creatureGrowthBonus: 50 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'castle_walls', name: 'Castle', description: 'Full castle fortification with towers. +100% creature growth.',
    cost: res(20000, { wood: 10, ore: 10 }), prerequisites: ['citadel'],
    creatureTier: 0, effects: { fortLevel: 3, creatureGrowthBonus: 100 }, factions: 'all', maxLevel: 1,
  },
  // ── Town Hall chain ──
  {
    id: 'village_hall', name: 'Village Hall', description: '+500 gold/day.',
    cost: res(0), prerequisites: [],
    creatureTier: 0, effects: { incomeGold: 500 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'town_hall', name: 'Town Hall', description: '+1000 gold/day.',
    cost: res(2500), prerequisites: ['village_hall'],
    creatureTier: 0, effects: { incomeGold: 1000 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'city_hall', name: 'City Hall', description: '+2000 gold/day. Requires marketplace and mage guild.',
    cost: res(5000), prerequisites: ['town_hall', 'marketplace', 'mage_guild_1'],
    creatureTier: 0, effects: { incomeGold: 2000 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'capitol', name: 'Capitol', description: '+4000 gold/day. Only one per player.',
    cost: res(10000, { wood: 5, ore: 5 }), prerequisites: ['city_hall', 'castle_walls'],
    creatureTier: 0, effects: { incomeGold: 4000 }, factions: 'all', maxLevel: 1,
  },
  // ── Mage Guild chain ──
  {
    id: 'mage_guild_1', name: 'Mage Guild Lv 1', description: 'Teaches level 1 spells.',
    cost: res(2000, { wood: 5, ore: 5 }), prerequisites: [],
    creatureTier: 0, effects: { mageGuild: 1 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'mage_guild_2', name: 'Mage Guild Lv 2', description: 'Teaches level 1-2 spells.',
    cost: res(3000, { wood: 5, ore: 5, crystals: 2 }), prerequisites: ['mage_guild_1'],
    creatureTier: 0, effects: { mageGuild: 2 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'mage_guild_3', name: 'Mage Guild Lv 3', description: 'Teaches level 1-3 spells.',
    cost: res(5000, { wood: 5, ore: 5, crystals: 3, gems: 3 }), prerequisites: ['mage_guild_2'],
    creatureTier: 0, effects: { mageGuild: 3 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'mage_guild_4', name: 'Mage Guild Lv 4', description: 'Teaches level 1-4 spells.',
    cost: res(8000, { wood: 5, ore: 5, crystals: 4, gems: 4, mercury: 2 }), prerequisites: ['mage_guild_3'],
    creatureTier: 0, effects: { mageGuild: 4 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'mage_guild_5', name: 'Mage Guild Lv 5', description: 'Teaches all spells.',
    cost: res(12000, { wood: 5, ore: 5, crystals: 5, gems: 5, mercury: 3, sulfur: 3 }), prerequisites: ['mage_guild_4'],
    creatureTier: 0, effects: { mageGuild: 5 }, factions: 'all', maxLevel: 1,
  },
  // ── Economy ──
  {
    id: 'marketplace', name: 'Marketplace', description: 'Enables resource trading (5:1 ratio).',
    cost: res(500, { wood: 5 }), prerequisites: [],
    creatureTier: 0, effects: { marketEnabled: true }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'resource_silo', name: 'Resource Silo', description: '+1 of faction-specific rare resource per day.',
    cost: res(5000, { wood: 5, ore: 5 }), prerequisites: ['marketplace'],
    creatureTier: 0, effects: {}, factions: 'all', maxLevel: 1,
  },
  {
    id: 'blacksmith', name: 'Blacksmith', description: 'Allows buying war machines (ballista, etc).',
    cost: res(1000, { wood: 5, ore: 5 }), prerequisites: [],
    creatureTier: 0, effects: { blacksmithEnabled: true }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'tavern', name: 'Tavern', description: 'Allows hiring heroes. +1 Morale.',
    cost: res(500, { wood: 5 }), prerequisites: [],
    creatureTier: 0, effects: { moraleBonus: 1 }, factions: 'all', maxLevel: 1,
  },
  {
    id: 'shipyard', name: 'Shipyard', description: 'Build ships to cross water.',
    cost: res(2000, { wood: 10 }), prerequisites: [],
    creatureTier: 0, effects: { shipyardEnabled: true }, factions: 'all', maxLevel: 1,
  },
  // ── Special ──
  {
    id: 'grail_structure', name: 'Grail Structure', description: 'Legendary structure. +5000 gold/day, all visitors +2 morale.',
    cost: res(0), prerequisites: [], // built only when Grail artifact is used
    creatureTier: 0, effects: { incomeGold: 5000, moraleBonus: 2 }, factions: 'all', maxLevel: 1,
  },
]

// ═════════════════════════════════════════════════════════════
//  CREATURE DWELLINGS (per tier, faction-specific)
// ═════════════════════════════════════════════════════════════

/** Generate creature dwelling building for each faction tier */
function dwelling(tier: 1|2|3|4|5|6|7, name: string, faction: FactionId, goldCost: number, extras?: Partial<ResourceBundle>, prereqs?: BuildingId[]): BuildingDef {
  return {
    id: `${faction}_tier${tier}`,
    name,
    description: `Recruits tier ${tier} creatures for ${faction}. Upgradeable to level 3.`,
    cost: res(goldCost, extras),
    prerequisites: prereqs || (tier > 1 ? [`${faction}_tier${tier - 1}`] : []),
    creatureTier: tier,
    effects: {},
    factions: [faction],
    maxLevel: 3,  // dwellings can be upgraded 3 times for creature upgrades
  }
}

const CASTLE_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Guardhouse',     'castle', 400,  { wood: 5 }),
  dwelling(2, 'Archer Tower',   'castle', 1000, { wood: 5, ore: 5 }),
  dwelling(3, 'Griffin Tower',  'castle', 2000, { wood: 5, ore: 5 }),
  dwelling(4, 'Barracks',       'castle', 3000, { wood: 10, ore: 10 }),
  dwelling(5, 'Monastery',      'castle', 5000, { wood: 5, ore: 5, gems: 2 }),
  dwelling(6, 'Training Grounds', 'castle', 8000, { wood: 10, ore: 10, crystals: 5 }, ['castle_tier5', 'fort']),
  dwelling(7, 'Portal of Glory', 'castle', 15000, { wood: 10, ore: 10, gems: 5, crystals: 5 }, ['castle_tier6', 'mage_guild_2']),
]

const RAMPART_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Centaur Stables',  'rampart', 400,  { wood: 5 }),
  dwelling(2, 'Dwarf Cottage',    'rampart', 1000, { wood: 5, ore: 5 }),
  dwelling(3, 'Homestead',        'rampart', 2000, { wood: 10 }),
  dwelling(4, 'Enchanted Spring', 'rampart', 3500, { wood: 5, ore: 5, mercury: 2 }),
  dwelling(5, 'Dendroid Arches',  'rampart', 5000, { wood: 15, ore: 5 }),
  dwelling(6, 'Unicorn Glade',    'rampart', 8000, { wood: 10, ore: 5, gems: 5 }, ['rampart_tier5', 'fort']),
  dwelling(7, 'Dragon Cliffs',    'rampart', 18000, { wood: 10, ore: 10, crystals: 10 }, ['rampart_tier6', 'mage_guild_2']),
]

const TOWER_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Workshop',        'tower', 300,  { wood: 5, ore: 5 }),
  dwelling(2, 'Parapet',         'tower', 1000, { wood: 5, ore: 10 }),
  dwelling(3, 'Golem Factory',   'tower', 2500, { ore: 15 }),
  dwelling(4, 'Mage Tower',      'tower', 4000, { wood: 5, ore: 5, mercury: 3 }, ['tower_tier3', 'mage_guild_1']),
  dwelling(5, 'Altar of Wishes', 'tower', 6000, { wood: 5, ore: 5, mercury: 5 }, ['tower_tier4']),
  dwelling(6, 'Golden Pavilion', 'tower', 10000, { wood: 5, ore: 5, mercury: 5, gems: 5 }, ['tower_tier5', 'fort']),
  dwelling(7, 'Cloud Temple',    'tower', 25000, { ore: 10, gems: 10, mercury: 5, sulfur: 5 }, ['tower_tier6', 'mage_guild_4']),
]

const INFERNO_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Imp Crucible',    'inferno', 300),
  dwelling(2, 'Hall of Sins',    'inferno', 1000, { wood: 5, ore: 5 }),
  dwelling(3, 'Kennels',         'inferno', 2000, { wood: 5, ore: 5, sulfur: 2 }),
  dwelling(4, 'Demon Gate',      'inferno', 3000, { wood: 5, ore: 5 }),
  dwelling(5, 'Hell Hole',       'inferno', 6000, { ore: 10, sulfur: 5 }, ['inferno_tier4', 'fort']),
  dwelling(6, 'Fire Lake',       'inferno', 9000, { ore: 10, sulfur: 8 }, ['inferno_tier5']),
  dwelling(7, 'Forsaken Palace', 'inferno', 20000, { ore: 10, sulfur: 10, mercury: 5, crystals: 5 }, ['inferno_tier6', 'mage_guild_3']),
]

const NECROPOLIS_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Cursed Temple',   'necropolis', 400,  { wood: 5 }),
  dwelling(2, 'Graveyard',       'necropolis', 1000, { wood: 5, ore: 5 }),
  dwelling(3, 'Tomb of Souls',   'necropolis', 2000, { wood: 5, ore: 5, mercury: 2 }),
  dwelling(4, 'Estate',          'necropolis', 4000, { wood: 5, ore: 5 }),
  dwelling(5, "Mausoleum",       'necropolis', 6000, { wood: 5, ore: 10, mercury: 3 }, ['necropolis_tier4', 'mage_guild_1']),
  dwelling(6, 'Hall of Darkness', 'necropolis', 10000, { ore: 10, sulfur: 5, mercury: 5 }, ['necropolis_tier5', 'fort']),
  dwelling(7, 'Dragon Vault',    'necropolis', 20000, { ore: 10, sulfur: 10, mercury: 5 }, ['necropolis_tier6', 'mage_guild_3']),
]

const DUNGEON_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Warren',          'dungeon', 400,  { ore: 5 }),
  dwelling(2, 'Harpy Loft',      'dungeon', 1000, { wood: 5, ore: 5 }),
  dwelling(3, 'Pillar of Eyes',  'dungeon', 2500, { wood: 5, ore: 10 }),
  dwelling(4, 'Chapel of Stilled Voices', 'dungeon', 4000, { wood: 5, ore: 5, mercury: 2 }),
  dwelling(5, 'Labyrinth',       'dungeon', 6000, { ore: 15, gems: 3 }, ['dungeon_tier4', 'fort']),
  dwelling(6, 'Manticore Lair',  'dungeon', 9000, { ore: 10, mercury: 5, sulfur: 3 }, ['dungeon_tier5']),
  dwelling(7, 'Dragon Cave',     'dungeon', 25000, { ore: 10, sulfur: 10, mercury: 5, gems: 5 }, ['dungeon_tier6', 'mage_guild_4']),
]

const WILDS_DWELLINGS: BuildingDef[] = [
  dwelling(1, 'Gnoll Burrow',     'wilds', 350,  { wood: 5 }),
  dwelling(2, 'Spider Nest',      'wilds', 900,  { wood: 5, ore: 3 }),
  dwelling(3, 'Swamp Hut',        'wilds', 2000, { wood: 10, ore: 5 }),
  dwelling(4, 'Troll Cave',       'wilds', 3500, { ore: 10, wood: 5 }),
  dwelling(5, 'Bear Den',         'wilds', 5500, { wood: 10, ore: 10 }, ['wilds_tier4', 'fort']),
  dwelling(6, 'Labyrinth of Horns', 'wilds', 8500, { ore: 15, sulfur: 3, gems: 2 }, ['wilds_tier5']),
  dwelling(7, 'Dragon Aerie',     'wilds', 22000, { ore: 10, sulfur: 8, crystals: 5, gems: 3 }, ['wilds_tier6', 'mage_guild_2']),
]

// ─── Building Index ──────────────────────────────────────────
export const ALL_BUILDINGS: Record<string, BuildingDef> = {}
for (const b of [
  ...UNIVERSAL,
  ...CASTLE_DWELLINGS,
  ...RAMPART_DWELLINGS,
  ...TOWER_DWELLINGS,
  ...INFERNO_DWELLINGS,
  ...NECROPOLIS_DWELLINGS,
  ...DUNGEON_DWELLINGS,
  ...WILDS_DWELLINGS,
]) {
  ALL_BUILDINGS[b.id] = b
}

/** Get all buildings available to a faction (universal + faction-specific) */
export function getBuildingsForFaction(faction: FactionId): BuildingDef[] {
  return Object.values(ALL_BUILDINGS).filter(b =>
    b.factions === 'all' || b.factions.includes(faction)
  )
}

/** Check if a building can be built given current built set */
export function canBuild(buildingId: string, builtIds: Set<string>, resources: ResourceBundle): { ok: boolean; reason: string } {
  const def = ALL_BUILDINGS[buildingId]
  if (!def) return { ok: false, reason: 'Unknown building' }
  if (builtIds.has(buildingId)) return { ok: false, reason: 'Already built' }

  for (const prereq of def.prerequisites) {
    if (!builtIds.has(prereq)) {
      const pDef = ALL_BUILDINGS[prereq]
      return { ok: false, reason: `Requires ${pDef?.name || prereq}` }
    }
  }

  const cost = def.cost
  if (resources.gold < cost.gold) return { ok: false, reason: `Need ${cost.gold} gold` }
  if (resources.wood < cost.wood) return { ok: false, reason: `Need ${cost.wood} wood` }
  if (resources.ore < cost.ore) return { ok: false, reason: `Need ${cost.ore} ore` }
  if (resources.crystals < cost.crystals) return { ok: false, reason: `Need ${cost.crystals} crystals` }
  if (resources.gems < cost.gems) return { ok: false, reason: `Need ${cost.gems} gems` }
  if (resources.mercury < cost.mercury) return { ok: false, reason: `Need ${cost.mercury} mercury` }
  if (resources.sulfur < cost.sulfur) return { ok: false, reason: `Need ${cost.sulfur} sulfur` }

  return { ok: true, reason: '' }
}

/** Get the initial buildings for a new town */
export function getInitialBuildings(faction: FactionId): TownBuilding[] {
  const all = getBuildingsForFaction(faction)
  return all.map(b => ({
    buildingId: b.id,
    built: b.id === 'village_hall' || b.id === `${faction}_tier1`, // start with village hall + tier 1
    level: (b.id === 'village_hall' || b.id === `${faction}_tier1`) ? 1 : 0,
  }))
}

/** Upgrade a dwelling building to the next level. Returns new building list + cost. */
export function upgradeDwelling(
  town: Town,
  buildingId: string,
  resources: ResourceBundle,
): { town: Town; resources: ResourceBundle; success: boolean; reason: string } {
  const bDef = ALL_BUILDINGS[buildingId]
  if (!bDef) return { town, resources, success: false, reason: 'Unknown building' }
  if (!bDef.maxLevel || bDef.maxLevel <= 1) return { town, resources, success: false, reason: 'Cannot upgrade' }

  const tb = town.buildings.find(b => b.buildingId === buildingId)
  if (!tb || !tb.built) return { town, resources, success: false, reason: 'Building not built' }
  if (tb.level >= bDef.maxLevel) return { town, resources, success: false, reason: 'Already at max level' }

  // Upgrade cost = 50% of base cost * current level
  const costMult = tb.level  // level 1→2 costs 1x, level 2→3 costs 2x
  const upgradeCost: ResourceBundle = {
    gold: Math.floor(bDef.cost.gold * 0.5 * costMult),
    wood: Math.floor(bDef.cost.wood * 0.5 * costMult),
    ore: Math.floor(bDef.cost.ore * 0.5 * costMult),
    crystals: Math.floor(bDef.cost.crystals * 0.5 * costMult),
    gems: Math.floor(bDef.cost.gems * 0.5 * costMult),
    mercury: Math.floor(bDef.cost.mercury * 0.5 * costMult),
    sulfur: Math.floor(bDef.cost.sulfur * 0.5 * costMult),
  }

  // Check affordable
  const keys: (keyof ResourceBundle)[] = ['gold', 'wood', 'ore', 'crystals', 'gems', 'mercury', 'sulfur']
  for (const k of keys) {
    if (resources[k] < upgradeCost[k]) {
      return { town, resources, success: false, reason: `Need ${upgradeCost[k]} ${k}` }
    }
  }

  // Apply
  const newBuildings = town.buildings.map(b =>
    b.buildingId === buildingId ? { ...b, level: b.level + 1 } : b
  )
  const newResources = { ...resources }
  for (const k of keys) {
    newResources[k] -= upgradeCost[k]
  }

  return {
    town: { ...town, buildings: newBuildings },
    resources: newResources,
    success: true,
    reason: '',
  }
}

/** Calculate daily income from all built buildings */
export function calcTownIncome(buildings: TownBuilding[]): Partial<ResourceBundle> {
  let gold = 0, wood = 0, ore = 0, crystals = 0, gems = 0, mercury = 0, sulfur = 0
  for (const tb of buildings) {
    if (!tb.built) continue
    const def = ALL_BUILDINGS[tb.buildingId]
    if (!def) continue
    if (def.effects.incomeGold) gold += def.effects.incomeGold
    if (def.effects.incomeWood) wood += def.effects.incomeWood
    if (def.effects.incomeOre) ore += def.effects.incomeOre
    if (def.effects.incomeCrystals) crystals += def.effects.incomeCrystals
    if (def.effects.incomeGems) gems += def.effects.incomeGems
    if (def.effects.incomeMercury) mercury += def.effects.incomeMercury
    if (def.effects.incomeSulfur) sulfur += def.effects.incomeSulfur
  }
  return { gold, wood, ore, crystals, gems, mercury, sulfur }
}
