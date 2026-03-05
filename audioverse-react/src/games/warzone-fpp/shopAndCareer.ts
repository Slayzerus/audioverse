/**
 * Shop, lootbox, and career/progression system for Warzone FPP.
 *
 * Currency:
 *   coins  — earned every kill/capture, used to buy shop items
 *   gems   — rarer, earned from objectives, used for premium items
 *   stars  — earned from match wins, indicate rank
 *
 * Lootboxes:  Common / Rare / Epic / Legendary tiers with random drops.
 * Career:     XP levels, named ranks, unlock rewards, prestige system.
 */

import {
  ALL_ATTACHMENTS,
  type AttachmentDef,
  type Rarity,
  RARITY_ORDER,
} from './weaponCustomization'

// ═════════════════════════════════════════════════════════
// CAREER & RANKS
// ═════════════════════════════════════════════════════════

export interface RankDef {
  level: number
  name: string
  icon: string
  xpRequired: number
  /** Attachment id unlocked at this rank (optional) */
  unlock?: string
}

export const RANKS: RankDef[] = [
  { level:  1, name: 'Recruit',          icon: '🔰', xpRequired: 0 },
  { level:  2, name: 'Private',          icon: '⬜', xpRequired: 200 },
  { level:  3, name: 'Private First Class', icon: '🟩', xpRequired: 500,  unlock: 'rds' },
  { level:  4, name: 'Corporal',         icon: '🟨', xpRequired: 1000,  unlock: 'ext_mag_s' },
  { level:  5, name: 'Sergeant',         icon: '🟧', xpRequired: 1800,  unlock: 'vertical_grip' },
  { level:  6, name: 'Staff Sergeant',   icon: '🔶', xpRequired: 3000,  unlock: 'flash_hider' },
  { level:  7, name: 'Master Sergeant',  icon: '🔷', xpRequired: 4500,  unlock: 'tac_laser' },
  { level:  8, name: 'Second Lieutenant', icon: '⭐', xpRequired: 6500, unlock: 'compensator' },
  { level:  9, name: 'First Lieutenant', icon: '⭐', xpRequired: 9000,  unlock: 'acog' },
  { level: 10, name: 'Captain',          icon: '🌟', xpRequired: 12000, unlock: 'long_barrel' },
  { level: 11, name: 'Major',            icon: '🌟', xpRequired: 16000, unlock: 'angled_grip' },
  { level: 12, name: 'Lieutenant Colonel', icon: '🏅', xpRequired: 21000, unlock: 'padded_stock' },
  { level: 13, name: 'Colonel',          icon: '🏅', xpRequired: 27000, unlock: 'ext_mag_m' },
  { level: 14, name: 'Brigadier General', icon: '🎖️', xpRequired: 34000, unlock: 'lightweight_sup' },
  { level: 15, name: 'Major General',    icon: '🎖️', xpRequired: 42000, unlock: 'sniper_scope' },
  { level: 16, name: 'Lieutenant General', icon: '💫', xpRequired: 52000, unlock: 'heavy_barrel' },
  { level: 17, name: 'General',          icon: '💫', xpRequired: 64000, unlock: 'stubby_grip' },
  { level: 18, name: 'Field Marshal',    icon: '👑', xpRequired: 78000, unlock: 'heavy_sup' },
  { level: 19, name: 'Commander',        icon: '👑', xpRequired: 95000, unlock: 'drum_mag' },
  { level: 20, name: 'Supreme Commander', icon: '🏆', xpRequired: 115000, unlock: 'monolithic_sup' },
]

export function getRank(xp: number): RankDef {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (xp >= r.xpRequired) rank = r
    else break
  }
  return rank
}

export function getNextRank(xp: number): RankDef | null {
  for (const r of RANKS) {
    if (xp < r.xpRequired) return r
  }
  return null
}

export function xpToNextLevel(xp: number): { current: number; needed: number; progress: number } {
  const rank = getRank(xp)
  const next = getNextRank(xp)
  if (!next) return { current: 0, needed: 1, progress: 1 }
  const current = xp - rank.xpRequired
  const needed = next.xpRequired - rank.xpRequired
  return { current, needed, progress: current / needed }
}

// ─── Prestige ────────────────────────────────────────────
export const MAX_PRESTIGE = 10
export const PRESTIGE_ICONS = ['', '🥉', '🥈', '🥇', '💎', '🔱', '⚜️', '🌀', '☀️', '🌙', '👁️']

// ═════════════════════════════════════════════════════════
// LOOTBOXES
// ═════════════════════════════════════════════════════════

export interface LootboxTier {
  id: string
  name: string
  icon: string
  costCoins: number
  costGems: number
  /** How many items you get */
  itemCount: number
  /** Minimum rarity guaranteed */
  minRarity: Rarity
  /** Drop weight distribution [common, uncommon, rare, epic, legendary] */
  weights: [number, number, number, number, number]
  color: string
}

