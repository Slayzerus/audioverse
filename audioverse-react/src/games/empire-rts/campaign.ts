/**
 * Empire RTS — Campaign & progression system
 * 5 chapters with escalating difficulty, localStorage persistence,
 * XP/level tracking, and match statistics.
 */

// ─── Types ────────────────────────────────────────────────
export interface CampaignChapter {
  id: string
  nameKey: string         // i18n key e.g. 'empire.ch1Name'
  descKey: string         // i18n key e.g. 'empire.ch1Desc'
  requiredLevel: number
  /** Victory condition: survive N waves */
  wavesToSurvive: number
  /** Starting resources override */
  startGold: number
  startWood: number
  startMeat: number
  /** Difficulty override (1-3) */
  difficulty: number
  /** Reward description i18n key */
  rewardKey: string
  /** Boss wave at the end? */
  hasBoss: boolean
}

export interface EmpireProfile {
  id: string
  xp: number
  level: number
  campaignProgress: CampaignProgress
  stats: EmpireStats
  createdAt: number
  updatedAt: number
}

export interface CampaignProgress {
  completedChapters: string[]
  currentChapter: string
  currentChapterWave: number
  bestWaves: Record<string, number>  // chapterId → best wave reached
}

export interface EmpireStats {
  totalGames: number
  totalWins: number
  totalDaysSurvived: number
  totalWavesCleared: number
  totalUnitsRecruited: number
  totalEnemiesSlain: number
  totalBuildingsBuilt: number
  bestEndlessWave: number
  bestEndlessDay: number
}

export interface MatchResult {
  won: boolean
  daysSurvived: number
  wavesCleared: number
  unitsRecruited: number
  enemiesSlain: number
  buildingsBuilt: number
  isCampaign: boolean
  chapterId?: string
  xpGained: number
}

// ─── XP System ────────────────────────────────────────────
const XP_TABLE = [
  0, 100, 250, 500, 800, 1200, 1700, 2300, 3000, 3800,
  4700, 5700, 6800, 8000, 9500, 11000, 13000, 15000, 18000, 21000,
]
const MAX_LEVEL = 20

export const XP_REWARDS = {
  campaignWin: 150,
  campaignLoss: 30,
  skirmishWin: 80,
  skirmishLoss: 20,
  endlessPerWave: 10,
  pvpWin: 100,
  pvpLoss: 25,
  bossKill: 50,
}

// ─── Campaign chapters ───────────────────────────────────
export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: 'ch1', nameKey: 'empire.ch1Name', descKey: 'empire.ch1Desc',
    requiredLevel: 1, wavesToSurvive: 3, difficulty: 1,
    startGold: 50, startWood: 30, startMeat: 20,
    rewardKey: '+200 XP', hasBoss: false,
  },
  {
    id: 'ch2', nameKey: 'empire.ch2Name', descKey: 'empire.ch2Desc',
    requiredLevel: 2, wavesToSurvive: 5, difficulty: 1,
    startGold: 40, startWood: 25, startMeat: 15,
    rewardKey: '+300 XP', hasBoss: false,
  },
  {
    id: 'ch3', nameKey: 'empire.ch3Name', descKey: 'empire.ch3Desc',
    requiredLevel: 4, wavesToSurvive: 10, difficulty: 2,
    startGold: 60, startWood: 40, startMeat: 30,
    rewardKey: '+500 XP', hasBoss: false,
  },
  {
    id: 'ch4', nameKey: 'empire.ch4Name', descKey: 'empire.ch4Desc',
    requiredLevel: 7, wavesToSurvive: 8, difficulty: 2,
    startGold: 30, startWood: 15, startMeat: 10,
    rewardKey: '+400 XP', hasBoss: false,
  },
  {
    id: 'ch5', nameKey: 'empire.ch5Name', descKey: 'empire.ch5Desc',
    requiredLevel: 10, wavesToSurvive: 15, difficulty: 3,
    startGold: 80, startWood: 60, startMeat: 40,
    rewardKey: '+1000 XP', hasBoss: true,
  },
]

// ─── Level helpers ────────────────────────────────────────
export function getLevelForXP(xp: number): number {
  for (let i = XP_TABLE.length - 1; i >= 0; i--) {
    if (xp >= XP_TABLE[i]) return Math.min(i + 1, MAX_LEVEL)
  }
  return 1
}

export function getXPForNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return XP_TABLE[MAX_LEVEL - 1]
  return XP_TABLE[level] ?? XP_TABLE[XP_TABLE.length - 1]
}

export function getXPProgress(profile: EmpireProfile): {
  current: number; required: number; percent: number
} {
  const prevThreshold = XP_TABLE[profile.level - 1] ?? 0
  const nextThreshold = getXPForNextLevel(profile.level)
  const current = profile.xp - prevThreshold
  const required = nextThreshold - prevThreshold
  const percent = required > 0 ? Math.min(100, (current / required) * 100) : 100
  return { current, required, percent }
}

