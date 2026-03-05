/**
 * factionBonuses.ts — Per-faction strengths, weaknesses, and unique mechanics.
 *
 * Castle is balanced / easiest. Others have distinct playstyles.
 */
import type { FactionId, ResourceBundle } from './types'

export interface FactionBonus {
  id: FactionId
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  strengths: string[]
  weaknesses: string[]
  // Multipliers (1.0 = default)
  incomeMult: Partial<Record<keyof ResourceBundle, number>>
  creatureGrowthMult: number
  moraleBonus: number
  luckBonus: number
  spellDamageMult: number
  meleeDamageMult: number
  rangedDamageMult: number
  heroDailyMovementBonus: number
  startingResourceMult: number
  hpMult: number
  defenseMult: number
  /** Unique mechanic identifier */
  specialMechanic: string
}

// ═══════════════════════════════════════════════════════════════
//  FACTION BONUS DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export const FACTION_BONUSES: Record<FactionId, FactionBonus> = {
  // ─── Castle (Humans) — EASY ───────────────────────────────
  castle: {
    id: 'castle',
    name: 'Castle',
    description: 'Balanced human kingdom. Good at everything, master of none. Best for beginners.',
    difficulty: 'easy',
    strengths: ['+1 Morale', '+10% creature growth', 'Diplomacy (neutrals may join)', 'Balanced stat heroes'],
    weaknesses: ['No outstanding specialty', 'Jack-of-all-trades'],
    incomeMult: { gold: 1.0 },
    creatureGrowthMult: 1.10,
    moraleBonus: 1,
    luckBonus: 0,
    spellDamageMult: 1.0,
    meleeDamageMult: 1.0,
    rangedDamageMult: 1.0,
    heroDailyMovementBonus: 0,
    startingResourceMult: 1.0,
    hpMult: 1.0,
    defenseMult: 1.0,
    specialMechanic: 'diplomacy', // 20% chance neutral armies join instead of fight
  },

  // ─── Rampart (Nature / Elves) — MEDIUM ────────────────────
  rampart: {
    id: 'rampart',
    name: 'Rampart',
    description: 'Nature faction with deadly archers and forest mastery. Strong mid-game.',
    difficulty: 'medium',
    strengths: ['+20% ranged damage', 'Free forest movement', '+1 Luck', '+50% wood income'],
    weaknesses: ['-10% melee damage', 'Slow heavy units (T5-6)', 'Expensive top tier'],
    incomeMult: { gold: 1.0, wood: 1.5 },
    creatureGrowthMult: 1.0,
    moraleBonus: 0,
    luckBonus: 1,
    spellDamageMult: 1.0,
    meleeDamageMult: 0.90,
    rangedDamageMult: 1.20,
    heroDailyMovementBonus: 1,
    startingResourceMult: 1.0,
    hpMult: 1.0,
    defenseMult: 1.0,
    specialMechanic: 'forest_mastery', // no move penalty in forests
  },

  // ─── Tower (Arcane / Wizards) — HARD ──────────────────────
  tower: {
    id: 'tower',
    name: 'Tower',
    description: 'Arcane faction with devastating magic. Fragile armies, supreme spellcasting.',
    difficulty: 'hard',
    strengths: ['+25% spell damage', '+20% max mana', 'Spellcaster units', 'Best T7 (Titan)'],
    weaknesses: ['-15% creature growth', 'Fragile T1-3', 'Very expensive high tier'],
    incomeMult: { gold: 1.0 },
    creatureGrowthMult: 0.85,
    moraleBonus: 0,
    luckBonus: 0,
    spellDamageMult: 1.25,
    meleeDamageMult: 1.0,
    rangedDamageMult: 1.0,
    heroDailyMovementBonus: 0,
    startingResourceMult: 1.0,
    hpMult: 0.95,
    defenseMult: 1.0,
    specialMechanic: 'arcane_mastery', // spells cost 1 less mana (min 1)
  },

  // ─── Inferno (Demons) — MEDIUM ────────────────────────────
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    description: 'Aggressive demon faction. Fast, destructive, but fragile. Rewards attacking.',
    difficulty: 'medium',
    strengths: ['+15% melee damage', 'Many fire abilities', 'Fast high-tier units', 'Demonic gate summons'],
    weaknesses: ['-15% defense', 'Low creature growth', 'High resource costs'],
    incomeMult: { gold: 1.0, sulfur: 1.5 },
    creatureGrowthMult: 0.90,
    moraleBonus: 0,
    luckBonus: 0,
    spellDamageMult: 1.10,
    meleeDamageMult: 1.15,
    rangedDamageMult: 1.0,
    heroDailyMovementBonus: 0,
    startingResourceMult: 0.9,
    hpMult: 1.0,
    defenseMult: 0.85,
    specialMechanic: 'demonic_gate', // chance to summon extra T1-2 demons each week
  },

  // ─── Necropolis (Undead) — HARD ───────────────────────────
  necropolis: {
    id: 'necropolis',
    name: 'Necropolis',
    description: 'Undead horde that grows by raising the dead. Immune to morale, but cannot heal.',
    difficulty: 'hard',
    strengths: ['Necromancy (raise dead)', 'Immune to negative morale', '+20% HP', 'Strong mid-late game'],
    weaknesses: ['No positive morale', 'Cannot use healing spells', 'Slow early game'],
    incomeMult: { gold: 1.0, mercury: 1.3 },
    creatureGrowthMult: 0.95,
    moraleBonus: 0, // immune to morale entirely
    luckBonus: 0,
    spellDamageMult: 1.0,
    meleeDamageMult: 1.0,
    rangedDamageMult: 1.0,
    heroDailyMovementBonus: 0,
    startingResourceMult: 0.9,
    hpMult: 1.20,
    defenseMult: 1.0,
    specialMechanic: 'necromancy', // 10-30% of killed enemies raised as skeletons
  },

  // ─── Dungeon (Dark Underground) — MEDIUM ──────────────────
  dungeon: {
    id: 'dungeon',
    name: 'Dungeon',
    description: 'Rich underground kingdom. Slow start but overwhelms late game with economy and power.',
    difficulty: 'medium',
    strengths: ['+20% gold income', 'Powerful T5-7', '+1 vision range', 'Double map object loot'],
    weaknesses: ['Weak T1-3', 'Very expensive buildings', 'Slow economy startup'],
    incomeMult: { gold: 1.20, gems: 1.3 },
    creatureGrowthMult: 1.0,
    moraleBonus: 0,
    luckBonus: 0,
    spellDamageMult: 1.0,
    meleeDamageMult: 1.0,
    rangedDamageMult: 1.0,
    heroDailyMovementBonus: 0,
    startingResourceMult: 1.1,
    hpMult: 1.0,
    defenseMult: 1.0,
    specialMechanic: 'underground_loot', // double gold/resource from map objects
  },

  // ─── Wilds (Beasts & Monsters) — HARD ─────────────────────
  wilds: {
    id: 'wilds',
    name: 'Wilds',
    description: 'Savage beast hordes. Fast, hard-hitting, but weak on defense and magic.',
    difficulty: 'hard',
    strengths: ['+2 all creature speed', '+15% attack', 'Cheap units', 'Beast rage at low HP'],
    weaknesses: ['-20% defense', '-30% spell damage', 'No magic specialization'],
    incomeMult: { gold: 0.9, ore: 1.3 },
    creatureGrowthMult: 1.05,
    moraleBonus: 0,
    luckBonus: 0,
    spellDamageMult: 0.70,
    meleeDamageMult: 1.15,
    rangedDamageMult: 1.0,
    heroDailyMovementBonus: 2,
    startingResourceMult: 0.8,
    hpMult: 1.0,
    defenseMult: 0.80,
    specialMechanic: 'beast_rage', // +20% attack when creature below 50% HP
  },
}

