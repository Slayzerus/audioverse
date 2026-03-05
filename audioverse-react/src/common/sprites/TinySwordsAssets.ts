/**
 * Complete Tiny Swords asset path catalog.
 * Every single sprite from all three packs is mapped here.
 * Paths are relative to /assets/sprites/Tiny Swords/
 */

const BASE = '/assets/sprites/Tiny Swords'
const FREE = `${BASE}/Tiny Swords (Free Pack)`
const UPDATE = `${BASE}/Tiny Swords (Update 010)`
const ENEMY = `${BASE}/Tiny Swords (Enemy Pack)/Enemy Pack`

// ═══════════════════════════════════════════════════════════════
// TERRAIN
// ═══════════════════════════════════════════════════════════════
export const TERRAIN = {
  tileset: {
    color1: `${FREE}/Terrain/Tileset/Tilemap_color1.png`,
    color2: `${FREE}/Terrain/Tileset/Tilemap_color2.png`,
    color3: `${FREE}/Terrain/Tileset/Tilemap_color3.png`,
    color4: `${FREE}/Terrain/Tileset/Tilemap_color4.png`,
    color5: `${FREE}/Terrain/Tileset/Tilemap_color5.png`,
    waterBg: `${FREE}/Terrain/Tileset/Water Background color.png`,
    waterFoam: `${FREE}/Terrain/Tileset/Water Foam.png`,
    shadow: `${FREE}/Terrain/Tileset/Shadow.png`,
  },
  ground: {
    shadows: `${UPDATE}/Terrain/Ground/Shadows.png`,
    elevation: `${UPDATE}/Terrain/Ground/Tilemap_Elevation.png`,
    flat: `${UPDATE}/Terrain/Ground/Tilemap_Flat.png`,
  },
  water: {
    water: `${UPDATE}/Terrain/Water/Water.png`,
    foam: `${UPDATE}/Terrain/Water/Foam/Foam.png`,
    rocks: [
      `${UPDATE}/Terrain/Water/Rocks/Rocks_01.png`,
      `${UPDATE}/Terrain/Water/Rocks/Rocks_02.png`,
      `${UPDATE}/Terrain/Water/Rocks/Rocks_03.png`,
      `${UPDATE}/Terrain/Water/Rocks/Rocks_04.png`,
    ],
  },
  bridge: `${UPDATE}/Terrain/Bridge/Bridge_All.png`,
  decorations: {
    bushes: [
      `${FREE}/Terrain/Decorations/Bushes/Bushe1.png`,
      `${FREE}/Terrain/Decorations/Bushes/Bushe2.png`,
      `${FREE}/Terrain/Decorations/Bushes/Bushe3.png`,
      `${FREE}/Terrain/Decorations/Bushes/Bushe4.png`,
    ],
    clouds: [
      `${FREE}/Terrain/Decorations/Clouds/Clouds_01.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_02.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_03.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_04.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_05.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_06.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_07.png`,
      `${FREE}/Terrain/Decorations/Clouds/Clouds_08.png`,
    ],
    rocks: [
      `${FREE}/Terrain/Decorations/Rocks/Rock1.png`,
      `${FREE}/Terrain/Decorations/Rocks/Rock2.png`,
      `${FREE}/Terrain/Decorations/Rocks/Rock3.png`,
      `${FREE}/Terrain/Decorations/Rocks/Rock4.png`,
    ],
    waterRocks: [
      `${FREE}/Terrain/Decorations/Rocks in the Water/Water Rocks_01.png`,
      `${FREE}/Terrain/Decorations/Rocks in the Water/Water Rocks_02.png`,
      `${FREE}/Terrain/Decorations/Rocks in the Water/Water Rocks_03.png`,
      `${FREE}/Terrain/Decorations/Rocks in the Water/Water Rocks_04.png`,
    ],
    rubberDuck: `${FREE}/Terrain/Decorations/Rubber Duck/Rubber duck.png`,
  },
  deco: Array.from({ length: 18 }, (_, i) =>
    `${UPDATE}/Deco/${String(i + 1).padStart(2, '0')}.png`
  ),
} as const

