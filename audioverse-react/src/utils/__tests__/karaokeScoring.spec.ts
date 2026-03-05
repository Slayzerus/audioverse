import { describe, it, expect } from 'vitest';
import { scoreNotesWithPitchPoints } from '../karaokeScoring';

// Simple unit test: single note, perfect pitch points -> expect full-ish score
describe('scoreNotesWithPitchPoints', () => {
  it('scores a single sustained note with matching pitch points positively', () => {
    const notes = [{ startTime: 0, duration: 1.0, pitch: 60, isGold: false }];
    // points: one per 0.05s from 0..1, exact 440Hz mapping not needed as pitch is in MIDI used by scoring
    const points: any[] = [];
    for (let t = 0; t < 1.0; t += 0.05) {
      points.push({ t: t + 0.01, hz: 261.6256 }); // approx C4 (MIDI 60)
    }
    const params = { semitoneTolerance: 2, preWindow: 0.25, postExtra: 0.2, difficultyMult: 1 };
    const res = scoreNotesWithPitchPoints(notes as any, points as any, params as any);
    expect(res).toBeDefined();
    // Expect total score to be > 0 and perNote results to exist
    expect(res.total).toBeGreaterThan(0);
    expect(Array.isArray(res.perNote)).toBe(true);
  });
});
