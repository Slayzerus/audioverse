/**
 * hints.ts — Context-sensitive hint system for MagicDecks TCG.
 * Evaluates game state each tick and returns relevant tips.
 */
import type { GameState, PlayerState, GameHint, HintTrigger } from './types'
import { ELEMENT_ADVANTAGE } from './types'
import { GAME_HINTS } from './constants'
import { MAX_HAND, EVOLVE_COST } from './gameLogic'

export interface HintState {
  /** Currently displayed hint (null = none) */
  currentHint: GameHint | null
  /** Ticks since current hint started showing */
  displayTicks: number
  /** How long to show each hint (ticks) */
  displayDuration: number
  /** Hints that have been shown (for showOnce) */
  shownOnce: Set<string>
  /** Cooldown: don't show another hint for N ticks */
  cooldownTicks: number
  /** Enabled? */
  enabled: boolean
}

export function initHintState(): HintState {
  return {
    currentHint: null,
    displayTicks: 0,
    displayDuration: 240, // ~4 seconds at 60fps
    shownOnce: new Set(),
    cooldownTicks: 0,
    enabled: true,
  }
}

/** Check game state and update hint display. Call once per tick. */
export function tickHints(hints: HintState, st: GameState, playerIndex: number): void {
  if (!hints.enabled) return

  // Currently showing a hint — countdown
  if (hints.currentHint) {
    hints.displayTicks++
    if (hints.displayTicks >= hints.displayDuration) {
      hints.currentHint = null
      hints.displayTicks = 0
      hints.cooldownTicks = 180 // ~3s before next hint
    }
    return
  }

  // Cooldown between hints
  if (hints.cooldownTicks > 0) {
    hints.cooldownTicks--
    return
  }

  // Find the player
  const player = st.players.find(p => p.index === playerIndex)
  if (!player) return

  // Evaluate triggers
  const triggered = GAME_HINTS
    .filter(h => {
      if (h.showOnce && hints.shownOnce.has(h.id)) return false
      return evaluateTrigger(h.trigger, player, st)
    })
    .sort((a, b) => b.priority - a.priority)

  if (triggered.length > 0) {
    const hint = triggered[0]
    hints.currentHint = hint
    hints.displayTicks = 0
    if (hint.showOnce) hints.shownOnce.add(hint.id)
  }
}

/** Get the translation key for the current hint, or null */
export function getCurrentHintKey(hints: HintState): string | null {
  return hints.currentHint?.textKey ?? null
}

/** Dismiss the current hint immediately */
export function dismissHint(hints: HintState): void {
  hints.currentHint = null
  hints.displayTicks = 0
  hints.cooldownTicks = 120
}

// ── Trigger evaluation ────────────────────────────────────

function evaluateTrigger(trigger: HintTrigger, player: PlayerState, st: GameState): boolean {
  switch (trigger) {
    case 'firstTurn':
      return st.tick < 60

    case 'lowMana':
      return player.mana <= 1 && player.hand.some(c => c.def.cost > player.mana)

    case 'fullHand':
      return player.hand.length >= MAX_HAND

    case 'emptyField':
      return player.field.every(f => f === null) && st.tick > 120

    case 'canEvolve': {
      if (player.mana < EVOLVE_COST) return false
      return player.field.some(fc => fc !== null && fc.def.evolvesTo !== undefined)
    }

    case 'elementAdvantage': {
      if (player.hand.length === 0) return false
      // Check if any hand card has advantage over an enemy on field
      const enemy = st.players.find(p => p.index !== player.index)
      if (!enemy) return false
      for (const ci of player.hand) {
        if (ci.def.cost > player.mana) continue
        const adv = ELEMENT_ADVANTAGE[ci.def.element]
        if (!adv) continue
        for (const fc of enemy.field) {
          if (fc && adv.includes(fc.def.element)) return true
        }
      }
      return false
    }

    case 'lowLife':
      return player.life <= player.maxLife * 0.25 && player.life > 0

    case 'comboChance': {
      if (!player.lastElement || player.comboCount < 2) return false
      return player.hand.some(c => c.def.element === player.lastElement && c.def.cost <= player.mana)
    }

    case 'spellAvailable':
      return player.hand.some(c => c.def.type === 'spell' && c.def.cost <= player.mana) &&
             st.tick > 300 && st.tick % 600 < 60 // don't spam

    case 'bossWeak':
      return st.coopBoss !== null && st.coopBoss.life <= st.coopBoss.maxLife * 0.2

    default:
      return false
  }
}
