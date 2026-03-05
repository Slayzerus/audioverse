/**
 * sprites.ts — Tiny Swords sprite integration for Game of Castles.
 *
 * Maps game concepts (terrain, creatures, buildings, enemies) to sprite assets.
 * Provides drawing helpers that accept TinySwordsSprites and render onto canvas.
 */
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'
import type { SpriteSheetData } from '../../common/sprites/SpriteSheet'
import { drawSpriteFrame, getFrameIndex } from '../../common/sprites/SpriteSheet'
import type { GameFactionColor } from '../../common/sprites/TinySwordsAssets'
import type { FactionId, CreatureId, Terrain } from './types'

// ═══════════════════════════════════════════════════════════════
//  FACTION → COLOR MAPPING
// ═══════════════════════════════════════════════════════════════
/** Map HoMM-style factions to Tiny Swords faction colors */
export function factionToColor(faction: FactionId): GameFactionColor {
  switch (faction) {
    case 'castle': return 'blue'
    case 'rampart': return 'purple'
    case 'tower': return 'yellow'
    case 'inferno': return 'red'
    case 'necropolis': return 'purple'
    case 'dungeon': return 'red'
    case 'wilds': return 'red'
    default: return 'blue'
  }
}

/** Player index → color (for simple 2-4 player mapping) */
export function playerToColor(playerIndex: number): GameFactionColor {
  const colors: GameFactionColor[] = ['blue', 'red', 'purple', 'yellow']
  return colors[playerIndex % colors.length]
}

// ═══════════════════════════════════════════════════════════════
//  TERRAIN TILE DRAWING
// ═══════════════════════════════════════════════════════════════

/**
 * The Tiny Swords tilemaps are 576×384 (9×6 grid of 64×64 tiles).
 * Each tile at (col, row) in the tilemap represents a terrain variant.
 * We pick tiles from the tilemap to draw terrain.
 *
 * Tilemap layout (approximate):
 * Top-left area: flat grass variants
 * Edges: terrain borders/transitions
 * Center: solid fill tiles
 */

/** Source tile coordinates in the 9×6 tilemap grid */
interface TileSrc {
  /** Column in tilemap (0-8) */
  col: number
  /** Row in tilemap (0-5) */
  row: number
  /** Which tilemap variant (0-4, corresponds to color1-color5) */
  variant: number
}

/** Map game terrain types to tilemap source coordinates */
export function terrainToTileSrc(terrain: Terrain, x: number, y: number): TileSrc {
  // Use position for pseudo-random variant selection
  const hash = ((x * 7 + y * 13) % 5)
  // Center tile of the tilemap (solid fill) is approximately (4,2)
  // We pick from the center area for solid tiles
  switch (terrain) {
    case 'grass':
      return { col: 3 + (hash % 3), row: 2, variant: 0 } // color1 = green
    case 'forest':
      return { col: 3 + (hash % 3), row: 2, variant: 0 } // same base, trees added on top
    case 'road':
      return { col: 4, row: 2, variant: 4 } // color5 = grey/brown
    case 'sand':
      return { col: 3 + (hash % 3), row: 2, variant: 3 } // color4 = sandy
    case 'dirt':
      return { col: 3 + (hash % 3), row: 2, variant: 4 } // color5 = brown
    case 'snow':
      return { col: 3 + (hash % 3), row: 2, variant: 1 } // color2 = light
    case 'swamp':
      return { col: 3 + (hash % 3), row: 2, variant: 2 } // color3 = dark green
    case 'lava':
      return { col: 3 + (hash % 3), row: 2, variant: 3 } // color4 = warm
    case 'mountain':
      return { col: 4, row: 2, variant: 4 } // solid dark
    case 'water':
      return { col: 4, row: 2, variant: 0 } // will be overridden by water drawing
    default:
      return { col: 4, row: 2, variant: 0 }
  }
}

