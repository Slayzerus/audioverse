/**
 * townRenderer.ts — Renders the town management screen.
 *
 * Building grid, creature recruitment panel, garrison/hero army management,
 * marketplace, mage guild, hero information.
 */
import type { Town, Hero, ResourceBundle, CreatureStack } from './types'
import { CANVAS_W, CANVAS_H, RESOURCE_ICONS } from './constants'
import { ALL_CREATURES, getCreaturesForFaction, FACTIONS } from './factions'
import { ALL_BUILDINGS, getBuildingsForFaction, canBuild } from './buildings'
import { calcArmyPower } from './heroes'
import { formatNumber, capitalize, truncate } from './helpers'
import type { HUDButton } from './hudRenderer'
import { drawButton, isButtonHovered } from './hudRenderer'
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'
import {
  drawWoodTableBg, drawPanel, drawRibbon, drawSpriteButton,
  drawResourceIcon, drawUnit, creatureToSpriteUnit, factionToColor,
} from './sprites'

// ═════════════════════════════════════════════════════════════
//  TOWN SCREEN LAYOUT
// ═════════════════════════════════════════════════════════════
const PANEL_BG = '#1e1812'
const PANEL_BORDER = '#8B7355'
const HEADER_BG = '#2a2018'
const TEXT_COLOR = '#ddd'
const GOLD_COLOR = '#FFD700'
const DISABLED_COLOR = '#666'

export interface TownScreenState {
  selectedBuildingId: string | null
  selectedCreatureId: string | null
  recruitCount: number
  showMarketplace: boolean
  showMageGuild: boolean
  tab: 'buildings' | 'army' | 'recruit' | 'market' | 'info'
}

export function createTownScreenState(): TownScreenState {
  return {
    selectedBuildingId: null,
    selectedCreatureId: null,
    recruitCount: 1,
    showMarketplace: false,
    showMageGuild: false,
    tab: 'buildings',
  }
}

