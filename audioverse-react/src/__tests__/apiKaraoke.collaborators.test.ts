import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api client module used by apiKaraoke
vi.mock('../scripts/api/audioverseApiClient', () => {
  const get = vi.fn();
  const post = vi.fn();
  const put = vi.fn();
  const del = vi.fn();
  const apiPath = (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  return { apiClient: { get, post, put, delete: del }, apiPath, API_ROOT: 'http://localhost' };
});

import * as apiClientModule from '../scripts/api/audioverseApiClient';
import {
  fetchCollaborators,
  postAddCollaborator,
  fetchSongVersions,
  postRevertSongVersion,
  postCreateSong,
  putUpdateSong,
} from '../scripts/api/apiKaraoke';

describe('apiKaraoke (collaborators & versions)', () => {
  beforeEach(() => {
    (apiClientModule.apiClient.get as any).mockReset();
    (apiClientModule.apiClient.post as any).mockReset();
    (apiClientModule.apiClient.put as any).mockReset();
    (apiClientModule.apiClient.delete as any).mockReset();
  });

  it('fetchCollaborators returns array', async () => {
    (apiClientModule.apiClient.get as any).mockResolvedValue({ data: [12, 34] });
    const res = await fetchCollaborators(99);
    expect(apiClientModule.apiClient.get).toHaveBeenCalled();
    expect(res).toEqual([12, 34]);
  });

  it('postAddCollaborator posts payload', async () => {
    (apiClientModule.apiClient.post as any).mockResolvedValue({ data: { Success: true } });
    const res = await postAddCollaborator(7, { userId: 5, permission: 'Manage' });
    expect(apiClientModule.apiClient.post).toHaveBeenCalled();
    expect(res).toEqual({ Success: true });
  });

  it('fetchSongVersions returns metadata list', async () => {
    const meta = [{ Version: 1, ChangedAt: '2026-02-01T00:00:00Z', ChangedByUserId: 2 }];
    (apiClientModule.apiClient.get as any).mockResolvedValue({ data: meta });
    const res = await fetchSongVersions(13);
    expect(apiClientModule.apiClient.get).toHaveBeenCalled();
    expect(res).toEqual(meta);
  });

  it('postRevertSongVersion posts reason and returns data', async () => {
    (apiClientModule.apiClient.post as any).mockResolvedValue({ data: { Success: true } });
    const res = await postRevertSongVersion(13, 2, 'fix');
    expect(apiClientModule.apiClient.post).toHaveBeenCalled();
    expect(res).toEqual({ Success: true });
  });

  it('postCreateSong and putUpdateSong call correct methods', async () => {
    // Both endpoints have been removed — they now throw
    await expect(postCreateSong({ title: 'X' } as any)).rejects.toThrow('Endpoint removed');
    await expect(putUpdateSong(101, { title: 'Y' } as any)).rejects.toThrow('Endpoint removed');
  });
});
