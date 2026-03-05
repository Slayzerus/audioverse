/**
 * shop.ts — Shop logic for MagicDecks TCG.
 *
 * Boosters (bronze/silver/gold/diamond), single-card offers,
 * pre-built deck offers, and 10-pack discount (counts as 11).
 */
import type {
  BoosterDef, BoosterTier, ShopCardOffer, ShopDeckOffer, ShopState,
  PlayerProfile, Rarity, Element,
} from './types'
import { RARITY_ORDER } from './types'
import { ALL_CARDS, CARDS_BY_ID, getCardsByElement } from './cardDatabase'

// ── Booster definitions ───────────────────────────────────

export const BOOSTER_DEFS: Record<BoosterTier, BoosterDef> = {
  bronze: {
    tier: 'bronze',
    cardsPerPack: 3,
    // [common, uncommon, rare, epic, legendary]
    weights: [60, 25, 10, 4, 1],
    priceCoins: 100,
    priceGems: 0,
  },
  silver: {
    tier: 'silver',
    cardsPerPack: 3,
    weights: [40, 30, 20, 8, 2],
    priceCoins: 250,
    priceGems: 0,
  },
  gold: {
    tier: 'gold',
    cardsPerPack: 3,
    weights: [20, 25, 30, 18, 7],
    priceCoins: 0,
    priceGems: 50,
  },
  diamond: {
    tier: 'diamond',
    cardsPerPack: 3,
    weights: [5, 15, 30, 30, 20],
    priceCoins: 0,
    priceGems: 150,
  },
}

export const BOOSTER_ICONS: Record<BoosterTier, string> = {
  bronze: '🟤',
  silver: '⚪',
  gold: '🟡',
  diamond: '💎',
}

export const BOOSTER_COLORS: Record<BoosterTier, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  diamond: '#b9f2ff',
}

// ── 10-pack saves 1 pack price (buy 10 get 11) ───────────

export function get10PackPrice(tier: BoosterTier): { coins: number; gems: number } {
  const def = BOOSTER_DEFS[tier]
  return {
    coins: def.priceCoins * 10,
    gems: def.priceGems * 10,
  }
}

export function get10PackCount(): number {
  return 11 // 10-pack gives 11 boosters
}

// ── Booster opening logic ─────────────────────────────────

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary']

function pickRarity(weights: [number, number, number, number, number]): Rarity {
  const total = weights.reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < RARITIES.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return RARITIES[i]
  }
  return 'common'
}

function pickCardOfRarity(rarity: Rarity): string {
  const pool = ALL_CARDS.filter(c => c.rarity === rarity)
  if (pool.length === 0) {
    // fallback: pick from any common card
    const fallback = ALL_CARDS.filter(c => c.rarity === 'common')
    return fallback[Math.floor(Math.random() * fallback.length)].id
  }
  return pool[Math.floor(Math.random() * pool.length)].id
}

/** Open a single booster, returns array of card IDs */
export function openBooster(tier: BoosterTier): string[] {
  const def = BOOSTER_DEFS[tier]
  const cards: string[] = []
  for (let i = 0; i < def.cardsPerPack; i++) {
    const rarity = pickRarity(def.weights)
    cards.push(pickCardOfRarity(rarity))
  }
  return cards
}

/** Open N boosters (for 10-pack = 11 boosters), returns flat array of card IDs */
export function openBoosters(tier: BoosterTier, count: number): string[] {
  const all: string[] = []
  for (let i = 0; i < count; i++) {
    all.push(...openBooster(tier))
  }
  return all
}

// ── Can afford checks ─────────────────────────────────────

export function canAffordBooster(profile: PlayerProfile, tier: BoosterTier): boolean {
  const def = BOOSTER_DEFS[tier]
  return profile.coins >= def.priceCoins && profile.gems >= def.priceGems
}

export function canAfford10Pack(profile: PlayerProfile, tier: BoosterTier): boolean {
  const price = get10PackPrice(tier)
  return profile.coins >= price.coins && profile.gems >= price.gems
}

// ── Purchase functions ────────────────────────────────────

/** Buy 1 booster. Returns opened card IDs or null if can't afford. */
export function buyBooster(profile: PlayerProfile, tier: BoosterTier): string[] | null {
  if (!canAffordBooster(profile, tier)) return null
  const def = BOOSTER_DEFS[tier]
  profile.coins -= def.priceCoins
  profile.gems -= def.priceGems
  const cards = openBooster(tier)
  for (const id of cards) profile.collection.push(id)
  profile.updatedAt = Date.now()
  return cards
}

/** Buy 10-pack (11 boosters). Returns opened card IDs or null. */
export function buy10Pack(profile: PlayerProfile, tier: BoosterTier): string[] | null {
  if (!canAfford10Pack(profile, tier)) return null
  const price = get10PackPrice(tier)
  profile.coins -= price.coins
  profile.gems -= price.gems
  const count = get10PackCount()
  const cards = openBoosters(tier, count)
  for (const id of cards) profile.collection.push(id)
  profile.updatedAt = Date.now()
  return cards
}

// ── Rotating single-card offers ───────────────────────────

const OFFER_DURATION = 10 * 60 * 1000 // 10 minutes
const OFFER_COUNT = 6

/** Price multiplier by rarity */
const RARITY_COIN_PRICE: Record<Rarity, number> = {
  common: 50,
  uncommon: 120,
  rare: 300,
  epic: 700,
  legendary: 1500,
}

const RARITY_GEM_PRICE: Record<Rarity, number> = {
  common: 0,
  uncommon: 0,
  rare: 15,
  epic: 40,
  legendary: 100,
}

