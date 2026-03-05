/**
 * Types for AtomicPostApo (Fallout-style isometric action RPG)
 */
import type { PlayerSlot } from '../../pages/games/mini/types'

export type { PlayerSlot }

// ─── Vectors ─────────────────────────────────────────────
export interface Vec2 { x: number; y: number }
export interface Vec3 { x: number; y: number; z: number }

// ─── Entities ────────────────────────────────────────────
export interface Bullet {
  id: number           // unique ID for mesh tracking
  x: number; y: number; z: number
  dx: number; dy: number
  owner: number        // player idx
  life: number         // ms remaining
  damage: number
  weaponIdx: number
}

export type EnemyKind = 'mutant' | 'raider' | 'deathclaw' | 'feral_dog' | 'radscorpion'
export interface Enemy {
  id: number
  x: number; y: number
  hp: number; maxHp: number
  kind: EnemyKind
  area: number
  dir: Vec2
  timer: number
  attackCd: number
  alertRange: number
  speed: number
  damage: number
  dead: boolean
}

export type LootItem = 'health' | 'ammo' | 'armor' | 'coin' | 'stimpak' | 'radaway' | 'weapon_upgrade'
export interface LootBox {
  id: number
  x: number; y: number
  open: boolean
  item: LootItem
  value: number
}

export interface Building {
  id: number
  x: number; y: number
  w: number; h: number
  type: string        // model type identifier
  rotation: number    // y rotation in radians
  destructible: boolean
  hp: number
}

export interface WallSegment {
  id: number
  x: number; y: number
  rotation: number
  type: string
  blocking: boolean
}

export interface RadZone {
  x: number; y: number
  r: number
  intensity: number   // damage per second
}

export interface Area {
  id: number
  x: number; y: number
  w: number; h: number
  cleared: boolean
  name: string
}

export interface Prop {
  id: number
  x: number; y: number
  rotation: number
  type: string
  scale: number
  blocking: boolean
}

export interface Campfire {
  x: number; y: number
  healPerSec: number
}

// ─── Player ──────────────────────────────────────────────
export interface Weapon {
  name: string
  damage: number
  fireRate: number    // ms between shots
  range: number       // bullet lifetime ms
  bulletSpeed: number
  spread: number      // radians
  ammoPerShot: number
  projectiles: number // for shotguns
}

export interface Player {
  idx: number
  x: number; y: number
  angle: number       // facing direction (radians)
  hp: number; maxHp: number
  armor: number; maxArmor: number
  ammo: number
  alive: boolean
  color: string; name: string
  input: PlayerSlot['input']
  shootCd: number
  vatsCd: number; vatsTimer: number
  kills: number
  coins: number; gems: number; stars: number
  areasCleared: number
  weaponIdx: number
  stimpaks: number
  radaway: number
  radiation: number   // accumulated radiation damage
  sprint: boolean
  interactCd: number
}

// ─── HUD / Kill Feed ────────────────────────────────────
export interface KillFeedEntry {
  text: string
  time: number
  color: string
}

// ─── Game state ──────────────────────────────────────────
export interface GameState {
  players: Player[]
  bullets: Bullet[]
  enemies: Enemy[]
  loot: LootBox[]
  buildings: Building[]
  walls: WallSegment[]
  props: Prop[]
  radZones: RadZone[]
  areas: Area[]
  campfires: Campfire[]
  mapW: number; mapH: number
  mode: string
  gameOver: boolean
  winner: number | null  // -1 = team win, null = defeat
  time: number
  killFeed: KillFeedEntry[]
  wave: number           // for survival mode
  enemyNextId: number
  bulletNextId: number
  /** Cached obstacle rects — rebuilt once per initState */
  cachedObstacles: Array<{ x: number; y: number; w: number; h: number }> | null
  /** Previous-frame key state for edge detection */
  prevKeys: Set<string>
}
