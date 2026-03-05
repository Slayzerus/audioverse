/**
 * upgrades.ts — Creature 3-tier upgrade system.
 *
 * Every creature has a base form (tier 0), upgraded form (tier 1), and
 * champion form (tier 2). Each upgrade requires certain building
 * combinations at certain levels in the town.
 *
 * Visually unchanged for now — upgrades only affect stats.
 */

// ─── Types ───────────────────────────────────────────────────
export interface CreatureUpgradeDef {
  /** Which upgrade step: 1 = first upgrade, 2 = second (champion) */
  step: 1 | 2
  /** Display name of the upgraded form */
  name: string
  /** Stat bonuses applied on top of the base creature */
  bonuses: {
    hp?: number
    attack?: number
    defense?: number
    minDmg?: number
    maxDmg?: number
    speed?: number
    initiative?: number
  }
  /** Abilities added at this upgrade step */
  addedAbilities?: string[]
  /** Required buildings (buildingId + minimum level) */
  requirements: { buildingId: string; minLevel: number }[]
  /** Gold cost to upgrade the dwelling to this step */
  upgradeCost: number
  /** Extra resource cost */
  extraCost?: Partial<Record<string, number>>
}

// ─── Helper ──────────────────────────────────────────────────
function up(
  step: 1 | 2,
  name: string,
  bonuses: CreatureUpgradeDef['bonuses'],
  requirements: { buildingId: string; minLevel: number }[],
  upgradeCost: number,
  extras?: { abilities?: string[]; extraCost?: Partial<Record<string, number>> },
): CreatureUpgradeDef {
  return {
    step,
    name,
    bonuses,
    addedAbilities: extras?.abilities,
    requirements,
    upgradeCost,
    extraCost: extras?.extraCost,
  }
}

// ═══════════════════════════════════════════════════════════════
//  UPGRADE DEFINITIONS — per creature ID
// ═══════════════════════════════════════════════════════════════
// Each creature has an array of 0-2 upgrade defs.
// step 1 = first upgrade (requires dwelling level 2 + support buildings)
// step 2 = champion (requires dwelling level 3 + more buildings)

