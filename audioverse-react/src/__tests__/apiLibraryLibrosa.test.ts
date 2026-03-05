import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  LIBRARY_BASE: '/api/library',
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as lib from '../scripts/api/apiLibraryLibrosa';

const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

const dummyFile = new File(['data'], 'audio.wav', { type: 'audio/wav' });

describe('apiLibraryLibrosa', () => {
  beforeEach(() => vi.clearAllMocks());

  it('postLibrosaAnalyze returns analysis', async () => {
    post.mockResolvedValueOnce({ data: { durationSeconds: 60, rms: 0.5, tempoBpm: 120, pitchMedianHz: 440 } });
    const res = await lib.postLibrosaAnalyze(dummyFile);
    expect(res.tempoBpm).toBe(120);
    expect(res.durationSeconds).toBe(60);
  });

  it('postLibrosaTempo returns tempo', async () => {
    post.mockResolvedValueOnce({ data: { tempoBpm: 130, beatsSeconds: [0.5, 1.0] } });
    const res = await lib.postLibrosaTempo(dummyFile);
    expect(res.tempoBpm).toBe(130);
  });

  it('postLibrosaOnsets returns onsets', async () => {
    post.mockResolvedValueOnce({ data: { onsetsSeconds: [0.5, 1.2] } });
    const res = await lib.postLibrosaOnsets(dummyFile);
    expect(res.onsetsSeconds).toEqual([0.5, 1.2]);
  });

  it('postLibrosaBeatTrack returns beats', async () => {
    post.mockResolvedValueOnce({ data: { beatsSeconds: [0.25, 0.75] } });
    const res = await lib.postLibrosaBeatTrack(dummyFile);
    expect(res.beatsSeconds).toEqual([0.25, 0.75]);
  });

  it('postLibrosaChromagram returns chromagram', async () => {
    post.mockResolvedValueOnce({ data: { chromagram: [[1, 2]] } });
    const res = await lib.postLibrosaChromagram(dummyFile);
    expect(res.chromagram).toEqual([[1, 2]]);
  });

  it('postLibrosaMfcc returns MFCC data', async () => {
    post.mockResolvedValueOnce({ data: { mfcc: [[0.1]] } });
    const res = await lib.postLibrosaMfcc(dummyFile, 20);
    expect(res.mfcc).toEqual([[0.1]]);
  });

  it('postLibrosaSpectralCentroid returns centroids', async () => {
    post.mockResolvedValueOnce({ data: { spectralCentroid: [500] } });
    const res = await lib.postLibrosaSpectralCentroid(dummyFile);
    expect(res.spectralCentroid).toEqual([500]);
  });

  it('postLibrosaHpss returns harmonic/percussive', async () => {
    post.mockResolvedValueOnce({ data: { harmonic: [1, 2], percussive: [3, 4] } });
    const res = await lib.postLibrosaHpss(dummyFile);
    expect(res).toHaveProperty('harmonic');
    expect(res).toHaveProperty('percussive');
  });

  it('postLibrosaMelSpectrogram returns spectrogram', async () => {
    post.mockResolvedValueOnce({ data: { mel: [[1]] } });
    const res = await lib.postLibrosaMelSpectrogram(dummyFile);
    expect(res.mel).toEqual([[1]]);
  });

  it('postLibrosaPitchTrack returns pitch data on first attempt', async () => {
    post.mockResolvedValueOnce({ data: { track: [{ t: 0, hz: 440 }], medianHz: 440 } });
    const res = await lib.postLibrosaPitchTrack(dummyFile);
    expect(res.medianHz).toBe(440);
    expect(res.track).toEqual([{ t: 0, hz: 440 }]);
  });

  it('postLibrosaPitchTrack falls back to next URL on 404', async () => {
    const err404 = Object.assign(new Error('Not Found'), { response: { status: 404 } });
    post.mockRejectedValueOnce(err404);
    post.mockResolvedValueOnce({ data: { track: [{ t: 0, hz: 220 }], medianHz: 220 } });
    const res = await lib.postLibrosaPitchTrack(dummyFile);
    expect(res.medianHz).toBe(220);
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('postLibrosaPitchTrack throws with attemptedUrls after all-fail', async () => {
    const err404 = Object.assign(new Error('Not Found'), { response: { status: 404 } });
    for (let i = 0; i < 15; i++) post.mockRejectedValueOnce(err404);
    await expect(lib.postLibrosaPitchTrack(dummyFile)).rejects.toThrow();
  });

  it('LIBROSA_PYIN_WS is defined', () => {
    expect(lib.LIBROSA_PYIN_WS).toContain('ws/pyin');
  });

  it('LIBROSA_API_BASE is defined', () => {
    expect(lib.LIBROSA_API_BASE).toBeTruthy();
  });
});
