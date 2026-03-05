/**
 * items.ts — Artifacts & equipment system.
 *
 * 50+ artifacts across 5 rarity tiers, fitting into hero equipment slots.
 * Slot types: helmet, armor, weapon, shield, boots, ring×2, amulet, cloak, misc×4
 */
import type { ArtifactDef, HeroEquipment } from './types'

// ─── COMMON artifacts (plentiful, small bonuses) ─────────────
const COMMON: ArtifactDef[] = [
  { id: 'helm_awareness',     name: 'Helm of Awareness',       slot: 'helmet', rarity: 'common', cost: 500,   effects: { defense: 1 },              description: '+1 Defense' },
  { id: 'shield_courage',     name: 'Shield of Courage',       slot: 'shield', rarity: 'common', cost: 500,   effects: { defense: 1, morale: 1 },   description: '+1 Defense, +1 Morale' },
  { id: 'sword_might',        name: 'Sword of Might',          slot: 'weapon', rarity: 'common', cost: 500,   effects: { attack: 1 },               description: '+1 Attack' },
  { id: 'boots_speed',        name: 'Boots of Speed',          slot: 'boots',  rarity: 'common', cost: 600,   effects: { movementPoints: 3 },       description: '+3 Movement points' },
  { id: 'ring_life',          name: 'Ring of Life',            slot: 'ring1',  rarity: 'common', cost: 400,   effects: { morale: 1 },               description: '+1 Morale' },
  { id: 'ring_luck',          name: 'Clover Ring',             slot: 'ring2',  rarity: 'common', cost: 400,   effects: { luck: 1 },                 description: '+1 Luck' },
  { id: 'amulet_mana',        name: 'Mystic Amulet',           slot: 'amulet', rarity: 'common', cost: 500,   effects: { manaBonus: 5 },            description: '+5 Max Mana' },
  { id: 'cloak_shadows',      name: "Rogue's Cloak",           slot: 'cloak',  rarity: 'common', cost: 500,   effects: { defense: 1, luck: 1 },     description: '+1 Defense, +1 Luck' },
  { id: 'pendant_courage',    name: 'Pendant of Courage',      slot: 'misc1',  rarity: 'common', cost: 300,   effects: { morale: 1 },               description: '+1 Morale' },
  { id: 'lucky_horseshoe',    name: 'Lucky Horseshoe',         slot: 'misc2',  rarity: 'common', cost: 300,   effects: { luck: 1 },                 description: '+1 Luck' },
]

// ─── UNCOMMON artifacts ──────────────────────────────────────
const UNCOMMON: ArtifactDef[] = [
  { id: 'helm_thunder',       name: 'Helm of Thunder',         slot: 'helmet', rarity: 'uncommon', cost: 1500,  effects: { attack: 2, defense: 1 },   description: '+2 Attack, +1 Defense' },
  { id: 'breastplate_iron',   name: 'Breastplate of Iron',     slot: 'armor',  rarity: 'uncommon', cost: 1500,  effects: { defense: 3 },              description: '+3 Defense' },
  { id: 'sword_fire',         name: 'Flaming Sword',           slot: 'weapon', rarity: 'uncommon', cost: 1800,  effects: { attack: 2, spellPower: 1 }, description: '+2 Attack, +1 Spell Power' },
  { id: 'shield_guardian',    name: "Guardian's Shield",       slot: 'shield', rarity: 'uncommon', cost: 1200,  effects: { defense: 2, morale: 1 },   description: '+2 Defense, +1 Morale' },
  { id: 'greaves_haste',      name: 'Greaves of Haste',        slot: 'boots',  rarity: 'uncommon', cost: 1500,  effects: { movementPoints: 5 },       description: '+5 Movement points' },
  { id: 'ring_magi',          name: "Magi's Ring",             slot: 'ring1',  rarity: 'uncommon', cost: 1200,  effects: { spellPower: 2 },           description: '+2 Spell Power' },
  { id: 'ring_conjuring',     name: 'Ring of Conjuring',       slot: 'ring2',  rarity: 'uncommon', cost: 1000,  effects: { manaBonus: 10 },           description: '+10 Max Mana' },
  { id: 'amulet_negation',    name: 'Amulet of Negation',      slot: 'amulet', rarity: 'uncommon', cost: 1200,  effects: { knowledge: 2 },            description: '+2 Knowledge' },
  { id: 'cloak_undead_king',  name: "Undead King's Cloak",     slot: 'cloak',  rarity: 'uncommon', cost: 1500,  effects: { spellPower: 1, knowledge: 1 }, description: '+1 Spell Power & Knowledge' },
  { id: 'war_horn',           name: 'War Horn',                slot: 'misc1',  rarity: 'uncommon', cost: 800,   effects: { morale: 2 },               description: '+2 Morale' },
  { id: 'charm_fortune',      name: 'Charm of Fortune',        slot: 'misc2',  rarity: 'uncommon', cost: 800,   effects: { luck: 2 },                 description: '+2 Luck' },
]

