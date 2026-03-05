/**
 * noteThemeColors — reads CSS custom properties from the active theme
 * and returns a palette for NoteRiver / NoteParticles.
 *
 * Palette:
 *  - base      : the "normal" note color (--text-primary)
 *  - staffLine : staff line stroke (--text-primary at low opacity)
 *  - outline   : outline around notes (contrasting)
 *  - accents[] : 3-4 accent colours that some notes randomly get
 */
export interface NotePalette {
  base: string
  staffLine: string
  outline: string
  accents: string[]
  isDark: boolean
  /** true when the base note colour is dark and outline should be light */
  notesDark: boolean
}

/** Read a CSS variable value from :root */
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/** Parse any CSS colour to {r,g,b} (returns null on failure) */
function parseColor(raw: string): { r: number; g: number; b: number } | null {
  if (!raw) return null
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = raw
  const hex = ctx.fillStyle // browser normalises to #rrggbb or rgba(...)
  if (hex.startsWith('#')) {
    const n = parseInt(hex.slice(1), 16)
    return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff }
  }
  const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (m) return { r: +m[1], g: +m[2], b: +m[3] }
  return null
}

function toRgba(raw: string, alpha: number): string {
  const c = parseColor(raw)
  if (!c) return `rgba(255,255,255,${alpha})`
  return `rgba(${c.r},${c.g},${c.b},${alpha})`
}

/** Relative luminance (0 = black, 1 = white) */
function luminance(raw: string): number {
  const c = parseColor(raw)
  if (!c) return 1
  return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255
}

export function readNotePalette(): NotePalette {
  const textPrimary   = cssVar('--text-primary')   || 'rgba(255,255,255,0.95)'
  const navActive     = cssVar('--nav-active')      || 'goldenrod'
  const isDark        = document.documentElement.getAttribute('data-theme') === 'dark'

  // If the base note color is dark (low luminance), use a white outline
  const baseLum = luminance(textPrimary)
  const notesDark = baseLum < 0.45

  return {
    base: toRgba(textPrimary, 0.92),
    staffLine: toRgba(textPrimary, 0.22),
    outline: notesDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.55)',
    accents: [
      toRgba(navActive, 0.95),   // single accent — yellow / gold (logo colour)
    ],
    isDark,
    notesDark,
  }
}
