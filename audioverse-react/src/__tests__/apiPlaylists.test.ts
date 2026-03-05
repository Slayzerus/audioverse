import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as apiModule from '../scripts/api/apiPlaylists';
import * as clientModule from '../scripts/api/audioverseApiClient';

describe('apiPlaylists', () => {
  let postSpy: any;
  let getSpy: any;

  beforeEach(() => {
    postSpy = vi.spyOn(clientModule, 'apiClient').mockImplementation(() => ({} as any));
    // Instead of mocking apiClient as a function, spy on its methods directly
    postSpy = vi.spyOn(clientModule.apiClient, 'post').mockResolvedValue({ data: { ok: true } });
    getSpy = vi.spyOn(clientModule.apiClient, 'get').mockResolvedValue({ data: [{ id: 1 }] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('postCreatePlaylist returns data from apiClient.post', async () => {
    const res = await apiModule.postCreatePlaylist({} as any);
    expect(postSpy).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
  });

  it('postCreatePlaylistFromInfos returns data', async () => {
    const res = await apiModule.postCreatePlaylistFromInfos({} as any);
    expect(postSpy).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
  });

  it('postGetTidalStreams returns data', async () => {
    const res = await apiModule.postGetTidalStreams([] as any);
    expect(postSpy).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
  });

  it('postGetTidalStreamsFromInfos returns data', async () => {
    const res = await apiModule.postGetTidalStreamsFromInfos([] as any);
    expect(postSpy).toHaveBeenCalled();
    expect(res).toEqual({ ok: true });
  });

  it('getAllPlaylists calls apiClient.get and returns data', async () => {
    const res = await apiModule.getAllPlaylists();
    expect(getSpy).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('getPlaylistById calls apiClient.get with id and returns data', async () => {
    const res = await apiModule.getPlaylistById(42);
    expect(getSpy).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1 }]);
  });
});
