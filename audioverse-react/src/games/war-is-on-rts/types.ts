/**
 * War Is On — Complete types, constants, and interfaces.
 * Medieval RTS using Tiny Swords sprite pack.
 * Units: Warrior, Archer, Pawn (worker), Lancer, Monk (healer)
 * Buildings: Castle (base), Barracks, Archery, House, Tower, Monastery
 * Resources: Gold, Wood, Meat
 */

import type { GameFactionColor } from '../../common/sprites/TinySwordsAssets'

// ─── Canvas / viewport ───────────────────────────────────────
/** Viewport (screen) dimensions – each player's split-screen portion */
export const VIEWPORT_W = 640
export const VIEWPORT_H = 400
export const TILE = 64

// ─── Camera ──────────────────────────────────────────────────
export interface Camera {
  x: number   // world top-left x
  y: number   // world top-left y
  vw: number  // viewport width in pixels
  vh: number  // viewport height in pixels
}

// ─── Map definition ──────────────────────────────────────────
export interface MapSpawnPoint { x: number; y: number }
export interface MapResourceZone {
  cx: number; cy: number; radius: number
  kind: ResourceKind; count: number; amountEach: number
}
export interface MapDecoZone {
  cx: number; cy: number; radius: number
  kind: Decoration['kind']; count: number
}

export interface MapDef {
  id: string
  name: string
  worldW: number
  worldH: number
  terrainType: 'grass' | 'sand' | 'snow' | 'dark'
  /** Where each player spawns (index = player slot) */
  spawnPoints: MapSpawnPoint[]
  /** Pre-placed resource clusters */
  resourceZones: MapResourceZone[]
  /** Decoration clusters */
  decoZones: MapDecoZone[]
  /** Water channels / lakes (rect areas that are water, not land) */
  waterAreas?: { x: number; y: number; w: number; h: number }[]
  /** Description shown in map select */
  description?: string
}

// ─── Commander ───────────────────────────────────────────────
export const CMD_R = 16
export const CMD_SPEED = 3.5

// ─── Combat ──────────────────────────────────────────────────
export const MELEE_RANGE = 32
export const RANGED_RANGE = 120

// ─── Building constants ─────────────────────────────────────
export const BUILDING_SIZE = 48
export const BUILD_TIME_TICKS = 60

export type BuildingKind = 'castle' | 'barracks' | 'archery' | 'house' | 'tower' | 'monastery'

export interface BuildingDef {
  hp: number; cost: number; costType: ResourceKind; label: string
  /** For towers: attack range, damage, fire rate (ticks between shots) */
  attackRange?: number; attackDmg?: number; fireRate?: number
  /** For houses: how many population slots this building provides */
  popSlots?: number
}

export const BUILDING_DEFS: Record<BuildingKind, BuildingDef> = {
  castle:     { hp: 100, cost: 0,  costType: 'gold', label: 'Castle', popSlots: 5 },
  barracks:   { hp: 60,  cost: 15, costType: 'gold', label: 'Barracks' },
  archery:    { hp: 50,  cost: 12, costType: 'wood', label: 'Archery' },
  house:      { hp: 40,  cost: 8,  costType: 'wood', label: 'House',  popSlots: 4 },
  tower:      { hp: 70,  cost: 20, costType: 'gold', label: 'Tower',  attackRange: 140, attackDmg: 3, fireRate: 25 },
  monastery:  { hp: 45,  cost: 18, costType: 'gold', label: 'Monastery', popSlots: 2 },
}

// ─── Resources ───────────────────────────────────────────────
export type ResourceKind = 'gold' | 'wood' | 'meat'

// ─── Unit types ──────────────────────────────────────────────
export type UnitKind = 'warrior' | 'archer' | 'pawn' | 'lancer' | 'monk'

export interface UnitDef {
  kind: UnitKind
  hp: number; dmg: number; speed: number; range: number
  cost: number; costType: ResourceKind; trainTime: number
  trainedAt: BuildingKind
  label: string; r: number
}

