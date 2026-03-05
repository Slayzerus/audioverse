/**
 * cardDatabase.ts — Full card database for MagicDecks TCG.
 * ~80 cards across 6 elements with 3-stage evolution chains,
 * hero cards from TCG sprites, and spell cards.
 */
import type { CardDef, Element } from './types'

const M = '/assets/graphics/Monsters/'
const T = '/assets/graphics/TCG/'

// ────────────────────────────────────────────────────────────
// 🔥 FIRE
// ────────────────────────────────────────────────────────────
const FIRE_CARDS: CardDef[] = [
  // Evolution chain 1: BabyFire → Fire → Phoenix
  { id: 'fire_baby',   name: 'Baby Fire',   type: 'creature', element: 'fire', rarity: 'common', cost: 1, atk: 2, def: 3, spd: 4, stage: 1, evolvesTo: 'fire_flame', sprite: M+'BabyFire.png', passive: { kind: 'thorns', value: 1 }, flavor: 'A spark that yearns to blaze.' },
  { id: 'fire_flame',  name: 'Flame',       type: 'creature', element: 'fire', rarity: 'uncommon', cost: 3, atk: 5, def: 5, spd: 3, stage: 2, evolvesFrom: 'fire_baby', evolvesTo: 'fire_phoenix', sprite: M+'Fire.png', passive: { kind: 'thorns', value: 2 }, flavor: 'Burns brighter with each battle.' },
  { id: 'fire_phoenix', name: 'Phoenix',    type: 'creature', element: 'fire', rarity: 'epic', cost: 6, atk: 8, def: 7, spd: 2, stage: 3, evolvesFrom: 'fire_flame', sprite: M+'Phoenix.png', passive: { kind: 'thorns', value: 3 }, active: { kind: 'fireball', value: 5, cooldown: 8, currentCd: 0 }, flavor: 'Rises from the ashes, fiercer.' },

  // Evolution chain 2: Whelp → Dragon → Dragon2
  { id: 'fire_whelp',  name: 'Whelp',       type: 'creature', element: 'fire', rarity: 'common', cost: 2, atk: 3, def: 4, spd: 4, stage: 1, evolvesTo: 'fire_dragon', sprite: M+'Whelp.png', flavor: 'A tiny dragon, full of fire.' },
  { id: 'fire_dragon',  name: 'Dragon',     type: 'creature', element: 'fire', rarity: 'uncommon', cost: 5, atk: 7, def: 6, spd: 2, stage: 2, evolvesFrom: 'fire_whelp', evolvesTo: 'fire_dragon2', sprite: M+'Dragon.png', passive: { kind: 'splash', value: 30 }, flavor: 'Its breath melts stone.' },
  { id: 'fire_dragon2', name: 'Elder Dragon', type: 'creature', element: 'fire', rarity: 'legendary', cost: 8, atk: 10, def: 9, spd: 1, stage: 3, evolvesFrom: 'fire_dragon', sprite: M+'Dragon2.png', passive: { kind: 'splash', value: 50 }, active: { kind: 'fireball', value: 8, cooldown: 6, currentCd: 0 }, flavor: 'Ancient and unstoppable.' },

  // Standalone
  { id: 'fire_draco',   name: 'Draco',       type: 'creature', element: 'fire', rarity: 'uncommon', cost: 4, atk: 6, def: 4, spd: 3, stage: 2, sprite: M+'Draco.png', passive: { kind: 'pierce', value: 2 }, flavor: 'Swift and merciless.' },

  // Heroes (TCG sprites)
  { id: 'fire_barbarian', name: 'Barbarian', type: 'hero', element: 'fire', rarity: 'uncommon', cost: 4, atk: 6, def: 5, spd: 3, stage: 2, sprite: T+'Barbarian.png', passive: { kind: 'swiftStrike', value: 1 }, active: { kind: 'buff', value: 3, cooldown: 6, currentCd: 0 }, flavor: 'Charges headfirst into battle.' },
  { id: 'fire_elemental', name: 'Fire Elemental', type: 'hero', element: 'fire', rarity: 'epic', cost: 7, atk: 9, def: 6, spd: 2, stage: 3, sprite: T+'FireElemental.png', passive: { kind: 'thorns', value: 3 }, active: { kind: 'fireball', value: 6, cooldown: 5, currentCd: 0 }, flavor: 'Living incarnation of flame.' },

  // Spells
  { id: 'fire_bolt',    name: 'Fire Bolt',   type: 'spell', element: 'fire', rarity: 'common', cost: 2, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'BabyFire.png', spellEffect: { kind: 'damage', value: 4, target: 'enemy' }, flavor: 'Quick burst of flame.' },
  { id: 'fire_inferno', name: 'Inferno',     type: 'spell', element: 'fire', rarity: 'rare', cost: 5, atk: 0, def: 0, spd: 0, stage: 2, sprite: M+'Fire.png', spellEffect: { kind: 'aoe', value: 3, target: 'all' }, flavor: 'The whole battlefield erupts.' },
  { id: 'fire_rage',    name: 'Battle Rage',  type: 'spell', element: 'fire', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: T+'Barbarian.png', spellEffect: { kind: 'buff', value: 3, target: 'ally' }, flavor: 'Boosts ally attack power.' },
]

