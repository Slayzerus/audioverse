/**
 * Input handling for Underpaid Time Management — keyboard + gamepad.
 *
 * Cooking game controls:
 *   Group 0: WASD + Space (pickup/drop) + E (interact/chop)
 *   Group 1: Arrow keys + Enter (pickup/drop) + Shift (interact/chop)
 *   Gamepad: LStick move, A pickup/drop, X interact/chop, B dash
 */

// Persistent key state
export const keysDown = new Set<string>()

// Edge-detection state for one-shot actions
const keyEdge = new Map<string, boolean>()

export interface CookingInput {
  mx: number           // movement X (-1..1)
  my: number           // movement Y (-1..1)
  pickup: boolean      // one-shot: pick up / drop item
  interact: boolean    // one-shot: chop / clean / wash
  dash: boolean        // hold: move faster briefly
}

// Keyboard → group + action mapping
interface KeyAction { group: number; action: string }
const KEY_MAP: Record<string, KeyAction> = {
  w:          { group: 0, action: 'up' },
  s:          { group: 0, action: 'down' },
  a:          { group: 0, action: 'left' },
  d:          { group: 0, action: 'right' },
  ' ':        { group: 0, action: 'pickup' },
  e:          { group: 0, action: 'interact' },
  E:          { group: 0, action: 'interact' },
  q:          { group: 0, action: 'dash' },
  Q:          { group: 0, action: 'dash' },
  // Group 1 (arrows)
  ArrowUp:    { group: 1, action: 'up' },
  ArrowDown:  { group: 1, action: 'down' },
  ArrowLeft:  { group: 1, action: 'left' },
  ArrowRight: { group: 1, action: 'right' },
  Enter:      { group: 1, action: 'pickup' },
  Shift:      { group: 1, action: 'interact' },
  Control:    { group: 1, action: 'dash' },
}

export interface GamepadState {
  index: number
  up: boolean; down: boolean; left: boolean; right: boolean
  a: boolean; b: boolean; x: boolean; y: boolean
  lb?: boolean; rb?: boolean
}

// Per-gamepad edge state
const gpEdge = new Map<number, { prevA: boolean; prevX: boolean }>()

/**
 * Get cooking input for a player based on their input config.
 */
export function getInput(
  inputCfg: { type: string; group?: number; padIndex?: number },
  pads: GamepadState[],
): CookingInput {
  const input: CookingInput = { mx: 0, my: 0, pickup: false, interact: false, dash: false }

  if (inputCfg.type === 'keyboard') {
    const group = inputCfg.group ?? 0
    for (const [key, act] of Object.entries(KEY_MAP)) {
      if (act.group !== group || !keysDown.has(key)) continue
      switch (act.action) {
        case 'up':       input.my -= 1; break
        case 'down':     input.my += 1; break
        case 'left':     input.mx -= 1; break
        case 'right':    input.mx += 1; break
        case 'dash':     input.dash = true; break
        // One-shot actions via edge detection
        case 'pickup': {
          const edge = keyEdge.get(`pickup_${group}`) ?? false
          if (!edge) { input.pickup = true; keyEdge.set(`pickup_${group}`, true) }
          break
        }
        case 'interact': {
          const edge = keyEdge.get(`interact_${group}`) ?? false
          if (!edge) { input.interact = true; keyEdge.set(`interact_${group}`, true) }
          break
        }
      }
    }
    // Release edge detection on key up
    if (!keysDown.has(group === 0 ? ' ' : 'Enter')) keyEdge.set(`pickup_${group}`, false)
    if (!keysDown.has(group === 0 ? 'e' : 'Shift') && !keysDown.has(group === 0 ? 'E' : 'Shift')) {
      keyEdge.set(`interact_${group}`, false)
    }
  } else if (inputCfg.type === 'gamepad') {
    const gp = pads.find(g => g.index === inputCfg.padIndex)
    if (gp) {
      if (gp.up) input.my -= 1
      if (gp.down) input.my += 1
      if (gp.left) input.mx -= 1
      if (gp.right) input.mx += 1
      if (gp.b) input.dash = true

      // Edge detection for gamepad
      const prev = gpEdge.get(gp.index) ?? { prevA: false, prevX: false }
      if (gp.a && !prev.prevA) input.pickup = true
      if (gp.x && !prev.prevX) input.interact = true
      gpEdge.set(gp.index, { prevA: gp.a, prevX: gp.x })
    }
  }

  return input
}
