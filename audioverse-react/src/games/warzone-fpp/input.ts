/**
 * Input handling for the Warzone FPP 3D FPS game.
 *
 * FPS Controls (Keyboard + Mouse):
 *   W/A/S/D  — move (forward/strafe)
 *   Shift    — sprint
 *   Space    — shoot (also primary mouse button via component)
 *   F        — interact (enter/exit vehicle, plant/defuse, pick up loot)
 *   Q        — previous weapon
 *   1-9      — select weapon directly
 *   Mouse    — look (yaw + pitch) via pointer lock
 *
 * Gamepad:
 *   L-stick  — move
 *   R-stick  — aim (mapped to mouse delta externally)
 *   RT       — shoot
 *   A        — interact
 *   B        — sprint
 */
import type { Soldier } from './types'
import type { GamepadSnapshot } from '../../pages/games/mini/useGamepads'

/** Global key state */
export const keysDown = new Set<string>()

/** Accumulated mouse movement since last read (for pointer lock) */
let mouseDeltaX = 0
let mouseDeltaY = 0
/** Whether left mouse button is held */
let mouseDown = false

export interface SoldierInput {
  mx: number         // strafe: -1=left, +1=right
  my: number         // move: -1=forward, +1=backward
  shoot: boolean
  interact: boolean
  sprint: boolean
  weaponSwitch: number   // -1=no switch, -2=previous, 0+=direct index
  posture: 'stand' | 'crouch' | 'prone'
  /** Hold to bandage wounds (B key / D-pad Down on gamepad) */
  bandage: boolean
  /** Toggle camera perspective (V key / Select button) */
  toggleTPP: boolean
  /** Push-to-talk (T key / D-pad Up on gamepad) */
  ptt: boolean
  /** Place trap (G key / D-pad Right on gamepad) */
  placeTrap: boolean
  /** Aim down sights (RMB / LT on gamepad) */
  aim: boolean
  /** Cycle aim assist mode (Y on gamepad, unused on KB) */
  cycleAimAssist: boolean
}

const NO_INPUT: SoldierInput = { mx: 0, my: 0, shoot: false, interact: false, sprint: false, weaponSwitch: -1, posture: 'stand', bandage: false, toggleTPP: false, ptt: false, placeTrap: false, aim: false, cycleAimAssist: false }

/** Accumulated mouse deltas from pointermove events */
export function addMouseDelta(dx: number, dy: number): void {
  mouseDeltaX += dx
  mouseDeltaY += dy
}

/** Read and reset accumulated mouse delta */
export function consumeMouseDelta(): { dx: number; dy: number } {
  const result = { dx: mouseDeltaX, dy: mouseDeltaY }
  mouseDeltaX = 0
  mouseDeltaY = 0
  return result
}

/** Set mouse button state */
export function setMouseDown(down: boolean): void {
  mouseDown = down
}

/** Right mouse button state for ADS */
let mouseRightDown = false
export function setMouseRightDown(down: boolean): void {
  mouseRightDown = down
}

export function getInput(s: Soldier, pads: GamepadSnapshot[]): SoldierInput {
  if (s.isBot) return { ...NO_INPUT }

  const inp = s.input
  if (inp.type === 'gamepad') {
    const gp = pads.find((p: GamepadSnapshot) => p.index === inp.padIndex)
    if (!gp) return { ...NO_INPUT }
    // LB = crouch, D-pad Down = prone, LT = ADS (aim down sights)
    let posture: 'stand' | 'crouch' | 'prone' = 'stand'
    if (gp.dpDown) posture = 'prone'
    else if (gp.l1) posture = 'crouch'
    // Use left stick axes only (not d-pad) for movement in FPS
    const stickX = Math.abs(gp.lx) > 0.15 ? gp.lx : 0
    const stickY = Math.abs(gp.ly) > 0.15 ? gp.ly : 0
    return {
      mx: stickX,
      my: stickY,
      shoot: gp.x || gp.rt,
      interact: gp.a,
      sprint: gp.b || false,
      weaponSwitch: -1,
      posture,
      bandage: gp.y || false,
      toggleTPP: gp.select || false,
      ptt: gp.dpUp || false,
      placeTrap: gp.dpRight || false,
      aim: gp.l2 || false,
      cycleAimAssist: false,  // Y is bandage during gameplay; aim assist toggle is only on join screen
    }
  }

  if (s.input.type !== 'keyboard') return { ...NO_INPUT }
  const g = s.input.group

  if (g === 0) {
    let weaponSwitch = -1
    for (let n = 1; n <= 9; n++) {
      if (keysDown.has(String(n))) weaponSwitch = n - 1
    }
    if (keysDown.has('q')) weaponSwitch = -2
    let posture: 'stand' | 'crouch' | 'prone' = 'stand'
    if (keysDown.has('c')) posture = 'crouch'
    if (keysDown.has('z')) posture = 'prone'
    return {
      mx: (keysDown.has('d') ? 1 : 0) - (keysDown.has('a') ? 1 : 0),
      my: (keysDown.has('s') ? 1 : 0) - (keysDown.has('w') ? 1 : 0),
      shoot: keysDown.has(' ') || mouseDown,
      interact: keysDown.has('f'),
      sprint: keysDown.has('Shift'),
      weaponSwitch,
      posture,
      bandage: keysDown.has('b'),
      toggleTPP: keysDown.has('v'),
      ptt: keysDown.has('t'),
      placeTrap: keysDown.has('g'),
      aim: mouseRightDown,
      cycleAimAssist: false,
    }
  }

  if (g === 1) {
    let posture: 'stand' | 'crouch' | 'prone' = 'stand'
    if (keysDown.has('c')) posture = 'crouch'
    if (keysDown.has('z')) posture = 'prone'
    return {
      mx: (keysDown.has('ArrowRight') ? 1 : 0) - (keysDown.has('ArrowLeft') ? 1 : 0),
      my: (keysDown.has('ArrowDown') ? 1 : 0) - (keysDown.has('ArrowUp') ? 1 : 0),
      shoot: keysDown.has('Enter'),
      interact: keysDown.has('Shift'),
      sprint: keysDown.has('Control'),
      weaponSwitch: -1,
      posture,
      bandage: keysDown.has('b'),
      toggleTPP: keysDown.has('v'),
      ptt: keysDown.has('t'),
      placeTrap: keysDown.has('g'),
      aim: false,
      cycleAimAssist: false,
    }
  }

  return { ...NO_INPUT }
}

