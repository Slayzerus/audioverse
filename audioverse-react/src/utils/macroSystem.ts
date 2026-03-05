/**
 * Macro system — macro controllers, parameter mapping, and modulation routing.
 * Maps macro knobs → multiple target parameters with curves and ranges.
 */

export type ModulationCurve = 'linear' | 'exponential' | 'logarithmic' | 's-curve' | 'step' | 'inverse';

export interface MacroMapping {
  id: string;
  /** Target parameter identifier (e.g., 'filter.frequency', 'reverb.mix') */
  targetParam: string;
  /** Target component/effect identifier */
  targetId: string;
  /** Min output value */
  minValue: number;
  /** Max output value */
  maxValue: number;
  /** Curve type for value transformation */
  curve: ModulationCurve;
  /** Bipolar: if true, 0.5 macro = center, below inverts range */
  bipolar: boolean;
  /** Enabled flag */
  enabled: boolean;
}

export interface MacroController {
  id: string;
  name: string;
  /** Current value 0-1 */
  value: number;
  /** Default value */
  defaultValue: number;
  /** Color for UI */
  color: string;
  /** Mappings to target parameters */
  mappings: MacroMapping[];
  /** MIDI CC number for external control (null = unmapped) */
  midiCC?: number;
  /** Smoothing time in ms */
  smoothingMs: number;
}

export interface LFOModulator {
  id: string;
  name: string;
  /** LFO waveform */
  waveform: 'sine' | 'triangle' | 'square' | 'sawtooth' | 'random';
  /** Rate in Hz (free) or note division (synced) */
  rate: number;
  /** Sync to BPM */
  synced: boolean;
  /** Phase offset 0-1 */
  phase: number;
  /** Depth 0-1 */
  depth: number;
  /** Center value */
  center: number;
  /** Target mappings */
  mappings: MacroMapping[];
  /** Is running */
  active: boolean;
}

export interface ModulationMatrix {
  macros: MacroController[];
  lfos: LFOModulator[];
}

const MACRO_COLORS = [
  'var(--error,#e74c3c)',
  'var(--warning,#e67e22)',
  'var(--warning,#f1c40f)',
  'var(--success,#2ecc71)',
  'var(--accent-primary,#3498db)',
  'var(--accent-hover,#9b59b6)',
  'var(--accent-primary,#e91e63)',
  'var(--info,#00bcd4)',
];

let mappingCounter = 0;

/** Create an empty modulation matrix with N macro knobs */
export function createModulationMatrix(macroCount: number = 8, lfoCount: number = 2): ModulationMatrix {
  const macros: MacroController[] = Array.from({ length: macroCount }, (_, i) => ({
    id: `macro-${i}`,
    name: `Macro ${i + 1}`,
    value: 0,
    defaultValue: 0,
    color: MACRO_COLORS[i % MACRO_COLORS.length],
    mappings: [],
    smoothingMs: 10,
  }));

  const lfos: LFOModulator[] = Array.from({ length: lfoCount }, (_, i) => ({
    id: `lfo-${i}`,
    name: `LFO ${i + 1}`,
    waveform: 'sine',
    rate: 1,
    synced: false,
    phase: 0,
    depth: 0.5,
    center: 0.5,
    mappings: [],
    active: false,
  }));

  return { macros, lfos };
}

/** Add a mapping to a macro */
export function addMacroMapping(
  matrix: ModulationMatrix,
  macroId: string,
  targetId: string,
  targetParam: string,
  minValue: number = 0,
  maxValue: number = 1,
  curve: ModulationCurve = 'linear',
): ModulationMatrix {
  mappingCounter++;
  const mapping: MacroMapping = {
    id: `mapping-${mappingCounter}-${Date.now()}`,
    targetParam,
    targetId,
    minValue,
    maxValue,
    curve,
    bipolar: false,
    enabled: true,
  };

  return {
    ...matrix,
    macros: matrix.macros.map((m) =>
      m.id === macroId ? { ...m, mappings: [...m.mappings, mapping] } : m,
    ),
  };
}

/** Remove a mapping from a macro */
export function removeMacroMapping(
  matrix: ModulationMatrix,
  macroId: string,
  mappingId: string,
): ModulationMatrix {
  return {
    ...matrix,
    macros: matrix.macros.map((m) =>
      m.id === macroId
        ? { ...m, mappings: m.mappings.filter((mp) => mp.id !== mappingId) }
        : m,
    ),
  };
}

/** Set macro value and compute all mapped output values */
export function setMacroValue(
  matrix: ModulationMatrix,
  macroId: string,
  value: number,
): { matrix: ModulationMatrix; outputs: Array<{ targetId: string; targetParam: string; value: number }> } {
  const clamped = Math.max(0, Math.min(1, value));
  const updatedMatrix = {
    ...matrix,
    macros: matrix.macros.map((m) =>
      m.id === macroId ? { ...m, value: clamped } : m,
    ),
  };

  const macro = updatedMatrix.macros.find((m) => m.id === macroId);
  const outputs = (macro?.mappings ?? [])
    .filter((mp) => mp.enabled)
    .map((mp) => ({
      targetId: mp.targetId,
      targetParam: mp.targetParam,
      value: applyCurve(clamped, mp),
    }));

  return { matrix: updatedMatrix, outputs };
}

