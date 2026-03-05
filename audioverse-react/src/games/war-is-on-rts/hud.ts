/**
 * hud.ts — Per-viewport HUD rendering using Tiny Swords UI sprites.
 * In split-screen mode each viewport shows only its own player's panel.
 * Uses: Banners, Ribbons, Bars, Icons, Avatars, Papers, Swords, Wood Table.
 */
import type { GameState } from './types'
import { BUILDABLE_BUILDINGS, BUILDABLE_UNITS, BUILDING_DEFS, UNIT_DEFS, getPopCap, getPopUsed } from './types'
import { drawSpriteFrame, getFrameIndex } from '../../common/sprites/SpriteSheet'
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'

// ─── DrawHUD ─────────────────────────────────────────────────
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  spr: TinySwordsSprites,
  st: GameState,
  playerIdx: number,
  vpX: number,
  vpY: number,
  vpW: number,
  vpH: number,
) {
  const tick = st.tick
  const p = st.players[playerIdx]
  if (!p) return

  ctx.save()

  const panelW = Math.min(220, vpW - 16)
  const panelH = 56
  const px = vpX + 8
  const py = vpY + 8

  // ── Panel background ──
  if (spr.carved9) {
    ctx.drawImage(spr.carved9, px, py, panelW, panelH)
  } else {
    ctx.fillStyle = 'rgba(40, 30, 20, 0.85)'
    ctx.fillRect(px, py, panelW, panelH)
    ctx.strokeStyle = '#8b7355'
    ctx.lineWidth = 1
    ctx.strokeRect(px, py, panelW, panelH)
  }

  // ── Avatar ──
  const avatar = spr.avatars[playerIdx % spr.avatars.length]
  if (avatar) {
    ctx.drawImage(avatar, px + 4, py + 4, 28, 28)
  } else {
    const colorMap: Record<string, string> = { blue: '#3498db', red: '#e74c3c', purple: '#9b59b6', yellow: '#f1c40f' }
    ctx.fillStyle = colorMap[p.factionColor] || '#888'
    ctx.fillRect(px + 4, py + 4, 28, 28)
  }

  // ── Player name ──
  ctx.fillStyle = p.alive ? '#fff' : '#666'
  ctx.font = 'bold 11px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(p.name, px + 36, py + 16)

  if (!p.alive) {
    ctx.fillStyle = '#e74c3c'
    ctx.font = 'bold 9px sans-serif'
    ctx.fillText('DEFEATED', px + 36, py + 28)
    ctx.restore()
    return
  }

  // ── Resource icons and counts ──
  const resY = py + 28
  let rx = px + 36

  // Gold icon
  if (spr.goldIcon) {
    const fi = getFrameIndex(tick, spr.goldIcon.frameCount, 10)
    drawSpriteFrame(ctx, spr.goldIcon, fi, rx, resY, 14, 14)
  } else {
    ctx.fillStyle = '#f1c40f'
    ctx.beginPath(); ctx.arc(rx + 7, resY + 7, 5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = '#f1c40f'
  ctx.font = '10px sans-serif'
  ctx.fillText(`${Math.floor(p.gold)}`, rx + 16, resY + 11)
  rx += 50

  // Wood icon
  if (spr.woodIcon) {
    const fi = getFrameIndex(tick, spr.woodIcon.frameCount, 10)
    drawSpriteFrame(ctx, spr.woodIcon, fi, rx, resY, 14, 14)
  } else {
    ctx.fillStyle = '#8b6914'
    ctx.fillRect(rx, resY, 14, 14)
  }
  ctx.fillStyle = '#cd9b1d'
  ctx.fillText(`${Math.floor(p.wood)}`, rx + 16, resY + 11)
  rx += 50

  // Meat icon
  if (spr.meatIcon) {
    const fi = getFrameIndex(tick, spr.meatIcon.frameCount, 10)
    drawSpriteFrame(ctx, spr.meatIcon, fi, rx, resY, 14, 14)
  } else {
    ctx.fillStyle = '#ecf0f1'
    ctx.beginPath(); ctx.arc(rx + 7, resY + 7, 5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.fillStyle = '#ecf0f1'
  ctx.fillText(`${Math.floor(p.meat)}`, rx + 16, resY + 11)

  // ── Stars ──
  ctx.fillStyle = '#f1c40f'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`★${p.stars}`, px + panelW - 6, py + 16)

  // ── Population ──
  const popUsed = getPopUsed(st, playerIdx)
  const popCap = getPopCap(st, playerIdx)
  const popColor = popUsed >= popCap ? '#e74c3c' : '#ccc'
  ctx.fillStyle = popColor
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`Pop: ${popUsed}/${popCap}`, px + panelW - 6, py + 28)

  // ── Selected build/unit indicator ──
  const bKind = BUILDABLE_BUILDINGS[p.selectedBuild % BUILDABLE_BUILDINGS.length]
  const uKind = BUILDABLE_UNITS[p.selectedUnit % BUILDABLE_UNITS.length]
  const bDef = BUILDING_DEFS[bKind]
  const uDef = UNIT_DEFS[uKind]
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`Build: ${bKind} (${bDef.cost}${bDef.costType[0]})`, px + panelW - 6, py + panelH - 14)
  ctx.fillText(`Train: ${uKind} (${uDef.cost}${uDef.costType[0]})`, px + panelW - 6, py + panelH - 4)

  // ── Wave indicator (coop mode) ──
  if (st.coop) {
    ctx.fillStyle = '#e74c3c'
    ctx.font = 'bold 12px serif'
    ctx.textAlign = 'center'
    ctx.fillText(`Wave ${st.waveNumber}`, vpX + vpW / 2, py + 16)
    ctx.fillStyle = '#fff'
    ctx.font = '9px serif'
    const nextWave = 300 + st.waveNumber * 60 - st.waveTimer
    ctx.fillText(`Next: ${Math.ceil(nextWave / 30)}s`, vpX + vpW / 2, py + 28)
  }

  // ── Bottom bar: unit/building counts + controls ──
  const bottomY = vpY + vpH - 22
  ctx.fillStyle = 'rgba(40, 30, 20, 0.7)'
  ctx.fillRect(vpX, bottomY - 2, vpW, 24)

  // Unit counts for this player
  const myUnits = st.units.filter(u => u.owner === playerIdx).length
  const myBuildings = st.buildings.filter(b => b.owner === playerIdx).length
  const enemyCount = st.coop ? st.enemyUnits.length : st.units.filter(u => u.owner !== playerIdx && u.hp > 0).length

  ctx.fillStyle = '#ccc'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText(
    `Units: ${myUnits} | Buildings: ${myBuildings}${enemyCount > 0 ? ` | Enemies: ${enemyCount}` : ''}`,
    vpX + 6, bottomY + 10,
  )

  // Controls hint
  const kbGroup = playerIdx === 0 ? 'WASD' : 'Arrows'
  const buildKey = playerIdx === 0 ? 'Space' : 'Enter'
  const trainKey = playerIdx === 0 ? 'T' : '.'
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = '8px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`${kbGroup}:Move ${buildKey}:Build ${trainKey}:Train`, vpX + vpW - 6, bottomY + 10)

  // ── Swords decoration ──
  if (spr.swords) {
    ctx.globalAlpha = 0.1
    ctx.drawImage(spr.swords, vpX + vpW - 50, vpY + vpH - 60, 40, 40)
    ctx.globalAlpha = 1
  }

  ctx.restore()
}
