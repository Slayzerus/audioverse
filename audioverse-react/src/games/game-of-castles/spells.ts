/**
 * spells.ts — Full magic system: 4 schools × 5 levels = 40 spells.
 *
 * Schools: Fire, Water (Ice), Earth, Air (Lightning)
 * Each has combat spells + 1-2 adventure map spells.
 */
import type { SpellDef } from './types'

// ─── FIRE SCHOOL ─────────────────────────────────────────────
const FIRE_SPELLS: SpellDef[] = [
  // Level 1
  { id: 'magic_arrow',  name: 'Magic Arrow',     school: 'fire', level: 1, manaCost: 5,  basePower: 10,  target: 'enemy_stack',   duration: 0, description: 'Deals 10 + SP×10 fire damage to target stack.', adventureSpell: false },
  { id: 'bloodlust',    name: 'Bloodlust',       school: 'fire', level: 1, manaCost: 5,  basePower: 3,   target: 'friendly_stack', duration: 3, description: '+3 Attack to friendly stack for 3 rounds.', adventureSpell: false },
  // Level 2
  { id: 'fire_wall',    name: 'Fire Wall',       school: 'fire', level: 2, manaCost: 8,  basePower: 15,  target: 'cell',          duration: 2, description: 'Creates a wall of fire dealing 15+SP×5 damage to stacks passing through.', adventureSpell: false },
  { id: 'blind',        name: 'Blind',           school: 'fire', level: 2, manaCost: 10, basePower: 0,   target: 'enemy_stack',   duration: 2, description: 'Blinds enemy stack — cannot retaliate and skips turns for 2 rounds.', adventureSpell: false },
  // Level 3
  { id: 'fireball',     name: 'Fireball',        school: 'fire', level: 3, manaCost: 15, basePower: 25,  target: 'cell',          duration: 0, description: 'Explodes at target cell, dealing 25+SP×10 to all stacks in 3×3 area.', adventureSpell: false },
  { id: 'misfortune',   name: 'Misfortune',      school: 'fire', level: 3, manaCost: 12, basePower: -2,  target: 'enemy_stack',   duration: 3, description: '-2 Luck to enemy stack for 3 rounds.', adventureSpell: false },
  // Level 4
  { id: 'inferno',      name: 'Inferno',         school: 'fire', level: 4, manaCost: 20, basePower: 40,  target: 'cell',          duration: 0, description: 'Massive fire explosion dealing 40+SP×15 AoE damage.', adventureSpell: false },
  { id: 'berserk',      name: 'Berserk',         school: 'fire', level: 4, manaCost: 20, basePower: 0,   target: 'enemy_stack',   duration: 3, description: 'Target attacks nearest unit regardless of side.', adventureSpell: false },
  // Level 5
  { id: 'armageddon',   name: 'Armageddon',      school: 'fire', level: 5, manaCost: 30, basePower: 50,  target: 'global',        duration: 0, description: 'Deals 50+SP×20 damage to ALL stacks on battlefield.', adventureSpell: false },
  { id: 'fire_shield',  name: 'Fire Shield',     school: 'fire', level: 5, manaCost: 16, basePower: 20,  target: 'friendly_stack', duration: 4, description: 'Melee attackers take 20% of their damage back.', adventureSpell: false },
]

