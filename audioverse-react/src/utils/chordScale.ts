/**
 * Chord & Scale recognition engine.
 * Identifies chords from sets of notes and quantizes notes to scale.
 */

/** All pitch classes (chromatic) */
export const PITCH_CLASSES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export type PitchClass = (typeof PITCH_CLASSES)[number];

/** Interval sets for chord quality detection */
interface ChordTemplate {
  name: string;
  intervals: number[];
  suffix: string;
}

const CHORD_TEMPLATES: ChordTemplate[] = [
  { name: 'major', intervals: [0, 4, 7], suffix: '' },
  { name: 'minor', intervals: [0, 3, 7], suffix: 'm' },
  { name: 'diminished', intervals: [0, 3, 6], suffix: 'dim' },
  { name: 'augmented', intervals: [0, 4, 8], suffix: 'aug' },
  { name: 'sus2', intervals: [0, 2, 7], suffix: 'sus2' },
  { name: 'sus4', intervals: [0, 5, 7], suffix: 'sus4' },
  { name: 'major7', intervals: [0, 4, 7, 11], suffix: 'maj7' },
  { name: 'minor7', intervals: [0, 3, 7, 10], suffix: 'm7' },
  { name: 'dominant7', intervals: [0, 4, 7, 10], suffix: '7' },
  { name: 'diminished7', intervals: [0, 3, 6, 9], suffix: 'dim7' },
  { name: 'half-diminished7', intervals: [0, 3, 6, 10], suffix: 'm7b5' },
  { name: 'augmented7', intervals: [0, 4, 8, 10], suffix: 'aug7' },
  { name: 'minor-major7', intervals: [0, 3, 7, 11], suffix: 'mMaj7' },
  { name: 'major9', intervals: [0, 4, 7, 11, 14], suffix: 'maj9' },
  { name: 'minor9', intervals: [0, 3, 7, 10, 14], suffix: 'm9' },
  { name: 'dominant9', intervals: [0, 4, 7, 10, 14], suffix: '9' },
  { name: 'add9', intervals: [0, 4, 7, 14], suffix: 'add9' },
  { name: '6', intervals: [0, 4, 7, 9], suffix: '6' },
  { name: 'minor6', intervals: [0, 3, 7, 9], suffix: 'm6' },
  { name: 'power', intervals: [0, 7], suffix: '5' },
];

/** Scale interval patterns (semitones from root) */
interface ScaleDefinition {
  name: string;
  intervals: number[];
}

export const SCALES: ScaleDefinition[] = [
  { name: 'Major (Ionian)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  { name: 'Natural Minor (Aeolian)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  { name: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11] },
  { name: 'Melodic Minor', intervals: [0, 2, 3, 5, 7, 9, 11] },
  { name: 'Dorian', intervals: [0, 2, 3, 5, 7, 9, 10] },
  { name: 'Phrygian', intervals: [0, 1, 3, 5, 7, 8, 10] },
  { name: 'Lydian', intervals: [0, 2, 4, 6, 7, 9, 11] },
  { name: 'Mixolydian', intervals: [0, 2, 4, 5, 7, 9, 10] },
  { name: 'Locrian', intervals: [0, 1, 3, 5, 6, 8, 10] },
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9] },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10] },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10] },
  { name: 'Whole Tone', intervals: [0, 2, 4, 6, 8, 10] },
  { name: 'Chromatic', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
  { name: 'Hungarian Minor', intervals: [0, 2, 3, 6, 7, 8, 11] },
  { name: 'Japanese (In)', intervals: [0, 1, 5, 7, 8] },
];

export interface ChordResult {
  root: PitchClass;
  quality: string;
  symbol: string;
  confidence: number;
  inversion: number;
}

export interface ScaleMatch {
  root: PitchClass;
  name: string;
  matchScore: number;
  missingNotes: number[];
  extraNotes: number[];
}

/** Convert MIDI note to pitch class index (0-11) */
export function midiToPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

/** Get pitch class name from MIDI note */
export function midiToPitchClassName(midi: number): PitchClass {
  return PITCH_CLASSES[midiToPitchClass(midi)];
}

/** De-duplicate pitches to unique pitch classes */
function toPitchClassSet(midiNotes: number[]): number[] {
  const set = new Set(midiNotes.map(midiToPitchClass));
  return [...set].sort((a, b) => a - b);
}

