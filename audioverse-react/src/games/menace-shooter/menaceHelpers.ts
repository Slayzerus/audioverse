/**
 * menaceHelpers.ts — Shared helpers for Menace 3D game logic.
 *
 * Used by gameLogic.ts and menaceBotAI.ts.
 */
import type { GameState, Player, Vec2 } from './types'

// ── Math / random helpers ─────────────────────────────────
export function dist(a: Vec2, b: Vec2): number { return Math.hypot(a.x - b.x, a.y - b.y) }
export function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)) }
export function rng(lo: number, hi: number) { return lo + Math.random() * (hi - lo) }
export function rngInt(lo: number, hi: number) { return Math.floor(rng(lo, hi)) }
export function pick<T>(arr: T[]): T { return arr[rngInt(0, arr.length)] }

// ── Input ─────────────────────────────────────────────────
interface KeyAction { group: number; action: string }
export const KEY_MAP = new Map<string, KeyAction>([
  ['w',{group:0,action:'up'}],['s',{group:0,action:'down'}],['a',{group:0,action:'left'}],['d',{group:0,action:'right'}],
  [' ',{group:0,action:'shoot'}],['e',{group:0,action:'enter'}],['q',{group:0,action:'pickup'}],['Shift',{group:0,action:'sprint'}],
  ['ArrowUp',{group:1,action:'up'}],['ArrowDown',{group:1,action:'down'}],['ArrowLeft',{group:1,action:'left'}],['ArrowRight',{group:1,action:'right'}],
  ['Enter',{group:1,action:'shoot'}],['/',{group:1,action:'enter'}],['.',{group:1,action:'pickup'}],[',',{group:1,action:'sprint'}],
  ['i',{group:2,action:'up'}],['k',{group:2,action:'down'}],['j',{group:2,action:'left'}],['l',{group:2,action:'right'}],
  ['u',{group:2,action:'shoot'}],['o',{group:2,action:'enter'}],['p',{group:2,action:'pickup'}],['h',{group:2,action:'sprint'}],
  ['8',{group:3,action:'up'}],['5',{group:3,action:'down'}],['4',{group:3,action:'left'}],['6',{group:3,action:'right'}],
  ['0',{group:3,action:'shoot'}],['9',{group:3,action:'enter'}],['7',{group:3,action:'pickup'}],['1',{group:3,action:'sprint'}],
])

export interface InputSnapshot {
  keys: Set<string>
  pads: Array<{
    index: number; up: boolean; down: boolean; left: boolean; right: boolean
    a: boolean; b: boolean; x: boolean; y: boolean; lb: boolean
  }>
}

export function isAction(p: Player, action: string, input: InputSnapshot): boolean {
  if (p.input.type === 'keyboard') {
    for (const [key, ka] of KEY_MAP) {
      if (ka.group === p.input.group && ka.action === action && input.keys.has(key)) return true
    }
  }
  if (p.input.type === 'gamepad') {
    const gp = input.pads.find(g => g.index === p.input.padIndex)
    if (!gp) return false
    if (action === 'up') return gp.up
    if (action === 'down') return gp.down
    if (action === 'left') return gp.left
    if (action === 'right') return gp.right
    if (action === 'shoot') return gp.x
    if (action === 'enter') return gp.a
    if (action === 'pickup') return gp.y
    if (action === 'sprint') return gp.lb
  }
  return false
}

// ── Collision helpers ─────────────────────────────────────
export function collidesBuilding(x: number, y: number, r: number, st: GameState): boolean {
  for (const b of st.level.buildings) {
    if (b.destroyed) continue
    if (x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h) return true
  }
  return false
}

export function isOnWater(x: number, y: number, st: GameState): boolean {
  for (const wz of st.level.waterZones) {
    if (x > wz.x && x < wz.x + wz.w && y > wz.y && y < wz.y + wz.h) return true
  }
  return false
}

export function pushOutBuildings(x: number, y: number, r: number, st: GameState): Vec2 {
  let ox = x, oy = y
  for (const b of st.level.buildings) {
    if (b.destroyed) continue
    if (ox + r > b.x && ox - r < b.x + b.w && oy + r > b.y && oy - r < b.y + b.h) {
      // Push out of whichever axis has less overlap
      const overlapLeft = (ox + r) - b.x
      const overlapRight = (b.x + b.w) - (ox - r)
      const overlapTop = (oy + r) - b.y
      const overlapBottom = (b.y + b.h) - (oy - r)
      const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom)
      if (minOverlap === overlapLeft) ox = b.x - r
      else if (minOverlap === overlapRight) ox = b.x + b.w + r
      else if (minOverlap === overlapTop) oy = b.y - r
      else oy = b.y + b.h + r
    }
  }
  return { x: ox, y: oy }
}
