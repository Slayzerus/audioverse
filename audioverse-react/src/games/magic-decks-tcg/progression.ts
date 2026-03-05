/**
 * progression.ts — XP, levels, card collection, unlock tracking,
 * and localStorage persistence for MagicDecks TCG.
 */
import type {
  PlayerProfile, SavedDeck, PlayerStats, CampaignProgress, BattleResult, Element,
} from './types'
import {
  XP_TABLE, MAX_LEVEL, LEVEL_UNLOCKS, STARTER_COLLECTION, XP_REWARDS,
  MAX_DECK_SLOTS,
} from './constants'

const STORAGE_KEY = 'magicDecks_profile'

// ── Default profile ───────────────────────────────────────

function createDefaultStats(): PlayerStats {
  return {
    totalBattles: 0, wins: 0, losses: 0, draws: 0,
    cardsPlayed: 0, creaturesKilled: 0, damageDealt: 0,
    totalXpEarned: 0, campaignBattlesWon: 0,
    onlineWins: 0, onlineLosses: 0,
    longestWinStreak: 0, currentWinStreak: 0,
  }
}

function createDefaultCampaign(): CampaignProgress {
  return {
    completedChapters: [],
    currentChapter: 'ch1_fire_trials',
    currentBattleIndex: 0,
    capturedCards: [],
  }
}

