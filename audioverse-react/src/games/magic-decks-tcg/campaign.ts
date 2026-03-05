/**
 * campaign.ts — Campaign system for MagicDecks TCG.
 * Sequential battles through chapters, "szukanie zaczepki" random encounters,
 * card capture mechanic.
 */
import type {
  PlayerProfile, CampaignChapter, CampaignBattle, BattleResult, Element, GameState, PlayerState,
} from './types'
import { CAMPAIGN_CHAPTERS, CAPTURE_HP_THRESHOLD, SKIRMISH_ELEMENT_POOLS, XP_REWARDS } from './constants'
import { buildRandomDeck, ALL_CARDS } from './cardDatabase'
import { advanceCampaign, processBattleResult, saveProfile } from './progression'

// ── Campaign helpers ──────────────────────────────────────

/** Get current chapter for the player */
export function getCurrentChapter(profile: PlayerProfile): CampaignChapter | null {
  return CAMPAIGN_CHAPTERS.find(ch => ch.id === profile.campaignProgress.currentChapter) ?? null
}

/** Get current battle within current chapter */
export function getCurrentBattle(profile: PlayerProfile): CampaignBattle | null {
  const ch = getCurrentChapter(profile)
  if (!ch) return null
  const idx = profile.campaignProgress.currentBattleIndex
  return ch.battles[idx] ?? null
}

/** Get all chapters with their unlock status */
export function getChaptersWithStatus(profile: PlayerProfile): Array<{
  chapter: CampaignChapter
  unlocked: boolean
  completed: boolean
  current: boolean
}> {
  return CAMPAIGN_CHAPTERS.map(ch => ({
    chapter: ch,
    unlocked: profile.level >= ch.requiredLevel && (
      ch.requiredLevel <= 1 ||
      profile.unlocks.includes(ch.id) ||
      // First chapter always unlocked, subsequent require previous completion
      CAMPAIGN_CHAPTERS.indexOf(ch) === 0 ||
      profile.campaignProgress.completedChapters.includes(
        CAMPAIGN_CHAPTERS[CAMPAIGN_CHAPTERS.indexOf(ch) - 1]?.id ?? ''
      )
    ),
    completed: profile.campaignProgress.completedChapters.includes(ch.id),
    current: profile.campaignProgress.currentChapter === ch.id,
  }))
}

/** Build opponent's deck for a campaign battle */
export function buildCampaignOpponentDeck(battle: CampaignBattle): string[] {
  const deck = buildRandomDeck(battle.opponentDeckSize, battle.opponentElements)
  return deck.map(c => c.id)
}

/** Process campaign battle result, advance progress, attempt card capture */
export function processCampaignResult(
  profile: PlayerProfile,
  chapterId: string,
  battleIndex: number,
  won: boolean,
  gameState: GameState,
): BattleResult {
  const chapter = CAMPAIGN_CHAPTERS.find(ch => ch.id === chapterId)
  const battle = chapter?.battles[battleIndex]

  // Calculate stats from game state
  const player = gameState.players[0]
  const stats = extractBattleStats(gameState, player)

  // Attempt card capture
  let cardCaptured: string | null = null
  if (won && battle) {
    cardCaptured = attemptCardCapture(gameState, battle, profile)
  }

  // Advance campaign
  let chapterCompleted = false
  if (won && chapter) {
    chapterCompleted = advanceCampaign(profile, chapterId, battleIndex, chapter.battles.length)
    if (chapterCompleted) {
      // Grant chapter rewards
      for (const cardId of chapter.reward.cards) {
        profile.collection.push(cardId)
      }
      if (chapter.reward.unlockKey && !profile.unlocks.includes(chapter.reward.unlockKey)) {
        profile.unlocks.push(chapter.reward.unlockKey)
      }
    }
  }

  const result: BattleResult = {
    won,
    xpGained: 0, // processBattleResult will calculate
    cardCaptured,
    damageDealt: stats.damageDealt,
    creaturesKilled: stats.creaturesKilled,
    cardsPlayed: stats.cardsPlayed,
    turnsPlayed: Math.floor(gameState.tick / 60),
    isCampaign: true,
    chapterCompleted,
  }

  const { xpGained } = processBattleResult(profile, result)
  result.xpGained = xpGained

  // Add boss bonus XP
  if (won && battle?.isBoss) {
    const bonusXP = XP_REWARDS.campaignBossWin - XP_REWARDS.campaignWin
    if (bonusXP > 0) {
      result.xpGained += bonusXP
      profile.xp += bonusXP
      saveProfile(profile)
    }
  }

  return result
}

