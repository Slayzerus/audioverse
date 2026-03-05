/**
 * types.ts — Core types for the MagicDecks TCG card game.
 *
 * 6 Elements: Fire, Water, Earth, Air, Light, Dark
 * 3 Evolution stages per creature chain
 * Card types: Creature, Spell, Hero (from TCG art)
 * 5 lanes, real-time or turn-based combat
 */

// ── Rarity ────────────────────────────────────────────────
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export const RARITY_ORDER: Record<Rarity, number> = {
  common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4,
}

export const RARITY_COLORS: Record<Rarity, string> = {
  common:    '#b0b0b0',
  uncommon:  '#2ecc71',
  rare:      '#3498db',
  epic:      '#9b59b6',
  legendary: '#f39c12',
}

export const RARITY_ICONS: Record<Rarity, string> = {
  common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟧',
}

// ── Elements ──────────────────────────────────────────────
export type Element = 'fire' | 'water' | 'earth' | 'air' | 'light' | 'dark'

export const ELEMENT_COLORS: Record<Element, string> = {
  fire:  '#e74c3c',
  water: '#3498db',
  earth: '#27ae60',
  air:   '#9b59b6',
  light: '#f1c40f',
  dark:  '#2c3e50',
}

export const ELEMENT_BG: Record<Element, string> = {
  fire:  '#3a1111',
  water: '#0e2a3e',
  earth: '#1a2e1a',
  air:   '#2a1a3a',
  light: '#3a3520',
  dark:  '#15151f',
}

export const ELEMENT_ICONS: Record<Element, string> = {
  fire: '🔥', water: '💧', earth: '🌿', air: '💨', light: '✨', dark: '🌑',
}

/** Element advantage wheel: key beats values */
export const ELEMENT_ADVANTAGE: Record<Element, Element[]> = {
  fire:  ['earth', 'air'],
  water: ['fire', 'earth'],
  earth: ['air', 'light'],
  air:   ['water', 'dark'],
  light: ['dark', 'fire'],
  dark:  ['light', 'water'],
}

// ── Abilities ─────────────────────────────────────────────
export type PassiveKind =
  | 'thorns'       // deals N dmg when attacked
  | 'regen'        // heals N hp per tick
  | 'lifesteal'    // heals attacker for % of damage
  | 'taunt'        // enemies in lane must attack this first
  | 'shield'       // blocks first N damage then breaks
  | 'pierce'       // ignores some DEF
  | 'swiftStrike'  // attacks first (higher priority)
  | 'splash'       // hits adjacent lanes for % dmg
  | 'inspire'      // boosts adjacent allies ATK

export type ActiveKind =
  | 'fireball'     // deals burst dmg to target lane
  | 'heal'         // heals ally creature
  | 'freeze'       // skips enemy's next attack
  | 'poison'       // DoT for N ticks
  | 'buff'         // +ATK/+DEF temporary
  | 'summon'       // summons a token creature
  | 'lightning'    // hits random enemy for dmg
  | 'drain'        // steals HP from enemy creature

export interface Passive { kind: PassiveKind; value: number }
export interface Active {
  kind: ActiveKind; value: number
  cooldown: number     // ticks between uses
  currentCd: number    // remaining cooldown
}

// ── Card definitions ──────────────────────────────────────
export type CardType = 'creature' | 'spell' | 'hero'

export interface CardDef {
  id: string
  name: string
  type: CardType
  element: Element
  /** Rarity determines booster odds and shop price */
  rarity: Rarity
  cost: number
  atk: number
  def: number        // also HP for creatures
  spd: number        // attack speed (lower = faster, ticks between attacks)
  stage: 1 | 2 | 3   // evolution stage (1=basic, 2=mid, 3=final)
  evolvesFrom?: string // id of previous stage
  evolvesTo?: string   // id of next stage
  passive?: Passive
  active?: Active
  /** Effect for spells */
  spellEffect?: SpellEffect
  /** Path to sprite image (relative to /assets/) */
  sprite: string
  /** Short flavor text */
  flavor?: string
}

export interface SpellEffect {
  kind: 'damage' | 'heal' | 'buff' | 'debuff' | 'draw' | 'mana' | 'aoe' | 'evolve'
  value: number
  target: 'enemy' | 'ally' | 'self' | 'all' | 'lane'
}

// ── Runtime card instance ─────────────────────────────────
export interface CardInstance {
  uid: number          // unique runtime id
  def: CardDef
}

