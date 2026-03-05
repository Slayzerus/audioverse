import type { GameConfig } from '../../pages/games/mini/types'
/**
 * mapGenerator.ts - Procedural world-map generation.
 *
 * Generates terrain, places towns, mines, treasures, neutral armies, and map objects.
 */
import type {
  WorldMap, MapCell, Terrain, MapObject, MapObjectType, ResourceMine,
  TreasureCache, Town, FactionId, CreatureStack, ResourceBundle,
} from './types'
import { EMPTY_RESOURCES } from './types'
import { MAP_SIZES } from './constants'
import { ALL_CREATURES, getCreaturesForFaction } from './factions'
import { getInitialBuildings } from './buildings'
import { pickRandomArtifact } from './items'

// =================================================================
//  NOISE HELPERS
// =================================================================
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

/** Simple 2D value noise for terrain generation */
function valueNoise(cols: number, rows: number, scale: number, rand: () => number): number[][] {
  const gw = Math.ceil(cols / scale) + 2
  const gh = Math.ceil(rows / scale) + 2
  const grid: number[][] = Array.from({ length: gh }, () =>
    Array.from({ length: gw }, () => rand())
  )

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t
  const smooth = (t: number) => t * t * (3 - 2 * t)

  const noise: number[][] = []
  for (let r = 0; r < rows; r++) {
    const row: number[] = []
    for (let c = 0; c < cols; c++) {
      const fx = c / scale
      const fy = r / scale
      const ix = Math.floor(fx)
      const iy = Math.floor(fy)
      const tx = smooth(fx - ix)
      const ty = smooth(fy - iy)
      const v = lerp(
        lerp(grid[iy][ix], grid[iy][ix + 1], tx),
        lerp(grid[iy + 1][ix], grid[iy + 1][ix + 1], tx),
        ty,
      )
      row.push(v)
    }
    noise.push(row)
  }
  return noise
}

// =================================================================
//  MAP GENERATION
// =================================================================
export interface MapGenOptions {
  mapSizeKey: 'small' | 'medium' | 'large'
  playerCount: number
  factions: FactionId[]
  seed?: number
}