// ═════════════════════════════════════════════════════════════
//  FULL TOWN SCREEN
// ═════════════════════════════════════════════════════════════
export function drawTownScreen(
  ctx: CanvasRenderingContext2D,
  town: Town,
  hero: Hero | null,
  resources: ResourceBundle,
  screenState: TownScreenState,
  mouseX: number,
  mouseY: number,
  spr?: TinySwordsSprites | null,
  tick = 0,
) {
  const hasSpr = spr?.loaded

  // Full-screen background
  if (hasSpr) {
    drawWoodTableBg(ctx, spr!, CANVAS_W, CANVAS_H)
  } else {
    ctx.fillStyle = PANEL_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  // ── Header ──
  drawTownHeader(ctx, town, spr)

  // ── Tab buttons ──
  const tabs: HUDButton[] = [
    { id: 'tab_buildings', label: 'Buildings', x: 8, y: 42, w: 85, h: 22, color: screenState.tab === 'buildings' ? '#5a4a3a' : '#3a3020' },
    { id: 'tab_recruit', label: 'Recruit', x: 98, y: 42, w: 75, h: 22, color: screenState.tab === 'recruit' ? '#5a4a3a' : '#3a3020' },
    { id: 'tab_army', label: 'Army', x: 178, y: 42, w: 65, h: 22, color: screenState.tab === 'army' ? '#5a4a3a' : '#3a3020' },
    { id: 'tab_market', label: 'Market', x: 248, y: 42, w: 70, h: 22, color: screenState.tab === 'market' ? '#5a4a3a' : '#3a3020' },
    { id: 'tab_info', label: 'Info', x: 323, y: 42, w: 60, h: 22, color: screenState.tab === 'info' ? '#5a4a3a' : '#3a3020' },
  ]
  for (const tab of tabs) {
    if (hasSpr) {
      drawSpriteButton(ctx, spr!, tab.label, tab.x, tab.y, tab.w, tab.h, isButtonHovered(tab, mouseX, mouseY))
    } else {
      drawButton(ctx, tab, isButtonHovered(tab, mouseX, mouseY))
    }
  }

  // ── Close button ──
  const closeBtn: HUDButton = { id: 'close_town', label: 'X Close', x: CANVAS_W - 80, y: 8, w: 70, h: 24, color: '#6a2020' }
  if (hasSpr) {
    drawSpriteButton(ctx, spr!, closeBtn.label, closeBtn.x, closeBtn.y, closeBtn.w, closeBtn.h, isButtonHovered(closeBtn, mouseX, mouseY))
  } else {
    drawButton(ctx, closeBtn, isButtonHovered(closeBtn, mouseX, mouseY))
  }

  // ── Resource bar (compact) ──
  drawTownResources(ctx, resources, spr, tick)

  // ── Tab content ──
  const contentY = 70
  const contentH = CANVAS_H - contentY - 8

  switch (screenState.tab) {
    case 'buildings':
      drawBuildingsTab(ctx, town, resources, screenState, contentY, contentH, mouseX, mouseY, spr)
      break
    case 'recruit':
      drawRecruitTab(ctx, town, hero, resources, screenState, contentY, contentH, mouseX, mouseY, spr, tick)
      break
    case 'army':
      drawArmyTab(ctx, town, hero, contentY, contentH, spr, tick)
      break
    case 'market':
      drawMarketTab(ctx, town, resources, contentY, contentH, spr)
      break
    case 'info':
      drawInfoTab(ctx, town, hero, contentY, contentH, spr)
      break
  }
}

// ═════════════════════════════════════════════════════════════
//  HEADER
// ═════════════════════════════════════════════════════════════
function drawTownHeader(ctx: CanvasRenderingContext2D, town: Town, spr?: TinySwordsSprites | null) {
  const hasSpr = spr?.loaded

  if (hasSpr) {
    drawRibbon(ctx, spr!, `${town.name} — ${capitalize(town.faction)}`, 0, 0, CANVAS_W)
  } else {
    ctx.fillStyle = HEADER_BG
    ctx.fillRect(0, 0, CANVAS_W, 38)
    ctx.strokeStyle = PANEL_BORDER
    ctx.strokeRect(0, 0, CANVAS_W, 38)

    const faction = FACTIONS[town.faction]
    ctx.fillStyle = faction?.color || '#888'
    ctx.fillRect(6, 6, 26, 26)
    ctx.strokeStyle = '#fff'
    ctx.strokeRect(6, 6, 26, 26)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 16px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🏰', 19, 19)

    ctx.fillStyle = GOLD_COLOR
    ctx.font = 'bold 14px monospace'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${town.name} — ${capitalize(town.faction)}`, 40, 19)
    ctx.textBaseline = 'alphabetic'
  }
}

function drawTownResources(ctx: CanvasRenderingContext2D, resources: ResourceBundle, spr?: TinySwordsSprites | null, tick = 0) {
  const hasSpr = spr?.loaded

  if (hasSpr) {
    drawPanel(ctx, spr!, 400, 4, CANVAS_W - 490, 30)
  } else {
    ctx.fillStyle = 'rgba(30,25,15,0.8)'
    ctx.fillRect(400, 4, CANVAS_W - 490, 30)
  }

  const items: [string, number, 'gold' | 'wood' | 'meat' | null][] = [
    [RESOURCE_ICONS.gold, resources.gold, 'gold'],
    [RESOURCE_ICONS.wood, resources.wood, 'wood'],
    [RESOURCE_ICONS.ore, resources.ore, null],
    [RESOURCE_ICONS.crystals, resources.crystals, null],
    [RESOURCE_ICONS.gems, resources.gems, null],
    [RESOURCE_ICONS.mercury, resources.mercury, null],
    [RESOURCE_ICONS.sulfur, resources.sulfur, null],
  ]

  ctx.font = '10px monospace'
  ctx.textBaseline = 'middle'
  let x = 406
  for (const [icon, val, sprType] of items) {
    if (hasSpr && sprType) {
      drawResourceIcon(ctx, spr!, sprType, x - 2, 7, 14, tick)
      x += 16
    } else {
      ctx.fillStyle = '#fff'
      ctx.fillText(icon, x, 19)
      x += 14
    }
    ctx.fillStyle = val > 0 ? GOLD_COLOR : DISABLED_COLOR
    ctx.fillText(`${val}`, x, 19)
    x += ctx.measureText(`${val}`).width + 8
  }
  ctx.textBaseline = 'alphabetic'
}

// ═════════════════════════════════════════════════════════════
//  BUILDINGS TAB
// ═════════════════════════════════════════════════════════════
function drawBuildingsTab(
  ctx: CanvasRenderingContext2D,
  town: Town,
  resources: ResourceBundle,
  screenState: TownScreenState,
  y: number,
  h: number,
  mx: number,
  my: number,
  spr?: TinySwordsSprites | null,
) {
  void spr // reserved for future building sprite rendering
  const buildings = getBuildingsForFaction(town.faction)
  const builtIds = new Set(town.buildings.filter(b => b.built).map(b => b.buildingId))

  const colW = 200
  const rowH = 32
  const cols = 4
  let idx = 0

  for (const bDef of buildings) {
    const col = idx % cols
    const row = Math.floor(idx / cols)
    const bx = 8 + col * (colW + 6)
    const by = y + 4 + row * (rowH + 4)
    if (by + rowH > y + h) break

    const isBuilt = builtIds.has(bDef.id)
    const check = canBuild(bDef.id, builtIds, resources)
    const hovered = mx >= bx && mx < bx + colW && my >= by && my < by + rowH

    // Background
    ctx.fillStyle = isBuilt ? '#2a4a2a' : (check.ok ? '#3a3a20' : '#2a2020')
    ctx.fillRect(bx, by, colW, rowH)
    if (hovered) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 1
      ctx.strokeRect(bx, by, colW, rowH)
    }

    // Name
    ctx.fillStyle = isBuilt ? '#8f8' : (check.ok ? '#eee' : '#888')
    ctx.font = '10px monospace'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      `${isBuilt ? '✓ ' : ''}${truncate(bDef.name, 18)}`,
      bx + 4, by + 11,
    )

    // Cost (if not built)
    if (!isBuilt) {
      ctx.fillStyle = check.ok ? GOLD_COLOR : '#a66'
      ctx.font = '9px monospace'
      ctx.fillText(`${bDef.cost.gold}g`, bx + 4, by + 25)
    }

    idx++
  }
  ctx.textBaseline = 'alphabetic'

  // Selected building details
  if (screenState.selectedBuildingId) {
    const bDef = ALL_BUILDINGS[screenState.selectedBuildingId]
    if (bDef) {
      drawBuildingDetails(ctx, bDef, builtIds, resources, y + h - 80)
    }
  }
}

function drawBuildingDetails(
  ctx: CanvasRenderingContext2D,
  bDef: import('./types').BuildingDef,
  _builtIds: Set<string>,
  _resources: ResourceBundle,
  y: number,
) {
  ctx.fillStyle = 'rgba(20,15,10,0.9)'
  ctx.fillRect(8, y, CANVAS_W - 16, 72)
  ctx.strokeStyle = PANEL_BORDER
  ctx.strokeRect(8, y, CANVAS_W - 16, 72)

  ctx.fillStyle = GOLD_COLOR
  ctx.font = 'bold 12px monospace'
  ctx.fillText(bDef.name, 16, y + 16)

  ctx.fillStyle = TEXT_COLOR
  ctx.font = '10px monospace'
  ctx.fillText(bDef.description, 16, y + 32)

  // Cost
  const costParts: string[] = []
  if (bDef.cost.gold) costParts.push(`${bDef.cost.gold}g`)
  if (bDef.cost.wood) costParts.push(`${bDef.cost.wood}w`)
  if (bDef.cost.ore) costParts.push(`${bDef.cost.ore}o`)
  if (bDef.cost.crystals) costParts.push(`${bDef.cost.crystals}cr`)
  if (bDef.cost.gems) costParts.push(`${bDef.cost.gems}ge`)
  if (bDef.cost.mercury) costParts.push(`${bDef.cost.mercury}me`)
  if (bDef.cost.sulfur) costParts.push(`${bDef.cost.sulfur}su`)
  ctx.fillStyle = '#aaa'
  ctx.fillText(`Cost: ${costParts.join(', ')}`, 16, y + 48)

  if (bDef.prerequisites.length > 0) {
    const prereqNames = bDef.prerequisites.map(p => ALL_BUILDINGS[p]?.name || p).join(', ')
    ctx.fillText(`Requires: ${prereqNames}`, 16, y + 62)
  }
}

// ═════════════════════════════════════════════════════════════
//  RECRUIT TAB
// ═════════════════════════════════════════════════════════════
function drawRecruitTab(
  ctx: CanvasRenderingContext2D,
  town: Town,
  _hero: Hero | null,
  _resources: ResourceBundle,
  screenState: TownScreenState,
  y: number,
  h: number,
  mx: number,
  my: number,
  spr?: TinySwordsSprites | null,
  tick = 0,
) {
  const creatures = getCreaturesForFaction(town.faction)
  const _builtIds = new Set(town.buildings.filter(b => b.built).map(b => b.buildingId))
  void _builtIds
  const hasSpr = spr?.loaded

  ctx.fillStyle = TEXT_COLOR
  ctx.font = 'bold 12px monospace'
  ctx.fillText('Available Creatures', 12, y + 16)

  const rowH = 52
  let idx = 0

  for (const c of creatures) {
    const hasDwelling = town.buildings.some(b => {
      const bDef = ALL_BUILDINGS[b.buildingId]
      return bDef && bDef.creatureTier === c.tier && b.built
    })

    const cx = 8
    const cy = y + 24 + idx * (rowH + 4)
    if (cy + rowH > y + h) break

    const available = town.creaturePool.find(p => p.creatureId === c.id)?.available ?? 0
    const isHovered = mx >= cx && mx < cx + CANVAS_W - 16 && my >= cy && my < cy + rowH
    const isSelected = screenState.selectedCreatureId === c.id

    ctx.fillStyle = isSelected ? '#3a4a5a' : (isHovered ? '#2a3a3a' : '#1e1812')
    ctx.fillRect(cx, cy, CANVAS_W - 16, rowH)
    ctx.strokeStyle = hasDwelling ? '#5a8a5a' : '#4a3a2a'
    ctx.strokeRect(cx, cy, CANVAS_W - 16, rowH)

    // Creature sprite or emoji
    const unitType = hasSpr ? creatureToSpriteUnit(c.id) : null
    if (unitType && hasSpr) {
      const fc = factionToColor(town.faction)
      drawUnit(ctx, spr!, unitType, 'idle', fc, cx + 2, cy + 4, 40, tick)
    } else {
      ctx.font = '20px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.shape, cx + 20, cy + rowH / 2)
      ctx.textAlign = 'left'
    }

    ctx.fillStyle = hasDwelling ? '#eee' : '#666'
    ctx.font = 'bold 11px monospace'
    ctx.textBaseline = 'top'
    ctx.fillText(`T${c.tier} ${c.name}`, cx + 42, cy + 4)

    ctx.fillStyle = '#aaa'
    ctx.font = '9px monospace'
    ctx.fillText(
      `ATK:${c.attack} DEF:${c.defense} HP:${c.hp} DMG:${c.minDmg}-${c.maxDmg} SPD:${c.speed}`,
      cx + 42, cy + 18,
    )

    // Available count
    ctx.fillStyle = available > 0 ? '#4f4' : '#a66'
    ctx.fillText(
      hasDwelling ? `Available: ${available}  |  Growth: ${c.growth}/week` : 'No dwelling built',
      cx + 42, cy + 32,
    )

    // Cost
    ctx.fillStyle = GOLD_COLOR
    ctx.fillText(`Cost: ${c.cost.gold}g`, cx + 42, cy + 42)
    ctx.textBaseline = 'alphabetic'

    idx++
  }
}

// ═════════════════════════════════════════════════════════════
//  ARMY TAB
// ═════════════════════════════════════════════════════════════
function drawArmyTab(
  ctx: CanvasRenderingContext2D,
  town: Town,
  hero: Hero | null,
  y: number,
  h: number,
  spr?: TinySwordsSprites | null,
  tick = 0,
) {
  // Town garrison
  ctx.fillStyle = GOLD_COLOR
  ctx.font = 'bold 12px monospace'
  ctx.fillText('Town Garrison', 12, y + 16)
  drawArmySlots(ctx, town.garrison, 8, y + 24, CANVAS_W / 2 - 12, town.faction, spr, tick)

  // Hero army
  if (hero) {
    ctx.fillStyle = '#8af'
    ctx.fillText(`${hero.name}'s Army (Power: ${formatNumber(calcArmyPower(hero.army))})`, CANVAS_W / 2 + 4, y + 16)
    drawArmySlots(ctx, hero.army, CANVAS_W / 2, y + 24, CANVAS_W / 2 - 8, hero.faction, spr, tick)
  } else {
    ctx.fillStyle = '#888'
    ctx.font = '11px monospace'
    ctx.fillText('No hero visiting. Move hero here to manage army.', CANVAS_W / 2 + 4, y + 16)
  }

  // Instructions
  ctx.fillStyle = '#888'
  ctx.font = '10px monospace'
  ctx.fillText('Click slots to transfer creatures between garrison and hero.', 12, y + h - 8)
}

function drawArmySlots(ctx: CanvasRenderingContext2D, army: (CreatureStack | null)[], x: number, y: number, maxW: number, faction?: import('./types').FactionId, spr?: TinySwordsSprites | null, tick = 0) {
  const slotW = Math.floor((maxW - 8) / 7)
  const slotH = 55
  const hasSpr = spr?.loaded

  for (let i = 0; i < 7; i++) {
    const sx = x + i * (slotW + 1)
    const stack = army[i]

    if (hasSpr) {
      drawPanel(ctx, spr!, sx, y, slotW, slotH)
    } else {
      ctx.fillStyle = stack ? '#2a3a2a' : '#1a1510'
      ctx.fillRect(sx, y, slotW, slotH)
      ctx.strokeStyle = '#5a4a3a'
      ctx.strokeRect(sx, y, slotW, slotH)
    }

    if (stack) {
      const def = ALL_CREATURES[stack.creatureId]
      if (def) {
        const unitType = hasSpr ? creatureToSpriteUnit(stack.creatureId) : null
        if (unitType && hasSpr && faction) {
          const fc = factionToColor(faction)
          drawUnit(ctx, spr!, unitType, 'idle', fc, sx + 2, y + 2, slotW - 4, tick)
        } else {
          ctx.font = '18px serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(def.shape, sx + slotW / 2, y + 20)
        }

        ctx.fillStyle = '#fff'
        ctx.font = 'bold 10px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(`${stack.count}`, sx + slotW / 2, y + 40)

        ctx.fillStyle = '#aaa'
        ctx.font = '8px monospace'
        ctx.fillText(`T${def.tier}`, sx + slotW / 2, y + 50)
        ctx.textAlign = 'left'
        ctx.textBaseline = 'alphabetic'
      }
    } else {
      ctx.fillStyle = '#444'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('Empty', sx + slotW / 2, y + slotH / 2)
      ctx.textAlign = 'left'
    }
  }
}

// ═════════════════════════════════════════════════════════════
//  MARKET TAB
// ═════════════════════════════════════════════════════════════
function drawMarketTab(
  ctx: CanvasRenderingContext2D,
  town: Town,
  resources: ResourceBundle,
  y: number,
  h: number,
  _spr?: TinySwordsSprites | null,
) {
  const hasMarket = town.buildings.some(b => b.buildingId === 'marketplace' && b.built)

  if (!hasMarket) {
    ctx.fillStyle = '#888'
    ctx.font = '14px monospace'
    ctx.fillText('Build a Marketplace to enable trading.', 20, y + h / 2)
    return
  }

  ctx.fillStyle = GOLD_COLOR
  ctx.font = 'bold 12px monospace'
  ctx.fillText('Resource Trading (5:1 ratio)', 12, y + 16)

  ctx.fillStyle = TEXT_COLOR
  ctx.font = '11px monospace'
  const resourceNames: (keyof ResourceBundle)[] = ['gold', 'wood', 'ore', 'crystals', 'gems', 'mercury', 'sulfur']
  const icons = RESOURCE_ICONS

  let row = 0
  for (const res of resourceNames) {
    const ry = y + 32 + row * 26
    ctx.fillStyle = TEXT_COLOR
    ctx.fillText(`${icons[res]} ${capitalize(res)}: ${resources[res]}`, 20, ry)
    row++
  }

  ctx.fillStyle = '#aaa'
  ctx.font = '10px monospace'
  ctx.fillText('Click a resource to sell, then click another to buy.', 20, y + h - 16)
}

// ═════════════════════════════════════════════════════════════
//  INFO TAB
// ═════════════════════════════════════════════════════════════
function drawInfoTab(
  ctx: CanvasRenderingContext2D,
  town: Town,
  hero: Hero | null,
  y: number,
  _h: number,
  _spr?: TinySwordsSprites | null,
) {
  ctx.fillStyle = GOLD_COLOR
  ctx.font = 'bold 12px monospace'
  ctx.fillText('Town Information', 12, y + 16)

  const info = [
    `Faction: ${capitalize(town.faction)}`,
    `Fort Level: ${town.fortLevel}`,
    `Mage Guild: Level ${town.mageGuildLevel}`,
    `Buildings: ${town.buildings.filter(b => b.built).length}/${town.buildings.length}`,
  ]

  ctx.fillStyle = TEXT_COLOR
  ctx.font = '11px monospace'
  for (let i = 0; i < info.length; i++) {
    ctx.fillText(info[i], 20, y + 34 + i * 18)
  }

  if (hero) {
    ctx.fillStyle = '#8af'
    ctx.font = 'bold 12px monospace'
    ctx.fillText('Visiting Hero', 12, y + 120)

    const heroInfo = [
      `${hero.name} — ${capitalize(hero.heroClass)} (Lv ${hero.level})`,
      `ATK: ${hero.attack}  DEF: ${hero.defense}  SP: ${hero.spellPower}  KN: ${hero.knowledge}`,
      `Mana: ${hero.mana}/${hero.maxMana}  XP: ${hero.experience}`,
      `Skills: ${hero.skills.map(s => s.skillId).join(', ') || 'None'}`,
      `Spells: ${hero.spells.length}`,
      `Army Power: ${formatNumber(calcArmyPower(hero.army))}`,
    ]

    ctx.fillStyle = TEXT_COLOR
    ctx.font = '10px monospace'
    for (let i = 0; i < heroInfo.length; i++) {
      ctx.fillText(heroInfo[i], 20, y + 138 + i * 16)
    }
  }
}

// ═════════════════════════════════════════════════════════════
//  TOWN SCREEN BUTTON AREAS (for click detection)
// ═════════════════════════════════════════════════════════════
export function getTownButtons(): HUDButton[] {
  return [
    { id: 'tab_buildings', label: 'Buildings', x: 8, y: 42, w: 85, h: 22 },
    { id: 'tab_recruit', label: 'Recruit', x: 98, y: 42, w: 75, h: 22 },
    { id: 'tab_army', label: 'Army', x: 178, y: 42, w: 65, h: 22 },
    { id: 'tab_market', label: 'Market', x: 248, y: 42, w: 70, h: 22 },
    { id: 'tab_info', label: 'Info', x: 323, y: 42, w: 60, h: 22 },
    { id: 'close_town', label: 'X', x: CANVAS_W - 80, y: 8, w: 70, h: 24 },
  ]
}
