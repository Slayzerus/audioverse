/**
 * noteSoundSets — registry of available NoteRiver sound presets.
 *
 * Each set corresponds to a subdirectory under /assets/soundfonts/notes/
 * containing note-{64..77}.wav files.  The 'none' set uses no audio at all.
 */

export interface NoteSoundSet {
  /** Unique id stored in localStorage / synced settings */
  id: string
  /** Display label */
  name: string
  /** Short description */
  description: string
  /** Emoji icon */
  emoji: string
  /**
   * Subdirectory name under /assets/soundfonts/notes/.
   * null = no audio (silent mode).
   */
  dir: string | null
  /** Attribution text (shown in a tooltip when non-empty) */
  attribution?: string
}

export const NOTE_SOUND_SETS: NoteSoundSet[] = [
  {
    id: 'concert-harp',
    name: 'Concert Harp',
    description: 'Warm concert harp',
    emoji: '🎵',
    dir: 'concert-harp',
    attribution: 'ConcertHarp SoundFont — source: musical-artifacts.com/artifacts/375',
  },
  {
    id: 'celtic-harp',
    name: 'Celtic Harp',
    description: 'Bright celtic harp',
    emoji: '🍀',
    dir: 'celtic-harp',
  },
  {
    id: 'triangle',
    name: 'Triangle',
    description: 'Metallic percussion triangle',
    emoji: '🔺',
    dir: 'triangle',
    attribution: 'Triangle SoundFont — source: polyphone.io/en/soundfonts/unpitched-percussion/298-triangle',
  },
  {
    id: 'synth',
    name: 'Celesta',
    description: 'Synthesized celesta / music-box',
    emoji: '✨',
    dir: 'synth',
  },
  {
    id: 'none',
    name: 'Silent',
    description: 'No sound on click',
    emoji: '🔇',
    dir: null,
  },
]

export const DEFAULT_SOUND_SET_ID = 'concert-harp'

export const SOUND_SET_MAP: Record<string, NoteSoundSet> =
  Object.fromEntries(NOTE_SOUND_SETS.map(s => [s.id, s]))

/* ── localStorage persistence ── */
const STORAGE_KEY = 'audioverse-note-sound-set'

export function loadSoundSetId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && SOUND_SET_MAP[stored]) return stored
  } catch { /* SSR / unavailable */ }
  return DEFAULT_SOUND_SET_ID
}

export function saveSoundSetId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id)
  } catch { /* Expected: localStorage may be full or unavailable */ }
}
