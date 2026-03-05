/**
 * hudRenderer.ts — HUD overlay for the adventure map.
 *
 * Renders: resource bar, minimap, hero/town info panels, turn info,
 * action buttons, tooltips, notifications.
 */
import type { GameState, Hero, ResourceBundle } from './types'
import { CANVAS_W, CANVAS_H, TILE_PX, RESOURCE_ICONS } from './constants'
import { FACTIONS } from './factions'
import { formatNumber, formatTurnDate, truncate, lighten } from './helpers'
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'
import {
  drawPanel, drawResourceIcon, drawSpriteButton, drawAvatar,
} from './sprites'

// ═════════════════════════════════════════════════════════════
//  RESOURCE BAR (top)
// ═════════════════════════════════════════════════════════════
export function drawResourceBar(ctx: CanvasRenderingContext2D, resources: ResourceBundle, spr?: TinySwordsSprites | null, tick = 0) {
  const barH = 24
  const hasSpr = spr?.loaded

  if (hasSpr) {
    drawPanel(ctx, spr!, 0, 0, CANVAS_W, barH)
  } else {
    ctx.fillStyle = 'rgba(20,15,10,0.92)'
    ctx.fillRect(0, 0, CANVAS_W, barH)
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, CANVAS_W, barH)
  }

  ctx.font = 'bold 11px monospace'
  ctx.textBaseline = 'middle'

  const items: [string, number, 'gold' | 'wood' | 'meat' | null][] = [
    [RESOURCE_ICONS.gold, resources.gold, 'gold'],
    [RESOURCE_ICONS.wood, resources.wood, 'wood'],
    [RESOURCE_ICONS.ore, resources.ore, null],
    [RESOURCE_ICONS.crystals, resources.crystals, null],
    [RESOURCE_ICONS.gems, resources.gems, null],
    [RESOURCE_ICONS.mercury, resources.mercury, null],
    [RESOURCE_ICONS.sulfur, resources.sulfur, null],
  ]

  let x = 8
  for (const [icon, val, sprType] of items) {
    if (hasSpr && sprType) {
      drawResourceIcon(ctx, spr!, sprType, x - 2, 3, 16, tick)
      x += 18
    } else {
      ctx.fillStyle = '#fff'
      ctx.fillText(`${icon}`, x, barH / 2)
      x += 16
    }
    ctx.fillStyle = val > 0 ? '#FFD700' : '#888'
    ctx.fillText(formatNumber(val), x, barH / 2)
    x += ctx.measureText(formatNumber(val)).width + 14
  }
}

// ═════════════════════════════════════════════════════════════
//  TURN INFO BAR (bottom)
// ═════════════════════════════════════════════════════════════
export function drawTurnBar(ctx: CanvasRenderingContext2D, state: GameState, spr?: TinySwordsSprites | null) {
  const barH = 28
  const y = CANVAS_H - barH
  const hasSpr = spr?.loaded

  if (hasSpr) {
    drawPanel(ctx, spr!, 0, y, CANVAS_W, barH)
  } else {
    ctx.fillStyle = 'rgba(20,15,10,0.92)'
    ctx.fillRect(0, y, CANVAS_W, barH)
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = 1
    ctx.strokeRect(0, y, CANVAS_W, barH)
  }

  ctx.font = 'bold 11px monospace'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ddd'

  const turn = state.turn
  const dateStr = formatTurnDate(turn.day, turn.week, turn.month)
  ctx.fillText(`${dateStr}  |  Player ${turn.currentPlayer + 1}`, 10, y + barH / 2)

  // Active hero info
  const activeHero = state.heroes.find(h => h.owner === turn.currentPlayer && h.alive)
  if (activeHero) {
    const info = `${activeHero.name} (Lv${activeHero.level})  MP: ${activeHero.movementPoints}  Mana: ${activeHero.mana}/${activeHero.maxMana}`
    ctx.fillStyle = '#adf'
    ctx.fillText(info, 300, y + barH / 2)
  }

  // End Turn button
  const btnX = CANVAS_W - 110
  const btnW = 100
  if (hasSpr) {
    drawSpriteButton(ctx, spr!, 'End Turn', btnX, y + 3, btnW, barH - 6, false)
  } else {
    ctx.fillStyle = '#3a6e3a'
    ctx.fillRect(btnX, y + 3, btnW, barH - 6)
    ctx.strokeStyle = '#5a9e5a'
    ctx.strokeRect(btnX, y + 3, btnW, barH - 6)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('End Turn', btnX + btnW / 2, y + barH / 2)
  }
  ctx.textAlign = 'left'
}

