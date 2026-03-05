/**
 * renderer.ts — Split-screen canvas rendering for War Is On RTS.
 * Each player gets their own viewport with camera following their commander.
 * Layout: 1 player = full, 2 = side-by-side, 3-4 = quadrants.
 *
 * Uses Tiny Swords sprite sheets with frame-accurate animation.
 */
import type { GameState, Unit, EnemyUnit, Building, ResourceNode, Decoration, Commander, Projectile, Effect, Camera } from './types'
import { CMD_R, BUILDING_SIZE, BUILDING_DEFS, UNIT_DEFS, BUILDABLE_BUILDINGS, VIEWPORT_W, VIEWPORT_H, dist } from './types'
import { drawSpriteFrame, getFrameIndex, type SpriteSheetData } from '../../common/sprites/SpriteSheet'
import type { TinySwordsSprites } from '../../common/sprites/useTinySwordsSprites2'
import type { GameFactionColor } from '../../common/sprites/TinySwordsAssets'
import { drawHUD } from './hud'

// ─── Helper: draw static image centered ──────────────────────
function drawImgCentered(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, x: number, y: number, w: number, h: number) {
  if (!img) return
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h)
}

// ─── Helper: draw a sprite sheet frame centered ──────────────
function drawSheetCentered(
  ctx: CanvasRenderingContext2D,
  sheet: SpriteSheetData | null,
  frame: number,
  x: number, y: number, w: number, h: number,
  flipX = false,
) {
  if (!sheet) return
  drawSpriteFrame(ctx, sheet, frame, x - w / 2, y - h / 2, w, h, flipX)
}

// ─── Faction color to sprite key ─────────────────────────────
function fc2cap(fc: GameFactionColor): 'blue' | 'red' | 'purple' | 'yellow' {
  return fc
}

// ─── Viewport layout computation ─────────────────────────────
interface ViewportRect { x: number; y: number; w: number; h: number; playerIdx: number }

function computeViewports(playerCount: number, canvasW: number, canvasH: number): ViewportRect[] {
  if (playerCount <= 1) {
    return [{ x: 0, y: 0, w: canvasW, h: canvasH, playerIdx: 0 }]
  }
  if (playerCount === 2) {
    const hw = Math.floor(canvasW / 2)
    return [
      { x: 0, y: 0, w: hw, h: canvasH, playerIdx: 0 },
      { x: hw, y: 0, w: canvasW - hw, h: canvasH, playerIdx: 1 },
    ]
  }
  // 3-4 players: quadrants
  const hw = Math.floor(canvasW / 2)
  const hh = Math.floor(canvasH / 2)
  const vps: ViewportRect[] = [
    { x: 0, y: 0, w: hw, h: hh, playerIdx: 0 },
    { x: hw, y: 0, w: canvasW - hw, h: hh, playerIdx: 1 },
    { x: 0, y: hh, w: hw, h: canvasH - hh, playerIdx: 2 },
  ]
  if (playerCount >= 4) {
    vps.push({ x: hw, y: hh, w: canvasW - hw, h: canvasH - hh, playerIdx: 3 })
  }
  return vps
}

// ─── Terrain color palettes per terrain type ─────────────────
const TERRAIN_COLORS: Record<string, { water: string; ground: string; accent: string }> = {
  grass: { water: '#1a4a6e', ground: '#4a7a3a', accent: '#5a8a4a' },
  sand:  { water: '#1a5a7e', ground: '#c4a35a', accent: '#d4b36a' },
  snow:  { water: '#2a5a7e', ground: '#d8dce8', accent: '#c8ccd8' },
  dark:  { water: '#0a2a3e', ground: '#3a4a3a', accent: '#4a5a4a' },
}

