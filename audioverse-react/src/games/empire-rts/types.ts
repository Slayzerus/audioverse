/**
 * Empire RTS — Kingdom Two Crowns-style side-scrolling RTS
 * Type definitions for all game entities and state.
 */

import type { PlayerSlot } from '../../pages/games/mini/types'

// ─── Core geometry ────────────────────────────────────────
export interface Vec2 { x: number; y: number }

// ─── Game modes ───────────────────────────────────────────
export type GameMode =
  | 'coop'          // PvE co-op campaign
  | 'pvp'           // Player vs Player (up to 4 teams)
  | 'skirmish'      // Quick PvP/PvE match
  | 'endless'       // Survival — waves grow, how long can you last?

// ─── Resource types ───────────────────────────────────────
export type ResourceType = 'gold' | 'wood' | 'meat'

// ─── Unit class hierarchy ─────────────────────────────────
export type UnitClass =
  | 'pawn'      // worker — gathers, builds, repairs
  | 'warrior'   // melee fighter
  | 'archer'    // ranged fighter
  | 'lancer'    // heavy melee, bonus vs mounted
  | 'monk'      // healer

export type EnemyClass =
  | 'gnoll' | 'troll' | 'spider' | 'skull' | 'snake'
  | 'lizard' | 'minotaur' | 'bear' | 'gnome' | 'shaman'

// ─── Faction color ────────────────────────────────────────
export type FactionColor = 'Blue' | 'Red' | 'Purple' | 'Yellow'

// ─── Direction ────────────────────────────────────────────
export type Direction = -1 | 1   // -1 = left, 1 = right

// ─── Building types ───────────────────────────────────────
export type BuildingType =
  | 'castle'      // Main base — lose this = game over
  | 'house'       // Increases population cap
  | 'barracks'    // Recruit warriors & lancers
  | 'archery'     // Recruit archers
  | 'monastery'   // Recruit monks
  | 'tower'       // Defensive — auto-fires arrows
  | 'wall'        // Blocks enemy movement, must be destroyed
  | 'goldmine'    // Generates gold passively
  | 'lumbermill'  // Gathers wood from nearby trees
  | 'farm'        // Generates meat passively
  | 'treasury'    // Expands gold storage capacity

// ─── Building entity ─────────────────────────────────────
export interface Building {
  id: number
  type: BuildingType
  x: number
  y: number         // ground level
  w: number
  h: number
  hp: number
  maxHp: number
  team: number
  built: boolean     // false = under construction
  buildProgress: number  // 0..1
  level: number      // upgrade level (1-3)
  cooldown: number   // recruit/produce timer
  rallyX: number     // where recruited units go
}

// ─── Unit entity ──────────────────────────────────────────
export interface Unit {
  id: number
  class: UnitClass
  x: number
  y: number
  hp: number
  maxHp: number
  team: number
  dir: Direction
  speed: number
  damage: number
  attackRange: number
  attackCooldown: number
  attackTimer: number
  target: number | null   // id of target unit/building/enemy
  state: 'idle' | 'move' | 'attack' | 'gather' | 'build' | 'heal'
  gatherTarget: number | null  // resource node id
  carryType: ResourceType | null
  carryAmount: number
  animFrame: number
  animTimer: number
  retreating: boolean
}

// ─── Enemy entity ─────────────────────────────────────────
export interface Enemy {
  id: number
  class: EnemyClass
  x: number
  y: number
  hp: number
  maxHp: number
  dir: Direction
  speed: number
  damage: number
  attackRange: number
  attackCooldown: number
  attackTimer: number
  target: number | null
  state: 'walk' | 'attack' | 'dying'
  animFrame: number
  animTimer: number
  loot: number       // gold dropped when killed
}

// ─── Resource node ────────────────────────────────────────
export interface ResourceNode {
  id: number
  type: ResourceType
  x: number
  y: number
  amount: number
  maxAmount: number
}

// ─── Projectile ───────────────────────────────────────────
export interface Projectile {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  team: number      // -1 = enemy projectile
  life: number
}

// ─── Hero (player-controlled character) ───────────────────
export interface Hero {
  playerIndex: number
  name: string
  team: number
  x: number
  y: number
  dir: Direction
  speed: number
  gold: number         // coins in pouch
  maxGold: number      // pouch capacity (upgradable)
  canAttack: boolean   // configurable
  hp: number
  maxHp: number
  damage: number
  attackRange: number
  attackTimer: number
  attackCooldown: number
  interactCooldown: number
  selectedBuilding: BuildingType | null
  animFrame: number
  animTimer: number
  state: 'idle' | 'walk' | 'attack'
  isBot: boolean
}

// ─── Camera (per viewport / player) ──────────────────────
export interface Camera {
  x: number          // world X center
  targetX: number    // lerp target
}

// ─── Wave definition ─────────────────────────────────────
export interface WaveConfig {
  enemies: { class: EnemyClass; count: number }[]
  side: Direction    // which side enemies come from
  delay: number      // ticks before wave spawns
}

// ─── Team state ───────────────────────────────────────────
export interface TeamState {
  gold: number
  wood: number
  meat: number
  maxGold: number    // treasury capacity
  popCurrent: number
  popMax: number
  alive: boolean
}

// ─── Game state ───────────────────────────────────────────
export interface GameState {
  mode: GameMode
  frame: number
  tick: number       // incremented each logic tick

  // World
  worldW: number
  groundY: number
  treePositions: number[]  // x positions of trees (background)

  // Entities
  heroes: Hero[]
  units: Unit[]
  enemies: Enemy[]
  buildings: Building[]
  resourceNodes: ResourceNode[]
  projectiles: Projectile[]

  // Teams
  teams: TeamState[]
  teamCount: number

  // Waves
  waveNumber: number
  waveTimer: number
  waveCooldown: number
  waveActive: boolean
  nextWave: WaveConfig | null

  // Misc
  nextId: number
  gameOver: boolean
  winner: number      // team index or -1
  day: number
  dayTimer: number
  isNight: boolean

  // Config
  heroCanAttack: boolean
  difficulty: number   // 1-3
  playerSlots: PlayerSlot[]

  // Kill feed / events
  events: GameEvent[]
}

// ─── Game events (for HUD) ────────────────────────────────
export interface GameEvent {
  text: string
  color: string
  timer: number
}

// ─── Sprite sheet ref ─────────────────────────────────────
export interface SpriteRef {
  src: string
  frameW: number
  frameH: number
  frameCount: number
}