export const LOOTBOX_TIERS: LootboxTier[] = [
  { id: 'common',    name: 'Standard Supply Drop',   icon: '📦', costCoins: 50,   costGems: 0,  itemCount: 2, minRarity: 'common',   weights: [60, 25, 10, 4, 1],   color: '#888' },
  { id: 'rare',      name: 'Tactical Crate',         icon: '🎁', costCoins: 150,  costGems: 0,  itemCount: 3, minRarity: 'common',   weights: [30, 35, 25, 8, 2],   color: '#48f' },
  { id: 'epic',      name: 'Elite Arsenal',          icon: '🎊', costCoins: 500,  costGems: 3,  itemCount: 4, minRarity: 'uncommon', weights: [0, 25, 40, 28, 7],   color: '#c4f' },
  { id: 'legendary', name: 'Supreme Weapon Cache',   icon: '🏆', costCoins: 1500, costGems: 10, itemCount: 5, minRarity: 'rare',     weights: [0, 0, 30, 45, 25],   color: '#fa0' },
]

// ─── Lootbox opening logic ───────────────────────────────
export interface LootboxResult {
  items: AttachmentDef[]
  /** Was there a duplicate (converted to coins)? */
  duplicateCoinsRefund: number
}

function pickRarity(weights: number[], minRarity: Rarity): Rarity {
  const minIdx = RARITY_ORDER.indexOf(minRarity)
  // Zero out weights below minimum
  const adjusted = weights.map((w, i) => i < minIdx ? 0 : w)
  const total = adjusted.reduce((a, b) => a + b, 0)
  let roll = Math.random() * total
  for (let i = 0; i < adjusted.length; i++) {
    roll -= adjusted[i]
    if (roll <= 0) return RARITY_ORDER[i]
  }
  return RARITY_ORDER[RARITY_ORDER.length - 1]
}

export function openLootbox(
  tier: LootboxTier,
  ownedAttachments: Set<string>,
): LootboxResult {
  const items: AttachmentDef[] = []
  let duplicateCoinsRefund = 0

  for (let i = 0; i < tier.itemCount; i++) {
    const rarity = pickRarity([...tier.weights], tier.minRarity)
    const pool = ALL_ATTACHMENTS.filter(a => a.rarity === rarity)
    if (pool.length === 0) continue

    const pick = pool[Math.floor(Math.random() * pool.length)]
    if (ownedAttachments.has(pick.id)) {
      // Duplicate → refund coins based on rarity
      const refundMap: Record<Rarity, number> = {
        common: 15, uncommon: 40, rare: 100, epic: 250, legendary: 600,
      }
      duplicateCoinsRefund += refundMap[pick.rarity]
    } else {
      items.push(pick)
    }
  }

  return { items, duplicateCoinsRefund }
}

// ═════════════════════════════════════════════════════════
// SHOP ITEMS (direct purchase)
// ═════════════════════════════════════════════════════════

export interface ShopItem {
  id: string
  name: string
  icon: string
  type: 'attachment' | 'lootbox' | 'skin' | 'boost'
  /** For attachment type: the attachment id */
  attachmentId?: string
  /** For lootbox type: the tier id */
  lootboxTierId?: string
  costCoins: number
  costGems: number
  description: string
}

export function generateShopItems(): ShopItem[] {
  const items: ShopItem[] = []

  // Lootboxes
  for (const tier of LOOTBOX_TIERS) {
    items.push({
      id: `lootbox_${tier.id}`,
      name: tier.name,
      icon: tier.icon,
      type: 'lootbox',
      lootboxTierId: tier.id,
      costCoins: tier.costCoins,
      costGems: tier.costGems,
      description: `${tier.itemCount} items, min ${tier.minRarity} rarity`,
    })
  }

  // Direct-purchase attachments (subset with markup)
  const featured = ALL_ATTACHMENTS.filter(a =>
    a.rarity === 'rare' || a.rarity === 'epic' || a.rarity === 'legendary')
  for (const att of featured) {
    items.push({
      id: `att_${att.id}`,
      name: att.name,
      icon: att.icon,
      type: 'attachment',
      attachmentId: att.id,
      costCoins: Math.round(att.cost * 1.5), // markup vs lootbox
      costGems: att.rarity === 'legendary' ? 5 : att.rarity === 'epic' ? 2 : 0,
      description: att.description,
    })
  }

  // XP Boost
  items.push({
    id: 'xp_boost_2x',
    name: '2× XP Boost (3 matches)',
    icon: '⚡',
    type: 'boost',
    costCoins: 300,
    costGems: 2,
    description: 'Double XP for the next 3 matches',
  })

  items.push({
    id: 'coin_boost_2x',
    name: '2× Coin Boost (3 matches)',
    icon: '💰',
    type: 'boost',
    costCoins: 0,
    costGems: 5,
    description: 'Double coin earnings for the next 3 matches',
  })

  return items
}

