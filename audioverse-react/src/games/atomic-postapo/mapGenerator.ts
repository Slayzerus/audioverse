import type { GameConfig } from '../../pages/games/mini/types'
/**
 * Procedural post-apocalyptic map generator for AtomicPostApo.
 *
 * Creates a wasteland with:
 * - Multiple named areas (zones) in a grid across the map
 * - Buildings placed within each area (gas stations, pharmacies, bunkers, tents)
 * - Wall segments forming compounds and ruins
 * - Props scattered everywhere (barrels, tires, vehicles, furniture, camp items)
 * - Vegetation (dead trees, bushes, grass, carnivorous plants)
 * - Radiation zones
 * - Campfires (healing stations)
 * - Loot boxes
 * - Enemies per area
 * - Player spawn positions
 */
import * as THREE from 'three'
import type {
  GameState, Player, Enemy, LootBox, Building, WallSegment,
  Prop, RadZone, Area, Campfire, EnemyKind, LootItem, PlayerSlot,
} from './types'
import { PLAYER_COLORS } from '../../pages/games/mini/types'
import {
  BUILDING_DEFS, BUILDING_ACCESSORIES, WALL_DEFS, PROP_DEFS,
  VEGETATION_MODELS, GROUND_MODELS, FLOOR_TILES,
  ENEMY_COLORS,
} from './assets'
import {
  ENEMY_STATS, DIFFICULTY, MAP_SIZES,
} from './constants'
import {
  rng, rngI, rngChoice, getObstacles,
} from './helpers'
import {
  loadGLB, createFallbackBox, createCharacterMesh, createEnemyMesh,
  createRadZoneMesh, createLootMesh, createCampfireMesh,
} from './modelManager'

// ─── Area names ──────────────────────────────────────────
const AREA_NAMES = [
  'Rusty Flats', 'Dead End Junction', 'Scrapyard', 'The Crater',
  'Vault Ruins', 'Raider Outpost', 'Old Gas Station', 'Bunker Hill',
  'Rad Swamp', 'Downtown Ruins', 'The Overpass', 'Ash Fields',
]

// ─── Generate building placements per area ──────────────
function genBuildings(areas: Area[], _mapW: number, _mapH: number): Building[] {
  const buildings: Building[] = []
  let id = 0
  for (const area of areas) {
    const count = rngI(2, 5)
    for (let i = 0; i < count; i++) {
      const def = rngChoice(BUILDING_DEFS)
      const bw = def.w
      const bh = def.h
      // Try to place without overlap
      for (let attempt = 0; attempt < 20; attempt++) {
        const bx = area.x + rng(bw / 2 + 2, area.w - bw / 2 - 2)
        const by = area.y + rng(bh / 2 + 2, area.h - bh / 2 - 2)
        let overlap = false
        for (const b2 of buildings) {
          if (Math.abs(bx - b2.x) < (bw + b2.w) / 2 + 1 &&
              Math.abs(by - b2.y) < (bh + b2.h) / 2 + 1) {
            overlap = true; break
          }
        }
        if (!overlap) {
          buildings.push({
            id: id++, x: bx, y: by, w: bw, h: bh,
            type: def.id,
            rotation: rngChoice([0, Math.PI / 2, Math.PI, Math.PI * 1.5]),
            destructible: false, hp: 999,
          })
          break
        }
      }
    }
  }
  return buildings
}

// ─── Generate wall segments ─────────────────────────────
function genWalls(buildings: Building[], mapW: number, mapH: number): WallSegment[] {
  const walls: WallSegment[] = []
  let id = 0
  // Create wall compounds around some buildings
  for (const b of buildings) {
    if (Math.random() < 0.4) continue // not all buildings have walls
    const wallDef = rngChoice(WALL_DEFS)
    const sides = rngI(2, 5) // 2-4 wall segments
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + rng(-0.2, 0.2)
      const dist = Math.max(b.w, b.h) / 2 + rng(1, 3)
      walls.push({
        id: id++,
        x: b.x + Math.cos(angle) * dist,
        y: b.y + Math.sin(angle) * dist,
        rotation: angle + Math.PI / 2,
        type: wallDef.id,
        blocking: true,
      })
    }
  }
  // Scattered barricades
  const barricadeCount = rngI(8, 16)
  for (let i = 0; i < barricadeCount; i++) {
    const wallDef = rngChoice(WALL_DEFS.filter(w => ['spike_barricade', 'road_barrier', 'wire_fence'].includes(w.id)))
    walls.push({
      id: id++,
      x: rng(3, mapW - 3), y: rng(3, mapH - 3),
      rotation: rng(0, Math.PI * 2),
      type: wallDef.id,
      blocking: true,
    })
  }
  return walls
}

