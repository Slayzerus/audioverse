import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => {
  const mock = {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    apiPath: (m: string, p: string) => `${m}${p.startsWith('/') ? p : '/' + p}`,
  };
  return mock;
});

import * as api from '../scripts/api/apiKaraoke';
import { apiClient } from '../scripts/api/audioverseApiClient';

describe('apiKaraoke deeper endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('postCreateParty handles FormData and returns created party', async () => {
    const fd = new FormData();
    fd.append('name', 'P');
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 99, name: 'P' } });
    const res = await api.postCreateParty(fd as any);
    expect(res.id).toBe(99);
    expect(apiClient.post).toHaveBeenCalled();
  });

  it('postCreatePlayer throws (endpoint removed)', async () => {
    await expect(api.postCreatePlayer({ id: 0, name: 'Pl' } as any)).rejects.toThrow('Endpoint removed');
  });

  it('postAssignPlayerToParty throws (endpoint removed)', async () => {
    await expect(api.postAssignPlayerToParty({ partyId: 1, playerId: 2 })).rejects.toThrow('Endpoint removed');
  });

  it('postAddRoundPlayer posts to rounds and returns id', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { success: true, id: 7 } });
    const out = await api.postAddRoundPlayer(13, { playerId: 2 } as any);
    expect(out.id).toBe(7);
  });

  it('fetchRoundPlayers returns array fallback', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: undefined });
    const arr = await api.fetchRoundPlayers(1);
    expect(Array.isArray(arr)).toBe(true);
  });

  it('postAddSongToRound and postSaveResults call apiClient', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 11 } });
    const song = await api.postAddSongToRound({} as any);
    expect(song.id).toBe(11);

    (apiClient.post as any).mockResolvedValueOnce({ data: {} });
    await api.postSaveResults([] as any);
    expect(apiClient.post).toHaveBeenCalled();
  });

  it('fetchSongs forwards params and returns array', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 1, title: 'X' }] });
    const s = await api.fetchSongs({ title: 'X' });
    expect(s[0].title).toBe('X');
    expect(apiClient.get).toHaveBeenCalled();
  });

  it('postParseUltrastar and postCreateSong/putUpdateSong behave correctly', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { fileName: 'f' } });
    const parsed = await api.postParseUltrastar({ fileName: 'f', data: 'd' });
    expect(parsed.fileName).toBe('f');

    // Both endpoints have been removed — they now throw
    await expect(api.postCreateSong({} as any)).rejects.toThrow('Endpoint removed');
    await expect(api.putUpdateSong(2, {} as any)).rejects.toThrow('Endpoint removed');
  });

  it('fetchTopSingings and postScanFolder call apiClient and return arrays', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: undefined });
    const tops = await api.fetchTopSingings(3);
    expect(Array.isArray(tops)).toBe(true);

    (apiClient.post as any).mockResolvedValueOnce({ data: [{ id: 1 }] });
    const scanned = await api.postScanFolder('p');
    expect(Array.isArray(scanned)).toBe(true);
  });
});
