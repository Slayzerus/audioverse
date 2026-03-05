/**
 * renderer.ts — Full canvas renderer for MagicDecks TCG.
 * Draws battlefield, hands, HUD, creatures with sprites,
 * element-themed particles, attack animations, evolution glow.
 */
import type { GameState, PlayerState, FieldCreature, Element } from './types'
import { ELEMENT_COLORS, ELEMENT_BG, ELEMENT_ICONS, RARITY_COLORS } from './types'
import { LANES, ATTACK_TICK, laneToX } from './gameLogic'

export const W = 900, H = 560

// ── Layout constants ──────────────────────────────────────
const CARD_W = 58, CARD_H = 82
const HAND_Y_BOTTOM = H - CARD_H - 8
const HAND_Y_TOP = 8
const FIELD_Y_BOTTOM = H / 2 + 25  // player 1 creatures
const FIELD_Y_TOP = H / 2 - 75      // enemy creatures (player 2 or boss)
const CREATURE_W = 56, CREATURE_H = 50
const LANE_WIDTH = 120
const SPRITE_SIZE = 36

// ── Main draw ─────────────────────────────────────────────
export function draw(ctx: CanvasRenderingContext2D, st: GameState) {
  ctx.save()

  // background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0e0e1a')
  grad.addColorStop(0.5, '#151525')
  grad.addColorStop(1, '#0e0e1a')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // center divider
  drawDivider(ctx, st)

  // lane lines
  drawLanes(ctx)

  const p1 = st.players[0]
  const p2 = st.players[1] ?? null
  const boss = st.coopBoss

  // draw fields
  if (p1) drawPlayerField(ctx, st, p1, 'bottom')
  if (boss) drawBossField(ctx, st, boss)
  else if (p2) drawPlayerField(ctx, st, p2, 'top')

  // draw hands
  if (p1) drawHand(ctx, st, p1, 'bottom')
  if (p2 && !boss) drawHand(ctx, st, p2, 'top')

  // draw HUDs
  if (p1) drawHUD(ctx, st, p1, 'bottom')
  if (boss) drawBossHUD(ctx, boss)
  else if (p2) drawHUD(ctx, st, p2, 'top')

  // lane selection overlay
  if (p1) drawLaneSelector(ctx, p1, 'bottom')
  if (p2) drawLaneSelector(ctx, p2, 'top')

  // particles
  drawParticles(ctx, st)

  // battle events (damage numbers, etc.)
  drawBattleEvents(ctx, st)

  ctx.restore()
}

