/**
 * factions.ts — 6 factions, each with 7 tiers of creatures.
 *
 * Castle / Rampart / Tower / Inferno / Necropolis / Dungeon
 * Every creature has stats, abilities, cost, and growth rate.
 */
import type { FactionDef, CreatureDef, FactionId, ResourceBundle } from './types'

// ─── Helper: create cost bundle ──────────────────────────────
function cost(gold: number, extra?: Partial<ResourceBundle>): ResourceBundle {
  return { gold, wood: 0, ore: 0, crystals: 0, gems: 0, mercury: 0, sulfur: 0, ...extra }
}

// ═════════════════════════════════════════════════════════════
//  CASTLE — Humans: Knights, Clerics, Angels
// ═════════════════════════════════════════════════════════════
const CASTLE_CREATURES: CreatureDef[] = [
  { id: 'pikeman',        name: 'Pikeman',        faction: 'castle', tier: 1, hp: 10, attack: 4, defense: 5, minDmg: 1, maxDmg: 3, speed: 4, initiative: 8, shots: 0, growth: 14, cost: cost(60),  abilities: [], shape: 'square', large: false },
  { id: 'archer',         name: 'Archer',          faction: 'castle', tier: 2, hp: 10, attack: 6, defense: 3, minDmg: 2, maxDmg: 3, speed: 4, initiative: 9, shots: 12, growth: 9, cost: cost(100), abilities: ['ranged'], shape: 'triangle', large: false },
  { id: 'griffin',        name: 'Griffin',         faction: 'castle', tier: 3, hp: 25, attack: 8, defense: 8, minDmg: 3, maxDmg: 6, speed: 6, initiative: 12, shots: 0, growth: 7, cost: cost(200), abilities: ['flying', 'double_strike'], shape: 'diamond', large: false },
  { id: 'swordsman',      name: 'Swordsman',       faction: 'castle', tier: 4, hp: 35, attack: 10, defense: 12, minDmg: 6, maxDmg: 9, speed: 5, initiative: 11, shots: 0, growth: 4, cost: cost(300), abilities: [], shape: 'square', large: false },
  { id: 'monk',           name: 'Monk',            faction: 'castle', tier: 5, hp: 30, attack: 12, defense: 7, minDmg: 10, maxDmg: 12, speed: 5, initiative: 12, shots: 12, growth: 3, cost: cost(400), abilities: ['ranged'], shape: 'circle', large: false },
  { id: 'cavalier',       name: 'Cavalier',        faction: 'castle', tier: 6, hp: 100, attack: 15, defense: 15, minDmg: 15, maxDmg: 25, speed: 7, initiative: 14, shots: 0, growth: 2, cost: cost(1000, { crystals: 1 }), abilities: ['jousting'], shape: 'diamond', large: true },
  { id: 'angel',          name: 'Angel',           faction: 'castle', tier: 7, hp: 200, attack: 20, defense: 20, minDmg: 50, maxDmg: 50, speed: 12, initiative: 18, shots: 0, growth: 1, cost: cost(3000, { gems: 1 }), abilities: ['flying', 'heal_ally', 'morale_boost'], shape: 'hexagon', large: true },
]

