import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), patch: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as api from '../scripts/api/apiKaraoke';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as unknown as ReturnType<typeof vi.fn>;
const patch = (apiClient as any).patch as unknown as ReturnType<typeof vi.fn>;

describe('apiKaraoke — new fetchers & endpoints', () => {
  beforeEach(() => vi.resetAllMocks());

  // --- Party join ---
  it('postJoinParty posts to party/{id}/join', async () => {
    post.mockResolvedValueOnce({ data: { ok: true } });
    const res = await api.postJoinParty(42, { code: 'abc' } as any);
    expect(res).toEqual({ ok: true });
    expect(post.mock.calls[0][0]).toContain('/events/42/join');
  });

  it('postJoinParty works without request body', async () => {
    post.mockResolvedValueOnce({ data: { joined: true } });
    const res = await api.postJoinParty(10);
    expect(res.joined).toBe(true);
  });

  // --- Song list ---
  it('fetchAllSongs returns songs array', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }, { id: 2 }] });
    const res = await api.fetchAllSongs();
    expect(res).toHaveLength(2);
  });

  it('fetchAllSongs returns [] on null data', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchAllSongs();
    expect(res).toEqual([]);
  });

  it('fetchAllSongsIncludingDev returns songs', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1, inDevelopment: true }] });
    const res = await api.fetchAllSongsIncludingDev();
    expect(res).toHaveLength(1);
  });

  it('fetchAllSongsIncludingDev returns [] on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchAllSongsIncludingDev();
    expect(res).toEqual([]);
  });

  // --- Song flags ---
  it('postSetSongVerified posts with boolean body', async () => {
    post.mockResolvedValueOnce({});
    await api.postSetSongVerified(5, true);
    expect(post.mock.calls[0][0]).toContain('/songs/5/set-verified');
    expect(post.mock.calls[0][1]).toBe(true);
  });

  it('postSetSongDevelopment posts with boolean body', async () => {
    post.mockResolvedValueOnce({});
    await api.postSetSongDevelopment(7, false);
    expect(post.mock.calls[0][0]).toContain('/songs/7/set-development');
    expect(post.mock.calls[0][1]).toBe(false);
  });

  it('postSetVerifiedBulk posts array of songIds', async () => {
    post.mockResolvedValueOnce({});
    await api.postSetVerifiedBulk([1, 2, 3], true);
    expect(post.mock.calls[0][1]).toEqual([1, 2, 3]);
  });

  it('postSetDevelopmentBulk posts array of songIds', async () => {
    post.mockResolvedValueOnce({});
    await api.postSetDevelopmentBulk([4, 5]);
    expect(post.mock.calls[0][1]).toEqual([4, 5]);
  });

  // --- Filtered songs ---
  it('fetchFilteredSongs returns paged result', async () => {
    post.mockResolvedValueOnce({ data: { Items: [{ id: 1 }], TotalCount: 1 } });
    const res = await api.fetchFilteredSongs({ Page: 1, PageSize: 10 } as any);
    expect(res.Items).toHaveLength(1);
    expect(res.TotalCount).toBe(1);
  });

  it('fetchFilteredSongs returns empty on null data', async () => {
    post.mockResolvedValueOnce({ data: null });
    const res = await api.fetchFilteredSongs({} as any);
    expect(res).toEqual({ Items: [], TotalCount: 0 });
  });

  it('fetchFilteredEntities returns generic paged result', async () => {
    post.mockResolvedValueOnce({ data: { Items: [{ name: 'x' }], TotalCount: 1 } });
    const res = await api.fetchFilteredEntities('songs', {} as any);
    expect(res.Items).toHaveLength(1);
  });

  // --- Playlist ---
  it('fetchPlaylistById returns playlist data', async () => {
    get.mockResolvedValueOnce({ data: { id: 10, name: 'My Playlist' } });
    const res = await api.fetchPlaylistById(10);
    expect(res.name).toBe('My Playlist');
  });

  // --- Party poster ---
  it('fetchPartyPosterUrl returns presigned URL', async () => {
    get.mockResolvedValueOnce({ data: 'https://s3.example.com/poster.jpg' });
    const res = await api.fetchPartyPosterUrl(5, 600);
    expect(res).toBe('https://s3.example.com/poster.jpg');
  });

  it('fetchPartyPosterPublicUrl returns public URL', async () => {
    get.mockResolvedValueOnce({ data: 'https://cdn.example.com/poster.jpg' });
    const res = await api.fetchPartyPosterPublicUrl(5);
    expect(res).toBe('https://cdn.example.com/poster.jpg');
  });

  it('deletePartyPoster is a no-op stub', async () => {
    await api.deletePartyPoster(5);
    // deprecated stub — no API call expected
  });

  // --- Cover image ---
  it('fetchCoverImage returns data', async () => {
    get.mockResolvedValueOnce({ data: 'base64data' });
    const res = await api.fetchCoverImage('/path/cover.jpg');
    expect(res).toBe('base64data');
  });

  // --- Stats / ranking ---
  it('fetchRanking returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ playerId: 1, score: 100 }] });
    const res = await api.fetchRanking(10);
    expect(res).toHaveLength(1);
  });

  it('fetchRanking returns [] on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchRanking();
    expect(res).toEqual([]);
  });

  it('fetchUserHistory returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ singingId: 1 }] });
    const res = await api.fetchUserHistory(42, 5);
    expect(res).toHaveLength(1);
  });

  it('fetchUserHistory returns [] on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchUserHistory(1);
    expect(res).toEqual([]);
  });

  it('fetchActivity returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ day: '2024-01-01', count: 5 }] });
    const res = await api.fetchActivity(7);
    expect(res).toHaveLength(1);
  });

  it('fetchActivity returns [] on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchActivity();
    expect(res).toEqual([]);
  });

  // --- Top singings ---
  it('fetchTopSingings returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ singingId: 1, score: 95 }] });
    const res = await api.fetchTopSingings(10);
    expect(res).toHaveLength(1);
  });

  it('fetchTopSingings returns [] on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchTopSingings(10);
    expect(res).toEqual([]);
  });

  // --- Admin endpoints ---
  it('fetchAdminUploadFailures returns data', async () => {
    get.mockResolvedValueOnce({ data: { count: 3 } });
    const res = await api.fetchAdminUploadFailures();
    expect(res.count).toBe(3);
  });

  it('fetchAdminBuckets returns array', async () => {
    get.mockResolvedValueOnce({ data: ['bucket1', 'bucket2'] });
    const res = await api.fetchAdminBuckets();
    expect(res).toEqual(['bucket1', 'bucket2']);
  });

  it('fetchAdminBuckets returns [] on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchAdminBuckets();
    expect(res).toEqual([]);
  });

  it('fetchAdminBucketPublic returns boolean', async () => {
    get.mockResolvedValueOnce({ data: true });
    const res = await api.fetchAdminBucketPublic('my-bucket');
    expect(res).toBe(true);
  });

  it('fetchAdminBucketPublic returns false on falsy', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchAdminBucketPublic('x');
    expect(res).toBe(false);
  });

  it('postAdminSetBucketPublic posts', async () => {
    post.mockResolvedValueOnce({});
    await api.postAdminSetBucketPublic('my-bucket', false);
    expect(post.mock.calls[0][0]).toContain('/admin/buckets/my-bucket/public');
  });

  // --- Channel move ---
  it('postChannelMove posts request', async () => {
    post.mockResolvedValueOnce({ data: { moved: true } });
    const res = await api.postChannelMove({ from: 1, to: 2 } as any);
    expect(res.moved).toBe(true);
  });

  // --- invite endpoints ---
  it('postRespondInvite posts to invites/{id}/respond', async () => {
    post.mockResolvedValueOnce({ data: { accepted: true } });
    const res = await api.postRespondInvite(10, true);
    expect(res).toEqual({ accepted: true });
    expect(post.mock.calls[0][0]).toContain('/invites/10/respond');
  });

  it('postCancelInvite posts to invites/{id}/cancel', async () => {
    post.mockResolvedValueOnce({ data: { cancelled: true } });
    const res = await api.postCancelInvite(10);
    expect(res).toEqual({ cancelled: true });
    expect(post.mock.calls[0][0]).toContain('/invites/10/cancel');
  });

  // --- round players ---
  it('deleteRoundPlayer deletes', async () => {
    del.mockResolvedValueOnce({});
    await api.deleteRoundPlayer(1, 2);
    expect(del.mock.calls[0][0]).toContain('/rounds/1/players/2');
  });

  it('patchRoundPlayerSlot patches', async () => {
    patch.mockResolvedValueOnce({});
    await api.patchRoundPlayerSlot(1, 2, { slot: 3 } as any);
    expect(patch.mock.calls[0][0]).toContain('/rounds/1/players/2/slot');
  });

  // --- Song create/update ---
  it('postCreateSong is a deprecated stub that throws', async () => {
    await expect(api.postCreateSong({ title: 'New Song' } as any)).rejects.toThrow('Endpoint removed');
  });

  it('putUpdateSong is a deprecated stub that throws', async () => {
    await expect(api.putUpdateSong(5, { title: 'Updated' } as any)).rejects.toThrow('Endpoint removed');
  });

  // --- Permissions ---
  it('fetchPlayerPermissions returns number', async () => {
    get.mockResolvedValueOnce({ data: 7 });
    const res = await api.fetchPlayerPermissions(1, 2);
    expect(res).toBe(7);
  });

  it('fetchPlayerPermissions returns 0 on non-numeric', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchPlayerPermissions(1, 2);
    expect(res).toBe(0);
  });

  it('postGrantPermission posts grant', async () => {
    post.mockResolvedValueOnce({ data: { ok: true } });
    const res = await api.postGrantPermission(1, 2, 'ManageRounds');
    expect(res.ok).toBe(true);
  });

  it('postRevokePermission posts revoke', async () => {
    post.mockResolvedValueOnce({ data: {} });
    await api.postRevokePermission(1, 2, 'ManageRounds');
    expect(post).toHaveBeenCalled();
  });

  it('postBulkGrantPermissions posts array', async () => {
    post.mockResolvedValueOnce({ data: {} });
    await api.postBulkGrantPermissions(1, [{ playerId: 1, permission: 'ManageRounds' }]);
    expect(post).toHaveBeenCalled();
  });

  it('postBulkRevokePermissions posts array', async () => {
    post.mockResolvedValueOnce({ data: {} });
    await api.postBulkRevokePermissions(1, [{ playerId: 1, permission: 'ManageRounds' }]);
    expect(post).toHaveBeenCalled();
  });

  it('fetchPermissionHistory returns paged result', async () => {
    get.mockResolvedValueOnce({ data: { Items: [{ action: 'grant' }], TotalCount: 1 } });
    const res = await api.fetchPermissionHistory(1, { page: 1 });
    expect(res.Items).toHaveLength(1);
  });

  it('fetchPermissionHistory returns empty on null', async () => {
    get.mockResolvedValueOnce({ data: null });
    const res = await api.fetchPermissionHistory(1);
    expect(res).toEqual({ Items: [], TotalCount: 0 });
  });

  // --- party invites ---
  it('fetchPartyInvites returns array from API', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1, status: 'pending' }] });
    const res = await api.fetchPartyInvites(5);
    expect(Array.isArray(res)).toBe(true);
    expect(res).toHaveLength(1);
    expect(get.mock.calls[0][0]).toContain('/events/5/invites');
  });

  it('postSendPartyInvite posts invite', async () => {
    post.mockResolvedValueOnce({ data: { id: 100 } });
    const res = await api.postSendPartyInvite(5, { ToEmail: 'test@test.com' });
    expect(res.id).toBe(100);
  });

  // --- deleteParticipantFromEvent ---
  it('deleteParticipantFromEvent calls delete', async () => {
    del.mockResolvedValueOnce({});
    await api.deleteParticipantFromEvent(10, 20);
    expect(del).toHaveBeenCalled();
  });

  // --- patchParticipantStatus ---
  it('patchParticipantStatus patches', async () => {
    patch.mockResolvedValueOnce({});
    await api.patchParticipantStatus(10, 20, { status: 'Active' } as any);
    expect(patch).toHaveBeenCalled();
  });

  // --- KARAOKE_QK keys ---
  it('KARAOKE_QK produces correct keys', () => {
    expect(api.KARAOKE_QK.parties).toEqual(['karaoke', 'parties']);
    expect(api.KARAOKE_QK.party(1)).toEqual(['karaoke', 'party', 1]);
    expect(api.KARAOKE_QK.partyStatus(1)).toEqual(['karaoke', 'party', 1, 'status']);
    expect(api.KARAOKE_QK.songs({ title: 'x' })).toEqual(['karaoke', 'songs', { title: 'x' }]);
    expect(api.KARAOKE_QK.songsAll).toEqual(['karaoke', 'songs', 'all']);
    expect(api.KARAOKE_QK.song(5)).toEqual(['karaoke', 'song', 5]);
    expect(api.KARAOKE_QK.collaborators(5)).toEqual(['karaoke', 'song', 5, 'collaborators']);
    expect(api.KARAOKE_QK.versions(5)).toEqual(['karaoke', 'song', 5, 'versions']);
    expect(api.KARAOKE_QK.version(5, 2)).toEqual(['karaoke', 'song', 5, 'version', 2]);
    expect(api.KARAOKE_QK.topSingings(5)).toEqual(['karaoke', 'song', 5, 'top-singings']);
    expect(api.KARAOKE_QK.ranking(10)).toEqual(['karaoke', 'stats', 'ranking', 10]);
    expect(api.KARAOKE_QK.history(1)).toEqual(['karaoke', 'stats', 'history', 1]);
    expect(api.KARAOKE_QK.activity(7)).toEqual(['karaoke', 'stats', 'activity', 7]);
    expect(api.KARAOKE_QK.playlist(3)).toEqual(['karaoke', 'playlist', 3]);
    expect(api.KARAOKE_QK.adminBuckets).toEqual(['karaoke', 'admin', 'buckets']);
    expect(api.KARAOKE_QK.adminUploadFailures).toEqual(['karaoke', 'admin', 'upload-failures']);
  });
});
