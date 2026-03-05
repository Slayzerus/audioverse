/**
 * Canvas 2D renderer for the Warzone FPP game.
 *
 * - Camera follows the local player with viewport scrolling
 * - World layer: ground, roads, buildings (with shadows & labels), props,
 *   capture points, pickups, vehicles, soldiers, bullets
 * - HUD layer: tickets, capture indicators, kill feed, weapon info,
 *   HP/armor bars, kill-streak indicator, minimap with viewport rect
 */
import type { GameState, Soldier } from './types'
import {
  SCREEN_W, SCREEN_H,
  PLAYER_R, BULLET_R, CAPTURE_R, CAPTURE_TIME, SOLDIER_ARMOR,
} from './constants'
import { clamp } from './helpers'

// ─── Camera target ───────────────────────────────────────
function cameraTarget(st: GameState): Soldier | undefined {
  return st.soldiers.find(s => !s.isBot && s.alive) || st.soldiers.find(s => !s.isBot)
}

// ─── Public draw entry ───────────────────────────────────
export function drawGame(ctx: CanvasRenderingContext2D, st: GameState): void {
  const WORLD_W = st.tileMap.w * st.tileMap.tileSize
  const WORLD_H = st.tileMap.h * st.tileMap.tileSize
  const target = cameraTarget(st)
  const camX = target ? clamp(target.x - SCREEN_W / 2, 0, WORLD_W - SCREEN_W) : 0
  const camY = target ? clamp(target.y - SCREEN_H / 2, 0, WORLD_H - SCREEN_H) : 0

  ctx.clearRect(0, 0, SCREEN_W, SCREEN_H)

  // ─── World (camera-translated) ─────────────────────────
  ctx.save()
  ctx.translate(-camX, -camY)

  drawGround(ctx, camX, camY)
  drawRoads(ctx, st)
  drawBuildings(ctx, st)
  drawProps(ctx, st)
  drawCapturePoints(ctx, st)
  drawPickups(ctx, st)
  drawVehicles(ctx, st)
  drawSoldiers(ctx, st)
  drawBullets(ctx, st)

  // World border
  ctx.strokeStyle = '#333'; ctx.lineWidth = 4
  ctx.strokeRect(0, 0, WORLD_W, WORLD_H)

  ctx.restore()

  // ─── HUD (screen-space) ────────────────────────────────
  drawHUD(ctx, st, camX, camY)
}

// ─── Ground ──────────────────────────────────────────────
function drawGround(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  ctx.fillStyle = '#4a5e2e'
  ctx.fillRect(camX, camY, SCREEN_W, SCREEN_H)

  // Subtle grid in viewport only
  ctx.strokeStyle = 'rgba(0,0,0,0.04)'
  ctx.lineWidth = 1
  const step = 64
  const startX = Math.floor(camX / step) * step
  const startY = Math.floor(camY / step) * step
  for (let gx = startX; gx < camX + SCREEN_W + step; gx += step) {
    ctx.beginPath(); ctx.moveTo(gx, camY); ctx.lineTo(gx, camY + SCREEN_H); ctx.stroke()
  }
  for (let gy = startY; gy < camY + SCREEN_H + step; gy += step) {
    ctx.beginPath(); ctx.moveTo(camX, gy); ctx.lineTo(camX + SCREEN_W, gy); ctx.stroke()
  }
}