/** Draw a terrain tile from the tilemap sprite sheets */
export function drawTerrainTile(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  terrain: Terrain,
  dx: number, dy: number,
  tileSize: number,
  mapX: number, mapY: number,
) {
  if (terrain === 'water') {
    // Water uses animated sprites or water background
    if (spr.waterBg) {
      ctx.drawImage(spr.waterBg, 0, 0, 64, 64, dx, dy, tileSize, tileSize)
    } else {
      ctx.fillStyle = '#2244aa'
      ctx.fillRect(dx, dy, tileSize, tileSize)
    }
    return
  }

  const src = terrainToTileSrc(terrain, mapX, mapY)
  const tilemap = spr.tilemaps[src.variant]
  if (tilemap) {
    // Extract 64×64 tile from tilemap
    const sx = src.col * 64
    const sy = src.row * 64
    ctx.drawImage(tilemap, sx, sy, 64, 64, dx, dy, tileSize, tileSize)
  } else if (spr.groundFlat) {
    // Fallback: use the flat ground tilemap
    ctx.drawImage(spr.groundFlat, 0, 0, 64, 64, dx, dy, tileSize, tileSize)
  }
}

/** Draw animated water overlay */
export function drawWaterAnim(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  tileSize: number,
  tick: number,
) {
  if (spr.waterAnim) {
    const fi = getFrameIndex(tick, spr.waterAnim.frameCount, 10)
    ctx.globalAlpha = 0.4
    drawSpriteFrame(ctx, spr.waterAnim, fi, dx, dy, tileSize, tileSize)
    ctx.globalAlpha = 1.0
  }
  if (spr.foam) {
    const fi = getFrameIndex(tick, spr.foam.frameCount, 12)
    ctx.globalAlpha = 0.6
    drawSpriteFrame(ctx, spr.foam, fi, dx, dy, tileSize, tileSize)
    ctx.globalAlpha = 1.0
  }
}

// ═══════════════════════════════════════════════════════════════
//  DECORATION DRAWING
// ═══════════════════════════════════════════════════════════════

/** Draw a tree decoration (for forest terrain) */
export function drawTree(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  size: number,
  variant: number,
) {
  const trees = spr.trees
  if (trees.length > 0) {
    const tree = trees[variant % trees.length]
    // Trees are 256px tall in the sprite strip, draw them taller than the tile
    const treeH = size * 2
    const treeW = size * 1.2
    ctx.drawImage(tree, dx - (treeW - size) / 2, dy - treeH + size, treeW, treeH)
  }
}

/** Draw a bush or rock decoration */
export function drawDecoration(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  type: 'bush' | 'rock',
  dx: number, dy: number,
  size: number,
  variant: number,
) {
  const arr = type === 'bush' ? spr.bushes : spr.rocks
  if (arr.length > 0) {
    const img = arr[variant % arr.length]
    ctx.drawImage(img, dx, dy, size, size)
  }
}

// ═══════════════════════════════════════════════════════════════
//  BUILDING DRAWING
// ═══════════════════════════════════════════════════════════════

/** Map game building types to sprite building keys */
export type SpriteBuildingKey = 'castle' | 'barracks' | 'archery' | 'house1' | 'house2' | 'house3' | 'monastery' | 'tower'

export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  buildingKey: SpriteBuildingKey,
  faction: GameFactionColor,
  dx: number, dy: number,
  size: number,
) {
  const building = spr.buildings[faction]?.[buildingKey]
  if (building) {
    // Buildings are taller than wide, draw them extending above the tile
    const aspect = building.height / building.width
    const bw = size * 1.5
    const bh = bw * aspect
    ctx.drawImage(building, dx + (size - bw) / 2, dy - bh + size, bw, bh)
  }
}

/** Draw a castle (larger building) */
export function drawCastle(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  faction: GameFactionColor,
  dx: number, dy: number,
  size: number,
) {
  const castle = spr.buildings[faction]?.castle
  if (castle) {
    const bw = size * 3
    const bh = size * 2.5
    ctx.drawImage(castle, dx - size, dy - bh + size, bw, bh)
  }
}

