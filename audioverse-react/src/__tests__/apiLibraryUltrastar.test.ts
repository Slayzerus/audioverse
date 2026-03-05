import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
  postScanUltrastar,
  fetchUltrastarSongs,
  postParseUltrastar,
  US_QK,
  ULTRASTAR_BASE,
} from '../scripts/api/apiLibraryUltrastar';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('apiLibraryUltrastar', () => {
  beforeEach(() => vi.clearAllMocks());

  it('postScanUltrastar returns song list', async () => {
    const songs = [{ title: 'Test Song' }];
    post.mockResolvedValueOnce({ data: songs });
    const res = await postScanUltrastar();
    expect(res).toEqual(songs);
  });

  it('fetchUltrastarSongs returns songs', async () => {
    const songs = [{ title: 'S1' }];
    get.mockResolvedValueOnce({ data: songs });
    const res = await fetchUltrastarSongs();
    expect(res).toEqual(songs);
  });

  it('fetchUltrastarSongs with ensureScanned appends query', async () => {
    get.mockResolvedValueOnce({ data: [] });
    await fetchUltrastarSongs(true);
    const url = get.mock.calls[0][0] as string;
    expect(url).toContain('ensureScanned');
  });

  it('postParseUltrastar sends FormData and returns song', async () => {
    const song = { title: 'Parsed' };
    post.mockResolvedValueOnce({ data: song });
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    const res = await postParseUltrastar(file);
    expect(res).toEqual(song);
    expect(post).toHaveBeenCalled();
    const formData = post.mock.calls[0][1];
    expect(formData).toBeInstanceOf(FormData);
  });

  it('US_QK keys are well-formed', () => {
    expect(US_QK.songs).toEqual(['library', 'ultrastar', 'songs']);
  });

  it('ULTRASTAR_BASE is defined', () => {
    expect(ULTRASTAR_BASE).toBe('/api/karaoke/ultrastar');
  });
});
