/**
 * campaigns.ts — 3 pre-built campaigns scaled by player count.
 *
 * Each campaign supports cooperation and PvP independently of the main objective,
 * meaning players CAN cooperate and CAN fight each other in every campaign.
 * The objective is independent from diplomacy.
 */
import type { FactionId, AIDifficulty } from './types'

// ─── Types ───────────────────────────────────────────────────
export interface CampaignObjective {
  type: 'capture_all_towns' | 'defeat_hero' | 'survive_weeks'
       | 'collect_gold' | 'find_grail' | 'build_capitol' | 'control_mines'
  target: number | string
  description: string
  optional: boolean
}

export interface CampaignScenario {
  id: string
  name: string
  briefing: string
  mapSize: 'small' | 'medium' | 'large'
  playerFactions: FactionId[]   // forced factions for each player slot
  aiFactions: FactionId[]       // AI opponent factions
  aiDifficulty: AIDifficulty
  objectives: CampaignObjective[]
  bonusGold: number
  bonusResources?: Partial<Record<string, number>>
  timeLimitWeeks?: number       // 0 = unlimited
  specialRules: string[]
}

export interface CampaignDef {
  id: string
  name: string
  description: string
  playerRange: { min: number; max: number }
  difficulty: 'easy' | 'medium' | 'hard'
  scenarios: CampaignScenario[]
  /** Players can cooperate (share vision, resources) */
  coopAllowed: boolean
  /** Players can attack each other */
  pvpAllowed: boolean
}

