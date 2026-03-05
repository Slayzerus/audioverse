/**
 * maps.ts — Map definitions for War Is On RTS.
 * Each map defines world size, spawn points, resource zones,
 * decoration clusters, water areas, and terrain type.
 *
 * Maps range from small 1v1 arenas to large 4-player battlefields.
 */
import type { MapDef } from './types'

// ─── 1. GREEN VALLEY ─────────────────────────────────────────
// Classic open grassland with balanced resource spread.
// Good for beginners — simple layout, central gold cluster.
const greenValley: MapDef = {
  id: 'green-valley',
  name: 'Green Valley',
  worldW: 2400,
  worldH: 1600,
  terrainType: 'grass',
  description: 'A lush open valley with balanced resources. Great for learning.',
  spawnPoints: [
    { x: 200, y: 200 },
    { x: 2200, y: 1400 },
    { x: 2200, y: 200 },
    { x: 200, y: 1400 },
  ],
  resourceZones: [
    // Central gold cluster
    { cx: 1200, cy: 800, radius: 200, kind: 'gold', count: 5, amountEach: 100 },
    // Corner resource pairs
    { cx: 400, cy: 400, radius: 120, kind: 'wood', count: 4, amountEach: 80 },
    { cx: 2000, cy: 1200, radius: 120, kind: 'wood', count: 4, amountEach: 80 },
    { cx: 2000, cy: 400, radius: 120, kind: 'wood', count: 4, amountEach: 80 },
    { cx: 400, cy: 1200, radius: 120, kind: 'wood', count: 4, amountEach: 80 },
    // Meat scattered around edges
    { cx: 600, cy: 800, radius: 150, kind: 'meat', count: 3, amountEach: 60 },
    { cx: 1800, cy: 800, radius: 150, kind: 'meat', count: 3, amountEach: 60 },
    { cx: 1200, cy: 400, radius: 120, kind: 'gold', count: 2, amountEach: 60 },
    { cx: 1200, cy: 1200, radius: 120, kind: 'gold', count: 2, amountEach: 60 },
  ],
  decoZones: [
    { cx: 800, cy: 600, radius: 200, kind: 'bush', count: 8 },
    { cx: 1600, cy: 1000, radius: 200, kind: 'bush', count: 8 },
    { cx: 1200, cy: 200, radius: 300, kind: 'rock', count: 5 },
    { cx: 1200, cy: 1400, radius: 300, kind: 'rock', count: 5 },
    { cx: 600, cy: 1000, radius: 150, kind: 'stump', count: 3 },
    { cx: 1800, cy: 600, radius: 150, kind: 'stump', count: 3 },
    { cx: 1200, cy: 800, radius: 400, kind: 'deco', count: 6 },
  ],
}

// ─── 2. TWIN ISLANDS ─────────────────────────────────────────
// Two large land masses separated by a wide water channel.
// Encourages ranged combat and naval control of the crossing.
const twinIslands: MapDef = {
  id: 'twin-islands',
  name: 'Twin Islands',
  worldW: 2800,
  worldH: 1600,
  terrainType: 'grass',
  description: 'Two islands separated by water. Control the crossings!',
  spawnPoints: [
    { x: 300, y: 400 },
    { x: 2500, y: 1200 },
    { x: 300, y: 1200 },
    { x: 2500, y: 400 },
  ],
  waterAreas: [
    // Central water channel running vertically
    { x: 1200, y: 0, w: 400, h: 1600 },
    // Small lakes on each island
    { x: 500, y: 700, w: 200, h: 200 },
    { x: 2100, y: 700, w: 200, h: 200 },
  ],
  resourceZones: [
    // Left island resources
    { cx: 600, cy: 300, radius: 150, kind: 'gold', count: 4, amountEach: 100 },
    { cx: 400, cy: 900, radius: 120, kind: 'wood', count: 5, amountEach: 70 },
    { cx: 800, cy: 600, radius: 100, kind: 'meat', count: 3, amountEach: 60 },
    // Right island resources
    { cx: 2200, cy: 1300, radius: 150, kind: 'gold', count: 4, amountEach: 100 },
    { cx: 2400, cy: 700, radius: 120, kind: 'wood', count: 5, amountEach: 70 },
    { cx: 2000, cy: 1000, radius: 100, kind: 'meat', count: 3, amountEach: 60 },
    // Bridge-area contested gold
    { cx: 1400, cy: 300, radius: 80, kind: 'gold', count: 2, amountEach: 150 },
    { cx: 1400, cy: 1300, radius: 80, kind: 'gold', count: 2, amountEach: 150 },
  ],
  decoZones: [
    { cx: 300, cy: 600, radius: 250, kind: 'bush', count: 10 },
    { cx: 2500, cy: 1000, radius: 250, kind: 'bush', count: 10 },
    { cx: 700, cy: 1300, radius: 180, kind: 'rock', count: 6 },
    { cx: 2100, cy: 300, radius: 180, kind: 'rock', count: 6 },
    { cx: 1400, cy: 800, radius: 200, kind: 'deco', count: 4 },
  ],
}

