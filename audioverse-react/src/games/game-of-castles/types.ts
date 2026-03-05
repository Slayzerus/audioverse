import type { GameConfig } from '../../pages/games/mini/types'
/**
 * types.ts - Complete type system for Game of Castles (HoMM-inspired).
 *
 * Covers: map, factions, creatures, heroes, spells, items, buildings,
 * combat, economy, and full game state.
 */

import type { CombatStack } from './combat'

// --- Primitives ---
export interface Pos { x: number; y: number }
export interface Size { w: number; h: number }

// --- Map ---
export type Terrain = 'grass' | 'forest' | 'mountain' | 'water' | 'road' | 'sand' | 'swamp' | 'snow' | 'lava' | 'dirt'

export interface MapCell {
  terrain: Terrain
  explored: boolean[]        // per-player visibility
  objectId: string | null    // id of object sitting here
  building: string | null    // e.g. 'town'
}

export interface WorldMap {
  cols: number
  rows: number
  cells: MapCell[][]
}

// --- Factions ---
export type FactionId =
  | 'castle'
  | 'rampart'
  | 'tower'
  | 'inferno'
  | 'necropolis'
  | 'dungeon'
  | 'wilds'

export interface FactionDef {
  id: FactionId
  name: string
  color: string
  creatures: CreatureId[]
  nativeTerrain: Terrain
}

// --- Creatures ---
export type CreatureId = string

export interface CreatureDef {
  id: CreatureId
  name: string
  faction: FactionId
  tier: 1 | 2 | 3 | 4 | 5 | 6 | 7
  hp: number
  attack: number
  defense: number
  minDmg: number
  maxDmg: number
  speed: number
  initiative: number
  shots: number
  growth: number
  cost: ResourceBundle
  abilities: CreatureAbility[]
  shape: 'square' | 'triangle' | 'diamond' | 'circle' | 'hexagon'
  large: boolean
}

export type CreatureAbility =
  | 'flying'
  | 'ranged'
  | 'double_strike'
  | 'no_retaliation'
  | 'undead'
  | 'fire_breath'
  | 'regeneration'
  | 'life_drain'
  | 'teleport'
  | 'fear'
  | 'magic_resist'
  | 'dispel'
  | 'jousting'
  | 'anti_magic'
  | 'spellcaster'
  | 'heal_ally'
  | 'morale_boost'
  | 'curse_attack'
  | 'lightning_attack'

// --- Creature Stack (army unit) ---
export interface CreatureStack {
  creatureId: CreatureId
  count: number
  upgradeLevel?: number  // 0 = base, 1 = upgraded, 2 = champion
  statusEffects: StatusEffect[]
  morale: number
  luck: number
  hasActed: boolean
  hasRetaliated: boolean
  shotsLeft: number
}

export interface StatusEffect {
  type: string
  modifier: number
  duration: number
  sourceSpellId: string | null
}

// --- Heroes ---
export type HeroClass =
  | 'knight'
  | 'cleric'
  | 'ranger'
  | 'druid'
  | 'alchemist'
  | 'wizard'
  | 'demoniac'
  | 'heretic'
  | 'death_knight'
  | 'necromancer'
  | 'overlord'
  | 'warlock'
  | 'beastmaster'
  | 'shaman'

export interface HeroSkill {
  skillId: string
  name: string
  level: number   // 1 = basic, 2 = advanced, 3 = expert
}

export interface Hero {
  id: string
  name: string
  owner: number
  heroClass: HeroClass
  faction: FactionId
  level: number
  experience: number
  /** Primary stats */
  attack: number
  defense: number
  spellPower: number
  knowledge: number
  /** Derived */
  maxMana: number
  mana: number
  movementPoints: number
  maxMovementPoints: number
  /** Army: up to 7 stacks */
  army: (CreatureStack | null)[]
  /** Equipped artifacts */
  equipment: HeroEquipment
  /** Known spells */
  spells: SpellId[]
  /** Secondary skills */
  skills: HeroSkill[]
  /** Map position (flat) */
  x: number
  y: number
  /** Is the hero alive? */
  alive: boolean
  /** Timestamp of last movement */
  lastMoveTime: number
  /** If garrisoned in a town */
  garrisonedTownId: string | null
}

