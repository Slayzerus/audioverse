/**
 * Types, constants, and card templates for Eight Minute Empire (Danger Zone).
 */

// ══════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════

export type Terrain = 'plains' | 'forest' | 'mountain' | 'water' | 'desert'
export const ALL_TERRAINS: Terrain[] = ['plains', 'forest', 'mountain', 'water', 'desert']

export type CardAction = 'deploy' | 'move' | 'build' | 'destroy'

export type SpecialAbility =
  | 'elixir'        // +1 VP at end
  | 'mountain_vp'   // +1 VP per mountain territory
  | 'forest_vp'     // +1 VP per forest territory
  | 'desert_vp'     // +1 VP per desert territory
  | 'extra_deploy'  // deploy actions deploy +1 extra army
  | 'extra_move'    // move actions move +1 extra
  | 'fortify'       // -1 attacker loss in defense
  | 'income'        // +1 coin at start of each round
  | 'scout'         // can move through water
  | 'siege'         // destroy removes +1 armies
  | 'cavalry'       // move +2 extra distance
  | 'diplomat'      // no combat triggered on your territories
  | 'merchant'      // +1 coin per city at round start
  | 'engineer'      // cities give +2 VP instead of +1
  | 'warlord'       // destroy actions destroy +1 extra

export const ALL_ABILITIES: SpecialAbility[] = [
  'elixir', 'mountain_vp', 'forest_vp', 'desert_vp',
  'extra_deploy', 'extra_move', 'fortify', 'income',
  'scout', 'siege', 'cavalry', 'diplomat', 'merchant', 'engineer', 'warlord',
]

export const ALL_ACTIONS: CardAction[] = ['deploy', 'move', 'build', 'destroy']

export const ABILITY_LABELS: Record<SpecialAbility, string> = {
  elixir: '+1 VP', mountain_vp: '+VP/mountain', forest_vp: '+VP/forest',
  desert_vp: '+VP/desert', extra_deploy: 'Deploy+1', extra_move: 'Move+1',
  fortify: 'Fortify', income: 'Income+1', scout: 'Swim', siege: 'Siege+1',
  cavalry: 'Move+2', diplomat: 'No combat', merchant: 'Merchant',
  engineer: 'Engineer', warlord: 'Destroy+1',
}

export type TurnMode = 'turn-based' | 'real-time'
export type CombatMode = 'classic' | 'immediate'

export interface MapTemplate {
  name: string
  cols: number
  rows: number
  terrains: Terrain[][]
  continents: number[][]
  startPositions: { col: number; row: number }[]
}

export interface CardDef {
  id: number
  name: string
  action: CardAction
  value: number
  coins: number
  special: SpecialAbility | null
  emoji: string
}

export interface Territory {
  col: number
  row: number
  terrain: Terrain
  continent: number
  armies: number[]
  cities: number[]
}

export interface PlayerState {
  index: number
  name: string
  color: string
  coins: number
  cardsBought: number
  abilities: SpecialAbility[]
  alive: boolean
  boughtThisRound: boolean
  pendingAction: CardDef | null
  actionStep: number
  moveSource: { col: number; row: number } | null
  cursorCol: number
  cursorRow: number
  score: number
}

export interface GameState {
  territories: Territory[][]
  cols: number
  rows: number
  players: PlayerState[]
  deck: CardDef[]
  market: (CardDef | null)[]
  turnMode: TurnMode
  combatMode: CombatMode
  currentPlayer: number
  round: number
  maxRounds: number
  endTime: number
  gameOver: boolean
  winner: string | null
  log: string[]
  continentCount: number
}

// ══════════════════════════════════════════════════════════════
//  CARD DECK
// ══════════════════════════════════════════════════════════════