// ── Divider ───────────────────────────────────────────────
function drawDivider(ctx: CanvasRenderingContext2D, _st: GameState) {
  const y = H / 2
  ctx.save()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.setLineDash([8, 4])
  ctx.beginPath(); ctx.moveTo(80, y); ctx.lineTo(W - 10, y); ctx.stroke()
  ctx.setLineDash([])
  // Element icons in divider
  const elements: Element[] = ['fire', 'water', 'earth', 'air', 'light', 'dark']
  for (let i = 0; i < 6; i++) {
    const x = 130 + i * 120
    ctx.globalAlpha = 0.15
    ctx.font = '20px sans-serif'
    ctx.fillText(ELEMENT_ICONS[elements[i]], x + 40, y + 6)
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Lanes ─────────────────────────────────────────────────
function drawLanes(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.strokeStyle = '#222'
  ctx.lineWidth = 1
  for (let i = 1; i < LANES; i++) {
    const x = 130 + i * LANE_WIDTH - 30
    ctx.beginPath()
    ctx.moveTo(x, FIELD_Y_TOP - 5)
    ctx.lineTo(x, FIELD_Y_BOTTOM + CREATURE_H + 5)
    ctx.stroke()
  }
  ctx.restore()
}

// ── Player HUD ────────────────────────────────────────────
function drawHUD(ctx: CanvasRenderingContext2D, _st: GameState, p: PlayerState, side: 'top' | 'bottom') {
  const isBottom = side === 'bottom'
  const baseY = isBottom ? H - CARD_H - 90 : 4

  ctx.save()
  // background panel
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillRect(2, baseY, 90, 80)
  ctx.strokeStyle = p.color
  ctx.lineWidth = 2
  ctx.strokeRect(2, baseY, 90, 80)

  // Name
  ctx.fillStyle = p.color
  ctx.font = 'bold 11px monospace'
  ctx.fillText(p.name.slice(0, 10), 6, baseY + 14)

  // Life bar
  const lifeRatio = Math.max(0, p.life / p.maxLife)
  ctx.fillStyle = '#222'; ctx.fillRect(6, baseY + 20, 80, 10)
  ctx.fillStyle = lifeRatio > 0.5 ? '#2ecc71' : lifeRatio > 0.25 ? '#f39c12' : '#e74c3c'
  ctx.fillRect(6, baseY + 20, 80 * lifeRatio, 10)
  ctx.fillStyle = '#fff'; ctx.font = '9px monospace'
  ctx.fillText(`♥ ${Math.max(0, Math.ceil(p.life))}/${p.maxLife}`, 8, baseY + 29)

  // Mana bar
  const manaRatio = p.mana / p.maxMana
  ctx.fillStyle = '#222'; ctx.fillRect(6, baseY + 34, 80, 8)
  ctx.fillStyle = '#3498db'
  ctx.fillRect(6, baseY + 34, 80 * manaRatio, 8)
  ctx.fillStyle = '#adf'; ctx.font = '8px monospace'
  ctx.fillText(`⚡${p.mana}/${p.maxMana}`, 8, baseY + 41)

  // Deck / discard
  ctx.fillStyle = '#888'; ctx.font = '9px monospace'
  ctx.fillText(`📦${p.deck.length} 🗑${p.discard.length}`, 6, baseY + 55)

  // Currencies
  ctx.fillStyle = '#f1c40f'; ctx.fillText(`🪙${p.coins}`, 6, baseY + 67)
  ctx.fillStyle = '#e74c3c'; ctx.fillText(`💎${p.gems}`, 36, baseY + 67)
  ctx.fillStyle = '#2ecc71'; ctx.fillText(`⭐${p.stars}`, 64, baseY + 67)

  // Combo indicator
  if (p.comboCount >= 2) {
    ctx.fillStyle = '#f39c12'; ctx.font = 'bold 10px monospace'
    ctx.fillText(`x${p.comboCount}!`, 6, baseY + 78)
  }
  ctx.restore()
}

function drawBossHUD(ctx: CanvasRenderingContext2D, boss: NonNullable<GameState['coopBoss']>) {
  ctx.save()
  ctx.fillStyle = 'rgba(60,10,10,0.7)'
  ctx.fillRect(2, 4, 90, 50)
  ctx.strokeStyle = '#e74c3c'
  ctx.lineWidth = 2
  ctx.strokeRect(2, 4, 90, 50)

  ctx.fillStyle = '#f55'; ctx.font = 'bold 12px monospace'
  ctx.fillText('👹 BOSS', 6, 18)

  const ratio = Math.max(0, boss.life / boss.maxLife)
  ctx.fillStyle = '#333'; ctx.fillRect(6, 24, 80, 10)
  ctx.fillStyle = '#e74c3c'; ctx.fillRect(6, 24, 80 * ratio, 10)
  ctx.fillStyle = '#fff'; ctx.font = '9px monospace'
  ctx.fillText(`♥ ${Math.max(0, Math.ceil(boss.life))}/${boss.maxLife}`, 8, 33)

  ctx.fillStyle = '#888'; ctx.font = '9px monospace'
  ctx.fillText(`⚡${boss.mana}`, 6, 48)
  ctx.restore()
}

// ── Hand ──────────────────────────────────────────────────
function drawHand(ctx: CanvasRenderingContext2D, st: GameState, p: PlayerState, side: 'top' | 'bottom') {
  const handY = side === 'bottom' ? HAND_Y_BOTTOM : HAND_Y_TOP
  const startX = 100

  for (let i = 0; i < p.hand.length; i++) {
    const ci = p.hand[i]
    const card = ci.def
    const cx = startX + i * (CARD_W + 5)
    const selected = i === p.selectedCard
    const affordable = p.mana >= card.cost

    drawCard(ctx, st, card, cx, handY, selected, affordable)
  }
}

/** Draw outlined text — fill + stroke for readability on any background */
function outlinedText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  fill: string, strokeColor = '#000', strokeW = 2.5,
) {
  ctx.save()
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.strokeStyle = strokeColor
  ctx.lineWidth = strokeW
  ctx.strokeText(text, x, y)
  ctx.fillStyle = fill
  ctx.fillText(text, x, y)
  ctx.restore()
}

function drawCard(ctx: CanvasRenderingContext2D, st: GameState, card: import('./types').CardDef, x: number, y: number, selected: boolean, affordable: boolean) {
  ctx.save()
  const elColor = ELEMENT_COLORS[card.element]
  const rarityColor = RARITY_COLORS[card.rarity]
  const BORDER = 2

  // ── Outer glow when selected ──
  if (selected) {
    ctx.shadowColor = rarityColor
    ctx.shadowBlur = 14
  }

  // ── Rarity-colored border (full card rect) ──
  ctx.fillStyle = selected ? '#fff' : (affordable ? rarityColor : '#444')
  ctx.fillRect(x, y, CARD_W, CARD_H)
  ctx.shadowBlur = 0

  // ── Inner area (image fills this) ──
  const ix = x + BORDER, iy = y + BORDER
  const iw = CARD_W - BORDER * 2, ih = CARD_H - BORDER * 2

  // Dim the background when not affordable
  ctx.fillStyle = affordable ? '#111' : '#0a0a0a'
  ctx.fillRect(ix, iy, iw, ih)

  // ── Sprite image — fills the entire inner area ──
  const img = st.imageCache.get(card.sprite)
  if (img && img.complete && img.naturalWidth > 0) {
    if (!affordable) ctx.globalAlpha = 0.45
    ctx.drawImage(img, ix, iy, iw, ih)
    ctx.globalAlpha = 1
  } else {
    // Placeholder: element icon centered
    ctx.fillStyle = elColor; ctx.font = '24px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ELEMENT_ICONS[card.element], ix + iw / 2, iy + ih / 2 + 8)
    ctx.textAlign = 'left'
  }

  // ── Semi-transparent gradient overlay at bottom for stat readability ──
  const grad = ctx.createLinearGradient(ix, iy + ih - 20, ix, iy + ih)
  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(1, 'rgba(0,0,0,0.75)')
  ctx.fillStyle = grad
  ctx.fillRect(ix, iy + ih - 20, iw, 20)

  // ── Cost badge — top-right corner, gold, outlined ──
  ctx.font = 'bold 12px "Segoe UI", Arial, sans-serif'
  ctx.textAlign = 'right'
  outlinedText(ctx, `${card.cost}`, x + CARD_W - 4, y + 14, '#ffd700', '#000', 3)

  // ── Skill icons — below cost in top-right ──
  let skillY = y + 24
  if (card.passive) {
    ctx.font = '10px sans-serif'
    outlinedText(ctx, '🛡', x + CARD_W - 4, skillY, '#f1c40f', '#000', 2)
    skillY += 12
  }
  if (card.active) {
    ctx.font = '10px sans-serif'
    outlinedText(ctx, '⚡', x + CARD_W - 4, skillY, '#e74c3c', '#000', 2)
    skillY += 12
  }
  if (card.evolvesTo) {
    ctx.font = '10px sans-serif'
    outlinedText(ctx, '⬆', x + CARD_W - 4, skillY, '#2ecc71', '#000', 2)
  }
  ctx.textAlign = 'left'

  // ── 3 main stats at bottom — spread evenly, each in unique color, outlined ──
  if (card.type !== 'spell') {
    const statFont = 'bold 11px "Segoe UI", Arial, sans-serif'
    ctx.font = statFont
    const statY = y + CARD_H - 4
    const third = iw / 3
    // ATK (red)
    ctx.textAlign = 'center'
    outlinedText(ctx, `${card.atk}⚔`, ix + third * 0.5, statY, '#ff6b6b', '#000', 3)
    // DEF (blue)
    outlinedText(ctx, `${card.def}🛡`, ix + third * 1.5, statY, '#54a0ff', '#000', 3)
    // SPD (green)
    outlinedText(ctx, `${card.spd}⚡`, ix + third * 2.5, statY, '#5ff59b', '#000', 3)
    ctx.textAlign = 'left'
  } else if (card.spellEffect) {
    // Spell effect label at bottom center
    const eff = card.spellEffect
    const label = eff.kind === 'damage' ? `${eff.value}💥` :
                  eff.kind === 'heal' ? `+${eff.value}♥` :
                  eff.kind === 'buff' ? `+${eff.value}⬆` :
                  eff.kind === 'aoe' ? `${eff.value}🌀` :
                  eff.kind === 'draw' ? `+${eff.value}🃏` :
                  eff.kind === 'mana' ? `+${eff.value}⚡` :
                  eff.kind === 'evolve' ? '⬆EVO' :
                  eff.kind
    ctx.font = 'bold 11px "Segoe UI", Arial, sans-serif'
    ctx.textAlign = 'center'
    outlinedText(ctx, label, ix + iw / 2, y + CARD_H - 4, '#f39c12', '#000', 3)
    ctx.textAlign = 'left'
  }

  ctx.restore()
}

// ── Field creatures ───────────────────────────────────────
function drawPlayerField(ctx: CanvasRenderingContext2D, st: GameState, p: PlayerState, side: 'top' | 'bottom') {
  const fieldY = side === 'bottom' ? FIELD_Y_BOTTOM : FIELD_Y_TOP
  for (let lane = 0; lane < LANES; lane++) {
    const fc = p.field[lane]
    if (!fc) continue
    drawCreature(ctx, st, fc, laneToX(lane), fieldY, p.color)
  }
}

function drawBossField(ctx: CanvasRenderingContext2D, st: GameState, boss: NonNullable<GameState['coopBoss']>) {
  for (let lane = 0; lane < LANES; lane++) {
    const fc = boss.field[lane]
    if (!fc) continue
    drawCreature(ctx, st, fc, laneToX(lane), FIELD_Y_TOP, '#e74c3c')
  }
}

function drawCreature(ctx: CanvasRenderingContext2D, st: GameState, fc: FieldCreature, x: number, y: number, ownerColor: string) {
  ctx.save()
  const el = fc.def.element
  const elColor = ELEMENT_COLORS[el]

  // entrance animation: scale up + glow
  let scale = 1
  if (fc.enterAnim > 0) {
    scale = 1 - fc.enterAnim / 30 * 0.3
    ctx.shadowColor = elColor
    ctx.shadowBlur = 20 - fc.enterAnim / 2
  }

  // hurt flash
  if (fc.hurtAnim > 0 && fc.hurtAnim % 4 < 2) {
    ctx.globalAlpha = 0.6
  }

  // frozen overlay
  if (fc.frozenTicks > 0) {
    ctx.globalAlpha = (ctx.globalAlpha ?? 1) * 0.7
  }

  const sw = CREATURE_W * scale
  const sh = CREATURE_H * scale
  const sx = x + (CREATURE_W - sw) / 2
  const sy = y + (CREATURE_H - sh) / 2

  // creature box background
  ctx.fillStyle = ELEMENT_BG[el]
  ctx.fillRect(sx, sy, sw, sh)
  ctx.strokeStyle = ownerColor
  ctx.lineWidth = 2
  ctx.strokeRect(sx, sy, sw, sh)
  ctx.shadowBlur = 0

  // sprite
  const img = st.imageCache.get(fc.def.sprite)
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, sx + (sw - SPRITE_SIZE) / 2, sy + 2, SPRITE_SIZE, SPRITE_SIZE)
  } else {
    ctx.fillStyle = elColor; ctx.font = '22px sans-serif'
    ctx.fillText(ELEMENT_ICONS[el], sx + 14, sy + 28)
  }

  // HP bar
  const hpRatio = Math.max(0, fc.hp / fc.maxHp)
  ctx.fillStyle = '#111'; ctx.fillRect(sx, sy + sh - 10, sw, 8)
  ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c'
  ctx.fillRect(sx, sy + sh - 10, sw * hpRatio, 8)
  ctx.fillStyle = '#fff'; ctx.font = '7px monospace'
  ctx.fillText(`${Math.max(0, Math.ceil(fc.hp))}`, sx + 2, sy + sh - 3)

  // ATK label
  ctx.fillStyle = '#e74c3c'; ctx.font = 'bold 8px monospace'
  ctx.fillText(`${fc.atk + fc.buffAtk}⚔`, sx + sw - 20, sy + sh - 3)

  // attack cooldown indicator (small bar under HP)
  const interval = ATTACK_TICK * fc.spd
  const cdRatio = Math.min(1, fc.ticksSinceAttack / interval)
  ctx.fillStyle = '#222'; ctx.fillRect(sx, sy + sh - 2, sw, 2)
  ctx.fillStyle = cdRatio >= 0.95 ? '#e74c3c' : '#555'
  ctx.fillRect(sx, sy + sh - 2, sw * cdRatio, 2)

  // status effects
  let statusX = sx
  if (fc.frozenTicks > 0) {
    ctx.fillStyle = '#00bcd4'; ctx.font = '8px sans-serif'
    ctx.fillText('❄', statusX, sy - 2); statusX += 10
  }
  if (fc.poisonTicks > 0) {
    ctx.fillStyle = '#8bc34a'; ctx.font = '8px sans-serif'
    ctx.fillText('☠', statusX, sy - 2); statusX += 10
  }
  if (fc.buffAtk > 0) {
    ctx.fillStyle = '#ff9800'; ctx.font = '8px sans-serif'
    ctx.fillText('⬆', statusX, sy - 2); statusX += 10
  }
  if (fc.shieldHp > 0) {
    ctx.fillStyle = '#9e9e9e'; ctx.font = '8px sans-serif'
    ctx.fillText('🛡', statusX, sy - 2)
  }

  // evolution ready indicator
  if (fc.def.evolvesTo) {
    ctx.fillStyle = '#2ecc71'; ctx.font = '8px monospace'
    ctx.fillText('↑E', sx + sw - 14, sy - 2)
  }

  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Lane selector ─────────────────────────────────────────
