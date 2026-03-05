/**
 * Shared keyboard direction mappings for all mini-games.
 * 4 keyboard groups × 4 directions.
 */
import { DIR_UP, DIR_DOWN, DIR_LEFT, DIR_RIGHT, type Dir } from './types'

export const KEY_LOOKUP = new Map<string, { group: number; dir: Dir }>()

const MAPS: Record<string, { group: number; dir: Dir }>[] = [
  // Group 0 — WASD
  { w: { group: 0, dir: DIR_UP }, s: { group: 0, dir: DIR_DOWN }, a: { group: 0, dir: DIR_LEFT }, d: { group: 0, dir: DIR_RIGHT } },
  // Group 1 — Arrows
  { ArrowUp: { group: 1, dir: DIR_UP }, ArrowDown: { group: 1, dir: DIR_DOWN }, ArrowLeft: { group: 1, dir: DIR_LEFT }, ArrowRight: { group: 1, dir: DIR_RIGHT } },
  // Group 2 — IJKL
  { i: { group: 2, dir: DIR_UP }, k: { group: 2, dir: DIR_DOWN }, j: { group: 2, dir: DIR_LEFT }, l: { group: 2, dir: DIR_RIGHT } },
  // Group 3 — Numpad 8/4/5/6
  { '8': { group: 3, dir: DIR_UP }, '5': { group: 3, dir: DIR_DOWN }, '4': { group: 3, dir: DIR_LEFT }, '6': { group: 3, dir: DIR_RIGHT } },
]
for (const map of MAPS) for (const [key, val] of Object.entries(map)) KEY_LOOKUP.set(key, val)

/** Action keys per keyboard group (Space, Enter, U, Numpad0) */
export const ACTION_KEYS = new Map<string, number>([
  [' ', 0], ['Enter', 1], ['u', 2], ['0', 3],
])

/**
 * Resolve gamepad D-pad / stick to a direction.
 * Returns null if no direction pressed.
 */
export function gamepadDir(gp: { up: boolean; down: boolean; left: boolean; right: boolean }): Dir | null {
  if (gp.up) return DIR_UP
  if (gp.down) return DIR_DOWN
  if (gp.left) return DIR_LEFT
  if (gp.right) return DIR_RIGHT
  return null
}
