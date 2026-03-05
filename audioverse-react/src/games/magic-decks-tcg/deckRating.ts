/**
 * deckRating.ts — Rate decks 1-5 stars in 3 criteria:
 * Synergy, Mana Curve, and Power.
 */
import type { CardDef, DeckRating, Element } from './types'
import { CARDS_BY_ID } from './cardDatabase'
import { IDEAL_MANA_CURVE, DECK_RECOMMENDED_SIZE } from './constants'

// ── Main rating function ──────────────────────────────────

export function rateDeck(cardIds: string[]): DeckRating {
  const cards = cardIds.map(id => CARDS_BY_ID.get(id)).filter((c): c is CardDef => !!c)
  if (cards.length === 0) {
    return { synergy: 1, curve: 1, power: 1, overall: 1, tips: ['magicDecks.rating.emptyDeck'] }
  }

  const synergy = rateSynergy(cards)
  const curve = rateCurve(cards)
  const power = ratePower(cards)
  const overall = Math.round((synergy + curve + power) / 3 * 10) / 10

  const tips: string[] = []
  if (synergy <= 2) tips.push('magicDecks.rating.tipSynergy')
  if (curve <= 2) tips.push('magicDecks.rating.tipCurve')
  if (power <= 2) tips.push('magicDecks.rating.tipPower')
  if (cards.length < 20) tips.push('magicDecks.rating.tipTooSmall')
  if (cards.length > 30) tips.push('magicDecks.rating.tipTooLarge')
  if (tips.length === 0 && overall >= 4) tips.push('magicDecks.rating.tipGreat')

  return { synergy, curve, power, overall, tips }
}

// ── Synergy (★1-5) ───────────────────────────────────────
// Measures: element focus, evolution chain completeness, ability combos
function rateSynergy(cards: CardDef[]): number {
  let score = 0

  // 1) Element concentration: fewer elements = better synergy (max 2 pts)
  const elementCounts = new Map<Element, number>()
  for (const c of cards) elementCounts.set(c.element, (elementCounts.get(c.element) || 0) + 1)
  const numElements = elementCounts.size
  if (numElements <= 2) score += 2
  else if (numElements <= 3) score += 1.5
  else if (numElements <= 4) score += 1
  else score += 0.5

  // 2) Evolution chain completeness (max 1.5 pts)
  const evoStarts = cards.filter(c => c.evolvesTo && !c.evolvesFrom)
  let evoPairs = 0
  for (const starter of evoStarts) {
    let chain = 0
    let cur = starter
    while (cur.evolvesTo) {
      const next = cards.find(c => c.id === cur.evolvesTo)
      if (next) { chain++; cur = next } else break
    }
    if (chain >= 2) evoPairs += 1.5
    else if (chain >= 1) evoPairs += 0.75
  }
  score += Math.min(1.5, evoPairs)

  // 3) Ability combo synergy (max 1.5 pts)
  const hasInspire = cards.some(c => c.passive?.kind === 'inspire')
  const hasTaunt = cards.some(c => c.passive?.kind === 'taunt')
  const hasHeal = cards.some(c => c.active?.kind === 'heal' || c.spellEffect?.kind === 'heal')
  const hasBuff = cards.some(c => c.active?.kind === 'buff' || c.spellEffect?.kind === 'buff')
  const hasLifesteal = cards.some(c => c.passive?.kind === 'lifesteal')

  let abilityScore = 0
  if (hasInspire) abilityScore += 0.3
  if (hasTaunt) abilityScore += 0.3
  if (hasHeal) abilityScore += 0.2
  if (hasBuff) abilityScore += 0.2
  if (hasLifesteal) abilityScore += 0.2
  // bonus for taunt + inspire combo (protect the buffer)
  if (hasTaunt && hasInspire) abilityScore += 0.3
  score += Math.min(1.5, abilityScore)

  return Math.max(1, Math.min(5, Math.round(score * 10) / 10))
}

