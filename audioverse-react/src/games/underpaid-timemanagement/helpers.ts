/**
 * Math, collision, and grid utilities for Underpaid Time Management.
 */
import type { Vec2, GridPos, Station, Player } from './types'
import { CELL_SIZE, PLAYER_RADIUS, INTERACT_DIST } from './constants'

// ─── Math ───────────────────────────────────────────────
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

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1)
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

export function shuffled<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = rngI(0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// ─── Grid <-> World conversion ──────────────────────────
export function gridToWorld(col: number, row: number, cellSize = CELL_SIZE): Vec2 {
  return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 }
}

export function worldToGrid(x: number, y: number, cellSize = CELL_SIZE): GridPos {
  return { col: Math.floor(x / cellSize), row: Math.floor(y / cellSize) }
}

export function stationCenter(s: Station, cellSize = CELL_SIZE): Vec2 {
  return gridToWorld(s.col, s.row, cellSize)
}

// ─── Collision helpers ──────────────────────────────────
export interface AABB {
  x: number; y: number; w: number; h: number
}

export function circleRectOverlap(
  cx: number, cy: number, cr: number,
  rx: number, ry: number, rw: number, rh: number,
): boolean {
  const nearX = clamp(cx, rx, rx + rw)
  const nearY = clamp(cy, ry, ry + rh)
  return (cx - nearX) ** 2 + (cy - nearY) ** 2 < cr ** 2
}

/** Get station as AABB in world coords (each station occupies one cell) */
export function stationAABB(s: Station, cellSize = CELL_SIZE): AABB {
  return {
    x: s.col * cellSize,
    y: s.row * cellSize,
    w: cellSize,
    h: cellSize,
  }
}

/** Try move with slide collision: full, X-only, Y-only */
export function slideMove(
  x: number, y: number, dx: number, dy: number,
  radius: number, obstacles: AABB[],
  mapW: number, mapH: number,
): Vec2 {
  // Try full move
  let nx = clamp(x + dx, radius, mapW - radius)
  let ny = clamp(y + dy, radius, mapH - radius)
  let blocked = false
  for (const o of obstacles) {
    if (circleRectOverlap(nx, ny, radius, o.x, o.y, o.w, o.h)) { blocked = true; break }
  }
  if (!blocked) return { x: nx, y: ny }

  // X only
  nx = clamp(x + dx, radius, mapW - radius)
  ny = y
  blocked = false
  for (const o of obstacles) {
    if (circleRectOverlap(nx, ny, radius, o.x, o.y, o.w, o.h)) { blocked = true; break }
  }
  if (!blocked) return { x: nx, y: ny }

  // Y only
  nx = x
  ny = clamp(y + dy, radius, mapH - radius)
  blocked = false
  for (const o of obstacles) {
    if (circleRectOverlap(nx, ny, radius, o.x, o.y, o.w, o.h)) { blocked = true; break }
  }
  if (!blocked) return { x: nx, y: ny }

  return { x, y }
}

// ─── Station lookup helpers ─────────────────────────────
export function getBlockingStations(stations: Station[]): AABB[] {
  return stations
    .filter(s => s.type !== 'wall')
    .map(s => stationAABB(s))
}

/** Find the nearest station to the player that they can interact with */
export function nearestStationInRange(
  player: Player, stations: Station[], cellSize = CELL_SIZE,
): Station | null {
  let best: Station | null = null
  let bestDist = Infinity
  for (const s of stations) {
    if (s.type === 'wall') continue
    const c = stationCenter(s, cellSize)
    const d = dist2({ x: player.x, y: player.y }, c)
    if (d < INTERACT_DIST && d < bestDist) {
      bestDist = d
      best = s
    }
  }
  return best
}

/** Find station at a specific grid position */
export function stationAtGrid(
  stations: Station[], col: number, row: number,
): Station | undefined {
  return stations.find(s => s.col === col && s.row === row)
}

// ─── Facing direction enum to radians ───────────────────
export function facingToAngle(facing: Station['facing']): number {
  switch (facing) {
    case 'north': return -Math.PI / 2
    case 'south': return Math.PI / 2
    case 'east':  return 0
    case 'west':  return Math.PI
    default: return 0
  }
}

// ─── Player-to-player collision ─────────────────────────
export function pushPlayersApart(players: Player[]): void {
  const minDist = PLAYER_RADIUS * 2.2
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i], b = players[j]
      const d = dist2({ x: a.x, y: a.y }, { x: b.x, y: b.y })
      if (d < minDist && d > 0.001) {
        const nx = (b.x - a.x) / d
        const ny = (b.y - a.y) / d
        const push = (minDist - d) * 0.5
        a.x -= nx * push
        a.y -= ny * push
        b.x += nx * push
        b.y += ny * push
      }
    }
  }
}

// ─── Progress bar helpers ───────────────────────────────
export function progressPercent(progress: number, total: number): number {
  return clamp(progress / total, 0, 1)
}

export function timerColor(pct: number): string {
  if (pct > 0.5) return '#2ecc71'
  if (pct > 0.25) return '#f39c12'
  return '#e74c3c'
}
