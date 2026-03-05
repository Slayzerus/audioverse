/**
 * constants.ts — Game-wide constants for MagicDecks TCG meta-game.
 * XP tables, level thresholds, unlock requirements, campaign structure,
 * deck rating criteria, hint definitions.
 */
import type {
  CampaignChapter, TutorialStep, GameHint, Element,
} from './types'

// ── XP & Levels ───────────────────────────────────────────

/** XP required to reach each level (index = level) */
export const XP_TABLE: number[] = [
  0,     // level 0 (impossible)
  0,     // level 1 (starting)
  100,   // level 2
  250,   // level 3
  500,   // level 4
  800,   // level 5 — unlock dark element
  1200,  // level 6
  1700,  // level 7
  2300,  // level 8
  3000,  // level 9
  4000,  // level 10 — unlock 4th deck slot
  5200,  // level 11
  6600,  // level 12
  8200,  // level 13
  10000, // level 14
  12500, // level 15 — unlock 5th deck slot
  15500, // level 16
  19000, // level 17
  23000, // level 18
  27500, // level 19
  33000, // level 20 — unlock 6th deck slot, max rank
]

export const MAX_LEVEL = 20
export const MAX_DECK_SLOTS = 6

/** XP rewards for various actions */
export const XP_REWARDS = {
  battleWin: 50,
  battleLoss: 15,
  battleDraw: 25,
  campaignWin: 80,
  campaignBossWin: 150,
  cardCapture: 20,
  tutorialComplete: 100,
  chapterComplete: 200,
  onlineWin: 60,
  onlineLoss: 20,
  comboBonus: 5,     // per 3+ combo
  evolutionBonus: 10,
  firstWinOfDay: 30,
} as const

/** Level-based unlocks */
export const LEVEL_UNLOCKS: Record<number, { unlockKey: string; descKey: string }[]> = {
  1: [{ unlockKey: 'basic_elements', descKey: 'magicDecks.unlock.basicElements' }],
  3: [{ unlockKey: 'deck_slot_2', descKey: 'magicDecks.unlock.deckSlot2' }],
  5: [{ unlockKey: 'dark_element', descKey: 'magicDecks.unlock.darkElement' },
      { unlockKey: 'deck_slot_3', descKey: 'magicDecks.unlock.deckSlot3' }],
  8: [{ unlockKey: 'campaign_chapter3', descKey: 'magicDecks.unlock.chapter3' }],
  10: [{ unlockKey: 'deck_slot_4', descKey: 'magicDecks.unlock.deckSlot4' },
       { unlockKey: 'online_play', descKey: 'magicDecks.unlock.onlinePlay' }],
  12: [{ unlockKey: 'campaign_chapter4', descKey: 'magicDecks.unlock.chapter4' }],
  15: [{ unlockKey: 'deck_slot_5', descKey: 'magicDecks.unlock.deckSlot5' },
       { unlockKey: 'hero_cards', descKey: 'magicDecks.unlock.heroCards' }],
  18: [{ unlockKey: 'campaign_chapter5', descKey: 'magicDecks.unlock.chapter5' }],
  20: [{ unlockKey: 'deck_slot_6', descKey: 'magicDecks.unlock.deckSlot6' },
       { unlockKey: 'master_rank', descKey: 'magicDecks.unlock.masterRank' }],
}

// ── starter deck ──────────────────────────────────────────
/** Card IDs every new player starts with */
export const STARTER_COLLECTION: string[] = [
  // fire starters
  'fire_baby', 'fire_baby', 'fire_whelp', 'fire_bolt', 'fire_rage',
  // water starters
  'water_tadpole', 'water_tadpole', 'water_jelly', 'water_heal', 'water_freeze',
  // earth starters
  'earth_larvae', 'earth_mushroom', 'earth_bull', 'earth_wall',
  // air starters
  'air_egg', 'air_moth', 'air_bat', 'air_gust',
  // light starters
  'light_kitten', 'light_dew', 'light_puppy', 'light_holy', 'light_bless',
  // neutrals
  'n_mana', 'n_evolve',
]