export function createNewProfile(name: string): PlayerProfile {
  return {
    id: crypto.randomUUID?.() ?? `p_${Date.now()}`,
    name,
    xp: 0,
    level: 1,
    coins: 999999,
    gems: 9999,
    collection: [...STARTER_COLLECTION],
    deckSlots: [createStarterDeck()],
    unlocks: ['basic_elements'],
    campaignProgress: createDefaultCampaign(),
    stats: createDefaultStats(),
    tutorialDone: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

function createStarterDeck(): SavedDeck {
  return {
    id: 'starter',
    name: 'Starter Deck',
    cardIds: [...STARTER_COLLECTION],
    elements: ['fire', 'water', 'earth', 'air', 'light'],
  }
}

// ── XP & Leveling ─────────────────────────────────────────

export function getLevelForXP(xp: number): number {
  for (let i = MAX_LEVEL; i >= 1; i--) {
    if (xp >= XP_TABLE[i]) return i
  }
  return 1
}

export function getXPForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return XP_TABLE[MAX_LEVEL]
  return XP_TABLE[level + 1]
}

export function getXPProgress(profile: PlayerProfile): { current: number; required: number; percent: number } {
  const currentLevelXP = XP_TABLE[profile.level] || 0
  const nextLevelXP = getXPForNextLevel(profile.level)
  const current = profile.xp - currentLevelXP
  const required = nextLevelXP - currentLevelXP
  return {
    current,
    required,
    percent: required > 0 ? Math.min(100, (current / required) * 100) : 100,
  }
}

/** Add XP and return new unlocks (if any) */
export function addXP(profile: PlayerProfile, amount: number): string[] {
  const oldLevel = profile.level
  profile.xp += amount
  profile.stats.totalXpEarned += amount
  profile.level = getLevelForXP(profile.xp)
  profile.updatedAt = Date.now()

  const newUnlocks: string[] = []
  for (let lvl = oldLevel + 1; lvl <= profile.level; lvl++) {
    const unlocks = LEVEL_UNLOCKS[lvl]
    if (unlocks) {
      for (const u of unlocks) {
        if (!profile.unlocks.includes(u.unlockKey)) {
          profile.unlocks.push(u.unlockKey)
          newUnlocks.push(u.descKey)
        }
      }
    }
  }

  // unlock deck slots based on level
  const maxSlots = getMaxDeckSlots(profile.level)
  while (profile.deckSlots.length < maxSlots && profile.deckSlots.length < MAX_DECK_SLOTS) {
    profile.deckSlots.push({
      id: `deck_${profile.deckSlots.length + 1}`,
      name: `Deck ${profile.deckSlots.length + 1}`,
      cardIds: [],
      elements: [],
    })
  }

  return newUnlocks
}

function getMaxDeckSlots(level: number): number {
  if (level >= 20) return 6
  if (level >= 15) return 5
  if (level >= 10) return 4
  if (level >= 5) return 3
  if (level >= 3) return 2
  return 1
}

// ── Battle result processing ──────────────────────────────

export function processBattleResult(profile: PlayerProfile, result: BattleResult): { xpGained: number; newUnlocks: string[] } {
  profile.stats.totalBattles++
  profile.stats.cardsPlayed += result.cardsPlayed
  profile.stats.creaturesKilled += result.creaturesKilled
  profile.stats.damageDealt += result.damageDealt

  let xp = 0
  if (result.won) {
    profile.stats.wins++
    profile.stats.currentWinStreak++
    if (profile.stats.currentWinStreak > profile.stats.longestWinStreak) {
      profile.stats.longestWinStreak = profile.stats.currentWinStreak
    }
    xp += result.isCampaign ? XP_REWARDS.campaignWin : XP_REWARDS.battleWin
    if (result.isCampaign) profile.stats.campaignBattlesWon++
  } else {
    profile.stats.losses++
    profile.stats.currentWinStreak = 0
    xp += XP_REWARDS.battleLoss
  }

  if (result.cardCaptured) {
    profile.collection.push(result.cardCaptured)
    profile.campaignProgress.capturedCards.push(result.cardCaptured)
    xp += XP_REWARDS.cardCapture
  }

  if (result.chapterCompleted) {
    xp += XP_REWARDS.chapterComplete
  }

  // Award persistent currencies based on battle outcome
  if (result.won) {
    profile.coins += result.isCampaign ? 150 : 100
    profile.gems += result.isCampaign ? 5 : 2
  } else {
    profile.coins += 30
  }

  const newUnlocks = addXP(profile, xp)
  saveProfile(profile)
  return { xpGained: xp, newUnlocks }
}

// ── Collection management ─────────────────────────────────

export function addCardToCollection(profile: PlayerProfile, cardId: string): void {
  profile.collection.push(cardId)
  profile.updatedAt = Date.now()
  saveProfile(profile)
}

export function getCollectionCounts(profile: PlayerProfile): Map<string, number> {
  const counts = new Map<string, number>()
  for (const id of profile.collection) {
    counts.set(id, (counts.get(id) || 0) + 1)
  }
  return counts
}

export function getUniqueCardIds(profile: PlayerProfile): string[] {
  return [...new Set(profile.collection)]
}

/** Check if the player has enough copies of each card in a deck */
export function canBuildDeck(profile: PlayerProfile, cardIds: string[]): boolean {
  const needed = new Map<string, number>()
  for (const id of cardIds) needed.set(id, (needed.get(id) || 0) + 1)
  const owned = getCollectionCounts(profile)
  for (const [id, count] of needed) {
    if ((owned.get(id) || 0) < count) return false
  }
  return true
}

/** Save a deck to a slot */
export function saveDeck(profile: PlayerProfile, slotIndex: number, deck: SavedDeck): void {
  if (slotIndex < 0 || slotIndex >= profile.deckSlots.length) return
  // detect elements
  const elements = detectDeckElements(deck.cardIds)
  profile.deckSlots[slotIndex] = { ...deck, elements }
  profile.updatedAt = Date.now()
  saveProfile(profile)
}

function detectDeckElements(cardIds: string[]): Element[] {
  // We need to look up elements from DB but avoid circular dependency
  // So we just store unique element strings from cardIds (element is in the ID prefix)
  const elementSet = new Set<string>()
  for (const id of cardIds) {
    const prefix = id.split('_')[0]
    const map: Record<string, Element> = { fire: 'fire', water: 'water', earth: 'earth', air: 'air', light: 'light', dark: 'dark' }
    if (map[prefix]) elementSet.add(prefix)
  }
  return [...elementSet] as Element[]
}

// ── Campaign progress ─────────────────────────────────────

export function advanceCampaign(profile: PlayerProfile, chapterId: string, battleIndex: number, totalBattles: number): boolean {
  const cp = profile.campaignProgress
  cp.currentChapter = chapterId
  cp.currentBattleIndex = battleIndex + 1
  if (cp.currentBattleIndex >= totalBattles) {
    // chapter completed
    if (!cp.completedChapters.includes(chapterId)) {
      cp.completedChapters.push(chapterId)
    }
    return true // chapter done
  }
  saveProfile(profile)
  return false
}

// ── Persistence (localStorage) ────────────────────────────

export function saveProfile(profile: PlayerProfile): void {
  try {
    profile.updatedAt = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // quota exceeded or unavailable — silently fail
  }
}

export function loadProfile(): PlayerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PlayerProfile
    // migration: ensure all fields exist
    if (!parsed.stats) parsed.stats = createDefaultStats()
    if (!parsed.campaignProgress) parsed.campaignProgress = createDefaultCampaign()
    if (!parsed.unlocks) parsed.unlocks = ['basic_elements']
    if (parsed.tutorialDone === undefined) parsed.tutorialDone = false
    if (parsed.coins === undefined) parsed.coins = 999999
    if (parsed.gems === undefined) parsed.gems = 9999
    return parsed
  } catch {
    return null
  }
}

export function deleteProfile(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* Expected: localStorage may be unavailable */ }
}

export function hasProfile(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) !== null } catch { return false }
}