function drawLaneSelector(ctx: CanvasRenderingContext2D, p: PlayerState, side: 'top' | 'bottom') {
  const fieldY = side === 'bottom' ? FIELD_Y_BOTTOM : FIELD_Y_TOP
  const x = laneToX(p.selectedLane)
  
  ctx.save()
  ctx.strokeStyle = p.color
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.strokeRect(x - 3, fieldY - 3, CREATURE_W + 6, CREATURE_H + 6)
  ctx.setLineDash([])

  // arrow
  ctx.fillStyle = p.color
  ctx.font = '12px sans-serif'
  if (side === 'bottom') {
    ctx.fillText('▼', x + CREATURE_W / 2 - 5, fieldY - 6)
  } else {
    ctx.fillText('▲', x + CREATURE_W / 2 - 5, fieldY + CREATURE_H + 14)
  }
  ctx.restore()
}

// ── Particles ─────────────────────────────────────────────
function drawParticles(ctx: CanvasRenderingContext2D, st: GameState) {
  ctx.save()
  for (const p of st.particles) {
    const alpha = Math.max(0, p.life / p.maxLife)
    ctx.globalAlpha = alpha

    // element-specific particle shape
    ctx.fillStyle = p.color
    switch (p.element) {
      case 'fire':
        // flame-like: triangles going up
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - p.size)
        ctx.lineTo(p.x - p.size / 2, p.y + p.size / 2)
        ctx.lineTo(p.x + p.size / 2, p.y + p.size / 2)
        ctx.fill()
        break
      case 'water':
        // droplet: circle
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
        break
      case 'earth':
        // rock: square
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size)
        break
      case 'air':
        // swirl: ring
        ctx.strokeStyle = p.color; ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 1.5)
        ctx.stroke()
        break
      case 'light':
        // star: cross
        ctx.fillRect(p.x - p.size / 6, p.y - p.size / 2, p.size / 3, p.size)
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 6, p.size, p.size / 3)
        break
      case 'dark':
        // void: fading circle with inner dark
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#000'
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size / 4, 0, Math.PI * 2)
        ctx.fill()
        break
    }
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Battle events (floating damage numbers) ───────────────
function drawBattleEvents(ctx: CanvasRenderingContext2D, st: GameState) {
  ctx.save()
  for (const ev of st.events) {
    const age = st.tick - ev.time
    if (age > 90) continue // fade out after 1.5s

    const alpha = Math.max(0, 1 - age / 90)
    ctx.globalAlpha = alpha

    const x = laneToX(ev.lane) + 10
    const y = H / 2 - age * 0.5  // float upward

    ctx.font = 'bold 14px monospace'
    switch (ev.kind) {
      case 'attack':
        ctx.fillStyle = '#e74c3c'
        ctx.fillText(`-${ev.value}`, x, y)
        break
      case 'directHit':
        ctx.fillStyle = '#ff5555'
        ctx.font = 'bold 16px monospace'
        ctx.fillText(`💥-${ev.value}`, x - 5, y)
        break
      case 'heal':
        ctx.fillStyle = '#2ecc71'
        ctx.fillText(`+${ev.value}`, x, y)
        break
      case 'spell':
        ctx.fillStyle = ELEMENT_COLORS[ev.element]
        ctx.fillText(`✦${ev.value}`, x, y)
        break
      case 'evolve':
        ctx.fillStyle = '#2ecc71'
        ctx.font = 'bold 16px monospace'
        ctx.fillText('⬆EVOLVE!', x - 15, y)
        break
      case 'summon':
        ctx.fillStyle = ELEMENT_COLORS[ev.element]
        ctx.font = '12px monospace'
        ctx.fillText('▸SUMMON', x - 10, y)
        break
      case 'death':
        ctx.fillStyle = '#888'
        ctx.font = '12px monospace'
        ctx.fillText('💀', x + 10, y)
        break
      case 'ability':
        ctx.fillStyle = ELEMENT_COLORS[ev.element]
        ctx.font = 'bold 12px monospace'
        ctx.fillText(`⚡${ev.value}`, x, y)
        break
    }
  }
  ctx.globalAlpha = 1
  ctx.restore()
}

