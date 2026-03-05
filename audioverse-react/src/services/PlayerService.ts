import apiUser from '../scripts/api/apiUser';

export const PlayerService = {
  // profileId is required for all operations — endpoints live under /api/user/profiles/{profileId}/players
  async getAll(profileId: number) {
    if (!profileId) throw new Error('profileId required');
    const res = await apiUser.getProfilePlayers(profileId);
    return res?.players || res;
  },
  async create(profileId: number, player: { name?: string; color?: string; preferredColors?: string[]; email?: string; icon?: string; photo?: File }) {
    if (!profileId) throw new Error('profileId required');
    const res = await apiUser.createProfilePlayer(profileId, player);
    return res;
  },
  async update(profileId: number, playerId: number, player: { id?: number; name?: string; color?: string; preferredColors?: string[]; email?: string; icon?: string; karaokeSettings?: Record<string, unknown> }) {
    if (!profileId) throw new Error('profileId required');
    if (!playerId) throw new Error('playerId required');
    const res = await apiUser.updateProfilePlayer(profileId, playerId, player);
    return res;
  },
  async uploadPhoto(profileId: number, playerId: number, file: File) {
    if (!profileId) throw new Error('profileId required');
    if (!playerId) throw new Error('playerId required');
    const res = await apiUser.uploadPlayerPhoto(profileId, playerId, file);
    return res;
  },
  getPhotoUrl(playerId: number): string {
    return apiUser.getPlayerPhotoUrl(playerId);
  },
  async delete(profileId: number, playerId: number) {
    if (!profileId) throw new Error('profileId required');
    if (!playerId) throw new Error('playerId required');
    const res = await apiUser.deleteProfilePlayer(profileId, playerId);
    return res;
  },
  async setPrimary(profileId: number, playerId: number) {
    if (!profileId) throw new Error('profileId required');
    if (!playerId) throw new Error('playerId required');
    const res = await apiUser.setProfilePlayerPrimary(profileId, playerId);
    return res;
  },
};
