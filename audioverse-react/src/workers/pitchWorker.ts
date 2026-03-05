// src/workers/pitchWorker.ts
// Web Worker for offloading autocorrelation pitch detection from the main thread.

export interface PitchWorkerRequest {
  id: number;
  buffer: Float32Array;
  sampleRate: number;
  rmsThreshold: number;
}

export interface PitchWorkerResponse {
  id: number;
  hz: number;
}

/**
 * Autocorrelation pitch estimator (same as karaokeHelpers.autoCorrelate).
 * Duplicated here because workers cannot share imports with the main bundle.
 */
function autoCorrelate(buf: Float32Array, sampleRate: number, rmsThreshold: number): number {
  let rms = 0;
  for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / buf.length);
  if (rms < rmsThreshold) return 0;

  let bestOffset = -1;
  let bestCorrelation = 0;
  for (let offset = 20; offset < buf.length / 2; offset++) {
    let correlation = 0;
    for (let i = 0; i < buf.length / 2; i++) correlation += buf[i] * buf[i + offset];
    correlation /= buf.length / 2;
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
  }
  return bestOffset > 0 ? sampleRate / bestOffset : 0;
}

self.onmessage = (e: MessageEvent<PitchWorkerRequest>) => {
  const { id, buffer, sampleRate, rmsThreshold } = e.data;
  const hz = autoCorrelate(buffer, sampleRate, rmsThreshold);
  const response: PitchWorkerResponse = { id, hz };
  self.postMessage(response);
};