// ═════════════════════════════════════════════════════════════
//  RAMPART — Nature: Elves, Unicorns, Green Dragons
// ═════════════════════════════════════════════════════════════
const RAMPART_CREATURES: CreatureDef[] = [
  { id: 'centaur',        name: 'Centaur',         faction: 'rampart', tier: 1, hp: 8, attack: 5, defense: 3, minDmg: 2, maxDmg: 3, speed: 6, initiative: 9, shots: 0, growth: 14, cost: cost(70), abilities: [], shape: 'square', large: false },
  { id: 'dwarf',          name: 'Dwarf',           faction: 'rampart', tier: 2, hp: 20, attack: 6, defense: 7, minDmg: 2, maxDmg: 4, speed: 3, initiative: 7, shots: 0, growth: 8, cost: cost(120), abilities: ['magic_resist'], shape: 'square', large: false },
  { id: 'wood_elf',       name: 'Wood Elf',        faction: 'rampart', tier: 3, hp: 15, attack: 9, defense: 5, minDmg: 3, maxDmg: 5, speed: 6, initiative: 12, shots: 24, growth: 7, cost: cost(200), abilities: ['ranged', 'double_strike'], shape: 'triangle', large: false },
  { id: 'pegasus',        name: 'Pegasus',         faction: 'rampart', tier: 4, hp: 40, attack: 9, defense: 8, minDmg: 5, maxDmg: 9, speed: 8, initiative: 12, shots: 0, growth: 5, cost: cost(250), abilities: ['flying'], shape: 'diamond', large: false },
  { id: 'dendroid',       name: 'Dendroid Guard',  faction: 'rampart', tier: 5, hp: 55, attack: 9, defense: 12, minDmg: 10, maxDmg: 14, speed: 3, initiative: 9, shots: 0, growth: 3, cost: cost(350), abilities: [], shape: 'square', large: true },
  { id: 'unicorn',        name: 'Unicorn',         faction: 'rampart', tier: 6, hp: 90, attack: 15, defense: 14, minDmg: 18, maxDmg: 22, speed: 7, initiative: 14, shots: 0, growth: 2, cost: cost(850, { gems: 1 }), abilities: ['curse_attack'], shape: 'diamond', large: true },
  { id: 'green_dragon',   name: 'Green Dragon',    faction: 'rampart', tier: 7, hp: 180, attack: 18, defense: 18, minDmg: 40, maxDmg: 50, speed: 10, initiative: 16, shots: 0, growth: 1, cost: cost(2500, { crystals: 1 }), abilities: ['flying', 'fire_breath', 'magic_resist'], shape: 'hexagon', large: true },
]

// ═════════════════════════════════════════════════════════════
//  TOWER — Arcane: Gremlins, Gargoyles, Titans
// ═════════════════════════════════════════════════════════════
const TOWER_CREATURES: CreatureDef[] = [
  { id: 'gremlin',        name: 'Gremlin',         faction: 'tower', tier: 1, hp: 4, attack: 3, defense: 3, minDmg: 1, maxDmg: 2, speed: 4, initiative: 8, shots: 8, growth: 16, cost: cost(30), abilities: ['ranged'], shape: 'triangle', large: false },
  { id: 'gargoyle',       name: 'Stone Gargoyle',  faction: 'tower', tier: 2, hp: 16, attack: 6, defense: 6, minDmg: 2, maxDmg: 3, speed: 6, initiative: 10, shots: 0, growth: 9, cost: cost(130), abilities: ['flying', 'magic_resist'], shape: 'diamond', large: false },
  { id: 'golem',          name: 'Iron Golem',      faction: 'tower', tier: 3, hp: 35, attack: 7, defense: 10, minDmg: 4, maxDmg: 5, speed: 3, initiative: 8, shots: 0, growth: 6, cost: cost(200), abilities: ['magic_resist'], shape: 'square', large: false },
  { id: 'mage',           name: 'Mage',            faction: 'tower', tier: 4, hp: 25, attack: 11, defense: 8, minDmg: 7, maxDmg: 9, speed: 5, initiative: 12, shots: 24, growth: 4, cost: cost(350), abilities: ['ranged', 'no_retaliation', 'spellcaster'], shape: 'circle', large: false },
  { id: 'genie',          name: 'Genie',           faction: 'tower', tier: 5, hp: 40, attack: 12, defense: 12, minDmg: 13, maxDmg: 16, speed: 7, initiative: 13, shots: 0, growth: 3, cost: cost(550), abilities: ['flying', 'spellcaster', 'heal_ally'], shape: 'circle', large: false },
  { id: 'naga',           name: 'Naga Queen',      faction: 'tower', tier: 6, hp: 110, attack: 16, defense: 13, minDmg: 20, maxDmg: 30, speed: 5, initiative: 12, shots: 0, growth: 2, cost: cost(1100, { mercury: 1 }), abilities: ['no_retaliation'], shape: 'diamond', large: true },
  { id: 'titan',          name: 'Titan',           faction: 'tower', tier: 7, hp: 300, attack: 24, defense: 24, minDmg: 40, maxDmg: 60, speed: 11, initiative: 19, shots: 24, growth: 1, cost: cost(5000, { gems: 2 }), abilities: ['ranged', 'no_retaliation', 'lightning_attack'], shape: 'hexagon', large: true },
]