// ═════════════════════════════════════════════════════════
// PLAYER CAREER STATE (persisted per-session)
// ═════════════════════════════════════════════════════════

export interface CareerState {
  xp: number
  coins: number
  gems: number
  stars: number
  prestige: number
  totalKills: number
  totalDeaths: number
  totalWins: number
  totalMatches: number
  /** Set of owned attachment IDs */
  ownedAttachments: Set<string>
  /** Active boosts: type → remaining matches */
  boosts: Map<string, number>
}

export function createDefaultCareer(): CareerState {
  return {
    xp: 0, coins: 500, gems: 5, stars: 0,
    prestige: 0,
    totalKills: 0, totalDeaths: 0,
    totalWins: 0, totalMatches: 0,
    ownedAttachments: new Set(['rds', 'flash_hider', 'ext_mag_s', 'vertical_grip', 'tac_laser']),
    boosts: new Map(),
  }
}

// ─── Award match results to career ───────────────────────
export function awardMatchResults(
  career: CareerState,
  kills: number, deaths: number, captures: number,
  coinsEarned: number, gemsEarned: number, starsEarned: number,
  won: boolean,
): { xpGained: number; coinsGained: number; leveledUp: boolean; newRank: RankDef | null } {
  const oldRank = getRank(career.xp)

  // Calculate base XP
  let xp = kills * 50 + captures * 100 + (won ? 200 : 50) + deaths * 5
  let coins = coinsEarned

  // Apply boosts
  const xpBoost = career.boosts.get('xp_boost_2x')
  if (xpBoost && xpBoost > 0) {
    xp *= 2
    career.boosts.set('xp_boost_2x', xpBoost - 1)
  }
  const coinBoost = career.boosts.get('coin_boost_2x')
  if (coinBoost && coinBoost > 0) {
    coins *= 2
    career.boosts.set('coin_boost_2x', coinBoost - 1)
  }

  // Apply prestige bonus (5% per prestige level)
  xp = Math.round(xp * (1 + career.prestige * 0.05))

  career.xp += xp
  career.coins += coins
  career.gems += gemsEarned
  career.stars += starsEarned
  career.totalKills += kills
  career.totalDeaths += deaths
  career.totalMatches++
  if (won) career.totalWins++

  const newRank = getRank(career.xp)
  const leveledUp = newRank.level > oldRank.level

  // Unlock rank rewards
  if (leveledUp && newRank.unlock) {
    career.ownedAttachments.add(newRank.unlock)
  }

  return { xpGained: xp, coinsGained: coins, leveledUp, newRank: leveledUp ? newRank : null }
}

// ─── Prestige ────────────────────────────────────────────
export function canPrestige(career: CareerState): boolean {
  return getRank(career.xp).level >= 20 && career.prestige < MAX_PRESTIGE
}

export function performPrestige(career: CareerState): void {
  if (!canPrestige(career)) return
  career.prestige++
  career.xp = 0
  // Keep owned attachments, coins, gems, stars
  career.gems += 20 // prestige bonus
  career.coins += 2000
}

// ─── Buy from shop ───────────────────────────────────────
export function buyShopItem(
  career: CareerState,
  item: ShopItem,
): { success: boolean; message: string; lootboxResult?: LootboxResult } {
  if (career.coins < item.costCoins) return { success: false, message: 'Not enough coins!' }
  if (career.gems < item.costGems) return { success: false, message: 'Not enough gems!' }

  career.coins -= item.costCoins
  career.gems -= item.costGems

  if (item.type === 'attachment' && item.attachmentId) {
    if (career.ownedAttachments.has(item.attachmentId)) {
      // Refund partial
      career.coins += Math.round(item.costCoins * 0.5)
      return { success: true, message: 'Already owned! 50% coins refunded.' }
    }
    career.ownedAttachments.add(item.attachmentId)
    return { success: true, message: `Unlocked ${item.name}!` }
  }

  if (item.type === 'lootbox' && item.lootboxTierId) {
    const tier = LOOTBOX_TIERS.find(t => t.id === item.lootboxTierId)
    if (!tier) return { success: false, message: 'Invalid lootbox tier.' }
    const result = openLootbox(tier, career.ownedAttachments)
    for (const att of result.items) career.ownedAttachments.add(att.id)
    career.coins += result.duplicateCoinsRefund
    return {
      success: true,
      message: `Opened ${tier.name}! Got ${result.items.length} new items.`,
      lootboxResult: result,
    }
  }

  if (item.type === 'boost') {
    const boostKey = item.id
    const current = career.boosts.get(boostKey) ?? 0
    career.boosts.set(boostKey, current + 3)
    return { success: true, message: `Activated ${item.name}!` }
  }

  return { success: true, message: 'Purchased!' }
}
