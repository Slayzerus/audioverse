import apiUser from '../scripts/api/apiUser';

export const ProfilePlayerService = {
  async getAll(profileId: number) {
    const res = await apiUser.getProfilePlayers(profileId);
    return res?.players || res;
  },
  async create(profileId: number, player: { name?: string; color?: string; preferredColors?: string[] }) {
    const res = await apiUser.createProfilePlayer(profileId, player);
    return res;
  },
  async update(profileId: number, playerId: number, player: { id?: number; name?: string; color?: string; preferredColors?: string[]; karaokeSettings?: Record<string, unknown> }) {
    const res = await apiUser.updateProfilePlayer(profileId, playerId, player);
    return res;
  },
  async delete(profileId: number, playerId: number) {
    const res = await apiUser.deleteProfilePlayer(profileId, playerId);
    return res;
  }
  ,
  async setPrimary(profileId: number, playerId: number) {
    const res = await apiUser.setProfilePlayerPrimary(profileId, playerId);
    return res;
  }
};