/** Apply curve transformation to map macro value → output value */
export function applyCurve(input: number, mapping: MacroMapping): number {
  let normalized = input;

  if (mapping.bipolar) {
    // -1 to 1 range centered at 0.5
    normalized = (input - 0.5) * 2;
  }

  let curved: number;

  switch (mapping.curve) {
    case 'linear':
      curved = normalized;
      break;
    case 'exponential':
      curved = mapping.bipolar
        ? Math.sign(normalized) * Math.pow(Math.abs(normalized), 2)
        : Math.pow(normalized, 2);
      break;
    case 'logarithmic':
      curved = mapping.bipolar
        ? Math.sign(normalized) * Math.sqrt(Math.abs(normalized))
        : Math.sqrt(normalized);
      break;
    case 's-curve': {
      const x = mapping.bipolar ? normalized : normalized * 2 - 1;
      curved = x / (1 + Math.abs(x));
      if (!mapping.bipolar) curved = (curved + 1) / 2;
      break;
    }
    case 'step':
      curved = mapping.bipolar
        ? Math.round(normalized * 4) / 4
        : Math.round(normalized * 8) / 8;
      break;
    case 'inverse':
      curved = mapping.bipolar ? -normalized : 1 - normalized;
      break;
    default:
      curved = normalized;
  }

  // Map to output range
  if (mapping.bipolar) {
    const center = (mapping.minValue + mapping.maxValue) / 2;
    const range = (mapping.maxValue - mapping.minValue) / 2;
    return center + curved * range;
  }

  return mapping.minValue + curved * (mapping.maxValue - mapping.minValue);
}

/** Compute LFO value at a given time */
export function computeLFOValue(lfo: LFOModulator, timeSeconds: number): number {
  if (!lfo.active) return lfo.center;

  const phase = (timeSeconds * lfo.rate + lfo.phase) % 1;

  let waveValue: number;
  switch (lfo.waveform) {
    case 'sine':
      waveValue = Math.sin(phase * 2 * Math.PI);
      break;
    case 'triangle':
      waveValue = 1 - 4 * Math.abs(phase - 0.5);
      break;
    case 'square':
      waveValue = phase < 0.5 ? 1 : -1;
      break;
    case 'sawtooth':
      waveValue = 2 * phase - 1;
      break;
    case 'random':
      // Step random — changes each cycle
      waveValue = (Math.sin(Math.floor(timeSeconds * lfo.rate) * 12345.6789) % 1) * 2 - 1;
      break;
    default:
      waveValue = 0;
  }

  return lfo.center + waveValue * lfo.depth * 0.5;
}

/** Get all LFO outputs at a given time */
export function computeAllLFOOutputs(
  matrix: ModulationMatrix,
  timeSeconds: number,
): Array<{ targetId: string; targetParam: string; value: number }> {
  const outputs: Array<{ targetId: string; targetParam: string; value: number }> = [];

  for (const lfo of matrix.lfos) {
    if (!lfo.active) continue;
    const lfoValue = computeLFOValue(lfo, timeSeconds);

    for (const mapping of lfo.mappings) {
      if (!mapping.enabled) continue;
      outputs.push({
        targetId: mapping.targetId,
        targetParam: mapping.targetParam,
        value: applyCurve(Math.max(0, Math.min(1, lfoValue)), mapping),
      });
    }
  }

  return outputs;
}

/** Reset macro to its default value */
export function resetMacro(
  matrix: ModulationMatrix,
  macroId: string,
): ModulationMatrix {
  return {
    ...matrix,
    macros: matrix.macros.map((m) =>
      m.id === macroId ? { ...m, value: m.defaultValue } : m,
    ),
  };
}

/** Add mapping to an LFO */
export function addLFOMapping(
  matrix: ModulationMatrix,
  lfoId: string,
  targetId: string,
  targetParam: string,
  minValue: number = 0,
  maxValue: number = 1,
): ModulationMatrix {
  mappingCounter++;
  const mapping: MacroMapping = {
    id: `lfo-map-${mappingCounter}-${Date.now()}`,
    targetParam,
    targetId,
    minValue,
    maxValue,
    curve: 'linear',
    bipolar: false,
    enabled: true,
  };
  return {
    ...matrix,
    lfos: matrix.lfos.map((l) =>
      l.id === lfoId ? { ...l, mappings: [...l.mappings, mapping] } : l,
    ),
  };
}

/** Get available modulation curves */
export function getModulationCurves(): Array<{ curve: ModulationCurve; label: string }> {
  return [
    { curve: 'linear', label: 'Linear' },
    { curve: 'exponential', label: 'Exponential' },
    { curve: 'logarithmic', label: 'Logarithmic' },
    { curve: 's-curve', label: 'S-Curve' },
    { curve: 'step', label: 'Step' },
    { curve: 'inverse', label: 'Inverse' },
  ];
}