// ═════════════════════════════════════════════════════════════
//  INFERNO — Demons: Imps, Pit Fiends, Arch Devils
// ═════════════════════════════════════════════════════════════
const INFERNO_CREATURES: CreatureDef[] = [
  { id: 'imp',            name: 'Imp',             faction: 'inferno', tier: 1, hp: 4, attack: 2, defense: 3, minDmg: 1, maxDmg: 2, speed: 5, initiative: 10, shots: 12, growth: 15, cost: cost(50), abilities: ['ranged'], shape: 'triangle', large: false },
  { id: 'gog',            name: 'Gog',             faction: 'inferno', tier: 2, hp: 13, attack: 6, defense: 4, minDmg: 2, maxDmg: 4, speed: 4, initiative: 9, shots: 12, growth: 8, cost: cost(125), abilities: ['ranged'], shape: 'triangle', large: false },
  { id: 'hell_hound',     name: 'Hell Hound',      faction: 'inferno', tier: 3, hp: 25, attack: 10, defense: 6, minDmg: 2, maxDmg: 7, speed: 7, initiative: 11, shots: 0, growth: 5, cost: cost(200), abilities: ['no_retaliation', 'fire_breath'], shape: 'diamond', large: false },
  { id: 'demon',          name: 'Demon',           faction: 'inferno', tier: 4, hp: 35, attack: 10, defense: 10, minDmg: 7, maxDmg: 9, speed: 5, initiative: 11, shots: 0, growth: 4, cost: cost(250), abilities: [], shape: 'square', large: false },
  { id: 'pit_fiend',      name: 'Pit Fiend',       faction: 'inferno', tier: 5, hp: 45, attack: 13, defense: 13, minDmg: 13, maxDmg: 17, speed: 6, initiative: 13, shots: 0, growth: 2, cost: cost(500), abilities: ['spellcaster'], shape: 'circle', large: true },
  { id: 'efreet',         name: 'Efreet Sultan',   faction: 'inferno', tier: 6, hp: 90, attack: 16, defense: 12, minDmg: 16, maxDmg: 24, speed: 9, initiative: 16, shots: 0, growth: 2, cost: cost(900, { sulfur: 1 }), abilities: ['flying', 'fire_breath'], shape: 'diamond', large: true },
  { id: 'arch_devil',     name: 'Arch Devil',      faction: 'inferno', tier: 7, hp: 200, attack: 26, defense: 28, minDmg: 30, maxDmg: 40, speed: 17, initiative: 20, shots: 0, growth: 1, cost: cost(4500, { mercury: 1, sulfur: 1 }), abilities: ['flying', 'no_retaliation', 'teleport', 'fear'], shape: 'hexagon', large: true },
]

// ═════════════════════════════════════════════════════════════
//  NECROPOLIS — Undead: Skeletons, Vampires, Bone Dragons
// ═════════════════════════════════════════════════════════════
const NECROPOLIS_CREATURES: CreatureDef[] = [
  { id: 'skeleton',       name: 'Skeleton',        faction: 'necropolis', tier: 1, hp: 6, attack: 5, defense: 4, minDmg: 1, maxDmg: 3, speed: 4, initiative: 8, shots: 0, growth: 12, cost: cost(60), abilities: ['undead'], shape: 'square', large: false },
  { id: 'zombie',         name: 'Zombie',          faction: 'necropolis', tier: 2, hp: 20, attack: 5, defense: 5, minDmg: 2, maxDmg: 3, speed: 3, initiative: 6, shots: 0, growth: 8, cost: cost(100), abilities: ['undead'], shape: 'square', large: false },
  { id: 'wight',          name: 'Wight',           faction: 'necropolis', tier: 3, hp: 18, attack: 7, defense: 7, minDmg: 3, maxDmg: 5, speed: 5, initiative: 11, shots: 0, growth: 7, cost: cost(200), abilities: ['undead', 'regeneration', 'life_drain'], shape: 'circle', large: false },
  { id: 'vampire',        name: 'Vampire Lord',    faction: 'necropolis', tier: 4, hp: 40, attack: 10, defense: 9, minDmg: 5, maxDmg: 8, speed: 7, initiative: 13, shots: 0, growth: 4, cost: cost(500), abilities: ['undead', 'flying', 'life_drain', 'no_retaliation'], shape: 'diamond', large: false },
  { id: 'lich',           name: 'Power Lich',      faction: 'necropolis', tier: 5, hp: 40, attack: 13, defense: 10, minDmg: 11, maxDmg: 15, speed: 6, initiative: 12, shots: 24, growth: 3, cost: cost(600), abilities: ['undead', 'ranged', 'curse_attack'], shape: 'triangle', large: false },
  { id: 'dread_knight',   name: 'Dread Knight',    faction: 'necropolis', tier: 6, hp: 120, attack: 18, defense: 18, minDmg: 15, maxDmg: 30, speed: 7, initiative: 14, shots: 0, growth: 2, cost: cost(1200, { mercury: 1 }), abilities: ['undead', 'double_strike', 'curse_attack', 'fear'], shape: 'diamond', large: true },
  { id: 'bone_dragon',    name: 'Bone Dragon',     faction: 'necropolis', tier: 7, hp: 180, attack: 19, defense: 17, minDmg: 25, maxDmg: 50, speed: 9, initiative: 17, shots: 0, growth: 1, cost: cost(3500, { sulfur: 1 }), abilities: ['undead', 'flying', 'fear'], shape: 'hexagon', large: true },
]

