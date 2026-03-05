/**
 * helpers.ts — Generic utility functions used across modules.
 */

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Format large numbers with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString()
}

/** Shuffle an array (Fisher-Yates) */
export function shuffle<T>(arr: T[], rand?: () => number): T[] {
  const r = rand || Math.random
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Pick random element from array */
export function pickRandom<T>(arr: T[], rand?: () => number): T {
  const r = rand || Math.random
  return arr[Math.floor(r() * arr.length)]
}

/** Generate a unique ID */
let _uid = 0
export function uid(prefix = 'id'): string {
  return `${prefix}_${++_uid}`
}

/** Manhattan distance */
export function manhattan(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

/** Euclidean distance */
export function euclidean(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2)
}

/** Deep clone (for state snapshots) */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/** Debounce function */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

/** Format day/week/month text */
export function formatTurnDate(day: number, week: number, month: number): string {
  return `Month ${month}, Week ${week}, Day ${day}`
}

/** Percentage string */
export function pct(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

/** Capitalize first letter */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Truncate string */
export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s
}

/** Linear interpolation */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Color utilities for canvas rendering */
export function rgba(r: number, g: number, b: number, a: number = 1): string {
  return `rgba(${r},${g},${b},${a})`
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  if (!m) return { r: 0, g: 0, b: 0 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

export function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.floor(r * (1 - amount))},${Math.floor(g * (1 - amount))},${Math.floor(b * (1 - amount))})`
}

export function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${Math.min(255, Math.floor(r + (255 - r) * amount))},${Math.min(255, Math.floor(g + (255 - g) * amount))},${Math.min(255, Math.floor(b + (255 - b) * amount))})`
}

/** Canvas text wrapping */
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}
