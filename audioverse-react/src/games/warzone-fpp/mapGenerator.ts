import type { GameConfig } from '../../pages/games/mini/types'
/**
 * Tile-based 3D map generator for the Warzone FPP game (Cops vs Robbers).
 *
 * Generates TileMap grids with procedurally placed buildings, roads,
 * props, vehicles, pickups, and mode-specific objectives.
 *
 * All coordinates in the game state are in world metres (tile * tileSize).
 */
import type {
  GameMode, TileMap, Vec, Building, Prop, Vehicle, Pickup,
  CapturePoint, BombSite, LootBag, Flag, VipTarget,
  ConvoyWaypoint, ConvoyState, RaceCheckpoint, RaceState,
  SurvivalState, Soldier, GameState, MapPreset,
  BRState, BRZone, WeaponPickup, Trap, TrapType,
} from './types'
import {
  WALL_BRICK, WALL_CONCRETE, WALL_METAL, WALL_WOOD,
  WALL_GLASS, WALL_VAULT, WALL_POLICE,
} from './types'
import { TILE_SIZE, SOLDIER_HP, CAPTURE_TIME, WEAPONS,
  BR_ZONE_PHASES, BR_WEAPON_PICKUP_COUNT, BR_TRAP_COUNT,
  BR_MINE_DAMAGE, BR_SPIKE_DAMAGE, BR_BEAR_TRAP_DAMAGE, BR_C4_DAMAGE,
  BR_STARTING_WEAPONS, BR_WEAPON_RARITIES,
} from './constants'
import { randomBetween, randomInt } from './helpers'
import { BUILDING_TYPES, PROP_TYPES, VEHICLE_DEFS } from './assets'
import { MAP_PRESETS, getDefaultMap } from './mapPresets'
import { PLAYER_COLORS } from '../../pages/games/mini/types'
import type { PlayerSlot } from '../../pages/games/mini/types'

// ─── Helpers ─────────────────────────────────────────────

/** Convert tile coordinates to world metres */
function tw(tileX: number, tileY: number, ts: number): Vec {
  return { x: tileX * ts, y: tileY * ts }
}

/** Pick random open tile from tileMap */
function randomOpenTile(tm: TileMap): Vec {
  const open: Vec[] = []
  for (let y = 1; y < tm.h - 1; y++) {
    for (let x = 1; x < tm.w - 1; x++) {
      if (tm.data[y * tm.w + x] === 0) open.push({ x, y })
    }
  }
  return open[randomInt(0, open.length - 1)] || { x: 2, y: 2 }
}

/** Pick random open tile far from a given position */
function randomOpenTileFar(tm: TileMap, avoidX: number, avoidY: number, minDist: number): Vec {
  const open: Vec[] = []
  for (let y = 1; y < tm.h - 1; y++) {
    for (let x = 1; x < tm.w - 1; x++) {
      if (tm.data[y * tm.w + x] === 0) {
        const d = Math.hypot(x - avoidX, y - avoidY)
        if (d >= minDist) open.push({ x, y })
      }
    }
  }
  return open.length > 0
    ? open[randomInt(0, open.length - 1)]
    : { x: tm.w - 3, y: tm.h - 3 }
}

/** Map building type to wall tile type */
function wallTypeForBuilding(type: string): number {
  switch (type) {
    case 'bank':      return WALL_VAULT
    case 'police':    return WALL_POLICE
    case 'warehouse': return WALL_METAL
    case 'jewelry':   return WALL_GLASS
    case 'office':    return WALL_CONCRETE
    case 'house':     return WALL_WOOD
    case 'parking':   return WALL_CONCRETE
    case 'shop':      return WALL_BRICK
    default:          return WALL_BRICK
  }
}

// ─── Tile Map Generation ─────────────────────────────────

/**
 * Generates a tile-based map with buildings on a grid and road channels between them.
 */