// ═══════════════════════════════════════════════════════════════
//  UNIT / CREATURE DRAWING
// ═══════════════════════════════════════════════════════════════

/** Map creature IDs to sprite unit types */
export type SpriteUnitType = 'warrior' | 'archer' | 'pawn' | 'lancer' | 'monk'
export type SpriteAnimState = 'idle' | 'run' | 'attack1' | 'attack2' | 'shoot' | 'heal' | 'healEffect'

/** Get the unit sprite sheet for a creature */
export function getUnitSheet(
  spr: TinySwordsSprites,
  unitType: SpriteUnitType,
  anim: string,
  faction: GameFactionColor,
): SpriteSheetData | null {
  return spr.units[faction]?.[unitType]?.[anim] ?? null
}

/** Draw a unit sprite (animated) */
export function drawUnit(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  unitType: SpriteUnitType,
  anim: string,
  faction: GameFactionColor,
  dx: number, dy: number,
  size: number,
  tick: number,
  flipX = false,
  speed = 8,
) {
  const sheet = getUnitSheet(spr, unitType, anim, faction)
  if (sheet) {
    const fi = getFrameIndex(tick, sheet.frameCount, speed)
    drawSpriteFrame(ctx, sheet, fi, dx, dy, size, size, flipX)
  }
}

/** Draw a dead unit */
export function drawDeadUnit(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  size: number,
  tick: number,
) {
  if (spr.knightDead) {
    const fi = getFrameIndex(tick, spr.knightDead.frameCount, 8)
    drawSpriteFrame(ctx, spr.knightDead, fi, dx, dy, size, size)
  }
}

// ═══════════════════════════════════════════════════════════════
//  ENEMY DRAWING
// ═══════════════════════════════════════════════════════════════

/** Draw an enemy creature on the adventure map or in combat */
export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  enemyType: string,
  anim: string,
  dx: number, dy: number,
  size: number,
  tick: number,
  flipX = false,
  speed = 8,
) {
  const sheet = spr.enemies[enemyType]?.[anim]
  if (sheet) {
    const fi = getFrameIndex(tick, sheet.frameCount, speed)
    drawSpriteFrame(ctx, sheet, fi, dx, dy, size, size, flipX)
  }
}

/** All available enemy types for map encounters */
export const ENEMY_TYPES = [
  'bear', 'gnoll', 'gnome', 'harpoonFish', 'lancer', 'lizard',
  'minotaur', 'paddleFish', 'panda', 'shaman', 'skull', 'snake',
  'spider', 'thief', 'troll', 'turtle',
] as const

export type EnemyType = typeof ENEMY_TYPES[number]

// ═══════════════════════════════════════════════════════════════
//  CREATURE → SPRITE MAPPING
// ═══════════════════════════════════════════════════════════════

/** Map a creature ID to sprite unit type (for faction creatures) */
export function creatureToSpriteUnit(creatureId: CreatureId): SpriteUnitType | null {
  const id = String(creatureId).toLowerCase()
  // Knights/Castle faction tiers
  if (id.includes('pikeman') || id.includes('halberd') || id.includes('swords') || id.includes('footman')) return 'pawn'
  if (id.includes('archer') || id.includes('marksman') || id.includes('ranger') || id.includes('sharpshoot')) return 'archer'
  if (id.includes('griffin') || id.includes('pegasus') || id.includes('monk') || id.includes('cleric') || id.includes('priest')) return 'monk'
  if (id.includes('knight') || id.includes('cavalier') || id.includes('champion') || id.includes('paladin')) return 'lancer'
  if (id.includes('angel') || id.includes('archangel') || id.includes('titan') || id.includes('dragon') || id.includes('devil')) return 'warrior'
  // Generic fallback by tier detection
  return null
}