// ─── Generate props ─────────────────────────────────────
function genProps(buildings: Building[], mapW: number, mapH: number): Prop[] {
  const props: Prop[] = []
  let id = 0

  const push = (x: number, y: number, type: string, scale: number, blocking: boolean) => {
    props.push({ id: id++, x, y, rotation: rng(0, Math.PI * 2), type, scale, blocking })
  }

  // ─── Building accessories (placed near their parent) ───
  for (const b of buildings) {
    const accDefs = BUILDING_ACCESSORIES.filter(a => a.parentBuildings.includes(b.type))
    for (const acc of accDefs) {
      if (Math.random() < 0.7) {
        const angle = rng(0, Math.PI * 2)
        const dist = Math.max(b.w, b.h) / 2 + rng(0.5, 2)
        push(b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist,
          `acc_${acc.id}`, acc.scale, false)
      }
    }
  }

  // ─── Interior props inside buildings ───────────────────
  const interiorSets: Record<string, string[]> = {
    gas_station:  ['shelf1', 'shelf1_b', 'shelf1_c', 'shelf2', 'shelf3_a', 'shelf3_b',
                   'shelf3_c', 'shelf3_d', 'shelf4_a', 'shelf4_b', 'counter', 'cash_register',
                   'freezer1', 'freezer2', 'soda_machine', 'leaflet_holder1', 'leaflet_holder2',
                   'can_closed', 'can_opened', 'can_opened_b', 'can2_closed',
                   'small_bottle', 'small_bottle2', 'paper_trash', 'tray'],
    gas_annex:    ['gas_pump_a', 'gas_pump_b', 'gas_pump_destroyed', 'gas_pump_dest2',
                   'propane_tank', 'barrel', 'barrel_damaged', 'jerry_can', 'tire', 'car_tire',
                   'car_wheel', 'tire_cluster3'],
    gas_annex_roof: ['barrel', 'box1', 'bucket', 'jerry_can', 'tire'],
    pharmacy:     ['shelf1', 'shelf2', 'shelf3_a', 'shelf3_b', 'shelf3_c', 'shelf4_a',
                   'medication_cluster', 'medication_bottle', 'syringe', 'medpack',
                   'microscope', 'stetoscope', 'thermometer', 'pressure_gauge',
                   'test_tube1', 'test_tube2', 'test_tube3', 'test_tube4',
                   'small_bottle', 'small_bottle2', 'bottle_tall1', 'bottle_tall2',
                   'fire_extinguisher', 'fire_extinguisher_int', 'counter',
                   'breathing_apparatus', 'face_mask1', 'face_mask2', 'face_mask3',
                   'plastic_glasses', 'clipboard'],
    bunker1:      ['bed', 'bookshelf', 'bookshelf_b', 'book_gi1', 'book_gi2',
                   'chair', 'chair_destroyed', 'chair_destroyed2', 'chair_repaired1',
                   'cupboard', 'cupboard_b', 'cupboard_c', 'fridge', 'fridge_opened',
                   'generator', 'radio', 'tv', 'toolbox', 'wall_machine',
                   'oven', 'oven_destroyed', 'porch_sofa', 'backpack', 'lantern'],
    bunker2:      ['bed', 'chair_repaired2', 'chair_repaired3', 'cupboard', 'cupboard_c',
                   'fridge', 'generator', 'radio', 'toolbox', 'oven',
                   'backpack', 'sleeping_bag', 'lantern', 'cans_on_twine', 'chain'],
    bunker3:      ['bed', 'bookshelf', 'book_gi1', 'book_gi2', 'chair', 'chair_destroyed',
                   'cupboard', 'cupboard_b', 'fridge_opened', 'generator',
                   'oven_destroyed', 'radio', 'tv', 'porch_sofa', 'wall_machine',
                   'indoor_plant'],
    tent:         ['sleeping_bag', 'campfire', 'campfire_sausage', 'cooking_pot',
                   'cooking_pot_shot', 'cooking_pot_damaged', 'backpack', 'lantern',
                   'flag_on_stick', 'sharpened_stick', 'food_can_closed', 'food_can_open',
                   'food_can_shot_a', 'food_can_shot_b', 'pan', 'pan_bent', 'pan_broken',
                   'mushrooms_sliced', 'cans_on_twine', 'chain', 'crutch', 'crutch_plain'],
  }

  for (const b of buildings) {
    const set = interiorSets[b.type]
    if (!set) continue
    const count = rngI(4, 9) // 4-8 interior props per building
    for (let i = 0; i < count; i++) {
      const typeId = rngChoice(set)
      const propDef = PROP_DEFS.find(p => p.id === typeId)
      if (!propDef) continue
      // Place inside building footprint
      const ox = rng(-b.w / 3, b.w / 3)
      const oy = rng(-b.h / 3, b.h / 3)
      push(b.x + ox, b.y + oy, propDef.id, propDef.scale, propDef.blocking)
    }
  }

  // ─── Ground tiles near roads / buildings ───────────────
  for (const b of buildings) {
    // scatter 2-4 ground patches around each building
    const gCount = rngI(2, 5)
    for (let i = 0; i < gCount; i++) {
      const gDef = rngChoice(GROUND_MODELS)
      const angle = rng(0, Math.PI * 2)
      const dist = Math.max(b.w, b.h) / 2 + rng(0, 3)
      push(b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist,
        `gnd_${gDef.id}`, gDef.scale, false)
    }
  }

  // ─── Floor tiles inside buildings ──────────────────────
  for (const b of buildings) {
    const fCount = rngI(1, 4) // 1-3 floor patches
    for (let i = 0; i < fCount; i++) {
      const fPath = rngChoice(FLOOR_TILES)
      push(b.x + rng(-b.w / 3, b.w / 3), b.y + rng(-b.h / 3, b.h / 3),
        `floor_${i}_${b.id}`, 0.01, false)
      // Store the path reference for the renderer — we tag the prop type
      // and look it up by prefix in populateScene
      void fPath // used below in scene building
    }
  }

  // ─── Office room compositions (scattered in the world) ─
  const officeCount = rngI(2, 5) // 2-4 small office ruins across the map
  const officeProps = ['office_desk', 'office_chair', 'office_chair_b',
    'computer', 'monitor_free', 'monitor_plus', 'keyboard',
    'water_cooler', 'waste_bin', 'binder', 'book_office',
    'bookshelf_off_free', 'bookshelf_off_plus', 'billboard',
    'paper', 'pillar', 'pillar_cube', 'plank',
    'carton_box', 'carton_box_lid']
  for (let i = 0; i < officeCount; i++) {
    const cx = rng(10, mapW - 10)
    const cy = rng(10, mapH - 10)
    // Place 5-8 office props clustered together
    const pCount = rngI(5, 9)
    for (let j = 0; j < pCount; j++) {
      const typeId = rngChoice(officeProps)
      const propDef = PROP_DEFS.find(p => p.id === typeId)
      if (!propDef) continue
      push(cx + rng(-3, 3), cy + rng(-3, 3), propDef.id, propDef.scale, propDef.blocking)
    }
    // Add some office wall segments around it
    const owCount = rngI(2, 5)
    // (walls are handled externally, but we can add office vegetation)
    for (let j = 0; j < owCount; j++) {
      const vegId = rngChoice(['office_grass', 'office_grass_line', 'office_ivy', 'office_ivy_pillar', 'indoor_plant'])
      const vegDef = VEGETATION_MODELS.find(v => v.id === vegId)
      if (vegDef) push(cx + rng(-4, 4), cy + rng(-4, 4), `veg_${vegDef.id}`, vegDef.scale, false)
    }
  }

  // ─── Props near buildings (general scatter) ────────────
  for (const b of buildings) {
    const count = rngI(3, 7)
    for (let i = 0; i < count; i++) {
      const propDef = rngChoice(PROP_DEFS)
      const angle = rng(0, Math.PI * 2)
      const dist = Math.max(b.w, b.h) / 2 + rng(0.5, 4)
      push(b.x + Math.cos(angle) * dist, b.y + Math.sin(angle) * dist,
        propDef.id, propDef.scale, propDef.blocking)
    }
  }

  // ─── Scattered props (vehicles, rubble, poles, debris) ─
  const scatteredTypes = [
    'car', 'car_wreck', 'pickup1', 'pickup2', 'tanker_trailer',
    'barrel', 'barrel_wood', 'barrel_damaged', 'burning_barrel',
    'tire_cluster', 'tire_cluster2', 'tire_cluster3', 'car_tire', 'car_wheel',
    'electric_pole', 'box1', 'pallet1', 'pallet2',
    'carton_box', 'carton_box_lid',
    'spike', 'gas_sign', 'lamp1', 'lamp2',
    'paper_trash', 'window1', 'window2', 'door1', 'door2',
  ]
  for (let i = 0; i < 40; i++) {
    const typeId = rngChoice(scatteredTypes)
    const propDef = PROP_DEFS.find(p => p.id === typeId) || PROP_DEFS[0]
    push(rng(3, mapW - 3), rng(3, mapH - 3), propDef.id, propDef.scale, propDef.blocking)
  }

  // ─── Medical / lab scatter (small items around the map) ─
  const medItems = ['medpack', 'syringe', 'medication_bottle', 'medication_cluster',
    'stetoscope', 'thermometer', 'pressure_gauge', 'fire_extinguisher',
    'breathing_apparatus', 'face_mask1', 'face_mask2', 'face_mask3', 'plastic_glasses']
  for (let i = 0; i < 10; i++) {
    const typeId = rngChoice(medItems)
    const propDef = PROP_DEFS.find(p => p.id === typeId)
    if (propDef) push(rng(5, mapW - 5), rng(5, mapH - 5), propDef.id, propDef.scale, false)
  }

  // ─── Food / cans scatter ───────────────────────────────
  const foodItems = ['can_closed', 'can_opened', 'can_opened_b', 'can2_closed',
    'food_can_closed', 'food_can_open', 'food_can_shot_a', 'food_can_shot_b',
    'pan', 'pan_bent', 'pan_broken', 'mushrooms_sliced',
    'small_bottle', 'small_bottle2', 'bottle_tall1', 'bottle_tall2']
  for (let i = 0; i < 15; i++) {
    const typeId = rngChoice(foodItems)
    const propDef = PROP_DEFS.find(p => p.id === typeId)
    if (propDef) push(rng(5, mapW - 5), rng(5, mapH - 5), propDef.id, propDef.scale, false)
  }

  // ─── Logs scatter ──────────────────────────────────────
  for (let i = 0; i < 12; i++) {
    const logId = `log_${rngI(1, 11)}`
    const propDef = PROP_DEFS.find(p => p.id === logId)
    if (propDef) push(rng(3, mapW - 3), rng(3, mapH - 3), propDef.id, propDef.scale, false)
  }

  // ─── Camp clusters (survival gear) ─────────────────────
  const campCount = rngI(3, 7) // 3-6 small camps
  const campItems = ['campfire', 'campfire_sausage', 'cooking_pot', 'cooking_pot_shot',
    'cooking_pot_damaged', 'sleeping_bag', 'backpack', 'lantern',
    'flag_on_stick', 'sharpened_stick', 'cans_on_twine', 'chain',
    'axe_a', 'axe_b', 'spear', 'crutch', 'crutch_plain']
  for (let i = 0; i < campCount; i++) {
    const cx = rng(10, mapW - 10)
    const cy = rng(10, mapH - 10)
    const itemCount = rngI(4, 8)
    for (let j = 0; j < itemCount; j++) {
      const typeId = rngChoice(campItems)
      const propDef = PROP_DEFS.find(p => p.id === typeId)
      if (propDef) push(cx + rng(-2.5, 2.5), cy + rng(-2.5, 2.5), propDef.id, propDef.scale, propDef.blocking)
    }
  }

  // ─── Vegetation scattered ─────────────────────────────
  const vegCount = rngI(40, 80)
  for (let i = 0; i < vegCount; i++) {
    const vegDef = rngChoice(VEGETATION_MODELS)
    push(rng(2, mapW - 2), rng(2, mapH - 2), `veg_${vegDef.id}`, vegDef.scale, false)
  }

  return props
}