function generateTileMap(preset: MapPreset): {
  tileMap: TileMap; buildings: Building[]; roads: Vec[][]
} {
  const { gridW, gridH, tileSize } = preset
  const data = new Array(gridW * gridH).fill(0)
  const buildings: Building[] = []
  const roadSegments: Vec[][] = []

  // Building block sizes vary by map type
  const blockW = preset.id === 'highway' ? randomInt(5, 8) : randomInt(6, 12)
  const blockH = preset.id === 'highway' ? randomInt(4, 6) : randomInt(6, 12)
  const roadW = randomInt(3, 5) // road width in tiles
  const cellW = blockW + roadW
  const cellH = blockH + roadW
  const blocksX = Math.floor((gridW - 2) / cellW)
  const blocksY = Math.floor((gridH - 2) / cellH)

  // Building type assignment per block (varies by map id)
  const typePool = getTypesForMap(preset.id)

  for (let by = 0; by < blocksY; by++) {
    for (let bx = 0; bx < blocksX; bx++) {
      // Occasionally skip a block to create an open area / plaza
      if (Math.random() < 0.15) continue

      const type = typePool[randomInt(0, typePool.length - 1)]
      const wt = wallTypeForBuilding(type)
      const bt = (BUILDING_TYPES as GameConfig)[type] as (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES] | undefined
      if (!bt) continue

      // Tile position (leave border of 1 tile)
      const tx = 1 + bx * cellW + randomInt(0, 1)
      const ty = 1 + by * cellH + randomInt(0, 1)
      const bw = Math.min(blockW + randomInt(-1, 1), gridW - tx - 1)
      const bh = Math.min(blockH + randomInt(-1, 1), gridH - ty - 1)
      if (bw < 3 || bh < 3) continue

      // Fill perimeter with wall tiles, leave interior open (rooms)
      for (let y = ty; y < ty + bh; y++) {
        for (let x = tx; x < tx + bw; x++) {
          const isEdge = x === tx || x === tx + bw - 1 || y === ty || y === ty + bh - 1
          if (isEdge) {
            // Leave door openings (2 per side)
            const midX = tx + Math.floor(bw / 2)
            const midY = ty + Math.floor(bh / 2)
            if ((x === midX && (y === ty || y === ty + bh - 1))
              || (y === midY && (x === tx || x === tx + bw - 1))) {
              continue // door opening
            }
            data[y * gridW + x] = wt
          }
          // Add some interior walls for larger buildings
          if (!isEdge && bw > 6 && bh > 6) {
            if (x === tx + Math.floor(bw / 2) && y > ty + 1 && y < ty + bh - 2
              && y !== ty + Math.floor(bh / 2)) {
              data[y * gridW + x] = wt
            }
          }
        }
      }

      const world = tw(tx, ty, tileSize)
      buildings.push({
        x: world.x, y: world.y,
        w: bw * tileSize, h: bh * tileSize,
        type, color: bt.color, label: bt.label,
        model: bt.models[randomInt(0, bt.models.length - 1)],
        wallType: wt,
      })
    }
  }

  // Roads: add main avenues
  const midX = Math.floor(gridW / 2)
  const midY = Math.floor(gridH / 2)
  // Horizontal main road
  for (let x = 0; x < gridW; x++) {
    for (let dy = -1; dy <= 1; dy++) {
      const y = midY + dy
      if (y >= 0 && y < gridH) data[y * gridW + x] = 0
    }
  }
  // Vertical main road
  for (let y = 0; y < gridH; y++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = midX + dx
      if (x >= 0 && x < gridW) data[y * gridW + x] = 0
    }
  }

  return { tileMap: { w: gridW, h: gridH, data, tileSize }, buildings, roads: roadSegments }
}

function getTypesForMap(mapId: string): string[] {
  switch (mapId) {
    case 'bank_district':  return ['bank', 'office', 'shop', 'jewelry', 'parking']
    case 'downtown':       return ['office', 'shop', 'bank', 'jewelry', 'parking', 'police']
    case 'industrial_zone': return ['warehouse', 'parking', 'office']
    case 'police_hq':      return ['police', 'office', 'parking', 'warehouse']
    case 'highway':        return ['parking', 'shop', 'house']
    case 'harbor':         return ['warehouse', 'office', 'shop', 'parking']
    case 'suburbs':        return ['house', 'shop', 'parking']
    case 'rooftops':       return ['office', 'shop']
    case 'warzone_island': return ['house', 'warehouse', 'shop', 'parking', 'office']
    case 'fallen_city':    return ['warehouse', 'office', 'house', 'parking', 'shop', 'bank']
    default:               return ['office', 'shop', 'house', 'warehouse']
  }
}

// ─── Spawn Position ──────────────────────────────────────

/**
 * Find a spawn position for a given team, preferring owned capture points.
 * Returns world-space coordinates (metres).
 */