// ═════════════════════════════════════════════════════════════
//  DUNGEON — Dark: Troglodytes, Minotaurs, Black Dragons
// ═════════════════════════════════════════════════════════════
const DUNGEON_CREATURES: CreatureDef[] = [
  { id: 'troglodyte',     name: 'Troglodyte',      faction: 'dungeon', tier: 1, hp: 5, attack: 4, defense: 3, minDmg: 1, maxDmg: 3, speed: 4, initiative: 8, shots: 0, growth: 14, cost: cost(50), abilities: [], shape: 'square', large: false },
  { id: 'harpy',          name: 'Harpy Hag',       faction: 'dungeon', tier: 2, hp: 14, attack: 6, defense: 5, minDmg: 1, maxDmg: 4, speed: 6, initiative: 11, shots: 0, growth: 8, cost: cost(130), abilities: ['flying', 'no_retaliation'], shape: 'diamond', large: false },
  { id: 'beholder',       name: 'Evil Eye',        faction: 'dungeon', tier: 3, hp: 22, attack: 10, defense: 8, minDmg: 3, maxDmg: 5, speed: 5, initiative: 10, shots: 12, growth: 7, cost: cost(280), abilities: ['ranged'], shape: 'circle', large: false },
  { id: 'medusa',         name: 'Medusa Queen',    faction: 'dungeon', tier: 4, hp: 30, attack: 10, defense: 9, minDmg: 6, maxDmg: 8, speed: 5, initiative: 11, shots: 8, growth: 4, cost: cost(350), abilities: ['ranged', 'no_retaliation'], shape: 'triangle', large: false },
  { id: 'minotaur',       name: 'Minotaur King',   faction: 'dungeon', tier: 5, hp: 50, attack: 15, defense: 15, minDmg: 12, maxDmg: 20, speed: 6, initiative: 12, shots: 0, growth: 3, cost: cost(500), abilities: [], shape: 'square', large: true },
  { id: 'manticore',      name: 'Scorpicore',      faction: 'dungeon', tier: 6, hp: 80, attack: 14, defense: 14, minDmg: 14, maxDmg: 20, speed: 9, initiative: 15, shots: 0, growth: 2, cost: cost(850, { mercury: 1 }), abilities: ['flying'], shape: 'diamond', large: true },
  { id: 'black_dragon',   name: 'Black Dragon',    faction: 'dungeon', tier: 7, hp: 300, attack: 25, defense: 25, minDmg: 40, maxDmg: 80, speed: 11, initiative: 20, shots: 0, growth: 1, cost: cost(6000, { sulfur: 2 }), abilities: ['flying', 'fire_breath', 'anti_magic'], shape: 'hexagon', large: true },
]

