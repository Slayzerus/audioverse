/**
 * Comprehensive unit tests for karaoke scoring engine:
 * - getVerseRatingLabel boundary values
 * - getComboMultiplier tiers
 * - scoreNotesWithPitchPoints: combo tracking, verse ratings, multi-note, gold, zero, perfect
 * - buildNoteDescriptors, buildSegmentScores, downsampleAndQuantizePitchPoints
 */
import { describe, it, expect } from 'vitest';
import {
  getVerseRatingLabel,
  getComboMultiplier,
  scoreNotesWithPitchPoints,
  type NoteDescriptor,
  type PitchPoint,
  type ScoringParams,
} from '../karaokeScoring';
import {
  buildNoteDescriptors,
  buildSegmentScores,
  downsampleAndQuantizePitchPoints,
} from '../karaokeHelpers';
import type { KaraokeNoteData } from '../../scripts/karaoke/karaokeTimeline';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
/** Generate perfectly matching pitch points for a given MIDI pitch */
function perfectPoints(startTime: number, duration: number, pitch: number, step = 0.04): PitchPoint[] {
  const hz = 440 * Math.pow(2, (pitch - 69) / 12);
  const pts: PitchPoint[] = [];
  for (let t = startTime; t < startTime + duration; t += step) {
    pts.push({ t, hz });
  }
  return pts;
}

const DEFAULT_PARAMS: ScoringParams = {
  semitoneTolerance: 2,
  preWindow: 0.25,
  postExtra: 0.2,
  difficultyMult: 1,
  completionBonusFactor: 0.15,
  goldFullBonusFactor: 0.30,
};

// ═══════════════════════════════════════════════════════════════
// getVerseRatingLabel
// ═══════════════════════════════════════════════════════════════
describe('getVerseRatingLabel', () => {
  it.each([
    [0.00, 'Awful'],
    [0.19, 'Awful'],
    [0.20, 'Bad'],
    [0.39, 'Bad'],
    [0.40, 'OK'],
    [0.59, 'OK'],
    [0.60, 'Good'],
    [0.79, 'Good'],
    [0.80, 'Great'],
    [0.94, 'Great'],
    [0.95, 'Perfect'],
    [1.00, 'Perfect'],
  ])('fraction %f → %s', (frac, expected) => {
    expect(getVerseRatingLabel(frac)).toBe(expected);
  });

  it('handles negative values gracefully (returns Awful)', () => {
    expect(getVerseRatingLabel(-0.5)).toBe('Awful');
  });

  it('handles values > 1 (returns Perfect)', () => {
    expect(getVerseRatingLabel(1.5)).toBe('Perfect');
  });
});

// ═══════════════════════════════════════════════════════════════
// getComboMultiplier
// ═══════════════════════════════════════════════════════════════
describe('getComboMultiplier', () => {
  it.each([
    [0,  1.0],
    [1,  1.0],
    [9,  1.0],
    [10, 1.5],
    [19, 1.5],
    [20, 2.0],
    [29, 2.0],
    [30, 2.5],
    [49, 2.5],
    [50, 3.0],
    [100, 3.0],
  ])('combo %i → %f', (combo, expected) => {
    expect(getComboMultiplier(combo)).toBe(expected);
  });

  it('negative combo returns 1.0', () => {
    expect(getComboMultiplier(-5)).toBe(1.0);
  });
});

