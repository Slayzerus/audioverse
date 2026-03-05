// Typy i interfejsy timeline, snap, waveform

export type SnapMode = 'bar' | 'beat' | 'sub-beat' | 'second';
export type TrackType = 'audio' | 'midi';
export type WaveformData = number[];

export type TimelineConfig = {
  zoom: number;
  duration: number;
  bpm: number;
  snapEnabled: boolean;
  snapMode: SnapMode;
};