export function spawnPos(
  team: number,
  cps: CapturePoint[],
  tileMap: TileMap,
): { x: number; y: number } {
  const owned = cps.filter(c => c.team === team)
  if (owned.length > 0) {
    const c = owned[randomInt(0, owned.length - 1)]
    return {
      x: c.x + randomBetween(-TILE_SIZE * 2, TILE_SIZE * 2),
      y: c.y + randomBetween(-TILE_SIZE * 2, TILE_SIZE * 2),
    }
  }
  // Team bases: team 0 bottom-left, team 1 top-right
  const ts = tileMap.tileSize
  if (team === 0) {
    return {
      x: randomBetween(2, 6) * ts,
      y: randomBetween(tileMap.h - 6, tileMap.h - 2) * ts,
    }
  }
  return {
    x: randomBetween(tileMap.w - 6, tileMap.w - 2) * ts,
    y: randomBetween(2, 6) * ts,
  }
}

// ─── Pickup / Prop / Vehicle Placement ───────────────────

function placePickups(tm: TileMap, count: number): Pickup[] {
  const pickups: Pickup[] = []
  for (let i = 0; i < count; i++) {
    const t = randomOpenTile(tm)
    const w = tw(t.x, t.y, tm.tileSize)
    const type: Pickup['type'] = (['health', 'ammo', 'armor'] as const)[randomInt(0, 2)]
    pickups.push({
      x: w.x, y: w.y, type,
      alive: true, respawnTimer: 0,
      amount: type === 'health' ? 40 : type === 'armor' ? 50 : 1,
    })
  }
  return pickups
}

function placeProps(tm: TileMap, _buildings: Building[], count: number): Prop[] {
  const props: Prop[] = []
  const ptArr = Object.values(PROP_TYPES)
  for (let i = 0; i < count; i++) {
    const t = randomOpenTile(tm)
    const w = tw(t.x, t.y, tm.tileSize)
    const pt = ptArr[randomInt(0, ptArr.length - 1)]
    props.push({
      x: w.x, y: w.y,
      w: pt.w * 0.1, h: pt.h * 0.1, // scale down from pixel sizes to metres
      type: pt.label, color: pt.color,
      model: pt.model, blocking: pt.blocking,
    })
  }
  return props
}

function placeVehicles(tm: TileMap, _mode: GameMode, buildings: Building[]): Vehicle[] {
  const vehicles: Vehicle[] = []
  const vdefs = Object.values(VEHICLE_DEFS)

  const addVehicle = (x: number, y: number, def: typeof vdefs[0], team: number) => {
    vehicles.push({
      x, y, type: def.type, model: def.model,
      alive: true, hp: def.hp, maxHp: def.maxHp,
      respawnTimer: 0, rider: -1,
      angle: randomBetween(0, Math.PI * 2),
      team, spawnX: x, spawnY: y,
    })
  }

  // Police cars near police buildings
  for (const ps of buildings.filter(b => b.type === 'police').slice(0, 2)) {
    addVehicle(ps.x + ps.w + TILE_SIZE, ps.y + ps.h / 2, VEHICLE_DEFS.police_car, 1)
  }
  // SWAT vans near warehouses
  for (const wh of buildings.filter(b => b.type === 'warehouse').slice(0, 2)) {
    addVehicle(wh.x + wh.w / 2, wh.y - TILE_SIZE * 2, VEHICLE_DEFS.swat_van, 1)
  }
  // Helicopters near parking
  for (const pk of buildings.filter(b => b.type === 'parking').slice(0, 1)) {
    addVehicle(pk.x + pk.w / 2, pk.y + pk.h / 2, VEHICLE_DEFS.helicopter, -1)
  }
  // Random extra vehicles
  for (let i = 0; i < 3; i++) {
    const t = randomOpenTile(tm)
    const w = tw(t.x, t.y, tm.tileSize)
    const def = vdefs[randomInt(0, vdefs.length - 1)]
    addVehicle(w.x, w.y, def, -1)
  }

  return vehicles
}

// ─── Mode-specific Objective Placement ───────────────────