export interface FieldCreature {
  uid: number
  def: CardDef
  hp: number
  maxHp: number
  atk: number
  spd: number
  lane: number
  owner: number        // player index
  ticksSinceAttack: number
  poisonTicks: number
  frozenTicks: number
  buffAtk: number      // temporary ATK buff
  buffDef: number      // temporary DEF buff
  buffTimer: number
  shieldHp: number     // from shield passive
  enterAnim: number    // frames since placed (for entrance animation)
  hurtAnim: number     // frames of hurt flash
}

// ── Battle events (for animation) ─────────────────────────
export type BattleEventKind =
  | 'attack'       // creature attacks another
  | 'directHit'    // creature hits player life
  | 'spell'        // spell cast
  | 'death'        // creature dies
  | 'evolve'       // creature evolves
  | 'summon'       // creature placed on field
  | 'heal'         // heal effect
  | 'ability'      // active ability triggered

export interface BattleEvent {
  kind: BattleEventKind
  lane: number
  sourceOwner: number
  targetOwner?: number
  element: Element
  value: number
  x: number; y: number  // screen position for particles
  time: number           // performance.now()
}

// ── Particles ─────────────────────────────────────────────
export interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  color: string
  size: number
  element: Element
}

// ── Player state ──────────────────────────────────────────
export interface PlayerState {
  index: number
  name: string
  color: string
  input: { type: string; group?: number; padIndex?: number }
  life: number
  maxLife: number
  mana: number
  maxMana: number
  hand: CardInstance[]
  deck: CardInstance[]
  discard: CardInstance[]
  field: (FieldCreature | null)[]   // 5 lanes
  selectedCard: number
  selectedLane: number
  coins: number
  gems: number
  stars: number
  lastManaTick: number
  lastDrawTick: number
  comboCount: number
  lastElement: Element | null
}

// ── Game state ────────────────────────────────────────────
export interface GameState {
  players: PlayerState[]
  events: BattleEvent[]
  particles: Particle[]
  gameOver: boolean
  winner: number | null
  tick: number
  mode: string          // 'duel' | 'coop-raid' | 'ffa'
  coopBoss: BossState | null
  startTime: number
  /** Image cache (loaded at runtime) */
  imageCache: Map<string, HTMLImageElement>
  nextUid: number
}

export interface BossState {
  life: number
  maxLife: number
  field: (FieldCreature | null)[]
  ticksSinceDraw: number
  ticksSinceMana: number
  hand: CardInstance[]
  deck: CardInstance[]
  mana: number
  maxMana: number
  element: Element
}

// ── Meta-game types ───────────────────────────────────────

/** Which screen / flow the player is on */
export type MenuScreen =
  | 'main'        // main menu
  | 'tutorial'    // tutorial battle
  | 'campaign'    // campaign map
  | 'skirmish'    // quick match setup
  | 'online'      // matchmaking lobby
  | 'collection'  // card collection browser
  | 'deckBuilder' // build / edit decks
  | 'shop'        // card shop
  | 'game'        // in a battle
  | 'quickPlay'   // quick play settings

// ── Auto-play modes ───────────────────────────────────────
export type AutoPlayMode = 'off' | 'expensive' | 'cheap' | 'rarest'

// ── Shop types ────────────────────────────────────────────
export type BoosterTier = 'bronze' | 'silver' | 'gold' | 'diamond'

export interface BoosterDef {
  tier: BoosterTier
  cardsPerPack: number
  /** Rarity weight distribution [common, uncommon, rare, epic, legendary] */
  weights: [number, number, number, number, number]
  priceCoins: number
  priceGems: number
}

export interface ShopCardOffer {
  cardId: string
  priceCoins: number
  priceGems: number
  /** Offer expires at this timestamp */
  expiresAt: number
}

export interface ShopDeckOffer {
  name: string
  cardIds: string[]
  element: Element
  priceCoins: number
  priceGems: number
}

export interface ShopState {
  /** Currently displayed single-card offers */
  cardOffers: ShopCardOffer[]
  /** Pre-built deck offers */
  deckOffers: ShopDeckOffer[]
  /** When card offers were last refreshed */
  lastRefresh: number
  /** Refresh interval in ms */
  refreshInterval: number
}

/** Persistent player profile (saved to localStorage) */
export interface PlayerProfile {
  id: string
  name: string
  xp: number
  level: number
  /** Persistent currencies */
  coins: number
  gems: number
  /** Cards the player owns (card IDs, may have duplicates) */
  collection: string[]
  /** Custom decks (up to 6 slots) */
  deckSlots: SavedDeck[]
  /** Which cards / features have been unlocked */
  unlocks: string[]
  /** Campaign progress */
  campaignProgress: CampaignProgress
  /** Statistics */
  stats: PlayerStats
  /** Completed tutorial? */
  tutorialDone: boolean
  /** Timestamp */
  createdAt: number
  updatedAt: number
}

