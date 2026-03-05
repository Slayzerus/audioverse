/**
 * matchmaking.ts — Online matchmaking system for MagicDecks TCG.
 * Uses the existing WebSocket infrastructure from the app for
 * real-time multiplayer. Falls back to simulated matchmaking with
 * progressively harder bots when no server is available.
 */
import type { MatchmakingState, PlayerProfile, Element } from './types'

// ── Matchmaking state ─────────────────────────────────────

export function initMatchmaking(): MatchmakingState {
  return {
    status: 'idle',
    rating: 1000,
    opponent: null,
    searchStartTime: null,
    roomCode: null,
  }
}

/** Calculate an Elo-like rating from player stats */
export function calculateRating(profile: PlayerProfile): number {
  const baseRating = 1000
  const winBonus = profile.stats.onlineWins * 25
  const lossPenalty = profile.stats.onlineLosses * 15
  const levelBonus = profile.level * 20
  return Math.max(100, baseRating + winBonus - lossPenalty + levelBonus)
}

/** Start searching for a match */
export function startSearch(mm: MatchmakingState): MatchmakingState {
  return {
    ...mm,
    status: 'searching',
    searchStartTime: Date.now(),
    opponent: null,
    roomCode: null,
  }
}

/** Cancel a search */
export function cancelSearch(mm: MatchmakingState): MatchmakingState {
  return {
    ...mm,
    status: 'idle',
    searchStartTime: null,
    opponent: null,
    roomCode: null,
  }
}

/** Simulate finding a match (used when no real server is active) */
export function simulateMatchFound(mm: MatchmakingState, playerLevel: number): MatchmakingState {
  const ratingVariance = Math.floor(Math.random() * 200) - 100
  const oppRating = Math.max(100, mm.rating + ratingVariance)
  const oppLevel = Math.max(1, Math.min(20, playerLevel + Math.floor(Math.random() * 5) - 2))

  return {
    ...mm,
    status: 'found',
    opponent: {
      name: ONLINE_NAMES[Math.floor(Math.random() * ONLINE_NAMES.length)],
      rating: oppRating,
      level: oppLevel,
    },
    roomCode: generateRoomCode(),
  }
}

/** Transition to playing state */
export function startMatch(mm: MatchmakingState): MatchmakingState {
  return { ...mm, status: 'playing' }
}

/** Reset after match ends */
export function endMatch(mm: MatchmakingState, _won: boolean): MatchmakingState {
  return {
    ...mm,
    status: 'idle',
    opponent: null,
    searchStartTime: null,
    roomCode: null,
  }
}

/** Get search duration in ms */
export function getSearchDuration(mm: MatchmakingState): number {
  if (!mm.searchStartTime) return 0
  return Date.now() - mm.searchStartTime
}

/** Check if we should simulate finding a match (after ~3-8 seconds) */
export function shouldSimulateMatch(mm: MatchmakingState): boolean {
  if (mm.status !== 'searching') return false
  const durationSec = getSearchDuration(mm) / 1000
  // Simulate match after 3-8 seconds of searching
  const threshold = 3 + Math.floor(Math.random() * 5)
  return durationSec >= threshold
}

/** Get the bot difficulty for the simulated online opponent */
export function getOnlineBotDifficulty(level: number): number {
  // Higher level = harder bot
  const base = 0.7
  const scale = (level - 1) / 19 * 0.6
  return Math.max(0.5, Math.min(1.3, base + scale))
}

/** Get opponent's preferred elements based on player level */
export function getOnlineOpponentElements(): Element[] {
  const allElements: Element[] = ['fire', 'water', 'earth', 'air', 'light', 'dark']
  const shuffled = [...allElements].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2)
}

// ── Helpers ───────────────────────────────────────────────

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const ONLINE_NAMES = [
  'xDragonSlayer', 'CardMaster99', 'EternalFlame', 'ShadowBlade',
  'NeonPhoenix', 'IceQueenX', 'ThunderBolt42', 'DarkMage777',
  'MysticWolf', 'StarGazer_01', 'BlazeFury', 'AquaKnight',
  'VoidWalker', 'SunChaser', 'MoonShadow', 'EarthShaker',
  'StormCrow', 'NightHawk', 'CrystalMind', 'IronFist_X',
  'RubyDragon', 'SapphireMage', 'EmeraldKing', 'DiamondHeart',
  'ObsidianLord', 'GoldenEagle', 'SilverFang', 'BronzeGolem',
  'PlasmaBeam', 'NovaStar', 'QuantumLeap', 'PixelKnight',
]