/** Attempt to capture a card from defeated opponent */
function attemptCardCapture(gameState: GameState, battle: CampaignBattle, profile: PlayerProfile): string | null {
  if (battle.capturePool.length === 0) return null

  // Check if enemy (player index 1) ended with very low life
  const enemy = gameState.players[1]
  if (!enemy) return null

  const lifePct = enemy.life / enemy.maxLife
  // Must be below threshold (15% life or less)
  if (lifePct > CAPTURE_HP_THRESHOLD && enemy.life > 0) {
    // Still allow capture if enemy fully defeated (0 life)
    if (enemy.life > 0) return null
  }

  // Pick random card from capture pool that player doesn't already have 4+ copies of
  const available = battle.capturePool.filter(id => {
    const count = profile.collection.filter(c => c === id).length
    return count < 4 // max 4 copies
  })

  if (available.length === 0) return null
  return available[Math.floor(Math.random() * available.length)]
}

// ── Skirmish / "szukanie zaczepki" ────────────────────────

export interface SkirmishOpponent {
  name: string
  nameKey: string
  elements: Element[]
  deckSize: number
  life: number
  difficulty: number
  capturePool: string[]
  level: number
}

/** Generate a random opponent at a similar level to the player */
export function generateSkirmishOpponent(profile: PlayerProfile): SkirmishOpponent {
  // Find appropriate element pool
  const pool = [...SKIRMISH_ELEMENT_POOLS]
    .filter(p => profile.level >= p.minLevel)
    .pop()!

  // Pick 1-2 random elements
  const shuffled = [...pool.elements].sort(() => Math.random() - 0.5)
  const numElements = Math.random() < 0.5 ? 1 : 2
  const elements = shuffled.slice(0, numElements) as Element[]

  // Scale difficulty to player level (±2 level variance)
  const levelVariance = Math.floor(Math.random() * 5) - 2
  const oppLevel = Math.max(1, Math.min(20, profile.level + levelVariance))
  const difficulty = 0.5 + (oppLevel / 20) * 0.8

  // Deck size scales with level
  const deckSize = Math.min(30, 18 + Math.floor(oppLevel * 0.6))
  const life = 15 + Math.floor(oppLevel * 1.2)

  // Build capture pool: random cards from chosen elements
  const elementCards = ALL_CARDS.filter(c => elements.includes(c.element) && c.stage <= 2)
  const capturePool = elementCards
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(c => c.id)

  // Generate opponent name
  const nameIndex = Math.floor(Math.random() * SKIRMISH_NAMES.length)

  return {
    name: SKIRMISH_NAMES[nameIndex],
    nameKey: `magicDecks.skirmish.opponent${nameIndex + 1}`,
    elements,
    deckSize,
    life,
    difficulty,
    capturePool,
    level: oppLevel,
  }
}

const SKIRMISH_NAMES = [
  'Wandering Mage', 'Arena Champion', 'Street Duelist', 'Card Collector',
  'Dark Sorcerer', 'Forest Hermit', 'Flame Dancer', 'Sea Witch',
  'Wind Rider', 'Shadow Thief', 'Holy Knight', 'Beast Tamer',
  'Storm Caller', 'Grave Keeper', 'Sun Priest', 'Moon Adept',
  'Iron Golem', 'Crystal Sage', 'Plague Doctor', 'Dragon Rider',
]

/** Process skirmish battle result */
export function processSkirmishResult(
  profile: PlayerProfile,
  opponent: SkirmishOpponent,
  won: boolean,
  gameState: GameState,
): BattleResult {
  const player = gameState.players[0]
  const stats = extractBattleStats(gameState, player)

  // Attempt card capture
  let cardCaptured: string | null = null
  if (won && opponent.capturePool.length > 0) {
    const enemy = gameState.players[1]
    if (enemy) {
      const lifePct = enemy.life / enemy.maxLife
      if (lifePct <= CAPTURE_HP_THRESHOLD || enemy.life <= 0) {
        const available = opponent.capturePool.filter(id => {
          const count = profile.collection.filter(c => c === id).length
          return count < 4
        })
        if (available.length > 0) {
          cardCaptured = available[Math.floor(Math.random() * available.length)]
        }
      }
    }
  }

  const result: BattleResult = {
    won,
    xpGained: 0,
    cardCaptured,
    damageDealt: stats.damageDealt,
    creaturesKilled: stats.creaturesKilled,
    cardsPlayed: stats.cardsPlayed,
    turnsPlayed: Math.floor(gameState.tick / 60),
    isCampaign: false,
    chapterCompleted: false,
  }

  const { xpGained } = processBattleResult(profile, result)
  result.xpGained = xpGained
  return result
}

// ── Internal helpers ──────────────────────────────────────

function extractBattleStats(gameState: GameState, player: PlayerState): {
  damageDealt: number; creaturesKilled: number; cardsPlayed: number
} {
  const events = gameState.events
  const damageDealt = events
    .filter(e => e.sourceOwner === player.index && (e.kind === 'attack' || e.kind === 'directHit' || e.kind === 'spell'))
    .reduce((sum, e) => sum + e.value, 0)
  const creaturesKilled = events
    .filter(e => e.kind === 'death' && e.sourceOwner !== player.index)
    .length
  const cardsPlayed = player.discard.length

  return { damageDealt, creaturesKilled, cardsPlayed }
}
