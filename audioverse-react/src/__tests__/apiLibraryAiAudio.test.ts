import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

// The module imports FormData helpers from models — mock them
vi.mock('../models/modelsAiAudio', () => ({
  AUDIO_WAV: 'audio/wav',
  APP_ZIP: 'application/zip',
  toFormDataTranscribe: vi.fn((_f: File, _r?: any) => new FormData()),
  toFormDataAnalyze: vi.fn((_f: File) => new FormData()),
  toFormDataSeparate: vi.fn((_f: File) => new FormData()),
  toFormDataDiffSinger: vi.fn((_r: any) => new FormData()),
  toFormDataViSinger: vi.fn((_r: any) => new FormData()),
  toFormDataSoVits: vi.fn((_r: any) => new FormData()),
  toFormDataRvc: vi.fn((_r: any) => new FormData()),
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as ai from '../scripts/api/apiLibraryAiAudio';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

const dummyFile = new File(['data'], 'audio.wav', { type: 'audio/wav' });

describe('apiLibraryAiAudio', () => {
  beforeEach(() => vi.clearAllMocks());

  it('postTranscribe calls post and returns transcript', async () => {
    post.mockResolvedValueOnce({ data: { text: 'hello' } });
    const res = await ai.postTranscribe(dummyFile);
    expect(res.text).toBe('hello');
  });

  it('getAsrStreamWsUrl returns websocket URL', () => {
    const url = ai.getAsrStreamWsUrl();
    expect(url).toContain('asr/stream');
  });

  it('postTts returns arraybuffer', async () => {
    const buf = new ArrayBuffer(10);
    post.mockResolvedValueOnce({ data: buf });
    const res = await ai.postTts({ text: 'hi', lang: 'en' } as any);
    expect(res).toEqual(buf);
  });

  it('postTtsCoqui calls post', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(5) });
    const res = await ai.postTtsCoqui({ engine: 'coqui' } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postTtsOpenTts calls post', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(5) });
    const res = await ai.postTtsOpenTts({ engine: 'opentts' } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postAnalyze returns analysis', async () => {
    post.mockResolvedValueOnce({ data: { bpm: 120 } });
    const res = await ai.postAnalyze(dummyFile);
    expect(res.bpm).toBe(120);
  });

  it('postRhythm returns rhythm data', async () => {
    post.mockResolvedValueOnce({ data: { beats: [1, 2] } });
    const res = await ai.postRhythm(dummyFile);
    expect(res.beats).toEqual([1, 2]);
  });

  it('postPitch returns pitch data', async () => {
    post.mockResolvedValueOnce({ data: { pitches: [440] } });
    const res = await ai.postPitch(dummyFile);
    expect(res.pitches).toEqual([440]);
  });

  it('postVad returns VAD segments', async () => {
    post.mockResolvedValueOnce({ data: [{ start: 0, end: 1 }] });
    const res = await ai.postVad(dummyFile, 3);
    expect(res).toEqual([{ start: 0, end: 1 }]);
  });

  it('postSeparate returns arraybuffer', async () => {
    const buf = new ArrayBuffer(100);
    post.mockResolvedValueOnce({ data: buf });
    const res = await ai.postSeparate(dummyFile, 4);
    expect(res).toBe(buf);
  });

  it('postTags returns tags', async () => {
    post.mockResolvedValueOnce({ data: { genre: 'rock' } });
    const res = await ai.postTags(dummyFile);
    expect(res.genre).toBe('rock');
  });

  it('postSingingScore posts two files', async () => {
    post.mockResolvedValueOnce({ data: { score: 85 } });
    const vocal = new File(['v'], 'vocal.wav');
    const ref = new File(['r'], 'ref.wav');
    const res = await ai.postSingingScore(vocal, ref);
    expect(res.score).toBe(85);
  });

  it('getSingingScoreLiveWsUrl returns WS path', () => {
    expect(ai.getSingingScoreLiveWsUrl()).toContain('score/live');
  });

  it('getPitchServerWsUrl returns WS path', () => {
    expect(ai.getPitchServerWsUrl()).toContain('pitch/ws/pitch_server');
  });

  it('getPitchClientWsUrl returns WS path', () => {
    expect(ai.getPitchClientWsUrl()).toContain('pitch/ws/pitch_client');
  });

  it('postDiffSinger returns arraybuffer', async () => {
    const buf = new ArrayBuffer(8);
    post.mockResolvedValueOnce({ data: buf });
    const res = await ai.postDiffSinger({ notes: [] } as any);
    expect(res).toBe(buf);
  });

  it('postViSinger returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postViSinger({ notes: [] } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postSoVits returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postSoVits({} as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postRvc returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postRvc({} as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postMusicGen returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postMusicGen({ prompt: 'jazz' } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postRiffusion returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postRiffusion({ prompt: 'beat' } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postAudioCraft returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postAudioCraft({ prompt: 'ambient' } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('postWaveGan returns arraybuffer', async () => {
    post.mockResolvedValueOnce({ data: new ArrayBuffer(8) });
    const res = await ai.postWaveGan({ prompt: 'drums' } as any);
    expect(res).toBeInstanceOf(ArrayBuffer);
  });

  it('bufferToBlobUrl creates blob URL', () => {
    // jsdom has URL.createObjectURL stubbed
    const original = URL.createObjectURL;
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    const buf = new ArrayBuffer(4);
    const url = ai.bufferToBlobUrl(buf);
    expect(url).toBe('blob:mock');
    URL.createObjectURL = original;
  });

  it('Mime constants are correct', () => {
    expect(ai.Mime.wav).toBe('audio/wav');
    expect(ai.Mime.zip).toBe('application/zip');
  });

  it('AI_BASE is defined', () => {
    expect(ai.AI_BASE).toBe('/api/ai/audio');
  });
});
