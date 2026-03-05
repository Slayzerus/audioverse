/**
 * worldGen.ts — Procedural terrain generation for Flatworld Survival.
 *
 * Generates a 2D tile map with terrain, caves, ores, trees, water, biomes.
 * Uses a simple Perlin-like noise based on sin waves for reproducible results.
 */

import {
  B, type FlatWorldState, type GameConfig, type PlayerState, type InvSlot,
  MAP_SIZES, ARENA_SIZE, PLAYER_W, PLAYER_H, INV_SIZE, I,
} from './types'
import type { PlayerSlot } from '../../pages/games/mini/types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'

// ─── Seeded Random ────────────────────────────────────────
function mulberry32(a: number) {
  return () => {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ─── 1D Noise (layered sine) ──────────────────────────────
function noise1D(x: number, seed: number): number {
  let v = 0
  v += Math.sin(x * 0.05 + seed * 1.3) * 0.5
  v += Math.sin(x * 0.12 + seed * 2.7) * 0.25
  v += Math.sin(x * 0.25 + seed * 4.1) * 0.125
  v += Math.sin(x * 0.5 + seed * 7.3) * 0.0625
  return v
}

// ─── 2D Noise (for caves/ores) ─────────────────────────────
function noise2D(x: number, y: number, seed: number): number {
  let v = 0
  v += Math.sin(x * 0.09 + y * 0.11 + seed * 1.7) * 0.5
  v += Math.sin(x * 0.17 + y * 0.23 + seed * 3.1) * 0.25
  v += Math.sin(x * 0.31 + y * 0.37 + seed * 5.3) * 0.125
  return v
}

// ─── Biome determination ──────────────────────────────────
type Biome = 'forest' | 'desert' | 'snow' | 'wasteland' | 'plains'

function getBiome(x: number, _worldW: number, seed: number): Biome {
  const n = noise1D(x * 0.3, seed + 100)
  if (n > 0.3) return 'snow'
  if (n > 0.1) return 'forest'
  if (n < -0.3) return 'desert'
  if (n < -0.1) return 'wasteland'
  return 'plains'
}

// ─── Generate World ───────────────────────────────────────
export function generateWorld(width: number, height: number, surfaceY: number, seed: number): number[][] {
  const rand = mulberry32(seed)
  const world: number[][] = Array.from({ length: height }, () => new Array(width).fill(B.AIR))

  // 1. Terrain height map
  const heightMap = new Array(width)
  for (let x = 0; x < width; x++) {
    const n = noise1D(x, seed)
    heightMap[x] = Math.round(surfaceY + n * 12)
  }

  // 2. Fill terrain
  for (let x = 0; x < width; x++) {
    const h = heightMap[x]
    const biome = getBiome(x, width, seed)

    for (let y = 0; y < height; y++) {
      if (y >= height - 1) {
        world[y][x] = B.BEDROCK
      } else if (y >= h) {
        const depth = y - h
        if (depth === 0) {
          // Surface block
          switch (biome) {
            case 'desert': world[y][x] = B.SAND; break
            case 'snow': world[y][x] = B.SNOW; break
            case 'wasteland': world[y][x] = B.RUBBLE; break
            default: world[y][x] = B.GRASS; break
          }
        } else if (depth < 4) {
          world[y][x] = biome === 'desert' ? B.SAND : B.DIRT
        } else if (depth < 6) {
          world[y][x] = rand() > 0.5 ? B.DIRT : B.STONE
        } else {
          world[y][x] = B.STONE
        }
      }
    }
  }

  // 3. Caves (2D noise holes)
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      if (world[y][x] === B.STONE || world[y][x] === B.DIRT) {
        const depth = y - heightMap[x]
        if (depth > 8) {
          const n = noise2D(x, y, seed + 50)
          if (n > 0.35) world[y][x] = B.AIR
        }
      }
    }
  }

  // 4. Ores
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width; x++) {
      if (world[y][x] !== B.STONE) continue
      const depth = y - heightMap[Math.min(x, width - 1)]

      // Coal: shallow
      if (depth > 5 && rand() < 0.03) placeOreCluster(world, x, y, B.COAL_ORE, 3, rand, width, height)
      // Iron: medium depth
      if (depth > 15 && rand() < 0.02) placeOreCluster(world, x, y, B.IRON_ORE, 3, rand, width, height)
      // Gold: deep
      if (depth > 30 && rand() < 0.012) placeOreCluster(world, x, y, B.GOLD_ORE, 2, rand, width, height)
      // Diamond: very deep
      if (depth > 50 && rand() < 0.006) placeOreCluster(world, x, y, B.DIAMOND_ORE, 2, rand, width, height)
      // Uranium: deepest
      if (depth > 60 && rand() < 0.004) placeOreCluster(world, x, y, B.URANIUM_ORE, 2, rand, width, height)
    }
  }

  // 5. Trees
  for (let x = 2; x < width - 2; x++) {
    const h = heightMap[x]
    if (h <= 0 || h >= height) continue
    const biome = getBiome(x, width, seed)
    const surfaceBlock = world[h]?.[x]

    if (biome === 'forest' || biome === 'plains') {
      if ((surfaceBlock === B.GRASS) && rand() < 0.08) {
        placeTree(world, x, h, rand, width, height)
        x += 3 // spacing
      }
    } else if (biome === 'wasteland') {
      if (surfaceBlock === B.RUBBLE && rand() < 0.04) {
        placeDeadTree(world, x, h, width, height)
        x += 2
      }
    } else if (biome === 'desert') {
      if (surfaceBlock === B.SAND && rand() < 0.03) {
        placeCactus(world, x, h, rand, width, height)
        x += 2
      }
    }
  }

  // 6. Mushrooms on surface (sparse)
  for (let x = 0; x < width; x++) {
    const h = heightMap[x]
    if (h > 0 && h < height && world[h][x] !== B.AIR && world[h - 1]?.[x] === B.AIR) {
      if (rand() < 0.015) world[h - 1][x] = B.MUSHROOM_BLOCK
    }
  }

  // 7. Underground lakes (small water pools)
  for (let y = 0; y < height - 5; y++) {
    for (let x = 5; x < width - 5; x++) {
      const depth = y - heightMap[Math.min(x, width - 1)]
      if (depth > 15 && world[y][x] === B.AIR) {
        const n = noise2D(x * 0.5, y * 0.5, seed + 200)
        if (n > 0.5 && rand() < 0.01) fillWaterPool(world, x, y, width, height)
      }
    }
  }

  // 8. Lava pools (deep underground)
  for (let y = Math.floor(height * 0.75); y < height - 2; y++) {
    for (let x = 5; x < width - 5; x++) {
      if (world[y][x] === B.AIR && rand() < 0.003) {
        world[y][x] = B.LAVA
        // Spread slightly
        if (x > 0 && world[y][x - 1] === B.AIR) world[y][x - 1] = B.LAVA
        if (x < width - 1 && world[y][x + 1] === B.AIR) world[y][x + 1] = B.LAVA
      }
    }
  }

  return world
}

