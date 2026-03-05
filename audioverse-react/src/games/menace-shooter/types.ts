/**
 * types.ts — All interfaces for Menace 3D (Post-Apocalyptic GTA2).
 *
 * Top-down 3D open-world action game with vehicles, weapons, NPCs,
 * police, missions, and procedural city generation.
 */

// ── Vector ────────────────────────────────────────────────
export interface Vec2 { x: number; y: number }
export interface Vec3 { x: number; y: number; z: number }

// ── Weapons ───────────────────────────────────────────────
export type WeaponType = 'pistol' | 'shotgun' | 'machinegun' | 'rocket' | 'flamethrower'

export interface WeaponInfo {
  type: WeaponType
  color: string
  fireRate: number   // ms between shots
  damage: number
  range: number
  spread: number     // radians of inaccuracy
  projectiles: number // shotgun fires multiple
  explosive: boolean
  speed: number      // bullet speed
}

export interface Weapon {
  type: WeaponType
  ammo: number
}

// ── Vehicles ──────────────────────────────────────────────
export type VehicleKind = 'car' | 'truck' | 'bike' | 'tank' | 'helicopter' | 'boat'

export interface Vehicle {
  x: number; y: number; z: number
  angle: number
  speed: number
  hp: number; maxHp: number
  kind: VehicleKind
  color: string
  driver: number | null  // player pIndex or null
  width: number; length: number
  maxSpeed: number
  accel: number
  steerRate: number
  mass: number
  // Helicopter-specific
  altitude: number        // 0 = ground, >0 = flying
  targetAltitude: number
  // Boat-specific
  inWater: boolean
}

// ── Bullets & Explosions ──────────────────────────────────
export interface Bullet {
  x: number; y: number; z: number
  dx: number; dy: number
  owner: number
  damage: number
  life: number
  weaponType: WeaponType
}

export interface Explosion {
  x: number; y: number; z: number
  radius: number
  timer: number
  maxTimer: number
  damage: number
}

// ── NPCs ──────────────────────────────────────────────────
export type NPCState = 'wander' | 'flee' | 'idle'

export interface NPC {
  x: number; y: number
  angle: number
  dx: number; dy: number
  timer: number
  hp: number
  state: NPCState
  modelVariant: number
}

// ── Police / Raiders ──────────────────────────────────────
export type PoliceType = 'foot' | 'car' | 'swat'

export interface Police {
  x: number; y: number
  angle: number
  speed: number
  target: number
  hp: number
  type: PoliceType
  shootTimer: number
  vehicleIndex: number | null
}

// ── Pickups ───────────────────────────────────────────────
export type PickupKind = 'pistol' | 'shotgun' | 'machinegun' | 'rocket' | 'flamethrower'
  | 'health' | 'armor' | 'speed' | 'coins' | 'gems'

export interface Pickup {
  x: number; y: number
  kind: PickupKind
  respawnTimer: number
  collected: boolean
}

// ── Missions ──────────────────────────────────────────────
export type MissionType = 'destroy' | 'deliver' | 'steal' | 'assassinate' | 'survive' | 'race'

export interface Mission {
  id: number
  x: number; y: number
  targetX: number; targetY: number
  type: MissionType
  desc: string
  active: boolean
  assignedTo: number | null
  reward: { coins: number; gems: number; starPts: number }
  timeLimit: number  // 0 = no limit
  timer: number
}

// ── Buildings ─────────────────────────────────────────────
export type BuildingType = 'residential' | 'commercial' | 'industrial' | 'ruin'
  | 'gasstation' | 'pharmacy' | 'bunker' | 'warehouse'

export interface Building {
  x: number; y: number
  w: number; h: number
  height: number       // 3D height for visual
  floors: number
  type: BuildingType
  color: string
  destroyed: boolean
  hp: number
}

// ── Road segments ─────────────────────────────────────────
export interface RoadSegment {
  x: number; y: number
  w: number; h: number
  horizontal: boolean
}

// ── Water zones ───────────────────────────────────────────
export interface WaterZone {
  x: number; y: number
  w: number; h: number
}

// ── Parks / open areas ────────────────────────────────────
export interface Park {
  x: number; y: number
  w: number; h: number
}

// ── Props (decorative) ───────────────────────────────────
export type PropType = 'barrel' | 'tire' | 'rubble' | 'dumpster' | 'burning_barrel'
  | 'barricade' | 'electric_pole' | 'tree' | 'bush' | 'campfire'
  | 'spike' | 'car_wreck' | 'crate'

export interface Prop {
  x: number; y: number
  angle: number
  type: PropType
  destructible: boolean
  hp: number
}

// ── Player ────────────────────────────────────────────────
export interface Player {
  x: number; y: number; z: number
  angle: number
  hp: number; maxHp: number
  armor: number
  alive: boolean
  inVehicle: number | null  // index into vehicles[]
  weapon: Weapon | null
  lastShot: number
  score: number; kills: number
  wanted: number; wantedTimer: number
  coins: number; gems: number; starPts: number; level: number
  color: string; name: string; pIndex: number
  input: { type: string; group?: number; padIndex?: number }
  comboTimer: number; comboCount: number
  respawnTimer: number
  speedBoost: number  // frames remaining
  moveSpeed: number
}

// ── Level data (procedural output) ────────────────────────
export interface LevelData {
  worldW: number
  worldH: number
  buildings: Building[]
  roads: RoadSegment[]
  parks: Park[]
  waterZones: WaterZone[]
  props: Prop[]
  spawnPoints: Vec2[]
  vehicleSpawns: Vec2[]
  pickupSpawns: Vec2[]
}

// ── Game state ────────────────────────────────────────────
export interface GameState {
  players: Player[]
  vehicles: Vehicle[]
  npcs: NPC[]
  bullets: Bullet[]
  explosions: Explosion[]
  pickups: Pickup[]
  police: Police[]
  missions: Mission[]
  level: LevelData
  mode: string
  timer: number        // countdown for timed modes
  frame: number
  gameOver: boolean
  winner: string | null
  dayNightCycle: number  // 0..1 (0 = noon, 0.5 = midnight)
  weatherIntensity: number // 0..1 (rain/dust)
}
