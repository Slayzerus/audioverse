/**
 * Type definitions for the Warzone FPP game — 3D FPS with Three.js.
 *
 * Theme: Cops vs Robbers (Heist)
 *   Team 0 = Robbers (red)   Team 1 = Police/SWAT (blue)
 */
import type { PlayerSlot } from '../../pages/games/mini/types'

export type { PlayerSlot }

export interface Vec { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

// ─── Game Modes ──────────────────────────────────────────
export type GameMode =
  | 'deathmatch'       // FFA – first to targetKills wins
  | 'team-deathmatch'  // Team kills
  | 'conquest'         // Capture points + ticket bleed
  | 'convoy'           // Escort vehicle along waypoints
  | 'escort'           // Protect VIP to extraction
  | 'bomb'             // Plant / defuse (CS-style)
  | 'heist'            // Robbers steal loot → extract, Cops defend
  | 'ctf'              // Capture the Flag
  | 'survival'         // Co-op PvE waves
  | 'race'             // Vehicle checkpoint race
  | 'coop-assault'     // Co-op: capture all points
  | 'battle-royale'    // Last-man-standing with shrinking zone

// ─── Camera Perspective ──────────────────────────────────
export type CameraPerspective = 'fpp' | 'tpp'

// ─── Tile Map (3D world grid for walls & collision) ──────
export interface TileMap {
  /** Width in tiles */
  w: number
  /** Height in tiles */
  h: number
  /** Flat array [y * w + x]. 0 = open floor, 1+ = wall type */
  data: number[]
  /** Tile size in world units (meters) */
  tileSize: number
}

// Wall type constants (tile values 1–8)
export const WALL_BRICK      = 1
export const WALL_CONCRETE   = 2
export const WALL_METAL      = 3
export const WALL_WOOD       = 4
export const WALL_GLASS      = 5
export const WALL_DARK_BRICK = 6
export const WALL_VAULT      = 7
export const WALL_POLICE     = 8

/** Colours for each wall type (used by Three.js materials) */
export const WALL_COLORS: Record<number, string> = {
  [WALL_BRICK]:      '#8B4513',
  [WALL_CONCRETE]:   '#808080',
  [WALL_METAL]:      '#5A5A6A',
  [WALL_WOOD]:       '#A0522D',
  [WALL_GLASS]:      '#88BBDD',
  [WALL_DARK_BRICK]: '#4A3020',
  [WALL_VAULT]:      '#3A3A4E',
  [WALL_POLICE]:     '#2A3A5E',
}

// ─── Map preset ──────────────────────────────────────────
export interface MapPreset {
  id: string
  name: string
  description: string
  gridW: number
  gridH: number
  tileSize: number
  /** Which game modes this map supports */
  modes: GameMode[]
}

// ─── Bullet ──────────────────────────────────────────────
export interface Bullet {
  x: number; y: number
  dx: number; dy: number
  life: number; team: number; owner: number; dmg: number
  weapon?: string; splash?: number
}

// ─── Capture Point ───────────────────────────────────────
export interface CapturePoint {
  x: number; y: number
  team: number; progress: number; id: number
  label: string
}

// ─── Vehicle ─────────────────────────────────────────────
export interface Vehicle {
  x: number; y: number
  type: 'tank' | 'jeep' | 'helicopter'
  model: string; alive: boolean
  hp: number; maxHp: number; respawnTimer: number
  rider: number; angle: number; team: number
  spawnX: number; spawnY: number
}

// ─── Pickup ──────────────────────────────────────────────
export interface Pickup {
  x: number; y: number
  type: 'health' | 'ammo' | 'armor'
  alive: boolean; respawnTimer: number; amount: number
}

// ─── Bomb Site (bomb mode) ───────────────────────────────
export interface BombSite {
  x: number; y: number
  label: string        // 'A' | 'B'
  planted: boolean
  plantProgress: number // 0–100
  defuseProgress: number // 0–100
  planter: number       // playerIndex or -1
  defuser: number       // playerIndex or -1
  detonated: boolean
}

// ─── Loot Bag (heist mode) ──────────────────────────────
export interface LootBag {
  x: number; y: number
  id: number
  carrier: number      // playerIndex or -1
  extracted: boolean
  label: string
}

// ─── Flag (CTF mode) ────────────────────────────────────
export interface Flag {
  x: number; y: number
  team: number         // 0 | 1
  carrier: number      // playerIndex or -1
  atBase: boolean
  baseX: number; baseY: number
}

// ─── VIP (escort mode) ──────────────────────────────────
export interface VipTarget {
  soldier: number      // playerIndex of VIP
  extractionX: number; extractionY: number
  extracted: boolean
}

// ─── Convoy Waypoint (convoy mode) ──────────────────────
export interface ConvoyWaypoint {
  x: number; y: number; reached: boolean
}
export interface ConvoyState {
  vehicleIndex: number   // index into vehicles[]
  waypoints: ConvoyWaypoint[]
  currentWaypoint: number
  completed: boolean
}

// ─── Race Checkpoint ─────────────────────────────────────
export interface RaceCheckpoint {
  x: number; y: number; radius: number
}
export interface RaceState {
  checkpoints: RaceCheckpoint[]
  laps: number
  /** Per-soldier progress: soldierIndex → {lap, nextCheckpoint} */
  progress: Map<number, { lap: number; nextCp: number }>
  finished: Map<number, number> // soldierIndex → finish frame
}

// ─── Survival Wave ──────────────────────────────────────
export interface SurvivalState {
  wave: number
  enemiesRemaining: number
  spawnTimer: number
  maxWaves: number
  waveSize: number
}

// ─── Battle Royale ───────────────────────────────────────
export interface BRZone {
  /** Current circle center */
  centerX: number; centerY: number
  /** Current radius in metres */
  radius: number
  /** Target radius this phase is shrinking toward */
  targetRadius: number
  /** Shrink speed (metres per tick) */
  shrinkRate: number
  /** Damage per tick to soldiers outside the zone */
  damagePerTick: number
  /** Current phase (0 = warmup/no-shrink, 1+ = shrinking phases) */
  phase: number
  /** Ticks remaining before next shrink phase starts */
  phaseTimer: number
  /** Target center for current phase (moves randomly) */
  targetCenterX: number; targetCenterY: number
}

export interface SupplyDrop {
  x: number; y: number
  /** Current altitude (descends to 0 = landed) */
  altitude: number
  landed: boolean
  looted: boolean
  /** Weapons & items inside */
  contents: { weapons: string[]; armor: number; bandages: number }
  id: number
}

export interface WeaponPickup {
  x: number; y: number
  weaponName: string
  alive: boolean
  id: number
  /** Glow color for rarity: white=common, green=uncommon, blue=rare, purple=epic, gold=legendary */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export type TrapType = 'mine' | 'spike' | 'bear-trap' | 'c4'
export interface Trap {
  x: number; y: number
  type: TrapType
  armed: boolean
  owner: number  // playerIndex
  damage: number
  id: number
  /** Has this trap been triggered? */
  triggered: boolean
  /** Visible to owner's team only */
  team: number
}

export interface BRState {
  zone: BRZone
  supplyDrops: SupplyDrop[]
  weaponPickups: WeaponPickup[]
  traps: Trap[]
  /** Number of soldiers still alive in BR */
  aliveCount: number
  /** Total soldiers at start */
  totalCount: number
  /** Next supply drop spawn frame */
  nextSupplyDrop: number
  /** Next zone phase frame */
  nextZonePhase: number
  /** Placement order (first eliminated = last place) */
  placements: number[]
}

// ─── Soldier ─────────────────────────────────────────────
export interface Soldier {
  x: number; y: number; angle: number
  /** Vertical look pitch for FPS camera (radians, negative=up) */
  pitch: number
  hp: number; maxHp: number; alive: boolean
  team: number; playerIndex: number; name: string
  input: PlayerSlot['input']; isBot: boolean
  kills: number; deaths: number; captures: number; score: number
  respawnTimer: number; vehicleIndex: number; color: string
  coins: number; gems: number; stars: number
  weaponIndex: number; weapons: string[]
  armor: number; killStreak: number
  isSprinting: boolean
  /** Current body posture: standing / crouching / prone */
  posture: 'stand' | 'crouch' | 'prone'