// ─── Generate radiation zones ───────────────────────────
function genRadZones(mapW: number, mapH: number): RadZone[] {
  const zones: RadZone[] = []
  const count = rngI(3, 7)
  for (let i = 0; i < count; i++) {
    zones.push({
      x: rng(8, mapW - 8),
      y: rng(8, mapH - 8),
      r: rng(3, 8),
      intensity: rng(5, 15),
    })
  }
  return zones
}

// ─── Generate campfires ─────────────────────────────────
function genCampfires(buildings: Building[], mapW: number, mapH: number): Campfire[] {
  const fires: Campfire[] = []
  // Near some buildings
  for (const b of buildings) {
    if (Math.random() < 0.3) {
      fires.push({
        x: b.x + rng(-3, 3),
        y: b.y + rng(-3, 3),
        healPerSec: 5,
      })
    }
  }
  // A few in the wild
  for (let i = 0; i < rngI(2, 4); i++) {
    fires.push({
      x: rng(10, mapW - 10),
      y: rng(10, mapH - 10),
      healPerSec: 3,
    })
  }
  return fires
}

// ─── Generate loot boxes ────────────────────────────────
function genLoot(areas: Area[]): LootBox[] {
  const loot: LootBox[] = []
  let id = 0
  const items: LootItem[] = ['health', 'ammo', 'armor', 'coin', 'stimpak', 'radaway', 'weapon_upgrade']
  const values: Record<string, number> = {
    health: 30, ammo: 20, armor: 15, coin: 10, stimpak: 50, radaway: 1, weapon_upgrade: 1,
  }
  for (const area of areas) {
    const count = rngI(3, 6)
    for (let i = 0; i < count; i++) {
      const item = rngChoice(items)
      loot.push({
        id: id++,
        x: area.x + rng(3, area.w - 3),
        y: area.y + rng(3, area.h - 3),
        open: false,
        item,
        value: values[item] || 10,
      })
    }
  }
  return loot
}