// ─── Main draw function ──────────────────────────────────────
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  st: GameState,
  spr: TinySwordsSprites,
) {
  const playerCount = st.players.filter(p => p.alive).length || st.players.length
  // Canvas size: for 1 player use VIEWPORT_W×VIEWPORT_H scaled, for 2+ use full layout
  const canvasW = playerCount === 1 ? VIEWPORT_W * 2 : VIEWPORT_W * 2
  const canvasH = playerCount <= 2 ? VIEWPORT_H * 2 : VIEWPORT_H * 2
  canvas.width = canvasW
  canvas.height = canvasH

  if (!spr.loaded) {
    // Loading screen
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, canvasW, canvasH)
    ctx.fillStyle = '#e0c080'
    ctx.font = 'bold 24px serif'
    ctx.textAlign = 'center'
    ctx.fillText('Loading Tiny Swords...', canvasW / 2, canvasH / 2 - 20)
    const pw = 300, ph = 16
    ctx.strokeStyle = '#e0c080'
    ctx.strokeRect(canvasW / 2 - pw / 2, canvasH / 2 + 10, pw, ph)
    ctx.fillStyle = '#e0c080'
    ctx.fillRect(canvasW / 2 - pw / 2 + 2, canvasH / 2 + 12, (pw - 4) * spr.progress, ph - 4)
    ctx.font = '14px serif'
    ctx.fillText(`${Math.round(spr.progress * 100)}%`, canvasW / 2, canvasH / 2 + 50)
    return
  }

  const viewports = computeViewports(st.players.length, canvasW, canvasH)

  // Clear entire canvas
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Draw each player's viewport
  for (const vp of viewports) {
    if (vp.playerIdx >= st.players.length) continue
    const cam = st.cameras[vp.playerIdx]
    if (!cam) continue

    ctx.save()
    // Clip to this viewport rectangle
    ctx.beginPath()
    ctx.rect(vp.x, vp.y, vp.w, vp.h)
    ctx.clip()

    // Translate so camera position maps to viewport origin
    ctx.translate(vp.x - cam.x, vp.y - cam.y)

    // Draw the world from this camera's perspective
    drawWorld(ctx, st, spr, cam, vp)

    ctx.restore()

    // Draw per-player HUD on top (in screen space, not world space)
    ctx.save()
    ctx.beginPath()
    ctx.rect(vp.x, vp.y, vp.w, vp.h)
    ctx.clip()
    drawHUD(ctx, spr, st, vp.playerIdx, vp.x, vp.y, vp.w, vp.h)
    ctx.restore()

    // Draw minimap in bottom-right of this viewport
    drawMinimap(ctx, st, vp)
  }

  // Draw viewport borders (separator lines)
  if (viewports.length > 1) {
    ctx.strokeStyle = '#2a1a0a'
    ctx.lineWidth = 3
    if (viewports.length >= 2) {
      // Vertical divider
      const mx = Math.floor(canvasW / 2)
      ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, canvasH); ctx.stroke()
    }
    if (viewports.length >= 3) {
      // Horizontal divider
      const my = Math.floor(canvasH / 2)
      ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(canvasW, my); ctx.stroke()
    }
  }
}

