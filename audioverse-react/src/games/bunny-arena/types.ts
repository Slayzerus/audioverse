/**
 * types.ts — Interfaces for BunnyGame 3D platformer.
 *
 * Gameplay is 2.5D side-scroller: X = horizontal, Y = vertical (up),
 * Z axis is frozen (depth). Rendered in Three.js with an orthographic side camera.
 */
import type { PlayerSlot } from '../../pages/games/mini/types'

// ── 2D vector (used in gameplay plane XY) ─────────────────
export interface Vec2 {
  x: number
  y: number
}

// ── Body part (ragdoll segment) ───────────────────────────
export interface BodyPart {
  pos: Vec2
  vel: Vec2
  radius: number
  mass: number
  grounded: boolean
}

// ── Bunny (player character) ──────────────────────────────
export interface Bunny {
  index: number
  name: string
  color: string
  input: PlayerSlot['input']
  alive: boolean
  lives: number
  score: number
  // Multi-body ragdoll
  head: BodyPart
  torso: BodyPart
  pelvis: BodyPart
  // Pose: 0 = crouched (default), 1 = standing (A held)
  pose: number
  poseTarget: number
  // Grab mechanic
  grabbing: boolean
  grabPoint: Vec2 | null
  // Motorcycle
  mounted: boolean
  mountedBikeIndex: number       // index into GameState.bikes, -1 = none
  bikeDir: number                // 1=right, -1=left
  bikeSpeed: number              // current throttle speed
  bikeWheelAngle: number         // visual wheel spin angle
  // Per-frame input
  moveX: number
  actionA: boolean
  actionB: boolean               // dismount / special
  actionLB: boolean
  // Timers
  respawnTimer: number
  deathFlash: number
  // King-of-the-hill score (seconds in zone)
  kingTimer: number
}

// ── Level entities ────────────────────────────────────────
export interface Platform {
  x: number
  y: number
  w: number
  h: number
}

export interface Spike {
  x: number
  y: number
  w: number
  h: number
}

export interface Coin {
  x: number
  y: number
  collected: boolean
}

export interface Bike {
  x: number
  y: number
  w: number
  h: number
  occupied: boolean
  /** Visual tilt angle (radians) for leaning */
  tilt: number
}

export interface Checkpoint {
  x: number
  y: number
  w: number
  h: number
  index: number // ordering
}

export interface KingZone {
  x: number
  y: number
  w: number
  h: number
}

// ── New interactive items ─────────────────────────────────

/** Physics ball — rolls around, can squash bunnies */
export interface PhysicsBall {
  x: number
  y: number
  vx: number
  vy: number
  radius: number   // 8=small, 16=medium, 30=large, 60=huge
  mass: number
  grounded: boolean
}

/** Loose spike — individual spike that slides/falls */
export interface LooseSpike {
  x: number
  y: number
  vx: number
  vy: number
  angle: number    // rotation angle
  w: number
  h: number
}

/** Trap — spring launcher, crusher, or pit */
export interface Trap {
  x: number
  y: number
  w: number
  h: number
  type: 'spring' | 'crusher' | 'pit'
  active: boolean
  timer: number     // countdown or animation timer
  phase: number     // 0-1 animation phase
}

// ── Game state ────────────────────────────────────────
export interface GameState {
  bunnies: Bunny[]
  platforms: Platform[]
  spikes: Spike[]
  bikes: Bike[]
  coins: Coin[]
  checkpoints: Checkpoint[]
  kingZone: KingZone | null
  // New items
  balls: PhysicsBall[]
  looseSpikes: LooseSpike[]
  traps: Trap[]
  mode: string
  gravity: number
  frame: number
  gameOver: boolean
  winner: number
  countdown: number
  /** AI difficulty: 0=easy, 1=normal, 2=hard, 3=expert */
  aiDifficulty: number
}