// ═══════════════════════════════════════════════════════════════
// RESOURCES
// ═══════════════════════════════════════════════════════════════
export const RESOURCES = {
  gold: {
    resource: `${FREE}/Terrain/Resources/Gold/Gold Resource/Gold_Resource.png`,
    resourceHighlight: `${FREE}/Terrain/Resources/Gold/Gold Resource/Gold_Resource_Highlight.png`,
    stones: Array.from({ length: 6 }, (_, i) => ({
      normal: `${FREE}/Terrain/Resources/Gold/Gold Stones/Gold Stone ${i + 1}.png`,
      highlight: `${FREE}/Terrain/Resources/Gold/Gold Stones/Gold Stone ${i + 1}_Highlight.png`,
    })),
    mine: {
      active: `${UPDATE}/Resources/Gold Mine/GoldMine_Active.png`,
      destroyed: `${UPDATE}/Resources/Gold Mine/GoldMine_Destroyed.png`,
      inactive: `${UPDATE}/Resources/Gold Mine/GoldMine_Inactive.png`,
    },
    icon: {
      idle: `${UPDATE}/Resources/Resources/G_Idle.png`,
      idleNoShadow: `${UPDATE}/Resources/Resources/G_Idle_(NoShadow).png`,
      spawn: `${UPDATE}/Resources/Resources/G_Spawn.png`,
    },
  },
  meat: {
    resource: `${FREE}/Terrain/Resources/Meat/Meat Resource/Meat Resource.png`,
    sheep: {
      grass: `${FREE}/Terrain/Resources/Meat/Sheep/Sheep_Grass.png`,
      idle: `${FREE}/Terrain/Resources/Meat/Sheep/Sheep_Idle.png`,
      move: `${FREE}/Terrain/Resources/Meat/Sheep/Sheep_Move.png`,
    },
    icon: {
      idle: `${UPDATE}/Resources/Resources/M_Idle.png`,
      idleNoShadow: `${UPDATE}/Resources/Resources/M_Idle_(NoShadow).png`,
      spawn: `${UPDATE}/Resources/Resources/M_Spawn.png`,
    },
  },
  wood: {
    resource: `${FREE}/Terrain/Resources/Wood/Wood Resource/Wood Resource.png`,
    trees: [
      `${FREE}/Terrain/Resources/Wood/Trees/Tree1.png`,
      `${FREE}/Terrain/Resources/Wood/Trees/Tree2.png`,
      `${FREE}/Terrain/Resources/Wood/Trees/Tree3.png`,
      `${FREE}/Terrain/Resources/Wood/Trees/Tree4.png`,
    ],
    stumps: [
      `${FREE}/Terrain/Resources/Wood/Trees/Stump 1.png`,
      `${FREE}/Terrain/Resources/Wood/Trees/Stump 2.png`,
      `${FREE}/Terrain/Resources/Wood/Trees/Stump 3.png`,
      `${FREE}/Terrain/Resources/Wood/Trees/Stump 4.png`,
    ],
    icon: {
      idle: `${UPDATE}/Resources/Resources/W_Idle.png`,
      idleNoShadow: `${UPDATE}/Resources/Resources/W_Idle_(NoShadow).png`,
      spawn: `${UPDATE}/Resources/Resources/W_Spawn.png`,
    },
  },
  tools: [
    `${FREE}/Terrain/Resources/Tools/Tool_01.png`,
    `${FREE}/Terrain/Resources/Tools/Tool_02.png`,
    `${FREE}/Terrain/Resources/Tools/Tool_03.png`,
    `${FREE}/Terrain/Resources/Tools/Tool_04.png`,
  ],
  sheepAnimated: {
    all: `${UPDATE}/Resources/Sheep/HappySheep_All.png`,
    bouncing: `${UPDATE}/Resources/Sheep/HappySheep_Bouncing.png`,
    idle: `${UPDATE}/Resources/Sheep/HappySheep_Idle.png`,
  },
  tree: `${UPDATE}/Resources/Trees/Tree.png`,
} as const

// ═══════════════════════════════════════════════════════════════
// BUILDINGS — Free Pack (per faction color)
// ═══════════════════════════════════════════════════════════════
type FactionColor = 'Blue' | 'Red' | 'Purple' | 'Yellow' | 'Black'
const BUILDING_TYPES = ['Archery', 'Barracks', 'Castle', 'House1', 'House2', 'House3', 'Monastery', 'Tower'] as const

function makeFreeBuildings(color: FactionColor) {
  const result: Record<string, string> = {}
  for (const b of BUILDING_TYPES) {
    result[b.toLowerCase()] = `${FREE}/Buildings/${color} Buildings/${b}.png`
  }
  return result
}

export const BUILDINGS_FREE = {
  blue: makeFreeBuildings('Blue'),
  red: makeFreeBuildings('Red'),
  purple: makeFreeBuildings('Purple'),
  yellow: makeFreeBuildings('Yellow'),
  black: makeFreeBuildings('Black'),
} as const

