import { getScoringPreset, loadRemoteScoringPresets, ScoringPresets } from '../constants/karaokeScoringConfig';

vi.mock('../scripts/api/apiConfig', () => ({
  getKaraokeScoringConfig: vi.fn(async () => ({ presets: { easy: { semitoneTolerance: 42 } } })),
}));

describe('karaokeScoringConfig', () => {
  test('getScoringPreset returns default for normal', () => {
    const p = getScoringPreset('normal');
    expect(p).toHaveProperty('semitoneTolerance');
  });

  test('loadRemoteScoringPresets accepts a fetcher and updates presets', async () => {
    const fetcher = { getKaraokeScoringConfig: async () => ({ presets: { easy: { semitoneTolerance: 9 } } }) };
    const res = await loadRemoteScoringPresets(fetcher as any);
    expect(res.easy.semitoneTolerance).toBe(9);
    // ensure global ScoringPresets updated
    expect(ScoringPresets.easy.semitoneTolerance).toBe(9);
  });

  test('loadRemoteScoringPresets without fetcher uses dynamic import fallback (lines 60-62)', async () => {
    const res = await loadRemoteScoringPresets();
    // Mocked apiConfig returns { presets: { easy: { semitoneTolerance: 42 } } }
    expect(res.easy.semitoneTolerance).toBe(42);
    expect(ScoringPresets.easy.semitoneTolerance).toBe(42);
  });
});
