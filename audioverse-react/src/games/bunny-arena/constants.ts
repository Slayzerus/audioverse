/**
 * constants.ts — Physics and dimension constants for BunnyGame.
 *
 * World coordinate system:
 *   X = horizontal (right positive)
 *   Y = vertical (up positive in Three.js, but gameplay uses screen-Y where down is positive)
 *   Z = depth (frozen at 0)
 *
 * Gameplay uses screen coordinates (Y down) internally; the scene sync
 * layer flips Y when positioning Three.js meshes (scene Y = WORLD_H - gameY).
 */

// ── World / viewport ──────────────────────────────────────
/** Logical world width in game units */
export const WORLD_W = 960
/** Logical world height in game units (screen-space, 0 = top) */
export const WORLD_H = 600

// ── Time step ─────────────────────────────────────────────
export const DT = 1 / 60

// ── Physics ───────────────────────────────────────────────
export const GRAVITY_BASE = 600       // units/s²
export const MOVE_TORQUE = 400        // rolling force
export const JUMP_IMPULSE = -350      // upward velocity (negative = up in screen coords)
export const KICK_IMPULSE = -200      // in-air kick
export const GRAB_BREAK_VEL = 300     // velocity that breaks a grab
export const HEAD_DEATH_VEL = 250     // head speed threshold for death
export const BODY_DEATH_VEL = 400     // body speed threshold for death
export const FRICTION = 0.92
export const AIR_FRICTION = 0.98
export const BOUNCE = 0.3

// ── Body dimensions ───────────────────────────────────────
export const BODY_RADIUS = 14
export const HEAD_RADIUS = 10
export const LEG_LEN = 20
export const ARM_LEN = 16
export const CMD_R = BODY_RADIUS      // alias

// ── Level geometry ────────────────────────────────────────
export const FLOOR_Y = WORLD_H - 40   // Y of the main floor surface (screen coords)
export const SPIKE_W = 16
export const SPIKE_H = 20

// ── Motorcycle ────────────────────────────────────────────
export const BIKE_MAX_SPEED = 350     // max horizontal speed on bike
export const BIKE_ACCEL = 500         // acceleration per second
export const BIKE_BRAKE = 800         // braking deceleration per second
export const BIKE_MOUNT_RANGE = 30    // proximity to mount/dismount
export const BIKE_TILT_SPEED = 3      // tilt interpolation speed

// ── Physics balls ─────────────────────────────────────────
export const BALL_BOUNCE = 0.6
export const BALL_FRICTION = 0.97
export const BALL_KILL_SPEED = 100    // speed at which ball can squash a bunny

// ── Traps ─────────────────────────────────────────────────
export const SPRING_FORCE = -500      // upward launch velocity
export const CRUSHER_SPEED = 4        // crusher animation speed multiplier
export const TRAP_CYCLE = 180         // frames per trap cycle (3 seconds)

// ── Camera ────────────────────────────────────────────────
/** Orthographic camera frustum half-height (world units) */
export const CAMERA_HALF_H = WORLD_H / 2