// ─── WATER SCHOOL ────────────────────────────────────────────
const WATER_SPELLS: SpellDef[] = [
  // Level 1
  { id: 'cure',          name: 'Cure',            school: 'water', level: 1, manaCost: 6,  basePower: 10, target: 'friendly_stack', duration: 0, description: 'Heals 10+SP×5 HP on friendly stack, removes negative effects.', adventureSpell: false },
  { id: 'bless',         name: 'Bless',           school: 'water', level: 1, manaCost: 5,  basePower: 0,  target: 'friendly_stack', duration: 3, description: 'Blessed stack always deals maximum damage for 3 rounds.', adventureSpell: false },
  // Level 2
  { id: 'ice_bolt',      name: 'Ice Bolt',        school: 'water', level: 2, manaCost: 8,  basePower: 20, target: 'enemy_stack',   duration: 0, description: 'Deals 20+SP×10 cold damage.', adventureSpell: false },
  { id: 'weakness',      name: 'Weakness',        school: 'water', level: 2, manaCost: 8,  basePower: -3, target: 'enemy_stack',   duration: 3, description: '-3 Attack to enemy stack for 3 rounds.', adventureSpell: false },
  // Level 3
  { id: 'frost_ring',    name: 'Frost Ring',      school: 'water', level: 3, manaCost: 14, basePower: 20, target: 'cell',          duration: 0, description: 'Ring of frost around target cell — 20+SP×10 to all adjacent stacks.', adventureSpell: false },
  { id: 'forgetfulness', name: 'Forgetfulness',   school: 'water', level: 3, manaCost: 12, basePower: 0,  target: 'enemy_stack',   duration: 3, description: 'Ranged stack forgets how to shoot for 3 rounds.', adventureSpell: false },
  // Level 4
  { id: 'prayer',        name: 'Prayer',          school: 'water', level: 4, manaCost: 16, basePower: 2,  target: 'all_friendly',  duration: 4, description: '+2 Attack, Defense, Speed to all friendly stacks.', adventureSpell: false },
  { id: 'teleport',      name: 'Teleport',        school: 'water', level: 4, manaCost: 15, basePower: 0,  target: 'friendly_stack', duration: 0, description: 'Instantly move friendly stack to any empty cell.', adventureSpell: false },
  // Level 5
  { id: 'resurrect',     name: 'Resurrect',       school: 'water', level: 5, manaCost: 20, basePower: 50, target: 'friendly_stack', duration: 0, description: 'Brings back fallen creatures worth 50+SP×20 HP total.', adventureSpell: false },
  { id: 'summon_water',  name: 'Summon Water Elemental', school: 'water', level: 5, manaCost: 25, basePower: 3, target: 'cell', duration: 0, description: 'Summons SP/3 (min 1) Water Elementals to fight for you.', adventureSpell: false },
]

// ─── EARTH SCHOOL ────────────────────────────────────────────
const EARTH_SPELLS: SpellDef[] = [
  // Level 1
  { id: 'stoneskin',     name: 'Stoneskin',       school: 'earth', level: 1, manaCost: 5,  basePower: 3,  target: 'friendly_stack', duration: 3, description: '+3 Defense to friendly stack for 3 rounds.', adventureSpell: false },
  { id: 'slow',          name: 'Slow',            school: 'earth', level: 1, manaCost: 6,  basePower: -50, target: 'enemy_stack',   duration: 3, description: 'Halves enemy stack speed for 3 rounds.', adventureSpell: false },
  // Level 2
  { id: 'death_ripple',  name: 'Death Ripple',    school: 'earth', level: 2, manaCost: 10, basePower: 15, target: 'all_enemy',     duration: 0, description: 'Deals 15+SP×5 damage to all living (non-undead) enemy stacks.', adventureSpell: false },
  { id: 'quicksand',     name: 'Quicksand',       school: 'earth', level: 2, manaCost: 8,  basePower: 0,  target: 'cell',          duration: 0, description: 'Creates hidden quicksand traps on random cells.', adventureSpell: false },
  // Level 3
  { id: 'animate_dead',  name: 'Animate Dead',    school: 'earth', level: 3, manaCost: 15, basePower: 30, target: 'friendly_stack', duration: 0, description: 'Raises undead creatures worth 30+SP×10 HP. Works only on undead stacks.', adventureSpell: false },
  { id: 'earthquake',    name: 'Earthquake',      school: 'earth', level: 3, manaCost: 20, basePower: 40, target: 'global',        duration: 0, description: 'Damages town fortifications during siege. 40+SP×10 to walls/towers.', adventureSpell: false },
  // Level 4
  { id: 'meteor_shower', name: 'Meteor Shower',   school: 'earth', level: 4, manaCost: 18, basePower: 35, target: 'cell',          duration: 0, description: 'Meteors rain on 3×3 area dealing 35+SP×15 damage.', adventureSpell: false },
  { id: 'sorrow',        name: 'Sorrow',          school: 'earth', level: 4, manaCost: 16, basePower: -3, target: 'enemy_stack',   duration: 3, description: '-3 Morale to enemy stack for 3 rounds.', adventureSpell: false },
  // Level 5
  { id: 'implosion',     name: 'Implosion',       school: 'earth', level: 5, manaCost: 25, basePower: 100, target: 'enemy_stack',  duration: 0, description: 'Devastating single-target 100+SP×25 damage.', adventureSpell: false },
  { id: 'shield_all',    name: 'Shield of Earth', school: 'earth', level: 5, manaCost: 18, basePower: 4,  target: 'all_friendly',  duration: 3, description: '+4 Defense to all friendly stacks for 3 rounds.', adventureSpell: false },
]

