import type { GameConfig } from '../../pages/games/mini/types'
import { type PlayerSlot } from '../../pages/games/mini/types'
import { FACTION_COLORS } from '../../common/sprites/TinySwordsAssets'
import type {
  GameState, Commander, Building, ResourceNode, Decoration,
  PlayerState, Unit, EnemyUnit, Projectile, Effect, Camera, FloatingText,
} from './types'
import { BUILDING_DEFS, VIEWPORT_W, VIEWPORT_H } from './types'
import { getMapById, randomMap } from './maps'

let _nextId = 1
function nextId() { return _nextId++ }

/** Check whether a point is inside any water area (used to avoid placing things in water) */
function inWater(x: number, y: number, waterAreas: { x: number; y: number; w: number; h: number }[], margin = 20): boolean {
  return waterAreas.some(wa =>
    x > wa.x - margin && x < wa.x + wa.w + margin &&
    y > wa.y - margin && y < wa.y + wa.h + margin
  )
}

/** Place items randomly within a circle, avoiding water */
function scatterInZone(
  cx: number, cy: number, radius: number, count: number,
  waterAreas: { x: number; y: number; w: number; h: number }[],
  mapW: number, mapH: number,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  let attempts = 0
  while (pts.length < count && attempts < count * 10) {
    const angle = Math.random() * Math.PI * 2
    const dist = Math.random() * radius
    const x = Math.max(60, Math.min(mapW - 60, cx + Math.cos(angle) * dist))
    const y = Math.max(60, Math.min(mapH - 60, cy + Math.sin(angle) * dist))
    if (!inWater(x, y, waterAreas)) pts.push({ x, y })
    attempts++
  }
  return pts
}

export function initState(players: PlayerSlot[], config: GameConfig): GameState {
  _nextId = 1
  const startGold = Number(config.startingGold) || 50
  const startWood = Number(config.startingWood) || 30
  const startMeat = Number(config.startingMeat) || 20
  const coop = config.gameMode === 'coop-campaign' || config.gameMode === 'survival'

  // Select map
  const map = config.mapId === 'random'
    ? randomMap()
    : config.mapId
      ? getMapById(config.mapId)
      : randomMap()

  const mapW = map.worldW
  const mapH = map.worldH
  const waterAreas = map.waterAreas ?? []

  const commanders: Commander[] = []
  const buildings: Building[] = []
  const pStates: PlayerState[] = []
  const cameras: Camera[] = []

  players.forEach((p, i) => {
    const sp = map.spawnPoints[i % map.spawnPoints.length]
    const fc = FACTION_COLORS[i % FACTION_COLORS.length]

    commanders.push({
      x: sp.x, y: sp.y, owner: i,
      factionColor: fc, facingLeft: false, animTick: 0,
    })

    buildings.push({
      id: nextId(), x: sp.x, y: sp.y,
      hp: BUILDING_DEFS.castle.hp, maxHp: BUILDING_DEFS.castle.hp,
      kind: 'castle', owner: i, buildProgress: 1,
      trainQueue: [], trainProgress: 0,
    })

    pStates.push({
      gold: startGold, wood: startWood, meat: startMeat,
      stars: 0, alive: true,
      name: p.name, factionColor: fc,
      selectedBuild: 0, selectedUnit: 0,
    })

    // Camera centered on spawn
    cameras.push({
      x: Math.max(0, sp.x - VIEWPORT_W / 2),
      y: Math.max(0, sp.y - VIEWPORT_H / 2),
      vw: VIEWPORT_W, vh: VIEWPORT_H,
    })
  })

  // ─── Resources from map definition ──────────────────────
  const resourceNodes: ResourceNode[] = []
  for (const zone of map.resourceZones) {
    const pts = scatterInZone(zone.cx, zone.cy, zone.radius, zone.count, waterAreas, mapW, mapH)
    for (const pt of pts) {
      resourceNodes.push({
        id: nextId(),
        x: pt.x, y: pt.y,
        kind: zone.kind,
        amount: zone.amountEach,
        maxAmount: zone.amountEach,
        variant: Math.floor(Math.random() * 6),
      })
    }
  }

  // ─── Decorations from map definition ────────────────────
  const decorations: Decoration[] = []
  for (const dz of map.decoZones) {
    const pts = scatterInZone(dz.cx, dz.cy, dz.radius, dz.count, waterAreas, mapW, mapH)
    for (const pt of pts) {
      decorations.push({
        x: pt.x, y: pt.y,
        kind: dz.kind,
        variant: Math.floor(Math.random() * (dz.kind === 'deco' ? 18 : 4)),
        scale: 0.5 + Math.random() * 0.5,
      })
    }
  }

  // Clouds (always present)
  const cloudCount = Math.max(4, Math.floor((mapW * mapH) / 800000))
  for (let i = 0; i < cloudCount; i++) {
    decorations.push({
      x: Math.random() * mapW,
      y: Math.random() * mapH * 0.4,
      kind: 'cloud',
      variant: Math.floor(Math.random() * 8),
      scale: 0.8 + Math.random() * 0.4,
    })
  }

  // Rubber duck easter egg
  const duckPt = scatterInZone(mapW / 2, mapH / 2, 200, 1, waterAreas, mapW, mapH)
  if (duckPt.length > 0) {
    decorations.push({ x: duckPt[0].x, y: duckPt[0].y, kind: 'rubberDuck', variant: 0, scale: 0.7 })
  }

  const state: GameState = {
    commanders,
    units: [] as Unit[],
    enemyUnits: [] as EnemyUnit[],
    buildings,
    resourceNodes,
    projectiles: [] as Projectile[],
    decorations,
    effects: [] as Effect[],
    floatingTexts: [] as FloatingText[],
    players: pStates,
    cameras,
    gameOver: false, winnerIdx: null,
    tick: 0, coop,
    nextId: _nextId,
    mapW, mapH,
    mapId: map.id,
    terrainType: map.terrainType,
    waterAreas,
    waveTimer: 0, waveNumber: 0,
  }

  // Give each player 2 starting pawns
  for (let pi = 0; pi < players.length; pi++) {
    const sp = map.spawnPoints[pi % map.spawnPoints.length]
    for (let u = 0; u < 2; u++) {
      state.units.push({
        id: state.nextId++,
        x: sp.x + 30 + u * 20, y: sp.y + 40,
        hp: 5, maxHp: 5, dmg: 1, speed: 2.2, range: 32, r: 8,
        kind: 'pawn', owner: pi,
        target: null, attackTarget: null,
        facingLeft: false, animState: 'idle', animTick: 0,
        gatherTarget: null, carrying: null, carryAmount: 0,
      })
    }
  }

  return state
}
