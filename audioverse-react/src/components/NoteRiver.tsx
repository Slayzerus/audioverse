/**
 * NoteRiver — A thin sinusoidal music staff (5 lines, 1 full sine cycle across viewport)
 * with a dense river of white notes (black outline) slowly scrolling horizontally.
 * Placed directly below the navbar.
 *
 * Interactive: clicking a note briefly speeds it up; nearby notes dodge the cursor.
 *
 * Mobile optimisations:
 *  - Fewer notes (50 vs 110)
 *  - DPR capped at 2
 *  - Staff-line draw step doubled (4px vs 2px)
 *  - Notes pre-rendered to off-screen canvases so we drawImage() instead of
 *    strokeText()+fillText() per frame (biggest win)
 *  - Frame budget throttled to ~30 fps on mobile
 */
import { useRef, useEffect, useCallback } from 'react'
import type React from 'react'
import { readNotePalette, type NotePalette } from './noteThemeColors'
import { getAudioContext, resumeAudioContext } from '../scripts/audioContext'
import { loadSoundSetId, SOUND_SET_MAP } from '../config/noteSoundSets'

/* ── mobile detection (cheap, runs once) ───────────────── */
const IS_MOBILE = typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

/* ── constants ─────────────────────────────────────────── */
const STAFF_H       = 46          // total height of the strip
const LINE_COUNT    = 5
const LINE_GAP      = 4           // px between staff lines
const STAFF_TOP     = (STAFF_H - (LINE_COUNT - 1) * LINE_GAP) / 2
const AMPLITUDE     = 6           // sine wave amplitude — visible undulation
const SCROLL_SPEED  = 18          // px/s  — slow drift to the left
const NOTE_DENSITY_DESKTOP = 110
const NOTE_DENSITY_MOBILE  = 50
const NOTE_DENSITY  = IS_MOBILE ? NOTE_DENSITY_MOBILE : NOTE_DENSITY_DESKTOP

/** Staff-line draw step — lower = smoother but more segments */
const STAFF_LINE_STEP = IS_MOBILE ? 4 : 2

/** Cap DPR to avoid huge canvases on 3× screens */
const MAX_DPR = IS_MOBILE ? 2 : 4

/** Mobile: throttle to ~30 fps (skip every other rAF) */
const FRAME_SKIP = IS_MOBILE ? 1 : 0   // 0 = draw every frame, 1 = skip 1

/* interaction tunables */
const BOOST_SPEED   = 180         // extra px/s when a note is "tapped"
const BOOST_DECAY   = 2.8         // seconds for boost to fade
const REPEL_RADIUS  = 40          // px — dodge zone around cursor after click
const REPEL_STRENGTH = 14         // max displacement in px
const REPEL_DURATION = 1.2        // seconds the repel zone lasts
const HIT_RADIUS    = 16          // px — how close a click must be to "hit" a note

/**
 * Staff-line → MIDI note mapping (treble clef, bottom to top):
 *  line 0 = E4 (64), line 1 = G4 (67), line 2 = B4 (71),
 *  line 3 = D5 (74), line 4 = F5 (77).
 * Fractional lineIdx interpolates between pitches, and notes between
 * lines get the in-between pitches (F4, A4, C5, E5).
 */
const STAFF_MIDI: number[] = [64, 67, 71, 74, 77]
const MIDI_LO = 64
const MIDI_HI = 77
function lineIdxToMidi(lineIdx: number): number {
  // clamp to 0-4 then lerp between staff midi values
  const clamped = Math.max(0, Math.min(LINE_COUNT - 1, lineIdx))
  const lo = Math.floor(clamped)
  const hi = Math.min(lo + 1, LINE_COUNT - 1)
  const frac = clamped - lo
  return Math.round(STAFF_MIDI[lo] + (STAFF_MIDI[hi] - STAFF_MIDI[lo]) * frac)
}

/**
 * Convert a detected MIDI note to a staff lineIdx (inverse of lineIdxToMidi).
 * Uses linear interpolation between MIDI_LO (line 0) and MIDI_HI (line 4).
 * Notes outside the staff range are clamped with a small overshoot (-0.5 … 4.5).
 */
