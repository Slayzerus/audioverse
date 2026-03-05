// audioPitchAnalyzeFile.ts
// Utility to analyze an audio file using the same logic as AudioPitchAnalyzer, but callable from anywhere.

import { PitchDetector } from "pitchy";
import { postPitch } from "../scripts/api/apiLibraryAiAudio";
import * as apiLibrosa from "../scripts/api/apiLibraryLibrosa";

// Aubio temporarily disabled
// import Aubio from "aubiojs";
export type PitchAlgorithm = "pitchy" | "crepe" | "ultrastar-wp" | "librosa";

export interface PitchSegment {
  start: number;
  duration: number;
  pitch: number;
  freq: number;
}

function hzToUltrastarPitch(hz: number) {
  if (!hz || hz <= 0) return null;
  const midi = 12 * Math.log2(hz / 440) + 69;
  return Math.round(midi - 12); // Ultrastar scale
}

function mergeSegments(segments: PitchSegment[]): PitchSegment[] {
  if (segments.length === 0) return [];
  const merged: PitchSegment[] = [];
  let last = segments[0];
  for (let i = 1; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.pitch === last.pitch && Math.abs(seg.freq - last.freq) < 1) {
      last.duration += seg.duration;
    } else {
      merged.push(last);
      last = seg;
    }
  }
  merged.push(last);
  return merged;
}

function detectPitch(buffer: Float32Array, sampleRate: number, rmsThreshold: number = 0.01): number {
  const maxSamples = Math.floor(sampleRate / 50); // 50 Hz min
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / buffer.length);
  if (rms < rmsThreshold) return 0;
  let lastCorrelation = 1;
  for (let offset = 50; offset < maxSamples; offset++) {
    let correlation = 0;
    for (let i = 0; i < maxSamples; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / maxSamples;
    if (correlation > bestCorrelation && correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    }
    lastCorrelation = correlation;
  }
  if (bestOffset === -1) return 0;
  return sampleRate / bestOffset;
}

// Aubio calling helper disabled for now. Kept for reference.
/*
function aubioCallDo(aubio: any, pitchDetector: any, slice: Float32Array, sampleRate: number): number {
  // preserved original logic
}
*/

export async function analyzeAudioFileWithAlgorithm(
  file: File,
  algorithm: PitchAlgorithm,
  options?: { signal?: AbortSignal; onProgress?: (p: number) => void; smoothingWindow?: number; rmsThreshold?: number; useHanning?: boolean }
): Promise<PitchSegment[]> {
  const { signal, onProgress, rmsThreshold, useHanning } = options || {};
  const arrayBuffer = await file.arrayBuffer();
  if (signal?.aborted) throw new Error('aborted');
  const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  const channel = audioBuffer.getChannelData(0);
  const sampleRate = audioBuffer.sampleRate;
  const windowSize = Math.floor(sampleRate * 0.1);
  const hopSize = windowSize;
  const segments: PitchSegment[] = [];
  if (algorithm === "pitchy") {
    const pitchDetector = PitchDetector.forFloat32Array(windowSize);
    const total = Math.max(1, Math.floor((channel.length - windowSize) / hopSize));
    let processed = 0;
    for (let i = 0; i < channel.length - windowSize; i += hopSize) {
      if (signal?.aborted) throw new Error('aborted');
      const slice = channel.slice(i, i + windowSize);
      if (useHanning) {
        for (let k = 0; k < slice.length; k++) slice[k] *= 0.5 * (1 - Math.cos((2 * Math.PI * k) / (slice.length - 1)));
      }
      const [hz, clarity] = pitchDetector.findPitch(slice, sampleRate);
      const pitch = hzToUltrastarPitch(hz);
      // check RMS threshold if provided
      let rms = 0;
      for (let k = 0; k < slice.length; k++) rms += slice[k] * slice[k];
      rms = Math.sqrt(rms / slice.length);
      const rmsT = typeof rmsThreshold === 'number' ? rmsThreshold : 0.01;
      if (pitch && hz > 50 && hz < 2000 && clarity > 0.7 && rms > rmsT) {
        segments.push({
          start: i / sampleRate,
          duration: windowSize / sampleRate,
          pitch,
          freq: hz,
        });
      }
      processed++;
      if (onProgress) onProgress(processed / total);
    }
  // aubio algorithm disabled for now
  } else if (algorithm === "crepe") {
    if (onProgress) onProgress(0.05);
    const response = await postPitch(file);
    if (signal?.aborted) throw new Error('aborted');
    const track = Array.isArray(response.track) ? response.track : [];
    if (track.length > 0) {
      track.forEach((pt: { t: number; hz: number }, idx: number) => {
        const pitch = hzToUltrastarPitch(pt.hz);
        if (pitch && pt.hz > 50 && pt.hz < 2000) {
          const nextT = track[idx + 1]?.t ?? (pt.t + 0.1);
          segments.push({
            start: pt.t,
            duration: idx < track.length - 1 ? nextT - pt.t : 0.1,
            pitch,
            freq: pt.hz,
          });
        }
      });
    }
    if (onProgress) onProgress(1);
  } else if (algorithm === "ultrastar-wp") {
    const total = Math.max(1, Math.floor((channel.length - windowSize) / hopSize));
    let processed = 0;
    for (let i = 0; i < channel.length - windowSize; i += hopSize) {
      if (signal?.aborted) throw new Error('aborted');
      const slice = channel.slice(i, i + windowSize);
      if (useHanning) {
        for (let k = 0; k < slice.length; k++) slice[k] *= 0.5 * (1 - Math.cos((2 * Math.PI * k) / (slice.length - 1)));
      }
      const rmsT = typeof rmsThreshold === 'number' ? rmsThreshold : 0.01;
      const hz = detectPitch(slice, sampleRate, rmsT);
      const pitch = hzToUltrastarPitch(hz);
      if (pitch && hz > 50 && hz < 2000) {
        segments.push({
          start: i / sampleRate,
          duration: windowSize / sampleRate,
          pitch,
          freq: hz,
        });
      }
      processed++;
      if (onProgress) onProgress(processed / total);
    }
  }
  if (algorithm === "librosa") {
    if (onProgress) onProgress(0.05);
    const response = await apiLibrosa.postLibrosaPitchTrack(file);
    if (signal?.aborted) throw new Error('aborted');
    const track = Array.isArray(response.track) ? response.track : [];
    if (track.length > 0) {
      track.forEach((pt: { t: number; hz: number }, idx: number) => {
        const pitch = hzToUltrastarPitch(pt.hz);
        if (pitch && pt.hz > 50 && pt.hz < 2000) {
          const nextT = track[idx + 1]?.t ?? (pt.t + 0.1);
          segments.push({
            start: pt.t,
            duration: idx < track.length - 1 ? nextT - pt.t : 0.1,
            pitch,
            freq: pt.hz,
          });
        }
      });
    }
    if (onProgress) onProgress(1);
  }
  return mergeSegments(segments);
}
