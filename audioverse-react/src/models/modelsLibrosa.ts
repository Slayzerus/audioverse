// Models derived from swagger.library.json components.schemas

export interface LibrosaPitchPoint {
  t: number; // timestamp seconds
  hz: number; // frequency in Hz
}

export interface LibrosaPitchTrackResponse {
  medianHz?: number | null;
  track?: LibrosaPitchPoint[] | null;
  voicedMask?: number[] | null;
}

export interface LibrosaAnalyzeResponse {
  durationSeconds?: number;
  rms?: number;
  tempoBpm?: number | null;
  pitchMedianHz?: number | null;
}

export interface LibrosaTempoResponse {
  tempoBpm: number;
  beatsSeconds?: number[] | null;
  onsetsSeconds?: number[] | null;
  durationSeconds?: number;
}

export interface LibrosaOnsetsResponse {
  tempoBpm?: number;
  beatsSeconds?: number[] | null;
  onsetsSeconds?: number[] | null;
  durationSeconds?: number;
}

export interface LibrosaBeatTrackResponse {
  tempoBpm?: number;
  beatsSeconds?: number[] | null;
}

// The swagger doesn't define explicit chromagram/mfcc/mel response DTOs,
// keep them permissive but typed to expected shapes.
export interface LibrosaChromagramResponse {
  chromagram?: number[][] | null;
}

export interface LibrosaMfccResponse {
  mfcc?: number[][] | null;
}

export interface LibrosaSpectralCentroidResponse {
  spectralCentroid?: number[] | null;
}

export interface LibrosaHpssResponse {
  harmonic?: number[] | null;
  percussive?: number[] | null;
}

export interface LibrosaMelSpectrogramResponse {
  mel?: number[][] | null;
}

export interface LibrosaVadSegment {
  start: number;
  end: number;
}

export interface LibrosaSingingOfflineScore {
  score?: number;
  pitchTrackHz?: number[] | null;
}

// Named exports only
