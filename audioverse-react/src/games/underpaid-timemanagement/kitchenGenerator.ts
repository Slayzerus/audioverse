/**
 * Kitchen layout generator for Underpaid Time Management.
 *
 * Generates station placements and populates the 3D scene with models.
 */
import * as THREE from 'three'
import type { Station, KitchenLayout, Vec2, Ingredient } from './types'
import { CELL_SIZE, DEFAULT_COLS, DEFAULT_ROWS } from './constants'
import { gridToWorld, rngChoice } from './helpers'
import {
  COUNTER_MODELS, APPLIANCE_MODELS, UTENSIL_MODELS,
  TABLEWARE_MODELS, WALL_MODELS, FLOOR_MODELS,
  FURNITURE_MODELS, DECORATION_MODELS, INGREDIENT_MODELS,
  BAKED_GOODS_MODELS, DISPLAY_MODELS,
} from './assets'
import { logger } from '../../utils/logger'
const log = logger.scoped('kitchenGenerator')
import {
  loadGLTF, createFallbackBox,
} from './modelManager'

// ═══════════════════════════════════════════════════════════
//  LAYOUT PRESETS
// ═══════════════════════════════════════════════════════════

function simpleLayout(): KitchenLayout {
  const cols = DEFAULT_COLS
  const rows = DEFAULT_ROWS
  const stations: Station[] = []
  let sid = 0
  const id = () => `s${sid++}`

  // Walls around perimeter
  for (let c = 0; c < cols; c++) {
    stations.push({ id: id(), col: c, row: 0, type: 'wall', facing: 'south', modelId: 'kw_straight_a' })
    stations.push({ id: id(), col: c, row: rows - 1, type: 'wall', facing: 'north', modelId: 'kw_straight_a' })
  }
  for (let r = 1; r < rows - 1; r++) {
    stations.push({ id: id(), col: 0, row: r, type: 'wall', facing: 'east', modelId: 'kw_straight_a' })
    stations.push({ id: id(), col: cols - 1, row: r, type: 'wall', facing: 'west', modelId: 'kw_straight_a' })
  }

  // Ingredient stations (top row, inside walls)
  const ingredients: Ingredient[] = ['tomato', 'lettuce', 'cheese', 'meat', 'bread', 'onion']
  for (let i = 0; i < ingredients.length; i++) {
    stations.push({
      id: id(), col: 1 + i, row: 1, type: 'ingredient',
      ingredient: ingredients[i], facing: 'south',
      modelId: 'container_a_blue',
    })
  }

  // Special ingredient stations (egg, flour, milk) — right wall
  const specials: Ingredient[] = ['egg', 'flour', 'milk']
  for (let i = 0; i < specials.length; i++) {
    stations.push({
      id: id(), col: cols - 2, row: 1 + i, type: 'ingredient',
      ingredient: specials[i], facing: 'west',
      modelId: 'container_b_blue',
    })
  }

  // Counters (middle area)
  for (let i = 0; i < 4; i++) {
    stations.push({
      id: id(), col: 1 + i, row: 3, type: 'counter', facing: 'south',
      modelId: 'ck_counter_single',
    })
  }

  // Cutting board
  stations.push({
    id: id(), col: 5, row: 3, type: 'cutting_board', facing: 'south',
    modelId: 'cuttingboard',
  })

  // Stoves (left side)
  stations.push({ id: id(), col: 1, row: 5, type: 'stove', facing: 'south', modelId: 'stove' })
  stations.push({ id: id(), col: 2, row: 5, type: 'stove', facing: 'south', modelId: 'stove' })

  // Oven
  stations.push({ id: id(), col: 3, row: 5, type: 'oven', facing: 'south', modelId: 'oven_bread' })

  // Plate station
  stations.push({ id: id(), col: 6, row: 3, type: 'plate', facing: 'south', modelId: 'dishrack_plates' })

  // Sink
  stations.push({ id: id(), col: 7, row: 3, type: 'sink', facing: 'south', modelId: 'ck_counter_sink' })

  // Trash
  stations.push({ id: id(), col: 8, row: 3, type: 'trash', facing: 'south', modelId: 'trashcan' })

  // Serve window
  stations.push({ id: id(), col: 7, row: 6, type: 'serve', facing: 'south', modelId: 'display_short' })

  // Player spawns — center of kitchen
  const spawns: Vec2[] = [
    gridToWorld(4, 4), gridToWorld(5, 4),
    gridToWorld(4, 5), gridToWorld(5, 5),
  ]

  return {
    id: 'simple',
    name: 'Simple Kitchen',
    cols, rows, stations,
    playerSpawns: spawns,
    serveWindowPos: gridToWorld(7, 6),
  }
}