// ─── Roads ───────────────────────────────────────────────
function drawRoads(ctx: CanvasRenderingContext2D, st: GameState): void {
  // Asphalt
  ctx.fillStyle = '#6a6a5a'
  for (const r of st.roads) ctx.fillRect(r.x, r.y, r.w, r.h)

  // Sidewalks
  ctx.fillStyle = '#8a8a7a'
  for (const r of st.roads) {
    if (r.w > r.h) {
      ctx.fillRect(r.x, r.y - 4, r.w, 4)
      ctx.fillRect(r.x, r.y + r.h, r.w, 4)
    } else {
      ctx.fillRect(r.x - 4, r.y, 4, r.h)
      ctx.fillRect(r.x + r.w, r.y, 4, r.h)
    }
  }

  // Dashed centre line
  ctx.strokeStyle = '#999'
  ctx.setLineDash([12, 16]); ctx.lineWidth = 2
  for (const r of st.roads) {
    ctx.beginPath()
    if (r.w > r.h) { ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2) }
    else            { ctx.moveTo(r.x + r.w / 2, r.y); ctx.lineTo(r.x + r.w / 2, r.y + r.h) }
    ctx.stroke()
  }
  ctx.setLineDash([])
}

// ─── Buildings ───────────────────────────────────────────
function drawBuildings(ctx: CanvasRenderingContext2D, st: GameState): void {
  for (const b of st.buildings) {
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.fillRect(b.x + 4, b.y + 4, b.w, b.h)
    // Body
    ctx.fillStyle = b.color
    ctx.fillRect(b.x, b.y, b.w, b.h)
    // Border
    ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2
    ctx.strokeRect(b.x, b.y, b.w, b.h)
    // Inner roof line
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1
    ctx.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8)
    // Label
    if (b.label) {
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = 'bold 11px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 4)
    }
  }
}

// ─── Props ───────────────────────────────────────────────
function drawProps(ctx: CanvasRenderingContext2D, st: GameState): void {
  for (const p of st.props) {
    ctx.fillStyle = p.color
    ctx.fillRect(p.x, p.y, p.w, p.h)
    if (p.blocking) {
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1
      ctx.strokeRect(p.x, p.y, p.w, p.h)
    }
  }
}

// ─── Capture Points ─────────────────────────────────────
function drawCapturePoints(ctx: CanvasRenderingContext2D, st: GameState): void {
  for (const cp of st.capturePoints) {
    // Radius circle + fill
    ctx.beginPath(); ctx.arc(cp.x, cp.y, CAPTURE_R, 0, Math.PI * 2)
    ctx.strokeStyle = cp.team === 0 ? 'rgba(231,76,60,0.3)' : cp.team === 1 ? 'rgba(52,152,219,0.3)' : 'rgba(200,200,200,0.2)'
    ctx.lineWidth = 2; ctx.stroke()
    ctx.fillStyle   = cp.team === 0 ? 'rgba(231,76,60,0.06)' : cp.team === 1 ? 'rgba(52,152,219,0.06)' : 'rgba(200,200,200,0.04)'
    ctx.fill()
    // Flag circle
    ctx.beginPath(); ctx.arc(cp.x, cp.y, 16, 0, Math.PI * 2)
    ctx.fillStyle = cp.team === 0 ? '#e74c3c' : cp.team === 1 ? '#3498db' : '#888'
    ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
    // Progress arc
    if (cp.progress > 0) {
      ctx.beginPath()
      ctx.arc(cp.x, cp.y, 22, -Math.PI / 2, -Math.PI / 2 + (cp.progress / CAPTURE_TIME) * Math.PI * 2)
      ctx.strokeStyle = '#ff0'; ctx.lineWidth = 4; ctx.stroke()
    }
    // Label
    ctx.fillStyle = '#fff'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'center'
    ctx.fillText(cp.label, cp.x, cp.y - 28)
  }
}

