/**
 * Empire RTS — Canvas renderer
 * Side-scrolling Kingdom-style view with sprite-based drawing.
 * Falls back to procedural shapes when sprites aren't loaded yet.
 */
import type {
  GameState, Hero, Unit, Enemy, Building, ResourceNode,
  Camera, FactionColor,
} from './types'
import {
  VIEW_W, VIEW_H, GROUND_Y, WORLD_W,
  TEAM_COLORS, TEAM_HEX, BUILDING_DEFS,
  BUILD_MENU,
  SPRITE_FREE, SPRITE_UPDATE, SPRITE_ENEMY,
  DAY_LENGTH, NIGHT_LENGTH,
} from './constants'

// ─── Sprite cache ─────────────────────────────────────────
const imgCache = new Map<string, HTMLImageElement>()

function loadImg(src: string): HTMLImageElement {
  let img = imgCache.get(src)
  if (!img) {
    img = new Image()
    img.src = src
    imgCache.set(src, img)
  }
  return img
}

function drawImgIfLoaded(
  ctx: CanvasRenderingContext2D, src: string,
  dx: number, dy: number, dw: number, dh: number,
  flip = false,
): boolean {
  const img = loadImg(src)
  if (!img.complete || img.naturalWidth === 0) return false
  ctx.save()
  if (flip) {
    ctx.translate(dx + dw, dy)
    ctx.scale(-1, 1)
    ctx.drawImage(img, 0, 0, dw, dh)
  } else {
    ctx.drawImage(img, dx, dy, dw, dh)
  }
  ctx.restore()
  return true
}

// ─── Color helpers ────────────────────────────────────────
function teamColorHex(team: number): string {
  return TEAM_HEX[team] || '#888'
}

function factionColor(team: number): FactionColor {
  return TEAM_COLORS[team] || 'Blue'
}

// ═══════════════════════════════════════════════════════════
//  MAIN DRAW
// ═══════════════════════════════════════════════════════════
export function drawGame(
  ctx: CanvasRenderingContext2D,
  st: GameState,
  cam: Camera,
  viewW: number,
  viewH: number,
  heroIndex: number,
): void {
  const scaleX = viewW / VIEW_W
  const scaleY = viewH / VIEW_H
  ctx.save()
  ctx.scale(scaleX, scaleY)

  // ── Sky ─────────────────────────────────────────────────
  const dayPct = st.isNight
    ? 0.3 + 0.2 * (st.dayTimer / NIGHT_LENGTH)
    : 0.7 + 0.3 * (st.dayTimer / DAY_LENGTH)

  const skyR = Math.round(100 * dayPct)
  const skyG = Math.round(160 * dayPct)
  const skyB = Math.round(220 * dayPct)
  ctx.fillStyle = `rgb(${skyR},${skyG},${skyB})`
  ctx.fillRect(0, 0, VIEW_W, VIEW_H)

  // ── Translate by camera ─────────────────────────────────
  ctx.save()
  ctx.translate(-cam.x + VIEW_W / 2, 0)

  // ── Ground ──────────────────────────────────────────────
  ctx.fillStyle = `rgb(${Math.round(60 * dayPct)},${Math.round(120 * dayPct)},${Math.round(40 * dayPct)})`
  ctx.fillRect(0, GROUND_Y, WORLD_W, VIEW_H - GROUND_Y + 50)

  // Ground line
  ctx.strokeStyle = `rgb(${Math.round(40 * dayPct)},${Math.round(80 * dayPct)},${Math.round(30 * dayPct)})`
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y)
  ctx.lineTo(WORLD_W, GROUND_Y)
  ctx.stroke()

  // ── Background trees ────────────────────────────────────
  for (const tx of st.treePositions) {
    const treeSrc = `${SPRITE_FREE}/Terrain/Resources/Wood/Trees/Tree1.png`
    if (!drawImgIfLoaded(ctx, treeSrc, tx - 20, GROUND_Y - 60, 40, 60)) {
      // Fallback: simple triangle tree
      ctx.fillStyle = `rgb(${Math.round(30 * dayPct)},${Math.round(100 * dayPct)},${Math.round(30 * dayPct)})`
      ctx.beginPath()
      ctx.moveTo(tx, GROUND_Y - 50)
      ctx.lineTo(tx - 15, GROUND_Y)
      ctx.lineTo(tx + 15, GROUND_Y)
      ctx.fill()
      ctx.fillStyle = `rgb(${Math.round(80 * dayPct)},${Math.round(50 * dayPct)},${Math.round(20 * dayPct)})`
      ctx.fillRect(tx - 3, GROUND_Y - 8, 6, 8)
    }
  }

  // ── Resource nodes ──────────────────────────────────────
  for (const rn of st.resourceNodes) {
    if (rn.amount <= 0) continue
    drawResourceNode(ctx, rn, dayPct)
  }

  // ── Buildings ───────────────────────────────────────────
  for (const b of st.buildings) {
    drawBuilding(ctx, b, st, dayPct)
  }

  // ── Units ───────────────────────────────────────────────
  for (const u of st.units) {
    drawUnit(ctx, u, dayPct)
  }

  // ── Enemies ─────────────────────────────────────────────
  for (const e of st.enemies) {
    drawEnemy(ctx, e, dayPct)
  }

  // ── Heroes ──────────────────────────────────────────────
  for (const h of st.heroes) {
    drawHero(ctx, h, st, dayPct, h.playerIndex === heroIndex)
  }

  // ── Projectiles ─────────────────────────────────────────
  for (const p of st.projectiles) {
    ctx.fillStyle = p.team >= 0 ? '#ff0' : '#f44'
    ctx.fillRect(p.x - 2, p.y - 1, 6, 3)
  }

  ctx.restore() // undo camera translation

  // ── HUD (screen-space) ──────────────────────────────────
  drawHUD(ctx, st, heroIndex)

  ctx.restore() // undo scale
}

