// FX preset, EQ, autosave types

export interface MasterEQPreset {
  name: string;
  type: BiquadFilterType;
  frequency: number;
  q: number;
  gain: number;
}

export type AutoSaveMode = 'off' | 'onChange' | 'interval' | 'both';