export function addXP(profile: EmpireProfile, amount: number): void {
  profile.xp += amount
  profile.level = getLevelForXP(profile.xp)
  profile.updatedAt = Date.now()
}

// ─── Campaign progress ───────────────────────────────────
export function getChaptersWithStatus(profile: EmpireProfile): Array<{
  chapter: CampaignChapter
  unlocked: boolean
  completed: boolean
  current: boolean
}> {
  return CAMPAIGN_CHAPTERS.map((ch, i) => ({
    chapter: ch,
    unlocked: profile.level >= ch.requiredLevel && (
      i === 0 ||
      profile.campaignProgress.completedChapters.includes(CAMPAIGN_CHAPTERS[i - 1].id)
    ),
    completed: profile.campaignProgress.completedChapters.includes(ch.id),
    current: profile.campaignProgress.currentChapter === ch.id,
  }))
}

export function advanceCampaign(
  profile: EmpireProfile,
  chapterId: string,
  wavesCleared: number,
): boolean {
  const prog = profile.campaignProgress

  // Track best waves
  const prev = prog.bestWaves[chapterId] ?? 0
  if (wavesCleared > prev) prog.bestWaves[chapterId] = wavesCleared

  const chapter = CAMPAIGN_CHAPTERS.find(c => c.id === chapterId)
  if (!chapter) return false

  // Chapter completed?
  if (wavesCleared >= chapter.wavesToSurvive) {
    if (!prog.completedChapters.includes(chapterId)) {
      prog.completedChapters.push(chapterId)
    }
    // Advance to next chapter if available
    const idx = CAMPAIGN_CHAPTERS.indexOf(chapter)
    if (idx < CAMPAIGN_CHAPTERS.length - 1) {
      prog.currentChapter = CAMPAIGN_CHAPTERS[idx + 1].id
    }
    profile.updatedAt = Date.now()
    return true
  }
  return false
}

// ─── Match result processing ──────────────────────────────
export function processMatchResult(
  profile: EmpireProfile,
  result: Omit<MatchResult, 'xpGained'>,
): MatchResult {
  let xp = 0

  if (result.isCampaign) {
    xp = result.won ? XP_REWARDS.campaignWin : XP_REWARDS.campaignLoss
    if (result.won && result.chapterId) {
      const ch = CAMPAIGN_CHAPTERS.find(c => c.id === result.chapterId)
      if (ch?.hasBoss) xp += XP_REWARDS.bossKill
      advanceCampaign(profile, result.chapterId, result.wavesCleared)
    }
  } else {
    xp = result.won ? XP_REWARDS.skirmishWin : XP_REWARDS.skirmishLoss
  }

  // Bonus XP for waves in endless mode
  xp += result.wavesCleared * XP_REWARDS.endlessPerWave

  addXP(profile, xp)

  // Update stats
  profile.stats.totalGames++
  if (result.won) profile.stats.totalWins++
  profile.stats.totalDaysSurvived += result.daysSurvived
  profile.stats.totalWavesCleared += result.wavesCleared
  profile.stats.totalUnitsRecruited += result.unitsRecruited
  profile.stats.totalEnemiesSlain += result.enemiesSlain
  profile.stats.totalBuildingsBuilt += result.buildingsBuilt

  if (result.wavesCleared > profile.stats.bestEndlessWave) {
    profile.stats.bestEndlessWave = result.wavesCleared
  }
  if (result.daysSurvived > profile.stats.bestEndlessDay) {
    profile.stats.bestEndlessDay = result.daysSurvived
  }

  profile.updatedAt = Date.now()
  saveProfile(profile)

  return { ...result, xpGained: xp }
}

// ─── Persistence (localStorage) ──────────────────────────
const STORAGE_KEY = 'empire_rts_profile'

export function createNewProfile(): EmpireProfile {
  return {
    id: crypto.randomUUID?.() ?? `emp_${Date.now()}`,
    xp: 0,
    level: 1,
    campaignProgress: {
      completedChapters: [],
      currentChapter: 'ch1',
      currentChapterWave: 0,
      bestWaves: {},
    },
    stats: {
      totalGames: 0, totalWins: 0,
      totalDaysSurvived: 0, totalWavesCleared: 0,
      totalUnitsRecruited: 0, totalEnemiesSlain: 0,
      totalBuildingsBuilt: 0,
      bestEndlessWave: 0, bestEndlessDay: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function saveProfile(profile: EmpireProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch { /* quota exceeded — ignore */ }
}

export function loadProfile(): EmpireProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EmpireProfile
  } catch {
    return null
  }
}

export function hasProfile(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null
}
