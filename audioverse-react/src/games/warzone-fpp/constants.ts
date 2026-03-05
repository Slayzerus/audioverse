/**
 * Game constants, 3D settings, and weapon definitions for Warzone FPP.
 */

// ─── Display ──────────────────────────────────────────────
export const SCREEN_W = 1024
export const SCREEN_H = 768

// ─── 3D World ─────────────────────────────────────────────
export const TILE_SIZE    = 3          // metres per tile
export const WALL_HEIGHT  = 4          // wall height in metres
export const PLAYER_HEIGHT = 1.7       // camera eye height in metres
export const PLAYER_RADIUS = 0.4       // collision radius in metres

// ─── Camera ───────────────────────────────────────────────
export const FOV          = 75         // field of view in degrees
export const CAMERA_NEAR  = 0.1
export const CAMERA_FAR   = 500
export const MOUSE_SENS   = 0.002      // mouse sensitivity (radians/pixel)

// ─── Movement (metres per tick) ───────────────────────────
export const MOVE_SPD     = 0.18
export const SPRINT_SPD   = 0.32

// ─── Crouch / Prone ─────────────────────────────────────-
export const CROUCH_HEIGHT = 1.1      // eye height when crouched
export const PRONE_HEIGHT  = 0.45     // eye height when prone
export const CROUCH_SPD    = 0.11     // movement speed when crouched
export const PRONE_SPD     = 0.06     // movement speed when prone
export const CROUCH_RECOIL = 0.7      // recoil multiplier when crouched
export const PRONE_RECOIL  = 0.5      // recoil multiplier when prone
export const CROUCH_HITBOX = 0.7      // hitbox multiplier when crouched
export const PRONE_HITBOX  = 0.45     // hitbox multiplier when prone

// ── Wound / Bleed / Bandage ──────────────────────────
export const BLEED_CHANCE     = 0.35    // chance to start bleeding per hit
export const BLEED_RATE_MIN   = 0.3     // min HP/tick bleed
export const BLEED_RATE_MAX   = 1.2     // max HP/tick bleed (severe wound)
export const BANDAGE_TIME     = 90      // ticks to fully bandage (~3 sec)
export const BANDAGE_HEAL     = 20      // HP restored when bandage completes
export const BANDAGES_START   = 3       // bandages per spawn
export const BLEED_MOVE_PENALTY = 0.6   // movement speed multiplier while bleeding

// ─── Mode modifiers ─────────────────────────────────────-
export const MODE_MODIFIERS = {
  realistic: {
    hp: 100,
    armor: 50,
    bulletDmg: 1.0,
    bulletSpeed: 1.0,
    respawn: 90,
  },
  arcade: {
    hp: 180,
    armor: 90,
    bulletDmg: 0.55,
    bulletSpeed: 0.7,
    respawn: 140,
  },
}

// ─── Combat ───────────────────────────────────────────────
export const BULLET_R     = 0.1
export const PLAYER_R     = 0.4         // hit radius
export const SOLDIER_HP   = 100
export const SOLDIER_ARMOR = 50

// ─── Timing (in ticks, ~33 ms each) ──────────────────────
export const TICK_MS               = 33
export const RESPAWN_TIME          = 90       // ~3 s
export const CAPTURE_TIME          = 210      // ~7 s
export const VEHICLE_RESPAWN       = 300      // ~10 s
export const TICKET_BLEED_INTERVAL = 150      // ~5 s
export const PICKUP_RESPAWN        = 600      // ~20 s

// ─── Capture ──────────────────────────────────────────────
export const CAPTURE_R = 8            // capture radius in metres

// ─── Vehicles (metres per tick) ───────────────────────────
export const TANK_SPD = 0.14
export const JEEP_SPD = 0.24
export const HELI_SPD = 0.28

// ─── Weapon definitions ──────────────────────────────────
export interface WeaponDef {
  name: string
  dmg: number
  range: number         // metres
  fireRate: number      // ticks between shots
  bulletSpeed: number   // metres per tick
  lifetime: number      // ticks before bullet disappears
  spread?: number       // radians
  pellets?: number
  splash?: number       // splash radius in metres
  model?: string
}