// ─── 3. DESERT FORTRESS ─────────────────────────────────────
// Arid terrain with oases of resources. Players start in corners.
// Central fortress ruins provide strategic value.
const desertFortress: MapDef = {
  id: 'desert-fortress',
  name: 'Desert Fortress',
  worldW: 2400,
  worldH: 2400,
  terrainType: 'sand',
  description: 'A vast desert with oases. Control the central ruins to dominate.',
  spawnPoints: [
    { x: 250, y: 250 },
    { x: 2150, y: 2150 },
    { x: 2150, y: 250 },
    { x: 250, y: 2150 },
  ],
  waterAreas: [
    // Oasis ponds
    { x: 700, y: 700, w: 180, h: 180 },
    { x: 1520, y: 1520, w: 180, h: 180 },
    { x: 1520, y: 700, w: 180, h: 180 },
    { x: 700, y: 1520, w: 180, h: 180 },
  ],
  resourceZones: [
    // Central high-value gold
    { cx: 1200, cy: 1200, radius: 180, kind: 'gold', count: 6, amountEach: 120 },
    // Oasis wood clusters
    { cx: 790, cy: 790, radius: 150, kind: 'wood', count: 4, amountEach: 80 },
    { cx: 1610, cy: 1610, radius: 150, kind: 'wood', count: 4, amountEach: 80 },
    { cx: 1610, cy: 790, radius: 150, kind: 'wood', count: 4, amountEach: 80 },
    { cx: 790, cy: 1610, radius: 150, kind: 'wood', count: 4, amountEach: 80 },
    // Scattered meat
    { cx: 500, cy: 1200, radius: 200, kind: 'meat', count: 3, amountEach: 50 },
    { cx: 1900, cy: 1200, radius: 200, kind: 'meat', count: 3, amountEach: 50 },
    { cx: 1200, cy: 500, radius: 200, kind: 'meat', count: 3, amountEach: 50 },
    { cx: 1200, cy: 1900, radius: 200, kind: 'meat', count: 3, amountEach: 50 },
  ],
  decoZones: [
    { cx: 1200, cy: 1200, radius: 120, kind: 'rock', count: 8 },
    { cx: 400, cy: 600, radius: 200, kind: 'deco', count: 5 },
    { cx: 2000, cy: 1800, radius: 200, kind: 'deco', count: 5 },
    { cx: 600, cy: 1800, radius: 150, kind: 'stump', count: 3 },
    { cx: 1800, cy: 600, radius: 150, kind: 'stump', count: 3 },
  ],
}