function mediumLayout(): KitchenLayout {
  const cols = 12
  const rows = 10
  const stations: Station[] = []
  let sid = 0
  const id = () => `s${sid++}`

  // Walls
  for (let c = 0; c < cols; c++) {
    stations.push({ id: id(), col: c, row: 0, type: 'wall', facing: 'south', modelId: 'kw_straight_a' })
    stations.push({ id: id(), col: c, row: rows - 1, type: 'wall', facing: 'north', modelId: 'kw_straight_a' })
  }
  for (let r = 1; r < rows - 1; r++) {
    stations.push({ id: id(), col: 0, row: r, type: 'wall', facing: 'east', modelId: 'kw_straight_a' })
    stations.push({ id: id(), col: cols - 1, row: r, type: 'wall', facing: 'west', modelId: 'kw_straight_a' })
  }

  // All 12 ingredient stations
  const allIngredients: Ingredient[] = [
    'tomato', 'lettuce', 'cheese', 'meat', 'bread', 'egg',
    'flour', 'milk', 'apple', 'mushroom', 'onion', 'fish',
  ]
  for (let i = 0; i < 6; i++) {
    stations.push({ id: id(), col: 1 + i, row: 1, type: 'ingredient', ingredient: allIngredients[i], facing: 'south', modelId: 'container_a_red' })
  }
  for (let i = 6; i < 12; i++) {
    stations.push({ id: id(), col: 1 + (i - 6), row: 2, type: 'ingredient', ingredient: allIngredients[i], facing: 'south', modelId: 'container_b_red' })
  }

  // Counters (L-shape)
  for (let i = 0; i < 5; i++) {
    stations.push({ id: id(), col: 1 + i, row: 4, type: 'counter', facing: 'south', modelId: 'ck_counter_a' })
  }
  for (let i = 0; i < 3; i++) {
    stations.push({ id: id(), col: 8, row: 2 + i, type: 'counter', facing: 'west', modelId: 'ck_counter_b' })
  }

  // Cutting boards
  stations.push({ id: id(), col: 6, row: 4, type: 'cutting_board', facing: 'south', modelId: 'cuttingboard' })
  stations.push({ id: id(), col: 7, row: 4, type: 'cutting_board', facing: 'south', modelId: 'cuttingboard' })

  // Stoves (3)
  for (let i = 0; i < 3; i++) {
    stations.push({ id: id(), col: 1 + i, row: 6, type: 'stove', facing: 'south', modelId: 'stove' })
  }

  // Ovens (2)
  stations.push({ id: id(), col: 4, row: 6, type: 'oven', facing: 'south', modelId: 'oven_bread' })
  stations.push({ id: id(), col: 5, row: 6, type: 'oven', facing: 'south', modelId: 'oven_bread' })

  // Plate station
  stations.push({ id: id(), col: 8, row: 5, type: 'plate', facing: 'west', modelId: 'dishrack_plates' })
  stations.push({ id: id(), col: 8, row: 6, type: 'plate', facing: 'west', modelId: 'plate_stacked_bk' })

  // Sink
  stations.push({ id: id(), col: 9, row: 5, type: 'sink', facing: 'west', modelId: 'ck_counter_sink' })

  // Trash
  stations.push({ id: id(), col: 10, row: 5, type: 'trash', facing: 'west', modelId: 'trashcan' })

  // Serve window
  stations.push({ id: id(), col: 9, row: 8, type: 'serve', facing: 'south', modelId: 'display_long' })
  stations.push({ id: id(), col: 10, row: 8, type: 'serve', facing: 'south', modelId: 'display_short' })

  // Extra counter island
  stations.push({ id: id(), col: 5, row: 8, type: 'counter', facing: 'south', modelId: 'counter_table' })
  stations.push({ id: id(), col: 6, row: 8, type: 'counter', facing: 'south', modelId: 'counter_table' })

  const spawns: Vec2[] = [
    gridToWorld(3, 5), gridToWorld(4, 5),
    gridToWorld(6, 5), gridToWorld(7, 5),
  ]

  return {
    id: 'medium',
    name: 'Medium Kitchen',
    cols, rows, stations,
    playerSpawns: spawns,
    serveWindowPos: gridToWorld(9, 8),
  }
}

