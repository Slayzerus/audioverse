/**
 * adventureRenderer.ts — Renders the world/adventure map on canvas.
 *
 * Terrain tiles, heroes, towns, mines, treasures, map objects, fog of war.
 * Uses Tiny Swords sprites when available, falls back to colored rectangles.
 */
import type { GameState, Hero, Town, Terrain, MapObject, ResourceMine, TreasureCache } from './types'
import { TILE_PX, CANVAS_W, CANVAS_H, TERRAIN_COLORS, RESOURCE_ICONS } from './constants'
import { FACTIONS } from './factions'
import { lighten, darken } from './helpers'
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'
import {
  drawTerrainTile as drawSpriteTerrain,
  drawWaterAnim,
  drawTree,
  drawDecoration,
  drawCastle,
  drawUnit,
  drawEnemy,
  drawGoldMine,
  factionToColor,
  playerToColor,
  creatureToSpriteUnit,
  creatureToEnemySprite,
} from './sprites'

// ═════════════════════════════════════════════════════════════
//  CAMERA
// ═════════════════════════════════════════════════════════════
export interface Camera {
  x: number  // pixel offset
  y: number
}

export function centerCameraOnHero(hero: Hero, mapCols: number, mapRows: number): Camera {
  const viewW = CANVAS_W
  const viewH = CANVAS_H - 52 // minus HUD bars
  return {
    x: Math.max(0, Math.min(hero.x * TILE_PX - viewW / 2 + TILE_PX / 2, mapCols * TILE_PX - viewW)),
    y: Math.max(0, Math.min(hero.y * TILE_PX - viewH / 2 + TILE_PX / 2, mapRows * TILE_PX - viewH)),
  }
}

export function clampCamera(cam: Camera, mapCols: number, mapRows: number): Camera {
  const maxX = Math.max(0, mapCols * TILE_PX - CANVAS_W)
  const maxY = Math.max(0, mapRows * TILE_PX - (CANVAS_H - 52))
  return {
    x: Math.max(0, Math.min(cam.x, maxX)),
    y: Math.max(0, Math.min(cam.y, maxY)),
  }
}

// ═════════════════════════════════════════════════════════════
//  TERRAIN
// ═════════════════════════════════════════════════════════════
const TERRAIN_DETAIL: Record<Terrain, { emoji?: string; pattern?: 'dots' | 'lines' | 'cross' }> = {
  grass: {},
  forest: { emoji: '🌲' },
  mountain: { emoji: '⛰' },
  water: { pattern: 'lines' },
  road: { pattern: 'dots' },
  sand: {},
  swamp: { emoji: '🌿' },
  snow: {},
  lava: { emoji: '🔥' },
  dirt: {},
}