// ─── Generate enemies ───────────────────────────────────
function genEnemies(areas: Area[], diff: string): Enemy[] {
  const enemies: Enemy[] = []
  let id = 0
  const mul = DIFFICULTY[diff] || DIFFICULTY.normal

  for (const area of areas) {
    // Mix of enemy types
    const kinds: EnemyKind[] = ['mutant', 'raider', 'feral_dog']
    for (const kind of kinds) {
      const count = Math.round(rngI(1, 3) * mul.countMul)
      const stats = ENEMY_STATS[kind]
      for (let i = 0; i < count; i++) {
        enemies.push({
          id: id++,
          x: area.x + rng(4, area.w - 4),
          y: area.y + rng(4, area.h - 4),
          hp: Math.round(stats.hp * mul.hpMul),
          maxHp: Math.round(stats.hp * mul.hpMul),
          kind,
          area: area.id,
          dir: { x: rng(-1, 1), y: rng(-1, 1) },
          timer: 0,
          attackCd: stats.attackCd,
          alertRange: stats.alertRange,
          speed: stats.speed,
          damage: Math.round(stats.damage * mul.dmgMul),
          dead: false,
        })
      }
    }

    // Radscorpion in some areas
    if (Math.random() < 0.3) {
      const stats = ENEMY_STATS.radscorpion
      enemies.push({
        id: id++,
        x: area.x + area.w / 2 + rng(-5, 5),
        y: area.y + area.h / 2 + rng(-5, 5),
        hp: Math.round(stats.hp * mul.hpMul),
        maxHp: Math.round(stats.hp * mul.hpMul),
        kind: 'radscorpion',
        area: area.id,
        dir: { x: 0, y: 0 }, timer: 0,
        attackCd: stats.attackCd,
        alertRange: stats.alertRange,
        speed: stats.speed,
        damage: Math.round(stats.damage * mul.dmgMul),
        dead: false,
      })
    }
  }

  // Boss deathclaw in the last area
  const lastArea = areas[areas.length - 1]
  const dcStats = ENEMY_STATS.deathclaw
  enemies.push({
    id: id++,
    x: lastArea.x + lastArea.w / 2,
    y: lastArea.y + lastArea.h / 2,
    hp: Math.round(dcStats.hp * mul.hpMul),
    maxHp: Math.round(dcStats.hp * mul.hpMul),
    kind: 'deathclaw',
    area: lastArea.id,
    dir: { x: 0, y: 0 }, timer: 0,
    attackCd: dcStats.attackCd,
    alertRange: dcStats.alertRange,
    speed: dcStats.speed,
    damage: Math.round(dcStats.damage * mul.dmgMul),
    dead: false,
  })

  return enemies
}

