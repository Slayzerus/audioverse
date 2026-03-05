/**
 * constants.ts — All constants for Menace 3D (Post-Apocalyptic GTA2).
 */
import type { WeaponInfo, WeaponType } from './types'

// ── World ─────────────────────────────────────────────────
export const BLOCK_SIZE = 120       // city block dimension
export const ROAD_WIDTH = 40        // road width
export const SIDEWALK_WIDTH = 6
export const CITY_SIZES: Record<string, number> = {
  small: 1600, medium: 2400, large: 3200,
}

// ── Tick ──────────────────────────────────────────────────
export const DT = 1 / 60

// ── Player on foot ────────────────────────────────────────
export const PLAYER_RADIUS = 6
export const PLAYER_SPEED = 120
export const PLAYER_SPRINT_MULT = 1.6
export const PLAYER_HP = 100
export const PLAYER_ARMOR_MAX = 100

// ── Vehicles ──────────────────────────────────────────────
export const VEHICLE_FRICTION = 0.97
export const VEHICLE_DEFS = {
  car:        { w: 10, l: 18, maxSpeed: 200, accel: 180, steer: 2.8, mass: 1200, hp: 150 },
  truck:      { w: 14, l: 26, maxSpeed: 140, accel: 100, steer: 1.8, mass: 3000, hp: 300 },
  bike:       { w: 5,  l: 12, maxSpeed: 240, accel: 250, steer: 3.5, mass: 300,  hp: 60  },
  tank:       { w: 16, l: 24, maxSpeed: 80,  accel: 60,  steer: 1.2, mass: 8000, hp: 800 },
  helicopter: { w: 14, l: 20, maxSpeed: 180, accel: 120, steer: 3.0, mass: 2000, hp: 200 },
  boat:       { w: 12, l: 22, maxSpeed: 120, accel: 80,  steer: 2.0, mass: 1500, hp: 180 },
} as const

export const HELI_LIFT_SPEED = 40
export const HELI_MAX_ALT = 60

// ── Weapons ───────────────────────────────────────────────
export const WEAPON_INFO: Record<WeaponType, WeaponInfo> = {
  pistol:       { type: 'pistol',       color: '#ccc',    fireRate: 350, damage: 18, range: 250, spread: 0.03, projectiles: 1, explosive: false, speed: 500 },
  shotgun:      { type: 'shotgun',      color: '#b87333', fireRate: 700, damage: 12, range: 140, spread: 0.18, projectiles: 6, explosive: false, speed: 450 },
  machinegun:   { type: 'machinegun',   color: '#f39c12', fireRate: 80,  damage: 9,  range: 300, spread: 0.06, projectiles: 1, explosive: false, speed: 550 },
  rocket:       { type: 'rocket',       color: '#e74c3c', fireRate: 900, damage: 90, range: 400, spread: 0.01, projectiles: 1, explosive: true,  speed: 300 },
  flamethrower: { type: 'flamethrower', color: '#ff6600', fireRate: 50,  damage: 5,  range: 80,  spread: 0.25, projectiles: 3, explosive: false, speed: 200 },
}

export const WEAPON_AMMO: Record<WeaponType, number> = {
  pistol: 24,
  shotgun: 12,
  machinegun: 60,
  rocket: 4,
  flamethrower: 100,
}

// ── Bullets ───────────────────────────────────────────────
export const BULLET_LIFETIME = 120

// ── Explosions ────────────────────────────────────────────
export const EXPLOSION_RADIUS = 40
export const EXPLOSION_DURATION = 30

// ── NPCs ──────────────────────────────────────────────────
export const NPC_SPEED = 30
export const NPC_FLEE_SPEED = 90
export const NPC_HP = 20
export const NPC_SPAWN_MAX = 40

// ── Police ────────────────────────────────────────────────
export const POLICE_SPEED = 140
export const POLICE_SHOOT_RANGE = 150
export const POLICE_SHOOT_RATE = 600  // ms
export const POLICE_HP = 50
export const MAX_WANTED = 5
export const WANTED_DECAY_TIME = 600  // frames

// ── Missions ──────────────────────────────────────────────
export const MISSION_TIMER_DEFAULT = 120

// ── Scoring ───────────────────────────────────────────────
export const SCORE_NPC_KILL = 5
export const SCORE_PLAYER_KILL = 100
export const SCORE_VEHICLE_DESTROY = 25
export const LEVEL_UP_STARS = 50

// ── Camera ────────────────────────────────────────────────
export const CAMERA_HEIGHT = 280   // Three.js camera Y for top-down
export const CAMERA_ANGLE = 0.92   // slight angle (not perfectly top-down, ~53°)
export const CAMERA_ZOOM_30 = 0.7  // 30% closer = 1/0.7 zoom factor

// ── Day/Night ─────────────────────────────────────────────
export const DAY_CYCLE_SPEED = 0.00004   // frames per cycle unit
export const NIGHT_AMBIENT = 0.15
export const DAY_AMBIENT = 0.85

// ── Colors (post-apo palette) ─────────────────────────────
export const GROUND_COLOR = '#4a3d2e'
export const ROAD_COLOR = '#3a3a3a'
export const ROAD_LINE_COLOR = '#5a5a3a'
export const SIDEWALK_COLOR = '#6b6152'
export const WATER_COLOR = '#2a5a4a'
export const PARK_COLOR = '#3a5a2e'
export const SKY_COLOR = '#1a1510'

export const BUILDING_COLORS = [
  '#5a5048', '#6b5d52', '#4a4640', '#7a6a5a', '#5c5248',
  '#685c50', '#756858', '#4e4a42', '#635850', '#8a7a68',
]

export const VEHICLE_COLORS = [
  '#8b4513', '#a52a2a', '#6b8e23', '#4682b4', '#daa520',
  '#cd853f', '#556b2f', '#708090', '#b8860b', '#d2691e',
]