export function generateWorldMap(opts: MapGenOptions): {
  map: WorldMap
  towns: Town[]
  mines: ResourceMine[]
  treasures: TreasureCache[]
  mapObjects: MapObject[]
  heroStartPositions: { playerId: number; x: number; y: number }[]
} {
  const { cols, rows } = MAP_SIZES[opts.mapSizeKey]
  const seed = opts.seed ?? Math.floor(Math.random() * 999999)
  const rand = seededRandom(seed)

  // -- Generate terrain --
  const terrainNoise = valueNoise(cols, rows, 6, rand)
  const moistureNoise = valueNoise(cols, rows, 8, rand)

  const cells: MapCell[][] = []
  for (let r = 0; r < rows; r++) {
    const row: MapCell[] = []
    for (let c = 0; c < cols; c++) {
      const h = terrainNoise[r][c]
      const m = moistureNoise[r][c]
      let terrain: Terrain
      if (h < 0.18) terrain = 'water'
      else if (h < 0.25) terrain = 'sand'
      else if (h < 0.5) terrain = m > 0.6 ? 'forest' : 'grass'
      else if (h < 0.65) terrain = m > 0.6 ? 'swamp' : 'dirt'
      else if (h < 0.8) terrain = 'mountain'
      else terrain = rand() > 0.5 ? 'snow' : 'lava'

      row.push({
        terrain,
        explored: Array.from({ length: opts.playerCount }, () => false),
        objectId: null,
        building: null,
      })
    }
    cells.push(row)
  }

  const map: WorldMap = { cols, rows, cells }

  // -- Place starting towns (one per player) with clearings --
  const towns: Town[] = []
  const heroStartPositions: { playerId: number; x: number; y: number }[] = []
  const usedCells = new Set<string>()

  const corners = [
    { x: 2, y: 2 },
    { x: cols - 3, y: rows - 3 },
    { x: cols - 3, y: 2 },
    { x: 2, y: rows - 3 },
  ]

  for (let p = 0; p < opts.playerCount; p++) {
    const pos = corners[p % corners.length]
    const faction = opts.factions[p] || 'castle'

    // Clear area around town
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = pos.x + dx
        const ny = pos.y + dy
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          cells[ny][nx].terrain = 'grass'
          cells[ny][nx].explored[p] = true
          usedCells.add(`${nx},${ny}`)
        }
      }
    }

    const townId = `town_${p}`
    cells[pos.y][pos.x].objectId = townId
    cells[pos.y][pos.x].building = 'town'

    const creaturePool: { creatureId: string; available: number }[] = []
    const fCreatures = getCreaturesForFaction(faction)
    for (const c of fCreatures) {
      creaturePool.push({ creatureId: c.id, available: c.growth })
    }

    towns.push({
      id: townId,
      name: `${faction.charAt(0).toUpperCase() + faction.slice(1)} Town`,
      faction,
      owner: p,
      x: pos.x,
      y: pos.y,
      buildings: getInitialBuildings(faction),
      creaturePool,
      garrison: [null, null, null, null, null, null, null],
      visitingHeroId: null,
      fortLevel: 0,
      mageGuildLevel: 0,
    })

    // Hero starts adjacent to town
    heroStartPositions.push({ playerId: p, x: pos.x + 1, y: pos.y })
  }

  // -- Place resource mines --
  const mines: ResourceMine[] = []
  const resourceTypes: Array<keyof ResourceBundle> = ['gold', 'wood', 'ore', 'crystals', 'gems', 'mercury', 'sulfur']
  const mineCount = Math.floor(cols * rows * 0.02)

  for (let i = 0; i < mineCount; i++) {
    let tries = 0
    while (tries < 50) {
      const mx = Math.floor(rand() * cols)
      const my = Math.floor(rand() * rows)
      const key = `${mx},${my}`
      if (!usedCells.has(key) && cells[my][mx].terrain !== 'water' && cells[my][mx].terrain !== 'mountain') {
        usedCells.add(key)
        const rType = resourceTypes[Math.floor(rand() * resourceTypes.length)]
        const mineId = `mine_${i}`
        cells[my][mx].objectId = mineId

        // Neutral guard
        const guardStr = 3 + Math.floor(rand() * 5)
        const guardCreatures = Object.values(ALL_CREATURES).filter(c => c.tier <= 3)
        const guardCreature = guardCreatures[Math.floor(rand() * guardCreatures.length)]
        const guardArmy: (CreatureStack | null)[] = Array(7).fill(null)
        guardArmy[0] = {
          creatureId: guardCreature.id, count: guardStr,
          statusEffects: [], morale: 0, luck: 0, hasActed: false, hasRetaliated: false, shotsLeft: guardCreature.shots,
        }

        mines.push({
          id: mineId,
          resourceType: rType,
          x: mx, y: my,
          owner: null,
          guardArmy: guardArmy,
        })
        break
      }
      tries++
    }
  }

  // -- Place treasures --
  const treasures: TreasureCache[] = []
  const treasureCount = Math.floor(cols * rows * 0.03)

  for (let i = 0; i < treasureCount; i++) {
    let tries = 0
    while (tries < 50) {
      const tx = Math.floor(rand() * cols)
      const ty = Math.floor(rand() * rows)
      const key = `${tx},${ty}`
      if (!usedCells.has(key) && cells[ty][tx].terrain !== 'water') {
        usedCells.add(key)
        const tid = `treasure_${i}`
        cells[ty][tx].objectId = tid

        const kind = rand()
        const resources: ResourceBundle = { ...EMPTY_RESOURCES }
        let artifact: string | null = null

        if (kind < 0.5) {
          resources.gold = 500 + Math.floor(rand() * 1500)
        } else if (kind < 0.75) {
          const rt = resourceTypes[Math.floor(rand() * resourceTypes.length)]
          ;resources[rt] = 3 + Math.floor(rand() * 8)
        } else {
          artifact = pickRandomArtifact('rare').id
          resources.gold = 200 + Math.floor(rand() * 500)
        }

        treasures.push({ id: tid, x: tx, y: ty, resources, artifactId: artifact, collected: false })
        break
      }
      tries++
    }
  }

  // -- Place map objects (neutral armies, shrines, wells, etc.) --
  const mapObjects: MapObject[] = []
  const objectTypes: MapObjectType[] = [
    'neutral_army', 'neutral_army', // weighted: more armies
    'shrine', 'well', 'learning_stone', 'arena', 'fountain', 'windmill',
    'temple', 'obelisk', 'garden', 'witch_hut', 'den', 'tavern',
    'quest_hut', 'dragon_utopia', 'prison', 'refugee_camp',
  ]
  const objectCount = Math.floor(cols * rows * 0.03)

  for (let i = 0; i < objectCount; i++) {
    let tries = 0
    while (tries < 50) {
      const ox = Math.floor(rand() * cols)
      const oy = Math.floor(rand() * rows)
      const key = `${ox},${oy}`
      if (!usedCells.has(key) && cells[oy][ox].terrain !== 'water') {
        usedCells.add(key)
        const oid = `obj_${i}`
        cells[oy][ox].objectId = oid
        const objType = objectTypes[Math.floor(rand() * objectTypes.length)]

        let army: (CreatureStack | null)[] | undefined
        const data: GameConfig = {}
        if (objType === 'neutral_army') {
          const str = 2 + Math.floor(rand() * 10)
          const tier = 1 + Math.floor(rand() * 4)
          const creatures = Object.values(ALL_CREATURES).filter(c => c.tier <= tier)
          const creature = creatures[Math.floor(rand() * creatures.length)]
          army = Array(7).fill(null)
          army[0] = {
            creatureId: creature.id, count: str,
            statusEffects: [], morale: 0, luck: 0, hasActed: false, hasRetaliated: false, shotsLeft: creature.shots,
          }
        } else if (objType === 'shrine') {
          // Give a random spell
          const spellIds = ['magic_arrow', 'haste', 'slow', 'bless', 'stoneskin', 'cure', 'lightning', 'fireball']
          data.spellId = spellIds[Math.floor(rand() * spellIds.length)]
        } else if (objType === 'den') {
          // Monster den with tough guards but good loot
          const tier = 4 + Math.floor(rand() * 3)
          const creatures = Object.values(ALL_CREATURES).filter(c => c.tier <= tier && c.tier >= 3)
          const creature = creatures[Math.floor(rand() * creatures.length)]
          const str = 5 + Math.floor(rand() * 8)
          army = Array(7).fill(null)
          army[0] = {
            creatureId: creature.id, count: str,
            statusEffects: [], morale: 0, luck: 0, hasActed: false, hasRetaliated: false, shotsLeft: creature.shots,
          }
          data.goldReward = 1500 + Math.floor(rand() * 3000)
        } else if (objType === 'dragon_utopia') {
          // Very strong guards, huge reward
          const dragons = Object.values(ALL_CREATURES).filter(c => c.tier === 7)
          const dragon = dragons[Math.floor(rand() * dragons.length)]
          army = Array(7).fill(null)
          army[0] = {
            creatureId: dragon.id, count: 2 + Math.floor(rand() * 4),
            statusEffects: [], morale: 0, luck: 0, hasActed: false, hasRetaliated: false, shotsLeft: dragon.shots,
          }
          data.goldReward = 10000 + Math.floor(rand() * 15000)
          data.xpReward = 5000
        } else if (objType === 'quest_hut') {
          // Quest: kill X enemy stacks or visit X objects
          const questTypes = ['kill_neutrals', 'collect_gold', 'visit_obelisks']
          const qt = questTypes[Math.floor(rand() * questTypes.length)]
          data.questType = qt
          data.questTarget = qt === 'collect_gold' ? 5000 + Math.floor(rand() * 5000) : 3 + Math.floor(rand() * 3)
          data.questProgress = 0
          data.questRewardGold = 3000 + Math.floor(rand() * 4000)
          data.questRewardXP = 2000
          data.questComplete = false
        } else if (objType === 'prison') {
          // Contains a captured hero to rescue
          data.heroFaction = (['castle', 'rampart', 'tower', 'wilds'] as FactionId[])[Math.floor(rand() * 4)]
        } else if (objType === 'refugee_camp') {
          // Offers free creatures to recruit
          const tier = 1 + Math.floor(rand() * 3)
          const creatures = Object.values(ALL_CREATURES).filter(c => c.tier === tier)
          const creature = creatures[Math.floor(rand() * creatures.length)]
          data.creatureId = creature.id
          data.count = creature.growth + Math.floor(rand() * creature.growth)
        } else if (objType === 'witch_hut') {
          // Teaches a random secondary skill
          const skillIds = ['archery', 'offense', 'armorer', 'leadership', 'logistics', 'scouting', 'estates', 'learning']
          data.skillId = skillIds[Math.floor(rand() * skillIds.length)]
        } else if (objType === 'garden') {
          // Gives movement points and morale
          data.movementBonus = 3
          data.moraleBonus = 1
        } else if (objType === 'temple') {
          // Gives morale bonus
          data.moraleBonus = 2
        } else if (objType === 'tavern') {
          // Can hire heroes (future feature hint)
          data.canHire = true
        }

        mapObjects.push({
          id: oid,
          type: objType,
          x: ox, y: oy,
          army: army || undefined,
          visited: false,
          data,
        })
        break
      }
      tries++
    }
  }

  // -- Place roads connecting towns --
  for (let i = 0; i < towns.length; i++) {
    for (let j = i + 1; j < towns.length; j++) {
      placeRoad(cells, towns[i].x, towns[i].y, towns[j].x, towns[j].y, cols, rows)
    }
  }

  return { map, towns, mines, treasures, mapObjects, heroStartPositions }
}