// ═══════════════════════════════════════════════════════════════
//  CAMPAIGN 1: "The Last Kingdom" — 1 Player
// ═══════════════════════════════════════════════════════════════
const CAMPAIGN_LAST_KINGDOM: CampaignDef = {
  id: 'last_kingdom',
  name: 'The Last Kingdom',
  description:
    'A solo campaign. Your Castle kingdom is under siege from multiple factions. ' +
    'Survive, rebuild, and reclaim the realm across 3 escalating scenarios.',
  playerRange: { min: 1, max: 1 },
  difficulty: 'medium',
  coopAllowed: false,
  pvpAllowed: false,
  scenarios: [
    {
      id: 'lk_s1',
      name: 'Chapter 1: The Fall',
      briefing:
        'Demons have crossed the border. Your villages burn. Gather what forces you can, ' +
        'fortify your town, and survive 8 weeks until reinforcements arrive.',
      mapSize: 'small',
      playerFactions: ['castle'],
      aiFactions: ['inferno'],
      aiDifficulty: 'normal',
      objectives: [
        { type: 'survive_weeks', target: 8, description: 'Survive for 8 weeks', optional: false },
        { type: 'collect_gold', target: 10000, description: 'Amass 10,000 gold', optional: true },
      ],
      bonusGold: 2000,
      timeLimitWeeks: 0,
      specialRules: ['Enemy spawns extra armies every 3 weeks'],
    },
    {
      id: 'lk_s2',
      name: 'Chapter 2: Reclamation',
      briefing:
        'Reinforcements have arrived. Push back the demonic invasion and reclaim ' +
        'the fallen towns. The Necropolis watches from the shadows…',
      mapSize: 'medium',
      playerFactions: ['castle'],
      aiFactions: ['inferno', 'necropolis'],
      aiDifficulty: 'normal',
      objectives: [
        { type: 'capture_all_towns', target: 0, description: 'Capture all enemy towns', optional: false },
        { type: 'build_capitol', target: 0, description: 'Build a Capitol in your town', optional: true },
      ],
      bonusGold: 5000,
      bonusResources: { wood: 20, ore: 20 },
      timeLimitWeeks: 0,
      specialRules: ['Necropolis raises dead from battlefields'],
    },
    {
      id: 'lk_s3',
      name: 'Chapter 3: The Crown',
      briefing:
        'The Dungeon Lord and the Demon King have formed an unholy alliance. ' +
        'Find the Holy Grail and use its power to destroy them once and for all.',
      mapSize: 'large',
      playerFactions: ['castle'],
      aiFactions: ['inferno', 'dungeon', 'necropolis'],
      aiDifficulty: 'hard',
      objectives: [
        { type: 'find_grail', target: 0, description: 'Find and use the Holy Grail', optional: false },
        { type: 'capture_all_towns', target: 0, description: 'Eliminate all enemies', optional: false },
      ],
      bonusGold: 8000,
      bonusResources: { wood: 30, ore: 30, crystals: 10, gems: 10 },
      timeLimitWeeks: 0,
      specialRules: ['Grail hidden at a random obelisk location', 'Enemies form alliances'],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
//  CAMPAIGN 2: "Brothers in Arms" — 2 Players
// ═══════════════════════════════════════════════════════════════
const CAMPAIGN_BROTHERS: CampaignDef = {
  id: 'brothers_in_arms',
  name: 'Brothers in Arms',
  description:
    'A 2-player campaign. Two heroes from different factions discover a common enemy. ' +
    'Cooperate to survive — or betray each other for glory. The objective is independent ' +
    'from your relationship: you may fight each other, yet still both work toward the goal.',
  playerRange: { min: 2, max: 2 },
  difficulty: 'medium',
  coopAllowed: true,
  pvpAllowed: true,
  scenarios: [
    {
      id: 'ba_s1',
      name: 'Chapter 1: Unlikely Allies',
      briefing:
        'A Castle knight and a Rampart ranger discover Wilds beasts raiding both their lands. ' +
        'Control 5 resource mines between you to starve the beasts. ' +
        'You may share spoils — or compete for them.',
      mapSize: 'medium',
      playerFactions: ['castle', 'rampart'],
      aiFactions: ['wilds', 'wilds'],
      aiDifficulty: 'normal',
      objectives: [
        { type: 'control_mines', target: 5, description: 'Control at least 5 mines (combined)', optional: false },
        { type: 'defeat_hero', target: 'enemy', description: 'Defeat all enemy heroes', optional: true },
      ],
      bonusGold: 3000,
      timeLimitWeeks: 0,
      specialRules: ['Wilds spawn extra armies from forests each week'],
    },
    {
      id: 'ba_s2',
      name: 'Chapter 2: The Dark Pact',
      briefing:
        'The Wilds were just pawns. Necropolis and Dungeon forces emerge! ' +
        'Survive 12 weeks together — or one of you may fall and the other must carry on alone.',
      mapSize: 'large',
      playerFactions: ['castle', 'rampart'],
      aiFactions: ['necropolis', 'dungeon'],
      aiDifficulty: 'hard',
      objectives: [
        { type: 'survive_weeks', target: 12, description: 'Survive 12 weeks (at least 1 player)', optional: false },
        { type: 'collect_gold', target: 30000, description: 'Accumulate 30,000 gold combined', optional: true },
      ],
      bonusGold: 5000,
      bonusResources: { crystals: 5, gems: 5 },
      timeLimitWeeks: 0,
      specialRules: ['Players share vision', 'Dead player can be revived at a prison'],
    },
    {
      id: 'ba_s3',
      name: 'Chapter 3: Who Takes the Crown?',
      briefing:
        'The enemy is beaten — but the realm needs a ruler. ' +
        'Capture all remaining towns to claim the throne. ' +
        'You can share power… or seize it for yourself.',
      mapSize: 'large',
      playerFactions: ['castle', 'rampart'],
      aiFactions: ['inferno'],
      aiDifficulty: 'normal',
      objectives: [
        { type: 'capture_all_towns', target: 0, description: 'One player holds all towns — or share them equally', optional: false },
      ],
      bonusGold: 3000,
      timeLimitWeeks: 20,
      specialRules: ['Timer: conflict must resolve within 20 weeks', 'Tied towns = shared victory'],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
//  CAMPAIGN 3: "War of the Crowns" — 3-4 Players
// ═══════════════════════════════════════════════════════════════
const CAMPAIGN_WAR_CROWNS: CampaignDef = {
  id: 'war_of_crowns',
  name: 'War of the Crowns',
  description:
    'A 3-4 player campaign. Multiple kingdoms vie for the same realm. ' +
    'Form alliances, break them, trade, or go all-out war. ' +
    'Objectives are faction-independent — all players have the same goals.',
  playerRange: { min: 3, max: 4 },
  difficulty: 'hard',
  coopAllowed: true,
  pvpAllowed: true,
  scenarios: [
    {
      id: 'wc_s1',
      name: 'Chapter 1: Land Rush',
      briefing:
        'A new continent has been discovered. All factions race to establish dominion. ' +
        'Claim as much territory as you can. Build a Capitol first to win — ' +
        'or prevent others from building theirs.',
      mapSize: 'large',
      playerFactions: ['castle', 'tower', 'inferno', 'dungeon'],
      aiFactions: ['wilds'],
      aiDifficulty: 'easy',
      objectives: [
        { type: 'build_capitol', target: 0, description: 'Be the first to build a Capitol', optional: false },
        { type: 'control_mines', target: 8, description: 'Control 8+ mines', optional: true },
      ],
      bonusGold: 2000,
      timeLimitWeeks: 0,
      specialRules: ['Wild beasts guard the center of the map', 'First Capitol built triggers 4-week countdown'],
    },
    {
      id: 'wc_s2',
      name: 'Chapter 2: The Great War',
      briefing:
        'The Wild Dragon has awakened and threatens all kingdoms. ' +
        'Defeat the dragon together — but the one who lands the killing blow claims the treasure. ' +
        'Or let others weaken it and swoop in at the last moment.',
      mapSize: 'large',
      playerFactions: ['castle', 'rampart', 'tower', 'necropolis'],
      aiFactions: ['wilds', 'wilds'],
      aiDifficulty: 'hard',
      objectives: [
        { type: 'defeat_hero', target: 'dragon_boss', description: 'Defeat the Wild Dragon boss', optional: false },
        { type: 'collect_gold', target: 20000, description: 'Have 20,000 gold when dragon falls', optional: true },
      ],
      bonusGold: 4000,
      bonusResources: { wood: 15, ore: 15 },
      timeLimitWeeks: 16,
      specialRules: ['Dragon boss appears at week 8 in map center', 'Dragon grows stronger each week'],
    },
    {
      id: 'wc_s3',
      name: 'Chapter 3: Final Reckoning',
      briefing:
        'Only one faction can rule. Capture every enemy town or be the last one standing. ' +
        'Alliances are fragile — trust wisely.',
      mapSize: 'large',
      playerFactions: ['castle', 'rampart', 'inferno', 'dungeon'],
      aiFactions: [],
      aiDifficulty: 'normal',
      objectives: [
        { type: 'capture_all_towns', target: 0, description: 'Eliminate all other players', optional: false },
      ],
      bonusGold: 5000,
      bonusResources: { wood: 20, ore: 20, crystals: 5, gems: 5, mercury: 3, sulfur: 3 },
      timeLimitWeeks: 0,
      specialRules: ['No AI opponents — pure PvP', 'Neutral armies are extra strong'],
    },
  ],
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

export const ALL_CAMPAIGNS: CampaignDef[] = [
  CAMPAIGN_LAST_KINGDOM,
  CAMPAIGN_BROTHERS,
  CAMPAIGN_WAR_CROWNS,
]

/** Get campaigns available for a given player count */
export function getCampaignsForPlayerCount(playerCount: number): CampaignDef[] {
  return ALL_CAMPAIGNS.filter(
    c => playerCount >= c.playerRange.min && playerCount <= c.playerRange.max
  )
}

/** Get campaign by ID */
export function getCampaignById(id: string): CampaignDef | undefined {
  return ALL_CAMPAIGNS.find(c => c.id === id)
}

/** Get the scenario for a campaign + scenario index */
export function getScenario(campaignId: string, scenarioIndex: number): CampaignScenario | undefined {
  const campaign = getCampaignById(campaignId)
  return campaign?.scenarios[scenarioIndex]
}