// ─── Pickups ─────────────────────────────────────────────
function drawPickups(ctx: CanvasRenderingContext2D, st: GameState): void {
  const pulse = 0.8 + Math.sin(st.frame * 0.1) * 0.2
  for (const pk of st.pickups) {
    if (!pk.alive) continue
    ctx.globalAlpha = pulse
    switch (pk.type) {
      case 'health':
        ctx.fillStyle = '#2ecc71'
        ctx.fillRect(pk.x - 6, pk.y - 2, 12, 4)
        ctx.fillRect(pk.x - 2, pk.y - 6, 4, 12)
        break
      case 'ammo':
        ctx.fillStyle = '#f39c12'
        ctx.fillRect(pk.x - 5, pk.y - 4, 10, 8)
        ctx.strokeStyle = '#c0760c'; ctx.lineWidth = 1
        ctx.strokeRect(pk.x - 5, pk.y - 4, 10, 8)
        break
      case 'armor':
        ctx.fillStyle = '#3498db'
        ctx.beginPath()
        ctx.moveTo(pk.x, pk.y - 7)
        ctx.lineTo(pk.x + 6, pk.y - 3)
        ctx.lineTo(pk.x + 6, pk.y + 3)
        ctx.lineTo(pk.x, pk.y + 7)
        ctx.lineTo(pk.x - 6, pk.y + 3)
        ctx.lineTo(pk.x - 6, pk.y - 3)
        ctx.closePath(); ctx.fill()
        break
    }
    ctx.globalAlpha = 1
  }
}

// ─── Vehicles ────────────────────────────────────────────
function drawVehicles(ctx: CanvasRenderingContext2D, st: GameState): void {
  for (const v of st.vehicles) {
    if (!v.alive) continue
    ctx.save(); ctx.translate(v.x, v.y); ctx.rotate(v.angle)

    switch (v.type) {
      case 'tank':
        ctx.fillStyle = v.team === 0 ? '#8a3030' : v.team === 1 ? '#305080' : '#5a5a3a'
        ctx.fillRect(-24, -14, 48, 28)
        ctx.fillRect(-6, -18, 12, 4) // turret base
        ctx.fillStyle = '#444'; ctx.fillRect(16, -4, 16, 8)
        ctx.fillStyle = '#333'; ctx.fillRect(-24, -16, 48, 3); ctx.fillRect(-24, 13, 48, 3)
        break
      case 'jeep':
        ctx.fillStyle = v.team === 0 ? '#b04040' : v.team === 1 ? '#4070b0' : '#7a7a4a'
        ctx.fillRect(-16, -10, 32, 20)
        ctx.fillStyle = '#333'
        ctx.fillRect(-18, -12, 6, 4); ctx.fillRect(12, -12, 6, 4)
        ctx.fillRect(-18, 8, 6, 4);   ctx.fillRect(12, 8, 6, 4)
        ctx.fillStyle = 'rgba(150,200,255,0.4)'; ctx.fillRect(8, -6, 4, 12)
        break
      case 'helicopter': {
        ctx.fillStyle = v.team === 0 ? '#a04040' : v.team === 1 ? '#4060a0' : '#6a6a4a'
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 12, 0, 0, Math.PI * 2); ctx.fill()
        ctx.fillRect(-30, -3, 12, 6)
        // Rotor
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2
        const ra = st.frame * 0.3
        ctx.beginPath()
        ctx.moveTo(-25 * Math.cos(ra), -25 * Math.sin(ra))
        ctx.lineTo( 25 * Math.cos(ra),  25 * Math.sin(ra)); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(-25 * Math.cos(ra + Math.PI / 2), -25 * Math.sin(ra + Math.PI / 2))
        ctx.lineTo( 25 * Math.cos(ra + Math.PI / 2),  25 * Math.sin(ra + Math.PI / 2)); ctx.stroke()
        break
      }
    }
    ctx.restore()

    // HP bar
    if (v.hp < v.maxHp) {
      const bw = v.type === 'tank' ? 48 : v.type === 'helicopter' ? 44 : 32
      ctx.fillStyle = '#600'; ctx.fillRect(v.x - bw / 2, v.y - 24, bw, 4)
      ctx.fillStyle = '#0f0'; ctx.fillRect(v.x - bw / 2, v.y - 24, bw * (v.hp / v.maxHp), 4)
    }
  }
}

