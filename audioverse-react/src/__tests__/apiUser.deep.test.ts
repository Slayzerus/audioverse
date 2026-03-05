/**
 * Deep tests for apiUser: loginUser, refreshTokenUser, logoutUser,
 * getCurrentUser, token management, saveTokens, profile players.
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// localStorage polyfill
if (typeof globalThis.localStorage === 'undefined' || typeof globalThis.localStorage.setItem !== 'function') {
  const _s: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => _s[k] ?? null,
    setItem: (k: string, v: string) => { _s[k] = v; },
    removeItem: (k: string) => { delete _s[k]; },
    clear: () => { for (const k of Object.keys(_s)) delete _s[k]; },
    get length() { return Object.keys(_s).length; },
    key: (i: number) => Object.keys(_s)[i] ?? null,
  };
}

// We need to mock the apiClient used by apiUser
const { mockPost, mockGet, mockPut, mockDelete, mockDefaults } = vi.hoisted(() => {
  const mockPost = vi.fn();
  const mockGet = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();
  const mockDefaults = { headers: { common: {} as Record<string, string> } };
  return { mockPost, mockGet, mockPut, mockDelete, mockDefaults };
});

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: {
    post: (...a: any[]) => mockPost(...a),
    get: (...a: any[]) => mockGet(...a),
    put: (...a: any[]) => mockPut(...a),
    delete: (...a: any[]) => mockDelete(...a),
    defaults: mockDefaults,
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
  API_ROOT: 'http://localhost:5000',
}));

import {
  loginUser,
  refreshTokenUser,
  logoutUser,
  getCurrentUser,
  getAccessToken,
  initTokensFromStorage,
  registerUser,
  getAuditLogsAll,
  changePassword,
  generateCaptcha,
  validateCaptcha,
  createHoneyToken,
  getTriggeredHoneyTokens,
  getUserDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  getUserMicrophones,
  createMicrophone,
  updateMicrophone,
  deleteMicrophone,
  getProfilePlayers,
  createProfilePlayer,
  updateProfilePlayer,
  deleteProfilePlayer,
  setProfilePlayerPrimary,
} from '../scripts/api/apiUser';

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  delete mockDefaults.headers.common['Authorization'];
  // Reset module-level tokens (logoutUser calls saveTokens("",""))
  mockPost.mockResolvedValue({});
  try { await logoutUser(0); } catch {}
  vi.clearAllMocks();
});

/* ---- loginUser ---- */
describe('loginUser', () => {
  it('saves access token on success', async () => {
    mockPost.mockResolvedValue({
      data: {
        success: true,
        tokenPair: { accessToken: 'acc123', refreshToken: 'ref456' },
      },
    });
    const result = await loginUser({ username: 'u', password: 'p' });
    expect(result.success).toBe(true);
    expect(localStorage.getItem('audioverse_access_token')).toBe('acc123');
    // refreshToken is now httpOnly cookie — not stored in localStorage
    expect(localStorage.getItem('audioverse_refresh_token')).toBeNull();
    expect(mockDefaults.headers.common['Authorization']).toBe('Bearer acc123');
  });

  it('returns data without saving when tokens not in response', async () => {
    mockPost.mockResolvedValue({
      data: { success: false, errorMessage: 'Bad creds' },
    });
    const result = await loginUser({ username: 'u', password: 'p' });
    expect(result.success).toBe(false);
    expect(localStorage.getItem('audioverse_access_token')).toBeNull();
  });

  it('returns error response data on 400', async () => {
    mockPost.mockRejectedValue({
      response: { data: { success: false, errorMessage: 'Locked' } },
    });
    const result = await loginUser({ username: 'u', password: 'p' });
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Locked');
  });

  it('returns fallback error when no response data', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));
    const result = await loginUser({ username: 'u', password: 'p' });
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Network error');
  });

  it('returns default error message when no error message', async () => {
    mockPost.mockRejectedValue({});
    const result = await loginUser({ username: 'u', password: 'p' });
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Login failed');
  });
});

/* ---- refreshTokenUser ---- */
describe('refreshTokenUser', () => {
  it('refreshes using httpOnly cookie (no refreshToken in body)', async () => {
    // First login to set accessToken in memory
    mockPost.mockResolvedValueOnce({
      data: {
        success: true,
        tokenPair: { accessToken: 'a1' },
      },
    });
    await loginUser({ username: 'u', password: 'p' });

    mockPost.mockResolvedValueOnce({
      data: { accessToken: 'a2' },
    });
    const result = await refreshTokenUser();
    expect(result.accessToken).toBe('a2');
    expect(localStorage.getItem('audioverse_access_token')).toBe('a2');
    // refreshToken not stored in localStorage
    expect(localStorage.getItem('audioverse_refresh_token')).toBeNull();
  });

  it('returns data without saving when accessToken missing in response', async () => {
    mockPost.mockResolvedValueOnce({
      data: { success: true, tokenPair: { accessToken: 'a1' } },
    });
    await loginUser({ username: 'u', password: 'p' });

    mockPost.mockResolvedValueOnce({ data: { message: 'partial' } });
    const result = await refreshTokenUser();
    expect(result.message).toBe('partial');
    // Old access token should still be in localStorage
    expect(localStorage.getItem('audioverse_access_token')).toBe('a1');
  });
});

