/**
 * gameInstructions.ts — registry of per-game keybinds, objectives & tips.
 *
 * Consumed by PauseMenu to show game-specific help in the Controls tab.
 */

import { GAME_INSTRUCTIONS_LARGE } from './gameInstructionsLarge'

export interface GameInstruction {
  /** Short description of the objective (1-2 sentences) */
  objective: string
  /** Keyboard controls (shared across all keyboard groups) */
  keyboard: { action: string; keys: string }[]
  /** Gamepad controls */
  gamepad: { action: string; button: string }[]
  /** Tips or strategy hints */
  tips?: string[]
}

export const GAME_INSTRUCTIONS: Record<string, GameInstruction> = {
  /* ── Classic arcade mini-games ─────────────────────────── */

  snakes: {
    objective: 'Eat food to grow longer. Avoid walls and other snakes.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Boost', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Boost', button: 'A' },
    ],
    tips: ['Trap opponents by cutting off their path.', 'Boost burns length — use it wisely.'],
  },

  tron: {
    objective: 'Leave a trail of light and force opponents to crash into walls or trails.',
    keyboard: [
      { action: 'Steer', keys: 'WASD / Arrows' },
      { action: 'Boost', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Steer', button: 'D-pad / Left Stick' },
      { action: 'Boost', button: 'A' },
    ],
    tips: ['Stay near the center to keep your options open.', 'Boost to cut off opponents quickly.'],
  },

  pong: {
    objective: 'Deflect the ball past your opponent to score points.',
    keyboard: [
      { action: 'Move paddle', keys: 'W/S or Up/Down' },
      { action: 'Launch ball', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move paddle', button: 'D-pad / Left Stick' },
      { action: 'Launch ball', button: 'A' },
    ],
    tips: ['Hit the ball with the edge of the paddle to add spin.'],
  },

  tag: {
    objective: "One player is 'it'. Tag another player to transfer the role. Don't be 'it' when time runs out.",
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Dash', keys: 'Space / Enter' },
      { action: 'Dodge', keys: 'Shift / E' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Dash', button: 'A' },
      { action: 'Dodge', button: 'X' },
    ],
  },

  painters: {
    objective: 'Paint as much of the arena in your color as possible before time runs out.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Paint burst', keys: 'Space / Enter' },
      { action: 'Steal paint', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Paint burst', button: 'A' },
      { action: 'Steal paint', button: 'X' },
    ],
    tips: ['Paint burst covers a large area but has a cooldown.'],
  },

  asteroids: {
    objective: 'Destroy asteroids and survive as long as possible. Avoid collisions.',
    keyboard: [
      { action: 'Rotate', keys: 'A/D or Left/Right' },
      { action: 'Thrust', keys: 'W / Up' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Teleport', keys: 'Shift / E' },
    ],
    gamepad: [
      { action: 'Rotate / Thrust', button: 'Left Stick' },
      { action: 'Shoot', button: 'A' },
      { action: 'Teleport', button: 'X' },
    ],
    tips: ['Small asteroids are faster — clear them quickly.', 'Teleport is risky but can save you.'],
  },

  reaction: {
    objective: 'Press the action button as fast as possible when the signal appears.',
    keyboard: [
      { action: 'React', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'React', button: 'A' },
    ],
    tips: ['Pressing too early counts as a fault!'],
  },

  sumo: {
    objective: 'Push your opponent out of the ring.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Push', keys: 'Space / Enter' },
      { action: 'Brace', keys: 'Shift / E' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Push', button: 'A' },
      { action: 'Brace', button: 'X' },
    ],
  },

  breakout: {
    objective: 'Destroy all bricks by bouncing the ball off your paddle.',
    keyboard: [
      { action: 'Move paddle', keys: 'A/D or Left/Right' },
      { action: 'Launch ball', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move paddle', button: 'D-pad / Left Stick' },
      { action: 'Launch ball', button: 'A' },
    ],
    tips: ['Aim for the top rows first to get power-ups early.'],
  },

  dodgeball: {
    objective: 'Hit opponents with the ball while dodging incoming throws.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Throw / Pick up', keys: 'Space / Enter' },
      { action: 'Dodge roll', keys: 'Shift / E' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Throw / Pick up', button: 'A' },
      { action: 'Dodge roll', button: 'X' },
    ],
  },

  race: {
    objective: 'Finish the race ahead of all opponents.',
    keyboard: [
      { action: 'Steer', keys: 'A/D or Left/Right' },
      { action: 'Accelerate', keys: 'W / Up' },
      { action: 'Brake', keys: 'S / Down' },
      { action: 'Nitro', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Steer', button: 'Left Stick' },
      { action: 'Accelerate / Brake', button: 'RT / LT' },
      { action: 'Nitro', button: 'A' },
    ],
    tips: ['Save nitro for straight sections.'],
  },

  tanks: {
    objective: 'Destroy enemy tanks while protecting your own.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot', keys: 'Space / Enter' },
      { action: 'Aim turret', keys: 'Q/E or Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'Left Stick' },
      { action: 'Aim', button: 'Right Stick' },
      { action: 'Shoot', button: 'A' },
    ],
    tips: ['Shells ricochet off walls — use bank shots!'],
  },

  maze: {
    objective: 'Navigate the maze and reach the exit before your opponents.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Use item', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Use item', button: 'A' },
    ],
    tips: ['Follow the right wall to solve most mazes.'],
  },

  hockey: {
    objective: 'Score goals by hitting the puck into the opponent\'s net.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Shoot / Hit', keys: 'Space / Enter' },
      { action: 'Pass', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Shoot / Hit', button: 'A' },
      { action: 'Pass', button: 'X' },
    ],
  },

  volleyball: {
    objective: 'Hit the ball over the net and make it land on the opponent\'s side.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump', keys: 'W / Up' },
      { action: 'Hit ball', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
      { action: 'Hit ball', button: 'X' },
    ],
  },

  archery: {
    objective: 'Aim and shoot your arrow at the target. Closest to bullseye wins.',
    keyboard: [
      { action: 'Aim', keys: 'WASD / Arrows' },
      { action: 'Draw bow', keys: 'Hold Space / Enter' },
      { action: 'Release', keys: 'Release Space / Enter' },
    ],
    gamepad: [
      { action: 'Aim', button: 'Left Stick' },
      { action: 'Draw & Release', button: 'Hold / Release A' },
    ],
    tips: ['Account for wind direction shown on the HUD.'],
  },

  fishing: {
    objective: 'Catch as many fish as possible before time runs out.',
    keyboard: [
      { action: 'Cast / Reel', keys: 'Space / Enter' },
      { action: 'Move rod', keys: 'WASD / Arrows' },
      { action: 'Hook', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Cast / Reel', button: 'A' },
      { action: 'Move rod', button: 'Left Stick' },
      { action: 'Hook', button: 'X' },
    ],
    tips: ['Wait for the bobber to dip before hooking.'],
  },

  lava: {
    objective: 'The floor is lava! Stay on platforms and don\'t fall.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump', keys: 'W / Up / Space' },
      { action: 'Grab ledge', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
      { action: 'Grab ledge', button: 'X' },
    ],
  },

  joust: {
    objective: 'Fly and land on opponents from above to knock them out.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Flap', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Flap', button: 'A' },
    ],
    tips: ['Height advantage wins every collision.'],
  },

  collect: {
    objective: 'Collect more items than your opponents before the timer ends.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Grab', keys: 'Space / Enter' },
      { action: 'Use power-up', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Grab', button: 'A' },
      { action: 'Use power-up', button: 'X' },
    ],
  },

  bounce: {
    objective: 'Bounce on platforms and reach the highest point to score.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump', keys: 'Space / W / Up' },
      { action: 'Slam down', keys: 'S / Down' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
      { action: 'Slam down', button: 'X' },
    ],
  },

  spiral: {
    objective: 'Navigate the spiral path without falling off the edge.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Dash', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Dash', button: 'A' },
    ],
    tips: ['Slow and steady wins — dashing near edges is risky.'],
  },

  duel: {
    objective: 'Defeat your opponent in a one-on-one duel.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Attack', keys: 'Space / Enter' },
      { action: 'Block', keys: 'Shift / E' },
      { action: 'Special', keys: 'Q / Ctrl' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Attack', button: 'A' },
      { action: 'Block / Special', button: 'X / Y' },
    ],
    tips: ['Block just before impact for a perfect parry.'],
  },

  capture: {
    objective: 'Capture the flag from the enemy base and return it to yours.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Grab / Drop flag', keys: 'Space / Enter' },
      { action: 'Dash', keys: 'Shift / E' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Grab / Drop flag', button: 'A' },
      { action: 'Dash', button: 'X' },
    ],
  },

  bombs: {
    objective: 'Place bombs to destroy obstacles and eliminate opponents.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Place bomb', keys: 'Space / Enter' },
      { action: 'Detonate', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Place bomb', button: 'A' },
      { action: 'Detonate', button: 'X' },
    ],
    tips: ['Break crates to find power-ups that increase blast radius.'],
  },

  'color-match': {
    objective: 'Stand on the tile that matches the displayed color before time runs out.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Confirm', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Confirm', button: 'A' },
    ],
    tips: ['React early — wrong tiles drop away fast!'],
  },

  survive: {
    objective: 'Stay alive as long as possible against waves of hazards.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Dash', keys: 'Space / Enter' },
      { action: 'Shield', keys: 'Shift / E' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Dash', button: 'A' },
      { action: 'Shield', button: 'X' },
    ],
  },

  climber: {
    objective: 'Race to the top of the tower. First player to the summit wins.',
    keyboard: [
      { action: 'Move', keys: 'A/D or Left/Right' },
      { action: 'Jump / Climb', keys: 'W / Up / Space' },
      { action: 'Grab wall', keys: 'E / Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
      { action: 'Grab wall', button: 'X' },
    ],
  },

  simon: {
    objective: 'Repeat the growing sequence of colors and sounds without mistakes.',
    keyboard: [
      { action: 'Select panel', keys: 'WASD / Arrows' },
      { action: 'Confirm', keys: 'Space / Enter' },
    ],
    gamepad: [
      { action: 'Select panel', button: 'D-pad' },
      { action: 'Confirm', button: 'A' },
    ],
    tips: ['Say the colors aloud to help memorize the pattern.'],
  },

  bunny: {
    objective: 'Guide the bunny to collect carrots while avoiding traps.',
    keyboard: [
      { action: 'Move', keys: 'WASD / Arrows' },
      { action: 'Jump', keys: 'Space / Enter' },
      { action: 'Burrow', keys: 'S / Down + Shift' },
    ],
    gamepad: [
      { action: 'Move', button: 'D-pad / Left Stick' },
      { action: 'Jump', button: 'A' },
      { action: 'Burrow', button: 'X' },
    ],
  },

  /* ── Larger / inspired-by games (see gameInstructionsLarge.ts) ── */
  ...GAME_INSTRUCTIONS_LARGE,
}
