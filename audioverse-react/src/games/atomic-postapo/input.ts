/**
 * Input handling for AtomicPostApo — keyboard + gamepad
 */

// Persistent key state (shared across all players using keyboard)
export const keysDown = new Set<string>()

export interface PlayerInput {
  mx: number; my: number       // movement direction
  shoot: boolean
  interact: boolean
  ability: boolean             // VATS
  sprint: boolean
  weaponNext: boolean
  weaponPrev: boolean
  useStimpak: boolean
  useRadaway: boolean
}

interface KeyAction { group: number; action: string }
const KEY_MAP: Record<string, KeyAction> = {
  w:          { group: 0, action: 'up' },
  s:          { group: 0, action: 'down' },
  a:          { group: 0, action: 'left' },
  d:          { group: 0, action: 'right' },
  ' ':        { group: 0, action: 'shoot' },
  e:          { group: 0, action: 'interact' },
  q:          { group: 0, action: 'ability' },
  Shift:      { group: 0, action: 'sprint' },
  '1':        { group: 0, action: 'wpnNext' },
  '2':        { group: 0, action: 'wpnPrev' },
  r:          { group: 0, action: 'stimpak' },
  t:          { group: 0, action: 'radaway' },
  // Group 1
  ArrowUp:    { group: 1, action: 'up' },
  ArrowDown:  { group: 1, action: 'down' },
  ArrowLeft:  { group: 1, action: 'left' },
  ArrowRight: { group: 1, action: 'right' },
  Enter:      { group: 1, action: 'shoot' },
  '/':        { group: 1, action: 'interact' },
  '.':        { group: 1, action: 'ability' },
  Control:    { group: 1, action: 'sprint' },
}

export interface GamepadState {
  index: number
  up: boolean; down: boolean; left: boolean; right: boolean
  a: boolean; b: boolean; x: boolean; y: boolean
  lb: boolean; rb: boolean
  dpadUp?: boolean; dpadDown?: boolean
}

export function getInput(
  inputCfg: { type: string; group?: number; padIndex?: number },
  pads: GamepadState[],
): PlayerInput {
  const input: PlayerInput = {
    mx: 0, my: 0,
    shoot: false, interact: false, ability: false, sprint: false,
    weaponNext: false, weaponPrev: false, useStimpak: false, useRadaway: false,
  }

  if (inputCfg.type === 'keyboard') {
    const group = inputCfg.group ?? 0
    for (const [key, act] of Object.entries(KEY_MAP)) {
      if (act.group !== group || !keysDown.has(key)) continue
      switch (act.action) {
        case 'up':       input.my -= 1; break
        case 'down':     input.my += 1; break
        case 'left':     input.mx -= 1; break
        case 'right':    input.mx += 1; break
        case 'shoot':    input.shoot = true; break
        case 'interact': input.interact = true; break
        case 'ability':  input.ability = true; break
        case 'sprint':   input.sprint = true; break
        case 'wpnNext':  input.weaponNext = true; break
        case 'wpnPrev':  input.weaponPrev = true; break
        case 'stimpak':  input.useStimpak = true; break
        case 'radaway':  input.useRadaway = true; break
      }
    }
  } else if (inputCfg.type === 'gamepad') {
    const gp = pads.find(g => g.index === inputCfg.padIndex)
    if (gp) {
      if (gp.up)   input.my -= 1
      if (gp.down) input.my += 1
      if (gp.left) input.mx -= 1
      if (gp.right)input.mx += 1
      if (gp.x)    input.shoot = true
      if (gp.a)    input.interact = true
      if (gp.y)    input.ability = true
      if (gp.b)    input.sprint = true
      if (gp.rb)   input.weaponNext = true
      if (gp.lb)   input.weaponPrev = true
      if (gp.dpadUp)   input.useStimpak = true
      if (gp.dpadDown) input.useRadaway = true
    }
  }

  return input
}