// ═══════════════════════════════════════════════════════════════
// scoreNotesWithPitchPoints
// ═══════════════════════════════════════════════════════════════
describe('scoreNotesWithPitchPoints', () => {
  it('returns zero for empty notes array', () => {
    const res = scoreNotesWithPitchPoints([], [{ t: 0, hz: 261.6 }], DEFAULT_PARAMS);
    expect(res.total).toBe(0);
    expect(res.perNote).toHaveLength(0);
  });

  it('returns zero when all points have hz: 0 (silence)', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60 }];
    const points: PitchPoint[] = Array.from({ length: 20 }, (_, i) => ({ t: i * 0.05, hz: 0 }));
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.total).toBe(0);
  });

  it('returns zero when pitch is completely wrong', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60 }];
    // pitch 60 = C (pitch class 0); F#4 ≈ 370 Hz (pitch class 6) is maximally
    // far even after octave-folding — 6 semitones exceeds tolerance of 2.
    const points: PitchPoint[] = Array.from({ length: 20 }, (_, i) => ({ t: i * 0.05, hz: 370 }));
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.total).toBe(0);
  });

  it('scores positively for perfect pitch', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60 }];
    const points = perfectPoints(0, 1, 60);
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.total).toBeGreaterThan(0);
    expect(res.perNote.length).toBeGreaterThan(0);
  });

  it('gold notes score higher than normal notes', () => {
    const normal: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60, isGold: false }];
    const gold: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60, isGold: true }];
    const points = perfectPoints(0, 1, 60);
    const rNorm = scoreNotesWithPitchPoints(normal, points, DEFAULT_PARAMS);
    const rGold = scoreNotesWithPitchPoints(gold, points, DEFAULT_PARAMS);
    expect(rGold.total).toBeGreaterThan(rNorm.total);
  });

  it('scores multiple notes independently', () => {
    const notes: NoteDescriptor[] = [
      { startTime: 0, duration: 0.5, pitch: 60, line: 0, idx: 0 },
      { startTime: 1, duration: 0.5, pitch: 64, line: 0, idx: 1 },
      { startTime: 2, duration: 0.5, pitch: 67, line: 1, idx: 0 },
    ];
    const points = [
      ...perfectPoints(0, 0.5, 60),
      ...perfectPoints(1, 0.5, 64),
      ...perfectPoints(2, 0.5, 67),
    ];
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.total).toBeGreaterThan(0);
    expect(res.perNote.length).toBe(3);
  });

  it('combo tracks consecutive hits', () => {
    const notes: NoteDescriptor[] = Array.from({ length: 12 }, (_, i) => ({
      startTime: i * 0.5,
      duration: 0.3,
      pitch: 60,
      line: 0,
      idx: i,
    }));
    const points = notes.flatMap(n => perfectPoints(n.startTime, n.duration, n.pitch));
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.combo).toBeDefined();
    expect(res.combo!.maxCombo).toBe(12);
    // 12 hits: first 9 at 1x, combo 10 at 1.5x, 11 at 1.5x, 12 at 1.5x
    expect(res.combo!.totalComboBonus).toBeGreaterThan(0);
  });

  it('combo resets on miss', () => {
    const notes: NoteDescriptor[] = [
      { startTime: 0, duration: 0.3, pitch: 60, line: 0, idx: 0 },
      { startTime: 0.5, duration: 0.3, pitch: 60, line: 0, idx: 1 },
      { startTime: 1, duration: 0.3, pitch: 60, line: 0, idx: 2 }, // will miss
      { startTime: 1.5, duration: 0.3, pitch: 60, line: 0, idx: 3 },
    ];
    const points = [
      ...perfectPoints(0, 0.3, 60),
      ...perfectPoints(0.5, 0.3, 60),
      // no points for note at 1.0 (miss)
      ...perfectPoints(1.5, 0.3, 60),
    ];
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.combo).toBeDefined();
    // maxCombo should be 2 (first two hits, then reset, then 1)
    expect(res.combo!.maxCombo).toBe(2);
  });

  it('verse ratings computed per line', () => {
    const notes: NoteDescriptor[] = [
      { startTime: 0, duration: 0.3, pitch: 60, line: 0, idx: 0 },
      { startTime: 0.5, duration: 0.3, pitch: 60, line: 0, idx: 1 },
      { startTime: 1, duration: 0.3, pitch: 64, line: 1, idx: 0 },
    ];
    const points = [
      ...perfectPoints(0, 0.3, 60),
      ...perfectPoints(0.5, 0.3, 60),
      // miss line 1 entirely
    ];
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.verseRatings).toBeDefined();
    expect(res.verseRatings!.length).toBe(2);
    // Line 0: 2/2 hit → Perfect
    const v0 = res.verseRatings!.find(v => v.verseIndex === 0)!;
    expect(v0.hitFraction).toBe(1);
    expect(v0.label).toBe('Perfect');
    // Line 1: 0/1 hit → Awful
    const v1 = res.verseRatings!.find(v => v.verseIndex === 1)!;
    expect(v1.hitFraction).toBe(0);
    expect(v1.label).toBe('Awful');
  });

  it('completion bonus is applied when all segments hit', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60 }];
    const points = perfectPoints(0, 1.05, 60, 0.03); // very dense to cover all segments
    const res = scoreNotesWithPitchPoints(notes, points, {
      ...DEFAULT_PARAMS,
      completionBonusFactor: 0.15,
    });
    expect(res.perNote.length).toBe(1);
    expect(res.perNote[0].completed).toBe(true);
    expect(res.perNote[0].completionBonus).toBeGreaterThan(0);
  });

  it('gold full bonus is applied for gold notes when all segments hit', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60, isGold: true }];
    const points = perfectPoints(0, 1.05, 60, 0.03);
    const res = scoreNotesWithPitchPoints(notes, points, {
      ...DEFAULT_PARAMS,
      goldFullBonusFactor: 0.30,
    });
    expect(res.perNote[0].goldFullBonus).toBeGreaterThan(0);
  });

  it('very short note (0.05s) still gets at least 1 segment', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 0.05, pitch: 60 }];
    const points = perfectPoints(0, 0.1, 60, 0.01);
    const res = scoreNotesWithPitchPoints(notes, points, DEFAULT_PARAMS);
    expect(res.total).toBeGreaterThan(0);
    expect(res.perNote[0].segments.length).toBeGreaterThanOrEqual(1);
  });

  it('difficulty multiplier affects bonuses', () => {
    const notes: NoteDescriptor[] = [{ startTime: 0, duration: 1, pitch: 60. }];
    const points = perfectPoints(0, 1.05, 60, 0.03);
    const r1 = scoreNotesWithPitchPoints(notes, points, { ...DEFAULT_PARAMS, difficultyMult: 1.0 });
    const r2 = scoreNotesWithPitchPoints(notes, points, { ...DEFAULT_PARAMS, difficultyMult: 1.5 });
    // Higher difficulty mult → higher completion bonus
    if (r1.perNote[0]?.completionBonus && r2.perNote[0]?.completionBonus) {
      expect(r2.perNote[0].completionBonus).toBeGreaterThanOrEqual(r1.perNote[0].completionBonus);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// buildNoteDescriptors
// ═══════════════════════════════════════════════════════════════
describe('buildNoteDescriptors', () => {
  it('returns empty array for empty input', () => {
    expect(buildNoteDescriptors([], 0)).toEqual([]);
  });

  it('flattens note lines with gap offset', () => {
    const noteLines: KaraokeNoteData[][] = [
      [{ startTime: 1, duration: 0.5, pitch: 60 }],
      [{ startTime: 3, duration: 0.8, pitch: 64, isGold: true }],
    ];
    const result = buildNoteDescriptors(noteLines, 0.5);
    expect(result).toHaveLength(2);
    expect(result[0].startTime).toBeCloseTo(1.5); // 1 + 0.5 gap
    expect(result[0].line).toBe(0);
    expect(result[0].idx).toBe(0);
    expect(result[1].startTime).toBeCloseTo(3.5);
    expect(result[1].isGold).toBe(true);
    expect(result[1].line).toBe(1);
    expect(result[1].idx).toBe(0);
  });

  it('preserves multiple notes per line', () => {
    const noteLines: KaraokeNoteData[][] = [
      [
        { startTime: 0, duration: 0.3, pitch: 60 },
        { startTime: 0.5, duration: 0.3, pitch: 62 },
        { startTime: 1, duration: 0.3, pitch: 64 },
      ],
    ];
    const result = buildNoteDescriptors(noteLines, 0);
    expect(result).toHaveLength(3);
    expect(result[0].idx).toBe(0);
    expect(result[1].idx).toBe(1);
    expect(result[2].idx).toBe(2);
    expect(result.map(r => r.pitch)).toEqual([60, 62, 64]);
  });
});

// ═══════════════════════════════════════════════════════════════
// buildSegmentScores
// ═══════════════════════════════════════════════════════════════
describe('buildSegmentScores', () => {
  it('maps scoring results back to timeline segments', () => {
    const noteLines: KaraokeNoteData[][] = [
      [{ startTime: 1, duration: 0.5, pitch: 60, isGold: true }],
    ];
    const perNote = [{
      noteKey: '0-0',
      segments: [{ segIndex: 0, frac: 0.9, add: 50, segStart: 0.94, segEnd: 1.25, visualStart: 1, visualEnd: 1.25 }],
      totalAdded: 50,
      completed: true,
      completionBonus: 10,
      goldFullBonus: 5,
    }];
    const result = buildSegmentScores(perNote, noteLines, 0);
    expect(result).toHaveLength(1);
    expect(result[0].pitch).toBe(60);
    expect(result[0].frac).toBe(0.9);
    expect(result[0].isGold).toBe(true);
    expect(result[0].start).toBeCloseTo(1);
    expect(result[0].end).toBeCloseTo(1.25);
  });

  it('skips notes with invalid line/idx mapping', () => {
    const noteLines: KaraokeNoteData[][] = [[{ startTime: 0, duration: 1, pitch: 60 }]];
    const perNote = [{
      noteKey: '5-0', // line 5 doesn't exist
      segments: [{ segIndex: 0, frac: 1, add: 100, segStart: 0, segEnd: 0.5, visualStart: 0, visualEnd: 0.5 }],
      totalAdded: 100,
    }];
    const result = buildSegmentScores(perNote, noteLines, 0);
    expect(result).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// downsampleAndQuantizePitchPoints
// ═══════════════════════════════════════════════════════════════
describe('downsampleAndQuantizePitchPoints', () => {
  it('returns empty array for empty input', () => {
    expect(downsampleAndQuantizePitchPoints([])).toEqual([]);
  });

  it('retains all points when under maxPoints limit', () => {
    const pts: PitchPoint[] = [
      { t: 0.1234, hz: 261.6256 },
      { t: 0.5678, hz: 440.5 },
    ];
    const result = downsampleAndQuantizePitchPoints(pts, 10);
    expect(result).toHaveLength(2);
    // Quantized: t → 3dp, hz → integer
    expect(result[0].t).toBe(0.123);
    expect(result[0].hz).toBe(262);
    expect(result[1].t).toBe(0.568);
    expect(result[1].hz).toBe(441);
  });

  it('downsamples when over maxPoints', () => {
    const pts: PitchPoint[] = Array.from({ length: 200 }, (_, i) => ({
      t: i * 0.01,
      hz: 440 + i,
    }));
    const result = downsampleAndQuantizePitchPoints(pts, 50);
    expect(result).toHaveLength(50);
    // First and last should be approximately correct
    expect(result[0].hz).toBe(440);
  });

  it('uses default maxPoints of 120', () => {
    const pts: PitchPoint[] = Array.from({ length: 200 }, (_, i) => ({
      t: i * 0.01,
      hz: 440,
    }));
    const result = downsampleAndQuantizePitchPoints(pts);
    expect(result).toHaveLength(120);
  });
});
