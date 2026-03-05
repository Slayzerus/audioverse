/**
 * useGamepads — polls connected gamepads every frame and provides
 * per-pad button / axis state.  Designed for couch mini-games.
 *
 * Returns an array (length 0-8) of GamepadSnapshot objects.
 * Each snapshot has boolean helpers for the D-pad, face buttons, and sticks.
 */

import { useEffect, useRef, useState } from 'react'

export interface GamepadSnapshot {
  /** Navigator gamepad index */
  index: number
  /** D-pad or left stick (combined: stick OR d-pad) */
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  /** Explicit D-pad buttons (for FPS games that use stick + d-pad separately) */
  dpUp: boolean
  dpDown: boolean
  dpLeft: boolean
  dpRight: boolean
  /** Left stick axes (raw) */
  lx: number
  ly: number
  /** Right stick axes (raw) */
  rx: number
  ry: number
  /** Face buttons (Xbox layout: A=0, B=1, X=2, Y=3) */
  a: boolean
  b: boolean
  x: boolean
  y: boolean
  /** Shoulders */
  lb: boolean
  rb: boolean
  /** Aliases for shoulders (l1/r1 style) */
  l1: boolean
  r1: boolean
  /** Triggers (LT=6, RT=7) */
  lt: boolean
  rt: boolean
  /** Aliases */
  l2: boolean
  /** Start / Select */
  start: boolean
  select: boolean
}

/** Threshold for analog stick → boolean */
const AXIS_THRESHOLD = 0.5
/** Threshold for analog triggers */
const TRIGGER_THRESHOLD = 0.3

function snapshot(gp: Gamepad): GamepadSnapshot {
  const btns = gp.buttons
  const axes = gp.axes
  const dpUp    = !!btns[12]?.pressed
  const dpDown  = !!btns[13]?.pressed
  const dpLeft  = !!btns[14]?.pressed
  const dpRight = !!btns[15]?.pressed
  const lt = (btns[6]?.value ?? 0) > TRIGGER_THRESHOLD || !!btns[6]?.pressed
  const rt = (btns[7]?.value ?? 0) > TRIGGER_THRESHOLD || !!btns[7]?.pressed
  return {
    index: gp.index,
    // Combined: stick OR d-pad
    up:    dpUp    || (axes[1] != null && axes[1] < -AXIS_THRESHOLD),
    down:  dpDown  || (axes[1] != null && axes[1] > AXIS_THRESHOLD),
    left:  dpLeft  || (axes[0] != null && axes[0] < -AXIS_THRESHOLD),
    right: dpRight || (axes[0] != null && axes[0] > AXIS_THRESHOLD),
    // Explicit D-pad
    dpUp, dpDown, dpLeft, dpRight,
    // Stick axes
    lx: axes[0] ?? 0,
    ly: axes[1] ?? 0,
    rx: axes[2] ?? 0,
    ry: axes[3] ?? 0,
    // Face
    a:     !!btns[0]?.pressed,
    b:     !!btns[1]?.pressed,
    x:     !!btns[2]?.pressed,
    y:     !!btns[3]?.pressed,
    // Shoulders
    lb:    !!btns[4]?.pressed,
    rb:    !!btns[5]?.pressed,
    l1:    !!btns[4]?.pressed,
    r1:    !!btns[5]?.pressed,
    // Triggers
    lt, rt,
    l2: lt,
    // Meta
    start: !!btns[9]?.pressed,
    select:!!btns[8]?.pressed,
  }
}

export function useGamepads(): GamepadSnapshot[] {
  const [pads, setPads] = useState<GamepadSnapshot[]>([])
  const rafRef = useRef(0)

  useEffect(() => {
    function poll() {
      const rawPads = navigator.getGamepads ? navigator.getGamepads() : []
      const result: GamepadSnapshot[] = []
      for (let i = 0; i < (rawPads?.length ?? 0); i++) {
        const p = rawPads![i]
        if (p) result.push(snapshot(p))
      }
      setPads(result)
      rafRef.current = requestAnimationFrame(poll)
    }
    rafRef.current = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return pads
}

/**
 * Tracks which buttons were *just pressed* this frame (edge detection).
 * Returns a map from gamepad index → set of pressed-this-frame button names.
 */
export function useGamepadEdges(pads: GamepadSnapshot[]) {
  const prevRef = useRef<Map<number, GamepadSnapshot>>(new Map())

  const edges = new Map<number, Set<string>>()
  for (const pad of pads) {
    const prev = prevRef.current.get(pad.index)
    const pressed = new Set<string>()
    if (prev) {
      for (const key of ['up', 'down', 'left', 'right', 'a', 'b', 'x', 'y', 'lb', 'rb', 'start', 'select'] as const) {
        if (pad[key] && !prev[key]) pressed.add(key)
      }
    } else {
      // First frame — treat current state as edges
      for (const key of ['a', 'start'] as const) {
        if (pad[key]) pressed.add(key)
      }
    }
    edges.set(pad.index, pressed)
  }

  // Update previous state
  const newPrev = new Map<number, GamepadSnapshot>()
  for (const pad of pads) newPrev.set(pad.index, { ...pad })
  prevRef.current = newPrev

  return edges
}