function complexLayout(): KitchenLayout {
  const cols = 14
  const rows = 12
  const stations: Station[] = []
  let sid = 0
  const id = () => `s${sid++}`

  // Walls with corner pieces
  stations.push({ id: id(), col: 0, row: 0, type: 'wall', modelId: 'kw_corner_in' })
  for (let c = 1; c < cols - 1; c++) {
    stations.push({ id: id(), col: c, row: 0, type: 'wall', facing: 'south', modelId: 'kw_straight_a' })
  }
  stations.push({ id: id(), col: cols - 1, row: 0, type: 'wall', modelId: 'kw_corner_in' })
  for (let r = 1; r < rows - 1; r++) {
    stations.push({ id: id(), col: 0, row: r, type: 'wall', facing: 'east', modelId: 'kw_straight_a' })
    stations.push({ id: id(), col: cols - 1, row: r, type: 'wall', facing: 'west', modelId: 'kw_straight_a' })
  }
  stations.push({ id: id(), col: 0, row: rows - 1, type: 'wall', modelId: 'kw_corner_in' })
  for (let c = 1; c < cols - 1; c++) {
    stations.push({ id: id(), col: c, row: rows - 1, type: 'wall', facing: 'north', modelId: 'kw_straight_a' })
  }
  stations.push({ id: id(), col: cols - 1, row: rows - 1, type: 'wall', modelId: 'kw_corner_in' })

  // Divider wall (VS mode split)
  for (let r = 0; r < rows; r++) {
    if (r !== 5 && r !== 6) { // Leave doorway
      stations.push({ id: id(), col: 7, row: r, type: 'wall', modelId: 'kw_doorway' })
    }
  }

  const allIngredients: Ingredient[] = [
    'tomato', 'lettuce', 'cheese', 'meat', 'bread', 'egg',
    'flour', 'milk', 'apple', 'mushroom', 'onion', 'fish',
  ]

  // Left half ingredients
  for (let i = 0; i < 6; i++) {
    stations.push({ id: id(), col: 1 + i, row: 1, type: 'ingredient', ingredient: allIngredients[i], facing: 'south', modelId: 'container_a_white' })
  }
  // Right half ingredients
  for (let i = 6; i < 12; i++) {
    stations.push({ id: id(), col: 8 + (i - 6), row: 1, type: 'ingredient', ingredient: allIngredients[i], facing: 'south', modelId: 'container_b_white' })
  }

  // Left half stations
  for (let i = 0; i < 4; i++) {
    stations.push({ id: id(), col: 1 + i, row: 3, type: 'counter', facing: 'south', modelId: 'ck_counter_c' })
  }
  stations.push({ id: id(), col: 5, row: 3, type: 'cutting_board', facing: 'south', modelId: 'cuttingboard' })
  stations.push({ id: id(), col: 6, row: 3, type: 'cutting_board', facing: 'south', modelId: 'cuttingboard' })

  stations.push({ id: id(), col: 1, row: 5, type: 'stove', facing: 'south', modelId: 'stove' })
  stations.push({ id: id(), col: 2, row: 5, type: 'stove', facing: 'south', modelId: 'stove' })
  stations.push({ id: id(), col: 3, row: 5, type: 'oven', facing: 'south', modelId: 'oven_bread' })
  stations.push({ id: id(), col: 4, row: 5, type: 'oven', facing: 'south', modelId: 'oven_bread' })

  stations.push({ id: id(), col: 1, row: 7, type: 'plate', facing: 'south', modelId: 'dishrack_plates' })
  stations.push({ id: id(), col: 2, row: 7, type: 'sink', facing: 'south', modelId: 'ck_counter_sink' })
  stations.push({ id: id(), col: 3, row: 7, type: 'trash', facing: 'south', modelId: 'trashcan' })
  
  // Left serve windows
  stations.push({ id: id(), col: 5, row: 10, type: 'serve', facing: 'south', modelId: 'display_short' })
  stations.push({ id: id(), col: 6, row: 10, type: 'serve', facing: 'south', modelId: 'display_short' })

  // Right half stations (mirror)
  for (let i = 0; i < 4; i++) {
    stations.push({ id: id(), col: 8 + i, row: 3, type: 'counter', facing: 'south', modelId: 'ck_counter_c' })
  }
  stations.push({ id: id(), col: 12, row: 3, type: 'cutting_board', facing: 'south', modelId: 'cuttingboard' })

  stations.push({ id: id(), col: 8, row: 5, type: 'stove', facing: 'south', modelId: 'stove' })
  stations.push({ id: id(), col: 9, row: 5, type: 'stove', facing: 'south', modelId: 'stove' })
  stations.push({ id: id(), col: 10, row: 5, type: 'oven', facing: 'south', modelId: 'oven_bread' })

  stations.push({ id: id(), col: 11, row: 7, type: 'plate', facing: 'south', modelId: 'dishrack_plates' })
  stations.push({ id: id(), col: 12, row: 7, type: 'sink', facing: 'south', modelId: 'ck_counter_sink' })
  stations.push({ id: id(), col: 8, row: 7, type: 'trash', facing: 'south', modelId: 'trashcan' })

  // Right serve windows
  stations.push({ id: id(), col: 10, row: 10, type: 'serve', facing: 'south', modelId: 'display_short' })
  stations.push({ id: id(), col: 11, row: 10, type: 'serve', facing: 'south', modelId: 'display_short' })

  // Extra counters/islands
  stations.push({ id: id(), col: 4, row: 9, type: 'counter', modelId: 'counter_table' })
  stations.push({ id: id(), col: 9, row: 9, type: 'counter', modelId: 'counter_table' })

  const spawns: Vec2[] = [
    gridToWorld(3, 4), gridToWorld(5, 4),
    gridToWorld(9, 4), gridToWorld(11, 4),
  ]

  return {
    id: 'complex',
    name: 'Complex Kitchen',
    cols, rows, stations,
    playerSpawns: spawns,
    serveWindowPos: gridToWorld(5, 10),
  }
}