// Buildings — Update 010 (Knights faction, with construction/destroyed states)
export const BUILDINGS_KNIGHTS = {
  castle: {
    blue: `${UPDATE}/Factions/Knights/Buildings/Castle/Castle_Blue.png`,
    red: `${UPDATE}/Factions/Knights/Buildings/Castle/Castle_Red.png`,
    purple: `${UPDATE}/Factions/Knights/Buildings/Castle/Castle_Purple.png`,
    yellow: `${UPDATE}/Factions/Knights/Buildings/Castle/Castle_Yellow.png`,
    construction: `${UPDATE}/Factions/Knights/Buildings/Castle/Castle_Construction.png`,
    destroyed: `${UPDATE}/Factions/Knights/Buildings/Castle/Castle_Destroyed.png`,
  },
  house: {
    blue: `${UPDATE}/Factions/Knights/Buildings/House/House_Blue.png`,
    red: `${UPDATE}/Factions/Knights/Buildings/House/House_Red.png`,
    purple: `${UPDATE}/Factions/Knights/Buildings/House/House_Purple.png`,
    yellow: `${UPDATE}/Factions/Knights/Buildings/House/House_Yellow.png`,
    construction: `${UPDATE}/Factions/Knights/Buildings/House/House_Construction.png`,
    destroyed: `${UPDATE}/Factions/Knights/Buildings/House/House_Destroyed.png`,
  },
  tower: {
    blue: `${UPDATE}/Factions/Knights/Buildings/Tower/Tower_Blue.png`,
    red: `${UPDATE}/Factions/Knights/Buildings/Tower/Tower_Red.png`,
    purple: `${UPDATE}/Factions/Knights/Buildings/Tower/Tower_Purple.png`,
    yellow: `${UPDATE}/Factions/Knights/Buildings/Tower/Tower_Yellow.png`,
    construction: `${UPDATE}/Factions/Knights/Buildings/Tower/Tower_Construction.png`,
    destroyed: `${UPDATE}/Factions/Knights/Buildings/Tower/Tower_Destroyed.png`,
  },
} as const

// Buildings — Goblins
export const BUILDINGS_GOBLINS = {
  house: {
    normal: `${UPDATE}/Factions/Goblins/Buildings/Wood_House/Goblin_House.png`,
    destroyed: `${UPDATE}/Factions/Goblins/Buildings/Wood_House/Goblin_House_Destroyed.png`,
  },
  tower: {
    blue: `${UPDATE}/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Blue.png`,
    red: `${UPDATE}/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Red.png`,
    purple: `${UPDATE}/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Purple.png`,
    yellow: `${UPDATE}/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Yellow.png`,
    construction: `${UPDATE}/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_InConstruction.png`,
    destroyed: `${UPDATE}/Factions/Goblins/Buildings/Wood_Tower/Wood_Tower_Destroyed.png`,
  },
} as const

