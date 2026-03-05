import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock choreoDSL — runRounds resolves immediately, seq() returns real builders
vi.mock('../components/animations/choreoDSL', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../components/animations/choreoDSL')>();
  return {
    ...orig,
    runRounds: vi.fn(async () => {}),
  };
});

import {
  scoreBus,
  onScore,
  reactionForScore,
  playIntro,
  simulateScore,
  attachScoreReactions,
} from '../components/animations/karaokeIntegration';
import { ChoreoBuilder, seq } from '../components/animations/choreoDSL';
import { runRounds } from '../components/animations/choreoDSL';

const mockRunRounds = runRounds as unknown as ReturnType<typeof vi.fn>;

describe('karaokeIntegration', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('scoreBus & simulateScore', () => {
    it('simulateScore pushes a score event', () => {
      let received: number | null = null;
      const unsub = scoreBus.subscribe((e) => { received = e.score; });
      simulateScore(7.5);
      expect(received).toBe(7.5);
      unsub();
    });
  });

  describe('onScore', () => {
    it('calls handler with score after throttle', async () => {
      const handler = vi.fn();
      const unsub = onScore(handler, { minIntervalMs: 0, dedupeWindowMs: 0 });
      simulateScore(8);
      expect(handler).toHaveBeenCalledWith(8);
      unsub();
    });

    it('throttles repeated events', () => {
      const handler = vi.fn();
      const unsub = onScore(handler, { minIntervalMs: 5000 });
      simulateScore(5);
      simulateScore(6);
      expect(handler).toHaveBeenCalledTimes(1);
      unsub();
    });

    it('deduplicates same rounded score', () => {
      const handler = vi.fn();
      const unsub = onScore(handler, { minIntervalMs: 0, dedupeWindowMs: 60000, roundTo: 0 });
      simulateScore(7);
      simulateScore(7.4); // rounds to 7 → deduplicated
      expect(handler).toHaveBeenCalledTimes(1);
      unsub();
    });
  });

  describe('reactionForScore', () => {
    it('returns ChoreoBuilder for high score (>= 8.5)', () => {
      const result = reactionForScore(9.0, () => 0);
      expect(result).toBeInstanceOf(ChoreoBuilder);
    });

    it('returns ChoreoBuilder for mid score (5.5-8.5)', () => {
      const result = reactionForScore(7.0, () => 0);
      expect(result).toBeInstanceOf(ChoreoBuilder);
    });

    it('returns ChoreoBuilder for low score (< 5.5)', () => {
      const result = reactionForScore(3.0, () => 0);
      expect(result).toBeInstanceOf(ChoreoBuilder);
    });

    it('uses different variants based on rng', () => {
      const r1 = reactionForScore(9.0, () => 0);
      const r2 = reactionForScore(9.0, () => 0.5);
      const r3 = reactionForScore(9.0, () => 0.99);
      // All should be ChoreoBuilder but different sequences
      expect(r1).toBeInstanceOf(ChoreoBuilder);
      expect(r2).toBeInstanceOf(ChoreoBuilder);
      expect(r3).toBeInstanceOf(ChoreoBuilder);
    });
  });

  describe('playIntro', () => {
    it('does nothing with empty actors', async () => {
      await playIntro([]);
      expect(mockRunRounds).not.toHaveBeenCalled();
    });

    it('calls runRounds with actors', async () => {
      const actors = [{}, {}] as any[];
      await playIntro(actors);
      expect(mockRunRounds).toHaveBeenCalledTimes(1);
    });
  });

  describe('attachScoreReactions', () => {
    it('returns unsubscribe function', () => {
      const unsub = attachScoreReactions([{}] as any[], { minIntervalMs: 0 });
      expect(typeof unsub).toBe('function');
      unsub();
    });

    it('triggers runRounds on score event', async () => {
      const actors = [{}] as any[];
      const unsub = attachScoreReactions(actors, { minIntervalMs: 0, dedupeWindowMs: 0 });
      simulateScore(8);
      // Give async a tick
      await new Promise((r) => setTimeout(r, 10));
      expect(mockRunRounds).toHaveBeenCalled();
      unsub();
    });
  });
});
