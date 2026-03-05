import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock apiConfig to prevent real HTTP requests via jsdom
vi.mock('../scripts/api/apiConfig', () => ({
  getKaraokeScoringConfig: vi.fn().mockResolvedValue(null),
  default: { getKaraokeScoringConfig: vi.fn().mockResolvedValue(null) },
}));

// Provide in-memory localStorage mock
const _store: Record<string, string> = {};
if (typeof globalThis.localStorage === 'undefined' || typeof (globalThis.localStorage as any).setItem !== 'function') {
  globalThis.localStorage = {
    getItem: (k: string) => (_store[k] ?? null),
    setItem: (k: string, v: string) => { _store[k] = String(v); },
    removeItem: (k: string) => { delete _store[k]; },
    clear: () => { for (const k of Object.keys(_store)) delete _store[k]; },
  } as any;
}

import {
  DefaultScoringPresets,
  getScoringPreset,
  loadRemoteScoringPresets,
  ScoringPresets,
} from '../constants/karaokeScoringConfig';

describe('karaokeScoringConfig — extended coverage', () => {
  beforeEach(() => {
    for (const k of Object.keys(_store)) delete _store[k];
  });

  // === DefaultScoringPresets ===
  describe('DefaultScoringPresets', () => {
    it('has easy, normal, hard presets', () => {
      expect(DefaultScoringPresets).toHaveProperty('easy');
      expect(DefaultScoringPresets).toHaveProperty('normal');
      expect(DefaultScoringPresets).toHaveProperty('hard');
    });

    it('easy has semitoneTolerance 2', () => {
      expect(DefaultScoringPresets.easy.semitoneTolerance).toBe(2);
    });

    it('normal has difficultyMult 1', () => {
      expect(DefaultScoringPresets.normal.difficultyMult).toBe(1);
    });

    it('hard has semitoneTolerance 0', () => {
      expect(DefaultScoringPresets.hard.semitoneTolerance).toBe(0);
    });
  });

  // === getScoringPreset ===
  describe('getScoringPreset', () => {
    it('returns normal preset by default', () => {
      const p = getScoringPreset();
      expect(p.semitoneTolerance).toBe(DefaultScoringPresets.normal.semitoneTolerance);
    });

    it('returns easy preset', () => {
      const p = getScoringPreset('easy');
      expect(p.semitoneTolerance).toBe(DefaultScoringPresets.easy.semitoneTolerance);
    });

    it('returns hard preset', () => {
      const p = getScoringPreset('hard');
      expect(p.semitoneTolerance).toBe(DefaultScoringPresets.hard.semitoneTolerance);
    });

    it('returns normal for unknown level (fallback)', () => {
      const p = getScoringPreset('unknown' as any);
      expect(p).toBeDefined();
      // Falls through to DefaultScoringPresets.normal
      expect(p.semitoneTolerance).toBeDefined();
    });
  });

  // === localStorage overrides via mergePresets ===
  describe('localStorage overrides', () => {
    it('merges localStorage overrides into presets', async () => {
      localStorage.setItem('karaoke.scoringPresets', JSON.stringify({
        easy: { semitoneTolerance: 5 },
      }));
      // Need to re-import to pick up the override since mergePresets runs at module load
      // Instead, test via loadRemoteScoringPresets which calls mergePresets internally
      const result = await loadRemoteScoringPresets({
        getKaraokeScoringConfig: async () => ({ presets: { easy: { semitoneTolerance: 5 } } }),
      });
      expect(result.easy.semitoneTolerance).toBe(5);
    });

    it('handles invalid JSON in localStorage gracefully', () => {
      localStorage.setItem('karaoke.scoringPresets', 'not-json{{{');
      // getScoringPreset should still work (loadOverrides returns null on parse error)
      const p = getScoringPreset('normal');
      expect(p).toBeDefined();
      expect(p.semitoneTolerance).toBeDefined();
    });
  });

  // === loadRemoteScoringPresets ===
  describe('loadRemoteScoringPresets', () => {
    it('uses provided fetcher', async () => {
      const fetcher = {
        getKaraokeScoringConfig: vi.fn().mockResolvedValue({
          presets: {
            hard: { semitoneTolerance: 3, difficultyMult: 1.5 },
          },
        }),
      };
      const result = await loadRemoteScoringPresets(fetcher);
      expect(fetcher.getKaraokeScoringConfig).toHaveBeenCalled();
      expect(result.hard.semitoneTolerance).toBe(3);
      expect(result.hard.difficultyMult).toBe(1.5);
      // Other presets should retain defaults
      expect(result.easy.semitoneTolerance).toBeDefined();
    });

    it('merges partial remote presets with defaults', async () => {
      const fetcher = {
        getKaraokeScoringConfig: vi.fn().mockResolvedValue({
          presets: {
            normal: { preWindow: 0.5 }, // only override one field
          },
        }),
      };
      const result = await loadRemoteScoringPresets(fetcher);
      expect(result.normal.preWindow).toBe(0.5);
      // Other fields should retain defaults
      expect(result.normal.semitoneTolerance).toBe(DefaultScoringPresets.normal.semitoneTolerance);
    });

    it('returns current ScoringPresets when fetcher returns null', async () => {
      const fetcher = {
        getKaraokeScoringConfig: vi.fn().mockResolvedValue(null),
      };
      const result = await loadRemoteScoringPresets(fetcher);
      expect(result).toBeDefined();
      expect(result.normal).toBeDefined();
    });

    it('returns ScoringPresets on fetcher error', async () => {
      const fetcher = {
        getKaraokeScoringConfig: vi.fn().mockRejectedValue(new Error('network')),
      };
      const result = await loadRemoteScoringPresets(fetcher);
      expect(result).toBeDefined();
      expect(result.normal).toBeDefined();
    });

    it('returns ScoringPresets when fetcher returns config without presets', async () => {
      const fetcher = {
        getKaraokeScoringConfig: vi.fn().mockResolvedValue({ someOtherData: true }),
      };
      const result = await loadRemoteScoringPresets(fetcher);
      expect(result).toBeDefined();
    });
  });
});