// ── Campaign Chapters ─────────────────────────────────────
export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: 'ch1_fire_trials',
    nameKey: 'magicDecks.campaign.ch1Name',
    element: 'fire',
    requiredLevel: 1,
    battles: [
      { id: 'ch1_b1', opponentNameKey: 'magicDecks.campaign.ch1Opp1', opponentElements: ['fire'], opponentDeckSize: 20, opponentLife: 15, difficulty: 0.6, capturePool: ['fire_baby', 'fire_whelp'], isBoss: false },
      { id: 'ch1_b2', opponentNameKey: 'magicDecks.campaign.ch1Opp2', opponentElements: ['fire', 'earth'], opponentDeckSize: 22, opponentLife: 18, difficulty: 0.7, capturePool: ['fire_draco', 'earth_larvae'], isBoss: false },
      { id: 'ch1_b3', opponentNameKey: 'magicDecks.campaign.ch1Opp3', opponentElements: ['fire'], opponentDeckSize: 25, opponentLife: 22, difficulty: 0.85, capturePool: ['fire_flame', 'fire_dragon'], isBoss: true },
    ],
    reward: { xp: 200, cards: ['fire_barbarian'], unlockKey: 'chapter2' },
  },
  {
    id: 'ch2_ocean_depths',
    nameKey: 'magicDecks.campaign.ch2Name',
    element: 'water',
    requiredLevel: 3,
    battles: [
      { id: 'ch2_b1', opponentNameKey: 'magicDecks.campaign.ch2Opp1', opponentElements: ['water'], opponentDeckSize: 22, opponentLife: 18, difficulty: 0.7, capturePool: ['water_tadpole', 'water_penguin'], isBoss: false },
      { id: 'ch2_b2', opponentNameKey: 'magicDecks.campaign.ch2Opp2', opponentElements: ['water', 'air'], opponentDeckSize: 24, opponentLife: 20, difficulty: 0.8, capturePool: ['water_otter', 'water_crab'], isBoss: false },
      { id: 'ch2_b3', opponentNameKey: 'magicDecks.campaign.ch2Opp3', opponentElements: ['water'], opponentDeckSize: 25, opponentLife: 25, difficulty: 1.0, capturePool: ['water_shark', 'water_barracuda'], isBoss: true },
    ],
    reward: { xp: 250, cards: ['water_mage'], unlockKey: 'chapter3' },
  },
  {
    id: 'ch3_earth_roots',
    nameKey: 'magicDecks.campaign.ch3Name',
    element: 'earth',
    requiredLevel: 5,
    battles: [
      { id: 'ch3_b1', opponentNameKey: 'magicDecks.campaign.ch3Opp1', opponentElements: ['earth'], opponentDeckSize: 24, opponentLife: 22, difficulty: 0.8, capturePool: ['earth_beetle', 'earth_mole'], isBoss: false },
      { id: 'ch3_b2', opponentNameKey: 'magicDecks.campaign.ch3Opp2', opponentElements: ['earth', 'light'], opponentDeckSize: 25, opponentLife: 25, difficulty: 0.9, capturePool: ['earth_bear', 'earth_cactus'], isBoss: false },
      { id: 'ch3_b3', opponentNameKey: 'magicDecks.campaign.ch3Opp3', opponentElements: ['earth'], opponentDeckSize: 28, opponentLife: 30, difficulty: 1.1, capturePool: ['earth_armadillo', 'earth_carnivore'], isBoss: true },
    ],
    reward: { xp: 300, cards: ['earth_golem'], unlockKey: 'chapter4' },
  },
  {
    id: 'ch4_sky_ascent',
    nameKey: 'magicDecks.campaign.ch4Name',
    element: 'air',
    requiredLevel: 8,
    battles: [
      { id: 'ch4_b1', opponentNameKey: 'magicDecks.campaign.ch4Opp1', opponentElements: ['air'], opponentDeckSize: 25, opponentLife: 25, difficulty: 0.9, capturePool: ['air_birb', 'air_crow'], isBoss: false },
      { id: 'ch4_b2', opponentNameKey: 'magicDecks.campaign.ch4Opp2', opponentElements: ['air', 'dark'], opponentDeckSize: 26, opponentLife: 28, difficulty: 1.0, capturePool: ['air_owl', 'air_cupid'], isBoss: false },
      { id: 'ch4_b3', opponentNameKey: 'magicDecks.campaign.ch4Opp3', opponentElements: ['air', 'fire'], opponentDeckSize: 28, opponentLife: 30, difficulty: 1.2, capturePool: ['air_exotic', 'air_vulture'], isBoss: true },
    ],
    reward: { xp: 350, cards: ['air_ninja'], unlockKey: 'chapter5' },
  },
  {
    id: 'ch5_light_dark',
    nameKey: 'magicDecks.campaign.ch5Name',
    element: 'dark',
    requiredLevel: 12,
    battles: [
      { id: 'ch5_b1', opponentNameKey: 'magicDecks.campaign.ch5Opp1', opponentElements: ['dark'], opponentDeckSize: 26, opponentLife: 28, difficulty: 1.0, capturePool: ['dark_blob', 'dark_ghost'], isBoss: false },
      { id: 'ch5_b2', opponentNameKey: 'magicDecks.campaign.ch5Opp2', opponentElements: ['dark', 'light'], opponentDeckSize: 28, opponentLife: 30, difficulty: 1.1, capturePool: ['dark_anubis', 'dark_werewolf'], isBoss: false },
      { id: 'ch5_b3', opponentNameKey: 'magicDecks.campaign.ch5Opp3', opponentElements: ['light', 'dark'], opponentDeckSize: 30, opponentLife: 35, difficulty: 1.3, capturePool: ['dark_nebulae', 'light_god'], isBoss: true },
    ],
    reward: { xp: 500, cards: ['dark_necro', 'light_angel'], unlockKey: 'master_rank' },
  },
]