export interface HeroEquipment {
  helmet: ArtifactId | null
  armor: ArtifactId | null
  weapon: ArtifactId | null
  shield: ArtifactId | null
  boots: ArtifactId | null
  ring1: ArtifactId | null
  ring2: ArtifactId | null
  amulet: ArtifactId | null
  cloak: ArtifactId | null
  misc1: ArtifactId | null
  misc2: ArtifactId | null
  misc3: ArtifactId | null
  misc4: ArtifactId | null
}

export type LevelUpChoice = {
  type: 'primary'
  primaryStat: 'attack' | 'defense' | 'spellPower' | 'knowledge'
  primaryAmount: number
} | {
  type: 'secondary'
  secondarySkillId: string
  secondaryLevel: number
}

// --- Spells ---
export type SpellId = string

export type SpellSchool = 'fire' | 'water' | 'earth' | 'air'
export type SpellTarget = 'enemy_stack' | 'friendly_stack' | 'all_enemy' | 'all_friendly' | 'cell' | 'self' | 'global' | 'area'

export interface SpellDef {
  id: SpellId
  name: string
  school: SpellSchool
  level: 1 | 2 | 3 | 4 | 5
  manaCost: number
  basePower: number
  target: SpellTarget
  duration: number
  description: string
  adventureSpell: boolean
}

// --- Artifacts / Items ---
export type ArtifactId = string
export type ArtifactSlot = keyof HeroEquipment
export type ArtifactRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

export interface ArtifactDef {
  id: ArtifactId
  name: string
  slot: ArtifactSlot
  rarity: ArtifactRarity
  cost: number
  effects: Partial<{
    attack: number
    defense: number
    spellPower: number
    knowledge: number
    morale: number
    luck: number
    movementPoints: number
    manaBonus: number
    spellDamagePercent: number
    creatureDamagePercent: number
    incomeGold: number
  }>
  description: string
}

// --- Buildings ---
export type BuildingId = string

export interface BuildingDef {
  id: BuildingId
  name: string
  description: string
  cost: ResourceBundle
  prerequisites: BuildingId[]
  creatureTier: number
  effects: Partial<{
    incomeGold: number
    incomeOre: number
    incomeWood: number
    incomeCrystals: number
    incomeGems: number
    incomeMercury: number
    incomeSulfur: number
    creatureGrowthBonus: number
    fortLevel: number
    mageGuild: number
    marketEnabled: boolean
    blacksmithEnabled: boolean
    shipyardEnabled: boolean
    xpBonus: number
    moraleBonus: number
    luckBonus: number
  }>
  factions: FactionId[] | 'all'
  maxLevel: number  // max upgrade level (1 for non-upgradeable, 3 for dwellings)
}

export interface TownBuilding {
  buildingId: BuildingId
  built: boolean
  level: number  // 0 = not built, 1-3 = building level (dwellings upgradeable)
}

// --- Town ---
export interface Town {
  id: string
  name: string
  owner: number
  faction: FactionId
  x: number
  y: number
  buildings: TownBuilding[]
  creaturePool: { creatureId: CreatureId; available: number }[]
  garrison: (CreatureStack | null)[]
  visitingHeroId: string | null
  fortLevel: number
  mageGuildLevel: number
}

// --- Resources & Economy ---
export interface ResourceBundle {
  gold: number
  wood: number
  ore: number
  crystals: number
  gems: number
  mercury: number
  sulfur: number
}

export const EMPTY_RESOURCES: ResourceBundle = {
  gold: 0, wood: 0, ore: 0, crystals: 0, gems: 0, mercury: 0, sulfur: 0,
}

export type ResourceType = keyof ResourceBundle

export interface ResourceMine {
  id: string
  resourceType: ResourceType
  x: number
  y: number
  owner: number | null      // null = neutral
  incomePerDay?: number
  guardArmy: (CreatureStack | null)[] | null
}

