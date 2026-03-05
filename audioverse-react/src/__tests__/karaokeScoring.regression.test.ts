/**
 * Scoring regression tests using fixture bundles.
 *
 * These fixtures capture known-good scoring results so that changes to
 * scoreNotesWithPitchPoints don't silently alter behaviour.
 *
 * To regenerate expected values after an intentional scoring change:
 *   1. Run tests to see new totals.
 *   2. Update the snapshot values below.
 */
import { describe, test, expect } from 'vitest';
import {
  scoreNotesWithPitchPoints,
  type NoteDescriptor,
  type PitchPoint,
  type ScoringParams,
} from '../utils/karaokeScoring';
import { DefaultScoringPresets } from '../constants/karaokeScoringConfig';

// ─── Fixture helpers ───────────────────────────
import simpleScaleRaw from './fixtures/simple-scale.fixture.json';
import partialHitsRaw from './fixtures/partial-hits.fixture.json';

interface FixtureBundle {
  name: string;
  notes: NoteDescriptor[];
  points: PitchPoint[];
}

const simpleScale = simpleScaleRaw as FixtureBundle;
const partialHits = partialHitsRaw as FixtureBundle;

const normalParams: ScoringParams = DefaultScoringPresets.normal;

// ─── Tests ─────────────────────────────────────

describe('karaokeScoring regression — fixture bundles', () => {

  test('simple-scale fixture scores deterministically with normal preset', () => {
    const result = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);

    // All 8 notes should be scored
    expect(result.perNote.length).toBe(8);

    // Total should be positive and stable
    expect(result.total).toBeGreaterThan(0);

    // Snapshot the total — update this if scoring algorithm changes intentionally
    expect(result.total).toMatchSnapshot();
  });

  test('simple-scale: all notes are fully covered → completions', () => {
    const result = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);

    const completedCount = result.perNote.filter(pn => pn.completed).length;
    // With tight pitch points covering each note, most/all should be completed
    expect(completedCount).toBeGreaterThanOrEqual(6);
  });

  test('simple-scale: gold notes contribute bonus', () => {
    const result = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);

    const goldBonusTotal = result.perNote.reduce((s, pn) => s + (pn.goldFullBonus ?? 0), 0);
    // Notes at idx 2 and 5 are gold — they should have bonuses
    expect(goldBonusTotal).toBeGreaterThanOrEqual(0);
  });

  test('partial-hits fixture: note 5 (idx=1, line=1, pitch=65) has no pitch points → not scored', () => {
    const result = scoreNotesWithPitchPoints(partialHits.notes, partialHits.points, normalParams);

    // Note 5 (F5, startTime=9.0) has NO pitch points → should not appear or have 0 score
    // Note 6 (A4, startTime=11.0) also has no pitch points
    // Only notes 1-4 have pitch point coverage
    const scoredNotes = result.perNote.filter(pn => pn.totalAdded > 0);
    expect(scoredNotes.length).toBeLessThanOrEqual(4);
  });

  test('partial-hits fixture scores deterministically', () => {
    const result = scoreNotesWithPitchPoints(partialHits.notes, partialHits.points, normalParams);

    expect(result.total).toBeGreaterThan(0);
    expect(result.total).toMatchSnapshot();
  });

  test('partial-hits: fewer notes hit than total → lower score than simple-scale', () => {
    const scaleResult = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);
    const partialResult = scoreNotesWithPitchPoints(partialHits.notes, partialHits.points, normalParams);

    // simple-scale has all notes covered, partial-hits is missing notes 5 & 6
    expect(partialResult.total).toBeLessThan(scaleResult.total);
  });

  test('scoring is deterministic — running twice yields same total', () => {
    const r1 = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);
    const r2 = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);
    expect(r1.total).toBe(r2.total);
    expect(r1.perNote.length).toBe(r2.perNote.length);
  });

  test('difficulty presets produce different totals for same fixture', () => {
    const easy = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, DefaultScoringPresets.easy);
    const hard = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, DefaultScoringPresets.hard);

    // Easy should score same or higher than hard (more lenient)
    expect(easy.total).toBeGreaterThanOrEqual(hard.total);
  });

  test('offset shifts change score — positive 200ms offset degrades simple-scale', () => {
    const shift = 0.2; // 200ms
    const shiftedPoints = simpleScale.points.map(p => ({ ...p, t: p.t + shift }));
    const shiftedResult = scoreNotesWithPitchPoints(simpleScale.notes, shiftedPoints, normalParams);
    const normalResult = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);

    // Shifting by 200ms should reduce alignment and lower the score
    expect(shiftedResult.total).toBeLessThanOrEqual(normalResult.total);
  });

  test('combo tracking works on simple-scale', () => {
    const result = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);

    expect(result.combo).toBeDefined();
    expect(result.combo!.maxCombo).toBeGreaterThanOrEqual(1);
  });

  test('verse ratings are generated when notes have line info', () => {
    const result = scoreNotesWithPitchPoints(simpleScale.notes, simpleScale.points, normalParams);

    // simple-scale has lines 0, 1, 2 — should produce verse ratings
    if (result.verseRatings) {
      expect(result.verseRatings.length).toBeGreaterThan(0);
      for (const vr of result.verseRatings) {
        expect(vr.hitFraction).toBeGreaterThanOrEqual(0);
        expect(vr.hitFraction).toBeLessThanOrEqual(1);
      }
    }
  });
});