export const CREATURE_UPGRADES: Record<string, CreatureUpgradeDef[]> = {
  // ──────── CASTLE ────────
  pikeman: [
    up(1, 'Halberdier', { hp: 2, attack: 1, defense: 1, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'castle_tier1', minLevel: 2 }, { buildingId: 'blacksmith', minLevel: 1 }], 300),
    up(2, 'Royal Guard', { hp: 5, attack: 2, defense: 3, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'castle_tier1', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 600),
  ],
  archer: [
    up(1, 'Marksman', { hp: 2, attack: 2, defense: 1, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'castle_tier2', minLevel: 2 }, { buildingId: 'blacksmith', minLevel: 1 }], 500),
    up(2, 'Sharpshooter', { hp: 5, attack: 3, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'castle_tier2', minLevel: 3 }, { buildingId: 'castle_tier3', minLevel: 1 }], 800,
      { abilities: ['double_strike'] }),
  ],
  griffin: [
    up(1, 'Royal Griffin', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'castle_tier3', minLevel: 2 }], 800),
    up(2, 'Imperial Griffin', { hp: 10, attack: 3, defense: 3, minDmg: 2, maxDmg: 3, speed: 1 },
      [{ buildingId: 'castle_tier3', minLevel: 3 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 1500),
  ],
  swordsman: [
    up(1, 'Crusader', { hp: 10, attack: 2, defense: 2, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'castle_tier4', minLevel: 2 }, { buildingId: 'fort', minLevel: 1 }], 1200),
    up(2, 'Champion Crusader', { hp: 15, attack: 4, defense: 4, minDmg: 3, maxDmg: 4, speed: 1 },
      [{ buildingId: 'castle_tier4', minLevel: 3 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 2000,
      { abilities: ['double_strike'] }),
  ],
  monk: [
    up(1, 'Zealot', { hp: 5, attack: 2, defense: 2, minDmg: 2, maxDmg: 2 },
      [{ buildingId: 'castle_tier5', minLevel: 2 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 1500),
    up(2, 'High Zealot', { hp: 10, attack: 4, defense: 3, minDmg: 4, maxDmg: 4 },
      [{ buildingId: 'castle_tier5', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 2500,
      { abilities: ['no_retaliation'] }),
  ],
  cavalier: [
    up(1, 'Champion', { hp: 20, attack: 3, defense: 3, minDmg: 5, maxDmg: 5 },
      [{ buildingId: 'castle_tier6', minLevel: 2 }, { buildingId: 'citadel', minLevel: 1 }], 3000,
      { extraCost: { crystals: 2 } }),
    up(2, 'Grand Champion', { hp: 30, attack: 5, defense: 5, minDmg: 10, maxDmg: 10, speed: 2 },
      [{ buildingId: 'castle_tier6', minLevel: 3 }, { buildingId: 'castle_walls', minLevel: 1 }], 5000,
      { extraCost: { crystals: 3 } }),
  ],
  angel: [
    up(1, 'Archangel', { hp: 50, attack: 4, defense: 4, minDmg: 10, maxDmg: 10, speed: 2 },
      [{ buildingId: 'castle_tier7', minLevel: 2 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 8000,
      { extraCost: { gems: 2 } }),
    up(2, 'Seraph', { hp: 100, attack: 6, defense: 6, minDmg: 15, maxDmg: 20, speed: 3 },
      [{ buildingId: 'castle_tier7', minLevel: 3 }, { buildingId: 'mage_guild_4', minLevel: 1 }], 15000,
      { abilities: ['regeneration'], extraCost: { gems: 5 } }),
  ],

  // ──────── RAMPART ────────
  centaur: [
    up(1, 'Centaur Captain', { hp: 3, attack: 2, defense: 1, minDmg: 1, maxDmg: 1, speed: 1 },
      [{ buildingId: 'rampart_tier1', minLevel: 2 }], 350),
    up(2, 'Centaur Warlord', { hp: 6, attack: 3, defense: 2, minDmg: 1, maxDmg: 2, speed: 2 },
      [{ buildingId: 'rampart_tier1', minLevel: 3 }, { buildingId: 'blacksmith', minLevel: 1 }], 700),
  ],
  dwarf: [
    up(1, 'Battle Dwarf', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'rampart_tier2', minLevel: 2 }, { buildingId: 'blacksmith', minLevel: 1 }], 600),
    up(2, 'Shield Dwarf', { hp: 10, attack: 3, defense: 4, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'rampart_tier2', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 1000),
  ],
  wood_elf: [
    up(1, 'Grand Elf', { hp: 3, attack: 2, defense: 1, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'rampart_tier3', minLevel: 2 }], 800),
    up(2, 'Sharpshooter Elf', { hp: 7, attack: 4, defense: 3, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'rampart_tier3', minLevel: 3 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 1500),
  ],
  pegasus: [
    up(1, 'Silver Pegasus', { hp: 8, attack: 2, defense: 2, minDmg: 2, maxDmg: 2, speed: 2 },
      [{ buildingId: 'rampart_tier4', minLevel: 2 }], 1200),
    up(2, 'War Pegasus', { hp: 15, attack: 4, defense: 4, minDmg: 3, maxDmg: 4, speed: 3 },
      [{ buildingId: 'rampart_tier4', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 2000),
  ],
  dendroid: [
    up(1, 'Dendroid Soldier', { hp: 15, attack: 2, defense: 3, minDmg: 3, maxDmg: 4 },
      [{ buildingId: 'rampart_tier5', minLevel: 2 }, { buildingId: 'fort', minLevel: 1 }], 1800),
    up(2, 'Ancient Treant', { hp: 25, attack: 4, defense: 5, minDmg: 5, maxDmg: 6 },
      [{ buildingId: 'rampart_tier5', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 3000,
      { abilities: ['regeneration'] }),
  ],
  unicorn: [
    up(1, 'War Unicorn', { hp: 15, attack: 3, defense: 3, minDmg: 4, maxDmg: 4 },
      [{ buildingId: 'rampart_tier6', minLevel: 2 }], 3000, { extraCost: { gems: 1 } }),
    up(2, 'Aura Unicorn', { hp: 25, attack: 5, defense: 5, minDmg: 6, maxDmg: 8, speed: 1 },
      [{ buildingId: 'rampart_tier6', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 5000,
      { abilities: ['dispel'], extraCost: { gems: 2 } }),
  ],
  green_dragon: [
    up(1, 'Gold Dragon', { hp: 40, attack: 4, defense: 4, minDmg: 10, maxDmg: 10, speed: 2 },
      [{ buildingId: 'rampart_tier7', minLevel: 2 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 8000,
      { extraCost: { crystals: 3 } }),
    up(2, 'Azure Dragon', { hp: 80, attack: 7, defense: 7, minDmg: 20, maxDmg: 25, speed: 3 },
      [{ buildingId: 'rampart_tier7', minLevel: 3 }, { buildingId: 'mage_guild_4', minLevel: 1 }], 16000,
      { abilities: ['fear'], extraCost: { crystals: 5 } }),
  ],

  // ──────── TOWER ────────
  gremlin: [
    up(1, 'Master Gremlin', { hp: 2, attack: 1, defense: 1, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'tower_tier1', minLevel: 2 }], 200),
    up(2, 'Gremlin Inventor', { hp: 4, attack: 2, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'tower_tier1', minLevel: 3 }, { buildingId: 'blacksmith', minLevel: 1 }], 400),
  ],
  gargoyle: [
    up(1, 'Obsidian Gargoyle', { hp: 4, attack: 2, defense: 2, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'tower_tier2', minLevel: 2 }], 600),
    up(2, 'Diamond Gargoyle', { hp: 8, attack: 3, defense: 3, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'tower_tier2', minLevel: 3 }], 1000, { abilities: ['anti_magic'] }),
  ],
  golem: [
    up(1, 'Steel Golem', { hp: 10, attack: 2, defense: 3, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'tower_tier3', minLevel: 2 }], 900),
    up(2, 'Diamond Golem', { hp: 20, attack: 3, defense: 5, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'tower_tier3', minLevel: 3 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 1600,
      { abilities: ['anti_magic'] }),
  ],
  mage: [
    up(1, 'Arch Mage', { hp: 5, attack: 2, defense: 2, minDmg: 2, maxDmg: 2 },
      [{ buildingId: 'tower_tier4', minLevel: 2 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 1500),
    up(2, 'Grand Magus', { hp: 10, attack: 4, defense: 3, minDmg: 3, maxDmg: 4 },
      [{ buildingId: 'tower_tier4', minLevel: 3 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 2500),
  ],
  genie: [
    up(1, 'Master Genie', { hp: 10, attack: 3, defense: 3, minDmg: 3, maxDmg: 4 },
      [{ buildingId: 'tower_tier5', minLevel: 2 }], 2000),
    up(2, 'Noble Djinn', { hp: 20, attack: 5, defense: 5, minDmg: 6, maxDmg: 8, speed: 2 },
      [{ buildingId: 'tower_tier5', minLevel: 3 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 3500,
      { abilities: ['teleport'] }),
  ],
  naga: [
    up(1, 'Naga Empress', { hp: 20, attack: 3, defense: 3, minDmg: 5, maxDmg: 8 },
      [{ buildingId: 'tower_tier6', minLevel: 2 }], 4000, { extraCost: { mercury: 2 } }),
    up(2, 'Naga Goddess', { hp: 40, attack: 6, defense: 6, minDmg: 10, maxDmg: 15, speed: 2 },
      [{ buildingId: 'tower_tier6', minLevel: 3 }, { buildingId: 'citadel', minLevel: 1 }], 7000,
      { abilities: ['anti_magic'], extraCost: { mercury: 3 } }),
  ],
  titan: [
    up(1, 'Thunder Titan', { hp: 50, attack: 4, defense: 4, minDmg: 10, maxDmg: 10 },
      [{ buildingId: 'tower_tier7', minLevel: 2 }, { buildingId: 'mage_guild_4', minLevel: 1 }], 12000,
      { extraCost: { gems: 3 } }),
    up(2, 'Storm Titan', { hp: 100, attack: 8, defense: 8, minDmg: 20, maxDmg: 20, speed: 2 },
      [{ buildingId: 'tower_tier7', minLevel: 3 }, { buildingId: 'mage_guild_5', minLevel: 1 }], 20000,
      { extraCost: { gems: 5 } }),
  ],

  // ──────── INFERNO ────────
  imp: [
    up(1, 'Familiar', { hp: 2, attack: 1, defense: 1, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'inferno_tier1', minLevel: 2 }], 200),
    up(2, 'Imp Overlord', { hp: 4, attack: 2, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'inferno_tier1', minLevel: 3 }], 400, { abilities: ['life_drain'] }),
  ],
  gog: [
    up(1, 'Magog', { hp: 3, attack: 2, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'inferno_tier2', minLevel: 2 }], 600),
    up(2, 'Arch Magog', { hp: 7, attack: 3, defense: 3, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'inferno_tier2', minLevel: 3 }], 1000, { abilities: ['fire_breath'] }),
  ],
  hell_hound: [
    up(1, 'Cerberus', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'inferno_tier3', minLevel: 2 }], 800),
    up(2, 'Hellfire Hound', { hp: 12, attack: 4, defense: 3, minDmg: 2, maxDmg: 4, speed: 2 },
      [{ buildingId: 'inferno_tier3', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 1500),
  ],
  demon: [
    up(1, 'Horned Demon', { hp: 10, attack: 2, defense: 2, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'inferno_tier4', minLevel: 2 }, { buildingId: 'blacksmith', minLevel: 1 }], 1200),
    up(2, 'Demon Lord', { hp: 20, attack: 4, defense: 4, minDmg: 3, maxDmg: 5, speed: 1 },
      [{ buildingId: 'inferno_tier4', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 2000,
      { abilities: ['fear'] }),
  ],
  pit_fiend: [
    up(1, 'Pit Lord', { hp: 10, attack: 3, defense: 3, minDmg: 3, maxDmg: 4 },
      [{ buildingId: 'inferno_tier5', minLevel: 2 }], 2000),
    up(2, 'Arch Pit Lord', { hp: 20, attack: 5, defense: 5, minDmg: 5, maxDmg: 7 },
      [{ buildingId: 'inferno_tier5', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 3500,
      { abilities: ['regeneration'] }),
  ],
  efreet: [
    up(1, 'Efreet Overlord', { hp: 15, attack: 3, defense: 3, minDmg: 4, maxDmg: 6, speed: 1 },
      [{ buildingId: 'inferno_tier6', minLevel: 2 }], 3500, { extraCost: { sulfur: 2 } }),
    up(2, 'Fire King', { hp: 30, attack: 6, defense: 5, minDmg: 8, maxDmg: 10, speed: 2 },
      [{ buildingId: 'inferno_tier6', minLevel: 3 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 6000,
      { abilities: ['anti_magic'], extraCost: { sulfur: 3 } }),
  ],
  arch_devil: [
    up(1, 'Grand Devil', { hp: 40, attack: 4, defense: 4, minDmg: 8, maxDmg: 10 },
      [{ buildingId: 'inferno_tier7', minLevel: 2 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 10000,
      { extraCost: { mercury: 2, sulfur: 2 } }),
    up(2, 'Demon Prince', { hp: 80, attack: 8, defense: 8, minDmg: 15, maxDmg: 20, speed: 3 },
      [{ buildingId: 'inferno_tier7', minLevel: 3 }, { buildingId: 'mage_guild_4', minLevel: 1 }], 18000,
      { abilities: ['life_drain'], extraCost: { mercury: 3, sulfur: 3 } }),
  ],

  // ──────── NECROPOLIS ────────
  skeleton: [
    up(1, 'Skeleton Warrior', { hp: 2, attack: 2, defense: 2, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'necropolis_tier1', minLevel: 2 }], 300),
    up(2, 'Skeleton Champion', { hp: 4, attack: 3, defense: 3, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'necropolis_tier1', minLevel: 3 }, { buildingId: 'blacksmith', minLevel: 1 }], 600),
  ],
  zombie: [
    up(1, 'Plague Zombie', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'necropolis_tier2', minLevel: 2 }], 500),
    up(2, 'Ghoul', { hp: 10, attack: 3, defense: 3, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'necropolis_tier2', minLevel: 3 }], 900, { abilities: ['regeneration'] }),
  ],
  wight: [
    up(1, 'Wraith', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'necropolis_tier3', minLevel: 2 }], 800),
    up(2, 'Spirit', { hp: 10, attack: 4, defense: 3, minDmg: 2, maxDmg: 3, speed: 2 },
      [{ buildingId: 'necropolis_tier3', minLevel: 3 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 1400,
      { abilities: ['flying'] }),
  ],
  vampire: [
    up(1, 'Vampire King', { hp: 8, attack: 2, defense: 2, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'necropolis_tier4', minLevel: 2 }], 1500),
    up(2, 'Nosferatu', { hp: 15, attack: 4, defense: 4, minDmg: 3, maxDmg: 5, speed: 2 },
      [{ buildingId: 'necropolis_tier4', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 2500),
  ],
  lich: [
    up(1, 'Arch Lich', { hp: 8, attack: 3, defense: 3, minDmg: 3, maxDmg: 3 },
      [{ buildingId: 'necropolis_tier5', minLevel: 2 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 2000),
    up(2, 'Grand Lich', { hp: 15, attack: 5, defense: 4, minDmg: 5, maxDmg: 5 },
      [{ buildingId: 'necropolis_tier5', minLevel: 3 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 3500),
  ],
  dread_knight: [
    up(1, 'Doom Knight', { hp: 20, attack: 3, defense: 3, minDmg: 5, maxDmg: 5 },
      [{ buildingId: 'necropolis_tier6', minLevel: 2 }, { buildingId: 'citadel', minLevel: 1 }], 4000,
      { extraCost: { mercury: 2 } }),
    up(2, 'Death Champion', { hp: 40, attack: 6, defense: 6, minDmg: 10, maxDmg: 10, speed: 1 },
      [{ buildingId: 'necropolis_tier6', minLevel: 3 }, { buildingId: 'castle_walls', minLevel: 1 }], 7000,
      { abilities: ['teleport'], extraCost: { mercury: 3 } }),
  ],
  bone_dragon: [
    up(1, 'Ghost Dragon', { hp: 30, attack: 3, defense: 3, minDmg: 5, maxDmg: 10, speed: 2 },
      [{ buildingId: 'necropolis_tier7', minLevel: 2 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 9000,
      { extraCost: { sulfur: 2 } }),
    up(2, 'Spectral Dragon', { hp: 60, attack: 6, defense: 6, minDmg: 10, maxDmg: 20, speed: 3 },
      [{ buildingId: 'necropolis_tier7', minLevel: 3 }, { buildingId: 'mage_guild_4', minLevel: 1 }], 16000,
      { abilities: ['life_drain'], extraCost: { sulfur: 3 } }),
  ],

  // ──────── DUNGEON ────────
  troglodyte: [
    up(1, 'Infernal Troglodyte', { hp: 2, attack: 2, defense: 1, minDmg: 1, maxDmg: 1 },
      [{ buildingId: 'dungeon_tier1', minLevel: 2 }], 250),
    up(2, 'Dark Troglodyte', { hp: 4, attack: 3, defense: 2, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'dungeon_tier1', minLevel: 3 }], 500),
  ],
  harpy: [
    up(1, 'Harpy Queen', { hp: 4, attack: 2, defense: 2, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'dungeon_tier2', minLevel: 2 }], 600),
    up(2, 'Fury', { hp: 8, attack: 4, defense: 3, minDmg: 2, maxDmg: 3, speed: 2 },
      [{ buildingId: 'dungeon_tier2', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 1000,
      { abilities: ['double_strike'] }),
  ],
  beholder: [
    up(1, 'Evil Eye', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'dungeon_tier3', minLevel: 2 }], 900),
    up(2, 'Death Eye', { hp: 10, attack: 4, defense: 3, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'dungeon_tier3', minLevel: 3 }, { buildingId: 'mage_guild_1', minLevel: 1 }], 1600,
      { abilities: ['curse_attack'] }),
  ],
  medusa: [
    up(1, 'Medusa Queen', { hp: 8, attack: 2, defense: 2, minDmg: 2, maxDmg: 2 },
      [{ buildingId: 'dungeon_tier4', minLevel: 2 }], 1300),
    up(2, 'Gorgon', { hp: 15, attack: 4, defense: 4, minDmg: 3, maxDmg: 4 },
      [{ buildingId: 'dungeon_tier4', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 2200,
      { abilities: ['fear'] }),
  ],
  minotaur: [
    up(1, 'Minotaur Champion', { hp: 10, attack: 3, defense: 3, minDmg: 3, maxDmg: 5 },
      [{ buildingId: 'dungeon_tier5', minLevel: 2 }, { buildingId: 'fort', minLevel: 1 }], 2000),
    up(2, 'Minotaur Overlord', { hp: 20, attack: 5, defense: 5, minDmg: 5, maxDmg: 8, speed: 1 },
      [{ buildingId: 'dungeon_tier5', minLevel: 3 }, { buildingId: 'citadel', minLevel: 1 }], 3500),
  ],
  manticore: [
    up(1, 'Scorpicore King', { hp: 15, attack: 3, defense: 3, minDmg: 4, maxDmg: 5 },
      [{ buildingId: 'dungeon_tier6', minLevel: 2 }], 3500, { extraCost: { mercury: 2 } }),
    up(2, 'Manticore Overlord', { hp: 30, attack: 5, defense: 5, minDmg: 6, maxDmg: 8, speed: 2 },
      [{ buildingId: 'dungeon_tier6', minLevel: 3 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 6000,
      { abilities: ['curse_attack'], extraCost: { mercury: 3 } }),
  ],
  black_dragon: [
    up(1, 'Void Dragon', { hp: 50, attack: 5, defense: 5, minDmg: 10, maxDmg: 15, speed: 1 },
      [{ buildingId: 'dungeon_tier7', minLevel: 2 }, { buildingId: 'mage_guild_4', minLevel: 1 }], 14000,
      { extraCost: { sulfur: 3 } }),
    up(2, 'Abyssal Dragon', { hp: 100, attack: 10, defense: 10, minDmg: 20, maxDmg: 30, speed: 2 },
      [{ buildingId: 'dungeon_tier7', minLevel: 3 }, { buildingId: 'mage_guild_5', minLevel: 1 }], 24000,
      { abilities: ['fear'], extraCost: { sulfur: 5 } }),
  ],

  // ──────── WILDS ────────
  gnoll: [
    up(1, 'Gnoll Marauder', { hp: 3, attack: 2, defense: 1, minDmg: 1, maxDmg: 1, speed: 1 },
      [{ buildingId: 'wilds_tier1', minLevel: 2 }], 280),
    up(2, 'Gnoll Warlord', { hp: 5, attack: 3, defense: 2, minDmg: 1, maxDmg: 2, speed: 1 },
      [{ buildingId: 'wilds_tier1', minLevel: 3 }, { buildingId: 'blacksmith', minLevel: 1 }], 550),
  ],
  spider: [
    up(1, 'Phase Spider', { hp: 4, attack: 2, defense: 1, minDmg: 1, maxDmg: 1, speed: 1 },
      [{ buildingId: 'wilds_tier2', minLevel: 2 }], 500),
    up(2, 'Venom Spider', { hp: 8, attack: 3, defense: 2, minDmg: 1, maxDmg: 2, speed: 2 },
      [{ buildingId: 'wilds_tier2', minLevel: 3 }], 900),
  ],
  lizard: [
    up(1, 'Lizard Chief', { hp: 5, attack: 2, defense: 2, minDmg: 1, maxDmg: 2 },
      [{ buildingId: 'wilds_tier3', minLevel: 2 }], 800),
    up(2, 'Lizard King', { hp: 10, attack: 4, defense: 3, minDmg: 2, maxDmg: 3, speed: 1 },
      [{ buildingId: 'wilds_tier3', minLevel: 3 }, { buildingId: 'blacksmith', minLevel: 1 }], 1400),
  ],
  troll: [
    up(1, 'Rock Troll', { hp: 8, attack: 2, defense: 2, minDmg: 2, maxDmg: 3 },
      [{ buildingId: 'wilds_tier4', minLevel: 2 }, { buildingId: 'fort', minLevel: 1 }], 1300),
    up(2, 'Ancient Troll', { hp: 16, attack: 4, defense: 4, minDmg: 3, maxDmg: 5, speed: 1 },
      [{ buildingId: 'wilds_tier4', minLevel: 3 }, { buildingId: 'citadel', minLevel: 1 }], 2200),
  ],
  bear: [
    up(1, 'Dire Bear', { hp: 12, attack: 3, defense: 3, minDmg: 3, maxDmg: 4 },
      [{ buildingId: 'wilds_tier5', minLevel: 2 }], 1800),
    up(2, 'Berserker Bear', { hp: 20, attack: 5, defense: 4, minDmg: 5, maxDmg: 6, speed: 1 },
      [{ buildingId: 'wilds_tier5', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 3000,
      { abilities: ['no_retaliation'] }),
  ],
  wild_minotaur: [
    up(1, 'Bull Lord', { hp: 20, attack: 3, defense: 3, minDmg: 4, maxDmg: 6 },
      [{ buildingId: 'wilds_tier6', minLevel: 2 }], 3500, { extraCost: { ore: 2 } }),
    up(2, 'Titan Bull', { hp: 35, attack: 6, defense: 5, minDmg: 8, maxDmg: 10, speed: 2 },
      [{ buildingId: 'wilds_tier6', minLevel: 3 }, { buildingId: 'fort', minLevel: 1 }], 6000,
      { abilities: ['double_strike'], extraCost: { ore: 3 } }),
  ],
  wild_dragon: [
    up(1, 'Elder Dragon', { hp: 40, attack: 4, defense: 4, minDmg: 10, maxDmg: 10, speed: 2 },
      [{ buildingId: 'wilds_tier7', minLevel: 2 }, { buildingId: 'mage_guild_2', minLevel: 1 }], 10000,
      { extraCost: { sulfur: 2, crystals: 2 } }),
    up(2, 'Primordial Dragon', { hp: 80, attack: 8, defense: 8, minDmg: 20, maxDmg: 25, speed: 3 },
      [{ buildingId: 'wilds_tier7', minLevel: 3 }, { buildingId: 'mage_guild_3', minLevel: 1 }], 18000,
      { abilities: ['regeneration', 'anti_magic'], extraCost: { sulfur: 3, crystals: 3 } }),
  ],
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

/** Get the display name for a creature at a given upgrade level */
export function getUpgradedName(creatureId: string, upgradeLevel: number): string {
  const ups = CREATURE_UPGRADES[creatureId]
  if (!ups || upgradeLevel <= 0) return '' // use base name
  const entry = ups.find(u => u.step === upgradeLevel)
  return entry?.name ?? ''
}

/** Get total stat bonuses for a creature at a given upgrade level */
export function getUpgradeBonuses(creatureId: string, upgradeLevel: number): {
  hp: number; attack: number; defense: number
  minDmg: number; maxDmg: number; speed: number; initiative: number
} {
  const result = { hp: 0, attack: 0, defense: 0, minDmg: 0, maxDmg: 0, speed: 0, initiative: 0 }
  const ups = CREATURE_UPGRADES[creatureId]
  if (!ups) return result

  // Bonuses are cumulative: level 2 includes bonuses from level 1 AND level 2
  for (const u of ups) {
    if (u.step <= upgradeLevel) {
      result.hp += u.bonuses.hp ?? 0
      result.attack += u.bonuses.attack ?? 0
      result.defense += u.bonuses.defense ?? 0
      result.minDmg += u.bonuses.minDmg ?? 0
      result.maxDmg += u.bonuses.maxDmg ?? 0
      result.speed += u.bonuses.speed ?? 0
      result.initiative += u.bonuses.initiative ?? 0
    }
  }
  return result
}

/** Get added abilities for a creature at a given upgrade level (cumulative) */
export function getUpgradeAbilities(creatureId: string, upgradeLevel: number): string[] {
  const ups = CREATURE_UPGRADES[creatureId]
  if (!ups) return []
  const abilities: string[] = []
  for (const u of ups) {
    if (u.step <= upgradeLevel && u.addedAbilities) {
      abilities.push(...u.addedAbilities)
    }
  }
  return abilities
}

/** Check if a dwelling can be upgraded to the next level given current town buildings */
export function canUpgradeDwelling(
  creatureId: string,
  currentLevel: number,
  townBuildings: { buildingId: string; built: boolean; level: number }[],
): { canUpgrade: boolean; reason: string; nextUpgrade: CreatureUpgradeDef | null } {
  const ups = CREATURE_UPGRADES[creatureId]
  if (!ups) return { canUpgrade: false, reason: 'No upgrades available', nextUpgrade: null }

  const nextStep = currentLevel + 1
  if (nextStep > 2) return { canUpgrade: false, reason: 'Already at max upgrade', nextUpgrade: null }

  const upgrade = ups.find(u => u.step === nextStep)
  if (!upgrade) return { canUpgrade: false, reason: 'No further upgrades', nextUpgrade: null }

  // Check building requirements
  for (const req of upgrade.requirements) {
    const tb = townBuildings.find(b => b.buildingId === req.buildingId)
    if (!tb || !tb.built) {
      return { canUpgrade: false, reason: `Requires ${req.buildingId}`, nextUpgrade: upgrade }
    }
    if ((tb.level || 1) < req.minLevel) {
      return { canUpgrade: false, reason: `${req.buildingId} needs level ${req.minLevel}`, nextUpgrade: upgrade }
    }
  }

  return { canUpgrade: true, reason: '', nextUpgrade: upgrade }
}

/** Get the maximum available upgrade level from a town for a given creature */
export function getMaxUpgradeLevelInTown(
  creatureId: string,
  townBuildings: { buildingId: string; built: boolean; level: number }[],
): number {
  let maxLevel = 0
  for (let step = 1; step <= 2; step++) {
    const result = canUpgradeDwelling(creatureId, step - 1, townBuildings)
    if (result.canUpgrade) {
      maxLevel = step
    } else {
      break
    }
  }
  return maxLevel
}
