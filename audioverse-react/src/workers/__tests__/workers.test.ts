// src/workers/__tests__/workers.test.ts
import { describe, it, expect } from 'vitest';
import { autoCorrelate } from '../../utils/karaokeHelpers';
import { scoreNotesWithPitchPoints } from '../../utils/karaokeScoring';
import type { NoteDescriptor, PitchPoint, ScoringParams } from '../../utils/karaokeScoring';

describe('Worker function parity', () => {
  describe('autoCorrelate', () => {
    it('returns 0 for silence', () => {
      const buf = new Float32Array(2048).fill(0);
      expect(autoCorrelate(buf, 44100)).toBe(0);
    });

    it('detects pitch for a simple sine wave', () => {
      const sampleRate = 44100;
      // Use 441 Hz — period is exactly 100 samples, avoiding fractional-period
      // boundary artifacts that trip the simple unnormalized autocorrelation.
      const freq = 441;
      const buf = new Float32Array(4096);
      for (let i = 0; i < buf.length; i++) {
        buf[i] = Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.5;
      }
      const detected = autoCorrelate(buf, sampleRate);
      // Should be exactly 441 Hz (period = 100 samples divides evenly)
      expect(detected).toBe(441);
    });

    it('returns 0 for very quiet signals', () => {
      const buf = new Float32Array(2048);
      for (let i = 0; i < buf.length; i++) buf[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.001;
      expect(autoCorrelate(buf, 44100, 0.01)).toBe(0);
    });
  });

  describe('scoreNotesWithPitchPoints', () => {
    const notes: NoteDescriptor[] = [
      { startTime: 1, duration: 0.5, pitch: 69, line: 0, idx: 0 }, // A4 = MIDI 69
    ];

    it('returns zero score for no pitch points', () => {
      const params: ScoringParams = { semitoneTolerance: 1, preWindow: 0.15, postExtra: 0.2 };
      const result = scoreNotesWithPitchPoints(notes, [], params);
      expect(result.total).toBe(0);
      expect(result.perNote).toHaveLength(0);
    });

    it('scores a perfect hit', () => {
      const points: PitchPoint[] = [
        { t: 1.0, hz: 440 },
        { t: 1.1, hz: 440 },
        { t: 1.2, hz: 440 },
        { t: 1.3, hz: 440 },
        { t: 1.4, hz: 440 },
      ];
      const params: ScoringParams = { semitoneTolerance: 1, preWindow: 0.15, postExtra: 0.2 };
      const result = scoreNotesWithPitchPoints(notes, points, params);
      expect(result.total).toBeGreaterThan(0);
      expect(result.perNote.length).toBeGreaterThan(0);
    });

    it('gives lower score for off-pitch', () => {
      const perfectPoints: PitchPoint[] = Array.from({ length: 5 }, (_, i) => ({ t: 1 + i * 0.1, hz: 440 }));
      const offPoints: PitchPoint[] = Array.from({ length: 5 }, (_, i) => ({ t: 1 + i * 0.1, hz: 500 }));
      const params: ScoringParams = { semitoneTolerance: 1, preWindow: 0.15, postExtra: 0.2 };
      const perfectResult = scoreNotesWithPitchPoints(notes, perfectPoints, params);
      const offResult = scoreNotesWithPitchPoints(notes, offPoints, params);
      expect(perfectResult.total).toBeGreaterThan(offResult.total);
    });

    it('includes combo tracking', () => {
      const multiNotes: NoteDescriptor[] = [
        { startTime: 1, duration: 0.5, pitch: 69, line: 0, idx: 0 },
        { startTime: 2, duration: 0.5, pitch: 69, line: 0, idx: 1 },
        { startTime: 3, duration: 0.5, pitch: 69, line: 0, idx: 2 },
      ];
      const points: PitchPoint[] = [
        { t: 1.1, hz: 440 }, { t: 1.2, hz: 440 },
        { t: 2.1, hz: 440 }, { t: 2.2, hz: 440 },
        { t: 3.1, hz: 440 }, { t: 3.2, hz: 440 },
      ];
      const params: ScoringParams = { semitoneTolerance: 1, preWindow: 0.15, postExtra: 0.2 };
      const result = scoreNotesWithPitchPoints(multiNotes, points, params);
      expect(result.combo).toBeDefined();
      expect(result.combo!.maxCombo).toBe(3);
    });
  });
});