/** Simple A* road placement */
function placeRoad(cells: MapCell[][], x1: number, y1: number, x2: number, y2: number, cols: number, rows: number) {
  let cx = x1, cy = y1
  const maxSteps = cols + rows
  for (let step = 0; step < maxSteps; step++) {
    if (cx === x2 && cy === y2) break
    const dx = x2 - cx
    const dy = y2 - cy

    if (Math.abs(dx) > Math.abs(dy)) {
      cx += dx > 0 ? 1 : -1
    } else {
      cy += dy > 0 ? 1 : -1
    }

    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows) {
      const cell = cells[cy][cx]
      if (cell.terrain !== 'water' && cell.terrain !== 'mountain' && !cell.objectId) {
        cell.terrain = 'road'
      }
    }
  }
}

/** Reveal fog of war around a position */
export function revealFog(map: WorldMap, x: number, y: number, radius: number, playerId: number) {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx
      const ny = y + dy
      if (nx >= 0 && nx < map.cols && ny >= 0 && ny < map.rows) {
        if (dx * dx + dy * dy <= radius * radius) {
          map.cells[ny][nx].explored[playerId] = true
        }
      }
    }
  }
}

/** Check if a cell is passable for hero movement */
export function isPassable(map: WorldMap, x: number, y: number): boolean {
  if (x < 0 || x >= map.cols || y < 0 || y >= map.rows) return false
  const terrain = map.cells[y][x].terrain
  return terrain !== 'water' && terrain !== 'mountain'
}

/** Get movement cost for a terrain type */
export function getMovementCost(terrain: Terrain, pathfindingLevel: number): number {
  const baseCosts: Record<Terrain, number> = {
    grass: 1, road: 0.7, dirt: 1, sand: 1.5, forest: 1.5,
    swamp: 2, snow: 1.5, lava: 2, water: 999, mountain: 999,
  }
  const cost = baseCosts[terrain] || 1
  if (cost > 1 && pathfindingLevel > 0) {
    const reduction = pathfindingLevel * 0.25
    return Math.max(1, cost * (1 - reduction))
  }
  return cost
}