// ─── Layout selection ───────────────────────────────────
export function getKitchenLayout(preset: string): KitchenLayout {
  switch (preset) {
    case 'medium': return mediumLayout()
    case 'complex': return complexLayout()
    default: return simpleLayout()
  }
}

// ═══════════════════════════════════════════════════════════
//  3D SCENE POPULATION
// ═══════════════════════════════════════════════════════════

export interface SceneMeshes {
  playerMeshes: Map<number, THREE.Group>
  stationMeshes: Map<string, THREE.Group>
  itemMeshes: Map<string, THREE.Group>      // dynamic items on stations
  fireMeshes: Map<string, THREE.Group>       // fire effects on stoves
  scene: THREE.Scene
}

/**
 * Populate the 3D scene with kitchen models.
 * Returns mesh handle maps for updating during game loop.
 */
export async function populateScene(
  scene: THREE.Scene,
  layout: KitchenLayout,
  onProgress?: (pct: number) => void,
): Promise<SceneMeshes> {
  const stationMeshes = new Map<string, THREE.Group>()
  const itemMeshes = new Map<string, THREE.Group>()
  const fireMeshes = new Map<string, THREE.Group>()
  const playerMeshes = new Map<number, THREE.Group>()

  const total = layout.stations.filter(s => s.type !== 'wall' || s.modelId).length
  let loaded = 0

  // Place floor tiles for the entire kitchen interior
  const floorModel = FLOOR_MODELS.find(f => f.id === 'floor_tiles_ck')
  for (let r = 1; r < layout.rows - 1; r++) {
    for (let c = 1; c < layout.cols - 1; c++) {
      // Skip cells with stations
      const occupied = layout.stations.some(s => s.col === c && s.row === r && s.type !== 'wall')
      if (occupied) continue
      if (floorModel) {
        try {
          const tile = await loadGLTF(floorModel.model)
          tile.scale.setScalar(CELL_SIZE * 0.55)
          const pos = gridToWorld(c, r)
          tile.position.set(pos.x, 0, pos.y)
          scene.add(tile)
        } catch {
          // Skip floor tiles on failure
        }
      }
    }
  }

  // Place station models
  for (const station of layout.stations) {
    const pos = gridToWorld(station.col, station.row)
    let mesh: THREE.Group | null = null

    try {
      if (station.modelId) {
        // Find model definition — search all categories
        const allModels = [
          ...COUNTER_MODELS, ...APPLIANCE_MODELS, ...UTENSIL_MODELS,
          ...TABLEWARE_MODELS, ...WALL_MODELS, ...FLOOR_MODELS,
          ...FURNITURE_MODELS, ...DECORATION_MODELS, ...INGREDIENT_MODELS,
          ...BAKED_GOODS_MODELS, ...DISPLAY_MODELS,
        ]
        const modelDef = allModels.find(m => m.id === station.modelId)
        if (modelDef) {
          mesh = await loadGLTF(modelDef.model)
          mesh.scale.setScalar(CELL_SIZE * modelDef.scale * 0.5)
        }
      }
    } catch (err) {
      log.warn(`Model load failed for station ${station.id}:`, err)
    }

    // Fallback geometry
    if (!mesh) {
      mesh = new THREE.Group()
      const size = CELL_SIZE * 0.8
      let color = 0x666666
      switch (station.type) {
        case 'ingredient': color = 0x5588bb; break
        case 'counter': color = 0x8b7355; break
        case 'stove': color = 0xe67e22; break
        case 'oven': color = 0xcc6633; break
        case 'plate': color = 0xf0f0f0; break
        case 'serve': color = 0x27ae60; break
        case 'cutting_board': color = 0xc4a265; break
        case 'sink': color = 0x87ceeb; break
        case 'trash': color = 0x555555; break
        case 'wall': color = 0x3a3a3a; break
      }
      const box = createFallbackBox(size, station.type === 'wall' ? CELL_SIZE : 0.6, size, color)
      box.position.y = station.type === 'wall' ? CELL_SIZE / 2 : 0.3
      mesh.add(box)
    }

    // Position in world
    mesh.position.set(pos.x, 0, pos.y)

    // Rotate based on facing
    if (station.facing) {
      const angles: Record<string, number> = {
        north: Math.PI, south: 0, east: -Math.PI / 2, west: Math.PI / 2,
      }
      mesh.rotation.y = angles[station.facing] || 0
    }

    scene.add(mesh)
    stationMeshes.set(station.id, mesh)
    loaded++
    onProgress?.(Math.round((loaded / total) * 80))
  }

  // Add decorative elements (plants, wall fixtures)
  const decoPositions = [
    { col: 0.5, row: 0.5 },
    { col: layout.cols - 0.5, row: 0.5 },
    { col: 0.5, row: layout.rows - 0.5 },
    { col: layout.cols - 0.5, row: layout.rows - 0.5 },
  ]
  for (const dp of decoPositions) {
    try {
      const plantDef = rngChoice(DECORATION_MODELS.filter(d =>
        d.id.includes('monstera') || d.id.includes('pothos') || d.id.includes('succulent')))
      if (plantDef) {
        const plant = await loadGLTF(plantDef.model)
        plant.scale.setScalar(CELL_SIZE * 0.4)
        const pos = gridToWorld(dp.col, dp.row)
        plant.position.set(pos.x, 0, pos.y)
        scene.add(plant)
      }
    } catch {
      // Decorative — ok to skip
    }
  }

  onProgress?.(95)

  return { playerMeshes, stationMeshes, itemMeshes, fireMeshes, scene }
}
