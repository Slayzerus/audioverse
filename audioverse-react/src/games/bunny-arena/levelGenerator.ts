/**
 * levelGenerator.ts — Level layout + Three.js mesh creation for BunnyGame.
 *
 * Creates platforms, spikes, coins, bikes, balls, loose spikes, traps as
 * game-state objects AND the corresponding Three.js meshes added to the scene.
 *
 * Three.js coordinate convention:
 *   mesh.position.x = gameX
 *   mesh.position.y = WORLD_H - gameY   (flip Y)
 *   mesh.position.z = 0                  (frozen depth, small offsets for layering)
 */
import * as THREE from 'three'
import type { Platform, Spike, Coin, Bike, Checkpoint, KingZone, PhysicsBall, LooseSpike, Trap } from './types'
import { WORLD_W, WORLD_H, FLOOR_Y, SPIKE_W, SPIKE_H } from './constants'

export interface LevelData {
  platforms: Platform[]
  spikes: Spike[]
  coins: Coin[]
  bikes: Bike[]
  checkpoints: Checkpoint[]
  kingZone: KingZone | null
  balls: PhysicsBall[]
  looseSpikes: LooseSpike[]
  traps: Trap[]
}

export interface LevelMeshes {
  platformMeshes: THREE.Mesh[]
  spikeMeshes: THREE.Mesh[]
  coinMeshes: THREE.Mesh[]
  bikeMeshes: THREE.Group[]
  checkpointMeshes: THREE.Mesh[]
  kingZoneMesh: THREE.Mesh | null
  ballMeshes: THREE.Mesh[]
  looseSpikeMeshes: THREE.Mesh[]
  trapMeshes: THREE.Group[]
}

/** Convert screen-Y to Three.js Y */
function flipY(screenY: number): number {
  return WORLD_H - screenY
}

/** No-items defaults for simpler map authors */
const EMPTY = { balls: [] as PhysicsBall[], looseSpikes: [] as LooseSpike[], traps: [] as Trap[] }

// ── Arena maps ────────────────────────────────────────────