/** Recognize chord from a set of MIDI notes */
export function recognizeChord(midiNotes: number[]): ChordResult[] {
  const pitchClasses = toPitchClassSet(midiNotes);
  if (pitchClasses.length < 2) return [];

  const results: ChordResult[] = [];

  // Try every pitch class as potential root
  for (let rootOffset = 0; rootOffset < 12; rootOffset++) {
    // Normalize intervals relative to this root
    const intervals = pitchClasses.map((pc) => (pc - rootOffset + 12) % 12).sort((a, b) => a - b);

    // Try each template
    for (const template of CHORD_TEMPLATES) {
      if (template.intervals.length > intervals.length + 1) continue; // too many notes needed

      // Check how many template intervals are present
      const matched = template.intervals.filter((i) => intervals.includes(i));
      const missing = template.intervals.filter((i) => !intervals.includes(i));
      const extra = intervals.filter((i) => !template.intervals.includes(i));

      if (missing.length === 0 && extra.length <= 1) {
        const root = PITCH_CLASSES[rootOffset];
        // Determine inversion
        const bass = midiNotes.length > 0 ? midiToPitchClass(Math.min(...midiNotes)) : rootOffset;
        const bassInterval = (bass - rootOffset + 12) % 12;
        const inversionIdx = template.intervals.indexOf(bassInterval);
        const inversion = inversionIdx > 0 ? inversionIdx : 0;

        const confidence = (matched.length / template.intervals.length) * (1 - extra.length * 0.1);

        results.push({
          root,
          quality: template.name,
          symbol: `${root}${template.suffix}`,
          confidence: Math.max(0, Math.min(1, confidence)),
          inversion,
        });
      }
    }
  }

  // Sort by confidence descending
  results.sort((a, b) => b.confidence - a.confidence);

  // Deduplicate (keep highest confidence per symbol)
  const seen = new Set<string>();
  return results.filter((r) => {
    if (seen.has(r.symbol)) return false;
    seen.add(r.symbol);
    return true;
  });
}

/** Get scale notes for a given root and scale */
export function getScaleNotes(root: PitchClass, scaleName: string): number[] {
  const scale = SCALES.find((s) => s.name === scaleName);
  if (!scale) return [];
  const rootIdx = PITCH_CLASSES.indexOf(root);
  return scale.intervals.map((i) => (rootIdx + i) % 12);
}

/** Quantize a MIDI note to the nearest note in the given scale */
export function quantizeToScale(midi: number, root: PitchClass, scaleName: string): number {
  const scaleNotes = getScaleNotes(root, scaleName);
  if (scaleNotes.length === 0) return midi;

  const pc = midiToPitchClass(midi);
  const octave = Math.floor(midi / 12);

  // Find nearest scale degree
  let bestDist = Infinity;
  let bestPc = pc;
  for (const sn of scaleNotes) {
    const dist = Math.min(Math.abs(pc - sn), 12 - Math.abs(pc - sn));
    if (dist < bestDist) {
      bestDist = dist;
      bestPc = sn;
    }
  }

  return octave * 12 + bestPc;
}

/** Quantize an array of MIDI notes to scale */
export function quantizeNotesToScale(midiNotes: number[], root: PitchClass, scaleName: string): number[] {
  return midiNotes.map((n) => quantizeToScale(n, root, scaleName));
}

/** Detect which scales best match a set of played notes */
export function detectScale(midiNotes: number[]): ScaleMatch[] {
  const pitchClasses = toPitchClassSet(midiNotes);
  if (pitchClasses.length < 3) return [];

  const results: ScaleMatch[] = [];

  for (let rootIdx = 0; rootIdx < 12; rootIdx++) {
    const root = PITCH_CLASSES[rootIdx];
    for (const scale of SCALES) {
      const scaleNotes = scale.intervals.map((i) => (rootIdx + i) % 12);
      const scaleSet = new Set(scaleNotes);
      const pcSet = new Set(pitchClasses);

      const missing = scaleNotes.filter((n) => !pcSet.has(n));
      const extra = pitchClasses.filter((n) => !scaleSet.has(n));

      // Score: higher when more of the played notes are in scale, fewer extra notes
      const inScaleCount = pitchClasses.filter((n) => scaleSet.has(n)).length;
      const matchScore = inScaleCount / pitchClasses.length - extra.length * 0.15;

      if (matchScore > 0.5) {
        results.push({
          root,
          name: scale.name,
          matchScore: Math.max(0, Math.min(1, matchScore)),
          missingNotes: missing,
          extraNotes: extra,
        });
      }
    }
  }

  results.sort((a, b) => b.matchScore - a.matchScore);
  return results.slice(0, 10);
}

/** Get all available scale names */
export function getScaleNames(): string[] {
  return SCALES.map((s) => s.name);
}

/** Get interval name between two MIDI notes */
export function getIntervalName(semitones: number): string {
  const intervalNames: Record<number, string> = {
    0: 'Unison', 1: 'Minor 2nd', 2: 'Major 2nd', 3: 'Minor 3rd',
    4: 'Major 3rd', 5: 'Perfect 4th', 6: 'Tritone', 7: 'Perfect 5th',
    8: 'Minor 6th', 9: 'Major 6th', 10: 'Minor 7th', 11: 'Major 7th', 12: 'Octave',
  };
  const normalized = ((semitones % 12) + 12) % 12;
  return intervalNames[normalized] ?? `${normalized} semitones`;
}