// ─── Spawn players ──────────────────────────────────────
function spawnPlayers(slots: PlayerSlot[], mapW: number, mapH: number, gear: string): Player[] {
  const ammoMap: Record<string, number> = { basic: 50, military: 80, scavenger: 30 }
  const armorMap: Record<string, number> = { basic: 0, military: 30, scavenger: 10 }
  const starts = [
    { x: 5, y: 5 }, { x: mapW - 5, y: 5 },
    { x: 5, y: mapH - 5 }, { x: mapW - 5, y: mapH - 5 },
  ]
  return slots.map((s, i) => ({
    idx: s.index,
    x: starts[i % 4].x, y: starts[i % 4].y,
    angle: 0,
    hp: 100, maxHp: 100,
    armor: armorMap[gear] || 0, maxArmor: 50,
    ammo: ammoMap[gear] || 50,
    alive: true,
    color: s.color || PLAYER_COLORS[s.index] || '#fff',
    name: s.name,
    input: s.input,
    shootCd: 0, vatsCd: 0, vatsTimer: 0,
    kills: 0, coins: 0, gems: 0, stars: 0, areasCleared: 0,
    weaponIdx: 0,
    stimpaks: gear === 'military' ? 3 : 1,
    radaway: 1,
    radiation: 0,
    sprint: false,
    interactCd: 0,
  }))
}

