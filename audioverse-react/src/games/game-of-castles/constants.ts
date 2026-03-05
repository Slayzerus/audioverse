/**
 * constants.ts — Core game constants for Game of Castles.
 */

// ─── Map Sizes ───────────────────────────────────────────────
export const MAP_SIZES = {
  small:  { cols: 18, rows: 14 },
  medium: { cols: 28, rows: 22 },
  large:  { cols: 40, rows: 30 },
} as const

// ─── Tile rendering ──────────────────────────────────────────
export const TILE_PX = 28                // pixels per cell on adventure map
export const CANVAS_W = 900
export const CANVAS_H = 640

// ─── Combat grid ─────────────────────────────────────────────
export const COMBAT_COLS = 11
export const COMBAT_ROWS = 9
export const COMBAT_TILE = 48

// ─── Timing (turn-based, in logical units) ───────────────────
export const HERO_MOVE_COOLDOWN_MS = 200   // min ms between arrow presses
export const AI_THINK_DELAY_MS = 600       // delay before AI acts
export const COMBAT_ANIM_MS = 350          // attack animation duration

// ─── Hero defaults ───────────────────────────────────────────
export const BASE_MOVEMENT_POINTS = 12
export const ROAD_MOVE_COST = 0.5
export const GRASS_MOVE_COST = 1
export const FOREST_MOVE_COST = 1.5
export const SAND_MOVE_COST = 1.5
export const SWAMP_MOVE_COST = 2
export const SNOW_MOVE_COST = 1.5
export const DIRT_MOVE_COST = 1
export const IMPASSABLE_COST = Infinity

export const HERO_START_STATS = {
  knight:       { attack: 2, defense: 2, spellPower: 1, knowledge: 1 },
  cleric:       { attack: 1, defense: 0, spellPower: 2, knowledge: 2 },
  ranger:       { attack: 2, defense: 1, spellPower: 1, knowledge: 1 },
  druid:        { attack: 0, defense: 2, spellPower: 2, knowledge: 2 },
  alchemist:    { attack: 1, defense: 1, spellPower: 2, knowledge: 2 },
  wizard:       { attack: 0, defense: 0, spellPower: 3, knowledge: 3 },
  demoniac:     { attack: 3, defense: 1, spellPower: 1, knowledge: 1 },
  heretic:      { attack: 1, defense: 1, spellPower: 2, knowledge: 2 },
  death_knight: { attack: 3, defense: 2, spellPower: 1, knowledge: 1 },
  necromancer:  { attack: 1, defense: 0, spellPower: 2, knowledge: 3 },
  overlord:     { attack: 2, defense: 2, spellPower: 2, knowledge: 0 },
  warlock:      { attack: 0, defense: 0, spellPower: 3, knowledge: 3 },
  beastmaster:  { attack: 3, defense: 2, spellPower: 0, knowledge: 1 },
  shaman:       { attack: 1, defense: 1, spellPower: 2, knowledge: 2 },
} as const

// ─── XP curve ────────────────────────────────────────────────
export const XP_PER_LEVEL = [
  0, 1000, 2000, 3200, 4600, 6200, 8000, 10000, 12200, 14700,
  17500, 20600, 24320, 28784, 34140, 40567, 48167, 57084, 67508, 79680,
] as const

// ─── Economy ─────────────────────────────────────────────────
export const START_RESOURCES = {
  gold: 5000, wood: 10, ore: 10, crystals: 2, gems: 2, mercury: 2, sulfur: 2,
} as const

export const MINE_INCOME: Record<string, number> = {
  gold: 1000,
  wood: 2,
  ore: 2,
  crystals: 1,
  gems: 1,
  mercury: 1,
  sulfur: 1,
}

export const MARKET_RATE = 5          // base trade ratio
export const MARKET_IMPROVED_RATE = 3 // with marketplace building

// ─── Town ────────────────────────────────────────────────────
export const MAX_GARRISON_SLOTS = 7
export const MAX_HERO_ARMY_SLOTS = 7
export const TAVERN_HERO_COST = 2500

// ─── Combat ──────────────────────────────────────────────────
export const MAX_COMBAT_ROUNDS = 50         // auto-draw after this
export const MORALE_BONUS_CHANCE = 0.125    // per morale point
export const LUCK_BONUS_CHANCE = 0.125      // per luck point
export const HIGH_MORALE_EXTRA_ACTION = true
export const LOW_MORALE_SKIP_CHANCE = 0.125
export const MAX_MORALE = 3
export const MAX_LUCK = 3
export const MIN_MORALE = -3
export const MIN_LUCK = -3
export const RANGED_PENALTY_MELEE = 0.5     // ranged units deal half in melee
export const RANGED_PENALTY_OBSTACLE = 0.5  // halved if blocked
export const SIEGE_WALL_HP = 100
export const SIEGE_TOWER_HP = 60
export const SIEGE_GATE_HP = 80

// ─── Terrain Colors ──────────────────────────────────────────
export const TERRAIN_COLORS: Record<string, string> = {
  grass: '#5b8c3e',
  forest: '#2e5e1a',
  mountain: '#888',
  water: '#3977c4',
  road: '#c9b582',
  sand: '#d4b96a',
  swamp: '#5e6e3a',
  snow: '#dce8f0',
  lava: '#8b3a3a',
  dirt: '#9b8660',
}

// Alias for combat.ts compatibility
export const MORALE_POSITIVE_CHANCE = MORALE_BONUS_CHANCE

// ─── Resource Icons ──────────────────────────────────────────
export const RESOURCE_ICONS: Record<string, string> = {
  gold: '🪙',
  wood: '🪵',
  ore: '🪨',
  crystals: '💎',
  gems: '💠',
  mercury: '🧪',
  sulfur: '🔥',
}

// ─── Scoring ─────────────────────────────────────────────────
export const COINS_PER_BATTLE_WON = 1
export const GEMS_PER_TOWN_CAPTURED = 1
export const STARS_PER_GAME_WON = 1

// ─── Difficulty Modifiers ────────────────────────────────────
export const DIFFICULTY_MODS = {
  easy:   { aiResourceMult: 0.8, aiArmyMult: 0.7, aiAggressiveness: 0.3, neutralStrength: 0.6 },
  normal: { aiResourceMult: 1.0, aiArmyMult: 1.0, aiAggressiveness: 0.5, neutralStrength: 1.0 },
  hard:   { aiResourceMult: 1.3, aiArmyMult: 1.3, aiAggressiveness: 0.7, neutralStrength: 1.2 },
  expert: { aiResourceMult: 1.6, aiArmyMult: 1.6, aiAggressiveness: 0.9, neutralStrength: 1.5 },
} as const