// ═════════════════════════════════════════════════════════════
//  WILDS — Beasts & Monsters: Bears, Trolls, Minotaurs, Dragons
// ═════════════════════════════════════════════════════════════
const WILDS_CREATURES: CreatureDef[] = [
  { id: 'gnoll',           name: 'Gnoll',           faction: 'wilds', tier: 1, hp: 8,   attack: 4,  defense: 3,  minDmg: 1, maxDmg: 3, speed: 5,  initiative: 9,  shots: 0,  growth: 14, cost: cost(55),  abilities: [], shape: 'square', large: false },
  { id: 'spider',          name: 'Giant Spider',    faction: 'wilds', tier: 2, hp: 14,  attack: 5,  defense: 4,  minDmg: 2, maxDmg: 4, speed: 6,  initiative: 10, shots: 0,  growth: 9,  cost: cost(110), abilities: ['curse_attack'], shape: 'diamond', large: false },
  { id: 'lizard',          name: 'Lizard Warrior',  faction: 'wilds', tier: 3, hp: 22,  attack: 8,  defense: 7,  minDmg: 3, maxDmg: 6, speed: 5,  initiative: 11, shots: 8,  growth: 7,  cost: cost(190), abilities: ['ranged'], shape: 'triangle', large: false },
  { id: 'troll',           name: 'Cave Troll',      faction: 'wilds', tier: 4, hp: 40,  attack: 11, defense: 10, minDmg: 6, maxDmg: 10, speed: 4, initiative: 10, shots: 0,  growth: 4,  cost: cost(320), abilities: ['regeneration'], shape: 'square', large: true },
  { id: 'bear',            name: 'War Bear',        faction: 'wilds', tier: 5, hp: 55,  attack: 14, defense: 12, minDmg: 10, maxDmg: 16, speed: 6, initiative: 12, shots: 0, growth: 3,  cost: cost(450), abilities: ['double_strike'], shape: 'square', large: true },
  { id: 'wild_minotaur',   name: 'Minotaur Lord',   faction: 'wilds', tier: 6, hp: 100, attack: 17, defense: 16, minDmg: 16, maxDmg: 24, speed: 7, initiative: 15, shots: 0, growth: 2,  cost: cost(950, { ore: 1 }), abilities: ['fear'], shape: 'diamond', large: true },
  { id: 'wild_dragon',     name: 'Feral Dragon',    faction: 'wilds', tier: 7, hp: 250, attack: 22, defense: 22, minDmg: 35, maxDmg: 60, speed: 10, initiative: 18, shots: 0, growth: 1,  cost: cost(4000, { sulfur: 1, crystals: 1 }), abilities: ['flying', 'fire_breath', 'fear'], shape: 'hexagon', large: true },
]

// ─── Faction Definitions ─────────────────────────────────────
export const FACTIONS: Record<FactionId, FactionDef> = {
  castle:     { id: 'castle',     name: 'Castle',     color: '#4a90d9', creatures: CASTLE_CREATURES.map(c => c.id),     nativeTerrain: 'grass' },
  rampart:    { id: 'rampart',    name: 'Rampart',     color: '#27ae60', creatures: RAMPART_CREATURES.map(c => c.id),    nativeTerrain: 'forest' },
  tower:      { id: 'tower',      name: 'Tower',       color: '#9b59b6', creatures: TOWER_CREATURES.map(c => c.id),      nativeTerrain: 'snow' },
  inferno:    { id: 'inferno',    name: 'Inferno',     color: '#e74c3c', creatures: INFERNO_CREATURES.map(c => c.id),    nativeTerrain: 'lava' },
  necropolis: { id: 'necropolis', name: 'Necropolis',  color: '#555',    creatures: NECROPOLIS_CREATURES.map(c => c.id), nativeTerrain: 'dirt' },
  dungeon:    { id: 'dungeon',    name: 'Dungeon',     color: '#8e44ad', creatures: DUNGEON_CREATURES.map(c => c.id),    nativeTerrain: 'mountain' },
  wilds:      { id: 'wilds',      name: 'Wilds',       color: '#996633', creatures: WILDS_CREATURES.map(c => c.id),     nativeTerrain: 'forest' },
}

/** All creature definitions indexed by id */
export const ALL_CREATURES: Record<string, CreatureDef> = {}
for (const c of [
  ...CASTLE_CREATURES,
  ...RAMPART_CREATURES,
  ...TOWER_CREATURES,
  ...INFERNO_CREATURES,
  ...NECROPOLIS_CREATURES,
  ...DUNGEON_CREATURES,
  ...WILDS_CREATURES,
]) {
  ALL_CREATURES[c.id] = c
}

/** Get creatures for a faction, sorted by tier */
export function getCreaturesForFaction(faction: FactionId): CreatureDef[] {
  return FACTIONS[faction].creatures.map(id => ALL_CREATURES[id]).sort((a, b) => a.tier - b.tier)
}

/** Get all faction IDs */
export const FACTION_IDS: FactionId[] = ['castle', 'rampart', 'tower', 'inferno', 'necropolis', 'dungeon', 'wilds']