// ═══════════════════════════════════════════════════════════════
// UNITS — Free Pack (sprite sheets with animations)
// ═══════════════════════════════════════════════════════════════
function makeUnitColor(color: FactionColor) {
  const u = `${FREE}/Units/${color} Units`
  return {
    warrior: {
      idle: `${u}/Warrior/Warrior_Idle.png`,
      run: `${u}/Warrior/Warrior_Run.png`,
      attack1: `${u}/Warrior/Warrior_Attack1.png`,
      attack2: `${u}/Warrior/Warrior_Attack2.png`,
      guard: `${u}/Warrior/Warrior_Guard.png`,
    },
    archer: {
      idle: `${u}/Archer/Archer_Idle.png`,
      run: `${u}/Archer/Archer_Run.png`,
      shoot: `${u}/Archer/Archer_Shoot.png`,
      arrow: `${u}/Archer/Arrow.png`,
    },
    pawn: {
      idle: `${u}/Pawn/Pawn_Idle.png`,
      run: `${u}/Pawn/Pawn_Run.png`,
      idleAxe: `${u}/Pawn/Pawn_Idle Axe.png`,
      idleGold: `${u}/Pawn/Pawn_Idle Gold.png`,
      idleHammer: `${u}/Pawn/Pawn_Idle Hammer.png`,
      idleKnife: `${u}/Pawn/Pawn_Idle Knife.png`,
      idleMeat: `${u}/Pawn/Pawn_Idle Meat.png`,
      idlePickaxe: `${u}/Pawn/Pawn_Idle Pickaxe.png`,
      idleWood: `${u}/Pawn/Pawn_Idle Wood.png`,
      runAxe: `${u}/Pawn/Pawn_Run Axe.png`,
      runGold: `${u}/Pawn/Pawn_Run Gold.png`,
      runHammer: `${u}/Pawn/Pawn_Run Hammer.png`,
      runKnife: `${u}/Pawn/Pawn_Run Knife.png`,
      runMeat: `${u}/Pawn/Pawn_Run Meat.png`,
      runPickaxe: `${u}/Pawn/Pawn_Run Pickaxe.png`,
      runWood: `${u}/Pawn/Pawn_Run Wood.png`,
      interactAxe: `${u}/Pawn/Pawn_Interact Axe.png`,
      interactHammer: `${u}/Pawn/Pawn_Interact Hammer.png`,
      interactKnife: `${u}/Pawn/Pawn_Interact Knife.png`,
      interactPickaxe: `${u}/Pawn/Pawn_Interact Pickaxe.png`,
    },
    lancer: {
      idle: `${u}/Lancer/Lancer_Idle.png`,
      run: `${u}/Lancer/Lancer_Run.png`,
      downAttack: `${u}/Lancer/Lancer_Down_Attack.png`,
      downDefence: `${u}/Lancer/Lancer_Down_Defence.png`,
      downRightAttack: `${u}/Lancer/Lancer_DownRight_Attack.png`,
      downRightDefence: `${u}/Lancer/Lancer_DownRight_Defence.png`,
      rightAttack: `${u}/Lancer/Lancer_Right_Attack.png`,
      rightDefence: `${u}/Lancer/Lancer_Right_Defence.png`,
      upAttack: `${u}/Lancer/Lancer_Up_Attack.png`,
      upDefence: `${u}/Lancer/Lancer_Up_Defence.png`,
      upRightAttack: `${u}/Lancer/Lancer_UpRight_Attack.png`,
      upRightDefence: `${u}/Lancer/Lancer_UpRight_Defence.png`,
    },
    monk: {
      idle: `${u}/Monk/Idle.png`,
      run: `${u}/Monk/Run.png`,
      heal: `${u}/Monk/Heal.png`,
      healEffect: `${u}/Monk/Heal_Effect.png`,
    },
  }
}

export const UNITS_FREE = {
  blue: makeUnitColor('Blue'),
  red: makeUnitColor('Red'),
  purple: makeUnitColor('Purple'),
  yellow: makeUnitColor('Yellow'),
  black: makeUnitColor('Black'),
} as const

