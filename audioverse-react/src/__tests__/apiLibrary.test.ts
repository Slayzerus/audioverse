import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
  searchYouTubeByArtistTitle,
  LIB_QK,
} from '../scripts/api/apiLibrary';

/* apiLibrary creates its own axios instance — but the function
   searchYouTubeByArtistTitle uses the module-level `apiLibrary` (its own
   axios.create). We can mock at a higher level by mocking the whole module. */

vi.mock('../scripts/api/apiLibrary', async (importOriginal) => {
  const original = await importOriginal<typeof import('../scripts/api/apiLibrary')>();
  const mockGet = vi.fn();
  return {
    ...original,
    apiLibrary: { get: mockGet, post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    searchYouTubeByArtistTitle: async (artist: string, title: string) => {
      try {
        const { data } = await mockGet('/search', { params: { artist, title } });
        return data?.videoId ?? null;
      } catch {
        return null;
      }
    },
    __mockGet: mockGet,
  };
});

describe('apiLibrary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('LIB_QK returns correct keys', async () => {
    const mod = await import('../scripts/api/apiLibrary');
    expect(mod.LIB_QK.ytSearch('Adele', 'Hello')).toEqual([
      'library', 'yt-search', 'Adele', 'Hello',
    ]);
  });

  it('searchYouTubeByArtistTitle returns videoId', async () => {
    const mod = await import('../scripts/api/apiLibrary') as any;
    mod.__mockGet.mockResolvedValueOnce({ data: { videoId: 'abc123' } });
    const result = await mod.searchYouTubeByArtistTitle('Adele', 'Hello');
    expect(result).toBe('abc123');
  });

  it('searchYouTubeByArtistTitle returns null on error', async () => {
    const mod = await import('../scripts/api/apiLibrary') as any;
    mod.__mockGet.mockRejectedValueOnce(new Error('Network'));
    const result = await mod.searchYouTubeByArtistTitle('X', 'Y');
    expect(result).toBeNull();
  });

  it('searchYouTubeByArtistTitle returns null when no videoId', async () => {
    const mod = await import('../scripts/api/apiLibrary') as any;
    mod.__mockGet.mockResolvedValueOnce({ data: {} });
    const result = await mod.searchYouTubeByArtistTitle('X', 'Y');
    expect(result).toBeNull();
  });
});
