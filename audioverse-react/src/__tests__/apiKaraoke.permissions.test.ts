import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  apiPath: (base: string, path: string) =>
    `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as api from '../scripts/api/apiKaraoke';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

describe('apiKaraoke – permissions endpoints', () => {
  beforeEach(() => vi.resetAllMocks());

  // --- fetchPlayerPermissions ---
  it('fetchPlayerPermissions returns numeric permission', async () => {
    get.mockResolvedValueOnce({ data: 7 });
    const res = await api.fetchPlayerPermissions(1, 2);
    expect(res).toBe(7);
    expect(get).toHaveBeenCalled();
  });

  it('fetchPlayerPermissions coerces string-like to number', async () => {
    get.mockResolvedValueOnce({ data: '15' });
    const res = await api.fetchPlayerPermissions(1, 2);
    expect(res).toBe(15);
  });

  it('fetchPlayerPermissions falls back to 0 for null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchPlayerPermissions(1, 2);
    expect(res).toBe(0);
  });

  // --- postGrantPermission ---
  it('postGrantPermission posts with permission param', async () => {
    post.mockResolvedValueOnce({ data: { ok: true } });
    const res = await api.postGrantPermission(1, 2, 'ManageRounds');
    expect(res).toEqual({ ok: true });
    expect(post).toHaveBeenCalled();
    // params should include permission
    const callArgs = post.mock.calls[0];
    expect(callArgs[2]).toEqual({ params: { permission: 'ManageRounds' } });
  });

  // --- postRevokePermission ---
  it('postRevokePermission posts with permission param', async () => {
    post.mockResolvedValueOnce({ data: { ok: true } });
    const res = await api.postRevokePermission(3, 4, 'EditSongs');
    expect(res).toEqual({ ok: true });
    const callArgs = post.mock.calls[0];
    expect(callArgs[2]).toEqual({ params: { permission: 'EditSongs' } });
  });

  // --- postBulkGrantPermissions ---
  it('postBulkGrantPermissions posts body array', async () => {
    post.mockResolvedValueOnce({ data: { updated: 2 } });
    const body = [
      { playerId: 1, permission: 'ManageRounds' },
      { playerId: 2, permission: 'EditSongs' },
    ];
    const res = await api.postBulkGrantPermissions(10, body);
    expect(res).toEqual({ updated: 2 });
    expect(post.mock.calls[0][1]).toBe(body);
  });

  // --- postBulkRevokePermissions ---
  it('postBulkRevokePermissions posts body array', async () => {
    post.mockResolvedValueOnce({ data: { removed: 1 } });
    const body = [{ playerId: 3, permission: 'ManageRounds' }];
    const res = await api.postBulkRevokePermissions(10, body);
    expect(res).toEqual({ removed: 1 });
  });

  // --- fetchPermissionHistory ---
  it('fetchPermissionHistory returns paged data', async () => {
    const paged = { Items: [{ action: 'grant' }], TotalCount: 1 };
    get.mockResolvedValueOnce({ data: paged });
    const res = await api.fetchPermissionHistory(5, { page: 1, pageSize: 10 });
    expect(res).toEqual(paged);
    expect(get).toHaveBeenCalled();
  });

  it('fetchPermissionHistory defaults to empty when null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchPermissionHistory(5);
    expect(res).toEqual({ Items: [], TotalCount: 0 });
  });
});

describe('apiKaraoke – version history endpoints', () => {
  beforeEach(() => vi.resetAllMocks());

  it('fetchSongVersion returns versioned data', async () => {
    get.mockResolvedValueOnce({ data: { id: 10, Version: 3, notes: 'X' } });
    const res = await api.fetchSongVersion(10, 3);
    expect(res.Version).toBe(3);
    expect(get).toHaveBeenCalled();
  });

  it('fetchSongVersions returns empty for non-array', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchSongVersions(5);
    expect(res).toEqual([]);
  });
});

describe('apiKaraoke – deleteAssignPlayerFromParty (event-based)', () => {
  beforeEach(() => vi.resetAllMocks());

  it('calls single event-based delete endpoint', async () => {
    del.mockResolvedValueOnce({});
    await api.deleteAssignPlayerFromParty(1, 2);
    expect(del).toHaveBeenCalledTimes(1);
  });

  it('throws when the endpoint fails', async () => {
    del.mockRejectedValueOnce(new Error('404'));
    await expect(api.deleteAssignPlayerFromParty(1, 2)).rejects.toThrow('404');
    expect(del).toHaveBeenCalledTimes(1);
  });
});

describe('apiKaraoke – null/fallback branches', () => {
  beforeEach(() => vi.resetAllMocks());

  it('fetchPlayers returns empty (endpoint removed)', async () => {
    // fetchPlayers no longer calls apiClient – it returns [] directly
    const res = await api.fetchPlayers();
    expect(res).toEqual([]);
  });

  it('fetchSongs returns empty for null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchSongs();
    expect(res).toEqual([]);
  });

  it('fetchCollaborators returns empty for non-array', async () => {
    get.mockResolvedValueOnce({ data: 'bad' });
    const res = await api.fetchCollaborators(1);
    expect(res).toEqual([]);
  });

  it('fetchPartyInvites returns data from server', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await api.fetchPartyInvites(3);
    expect(res).toEqual([{ id: 1 }]);
    expect(get.mock.calls[0][0]).toContain('/events/3/invites');
  });

  it('fetchUserSearch returns empty for null data', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchUserSearch('test query');
    expect(res).toEqual([]);
  });

  it('fetchCollaboratorPermission returns null for null data', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchCollaboratorPermission(1, 2);
    expect(res).toBeNull();
  });

  it('postAddRound returns data from post', async () => {
    post.mockResolvedValueOnce({ data: { id: 5, partyId: 1 } });
    const res = await api.postAddRound({ partyId: 1 } as any);
    expect(res.id).toBe(5);
  });

  it('postScanFolder returns empty for null', async () => {
    post.mockResolvedValueOnce({ data: null });
    const res = await api.postScanFolder('/path');
    expect(res).toEqual([]);
  });

  it('fetchTopSingings returns array from data', async () => {
    get.mockResolvedValueOnce({ data: [{ singingId: 1, score: 95 }] });
    const res = await api.fetchTopSingings(7);
    expect(res[0].score).toBe(95);
  });

  it('KARAOKE_QK keys are well-formed', () => {
    expect(api.KARAOKE_QK.parties).toEqual(['karaoke', 'parties']);
    expect(api.KARAOKE_QK.party(5)).toEqual(['karaoke', 'party', 5]);
    expect(api.KARAOKE_QK.songs({ title: 'X' })).toEqual(['karaoke', 'songs', { title: 'X' }]);
    expect(api.KARAOKE_QK.collaborators(9)).toEqual(['karaoke', 'song', 9, 'collaborators']);
    expect(api.KARAOKE_QK.versions(9)).toEqual(['karaoke', 'song', 9, 'versions']);
    expect(api.KARAOKE_QK.version(9, 2)).toEqual(['karaoke', 'song', 9, 'version', 2]);
    expect(api.KARAOKE_QK.topSingings(9)).toEqual(['karaoke', 'song', 9, 'top-singings']);
    expect(api.KARAOKE_QK.partiesFiltered({ Page: 1 })).toEqual(['karaoke', 'parties', 'filtered', { Page: 1 }]);
    expect(api.KARAOKE_QK.partyStatus(3)).toEqual(['karaoke', 'party', 3, 'status']);
    expect(api.KARAOKE_QK.players).toEqual(['karaoke', 'players']);
    expect(api.KARAOKE_QK.song(4)).toEqual(['karaoke', 'song', 4]);
  });
});
