/**
 * heroes.ts - Hero creation, leveling, skills, equipment management.
 */
import type {
  Hero, HeroClass, HeroEquipment, FactionId, SpellId, CreatureStack,
  LevelUpChoice,
} from './types'
import { HERO_START_STATS, XP_PER_LEVEL } from './constants'
import { getSpellsForGuildLevel } from './spells'
import { calcEquipmentBonuses } from './items'
import { ALL_CREATURES, getCreaturesForFaction } from './factions'

// =================================================================
//  SECONDARY SKILLS
// =================================================================
export interface SecondarySkillDef {
  id: string
  name: string
  description: string
  category: string
  levels: [string, string, string]
}

export const SECONDARY_SKILLS: SecondarySkillDef[] = [
  // -- Combat skills --
  { id: 'archery', name: 'Archery', category: 'combat', description: 'Increases ranged damage.',
    levels: ['+10% ranged dmg', '+25% ranged dmg', '+50% ranged dmg'] },
  { id: 'offense', name: 'Offense', category: 'combat', description: 'Increases melee damage.',
    levels: ['+10% melee dmg', '+20% melee dmg', '+30% melee dmg'] },
  { id: 'defense_skill', name: 'Defense', category: 'combat', description: 'Reduces damage taken.',
    levels: ['+5% less dmg', '+10% less dmg', '+20% less dmg'] },
  { id: 'armorer', name: 'Armorer', category: 'combat', description: 'Reduces damage to all troops.',
    levels: ['-5% dmg taken', '-10% dmg taken', '-15% dmg taken'] },
  { id: 'tactics', name: 'Tactics', category: 'combat', description: 'Greater deployment area in combat.',
    levels: ['+1 deployment row', '+2 deployment rows', '+3 deployment rows'] },
  { id: 'leadership', name: 'Leadership', category: 'combat', description: 'Boosts morale.',
    levels: ['+1 Morale', '+2 Morale', '+3 Morale'] },
  { id: 'luck_skill', name: 'Luck', category: 'combat', description: 'Boosts luck.',
    levels: ['+1 Luck', '+2 Luck', '+3 Luck'] },
  { id: 'resistance', name: 'Resistance', category: 'combat', description: 'Resists enemy spells.',
    levels: ['5% resist', '10% resist', '20% resist'] },
  // -- Magic skills --
  { id: 'fire_magic', name: 'Fire Magic', category: 'magic', description: 'Improves Fire school spells.',
    levels: ['Basic Fire', 'Advanced Fire', 'Expert Fire'] },
  { id: 'water_magic', name: 'Water Magic', category: 'magic', description: 'Improves Water school spells.',
    levels: ['Basic Water', 'Advanced Water', 'Expert Water'] },
  { id: 'earth_magic', name: 'Earth Magic', category: 'magic', description: 'Improves Earth school spells.',
    levels: ['Basic Earth', 'Advanced Earth', 'Expert Earth'] },
  { id: 'air_magic', name: 'Air Magic', category: 'magic', description: 'Improves Air school spells.',
    levels: ['Basic Air', 'Advanced Air', 'Expert Air'] },
  { id: 'wisdom', name: 'Wisdom', category: 'magic', description: 'Learn higher-level spells.',
    levels: ['Learn Lv3 spells', 'Learn Lv4 spells', 'Learn Lv5 spells'] },
  { id: 'intelligence', name: 'Intelligence', category: 'magic', description: 'Increases max mana.',
    levels: ['+25% mana', '+50% mana', '+100% mana'] },
  { id: 'scholar', name: 'Scholar', category: 'magic', description: 'Share spells when heroes meet.',
    levels: ['Share Lv1', 'Share Lv3', 'Share Lv5'] },
  { id: 'eagle_eye', name: 'Eagle Eye', category: 'magic', description: 'Chance to learn enemy spells after combat.',
    levels: ['20% chance Lv1-2', '30% chance Lv1-3', '40% chance Lv1-4'] },
  // -- Adventure skills --
  { id: 'logistics', name: 'Logistics', category: 'adventure', description: 'Increases movement on the map.',
    levels: ['+10% move', '+20% move', '+30% move'] },
  { id: 'pathfinding', name: 'Pathfinding', category: 'adventure', description: 'Reduces movement penalty for rough terrain.',
    levels: ['-25% penalty', '-50% penalty', '-75% penalty'] },
  { id: 'scouting', name: 'Scouting', category: 'adventure', description: 'Increases hero visibility range.',
    levels: ['+1 tile vision', '+2 tile vision', '+3 tile vision'] },
  { id: 'navigation', name: 'Navigation', category: 'adventure', description: 'Increases sea movement speed.',
    levels: ['+50% sea move', '+100% sea move', '+150% sea move'] },
  { id: 'necromancy', name: 'Necromancy', category: 'adventure', description: 'Raise skeletons from fallen enemies.',
    levels: ['10% of killed', '20% of killed', '30% of killed'] },
  { id: 'estates', name: 'Estates', category: 'adventure', description: 'Generates extra gold per day.',
    levels: ['+125 gold/day', '+250 gold/day', '+500 gold/day'] },
  { id: 'learning', name: 'Learning', category: 'adventure', description: 'Increases XP gain.',
    levels: ['+5% XP', '+10% XP', '+15% XP'] },
  { id: 'diplomacy', name: 'Diplomacy', category: 'adventure', description: 'Chance wandering creatures join you.',
    levels: ['Weak monsters join', 'Average join', 'Strong join'] },
]