function placeCapturePoints(tm: TileMap, mode: GameMode, buildings: Building[]): CapturePoint[] {
  const labels = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf']
  const count = mode === 'coop-assault' ? randomInt(3, 5) : randomInt(3, 7)
  const cps: CapturePoint[] = []

  // Try to place near key buildings first
  const keyBuildings = buildings.filter(b =>
    ['bank', 'police', 'jewelry', 'warehouse'].includes(b.type)
  )
  for (let i = 0; i < Math.min(count, keyBuildings.length); i++) {
    const b = keyBuildings[i]
    cps.push({
      x: b.x + b.w / 2, y: b.y + b.h / 2,
      team: mode === 'coop-assault' ? 1 : -1,
      progress: mode === 'coop-assault' ? CAPTURE_TIME : 0,
      id: i, label: labels[i] || `CP${i}`,
    })
  }
  // Fill remaining with random open positions
  for (let i = cps.length; i < count; i++) {
    const t = randomOpenTile(tm)
    const w = tw(t.x, t.y, tm.tileSize)
    cps.push({
      x: w.x, y: w.y,
      team: mode === 'coop-assault' ? 1 : -1,
      progress: mode === 'coop-assault' ? CAPTURE_TIME : 0,
      id: i, label: labels[i] || `CP${i}`,
    })
  }
  return cps
}

function placeBombSites(tm: TileMap, buildings: Building[]): BombSite[] {
  const sites: BombSite[] = []
  // Site A: inside a bank or central building
  const bankB = buildings.find(b => b.type === 'bank')
  const siteA = bankB
    ? { x: bankB.x + bankB.w / 2, y: bankB.y + bankB.h / 2 }
    : tw(randomOpenTile(tm).x, randomOpenTile(tm).y, tm.tileSize)
  sites.push({
    x: siteA.x, y: siteA.y, label: 'A',
    planted: false, plantProgress: 0, defuseProgress: 0,
    planter: -1, defuser: -1, detonated: false,
  })
  // Site B: in another building far from A
  const farTile = randomOpenTileFar(tm, siteA.x / tm.tileSize, siteA.y / tm.tileSize, 15)
  const siteB = tw(farTile.x, farTile.y, tm.tileSize)
  sites.push({
    x: siteB.x, y: siteB.y, label: 'B',
    planted: false, plantProgress: 0, defuseProgress: 0,
    planter: -1, defuser: -1, detonated: false,
  })
  return sites
}

function placeLoot(buildings: Building[], tm: TileMap): { bags: LootBag[]; extraction: Vec } {
  const bank = buildings.find(b => b.type === 'bank')
  const bags: LootBag[] = []
  const base = bank
    ? { x: bank.x + bank.w / 2, y: bank.y + bank.h / 2 }
    : tw(Math.floor(tm.w / 2), Math.floor(tm.h / 2), tm.tileSize)

  for (let i = 0; i < 3; i++) {
    bags.push({
      x: base.x + randomBetween(-TILE_SIZE * 2, TILE_SIZE * 2),
      y: base.y + randomBetween(-TILE_SIZE * 2, TILE_SIZE * 2),
      id: i, carrier: -1, extracted: false,
      label: ['Cash', 'Gold', 'Diamonds'][i],
    })
  }
  // Extraction: far corner from bank
  const ext = tw(
    bank ? tm.w - 4 : 3,
    bank ? tm.h - 4 : 3,
    tm.tileSize,
  )
  return { bags, extraction: ext }
}

function placeFlags(tm: TileMap): Flag[] {
  const ts = tm.tileSize
  const f0 = tw(3, tm.h - 4, ts)
  const f1 = tw(tm.w - 4, 3, ts)
  return [
    { x: f0.x, y: f0.y, team: 0, carrier: -1, atBase: true, baseX: f0.x, baseY: f0.y },
    { x: f1.x, y: f1.y, team: 1, carrier: -1, atBase: true, baseX: f1.x, baseY: f1.y },
  ]
}

function placeConvoy(tm: TileMap, vehicles: Vehicle[]): ConvoyState {
  const ts = tm.tileSize
  // Convoy vehicle: add a SWAT van at start
  const def = VEHICLE_DEFS.swat_van
  const startPos = tw(3, Math.floor(tm.h / 2), ts)
  vehicles.push({
    x: startPos.x, y: startPos.y, type: def.type, model: def.model,
    alive: true, hp: def.hp * 2, maxHp: def.maxHp * 2,
    respawnTimer: 0, rider: -1, angle: 0, team: 0,
    spawnX: startPos.x, spawnY: startPos.y,
  })

  // Waypoints along the middle of the map
  const waypoints: ConvoyWaypoint[] = []
  const steps = 5
  for (let i = 1; i <= steps; i++) {
    const wx = (i / (steps + 1)) * tm.w * ts
    const wy = (tm.h / 2) * ts + randomBetween(-TILE_SIZE * 4, TILE_SIZE * 4)
    waypoints.push({ x: wx, y: wy, reached: false })
  }

  return {
    vehicleIndex: vehicles.length - 1,
    waypoints,
    currentWaypoint: 0,
    completed: false,
  }
}