export interface TreasureCache {
  id: string
  x: number
  y: number
  resources: Partial<ResourceBundle>
  artifactId: ArtifactId | null
  collected: boolean
}

// --- Map Objects ---
export type MapObjectType =
  | 'town'
  | 'mine'
  | 'treasure'
  | 'artifact_pickup'
  | 'neutral_army'
  | 'wandering_army'
  | 'shrine'
  | 'well'
  | 'fountain'
  | 'temple'
  | 'learning_stone'
  | 'obelisk'
  | 'portal'
  | 'tavern'
  | 'den'
  | 'arena'
  | 'witch_hut'
  | 'garden'
  | 'windmill'
  | 'quest_hut'
  | 'dragon_utopia'
  | 'prison'
  | 'refugee_camp'

export interface MapObject {
  id: string
  type: MapObjectType
  x: number
  y: number
  army?: (CreatureStack | null)[] | null
  data: GameConfig
  visited: boolean | Record<number, boolean>
}

// --- Combat ---
export interface CombatState {
  stacks: CombatStack[]
  activeStackIndex: number
  phase: 'action' | 'spell_target' | 'done'
  round: number
  winner: 'attacker' | 'defender' | 'draw' | null
  finished: boolean
  attackerHeroId: string | null
  defenderHeroId: string | null
  spellTargeting: SpellId | null
  log: string[]
  obstacles: Pos[]
  siege: SiegeState | null
}

export interface SiegeState {
  wallHP: number[]
  towerHP: number[]
  gateHP: number
  gateOpen: boolean
  moatActive: boolean
}

// --- Turn System ---
export interface TurnState {
  currentPlayer: number
  day: number
  week: number
  month: number
  phase: 'hero_move' | 'town_manage' | 'combat' | 'end_turn'
}

// --- AI ---
export type AIDifficulty = 'easy' | 'normal' | 'hard' | 'expert'

export interface AIPlayerState {
  playerIndex: number
  difficulty: AIDifficulty
  targetTownId: string | null
  targetHeroId: string | null
  exploredTiles: Set<string>
}

// --- Diplomacy & Trade ---
export interface TradeOffer {
  fromPlayer: number
  toPlayer: number
  offering: Partial<ResourceBundle>
  requesting: Partial<ResourceBundle>
  accepted: boolean | null
}

// --- Full Game State ---
export interface GameState {
  map: WorldMap
  heroes: Hero[]
  towns: Town[]
  mines: ResourceMine[]
  treasures: TreasureCache[]
  mapObjects: MapObject[]
  resources: ResourceBundle[]
  coins: number[]
  metaGems: number[]
  stars: number[]
  turn: TurnState
  combat: CombatState | null
  activeTownId: string | null
  activeHeroId: string | null
  winner: number | null
  aiStates: AIPlayerState[]
  mode: 'conquest' | 'coop-campaign' | 'vs-skirmish' | 'king-of-hill' | 'treasure-hunt' | 'survival'
  difficulty: AIDifficulty
  humanCount: number
  totalPlayers: number
  mapSize: 'small' | 'medium' | 'large'
  trades: TradeOffer[]
  eventLog: string[]
  /** Pending level-up choices for hero (null = no pending) */
  pendingLevelUp: { heroId: string; choices: LevelUpChoice[] } | null
  /** Combat speed multiplier (1 = normal, 2 = fast, 0 = instant) */
  combatSpeed: number
}

// --- Game Setup ---
export interface PlayerSetupSlot {
  type: 'human' | 'ai' | 'closed'
  name: string
  faction: FactionId
  color: string
  difficulty?: AIDifficulty
}

export interface GameSetupConfig {
  players: PlayerSetupSlot[]
  mapSize: 'small' | 'medium' | 'large'
  gameMode: GameState['mode'] | 'campaign'
  campaignId?: string
  scenarioIndex?: number
  difficulty: AIDifficulty
  seed: number
}

// --- Component Props ---
export interface GameProps {
  players: import('../../pages/games/mini/types').PlayerSlot[]
  config?: GameConfig
  onBack: () => void
}
