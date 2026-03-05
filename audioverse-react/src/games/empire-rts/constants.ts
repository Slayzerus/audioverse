/**
 * Empire RTS — Constants & configuration
 */
import type { BuildingType, UnitClass, EnemyClass, FactionColor, ResourceType } from './types'

// ─── Timing ───────────────────────────────────────────────
export const TICK_MS = 33            // ~30 FPS logic
export const DT     = TICK_MS / 1000

// ─── World ────────────────────────────────────────────────
export const VIEW_W   = 960
export const VIEW_H   = 540
export const WORLD_W  = 4800         // scrollable world width
export const GROUND_Y = 400          // ground level (y increases downward)
export const TREE_ZONE_START = 300   // trees begin past this x offset from spawn

// ─── Day/Night ────────────────────────────────────────────
export const DAY_LENGTH   = 1800     // ticks per day (~60s)
export const NIGHT_LENGTH = 900      // ticks per night (~30s)

// ─── Hero ─────────────────────────────────────────────────
export const HERO_SPEED        = 3.0
export const HERO_HP           = 200
export const HERO_DMG          = 15
export const HERO_ATTACK_RANGE = 40
export const HERO_ATTACK_CD    = 20
export const HERO_INTERACT_R   = 60
export const HERO_START_GOLD   = 10
export const HERO_POUCH_CAP    = 30
export const HERO_POUCH_UPGRADE = 20  // extra per treasury level

// ─── Camera ───────────────────────────────────────────────
export const CAM_LERP    = 0.08
export const CAM_MARGIN  = 200       // margin from hero before scrolling

// ─── Unit stats: [hp, speed, damage, range, cooldown, cost] ──
export const UNIT_STATS: Record<UnitClass, {
  hp: number; speed: number; damage: number;
  range: number; cooldown: number; cost: number;
  costType: ResourceType;
}> = {
  pawn:    { hp: 50,  speed: 1.8, damage: 5,  range: 30,  cooldown: 30, cost: 5,  costType: 'gold' },
  warrior: { hp: 120, speed: 2.0, damage: 18, range: 35,  cooldown: 24, cost: 12, costType: 'gold' },
  archer:  { hp: 60,  speed: 1.6, damage: 12, range: 200, cooldown: 40, cost: 10, costType: 'gold' },
  lancer:  { hp: 140, speed: 2.2, damage: 22, range: 45,  cooldown: 28, cost: 15, costType: 'gold' },
  monk:    { hp: 70,  speed: 1.4, damage: 0,  range: 80,  cooldown: 50, cost: 14, costType: 'gold' },
}

// ─── Enemy stats: [hp, speed, damage, range, cooldown, loot] ──
export const ENEMY_STATS: Record<EnemyClass, {
  hp: number; speed: number; damage: number;
  range: number; cooldown: number; loot: number;
}> = {
  gnoll:    { hp: 40,  speed: 1.5, damage: 8,  range: 30,  cooldown: 25, loot: 3  },
  troll:    { hp: 180, speed: 0.8, damage: 25, range: 40,  cooldown: 40, loot: 10 },
  spider:   { hp: 35,  speed: 2.5, damage: 6,  range: 25,  cooldown: 18, loot: 2  },
  skull:    { hp: 50,  speed: 1.8, damage: 10, range: 30,  cooldown: 22, loot: 4  },
  snake:    { hp: 30,  speed: 2.0, damage: 12, range: 25,  cooldown: 20, loot: 3  },
  lizard:   { hp: 90,  speed: 1.2, damage: 15, range: 35,  cooldown: 28, loot: 6  },
  minotaur: { hp: 250, speed: 0.6, damage: 35, range: 45,  cooldown: 45, loot: 15 },
  bear:     { hp: 160, speed: 1.0, damage: 20, range: 35,  cooldown: 32, loot: 8  },
  gnome:    { hp: 25,  speed: 2.8, damage: 5,  range: 20,  cooldown: 15, loot: 2  },
  shaman:   { hp: 70,  speed: 1.0, damage: 14, range: 150, cooldown: 50, loot: 8  },
}

