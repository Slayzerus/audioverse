import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import * as admin from '../scripts/api/apiAdmin';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const put = apiClient.put as unknown as ReturnType<typeof vi.fn>;
const del = apiClient.delete as unknown as ReturnType<typeof vi.fn>;

describe('apiAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAllLoginAttempts returns data', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await admin.getAllLoginAttempts();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('getLoginAttemptsForUser calls with userId', async () => {
    get.mockResolvedValueOnce({ data: [] });
    await admin.getLoginAttemptsForUser(5);
    expect(get).toHaveBeenCalled();
  });

  it('getRecentFailedLoginAttempts uses default minutes', async () => {
    get.mockResolvedValueOnce({ data: [] });
    await admin.getRecentFailedLoginAttempts();
    expect(get.mock.calls[0][0]).toContain('minutes=15');
  });

  it('changeAdminPassword posts command', async () => {
    post.mockResolvedValueOnce({});
    await admin.changeAdminPassword({ currentPassword: 'a', newPassword: 'b' } as any);
    expect(post).toHaveBeenCalled();
  });

  it('getAllUsers returns array', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await admin.getAllUsers();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('createUser returns id', async () => {
    post.mockResolvedValueOnce({ data: 42 });
    const id = await admin.createUser({} as any);
    expect(id).toBe(42);
  });

  it('updateUserDetails calls put', async () => {
    put.mockResolvedValueOnce({});
    await admin.updateUserDetails(3, {} as any);
    expect(put).toHaveBeenCalled();
  });

  it('deleteUser calls delete', async () => {
    del.mockResolvedValueOnce({});
    await admin.deleteUser(7);
    expect(del).toHaveBeenCalled();
  });

  it('changeUserPassword posts', async () => {
    post.mockResolvedValueOnce({});
    await admin.changeUserPassword(2, {} as any);
    expect(post).toHaveBeenCalled();
  });

  it('blockUser posts', async () => {
    post.mockResolvedValueOnce({});
    await admin.blockUser(2, { blocked: true } as any);
    expect(post).toHaveBeenCalled();
  });

  it('setPasswordValidity posts', async () => {
    post.mockResolvedValueOnce({});
    await admin.setPasswordValidity(2, {} as any);
    expect(post).toHaveBeenCalled();
  });

  it('getPasswordRequirements returns data', async () => {
    get.mockResolvedValueOnce({ data: { minLength: 8 } });
    const res = await admin.getPasswordRequirements();
    expect(res).toEqual({ minLength: 8 });
  });

  it('setPasswordRequirements posts', async () => {
    post.mockResolvedValueOnce({});
    await admin.setPasswordRequirements({ minLength: 10 });
    expect(post).toHaveBeenCalled();
  });

  it('getSystemConfig returns data', async () => {
    get.mockResolvedValueOnce({ data: { sessionTimeoutMinutes: 30 } });
    const res = await admin.getSystemConfig();
    expect(res.sessionTimeoutMinutes).toBe(30);
  });

  it('updateSystemConfig calls put', async () => {
    put.mockResolvedValueOnce({ data: { ok: true } });
    const res = await admin.updateSystemConfig({ sessionTimeoutMinutes: 60 });
    expect(res).toEqual({ ok: true });
  });

  it('getScoringPresets returns data', async () => {
    get.mockResolvedValueOnce({ data: { presets: [] } });
    const res = await admin.getScoringPresets();
    expect(res).toEqual({ presets: [] });
  });

  it('getScoringPresets rethrows on error', async () => {
    get.mockRejectedValueOnce(new Error('fail'));
    await expect(admin.getScoringPresets()).rejects.toThrow('fail');
  });

  it('setScoringPresets posts and returns data', async () => {
    post.mockResolvedValueOnce({ data: { ok: true } });
    const res = await admin.setScoringPresets({ a: 1 });
    expect(res).toEqual({ ok: true });
  });

  it('setScoringPresets rethrows on error', async () => {
    post.mockRejectedValueOnce(new Error('fail'));
    await expect(admin.setScoringPresets({})).rejects.toThrow('fail');
  });

  it('generateOtpForUser returns data', async () => {
    post.mockResolvedValueOnce({ data: { otp: '123456' } });
    const res = await admin.generateOtpForUser(1);
    expect(res.otp).toBe('123456');
  });

  it('getOtpHistory returns data', async () => {
    get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const res = await admin.getOtpHistory();
    expect(res).toEqual([{ id: 1 }]);
  });

  it('createHoneyToken returns data', async () => {
    post.mockResolvedValueOnce({ data: { id: 99 } });
    const res = await admin.createHoneyToken({ name: 'ht' });
    expect(res.id).toBe(99);
  });
});