// ─── Initialize game state ──────────────────────────────
export function initState(slots: PlayerSlot[], config: GameConfig): GameState {
  const size = MAP_SIZES[config.mapSize || 'medium'] || MAP_SIZES.medium
  const mapW = size.w, mapH = size.h
  const diff = config.difficulty || 'normal'

  // Areas — 3×2 grid
  const cols = 3, rows = 2
  const aw = mapW / cols, ah = mapH / rows
  const areas: Area[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      areas.push({
        id: r * cols + c,
        x: c * aw, y: r * ah, w: aw, h: ah,
        cleared: false,
        name: AREA_NAMES[r * cols + c] || `Zone ${r * cols + c}`,
      })
    }
  }

  const buildings = genBuildings(areas, mapW, mapH)
  const walls = genWalls(buildings, mapW, mapH)
  const props = genProps(buildings, mapW, mapH)
  const radZones = genRadZones(mapW, mapH)
  const campfires = genCampfires(buildings, mapW, mapH)
  const loot = genLoot(areas)
  const enemies = genEnemies(areas, diff)
  const players = spawnPlayers(slots, mapW, mapH, config.startingGear || 'basic')

  const gs: GameState = {
    players, bullets: [], enemies, loot,
    buildings, walls, props, radZones, areas, campfires,
    mapW, mapH,
    mode: config.gameMode || 'explore',
    gameOver: false, winner: null, time: 0,
    killFeed: [],
    wave: 0,
    enemyNextId: enemies.length,
    bulletNextId: 0,
    cachedObstacles: null,
    prevKeys: new Set(),
  }

  // Pre-compute obstacle cache
  gs.cachedObstacles = getObstacles(gs.buildings, gs.walls, gs.props)

  return gs
}

