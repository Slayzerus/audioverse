import { describe, it, expect } from 'vitest';
import { scoreNotesWithPitchPoints } from '../karaokeScoring';

// Helper: approximate C4 hz
const C4 = 261.6256;

describe('scoreNotesWithPitchPoints - extended', () => {
  it('gold note receives larger per-segment add (multiplied)', () => {
    const notes = [{ startTime: 0, duration: 0.5, pitch: 60, isGold: false }];
    const goldNotes = [{ startTime: 0, duration: 0.5, pitch: 60, isGold: true }];
    const points: any[] = [];
    for (let t = 0; t < 0.5; t += 0.05) points.push({ t: t + 0.01, hz: C4 });
    const params = { semitoneTolerance: 2, preWindow: 0.25, postExtra: 0.1, difficultyMult: 1 };
    const r1 = scoreNotesWithPitchPoints(notes as any, points as any, params as any);
    const r2 = scoreNotesWithPitchPoints(goldNotes as any, points as any, params as any);
    expect(r1.total).toBeGreaterThan(0);
    expect(r2.total).toBeGreaterThan(r1.total);
  });

  it('semitoneTolerance 0 requires exact match (tiny pitch offset yields zero)', () => {
    const notes = [{ startTime: 0, duration: 0.5, pitch: 60 }];
    const points: any[] = [];
    // slightly detuned hz -> not exact midi
    for (let t = 0; t < 0.5; t += 0.05) points.push({ t: t + 0.01, hz: C4 * 1.02 });
    const paramsExact = { semitoneTolerance: 0, preWindow: 0.25, postExtra: 0.1 };
    const res = scoreNotesWithPitchPoints(notes as any, points as any, paramsExact as any);
    expect(res.total).toBe(0);
  });

  it('timing windows: points outside pre/post windows ignored', () => {
    const notes = [{ startTime: 10, duration: 0.5, pitch: 60 }];
    const points: any[] = [{ t: 0.1, hz: C4 }];
    const params = { semitoneTolerance: 2, preWindow: 0.25, postExtra: 0.1 };
    const res = scoreNotesWithPitchPoints(notes as any, points as any, params as any);
    expect(res.total).toBe(0);
  });

  it('no points returns zero and empty perNote', () => {
    const notes = [{ startTime: 0, duration: 1.0, pitch: 60 }];
    const points: any[] = [];
    const params = { semitoneTolerance: 2, preWindow: 0.25, postExtra: 0.2 };
    const res = scoreNotesWithPitchPoints(notes as any, points as any, params as any);
    expect(res.total).toBe(0);
    expect(res.perNote.length).toBe(0);
  });

  it('completion bonus applied when all segments are hit', () => {
    const notes = [{ startTime: 0, duration: 1.0, pitch: 60 }];
    // create dense points covering full duration
    const points: any[] = [];
    for (let t = 0; t <= 1.0; t += 0.05) points.push({ t: t, hz: C4 });
    const params = { semitoneTolerance: 2, preWindow: 0.25, postExtra: 0.2, completionBonusFactor: 0.15 };
    const res = scoreNotesWithPitchPoints(notes as any, points as any, params as any) as any;
    expect(res.total).toBeGreaterThan(0);
    expect(res.perNote.length).toBeGreaterThan(0);
    const pn = res.perNote[0];
    expect(pn.completed).toBe(true);
    expect(pn.completionBonus).toBeGreaterThanOrEqual(0);
  });
});