// ─── Building definitions ─────────────────────────────────
export const BUILDING_DEFS: Record<BuildingType, {
  w: number; h: number; hp: number;
  costGold: number; costWood: number;
  buildTime: number;  // ticks to build
  popAdd: number;     // pop cap increase
  produces?: UnitClass;
  recruitTime?: number;
  upgradable: boolean;
}> = {
  castle:     { w: 96, h: 80, hp: 500, costGold: 0,  costWood: 0,  buildTime: 0,   popAdd: 5,  upgradable: true },
  house:      { w: 56, h: 48, hp: 100, costGold: 8,  costWood: 5,  buildTime: 120, popAdd: 5,  upgradable: true },
  barracks:   { w: 64, h: 56, hp: 200, costGold: 15, costWood: 10, buildTime: 180, popAdd: 0,  produces: 'warrior', recruitTime: 90, upgradable: true },
  archery:    { w: 64, h: 56, hp: 150, costGold: 12, costWood: 8,  buildTime: 150, popAdd: 0,  produces: 'archer',  recruitTime: 80, upgradable: true },
  monastery:  { w: 64, h: 60, hp: 120, costGold: 18, costWood: 12, buildTime: 200, popAdd: 0,  produces: 'monk',    recruitTime: 120, upgradable: true },
  tower:      { w: 40, h: 72, hp: 250, costGold: 10, costWood: 15, buildTime: 150, popAdd: 0,  upgradable: true },
  wall:       { w: 24, h: 56, hp: 300, costGold: 3,  costWood: 8,  buildTime: 60,  popAdd: 0,  upgradable: true },
  goldmine:   { w: 56, h: 48, hp: 120, costGold: 20, costWood: 5,  buildTime: 200, popAdd: 0,  upgradable: true },
  lumbermill: { w: 56, h: 48, hp: 100, costGold: 10, costWood: 3,  buildTime: 120, popAdd: 0,  upgradable: true },
  farm:       { w: 56, h: 40, hp: 80,  costGold: 8,  costWood: 5,  buildTime: 100, popAdd: 0,  upgradable: true },
  treasury:   { w: 56, h: 52, hp: 150, costGold: 25, costWood: 10, buildTime: 200, popAdd: 0,  upgradable: true },
}

// ─── Upgrade cost multiplier per level ────────────────────
export const UPGRADE_COST_MULT = [1, 1.5, 2.5]
export const UPGRADE_HP_MULT   = [1, 1.4, 2.0]

// ─── Resource nodes ───────────────────────────────────────
export const RESOURCE_NODE_CAPACITY: Record<ResourceType, number> = {
  gold: 100,
  wood: 80,
  meat: 60,
}
export const GATHER_RATE    = 1     // amount per gather tick
export const GATHER_CD      = 30    // ticks between gathers
export const CARRY_MAX      = 10    // units carry at most this before returning

// ─── Passive income buildings ─────────────────────────────
export const GOLDMINE_RATE  = 60    // ticks per gold
export const FARM_RATE      = 80    // ticks per meat
export const LUMBER_RATE    = 70    // ticks per wood

// ─── Tower ────────────────────────────────────────────────
export const TOWER_RANGE      = 220
export const TOWER_DAMAGE     = 10
export const TOWER_FIRE_CD    = 45
export const ARROW_SPEED      = 6

// ─── Projectile ───────────────────────────────────────────
export const PROJ_GRAVITY   = 0.12
export const PROJ_LIFETIME  = 120   // ticks

// ─── Wave system ──────────────────────────────────────────
export const WAVE_START_DELAY  = 600   // ticks before first wave (~20s)
export const WAVE_INTERVAL     = 900   // ticks between waves (~30s)
export const WAVE_GROWTH       = 0.25  // enemy count multiplier per wave

// ─── Wave enemy pool per difficulty ───────────────────────
export const WAVE_ENEMY_POOL: Record<number, EnemyClass[]> = {
  1: ['gnoll', 'gnome', 'spider'],
  2: ['gnoll', 'gnome', 'spider', 'skull', 'snake', 'lizard'],
  3: ['gnoll', 'gnome', 'spider', 'skull', 'snake', 'lizard', 'troll', 'bear', 'minotaur', 'shaman'],
}

// ─── Faction colours (team index → color) ─────────────────
export const TEAM_COLORS: FactionColor[] = ['Blue', 'Red', 'Purple', 'Yellow']
export const TEAM_HEX: string[] = ['#4488ff', '#ee4444', '#aa44ff', '#ffcc00']

// ─── Build menu order ─────────────────────────────────────
export const BUILD_MENU: BuildingType[] = [
  'house', 'wall', 'barracks', 'archery', 'monastery',
  'tower', 'goldmine', 'lumbermill', 'farm', 'treasury',
]

// ─── Sprite base paths ───────────────────────────────────
const SP = '/assets/sprites/Tiny Swords'
export const SPRITE_FREE   = `${SP}/Tiny Swords (Free Pack)`
export const SPRITE_UPDATE = `${SP}/Tiny Swords (Update 010)`
export const SPRITE_ENEMY  = `${SP}/Tiny Swords (Enemy Pack)/Enemy Pack`
