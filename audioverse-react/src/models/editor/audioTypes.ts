// Types and interfaces for layers, clips, and audio effects

export type ClipId = number;

export interface ClipRegion {
  id: ClipId;
  label: string;
  start: number;
  duration: number;
  fadeIn: number;
  fadeOut: number;
  reverse: boolean;
  stretchFactor: number;
  color?: string;
  blob?: Blob;
  blobUrl?: string;
  audioBuffer?: AudioBuffer;
}

export type EffectType = 'eq3' | 'compressor' | 'delay' | 'reverb' | 'distortion';

export interface EffectSlot {
  id: string;
  type: EffectType;
  bypass: boolean;
  params: Record<string, number>;
}

export interface LayerSettings {
  mute: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  color: string;
  locked: boolean;
  group: string;
  effectChain: EffectSlot[];
  trackType: 'audio' | 'midi';
  instrument?: string;
}
