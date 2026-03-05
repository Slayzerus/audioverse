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

describe('apiKaraoke additional behavior', () => {
  beforeEach(() => vi.resetAllMocks());

  it('deleteAssignPlayerFromParty throws when the endpoint fails', async () => {
    (apiClient.delete as any).mockRejectedValueOnce(new Error('fail'));
    await expect(api.deleteAssignPlayerFromParty(1, 2)).rejects.toThrow('fail');
  });

  it('postCreateParty sends no multipart headers for plain object', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { id: 2 } });
    const obj = { name: 'x' } as any;
    await api.postCreateParty(obj);
    expect((apiClient.post as any).mock.calls[0][2]).toBeUndefined();
  });

  it('putUpdateParty passes headers for FormData and not for object', async () => {
    (apiClient.put as any).mockResolvedValue({});
    const fd = new FormData();
    await api.putUpdateParty(3, fd as any);
    expect((apiClient.put as any).mock.calls[0][2]).toBeTruthy();

    await api.putUpdateParty(3, { name: 'y' } as any);
    expect((apiClient.put as any).mock.calls[1][2]).toBeUndefined();
  });

  it('deleteParty calls delete', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({});
    await api.deleteParty(9);
    expect(apiClient.delete).toHaveBeenCalled();
  });

  it('fetchPartyById and fetchPartyStatus return data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { id: 5 } });
    const p = await api.fetchPartyById(5);
    expect(p.id).toBe(5);

    (apiClient.get as any).mockResolvedValueOnce({ data: { status: 'ok' } });
    const s = await api.fetchPartyStatus(5);
    // fetchPartyStatus extracts data.status ?? data — returns the status string
    expect(s).toBe('ok');
  });

  it('postAddSession and postAddRoundPart return the provided ids', async () => {
    (apiClient.post as any).mockResolvedValueOnce({ data: { sessionId: 77 } });
    const sess = await api.postAddSession({} as any);
    expect(sess.sessionId).toBe(77);

    (apiClient.post as any).mockResolvedValueOnce({ data: { roundPartId: 88 } });
    const part = await api.postAddRoundPart({} as any);
    expect(part.roundPartId).toBe(88);
  });

  it('deleteRoundPlayer calls delete', async () => {
    (apiClient.delete as any).mockResolvedValueOnce({});
    await api.deleteRoundPlayer(1, 2);
    expect(apiClient.delete).toHaveBeenCalled();
  });

  it('invites endpoints call proper paths and return data', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: [{ id: 1 }] });
    const invites = await api.fetchPartyInvites(4);
    expect(Array.isArray(invites)).toBe(true);

    (apiClient.post as any).mockResolvedValueOnce({ data: { ok: true } });
    await api.postSendPartyInvite(4, { ToEmail: 'x' });
    expect(apiClient.post).toHaveBeenCalled();

    (apiClient.post as any).mockResolvedValueOnce({ data: { accepted: true } });
    const respondResult = await api.postRespondInvite(7, true);
    expect(respondResult).toEqual({ accepted: true });

    (apiClient.post as any).mockResolvedValueOnce({ data: { cancelled: true } });
    const cancelResult = await api.postCancelInvite(7);
    expect(cancelResult).toEqual({ cancelled: true });
  });

  it('fetchSongById returns data and collaborators endpoints work', async () => {
    (apiClient.get as any).mockResolvedValueOnce({ data: { id: 10 } });
    const song = await api.fetchSongById(10);
    expect(song.id).toBe(10);

    (apiClient.get as any).mockResolvedValueOnce({ data: [2,3] });
    const cols = await api.fetchCollaborators(1);
    expect(Array.isArray(cols)).toBe(true);

    (apiClient.post as any).mockResolvedValueOnce({ data: { ok: true } });
    await api.postAddCollaborator(1, { userId: 2 });
    expect(apiClient.post).toHaveBeenCalled();

    (apiClient.delete as any).mockResolvedValueOnce({ data: {} });
    await api.deleteCollaborator(1, 2);
    expect(apiClient.delete).toHaveBeenCalled();

    (apiClient.put as any).mockResolvedValueOnce({ data: {} });
    await api.putUpdateCollaboratorPermission(1, 2, 'edit');
    expect(apiClient.put).toHaveBeenCalled();

    // fetchCollaboratorPermission is a deprecated stub that always returns null
    const perm = await api.fetchCollaboratorPermission(1, 2);
    expect(perm).toBeNull();
  });
});