export const UNIT_DEFS: Record<UnitKind, UnitDef> = {
  warrior: { kind: 'warrior', hp: 14, dmg: 3,   speed: 1.6, range: MELEE_RANGE,  cost: 5,  costType: 'gold', trainTime: 70,  trainedAt: 'barracks',  label: 'Warrior', r: 10 },
  archer:  { kind: 'archer',  hp: 8,  dmg: 2.5, speed: 1.8, range: RANGED_RANGE, cost: 4,  costType: 'wood', trainTime: 60,  trainedAt: 'archery',   label: 'Archer',  r: 9 },
  pawn:    { kind: 'pawn',    hp: 5,  dmg: 1,   speed: 2.4, range: MELEE_RANGE,  cost: 2,  costType: 'meat', trainTime: 35,  trainedAt: 'house',     label: 'Pawn',    r: 8 },
  lancer:  { kind: 'lancer',  hp: 11, dmg: 5,   speed: 3.0, range: MELEE_RANGE,  cost: 7,  costType: 'gold', trainTime: 85,  trainedAt: 'barracks',  label: 'Lancer',  r: 10 },
  monk:    { kind: 'monk',    hp: 7,  dmg: 0,   speed: 1.7, range: 70,           cost: 6,  costType: 'gold', trainTime: 65,  trainedAt: 'monastery', label: 'Monk',    r: 8 },
}

export const BUILDABLE_UNITS: UnitKind[] = ['warrior', 'archer', 'pawn', 'lancer', 'monk']
export const BUILDABLE_BUILDINGS: BuildingKind[] = ['barracks', 'archery', 'house', 'tower', 'monastery']

// ─── Enemy types ─────────────────────────────────────────────
export type EnemyKind = 'gnoll' | 'gnome' | 'troll' | 'minotaur' | 'bear' |
  'lizard' | 'snake' | 'spider' | 'skull' | 'panda' | 'thief' |
  'harpoonFish' | 'paddleFish' | 'shaman' | 'turtle'

export const ENEMY_DEFS: Record<EnemyKind, { hp: number; dmg: number; speed: number; range: number; r: number }> = {
  gnoll:       { hp: 8,  dmg: 2, speed: 1.5, range: 50,  r: 10 },
  gnome:       { hp: 5,  dmg: 1, speed: 2.0, range: 28,  r: 7 },
  troll:       { hp: 25, dmg: 5, speed: 1.0, range: 35,  r: 14 },
  minotaur:    { hp: 20, dmg: 4, speed: 1.2, range: 32,  r: 14 },
  bear:        { hp: 18, dmg: 4, speed: 1.3, range: 30,  r: 12 },
  lizard:      { hp: 10, dmg: 3, speed: 1.8, range: 28,  r: 10 },
  snake:       { hp: 6,  dmg: 2, speed: 2.5, range: 25,  r: 8 },
  spider:      { hp: 7,  dmg: 2, speed: 2.2, range: 28,  r: 9 },
  skull:       { hp: 14, dmg: 3, speed: 1.4, range: 30,  r: 11 },
  panda:       { hp: 15, dmg: 3, speed: 1.5, range: 30,  r: 12 },
  thief:       { hp: 6,  dmg: 3, speed: 2.8, range: 25,  r: 8 },
  harpoonFish: { hp: 9,  dmg: 2, speed: 1.6, range: 60,  r: 10 },
  paddleFish:  { hp: 8,  dmg: 2, speed: 1.4, range: 28,  r: 10 },
  shaman:      { hp: 8,  dmg: 3, speed: 1.3, range: 80,  r: 10 },
  turtle:      { hp: 20, dmg: 2, speed: 0.8, range: 28,  r: 12 },
}

// ─── Game entities ───────────────────────────────────────────
export interface Unit {
  id: number
  x: number; y: number
  hp: number; maxHp: number
  dmg: number; speed: number; range: number; r: number
  kind: UnitKind
  owner: number
  target: { x: number; y: number } | null
  attackTarget: number | null
  facingLeft: boolean
  animState: 'idle' | 'run' | 'attack' | 'dead' | 'gather'
  animTick: number
  gatherTarget: number | null // resource node id
  carrying: ResourceKind | null
  carryAmount: number
}

export interface EnemyUnit {
  id: number
  x: number; y: number
  hp: number; maxHp: number
  dmg: number; speed: number; range: number; r: number
  kind: EnemyKind
  target: { x: number; y: number } | null
  facingLeft: boolean
  animState: 'idle' | 'run' | 'attack' | 'dead'
  animTick: number
}