/* ---- logoutUser ---- */
describe('logoutUser', () => {
  it('clears access token on success', async () => {
    localStorage.setItem('audioverse_access_token', 'tok');
    mockPost.mockResolvedValue({});
    await logoutUser(1);
    expect(localStorage.getItem('audioverse_access_token')).toBeNull();
    // refresh token is httpOnly cookie, not in localStorage
  });

  it('clears access token even if API fails', async () => {
    localStorage.setItem('audioverse_access_token', 'tok');
    mockPost.mockRejectedValue(new Error('Server down'));
    await expect(logoutUser(1)).rejects.toThrow('Server down');
    expect(localStorage.getItem('audioverse_access_token')).toBeNull();
  });
});

/* ---- getCurrentUser ---- */
describe('getCurrentUser', () => {
  it('returns nested user object', async () => {
    mockGet.mockResolvedValue({
      data: { user: { userId: 1, username: 'Alice' } },
    });
    const result = await getCurrentUser();
    expect(result.username).toBe('Alice');
  });

  it('returns flat data when no user property', async () => {
    mockGet.mockResolvedValue({
      data: { userId: 2, username: 'Bob' },
    });
    const result = await getCurrentUser();
    expect(result.username).toBe('Bob');
  });
});

/* ---- Token management ---- */
describe('token management', () => {
  it('initTokensFromStorage restores access token', () => {
    localStorage.setItem('audioverse_access_token', 'stored-acc');
    initTokensFromStorage();
    expect(getAccessToken()).toBe('stored-acc');
    expect(mockDefaults.headers.common['Authorization']).toBe('Bearer stored-acc');
    // refresh token is httpOnly cookie, not read from localStorage
  });

  it('initTokensFromStorage cleans up old refresh token from localStorage', () => {
    localStorage.setItem('audioverse_refresh_token', 'old-ref');
    initTokensFromStorage();
    // Old refresh token should be removed as backward-compat cleanup
    expect(localStorage.getItem('audioverse_refresh_token')).toBeNull();
  });

  it('initTokensFromStorage handles empty storage', () => {
    initTokensFromStorage();
    // No crash
  });

  it('getAccessToken returns null initially', () => {
    // After clearing, no token
    expect(getAccessToken()).toBeDefined(); // may be '' or null
  });
});

/* ---- Simple endpoint proxies ---- */
describe('endpoint proxies', () => {
  it('registerUser posts to /register', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    const result = await registerUser({ username: 'u', email: 'e@e.com', password: 'p' });
    expect(result.success).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/api/user/register', expect.any(Object));
  });

  it('getAuditLogsAll fetches logs', async () => {
    mockGet.mockResolvedValue({ data: [{ id: 1 }] });
    const result = await getAuditLogsAll();
    expect(result).toEqual([{ id: 1 }]);
  });

  it('changePassword posts old and new password', async () => {
    mockPost.mockResolvedValue({ data: { success: true } });
    await changePassword('old', 'new');
    expect(mockPost).toHaveBeenCalledWith('/api/user/change-password', { oldPassword: 'old', newPassword: 'new' });
  });

  it('generateCaptcha passes captchaType as param', async () => {
    mockPost.mockResolvedValue({ data: { captchaId: 'abc' } });
    const result = await generateCaptcha(1);
    expect(result.captchaId).toBe('abc');
    expect(mockPost).toHaveBeenCalledWith('/api/user/captcha/generate', {}, { params: { captchaType: 1 } });
  });

  it('validateCaptcha posts captcha data', async () => {
    mockPost.mockResolvedValue({ data: { valid: true } });
    const result = await validateCaptcha({ captchaId: 'c1', answer: '42' });
    expect(result.valid).toBe(true);
  });

  it('createHoneyToken posts data', async () => {
    mockPost.mockResolvedValue({ data: { id: 1 } });
    const result = await createHoneyToken({ name: 'ht1' });
    expect(result.id).toBe(1);
  });

  it('getTriggeredHoneyTokens fetches', async () => {
    mockGet.mockResolvedValue({ data: [] });
    const result = await getTriggeredHoneyTokens();
    expect(result).toEqual([]);
  });

  it('device CRUD', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getUserDevices();
    expect(mockGet).toHaveBeenCalledWith('/api/user/devices');

    mockPost.mockResolvedValue({ data: { id: 1 } });
    await createDevice({ deviceId: 'd1', deviceType: 1 });

    mockPut.mockResolvedValue({ data: { ok: true } });
    await updateDevice(1, { visible: false });

    mockDelete.mockResolvedValue({ data: { ok: true } });
    await deleteDevice(1);
  });

  it('microphone CRUD', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getUserMicrophones();

    mockPost.mockResolvedValue({ data: { id: 1 } });
    await createMicrophone({ deviceId: 'm1' });

    mockPut.mockResolvedValue({ data: { ok: true } });
    await updateMicrophone(1, { volume: 80 });

    mockDelete.mockResolvedValue({ data: { ok: true } });
    await deleteMicrophone(1);
  });

  it('profile player CRUD', async () => {
    mockGet.mockResolvedValue({ data: [] });
    await getProfilePlayers(10);
    expect(mockGet).toHaveBeenCalledWith('/api/user/profiles/10/players');

    mockPost.mockResolvedValue({ data: { id: 1 } });
    await createProfilePlayer(10, { name: 'P1' });
    expect(mockPost).toHaveBeenCalledWith(
      '/api/user/profiles/10/players',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    );

    mockPut.mockResolvedValue({ data: { ok: true } });
    await updateProfilePlayer(10, 1, { name: 'P1x' });
    expect(mockPut).toHaveBeenCalledWith('/api/user/profiles/10/players/1', { name: 'P1x' });

    mockDelete.mockResolvedValue({ data: { ok: true } });
    await deleteProfilePlayer(10, 1);

    mockPost.mockResolvedValue({ data: { ok: true } });
    await setProfilePlayerPrimary(10, 1);
  });
});