// ────────────────────────────────────────────────────────────
// 💧 WATER
// ────────────────────────────────────────────────────────────
const WATER_CARDS: CardDef[] = [
  // Evolution chain 1: Tadpole → Toad → Shark
  { id: 'water_tadpole', name: 'Tadpole',     type: 'creature', element: 'water', rarity: 'common', cost: 1, atk: 1, def: 4, spd: 5, stage: 1, evolvesTo: 'water_toad', sprite: M+'Tadpole.png', passive: { kind: 'regen', value: 1 }, flavor: 'Small but remarkably resilient.' },
  { id: 'water_toad',    name: 'Toad',         type: 'creature', element: 'water', rarity: 'uncommon', cost: 3, atk: 3, def: 6, spd: 4, stage: 2, evolvesFrom: 'water_tadpole', evolvesTo: 'water_shark', sprite: M+'Toad.png', passive: { kind: 'regen', value: 2 }, flavor: 'Croaks a chilling war cry.' },
  { id: 'water_shark',   name: 'Shark',        type: 'creature', element: 'water', rarity: 'epic', cost: 6, atk: 7, def: 8, spd: 2, stage: 3, evolvesFrom: 'water_toad', sprite: M+'Shark.png', passive: { kind: 'lifesteal', value: 30 }, active: { kind: 'freeze', value: 2, cooldown: 7, currentCd: 0 }, flavor: 'Apex predator of the deep.' },

  // Evolution chain 2: Jellyfish → Jellyfish2 → Barracuda
  { id: 'water_jelly',  name: 'Jellyfish',    type: 'creature', element: 'water', rarity: 'common', cost: 2, atk: 2, def: 5, spd: 5, stage: 1, evolvesTo: 'water_jelly2', sprite: M+'Jellyfish.png', passive: { kind: 'thorns', value: 1 }, flavor: 'Its tentacles sting on contact.' },
  { id: 'water_jelly2', name: 'Man-o-War',    type: 'creature', element: 'water', rarity: 'uncommon', cost: 4, atk: 4, def: 7, spd: 4, stage: 2, evolvesFrom: 'water_jelly', evolvesTo: 'water_barracuda', sprite: M+'Jellyfish2.png', passive: { kind: 'thorns', value: 2 }, flavor: 'Beautiful and deadly.' },
  { id: 'water_barracuda', name: 'Barracuda', type: 'creature', element: 'water', rarity: 'epic', cost: 7, atk: 8, def: 6, spd: 1, stage: 3, evolvesFrom: 'water_jelly2', sprite: M+'Barracuda.png', passive: { kind: 'swiftStrike', value: 1 }, active: { kind: 'lightning', value: 5, cooldown: 6, currentCd: 0 }, flavor: 'Faster than sight.' },

  // Standalone 
  { id: 'water_penguin', name: 'Penguin',     type: 'creature', element: 'water', rarity: 'common', cost: 2, atk: 2, def: 4, spd: 4, stage: 1, sprite: M+'Penguin.png', passive: { kind: 'regen', value: 1 }, flavor: 'Waddles with determination.' },
  { id: 'water_otter',   name: 'Otter',       type: 'creature', element: 'water', rarity: 'uncommon', cost: 3, atk: 4, def: 4, spd: 3, stage: 1, sprite: M+'Otter.png', passive: { kind: 'lifesteal', value: 20 }, flavor: 'Playful but fierce.' },
  { id: 'water_crab',    name: 'Crab',        type: 'creature', element: 'water', rarity: 'common', cost: 2, atk: 1, def: 6, spd: 5, stage: 1, sprite: M+'Crab.png', passive: { kind: 'taunt', value: 1 }, flavor: 'Impenetrable shell.' },

  // Heroes
  { id: 'water_mage',    name: 'Shark Mage',   type: 'hero', element: 'water', rarity: 'rare', cost: 6, atk: 5, def: 8, spd: 3, stage: 3, sprite: T+'Shark mage.png', passive: { kind: 'regen', value: 2 }, active: { kind: 'freeze', value: 3, cooldown: 5, currentCd: 0 }, flavor: 'Master of tidal magic.' },
  { id: 'water_elemental', name: 'Water Elemental', type: 'hero', element: 'water', rarity: 'rare', cost: 5, atk: 4, def: 9, spd: 3, stage: 2, sprite: T+'Water elemental.png', passive: { kind: 'shield', value: 3 }, flavor: 'Flowing, formless, unstoppable.' },

  // Spells
  { id: 'water_wave',   name: 'Tidal Wave',   type: 'spell', element: 'water', rarity: 'uncommon', cost: 4, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Aqua.png', spellEffect: { kind: 'damage', value: 3, target: 'all' }, flavor: 'Washes across the field.' },
  { id: 'water_heal',   name: 'Healing Rain',  type: 'spell', element: 'water', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Aqua.png', spellEffect: { kind: 'heal', value: 5, target: 'ally' }, flavor: 'Soothing waters restore life.' },
  { id: 'water_freeze', name: 'Deep Freeze',   type: 'spell', element: 'water', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'GolemIce.png', spellEffect: { kind: 'debuff', value: 3, target: 'enemy' }, flavor: 'Freezes an enemy solid.' },
]

// ────────────────────────────────────────────────────────────
// 🌿 EARTH
// ────────────────────────────────────────────────────────────
const EARTH_CARDS: CardDef[] = [
  // Evolution chain 1: Larvae → Beetle → Armadillo
  { id: 'earth_larvae', name: 'Larvae',       type: 'creature', element: 'earth', rarity: 'common', cost: 1, atk: 1, def: 5, spd: 5, stage: 1, evolvesTo: 'earth_beetle', sprite: M+'Larvae.png', passive: { kind: 'shield', value: 2 }, flavor: 'Burrows deep to survive.' },
  { id: 'earth_beetle', name: 'Beetle',       type: 'creature', element: 'earth', rarity: 'uncommon', cost: 3, atk: 3, def: 7, spd: 4, stage: 2, evolvesFrom: 'earth_larvae', evolvesTo: 'earth_armadillo', sprite: M+'Beetle.png', passive: { kind: 'shield', value: 3 }, flavor: 'Hard carapace turns blades.' },
  { id: 'earth_armadillo', name: 'Armadillo', type: 'creature', element: 'earth', rarity: 'epic', cost: 6, atk: 5, def: 12, spd: 4, stage: 3, evolvesFrom: 'earth_beetle', sprite: M+'Armadillo.png', passive: { kind: 'taunt', value: 1 }, active: { kind: 'buff', value: 4, cooldown: 8, currentCd: 0 }, flavor: 'The ultimate living fortress.' },

  // Evolution chain 2: Mushroom → Plant → Carnivorous
  { id: 'earth_mushroom', name: 'Mushroom',   type: 'creature', element: 'earth', rarity: 'common', cost: 1, atk: 1, def: 4, spd: 5, stage: 1, evolvesTo: 'earth_plant', sprite: M+'Mushroom.png', passive: { kind: 'regen', value: 1 }, flavor: 'Spores fill the air.' },
  { id: 'earth_plant',    name: 'Vine Plant', type: 'creature', element: 'earth', rarity: 'uncommon', cost: 3, atk: 3, def: 6, spd: 4, stage: 2, evolvesFrom: 'earth_mushroom', evolvesTo: 'earth_carnivore', sprite: M+'Plant.png', passive: { kind: 'regen', value: 2 }, flavor: 'Roots dig deep.' },
  { id: 'earth_carnivore', name: 'Carnivore', type: 'creature', element: 'earth', rarity: 'epic', cost: 6, atk: 7, def: 8, spd: 3, stage: 3, evolvesFrom: 'earth_plant', sprite: M+'Carnivorous.png', passive: { kind: 'lifesteal', value: 40 }, active: { kind: 'poison', value: 3, cooldown: 6, currentCd: 0 }, flavor: 'Devours anything that moves.' },

  // Standalone
  { id: 'earth_bull',    name: 'Bull',        type: 'creature', element: 'earth', rarity: 'uncommon', cost: 3, atk: 5, def: 5, spd: 3, stage: 1, sprite: M+'Bull.png', passive: { kind: 'taunt', value: 1 }, flavor: 'Charges through the ranks.' },
  { id: 'earth_bear',    name: 'Bear',        type: 'creature', element: 'earth', rarity: 'uncommon', cost: 4, atk: 5, def: 6, spd: 3, stage: 2, sprite: M+'Bear.png', passive: { kind: 'inspire', value: 1 }, flavor: 'Roar empowers allies.' },
  { id: 'earth_mole',    name: 'Mole',        type: 'creature', element: 'earth', rarity: 'common', cost: 2, atk: 2, def: 5, spd: 5, stage: 1, sprite: M+'Mole.png', passive: { kind: 'shield', value: 2 }, flavor: 'Digs under enemy lines.' },
  { id: 'earth_cactus',  name: 'Cactus',      type: 'creature', element: 'earth', rarity: 'common', cost: 2, atk: 1, def: 7, spd: 5, stage: 1, sprite: M+'Cactus.png', passive: { kind: 'thorns', value: 2 }, flavor: 'Touch it and suffer.' },

  // Heroes
  { id: 'earth_golem',   name: 'Rock Golem',   type: 'hero', element: 'earth', rarity: 'rare', cost: 6, atk: 4, def: 14, spd: 5, stage: 3, sprite: T+'Rock elemental.png', passive: { kind: 'taunt', value: 1 }, active: { kind: 'buff', value: 5, cooldown: 7, currentCd: 0 }, flavor: 'An immovable mountain.' },
  { id: 'earth_bearman', name: 'Bearman',      type: 'hero', element: 'earth', rarity: 'rare', cost: 5, atk: 6, def: 8, spd: 3, stage: 2, sprite: T+'Bearman.png', passive: { kind: 'inspire', value: 2 }, flavor: 'Half bear, fully terrifying.' },

  // Spells
  { id: 'earth_quake',  name: 'Earthquake',   type: 'spell', element: 'earth', rarity: 'rare', cost: 5, atk: 0, def: 0, spd: 0, stage: 2, sprite: M+'Armadillo.png', spellEffect: { kind: 'aoe', value: 4, target: 'all' }, flavor: 'The ground splits open.' },
  { id: 'earth_wall',   name: 'Stone Wall',   type: 'spell', element: 'earth', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Cactus.png', spellEffect: { kind: 'buff', value: 4, target: 'ally' }, flavor: '+4 DEF to all allies.' },
]

// ────────────────────────────────────────────────────────────
// 💨 AIR
// ────────────────────────────────────────────────────────────
const AIR_CARDS: CardDef[] = [
  // Evolution chain 1: Egg → Birb → ExoticBird
  { id: 'air_egg',     name: 'Birb Egg',    type: 'creature', element: 'air', rarity: 'common', cost: 1, atk: 1, def: 3, spd: 5, stage: 1, evolvesTo: 'air_birb', sprite: M+'Egg.png', passive: { kind: 'shield', value: 2 }, flavor: 'What hatches inside?' },
  { id: 'air_birb',    name: 'Birb',        type: 'creature', element: 'air', rarity: 'uncommon', cost: 3, atk: 4, def: 4, spd: 2, stage: 2, evolvesFrom: 'air_egg', evolvesTo: 'air_exotic', sprite: M+'Birb.png', passive: { kind: 'swiftStrike', value: 1 }, flavor: 'Swift and curious.' },
  { id: 'air_exotic',  name: 'Exotic Bird',  type: 'creature', element: 'air', rarity: 'epic', cost: 6, atk: 7, def: 6, spd: 1, stage: 3, evolvesFrom: 'air_birb', sprite: M+'ExoticBird.png', passive: { kind: 'swiftStrike', value: 1 }, active: { kind: 'lightning', value: 4, cooldown: 5, currentCd: 0 }, flavor: 'A spectacle of feathers and fury.' },

  // Evolution chain 2: Moth → Owl → Vulture
  { id: 'air_moth',    name: 'Moth',        type: 'creature', element: 'air', rarity: 'common', cost: 1, atk: 2, def: 2, spd: 3, stage: 1, evolvesTo: 'air_owl', sprite: M+'Moth.png', flavor: 'Drawn to light and danger.' },
  { id: 'air_owl',     name: 'Owl',         type: 'creature', element: 'air', rarity: 'uncommon', cost: 3, atk: 4, def: 5, spd: 2, stage: 2, evolvesFrom: 'air_moth', evolvesTo: 'air_vulture', sprite: M+'Owl.png', passive: { kind: 'pierce', value: 2 }, flavor: 'Silent, deadly hunter.' },
  { id: 'air_vulture', name: 'Vulture',     type: 'creature', element: 'air', rarity: 'epic', cost: 5, atk: 6, def: 5, spd: 1, stage: 3, evolvesFrom: 'air_owl', sprite: M+'Vulture.png', passive: { kind: 'pierce', value: 3 }, active: { kind: 'drain', value: 4, cooldown: 6, currentCd: 0 }, flavor: 'Feeds on the fallen.' },

  // Standalone
  { id: 'air_bat',     name: 'Bat',         type: 'creature', element: 'air', rarity: 'common', cost: 1, atk: 2, def: 2, spd: 2, stage: 1, sprite: M+'Bat.png', passive: { kind: 'lifesteal', value: 20 }, flavor: 'Sips life in the dark.' },
  { id: 'air_crow',    name: 'Crow',        type: 'creature', element: 'air', rarity: 'common', cost: 2, atk: 3, def: 3, spd: 2, stage: 1, sprite: M+'Crow.png', passive: { kind: 'pierce', value: 1 }, flavor: 'Dark omen on the wind.' },
  { id: 'air_cupid',   name: 'Cupid',       type: 'creature', element: 'air', rarity: 'uncommon', cost: 3, atk: 2, def: 4, spd: 3, stage: 1, sprite: M+'Cupid.png', passive: { kind: 'inspire', value: 2 }, flavor: 'Arrows of encouragement.' },
  { id: 'air_seagull',  name: 'Seagull',    type: 'creature', element: 'air', rarity: 'common', cost: 2, atk: 3, def: 2, spd: 2, stage: 1, sprite: M+'Seagull.png', passive: { kind: 'swiftStrike', value: 1 }, flavor: 'Dives from above!' },

  // Heroes
  { id: 'air_ninja',   name: 'Ninja',        type: 'hero', element: 'air', rarity: 'rare', cost: 5, atk: 7, def: 4, spd: 1, stage: 2, sprite: T+'Ninja.png', passive: { kind: 'swiftStrike', value: 1 }, active: { kind: 'lightning', value: 5, cooldown: 4, currentCd: 0 }, flavor: 'Strikes unseen.' },
  { id: 'air_hawk',    name: 'Hawk',         type: 'hero', element: 'air', rarity: 'uncommon', cost: 4, atk: 5, def: 5, spd: 1, stage: 2, sprite: T+'Hawk.png', passive: { kind: 'pierce', value: 3 }, flavor: 'Eyes like targeting systems.' },

  // Spells
  { id: 'air_gust',    name: 'Wind Gust',    type: 'spell', element: 'air', rarity: 'common', cost: 2, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Birb.png', spellEffect: { kind: 'debuff', value: 2, target: 'enemy' }, flavor: 'Slows an enemy.' },
  { id: 'air_storm',   name: 'Storm',        type: 'spell', element: 'air', rarity: 'uncommon', cost: 4, atk: 0, def: 0, spd: 0, stage: 2, sprite: M+'Vulture.png', spellEffect: { kind: 'damage', value: 5, target: 'enemy' }, flavor: 'Lightning strikes the foe.' },
]

// ────────────────────────────────────────────────────────────
// ✨ LIGHT
// ────────────────────────────────────────────────────────────
const LIGHT_CARDS: CardDef[] = [
  // Evolution chain 1: Kitten → Cat → Lion
  { id: 'light_kitten', name: 'Kitten',      type: 'creature', element: 'light', rarity: 'common', cost: 1, atk: 2, def: 3, spd: 3, stage: 1, evolvesTo: 'light_cat', sprite: M+'Kitten.png', passive: { kind: 'inspire', value: 1 }, flavor: 'Adorable and inspiring.' },
  { id: 'light_cat',    name: 'Cat',         type: 'creature', element: 'light', rarity: 'uncommon', cost: 3, atk: 4, def: 5, spd: 3, stage: 2, evolvesFrom: 'light_kitten', evolvesTo: 'light_lion', sprite: M+'Cat.png', passive: { kind: 'inspire', value: 2 }, flavor: 'Graceful and powerful.' },
  { id: 'light_lion',   name: 'Lion',        type: 'creature', element: 'light', rarity: 'epic', cost: 6, atk: 8, def: 8, spd: 2, stage: 3, evolvesFrom: 'light_cat', sprite: M+'Lion.png', passive: { kind: 'inspire', value: 3 }, active: { kind: 'buff', value: 3, cooldown: 5, currentCd: 0 }, flavor: 'The King. All allies fight harder.' },

  // Evolution chain 2: Dewdrops → Sakura → God
  { id: 'light_dew',    name: 'Dewdrops',    type: 'creature', element: 'light', rarity: 'common', cost: 2, atk: 1, def: 5, spd: 5, stage: 1, evolvesTo: 'light_sakura', sprite: M+'Dewdrops.png', passive: { kind: 'regen', value: 2 }, flavor: 'Morning light captured.' },
  { id: 'light_sakura', name: 'Sakura',      type: 'creature', element: 'light', rarity: 'rare', cost: 4, atk: 3, def: 8, spd: 4, stage: 2, evolvesFrom: 'light_dew', evolvesTo: 'light_god', sprite: M+'Sakura.png', passive: { kind: 'regen', value: 3 }, active: { kind: 'heal', value: 4, cooldown: 5, currentCd: 0 }, flavor: 'Petals that mend wounds.' },
  { id: 'light_god',    name: 'Radiant God',  type: 'creature', element: 'light', rarity: 'legendary', cost: 9, atk: 6, def: 15, spd: 3, stage: 3, evolvesFrom: 'light_sakura', sprite: M+'God.png', passive: { kind: 'regen', value: 4 }, active: { kind: 'heal', value: 8, cooldown: 4, currentCd: 0 }, flavor: 'Divinity made manifest.' },

  // Standalone
  { id: 'light_puppy',  name: 'Puppy',       type: 'creature', element: 'light', rarity: 'common', cost: 1, atk: 2, def: 3, spd: 3, stage: 1, sprite: M+'Puppy.png', passive: { kind: 'inspire', value: 1 }, flavor: 'Loyal to the end.' },
  { id: 'light_fawn',   name: 'Fawn',        type: 'creature', element: 'light', rarity: 'common', cost: 2, atk: 2, def: 4, spd: 3, stage: 1, sprite: M+'Fawn.png', passive: { kind: 'regen', value: 1 }, flavor: 'Pure of heart.' },
  { id: 'light_elf',    name: 'Forest Elf',  type: 'creature', element: 'light', rarity: 'uncommon', cost: 3, atk: 3, def: 5, spd: 3, stage: 1, sprite: M+'Elf.png', passive: { kind: 'regen', value: 2 }, flavor: 'Nature reveals its secrets.' },
  { id: 'light_pearly', name: 'Pearly',      type: 'creature', element: 'light', rarity: 'uncommon', cost: 3, atk: 2, def: 6, spd: 4, stage: 1, sprite: M+'Pearly.png', passive: { kind: 'shield', value: 3 }, flavor: 'Glistens with inner light.' },

  // Heroes
  { id: 'light_angel',  name: 'Archangel',   type: 'hero', element: 'light', rarity: 'epic', cost: 7, atk: 6, def: 10, spd: 2, stage: 3, sprite: T+'Archangel.png', passive: { kind: 'regen', value: 3 }, active: { kind: 'heal', value: 6, cooldown: 4, currentCd: 0 }, flavor: 'Wings of salvation.' },
  { id: 'light_priestess', name: 'Priestess', type: 'hero', element: 'light', rarity: 'uncommon', cost: 4, atk: 2, def: 7, spd: 4, stage: 2, sprite: T+'Priestess.png', passive: { kind: 'regen', value: 2 }, active: { kind: 'heal', value: 5, cooldown: 5, currentCd: 0 }, flavor: 'Prayers that mend.' },
  { id: 'light_fairy',  name: 'Fairy',       type: 'hero', element: 'light', rarity: 'uncommon', cost: 3, atk: 2, def: 4, spd: 2, stage: 1, sprite: T+'Fairy.png', passive: { kind: 'inspire', value: 2 }, flavor: 'Sprinkles magic dust.' },

  // Spells
  { id: 'light_holy',   name: 'Holy Light',   type: 'spell', element: 'light', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'God.png', spellEffect: { kind: 'heal', value: 6, target: 'self' }, flavor: 'Restores player life.' },
  { id: 'light_bless',  name: 'Blessing',     type: 'spell', element: 'light', rarity: 'common', cost: 2, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Sakura.png', spellEffect: { kind: 'buff', value: 2, target: 'ally' }, flavor: 'All allies gain +2 ATK/DEF.' },
  { id: 'light_draw',   name: 'Insight',      type: 'spell', element: 'light', rarity: 'common', cost: 2, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Dewdrops.png', spellEffect: { kind: 'draw', value: 2, target: 'self' }, flavor: 'Draw 2 cards.' },
]

// ────────────────────────────────────────────────────────────
// 🌑 DARK
// ────────────────────────────────────────────────────────────
const DARK_CARDS: CardDef[] = [
  // Evolution chain 1: Slime → Blob → Nebulae
  { id: 'dark_slime',   name: 'Slime',       type: 'creature', element: 'dark', rarity: 'common', cost: 1, atk: 2, def: 3, spd: 4, stage: 1, evolvesTo: 'dark_blob', sprite: M+'Slime.png', passive: { kind: 'thorns', value: 1 }, flavor: 'Oozes malice.' },
  { id: 'dark_blob',    name: 'Shadow Blob',  type: 'creature', element: 'dark', rarity: 'uncommon', cost: 3, atk: 4, def: 5, spd: 3, stage: 2, evolvesFrom: 'dark_slime', evolvesTo: 'dark_nebulae', sprite: M+'Blob.png', passive: { kind: 'lifesteal', value: 25 }, flavor: 'Absorbs life force.' },
  { id: 'dark_nebulae', name: 'Nebulae',      type: 'creature', element: 'dark', rarity: 'legendary', cost: 7, atk: 8, def: 8, spd: 2, stage: 3, evolvesFrom: 'dark_blob', sprite: M+'Nebulae.png', passive: { kind: 'lifesteal', value: 40 }, active: { kind: 'drain', value: 6, cooldown: 5, currentCd: 0 }, flavor: 'A void that consumes all.' },

  // Evolution chain 2: Mouse → Rat → Spider
  { id: 'dark_mouse',   name: 'Mouse',       type: 'creature', element: 'dark', rarity: 'common', cost: 1, atk: 2, def: 2, spd: 2, stage: 1, evolvesTo: 'dark_rat', sprite: M+'Mouse.png', passive: { kind: 'swiftStrike', value: 1 }, flavor: 'Sneaks through cracks.' },
  { id: 'dark_rat',     name: 'Plague Rat',   type: 'creature', element: 'dark', rarity: 'rare', cost: 3, atk: 4, def: 3, spd: 2, stage: 2, evolvesFrom: 'dark_mouse', evolvesTo: 'dark_spider', sprite: M+'Rat.png', passive: { kind: 'swiftStrike', value: 1 }, active: { kind: 'poison', value: 2, cooldown: 5, currentCd: 0 }, flavor: 'Spreads disease.' },
  { id: 'dark_spider',  name: 'Spider Queen', type: 'creature', element: 'dark', rarity: 'epic', cost: 6, atk: 7, def: 5, spd: 1, stage: 3, evolvesFrom: 'dark_rat', sprite: M+'Spider.png', passive: { kind: 'pierce', value: 3 }, active: { kind: 'poison', value: 4, cooldown: 4, currentCd: 0 }, flavor: 'Webs of death.' },

  // Standalone
  { id: 'dark_ghost',   name: 'Ghost',       type: 'creature', element: 'dark', rarity: 'uncommon', cost: 3, atk: 4, def: 3, spd: 2, stage: 1, sprite: M+'Ghost.png', passive: { kind: 'pierce', value: 2 }, flavor: 'Phases through defenses.' },
  { id: 'dark_anubis',  name: 'Anubis',      type: 'creature', element: 'dark', rarity: 'rare', cost: 5, atk: 6, def: 6, spd: 2, stage: 2, sprite: M+'Anubis.png', passive: { kind: 'lifesteal', value: 30 }, active: { kind: 'drain', value: 4, cooldown: 6, currentCd: 0 }, flavor: 'Judge of the dead.' },
  { id: 'dark_werewolf', name: 'Werewolf',   type: 'creature', element: 'dark', rarity: 'uncommon', cost: 4, atk: 6, def: 4, spd: 2, stage: 2, sprite: M+'Werewolf.png', passive: { kind: 'swiftStrike', value: 1 }, flavor: 'Howls under the blood moon.' },

  // Heroes
  { id: 'dark_necro',   name: 'Necromancer',  type: 'hero', element: 'dark', rarity: 'rare', cost: 6, atk: 5, def: 6, spd: 3, stage: 3, sprite: T+'Necromancer.png', passive: { kind: 'lifesteal', value: 30 }, active: { kind: 'summon', value: 3, cooldown: 8, currentCd: 0 }, flavor: 'Raises the dead.' },
  { id: 'dark_assassin', name: 'Assassin',    type: 'hero', element: 'dark', rarity: 'rare', cost: 5, atk: 8, def: 3, spd: 1, stage: 2, sprite: T+'Assassin.png', passive: { kind: 'pierce', value: 4 }, active: { kind: 'drain', value: 5, cooldown: 5, currentCd: 0 }, flavor: 'One strike is enough.' },
  { id: 'dark_witch',   name: 'Witch',       type: 'hero', element: 'dark', rarity: 'uncommon', cost: 4, atk: 3, def: 5, spd: 3, stage: 2, sprite: T+'Witch.png', passive: { kind: 'thorns', value: 2 }, active: { kind: 'poison', value: 3, cooldown: 5, currentCd: 0 }, flavor: 'Curses that linger.' },

  // Spells
  { id: 'dark_drain',   name: 'Soul Drain',   type: 'spell', element: 'dark', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Ghost.png', spellEffect: { kind: 'damage', value: 4, target: 'enemy' }, flavor: 'Steals life essence.' },
  { id: 'dark_shadow',  name: 'Shadow Bolt',  type: 'spell', element: 'dark', rarity: 'uncommon', cost: 4, atk: 0, def: 0, spd: 0, stage: 2, sprite: M+'Nebulae.png', spellEffect: { kind: 'damage', value: 6, target: 'enemy' }, flavor: 'Darkness concentrated.' },
  { id: 'dark_leech',   name: 'Life Leech',   type: 'spell', element: 'dark', rarity: 'common', cost: 2, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Slime.png', spellEffect: { kind: 'heal', value: 3, target: 'self' }, flavor: 'Drains foe, heals you.' },
]

// ────────────────────────────────────────────────────────────
// NEUTRAL / MULTI heroes (TCG)
// ────────────────────────────────────────────────────────────
const NEUTRAL_CARDS: CardDef[] = [
  { id: 'n_knight',    name: 'Knight',       type: 'hero', element: 'earth', rarity: 'uncommon', cost: 4, atk: 5, def: 6, spd: 3, stage: 2, sprite: T+'Knight.png', passive: { kind: 'taunt', value: 1 }, flavor: 'Sworn protector.' },
  { id: 'n_viking',    name: 'Viking',       type: 'hero', element: 'water', rarity: 'uncommon', cost: 4, atk: 6, def: 4, spd: 2, stage: 2, sprite: T+'Viking.png', passive: { kind: 'splash', value: 25 }, flavor: 'Raids with fury.' },
  { id: 'n_lancer',    name: 'Lancer',       type: 'hero', element: 'air', rarity: 'uncommon', cost: 3, atk: 5, def: 3, spd: 2, stage: 1, sprite: T+'Lancer.png', passive: { kind: 'pierce', value: 2 }, flavor: 'Charges lance first.' },
  { id: 'n_druid',     name: 'Druid',        type: 'hero', element: 'earth', rarity: 'uncommon', cost: 4, atk: 3, def: 6, spd: 4, stage: 2, sprite: T+'Druid.png', passive: { kind: 'regen', value: 2 }, active: { kind: 'heal', value: 4, cooldown: 5, currentCd: 0 }, flavor: 'Nature obeys.' },
  { id: 'n_shaman',    name: 'Shaman',       type: 'hero', element: 'fire', rarity: 'uncommon', cost: 4, atk: 4, def: 5, spd: 3, stage: 2, sprite: T+'Shaman.png', passive: { kind: 'thorns', value: 2 }, active: { kind: 'lightning', value: 4, cooldown: 6, currentCd: 0 }, flavor: 'Spirit walker.' },
  { id: 'n_orc',       name: 'Orc Warrior',  type: 'hero', element: 'dark', rarity: 'uncommon', cost: 3, atk: 5, def: 4, spd: 3, stage: 1, sprite: T+'Orc.png', passive: { kind: 'swiftStrike', value: 1 }, flavor: 'Smash first, ask never.' },
  { id: 'n_troll',     name: 'Troll',        type: 'hero', element: 'earth', rarity: 'rare', cost: 5, atk: 4, def: 10, spd: 5, stage: 2, sprite: T+'Troll.png', passive: { kind: 'regen', value: 3 }, flavor: 'Regenerates endlessly.' },
  { id: 'n_pirate',    name: 'Pirate',       type: 'hero', element: 'water', rarity: 'uncommon', cost: 3, atk: 4, def: 3, spd: 2, stage: 1, sprite: T+'Pirate.png', passive: { kind: 'swiftStrike', value: 1 }, flavor: 'Yo ho and a bottle of rum.' },
  { id: 'n_vampire',   name: 'Vampire',      type: 'hero', element: 'dark', rarity: 'rare', cost: 5, atk: 6, def: 5, spd: 2, stage: 2, sprite: T+'Vampire.png', passive: { kind: 'lifesteal', value: 40 }, flavor: 'Drains victims dry.' },
  // Evolve helper spell
  { id: 'n_evolve',    name: 'Metamorphosis', type: 'spell', element: 'light', rarity: 'uncommon', cost: 3, atk: 0, def: 0, spd: 0, stage: 1, sprite: M+'Egg.png', spellEffect: { kind: 'evolve', value: 1, target: 'ally' }, flavor: 'Evolves a creature on the field.' },
  { id: 'n_mana',      name: 'Mana Crystal',  type: 'spell', element: 'light', rarity: 'common', cost: 0, atk: 0, def: 0, spd: 0, stage: 1, sprite: T+'CrystalElemental.png', spellEffect: { kind: 'mana', value: 3, target: 'self' }, flavor: 'Gain 3 mana instantly.' },
]

// ── Aggregation ───────────────────────────────────────────
export const ALL_CARDS: CardDef[] = [
  ...FIRE_CARDS, ...WATER_CARDS, ...EARTH_CARDS,
  ...AIR_CARDS, ...LIGHT_CARDS, ...DARK_CARDS,
  ...NEUTRAL_CARDS,
]

export const CARDS_BY_ID = new Map<string, CardDef>(ALL_CARDS.map(c => [c.id, c]))

export function getCardsByElement(el: Element): CardDef[] {
  return ALL_CARDS.filter(c => c.element === el)
}

export function getEvolutionChain(id: string): CardDef[] {
  const card = CARDS_BY_ID.get(id)
  if (!card) return []
  // find root
  let root = card
  while (root.evolvesFrom) {
    const prev = CARDS_BY_ID.get(root.evolvesFrom)
    if (!prev) break
    root = prev
  }
  // build chain forward
  const chain: CardDef[] = [root]
  let cur = root
  while (cur.evolvesTo) {
    const next = CARDS_BY_ID.get(cur.evolvesTo)
    if (!next) break
    chain.push(next)
    cur = next
  }
  return chain
}

/** Build a random deck of `size` cards, optionally weighted toward given elements */
export function buildRandomDeck(size: number, preferElements?: Element[]): CardDef[] {
  const pool = preferElements && preferElements.length > 0
    ? ALL_CARDS.filter(c => preferElements.includes(c.element) || Math.random() < 0.15)
    : [...ALL_CARDS]
  const deck: CardDef[] = []
  const counts = new Map<string, number>()
  const shuffled = shuffle(pool)
  // fill deck respecting max 4 copies
  let tries = 0
  while (deck.length < size && tries < 500) {
    const card = shuffled[tries % shuffled.length]
    const cnt = counts.get(card.id) || 0
    if (cnt < 4) {
      deck.push(card)
      counts.set(card.id, cnt + 1)
    }
    tries++
  }
  return shuffle(deck)
}

/** Build a themed deck for a specific element */
export function buildElementDeck(element: Element, size: number): CardDef[] {
  return buildRandomDeck(size, [element])
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Preload all card sprites, returns a Map<path, HTMLImageElement> */
export function preloadSprites(): Map<string, HTMLImageElement> {
  const cache = new Map<string, HTMLImageElement>()
  const paths = new Set(ALL_CARDS.map(c => c.sprite))
  for (const p of paths) {
    const img = new Image()
    img.src = p
    cache.set(p, img)
  }
  return cache
}