// ═════════════════════════════════════════════════════════════
//  MINIMAP (top-right)
// ═════════════════════════════════════════════════════════════
export function drawMinimap(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  cameraX: number,
  cameraY: number,
  spr?: TinySwordsSprites | null,
) {
  const mw = 120
  const mh = 90
  const mx = CANVAS_W - mw - 6
  const my = 28
  const hasSpr = spr?.loaded

  if (hasSpr) {
    drawPanel(ctx, spr!, mx - 2, my - 2, mw + 4, mh + 4)
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(mx - 2, my - 2, mw + 4, mh + 4)
    ctx.strokeStyle = '#8B7355'
    ctx.strokeRect(mx - 2, my - 2, mw + 4, mh + 4)
  }

  const scaleX = mw / state.map.cols
  const scaleY = mh / state.map.rows
  const playerId = state.turn.currentPlayer

  // Terrain
  const MINI_COLORS: Record<string, string> = {
    grass: '#4a8c4a', forest: '#2d5e2d', mountain: '#8B7355', water: '#2244aa',
    road: '#c8b078', sand: '#e8d878', swamp: '#5a7a4a', snow: '#dde8f0',
    lava: '#cc3300', dirt: '#8a7050',
  }

  for (let r = 0; r < state.map.rows; r++) {
    for (let c = 0; c < state.map.cols; c++) {
      const cell = state.map.cells[r][c]
      if (!cell.explored[playerId]) continue
      ctx.fillStyle = MINI_COLORS[cell.terrain] || '#333'
      ctx.fillRect(mx + c * scaleX, my + r * scaleY, Math.ceil(scaleX), Math.ceil(scaleY))
    }
  }

  // Towns
  for (const town of state.towns) {
    const tx = mx + town.x * scaleX
    const ty = my + town.y * scaleY
    ctx.fillStyle = town.owner === playerId ? '#00ff00' : (town.owner !== null ? '#ff0000' : '#aaa')
    ctx.fillRect(tx - 1, ty - 1, 4, 4)
  }

  // Heroes
  for (const hero of state.heroes) {
    if (!hero.alive) continue
    const hx = mx + hero.x * scaleX
    const hy = my + hero.y * scaleY
    ctx.fillStyle = hero.owner === playerId ? '#00ffff' : '#ff4444'
    ctx.beginPath()
    ctx.arc(hx + 1, hy + 1, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Camera viewport rectangle
  const viewCols = Math.floor(CANVAS_W / TILE_PX)
  const viewRows = Math.floor((CANVAS_H - 52) / TILE_PX)  // minus HUD bars
  const camCol = Math.floor(cameraX / TILE_PX)
  const camRow = Math.floor(cameraY / TILE_PX)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.strokeRect(
    mx + camCol * scaleX,
    my + camRow * scaleY,
    viewCols * scaleX,
    viewRows * scaleY,
  )
}

// ═════════════════════════════════════════════════════════════
//  HERO LIST PANEL (left side)
// ═════════════════════════════════════════════════════════════
export function drawHeroList(
  ctx: CanvasRenderingContext2D,
  heroes: Hero[],
  selectedHeroId: string | null,
  spr?: TinySwordsSprites | null,
) {
  const panelX = 4
  const panelY = 28
  const panelW = 60
  const itemH = 36
  const hasSpr = spr?.loaded

  const playerHeroes = heroes.filter(h => h.alive)
  if (playerHeroes.length === 0) return

  for (let i = 0; i < playerHeroes.length; i++) {
    const hero = playerHeroes[i]
    const iy = panelY + i * (itemH + 2)

    // Selection highlight
    if (hasSpr) {
      drawPanel(ctx, spr!, panelX, iy, panelW, itemH)
      if (hero.id === selectedHeroId) {
        ctx.strokeStyle = '#6af'
        ctx.lineWidth = 2
        ctx.strokeRect(panelX, iy, panelW, itemH)
      }
    } else {
      ctx.fillStyle = hero.id === selectedHeroId ? 'rgba(80,120,200,0.6)' : 'rgba(30,25,20,0.7)'
      ctx.fillRect(panelX, iy, panelW, itemH)
      ctx.strokeStyle = hero.id === selectedHeroId ? '#6af' : '#555'
      ctx.strokeRect(panelX, iy, panelW, itemH)
    }

    // Hero icon
    if (hasSpr) {
      drawAvatar(ctx, spr!, i, panelX + 2, iy + 2, 20)
    } else {
      const fColor = FACTIONS[hero.faction]?.color || '#888'
      ctx.fillStyle = fColor
      ctx.beginPath()
      ctx.arc(panelX + 14, iy + 14, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(hero.name[0], panelX + 14, iy + 17)
      ctx.textAlign = 'left'
    }

    // Level
    ctx.fillStyle = '#aaa'
    ctx.font = '9px monospace'
    ctx.fillText(`Lv${hero.level}`, panelX + 28, iy + 14)
    ctx.fillText(`MP${hero.movementPoints}`, panelX + 28, iy + 26)
  }
}

// ═════════════════════════════════════════════════════════════
//  TOOLTIP
// ═════════════════════════════════════════════════════════════
export function drawTooltip(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
) {
  ctx.font = '11px monospace'
  const metrics = ctx.measureText(text)
  const pw = metrics.width + 12
  const ph = 20

  // Keep on screen
  const tx = Math.min(x, CANVAS_W - pw - 4)
  const ty = Math.max(y - ph - 4, 4)

  ctx.fillStyle = 'rgba(10,8,5,0.92)'
  ctx.fillRect(tx, ty, pw, ph)
  ctx.strokeStyle = '#8B7355'
  ctx.strokeRect(tx, ty, pw, ph)
  ctx.fillStyle = '#eee'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, tx + 6, ty + ph / 2)
}

// ═════════════════════════════════════════════════════════════
//  NOTIFICATION / EVENT LOG
// ═════════════════════════════════════════════════════════════
export function drawNotifications(
  ctx: CanvasRenderingContext2D,
  messages: string[],
  _time: number,
  spr?: TinySwordsSprites | null,
) {
  const visibleCount = Math.min(messages.length, 5)
  if (visibleCount === 0) return

  const hasSpr = spr?.loaded

  // Draw a panel behind the notifications
  if (hasSpr && visibleCount > 0) {
    const panelH = visibleCount * 14 + 8
    drawPanel(ctx, spr!, CANVAS_W / 2 - 204, CANVAS_H - 64 - (visibleCount - 1) * 14, 408, panelH)
  }

  ctx.font = '10px monospace'
  ctx.textBaseline = 'top'

  for (let i = 0; i < visibleCount; i++) {
    const msg = messages[messages.length - 1 - i]
    const alpha = Math.max(0.3, 1 - i * 0.15)
    ctx.fillStyle = `rgba(255,255,200,${alpha})`
    ctx.fillText(truncate(msg, 80), CANVAS_W / 2 - 200, CANVAS_H - 60 - i * 14)
  }
}

// ═════════════════════════════════════════════════════════════
//  BUTTONS
// ═════════════════════════════════════════════════════════════
export interface HUDButton {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
  color?: string
  disabled?: boolean
}

export function drawButton(ctx: CanvasRenderingContext2D, btn: HUDButton, hovered: boolean) {
  const bg = btn.disabled ? '#444' : (hovered ? lighten(btn.color || '#555', 0.2) : (btn.color || '#555'))
  ctx.fillStyle = bg
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h)
  ctx.strokeStyle = hovered ? '#fff' : '#888'
  ctx.lineWidth = 1
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h)

  ctx.fillStyle = btn.disabled ? '#888' : '#fff'
  ctx.font = 'bold 11px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2)
  ctx.textAlign = 'left'
}

/** Check if mouse is over a button */
export function isButtonHovered(btn: HUDButton, mx: number, my: number): boolean {
  return mx >= btn.x && mx < btn.x + btn.w && my >= btn.y && my < btn.y + btn.h
}
