import { logger } from '../utils/logger';
const log = logger.scoped('karaokeScoringConfig');

export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface ScoringPreset {
  semitoneTolerance: number;
  preWindow: number; // seconds
  postExtra: number; // seconds
  difficultyMult: number;
}

export const DefaultScoringPresets: Record<DifficultyLevel, ScoringPreset> = {
  easy: { semitoneTolerance: 2, preWindow: 0.25, postExtra: 0.3, difficultyMult: 0.9 },
  normal: { semitoneTolerance: 1, preWindow: 0.15, postExtra: 0.2, difficultyMult: 1 },
  hard: { semitoneTolerance: 0, preWindow: 0.08, postExtra: 0.12, difficultyMult: 1.05 },
};

const STORAGE_KEY = "karaoke.scoringPresets";

function loadOverrides(): Partial<Record<DifficultyLevel, Partial<ScoringPreset>>> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    log.warn("Failed to parse scoring presets overrides", e);
    return null;
  }
}

function mergePresets(baseInput?: Partial<Record<DifficultyLevel, Partial<ScoringPreset>>>): Record<DifficultyLevel, ScoringPreset> {
  const base = { ...DefaultScoringPresets } as Record<DifficultyLevel, ScoringPreset>;
  const overrides = loadOverrides();
  if (overrides) {
    (Object.keys(overrides) as DifficultyLevel[]).forEach(k => {
      const o = overrides[k];
      if (!o) return;
      base[k] = { ...base[k], ...o } as ScoringPreset;
    });
  }
  if (baseInput) {
    (Object.keys(baseInput) as DifficultyLevel[]).forEach(k => {
      const o = baseInput[k];
      if (!o) return;
      base[k] = { ...base[k], ...o } as ScoringPreset;
    });
  }
  return base;
}

export let ScoringPresets = mergePresets();

// Runtime loader for public scoring config
interface KaraokeScoringConfigResponse {
  presets?: Partial<Record<DifficultyLevel, Partial<ScoringPreset>>>;
}

export const loadRemoteScoringPresets = async (fetcher?: { getKaraokeScoringConfig: () => Promise<KaraokeScoringConfigResponse | null> }) => {
  try {
    let cfg: KaraokeScoringConfigResponse | null = null;
    if (fetcher) {
      cfg = await fetcher.getKaraokeScoringConfig();
    } else {
      // try dynamic import to avoid circular deps when not used
      const api = await import("../scripts/api/apiConfig");
      cfg = await api.getKaraokeScoringConfig() as KaraokeScoringConfigResponse | null;
    }
    if (cfg && cfg.presets) {
      ScoringPresets = mergePresets(cfg.presets);
      return ScoringPresets;
    }
  } catch (_e) {
    // Expected: backend config may not be available; using built-in default presets
  }
  return ScoringPresets;
};

export default ScoringPresets;

// Helper to retrieve a preset in one place — prefer this in scoring functions
export const getScoringPreset = (level: DifficultyLevel = 'normal'): ScoringPreset => {
  return ScoringPresets[level] || DefaultScoringPresets.normal;
};