// ─── Helper: Place ore cluster ────────────────────────────
function placeOreCluster(world: number[][], cx: number, cy: number, ore: number, maxR: number, rand: () => number, w: number, h: number) {
  for (let dy = -maxR; dy <= maxR; dy++) {
    for (let dx = -maxR; dx <= maxR; dx++) {
      const nx = cx + dx, ny = cy + dy
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
      if (world[ny][nx] !== B.STONE) continue
      if (dx * dx + dy * dy <= maxR * maxR && rand() < 0.6) {
        world[ny][nx] = ore
      }
    }
  }
}

// ─── Helper: Place tree ───────────────────────────────────
function placeTree(world: number[][], x: number, surfaceY: number, rand: () => number, w: number, h: number) {
  const trunkH = 4 + Math.floor(rand() * 3)
  // Trunk
  for (let dy = 1; dy <= trunkH; dy++) {
    const ty = surfaceY - dy
    if (ty >= 0 && ty < h) world[ty][x] = B.WOOD
  }
  // Leaves
  const leafY = surfaceY - trunkH
  for (let dy = -2; dy <= 0; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const lx = x + dx, ly = leafY + dy
      if (lx < 0 || lx >= w || ly < 0 || ly >= h) continue
      if (world[ly][lx] === B.AIR && (Math.abs(dx) + Math.abs(dy) < 4)) {
        world[ly][lx] = B.LEAVES
      }
    }
  }
}

// ─── Helper: Place dead tree ──────────────────────────────
function placeDeadTree(world: number[][], x: number, surfaceY: number, _w: number, h: number) {
  for (let dy = 1; dy <= 3; dy++) {
    const ty = surfaceY - dy
    if (ty >= 0 && ty < h && world[ty][x] === B.AIR) world[ty][x] = B.DEAD_WOOD
  }
}

// ─── Helper: Place cactus ─────────────────────────────────
function placeCactus(world: number[][], x: number, surfaceY: number, rand: () => number, _w: number, h: number) {
  const ch = 2 + Math.floor(rand() * 2)
  for (let dy = 1; dy <= ch; dy++) {
    const ty = surfaceY - dy
    if (ty >= 0 && ty < h && world[ty][x] === B.AIR) world[ty][x] = B.CACTUS
  }
}

// ─── Helper: Fill small water pool ────────────────────────
function fillWaterPool(world: number[][], x: number, y: number, w: number, h: number) {
  const queue: [number, number][] = [[x, y]]
  let filled = 0
  while (queue.length > 0 && filled < 30) {
    const [cx, cy] = queue.shift()!
    if (cx < 1 || cx >= w - 1 || cy < 1 || cy >= h - 1) continue
    if (world[cy][cx] !== B.AIR) continue
    world[cy][cx] = B.WATER
    filled++
    queue.push([cx - 1, cy], [cx + 1, cy], [cx, cy + 1])
  }
}