  // ── Wound / Bleed / Bandage ──────────────────────────
  /** Is the soldier bleeding? */
  bleeding: boolean
  /** HP lost per tick while bleeding (0.3 – 1.2 depending on wound severity) */
  bleedRate: number
  /** Is the soldier currently bandaging? */
  isBandaging: boolean
  /** Bandage progress 0 – 100 (reaches 100 → healed) */
  bandageProgress: number
  /** Number of bandages remaining */
  bandages: number

  // ── Weapon loadout (customization) ───────────────────
  /** Loadout key: weaponName → { slot → attachmentId } */
  loadout: Record<string, Record<string, string>>

  // ── ADS (Aim Down Sights) ────────────────────────────
  /** Is the soldier currently aiming down sights? */
  isAiming: boolean
  /** Current ADS FOV (smoothed, used by renderer) */
  adsFov: number
  /** ADS stamina drain enabled? */
  adsStaminaDrain: boolean

  // ── Aim Assist ───────────────────────────────────────
  /** Aim assist mode: none (KB+M default), semi (gamepad default), full */
  aimAssist: 'none' | 'semi' | 'full'
  /** Current aim assist target (playerIndex or -1) */
  aimAssistTarget: number

  /** Look sensitivity 1-10 (5 = default). Multiplier = sensitivity / 5 */
  sensitivity: number