// ─── Soldiers ────────────────────────────────────────────
function drawSoldiers(ctx: CanvasRenderingContext2D, st: GameState): void {
  for (const s of st.soldiers) {
    if (!s.alive || s.vehicleIndex >= 0) continue

    // FOV cone (local player only)
    if (!s.isBot) {
      ctx.beginPath(); ctx.moveTo(s.x, s.y)
      ctx.arc(s.x, s.y, 200, s.angle - Math.PI / 6, s.angle + Math.PI / 6)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,255,200,0.04)'; ctx.fill()
    }

    // Sprint trail
    if (s.isSprinting) {
      ctx.beginPath()
      ctx.arc(s.x - Math.cos(s.angle) * 8, s.y - Math.sin(s.angle) * 8, PLAYER_R * 0.6, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fill()
    }

    // Team ring
    ctx.beginPath(); ctx.arc(s.x, s.y, PLAYER_R + 3, 0, Math.PI * 2)
    ctx.strokeStyle = s.team === 0 ? '#e74c3c' : '#3498db'; ctx.lineWidth = 2; ctx.stroke()

    // Body
    ctx.beginPath(); ctx.arc(s.x, s.y, PLAYER_R, 0, Math.PI * 2)
    ctx.fillStyle = s.color; ctx.fill()

    // Aim line
    ctx.beginPath(); ctx.moveTo(s.x, s.y)
    ctx.lineTo(s.x + Math.cos(s.angle) * 22, s.y + Math.sin(s.angle) * 22)
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()

    // HP bar
    if (s.hp < s.maxHp) {
      ctx.fillStyle = '#600'; ctx.fillRect(s.x - 12, s.y - PLAYER_R - 8, 24, 4)
      ctx.fillStyle = '#0f0'; ctx.fillRect(s.x - 12, s.y - PLAYER_R - 8, 24 * (s.hp / s.maxHp), 4)
    }
    // Armor bar
    if (s.armor > 0) {
      ctx.fillStyle = '#06a'
      ctx.fillRect(s.x - 12, s.y - PLAYER_R - 4, 24 * (s.armor / SOLDIER_ARMOR), 2)
    }
    // Name
    if (!s.isBot) {
      ctx.fillStyle = '#fff'; ctx.font = '10px monospace'; ctx.textAlign = 'center'
      ctx.fillText(s.name, s.x, s.y - PLAYER_R - 12)
    }
  }
}

// ─── Bullets ─────────────────────────────────────────────
function drawBullets(ctx: CanvasRenderingContext2D, st: GameState): void {
  for (const b of st.bullets) {
    const isSplash = b.splash && b.splash > 0
    ctx.fillStyle = isSplash ? (b.weapon === 'Flashbang' ? '#fff' : '#f80') : '#ff0'
    ctx.beginPath(); ctx.arc(b.x, b.y, isSplash ? BULLET_R + 2 : BULLET_R, 0, Math.PI * 2); ctx.fill()
    // Tracer trail
    ctx.strokeStyle = 'rgba(255,255,0,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(b.x, b.y)
    ctx.lineTo(b.x - b.dx * 0.3, b.y - b.dy * 0.3); ctx.stroke()
  }
}

