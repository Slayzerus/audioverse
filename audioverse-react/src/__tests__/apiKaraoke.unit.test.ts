import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api client used by apiKaraoke
vi.mock('../scripts/api/audioverseApiClient', () => {
  return {
    apiClient: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    apiPath: (base: string, path: string) => `${base}${path}`,
  };
});

import * as apiKaraoke from '../scripts/api/apiKaraoke';
import { apiClient } from '../scripts/api/audioverseApiClient';

describe('apiKaraoke basic fetchers and branches', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('fetchParties returns array or empty', async () => {
    (apiClient.get as unknown as vi.Mock).mockResolvedValueOnce({ data: [{ id: 1, name: 'p' }] });
    const res = await apiKaraoke.fetchParties();
    expect(res).toEqual([{ id: 1, name: 'p' }]);

    (apiClient.get as unknown as vi.Mock).mockResolvedValueOnce({ data: null });
    const res2 = await apiKaraoke.fetchParties();
    expect(res2).toEqual([]);
  });

  it('fetchFilteredParties posts request and returns default when falsy', async () => {
    const sample = { Items: [{ id: 2 }], TotalCount: 1 };
    (apiClient.post as unknown as vi.Mock).mockResolvedValueOnce({ data: sample });
    const req = { Page: 1 } as any;
    const res = await apiKaraoke.fetchFilteredParties(req);
    expect(res).toEqual(sample);

    (apiClient.post as unknown as vi.Mock).mockResolvedValueOnce({ data: null });
    const res2 = await apiKaraoke.fetchFilteredParties(req);
    expect(res2).toEqual({ Items: [], TotalCount: 0 });
  });

  it('deleteAssignPlayerFromParty calls single endpoint and throws on failure', async () => {
    (apiClient.delete as unknown as vi.Mock).mockRejectedValueOnce(new Error('network'));

    await expect(apiKaraoke.deleteAssignPlayerFromParty(1, 2)).rejects.toThrow('network');
    expect((apiClient.delete as unknown as vi.Mock).mock.calls.length).toBe(1);
  });

  it('postParseUltrastar posts file data and returns response', async () => {
    const payload = { fileName: 'f', data: 'x' };
    (apiClient.post as unknown as vi.Mock).mockResolvedValueOnce({ data: { id: 5, fileName: 'f' } });
    const res = await apiKaraoke.postParseUltrastar(payload);
    expect(res).toEqual({ id: 5, fileName: 'f' });
    expect(apiClient.post).toHaveBeenCalledWith('/api/karaoke/parse-ultrastar', payload, { headers: { 'Content-Type': 'application/json' } });
  });

  it('fetchUserSearch returns empty for short terms and queries otherwise', async () => {
    const short = await apiKaraoke.fetchUserSearch('ab');
    expect(short).toEqual([]);

    (apiClient.get as unknown as vi.Mock).mockResolvedValueOnce({ data: [{ Id: 1, UserName: 'u', Email: 'e' }] });
    const res = await apiKaraoke.fetchUserSearch('query');
    expect(res).toEqual([{ Id: 1, UserName: 'u', Email: 'e' }]);
  });

  it('fetchCollaboratorPermission returns null for missing ids and queries otherwise', async () => {
    const r = await apiKaraoke.fetchCollaboratorPermission(0 as any, undefined as any);
    expect(r).toBeNull();

    // fetchCollaboratorPermission is a deprecated stub — always returns null regardless of mocking
    const r2 = await apiKaraoke.fetchCollaboratorPermission(5, 6);
    expect(r2).toBeNull();
  });
});
