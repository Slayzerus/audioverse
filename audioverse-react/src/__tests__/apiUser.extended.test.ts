import { vi, describe, it, expect, beforeEach } from 'vitest';

// Provide a simple in-memory localStorage mock for test environment
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const _store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (k: string) => (_store[k] ?? null),
    setItem: (k: string, v: string) => { _store[k] = String(v); },
    removeItem: (k: string) => { delete _store[k]; },
    clear: () => { for (const k of Object.keys(_store)) delete _store[k]; },
  } as any;
}

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: { headers: { common: {} } },
  },
  apiPath: (m: string, p: string) => `${m}${p.startsWith('/') ? p : '/' + p}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as apiUser from '../scripts/api/apiUser';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as ReturnType<typeof vi.fn>;

describe('apiUser – extended', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  // --- Registration ---
  it('registerUser posts user data', async () => {
    post.mockResolvedValueOnce({ data: { success: true } });
    const res = await apiUser.registerUser({ username: 'u', email: 'e@e.com', password: 'p' });
    expect(res.success).toBe(true);
    expect(post).toHaveBeenCalled();
  });

  // --- Password management ---
  it('firstLoginPasswordChange posts payload', async () => {
    post.mockResolvedValueOnce({ data: { success: true } });
    const res = await apiUser.firstLoginPasswordChange({ userId: 1, newPassword: 'x', currentPassword: 'y' } as any);
    expect(res.success).toBe(true);
  });

  it('changePasswordWithRecaptcha posts payload', async () => {
    post.mockResolvedValueOnce({ data: { success: true } });
    const res = await apiUser.changePasswordWithRecaptcha({ token: 't', newPassword: 'n' } as any);
    expect(res.success).toBe(true);
  });

  it('verifyRecaptcha posts payload', async () => {
    post.mockResolvedValueOnce({ data: { success: true, score: 0.9 } });
    const res = await apiUser.verifyRecaptcha({ token: 'xyz' } as any);
    expect(res.success).toBe(true);
  });

  it('changePassword posts old/new passwords', async () => {
    post.mockResolvedValueOnce({ data: { success: true } });
    const res = await apiUser.changePassword('old', 'new');
    expect(res.success).toBe(true);
    expect(post.mock.calls[0][1]).toEqual({ oldPassword: 'old', newPassword: 'new' });
  });

  // --- Audit ---
  it('getAuditLogsAll returns logs', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1, action: 'login' }] });
    const res = await apiUser.getAuditLogsAll();
    expect(res).toEqual([{ id: 1, action: 'login' }]);
  });

  // --- Profile players ---
  it('getProfilePlayers returns players', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1, name: 'P1' }] });
    const res = await apiUser.getProfilePlayers(5);
    expect(res).toEqual([{ id: 1, name: 'P1' }]);
    expect(get.mock.calls[0][0]).toContain('5');
    expect(get.mock.calls[0][0]).toContain('players');
  });

  it('createProfilePlayer posts and returns player', async () => {
    post.mockResolvedValueOnce({ data: { id: 10, name: 'NewP' } });
    const res = await apiUser.createProfilePlayer(5, { name: 'NewP' });
    expect(res.id).toBe(10);
  });

  it('updateProfilePlayer puts and returns player', async () => {
    put.mockResolvedValueOnce({ data: { id: 10, name: 'Updated' } });
    const res = await apiUser.updateProfilePlayer(5, 10, { name: 'Updated' });
    expect(res.name).toBe('Updated');
  });

  it('deleteProfilePlayer calls delete', async () => {
    del.mockResolvedValueOnce({ data: {} });
    await apiUser.deleteProfilePlayer(5, 10);
    expect(del).toHaveBeenCalled();
    expect(del.mock.calls[0][0]).toContain('10');
  });

  it('setProfilePlayerPrimary posts', async () => {
    post.mockResolvedValueOnce({ data: { success: true } });
    const res = await apiUser.setProfilePlayerPrimary(5, 10);
    expect(res.success).toBe(true);
    expect(post.mock.calls[0][0]).toContain('set-primary');
  });

  // --- Microphone CRUD (update & delete) ---
  it('updateMicrophone puts data', async () => {
    put.mockResolvedValueOnce({ data: { id: 3, volume: 80 } });
    const res = await apiUser.updateMicrophone(3, { volume: 80 } as any);
    expect(res.id).toBe(3);
  });

  it('deleteMicrophone calls delete', async () => {
    del.mockResolvedValueOnce({ data: {} });
    await apiUser.deleteMicrophone(3);
    expect(del).toHaveBeenCalled();
  });

  // --- Token from storage ---
  it('initTokensFromStorage picks up stored access token and removes old refresh token', () => {
    localStorage.setItem('audioverse_access_token', 'at');
    localStorage.setItem('audioverse_refresh_token', 'rt');
    apiUser.initTokensFromStorage();
    expect(apiUser.getAccessToken()).toBe('at');
    // refresh token is httpOnly cookie now — old value should be cleaned up
    expect(localStorage.getItem('audioverse_refresh_token')).toBeNull();
  });

  // --- Enums & types ---
  it('DeviceType and PitchDetectionMethod enums', () => {
    expect(apiUser.DeviceType.Microphone).toBe(1);
    expect(apiUser.DeviceType.Gamepad).toBe(2);
    expect(apiUser.PitchDetectionMethod.Crepe).toBe(1);
  });
});