// ─── 4. FOREST MAZE ─────────────────────────────────────────
// Dense forest with corridors. Resources hidden among trees.
// Favors ambush tactics and archers.
const forestMaze: MapDef = {
  id: 'forest-maze',
  name: 'Forest Maze',
  worldW: 2000,
  worldH: 2000,
  terrainType: 'grass',
  description: 'Dense forest corridors. Ideal for ambushes and archers.',
  spawnPoints: [
    { x: 200, y: 200 },
    { x: 1800, y: 1800 },
    { x: 1800, y: 200 },
    { x: 200, y: 1800 },
  ],
  resourceZones: [
    // Wood everywhere (it's a forest!)
    { cx: 500, cy: 500, radius: 200, kind: 'wood', count: 6, amountEach: 90 },
    { cx: 1500, cy: 1500, radius: 200, kind: 'wood', count: 6, amountEach: 90 },
    { cx: 1500, cy: 500, radius: 200, kind: 'wood', count: 6, amountEach: 90 },
    { cx: 500, cy: 1500, radius: 200, kind: 'wood', count: 6, amountEach: 90 },
    { cx: 1000, cy: 1000, radius: 100, kind: 'wood', count: 4, amountEach: 60 },
    // Gold is scarce — central only
    { cx: 1000, cy: 1000, radius: 120, kind: 'gold', count: 3, amountEach: 120 },
    { cx: 1000, cy: 400, radius: 80, kind: 'gold', count: 2, amountEach: 80 },
    { cx: 1000, cy: 1600, radius: 80, kind: 'gold', count: 2, amountEach: 80 },
    // Meat in clearings
    { cx: 400, cy: 1000, radius: 100, kind: 'meat', count: 3, amountEach: 50 },
    { cx: 1600, cy: 1000, radius: 100, kind: 'meat', count: 3, amountEach: 50 },
  ],
  decoZones: [
    // Dense bushes creating "walls"
    { cx: 700, cy: 300, radius: 300, kind: 'bush', count: 20 },
    { cx: 1300, cy: 700, radius: 300, kind: 'bush', count: 20 },
    { cx: 700, cy: 1300, radius: 300, kind: 'bush', count: 20 },
    { cx: 1300, cy: 1700, radius: 300, kind: 'bush', count: 20 },
    { cx: 1000, cy: 1000, radius: 200, kind: 'stump', count: 8 },
    { cx: 300, cy: 800, radius: 150, kind: 'rock', count: 4 },
    { cx: 1700, cy: 1200, radius: 150, kind: 'rock', count: 4 },
  ],
}

// ─── 5. MOUNTAIN PASS ────────────────────────────────────────
// Narrow passes between rocky mountains. Defensive map.
// Two teams face across a chokepoint.
const mountainPass: MapDef = {
  id: 'mountain-pass',
  name: 'Mountain Pass',
  worldW: 3000,
  worldH: 1400,
  terrainType: 'dark',
  description: 'A narrow pass between mountains. Hold the chokepoint!',
  spawnPoints: [
    { x: 300, y: 700 },
    { x: 2700, y: 700 },
    { x: 300, y: 300 },
    { x: 2700, y: 1100 },
  ],
  waterAreas: [
    // Mountain lakes (impassable terrain represented as water)
    { x: 0, y: 0, w: 3000, h: 200 },
    { x: 0, y: 1200, w: 3000, h: 200 },
    // Rocky outcroppings narrowing the pass
    { x: 1300, y: 0, w: 400, h: 500 },
    { x: 1300, y: 900, w: 400, h: 500 },
  ],
  resourceZones: [
    // Left side
    { cx: 500, cy: 500, radius: 150, kind: 'gold', count: 4, amountEach: 100 },
    { cx: 500, cy: 900, radius: 120, kind: 'wood', count: 5, amountEach: 80 },
    { cx: 300, cy: 700, radius: 100, kind: 'meat', count: 3, amountEach: 60 },
    // Right side
    { cx: 2500, cy: 500, radius: 150, kind: 'gold', count: 4, amountEach: 100 },
    { cx: 2500, cy: 900, radius: 120, kind: 'wood', count: 5, amountEach: 80 },
    { cx: 2700, cy: 700, radius: 100, kind: 'meat', count: 3, amountEach: 60 },
    // Contested center (in the pass)
    { cx: 1500, cy: 700, radius: 100, kind: 'gold', count: 3, amountEach: 150 },
  ],
  decoZones: [
    // Rocky terrain
    { cx: 1300, cy: 400, radius: 200, kind: 'rock', count: 12 },
    { cx: 1700, cy: 1000, radius: 200, kind: 'rock', count: 12 },
    { cx: 800, cy: 700, radius: 250, kind: 'bush', count: 6 },
    { cx: 2200, cy: 700, radius: 250, kind: 'bush', count: 6 },
    { cx: 1500, cy: 700, radius: 100, kind: 'deco', count: 4 },
  ],
}