function midiToLineIdx(midi: number): number {
  const OVERSHOOT = 1.0          // how far above/below staff notes can go
  const clamped   = Math.max(MIDI_LO - OVERSHOOT * (MIDI_HI - MIDI_LO) / (LINE_COUNT - 1),
                             Math.min(MIDI_HI + OVERSHOOT * (MIDI_HI - MIDI_LO) / (LINE_COUNT - 1), midi))
  return (clamped - MIDI_LO) / (MIDI_HI - MIDI_LO) * (LINE_COUNT - 1)
}

/* ── Pitch-mode lerp constants ─────────────────────────── */
/** How fast notes slide toward detected pitch (lineIdx units/second). */
const PITCH_LERP_RATE   = 2.5
/** How strongly each note is pulled toward the target pitch (vs keeping its RNG spread). */
const PITCH_PULL        = 0.72
/** Keeps notes spread around the detected pitch rather than collapsing to one point. */
const PITCH_SPREAD      = 0.55   // multiplied by (note.lineIdx - LINE_CENTER)

/** Pre-decoded AudioBuffers keyed by MIDI number (lazy-loaded once). */
const noteBufferCache = new Map<number, AudioBuffer>()
let loadedSetId: string | null = null

export async function preloadNoteBuffers(setId?: string) {
  const id = setId ?? loadSoundSetId()
  const setDef = SOUND_SET_MAP[id]
  if (!setDef || !setDef.dir) {
    // 'none' / unknown — clear cache, play nothing
    noteBufferCache.clear()
    loadedSetId = id
    return
  }
  if (loadedSetId === id && noteBufferCache.size > 0) return
  noteBufferCache.clear()
  loadedSetId = id
  const ctx = getAudioContext()
  const fetches = []
  for (let m = MIDI_LO; m <= MIDI_HI; m++) {
    fetches.push(
      fetch(`/assets/soundfonts/notes/${setDef.dir}/note-${m}.mp3`)
        .then(r => r.arrayBuffer())
        .then(buf => ctx.decodeAudioData(buf))
        .then(decoded => { noteBufferCache.set(m, decoded) })
        .catch(() => { /* missing file — ignore */ }),
    )
  }
  await Promise.all(fetches)
}

export function playNoteBuffer(midi: number) {
  const buf = noteBufferCache.get(midi)
  if (!buf) return
  const ctx = getAudioContext()
  const src = ctx.createBufferSource()
  src.buffer = buf
  // gentle gain so overlapping notes don't clip
  const gain = ctx.createGain()
  gain.gain.value = 0.7
  src.connect(gain).connect(ctx.destination)
  src.start()
}

/* Unicode music symbols for variety */
const NOTE_CHARS = [
  '\u{1D15F}', // 𝅗𝅥  half note
  '\u{1D160}', // 𝅘𝅥   quarter note
  '\u{1D161}', // 𝅘𝅥𝅮  eighth note
  '\u{1D162}', // 𝅘𝅥𝅯  sixteenth note
  '\u{1D163}', // 𝅘𝅥𝅰  thirty-second note
  '\u266A',    // ♪
  '\u266B',    // ♫
  '\u266C',    // ♬
]

interface NoteData {
  x: number        // 0-1 normalised position in a full "page width"
  lineIdx: number   // which staff line (0-4) the note sits on, or between
  char: string
  rot: number       // degrees
  size: number      // font size
  colorIdx: number  // -1 = base, 0..3 = accent index
}

/** Deterministic seeded pseudo-random (mulberry32) */
function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateNotes(count: number): NoteData[] {
  const rng = mulberry32(42)
  const notes: NoteData[] = []
  for (let i = 0; i < count; i++) {
    // ~15% of notes get the accent (yellow) color, rest use base (white)
    const accentRoll = rng()
    const colorIdx = accentRoll < 0.15
      ? 0                        // single accent colour
      : -1                       // base
    notes.push({
      x: rng(),
      lineIdx: rng() * (LINE_COUNT + 1) - 0.5,   // can sit on or between lines
      char: NOTE_CHARS[Math.floor(rng() * NOTE_CHARS.length)],
      rot: (rng() - 0.5) * 50,                     // -25° to +25°
      size: 10 + rng() * 4,                         // 10-14px
      colorIdx,
    })
  }
  // sort by x so rendering is cache-friendly
  notes.sort((a, b) => a.x - b.x)
  return notes
}

