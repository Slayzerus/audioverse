import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  API_ROOT: 'http://localhost:5000',
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
  buildStreamUrl,
  postScanAudio,
  fetchAudioFiles,
  fetchAudioRecords,
  selectRecordById,
  LIB_QK,
  AUDIO_BASE,
  YOUTUBE_BASE,
} from '../scripts/api/apiLibraryStream';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('apiLibraryStream', () => {
  beforeEach(() => vi.clearAllMocks());

  it('buildStreamUrl constructs correct URL', () => {
    const url = buildStreamUrl('abc-123');
    expect(url).toContain('/api/audio/stream/abc-123');
    expect(url).toContain('localhost:5000');
  });

  it('postScanAudio posts scan and returns count', async () => {
    post.mockResolvedValueOnce({ data: 42 });
    const res = await postScanAudio();
    expect(res).toBe(42);
    expect(post).toHaveBeenCalled();
  });

  it('fetchAudioFiles returns file list', async () => {
    const files = [{ id: 'f1', name: 'song.mp3' }];
    get.mockResolvedValueOnce({ data: files });
    const res = await fetchAudioFiles();
    expect(res).toEqual(files);
  });

  it('fetchAudioRecords returns records', async () => {
    const records = [{ id: 'r1', title: 'Rock' }];
    get.mockResolvedValueOnce({ data: records });
    const res = await fetchAudioRecords();
    expect(res).toEqual(records);
  });

  it('selectRecordById returns matching record', () => {
    const records = [
      { id: 'r1', title: 'A' },
      { id: 'r2', title: 'B' },
    ] as any[];
    const selector = selectRecordById('r2');
    expect(selector(records)?.title).toBe('B');
  });

  it('selectRecordById returns undefined when not found', () => {
    const selector = selectRecordById('missing');
    expect(selector([])).toBeUndefined();
  });

  it('LIB_QK keys are well-formed', () => {
    expect(LIB_QK.audioFiles).toEqual(['library', 'audio', 'files']);
    expect(LIB_QK.audioRecords).toEqual(['library', 'audio', 'records']);
    expect(LIB_QK.audioRecord('x')).toEqual(['library', 'audio', 'record', 'x']);
    expect(LIB_QK.ytSearch('A', 'B')).toEqual(['library', 'yt-search', 'A', 'B']);
  });

  it('AUDIO_BASE and YOUTUBE_BASE are defined', () => {
    expect(AUDIO_BASE).toBe('/api/audio');
    expect(YOUTUBE_BASE).toBe('/api/karaoke/songs/youtube');
  });
});
