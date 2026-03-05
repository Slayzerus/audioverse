/**
 * hudRenderer.ts — 2D HUD overlay for Menace 3D (split-screen aware).
 *
 * All draw functions accept a viewport rect (vx, vy, vw, vh) and scale
 * UI elements so they look proportional in any panel size.
 *
 * Draws per-player: health bar, armor bar, weapon/ammo, wanted stars,
 * score, currency, combo counter, crosshair, mission info, vehicle HUD.
 * Also: minimap (per-viewport corner or dedicated panel), panel borders,
 * game-over overlay.
 */
import type { GameState, Player } from './types'

// ── Draw one player's HUD within a viewport rect ─────────
export function drawHud(
  ctx: CanvasRenderingContext2D,
  vx: number, vy: number, vw: number, vh: number,
  st: GameState,
  localPlayerIndex: number,
  showMinimap: boolean = true,
) {
  const p = st.players[localPlayerIndex]
  if (!p) return

  // Scale factor — reference size 480×270 (quarter of 960×540)
  const s = Math.min(vw / 480, vh / 270)
  const pad = 10 * s
  const barW = 120 * s
  const barH = 12 * s

  ctx.save()

  // ── Player name tag (top-center of viewport) ────────────
  ctx.font = `bold ${rnd(13 * s)}px monospace`
  ctx.fillStyle = p.color
  ctx.textAlign = 'center'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 3 * s
  ctx.fillText(p.name || `Player ${p.pIndex + 1}`, vx + vw / 2, vy + pad + 14 * s)
  ctx.textAlign = 'left'

  // ── Health bar (bottom-left) ────────────────────────────
  const hx = vx + pad
  const hy = vy + vh - pad - barH
  drawBar(ctx, hx, hy, barW, barH, p.hp / p.maxHp, '#cc3333', '#441111', '♥ ' + Math.ceil(p.hp), s)

  // ── Armor bar ───────────────────────────────────────────
  if (p.armor > 0) {
    drawBar(ctx, hx, hy - barH - 3 * s, barW, barH, p.armor / 100, '#4488ff', '#112244', '🛡 ' + Math.ceil(p.armor), s)
  }

  // ── Weapon / ammo ───────────────────────────────────────
  const wy = hy - (p.armor > 0 ? 2 : 1) * (barH + 3 * s) - 3 * s
  ctx.font = `bold ${rnd(12 * s)}px monospace`
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 3 * s
  if (p.weapon) {
    const icon = weaponIcon(p.weapon.type)
    ctx.fillText(`${icon} ${p.weapon.type.toUpperCase()} x${p.weapon.ammo}`, hx, wy)
  } else {
    ctx.fillText('FISTS', hx, wy)
  }

  // ── Wanted stars (top-left) ─────────────────────────────
  const starSize = 12 * s
  const sx = vx + pad
  const sy = vy + pad + 14 * s
  ctx.font = `${rnd(starSize)}px monospace`
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < p.wanted ? '#ff4444' : '#444444'
    ctx.fillText('★', sx + i * (starSize + 2 * s), sy)
  }

  // ── Score / currency ────────────────────────────────────
  ctx.font = `bold ${rnd(11 * s)}px monospace`
  ctx.fillStyle = '#ffdd44'
  ctx.fillText(`LVL${p.level} ⭐${p.starPts} 🪙${p.coins} 💎${p.gems}`, sx, sy + 18 * s)
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${p.score}pts  K:${p.kills}`, sx, sy + 34 * s)

  // ── Combo counter ───────────────────────────────────────
  if (p.comboCount > 1) {
    ctx.font = `bold ${rnd(18 * s)}px monospace`
    ctx.fillStyle = '#ff8844'
    ctx.textAlign = 'center'
    ctx.fillText(`COMBO x${p.comboCount}`, vx + vw / 2, vy + vh - 60 * s)
    ctx.textAlign = 'left'
  }

  // ── Speed boost indicator ───────────────────────────────
  if (p.speedBoost > 0) {
    ctx.font = `bold ${rnd(12 * s)}px monospace`
    ctx.fillStyle = '#44ff88'
    ctx.fillText('⚡ SPEED', hx, wy - 14 * s)
  }

  // ── Vehicle indicator ───────────────────────────────────
  if (p.inVehicle !== null) {
    const v = st.vehicles[p.inVehicle]
    if (v) {
      const vbx = vx + vw / 2 - barW / 2
      const vby = vy + vh - pad - barH
      drawBar(ctx, vbx, vby, barW, barH, v.hp / v.maxHp, '#44aaff', '#112233', `${v.kind.toUpperCase()} HP`, s)
      ctx.font = `${rnd(10 * s)}px monospace`
      ctx.fillStyle = '#cccccc'
      ctx.textAlign = 'center'
      ctx.fillText(`${Math.abs(Math.round(v.speed))} km/h`, vx + vw / 2, vby - 4 * s)
      if (v.kind === 'helicopter') {
        ctx.fillText(`ALT: ${Math.round(v.altitude)}m`, vx + vw / 2 + barW / 2 + 8 * s, vby + barH / 2 + 3 * s)
      }
      ctx.textAlign = 'left'
    }
  }

  // ── Minimap (bottom-right corner) ───────────────────────
  if (showMinimap) {
    const mmSize = rnd(Math.min(100 * s, vw * 0.25, vh * 0.3))
    if (mmSize > 30) {
      drawMinimap(ctx, vx + vw - mmSize - pad, vy + vh - mmSize - pad, mmSize, st, p)
    }
  }

  // ── Timer (top-center, timed modes) ─────────────────────
  if (st.mode === 'vs-rampage' && st.timer > 0) {
    ctx.font = `bold ${rnd(20 * s)}px monospace`
    ctx.fillStyle = st.timer < 10 ? '#ff4444' : '#ffffff'
    ctx.textAlign = 'center'
    ctx.shadowBlur = 4 * s
    const mins = Math.floor(st.timer / 60)
    const secs = Math.floor(st.timer % 60).toString().padStart(2, '0')
    ctx.fillText(`${mins}:${secs}`, vx + vw / 2, vy + pad + 30 * s)
    ctx.textAlign = 'left'
  }

  // ── Active mission info (top-right) ─────────────────────
  const activeMission = st.missions.find(m => m.active && m.assignedTo === p.pIndex)
  if (activeMission) {
    ctx.font = `bold ${rnd(11 * s)}px monospace`
    ctx.fillStyle = '#44ff88'
    ctx.textAlign = 'right'
    ctx.fillText(`📋 ${activeMission.desc}`, vx + vw - pad, vy + pad + 14 * s)
    const dToTarget = Math.hypot(p.x - activeMission.targetX, p.y - activeMission.targetY)
    ctx.font = `${rnd(10 * s)}px monospace`
    ctx.fillStyle = '#aaffaa'
    ctx.fillText(`${Math.round(dToTarget)}m`, vx + vw - pad, vy + pad + 28 * s)
    if (activeMission.timeLimit > 0) {
      const remaining = Math.max(0, activeMission.timeLimit - activeMission.timer)
      ctx.fillStyle = remaining < 5 ? '#ff4444' : '#ffffff'
      ctx.fillText(`⏱ ${Math.ceil(remaining)}s`, vx + vw - pad, vy + pad + 42 * s)
    }
    ctx.textAlign = 'left'
  }

  // ── Death overlay ───────────────────────────────────────
  if (!p.alive) {
    ctx.fillStyle = 'rgba(100, 0, 0, 0.4)'
    ctx.fillRect(vx, vy, vw, vh)
    ctx.font = `bold ${rnd(28 * s)}px monospace`
    ctx.fillStyle = '#ff4444'
    ctx.textAlign = 'center'
    ctx.fillText('WASTED', vx + vw / 2, vy + vh / 2)
    ctx.font = `${rnd(13 * s)}px monospace`
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`Respawning in ${Math.ceil(p.respawnTimer / 60)}...`, vx + vw / 2, vy + vh / 2 + 30 * s)
    ctx.textAlign = 'left'
  }

  // ── Crosshair (center) ─────────────────────────────────
  if (p.alive && p.inVehicle === null) {
    const cx = vx + vw / 2
    const cy = vy + vh / 2
    const cr = 8 * s
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'
    ctx.lineWidth = Math.max(1, 1.5 * s)
    ctx.beginPath()
    ctx.moveTo(cx - cr, cy); ctx.lineTo(cx - cr * 0.5, cy)
    ctx.moveTo(cx + cr * 0.5, cy); ctx.lineTo(cx + cr, cy)
    ctx.moveTo(cx, cy - cr); ctx.lineTo(cx, cy - cr * 0.5)
    ctx.moveTo(cx, cy + cr * 0.5); ctx.lineTo(cx, cy + cr)
    ctx.stroke()
  }

  ctx.restore()
}

// ── Dedicated minimap panel ───────────────────────────────
/** Draw a large minimap + mini scoreboard filling a grid slot. */
export function drawMinimapPanel(
  ctx: CanvasRenderingContext2D,
  vx: number, vy: number, vw: number, vh: number,
  st: GameState,
) {
  // Dark background
  ctx.fillStyle = 'rgba(15, 12, 8, 0.92)'
  ctx.fillRect(vx, vy, vw, vh)

  const s = Math.min(vw / 320, vh / 240)
  const pad = 8 * s

  // Title
  ctx.font = `bold ${rnd(14 * s)}px monospace`
  ctx.fillStyle = '#998877'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 2
  ctx.fillText('MAP', vx + vw / 2, vy + pad + 14 * s)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'

  // Reserve bottom for mini-scoreboard
  const scoreboardH = Math.min(st.players.length * 14 * s + 8 * s, vh * 0.3)
  const headerH = pad + 20 * s

  // Minimap (centered, fills remaining space)
  const mmMaxW = vw - pad * 2
  const mmMaxH = vh - headerH - scoreboardH - pad
  const mmSize = Math.min(mmMaxW, mmMaxH)
  if (mmSize > 20) {
    const mmX = vx + (vw - mmSize) / 2
    const mmY = vy + headerH + (mmMaxH - mmSize) / 2
    drawMinimapFull(ctx, mmX, mmY, mmSize, st)
  }

  // Mini-scoreboard at bottom
  const sbY = vy + vh - scoreboardH
  ctx.font = `${rnd(11 * s)}px monospace`
  const sorted = [...st.players].sort((a, b) => b.score - a.score)
  for (let i = 0; i < sorted.length; i++) {
    const pp = sorted[i]
    const rowY = sbY + i * 14 * s + 12 * s
    ctx.fillStyle = pp.color
    ctx.fillRect(vx + pad, rowY - 8 * s, 8 * s, 8 * s)
    ctx.fillStyle = pp.alive ? '#cccccc' : '#666666'
    ctx.fillText(`${pp.name || `P${pp.pIndex + 1}`}: ${pp.score}pts K:${pp.kills}`, vx + pad + 12 * s, rowY)
  }
}

// ── Panel grid borders ────────────────────────────────────
/** Draw thin lines between split-screen panels. */
export function drawPanelBorders(
  ctx: CanvasRenderingContext2D,
  cols: number, rows: number,
  w: number, h: number,
) {
  ctx.strokeStyle = 'rgba(200, 180, 140, 0.35)'
  ctx.lineWidth = 2
  for (let c = 1; c < cols; c++) {
    const x = Math.round(c * w / cols)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let ro = 1; ro < rows; ro++) {
    const y = Math.round(ro * h / rows)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
}

// ── Game Over overlay (full canvas) ───────────────────────
export function drawGameOver(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  st: GameState,
) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.fillRect(0, 0, w, h)

  ctx.font = 'bold 48px monospace'
  ctx.fillStyle = '#ff6644'
  ctx.textAlign = 'center'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 8
  ctx.fillText('GAME OVER', w / 2, h / 2 - 60)

  if (st.winner) {
    ctx.font = 'bold 28px monospace'
    ctx.fillStyle = '#ffdd44'
    ctx.fillText(st.winner, w / 2, h / 2 - 10)
  }

  ctx.font = '16px monospace'
  ctx.fillStyle = '#ffffff'
  const sorted = [...st.players].sort((a, b) => b.score - a.score)
  sorted.forEach((p, i) => {
    ctx.fillText(
      `${i + 1}. ${p.name || `Player ${p.pIndex + 1}`}  Score: ${p.score}  Kills: ${p.kills}`,
      w / 2, h / 2 + 30 + i * 28,
    )
  })

  ctx.font = '14px monospace'
  ctx.fillStyle = '#aaaaaa'
  ctx.fillText('Press ENTER or A to restart', w / 2, h / 2 + 30 + sorted.length * 28 + 30)
  ctx.textAlign = 'left'
  ctx.shadowBlur = 0
}

// ── Internal helpers ──────────────────────────────────────

/** Round to integer for pixel-crisp font sizes. */
function rnd(n: number): number { return Math.round(Math.max(1, n)) }

function drawBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, fg: string, bg: string, label: string, s: number,
) {
  pct = Math.max(0, Math.min(1, pct))
  ctx.fillStyle = bg
  ctx.globalAlpha = 0.7
  roundRect(ctx, x, y, w, h, 4 * s)
  ctx.fill()
  ctx.globalAlpha = 0.9
  ctx.fillStyle = fg
  if (pct > 0) {
    roundRect(ctx, x, y, w * pct, h, 4 * s)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  ctx.font = `bold ${rnd(10 * s)}px monospace`
  ctx.fillStyle = '#ffffff'
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 2
  ctx.fillText(label, x + 4 * s, y + h - 2 * s)
  ctx.shadowBlur = 0
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rad: number) {
  ctx.beginPath()
  ctx.moveTo(x + rad, y)
  ctx.lineTo(x + w - rad, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad)
  ctx.lineTo(x + w, y + h - rad)
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h)
  ctx.lineTo(x + rad, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad)
  ctx.lineTo(x, y + rad)
  ctx.quadraticCurveTo(x, y, x + rad, y)
  ctx.closePath()
}

/** Small minimap with one player highlighted (for per-viewport corners). */
function drawMinimap(
  ctx: CanvasRenderingContext2D,
  mx: number, my: number, size: number,
  st: GameState, localP: Player,
) {
  const ww = st.level.worldW, wh = st.level.worldH
  const scale = size / Math.max(ww, wh)

  ctx.fillStyle = 'rgba(20, 15, 10, 0.75)'
  ctx.fillRect(mx, my, size, size)
  ctx.strokeStyle = 'rgba(200, 180, 140, 0.5)'
  ctx.lineWidth = 1
  ctx.strokeRect(mx, my, size, size)

  drawMinimapContent(ctx, mx, my, scale, st)

  // Other players as dots
  for (const p of st.players) {
    if (!p.alive || p.pIndex === localP.pIndex) continue
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(mx + p.x * scale, my + p.y * scale, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Local player (larger, with direction)
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = localP.color
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.arc(mx + localP.x * scale, my + localP.y * scale, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(mx + localP.x * scale, my + localP.y * scale)
  ctx.lineTo(
    mx + localP.x * scale + Math.cos(localP.angle) * 7,
    my + localP.y * scale + Math.sin(localP.angle) * 7,
  )
  ctx.stroke()
}

/** Large minimap highlighting all players equally (for the dedicated panel). */
function drawMinimapFull(
  ctx: CanvasRenderingContext2D,
  mx: number, my: number, size: number,
  st: GameState,
) {
  const ww = st.level.worldW, wh = st.level.worldH
  const scale = size / Math.max(ww, wh)

  ctx.fillStyle = 'rgba(20, 15, 10, 0.8)'
  ctx.fillRect(mx, my, size, size)
  ctx.strokeStyle = 'rgba(200, 180, 140, 0.5)'
  ctx.lineWidth = 1
  ctx.strokeRect(mx, my, size, size)

  drawMinimapContent(ctx, mx, my, scale, st)

  // All players equally visible
  for (const p of st.players) {
    if (!p.alive) continue
    ctx.fillStyle = p.color
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(mx + p.x * scale, my + p.y * scale, 3.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Direction
    ctx.strokeStyle = p.color
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(mx + p.x * scale, my + p.y * scale)
    ctx.lineTo(
      mx + p.x * scale + Math.cos(p.angle) * 8,
      my + p.y * scale + Math.sin(p.angle) * 8,
    )
    ctx.stroke()
  }
}

/** Shared minimap content: roads, buildings, water, vehicles, NPCs, police, missions. */
function drawMinimapContent(
  ctx: CanvasRenderingContext2D,
  mx: number, my: number, scale: number,
  st: GameState,
) {
  // Roads
  ctx.fillStyle = 'rgba(100,100,100,0.6)'
  for (const rd of st.level.roads) {
    ctx.fillRect(mx + rd.x * scale, my + rd.y * scale, rd.w * scale, rd.h * scale)
  }

  // Buildings
  ctx.fillStyle = 'rgba(150,130,100,0.7)'
  for (const b of st.level.buildings) {
    if (b.destroyed) continue
    ctx.fillRect(mx + b.x * scale, my + b.y * scale, b.w * scale, b.h * scale)
  }

  // Water
  ctx.fillStyle = 'rgba(40,110,90,0.7)'
  for (const wz of st.level.waterZones) {
    ctx.fillRect(mx + wz.x * scale, my + wz.y * scale, wz.w * scale, wz.h * scale)
  }

  // Vehicles
  for (const v of st.vehicles) {
    if (v.hp <= 0) continue
    ctx.fillStyle = v.driver !== null ? '#ffff44' : '#888888'
    ctx.fillRect(mx + v.x * scale - 1.5, my + v.y * scale - 1.5, 3, 3)
  }

  // NPCs
  ctx.fillStyle = 'rgba(180,150,100,0.4)'
  for (const npc of st.npcs) {
    ctx.fillRect(mx + npc.x * scale - 0.5, my + npc.y * scale - 0.5, 1, 1)
  }

  // Police
  ctx.fillStyle = '#4444ff'
  for (const po of st.police) {
    ctx.fillRect(mx + po.x * scale - 1, my + po.y * scale - 1, 2, 2)
  }

  // Missions
  for (const m of st.missions) {
    if (!m.active) continue
    ctx.fillStyle = m.assignedTo !== null ? '#ffaa00' : '#44ff44'
    const mmx = m.assignedTo !== null ? m.targetX : m.x
    const mmy = m.assignedTo !== null ? m.targetY : m.y
    ctx.beginPath()
    ctx.arc(mx + mmx * scale, my + mmy * scale, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function weaponIcon(type: string): string {
  switch (type) {
    case 'pistol': return '🔫'
    case 'shotgun': return '💥'
    case 'machinegun': return '🔥'
    case 'rocket': return '🚀'
    case 'flamethrower': return '🔥'
    default: return '✊'
  }
}