const NOTES = generateNotes(NOTE_DENSITY)

/* ── per-note mutable runtime state (not in React state — perf) ── */
const noteBoost  = new Float32Array(NOTE_DENSITY)  // extra offset (px) accumulated
const noteTimer  = new Float32Array(NOTE_DENSITY)  // remaining boost time (s)

/**
 * Current (interpolated) lineIdx for each note when pitch mode is active.
 * Initialised lazily to note.lineIdx the first time pitch mode engages.
 */
const noteLineCurrent = new Float32Array(NOTE_DENSITY)
let   noteLineInitialised = false
const LINE_CENTER = (LINE_COUNT - 1) / 2   // = 2.0

function ensureNoteLineInit() {
  if (noteLineInitialised) return
  noteLineInitialised = true
  for (let i = 0; i < NOTES.length; i++) noteLineCurrent[i] = NOTES[i].lineIdx
}

/* ── pre-rendered note sprites (offscreen canvases) ──── */

/**
 * Each note is pre-rendered to a small OffscreenCanvas / document canvas
 * with its rotation already applied. At draw time we just `drawImage()`
 * which is vastly cheaper than `strokeText()`+`fillText()` per frame.
 *
 * Sprite cache is keyed by palette hash – when the theme changes we
 * re-render the sprites (happens at most once per palette change).
 */
interface NoteSprite {
  canvas: HTMLCanvasElement
  /** offset from the logical centre to the top-left of the sprite bitmap */
  ox: number
  oy: number
}

let spriteCache: NoteSprite[] = []
let spritePaletteKey = ''

function buildPaletteKey(pal: NotePalette): string {
  return `${pal.base}|${pal.outline}|${pal.accents.join(',')}`
}