export const WEAPONS: WeaponDef[] = [
  { name: 'Rifle',           dmg: 22,  range: 120,  fireRate: 5,  bulletSpeed: 2.4,  lifetime: 50,  model: 'SK_Wep_RifleSwat_01.fbx' },
  { name: 'SMG',             dmg: 14,  range: 80,   fireRate: 3,  bulletSpeed: 2.0,  lifetime: 40,  model: 'SK_Wep_SMG_01.fbx' },
  { name: 'Shotgun',         dmg: 28,  range: 12,   fireRate: 18, bulletSpeed: 1.8,  lifetime: 7,   spread: 0.12, pellets: 6, model: 'SK_Wep_Shotgun_01.fbx' },
  { name: 'Sniper',          dmg: 85,  range: 250,  fireRate: 40, bulletSpeed: 4.0,  lifetime: 65,  model: 'SK_Wep_SniperSwat_01.fbx' },
  { name: 'Rocket Launcher', dmg: 110, range: 60,   fireRate: 60, bulletSpeed: 1.0,  lifetime: 60,  splash: 5 },
  { name: 'Grenade',         dmg: 70,  range: 40,   fireRate: 45, bulletSpeed: 0.8,  lifetime: 50,  splash: 4, model: 'SK_Wep_Grenade_Base_01.fbx' },
  { name: 'Pistol',          dmg: 18,  range: 70,   fireRate: 7,  bulletSpeed: 1.8,  lifetime: 40,  model: 'SK_Wep_PistolSwat_01.fbx' },
  { name: 'Bandit Pistol',   dmg: 16,  range: 55,   fireRate: 5,  bulletSpeed: 1.6,  lifetime: 35,  model: 'SK_Wep_PistolBandit_01.fbx' },
  { name: 'Bandit Rifle',    dmg: 20,  range: 90,   fireRate: 5,  bulletSpeed: 2.0,  lifetime: 45,  model: 'SK_Wep_RifleBandit_01.fbx' },
  { name: 'Flashbang',       dmg: 5,   range: 25,   fireRate: 50, bulletSpeed: 0.8,  lifetime: 30,  splash: 6, model: 'SK_Wep_Flashbang_Base_01.fbx' },
]

export const TANK_CANNON: WeaponDef = {
  name: 'Tank Cannon', dmg: 150, range: 90, fireRate: 45, bulletSpeed: 1.6, lifetime: 60, splash: 6,
}

// ─── Battle Royale Constants ─────────────────────────────
export const BR_ZONE_PHASES = [
  { waitTicks: 600,  targetRadiusPct: 0.75, shrinkRate: 0.03, damage: 0.5  },  // Phase 1: gentle
  { waitTicks: 500,  targetRadiusPct: 0.50, shrinkRate: 0.05, damage: 1.0  },  // Phase 2
  { waitTicks: 400,  targetRadiusPct: 0.30, shrinkRate: 0.07, damage: 2.0  },  // Phase 3
  { waitTicks: 300,  targetRadiusPct: 0.15, shrinkRate: 0.10, damage: 3.0  },  // Phase 4
  { waitTicks: 200,  targetRadiusPct: 0.05, shrinkRate: 0.15, damage: 5.0  },  // Phase 5: lethal
  { waitTicks: 120,  targetRadiusPct: 0.0,  shrinkRate: 0.20, damage: 10.0 },  // Phase 6: final
]

export const BR_SUPPLY_DROP_INTERVAL = 450    // ~15 seconds between drops
export const BR_SUPPLY_DROP_FALL_SPEED = 0.12 // metres per tick descent
export const BR_MAX_SUPPLY_DROPS = 8

export const BR_WEAPON_PICKUP_COUNT = 40      // scattered weapons on map
export const BR_TRAP_COUNT = 12               // pre-placed traps

export const BR_MINE_DAMAGE = 60
export const BR_SPIKE_DAMAGE = 35
export const BR_BEAR_TRAP_DAMAGE = 25         // + slow
export const BR_C4_DAMAGE = 90
export const BR_TRAP_TRIGGER_RADIUS = 2.5

export const BR_STARTING_WEAPONS = ['Pistol'] // Everyone starts with just a pistol
export const BR_SUPPLY_WEAPONS = ['Sniper', 'Rocket Launcher', 'Rifle']  // High-tier drops

export const BR_WEAPON_RARITIES: Record<string, 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = {
  'Pistol': 'common',
  'Bandit Pistol': 'common',
  'SMG': 'uncommon',
  'Bandit Rifle': 'uncommon',
  'Shotgun': 'uncommon',
  'Rifle': 'rare',
  'Sniper': 'epic',
  'Rocket Launcher': 'epic',
  'Grenade': 'rare',
  'Flashbang': 'uncommon',
}

// TPP camera
export const TPP_DISTANCE = 5       // distance behind player
export const TPP_HEIGHT = 2.5       // height above player
export const TPP_LERP = 0.12        // smooth follow factor
