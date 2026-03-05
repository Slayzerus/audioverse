/**
 * combatRenderer.ts — Renders the tactical turn-based combat screen.
 *
 * 11×9 grid with creature stacks, active stack highlight, movement range,
 * attack targets, spell effects, siege elements, combat log.
 */
import type { Hero, CombatState } from './types'
import type { CombatStack } from './combat'
import { COMBAT_COLS, COMBAT_ROWS, COMBAT_TILE, CANVAS_W, CANVAS_H } from './constants'
import { ALL_CREATURES } from './factions'
import { getReachableCells, getActiveStack } from './combat'
import { lighten, truncate } from './helpers'
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'
import {
  drawPanel, drawRibbon, drawSpriteBar, drawUnit, drawEnemy, drawEffect,
  drawWoodTableBg, drawSwords, drawSpriteButton,
  creatureToSpriteUnit, creatureToEnemySprite,
} from './sprites'

// ═════════════════════════════════════════════════════════════
//  COMBAT GRID LAYOUT
// ═════════════════════════════════════════════════════════════
const GRID_OFFSET_X = Math.floor((CANVAS_W - COMBAT_COLS * COMBAT_TILE) / 2)
const GRID_OFFSET_Y = 40

export function getCombatGridOffset(): { x: number; y: number } {
  return { x: GRID_OFFSET_X, y: GRID_OFFSET_Y }
}

// ═════════════════════════════════════════════════════════════
//  MAIN COMBAT DRAW
// ═════════════════════════════════════════════════════════════
export function drawCombatScreen(
  ctx: CanvasRenderingContext2D,
  combat: CombatState,
  attackerHero: Hero | null,
  defenderHero: Hero | null,
  hoveredCell: { col: number; row: number } | null,
  selectedAction: 'move' | 'attack' | 'shoot' | 'spell' | null,
  _selectedSpellId: string | null,
  spr?: TinySwordsSprites | null,
  tick = 0,
) {
  const hasSpr = spr?.loaded

  // Background
  if (hasSpr) {
    drawWoodTableBg(ctx, spr!, CANVAS_W, CANVAS_H)
  } else {
    ctx.fillStyle = '#1a1510'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  }

  // Title bar
  if (hasSpr) {
    drawRibbon(ctx, spr!, `⚔ COMBAT — Round ${combat.round}`, 0, 0, CANVAS_W)
  } else {
    ctx.fillStyle = 'rgba(30,20,10,0.9)'
    ctx.fillRect(0, 0, CANVAS_W, 36)
    ctx.strokeStyle = '#8B7355'
    ctx.strokeRect(0, 0, CANVAS_W, 36)
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 14px monospace'
    ctx.textBaseline = 'middle'
    ctx.fillText(`⚔ COMBAT — Round ${combat.round}`, 12, 18)
  }

  // Hero names
  if (attackerHero) {
    ctx.fillStyle = '#8af'
    ctx.fillText(`${attackerHero.name} (ATK)`, 200, 18)
  }
  if (defenderHero) {
    ctx.fillStyle = '#f88'
    ctx.fillText(`${defenderHero.name} (DEF)`, 450, 18)
  }

  const active = getActiveStack(combat)

  // Movement range
  let reachable: Set<string> | null = null
  if (active && !combat.finished) {
    reachable = getReachableCells(active, combat.stacks, combat.siege)
  }

  // ── Grid ──
  drawCombatGrid(ctx, combat, reachable, active, hoveredCell, selectedAction, spr)

  // ── Stacks ──
  for (const stack of combat.stacks) {
    if (stack.count <= 0) continue
    drawCombatStack(ctx, stack, stack === active, spr, tick)
  }

  // ── Siege elements ──
  if (combat.siege) {
    drawSiege(ctx, combat.siege, spr, tick)
  }

  // ── Hovered cell info ──
  if (hoveredCell) {
    const hStack = combat.stacks.find((s: CombatStack) =>
      s.x === hoveredCell.col && s.y === hoveredCell.row && s.count > 0
    )
    if (hStack) {
      drawStackTooltip(ctx, hStack, spr)
    }
  }

  // ── Combat log ──
  drawCombatLog(ctx, combat.log, spr)

  // ── Action buttons ──
  drawCombatButtons(ctx, combat, active, spr)

  // ── Active stack indicator ──
  if (active && !combat.finished) {
    const def = ALL_CREATURES[active.creatureId]!
    ctx.fillStyle = active.side === 'attacker' ? '#8af' : '#f88'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'center'
    ctx.fillText(
      `▸ ${def.name} (${active.count}) — Speed ${def.speed}`,
      CANVAS_W / 2, CANVAS_H - 8,
    )
    ctx.textAlign = 'left'
  }

  // Result overlay
  if (combat.finished) {
    drawCombatResult(ctx, combat, spr)
  }
}