function arenaMap1(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 100, y: FLOOR_Y - 100, w: 160, h: 16 },
    { x: WORLD_W - 260, y: FLOOR_Y - 100, w: 160, h: 16 },
    { x: WORLD_W / 2 - 80, y: FLOOR_Y - 180, w: 160, h: 16 },
    { x: 60, y: FLOOR_Y - 260, w: 120, h: 16 },
    { x: WORLD_W - 180, y: FLOOR_Y - 260, w: 120, h: 16 },
  ]
  const spikes: Spike[] = []
  for (let i = 0; i < 5; i++) {
    spikes.push({ x: i * SPIKE_W, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
    spikes.push({ x: WORLD_W - (i + 1) * SPIKE_W, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
  }
  // Add a medium ball on center platform
  const balls: PhysicsBall[] = [
    { x: WORLD_W / 2, y: FLOOR_Y - 210, vx: 0, vy: 0, radius: 16, mass: 3, grounded: false },
  ]
  return { platforms, spikes, coins: [], bikes: [], checkpoints: [], kingZone: null, balls, looseSpikes: [], traps: [] }
}

function arenaMap2(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: 180, h: 40 },
    { x: WORLD_W - 180, y: FLOOR_Y, w: 180, h: 40 },
    { x: 340, y: FLOOR_Y - 60, w: 280, h: 14 },
    { x: 200, y: FLOOR_Y - 160, w: 120, h: 14 },
    { x: WORLD_W - 320, y: FLOOR_Y - 160, w: 120, h: 14 },
    { x: WORLD_W / 2 - 60, y: FLOOR_Y - 260, w: 120, h: 14 },
  ]
  const spikes: Spike[] = []
  for (let i = 0; i < 10; i++) {
    spikes.push({ x: 180 + i * SPIKE_W, y: FLOOR_Y - SPIKE_H + 30, w: SPIKE_W, h: SPIKE_H })
  }
  for (let i = 0; i < 10; i++) {
    spikes.push({ x: WORLD_W - 180 - (i + 1) * SPIKE_W, y: FLOOR_Y - SPIKE_H + 30, w: SPIKE_W, h: SPIKE_H })
  }
  // Loose spikes falling from above
  const looseSpikes: LooseSpike[] = [
    { x: WORLD_W / 2 - 20, y: 60, vx: 30, vy: 0, angle: 0, w: SPIKE_W, h: SPIKE_H },
    { x: WORLD_W / 2 + 10, y: 40, vx: -20, vy: 0, angle: 0.5, w: SPIKE_W, h: SPIKE_H },
  ]
  return { platforms, spikes, coins: [], bikes: [], checkpoints: [], kingZone: null, balls: [], looseSpikes, traps: [] }
}

function arenaMap3(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 100, y: FLOOR_Y - 80, w: 200, h: 14 },
    { x: WORLD_W - 300, y: FLOOR_Y - 80, w: 200, h: 14 },
    { x: 260, y: FLOOR_Y - 160, w: 180, h: 14 },
    { x: WORLD_W / 2 - 140, y: FLOOR_Y - 160, w: 280, h: 14 },
    { x: 180, y: FLOOR_Y - 250, w: 140, h: 14 },
    { x: WORLD_W - 320, y: FLOOR_Y - 250, w: 140, h: 14 },
    { x: WORLD_W / 2 - 70, y: FLOOR_Y - 340, w: 140, h: 14 },
    { x: WORLD_W / 2 - 40, y: FLOOR_Y - 420, w: 80, h: 14 },
  ]
  const spikes: Spike[] = []
  for (let i = 0; i < 3; i++) {
    spikes.push({ x: i * SPIKE_W, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
    spikes.push({ x: WORLD_W - (i + 1) * SPIKE_W, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
  }
  // Spring trap at bottom, huge ball at top
  const traps: Trap[] = [
    { x: WORLD_W / 2 - 30, y: FLOOR_Y - 20, w: 60, h: 20, type: 'spring', active: false, timer: 0, phase: 0 },
  ]
  const balls: PhysicsBall[] = [
    { x: WORLD_W / 2, y: FLOOR_Y - 440, vx: 0, vy: 0, radius: 30, mass: 8, grounded: false },
  ]
  return { platforms, spikes, coins: [], bikes: [], checkpoints: [], kingZone: null, balls, looseSpikes: [], traps }
}

// ── Puzzle maps ───────────────────────────────────────────

function puzzleMap1(): LevelData {
  const platforms: Platform[] = [{ x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 }]
  const spikes: Spike[] = []
  const coins: Coin[] = []
  for (let i = 0; i < 8; i++) {
    const px = 80 + i * 110
    const py = FLOOR_Y - 60 - (i % 3) * 60
    platforms.push({ x: px, y: py, w: 80, h: 14 })
    if (i % 2 === 0) spikes.push({ x: px + 30, y: py - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
    coins.push({ x: px + 40, y: py - 30, collected: false })
  }
  platforms.push({ x: WORLD_W - 120, y: FLOOR_Y - 300, w: 100, h: 16 })
  coins.push({ x: WORLD_W - 70, y: FLOOR_Y - 330, collected: false })
  // Small balls as obstacles
  const balls: PhysicsBall[] = [
    { x: 300, y: FLOOR_Y - 30, vx: 60, vy: 0, radius: 8, mass: 1, grounded: false },
    { x: 600, y: FLOOR_Y - 30, vx: -40, vy: 0, radius: 8, mass: 1, grounded: false },
  ]
  return { platforms, spikes, coins, bikes: [], checkpoints: [], kingZone: null, balls, looseSpikes: [], traps: [] }
}

function puzzleMap2(): LevelData {
  const platforms: Platform[] = [{ x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 }]
  const spikes: Spike[] = []
  const coins: Coin[] = []
  for (let i = 0; i < 6; i++) {
    const isLeft = i % 2 === 0
    const px = isLeft ? 60 + (i % 3) * 30 : WORLD_W - 200 - (i % 3) * 30
    const py = FLOOR_Y - 80 - i * 70
    platforms.push({ x: px, y: py, w: 140, h: 14 })
    coins.push({ x: px + 70, y: py - 28, collected: false })
    if (i > 0 && i < 5) {
      const sx = isLeft ? px + 150 : px - SPIKE_W - 10
      spikes.push({ x: sx, y: py + 10, w: SPIKE_W, h: SPIKE_H })
    }
  }
  platforms.push({ x: WORLD_W / 2 - 50, y: FLOOR_Y - 490, w: 100, h: 14 })
  coins.push({ x: WORLD_W / 2, y: FLOOR_Y - 518, collected: false })
  // Crusher trap guarding top coin
  const traps: Trap[] = [
    { x: WORLD_W / 2 - 30, y: FLOOR_Y - 490 - 50, w: 60, h: 40, type: 'crusher', active: false, timer: 0, phase: 0 },
  ]
  return { platforms, spikes, coins, bikes: [], checkpoints: [], kingZone: null, balls: [], looseSpikes: [], traps }
}

function puzzleMap3(): LevelData {
  const platforms: Platform[] = [{ x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 }]
  const spikes: Spike[] = []
  const coins: Coin[] = []
  for (let i = 0; i < 5; i++) {
    const px = 40 + i * 180
    platforms.push({ x: px, y: FLOOR_Y - 70, w: 100, h: 12 })
    coins.push({ x: px + 50, y: FLOOR_Y - 95, collected: false })
    if (i < 4) {
      spikes.push({ x: px + 110, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
      spikes.push({ x: px + 130, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
    }
  }
  for (let i = 0; i < 4; i++) {
    const px = 120 + i * 200
    platforms.push({ x: px, y: FLOOR_Y - 190, w: 110, h: 12 })
    coins.push({ x: px + 55, y: FLOOR_Y - 216, collected: false })
    if (i % 2 === 0) spikes.push({ x: px + 45, y: FLOOR_Y - 190 - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
  }
  platforms.push({ x: WORLD_W / 2 - 40, y: FLOOR_Y - 310, w: 80, h: 12 })
  coins.push({ x: WORLD_W / 2, y: FLOOR_Y - 336, collected: false })
  // Large rolling ball and loose spikes
  const balls: PhysicsBall[] = [
    { x: 100, y: FLOOR_Y - 200, vx: 50, vy: 0, radius: 20, mass: 5, grounded: false },
  ]
  const looseSpikes: LooseSpike[] = [
    { x: 500, y: FLOOR_Y - 250, vx: 0, vy: 0, angle: 0, w: SPIKE_W, h: SPIKE_H },
  ]
  return { platforms, spikes, coins, bikes: [], checkpoints: [], kingZone: null, balls, looseSpikes, traps: [] }
}

// ── Free maps ─────────────────────────────────────────────

function freeMap1(): LevelData {
  return {
    platforms: [
      { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
      { x: 150, y: FLOOR_Y - 80, w: 200, h: 16 },
      { x: 450, y: FLOOR_Y - 140, w: 200, h: 16 },
      { x: 200, y: FLOOR_Y - 220, w: 200, h: 16 },
      { x: WORLD_W - 250, y: FLOOR_Y - 80, w: 200, h: 16 },
    ],
    spikes: [],
    coins: [],
    bikes: [{ x: 500, y: FLOOR_Y - 20, w: 50, h: 24, occupied: false, tilt: 0 }],
    checkpoints: [],
    kingZone: null,
    // Playground items: various ball sizes
    balls: [
      { x: 200, y: FLOOR_Y - 50, vx: 0, vy: 0, radius: 8, mass: 0.5, grounded: false },
      { x: 350, y: FLOOR_Y - 50, vx: 0, vy: 0, radius: 16, mass: 3, grounded: false },
      { x: 700, y: FLOOR_Y - 50, vx: 0, vy: 0, radius: 30, mass: 6, grounded: false },
      { x: 800, y: FLOOR_Y - 100, vx: 0, vy: 0, radius: 60, mass: 15, grounded: false },
    ],
    looseSpikes: [],
    traps: [
      { x: 250, y: FLOOR_Y - 20, w: 50, h: 20, type: 'spring', active: false, timer: 30, phase: 0 },
    ],
  }
}

function freeMap2(): LevelData {
  return {
    platforms: [
      { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
      { x: 60, y: FLOOR_Y - 60, w: 260, h: 14 },
      { x: 380, y: FLOOR_Y - 110, w: 200, h: 14 },
      { x: 640, y: FLOOR_Y - 60, w: 260, h: 14 },
      { x: 200, y: FLOOR_Y - 200, w: 240, h: 14 },
      { x: WORLD_W / 2 - 60, y: FLOOR_Y - 300, w: 120, h: 14 },
      { x: 520, y: FLOOR_Y - 200, w: 240, h: 14 },
    ],
    spikes: [],
    coins: [],
    bikes: [
      { x: 120, y: FLOOR_Y - 20, w: 50, h: 24, occupied: false, tilt: 0 },
      { x: WORLD_W - 180, y: FLOOR_Y - 20, w: 50, h: 24, occupied: false, tilt: 0 },
    ],
    checkpoints: [],
    kingZone: null,
    balls: [
      { x: 480, y: FLOOR_Y - 140, vx: 0, vy: 0, radius: 20, mass: 4, grounded: false },
    ],
    looseSpikes: [
      { x: 300, y: FLOOR_Y - 250, vx: 15, vy: 0, angle: 0, w: SPIKE_W, h: SPIKE_H },
      { x: 650, y: FLOOR_Y - 120, vx: -10, vy: 0, angle: 1.0, w: SPIKE_W, h: SPIKE_H },
    ],
    traps: [],
  }
}

function freeMap3(): LevelData {
  return {
    platforms: [
      { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
      { x: 100, y: FLOOR_Y - 50, w: 100, h: 14 },
      { x: 260, y: FLOOR_Y - 100, w: 120, h: 14 },
      { x: 440, y: FLOOR_Y - 150, w: 80, h: 14 },
      { x: 580, y: FLOOR_Y - 100, w: 120, h: 14 },
      { x: 760, y: FLOOR_Y - 50, w: 100, h: 14 },
      { x: WORLD_W / 2 - 100, y: FLOOR_Y - 250, w: 200, h: 14 },
      { x: 80, y: FLOOR_Y - 200, w: 140, h: 14 },
      { x: WORLD_W - 220, y: FLOOR_Y - 200, w: 140, h: 14 },
    ],
    spikes: [],
    coins: [],
    bikes: [
      { x: 140, y: FLOOR_Y - 20, w: 50, h: 24, occupied: false, tilt: 0 },
      { x: WORLD_W / 2 - 25, y: FLOOR_Y - 20, w: 50, h: 24, occupied: false, tilt: 0 },
      { x: WORLD_W - 200, y: FLOOR_Y - 20, w: 50, h: 24, occupied: false, tilt: 0 },
    ],
    checkpoints: [],
    kingZone: null,
    balls: [
      { x: 200, y: 60, vx: 30, vy: 0, radius: 60, mass: 20, grounded: false }, // HUGE ball
      { x: 600, y: 100, vx: -20, vy: 0, radius: 30, mass: 6, grounded: false },
    ],
    looseSpikes: [
      { x: 400, y: 80, vx: 10, vy: 0, angle: 0, w: SPIKE_W, h: SPIKE_H },
    ],
    traps: [
      { x: WORLD_W / 2 - 25, y: FLOOR_Y - 20, w: 50, h: 20, type: 'spring', active: false, timer: 60, phase: 0 },
      { x: 800, y: FLOOR_Y - 80, w: 40, h: 60, type: 'crusher', active: false, timer: 90, phase: 0 },
    ],
  }
}

// ── Sumo maps ─────────────────────────────────────────────

function sumoMap1(): LevelData {
  return {
    platforms: [{ x: WORLD_W / 2 - 200, y: FLOOR_Y, w: 400, h: 40 }],
    spikes: [], coins: [], bikes: [], checkpoints: [], kingZone: null,
    balls: [{ x: WORLD_W / 2, y: FLOOR_Y - 40, vx: 0, vy: 0, radius: 12, mass: 2, grounded: false }],
    looseSpikes: [], traps: [],
  }
}

function sumoMap2(): LevelData {
  return {
    platforms: [
      { x: WORLD_W / 2 - 160, y: FLOOR_Y, w: 320, h: 30 },
      { x: WORLD_W / 2 - 80, y: FLOOR_Y - 120, w: 160, h: 14 },
    ],
    spikes: [], coins: [], bikes: [], checkpoints: [], kingZone: null,
    ...EMPTY,
  }
}

function sumoMap3(): LevelData {
  return {
    platforms: [
      { x: WORLD_W / 2 - 220, y: FLOOR_Y, w: 120, h: 30 },
      { x: WORLD_W / 2 - 50, y: FLOOR_Y - 40, w: 100, h: 20 },
      { x: WORLD_W / 2 + 100, y: FLOOR_Y, w: 120, h: 30 },
    ],
    spikes: [], coins: [], bikes: [], checkpoints: [], kingZone: null,
    // Small balls on each island
    balls: [
      { x: WORLD_W / 2 - 180, y: FLOOR_Y - 20, vx: 0, vy: 0, radius: 8, mass: 0.8, grounded: false },
      { x: WORLD_W / 2 + 160, y: FLOOR_Y - 20, vx: 0, vy: 0, radius: 8, mass: 0.8, grounded: false },
    ],
    looseSpikes: [], traps: [],
  }
}

// ── Race maps ─────────────────────────────────────────────

function raceMap1(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 200, y: FLOOR_Y - 80, w: 120, h: 14 },
    { x: 420, y: FLOOR_Y - 140, w: 120, h: 14 },
    { x: 640, y: FLOOR_Y - 80, w: 120, h: 14 },
  ]
  const checkpoints: Checkpoint[] = [
    { x: 300, y: FLOOR_Y - 80, w: 40, h: 60, index: 0 },
    { x: 540, y: FLOOR_Y - 140, w: 40, h: 60, index: 1 },
    { x: WORLD_W - 60, y: FLOOR_Y - 40, w: 40, h: 60, index: 2 },
  ]
  // Traps along the race course
  const traps: Trap[] = [
    { x: 350, y: FLOOR_Y - 20, w: 50, h: 20, type: 'spring', active: false, timer: 45, phase: 0 },
  ]
  return { platforms, spikes: [], coins: [], bikes: [], checkpoints, kingZone: null, balls: [], looseSpikes: [], traps }
}

function raceMap2(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 100, y: FLOOR_Y - 90, w: 200, h: 14 },
    { x: WORLD_W - 300, y: FLOOR_Y - 170, w: 200, h: 14 },
    { x: 200, y: FLOOR_Y - 260, w: 200, h: 14 },
    { x: WORLD_W / 2 - 100, y: FLOOR_Y - 360, w: 200, h: 14 },
  ]
  const spikes: Spike[] = [
    { x: 320, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H },
    { x: 340, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H },
  ]
  const checkpoints: Checkpoint[] = [
    { x: 250, y: FLOOR_Y - 90, w: 40, h: 60, index: 0 },
    { x: WORLD_W - 200, y: FLOOR_Y - 170, w: 40, h: 60, index: 1 },
    { x: WORLD_W / 2, y: FLOOR_Y - 360, w: 40, h: 60, index: 2 },
  ]
  return { platforms, spikes, coins: [], bikes: [], checkpoints, kingZone: null, ...EMPTY }
}

function raceMap3(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: 200, h: 40 },
    { x: 240, y: FLOOR_Y - 30, w: 100, h: 14 },
    { x: 400, y: FLOOR_Y, w: 160, h: 40 },
    { x: 600, y: FLOOR_Y - 60, w: 120, h: 14 },
    { x: 760, y: FLOOR_Y, w: 200, h: 40 },
  ]
  const spikes: Spike[] = [
    { x: 200, y: FLOOR_Y - SPIKE_H + 30, w: SPIKE_W, h: SPIKE_H },
    { x: 216, y: FLOOR_Y - SPIKE_H + 30, w: SPIKE_W, h: SPIKE_H },
    { x: 560, y: FLOOR_Y - SPIKE_H + 30, w: SPIKE_W, h: SPIKE_H },
    { x: 576, y: FLOOR_Y - SPIKE_H + 30, w: SPIKE_W, h: SPIKE_H },
  ]
  const checkpoints: Checkpoint[] = [
    { x: 440, y: FLOOR_Y - 40, w: 40, h: 60, index: 0 },
    { x: WORLD_W - 40, y: FLOOR_Y - 40, w: 40, h: 60, index: 1 },
  ]
  // Loose spikes on the gaps
  const looseSpikes: LooseSpike[] = [
    { x: 450, y: FLOOR_Y - 100, vx: 0, vy: 0, angle: 0, w: SPIKE_W, h: SPIKE_H },
  ]
  return { platforms, spikes, coins: [], bikes: [], checkpoints, kingZone: null, balls: [], looseSpikes, traps: [] }
}

// ── King of the Hill maps ─────────────────────────────────

function kingMap1(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 120, y: FLOOR_Y - 80, w: 160, h: 14 },
    { x: WORLD_W - 280, y: FLOOR_Y - 80, w: 160, h: 14 },
    { x: WORLD_W / 2 - 100, y: FLOOR_Y - 180, w: 200, h: 14 },
  ]
  const kingZone: KingZone = { x: WORLD_W / 2 - 60, y: FLOOR_Y - 180 - 60, w: 120, h: 60 }
  return { platforms, spikes: [], coins: [], bikes: [], checkpoints: [], kingZone,
    balls: [{ x: WORLD_W / 2, y: FLOOR_Y - 40, vx: 40, vy: 0, radius: 14, mass: 2.5, grounded: false }],
    looseSpikes: [], traps: [] }
}

function kingMap2(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 100, y: FLOOR_Y - 70, w: 180, h: 14 },
    { x: WORLD_W - 280, y: FLOOR_Y - 70, w: 180, h: 14 },
    { x: WORLD_W / 2 - 120, y: FLOOR_Y - 150, w: 240, h: 14 },
    { x: WORLD_W / 2 - 80, y: FLOOR_Y - 250, w: 160, h: 14 },
    { x: WORLD_W / 2 - 50, y: FLOOR_Y - 340, w: 100, h: 14 },
  ]
  const spikes: Spike[] = [
    { x: WORLD_W / 2 - 50, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H },
    { x: WORLD_W / 2 + 34, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H },
  ]
  const kingZone: KingZone = { x: WORLD_W / 2 - 40, y: FLOOR_Y - 340 - 50, w: 80, h: 50 }
  return { platforms, spikes, coins: [], bikes: [], checkpoints: [], kingZone, ...EMPTY }
}

function kingMap3(): LevelData {
  const platforms: Platform[] = [
    { x: 0, y: FLOOR_Y, w: WORLD_W, h: 40 },
    { x: 120, y: FLOOR_Y - 100, w: 140, h: 14 },
    { x: WORLD_W - 260, y: FLOOR_Y - 100, w: 140, h: 14 },
    { x: WORLD_W / 2 - 80, y: FLOOR_Y - 60, w: 160, h: 20 },
  ]
  const spikes: Spike[] = []
  for (let i = 0; i < 3; i++) {
    spikes.push({ x: WORLD_W / 2 - 80 - (i + 1) * SPIKE_W, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
    spikes.push({ x: WORLD_W / 2 + 80 + i * SPIKE_W, y: FLOOR_Y - SPIKE_H, w: SPIKE_W, h: SPIKE_H })
  }
  const kingZone: KingZone = { x: WORLD_W / 2 - 50, y: FLOOR_Y - 60 - 50, w: 100, h: 50 }
  // Pit trap outside the zone
  const traps: Trap[] = [
    { x: WORLD_W / 2 - 160, y: FLOOR_Y - 10, w: 60, h: 10, type: 'pit', active: true, timer: 0, phase: 0.5 },
    { x: WORLD_W / 2 + 100, y: FLOOR_Y - 10, w: 60, h: 10, type: 'pit', active: true, timer: 0, phase: 0.5 },
  ]
  return { platforms, spikes, coins: [], bikes: [], checkpoints: [], kingZone, balls: [], looseSpikes: [], traps }
}

// ── Public API ────────────────────────────────────────────

const ARENA_MAPS  = [arenaMap1, arenaMap2, arenaMap3]
const PUZZLE_MAPS = [puzzleMap1, puzzleMap2, puzzleMap3]
const FREE_MAPS   = [freeMap1, freeMap2, freeMap3]
const SUMO_MAPS   = [sumoMap1, sumoMap2, sumoMap3]
const RACE_MAPS   = [raceMap1, raceMap2, raceMap3]
const KING_MAPS   = [kingMap1, kingMap2, kingMap3]

export function generateLevel(mode: string, _playerCount: number, mapIndex?: number): LevelData {
  let maps: (() => LevelData)[]
  if (mode === 'arena') maps = ARENA_MAPS
  else if (mode === 'puzzle') maps = PUZZLE_MAPS
  else if (mode === 'sumo') maps = SUMO_MAPS
  else if (mode === 'race') maps = RACE_MAPS
  else if (mode === 'king') maps = KING_MAPS
  else maps = FREE_MAPS

  const idx = mapIndex != null
    ? Math.max(0, Math.min(mapIndex, maps.length - 1))
    : Math.floor(Math.random() * maps.length)

  return maps[idx]()
}

export function getMapCount(mode: string): number {
  if (mode === 'arena') return ARENA_MAPS.length
  if (mode === 'puzzle') return PUZZLE_MAPS.length
  if (mode === 'sumo') return SUMO_MAPS.length
  if (mode === 'race') return RACE_MAPS.length
  if (mode === 'king') return KING_MAPS.length
  return FREE_MAPS.length
}

// ══════════════════════════════════════════════════════════
// THREE.JS MESH CREATION — Improved visuals
// ══════════════════════════════════════════════════════════

export function createLevelMeshes(scene: THREE.Scene, level: LevelData): LevelMeshes {
  const platformMeshes: THREE.Mesh[] = []
  const spikeMeshes: THREE.Mesh[] = []
  const coinMeshes: THREE.Mesh[] = []
  const bikeMeshes: THREE.Group[] = []
  const checkpointMeshes: THREE.Mesh[] = []
  let kingZoneMesh: THREE.Mesh | null = null
  const ballMeshes: THREE.Mesh[] = []
  const looseSpikeMeshes: THREE.Mesh[] = []
  const trapMeshes: THREE.Group[] = []

  // ── Platforms — layered earth/grass look ────────────────
  for (const plat of level.platforms) {
    const isFloor = plat.h >= 30
    const depth = 30

    // Main body — dark earth tone
    const geo = new THREE.BoxGeometry(plat.w, plat.h, depth)
    const mat = new THREE.MeshStandardMaterial({
      color: isFloor ? 0x3a2d1a : 0x4a5568,
      roughness: 0.85,
      metalness: 0.05,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(plat.x + plat.w / 2, flipY(plat.y + plat.h / 2), 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    scene.add(mesh)
    platformMeshes.push(mesh)

    // Grass top strip — bright green
    const grassH = isFloor ? 5 : 3
    const grassGeo = new THREE.BoxGeometry(plat.w + 2, grassH, depth + 2)
    const grassMat = new THREE.MeshStandardMaterial({
      color: isFloor ? 0x4caf50 : 0x66bb6a,
      roughness: 0.7,
      metalness: 0.0,
      emissive: 0x1a3a1a,
      emissiveIntensity: 0.1,
    })
    const grassMesh = new THREE.Mesh(grassGeo, grassMat)
    grassMesh.position.set(plat.x + plat.w / 2, flipY(plat.y) + grassH / 2, 0)
    scene.add(grassMesh)

    // Bottom edge — darker strip for depth
    if (!isFloor) {
      const btmGeo = new THREE.BoxGeometry(plat.w, 2, depth + 1)
      const btmMat = new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.9,
        metalness: 0.1,
      })
      const btmMesh = new THREE.Mesh(btmGeo, btmMat)
      btmMesh.position.set(plat.x + plat.w / 2, flipY(plat.y + plat.h) - 1, 0.5)
      scene.add(btmMesh)
    }

    // Decorative dots (stones) on larger platforms
    if (plat.w > 100) {
      const stoneCount = Math.floor(plat.w / 60)
      for (let i = 0; i < stoneCount; i++) {
        const stoneGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 6, 4)
        const stoneMat = new THREE.MeshStandardMaterial({
          color: 0x6b7280,
          roughness: 0.9,
        })
        const stone = new THREE.Mesh(stoneGeo, stoneMat)
        stone.position.set(
          plat.x + 20 + i * 60 + Math.random() * 30,
          flipY(plat.y) + grassH + 1,
          depth / 2 - 2 + Math.random() * 4,
        )
        scene.add(stone)
      }
    }
  }

  // ── Spikes — metallic with glow ────────────────────────
  for (const spike of level.spikes) {
    const geo = new THREE.ConeGeometry(spike.w / 2, spike.h, 6)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xcc2222,
      roughness: 0.25,
      metalness: 0.7,
      emissive: 0x991111,
      emissiveIntensity: 0.4,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(
      spike.x + spike.w / 2,
      flipY(spike.y + spike.h) + spike.h / 2,
      0,
    )
    mesh.castShadow = true
    scene.add(mesh)
    spikeMeshes.push(mesh)

    // Base ring for each spike
    const ringGeo = new THREE.TorusGeometry(spike.w / 2.5, 1.5, 4, 8)
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x991111,
      roughness: 0.3,
      metalness: 0.6,
    })
    const ring = new THREE.Mesh(ringGeo, ringMat)
    ring.position.set(
      spike.x + spike.w / 2,
      flipY(spike.y + spike.h) + 1,
      0,
    )
    ring.rotation.x = Math.PI / 2
    scene.add(ring)
  }

  // ── Coins — shiny with ring glow ───────────────────────
  for (const coin of level.coins) {
    const geo = new THREE.CylinderGeometry(7, 7, 2.5, 20)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.15,
      metalness: 0.9,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.rotation.z = Math.PI / 2
    mesh.position.set(coin.x, flipY(coin.y), 0)
    mesh.castShadow = true
    scene.add(mesh)
    coinMeshes.push(mesh)

    // Outer glow ring
    const glowGeo = new THREE.TorusGeometry(9, 1, 8, 16)
    const glowMat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.1,
      metalness: 0.3,
      emissive: 0xffdd44,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.5,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.position.set(coin.x, flipY(coin.y), 0)
    scene.add(glow)
  }

  // ── Bikes — detailed with handlebars, seat, engine, exhaust ──
  for (const bike of level.bikes) {
    const group = new THREE.Group()

    // Frame / body — sleek shape
    const frameGeo = new THREE.BoxGeometry(bike.w, bike.h * 0.4, 14)
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x1565c0,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0x0d47a1,
      emissiveIntensity: 0.15,
    })
    const frame = new THREE.Mesh(frameGeo, frameMat)
    frame.position.y = bike.h * 0.35
    group.add(frame)

    // Engine block
    const engineGeo = new THREE.BoxGeometry(bike.w * 0.35, bike.h * 0.3, 12)
    const engineMat = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.5,
      metalness: 0.7,
    })
    const engine = new THREE.Mesh(engineGeo, engineMat)
    engine.position.set(0, bike.h * 0.1, 0)
    group.add(engine)

    // Seat
    const seatGeo = new THREE.BoxGeometry(bike.w * 0.3, bike.h * 0.15, 10)
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x5d4037,
      roughness: 0.8,
      metalness: 0.1,
    })
    const seat = new THREE.Mesh(seatGeo, seatMat)
    seat.position.set(-bike.w * 0.1, bike.h * 0.6, 0)
    group.add(seat)

    // Handlebars
    const hbGeo = new THREE.CylinderGeometry(1.5, 1.5, 14, 6)
    const hbMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.8,
    })
    const hb = new THREE.Mesh(hbGeo, hbMat)
    hb.position.set(bike.w * 0.3, bike.h * 0.7, 0)
    group.add(hb)

    // Headlight
    const hlGeo = new THREE.SphereGeometry(3, 8, 8)
    const hlMat = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      roughness: 0.1,
      metalness: 0.2,
      emissive: 0xffff88,
      emissiveIntensity: 0.8,
    })
    const hl = new THREE.Mesh(hlGeo, hlMat)
    hl.position.set(bike.w * 0.42, bike.h * 0.45, 0)
    group.add(hl)

    // Exhaust pipe
    const exGeo = new THREE.CylinderGeometry(2, 1.5, bike.w * 0.4, 6)
    const exMat = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.4,
      metalness: 0.7,
    })
    const exhaust = new THREE.Mesh(exGeo, exMat)
    exhaust.rotation.z = Math.PI / 2
    exhaust.position.set(-bike.w * 0.25, bike.h * 0.05, 8)
    group.add(exhaust)

    // Wheels — thicker with treads
    const wheelGeo = new THREE.TorusGeometry(9, 3, 8, 16)
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.15,
    })
    const w1 = new THREE.Mesh(wheelGeo, wheelMat)
    w1.position.set(-bike.w / 3, -2, 0)
    group.add(w1)
    const w2 = new THREE.Mesh(wheelGeo.clone(), wheelMat.clone())
    w2.position.set(bike.w / 3, -2, 0)
    group.add(w2)

    // Wheel hubs
    const hubGeo = new THREE.CylinderGeometry(3, 3, 4, 8)
    const hubMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8, roughness: 0.3 })
    const h1 = new THREE.Mesh(hubGeo, hubMat)
    h1.rotation.x = Math.PI / 2
    h1.position.set(-bike.w / 3, -2, 0)
    group.add(h1)
    const h2 = new THREE.Mesh(hubGeo.clone(), hubMat.clone())
    h2.rotation.x = Math.PI / 2
    h2.position.set(bike.w / 3, -2, 0)
    group.add(h2)

    group.position.set(bike.x + bike.w / 2, flipY(bike.y + bike.h / 2), 0)
    scene.add(group)
    bikeMeshes.push(group)
  }

  // ── Checkpoints (race mode) ───────────────────────────
  for (const cp of level.checkpoints) {
    const isFinish = cp.index === level.checkpoints.length - 1
    const geo = new THREE.BoxGeometry(cp.w, cp.h, 8)
    const mat = new THREE.MeshStandardMaterial({
      color: isFinish ? 0x44ff44 : 0x44aaff,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.5,
      emissive: isFinish ? 0x22aa22 : 0x2266aa,
      emissiveIntensity: 0.4,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(cp.x + cp.w / 2, flipY(cp.y + cp.h / 2), -2)
    scene.add(mesh)
    checkpointMeshes.push(mesh)

    // Checkpoint flag pole
    const poleGeo = new THREE.CylinderGeometry(1, 1, cp.h + 20, 6)
    const poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.7, roughness: 0.3 })
    const pole = new THREE.Mesh(poleGeo, poleMat)
    pole.position.set(cp.x + 2, flipY(cp.y + cp.h / 2) + 10, 6)
    scene.add(pole)
  }

  // ── King zone ──────────────────────────────────────────
  if (level.kingZone) {
    const kz = level.kingZone
    const geo = new THREE.BoxGeometry(kz.w, kz.h, 8)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffcc00,
      roughness: 0.3,
      metalness: 0.2,
      transparent: true,
      opacity: 0.35,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
    })
    kingZoneMesh = new THREE.Mesh(geo, mat)
    kingZoneMesh.position.set(kz.x + kz.w / 2, flipY(kz.y + kz.h / 2), -2)
    scene.add(kingZoneMesh)

    // Crown decoration on top
    const crownGeo = new THREE.ConeGeometry(8, 12, 5)
    const crownMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xffaa00,
      emissiveIntensity: 0.4,
    })
    const crown = new THREE.Mesh(crownGeo, crownMat)
    crown.position.set(kz.x + kz.w / 2, flipY(kz.y) + 10, 0)
    scene.add(crown)
  }

  // ── Physics Balls — glossy spheres with stripes ────────
  for (const ball of level.balls) {
    // Color based on size
    let ballColor: number
    if (ball.radius <= 10) ballColor = 0x42a5f5       // small = blue
    else if (ball.radius <= 20) ballColor = 0x66bb6a   // medium = green
    else if (ball.radius <= 40) ballColor = 0xffa726    // large = orange
    else ballColor = 0xef5350                            // huge = red

    const geo = new THREE.SphereGeometry(ball.radius, 20, 16)
    const mat = new THREE.MeshStandardMaterial({
      color: ballColor,
      roughness: 0.2,
      metalness: 0.3,
      emissive: ballColor,
      emissiveIntensity: 0.15,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(ball.x, flipY(ball.y), 2)
    mesh.castShadow = true
    scene.add(mesh)
    ballMeshes.push(mesh)

    // Stripe ring on ball for visual spin feedback
    const stripeGeo = new THREE.TorusGeometry(ball.radius * 0.85, ball.radius * 0.08, 4, 16)
    const stripeMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.5,
      transparent: true,
      opacity: 0.6,
    })
    const stripe = new THREE.Mesh(stripeGeo, stripeMat)
    stripe.position.set(ball.x, flipY(ball.y), 2)
    scene.add(stripe)
  }

  // ── Loose Spikes — spinning individual spikes ──────────
  for (const ls of level.looseSpikes) {
    const geo = new THREE.ConeGeometry(ls.w / 2, ls.h, 5)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xff5722,
      roughness: 0.3,
      metalness: 0.6,
      emissive: 0xbf360c,
      emissiveIntensity: 0.35,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(ls.x + ls.w / 2, flipY(ls.y + ls.h / 2), 3)
    mesh.castShadow = true
    scene.add(mesh)
    looseSpikeMeshes.push(mesh)
  }

  // ── Traps — spring/crusher/pit ─────────────────────────
  for (const trap of level.traps) {
    const group = new THREE.Group()

    if (trap.type === 'spring') {
      // Base plate
      const baseGeo = new THREE.BoxGeometry(trap.w, 4, 20)
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0x7b1fa2,
        roughness: 0.5,
        metalness: 0.4,
        emissive: 0x4a0072,
        emissiveIntensity: 0.2,
      })
      group.add(new THREE.Mesh(baseGeo, baseMat))

      // Spring coil (cylinder)
      const coilGeo = new THREE.CylinderGeometry(trap.w * 0.2, trap.w * 0.25, trap.h * 0.6, 8)
      const coilMat = new THREE.MeshStandardMaterial({
        color: 0xce93d8,
        roughness: 0.3,
        metalness: 0.6,
      })
      const coil = new THREE.Mesh(coilGeo, coilMat)
      coil.position.y = trap.h * 0.3
      group.add(coil)

      // Arrow indicator
      const arrowGeo = new THREE.ConeGeometry(trap.w * 0.15, 8, 4)
      const arrowMat = new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        emissive: 0xffc107,
        emissiveIntensity: 0.5,
      })
      const arrow = new THREE.Mesh(arrowGeo, arrowMat)
      arrow.position.y = trap.h * 0.7
      group.add(arrow)
    } else if (trap.type === 'crusher') {
      // Pillar
      const pillarGeo = new THREE.BoxGeometry(trap.w, trap.h, 18)
      const pillarMat = new THREE.MeshStandardMaterial({
        color: 0x616161,
        roughness: 0.6,
        metalness: 0.5,
        emissive: 0x424242,
        emissiveIntensity: 0.15,
      })
      group.add(new THREE.Mesh(pillarGeo, pillarMat))

      // Danger stripes
      const stripeGeo = new THREE.BoxGeometry(trap.w + 2, 3, 20)
      const stripeMat = new THREE.MeshStandardMaterial({
        color: 0xffc107,
        emissive: 0xff8f00,
        emissiveIntensity: 0.3,
      })
      const stripe1 = new THREE.Mesh(stripeGeo, stripeMat)
      stripe1.position.y = trap.h * 0.3
      group.add(stripe1)
      const stripe2 = new THREE.Mesh(stripeGeo.clone(), stripeMat.clone())
      stripe2.position.y = -trap.h * 0.3
      group.add(stripe2)
    } else {
      // Pit — glowing danger zone at ground level
      const pitGeo = new THREE.BoxGeometry(trap.w, trap.h + 4, 20)
      const pitMat = new THREE.MeshStandardMaterial({
        color: 0xd32f2f,
        roughness: 0.4,
        metalness: 0.3,
        emissive: 0xff1744,
        emissiveIntensity: 0.6,
        transparent: true,
        opacity: 0.7,
      })
      group.add(new THREE.Mesh(pitGeo, pitMat))

      // Skull warning (simple cone pattern)
      const warnGeo = new THREE.ConeGeometry(4, 8, 3)
      const warnMat = new THREE.MeshStandardMaterial({
        color: 0xffeb3b,
        emissive: 0xffeb3b,
        emissiveIntensity: 0.6,
      })
      const warn = new THREE.Mesh(warnGeo, warnMat)
      warn.position.set(0, trap.h * 0.4, 10)
      group.add(warn)
    }

    group.position.set(
      trap.x + trap.w / 2,
      flipY(trap.y + trap.h / 2),
      1,
    )
    scene.add(group)
    trapMeshes.push(group)
  }

  return { platformMeshes, spikeMeshes, coinMeshes, bikeMeshes, checkpointMeshes, kingZoneMesh, ballMeshes, looseSpikeMeshes, trapMeshes }
}
