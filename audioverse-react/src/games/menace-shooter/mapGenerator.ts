/**
 * mapGenerator.ts — Procedural post-apocalyptic city generator.
 *
 * Generates a grid-based city with:
 * - Road network (main roads + alleys)
 * - Buildings of varying height and type
 * - Water zones (rivers/lakes)
 * - Parks / wasteland
 * - Props (barrels, wrecks, barricades, trees)
 * - Spawn points for players, vehicles, pickups
 */
import type {
  LevelData, Building, RoadSegment, Park, WaterZone, Prop, Vec2, BuildingType, PropType,
} from './types'
import {
  BLOCK_SIZE, ROAD_WIDTH, BUILDING_COLORS,
} from './constants'

// ── Helpers ───────────────────────────────────────────────
function rng(lo: number, hi: number) { return lo + Math.random() * (hi - lo) }
function rngInt(lo: number, hi: number) { return Math.floor(rng(lo, hi)) }
function pick<T>(arr: T[]): T { return arr[rngInt(0, arr.length)] }

// ── Generator ─────────────────────────────────────────────
export function generateLevel(worldSize: number, playerCount: number): LevelData {
  const worldW = worldSize
  const worldH = worldSize
  const step = BLOCK_SIZE + ROAD_WIDTH

  const buildings: Building[] = []
  const roads: RoadSegment[] = []
  const parks: Park[] = []
  const waterZones: WaterZone[] = []
  const props: Prop[] = []
  const spawnPoints: Vec2[] = []
  const vehicleSpawns: Vec2[] = []
  const pickupSpawns: Vec2[] = []

  // ── Grid layout ─────────────────────────────────────────
  const gridCols = Math.floor((worldW - ROAD_WIDTH) / step)
  const gridRows = Math.floor((worldH - ROAD_WIDTH) / step)

  // ── Roads (horizontal + vertical) ───────────────────────
  // Vertical roads
  for (let col = 0; col <= gridCols; col++) {
    const rx = col * step
    roads.push({ x: rx, y: 0, w: ROAD_WIDTH, h: worldH, horizontal: false })
  }
  // Horizontal roads
  for (let row = 0; row <= gridRows; row++) {
    const ry = row * step
    roads.push({ x: 0, y: ry, w: worldW, h: ROAD_WIDTH, horizontal: true })
  }

  // ── Water zone — river through the city ─────────────────
  const hasRiver = worldSize >= 2000
  if (hasRiver) {
    const riverY = rngInt(Math.floor(gridRows * 0.3), Math.floor(gridRows * 0.7)) * step + ROAD_WIDTH
    waterZones.push({
      x: 0, y: riverY,
      w: worldW, h: ROAD_WIDTH * 2 + BLOCK_SIZE * 0.6,
    })
    // Also a small lake
    const lakeX = rngInt(2, gridCols - 2) * step + ROAD_WIDTH
    const lakeY = rngInt(1, Math.floor(gridRows * 0.3)) * step + ROAD_WIDTH
    waterZones.push({
      x: lakeX, y: lakeY,
      w: BLOCK_SIZE * 1.5, h: BLOCK_SIZE * 1.2,
    })
  }

  // ── Fill blocks with buildings / parks / wasteland ──────
  const buildingTypes: BuildingType[] = ['residential', 'commercial', 'industrial', 'ruin', 'warehouse']
  const specialTypes: BuildingType[] = ['gasstation', 'pharmacy', 'bunker']

  let specialCount = 0

  for (let col = 0; col < gridCols; col++) {
    for (let row = 0; row < gridRows; row++) {
      const bx = col * step + ROAD_WIDTH
      const by = row * step + ROAD_WIDTH

      // Check if this block overlaps water
      const inWater = waterZones.some(wz =>
        bx < wz.x + wz.w && bx + BLOCK_SIZE > wz.x &&
        by < wz.y + wz.h && by + BLOCK_SIZE > wz.y,
      )
      if (inWater) continue

      const roll = Math.random()

      if (roll < 0.1) {
        // Park / wasteland
        parks.push({ x: bx, y: by, w: BLOCK_SIZE, h: BLOCK_SIZE })
        // Add trees and props
        const treeCount = rngInt(2, 6)
        for (let ti = 0; ti < treeCount; ti++) {
          props.push({
            x: bx + rng(10, BLOCK_SIZE - 10),
            y: by + rng(10, BLOCK_SIZE - 10),
            angle: Math.random() * Math.PI * 2,
            type: Math.random() < 0.7 ? 'tree' : 'bush',
            destructible: false, hp: 999,
          })
        }
        // Vehicle spawn in park
        if (Math.random() < 0.3) {
          vehicleSpawns.push({ x: bx + BLOCK_SIZE / 2, y: by + BLOCK_SIZE / 2 })
        }
      } else if (roll < 0.14 && specialCount < 4) {
        // Special building
        specialCount++
        const sType = pick(specialTypes)
        const inset = rngInt(4, 12)
        buildings.push({
          x: bx + inset, y: by + inset,
          w: BLOCK_SIZE - inset * 2, h: BLOCK_SIZE - inset * 2,
          height: sType === 'bunker' ? 8 : rng(12, 22),
          floors: sType === 'bunker' ? 1 : rngInt(1, 3),
          type: sType,
          color: sType === 'gasstation' ? '#7a6a5a' : sType === 'pharmacy' ? '#5a7068' : '#5c5248',
          destroyed: false, hp: 500,
        })
        // Pickup spawn near special buildings
        pickupSpawns.push({ x: bx + BLOCK_SIZE / 2, y: by - 10 })
      } else {
        // Regular building — sometimes subdivide block into 2-4 buildings
        const subdiv = Math.random() < 0.3 ? 2 : 1
        for (let sx = 0; sx < subdiv; sx++) {
          for (let sy = 0; sy < subdiv; sy++) {
            const subW = BLOCK_SIZE / subdiv
            const subH = BLOCK_SIZE / subdiv
            const sbx = bx + sx * subW
            const sby = by + sy * subH
            const inset = rngInt(3, 10)

            const bType = pick(buildingTypes)
            const flrs = bType === 'ruin' ? rngInt(1, 3) : rngInt(1, 6)
            const heightPerFloor = rng(5, 9)

            buildings.push({
              x: sbx + inset, y: sby + inset,
              w: subW - inset * 2, h: subH - inset * 2,
              height: flrs * heightPerFloor,
              floors: flrs,
              type: bType,
              color: pick(BUILDING_COLORS),
              destroyed: bType === 'ruin',
              hp: bType === 'ruin' ? 0 : 200 + flrs * 50,
            })
          }
        }

        // Road-side props
        if (Math.random() < 0.5) {
          const propTypes: PropType[] = ['barrel', 'tire', 'rubble', 'dumpster', 'electric_pole', 'barricade', 'car_wreck', 'crate']
          const count = rngInt(1, 4)
          for (let pi = 0; pi < count; pi++) {
            const side = rngInt(0, 4)
            let px: number, py: number
            switch (side) {
              case 0: px = bx - rng(4, 12); py = by + rng(10, BLOCK_SIZE - 10); break  // left
              case 1: px = bx + BLOCK_SIZE + rng(4, 12); py = by + rng(10, BLOCK_SIZE - 10); break  // right
              case 2: px = bx + rng(10, BLOCK_SIZE - 10); py = by - rng(4, 12); break  // top
              default: px = bx + rng(10, BLOCK_SIZE - 10); py = by + BLOCK_SIZE + rng(4, 12); break  // bottom
            }
            props.push({
              x: px, y: py,
              angle: Math.random() * Math.PI * 2,
              type: pick(propTypes),
              destructible: Math.random() < 0.6,
              hp: rngInt(20, 80),
            })
          }
        }
      }
    }
  }

  // ── Scatter more props along roads ──────────────────────
  for (let i = 0; i < worldSize / 20; i++) {
    const roadProps: PropType[] = ['barrel', 'tire', 'burning_barrel', 'spike', 'crate']
    props.push({
      x: rng(ROAD_WIDTH, worldW - ROAD_WIDTH),
      y: rng(ROAD_WIDTH, worldH - ROAD_WIDTH),
      angle: Math.random() * Math.PI * 2,
      type: pick(roadProps),
      destructible: true,
      hp: rngInt(10, 40),
    })
  }

  // ── Player spawn points (on roads, spread out) ──────────
  const centerX = worldW / 2
  const centerY = worldH / 2
  for (let i = 0; i < Math.max(playerCount, 4); i++) {
    const angle = (i / Math.max(playerCount, 4)) * Math.PI * 2
    const dist = step * 2
    spawnPoints.push({
      x: centerX + Math.cos(angle) * dist,
      y: centerY + Math.sin(angle) * dist,
    })
  }

  // ── Vehicle spawns (along roads) ────────────────────────
  for (let i = 0; i < Math.floor(worldSize / 50); i++) {
    // Place on a random road intersection
    const col = rngInt(0, gridCols + 1)
    const row = rngInt(0, gridRows + 1)
    vehicleSpawns.push({
      x: col * step + ROAD_WIDTH / 2 + rng(-10, 10),
      y: row * step + ROAD_WIDTH / 2 + rng(-10, 10),
    })
  }

  // ── Pickup spawns ───────────────────────────────────────
  for (let i = 0; i < Math.floor(worldSize / 80); i++) {
    pickupSpawns.push({
      x: rng(60, worldW - 60),
      y: rng(60, worldH - 60),
    })
  }

  return {
    worldW, worldH,
    buildings, roads, parks, waterZones,
    props, spawnPoints, vehicleSpawns, pickupSpawns,
  }
}
