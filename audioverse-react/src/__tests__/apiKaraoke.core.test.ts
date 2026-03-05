import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock the audioverseApiClient to intercept HTTP calls
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

describe('apiKaraoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchParties returns array when apiClient.get returns data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 1, name: 'P1' }] });
    const parties = await api.fetchParties();
    expect(parties).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalled();
  });

  it('fetchFilteredParties returns default empty when server returns undefined', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: undefined });
    const res = await api.fetchFilteredParties({ Page: 1, PageSize: 10 });
    expect(res.Items).toBeDefined();
    expect(res.TotalCount).toBe(0);
  });

  it('fetchUserSearch returns [] for short query and calls API for longer term', async () => {
    const short = await api.fetchUserSearch('ab');
    expect(short).toEqual([]);

    (apiClient.get as any).mockResolvedValueOnce({ data: [{ Id: 2, UserName: 'bob', Email: 'b' }] });
    const long = await api.fetchUserSearch('bobby');
    expect(long).toHaveLength(1);
    expect(apiClient.get).toHaveBeenCalled();
  });

  it('deleteAssignPlayerFromParty calls single event-based endpoint', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({});
    await expect(api.deleteAssignPlayerFromParty(10, 20)).resolves.toBeUndefined();
    expect(apiClient.delete).toHaveBeenCalledTimes(1);
  });

  it('fetchCollaboratorPermission returns null for falsy ids', async () => {
    const res = await api.fetchCollaboratorPermission(0 as any, null as any);
    expect(res).toBeNull();
  });
});