// ─── HUD (screen-space) ─────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, st: GameState, camX: number, camY: number): void {
  const WORLD_W = st.tileMap.w * st.tileMap.tileSize
  const WORLD_H = st.tileMap.h * st.tileMap.tileSize
  // Top bar — tickets
  ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, SCREEN_W, 32)
  ctx.font = 'bold 15px monospace'
  ctx.textAlign = 'left';  ctx.fillStyle = '#e74c3c'; ctx.fillText(`RED: ${st.tickets[0]}`, 12, 22)
  ctx.textAlign = 'right'; ctx.fillStyle = '#3498db'; ctx.fillText(`BLU: ${st.tickets[1]}`, SCREEN_W - 12, 22)

  // Capture-point indicators
  ctx.textAlign = 'center'
  const cpStart = SCREEN_W / 2 - (st.capturePoints.length * 24) / 2
  st.capturePoints.forEach((cp, i) => {
    ctx.fillStyle = cp.team === 0 ? '#e74c3c' : cp.team === 1 ? '#3498db' : '#555'
    ctx.fillRect(cpStart + i * 26, 6, 20, 20)
    ctx.fillStyle = '#fff'; ctx.font = '11px monospace'
    ctx.fillText(cp.label, cpStart + i * 26 + 10, 21)
  })

  // Kill feed (right)
  ctx.textAlign = 'right'; ctx.font = '11px monospace'
  st.killFeed.forEach((kf, i) => {
    const alpha = Math.max(0, 1 - (st.frame - kf.time) / 300)
    ctx.fillStyle = `rgba(255,255,255,${alpha})`
    ctx.fillText(kf.text, SCREEN_W - 12, 55 + i * 16)
  })

  // Player info (bottom-left)
  const player = st.soldiers.find(s => !s.isBot)
  if (player) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(8, SCREEN_H - 80, 200, 72)
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(8, SCREEN_H - 80, 200, 72)

    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left'
    ctx.fillText(player.weapons[player.weaponIndex] || 'Rifle', 16, SCREEN_H - 60)

    // HP
    ctx.fillStyle = '#400'; ctx.fillRect(16, SCREEN_H - 48, 130, 10)
    ctx.fillStyle = player.hp > 30 ? '#2ecc71' : '#e74c3c'
    ctx.fillRect(16, SCREEN_H - 48, 130 * Math.max(0, player.hp / player.maxHp), 10)
    ctx.fillStyle = '#fff'; ctx.font = '10px monospace'
    ctx.fillText(`${Math.ceil(Math.max(0, player.hp))} HP`, 152, SCREEN_H - 40)

    // Armor
    if (player.armor > 0) {
      ctx.fillStyle = '#035'; ctx.fillRect(16, SCREEN_H - 35, 130, 6)
      ctx.fillStyle = '#3498db'; ctx.fillRect(16, SCREEN_H - 35, 130 * (player.armor / SOLDIER_ARMOR), 6)
    }

    // Kill streak
    if (player.killStreak >= 3) {
      ctx.fillStyle = '#f1c40f'; ctx.font = 'bold 12px monospace'
      ctx.fillText(`x${player.killStreak} STREAK`, 16, SCREEN_H - 18)
    }
  }

  // ─── Minimap (bottom-right) ────────────────────────────
  const mmW = 160, mmH = 160
  const mmX = SCREEN_W - mmW - 10, mmY = SCREEN_H - mmH - 10
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(mmX, mmY, mmW, mmH)
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.strokeRect(mmX, mmY, mmW, mmH)

  const sx = mmW / WORLD_W, sy = mmH / WORLD_H

  // Roads
  ctx.fillStyle = 'rgba(100,100,80,0.5)'
  for (const r of st.roads) ctx.fillRect(mmX + r.x * sx, mmY + r.y * sy, Math.max(1, r.w * sx), Math.max(1, r.h * sy))

  // Buildings
  ctx.fillStyle = 'rgba(80,80,80,0.6)'
  for (const b of st.buildings) ctx.fillRect(mmX + b.x * sx, mmY + b.y * sy, Math.max(1, b.w * sx), Math.max(1, b.h * sy))

  // Capture points
  for (const cp of st.capturePoints) {
    ctx.fillStyle = cp.team === 0 ? '#e74c3c' : cp.team === 1 ? '#3498db' : '#888'
    ctx.fillRect(mmX + cp.x * sx - 3, mmY + cp.y * sy - 3, 6, 6)
  }

  // Soldiers
  for (const s of st.soldiers) {
    if (!s.alive) continue
    ctx.fillStyle = s.team === 0 ? '#f66' : '#6af'
    const d = s.isBot ? 2 : 3
    ctx.fillRect(mmX + s.x * sx - d / 2, mmY + s.y * sy - d / 2, d, d)
  }

  // Viewport rect
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1
  ctx.strokeRect(mmX + camX * sx, mmY + camY * sy, SCREEN_W * sx, SCREEN_H * sy)
}