export interface SavedDeck {
  id: string
  name: string
  cardIds: string[]
  /** Primary elements in this deck */
  elements: Element[]
}

export interface PlayerStats {
  totalBattles: number
  wins: number
  losses: number
  draws: number
  cardsPlayed: number
  creaturesKilled: number
  damageDealt: number
  totalXpEarned: number
  campaignBattlesWon: number
  onlineWins: number
  onlineLosses: number
  longestWinStreak: number
  currentWinStreak: number
}

/** Campaign chapter with sequential battles */
export interface CampaignChapter {
  id: string
  /** Translation key for chapter name */
  nameKey: string
  /** Primary element theme */
  element: Element
  /** Battles in order */
  battles: CampaignBattle[]
  /** Reward for completing the chapter */
  reward: CampaignReward
  /** Required player level to unlock */
  requiredLevel: number
}

export interface CampaignBattle {
  id: string
  /** Translation key for opponent name */
  opponentNameKey: string
  /** Opponent's preferred elements */
  opponentElements: Element[]
  /** Opponent deck size */
  opponentDeckSize: number
  /** Opponent starting life */
  opponentLife: number
  /** Difficulty multiplier (1.0 = normal) */
  difficulty: number
  /** Cards available for capture from this opponent */
  capturePool: string[]
  /** Boss battle? (special rules) */
  isBoss: boolean
}

export interface CampaignReward {
  xp: number
  cards: string[]
  /** Unlock key (e.g. 'chapter2', 'dark_element', etc.) */
  unlockKey?: string
}

export interface CampaignProgress {
  /** Which chapters are completed */
  completedChapters: string[]
  /** Current chapter id */
  currentChapter: string
  /** Index of current battle within current chapter */
  currentBattleIndex: number
  /** Cards captured during campaign */
  capturedCards: string[]
}

/** Result of a single battle (for post-battle screen) */
export interface BattleResult {
  won: boolean
  xpGained: number
  cardCaptured: string | null
  damageDealt: number
  creaturesKilled: number
  cardsPlayed: number
  turnsPlayed: number
  /** Whether this was a campaign battle */
  isCampaign: boolean
  /** Chapter completed? */
  chapterCompleted: boolean
}

/** Tutorial step with description */
export interface TutorialStep {
  id: number
  /** Translation key for title */
  titleKey: string
  /** Translation key for description */
  descriptionKey: string
  /** Which game action to highlight (optional) */
  highlight?: 'hand' | 'field' | 'mana' | 'lanes' | 'evolve' | 'spell' | 'life'
  /** Should we pause the game for this step? */
  pauseGame: boolean
  /** Auto-advance after N ticks (0 = wait for player) */
  autoAdvanceTicks: number
  /** Position of tooltip on screen */
  tooltipPosition: 'top' | 'bottom' | 'center' | 'left' | 'right'
}

/** Deck rating (1-5 stars in 3 criteria) */
export interface DeckRating {
  /** Synergy: how well cards work together (element combos, evolution chains) */
  synergy: number
  /** Curve: mana cost distribution balance */
  curve: number
  /** Power: raw strength of cards */
  power: number
  /** Overall average */
  overall: number
  /** Textual tips for improvement */
  tips: string[]
}

/** Matchmaking state */
export interface MatchmakingState {
  status: 'idle' | 'searching' | 'found' | 'connecting' | 'playing'
  /** Estimated skill rating (Elo-like) */
  rating: number
  /** Opponent info (once found) */
  opponent: { name: string; rating: number; level: number } | null
  /** Search start time */
  searchStartTime: number | null
  /** Room code for the match */
  roomCode: string | null
}

/** Hint for in-game contextual tips */
export interface GameHint {
  id: string
  /** Translation key */
  textKey: string
  /** When to show this hint */
  trigger: HintTrigger
  /** Priority (higher = more important) */
  priority: number
  /** Only show once? */
  showOnce: boolean
}

export type HintTrigger =
  | 'lowMana'          // player has low mana
  | 'fullHand'         // hand is at max
  | 'emptyField'       // no creatures on field
  | 'canEvolve'        // a creature can evolve
  | 'elementAdvantage' // element advantage available
  | 'lowLife'          // life is critical
  | 'firstTurn'        // very start of game
  | 'comboChance'      // same element streak possible
  | 'spellAvailable'   // has a spell that can be played
  | 'bossWeak'         // boss at low health
