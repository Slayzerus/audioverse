// ─── LFO (Low Frequency Oscillator) Engine ─────────────────────────────────────
// Generates modulation waveforms for CC automation, synth parameters, etc.

// ─── Types ──────────────────────────────────────────────────────────────────────

export type LFOWaveform = 'sine' | 'triangle' | 'sawtooth' | 'square' | 'random' | 'sample-hold';

export interface LFOConfig {
  /** Waveform shape */
  waveform: LFOWaveform;
  /** Frequency in Hz (0.01 - 20) */
  rate: number;
  /** Depth/amplitude (0-1) */
  depth: number;
  /** Phase offset in radians (0 - 2π) */
  phase: number;
  /** Center/bias value (0-1) — output = center ± depth/2 */
  center: number;
  /** Whether the LFO is synced to BPM */
  syncToBpm: boolean;
  /** Sync division (e.g. '1/4' = quarter note, '1/8' = eighth note) */
  syncDivision: LFOSyncDivision;
  /** Target CC number (or parameter ID) */
  targetCC?: number;
  /** Whether the LFO is active */
  enabled: boolean;
}

export type LFOSyncDivision =
  | '4/1' | '2/1' | '1/1'
  | '1/2' | '1/4' | '1/8' | '1/16' | '1/32'
  | '1/2t' | '1/4t' | '1/8t' | '1/16t';

// ─── Factory ────────────────────────────────────────────────────────────────────

export function createDefaultLFO(): LFOConfig {
  return {
    waveform: 'sine',
    rate: 1.0,
    depth: 0.5,
    phase: 0,
    center: 0.5,
    syncToBpm: false,
    syncDivision: '1/4',
    enabled: true,
  };
}

// ─── Sync Division to Hz ────────────────────────────────────────────────────────

const DIVISION_MULTIPLIERS: Record<LFOSyncDivision, number> = {
  '4/1': 0.25,
  '2/1': 0.5,
  '1/1': 1,
  '1/2': 2,
  '1/4': 4,
  '1/8': 8,
  '1/16': 16,
  '1/32': 32,
  '1/2t': 3,        // triplet divisions
  '1/4t': 6,
  '1/8t': 12,
  '1/16t': 24,
};

/** Convert BPM + sync division to LFO frequency in Hz */
export function syncDivisionToHz(bpm: number, division: LFOSyncDivision): number {
  const beatsPerSecond = bpm / 60;
  return beatsPerSecond * DIVISION_MULTIPLIERS[division] / 4;
}

// ─── Waveform Generators ────────────────────────────────────────────────────────

/** Core waveform function: returns value in [-1, 1] range */
export function waveformValue(waveform: LFOWaveform, phase: number): number {
  // Normalize phase to [0, 1]
  const p = ((phase % 1) + 1) % 1;

  switch (waveform) {
    case 'sine':
      return Math.sin(p * 2 * Math.PI);

    case 'triangle':
      return p < 0.5 ? 4 * p - 1 : 3 - 4 * p;

    case 'sawtooth':
      return 2 * p - 1;

    case 'square':
      return p < 0.5 ? 1 : -1;

    case 'random':
      // Smooth random noise (seeded by phase position)
      return Math.sin(p * 127.1) * Math.cos(p * 311.7) * 2;

    case 'sample-hold':
      // Holds random value for each cycle quarter
      return Math.sin(Math.floor(p * 4) * 2.399 + 0.5) * 2 - 1;

    default:
      return 0;
  }
}

// ─── LFO Evaluation ─────────────────────────────────────────────────────────────

/**
 * Compute LFO output at a given time.
 * Returns value in [0, 1] range (clamped).
 */
export function evaluateLFO(config: LFOConfig, time: number, bpm?: number): number {
  if (!config.enabled) return config.center;

  const freq = config.syncToBpm && bpm
    ? syncDivisionToHz(bpm, config.syncDivision)
    : config.rate;

  const phase = time * freq + config.phase / (2 * Math.PI);
  const raw = waveformValue(config.waveform, phase); // [-1, 1]
  const scaled = config.center + raw * config.depth * 0.5;

  return Math.max(0, Math.min(1, scaled));
}

/**
 * Compute LFO output mapped to a CC value (0-127).
 */
export function evaluateLFOAsCC(config: LFOConfig, time: number, bpm?: number): number {
  return Math.round(evaluateLFO(config, time, bpm) * 127);
}

// ─── Sampling ───────────────────────────────────────────────────────────────────

/**
 * Sample LFO over a time range to generate CC automation events.
 */
export function sampleLFOToCCEvents(
  config: LFOConfig,
  startTime: number,
  endTime: number,
  cc: number,
  samplesPerSecond: number = 30,
  bpm?: number,
): { time: number; value: number; cc: number }[] {
  const duration = endTime - startTime;
  const totalSamples = Math.max(2, Math.ceil(duration * samplesPerSecond));
  const events: { time: number; value: number; cc: number }[] = [];

  for (let i = 0; i <= totalSamples; i++) {
    const t = startTime + (i / totalSamples) * duration;
    const value = evaluateLFOAsCC(config, t, bpm);
    events.push({ time: t, value, cc });
  }

  return events;
}

/**
 * Generate an array of { x, y } points for SVG visualization.
 * x in [0, width], y in [0, height].
 */
export function sampleLFOForDisplay(
  config: LFOConfig,
  width: number,
  height: number,
  duration: number = 2,
  bpm?: number,
  samples: number = 200,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * duration;
    const val = evaluateLFO(config, t, bpm);
    points.push({
      x: (i / samples) * width,
      y: (1 - val) * height,
    });
  }

  return points;
}

// ─── Serialization ──────────────────────────────────────────────────────────────

export function serializeLFO(config: LFOConfig): string {
  return JSON.stringify(config, null, 2);
}

export function deserializeLFO(json: string): LFOConfig | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed.waveform !== 'string') return null;
    return parsed as LFOConfig;
  } catch {
    /* Expected: JSON.parse may fail on malformed LFO config */
    return null;
  }
}
