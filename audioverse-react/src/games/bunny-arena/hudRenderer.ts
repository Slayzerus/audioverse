/**
 * hudRenderer.ts — 2D canvas overlay for BunnyGame.
 *
 * Draws on a transparent canvas overlaid on the 3D viewport.
 * Includes: countdown, mode-specific banners, controls help,
 * king-of-hill timer, race checkpoint progress, sumo warning.
 *
 * All visible text is passed via `labels` from BunnyGame.tsx (i18n'd).
 * Player names and lives are rendered as Three.js sprites in sceneSync.
 */
import type { GameState } from './types'

/** All translatable HUD labels, filled by BunnyGame.tsx via t() */
export interface HUDLabels {
  modeBanner: string
  controlsRoll: string
  controlsStand: string
  controlsGrab: string
  controlsPause: string
  controlsAttack: string
  kingTimer: (seconds: number) => string
  sumoRing: string
  raceCheckpoint: (n: number) => string
  raceFinish: string
}

/**
 * Draw the full HUD for the current game state.
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  st: GameState,
  labels: HUDLabels,
): void {
  ctx.clearRect(0, 0, W, H)

  // ── Countdown ──────────────────────────────────────────
  if (st.countdown > 0) {
    ctx.font = 'bold 80px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#fff'
    ctx.globalAlpha = 0.85
    ctx.shadowColor = 'rgba(0,0,0,0.7)'
    ctx.shadowBlur = 12
    ctx.fillText(String(st.countdown), W / 2, H / 2)
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }

  // ── Mode banner (first few seconds) ────────────────────
  if (st.frame < 180) {
    const alpha = Math.max(0, 1 - st.frame / 180)
    ctx.globalAlpha = alpha * 0.8
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    const tw = Math.min(W * 0.6, 380)
    ctx.fillRect(W / 2 - tw / 2, 10, tw, 36)
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 17px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const icon = st.mode === 'arena' ? '⚔ '
      : st.mode === 'puzzle' ? '🧩 '
        : st.mode === 'sumo' ? '🤼 '
          : st.mode === 'race' ? '🏁 '
            : st.mode === 'king' ? '👑 '
              : '🏍 '
    ctx.fillText(icon + labels.modeBanner, W / 2, 28)
    ctx.globalAlpha = 1
  }

  // ── Coin counter for puzzle mode ───────────────────────
  if (st.mode === 'puzzle') {
    const total = st.coins.length
    const collected = st.coins.filter(c => c.collected).length
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(W / 2 - 50, H - 36, 100, 28)
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`🪙 ${collected} / ${total}`, W / 2, H - 22)
  }

  // ── King-of-the-Hill timer ─────────────────────────────
  if (st.mode === 'king') {
    for (let i = 0; i < st.bunnies.length; i++) {
      const b = st.bunnies[i]
      if (!b.alive && b.lives <= 0) continue
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      const bw = 140
      const bx = 8 + (i % 4) * (bw + 8)
      const by = H - 36
      ctx.fillRect(bx, by, bw, 28)
      ctx.fillStyle = b.color
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(`👑 ${b.name}: ${labels.kingTimer(Math.floor(b.kingTimer))}`, bx + 6, by + 14)
    }
  }

  // ── Race checkpoint progress ───────────────────────────
  if (st.mode === 'race' && st.checkpoints.length > 0) {
    for (let i = 0; i < st.bunnies.length; i++) {
      const b = st.bunnies[i]
      if (!b.alive && b.lives <= 0) continue
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      const bw = 160
      const bx = 8 + (i % 4) * (bw + 8)
      const by = H - 36
      ctx.fillRect(bx, by, bw, 28)
      ctx.fillStyle = b.color
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      const cpLabel = b.score >= st.checkpoints.length
        ? labels.raceFinish
        : labels.raceCheckpoint(b.score + 1)
      ctx.fillText(`🏁 ${b.name}: ${cpLabel}`, bx + 6, by + 14)
    }
  }

  // ── Sumo ring warning ──────────────────────────────────
  if (st.mode === 'sumo' && st.frame < 300) {
    const alpha = Math.max(0, 1 - st.frame / 300)
    ctx.globalAlpha = alpha * 0.7
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(W / 2 - 140, H - 50, 280, 32)
    ctx.fillStyle = '#ff8844'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚠ ' + labels.sumoRing, W / 2, H - 34)
    ctx.globalAlpha = 1
  }

  // ── Controls help (bottom-left, fades after 10s) ───────
  if (st.frame < 600) {
    const alpha = Math.max(0, 1 - (st.frame - 300) / 300)
    if (alpha > 0) {
      ctx.globalAlpha = alpha * 0.7
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.fillRect(8, H - 90, 240, 82)
      ctx.fillStyle = '#bbb'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(`← → : ${labels.controlsRoll}`, 14, H - 84)
      ctx.fillText(`A / Space : ${labels.controlsStand}`, 14, H - 70)
      ctx.fillText(`🦵 : ${labels.controlsAttack}`, 14, H - 56)
      ctx.fillText(`LB / Shift : ${labels.controlsGrab}`, 14, H - 42)
      ctx.fillText(`Esc : ${labels.controlsPause}`, 14, H - 28)
      ctx.globalAlpha = 1
    }
  }
}
