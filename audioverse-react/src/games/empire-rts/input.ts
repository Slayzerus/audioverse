/**
 * Empire RTS — Input handling (keyboard + gamepad)
 * Each hero gets its own input mapping.
 */
import type { HeroInput } from './gameLogic'

// ─── Keyboard layouts (up to 4 keyboard groups) ──────────
const KB_GROUPS: Record<string, Partial<HeroInput>>[] = [
  // Group 0 — WASD
  {
    'a': { moveX: -1 },
    'd': { moveX: 1 },
    'e': { interact: true },
    ' ': { attack: true },
    'q': { buildPrev: true },
    'tab': { buildNext: true },
    'f': { buildPlace: true },
  },
  // Group 1 — Arrows
  {
    'arrowleft':  { moveX: -1 },
    'arrowright': { moveX: 1 },
    'enter':      { interact: true },
    'numpad0':    { attack: true },
    'numpad1':    { buildPrev: true },
    'numpad3':    { buildNext: true },
    'numpad2':    { buildPlace: true },
  },
  // Group 2 — IJKL
  {
    'j': { moveX: -1 },
    'l': { moveX: 1 },
    'o': { interact: true },
    'p': { attack: true },
    'u': { buildPrev: true },
    '[': { buildNext: true },
    ';': { buildPlace: true },
  },
  // Group 3 — Numpad arrows (for couch)
  {
    'numpad4': { moveX: -1 },
    'numpad6': { moveX: 1 },
    'numpad5': { interact: true },
    'numpad8': { attack: true },
    'numpad7': { buildPrev: true },
    'numpad9': { buildNext: true },
    'numpadenter': { buildPlace: true },
  },
]

// ─── Pressed keys set ─────────────────────────────────────
export const keysDown = new Set<string>()

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', e => keysDown.add(e.key.toLowerCase()))
  window.addEventListener('keyup',   e => keysDown.delete(e.key.toLowerCase()))
  window.addEventListener('blur',    () => keysDown.clear())
}

// Track edge-triggered keys (for build cycling — only trigger once per press)
const prevKeys = new Set<string>()

export function consumeEdges(): void {
  prevKeys.clear()
  for (const k of keysDown) prevKeys.add(k)
}

function justPressed(key: string): boolean {
  return keysDown.has(key) && !prevKeys.has(key)
}

// ─── Read input for a keyboard group ──────────────────────
function readKbGroup(group: number): HeroInput {
  const inp: HeroInput = { moveX: 0, interact: false, attack: false, buildPrev: false, buildNext: false, buildPlace: false }
  if (group >= KB_GROUPS.length) return inp

  const map = KB_GROUPS[group]
  for (const [key, action] of Object.entries(map)) {
    if (action.moveX !== undefined) {
      if (keysDown.has(key)) inp.moveX = action.moveX
    } else {
      // Edge-triggered for build cycling, level for others
      const prop = Object.keys(action)[0] as keyof HeroInput
      if (prop === 'buildPrev' || prop === 'buildNext' || prop === 'buildPlace') {
        if (justPressed(key)) (inp as unknown as Record<string, number | boolean>)[prop] = true
      } else {
        if (keysDown.has(key)) (inp as unknown as Record<string, number | boolean>)[prop] = true
      }
    }
  }
  return inp
}

// ─── Read gamepad input ───────────────────────────────────
function readGamepad(padIndex: number): HeroInput {
  const inp: HeroInput = { moveX: 0, interact: false, attack: false, buildPrev: false, buildNext: false, buildPlace: false }
  const gps = navigator.getGamepads?.() || []
  const gp = gps[padIndex]
  if (!gp) return inp

  // Left stick / D-pad
  const lx = gp.axes[0] ?? 0
  if (lx < -0.3) inp.moveX = -1
  else if (lx > 0.3) inp.moveX = 1

  // D-pad (buttons 14=left, 15=right)
  if (gp.buttons[14]?.pressed) inp.moveX = -1
  if (gp.buttons[15]?.pressed) inp.moveX = 1

  // A = interact, X = attack, LB = build prev, RB = build next, Y = place
  if (gp.buttons[0]?.pressed) inp.interact = true
  if (gp.buttons[2]?.pressed) inp.attack = true
  if (gp.buttons[4]?.pressed) inp.buildPrev = true
  if (gp.buttons[5]?.pressed) inp.buildNext = true
  if (gp.buttons[3]?.pressed) inp.buildPlace = true

  return inp
}

// ─── Get input for player ─────────────────────────────────
export function getInput(_playerIndex: number, kbGroup: number, padIndex: number): HeroInput {
  const kb = readKbGroup(kbGroup)
  const gp = readGamepad(padIndex)

  return {
    moveX: gp.moveX !== 0 ? gp.moveX : kb.moveX,
    interact: kb.interact || gp.interact,
    attack: kb.attack || gp.attack,
    buildPrev: kb.buildPrev || gp.buildPrev,
    buildNext: kb.buildNext || gp.buildNext,
    buildPlace: kb.buildPlace || gp.buildPlace,
  }
}