export const ALL_SECONDARY_SKILLS: Record<string, SecondarySkillDef> =
  Object.fromEntries(SECONDARY_SKILLS.map(s => [s.id, s]))

// =================================================================
//  HERO CREATION
// =================================================================
let _nextHeroId = 1

const HERO_NAMES: Record<FactionId, string[]> = {
  castle:     ['Roland', 'Catherine', 'Sorsha', 'Christian', 'Tyris', 'Adelaide', 'Edric', 'Valeska'],
  rampart:    ['Clancy', 'Gem', 'Ivor', 'Mephala', 'Aeris', 'Alagar', 'Coronius', 'Elleshar'],
  tower:      ['Solmyr', 'Cyra', 'Iona', 'Josephine', 'Neela', 'Halon', 'Fafner', 'Dracon'],
  inferno:    ['Rashka', 'Calh', 'Xyron', 'Nymus', 'Olema', 'Pyre', 'Ignatius', 'Octavia'],
  necropolis: ['Sandro', 'Vidomina', 'Isra', 'Thant', 'Galthran', 'Moandor', 'Clavius', 'Nimbus'],
  dungeon:    ['Alamar', 'Deemer', 'Gunnar', 'Jeddite', 'Mutare', 'Arlach', 'Shakti', 'Synca'],
  wilds:      ['Grok', 'Shara', 'Fang', 'Zulgar', 'Brenna', 'Thorak', 'Kira', 'Mogur'],
}

const DEFAULT_CLASS: Record<FactionId, HeroClass> = {
  castle: 'knight', rampart: 'ranger', tower: 'wizard', inferno: 'demoniac',
  necropolis: 'necromancer', dungeon: 'warlock', wilds: 'beastmaster',
}

const emptyEquipment = (): HeroEquipment => ({
  helmet: null, armor: null, weapon: null, shield: null, boots: null,
  ring1: null, ring2: null, amulet: null, cloak: null,
  misc1: null, misc2: null, misc3: null, misc4: null,
})