// ═════════════════════════════════════════════════════════════
//  GRID DRAWING
// ═════════════════════════════════════════════════════════════
function drawCombatGrid(
  ctx: CanvasRenderingContext2D,
  combat: CombatState,
  reachable: Set<string> | null,
  active: CombatStack | null,
  hoveredCell: { col: number; row: number } | null,
  selectedAction: string | null,
  spr?: TinySwordsSprites | null,
) {
  const hasSpr = spr?.loaded

  for (let r = 0; r < COMBAT_ROWS; r++) {
    for (let c = 0; c < COMBAT_COLS; c++) {
      const px = GRID_OFFSET_X + c * COMBAT_TILE
      const py = GRID_OFFSET_Y + r * COMBAT_TILE
      const key = `${c},${r}`

      // Base tile
      if (hasSpr && spr!.tilemaps[0]) {
        // Use green terrain tilemap for combat ground
        const isDark = (c + r) % 2 === 0
        const tcol = isDark ? 3 : 4
        ctx.drawImage(spr!.tilemaps[0], tcol * 64, 2 * 64, 64, 64, px, py, COMBAT_TILE, COMBAT_TILE)
      } else {
        const isDark = (c + r) % 2 === 0
        ctx.fillStyle = isDark ? '#3a3020' : '#4a3a28'
        ctx.fillRect(px, py, COMBAT_TILE, COMBAT_TILE)
      }

      // Movement range highlight
      if (reachable?.has(key)) {
        ctx.fillStyle = 'rgba(60,120,200,0.2)'
        ctx.fillRect(px, py, COMBAT_TILE, COMBAT_TILE)
      }

      // Enemy attack target highlight
      if (active && selectedAction === 'attack') {
        const enemySide = active.side === 'attacker' ? 'defender' : 'attacker'
        const stack = combat.stacks.find((s: CombatStack) => s.x === c && s.y === r && s.count > 0 && s.side === enemySide)
        if (stack) {
          ctx.fillStyle = 'rgba(200,50,50,0.25)'
          ctx.fillRect(px, py, COMBAT_TILE, COMBAT_TILE)
        }
      }

      // Hover
      if (hoveredCell && hoveredCell.col === c && hoveredCell.row === r) {
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'
        ctx.lineWidth = 2
        ctx.strokeRect(px + 1, py + 1, COMBAT_TILE - 2, COMBAT_TILE - 2)
      }

      // Grid
      ctx.strokeStyle = 'rgba(100,80,60,0.3)'
      ctx.lineWidth = 0.5
      ctx.strokeRect(px, py, COMBAT_TILE, COMBAT_TILE)
    }
  }

  // Obstacles
  for (const obs of combat.obstacles) {
    const px = GRID_OFFSET_X + obs.x * COMBAT_TILE
    const py = GRID_OFFSET_Y + obs.y * COMBAT_TILE
    if (hasSpr && spr!.rocks.length > 0) {
      const rock = spr!.rocks[(obs.x + obs.y) % spr!.rocks.length]
      ctx.drawImage(rock, px + 4, py + 4, COMBAT_TILE - 8, COMBAT_TILE - 8)
    } else {
      ctx.fillStyle = '#5a4a3a'
      ctx.fillRect(px + 4, py + 4, COMBAT_TILE - 8, COMBAT_TILE - 8)
      ctx.fillStyle = '#888'
      ctx.font = `${COMBAT_TILE - 16}px serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🪨', px + COMBAT_TILE / 2, py + COMBAT_TILE / 2)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
    }
  }
}

// ═════════════════════════════════════════════════════════════
//  CREATURE STACKS
// ═════════════════════════════════════════════════════════════
function drawCombatStack(ctx: CanvasRenderingContext2D, stack: CombatStack, isActive: boolean, spr?: TinySwordsSprites | null, tick = 0) {
  const def = ALL_CREATURES[stack.creatureId]!
  const px = GRID_OFFSET_X + stack.x * COMBAT_TILE
  const py = GRID_OFFSET_Y + stack.y * COMBAT_TILE
  const hasSpr = spr?.loaded

  // Try to draw sprite unit
  let drewSprite = false
  if (hasSpr) {
    const unitType = creatureToSpriteUnit(stack.creatureId)
    const enemyType = creatureToEnemySprite(stack.creatureId)
    const flipX = stack.side === 'defender'
    const anim = isActive ? 'idle' : 'idle'

    if (unitType) {
      const fc = stack.side === 'attacker' ? 'blue' : 'red'
      drawUnit(ctx, spr!, unitType, anim, fc, px, py, COMBAT_TILE, tick, flipX)
      drewSprite = true
    } else if (enemyType) {
      drawEnemy(ctx, spr!, enemyType, anim, px, py, COMBAT_TILE, tick, flipX)
      drewSprite = true
    }
  }

  if (!drewSprite) {
    const bgColor = stack.side === 'attacker' ? '#2a4a7a' : '#7a2a2a'
    ctx.fillStyle = isActive ? lighten(bgColor, 0.3) : bgColor
    ctx.fillRect(px + 2, py + 2, COMBAT_TILE - 4, COMBAT_TILE - 4)

    // Creature shape/emoji
    ctx.fillStyle = '#fff'
    ctx.font = `${COMBAT_TILE - 18}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(def.shape, px + COMBAT_TILE / 2, py + COMBAT_TILE / 2 - 4)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }

  // Active glow
  if (isActive) {
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.strokeRect(px + 1, py + 1, COMBAT_TILE - 2, COMBAT_TILE - 2)
  }

  // HP bar
  const hpRatio = stack.currentHp / stack.maxHp
  const barW = COMBAT_TILE - 8
  const barH = 4
  if (hasSpr) {
    drawSpriteBar(ctx, spr!, px + 4, py + COMBAT_TILE - 8, barW, barH, hpRatio,
      hpRatio > 0.5 ? '#4a4' : hpRatio > 0.25 ? '#aa4' : '#a44')
  } else {
    ctx.fillStyle = '#333'
    ctx.fillRect(px + 4, py + COMBAT_TILE - 8, barW, barH)
    ctx.fillStyle = hpRatio > 0.5 ? '#4a4' : hpRatio > 0.25 ? '#aa4' : '#a44'
    ctx.fillRect(px + 4, py + COMBAT_TILE - 8, barW * hpRatio, barH)
  }

  // Count
  ctx.font = 'bold 10px monospace'
  ctx.fillStyle = '#FFD700'
  ctx.textAlign = 'center'
  ctx.fillText(`${stack.count}`, px + COMBAT_TILE / 2, py + COMBAT_TILE - 14)
  ctx.textAlign = 'left'

  // Status effect indicators
  if (stack.statusEffects.length > 0) {
    ctx.fillStyle = '#ff0'
    ctx.font = '8px monospace'
    ctx.fillText('✦', px + 4, py + 12)
  }

  // Ranged indicator
  if (def.shots > 0) {
    ctx.fillStyle = '#aaf'
    ctx.font = '8px monospace'
    ctx.textAlign = 'right'
    ctx.fillText(`🏹${stack.shotsLeft}`, px + COMBAT_TILE - 4, py + 12)
    ctx.textAlign = 'left'
  }
}

// ═════════════════════════════════════════════════════════════
//  SIEGE ELEMENTS
// ═════════════════════════════════════════════════════════════
function drawSiege(ctx: CanvasRenderingContext2D, siege: import('./types').SiegeState, spr?: TinySwordsSprites | null, _tick = 0) {
  const hasSpr = spr?.loaded
  // Walls (on the right side, columns 8-9)
  const wallCol = COMBAT_COLS - 3
  for (let i = 0; i < siege.wallHP.length; i++) {
    const row = 1 + i * 3
    const px = GRID_OFFSET_X + wallCol * COMBAT_TILE
    const py = GRID_OFFSET_Y + row * COMBAT_TILE
    const hpRatio = siege.wallHP[i] / 100

    if (hpRatio <= 0) {
      if (hasSpr) {
        drawEffect(ctx, spr!, 'explosion', px, py, COMBAT_TILE, _tick)
      } else {
        ctx.fillStyle = '#4a3a2a'
        ctx.font = '16px serif'
        ctx.textAlign = 'center'
        ctx.fillText('💥', px + COMBAT_TILE / 2, py + COMBAT_TILE / 2)
      }
    } else {
      ctx.fillStyle = `rgb(${Math.floor(139 * hpRatio)},${Math.floor(115 * hpRatio)},${Math.floor(85 * hpRatio)})`
      ctx.fillRect(px + 8, py, COMBAT_TILE - 16, COMBAT_TILE * 2)
      ctx.strokeStyle = '#555'
      ctx.strokeRect(px + 8, py, COMBAT_TILE - 16, COMBAT_TILE * 2)
    }
    ctx.textAlign = 'left'
  }

  // Gate
  const gateRow = Math.floor(COMBAT_ROWS / 2)
  const gpx = GRID_OFFSET_X + wallCol * COMBAT_TILE
  const gpy = GRID_OFFSET_Y + gateRow * COMBAT_TILE
  ctx.fillStyle = siege.gateOpen ? '#4a6a3a' : '#5a3a2a'
  ctx.fillRect(gpx + 4, gpy + 4, COMBAT_TILE - 8, COMBAT_TILE - 8)
  ctx.font = '16px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(siege.gateOpen ? '🚪' : '🔒', gpx + COMBAT_TILE / 2, gpy + COMBAT_TILE / 2)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  // Moat
  if (siege.moatActive) {
    const moatCol = wallCol - 1
    for (let r = 0; r < COMBAT_ROWS; r++) {
      const mpx = GRID_OFFSET_X + moatCol * COMBAT_TILE
      const mpy = GRID_OFFSET_Y + r * COMBAT_TILE
      if (hasSpr && spr!.waterBg) {
        ctx.globalAlpha = 0.6
        ctx.drawImage(spr!.waterBg, 0, 0, 64, 64, mpx, mpy, COMBAT_TILE, COMBAT_TILE)
        ctx.globalAlpha = 1.0
      } else {
        ctx.fillStyle = 'rgba(30,60,120,0.3)'
        ctx.fillRect(mpx, mpy, COMBAT_TILE, COMBAT_TILE)
      }
    }
  }

  // Towers
  for (let i = 0; i < siege.towerHP.length; i++) {
    const row = i === 0 ? 0 : COMBAT_ROWS - 1
    const tpx = GRID_OFFSET_X + (COMBAT_COLS - 1) * COMBAT_TILE
    const tpy = GRID_OFFSET_Y + row * COMBAT_TILE
    if (siege.towerHP[i] > 0) {
      ctx.fillStyle = '#8B7355'
      ctx.fillRect(tpx + 4, tpy + 4, COMBAT_TILE - 8, COMBAT_TILE - 8)
      ctx.font = '14px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('🗼', tpx + COMBAT_TILE / 2, tpy + COMBAT_TILE / 2)
    }
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
  }
}

// ═════════════════════════════════════════════════════════════
//  COMBAT LOG
// ═════════════════════════════════════════════════════════════
function drawCombatLog(ctx: CanvasRenderingContext2D, log: string[], spr?: TinySwordsSprites | null) {
  const logY = GRID_OFFSET_Y + COMBAT_ROWS * COMBAT_TILE + 8
  const logH = CANVAS_H - logY - 24
  const maxLines = Math.floor(logH / 13)
  const hasSpr = spr?.loaded

  if (hasSpr) {
    drawPanel(ctx, spr!, 4, logY, CANVAS_W - 8, logH)
  } else {
    ctx.fillStyle = 'rgba(15,10,5,0.85)'
    ctx.fillRect(4, logY, CANVAS_W - 8, logH)
    ctx.strokeStyle = '#5a4a3a'
    ctx.strokeRect(4, logY, CANVAS_W - 8, logH)
  }

  ctx.font = '10px monospace'
  ctx.textBaseline = 'top'

  const visible = log.slice(-maxLines)
  for (let i = 0; i < visible.length; i++) {
    const alpha = 0.5 + 0.5 * (i / visible.length)
    ctx.fillStyle = `rgba(220,210,190,${alpha})`
    ctx.fillText(truncate(visible[i], 100), 10, logY + 3 + i * 13)
  }
  ctx.textBaseline = 'alphabetic'
}

// ═════════════════════════════════════════════════════════════
//  COMBAT ACTION BUTTONS
// ═════════════════════════════════════════════════════════════
function drawCombatButtons(ctx: CanvasRenderingContext2D, combat: CombatState, active: CombatStack | null, spr?: TinySwordsSprites | null) {
  if (combat.finished || !active || active.side !== 'attacker') return
  const hasSpr = spr?.loaded

  const btns = [
    { label: 'Wait (W)', x: CANVAS_W - 140, y: GRID_OFFSET_Y },
    { label: 'Defend (D)', x: CANVAS_W - 140, y: GRID_OFFSET_Y + 26 },
    { label: 'Flee (F)', x: CANVAS_W - 140, y: GRID_OFFSET_Y + 52 },
    { label: 'Spell (C)', x: CANVAS_W - 140, y: GRID_OFFSET_Y + 78 },
    { label: 'Auto (A)', x: CANVAS_W - 140, y: GRID_OFFSET_Y + 104 },
  ]

  for (const btn of btns) {
    if (hasSpr) {
      drawSpriteButton(ctx, spr!, btn.label, btn.x, btn.y, 130, 22, false)
    } else {
      ctx.fillStyle = '#3a3020'
      ctx.fillRect(btn.x, btn.y, 130, 22)
      ctx.strokeStyle = '#8B7355'
      ctx.strokeRect(btn.x, btn.y, 130, 22)
      ctx.fillStyle = '#ddd'
      ctx.font = '10px monospace'
      ctx.textBaseline = 'middle'
      ctx.fillText(btn.label, btn.x + 8, btn.y + 11)
    }
  }
  ctx.textBaseline = 'alphabetic'
}

// ═════════════════════════════════════════════════════════════
//  STACK TOOLTIP
// ═════════════════════════════════════════════════════════════
function drawStackTooltip(ctx: CanvasRenderingContext2D, stack: CombatStack, spr?: TinySwordsSprites | null) {
  const def = ALL_CREATURES[stack.creatureId]!
  const hasSpr = spr?.loaded
  const lines = [
    `${def.name} (Tier ${def.tier})`,
    `Count: ${stack.count}  HP: ${stack.currentHp}/${def.hp}`,
    `ATK: ${def.attack}  DEF: ${def.defense}  SPD: ${def.speed}`,
    `DMG: ${def.minDmg}-${def.maxDmg}  Init: ${def.initiative}`,
  ]
  if (def.shots > 0) lines.push(`Shots: ${stack.shotsLeft}/${def.shots}`)
  if (def.abilities.length > 0) lines.push(`Abilities: ${def.abilities.slice(0, 3).join(', ')}`)

  const w = 220
  const h = lines.length * 14 + 10
  const tx = Math.min(CANVAS_W - w - 10, GRID_OFFSET_X + stack.x * COMBAT_TILE + COMBAT_TILE)
  const ty = Math.max(10, GRID_OFFSET_Y + stack.y * COMBAT_TILE - h)

  if (hasSpr) {
    drawPanel(ctx, spr!, tx, ty, w, h)
  } else {
    ctx.fillStyle = 'rgba(10,8,5,0.95)'
    ctx.fillRect(tx, ty, w, h)
    ctx.strokeStyle = '#8B7355'
    ctx.strokeRect(tx, ty, w, h)
  }

  ctx.font = '10px monospace'
  ctx.textBaseline = 'top'
  for (let i = 0; i < lines.length; i++) {
    ctx.fillStyle = i === 0 ? '#FFD700' : '#ddd'
    ctx.fillText(lines[i], tx + 6, ty + 5 + i * 14)
  }
  ctx.textBaseline = 'alphabetic'
}

// ═════════════════════════════════════════════════════════════
//  COMBAT RESULT OVERLAY
// ═════════════════════════════════════════════════════════════
function drawCombatResult(ctx: CanvasRenderingContext2D, combat: CombatState, spr?: TinySwordsSprites | null) {
  const hasSpr = spr?.loaded
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  const panelW = 300
  const panelH = 120
  const px = (CANVAS_W - panelW) / 2
  const py = (CANVAS_H - panelH) / 2

  if (hasSpr) {
    drawPanel(ctx, spr!, px, py, panelW, panelH)
    // Draw crossed swords decoration
    drawSwords(ctx, spr!, px + panelW / 2 - 30, py - 20, 60)
  } else {
    ctx.fillStyle = '#2a2018'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 2
    ctx.strokeRect(px, py, panelW, panelH)
  }

  ctx.font = 'bold 18px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = combat.winner === 'attacker' ? '#4a4' : '#a44'
  ctx.fillText(
    combat.winner === 'attacker' ? '⚔ VICTORY!' : '💀 DEFEAT',
    px + panelW / 2,
    py + 30,
  )

  ctx.font = '12px monospace'
  ctx.fillStyle = '#ddd'
  ctx.fillText(
    `${combat.winner} wins after ${combat.round} rounds`,
    px + panelW / 2,
    py + 60,
  )

  ctx.fillStyle = '#aaa'
  ctx.font = '11px monospace'
  ctx.fillText('Click to continue...', px + panelW / 2, py + 90)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
}