// ── Skirmish / "szukanie zaczepki" ────────────────────────
/** Elements for random encounter generation, mapped to level ranges */
export const SKIRMISH_ELEMENT_POOLS: { minLevel: number; elements: Element[] }[] = [
  { minLevel: 1, elements: ['fire', 'water', 'earth'] },
  { minLevel: 3, elements: ['fire', 'water', 'earth', 'air'] },
  { minLevel: 5, elements: ['fire', 'water', 'earth', 'air', 'light'] },
  { minLevel: 8, elements: ['fire', 'water', 'earth', 'air', 'light', 'dark'] },
]

/** HP threshold (%) below which enemy card can be captured */
export const CAPTURE_HP_THRESHOLD = 0.15
/** Default: 1 card per battle capture */
export const BASE_CAPTURE_LIMIT = 1

// ── Tutorial Steps ────────────────────────────────────────
export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 1, titleKey: 'magicDecks.tutorial.welcome', descriptionKey: 'magicDecks.tutorial.welcomeDesc', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'center' },
  { id: 2, titleKey: 'magicDecks.tutorial.hand', descriptionKey: 'magicDecks.tutorial.handDesc', highlight: 'hand', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'bottom' },
  { id: 3, titleKey: 'magicDecks.tutorial.mana', descriptionKey: 'magicDecks.tutorial.manaDesc', highlight: 'mana', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'top' },
  { id: 4, titleKey: 'magicDecks.tutorial.lanes', descriptionKey: 'magicDecks.tutorial.lanesDesc', highlight: 'lanes', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'center' },
  { id: 5, titleKey: 'magicDecks.tutorial.playCard', descriptionKey: 'magicDecks.tutorial.playCardDesc', highlight: 'field', pauseGame: false, autoAdvanceTicks: 600, tooltipPosition: 'bottom' },
  { id: 6, titleKey: 'magicDecks.tutorial.combat', descriptionKey: 'magicDecks.tutorial.combatDesc', pauseGame: false, autoAdvanceTicks: 900, tooltipPosition: 'center' },
  { id: 7, titleKey: 'magicDecks.tutorial.elements', descriptionKey: 'magicDecks.tutorial.elementsDesc', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'center' },
  { id: 8, titleKey: 'magicDecks.tutorial.evolve', descriptionKey: 'magicDecks.tutorial.evolveDesc', highlight: 'evolve', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'center' },
  { id: 9, titleKey: 'magicDecks.tutorial.spells', descriptionKey: 'magicDecks.tutorial.spellsDesc', highlight: 'spell', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'bottom' },
  { id: 10, titleKey: 'magicDecks.tutorial.life', descriptionKey: 'magicDecks.tutorial.lifeDesc', highlight: 'life', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'top' },
  { id: 11, titleKey: 'magicDecks.tutorial.tips', descriptionKey: 'magicDecks.tutorial.tipsDesc', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'center' },
  { id: 12, titleKey: 'magicDecks.tutorial.ready', descriptionKey: 'magicDecks.tutorial.readyDesc', pauseGame: true, autoAdvanceTicks: 0, tooltipPosition: 'center' },
]

// ── Hints ─────────────────────────────────────────────────
export const GAME_HINTS: GameHint[] = [
  { id: 'h_firstTurn', textKey: 'magicDecks.hints.firstTurn', trigger: 'firstTurn', priority: 10, showOnce: true },
  { id: 'h_lowMana', textKey: 'magicDecks.hints.lowMana', trigger: 'lowMana', priority: 5, showOnce: false },
  { id: 'h_fullHand', textKey: 'magicDecks.hints.fullHand', trigger: 'fullHand', priority: 6, showOnce: false },
  { id: 'h_emptyField', textKey: 'magicDecks.hints.emptyField', trigger: 'emptyField', priority: 7, showOnce: false },
  { id: 'h_canEvolve', textKey: 'magicDecks.hints.canEvolve', trigger: 'canEvolve', priority: 8, showOnce: false },
  { id: 'h_elemAdvantage', textKey: 'magicDecks.hints.elementAdvantage', trigger: 'elementAdvantage', priority: 7, showOnce: false },
  { id: 'h_lowLife', textKey: 'magicDecks.hints.lowLife', trigger: 'lowLife', priority: 9, showOnce: false },
  { id: 'h_combo', textKey: 'magicDecks.hints.comboChance', trigger: 'comboChance', priority: 4, showOnce: false },
  { id: 'h_spell', textKey: 'magicDecks.hints.spellAvailable', trigger: 'spellAvailable', priority: 3, showOnce: false },
  { id: 'h_bossWeak', textKey: 'magicDecks.hints.bossWeak', trigger: 'bossWeak', priority: 10, showOnce: false },
]

// ── Deck Rating Criteria ──────────────────────────────────
export const DECK_MIN_SIZE = 20
export const DECK_MAX_SIZE = 30
export const DECK_RECOMMENDED_SIZE = 25
export const MAX_COPIES_PER_CARD = 4

/** Ideal mana curve distribution (% of deck at each cost range) */
export const IDEAL_MANA_CURVE = {
  low: 0.35,     // cost 1-2: 35%
  mid: 0.40,     // cost 3-5: 40%
  high: 0.25,    // cost 6+: 25%
} as const