// ─── RARE artifacts ──────────────────────────────────────────
const RARE: ArtifactDef[] = [
  { id: 'helm_heavenly',      name: 'Helm of Heavenly Light',  slot: 'helmet', rarity: 'rare', cost: 4000,   effects: { attack: 2, defense: 2, morale: 1 }, description: '+2 Attack, +2 Defense, +1 Morale' },
  { id: 'dragon_scale',       name: 'Dragon Scale Armor',      slot: 'armor',  rarity: 'rare', cost: 5000,   effects: { defense: 5, spellPower: 2 },       description: '+5 Defense, +2 Spell Power' },
  { id: 'sword_judgement',    name: 'Sword of Judgement',       slot: 'weapon', rarity: 'rare', cost: 5000,   effects: { attack: 5, morale: 1 },            description: '+5 Attack, +1 Morale' },
  { id: 'shield_damned',      name: 'Shield of the Damned',    slot: 'shield', rarity: 'rare', cost: 3500,   effects: { defense: 4, luck: -1 },            description: '+4 Defense, -1 Luck (cursed)' },
  { id: 'boots_levitation',   name: 'Boots of Levitation',     slot: 'boots',  rarity: 'rare', cost: 3000,   effects: { movementPoints: 6 },               description: '+6 Movement, can cross water' },
  { id: 'ring_wayfarer',      name: "Wayfarer's Ring",         slot: 'ring1',  rarity: 'rare', cost: 3000,   effects: { movementPoints: 4, luck: 1 },      description: '+4 Movement, +1 Luck' },
  { id: 'amulet_undertaker',  name: "Necromancer's Amulet",    slot: 'amulet', rarity: 'rare', cost: 4000,   effects: { spellPower: 3, knowledge: 2 },     description: '+3 Spell Power, +2 Knowledge' },
  { id: 'cape_velocity',      name: 'Cape of Velocity',        slot: 'cloak',  rarity: 'rare', cost: 3500,   effects: { attack: 2, movementPoints: 4 },    description: '+2 Attack, +4 Movement' },
  { id: 'golden_goose',       name: 'Golden Goose',            slot: 'misc3',  rarity: 'rare', cost: 5000,   effects: { incomeGold: 500 },                 description: '+500 Gold per day' },
]

// ─── EPIC artifacts ──────────────────────────────────────────
const EPIC: ArtifactDef[] = [
  { id: 'crown_supreme',      name: 'Crown of the Supreme Magi', slot: 'helmet', rarity: 'epic', cost: 10000, effects: { spellPower: 4, knowledge: 4, manaBonus: 20 }, description: '+4 SP, +4 Knowledge, +20 Mana' },
  { id: 'titans_cuirass',     name: "Titan's Cuirass",          slot: 'armor',  rarity: 'epic', cost: 12000, effects: { defense: 6, attack: 3 },          description: '+6 Defense, +3 Attack' },
  { id: 'angelic_sword',      name: 'Angelic Alliance Sword',   slot: 'weapon', rarity: 'epic', cost: 15000, effects: { attack: 6, morale: 2, luck: 2 }, description: '+6 Attack, +2 Morale & Luck' },
  { id: 'thunder_shield',     name: 'Thunder Shield',           slot: 'shield', rarity: 'epic', cost: 8000,  effects: { defense: 5, spellDamagePercent: 15 }, description: '+5 Defense, +15% Spell Damage' },
  { id: 'sandals_saint',      name: "Sandals of the Saint",     slot: 'boots',  rarity: 'epic', cost: 10000, effects: { movementPoints: 8, morale: 2 },  description: '+8 Movement, +2 Morale' },
  { id: 'ring_infinite',      name: 'Ring of Infinite Gems',    slot: 'ring1',  rarity: 'epic', cost: 8000,  effects: { knowledge: 3, manaBonus: 15 },   description: '+3 Knowledge, +15 Mana' },
  { id: 'orb_firmament',      name: 'Orb of the Firmament',     slot: 'misc4',  rarity: 'epic', cost: 9000,  effects: { spellDamagePercent: 25 },        description: '+25% Spell Damage' },
]

