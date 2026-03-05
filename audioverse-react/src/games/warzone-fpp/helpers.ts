/**
 * Pure utility / math helpers for the Warzone FPP game.
 */
import type { Vec, Rect } from './types'

export function dist(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function rectContains(r: Rect, px: number, py: number): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function normalize(dx: number, dy: number): [number, number] {
  const len = Math.hypot(dx, dy)
  if (len === 0) return [0, 0]
  return [dx / len, dy / len]
}

export function angleBetween(a: Vec, b: Vec): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1))
}

/**
 * Slide-based collision: try full movement, then X-only, then Y-only.
 * Prevents the "stuck on wall" problem.
 */
export function slideCollision(
  ox: number, oy: number,
  nx: number, ny: number,
  rects: Rect[],
  radius: number,
): [number, number] {
  const expanded = rects.map(r => ({
    x: r.x - radius, y: r.y - radius,
    w: r.w + radius * 2, h: r.h + radius * 2,
  }))

  // Try full movement
  if (!expanded.some(r => rectContains(r, nx, ny))) return [nx, ny]
  // Try X-only
  if (!expanded.some(r => rectContains(r, nx, oy))) return [nx, oy]
  // Try Y-only
  if (!expanded.some(r => rectContains(r, ox, ny))) return [ox, ny]
  // Stuck
  return [ox, oy]
}
