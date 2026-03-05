import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/apiUser', () => ({
  default: {
    getProfilePlayers: vi.fn(),
    createProfilePlayer: vi.fn(),
    updateProfilePlayer: vi.fn(),
    deleteProfilePlayer: vi.fn(),
    setProfilePlayerPrimary: vi.fn(),
  },
}));

import apiUser from '../scripts/api/apiUser';
import { ProfilePlayerService } from '../services/ProfilePlayerService';

const mocks = apiUser as unknown as {
  getProfilePlayers: ReturnType<typeof vi.fn>;
  createProfilePlayer: ReturnType<typeof vi.fn>;
  updateProfilePlayer: ReturnType<typeof vi.fn>;
  deleteProfilePlayer: ReturnType<typeof vi.fn>;
  setProfilePlayerPrimary: ReturnType<typeof vi.fn>;
};

describe('ProfilePlayerService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getAll returns players array when response has players property', async () => {
    mocks.getProfilePlayers.mockResolvedValueOnce({ players: [{ id: 1 }] });
    const res = await ProfilePlayerService.getAll(5);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('getAll returns raw response when no players property', async () => {
    mocks.getProfilePlayers.mockResolvedValueOnce([{ id: 2 }]);
    const res = await ProfilePlayerService.getAll(5);
    expect(res).toEqual([{ id: 2 }]);
  });

  it('create delegates to apiUser.createProfilePlayer', async () => {
    mocks.createProfilePlayer.mockResolvedValueOnce({ id: 10, name: 'New' });
    const res = await ProfilePlayerService.create(5, { name: 'New' });
    expect(res).toEqual({ id: 10, name: 'New' });
    expect(mocks.createProfilePlayer).toHaveBeenCalledWith(5, { name: 'New' });
  });

  it('update delegates to apiUser.updateProfilePlayer', async () => {
    mocks.updateProfilePlayer.mockResolvedValueOnce({ id: 10, name: 'Upd' });
    const res = await ProfilePlayerService.update(5, 10, { name: 'Upd' });
    expect(res.name).toBe('Upd');
  });

  it('delete delegates to apiUser.deleteProfilePlayer', async () => {
    mocks.deleteProfilePlayer.mockResolvedValueOnce({});
    await ProfilePlayerService.delete(5, 10);
    expect(mocks.deleteProfilePlayer).toHaveBeenCalledWith(5, 10);
  });

  it('setPrimary delegates to apiUser.setProfilePlayerPrimary', async () => {
    mocks.setProfilePlayerPrimary.mockResolvedValueOnce({ success: true });
    const res = await ProfilePlayerService.setPrimary(5, 10);
    expect(res.success).toBe(true);
  });
});