// ── Game over overlay ─────────────────────────────────────
export function drawGameOver(ctx: CanvasRenderingContext2D, st: GameState) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.7)'
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 36px monospace'
  ctx.fillText('GAME OVER', W / 2, H / 2 - 40)

  if (st.winner === -1) {
    ctx.fillStyle = '#2ecc71'
    ctx.font = 'bold 24px monospace'
    ctx.fillText('🏆 TEAM VICTORY!', W / 2, H / 2 + 10)
  } else if (st.winner != null) {
    const winner = st.players.find(p => p.index === st.winner)
    if (winner) {
      ctx.fillStyle = winner.color
      ctx.font = 'bold 24px monospace'
      ctx.fillText(`🏆 ${winner.name} WINS!`, W / 2, H / 2 + 10)
    }
  } else {
    ctx.fillStyle = '#888'
    ctx.font = 'bold 24px monospace'
    ctx.fillText(st.coopBoss ? '💀 BOSS WINS...' : 'DRAW!', W / 2, H / 2 + 10)
  }

  // stats
  ctx.font = '14px monospace'
  st.players.forEach((p, i) => {
    ctx.fillStyle = p.color
    ctx.fillText(`${p.name}: 🪙${p.coins} 💎${p.gems} ⭐${p.stars}`, W / 2, H / 2 + 50 + i * 22)
  })

  ctx.fillStyle = '#666'
  ctx.font = '12px monospace'
  ctx.fillText('Press SPACE or ENTER to restart', W / 2, H / 2 + 120)
  ctx.textAlign = 'left'
  ctx.restore()
}

// ── Controls hint ─────────────────────────────────────────
export function drawControls(ctx: CanvasRenderingContext2D, _st: GameState) {
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.fillRect(W - 150, H - 48, 145, 44)
  ctx.fillStyle = '#666'; ctx.font = '8px monospace'
  ctx.fillText('A/D or ←/→ select card', W - 146, H - 36)
  ctx.fillText('W/S or ↑/↓ select lane', W - 146, H - 26)
  ctx.fillText('SPACE/ENTER play card', W - 146, H - 16)
  ctx.fillText('E = evolve creature', W - 146, H - 6)
  ctx.restore()
}