/** Map a creature ID to enemy sprite type (for neutrals and wilds faction) */
export function creatureToEnemySprite(creatureId: CreatureId): string | null {
  const id = String(creatureId).toLowerCase()
  // Direct wilds faction creature mappings
  if (id === 'gnoll') return 'gnoll'
  if (id === 'spider') return 'spider'
  if (id === 'lizard') return 'lizard'
  if (id === 'troll') return 'troll'
  if (id === 'bear') return 'bear'
  if (id === 'wild_minotaur') return 'minotaur'
  if (id === 'wild_dragon') return 'skull'
  // Generic mappings for other creatures
  if (id.includes('imp') || id.includes('gremlin') || id.includes('skeleton') || id.includes('familiar')) return 'gnome'
  if (id.includes('wolf') || id.includes('trog') || id.includes('goblin')) return 'gnoll'
  if (id.includes('ogre') || id.includes('orc') || id.includes('cyclop')) return 'troll'
  if (id.includes('behemoth') || id.includes('hydra') || id.includes('firebird')) return 'minotaur'
  if (id.includes('serpent') || id.includes('naga') || id.includes('wyvern')) return 'snake'
  if (id.includes('medusa') || id.includes('gorgon') || id.includes('spider')) return 'spider'
  if (id.includes('gargoyle') || id.includes('golem') || id.includes('bone')) return 'skull'
  if (id.includes('bear') || id.includes('panda')) return 'bear'
  if (id.includes('lich') || id.includes('vampire') || id.includes('wraith')) return 'shaman'
  if (id.includes('turtle') || id.includes('tortoise') || id.includes('lizard')) return 'lizard'
  if (id.includes('thief') || id.includes('rogue') || id.includes('assassin')) return 'thief'
  return null
}

// ═══════════════════════════════════════════════════════════════
//  UI HELPERS
// ═══════════════════════════════════════════════════════════════

/** Draw a UI panel background using carved banner */
export function drawPanel(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  w: number, h: number,
) {
  if (spr.carved9) {
    ctx.drawImage(spr.carved9, dx, dy, w, h)
  } else {
    ctx.fillStyle = 'rgba(40,30,20,0.85)'
    ctx.fillRect(dx, dy, w, h)
    ctx.strokeStyle = '#8B7355'
    ctx.strokeRect(dx, dy, w, h)
  }
}

/** Draw a ribbon header */
export function drawRibbon(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  text: string,
  dx: number, dy: number,
  w: number,
) {
  const ribbon = spr.ribbonsBig || spr.ribbonsSmall
  if (ribbon) {
    const h = 32
    ctx.drawImage(ribbon, dx, dy, w, h)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, dx + w / 2, dy + h / 2)
  }
}

/** Draw a HP/mana bar using sprite bar assets */
export function drawSpriteBar(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  w: number, h: number,
  ratio: number,
  color: string,
) {
  if (spr.barSmallBase && spr.barSmallFill) {
    ctx.drawImage(spr.barSmallBase, dx, dy, w, h)
    if (ratio > 0) {
      ctx.drawImage(spr.barSmallFill, 0, 0, spr.barSmallFill.width * ratio, spr.barSmallFill.height,
        dx + 2, dy + 1, (w - 4) * ratio, h - 2)
    }
  } else {
    ctx.fillStyle = '#333'
    ctx.fillRect(dx, dy, w, h)
    ctx.fillStyle = color
    ctx.fillRect(dx, dy, w * ratio, h)
  }
}

/** Draw a resource icon (animated gold/wood/meat) */
export function drawResourceIcon(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  type: 'gold' | 'wood' | 'meat',
  dx: number, dy: number,
  size: number,
  tick: number,
) {
  let icon: SpriteSheetData | null = null
  switch (type) {
    case 'gold': icon = spr.goldIcon; break
    case 'wood': icon = spr.woodIcon; break
    case 'meat': icon = spr.meatIcon; break
  }
  if (icon) {
    const fi = getFrameIndex(tick, icon.frameCount, 10)
    drawSpriteFrame(ctx, icon, fi, dx, dy, size, size)
  }
}