export function createHero(
  faction: FactionId,
  owner: number,
  startX: number = 0,
  startY: number = 0,
  heroClass?: HeroClass,
  customName?: string,
): Hero {
  const cls = heroClass || DEFAULT_CLASS[faction]
  const stats = HERO_START_STATS[cls]
  const names = HERO_NAMES[faction]
  const name = customName || names[Math.floor(Math.random() * names.length)]

  // Starting army - 2 stacks of tier 1 creatures
  const fCreatures = getCreaturesForFaction(faction)
  const tier1 = fCreatures.find(c => c.tier === 1)!
  const startingArmy: (CreatureStack | null)[] = Array(7).fill(null)
  startingArmy[0] = {
    creatureId: tier1.id, count: tier1.growth * 3 + Math.floor(Math.random() * tier1.growth),
    statusEffects: [], morale: 0, luck: 0, hasActed: false, hasRetaliated: false, shotsLeft: tier1.shots,
  }

  const hero: Hero = {
    id: `hero_${_nextHeroId++}`,
    name,
    heroClass: cls,
    faction,
    owner,
    level: 1,
    experience: 0,
    attack: stats.attack,
    defense: stats.defense,
    spellPower: stats.spellPower,
    knowledge: stats.knowledge,
    mana: stats.knowledge * 10,
    maxMana: stats.knowledge * 10,
    movementPoints: 12,
    maxMovementPoints: 12,
    x: startX,
    y: startY,
    army: startingArmy,
    equipment: emptyEquipment(),
    spells: [],
    skills: [],
    alive: true,
    lastMoveTime: 0,
    garrisonedTownId: null,
  }
  return hero
}

// =================================================================
//  LEVELING UP
// =================================================================
export function getXpForLevel(level: number): number {
  if (level <= 0) return 0
  if (level <= XP_PER_LEVEL.length) return XP_PER_LEVEL[level - 1]
  return Math.floor(XP_PER_LEVEL[XP_PER_LEVEL.length - 1] * Math.pow(1.3, level - XP_PER_LEVEL.length))
}

export function canLevelUp(hero: Hero): boolean {
  return hero.experience >= getXpForLevel(hero.level + 1)
}

/** Generate two choices for level up - one primary stat + one secondary skill */
export function generateLevelUpChoices(hero: Hero): LevelUpChoice[] {
  const choices: LevelUpChoice[] = []

  // Primary stat choice (weighted by class)
  const isWarrior = ['knight', 'ranger', 'barbarian', 'overlord', 'demoniac', 'death_knight'].includes(hero.heroClass)
  const primaryStat = isWarrior
    ? (Math.random() < 0.6 ? 'attack' : (Math.random() < 0.5 ? 'defense' : 'spellPower'))
    : (Math.random() < 0.6 ? 'spellPower' : (Math.random() < 0.5 ? 'knowledge' : 'attack'))

  choices.push({
    type: 'primary',
    primaryStat: primaryStat as 'attack' | 'defense' | 'spellPower' | 'knowledge',
    primaryAmount: 1,
  })

  // Secondary skill choice
  const existingSkillIds = new Set(hero.skills.map(s => s.skillId))
  const existingUpgradable = hero.skills.filter(s => s.level < 3)
  const unlearnedSkills = SECONDARY_SKILLS.filter(s => !existingSkillIds.has(s.id))

  if (existingUpgradable.length > 0 && Math.random() < 0.5) {
    const pick = existingUpgradable[Math.floor(Math.random() * existingUpgradable.length)]
    choices.push({
      type: 'secondary',
      secondarySkillId: pick.skillId,
      secondaryLevel: pick.level + 1,
    })
  } else if (unlearnedSkills.length > 0 && hero.skills.length < 8) {
    const pick = unlearnedSkills[Math.floor(Math.random() * unlearnedSkills.length)]
    choices.push({
      type: 'secondary',
      secondarySkillId: pick.id,
      secondaryLevel: 1,
    })
  }

  return choices
}