export const CARD_TEMPLATES: Omit<CardDef, 'id'>[] = [
  // ── Deploy (14 cards) ─────────────────────────────────
  { name: 'Levy',           action: 'deploy',  value: 3, coins: 0, special: null,           emoji: '⚔️' },
  { name: 'Muster',         action: 'deploy',  value: 4, coins: 0, special: null,           emoji: '⚔️' },
  { name: 'Conscript',      action: 'deploy',  value: 2, coins: 1, special: null,           emoji: '⚔️' },
  { name: 'Call to Arms',   action: 'deploy',  value: 3, coins: 0, special: 'extra_deploy', emoji: '📯' },
  { name: 'Militia',        action: 'deploy',  value: 2, coins: 0, special: 'elixir',       emoji: '🛡️' },
  { name: 'Recruitment',    action: 'deploy',  value: 5, coins: 0, special: null,           emoji: '⚔️' },
  { name: 'War Draft',      action: 'deploy',  value: 3, coins: 0, special: 'fortify',      emoji: '🏰' },
  { name: 'Garrison',       action: 'deploy',  value: 2, coins: 2, special: null,           emoji: '⚔️' },
  { name: 'Mercenaries',    action: 'deploy',  value: 4, coins: 0, special: 'warlord',      emoji: '💂' },
  { name: 'Volunteers',     action: 'deploy',  value: 3, coins: 1, special: null,           emoji: '🙋' },
  { name: 'Elite Guard',    action: 'deploy',  value: 2, coins: 0, special: 'fortify',      emoji: '🛡️' },
  { name: 'Reserves',       action: 'deploy',  value: 6, coins: 0, special: null,           emoji: '📦' },
  { name: 'Herald',         action: 'deploy',  value: 1, coins: 3, special: null,           emoji: '📜' },
  { name: 'War Council',    action: 'deploy',  value: 3, coins: 0, special: 'engineer',     emoji: '👑' },

  // ── Move (14 cards) ──────────────────────────────────
  { name: 'March',          action: 'move',    value: 2, coins: 0, special: null,           emoji: '🚶' },
  { name: 'Charge',         action: 'move',    value: 3, coins: 0, special: null,           emoji: '🏇' },
  { name: 'Expedition',     action: 'move',    value: 4, coins: 0, special: 'scout',        emoji: '🧭' },
  { name: 'Scout',          action: 'move',    value: 2, coins: 1, special: null,           emoji: '🔭' },
  { name: 'Navigation',     action: 'move',    value: 3, coins: 0, special: 'extra_move',   emoji: '⛵' },
  { name: 'Advance',        action: 'move',    value: 2, coins: 0, special: 'elixir',       emoji: '🚶' },
  { name: 'Forced March',   action: 'move',    value: 5, coins: 0, special: null,           emoji: '🏃' },
  { name: 'Patrol',         action: 'move',    value: 2, coins: 0, special: 'income',       emoji: '👁️' },
  { name: 'Cavalry Charge', action: 'move',    value: 3, coins: 0, special: 'cavalry',      emoji: '🐎' },
  { name: 'Flanking',       action: 'move',    value: 4, coins: 0, special: null,           emoji: '↗️' },
  { name: 'Sprint',         action: 'move',    value: 6, coins: 0, special: null,           emoji: '💨' },
  { name: 'Retreat',        action: 'move',    value: 2, coins: 2, special: null,           emoji: '🔙' },
  { name: 'Sail',           action: 'move',    value: 3, coins: 0, special: 'scout',        emoji: '🚢' },
  { name: 'Diplomacy',      action: 'move',    value: 2, coins: 0, special: 'diplomat',     emoji: '🤝' },

  // ── Build (14 cards) ─────────────────────────────────
  { name: 'Settlement',     action: 'build',   value: 1, coins: 0, special: null,           emoji: '🏘️' },
  { name: 'Outpost',        action: 'build',   value: 1, coins: 1, special: null,           emoji: '🏗️' },
  { name: 'Trading Post',   action: 'build',   value: 1, coins: 2, special: null,           emoji: '🏪' },
  { name: 'Fortress',       action: 'build',   value: 1, coins: 0, special: 'fortify',      emoji: '🏰' },
  { name: 'Temple',         action: 'build',   value: 1, coins: 0, special: 'elixir',       emoji: '⛩️' },
  { name: 'Mine',           action: 'build',   value: 1, coins: 0, special: 'mountain_vp',  emoji: '⛏️' },
  { name: 'Lumber Camp',    action: 'build',   value: 1, coins: 0, special: 'forest_vp',    emoji: '🪵' },
  { name: 'Oasis',          action: 'build',   value: 1, coins: 0, special: 'desert_vp',    emoji: '🏜️' },
  { name: 'Castle',         action: 'build',   value: 1, coins: 0, special: 'engineer',     emoji: '🏯' },
  { name: 'Market',         action: 'build',   value: 1, coins: 3, special: 'merchant',     emoji: '🏬' },
  { name: 'Harbor',         action: 'build',   value: 1, coins: 1, special: 'scout',        emoji: '⚓' },
  { name: 'Academy',        action: 'build',   value: 1, coins: 0, special: 'extra_deploy', emoji: '🎓' },
  { name: 'Library',        action: 'build',   value: 1, coins: 0, special: 'income',       emoji: '📚' },
  { name: 'Shrine',         action: 'build',   value: 1, coins: 0, special: 'elixir',       emoji: '🕍' },

  // ── Destroy (10 cards) ────────────────────────────────
  { name: 'Sabotage',       action: 'destroy', value: 1, coins: 0, special: null,           emoji: '💥' },
  { name: 'Raid',           action: 'destroy', value: 1, coins: 1, special: null,           emoji: '🔥' },
  { name: 'Ambush',         action: 'destroy', value: 1, coins: 0, special: 'siege',        emoji: '🗡️' },
  { name: 'Pillage',        action: 'destroy', value: 1, coins: 2, special: null,           emoji: '💰' },
  { name: 'Assassinate',    action: 'destroy', value: 2, coins: 0, special: null,           emoji: '🥷' },
  { name: 'Bombard',        action: 'destroy', value: 2, coins: 0, special: 'siege',        emoji: '💣' },
  { name: 'Poison',         action: 'destroy', value: 1, coins: 0, special: 'warlord',      emoji: '☠️' },
  { name: 'Lightning',      action: 'destroy', value: 3, coins: 0, special: null,           emoji: '⚡' },
  { name: 'Earthquake',     action: 'destroy', value: 2, coins: 0, special: 'elixir',       emoji: '🌋' },
  { name: 'Espionage',      action: 'destroy', value: 1, coins: 1, special: 'diplomat',     emoji: '🕵️' },
]

// ══════════════════════════════════════════════════════════════
//  TERRAIN COLORS
// ══════════════════════════════════════════════════════════════

export const TERRAIN_COLORS: Record<Terrain, string> = {
  plains: '#4a8a3f', forest: '#2d6b2d', mountain: '#7a7a7a',
  water: '#2255aa', desert: '#c4a94d',
}

// ══════════════════════════════════════════════════════════════
//  DECK BUILDER
// ══════════════════════════════════════════════════════════════

export function createDeck(customTemplates?: Omit<CardDef, 'id'>[]): CardDef[] {
  const templates = customTemplates && customTemplates.length > 0 ? customTemplates : CARD_TEMPLATES
  const deck: CardDef[] = []
  let id = 0
  // 2 copies for larger deck, 3 for smaller custom decks
  const copies = templates.length >= 40 ? 2 : 3
  for (let copy = 0; copy < copies; copy++) {
    for (const tpl of templates) {
      deck.push({ ...tpl, id: id++ })
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