// ═══════════════════════════════════════════════════════════════
//  BONUS APPLICATION HELPERS
// ═══════════════════════════════════════════════════════════════

/** Get faction-adjusted daily income */
export function applyFactionIncome(
  income: ResourceBundle,
  faction: FactionId,
): ResourceBundle {
  const bonus = FACTION_BONUSES[faction]
  if (!bonus) return income
  const result = { ...income }
  for (const [key, mult] of Object.entries(bonus.incomeMult)) {
    const k = key as keyof ResourceBundle
    result[k] = Math.floor(result[k] * (mult ?? 1))
  }
  return result
}

/** Get faction-adjusted creature growth */
export function applyFactionGrowth(baseGrowth: number, faction: FactionId): number {
  return Math.max(1, Math.round(baseGrowth * FACTION_BONUSES[faction].creatureGrowthMult))
}

/** Get faction damage multiplier for combat */
export function getFactionDamageMult(faction: FactionId, isRanged: boolean): number {
  const bonus = FACTION_BONUSES[faction]
  return isRanged ? bonus.rangedDamageMult : bonus.meleeDamageMult
}

/** Get faction spell damage multiplier */
export function getFactionSpellMult(faction: FactionId): number {
  return FACTION_BONUSES[faction].spellDamageMult
}

/** Get total morale bonus from faction */
export function getFactionMorale(faction: FactionId): number {
  return FACTION_BONUSES[faction].moraleBonus
}

/** Get total luck bonus from faction */
export function getFactionLuck(faction: FactionId): number {
  return FACTION_BONUSES[faction].luckBonus
}

/** Get faction HP multiplier */
export function getFactionHPMult(faction: FactionId): number {
  return FACTION_BONUSES[faction].hpMult
}

/** Get faction defense multiplier */
export function getFactionDefenseMult(faction: FactionId): number {
  return FACTION_BONUSES[faction].defenseMult
}
