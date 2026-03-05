/**
 * 2D HUD overlay renderer for Underpaid Time Management.
 *
 * Draws order queue, timer, score, combo indicators, and player status
 * on a canvas overlaid on the 3D viewport.
 */
import type { GameState } from './types'
import { INGREDIENT_COLORS, INGREDIENT_ICONS, CHOP_TIME, CLEAN_TIME, COOK_TIME, BURN_TIME } from './constants'
import { timerColor } from './helpers'

/**
 * Draw the full HUD overlay.
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  st: GameState,
): void {
  ctx.clearRect(0, 0, w, h)

  drawOrderBar(ctx, w, h, st)
  drawTimerAndScore(ctx, w, h, st)
  drawComboIndicator(ctx, w, h, st)
  drawPlayerStatus(ctx, w, h, st)
  drawStoveWarnings(ctx, w, h, st)
}

// ─── Order bar (top) ────────────────────────────────────
function drawOrderBar(ctx: CanvasRenderingContext2D, w: number, _h: number, st: GameState): void {
  // Semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
  ctx.fillRect(0, 0, w, 70)

  let ox = 10
  const orderW = 110
  const orderH = 55

  for (const order of st.orders) {
    // Order card
    ctx.fillStyle = 'rgba(50, 50, 50, 0.9)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    ctx.lineWidth = 1
    roundRect(ctx, ox, 6, orderW, orderH, 6)
    ctx.fill()
    ctx.stroke()

    // Recipe icon + name
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(`${order.recipe.icon} ${order.recipe.name}`, ox + 6, 22)

    // Ingredient dots
    const ings = order.recipe.ingredients
    for (let i = 0; i < ings.length; i++) {
      const ix = ox + 8 + i * 18
      ctx.fillStyle = INGREDIENT_COLORS[ings[i]] || '#888'
      ctx.beginPath()
      ctx.arc(ix + 6, 36, 6, 0, Math.PI * 2)
      ctx.fill()
      // Label
      ctx.fillStyle = '#fff'
      ctx.font = '8px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(INGREDIENT_ICONS[ings[i]] || '?', ix + 6, 39)
    }

    // Timer bar
    const pct = Math.max(0, order.timeLeft / order.maxTime)
    const barY = orderH + 2
    ctx.fillStyle = '#222'
    ctx.fillRect(ox + 4, barY, orderW - 8, 5)
    ctx.fillStyle = timerColor(pct)
    ctx.fillRect(ox + 4, barY, (orderW - 8) * pct, 5)

    // Score value
    ctx.fillStyle = '#f1c40f'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText(`+${order.recipe.score}`, ox + orderW - 6, 22)

    ox += orderW + 8
  }

  // No orders yet
  if (st.orders.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Waiting for orders...', w / 2, 40)
  }
}

// ─── Timer and score (top right) ────────────────────────
function drawTimerAndScore(
  ctx: CanvasRenderingContext2D, w: number, _h: number, st: GameState,
): void {
  const seconds = Math.ceil(st.timeLeft / 1000)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60

  // Timer
  ctx.fillStyle = seconds <= 30 ? '#e74c3c' : '#fff'
  ctx.font = 'bold 22px "Segoe UI", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`, w - 12, 28)

  // Score
  ctx.fillStyle = '#f1c40f'
  ctx.font = 'bold 18px "Segoe UI", sans-serif'
  ctx.fillText(`Score: ${st.score}`, w - 12, 52)

  // Currencies
  ctx.font = '14px sans-serif'
  ctx.fillStyle = '#f1c40f'
  ctx.fillText(`🪙 ${st.totalCoins}`, w - 140, 28)
  ctx.fillStyle = '#9b59b6'
  ctx.fillText(`💎 ${st.totalGems}`, w - 140, 48)
  ctx.fillStyle = '#fff'
  ctx.fillText(`⭐ ${st.totalStars}`, w - 140, 66)
}

// ─── Combo indicator ────────────────────────────────────
function drawComboIndicator(
  ctx: CanvasRenderingContext2D, w: number, _h: number, st: GameState,
): void {
  if (st.combo <= 0) return

  const comboText = `${st.combo}x COMBO!`
  const x = w / 2
  const y = 94

  // Pulsing effect
  const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.1
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(pulse, pulse)

  ctx.fillStyle = '#ff6600'
  ctx.font = `bold ${18 + st.combo * 2}px "Segoe UI", sans-serif`
  ctx.textAlign = 'center'
  ctx.shadowColor = '#ff6600'
  ctx.shadowBlur = 10
  ctx.fillText(comboText, 0, 0)

  // Combo bar
  const barW = 100
  const comboTimerPct = st.comboTimer / 5000
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(-barW / 2, 8, barW, 4)
  ctx.fillStyle = '#ff6600'
  ctx.fillRect(-barW / 2, 8, barW * comboTimerPct, 4)

  ctx.restore()
}

// ─── Player status (bottom) ────────────────────────────
function drawPlayerStatus(
  ctx: CanvasRenderingContext2D, w: number, h: number, st: GameState,
): void {
  const barH = 36
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)'
  ctx.fillRect(0, h - barH, w, barH)

  const pw = Math.min(200, (w - 20) / st.players.length)
  let px = 10

  for (const p of st.players) {
    // Player color dot
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(px + 10, h - barH / 2, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // Name
    ctx.fillStyle = '#fff'
    ctx.font = '12px "Segoe UI", sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(p.name, px + 22, h - barH / 2 - 4)

    // Held item indicator
    if (p.holding) {
      const badge = INGREDIENT_ICONS[p.holding.ingredient] || '?'
      const status = p.holding.chopped ? '✂' : p.holding.cooked ? '🔥' : ''
      ctx.fillText(`${badge}${status}`, px + 22, h - barH / 2 + 12)
    } else if (p.holdingPlate) {
      ctx.fillText(`🍽 [${p.holdingPlate.items.length}]`, px + 22, h - barH / 2 + 12)
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillText('empty', px + 22, h - barH / 2 + 12)
    }

    // Chop/interact progress bars
    if (p.chopTimer > 0) {
      const maxChop = CHOP_TIME // approximate
      const pct = 1 - p.chopTimer / maxChop
      drawMiniBar(ctx, px + 90, h - barH / 2 - 3, 60, 6, pct, '#f1c40f')
      ctx.fillStyle = '#fff'
      ctx.font = '9px sans-serif'
      ctx.fillText('✂chopping', px + 90, h - barH / 2 + 10)
    }
    if (p.interactTimer > 0) {
      const maxInt = CLEAN_TIME
      const pct = 1 - p.interactTimer / maxInt
      drawMiniBar(ctx, px + 90, h - barH / 2 - 3, 60, 6, pct, '#3498db')
    }

    // Combo
    if (p.combo > 0) {
      ctx.fillStyle = '#ff6600'
      ctx.font = 'bold 11px sans-serif'
      ctx.fillText(`${p.combo}x`, px + pw - 20, h - barH / 2 + 4)
    }

    px += pw
  }
}

// ─── Stove warning indicators ───────────────────────────
function drawStoveWarnings(
  ctx: CanvasRenderingContext2D, w: number, _h: number, st: GameState,
): void {
  // Show warnings for stoves about to burn / on fire in a bar area
  const warnings: string[] = []
  for (const sv of st.stoves) {
    if (sv.onFire) {
      warnings.push('🔥 FIRE! Clean stove!')
    } else if (sv.item && sv.cookProgress >= COOK_TIME) {
      const burnPct = sv.burnProgress / BURN_TIME
      if (burnPct > 0.5) warnings.push('⚠ Food burning!')
      else if (sv.cookProgress >= COOK_TIME && sv.burnProgress === 0) warnings.push('✅ Food ready!')
    }
  }
  for (const ov of st.ovens) {
    if (ov.done) warnings.push('🍞 Oven ready!')
  }

  if (warnings.length === 0) return

  ctx.font = 'bold 13px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  let wy = 85
  for (const msg of warnings) {
    const isAlert = msg.includes('FIRE') || msg.includes('burning')
    ctx.fillStyle = isAlert
      ? 'rgba(231, 76, 60, 0.85)'
      : 'rgba(46, 204, 113, 0.8)'
    roundRect(ctx, w / 2 - 100, wy - 14, 200, 20, 4)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.fillText(msg, w / 2, wy)
    wy += 24
  }
}

// ─── Utility draw helpers ───────────────────────────────

function drawMiniBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, color: string,
): void {
  ctx.fillStyle = '#333'
  ctx.fillRect(x, y, w, h)
  ctx.fillStyle = color
  ctx.fillRect(x, y, w * pct, h)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