/** Apply a level up choice to the hero */
export function applyLevelUp(hero: Hero, choice: LevelUpChoice): Hero {
  const h = { ...hero, level: hero.level + 1 }

  if (choice.type === 'primary') {
    h[choice.primaryStat] = (h[choice.primaryStat] as number) + (choice.primaryAmount || 1)
    if (choice.primaryStat === 'knowledge') {
      h.maxMana = h.knowledge * 10
      h.mana = Math.min(h.mana + 10, h.maxMana)
    }
  }

  if (choice.type === 'secondary') {
    const existing = h.skills.find(s => s.skillId === choice.secondarySkillId)
    if (existing) {
      h.skills = h.skills.map(s =>
        s.skillId === choice.secondarySkillId
          ? { ...s, level: choice.secondaryLevel || (s.level + 1) }
          : s
      )
    } else {
      const def = ALL_SECONDARY_SKILLS[choice.secondarySkillId]
      h.skills = [...h.skills, { skillId: choice.secondarySkillId, name: def?.name || choice.secondarySkillId, level: 1 }]
    }
  }

  return h
}

// =================================================================
//  HERO STAT CALCULATIONS
// =================================================================

/** Get total hero stats including base + equipment bonuses */
export function getEffectiveStats(hero: Hero) {
  const eqBonus = calcEquipmentBonuses(hero.equipment)
  return {
    attack: hero.attack + eqBonus.attack,
    defense: hero.defense + eqBonus.defense,
    spellPower: hero.spellPower + eqBonus.spellPower,
    knowledge: hero.knowledge + eqBonus.knowledge,
    morale: eqBonus.morale,
    luck: eqBonus.luck,
    maxMana: (hero.knowledge + eqBonus.knowledge) * 10,
    movementBonus: eqBonus.movementPoints,
  }
}

/** Get secondary skill level (0 if not learned) */
export function getSkillLevel(hero: Hero, skillId: string): number {
  const sk = hero.skills.find(s => s.skillId === skillId)
  return sk ? sk.level : 0
}

/** Calculate hero's total movement points considering skills + equipment */
export function calcMovementPoints(hero: Hero): number {
  const base = hero.maxMovementPoints
  const { movementBonus } = getEffectiveStats(hero)
  const logisticsLevel = getSkillLevel(hero, 'logistics')
  const logisticsMulti = logisticsLevel === 0 ? 1 : 1 + logisticsLevel * 0.10
  return Math.floor((base + movementBonus) * logisticsMulti)
}

/** Calculate hero's vision range for fog of war */
export function calcVisionRange(hero: Hero): number {
  const base = 5
  const scoutingLevel = getSkillLevel(hero, 'scouting')
  return base + scoutingLevel
}

/** Calculate XP to award after a combat victory */
export function calcCombatXP(defeatedArmyValue: number, _heroLevel: number): number {
  const learningLevel = 0
  const learningBonus = 1 + learningLevel * 0.05
  return Math.floor(defeatedArmyValue * learningBonus)
}

/** Check what spells the hero can learn from a mage guild level */
export function getLearnableSpells(hero: Hero, mageGuildLevel: number): SpellId[] {
  const wisdomLevel = getSkillLevel(hero, 'wisdom')
  const maxSpellLevel = Math.min(mageGuildLevel, wisdomLevel === 0 ? 2 : wisdomLevel + 2)
  const available = getSpellsForGuildLevel(maxSpellLevel)
  const knownSet = new Set(hero.spells)
  return available.filter(s => !knownSet.has(s.id)).map(s => s.id)
}

/** Get army power value for AI and display */
export function calcArmyPower(army: (CreatureStack | null)[]): number {
  let power = 0
  for (const stack of army) {
    if (!stack) continue
    const def = ALL_CREATURES[stack.creatureId]
    if (!def) continue
    const unitPower = def.hp + (def.attack + def.defense) * 2 + (def.minDmg + def.maxDmg) + def.speed
    power += unitPower * stack.count
  }
  return power
}

/** Reset hero's daily values at start of the day */
export function resetHeroDaily(hero: Hero): Hero {
  return {
    ...hero,
    movementPoints: calcMovementPoints(hero),
    mana: Math.min(hero.mana + hero.knowledge, hero.maxMana),
  }
}