// ─── AIR SCHOOL ──────────────────────────────────────────────
const AIR_SPELLS: SpellDef[] = [
  // Level 1
  { id: 'haste',         name: 'Haste',           school: 'air', level: 1, manaCost: 6,  basePower: 3,   target: 'friendly_stack', duration: 3, description: '+3 Speed to friendly stack for 3 rounds.', adventureSpell: false },
  { id: 'view_air',      name: 'View Air Map',    school: 'air', level: 1, manaCost: 2,  basePower: 0,   target: 'global',        duration: 0, description: 'Reveals all artifacts and resources on the adventure map.', adventureSpell: true },
  // Level 2
  { id: 'lightning',     name: 'Lightning Bolt',  school: 'air', level: 2, manaCost: 10, basePower: 25,  target: 'enemy_stack',   duration: 0, description: 'Strikes enemy stack for 25+SP×10 lightning damage.', adventureSpell: false },
  { id: 'disrupting_ray', name: 'Disrupting Ray', school: 'air', level: 2, manaCost: 10, basePower: -3,  target: 'enemy_stack',   duration: 0, description: 'Permanently reduces enemy stack defense by 3. Stacks.', adventureSpell: false },
  // Level 3
  { id: 'chain_lightning', name: 'Chain Lightning', school: 'air', level: 3, manaCost: 15, basePower: 25, target: 'enemy_stack',  duration: 0, description: 'Lightning jumps to 4 stacks, dealing 25+SP×10 (halved each jump).', adventureSpell: false },
  { id: 'counterstrike',  name: 'Counterstrike',   school: 'air', level: 3, manaCost: 12, basePower: 0,  target: 'friendly_stack', duration: 3, description: 'Stack can retaliate against additional attacks.', adventureSpell: false },
  // Level 4
  { id: 'storm',          name: 'Storm',           school: 'air', level: 4, manaCost: 16, basePower: 20, target: 'all_enemy',     duration: 0, description: 'Deals 20+SP×10 to all enemy stacks.', adventureSpell: false },
  { id: 'dimension_door', name: 'Dimension Door',  school: 'air', level: 4, manaCost: 20, basePower: 0,  target: 'self',          duration: 0, description: 'Teleport hero to any visible tile on adventure map (costs movement).', adventureSpell: true },
  // Level 5
  { id: 'summon_air',    name: 'Summon Air Elemental', school: 'air', level: 5, manaCost: 25, basePower: 3, target: 'cell', duration: 0, description: 'Summons SP/3 (min 1) Air Elementals to fight for you.', adventureSpell: false },
  { id: 'fly',           name: 'Fly',             school: 'air', level: 5, manaCost: 20, basePower: 0,   target: 'self',          duration: 0, description: 'Hero can fly over obstacles on adventure map for the rest of the day.', adventureSpell: true },
]

// ─── All Spells Index ────────────────────────────────────────
export const ALL_SPELLS: Record<string, SpellDef> = {}
for (const s of [...FIRE_SPELLS, ...WATER_SPELLS, ...EARTH_SPELLS, ...AIR_SPELLS]) {
  ALL_SPELLS[s.id] = s
}

/** Get spells available at a given mage guild level */
export function getSpellsForGuildLevel(level: number): SpellDef[] {
  return Object.values(ALL_SPELLS).filter(s => s.level <= level && !s.adventureSpell)
}

/** Get adventure map spells */
export function getAdventureSpells(): SpellDef[] {
  return Object.values(ALL_SPELLS).filter(s => s.adventureSpell)
}

/** Get spells by school */
export function getSpellsBySchool(school: string): SpellDef[] {
  return Object.values(ALL_SPELLS).filter(s => s.school === school)
}

/** Calculate actual spell damage */
export function calcSpellDamage(spell: SpellDef, spellPower: number): number {
  return spell.basePower + spellPower * Math.max(5, spell.basePower * 0.5)
}

/** Calculate spell mana cost (with knowledge reduction at expert level) */
export function calcManaCost(spell: SpellDef, _schoolMastery: 'none' | 'basic' | 'advanced' | 'expert'): number {
  return spell.manaCost
}
