/**
 * Constants & weapon definitions for AtomicPostApo
 */
import type { Weapon } from './types'

// ─── Screen / World ──────────────────────────────────────
export const VIEWPORT_W = 1024
export const VIEWPORT_H = 768

export const MAP_SIZES: Record<string, { w: number; h: number }> = {
  small:  { w: 80, h: 60 },     // in world units (1 unit ≈ 1 meter)
  medium: { w: 120, h: 90 },
  large:  { w: 160, h: 120 },
}

// ─── Isometric camera ───────────────────────────────────
export const ISO_ANGLE = Math.PI / 4       // 45° horizontal rotation
export const ISO_TILT  = Math.atan(1 / Math.sqrt(2)) // ~35.26° true iso tilt
export const CAMERA_ZOOM = 18              // orthographic frustum half-size
export const CAMERA_FOLLOW_SPEED = 0.08    // lerp speed

// ─── Gameplay ────────────────────────────────────────────
export const PLAYER_R = 0.4
export const PLAYER_SPEED = 4.0            // units/sec
export const SPRINT_SPEED = 6.5
export const BULLET_R = 0.1
export const INTERACT_RANGE = 2.0
export const RAD_DPS = 8
export const VATS_DURATION = 3000
export const VATS_CD = 15000
export const AREAS_TO_WIN = 3
export const TICK_MS = 16                  // ~60fps fixed step

// ─── Weapons ─────────────────────────────────────────────
export const WEAPONS: Weapon[] = [
  { name: '10mm Pistol',  damage: 12, fireRate: 350, range: 1200, bulletSpeed: 18, spread: 0.04, ammoPerShot: 1, projectiles: 1 },
  { name: 'Pipe Rifle',   damage: 18, fireRate: 600, range: 1800, bulletSpeed: 22, spread: 0.02, ammoPerShot: 1, projectiles: 1 },
  { name: 'Shotgun',      damage: 8,  fireRate: 800, range: 600,  bulletSpeed: 16, spread: 0.15, ammoPerShot: 2, projectiles: 5 },
  { name: 'Laser Rifle',  damage: 15, fireRate: 250, range: 2000, bulletSpeed: 30, spread: 0.01, ammoPerShot: 1, projectiles: 1 },
  { name: 'SMG',          damage: 8,  fireRate: 100, range: 1000, bulletSpeed: 20, spread: 0.08, ammoPerShot: 1, projectiles: 1 },
  { name: 'Sniper',       damage: 45, fireRate: 1200,range: 3000, bulletSpeed: 35, spread: 0.005,ammoPerShot: 1, projectiles: 1 },
  { name: 'Minigun',      damage: 6,  fireRate: 60,  range: 900,  bulletSpeed: 24, spread: 0.12, ammoPerShot: 1, projectiles: 1 },
  { name: 'Fat Man',      damage: 80, fireRate: 3000,range: 1500, bulletSpeed: 10, spread: 0.0,  ammoPerShot: 5, projectiles: 1 },
]

// ─── Enemy stats by kind ─────────────────────────────────
export const ENEMY_STATS: Record<string, { hp: number; speed: number; damage: number; alertRange: number; attackCd: number }> = {
  mutant:      { hp: 50,  speed: 1.5,  damage: 8,   alertRange: 12,  attackCd: 1500 },
  raider:      { hp: 35,  speed: 2.5,  damage: 10,  alertRange: 18,  attackCd: 800  },
  deathclaw:   { hp: 200, speed: 3.5,  damage: 30,  alertRange: 20,  attackCd: 1200 },
  feral_dog:   { hp: 20,  speed: 4.0,  damage: 6,   alertRange: 15,  attackCd: 600  },
  radscorpion: { hp: 80,  speed: 2.0,  damage: 15,  alertRange: 10,  attackCd: 2000 },
}

// ─── Difficulty multipliers ──────────────────────────────
export const DIFFICULTY: Record<string, { hpMul: number; dmgMul: number; countMul: number }> = {
  easy:   { hpMul: 0.7, dmgMul: 0.6, countMul: 0.7 },
  normal: { hpMul: 1.0, dmgMul: 1.0, countMul: 1.0 },
  hard:   { hpMul: 1.5, dmgMul: 1.4, countMul: 1.3 },
}