// Units — Update 010 (Knights, higher detail sprite sheets)
export const UNITS_KNIGHTS = {
  warrior: {
    blue: `${UPDATE}/Factions/Knights/Troops/Warrior/Blue/Warrior_Blue.png`,
    red: `${UPDATE}/Factions/Knights/Troops/Warrior/Red/Warrior_Red.png`,
    purple: `${UPDATE}/Factions/Knights/Troops/Warrior/Purple/Warrior_Purple.png`,
    yellow: `${UPDATE}/Factions/Knights/Troops/Warrior/Yellow/Warrior_Yellow.png`,
  },
  archer: {
    blue: `${UPDATE}/Factions/Knights/Troops/Archer/Blue/Archer_Blue.png`,
    red: `${UPDATE}/Factions/Knights/Troops/Archer/Red/Archer_Red.png`,
    purple: `${UPDATE}/Factions/Knights/Troops/Archer/Purple/Archer_Purlple.png`,
    yellow: `${UPDATE}/Factions/Knights/Troops/Archer/Yellow/Archer_Yellow.png`,
    bow: {
      blue: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Bow_Blue.png`,
      red: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Bow_Red.png`,
      purple: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Bow_Purple.png`,
      yellow: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Bow_Yellow.png`,
    },
    noArms: {
      blue: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Blue_(NoArms).png`,
      red: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Red_(NoArms).png`,
      purple: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Purple_(NoArms).png`,
      yellow: `${UPDATE}/Factions/Knights/Troops/Archer/Archer + Bow/Archer_Yellow_(NoArms).png`,
    },
    arrow: `${UPDATE}/Factions/Knights/Troops/Archer/Arrow/Arrow.png`,
  },
  pawn: {
    blue: `${UPDATE}/Factions/Knights/Troops/Pawn/Blue/Pawn_Blue.png`,
    red: `${UPDATE}/Factions/Knights/Troops/Pawn/Red/Pawn_Red.png`,
    purple: `${UPDATE}/Factions/Knights/Troops/Pawn/Purple/Pawn_Purple.png`,
    yellow: `${UPDATE}/Factions/Knights/Troops/Pawn/Yellow/Pawn_Yellow.png`,
  },
  dead: `${UPDATE}/Factions/Knights/Troops/Dead/Dead.png`,
} as const

// Units — Goblins
export const UNITS_GOBLINS = {
  barrel: {
    blue: `${UPDATE}/Factions/Goblins/Troops/Barrel/Blue/Barrel_Blue.png`,
    red: `${UPDATE}/Factions/Goblins/Troops/Barrel/Red/Barrel_Red.png`,
    purple: `${UPDATE}/Factions/Goblins/Troops/Barrel/Purple/Barrel_Purple.png`,
    yellow: `${UPDATE}/Factions/Goblins/Troops/Barrel/Yellow/Barrel_Yellow.png`,
  },
  tnt: {
    blue: `${UPDATE}/Factions/Goblins/Troops/TNT/Blue/TNT_Blue.png`,
    red: `${UPDATE}/Factions/Goblins/Troops/TNT/Red/TNT_Red.png`,
    purple: `${UPDATE}/Factions/Goblins/Troops/TNT/Purple/TNT_Purple.png`,
    yellow: `${UPDATE}/Factions/Goblins/Troops/TNT/Yellow/TNT_Yellow.png`,
    dynamite: `${UPDATE}/Factions/Goblins/Troops/TNT/Dynamite/Dynamite.png`,
  },
  torch: {
    blue: `${UPDATE}/Factions/Goblins/Troops/Torch/Blue/Torch_Blue.png`,
    red: `${UPDATE}/Factions/Goblins/Troops/Torch/Red/Torch_Red.png`,
    purple: `${UPDATE}/Factions/Goblins/Troops/Torch/Purple/Torch_Purple.png`,
    yellow: `${UPDATE}/Factions/Goblins/Troops/Torch/Yellow/Torch_Yellow.png`,
  },
} as const

// ═══════════════════════════════════════════════════════════════
// ENEMIES
// ═══════════════════════════════════════════════════════════════
export const ENEMIES = {
  bear: {
    attack: `${ENEMY}/Bear/Bear_Attack.png`,
    idle: `${ENEMY}/Bear/Bear_Idle.png`,
    run: `${ENEMY}/Bear/Bear_Run.png`,
  },
  boat: { idle: `${ENEMY}/Boat/Boat_Idle.png` },
  gnoll: {
    bone: `${ENEMY}/Gnoll/Gnoll_Bone.png`,
    hit: `${ENEMY}/Gnoll/Gnoll_Hit.png`,
    idle: `${ENEMY}/Gnoll/Gnoll_Idle.png`,
    throw: `${ENEMY}/Gnoll/Gnoll_Throw.png`,
    walk: `${ENEMY}/Gnoll/Gnoll_Walk.png`,
  },
  gnome: {
    attack: `${ENEMY}/Gnome/Gnome_Attack.png`,
    idle: `${ENEMY}/Gnome/Gnome_Idle.png`,
    run: `${ENEMY}/Gnome/Gnome_Run.png`,
  },
  harpoonFish: {
    harpoon: `${ENEMY}/Harpoon Fish/Harpoon.png`,
    idle: `${ENEMY}/Harpoon Fish/HarpoonFish_Idle.png`,
    run: `${ENEMY}/Harpoon Fish/HarpoonFish_Run.png`,
    throw: `${ENEMY}/Harpoon Fish/HarpoonFish_Throw.png`,
  },
  lancer: {
    attack: `${ENEMY}/Lancer/Lancer_Attack.png`,
    idle: `${ENEMY}/Lancer/Lancer_Idle.png`,
    run: `${ENEMY}/Lancer/Lancer_Run.png`,
  },
  lizard: {
    attack: `${ENEMY}/Lizard/Lizard_Attack.png`,
    hit: `${ENEMY}/Lizard/Lizard_Hit.png`,
    idle: `${ENEMY}/Lizard/Lizard_Idle.png`,
    run: `${ENEMY}/Lizard/Lizard_Run.png`,
  },
  minotaur: {
    attack: `${ENEMY}/Minotaur/Minotaur_Attack.png`,
    guard: `${ENEMY}/Minotaur/Minotaur_Guard.png`,
    idle: `${ENEMY}/Minotaur/Minotaur_Idle.png`,
    walk: `${ENEMY}/Minotaur/Minotaur_Walk.png`,
  },
  paddleFish: {
    attack: `${ENEMY}/Paddle Fish/PaddleFish_Attack.png`,
    idle: `${ENEMY}/Paddle Fish/PaddleFish_Idle.png`,
    run: `${ENEMY}/Paddle Fish/PaddleFish_Run.png`,
  },
  panda: {
    attack: `${ENEMY}/Panda/Panda_Attack.png`,
    guard: `${ENEMY}/Panda/Panda_Guard.png`,
    idle: `${ENEMY}/Panda/Panda_Idle.png`,
    run: `${ENEMY}/Panda/Panda_Run.png`,
  },
  shaman: {
    attack: `${ENEMY}/Shaman/Shaman_Attack.png`,
    explosion: `${ENEMY}/Shaman/Shaman_Explosion.png`,
    idle: `${ENEMY}/Shaman/Shaman_Idle.png`,
    projectile: `${ENEMY}/Shaman/Shaman_Projectile.png`,
    run: `${ENEMY}/Shaman/Shaman_Run.png`,
  },
  skull: {
    attack: `${ENEMY}/Skull/Skull_Attack.png`,
    guard: `${ENEMY}/Skull/Skull_Guard.png`,
    idle: `${ENEMY}/Skull/Skull_Idle.png`,
    run: `${ENEMY}/Skull/Skull_Run.png`,
  },
  snake: {
    attack: `${ENEMY}/Snake/Snake_Attack.png`,
    idle: `${ENEMY}/Snake/Snake_Idle.png`,
    run: `${ENEMY}/Snake/Snake_Run.png`,
  },
  spider: {
    attack: `${ENEMY}/Spider/Spider_Attack.png`,
    idle: `${ENEMY}/Spider/Spider_Idle.png`,
    run: `${ENEMY}/Spider/Spider_Run.png`,
  },
  thief: {
    attack: `${ENEMY}/Thief/Thief_Attack.png`,
    idle: `${ENEMY}/Thief/Thief_Idle.png`,
    run: `${ENEMY}/Thief/Thief_Run.png`,
  },
  troll: {
    attack: `${ENEMY}/Troll/Troll_Attack.png`,
    clubPart1: `${ENEMY}/Troll/Troll_ClubPart1.png`,
    clubPart2: `${ENEMY}/Troll/Troll_ClubPart2.png`,
    dead: `${ENEMY}/Troll/Troll_Dead.png`,
    idle: `${ENEMY}/Troll/Troll_Idle.png`,
    recovery: `${ENEMY}/Troll/Troll_Recovery.png`,
    walk: `${ENEMY}/Troll/Troll_Walk.png`,
    windup: `${ENEMY}/Troll/Troll_Windup.png`,
  },
  turtle: {
    attack: `${ENEMY}/Turtle/Turtle_Attack.png`,
    guardIn: `${ENEMY}/Turtle/Turtle_Guard_In.png`,
    guardOut: `${ENEMY}/Turtle/Turtle_Guard_Out.png`,
    idle: `${ENEMY}/Turtle/Turtle_Idle.png`,
    walk: `${ENEMY}/Turtle/Turtle_Walk.png`,
  },
  avatars: Array.from({ length: 16 }, (_, i) =>
    `${ENEMY}/Enemy Avatars/Enemy Avatars_${String(i + 1).padStart(2, '0')}.png`
  ),
} as const

// ═══════════════════════════════════════════════════════════════
// EFFECTS / PARTICLE FX
// ═══════════════════════════════════════════════════════════════
export const EFFECTS = {
  dust: [
    `${FREE}/Particle FX/Dust_01.png`,
    `${FREE}/Particle FX/Dust_02.png`,
  ],
  explosion: [
    `${FREE}/Particle FX/Explosion_01.png`,
    `${FREE}/Particle FX/Explosion_02.png`,
  ],
  fire: [
    `${FREE}/Particle FX/Fire_01.png`,
    `${FREE}/Particle FX/Fire_02.png`,
    `${FREE}/Particle FX/Fire_03.png`,
  ],
  waterSplash: `${FREE}/Particle FX/Water Splash.png`,
  explosionSheet: `${UPDATE}/Effects/Explosion/Explosions.png`,
  fireSheet: `${UPDATE}/Effects/Fire/Fire.png`,
} as const

// ═══════════════════════════════════════════════════════════════
// UI ELEMENTS
// ═══════════════════════════════════════════════════════════════
export const UI = {
  banners: {
    banner: `${FREE}/UI Elements/UI Elements/Banners/Banner.png`,
    bannerSlots: `${FREE}/UI Elements/UI Elements/Banners/Banner_Slots.png`,
    storeBanner: `${FREE}/UI Elements/UI Banners from the store page/Banner/Banner.png`,
    storeSlots: `${FREE}/UI Elements/UI Banners from the store page/Banner/Slots.png`,
    // Update 010 banners
    connectionDown: `${UPDATE}/UI/Banners/Banner_Connection_Down.png`,
    connectionLeft: `${UPDATE}/UI/Banners/Banner_Connection_Left.png`,
    connectionRight: `${UPDATE}/UI/Banners/Banner_Connection_Right.png`,
    connectionUp: `${UPDATE}/UI/Banners/Banner_Connection_Up.png`,
    horizontal: `${UPDATE}/UI/Banners/Banner_Horizontal.png`,
    vertical: `${UPDATE}/UI/Banners/Banner_Vertical.png`,
    carved3: `${UPDATE}/UI/Banners/Carved_3Slides.png`,
    carved9: `${UPDATE}/UI/Banners/Carved_9Slides.png`,
    carvedRegular: `${UPDATE}/UI/Banners/Carved_Regular.png`,
  },
  bars: {
    bigBase: `${FREE}/UI Elements/UI Elements/Bars/BigBar_Base.png`,
    bigFill: `${FREE}/UI Elements/UI Elements/Bars/BigBar_Fill.png`,
    smallBase: `${FREE}/UI Elements/UI Elements/Bars/SmallBar_Base.png`,
    smallFill: `${FREE}/UI Elements/UI Elements/Bars/SmallBar_Fill.png`,
  },
  buttons: {
    bigBlue: `${FREE}/UI Elements/UI Elements/Buttons/BigBlueButton_Regular.png`,
    bigBluePressed: `${FREE}/UI Elements/UI Elements/Buttons/BigBlueButton_Pressed.png`,
    bigRed: `${FREE}/UI Elements/UI Elements/Buttons/BigRedButton_Regular.png`,
    bigRedPressed: `${FREE}/UI Elements/UI Elements/Buttons/BigRedButton_Pressed.png`,
    smallBlueRound: `${FREE}/UI Elements/UI Elements/Buttons/SmallBlueRoundButton_Regular.png`,
    smallBlueRoundPressed: `${FREE}/UI Elements/UI Elements/Buttons/SmallBlueRoundButton_Pressed.png`,
    smallBlueSquare: `${FREE}/UI Elements/UI Elements/Buttons/SmallBlueSquareButton_Regular.png`,
    smallBlueSquarePressed: `${FREE}/UI Elements/UI Elements/Buttons/SmallBlueSquareButton_Pressed.png`,
    smallRedRound: `${FREE}/UI Elements/UI Elements/Buttons/SmallRedRoundButton_Regular.png`,
    smallRedRoundPressed: `${FREE}/UI Elements/UI Elements/Buttons/SmallRedRoundButton_Pressed.png`,
    smallRedSquare: `${FREE}/UI Elements/UI Elements/Buttons/SmallRedSquareButton_Regular.png`,
    smallRedSquarePressed: `${FREE}/UI Elements/UI Elements/Buttons/SmallRedSquareButton_Pressed.png`,
    tinyRoundBlue: `${FREE}/UI Elements/UI Elements/Buttons/TinyRoundBlueButton.png`,
    tinyRoundRed: `${FREE}/UI Elements/UI Elements/Buttons/TinyRoundRedButton.png`,
    tinySquareBlue: `${FREE}/UI Elements/UI Elements/Buttons/TinySquareBlueButton.png`,
    tinySquareRed: `${FREE}/UI Elements/UI Elements/Buttons/TinySquareRedButton.png`,
    // Update 010
    blue010: `${UPDATE}/UI/Buttons/Button_Blue.png`,
    blue010Pressed: `${UPDATE}/UI/Buttons/Button_Blue_Pressed.png`,
    blue3: `${UPDATE}/UI/Buttons/Button_Blue_3Slides.png`,
    blue3Pressed: `${UPDATE}/UI/Buttons/Button_Blue_3Slides_Pressed.png`,
    blue9: `${UPDATE}/UI/Buttons/Button_Blue_9Slides.png`,
    blue9Pressed: `${UPDATE}/UI/Buttons/Button_Blue_9Slides_Pressed.png`,
    red010: `${UPDATE}/UI/Buttons/Button_Red.png`,
    red010Pressed: `${UPDATE}/UI/Buttons/Button_Red_Pressed.png`,
    red3: `${UPDATE}/UI/Buttons/Button_Red_3Slides.png`,
    red3Pressed: `${UPDATE}/UI/Buttons/Button_Red_3Slides_Pressed.png`,
    red9: `${UPDATE}/UI/Buttons/Button_Red_9Slides.png`,
    red9Pressed: `${UPDATE}/UI/Buttons/Button_Red_9Slides_Pressed.png`,
    disable: `${UPDATE}/UI/Buttons/Button_Disable.png`,
    disable3: `${UPDATE}/UI/Buttons/Button_Disable_3Slides.png`,
    disable9: `${UPDATE}/UI/Buttons/Button_Disable_9Slides.png`,
    hover: `${UPDATE}/UI/Buttons/Button_Hover.png`,
    hover3: `${UPDATE}/UI/Buttons/Button_Hover_3Slides.png`,
    hover9: `${UPDATE}/UI/Buttons/Button_Hover_9Slides.png`,
  },
  cursors: [
    `${FREE}/UI Elements/UI Elements/Cursors/Cursor_01.png`,
    `${FREE}/UI Elements/UI Elements/Cursors/Cursor_02.png`,
    `${FREE}/UI Elements/UI Elements/Cursors/Cursor_03.png`,
    `${FREE}/UI Elements/UI Elements/Cursors/Cursor_04.png`,
  ],
  avatars: Array.from({ length: 25 }, (_, i) =>
    `${FREE}/UI Elements/UI Elements/Human Avatars/Avatars_${String(i + 1).padStart(2, '0')}.png`
  ),
  icons: {
    free: Array.from({ length: 12 }, (_, i) =>
      `${FREE}/UI Elements/UI Elements/Icons/Icon_${String(i + 1).padStart(2, '0')}.png`
    ),
    regular: Array.from({ length: 10 }, (_, i) =>
      `${UPDATE}/UI/Icons/Regular_${String(i + 1).padStart(2, '0')}.png`
    ),
    pressed: Array.from({ length: 10 }, (_, i) =>
      `${UPDATE}/UI/Icons/Pressed_${String(i + 1).padStart(2, '0')}.png`
    ),
    disabled: Array.from({ length: 10 }, (_, i) =>
      `${UPDATE}/UI/Icons/Disable_${String(i + 1).padStart(2, '0')}.png`
    ),
  },
  papers: {
    regular: `${FREE}/UI Elements/UI Elements/Papers/RegularPaper.png`,
    special: `${FREE}/UI Elements/UI Elements/Papers/SpecialPaper.png`,
  },
  ribbons: {
    big: `${FREE}/UI Elements/UI Elements/Ribbons/BigRibbons.png`,
    small: `${FREE}/UI Elements/UI Elements/Ribbons/SmallRibbons.png`,
    storeBlack: `${FREE}/UI Elements/UI Banners from the store page/Ribbons/Ribbon_Black.png`,
    storeBlue: `${FREE}/UI Elements/UI Banners from the store page/Ribbons/Ribbon_Blue.png`,
    storePurple: `${FREE}/UI Elements/UI Banners from the store page/Ribbons/Ribbon_Purple.png`,
    storeRed: `${FREE}/UI Elements/UI Banners from the store page/Ribbons/Ribbon_Red.png`,
    storeYellow: `${FREE}/UI Elements/UI Banners from the store page/Ribbons/Ribbon_Yellow.png`,
    // Update 010 ribbons
    blue3: `${UPDATE}/UI/Ribbons/Ribbon_Blue_3Slides.png`,
    red3: `${UPDATE}/UI/Ribbons/Ribbon_Red_3Slides.png`,
    yellow3: `${UPDATE}/UI/Ribbons/Ribbon_Yellow_3Slides.png`,
  },
  swords: `${FREE}/UI Elements/UI Elements/Swords/Swords.png`,
  woodTable: `${FREE}/UI Elements/UI Elements/Wood Table/WoodTable.png`,
  woodTableSlots: `${FREE}/UI Elements/UI Elements/Wood Table/WoodTable_Slots.png`,
  pointers: Array.from({ length: 6 }, (_, i) =>
    `${UPDATE}/UI/Pointers/${String(i + 1).padStart(2, '0')}.png`
  ),
} as const

// ═══════════════════════════════════════════════════════════════
// COLOR MAPPINGS for player indices
// ═══════════════════════════════════════════════════════════════
export type GameFactionColor = 'blue' | 'red' | 'purple' | 'yellow'
export const FACTION_COLORS: GameFactionColor[] = ['blue', 'red', 'purple', 'yellow']

export function getPlayerFactionColor(playerIndex: number): GameFactionColor {
  return FACTION_COLORS[playerIndex % FACTION_COLORS.length]
}