// ── Mana Curve (★1-5) ────────────────────────────────────
// Measures: cost distribution vs ideal, size appropriateness
function rateCurve(cards: CardDef[]): number {
  if (cards.length === 0) return 1

  let score = 0

  // 1) Size appropriateness (max 1 pt)
  const sizeDiff = Math.abs(cards.length - DECK_RECOMMENDED_SIZE)
  if (sizeDiff <= 2) score += 1
  else if (sizeDiff <= 5) score += 0.7
  else if (sizeDiff <= 8) score += 0.4
  else score += 0.1

  // 2) Mana curve distribution (max 3 pts)
  const total = cards.length
  const low = cards.filter(c => c.cost <= 2).length / total
  const mid = cards.filter(c => c.cost >= 3 && c.cost <= 5).length / total
  const high = cards.filter(c => c.cost >= 6).length / total

  const lowDiff = Math.abs(low - IDEAL_MANA_CURVE.low)
  const midDiff = Math.abs(mid - IDEAL_MANA_CURVE.mid)
  const highDiff = Math.abs(high - IDEAL_MANA_CURVE.high)
  const totalDiff = lowDiff + midDiff + highDiff

  if (totalDiff < 0.15) score += 3
  else if (totalDiff < 0.25) score += 2.5
  else if (totalDiff < 0.35) score += 2
  else if (totalDiff < 0.50) score += 1.5
  else score += 0.5

  // 3) Card type balance (max 1 pt) — should have creatures + some spells
  const creatures = cards.filter(c => c.type === 'creature' || c.type === 'hero').length
  const spells = cards.filter(c => c.type === 'spell').length
  const creatureRatio = creatures / total
  if (creatureRatio >= 0.6 && creatureRatio <= 0.85 && spells >= 2) score += 1
  else if (creatureRatio >= 0.5 && creatureRatio <= 0.9) score += 0.6
  else score += 0.2

  return Math.max(1, Math.min(5, Math.round(score * 10) / 10))
}

// ── Power (★1-5) ─────────────────────────────────────────
// Measures: average card quality, stage distribution, ability coverage
function ratePower(cards: CardDef[]): number {
  if (cards.length === 0) return 1

  let score = 0

  // 1) Average stat efficiency (max 2 pts)
  const avgEfficiency = cards.reduce((sum, c) => {
    if (c.type === 'spell') return sum + (c.spellEffect?.value ?? 0) / Math.max(1, c.cost)
    return sum + (c.atk + c.def) / Math.max(1, c.cost * 2)
  }, 0) / cards.length

  if (avgEfficiency >= 1.2) score += 2
  else if (avgEfficiency >= 1.0) score += 1.7
  else if (avgEfficiency >= 0.8) score += 1.3
  else if (avgEfficiency >= 0.6) score += 0.8
  else score += 0.4

  // 2) Stage distribution — having stage 2-3 cards is more powerful (max 1.5 pts)
  const stages = cards.filter(c => c.type !== 'spell')
  const stage2plus = stages.filter(c => c.stage >= 2).length
  const stage3 = stages.filter(c => c.stage >= 3).length
  if (stages.length > 0) {
    const ratio2 = stage2plus / stages.length
    if (ratio2 >= 0.3 && stage3 >= 2) score += 1.5
    else if (ratio2 >= 0.2 && stage3 >= 1) score += 1.0
    else if (ratio2 >= 0.1) score += 0.5
    else score += 0.2
  }

  // 3) Active ability coverage (max 1.5 pts)
  const withActive = cards.filter(c => c.active).length
  const withPassive = cards.filter(c => c.passive).length
  let abilityScore = 0
  if (withActive >= 3) abilityScore += 0.8
  else if (withActive >= 1) abilityScore += 0.4
  if (withPassive >= 5) abilityScore += 0.7
  else if (withPassive >= 2) abilityScore += 0.4
  score += Math.min(1.5, abilityScore)

  return Math.max(1, Math.min(5, Math.round(score * 10) / 10))
}

// ── Helpers ───────────────────────────────────────────────

/** Get a simple text summary of the deck composition */
export function getDeckSummary(cardIds: string[]): {
  total: number; creatures: number; spells: number; heroes: number
  elements: Map<Element, number>; avgCost: number
} {
  const cards = cardIds.map(id => CARDS_BY_ID.get(id)).filter((c): c is CardDef => !!c)
  const creatures = cards.filter(c => c.type === 'creature').length
  const spells = cards.filter(c => c.type === 'spell').length
  const heroes = cards.filter(c => c.type === 'hero').length
  const elements = new Map<Element, number>()
  for (const c of cards) elements.set(c.element, (elements.get(c.element) || 0) + 1)
  const avgCost = cards.length > 0 ? cards.reduce((s, c) => s + c.cost, 0) / cards.length : 0
  return { total: cards.length, creatures, spells, heroes, elements, avgCost: Math.round(avgCost * 10) / 10 }
}