// ─── Resource node ────────────────────────────────────────
function drawResourceNode(ctx: CanvasRenderingContext2D, rn: ResourceNode, _dp: number): void {
  const colors = { gold: '#ffd700', wood: '#8B4513', meat: '#ff6b6b' }
  const icons  = { gold: '💰', wood: '🪵', meat: '🥩' }
  const pct = rn.amount / rn.maxAmount

  ctx.fillStyle = colors[rn.type]
  ctx.globalAlpha = 0.5 + pct * 0.5
  ctx.fillRect(rn.x - 10, GROUND_Y - 16, 20, 16)
  ctx.globalAlpha = 1

  // Amount bar
  ctx.fillStyle = '#0006'
  ctx.fillRect(rn.x - 10, GROUND_Y - 20, 20, 3)
  ctx.fillStyle = colors[rn.type]
  ctx.fillRect(rn.x - 10, GROUND_Y - 20, 20 * pct, 3)

  // Icon
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(icons[rn.type], rn.x, GROUND_Y - 22)
}

// ─── Building ─────────────────────────────────────────────
function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, _st: GameState, _dp: number): void {
  const color = factionColor(b.team)

  // Try sprite
  let spriteDrawn = false
  if (b.type === 'castle') {
    const src = `${SPRITE_UPDATE}/Factions/Knights/Buildings/Castle/Castle_${color}.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, b.x, b.y, b.w, b.h)
  } else if (b.type === 'house') {
    const src = `${SPRITE_UPDATE}/Factions/Knights/Buildings/House/House_${color}.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, b.x, b.y, b.w, b.h)
  } else if (b.type === 'tower') {
    const src = `${SPRITE_UPDATE}/Factions/Knights/Buildings/Tower/Tower_${color}.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, b.x, b.y, b.w, b.h)
  } else if (b.type === 'barracks') {
    const src = `${SPRITE_FREE}/Buildings/${color} Buildings/Barracks.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, b.x, b.y, b.w, b.h)
  } else if (b.type === 'archery') {
    const src = `${SPRITE_FREE}/Buildings/${color} Buildings/Archery.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, b.x, b.y, b.w, b.h)
  } else if (b.type === 'monastery') {
    const src = `${SPRITE_FREE}/Buildings/${color} Buildings/Monastery.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, b.x, b.y, b.w, b.h)
  }

  // Fallback: procedural rectangle
  if (!spriteDrawn) {
    const hex = teamColorHex(b.team)
    if (!b.built) {
      ctx.globalAlpha = 0.4 + b.buildProgress * 0.6
    }
    ctx.fillStyle = hex
    ctx.fillRect(b.x, b.y, b.w, b.h * (b.built ? 1 : b.buildProgress))
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    ctx.strokeRect(b.x, b.y, b.w, b.h)
    ctx.globalAlpha = 1

    // Label
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(b.type.toUpperCase(), b.x + b.w / 2, b.y + b.h / 2 + 3)

    // Level dots
    if (b.level > 1) {
      ctx.fillStyle = '#ff0'
      for (let i = 0; i < b.level; i++) {
        ctx.beginPath()
        ctx.arc(b.x + b.w / 2 - 6 + i * 6, b.y - 6, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // HP bar
  if (b.built && b.hp < b.maxHp) {
    const bw = b.w * 0.8
    const bx = b.x + (b.w - bw) / 2
    ctx.fillStyle = '#0006'
    ctx.fillRect(bx, b.y - 6, bw, 4)
    ctx.fillStyle = b.hp > b.maxHp * 0.5 ? '#4f4' : b.hp > b.maxHp * 0.25 ? '#ff0' : '#f44'
    ctx.fillRect(bx, b.y - 6, bw * (b.hp / b.maxHp), 4)
  }

  // Construction progress
  if (!b.built) {
    ctx.fillStyle = '#fff'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.round(b.buildProgress * 100)}%`, b.x + b.w / 2, b.y - 4)
  }
}

// ─── Unit ─────────────────────────────────────────────────
function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, _dp: number): void {
  const color = factionColor(u.team)
  const flip = u.dir === -1

  // Map class to sprite folder/file
  let spriteDrawn = false
  const classNameCap = u.class.charAt(0).toUpperCase() + u.class.slice(1)
  const anim = u.state === 'attack' ? 'Attack1' :
               u.state === 'move' ? 'Run' :
               u.state === 'gather' ? 'Idle' :
               u.state === 'build' ? 'Idle' :
               u.state === 'heal' ? 'Idle' : 'Idle'

  if (u.class === 'pawn') {
    const tool = u.state === 'gather'
      ? (u.carryType === 'wood' ? ' Axe' : u.carryType === 'gold' ? ' Pickaxe' : '')
      : ''
    const src = `${SPRITE_FREE}/Units/${color} Units/Pawn/Pawn_${u.state === 'move' ? 'Run' : 'Idle'}${tool}.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, u.x - 16, u.y - 32, 32, 32, flip)
  } else if (u.class === 'monk') {
    const src = `${SPRITE_FREE}/Units/${color} Units/Monk/${u.state === 'move' ? 'Run' : 'Idle'}.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, u.x - 16, u.y - 32, 32, 32, flip)
  } else {
    const src = `${SPRITE_FREE}/Units/${color} Units/${classNameCap}/${classNameCap}_${anim}.png`
    spriteDrawn = drawImgIfLoaded(ctx, src, u.x - 16, u.y - 32, 32, 32, flip)
  }

  // Fallback: colored circle + letter
  if (!spriteDrawn) {
    ctx.fillStyle = teamColorHex(u.team)
    ctx.beginPath()
    ctx.arc(u.x, u.y - 14, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#222'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(u.class[0].toUpperCase(), u.x, u.y - 11)
  }

  // HP bar
  if (u.hp < u.maxHp) {
    ctx.fillStyle = '#0006'
    ctx.fillRect(u.x - 10, u.y - 36, 20, 3)
    ctx.fillStyle = u.hp > u.maxHp * 0.5 ? '#4f4' : '#f44'
    ctx.fillRect(u.x - 10, u.y - 36, 20 * (u.hp / u.maxHp), 3)
  }

  // Carry indicator
  if (u.carryAmount > 0) {
    const icon = u.carryType === 'gold' ? '💰' : u.carryType === 'wood' ? '🪵' : '🥩'
    ctx.font = '8px sans-serif'
    ctx.fillText(icon, u.x, u.y - 40)
  }
}

// ─── Enemy ────────────────────────────────────────────────
function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, _dp: number): void {
  const flip = e.dir === -1
  const classNameCap = e.class.charAt(0).toUpperCase() + e.class.slice(1)
  const anim = e.state === 'attack' ? 'Hit' :
               e.state === 'walk' ? 'Walk' : 'Idle'

  const src = `${SPRITE_ENEMY}/${classNameCap}/${classNameCap}_${anim}.png`
  const drawn = drawImgIfLoaded(ctx, src, e.x - 16, e.y - 32, 32, 32, flip)

  if (!drawn) {
    // Fallback: red circle
    ctx.fillStyle = e.state === 'dying' ? '#a00' : '#e33'
    ctx.globalAlpha = e.state === 'dying' ? 0.5 : 1
    ctx.beginPath()
    ctx.arc(e.x, e.y - 14, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#600'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(e.class.slice(0, 3).toUpperCase(), e.x, e.y - 11)
    ctx.globalAlpha = 1
  }

  // HP bar
  if (e.state !== 'dying' && e.hp < e.maxHp) {
    ctx.fillStyle = '#0006'
    ctx.fillRect(e.x - 10, e.y - 36, 20, 3)
    ctx.fillStyle = '#f44'
    ctx.fillRect(e.x - 10, e.y - 36, 20 * (e.hp / e.maxHp), 3)
  }
}

// ─── Hero ─────────────────────────────────────────────────
function drawHero(
  ctx: CanvasRenderingContext2D, h: Hero, _st: GameState,
  _dp: number, isLocal: boolean,
): void {
  const color = factionColor(h.team)
  const flip = h.dir === -1
  const anim = h.state === 'attack' ? 'Attack1' :
               h.state === 'walk' ? 'Run' : 'Idle'

  // Try warrior sprite as hero
  const src = `${SPRITE_FREE}/Units/${color} Units/Warrior/Warrior_${anim}.png`
  const drawn = drawImgIfLoaded(ctx, src, h.x - 20, h.y - 40, 40, 40, flip)

  if (!drawn) {
    // Fallback: larger colored circle with crown
    ctx.fillStyle = teamColorHex(h.team)
    ctx.beginPath()
    ctx.arc(h.x, h.y - 18, 14, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ff0'
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.fillStyle = '#fff'
    ctx.font = 'bold 10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('👑', h.x, h.y - 34)
  }

  // Name above
  ctx.fillStyle = isLocal ? '#ff0' : '#fffa'
  ctx.font = `bold ${isLocal ? 10 : 8}px sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(h.name, h.x, h.y - 46)

  // Gold in pouch
  ctx.fillStyle = '#ffd700'
  ctx.font = 'bold 9px sans-serif'
  ctx.fillText(`💰${h.gold}`, h.x, h.y - 56)

  // HP bar
  if (h.hp < h.maxHp) {
    ctx.fillStyle = '#0006'
    ctx.fillRect(h.x - 14, h.y - 64, 28, 3)
    ctx.fillStyle = '#4f4'
    ctx.fillRect(h.x - 14, h.y - 64, 28 * (h.hp / h.maxHp), 3)
  }

  // Local highlight glow
  if (isLocal) {
    ctx.strokeStyle = '#ff0'
    ctx.lineWidth = 1.5
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.arc(h.x, h.y - 18, 20, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // Build selection indicator
  if (isLocal && h.selectedBuilding) {
    const def = BUILDING_DEFS[h.selectedBuilding]
    ctx.strokeStyle = '#8f88'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(h.x - def.w / 2, GROUND_Y - def.h, def.w, def.h)
    ctx.setLineDash([])
    ctx.fillStyle = '#8f8'
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`[${h.selectedBuilding}]`, h.x, GROUND_Y - def.h - 4)
  }
}

// ═══════════════════════════════════════════════════════════
//  HUD (screen-space)
// ═══════════════════════════════════════════════════════════
function drawHUD(ctx: CanvasRenderingContext2D, st: GameState, heroIndex: number): void {
  const hero = st.heroes.find(h => h.playerIndex === heroIndex)
  if (!hero) return
  const team = st.teams[hero.team]

  // ── Top bar ─────────────────────────────────────────────
  ctx.fillStyle = '#000a'
  ctx.fillRect(0, 0, VIEW_W, 28)

  ctx.font = 'bold 12px monospace'
  ctx.textAlign = 'left'

  // Resources
  ctx.fillStyle = '#ffd700'
  ctx.fillText(`💰 ${team.gold}/${team.maxGold}`, 8, 18)
  ctx.fillStyle = '#8B6914'
  ctx.fillText(`🪵 ${team.wood}`, 130, 18)
  ctx.fillStyle = '#f66'
  ctx.fillText(`🥩 ${team.meat}`, 220, 18)

  // Pop
  ctx.fillStyle = '#aaf'
  ctx.fillText(`👥 ${team.popCurrent}/${team.popMax}`, 310, 18)

  // Day/Night
  ctx.fillStyle = st.isNight ? '#88f' : '#ff0'
  ctx.textAlign = 'center'
  ctx.fillText(
    `${st.isNight ? '🌙' : '☀️'} Day ${st.day}  ${Math.ceil(st.dayTimer * 0.033)}s`,
    VIEW_W / 2, 18,
  )

  // Wave
  ctx.textAlign = 'right'
  ctx.fillStyle = '#f80'
  ctx.fillText(`Wave ${st.waveNumber}  ⏱ ${Math.ceil(st.waveTimer * 0.033)}s`, VIEW_W - 8, 18)

  // ── Events (left side) ──────────────────────────────────
  ctx.textAlign = 'left'
  ctx.font = '10px sans-serif'
  for (let i = 0; i < st.events.length; i++) {
    const ev = st.events[i]
    ctx.fillStyle = ev.color
    ctx.globalAlpha = Math.min(1, ev.timer / 30)
    ctx.fillText(ev.text, 8, 46 + i * 14)
  }
  ctx.globalAlpha = 1

  // ── Build menu (bottom) ─────────────────────────────────
  if (hero.selectedBuilding) {
    const menuY = VIEW_H - 42
    ctx.fillStyle = '#000a'
    ctx.fillRect(0, menuY - 4, VIEW_W, 46)

    const startX = VIEW_W / 2 - (BUILD_MENU.length * 44) / 2
    ctx.font = '8px sans-serif'
    ctx.textAlign = 'center'

    for (let i = 0; i < BUILD_MENU.length; i++) {
      const bt = BUILD_MENU[i]
      const bx = startX + i * 44
      const selected = bt === hero.selectedBuilding

      ctx.fillStyle = selected ? '#8f84' : '#4448'
      ctx.fillRect(bx, menuY, 40, 28)
      ctx.strokeStyle = selected ? '#8f8' : '#666'
      ctx.lineWidth = selected ? 2 : 1
      ctx.strokeRect(bx, menuY, 40, 28)

      ctx.fillStyle = selected ? '#fff' : '#aaa'
      ctx.fillText(bt.slice(0, 6), bx + 20, menuY + 11)

      const def = BUILDING_DEFS[bt]
      ctx.fillStyle = '#ffd700'
      ctx.fillText(`${def.costGold}g`, bx + 12, menuY + 23)
      ctx.fillStyle = '#a86'
      ctx.fillText(`${def.costWood}w`, bx + 32, menuY + 23)
    }
  }

  // ── Minimap (bottom-right) ──────────────────────────────
  const mmW = 140, mmH = 20
  const mmX = VIEW_W - mmW - 8, mmY = VIEW_H - mmH - 8
  ctx.fillStyle = '#0008'
  ctx.fillRect(mmX, mmY, mmW, mmH)
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 1
  ctx.strokeRect(mmX, mmY, mmW, mmH)

  const sx = mmW / WORLD_W

  // Buildings on minimap
  for (const b of st.buildings) {
    ctx.fillStyle = teamColorHex(b.team)
    ctx.fillRect(mmX + b.x * sx, mmY + 2, Math.max(2, b.w * sx), mmH - 4)
  }

  // Heroes on minimap
  for (const h of st.heroes) {
    ctx.fillStyle = '#ff0'
    ctx.fillRect(mmX + h.x * sx - 1, mmY + 1, 3, mmH - 2)
  }

  // Enemies on minimap
  for (const e of st.enemies) {
    if (e.state === 'dying') continue
    ctx.fillStyle = '#f44'
    ctx.fillRect(mmX + e.x * sx, mmY + 4, 2, mmH - 8)
  }

  // Camera viewport rect
  const camL = (hero.x - VIEW_W / 2) * sx
  const camR = VIEW_W * sx
  ctx.strokeStyle = '#fff6'
  ctx.strokeRect(mmX + Math.max(0, camL), mmY, Math.min(camR, mmW), mmH)

  // ── Game over ───────────────────────────────────────────
  if (st.gameOver) {
    ctx.fillStyle = '#000c'
    ctx.fillRect(0, VIEW_H / 2 - 40, VIEW_W, 80)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 24px sans-serif'
    ctx.textAlign = 'center'
    if (st.winner >= 0) {
      ctx.fillStyle = teamColorHex(st.winner)
      ctx.fillText(`Team ${st.winner + 1} Wins!`, VIEW_W / 2, VIEW_H / 2 + 8)
    } else {
      ctx.fillStyle = '#f44'
      ctx.fillText('GAME OVER', VIEW_W / 2, VIEW_H / 2 + 8)
    }
    ctx.fillStyle = '#fff8'
    ctx.font = '14px sans-serif'
    ctx.fillText(`Day ${st.day} — Wave ${st.waveNumber}`, VIEW_W / 2, VIEW_H / 2 + 30)
  }
}
