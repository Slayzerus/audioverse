/**
 * gameInstructionsLarge.ts — larger / inspired-by game instructions.
 *
 * Split from gameInstructions.ts to keep file sizes manageable.
 */

import type { GameInstruction } from './gameInstructions'

export const GAME_INSTRUCTIONS_LARGE: Record<string, GameInstruction> = {
  tetris: {
    objective: 'Complete horizontal lines by arranging falling blocks. Don\'t let them stack to the top.',
    keyboard: [
      { action: 'Move piece', keys: 'A/D or Left/Right' },
      { action: 'Rotate', keys: 'W / Up' },
      { action: 'Soft drop', keys: 'S / Down' },
      { action: 'Hard drop', keys: 'Space' },
    ],
    gamepad: [
      { action: 'Move piece', button: 'D-pad / Left Stick' },
      { action: 'Rotate', button: 'A' },
      { action: 'Hard drop', button: 'X' },
    ],
    tips: ['Leave space for the I-piece to score a Tetris (4 lines).'],
  },

  worms: {
    objective: 'Eliminate the opposing team\'s worms using an arsenal of weapons.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump', keys: 'W / Up' },
      { action: 'Aim', keys: 'Mouse / Arrows' },
      { action: 'Fire', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move / Aim', button: 'Left Stick' },
      { action: 'Fire', button: 'A' },
      { action: 'Switch weapon', button: 'X / Y' },
    ],
    tips: ['Wind affects projectile arcs — check the indicator.'],
  },

  'no-time-to-relax': {
    objective: 'Manage your island\'s resources to keep your villagers happy and survive.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Select / Place', keys: 'Space / Enter' },
      { action: 'Cancel', keys: 'E / Shift' },
      { action: 'Open build menu', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'Left Stick' },
      { action: 'Select / Place', button: 'A' },
      { action: 'Cancel / Menu', button: 'X / Y' },
    ],
    tips: ['Balance food and shelter — storms come without warning.'],
  },

  'ultimate-chicken-horse': {
    objective: 'Place traps and platforms, then race to the flag. Score points for reaching it while others fail.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump', keys: 'W / Up / Space' },
      { action: 'Place block', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
      { action: 'Place block', button: 'X' },
    ],
    tips: ['Make the path hard enough to stop rivals but possible for you.'],
  },

  'police-stories': {
    objective: 'Clear rooms of hostiles and rescue hostages. Don\'t shoot civilians.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Open door / Interact', keys: 'E / Shift' },
      { action: 'Flashbang', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'Left Stick' },
      { action: 'Shoot', button: 'A' },
      { action: 'Interact / Flashbang', button: 'X / Y' },
    ],
    tips: ['Kick doors open to stun enemies inside.'],
  },

  'tooth-and-tail': {
    objective: 'Lead your army to destroy the enemy\'s food stockpile.',
    keyboard: [
      { action: 'Move commander', keys: 'WASD / Arrows' },
      { action: 'Rally troops', keys: 'Space / Enter' },
      { action: 'Build burrow', keys: 'E / Shift' },
      { action: 'Select unit type', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'Left Stick' },
      { action: 'Rally', button: 'A' },
      { action: 'Build / Select', button: 'X / Y' },
    ],
    tips: ['Expand early to secure more farms.'],
  },

  'eight-minute-empire': {
    objective: 'Conquer regions and collect goods to earn the most points within eight minutes.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Select card', keys: 'Space / Enter' },
      { action: 'Confirm action', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Select / Confirm', button: 'A / X' },
    ],
    tips: ['Cheaper cards save coins for later, more powerful actions.'],
  },

  overcooked: {
    objective: 'Cook and serve dishes cooperatively before orders expire.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Pick up / Drop', keys: 'Space / Enter' },
      { action: 'Chop / Interact', keys: 'E / Shift' },
      { action: 'Dash', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Pick up / Drop', button: 'A' },
      { action: 'Chop / Dash', button: 'X / Y' },
    ],
    tips: ['Assign roles — one player chops, another serves.'],
  },

  'sensible-soccer': {
    objective: 'Score more goals than the opposing team before the final whistle.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Pass / Tackle', keys: 'Space / Enter' },
      { action: 'Shoot / Slide', keys: 'E / Shift' },
      { action: 'Lob / Switch', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Pass / Tackle', button: 'A' },
      { action: 'Shoot / Slide', button: 'X / Y' },
    ],
    tips: ['Aftertouch: hold a direction after shooting to curve the ball.'],
  },

  'magic-the-gathering': {
    objective: 'Reduce your opponent\'s life to zero using spells, creatures and strategy.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Play card', keys: 'Space / Enter' },
      { action: 'Tap / Untap', keys: 'E / Shift' },
      { action: 'End phase', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Play / Select', button: 'A' },
      { action: 'Tap / End phase', button: 'X / Y' },
    ],
    tips: ['Save mana for instant-speed spells during the opponent\'s turn.'],
  },

  'river-city-girls': {
    objective: 'Beat up enemies across the city to rescue your kidnapped boyfriends.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Punch', keys: 'Space / Enter' },
      { action: 'Kick', keys: 'E / Shift' },
      { action: 'Special', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Punch / Kick', button: 'A / X' },
      { action: 'Special', button: 'Y' },
    ],
    tips: ['Juggle enemies in the air for bonus combo damage.'],
  },

  uplink: {
    objective: 'Hack into corporate systems, steal data and cover your tracks.',
    keyboard: [
      { action: 'Navigate', keys: 'WASD / Arrows' },
      { action: 'Select / Confirm', keys: 'Space / Enter' },
      { action: 'Use tool', keys: 'E / Shift' },
      { action: 'Cancel', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Navigate', button: 'D-pad / Left Stick' },
      { action: 'Select / Confirm', button: 'A' },
      { action: 'Cancel / Tool', button: 'X / Y' },
    ],
    tips: ['Always bounce your connection through multiple servers.'],
  },

  gta2: {
    objective: 'Complete missions and earn respect from gangs across the city.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot / Action', keys: 'Space / Enter' },
      { action: 'Enter vehicle', keys: 'E / Shift' },
      { action: 'Weapon swap', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'Left Stick' },
      { action: 'Shoot / Action', button: 'A' },
      { action: 'Vehicle / Weapon', button: 'X / Y' },
    ],
    tips: ['Helping one gang may anger another — choose wisely.'],
  },

  fallout: {
    objective: 'Explore the wasteland, complete quests and survive the harsh environment.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Interact', keys: 'Space / Enter' },
      { action: 'Inventory', keys: 'E / Shift' },
      { action: 'V.A.T.S. / Aim', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'Left Stick' },
      { action: 'Interact', button: 'A' },
      { action: 'Inventory / V.A.T.S.', button: 'X / Y' },
    ],
    tips: ['Scavenge everything — caps and junk are valuable.'],
  },

  battlefield: {
    objective: 'Work with your team to capture objectives and deplete the enemy\'s tickets.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Reload / Interact', keys: 'E / Shift' },
      { action: 'Crouch / Prone', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move / Aim', button: 'Left / Right Stick' },
      { action: 'Shoot', button: 'RT' },
      { action: 'Reload / Crouch', button: 'X / B' },
    ],
    tips: ['Stick with your squad for spawn and support benefits.'],
  },

  soldat: {
    objective: 'Eliminate opponents in fast-paced 2D combat with realistic physics.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump / Jet', keys: 'W / Up' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Throw grenade', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move / Aim', button: 'Left Stick' },
      { action: 'Shoot', button: 'A' },
      { action: 'Grenade / Jet', button: 'X / Y' },
    ],
    tips: ['Use the jetpack in short bursts for better aim control.'],
  },

  'swords-and-sandals': {
    objective: 'Defeat gladiators in turn-based combat to become champion of the arena.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Select action', keys: 'Space / Enter' },
      { action: 'Taunt', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Select action', button: 'A' },
      { action: 'Taunt', button: 'X' },
    ],
    tips: ['A well-timed taunt can drain the opponent\'s morale.'],
  },

  'battle-of-wesnoth': {
    objective: 'Lead your army across hex-based maps, capture villages and defeat enemy leaders.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Select / Confirm', keys: 'Space / Enter' },
      { action: 'Cancel', keys: 'E / Shift' },
      { action: 'End turn', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Select / Confirm', button: 'A' },
      { action: 'Cancel / End turn', button: 'X / Y' },
    ],
    tips: ['Terrain matters — forests give defense bonuses.'],
  },

  'adventure-capitalist': {
    objective: 'Build a business empire by investing profits into increasingly lucrative ventures.',
    keyboard: [
      { action: 'Navigate', keys: 'WASD / Arrows' },
      { action: 'Buy / Upgrade', keys: 'Space / Enter' },
      { action: 'Hire manager', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Navigate', button: 'D-pad / Left Stick' },
      { action: 'Buy / Upgrade', button: 'A' },
      { action: 'Hire manager', button: 'X' },
    ],
    tips: ['Managers automate income — unlock them as soon as possible.'],
  },

  'might-and-magic': {
    objective: 'Explore dungeons, fight monsters and collect treasure in a first-person RPG.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Attack / Interact', keys: 'Space / Enter' },
      { action: 'Cast spell', keys: 'E / Shift' },
      { action: 'Open inventory', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Attack / Interact', button: 'A' },
      { action: 'Spell / Inventory', button: 'X / Y' },
    ],
    tips: ['Rest at inns to fully restore HP and mana.'],
  },

  'heroes-of-might-and-magic': {
    objective: 'Build your kingdom, recruit heroes and conquer the map in turn-based strategy.',
    keyboard: [
      { action: 'Move hero', keys: 'WASD / Arrows' },
      { action: 'End turn', keys: 'Enter / E' },
      { action: 'Next hero', keys: 'Tab' },
      { action: 'Open town', keys: 'T (at own town)' },
      { action: 'Close / Pause', keys: 'Escape' },
    ],
    gamepad: [
      { action: 'Move hero', button: 'D-pad / Left Stick' },
      { action: 'Confirm', button: 'A' },
      { action: 'Cancel', button: 'B' },
    ],
    tips: ['Flag mines early for a steady resource income.', 'Visit shrines and wells to power up your hero.'],
  },

  'oil-imperium': {
    objective: 'Build an oil empire by drilling, refining and outselling your competitors.',
    keyboard: [
      { action: 'Navigate menu', keys: 'WASD / Arrows' },
      { action: 'Select / Build', keys: 'Space / Enter' },
      { action: 'Sell / Trade', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Navigate', button: 'D-pad / Left Stick' },
      { action: 'Select / Build', button: 'A' },
      { action: 'Sell / Trade', button: 'X' },
    ],
    tips: ['Monitor oil prices and sell when the market peaks.'],
  },

  'transport-tycoon': {
    objective: 'Build transport routes connecting cities and industries to earn profit.',
    keyboard: [
      { action: 'Scroll map', keys: 'WASD / Arrows' },
      { action: 'Place / Select', keys: 'Space / Enter' },
      { action: 'Demolish', keys: 'E / Shift' },
      { action: 'Open menu', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Scroll map', button: 'Left Stick' },
      { action: 'Place / Select', button: 'A' },
      { action: 'Demolish / Menu', button: 'X / Y' },
    ],
    tips: ['Short, high-frequency routes are more profitable early on.'],
  },

  'sim-city': {
    objective: 'Zone, build infrastructure and manage your city to grow a thriving metropolis.',
    keyboard: [
      { action: 'Scroll map', keys: 'WASD / Arrows' },
      { action: 'Place zone / building', keys: 'Space / Enter' },
      { action: 'Bulldoze', keys: 'E / Shift' },
      { action: 'Open budget', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Scroll map', button: 'Left Stick' },
      { action: 'Place / Select', button: 'A' },
      { action: 'Bulldoze / Budget', button: 'X / Y' },
    ],
    tips: ['Keep industrial zones away from residential for higher land value.'],
  },

  rts: {
    objective: 'Gather resources, build a base and destroy the enemy headquarters.',
    keyboard: [
      { action: 'Scroll map', keys: 'WASD / Arrows' },
      { action: 'Select / Command', keys: 'Space / Enter' },
      { action: 'Build menu', keys: 'E / Shift' },
      { action: 'Attack move', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Scroll / Select', button: 'Left Stick / A' },
      { action: 'Build', button: 'X' },
      { action: 'Attack move', button: 'Y' },
    ],
    tips: ['Scout early to find the enemy base and plan your strategy.'],
  },

  settlers: {
    objective: 'Settle land, build roads and trade to expand your colony.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Place / Select', keys: 'Space / Enter' },
      { action: 'Trade', keys: 'E / Shift' },
      { action: 'End turn', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Place / Select', button: 'A' },
      { action: 'Trade / End turn', button: 'X / Y' },
    ],
    tips: ['Build on ports for flexible trading options.'],
  },

  civilization: {
    objective: 'Guide your civilization from the ancient era to the space age and achieve victory.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Select / Confirm', keys: 'Space / Enter' },
      { action: 'Tech tree', keys: 'E / Shift' },
      { action: 'End turn', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Select / Confirm', button: 'A' },
      { action: 'Tech / End turn', button: 'X / Y' },
    ],
    tips: ['Focus on science early to outpace opponents in technology.'],
  },

  'league-of-legends': {
    objective: 'Work with your team to destroy the enemy Nexus.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Basic attack', keys: 'Space / Enter' },
      { action: 'Ability', keys: 'E / Shift' },
      { action: 'Ultimate', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'Left Stick' },
      { action: 'Attack / Ability', button: 'A / X' },
      { action: 'Ultimate', button: 'Y' },
    ],
    tips: ['Farm minions for gold — don\'t chase kills recklessly.'],
  },

  pokemon: {
    objective: 'Catch, train and battle Pokémon to become the champion.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Confirm / Talk', keys: 'Space / Enter' },
      { action: 'Cancel / Run', keys: 'E / Shift' },
      { action: 'Menu', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Confirm', button: 'A' },
      { action: 'Cancel / Menu', button: 'X / Start' },
    ],
    tips: ['Type advantages deal double damage — exploit them.'],
  },

  'auto-survivors': {
    objective: 'Survive waves of enemies that grow stronger each minute. Collect power-ups to scale.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Pick upgrade', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Pick upgrade', button: 'A' },
    ],
    tips: ['Stay mobile — standing still gets you swarmed.', 'Focus on one damage type early for synergy.'],
  },

  shmup: {
    objective: 'Shoot down waves of enemies and defeat the boss at the end of each stage.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Bomb', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Shoot', button: 'A' },
      { action: 'Bomb', button: 'X' },
    ],
    tips: ['Your hitbox is tiny — weave between bullet patterns.'],
  },

  doom: {
    objective: 'Fight through demon-infested levels, find keys and reach the exit.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Open door / Use', keys: 'E / Shift' },
      { action: 'Weapon swap', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move / Aim', button: 'Left / Right Stick' },
      { action: 'Shoot', button: 'RT / A' },
      { action: 'Use / Swap weapon', button: 'X / Y' },
    ],
    tips: ['Explore secrets for extra ammo and health.'],
  },

  memo: {
    objective: 'Flip cards and find matching pairs. Clear the board with the fewest moves.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Flip card', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move cursor', button: 'D-pad / Left Stick' },
      { action: 'Flip card', button: 'A' },
    ],
    tips: ['Focus on remembering positions rather than flipping randomly.'],
  },

  'drag-racing': {
    objective: 'Shift gears at the perfect RPM to cross the finish line first.',
    keyboard: [
      { action: 'Accelerate', keys: 'W / Up' },
      { action: 'Shift up', keys: 'Space / Enter' },
      { action: 'Shift down', keys: 'S / Down' },
      { action: 'Use nitro', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Accelerate', button: 'RT' },
      { action: 'Shift up / down', button: 'A / X' },
      { action: 'Nitro', button: 'Y' },
    ],
    tips: ['Shift in the green zone for max acceleration.'],
  },

  'car-dodge': {
    objective: 'Drive upward, dodge obstacles and collect fuel to survive as long as possible.',
    keyboard: [
      { action: 'Change lane', keys: 'A/D / Left/Right' },
      { action: 'Boost', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Change lane', button: 'D-pad Left/Right' },
      { action: 'Boost', button: 'A' },
    ],
    tips: ['Collect fuel pickups to extend your run.', 'Speed increases over time — stay alert!'],
  },

  'star-merchant': {
    objective: 'Travel between planets, buy commodities low and sell high to accumulate wealth.',
    keyboard: [
      { action: 'Move ship', keys: 'WASD / Arrows' },
      { action: 'Trade / Interact', keys: 'Space / Enter' },
      { action: 'Cycle commodity', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Trade', button: 'A' },
      { action: 'Cycle', button: 'X' },
    ],
    tips: ['Prices fluctuate — buy when cheap, sell when expensive.', 'Watch out for pirates between planets.'],
  },

  'master-of-orion': {
    objective: 'Colonize planets, build fleets, research tech and conquer the galaxy.',
    keyboard: [
      { action: 'Scroll map', keys: 'WASD / Arrows' },
      { action: 'Select / Command', keys: 'Space / Enter' },
      { action: 'Build menu', keys: 'E / Shift' },
      { action: 'Advance tech', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Scroll', button: 'D-pad / Left Stick' },
      { action: 'Select', button: 'A' },
      { action: 'Build', button: 'X' },
    ],
    tips: ['Research unlocks stronger ships and abilities.', 'Colony ships found new outposts.'],
  },

  puzzle: {
    objective: 'Slide tiles into the correct order as fast as possible.',
    keyboard: [
      { action: 'Select tile', keys: 'WASD / Arrows' },
      { action: 'Slide tile', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Select', button: 'D-pad / Left Stick' },
      { action: 'Slide', button: 'A' },
    ],
    tips: ['Combo: slide multiple tiles in succession for bonus points.'],
  },

  pipes: {
    objective: 'Rotate pipe pieces to connect the source to the target before water floods.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Rotate clockwise', keys: 'Space / Enter' },
      { action: 'Rotate counter-clockwise', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Rotate CW', button: 'A' },
      { action: 'Rotate CCW', button: 'X' },
    ],
    tips: ['Water starts flowing after the countdown — plan your connections early!'],
  },

  'sim-tower': {
    objective: 'Build and manage a skyscraper — place offices, shops, residences and elevators to earn stars.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Build', keys: 'Space / Enter' },
      { action: 'Cycle floor type', keys: 'E / Shift' },
      { action: 'Demolish', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Build', button: 'A' },
      { action: 'Cycle type', button: 'X' },
      { action: 'Demolish', button: 'Y' },
    ],
    tips: ['Elevators are essential for tall buildings.', 'Mix floor types for higher happiness.'],
  },

  'icy-tower': {
    objective: 'Jump from platform to platform, climbing ever higher. Don\'t fall off the screen!',
    keyboard: [
      { action: 'Move left/right', keys: 'A/D / Left/Right' },
      { action: 'Jump', keys: 'Space / W / Up' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
    ],
    tips: ['Quick successive jumps build combos for higher bounces.', 'Bounce off walls for speed.'],
  },

  ships: {
    objective: 'Sail the seas, fire broadsides at enemies and collect treasure chests.',
    keyboard: [
      { action: 'Move ship', keys: 'WASD / Arrows' },
      { action: 'Fire cannons', keys: 'Space / Enter' },
      { action: 'Rotate ship', keys: 'Q/E' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Fire', button: 'A' },
      { action: 'Rotate', button: 'LB / RB' },
    ],
    tips: ['Cannons fire from the sides — position your ship broadside to enemies.'],
  },

  'horizon-chase': {
    objective: 'Race to the finish using lane changes only — dodge traffic and collect fuel.',
    keyboard: [
      { action: 'Change lane', keys: 'A/D / Left/Right' },
      { action: 'Turbo boost', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Change lane', button: 'D-pad Left/Right' },
      { action: 'Turbo', button: 'A' },
    ],
    tips: ['Fuel runs out — grab fuel cans to keep going.', 'Save turbo for straights.'],
  },

  'escape-room': {
    objective: 'Solve puzzles in each room to find the key and escape before time runs out.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Interact', keys: 'Space / Enter' },
      { action: 'Use item', keys: 'E / Shift' },
      { action: 'Hint', keys: 'H' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Interact', button: 'A' },
      { action: 'Use item', button: 'X' },
      { action: 'Hint', button: 'Y' },
    ],
    tips: ['Hints cost coins but can save precious time.', 'Examine everything — clues hide in plain sight.'],
  },

  spore: {
    objective: 'Eat creatures smaller than you to grow. Avoid anything bigger!',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Boost (costs mass)', keys: 'Space / Enter' },
      { action: 'Eject mass', keys: 'E / Shift' },
      { action: 'Split', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Boost', button: 'A' },
      { action: 'Split', button: 'Y' },
    ],
    tips: ['Green outlines = safe to eat. Red = danger!', 'Splitting gives speed but makes you vulnerable.'],
  },

  'auction-house': {
    objective: 'Buy items from garage sales, appraise and restore them, then sell at auction for profit.',
    keyboard: [
      { action: 'Move cursor', keys: 'WASD / Arrows' },
      { action: 'Buy / Bid / Select', keys: 'Space / Enter' },
      { action: 'Appraise / Restore', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Buy / Bid', button: 'A' },
      { action: 'Appraise', button: 'X' },
    ],
    tips: ['Invest in appraisal upgrades to spot fakes.', 'Restoring items can double their value.'],
  },
}