export interface Building {
  id: number
  x: number; y: number
  hp: number; maxHp: number
  kind: BuildingKind
  owner: number
  buildProgress: number // 0..1
  trainQueue: UnitKind[]
  trainProgress: number
}

export interface ResourceNode {
  id: number
  x: number; y: number
  kind: ResourceKind
  amount: number
  maxAmount: number
  variant: number
}

export interface Projectile {
  x: number; y: number
  dx: number; dy: number
  speed: number; dmg: number
  owner: number
  life: number
}

export interface Decoration {
  x: number; y: number
  kind: 'bush' | 'rock' | 'cloud' | 'waterRock' | 'rubberDuck' | 'deco' | 'stump'
  variant: number
  scale: number
}

export interface Effect {
  x: number; y: number
  kind: 'dust' | 'explosion' | 'fire' | 'waterSplash'
  variant: number
  tick: number
  maxTick: number
}

/** Floating text (damage numbers, heal, build feedback) */
export interface FloatingText {
  x: number; y: number
  text: string
  color: string
  tick: number
  maxTick: number
}

export interface Commander {
  x: number; y: number
  owner: number
  factionColor: GameFactionColor
  facingLeft: boolean
  animTick: number
}

export interface PlayerState {
  gold: number; wood: number; meat: number
  stars: number; alive: boolean
  name: string; factionColor: GameFactionColor
  selectedBuild: number // index for cycling build options (0-4 for buildings)
  selectedUnit: number  // index for cycling unit to train
}

export interface GameState {
  commanders: Commander[]
  units: Unit[]
  enemyUnits: EnemyUnit[]
  buildings: Building[]
  resourceNodes: ResourceNode[]
  projectiles: Projectile[]
  decorations: Decoration[]
  effects: Effect[]
  floatingTexts: FloatingText[]
  players: PlayerState[]
  cameras: Camera[]
  gameOver: boolean
  winnerIdx: number | null
  tick: number
  coop: boolean
  nextId: number
  mapW: number; mapH: number
  mapId: string
  terrainType: 'grass' | 'sand' | 'snow' | 'dark'
  waterAreas: { x: number; y: number; w: number; h: number }[]
  waveTimer: number
  waveNumber: number
  /** Fog of war: each player has a visibility grid (optional future) */
}

// ─── Input ───────────────────────────────────────────────────
export interface KBAction {
  group: number
  action: 'up' | 'down' | 'left' | 'right' | 'build' | 'rally' | 'burrow' | 'cycle' | 'train'
}

export const KB_MAP: Record<string, KBAction> = {
  w: { group: 0, action: 'up' }, s: { group: 0, action: 'down' },
  a: { group: 0, action: 'left' }, d: { group: 0, action: 'right' },
  ' ': { group: 0, action: 'build' }, e: { group: 0, action: 'rally' },
  q: { group: 0, action: 'burrow' }, r: { group: 0, action: 'cycle' },
  t: { group: 0, action: 'train' },
  ArrowUp: { group: 1, action: 'up' }, ArrowDown: { group: 1, action: 'down' },
  ArrowLeft: { group: 1, action: 'left' }, ArrowRight: { group: 1, action: 'right' },
  Enter: { group: 1, action: 'build' }, Shift: { group: 1, action: 'rally' },
  Control: { group: 1, action: 'burrow' }, '/': { group: 1, action: 'cycle' },
  '.': { group: 1, action: 'train' },
}

// ─── Helpers ─────────────────────────────────────────────────
export function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function moveToward(obj: { x: number; y: number }, tx: number, ty: number, spd: number): boolean {
  const d = dist(obj, { x: tx, y: ty })
  if (d < spd) { obj.x = tx; obj.y = ty; return true }
  obj.x += ((tx - obj.x) / d) * spd
  obj.y += ((ty - obj.y) / d) * spd
  return false
}

/** How many unit slots a player has (castle 5 + each house 4 + monastery 2) */
export function getPopCap(st: GameState, owner: number): number {
  let cap = 0
  for (const b of st.buildings) {
    if (b.owner !== owner || b.hp <= 0 || b.buildProgress < 1) continue
    const def = BUILDING_DEFS[b.kind]
    if (def.popSlots) cap += def.popSlots
  }
  return cap
}

/** How many units a player currently has alive */
export function getPopUsed(st: GameState, owner: number): number {
  return st.units.filter(u => u.owner === owner && u.hp > 0).length
}