// ─── Draw the entire world (within a clipped/translated viewport) ───
function drawWorld(
  ctx: CanvasRenderingContext2D,
  st: GameState,
  spr: TinySwordsSprites,
  cam: Camera,
  vp: ViewportRect,
) {
  const tick = st.tick
  const palette = TERRAIN_COLORS[st.terrainType] || TERRAIN_COLORS.grass

  // Visible area bounds (in world coords)
  const vx0 = cam.x
  const vy0 = cam.y
  const vx1 = cam.x + vp.w
  const vy1 = cam.y + vp.h

  // Helper: is entity in (or near) viewport?
  const inView = (x: number, y: number, margin = 60) =>
    x > vx0 - margin && x < vx1 + margin && y > vy0 - margin && y < vy1 + margin

  // ─── 1. WATER BACKGROUND ──────────────────────────────────
  if (spr.waterBg) {
    const tw = spr.waterBg.width || 64
    const th = spr.waterBg.height || 64
    const sx = Math.floor(vx0 / tw) * tw
    const sy = Math.floor(vy0 / th) * th
    for (let y = sy; y < vy1; y += th)
      for (let x = sx; x < vx1; x += tw)
        ctx.drawImage(spr.waterBg, x, y)
  } else {
    ctx.fillStyle = palette.water
    ctx.fillRect(vx0, vy0, vp.w, vp.h)
  }

  // ─── 2. ANIMATED WATER OVERLAY ────────────────────────────
  if (spr.waterAnim) {
    const fi = getFrameIndex(tick, spr.waterAnim.frameCount, 8)
    const tw = spr.waterAnim.frameWidth
    const th = spr.waterAnim.frameHeight
    ctx.globalAlpha = 0.3
    const sx = Math.floor(vx0 / tw) * tw
    const sy = Math.floor(vy0 / th) * th
    for (let y = sy; y < vy1; y += th)
      for (let x = sx; x < vx1; x += tw)
        drawSpriteFrame(ctx, spr.waterAnim, fi, x, y, tw, th)
    ctx.globalAlpha = 1
  }

  // ─── 3. GROUND TILES (land) ───────────────────────────────
  if (spr.groundFlat) {
    const gw = spr.groundFlat.width
    const gh = spr.groundFlat.height
    const margin = 40
    const sx = Math.max(margin, Math.floor((vx0 - margin) / gw) * gw + margin)
    const sy = Math.max(margin, Math.floor((vy0 - margin) / gh) * gh + margin)
    for (let y = sy; y < Math.min(st.mapH - margin, vy1); y += gh)
      for (let x = sx; x < Math.min(st.mapW - margin, vx1); x += gw)
        ctx.drawImage(spr.groundFlat, x, y, gw, gh)
  } else {
    ctx.fillStyle = palette.ground
    ctx.fillRect(40, 40, st.mapW - 80, st.mapH - 80)
  }

  // ─── Water areas (rivers/lakes) ───────────────────────────
  for (const wa of st.waterAreas) {
    if (wa.x + wa.w < vx0 || wa.x > vx1 || wa.y + wa.h < vy0 || wa.y > vy1) continue
    if (spr.waterBg) {
      const tw = spr.waterBg.width || 64
      const th = spr.waterBg.height || 64
      ctx.save()
      ctx.beginPath()
      ctx.rect(wa.x, wa.y, wa.w, wa.h)
      ctx.clip()
      for (let y = wa.y; y < wa.y + wa.h; y += th)
        for (let x = wa.x; x < wa.x + wa.w; x += tw)
          ctx.drawImage(spr.waterBg, x, y)
      if (spr.waterAnim) {
        const fi = getFrameIndex(tick, spr.waterAnim.frameCount, 8)
        const tw2 = spr.waterAnim.frameWidth
        const th2 = spr.waterAnim.frameHeight
        ctx.globalAlpha = 0.4
        for (let y = wa.y; y < wa.y + wa.h; y += th2)
          for (let x = wa.x; x < wa.x + wa.w; x += tw2)
            drawSpriteFrame(ctx, spr.waterAnim, fi, x, y, tw2, th2)
        ctx.globalAlpha = 1
      }
      ctx.restore()
    } else {
      ctx.fillStyle = palette.water
      ctx.fillRect(wa.x, wa.y, wa.w, wa.h)
    }
    // Foam border
    if (spr.foam) {
      const fi = getFrameIndex(tick, spr.foam.frameCount, 10)
      const fw = spr.foam.frameWidth
      const fh = spr.foam.frameHeight
      for (let x = wa.x; x < wa.x + wa.w; x += fw) {
        drawSpriteFrame(ctx, spr.foam, fi, x, wa.y - fh / 2, fw, fh)
        drawSpriteFrame(ctx, spr.foam, fi, x, wa.y + wa.h - fh / 2, fw, fh)
      }
    }
  }

  // Foam at map edges
  if (spr.foam) {
    const fi = getFrameIndex(tick, spr.foam.frameCount, 10)
    const fw = spr.foam.frameWidth
    const fh = spr.foam.frameHeight
    const sx = Math.floor(vx0 / fw) * fw
    for (let x = sx; x < vx1; x += fw) {
      drawSpriteFrame(ctx, spr.foam, fi, x, 30, fw, fh)
      drawSpriteFrame(ctx, spr.foam, fi, x, st.mapH - 30 - fh, fw, fh)
    }
  }

  // ─── 4. WATER ROCKS at edges ──────────────────────────────
  if (spr.waterRocks.length > 0) {
    for (let i = 0; i < Math.min(6, spr.waterRocks.length); i++) {
      const wr = spr.waterRocks[i % spr.waterRocks.length]
      const wx = (i * st.mapW / 5) + 40
      const wy = i % 2 === 0 ? 15 : st.mapH - 25
      if (inView(wx, wy, 60)) ctx.drawImage(wr, wx, wy, 40, 40)
    }
  }

  // ─── 5. DECORATIONS ──────────────────────────────────────
  for (const d of st.decorations) {
    if (d.kind === 'cloud') continue // clouds drawn later on top
    if (!inView(d.x, d.y, 40)) continue
    drawDecoration(ctx, spr, d, tick)
  }

  // ─── 6. RESOURCE NODES ───────────────────────────────────
  for (const rn of st.resourceNodes) {
    if (!inView(rn.x, rn.y, 40)) continue
    drawResource(ctx, spr, rn, tick)
  }

  // ─── 7. BUILDINGS ────────────────────────────────────────
  for (const b of st.buildings) {
    if (!inView(b.x, b.y, BUILDING_SIZE)) continue
    drawBuilding(ctx, spr, b, st)
  }

  // ─── 8. UNITS (sorted by Y) ─────────────────────────────
  const sortedUnits = [...st.units].filter(u => inView(u.x, u.y)).sort((a, b) => a.y - b.y)
  for (const u of sortedUnits) {
    drawUnit(ctx, spr, u, st)
  }

  // ─── 9. ENEMY UNITS ─────────────────────────────────────
  const sortedEnemies = [...st.enemyUnits].filter(e => inView(e.x, e.y)).sort((a, b) => a.y - b.y)
  for (const eu of sortedEnemies) {
    drawEnemy(ctx, spr, eu)
  }

  // ─── 10. PROJECTILES ────────────────────────────────────
  for (const p of st.projectiles) {
    if (!inView(p.x, p.y, 20)) continue
    drawProjectile(ctx, spr, p)
  }

  // ─── 11. EFFECTS ─────────────────────────────────────────
  for (const e of st.effects) {
    if (!inView(e.x, e.y, 40)) continue
    drawEffect(ctx, spr, e)
  }

  // ─── 12. COMMANDERS ─────────────────────────────────────
  for (const cmd of st.commanders) {
    if (!inView(cmd.x, cmd.y, CMD_R * 3)) continue
    drawCommander(ctx, spr, cmd, st)
  }

  // ─── 12b. BUILD PREVIEW GHOST ───────────────────────────
  // Show a translucent preview of the selected building at the commander's position
  for (const cmd of st.commanders) {
    if (!inView(cmd.x, cmd.y, BUILDING_SIZE)) continue
    const ps = st.players[cmd.owner]
    if (!ps || !ps.alive) continue
    const bIdx = ps.selectedBuild % BUILDABLE_BUILDINGS.length
    const bKind = BUILDABLE_BUILDINGS[bIdx]
    const bDef = BUILDING_DEFS[bKind]
    const canAfford = ps[bDef.costType] >= bDef.cost
    const tooClose = st.buildings.some(b => dist(b, cmd) < BUILDING_SIZE * 2.2)

    ctx.globalAlpha = 0.35
    const ghostSize = BUILDING_SIZE + 16
    const fc = fc2cap(ps.factionColor)
    const bldgs = spr.buildings[fc]
    let img: HTMLImageElement | null = null
    switch (bKind) {
      case 'barracks':  img = bldgs?.barracks; break
      case 'archery':   img = bldgs?.archery; break
      case 'house':     img = bldgs?.house1; break
      case 'tower':     img = bldgs?.tower || spr.knightBuildings[fc]?.tower; break
      case 'monastery': img = bldgs?.monastery; break
    }
    if (img) {
      drawImgCentered(ctx, img, cmd.x, cmd.y, ghostSize, ghostSize)
    } else {
      ctx.fillStyle = canAfford ? '#2ecc71' : '#e74c3c'
      ctx.fillRect(cmd.x - ghostSize / 2, cmd.y - ghostSize / 2, ghostSize, ghostSize)
    }
    // Red/green outline
    ctx.strokeStyle = (canAfford && !tooClose) ? '#2ecc71' : '#e74c3c'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.strokeRect(cmd.x - ghostSize / 2, cmd.y - ghostSize / 2, ghostSize, ghostSize)
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Tower range preview
    if (bKind === 'tower' && bDef.attackRange) {
      ctx.strokeStyle = 'rgba(255,100,100,0.2)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(cmd.x, cmd.y, bDef.attackRange, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  // ─── 12c. FLOATING TEXTS ───────────────────────────────
  for (const ft of st.floatingTexts) {
    if (!inView(ft.x, ft.y, 40)) continue
    const progress = ft.tick / ft.maxTick
    ctx.globalAlpha = 1 - progress * 0.8
    ctx.fillStyle = ft.color
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ft.text, ft.x, ft.y)
    ctx.globalAlpha = 1
  }

  // ─── 13. CLOUDS (above everything) ──────────────────────
  if (spr.clouds.length > 0) {
    ctx.globalAlpha = 0.15
    for (const d of st.decorations) {
      if (d.kind !== 'cloud') continue
      if (d.variant >= spr.clouds.length) continue
      const cld = spr.clouds[d.variant]
      if (!cld) continue
      const ox = (tick * 0.2 + d.x) % (st.mapW + 200) - 100
      if (!inView(ox, d.y, 200)) continue
      ctx.drawImage(cld, ox, d.y, cld.width * d.scale * 0.5, cld.height * d.scale * 0.5)
    }
    ctx.globalAlpha = 1
  }

  // ─── 14. Map border ──────────────────────────────────────
  ctx.strokeStyle = '#3a2a1a'
  ctx.lineWidth = 3
  ctx.strokeRect(0, 0, st.mapW, st.mapH)
}

// ─── Draw minimap ────────────────────────────────────────────
function drawMinimap(ctx: CanvasRenderingContext2D, st: GameState, vp: ViewportRect) {
  const mmW = 100
  const mmH = Math.round(mmW * (st.mapH / st.mapW))
  const mx = vp.x + vp.w - mmW - 6
  const my = vp.y + vp.h - mmH - 6
  const scaleX = mmW / st.mapW
  const scaleY = mmH / st.mapH

  // Background
  ctx.fillStyle = 'rgba(20, 30, 20, 0.8)'
  ctx.fillRect(mx, my, mmW, mmH)
  ctx.strokeStyle = '#8b7355'
  ctx.lineWidth = 1
  ctx.strokeRect(mx, my, mmW, mmH)

  // Water areas
  ctx.fillStyle = '#1a4a6e'
  for (const wa of st.waterAreas) {
    ctx.fillRect(mx + wa.x * scaleX, my + wa.y * scaleY, wa.w * scaleX, wa.h * scaleY)
  }

  // Resource nodes (tiny dots)
  for (const rn of st.resourceNodes) {
    ctx.fillStyle = rn.kind === 'gold' ? '#f1c40f' : rn.kind === 'wood' ? '#2ecc71' : '#ecf0f1'
    ctx.fillRect(mx + rn.x * scaleX - 1, my + rn.y * scaleY - 1, 2, 2)
  }

  // Buildings
  const colorMap: Record<string, string> = { blue: '#3498db', red: '#e74c3c', purple: '#9b59b6', yellow: '#f1c40f' }
  for (const b of st.buildings) {
    const fc = st.players[b.owner]?.factionColor
    ctx.fillStyle = colorMap[fc ?? 'blue'] || '#888'
    ctx.fillRect(mx + b.x * scaleX - 2, my + b.y * scaleY - 2, 4, 4)
  }

  // Units (small dots)
  for (const u of st.units) {
    const fc = st.players[u.owner]?.factionColor
    ctx.fillStyle = colorMap[fc ?? 'blue'] || '#888'
    ctx.fillRect(mx + u.x * scaleX - 1, my + u.y * scaleY - 1, 2, 2)
  }

  // Enemy units (red)
  ctx.fillStyle = '#ff4444'
  for (const eu of st.enemyUnits) {
    ctx.fillRect(mx + eu.x * scaleX - 1, my + eu.y * scaleY - 1, 2, 2)
  }

  // Current player's camera viewport rect
  const cam = st.cameras[vp.playerIdx]
  if (cam) {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.strokeRect(
      mx + cam.x * scaleX,
      my + cam.y * scaleY,
      vp.w * scaleX,
      vp.h * scaleY,
    )
  }

  // Commanders (bright marks)
  for (const cmd of st.commanders) {
    const fc = st.players[cmd.owner]?.factionColor
    ctx.fillStyle = cmd.owner === vp.playerIdx ? '#fff' : (colorMap[fc ?? 'blue'] || '#888')
    ctx.beginPath()
    ctx.arc(mx + cmd.x * scaleX, my + cmd.y * scaleY, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── Draw decoration ─────────────────────────────────────────
function drawDecoration(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, d: Decoration, _tick: number) {
  let img: HTMLImageElement | null = null
  switch (d.kind) {
    case 'bush':
      img = spr.bushes[d.variant % spr.bushes.length] || null
      break
    case 'rock':
      img = spr.rocks[d.variant % spr.rocks.length] || null
      break
    case 'waterRock':
      img = spr.waterRocks[d.variant % spr.waterRocks.length] || null
      break
    case 'rubberDuck':
      img = spr.rubberDuck
      break
    case 'deco':
      img = spr.deco[d.variant % spr.deco.length] || null
      break
    case 'stump':
      img = spr.stumps[d.variant % spr.stumps.length] || null
      break
  }
  if (img) {
    const s = 32 * d.scale
    drawImgCentered(ctx, img, d.x, d.y, s, s)
  }
}

// ─── Draw resource ───────────────────────────────────────────
function drawResource(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, rn: ResourceNode, tick: number) {
  const size = 36
  const alpha = Math.max(0.3, rn.amount / rn.maxAmount)
  ctx.globalAlpha = alpha

  switch (rn.kind) {
    case 'gold': {
      // Use gold stone sprites
      const gs = spr.goldStones[rn.variant % spr.goldStones.length]
      if (gs) drawImgCentered(ctx, gs, rn.x, rn.y, size, size)
      else {
        ctx.fillStyle = '#f1c40f'
        ctx.beginPath(); ctx.arc(rn.x, rn.y, 12, 0, Math.PI * 2); ctx.fill()
      }
      // Gold icon above
      if (spr.goldIcon) {
        const fi = getFrameIndex(tick, spr.goldIcon.frameCount, 8)
        drawSheetCentered(ctx, spr.goldIcon, fi, rn.x, rn.y - 20, 16, 16)
      }
      break
    }
    case 'wood': {
      // Tree sprites
      const tree = spr.trees[rn.variant % spr.trees.length]
      if (tree) drawImgCentered(ctx, tree, rn.x, rn.y, size * 1.5, size * 1.5)
      else {
        ctx.fillStyle = '#2ecc71'
        ctx.beginPath(); ctx.arc(rn.x, rn.y, 14, 0, Math.PI * 2); ctx.fill()
      }
      break
    }
    case 'meat': {
      // Sheep sprites (animated)
      if (spr.sheepIdle) {
        const fi = getFrameIndex(tick, spr.sheepIdle.frameCount, 10)
        drawSheetCentered(ctx, spr.sheepIdle, fi, rn.x, rn.y, 32, 32)
      } else {
        ctx.fillStyle = '#ecf0f1'
        ctx.beginPath(); ctx.arc(rn.x, rn.y, 10, 0, Math.PI * 2); ctx.fill()
      }
      break
    }
  }

  ctx.globalAlpha = 1

  // Amount text
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 9px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${Math.ceil(rn.amount)}`, rn.x, rn.y + size / 2 + 10)
}

// ─── Draw building ───────────────────────────────────────────
function drawBuilding(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, b: Building, st: GameState) {
  const ps = st.players[b.owner]
  if (!ps) return
  const fc = fc2cap(ps.factionColor)
  const size = BUILDING_SIZE + 16

  // Under construction
  if (b.buildProgress < 1) {
    // Draw construction sprite
    const constr = spr.buildingConstruction
    const img = constr.castle || constr.house || constr.tower
    if (img) {
      ctx.globalAlpha = 0.5 + b.buildProgress * 0.5
      drawImgCentered(ctx, img, b.x, b.y, size, size)
      ctx.globalAlpha = 1
    } else {
      ctx.fillStyle = '#8b7355'
      ctx.globalAlpha = 0.5
      ctx.fillRect(b.x - size / 2, b.y - size / 2, size, size)
      ctx.globalAlpha = 1
    }
    // Progress bar
    ctx.fillStyle = '#888'
    ctx.fillRect(b.x - 20, b.y - size / 2 - 8, 40, 6)
    ctx.fillStyle = '#f1c40f'
    ctx.fillRect(b.x - 20, b.y - size / 2 - 8, 40 * b.buildProgress, 6)
    return
  }

  // Completed building — use Free Pack building sprites (color-coded)
  const bldgs = spr.buildings[fc]
  let img: HTMLImageElement | null = null
  switch (b.kind) {
    case 'castle':    img = bldgs?.castle || spr.knightBuildings[fc]?.castle; break
    case 'barracks':  img = bldgs?.barracks; break
    case 'archery':   img = bldgs?.archery; break
    case 'house':     img = bldgs?.house1; break
    case 'tower':     img = bldgs?.tower || spr.knightBuildings[fc]?.tower; break
    case 'monastery': img = bldgs?.monastery; break
  }

  if (img) {
    drawImgCentered(ctx, img, b.x, b.y, size, size)
  } else {
    // Fallback colored square
    const colorMap: Record<string, string> = { blue: '#3498db', red: '#e74c3c', purple: '#9b59b6', yellow: '#f1c40f' }
    ctx.fillStyle = colorMap[fc] || '#888'
    ctx.fillRect(b.x - size / 2, b.y - size / 2, size, size)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.strokeRect(b.x - size / 2, b.y - size / 2, size, size)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(b.kind[0].toUpperCase(), b.x, b.y + 4)
  }

  // HP bar
  const hpW = size * 0.8
  const hpPct = b.hp / b.maxHp
  if (hpPct < 1) {
    // Bar base
    if (spr.barSmallBase) {
      ctx.drawImage(spr.barSmallBase, b.x - hpW / 2 - 2, b.y - size / 2 - 10, hpW + 4, 8)
    } else {
      ctx.fillStyle = '#333'
      ctx.fillRect(b.x - hpW / 2, b.y - size / 2 - 10, hpW, 6)
    }
    // Bar fill
    if (spr.barSmallFill) {
      ctx.drawImage(spr.barSmallFill, b.x - hpW / 2, b.y - size / 2 - 9, hpW * hpPct, 6)
    } else {
      ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.25 ? '#f1c40f' : '#e74c3c'
      ctx.fillRect(b.x - hpW / 2, b.y - size / 2 - 9, hpW * hpPct, 5)
    }
  }

  // Training progress indicator
  if (b.trainQueue.length > 0) {
    const def = UNIT_DEFS[b.trainQueue[0]]
    const pct = b.trainProgress / def.trainTime
    ctx.fillStyle = '#3498db'
    ctx.fillRect(b.x - hpW / 2, b.y + size / 2 + 2, hpW * pct, 3)
    ctx.fillStyle = '#fff'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${b.trainQueue[0]}(${b.trainQueue.length})`, b.x, b.y + size / 2 + 14)
  }

  // Tower attack range indicator (subtle)
  const bDef2 = BUILDING_DEFS[b.kind]
  if (bDef2.attackRange && b.buildProgress >= 1) {
    ctx.strokeStyle = 'rgba(255,80,80,0.12)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(b.x, b.y, bDef2.attackRange, 0, Math.PI * 2)
    ctx.stroke()
  }
}

// ─── Draw unit ───────────────────────────────────────────────
function drawUnit(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, u: Unit, st: GameState) {
  const ps = st.players[u.owner]
  if (!ps) return
  const fc = fc2cap(ps.factionColor)
  const unitSize = u.r * 4

  // Get the right sprite sheet for this unit's kind and animation state
  const unitSprites = spr.units[fc]
  let sheet: SpriteSheetData | null = null

  if (unitSprites) {
    const kindSpr = unitSprites[u.kind]
    if (kindSpr) {
      switch (u.animState) {
        case 'run':
          sheet = kindSpr['run'] || kindSpr['idle']
          break
        case 'attack':
          if (u.kind === 'warrior') sheet = kindSpr['attack1'] || kindSpr['attack2']
          else if (u.kind === 'archer') sheet = kindSpr['shoot'] || kindSpr['idle']
          else if (u.kind === 'monk') sheet = kindSpr['heal'] || kindSpr['idle']
          else if (u.kind === 'lancer') sheet = kindSpr['rightAttack'] || kindSpr['idle']
          else sheet = kindSpr['idle']
          break
        case 'gather':
          if (u.kind === 'pawn') {
            if (u.carrying === 'gold') sheet = kindSpr['idlePickaxe'] || kindSpr['interactPickaxe'] || kindSpr['idle']
            else if (u.carrying === 'wood') sheet = kindSpr['idleAxe'] || kindSpr['interactAxe'] || kindSpr['idle']
            else sheet = kindSpr['idleKnife'] || kindSpr['idle']
          } else {
            sheet = kindSpr['idle']
          }
          break
        default:
          sheet = kindSpr['idle']
      }
    }
  }

  if (sheet) {
    const fi = getFrameIndex(u.animTick, sheet.frameCount, u.animState === 'idle' ? 8 : 5)
    drawSheetCentered(ctx, sheet, fi, u.x, u.y, unitSize, unitSize, u.facingLeft)
  } else {
    // Fallback: colored circle
    const colorMap: Record<string, string> = { blue: '#3498db', red: '#e74c3c', purple: '#9b59b6', yellow: '#f1c40f' }
    ctx.fillStyle = colorMap[fc] || '#888'
    ctx.beginPath()
    ctx.arc(u.x, u.y, u.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '7px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(u.kind[0].toUpperCase(), u.x, u.y + 3)
  }

  // HP bar above unit
  if (u.hp < u.maxHp) {
    const w = unitSize * 0.6
    const pct = u.hp / u.maxHp
    ctx.fillStyle = '#333'
    ctx.fillRect(u.x - w / 2, u.y - unitSize / 2 - 6, w, 3)
    ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.25 ? '#f1c40f' : '#e74c3c'
    ctx.fillRect(u.x - w / 2, u.y - unitSize / 2 - 6, w * pct, 3)
  }

  // Carrying indicator
  if (u.carrying && u.carryAmount > 0) {
    ctx.fillStyle = u.carrying === 'gold' ? '#f1c40f' : u.carrying === 'wood' ? '#8b6914' : '#ecf0f1'
    ctx.beginPath()
    ctx.arc(u.x + u.r, u.y - u.r, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── Draw enemy unit ─────────────────────────────────────────
function drawEnemy(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, eu: EnemyUnit) {
  const unitSize = eu.r * 4

  const enemySpr = spr.enemies[eu.kind]
  let sheet: SpriteSheetData | null = null

  if (enemySpr) {
    switch (eu.animState) {
      case 'run':
        sheet = enemySpr['run'] || enemySpr['walk'] || enemySpr['idle']
        break
      case 'attack':
        sheet = enemySpr['attack'] || enemySpr['throw'] || enemySpr['idle']
        break
      default:
        sheet = enemySpr['idle']
    }
  }

  if (sheet) {
    const fi = getFrameIndex(eu.animTick, sheet.frameCount, eu.animState === 'idle' ? 8 : 5)
    drawSheetCentered(ctx, sheet, fi, eu.x, eu.y, unitSize, unitSize, eu.facingLeft)
  } else {
    // Fallback
    ctx.fillStyle = '#e74c3c'
    ctx.beginPath()
    ctx.arc(eu.x, eu.y, eu.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '7px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(eu.kind.substring(0, 2), eu.x, eu.y + 3)
  }

  // HP bar
  if (eu.hp < eu.maxHp) {
    const w = unitSize * 0.6
    const pct = eu.hp / eu.maxHp
    ctx.fillStyle = '#333'
    ctx.fillRect(eu.x - w / 2, eu.y - unitSize / 2 - 6, w, 3)
    ctx.fillStyle = '#e74c3c'
    ctx.fillRect(eu.x - w / 2, eu.y - unitSize / 2 - 6, w * pct, 3)
  }
}

// ─── Draw projectile ─────────────────────────────────────────
function drawProjectile(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, p: Projectile) {
  if (spr.arrowSprite) {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(Math.atan2(p.dy, p.dx))
    ctx.drawImage(spr.arrowSprite, -12, -4, 24, 8)
    ctx.restore()
  } else {
    ctx.fillStyle = '#f39c12'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── Draw effect ─────────────────────────────────────────────
function drawEffect(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, e: Effect) {
  const progress = e.tick / e.maxTick
  ctx.globalAlpha = 1 - progress

  let sheet: SpriteSheetData | null = null
  switch (e.kind) {
    case 'dust':
      sheet = spr.dust[e.variant % spr.dust.length] || null
      break
    case 'explosion':
      sheet = spr.explosions[e.variant % spr.explosions.length] || spr.explosionSheet
      break
    case 'fire':
      sheet = spr.fires[e.variant % spr.fires.length] || spr.fireSheet
      break
    case 'waterSplash':
      sheet = spr.waterSplash
      break
  }

  if (sheet) {
    const fi = Math.floor(progress * sheet.frameCount)
    drawSheetCentered(ctx, sheet, fi, e.x, e.y, 40, 40)
  } else {
    // Fallback particle
    const r = 8 * (1 - progress)
    ctx.fillStyle = e.kind === 'explosion' ? '#f39c12' : e.kind === 'fire' ? '#e74c3c' : '#ccc'
    ctx.beginPath()
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

// ─── Draw commander ──────────────────────────────────────────
function drawCommander(ctx: CanvasRenderingContext2D, spr: TinySwordsSprites, cmd: Commander, st: GameState) {
  const ps = st.players[cmd.owner]
  if (!ps || !ps.alive) return
  const fc = fc2cap(cmd.factionColor)

  // Use knight warrior sprite for commander (bigger)
  const knightSpr = spr.knightUnits[fc]
  const cmdSize = CMD_R * 4

  if (knightSpr?.warrior) {
    const fi = getFrameIndex(cmd.animTick, knightSpr.warrior.frameCount, 8)
    drawSheetCentered(ctx, knightSpr.warrior, fi, cmd.x, cmd.y, cmdSize, cmdSize, cmd.facingLeft)
  } else {
    // Fallback
    const colorMap: Record<string, string> = { blue: '#3498db', red: '#e74c3c', purple: '#9b59b6', yellow: '#f1c40f' }
    ctx.fillStyle = colorMap[fc] || '#888'
    ctx.beginPath()
    ctx.arc(cmd.x, cmd.y, CMD_R, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Player name above
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(ps.name, cmd.x, cmd.y - cmdSize / 2 - 4)

  // Selected build indicator (small icon)
  const bIdx = ps.selectedBuild % BUILDABLE_BUILDINGS.length
  const selectedBuilding = BUILDABLE_BUILDINGS[bIdx]
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '8px sans-serif'
  ctx.fillText(`[${selectedBuilding}]`, cmd.x, cmd.y + cmdSize / 2 + 10)

  // Selection ring
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.ellipse(cmd.x, cmd.y + cmdSize / 2 - 4, cmdSize / 2, cmdSize / 6, 0, 0, Math.PI * 2)
  ctx.stroke()

  // Pointer above commander
  if (spr.pointers.length > 0) {
    const ptr = spr.pointers[cmd.owner % spr.pointers.length]
    if (ptr) {
      const bob = Math.sin(cmd.animTick * 0.15) * 3
      ctx.drawImage(ptr, cmd.x - 8, cmd.y - cmdSize / 2 - 22 + bob, 16, 16)
    }
  }
}
