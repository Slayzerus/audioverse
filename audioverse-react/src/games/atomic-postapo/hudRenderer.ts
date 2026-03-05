/**
 * 2D HUD overlay renderer for AtomicPostApo.
 *
 * Draws on a transparent canvas overlaid on the 3D viewport.
 * Includes: player stats, minimap, kill feed, area status, weapon info.
 */
import type { GameState } from './types'
import { WEAPONS } from './constants'

const MINIMAP_W = 160
const MINIMAP_H = 120

/**
 * Draw the full HUD for the current game state.
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  st: GameState,
): void {
  ctx.clearRect(0, 0, W, H)

  // ─── Player status bars (top) ──────────────────────────
  const alivePlayers = st.players
  for (let i = 0; i < alivePlayers.length; i++) {
    const p = alivePlayers[i]
    const hx = 10 + i * 220
    const hy = 8

    // Background panel
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.fillRect(hx, hy, 210, 75)
    ctx.strokeStyle = p.color
    ctx.lineWidth = 1.5
    ctx.strokeRect(hx, hy, 210, 75)

    // Name
    ctx.fillStyle = p.alive ? p.color : '#666'
    ctx.font = 'bold 11px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(p.alive ? p.name : `☠ ${p.name}`, hx + 5, hy + 14)

    // HP bar
    const hpPct = Math.max(0, p.hp / p.maxHp)
    ctx.fillStyle = '#300'
    ctx.fillRect(hx + 5, hy + 18, 120, 7)
    ctx.fillStyle = hpPct > 0.3 ? '#0c0' : '#c00'
    ctx.fillRect(hx + 5, hy + 18, 120 * hpPct, 7)
    ctx.fillStyle = '#ccc'
    ctx.font = '9px monospace'
    ctx.fillText(`HP ${Math.ceil(p.hp)}/${p.maxHp}`, hx + 130, hy + 25)

    // Armor bar
    const arPct = p.armor / p.maxArmor
    ctx.fillStyle = '#222'
    ctx.fillRect(hx + 5, hy + 27, 80, 5)
    ctx.fillStyle = '#4488ff'
    ctx.fillRect(hx + 5, hy + 27, 80 * arPct, 5)
    ctx.fillStyle = '#88c'
    ctx.fillText(`AR ${Math.floor(p.armor)}`, hx + 90, hy + 32)

    // Radiation (yellow bar under armor)
    if (p.radiation > 0) {
      const radPct = Math.min(1, p.radiation / 100)
      ctx.fillStyle = '#330'
      ctx.fillRect(hx + 5, hy + 34, 80, 4)
      ctx.fillStyle = '#cc0'
      ctx.fillRect(hx + 5, hy + 34, 80 * radPct, 4)
      ctx.fillStyle = '#cc0'
      ctx.fillText(`RAD ${Math.floor(p.radiation)}`, hx + 90, hy + 38)
    }

    // Weapon info
    const weapon = WEAPONS[p.weaponIdx] || WEAPONS[0]
    ctx.fillStyle = '#ffa'
    ctx.font = '9px monospace'
    ctx.fillText(`🔫 ${weapon.name}`, hx + 5, hy + 48)
    ctx.fillStyle = '#ff0'
    ctx.fillText(`Ammo: ${p.ammo}`, hx + 130, hy + 48)

    // Currencies
    ctx.fillStyle = '#FFD700'
    ctx.fillText(`🪙${p.coins}`, hx + 5, hy + 60)
    ctx.fillStyle = '#44f'
    ctx.fillText(`💎${p.gems}`, hx + 55, hy + 60)
    ctx.fillStyle = '#ff0'
    ctx.fillText(`⭐${p.stars}`, hx + 105, hy + 60)

    // Items
    ctx.fillStyle = '#0fc'
    ctx.fillText(`💉${p.stimpaks}`, hx + 5, hy + 72)
    ctx.fillStyle = '#f60'
    ctx.fillText(`☢${p.radaway}`, hx + 45, hy + 72)
    // Kills
    ctx.fillStyle = '#f88'
    ctx.fillText(`K:${p.kills}`, hx + 90, hy + 72)

    // VATS cooldown
    if (p.vatsCd > 0) {
      ctx.fillStyle = '#0cc'
      ctx.fillText(`V:${Math.ceil(p.vatsCd / 1000)}s`, hx + 140, hy + 72)
    } else {
      ctx.fillStyle = '#0ff'
      ctx.fillText('V:RDY', hx + 140, hy + 72)
    }
  }

  // ─── Kill feed (right side) ────────────────────────────
  const feedX = W - 260
  let feedY = 90
  for (const kf of st.killFeed) {
    const age = st.time - kf.time
    const alpha = Math.max(0, 1 - age / 6000)
    ctx.globalAlpha = alpha
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(feedX, feedY, 250, 18)
    ctx.fillStyle = kf.color
    ctx.font = '10px monospace'
    ctx.textAlign = 'left'
    ctx.fillText(kf.text, feedX + 5, feedY + 13)
    feedY += 20
    ctx.globalAlpha = 1
  }

  // ─── Areas status (below kill feed or bottom-left) ─────
  const areasCleared = st.areas.filter(a => a.cleared).length
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(W - 170, H - 30, 160, 22)
  ctx.fillStyle = '#ccc'
  ctx.font = '11px monospace'
  ctx.textAlign = 'right'
  if (st.mode === 'coop-survival') {
    ctx.fillText(`Wave: ${st.wave} | K:${st.players.reduce((s, p) => s + p.kills, 0)}`, W - 15, H - 14)
  } else {
    ctx.fillText(`Areas: ${areasCleared}/${st.areas.length}`, W - 15, H - 14)
  }

  // ─── Minimap (bottom-right) ────────────────────────────
  const mmX = W - MINIMAP_W - 10
  const mmY = H - MINIMAP_H - 40
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.fillRect(mmX, mmY, MINIMAP_W, MINIMAP_H)
  ctx.strokeStyle = '#555'
  ctx.lineWidth = 1
  ctx.strokeRect(mmX, mmY, MINIMAP_W, MINIMAP_H)

  const sx = MINIMAP_W / st.mapW
  const sy = MINIMAP_H / st.mapH

  // Area boundaries
  for (const area of st.areas) {
    ctx.strokeStyle = area.cleared ? 'rgba(50,200,50,0.4)' : 'rgba(100,100,100,0.3)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(mmX + area.x * sx, mmY + area.y * sy, area.w * sx, area.h * sy)
  }

  // Buildings on minimap
  ctx.fillStyle = '#666'
  for (const b of st.buildings) {
    ctx.fillRect(
      mmX + (b.x - b.w / 2) * sx,
      mmY + (b.y - b.h / 2) * sy,
      Math.max(2, b.w * sx),
      Math.max(2, b.h * sy),
    )
  }

  // Rad zones
  for (const rz of st.radZones) {
    ctx.fillStyle = 'rgba(50,200,50,0.3)'
    ctx.beginPath()
    ctx.arc(mmX + rz.x * sx, mmY + rz.y * sy, rz.r * sx, 0, Math.PI * 2)
    ctx.fill()
  }

  // Enemies on minimap
  ctx.fillStyle = '#f00'
  for (const e of st.enemies) {
    if (e.dead) continue
    ctx.fillRect(mmX + e.x * sx - 1, mmY + e.y * sy - 1, 2, 2)
  }

  // Loot on minimap
  ctx.fillStyle = '#ff0'
  for (const lb of st.loot) {
    if (lb.open) continue
    ctx.fillRect(mmX + lb.x * sx - 1, mmY + lb.y * sy - 1, 2, 2)
  }

  // Players on minimap
  for (const p of st.players) {
    if (!p.alive) continue
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(mmX + p.x * sx, mmY + p.y * sy, 3, 0, Math.PI * 2)
    ctx.fill()
  }

  // ─── Controls help (bottom-left) ──────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(8, H - 85, 200, 78)
  ctx.fillStyle = '#999'
  ctx.font = '9px monospace'
  ctx.textAlign = 'left'
  ctx.fillText('WASD: Move  Space: Shoot', 14, H - 72)
  ctx.fillText('E: Loot  Q: VATS  Shift: Sprint', 14, H - 60)
  ctx.fillText('1/2: Switch Weapon', 14, H - 48)
  ctx.fillText('R: Stimpak  T: RadAway', 14, H - 36)
  ctx.fillText('Esc: Pause', 14, H - 24)
  if (st.mode === 'vs-wasteland') {
    ctx.fillStyle = '#f66'
    ctx.fillText('⚔ VS MODE — Friendly fire ON', 14, H - 12)
  }
}