  /** Is this soldier the VIP? (escort mode) */
  isVip?: boolean
  /** Is this soldier carrying a loot bag? (heist mode) */
  carryingLoot?: number   // lootBag id or undefined
  /** Is this soldier carrying the flag? (ctf mode) */
  carryingFlag?: number   // flag team or undefined

  // ── Battle Royale specific ───────────────────────────
  /** Placement in BR (1 = winner). Set when eliminated. */
  brPlacement?: number
  /** Is this soldier eliminated from BR? (no respawn) */
  brEliminated?: boolean
  /** Camera perspective preference */
  cameraPerspective?: CameraPerspective
}

// ─── Kill Feed ───────────────────────────────────────────
export interface KillFeed { text: string; time: number }

// ─── Building (map generation metadata) ──────────────────
export interface Building extends Rect {
  type: string
  color: string
  label?: string
  model?: string
  /** Which wall tile type to use (defaults to WALL_BRICK) */
  wallType?: number
}

// ─── Prop ────────────────────────────────────────────────
export interface Prop extends Rect {
  type: string; color: string
  model?: string; blocking: boolean
}

// ─── Game State ──────────────────────────────────────────
export interface GameState {
  soldiers: Soldier[]; bullets: Bullet[]
  capturePoints: CapturePoint[]; vehicles: Vehicle[]
  buildings: Building[]; props: Prop[]
  roads: Rect[]; pickups: Pickup[]
  tickets: [number, number]; killFeed: KillFeed[]
  frame: number; gameOver: boolean; winTeam: number
  mode: GameMode; targetKills: number
  /** Tile-based world for 3D rendering & collision */
  tileMap: TileMap
  /** Current map identifier */
  mapName: string

  // ── Mode-specific state ────────────────────────────────
  bombSites?: BombSite[]
  lootBags?: LootBag[]
  lootExtraction?: Vec            // extraction zone for heist
  flags?: Flag[]
  vip?: VipTarget
  convoy?: ConvoyState
  raceState?: RaceState
  survivalState?: SurvivalState
  brState?: BRState
  /** Arcade vs realistic mode modifier */
  modeModifier?: 'arcade' | 'realistic'
  /** Round number for round-based modes (bomb, heist) */
  round?: number
  /** Score per team for round-based modes */
  roundScore?: [number, number]
  /** Max rounds */
  maxRounds?: number
}