function placeRace(tm: TileMap): RaceState {
  const ts = tm.tileSize
  const cx = (tm.w / 2) * ts
  const cy = (tm.h / 2) * ts
  const radius = Math.min(tm.w, tm.h) * ts * 0.35
  const checkpoints: RaceCheckpoint[] = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    checkpoints.push({
      x: cx + Math.cos(a) * radius,
      y: cy + Math.sin(a) * radius,
      radius: TILE_SIZE * 3,
    })
  }
  return {
    checkpoints, laps: 3,
    progress: new Map(),
    finished: new Map(),
  }
}

// ─── State Initialisation ────────────────────────────────

// ─── Battle Royale Placement ─────────────────────────────

function placeBRWeaponPickups(tm: TileMap, count: number): WeaponPickup[] {
  const pickups: WeaponPickup[] = []
  const weaponPool = WEAPONS.map(w => w.name).filter(n => n !== 'Tank Cannon')
  for (let i = 0; i < count; i++) {
    const t = randomOpenTile(tm)
    const w = tw(t.x, t.y, tm.tileSize)
    const wName = weaponPool[randomInt(0, weaponPool.length - 1)]
    pickups.push({
      x: w.x, y: w.y,
      weaponName: wName,
      alive: true,
      id: i,
      rarity: BR_WEAPON_RARITIES[wName] || 'common',
    })
  }
  return pickups
}

function placeBRTraps(tm: TileMap, count: number): Trap[] {
  const traps: Trap[] = []
  const trapTypes: TrapType[] = ['mine', 'spike', 'bear-trap', 'c4']
  const damages: Record<TrapType, number> = {
    'mine': BR_MINE_DAMAGE,
    'spike': BR_SPIKE_DAMAGE,
    'bear-trap': BR_BEAR_TRAP_DAMAGE,
    'c4': BR_C4_DAMAGE,
  }
  for (let i = 0; i < count; i++) {
    const t = randomOpenTile(tm)
    const w = tw(t.x, t.y, tm.tileSize)
    const type = trapTypes[randomInt(0, trapTypes.length - 1)]
    traps.push({
      x: w.x, y: w.y,
      type,
      armed: true,
      owner: -1,   // pre-placed, no owner
      damage: damages[type],
      id: i,
      triggered: false,
      team: -1,
    })
  }
  return traps
}

function createBRZone(tm: TileMap): BRZone {
  const worldW = tm.w * tm.tileSize
  const worldH = tm.h * tm.tileSize
  const cx = worldW / 2
  const cy = worldH / 2
  const maxRadius = Math.min(worldW, worldH) * 0.48
  const phase0 = BR_ZONE_PHASES[0]
  return {
    centerX: cx,
    centerY: cy,
    radius: maxRadius,
    targetRadius: maxRadius * phase0.targetRadiusPct,
    shrinkRate: phase0.shrinkRate,
    damagePerTick: phase0.damage,
    phase: 0,
    phaseTimer: phase0.waitTicks,
    targetCenterX: cx + randomBetween(-maxRadius * 0.15, maxRadius * 0.15),
    targetCenterY: cy + randomBetween(-maxRadius * 0.15, maxRadius * 0.15),
  }
}

function createBRState(tm: TileMap): BRState {
  return {
    zone: createBRZone(tm),
    supplyDrops: [],
    weaponPickups: placeBRWeaponPickups(tm, BR_WEAPON_PICKUP_COUNT),
    traps: placeBRTraps(tm, BR_TRAP_COUNT),
    aliveCount: 0, // set after soldiers created
    totalCount: 0,
    nextSupplyDrop: 300,
    nextZonePhase: BR_ZONE_PHASES[0].waitTicks,
    placements: [],
  }
}