// ─── 6. RIVER DELTA ──────────────────────────────────────────
// Multiple rivers creating islands and peninsulas.
// Resources concentrated on different landmasses.
const riverDelta: MapDef = {
  id: 'river-delta',
  name: 'River Delta',
  worldW: 2600,
  worldH: 2000,
  terrainType: 'grass',
  description: 'Rivers divide the land into regions. Adapt your strategy!',
  spawnPoints: [
    { x: 300, y: 300 },
    { x: 2300, y: 1700 },
    { x: 2300, y: 300 },
    { x: 300, y: 1700 },
  ],
  waterAreas: [
    // Main river flowing diagonally
    { x: 0, y: 900, w: 2600, h: 200 },
    // Tributary
    { x: 1200, y: 0, w: 200, h: 2000 },
    // Delta lake
    { x: 1000, y: 800, w: 600, h: 400 },
  ],
  resourceZones: [
    // NW quadrant
    { cx: 500, cy: 400, radius: 150, kind: 'gold', count: 3, amountEach: 100 },
    { cx: 700, cy: 600, radius: 120, kind: 'wood', count: 4, amountEach: 70 },
    // NE quadrant
    { cx: 2000, cy: 400, radius: 150, kind: 'gold', count: 3, amountEach: 100 },
    { cx: 1800, cy: 600, radius: 120, kind: 'wood', count: 4, amountEach: 70 },
    // SW quadrant
    { cx: 500, cy: 1400, radius: 150, kind: 'gold', count: 3, amountEach: 100 },
    { cx: 700, cy: 1600, radius: 120, kind: 'wood', count: 4, amountEach: 70 },
    // SE quadrant
    { cx: 2000, cy: 1400, radius: 150, kind: 'gold', count: 3, amountEach: 100 },
    { cx: 1800, cy: 1600, radius: 120, kind: 'wood', count: 4, amountEach: 70 },
    // Meat near rivers
    { cx: 400, cy: 900, radius: 100, kind: 'meat', count: 2, amountEach: 60 },
    { cx: 2200, cy: 900, radius: 100, kind: 'meat', count: 2, amountEach: 60 },
    { cx: 1300, cy: 400, radius: 100, kind: 'meat', count: 2, amountEach: 60 },
    { cx: 1300, cy: 1600, radius: 100, kind: 'meat', count: 2, amountEach: 60 },
  ],
  decoZones: [
    { cx: 300, cy: 800, radius: 200, kind: 'bush', count: 8 },
    { cx: 2300, cy: 1200, radius: 200, kind: 'bush', count: 8 },
    { cx: 1300, cy: 300, radius: 200, kind: 'rock', count: 6 },
    { cx: 1300, cy: 1700, radius: 200, kind: 'rock', count: 6 },
    { cx: 1300, cy: 1000, radius: 150, kind: 'deco', count: 5 },
  ],
}