/** Draw a UI button from sprite assets */
export function drawSpriteButton(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  label: string,
  dx: number, dy: number,
  w: number, h: number,
  hovered: boolean,
) {
  // Use the carved panel as button background
  const bg = hovered ? spr.carved3 : spr.carvedRegular
  if (bg) {
    ctx.drawImage(bg, dx, dy, w, h)
  } else {
    ctx.fillStyle = hovered ? '#5a4a30' : '#3a2a15'
    ctx.fillRect(dx, dy, w, h)
    ctx.strokeStyle = '#8B7355'
    ctx.strokeRect(dx, dy, w, h)
  }
  ctx.fillStyle = '#fff'
  ctx.font = '10px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, dx + w / 2, dy + h / 2)
}

/** Draw hero avatar */
export function drawAvatar(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  avatarIndex: number,
  dx: number, dy: number,
  size: number,
) {
  const avatars = spr.avatars.length > 0 ? spr.avatars : spr.enemyAvatars
  if (avatars.length > 0) {
    const avatar = avatars[avatarIndex % avatars.length]
    ctx.drawImage(avatar, dx, dy, size, size)
  }
}

/** Draw effects (explosions, dust, fire) */
export function drawEffect(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  type: 'dust' | 'explosion' | 'fire',
  dx: number, dy: number,
  size: number,
  tick: number,
  variant = 0,
) {
  let arr: SpriteSheetData[] = []
  switch (type) {
    case 'dust': arr = spr.dust; break
    case 'explosion': arr = spr.explosions; break
    case 'fire': arr = spr.fires; break
  }
  if (arr.length > 0) {
    const sheet = arr[variant % arr.length]
    const fi = getFrameIndex(tick, sheet.frameCount, 5)
    drawSpriteFrame(ctx, sheet, fi, dx, dy, size, size)
  }
}

/** Draw wood table background for town/menu screens */
export function drawWoodTableBg(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  w: number, h: number,
) {
  if (spr.woodTable) {
    // Tile the wood table across the background
    const tw = spr.woodTable.width
    const th = spr.woodTable.height
    for (let y = 0; y < h; y += th) {
      for (let x = 0; x < w; x += tw) {
        ctx.drawImage(spr.woodTable, x, y, Math.min(tw, w - x), Math.min(th, h - y))
      }
    }
  }
}

/** Draw the paper/scroll background for info panels */
export function drawPaperBg(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  w: number, h: number,
) {
  const paper = spr.paperRegular || spr.paperSpecial
  if (paper) {
    ctx.drawImage(paper, dx, dy, w, h)
  }
}

/** Draw gold mine */
export function drawGoldMine(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  size: number,
  active: boolean,
) {
  const mine = active ? spr.goldMine.active : spr.goldMine.inactive
  if (mine) {
    ctx.drawImage(mine, dx, dy, size * 1.5, size * 1.5)
  }
}

/** Draw sheep (animated, for towns/resources) */
export function drawSheep(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  size: number,
  tick: number,
) {
  if (spr.sheepIdle) {
    const fi = getFrameIndex(tick, spr.sheepIdle.frameCount, 10)
    drawSpriteFrame(ctx, spr.sheepIdle, fi, dx, dy, size, size)
  }
}

/** Draw a cloud decoration (for map atmosphere) */
export function drawCloud(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  size: number,
  variant: number,
) {
  if (spr.clouds.length > 0) {
    const cloud = spr.clouds[variant % spr.clouds.length]
    ctx.globalAlpha = 0.4
    ctx.drawImage(cloud, dx, dy, size * 2, size)
    ctx.globalAlpha = 1.0
  }
}

/** Draw swords decoration */
export function drawSwords(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  dx: number, dy: number,
  size: number,
) {
  if (spr.swords) {
    ctx.globalAlpha = 0.2
    ctx.drawImage(spr.swords, dx, dy, size, size)
    ctx.globalAlpha = 1.0
  }
}
