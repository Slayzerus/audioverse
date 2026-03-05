import { vi, describe, it, expect } from 'vitest';
import {
  toFormDataTranscribe,
  toFormDataAnalyze,
  toFormDataVad,
  toFormDataSeparate,
  toFormDataDiffSinger,
  toFormDataViSinger,
  toFormDataSoVits,
  toFormDataRvc,
} from '../models/modelsAiAudio';

const dummyFile = new File(['data'], 'audio.wav', { type: 'audio/wav' });

describe('modelsAiAudio FormData helpers', () => {
  it('toFormDataTranscribe appends file', () => {
    const fd = toFormDataTranscribe(dummyFile);
    expect(fd.get('file')).toBeInstanceOf(File);
  });

  it('toFormDataTranscribe appends language when provided', () => {
    const fd = toFormDataTranscribe(dummyFile, { language: 'pl' });
    expect(fd.get('language')).toBe('pl');
  });

  it('toFormDataAnalyze appends file and File', () => {
    const fd = toFormDataAnalyze(dummyFile);
    expect(fd.get('file')).toBeInstanceOf(File);
  });

  it('toFormDataVad appends file', () => {
    const fd = toFormDataVad(dummyFile, 3);
    expect(fd.get('file')).toBeInstanceOf(File);
  });

  it('toFormDataSeparate appends file', () => {
    const fd = toFormDataSeparate(dummyFile);
    expect(fd.get('file')).toBeInstanceOf(File);
  });

  it('toFormDataDiffSinger builds correct form data', () => {
    const fd = toFormDataDiffSinger({
      score: 'midi-data' as any,
      scoreFormat: 'musicxml',
      lyrics: 'la la la',
      voice: 'soprano',
      transpose: 2,
      bpm: 120,
      language: 'en',
    });
    expect(fd.get('score')).toBe('midi-data');
    expect(fd.get('scoreFormat')).toBe('musicxml');
    expect(fd.get('lyrics')).toBe('la la la');
    expect(fd.get('transpose')).toBe('2');
    expect(fd.get('bpm')).toBe('120');
    expect(fd.get('language')).toBe('en');
  });

  it('toFormDataDiffSinger uses defaults', () => {
    const fd = toFormDataDiffSinger({ score: 'x' as any });
    expect(fd.get('scoreFormat')).toBe('midi');
    expect(fd.get('lyrics')).toBe('');
    expect(fd.get('voice')).toBe('default');
  });

  it('toFormDataViSinger builds correct form data', () => {
    const fd = toFormDataViSinger({
      score: 'midi-data' as any,
      scoreFormat: 'midi',
      lyrics: 'do re mi',
      voice: 'tenor',
      transpose: -1,
      bpm: 90,
    });
    expect(fd.get('score')).toBe('midi-data');
    expect(fd.get('transpose')).toBe('-1');
    expect(fd.get('bpm')).toBe('90');
  });

  it('toFormDataSoVits builds form data with optional fields', () => {
    const fd = toFormDataSoVits({
      audio: dummyFile as any,
      targetSinger: 'singer1',
      key: 3,
      indexRate: 0.5,
      filterRadius: 2,
      rmsMixRate: 0.3,
      protect: 0.1,
    });
    expect(fd.get('targetSinger')).toBe('singer1');
    expect(fd.get('key')).toBe('3');
    expect(fd.get('protect')).toBe('0.1');
  });

  it('toFormDataSoVits omits null optional fields', () => {
    const fd = toFormDataSoVits({
      audio: dummyFile as any,
      targetSinger: 'singer2',
    });
    expect(fd.get('audio')).toBeTruthy();
    expect(fd.get('key')).toBeNull();
  });

  it('toFormDataRvc builds form data', () => {
    const fd = toFormDataRvc({
      audio: dummyFile as any,
      targetSinger: 'rvc1',
      key: 5,
      indexRate: 0.7,
      filterRadius: 3,
      rmsMixRate: 0.4,
      protect: 0.2,
    });
    expect(fd.get('targetSinger')).toBe('rvc1');
    expect(fd.get('key')).toBe('5');
  });

  it('toFormDataRvc omits null optional fields', () => {
    const fd = toFormDataRvc({
      audio: dummyFile as any,
      targetSinger: 'rvc2',
    });
    expect(fd.get('key')).toBeNull();
    expect(fd.get('protect')).toBeNull();
  });
});