// ─── 7. FROZEN LAKE ──────────────────────────────────────────
// Snowy terrain surrounding a large frozen lake.
// Resources at the lake edges. High-risk, high-reward center.
const frozenLake: MapDef = {
  id: 'frozen-lake',
  name: 'Frozen Lake',
  worldW: 2200,
  worldH: 2200,
  terrainType: 'snow',
  description: 'A frozen wasteland around a great lake. Fight for shoreline resources.',
  spawnPoints: [
    { x: 250, y: 250 },
    { x: 1950, y: 1950 },
    { x: 1950, y: 250 },
    { x: 250, y: 1950 },
  ],
  waterAreas: [
    // Huge central frozen lake
    { x: 700, y: 700, w: 800, h: 800 },
  ],
  resourceZones: [
    // Gold on lake shores (contested!)
    { cx: 700, cy: 1100, radius: 100, kind: 'gold', count: 3, amountEach: 120 },
    { cx: 1500, cy: 1100, radius: 100, kind: 'gold', count: 3, amountEach: 120 },
    { cx: 1100, cy: 700, radius: 100, kind: 'gold', count: 3, amountEach: 120 },
    { cx: 1100, cy: 1500, radius: 100, kind: 'gold', count: 3, amountEach: 120 },
    // Corner wood
    { cx: 400, cy: 400, radius: 150, kind: 'wood', count: 5, amountEach: 80 },
    { cx: 1800, cy: 1800, radius: 150, kind: 'wood', count: 5, amountEach: 80 },
    { cx: 1800, cy: 400, radius: 150, kind: 'wood', count: 5, amountEach: 80 },
    { cx: 400, cy: 1800, radius: 150, kind: 'wood', count: 5, amountEach: 80 },
    // Meat in remote areas
    { cx: 200, cy: 1100, radius: 100, kind: 'meat', count: 2, amountEach: 50 },
    { cx: 2000, cy: 1100, radius: 100, kind: 'meat', count: 2, amountEach: 50 },
  ],
  decoZones: [
    { cx: 500, cy: 500, radius: 200, kind: 'rock', count: 8 },
    { cx: 1700, cy: 1700, radius: 200, kind: 'rock', count: 8 },
    { cx: 1100, cy: 400, radius: 200, kind: 'stump', count: 4 },
    { cx: 1100, cy: 1800, radius: 200, kind: 'stump', count: 4 },
    { cx: 1100, cy: 1100, radius: 200, kind: 'deco', count: 3 },
  ],
}

// ─── 8. ARENA (small 1v1) ────────────────────────────────────
// Small, fast-paced map for quick matches.
const arena: MapDef = {
  id: 'arena',
  name: 'The Arena',
  worldW: 1400,
  worldH: 1000,
  terrainType: 'dark',
  description: 'A small combat arena. Fast and deadly.',
  spawnPoints: [
    { x: 200, y: 500 },
    { x: 1200, y: 500 },
    { x: 700, y: 200 },
    { x: 700, y: 800 },
  ],
  resourceZones: [
    // Central resources — all close, all contested
    { cx: 700, cy: 500, radius: 120, kind: 'gold', count: 4, amountEach: 80 },
    { cx: 400, cy: 300, radius: 80, kind: 'wood', count: 3, amountEach: 60 },
    { cx: 1000, cy: 700, radius: 80, kind: 'wood', count: 3, amountEach: 60 },
    { cx: 700, cy: 300, radius: 80, kind: 'meat', count: 2, amountEach: 40 },
    { cx: 700, cy: 700, radius: 80, kind: 'meat', count: 2, amountEach: 40 },
  ],
  decoZones: [
    { cx: 350, cy: 500, radius: 100, kind: 'rock', count: 4 },
    { cx: 1050, cy: 500, radius: 100, kind: 'rock', count: 4 },
    { cx: 700, cy: 500, radius: 150, kind: 'deco', count: 3 },
  ],
}

// ─── Exports ─────────────────────────────────────────────────
export const ALL_MAPS: MapDef[] = [
  greenValley,
  twinIslands,
  desertFortress,
  forestMaze,
  mountainPass,
  riverDelta,
  frozenLake,
  arena,
]

export function getMapById(id: string): MapDef {
  return ALL_MAPS.find(m => m.id === id) || greenValley
}

/** Pick a random map */
export function randomMap(): MapDef {
  return ALL_MAPS[Math.floor(Math.random() * ALL_MAPS.length)]
}