export function initState(
  players: PlayerSlot[],
  config: GameConfig,
): GameState {
  const mode: GameMode = (config.gameMode || 'deathmatch') as GameMode
  const preset: MapPreset =
    MAP_PRESETS.find(m => m.id === config.mapId) || getDefaultMap(mode)

  // Generate tile map + buildings
  const { tileMap, buildings } = generateTileMap(preset)

  // Vehicles
  const vehicles = placeVehicles(tileMap, mode, buildings)

  // Props & pickups
  const props = placeProps(tileMap, buildings, randomInt(15, 40))
  const pickups = placePickups(tileMap, randomInt(10, 25))

  // Roads as world rects (from buildings metadata — roads are just the gaps)
  void (buildings.length) // reserved for future road generation

  // ── Mode-specific objectives ───────────────────────────
  let capturePoints: CapturePoint[] = []
  let bombSites: BombSite[] | undefined
  let lootBags: LootBag[] | undefined
  let lootExtraction: Vec | undefined
  let flags: Flag[] | undefined
  let vip: VipTarget | undefined
  let convoy: ConvoyState | undefined
  let raceState: RaceState | undefined
  let survivalState: SurvivalState | undefined
  let brState: BRState | undefined

  switch (mode) {
    case 'conquest':
    case 'coop-assault':
      capturePoints = placeCapturePoints(tileMap, mode, buildings)
      break
    case 'bomb':
      bombSites = placeBombSites(tileMap, buildings)
      break
    case 'heist': {
      const loot = placeLoot(buildings, tileMap)
      lootBags = loot.bags
      lootExtraction = loot.extraction
      break
    }
    case 'ctf':
      flags = placeFlags(tileMap)
      break
    case 'escort':
      vip = {
        soldier: 0,
        extractionX: (tileMap.w - 4) * tileMap.tileSize,
        extractionY: 4 * tileMap.tileSize,
        extracted: false,
      }
      break
    case 'convoy':
      convoy = placeConvoy(tileMap, vehicles)
      break
    case 'race':
      raceState = placeRace(tileMap)
      break
    case 'survival':
      survivalState = {
        wave: 1, enemiesRemaining: 8, spawnTimer: 0,
        maxWaves: 10, waveSize: 8,
      }
      break
    case 'battle-royale':
      brState = createBRState(tileMap)
      break
    // deathmatch, team-deathmatch: no extra objectives
  }

  // ── Tickets ────────────────────────────────────────────
  const ticketCount = config.ticketsPerTeam ?? 100
  const tickets: [number, number] = [ticketCount, ticketCount]

  // ── Weapon loadouts ────────────────────────────────────
  const allWeapons = WEAPONS.map(w => w.name)
  const robberWeapons = ['Bandit Rifle', 'SMG', 'Shotgun', 'Bandit Pistol', 'Grenade']
  const copWeapons = ['Rifle', 'SMG', 'Shotgun', 'Sniper', 'Pistol', 'Flashbang']
  const dmWeapons = allWeapons

  function weaponsForTeam(team: number): string[] {
    if (mode === 'deathmatch' || mode === 'battle-royale') return mode === 'battle-royale' ? [...BR_STARTING_WEAPONS] : dmWeapons
    return team === 0 ? robberWeapons : copWeapons
  }

  // ── Soldiers (human players) ───────────────────────────
  const soldiers: Soldier[] = []
  for (let i = 0; i < players.length; i++) {
    const team = (mode === 'deathmatch' || mode === 'battle-royale') ? i : (mode === 'coop-assault' || mode === 'survival' ? 0 : i % 2)
    const pos = spawnPos(team, capturePoints, tileMap)
    soldiers.push({
      x: pos.x, y: pos.y,
      angle: randomBetween(0, Math.PI * 2), pitch: 0,
      hp: SOLDIER_HP, maxHp: SOLDIER_HP, alive: true,
      team, playerIndex: players[i].index, name: players[i].name,
      input: players[i].input,
      isBot: players[i].input.type === 'keyboard' && (players[i].input as { type: 'keyboard'; group: number }).group === -1,
      kills: 0, deaths: 0, captures: 0, score: 0,
      respawnTimer: 0, vehicleIndex: -1,
      color: players[i].color || PLAYER_COLORS[players[i].index] || '#fff',
      coins: 0, gems: 0, stars: 0,
      weaponIndex: 0, weapons: weaponsForTeam(team),
      armor: 0, killStreak: 0, isSprinting: false, posture: 'stand',
      bleeding: false, bleedRate: 0, isBandaging: false, bandageProgress: 0, bandages: 3,
      loadout: {},
      isAiming: false, adsFov: 75, adsStaminaDrain: false,
      aimAssist: players[i].input.type === 'gamepad' ? 'semi' : 'none',
      aimAssistTarget: -1,
      sensitivity: 5,
      isVip: mode === 'escort' && i === 0 ? true : undefined,
      brEliminated: false,
      cameraPerspective: 'fpp',
    })
  }

  // ── Bots ───────────────────────────────────────────────
  const botCount = Math.min(
    config._botCount ?? config.botCount ?? Math.max(4, capturePoints.length * 2),
    mode === 'battle-royale' ? 30 : 7,
  )

  for (let i = 0; i < botCount; i++) {
    const team = (mode === 'deathmatch' || mode === 'battle-royale')
      ? (mode === 'battle-royale' ? players.length + i : i % Math.max(2, players.length + i))
      : (mode === 'coop-assault' || mode === 'survival' ? 1 : i % 2)
    const pos = spawnPos(team, capturePoints, tileMap)
    soldiers.push({
      x: pos.x, y: pos.y,
      angle: randomBetween(0, Math.PI * 2), pitch: 0,
      hp: SOLDIER_HP, maxHp: SOLDIER_HP, alive: true,
      team, playerIndex: 100 + i, name: `Bot ${i + 1}`,
      input: { type: 'keyboard', group: -1 },
      isBot: true,
      kills: 0, deaths: 0, captures: 0, score: 0,
      respawnTimer: 0, vehicleIndex: -1,
      color: mode === 'battle-royale' ? PLAYER_COLORS[(players.length + i) % PLAYER_COLORS.length] || '#aaa' : (team === 0 ? '#ff6655' : '#5588ff'),
      coins: 0, gems: 0, stars: 0,
      weaponIndex: 0, weapons: weaponsForTeam(team),
      armor: 0, killStreak: 0, isSprinting: false, posture: 'stand',
      bleeding: false, bleedRate: 0, isBandaging: false, bandageProgress: 0, bandages: 3,
      loadout: {},
      isAiming: false, adsFov: 75, adsStaminaDrain: false,
      aimAssist: 'none', aimAssistTarget: -1,
      sensitivity: 5,
      brEliminated: false,
    })
  }

  // Mark first soldier on team 0 as VIP (for escort)
  if (mode === 'escort') {
    const vipSoldier = soldiers.find(s => s.team === 0)
    if (vipSoldier) vipSoldier.isVip = true
  }

  // Race: put every player in a vehicle
  if (mode === 'race' && raceState) {
    const rcDef = VEHICLE_DEFS.police_car
    for (let i = 0; i < soldiers.length; i++) {
      const cp = raceState.checkpoints[0]
      const vx = cp.x + randomBetween(-TILE_SIZE * 2, TILE_SIZE * 2)
      const vy = cp.y + randomBetween(-TILE_SIZE * 2, TILE_SIZE * 2)
      vehicles.push({
        x: vx, y: vy, type: rcDef.type, model: rcDef.model,
        alive: true, hp: rcDef.hp, maxHp: rcDef.maxHp,
        respawnTimer: 0, rider: soldiers[i].playerIndex,
        angle: 0, team: soldiers[i].team, spawnX: vx, spawnY: vy,
      })
      soldiers[i].vehicleIndex = vehicles.length - 1
      raceState.progress.set(soldiers[i].playerIndex, { lap: 0, nextCp: 0 })
    }
  }

  const targetKills = mode === 'deathmatch' ? 30 : mode === 'team-deathmatch' ? 50 : 0

  // Set BR alive count
  if (brState) {
    brState.aliveCount = soldiers.length
    brState.totalCount = soldiers.length
  }

  return {
    soldiers, bullets: [],
    capturePoints, vehicles,
    buildings, props, roads: [],
    pickups,
    tickets, killFeed: [], frame: 0,
    gameOver: false, winTeam: -1,
    mode, targetKills,
    tileMap, mapName: preset.id,
    bombSites, lootBags, lootExtraction,
    flags, vip, convoy, raceState, survivalState, brState,
    round: 1, roundScore: [0, 0],
    maxRounds: mode === 'bomb' || mode === 'heist' ? 6 : undefined,
  }
}