// ─── Populate Three.js scene with 3D objects ────────────
export async function populateScene(
  scene: THREE.Scene,
  state: GameState,
): Promise<{
  buildingMeshes: Map<number, THREE.Object3D>
  propMeshes: Map<number, THREE.Object3D>
  enemyMeshes: Map<number, THREE.Object3D>
  lootMeshes: Map<number, THREE.Object3D>
  playerMeshes: Map<number, THREE.Object3D>
  radZoneMeshes: THREE.Object3D[]
  campfireMeshes: THREE.Object3D[]
  wallMeshes: Map<number, THREE.Object3D>
}> {
  const buildingMeshes = new Map<number, THREE.Object3D>()
  const propMeshes = new Map<number, THREE.Object3D>()
  const enemyMeshes = new Map<number, THREE.Object3D>()
  const lootMeshes = new Map<number, THREE.Object3D>()
  const playerMeshes = new Map<number, THREE.Object3D>()
  const radZoneMeshes: THREE.Object3D[] = []
  const campfireMeshes: THREE.Object3D[] = []
  const wallMeshes = new Map<number, THREE.Object3D>()

  // ─── Preload all unique model paths in parallel ────────
  const modelPaths = new Set<string>()
  for (const b of state.buildings) {
    const def = BUILDING_DEFS.find(d => d.id === b.type)
    if (def) modelPaths.add(def.model)
  }
  for (const a of BUILDING_ACCESSORIES) modelPaths.add(a.model)
  for (const w of state.walls) {
    const def = WALL_DEFS.find(d => d.id === w.type)
    if (def) modelPaths.add(def.model)
  }
  for (const g of GROUND_MODELS) modelPaths.add(g.model)
  for (const ft of FLOOR_TILES) modelPaths.add(ft)
  for (const p of state.props) {
    if (p.type.startsWith('veg_')) {
      const vegDef = VEGETATION_MODELS.find(v => v.id === p.type.replace('veg_', ''))
      if (vegDef) modelPaths.add(vegDef.model)
    } else if (p.type.startsWith('acc_')) {
      const accDef = BUILDING_ACCESSORIES.find(a => a.id === p.type.replace('acc_', ''))
      if (accDef) modelPaths.add(accDef.model)
    } else if (p.type.startsWith('gnd_')) {
      const gndDef = GROUND_MODELS.find(g => g.id === p.type.replace('gnd_', ''))
      if (gndDef) modelPaths.add(gndDef.model)
    } else if (p.type.startsWith('floor_')) {
      // Floor tiles — pick a random floor tile model
      for (const ft of FLOOR_TILES) modelPaths.add(ft)
    } else {
      const propDef = PROP_DEFS.find(d => d.id === p.type)
      if (propDef) modelPaths.add(propDef.model)
    }
  }
  // Fire all loads in parallel — each goes into the cache
  await Promise.allSettled([...modelPaths].map(path => loadGLB(path)))

  // ─── Buildings ─────────────────────────────────────────
  for (const b of state.buildings) {
    const def = BUILDING_DEFS.find(d => d.id === b.type)
    let mesh: THREE.Object3D
    try {
      if (def) {
        mesh = await loadGLB(def.model)
        mesh.scale.setScalar(def.scale)
      } else {
        mesh = createFallbackBox(b.w, 2, b.h, 0x5a4e3c)
      }
    } catch {
      mesh = createFallbackBox(b.w, 2, b.h, 0x5a4e3c)
    }
    mesh.position.set(b.x, 0, b.y)
    mesh.rotation.y = b.rotation
    scene.add(mesh)
    buildingMeshes.set(b.id, mesh)
  }

  // ─── Walls ─────────────────────────────────────────────
  for (const w of state.walls) {
    const def = WALL_DEFS.find(d => d.id === w.type)
    let mesh: THREE.Object3D
    try {
      if (def) {
        mesh = await loadGLB(def.model)
        mesh.scale.setScalar(def.scale)
      } else {
        mesh = createFallbackBox(0.3, 1.5, 3, 0x888888)
      }
    } catch {
      mesh = createFallbackBox(0.3, 1.5, 3, 0x888888)
    }
    mesh.position.set(w.x, 0, w.y)
    mesh.rotation.y = w.rotation
    scene.add(mesh)
    wallMeshes.set(w.id, mesh)
  }

  // ─── Props ─────────────────────────────────────────────
  for (const p of state.props) {
    const isVeg = p.type.startsWith('veg_')
    const isAcc = p.type.startsWith('acc_')
    const isGnd = p.type.startsWith('gnd_')
    const isFloor = p.type.startsWith('floor_')
    let mesh: THREE.Object3D

    if (isVeg) {
      const vegId = p.type.replace('veg_', '')
      const vegDef = VEGETATION_MODELS.find(v => v.id === vegId)
      try {
        if (vegDef) {
          mesh = await loadGLB(vegDef.model)
          mesh.scale.setScalar(vegDef.scale)
        } else {
          mesh = createFallbackBox(0.3, 0.6, 0.3, 0x2e5b2e)
        }
      } catch {
        mesh = createFallbackBox(0.3, 0.6, 0.3, 0x2e5b2e)
      }
    } else if (isAcc) {
      const accId = p.type.replace('acc_', '')
      const accDef = BUILDING_ACCESSORIES.find(a => a.id === accId)
      try {
        if (accDef) {
          mesh = await loadGLB(accDef.model)
          mesh.scale.setScalar(accDef.scale)
        } else {
          mesh = createFallbackBox(0.4, 1.0, 0.4, 0x9a8866)
        }
      } catch {
        mesh = createFallbackBox(0.4, 1.0, 0.4, 0x9a8866)
      }
    } else if (isGnd) {
      const gndId = p.type.replace('gnd_', '')
      const gndDef = GROUND_MODELS.find(g => g.id === gndId)
      try {
        if (gndDef) {
          mesh = await loadGLB(gndDef.model)
          mesh.scale.setScalar(gndDef.scale)
        } else {
          mesh = createFallbackBox(2, 0.05, 2, 0x555555)
        }
      } catch {
        mesh = createFallbackBox(2, 0.05, 2, 0x555555)
      }
    } else if (isFloor) {
      // Pick a random floor tile — model is determined at render time
      const floorPath = rngChoice(FLOOR_TILES)
      try {
        mesh = await loadGLB(floorPath)
        mesh.scale.setScalar(0.01)
      } catch {
        mesh = createFallbackBox(2, 0.02, 2, 0x666655)
      }
    } else {
      const propDef = PROP_DEFS.find(d => d.id === p.type)
      try {
        if (propDef) {
          mesh = await loadGLB(propDef.model)
          mesh.scale.setScalar(propDef.scale)
        } else {
          mesh = createFallbackBox(0.5, 0.5, 0.5, 0x888888)
        }
      } catch {
        mesh = createFallbackBox(0.5, 0.5, 0.5, 0x888888)
      }
    }

    mesh.position.set(p.x, 0, p.y)
    mesh.rotation.y = p.rotation
    scene.add(mesh)
    propMeshes.set(p.id, mesh)
  }

  // ─── Radiation zones ───────────────────────────────────
  for (const rz of state.radZones) {
    const mesh = createRadZoneMesh(rz.r)
    mesh.position.set(rz.x, 0, rz.y)
    scene.add(mesh)
    radZoneMeshes.push(mesh)
  }

  // ─── Campfires ─────────────────────────────────────────
  for (const cf of state.campfires) {
    const mesh = createCampfireMesh()
    mesh.position.set(cf.x, 0, cf.y)
    scene.add(mesh)
    campfireMeshes.push(mesh)
  }

  // ─── Loot boxes ────────────────────────────────────────
  for (const lb of state.loot) {
    const mesh = createLootMesh(lb.item)
    mesh.position.set(lb.x, 0, lb.y)
    scene.add(mesh)
    lootMeshes.set(lb.id, mesh)
  }

  // ─── Enemies ───────────────────────────────────────────
  for (const e of state.enemies) {
    const color = ENEMY_COLORS[e.kind] || 0xff0000
    const mesh = createEnemyMesh(e.kind, color)
    mesh.position.set(e.x, 0, e.y)
    scene.add(mesh)
    enemyMeshes.set(e.id, mesh)
  }

  // ─── Players ───────────────────────────────────────────
  for (const p of state.players) {
    const color = new THREE.Color(p.color).getHex()
    const mesh = createCharacterMesh(color)
    mesh.position.set(p.x, 0, p.y)
    scene.add(mesh)
    playerMeshes.set(p.idx, mesh)
  }

  // ─── Area boundary markers (subtle grid lines on ground) ─
  for (const area of state.areas) {
    const edgeGeo = new THREE.BufferGeometry()
    const verts = new Float32Array([
      area.x, 0.05, area.y,
      area.x + area.w, 0.05, area.y,
      area.x + area.w, 0.05, area.y + area.h,
      area.x, 0.05, area.y + area.h,
      area.x, 0.05, area.y,
    ])
    edgeGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3))
    const edgeMat = new THREE.LineBasicMaterial({ color: 0x555555, transparent: true, opacity: 0.3 })
    const line = new THREE.Line(edgeGeo, edgeMat)
    scene.add(line)
  }

  return { buildingMeshes, propMeshes, enemyMeshes, lootMeshes, playerMeshes, radZoneMeshes, campfireMeshes, wallMeshes }
}