function generateCardOffers(): ShopCardOffer[] {
  const now = Date.now()
  const pool = [...ALL_CARDS]
  const offers: ShopCardOffer[] = []
  const used = new Set<string>()

  // Ensure variety of rarities: at least 1 rare+
  const rarityCounts: Partial<Record<Rarity, number>> = {}
  while (offers.length < OFFER_COUNT && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    const card = pool[idx]
    if (used.has(card.id)) { pool.splice(idx, 1); continue }
    used.add(card.id)

    // Skip if we already have too many of one rarity
    const rc = rarityCounts[card.rarity] || 0
    if (rc >= 2 && offers.length < OFFER_COUNT - 2) { pool.splice(idx, 1); continue }
    rarityCounts[card.rarity] = rc + 1

    offers.push({
      cardId: card.id,
      priceCoins: RARITY_COIN_PRICE[card.rarity],
      priceGems: RARITY_GEM_PRICE[card.rarity],
      expiresAt: now + OFFER_DURATION + Math.random() * 5 * 60 * 1000,
    })
    pool.splice(idx, 1)
  }

  // Sort by rarity (rarest first)
  offers.sort((a, b) => {
    const ca = CARDS_BY_ID.get(a.cardId)
    const cb = CARDS_BY_ID.get(b.cardId)
    return (RARITY_ORDER[cb?.rarity ?? 'common'] || 0) - (RARITY_ORDER[ca?.rarity ?? 'common'] || 0)
  })

  return offers
}

// ── Pre-built deck offers ─────────────────────────────────

const DECK_OFFER_COUNT = 3

function generateDeckOffers(): ShopDeckOffer[] {
  const elements: Element[] = ['fire', 'water', 'earth', 'air', 'light', 'dark']
  const shuffled = [...elements].sort(() => Math.random() - 0.5).slice(0, DECK_OFFER_COUNT)
  return shuffled.map(el => {
    const cards = getCardsByElement(el)
    // Pick 20 cards weighted toward lower-cost
    const sorted = [...cards].sort((a, b) => a.cost - b.cost)
    const deckCards: string[] = []
    for (const c of sorted) {
      deckCards.push(c.id)
      if (c.cost <= 3) deckCards.push(c.id) // duplicates of cheap cards
      if (deckCards.length >= 20) break
    }

    // Price based on average rarity
    const avgRarity = deckCards.reduce((s, id) => {
      const cd = CARDS_BY_ID.get(id)
      return s + (cd ? RARITY_ORDER[cd.rarity] : 0)
    }, 0) / deckCards.length

    const basePrice = 500
    const rarityMultiplier = 1 + avgRarity * 0.5
    const priceCoins = Math.round(basePrice * rarityMultiplier)

    return {
      name: `${el.charAt(0).toUpperCase() + el.slice(1)} Starter`,
      cardIds: deckCards.slice(0, 20),
      element: el,
      priceCoins,
      priceGems: 0,
    }
  })
}

// ── Shop state management ─────────────────────────────────

const SHOP_STORAGE_KEY = 'magicDecks_shop'

export function createShopState(): ShopState {
  return {
    cardOffers: generateCardOffers(),
    deckOffers: generateDeckOffers(),
    lastRefresh: Date.now(),
    refreshInterval: OFFER_DURATION,
  }
}

export function loadShopState(): ShopState {
  try {
    const raw = localStorage.getItem(SHOP_STORAGE_KEY)
    if (raw) {
      const state = JSON.parse(raw) as ShopState
      // Check if offers need refresh
      if (Date.now() - state.lastRefresh > state.refreshInterval) {
        return refreshShop(state)
      }
      // Remove expired card offers
      state.cardOffers = state.cardOffers.filter(o => o.expiresAt > Date.now())
      if (state.cardOffers.length < 3) {
        return refreshShop(state)
      }
      return state
    }
  } catch { /* Expected: localStorage or JSON parse may fail */ }
  return createShopState()
}

export function saveShopState(state: ShopState): void {
  try {
    localStorage.setItem(SHOP_STORAGE_KEY, JSON.stringify(state))
  } catch { /* Expected: localStorage may be full or unavailable */ }
}

export function refreshShop(state: ShopState): ShopState {
  return {
    ...state,
    cardOffers: generateCardOffers(),
    deckOffers: generateDeckOffers(),
    lastRefresh: Date.now(),
  }
}

export function getTimeUntilRefresh(state: ShopState): number {
  return Math.max(0, state.lastRefresh + state.refreshInterval - Date.now())
}

/** Buy a single card from card offers. Returns true if successful. */
export function buyCardOffer(profile: PlayerProfile, shop: ShopState, offerIndex: number): boolean {
  const offer = shop.cardOffers[offerIndex]
  if (!offer) return false
  if (profile.coins < offer.priceCoins || profile.gems < offer.priceGems) return false
  profile.coins -= offer.priceCoins
  profile.gems -= offer.priceGems
  profile.collection.push(offer.cardId)
  profile.updatedAt = Date.now()
  shop.cardOffers.splice(offerIndex, 1)
  return true
}

/** Buy a pre-built deck. Returns true if successful. */
export function buyDeckOffer(profile: PlayerProfile, shop: ShopState, offerIndex: number): boolean {
  const offer = shop.deckOffers[offerIndex]
  if (!offer) return false
  if (profile.coins < offer.priceCoins || profile.gems < offer.priceGems) return false
  profile.coins -= offer.priceCoins
  profile.gems -= offer.priceGems
  for (const id of offer.cardIds) profile.collection.push(id)
  profile.updatedAt = Date.now()
  shop.deckOffers.splice(offerIndex, 1)
  return true
}