function buildSprites(pal: NotePalette) {
  const key = buildPaletteKey(pal)
  if (key === spritePaletteKey && spriteCache.length === NOTES.length) return
  spritePaletteKey = key
  spriteCache = NOTES.map(note => {
    // generous padding so rotated glyph doesn't clip
    const pad = Math.ceil(note.size * 1.6)
    const dim = pad * 2
    const c = document.createElement('canvas')
    c.width = dim
    c.height = dim
    const ctx = c.getContext('2d')!
    ctx.translate(pad, pad)
    ctx.rotate((note.rot * Math.PI) / 180)
    ctx.font = `${note.size}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // outline
    ctx.lineWidth = 1.8
    ctx.strokeStyle = pal.outline
    ctx.strokeText(note.char, 0, 0)
    // fill — base or accent
    ctx.fillStyle = note.colorIdx < 0
      ? pal.base
      : pal.accents[note.colorIdx % pal.accents.length]
    ctx.fillText(note.char, 0, 0)
    return { canvas: c, ox: pad, oy: pad }
  })
}

/* ── component ─────────────────────────────────────────── */
interface NoteRiverProps {
  /**
   * When provided and non-null, NoteRiver operates in “pitch mode”:
   * each note’s vertical position smoothly interpolates toward the
   * staff line corresponding to the detected MIDI note.
   * Pass a MutableRefObject (not state) so updates don’t cause re-renders.
   */
  pitchMidiRef?: React.MutableRefObject<number | null>
}

export default function NoteRiver({ pitchMidiRef }: NoteRiverProps = {}) {
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const rafRef     = useRef(0)
  const offsetRef  = useRef(0)
  const lastT      = useRef(0)
  const paletteRef = useRef<NotePalette | null>(null)
  const paletteTick = useRef(0)
  const frameCounter = useRef(0)  // for mobile frame throttling

  /* repel zone: position + remaining time */
  const repelRef = useRef<{ x: number; y: number; timer: number } | null>(null)
  /* current mouse position (updated on mousemove, used for repel) */
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  /* current sound set id — re-checked on every click so picker changes take effect immediately */
  const preloadedRef = useRef(false)

  /** y-position of a staff line at a given x (px), with 1-cycle sine */
  const lineY = useCallback((lineIndex: number, xPx: number, width: number) => {
    const baseY = STAFF_TOP + lineIndex * LINE_GAP
    const phase = (xPx / width) * Math.PI * 2   // 1 full cycle
    return baseY + Math.sin(phase) * AMPLITUDE
  }, [])

  const draw = useCallback((now: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Mobile frame throttle — skip frames to halve effective FPS
    frameCounter.current++
    if (FRAME_SKIP > 0 && frameCounter.current % (FRAME_SKIP + 1) !== 0) {
      // Still update time so delta stays correct on the next drawn frame
      lastT.current = now
      rafRef.current = requestAnimationFrame(draw)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Resize canvas to CSS size (handle DPR for crispness, capped)
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width  = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    // Delta time
    const dt = lastT.current ? (now - lastT.current) / 1000 : 0
    lastT.current = now
    offsetRef.current = (offsetRef.current + SCROLL_SPEED * dt) % w

    ctx.clearRect(0, 0, w, h)

    // Re-read palette every ~60 drawn frames to track theme changes
    paletteTick.current++
    if (!paletteRef.current || paletteTick.current % 60 === 0) {
      paletteRef.current = readNotePalette()
    }
    const pal = paletteRef.current

    // Rebuild note sprites if palette changed
    buildSprites(pal)

    /* ── draw staff lines (sinusoidal) ── */
    ctx.strokeStyle = pal.staffLine
    ctx.lineWidth = 0.7
    for (let li = 0; li < LINE_COUNT; li++) {
      ctx.beginPath()
      for (let px = 0; px <= w; px += STAFF_LINE_STEP) {
        const y = lineY(li, px, w)
        if (px === 0) ctx.moveTo(px, y)
        else ctx.lineTo(px, y)
      }
      ctx.stroke()
    }

    /* ── draw notes (using pre-rendered sprites) ── */
    const off = offsetRef.current

    /* ── pitch mode: update per-note lineIdx toward detected pitch ── */
    const detectedMidi = pitchMidiRef?.current ?? null
    if (detectedMidi !== null) {
      ensureNoteLineInit()
      const targetLineIdx = midiToLineIdx(detectedMidi)
      const step = PITCH_LERP_RATE * dt
      for (let ni = 0; ni < NOTES.length; ni++) {
        const note   = NOTES[ni]
        // Target is a blend between pure pitch line and each note’s spread offset
        const spread = (note.lineIdx - LINE_CENTER) * PITCH_SPREAD
        const target = targetLineIdx * PITCH_PULL + (targetLineIdx + spread) * (1 - PITCH_PULL)
        // Lerp current toward target
        const diff   = target - noteLineCurrent[ni]
        noteLineCurrent[ni] += diff > 0
          ? Math.min(step, diff)
          : Math.max(-step, diff)
      }
    } else if (noteLineInitialised) {
      // Pitch lost — slowly drift back to original random lineIdx
      const step = PITCH_LERP_RATE * 0.4 * dt   // return slower than approach
      for (let ni = 0; ni < NOTES.length; ni++) {
        const origin = NOTES[ni].lineIdx
        const diff   = origin - noteLineCurrent[ni]
        noteLineCurrent[ni] += diff > 0
          ? Math.min(step, diff)
          : Math.max(-step, diff)
      }
    }

    /* decay repel zone */
    const repel = repelRef.current
    if (repel) {
      repel.timer -= dt
      if (repel.timer <= 0) repelRef.current = null
    }

    for (let ni = 0; ni < NOTES.length; ni++) {
      const note = NOTES[ni]

      /* decay per-note boost */
      if (noteTimer[ni] > 0) {
        noteTimer[ni] -= dt
        const factor = Math.max(0, noteTimer[ni] / BOOST_DECAY)
        noteBoost[ni] += BOOST_SPEED * factor * dt
        // wrap boost within canvas width so it doesn't grow forever
        if (noteBoost[ni] > w) noteBoost[ni] -= w
      }

      const sprite = spriteCache[ni]
      if (!sprite) continue

      // Always use original random lineIdx (pitch mode temporarily disabled)
      const curLineIdx = note.lineIdx

      // Two copies side by side for seamless wrap
      for (let copy = 0; copy < 2; copy++) {
        const rawX = note.x * w - off - noteBoost[ni] + copy * w
        let xPx = ((rawX % w) + w) % w
        const yBase = lineY(
          Math.max(0, Math.min(LINE_COUNT - 1, Math.round(curLineIdx))),
          xPx,
          w,
        )
        // Slight vertical jitter based on fractional lineIdx
        const yOff = (curLineIdx - Math.round(curLineIdx)) * LINE_GAP
        let y = yBase + yOff

        /* repel: push note away from cursor */
        if (repel && repel.timer > 0) {
          const dx = xPx - repel.x
          const dy = y - repel.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < REPEL_RADIUS && dist > 0.1) {
            const fade = repel.timer / REPEL_DURATION       // 1→0 fade
            const push = REPEL_STRENGTH * (1 - dist / REPEL_RADIUS) * fade
            xPx += (dx / dist) * push
            y   += (dy / dist) * push
          }
        }

        // Draw pre-rendered sprite instead of text operations
        ctx.drawImage(sprite.canvas, xPx - sprite.ox, y - sprite.oy)
      }
    }

    rafRef.current = requestAnimationFrame(draw)
  }, [lineY])

  /* ── click handler: boost nearest note + create repel zone ── */
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const w = rect.width
    const off = offsetRef.current

    // find nearest note
    let bestDist = Infinity
    let bestIdx = -1
    for (let ni = 0; ni < NOTES.length; ni++) {
      const note = NOTES[ni]
      const rawX = note.x * w - off - noteBoost[ni]
      const xPx = ((rawX % w) + w) % w
      const yBase = lineY(
        Math.max(0, Math.min(LINE_COUNT - 1, Math.round(note.lineIdx))),
        xPx, w,
      )
      const yOff = (note.lineIdx - Math.round(note.lineIdx)) * LINE_GAP
      const ny = yBase + yOff
      const dx = xPx - cx
      const dy = ny - cy
      const dist = dx * dx + dy * dy
      if (dist < bestDist) { bestDist = dist; bestIdx = ni }
    }

    if (bestIdx >= 0 && Math.sqrt(bestDist) < HIT_RADIUS) {
      noteTimer[bestIdx] = BOOST_DECAY

      /* ── play the note's pitch from pre-rendered WAV ── */
      const note = NOTES[bestIdx]
      const midi = lineIdxToMidi(note.lineIdx)
      try {
        resumeAudioContext()
        const currentSetId = loadSoundSetId()
        const setDef = SOUND_SET_MAP[currentSetId]
        if (setDef?.dir) {
          if (loadedSetId !== currentSetId || !preloadedRef.current) {
            preloadedRef.current = true
            preloadNoteBuffers(currentSetId).then(() => playNoteBuffer(midi))
          } else {
            playNoteBuffer(midi)
          }
        }
      } catch { /* audio not available — ignore */ }
    }

    // create repel zone at click position
    repelRef.current = { x: cx, y: cy, timer: REPEL_DURATION }
  }, [lineY])

  /* track mouse for smooth repel following */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    mouseRef.current = { x: mx, y: my }
    // update repel position to follow mouse while active
    if (repelRef.current && repelRef.current.timer > 0) {
      repelRef.current.x = mx
      repelRef.current.y = my
    }
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      role="img"
      aria-label="Note river animation canvas"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      style={{
        display: 'block',
        width: '100%',
        height: STAFF_H,
        marginBottom: 5,
        cursor: 'pointer',
        background: 'transparent',
      }}
    />
  )
}