// ─── LEGENDARY artifacts ─────────────────────────────────────
const LEGENDARY: ArtifactDef[] = [
  { id: 'grail_valor',        name: 'Holy Grail of Valor',      slot: 'misc1',  rarity: 'legendary', cost: 50000, effects: { attack: 5, defense: 5, morale: 3, luck: 3, movementPoints: 10 }, description: 'The legendary Grail — massive stat boost' },
  { id: 'armor_wonder',       name: 'Armor of Wonder',          slot: 'armor',  rarity: 'legendary', cost: 30000, effects: { attack: 4, defense: 8, spellPower: 2, knowledge: 2 }, description: 'All stats up: +4 Atk, +8 Def, +2 SP, +2 Know' },
  { id: 'blade_armageddon',   name: 'Armageddon Blade',         slot: 'weapon', rarity: 'legendary', cost: 40000, effects: { attack: 8, spellPower: 4, spellDamagePercent: 30 }, description: '+8 Attack, +4 SP, +30% Spell Dmg' },
  { id: 'cloak_king',         name: "Cloak of the Undead King",  slot: 'cloak',  rarity: 'legendary', cost: 25000, effects: { defense: 4, spellPower: 4, creatureDamagePercent: 20 }, description: '+4 Def, +4 SP, +20% Creature Dmg' },
  { id: 'tome_elements',      name: 'Tome of the Elements',     slot: 'misc2',  rarity: 'legendary', cost: 35000, effects: { spellPower: 6, knowledge: 6, manaBonus: 30 }, description: '+6 SP, +6 Knowledge, +30 Mana — master of all magic' },
]

// ─── All Artifacts Index ─────────────────────────────────────
export const ALL_ARTIFACTS: Record<string, ArtifactDef> = {}
for (const a of [...COMMON, ...UNCOMMON, ...RARE, ...EPIC, ...LEGENDARY]) {
  ALL_ARTIFACTS[a.id] = a
}

export function getArtifactsByRarity(rarity: string): ArtifactDef[] {
  return Object.values(ALL_ARTIFACTS).filter(a => a.rarity === rarity)
}

export function getArtifactsBySlot(slot: string): ArtifactDef[] {
  return Object.values(ALL_ARTIFACTS).filter(a => a.slot === slot)
}

/** Get total stat bonuses from a hero's equipment loadout */
export function calcEquipmentBonuses(equipment: HeroEquipment): {
  attack: number; defense: number; spellPower: number; knowledge: number
  morale: number; luck: number; movementPoints: number; manaBonus: number
  spellDamagePercent: number; creatureDamagePercent: number; incomeGold: number
} {
  const totals = {
    attack: 0, defense: 0, spellPower: 0, knowledge: 0,
    morale: 0, luck: 0, movementPoints: 0, manaBonus: 0,
    spellDamagePercent: 0, creatureDamagePercent: 0, incomeGold: 0,
  }

  const equipmentIds = Object.values(equipment) as (string | null)[]
  for (const id of equipmentIds) {
    if (!id) continue
    const art = ALL_ARTIFACTS[id]
    if (!art) continue
    const e = art.effects
    if (e.attack) totals.attack += e.attack
    if (e.defense) totals.defense += e.defense
    if (e.spellPower) totals.spellPower += e.spellPower
    if (e.knowledge) totals.knowledge += e.knowledge
    if (e.morale) totals.morale += e.morale
    if (e.luck) totals.luck += e.luck
    if (e.movementPoints) totals.movementPoints += e.movementPoints
    if (e.manaBonus) totals.manaBonus += e.manaBonus
    if (e.spellDamagePercent) totals.spellDamagePercent += e.spellDamagePercent
    if (e.creatureDamagePercent) totals.creatureDamagePercent += e.creatureDamagePercent
    if (e.incomeGold) totals.incomeGold += e.incomeGold
  }

  return totals
}

/** Pick a random artifact matching rarity weights for treasure placement */
export function pickRandomArtifact(maxRarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'): ArtifactDef {
  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary']
  const maxIdx = rarityOrder.indexOf(maxRarity)
  const pool = Object.values(ALL_ARTIFACTS).filter(a => rarityOrder.indexOf(a.rarity) <= maxIdx)
  // Weighted towards lower rarities
  const weights = pool.map(a => {
    const ri = rarityOrder.indexOf(a.rarity)
    return Math.pow(2, maxIdx - ri) // common=16, uncommon=8, rare=4, epic=2, legendary=1
  })
  const total = weights.reduce((s, w) => s + w, 0)
  let roll = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}
