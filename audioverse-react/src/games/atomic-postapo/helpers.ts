/**
 * Math & collision helpers for AtomicPostApo
 */
import type { Vec2, Building, WallSegment, Prop } from './types'

export function dist2(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export function normalize(v: Vec2): Vec2 {
  const l = Math.hypot(v.x, v.y)
  return l > 0 ? { x: v.x / l, y: v.y / l } : { x: 0, y: 0 }
}

export function angleBetween(a: Vec2, b: Vec2): number {
  return Math.atan2(b.y - a.y, b.x - a.x)
}

export function rng(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function rngI(min: number, max: number): number {
  return Math.floor(rng(min, max))
}

export function rngChoice<T>(arr: T[]): T {
  return arr[rngI(0, arr.length)]
}

/** Check if point (px,py) is inside axis-aligned rect */
export function rectContains(rx: number, ry: number, rw: number, rh: number, px: number, py: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh
}

/** Circle-rect overlap test */
export function circleRectOverlap(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const nearX = clamp(cx, rx, rx + rw)
  const nearY = clamp(cy, ry, ry + rh)
  return (cx - nearX) ** 2 + (cy - nearY) ** 2 < cr ** 2
}

/** Slide collision: tries full move, then X only, then Y only */
export function slideMove(
  x: number, y: number, dx: number, dy: number, radius: number,
  obstacles: Array<{ x: number; y: number; w: number; h: number }>,
  mapW: number, mapH: number,
): { x: number; y: number } {
  // Try full move
  let nx = clamp(x + dx, radius, mapW - radius)
  let ny = clamp(y + dy, radius, mapH - radius)
  let blocked = false
  for (const o of obstacles) {
    if (circleRectOverlap(nx, ny, radius, o.x, o.y, o.w, o.h)) { blocked = true; break }
  }
  if (!blocked) return { x: nx, y: ny }

  // Try X only
  nx = clamp(x + dx, radius, mapW - radius)
  ny = y
  blocked = false
  for (const o of obstacles) {
    if (circleRectOverlap(nx, ny, radius, o.x, o.y, o.w, o.h)) { blocked = true; break }
  }
  if (!blocked) return { x: nx, y: ny }

  // Try Y only
  nx = x
  ny = clamp(y + dy, radius, mapH - radius)
  blocked = false
  for (const o of obstacles) {
    if (circleRectOverlap(nx, ny, radius, o.x, o.y, o.w, o.h)) { blocked = true; break }
  }
  if (!blocked) return { x: nx, y: ny }

  return { x, y } // stuck
}

/** Get collision obstacles from buildings, walls, props */
export function getObstacles(
  buildings: Building[],
  walls: WallSegment[],
  props: Prop[],
): Array<{ x: number; y: number; w: number; h: number }> {
  const obs: Array<{ x: number; y: number; w: number; h: number }> = []
  for (const b of buildings) {
    obs.push({ x: b.x - b.w / 2, y: b.y - b.h / 2, w: b.w, h: b.h })
  }
  for (const w of walls) {
    if (w.blocking) {
      obs.push({ x: w.x - 0.2, y: w.y - 1.5, w: 0.4, h: 3.0 })
    }
  }
  for (const p of props) {
    if (p.blocking) {
      const pw = 0.5, ph = 0.5
      obs.push({ x: p.x - pw / 2, y: p.y - ph / 2, w: pw, h: ph })
    }
  }
  return obs
}

/** lerp a number */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