function drawTerrainTileFallback(ctx: CanvasRenderingContext2D, terrain: Terrain, px: number, py: number) {
  const color = TERRAIN_COLORS[terrain] || '#333'
  ctx.fillStyle = color
  ctx.fillRect(px, py, TILE_PX, TILE_PX)

  // Grid lines
  ctx.strokeStyle = darken(color, 0.2)
  ctx.lineWidth = 0.5
  ctx.strokeRect(px, py, TILE_PX, TILE_PX)

  // Detail
  const detail = TERRAIN_DETAIL[terrain]
  if (detail?.emoji) {
    ctx.font = `${TILE_PX - 8}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(detail.emoji, px + TILE_PX / 2, py + TILE_PX / 2)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }
  if (detail?.pattern === 'lines') {
    ctx.strokeStyle = lighten(color, 0.15)
    ctx.lineWidth = 0.5
    for (let i = 4; i < TILE_PX; i += 6) {
      ctx.beginPath()
      ctx.moveTo(px, py + i)
      ctx.lineTo(px + TILE_PX, py + i)
      ctx.stroke()
    }
  }
  if (detail?.pattern === 'dots') {
    ctx.fillStyle = darken(color, 0.15)
    for (let dy = 6; dy < TILE_PX; dy += 8) {
      for (let dx = 6; dx < TILE_PX; dx += 8) {
        ctx.fillRect(px + dx, py + dy, 2, 2)
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════
//  MAP RENDERING
// ═════════════════════════════════════════════════════════════
export function drawAdventureMap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camera: Camera,
  selectedHeroId: string | null,
  hoveredTile: { col: number; row: number } | null,
  spr?: TinySwordsSprites | null,
  tick = 0,
) {
  const mapH = CANVAS_H - 52 // top bar + bottom bar
  const offsetY = 24 // below resource bar

  ctx.save()
  ctx.beginPath()
  ctx.rect(0, offsetY, CANVAS_W, mapH)
  ctx.clip()
  ctx.translate(-camera.x, -camera.y + offsetY)

  const playerId = state.turn.currentPlayer
  const startCol = Math.max(0, Math.floor(camera.x / TILE_PX))
  const startRow = Math.max(0, Math.floor(camera.y / TILE_PX))
  const endCol = Math.min(state.map.cols, startCol + Math.ceil(CANVAS_W / TILE_PX) + 1)
  const endRow = Math.min(state.map.rows, startRow + Math.ceil(mapH / TILE_PX) + 1)

  // ── Terrain tiles ──
  for (let r = startRow; r < endRow; r++) {
    for (let c = startCol; c < endCol; c++) {
      const cell = state.map.cells[r][c]
      const px = c * TILE_PX
      const py = r * TILE_PX

      if (!cell.explored[playerId]) {
        // Fog of war — dark
        ctx.fillStyle = '#1a1a2e'
        ctx.fillRect(px, py, TILE_PX, TILE_PX)
        continue
      }

      if (spr?.loaded) {
        drawSpriteTerrain(ctx, spr, cell.terrain, px, py, TILE_PX, c, r)
        if (cell.terrain === 'water') {
          drawWaterAnim(ctx, spr, px, py, TILE_PX, tick)
        }
        // Forest decoration: draw tree on top
        if (cell.terrain === 'forest') {
          drawTree(ctx, spr, px, py, TILE_PX, (c * 3 + r * 7) % 8)
        }
      } else {
        drawTerrainTileFallback(ctx, cell.terrain, px, py)
      }
    }
  }

  // ── Decorations (sprite-only, scattered bushes/rocks) ──
  if (spr?.loaded) {
    for (let r = startRow; r < endRow; r++) {
      for (let c = startCol; c < endCol; c++) {
        const cell = state.map.cells[r][c]
        if (!cell.explored[playerId]) continue
        const hash = (c * 31 + r * 17) % 100
        if (cell.terrain === 'grass' && hash < 8) {
          drawDecoration(ctx, spr, 'bush', c * TILE_PX, r * TILE_PX, TILE_PX * 0.7, hash)
        } else if (cell.terrain === 'mountain' && hash < 12) {
          drawDecoration(ctx, spr, 'rock', c * TILE_PX, r * TILE_PX, TILE_PX * 0.8, hash)
        }
      }
    }
  }

  // ── Map Objects ──
  for (const obj of state.mapObjects) {
    if (!state.map.cells[obj.y]?.[obj.x]?.explored[playerId]) continue
    drawMapObject(ctx, obj, spr, tick)
  }

  // ── Mines ──
  for (const mine of state.mines) {
    if (!state.map.cells[mine.y]?.[mine.x]?.explored[playerId]) continue
    drawMine(ctx, mine, playerId, spr)
  }

  // ── Treasures ──
  for (const treasure of state.treasures) {
    if (treasure.collected) continue
    if (!state.map.cells[treasure.y]?.[treasure.x]?.explored[playerId]) continue
    drawTreasure(ctx, treasure, spr)
  }

  // ── Towns ──
  for (const town of state.towns) {
    if (!state.map.cells[town.y]?.[town.x]?.explored[playerId]) continue
    drawTown(ctx, town, playerId, spr)
  }

  // ── Heroes ──
  for (const hero of state.heroes) {
    if (!hero.alive) continue
    if (!state.map.cells[hero.y]?.[hero.x]?.explored[playerId]) continue
    drawHero(ctx, hero, hero.id === selectedHeroId, playerId, spr, tick)
  }

  // ── Hover highlight ──
  if (hoveredTile) {
    const hx = hoveredTile.col * TILE_PX
    const hy = hoveredTile.row * TILE_PX
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.strokeRect(hx + 1, hy + 1, TILE_PX - 2, TILE_PX - 2)
  }

  ctx.restore()
}

// ═════════════════════════════════════════════════════════════
//  INDIVIDUAL OBJECT DRAWING
// ═════════════════════════════════════════════════════════════
function drawHero(ctx: CanvasRenderingContext2D, hero: Hero, selected: boolean, viewerId: number, spr?: TinySwordsSprites | null, tick = 0) {
  const px = hero.x * TILE_PX
  const py = hero.y * TILE_PX
  const faction = FACTIONS[hero.faction]
  const color = faction?.color || '#888'

  if (spr?.loaded) {
    // Draw hero as animated warrior unit
    const fc = factionToColor(hero.faction)
    const unitType = hero.heroClass === 'cleric' ? 'monk' : 'warrior'
    drawUnit(ctx, spr, unitType, 'idle', fc, px - TILE_PX * 0.3, py - TILE_PX * 0.5, TILE_PX * 1.6, tick, false, 8)
    // Selection ring
    if (selected) {
      ctx.strokeStyle = 'rgba(100,200,255,0.8)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px + TILE_PX / 2, py + TILE_PX / 2, TILE_PX / 2 + 2, 0, Math.PI * 2)
      ctx.stroke()
    }
    // Player color indicator dot
    ctx.fillStyle = hero.owner === viewerId ? '#4a90d9' : '#cc3333'
    ctx.beginPath()
    ctx.arc(px + TILE_PX - 3, py + 3, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 1
    ctx.stroke()
    return
  }

  // Fallback: colored circle with letter

  // Circle background
  ctx.fillStyle = hero.owner === viewerId ? color : darken('#cc0000', 0.2)
  ctx.beginPath()
  ctx.arc(px + TILE_PX / 2, py + TILE_PX / 2, TILE_PX / 2 - 3, 0, Math.PI * 2)
  ctx.fill()

  // Border
  ctx.strokeStyle = selected ? '#fff' : 'rgba(0,0,0,0.5)'
  ctx.lineWidth = selected ? 2 : 1
  ctx.stroke()

  // Letter
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${TILE_PX - 12}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(hero.name[0], px + TILE_PX / 2, py + TILE_PX / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Selection glow
  if (selected) {
    ctx.strokeStyle = 'rgba(100,170,255,0.5)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(px + TILE_PX / 2, py + TILE_PX / 2, TILE_PX / 2, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawTown(ctx: CanvasRenderingContext2D, town: Town, viewerId: number, spr?: TinySwordsSprites | null) {
  const px = town.x * TILE_PX
  const py = town.y * TILE_PX
  const faction = FACTIONS[town.faction]
  const color = faction?.color || '#888'

  if (spr?.loaded) {
    const fc = town.owner !== null ? playerToColor(town.owner) : factionToColor(town.faction)
    drawCastle(ctx, spr, fc, px, py, TILE_PX)
    // Owner flag color
    if (town.owner !== null) {
      ctx.fillStyle = town.owner === viewerId ? '#4a90d9' : '#cc3333'
      ctx.fillRect(px + TILE_PX - 6, py - 2, 6, 4)
    }
    return
  }

  // Fallback

  // Castle shape
  ctx.fillStyle = town.owner === viewerId ? color : (town.owner !== null ? '#cc3333' : '#999')
  ctx.fillRect(px + 2, py + 4, TILE_PX - 4, TILE_PX - 6)

  // Battlements
  const bw = 4
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(px + 3 + i * (bw + 3), py, bw, 6)
  }

  ctx.strokeStyle = '#222'
  ctx.lineWidth = 1
  ctx.strokeRect(px + 2, py + 4, TILE_PX - 4, TILE_PX - 6)

  // Flag
  ctx.fillStyle = '#fff'
  ctx.font = '8px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('🏰', px + TILE_PX / 2, py + TILE_PX / 2 + 4)
  ctx.textAlign = 'left'
}

function drawMine(ctx: CanvasRenderingContext2D, mine: ResourceMine, viewerId: number, spr?: TinySwordsSprites | null) {
  const px = mine.x * TILE_PX
  const py = mine.y * TILE_PX
  const icon = RESOURCE_ICONS[mine.resourceType] || '⛏'

  if (spr?.loaded && mine.resourceType === 'gold') {
    drawGoldMine(ctx, spr, px - TILE_PX * 0.25, py - TILE_PX * 0.25, TILE_PX, mine.owner !== null)
    return
  }

  // Fallback

  ctx.fillStyle = mine.owner === viewerId ? '#2a5a2a' : (mine.owner !== null ? '#5a2a2a' : '#3a3a3a')
  ctx.fillRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6)
  ctx.strokeStyle = '#666'
  ctx.strokeRect(px + 3, py + 3, TILE_PX - 6, TILE_PX - 6)

  ctx.font = `${TILE_PX - 10}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(icon, px + TILE_PX / 2, py + TILE_PX / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function drawTreasure(ctx: CanvasRenderingContext2D, treasure: TreasureCache, spr?: TinySwordsSprites | null) {
  const px = treasure.x * TILE_PX
  const py = treasure.y * TILE_PX

  if (spr?.loaded) {
    // Use gold resource sprite for treasure
    if (spr.goldResource) {
      ctx.drawImage(spr.goldResource, px, py - TILE_PX * 0.3, TILE_PX, TILE_PX * 1.3)
      return
    }
  }

  // Fallback

  ctx.font = `${TILE_PX - 8}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(treasure.artifactId ? '🏺' : '💰', px + TILE_PX / 2, py + TILE_PX / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}

function drawMapObject(ctx: CanvasRenderingContext2D, obj: MapObject, spr?: TinySwordsSprites | null, tick = 0) {
  const px = obj.x * TILE_PX
  const py = obj.y * TILE_PX

  // Sprite rendering for neutral armies (enemies)
  if (spr?.loaded && obj.type === 'neutral_army' && obj.army) {
    const firstStack = obj.army.find(s => s !== null)
    if (firstStack) {
      const enemyKey = creatureToEnemySprite(firstStack.creatureId)
      if (enemyKey) {
        drawEnemy(ctx, spr, enemyKey, 'idle', px - TILE_PX * 0.3, py - TILE_PX * 0.5, TILE_PX * 1.6, tick, false, 10)
        return
      }
      // Try as unit sprite
      const unitKey = creatureToSpriteUnit(firstStack.creatureId)
      if (unitKey) {
        drawUnit(ctx, spr, unitKey, 'idle', 'red', px - TILE_PX * 0.3, py - TILE_PX * 0.5, TILE_PX * 1.6, tick, false, 10)
        return
      }
    }
  }

  // Sprite rendering for special objects
  if (spr?.loaded) {
    if (obj.type === 'well' && spr.woodResource) {
      ctx.drawImage(spr.woodResource, px, py, TILE_PX, TILE_PX)
      return
    }
    if (obj.type === 'garden' && spr.bushes.length > 0) {
      ctx.drawImage(spr.bushes[0], px, py, TILE_PX, TILE_PX)
      return
    }
    if ((obj.type === 'shrine' || obj.type === 'obelisk') && spr.rocks.length > 0) {
      ctx.drawImage(spr.rocks[0], px - TILE_PX * 0.1, py - TILE_PX * 0.3, TILE_PX * 1.2, TILE_PX * 1.3)
      return
    }
  }

  // Fallback

  const OBJECT_ICONS: Record<string, string> = {
    neutral_army: '⚔',
    shrine: '⛩',
    well: '🔮',
    learning_stone: '📖',
    arena: '🏟',
    witch_hut: '🏚',
    garden: '🌸',
    obelisk: '🗿',
    mill: '🌾',
    sawmill: '🪵',
    ore_pit: '⛏',
    garrison: '🏛',
    portal: '🌀',
    quest_guard: '❓',
    town: '🏰',
  }

  const icon = OBJECT_ICONS[obj.type] || '?'
  if (obj.visited) {
    ctx.globalAlpha = 0.4
  }

  ctx.font = `${TILE_PX - 8}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(icon, px + TILE_PX / 2, py + TILE_PX / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 1
}