// ─── Generate Arena Map ───────────────────────────────────
export function generateArena(width: number, height: number): number[][] {
  const world: number[][] = Array.from({ length: height }, () => new Array(width).fill(B.AIR))

  // Ground
  for (let x = 0; x < width; x++) {
    world[height - 1][x] = B.BEDROCK
    world[height - 2][x] = B.STONE
    world[height - 3][x] = B.STONE
    world[height - 4][x] = B.GRASS
  }

  // Walls
  for (let y = 0; y < height; y++) {
    world[y][0] = B.BEDROCK
    world[y][width - 1] = B.BEDROCK
  }

  // Platforms
  const platY = [height - 10, height - 16, height - 22, height - 28]
  for (const py of platY) {
    if (py < 2) continue
    const segments = [
      { x: Math.floor(width * 0.15), w: Math.floor(width * 0.2) },
      { x: Math.floor(width * 0.65), w: Math.floor(width * 0.2) },
    ]
    if (py === platY[1] || py === platY[3]) {
      segments.push({ x: Math.floor(width * 0.35), w: Math.floor(width * 0.3) })
    }
    for (const seg of segments) {
      for (let x = seg.x; x < seg.x + seg.w && x < width - 1; x++) {
        world[py][x] = B.PLATFORM
      }
    }
  }

  return world
}

// ─── Create Initial Game State ────────────────────────────
export function createGameState(players: PlayerSlot[], config: GameConfig): FlatWorldState {
  const mode = (config?.mode || 'survival') as FlatWorldState['config']['mode']
  const mapSize = config?.mapSize || 'medium'
  const isArena = mode === 'deathmatch' || mode === 'team-deathmatch'

  const sizeInfo = isArena ? ARENA_SIZE : (MAP_SIZES[mapSize] || MAP_SIZES.medium)
  const { w, h, surface } = sizeInfo

  const seed = Date.now()
  const world = isArena ? generateArena(w, h) : generateWorld(w, h, surface, seed)

  // Background walls (empty for now, players can place)
  const bgWorld: number[][] = Array.from({ length: h }, () => new Array(w).fill(B.AIR))

  const gameConfig: GameConfig = {
    mode,
    mapSize: mapSize as 'small' | 'medium' | 'large',
    killsToWin: Number(config?.killsToWin) || 10,
    difficulty: config?.difficulty || 'normal',
    worldWidth: w,
    worldHeight: h,
    surfaceY: surface,
  }

  // Find spawn positions (on surface)
  const spawnXs: number[] = []
  const step = Math.floor(w / (players.length + 1))
  for (let i = 0; i < players.length; i++) {
    spawnXs.push(step * (i + 1))
  }

  const ps: PlayerState[] = players.map((p, i) => {
    const sx = spawnXs[i] || Math.floor(w / 2)
    let sy = 0
    // Find surface
    for (let y = 0; y < h; y++) {
      if (world[y][sx] !== B.AIR && world[y][sx] !== B.WATER && world[y][sx] !== B.LEAVES) {
        sy = y - 1
        break
      }
    }

    const inv: InvSlot[] = Array.from({ length: INV_SIZE }, () => ({ id: -1, count: 0 }))

    // Starting items in survival mode
    if (mode === 'survival' || mode === 'coop-survival') {
      inv[0] = { id: I.WOOD_PICKAXE, count: 1 }
      inv[1] = { id: I.WOOD_SWORD, count: 1 }
      inv[2] = { id: B.TORCH, count: 10 }
      inv[3] = { id: I.APPLE, count: 5 }
    } else {
      // Arena: give weapons
      inv[0] = { id: I.IRON_SWORD, count: 1 }
      inv[1] = { id: I.BOW, count: 1 }
      inv[2] = { id: I.ARROW, count: 50 }
      inv[3] = { id: I.HEALTH_POTION, count: 3 }
      inv[4] = { id: I.GRENADE, count: 5 }
    }

    return {
      x: sx, y: sy,
      vx: 0, vy: 0,
      width: PLAYER_W, height: PLAYER_H,
      facing: i % 2 === 0 ? 1 : -1,
      onGround: false,
      hp: 100, maxHp: 100,
      hunger: 100, maxHunger: 100,
      alive: true, respawnTimer: 0,
      inventory: inv,
      hotbar: 0,
      armor: [-1, -1, -1] as [number, number, number],
      mineTarget: null, mineProgress: 0,
      attackCooldown: 0, invincibleTimer: 0,
      kills: 0, deaths: 0, streak: 0, bestStreak: 0,
      coins: 0, gems: 0, stars: 0,
      color: p.color || PLAYER_COLORS[p.index] || '#fff',
      name: p.name, index: p.index, input: p.input,
      team: mode === 'team-deathmatch' ? (i % 2) : i,
      speedMult: 1, speedTimer: 0,
      strengthMult: 1, strengthTimer: 0,
      stance: 'standing' as const,
      vehicleId: -1,
    }
  })

  return {
    world, bgWorld, players: ps,
    enemies: [], projectiles: [], drops: [], particles: [],
    vehicles: [], nextVehicleId: 0,
    time: DAWN_TIME, frame: 0,
    config: gameConfig,
    gameOver: false, winner: null,
    waveNum: 0, waveTimer: 0,
    bossAlive: false, spawnCooldown: 0,
  }
}

const DAWN_TIME = 0
