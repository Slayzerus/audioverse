// karaoke/index.ts — Barrel re-export for apiKaraoke modules
export * from './apiKaraokeBase';
export * from './apiKaraokeSessions';
export * from './apiKaraokeRounds';
export * from './apiKaraokeSongs';
export * from './apiKaraokePlayers';
export * from './apiCampaigns';

// === Re-exports (backward compatibility aliases) ===
export {
    fetchParties as getAllParties,
    fetchPartyById as getPartyById,
    fetchPartyStatus as getPartyStatus,
    postCreateParty as createParty,
    putUpdateParty as updateParty,
} from './apiKaraokeSessions';

export {
    postAddRound as addRound,
    postAddSongToRound as addSongToRound,
} from './apiKaraokeRounds';

export {
    postSaveResults as saveResults,
    postUploadRecording as uploadRecording,
} from './apiKaraokeRounds';

export {
    fetchSongs as getSongs,
    fetchSongById as getSongById,
    postScanFolder as scanFolder,
    postParseUltrastar as parseUltrastar,
} from './apiKaraokeSongs';

export {
    fetchPlayers as getAllPlayers,
    postCreatePlayer as createPlayer,
    postAssignPlayerToParty as assignPlayerToParty,
} from './apiKaraokePlayers';

// Default export (backward-compatible):
import { fetchParties, fetchPartyById, fetchPartyStatus, postCreateParty, deleteParty, postJoinParty } from './apiKaraokeSessions';
import { postAddRound, postAddSongToRound } from './apiKaraokeRounds';
import { fetchSongs, fetchSongById, postScanFolder, postParseUltrastar, fetchRanking, fetchUserHistory, fetchActivity } from './apiKaraokeSongs';
import { postSaveResults } from './apiKaraokeRounds';
import { fetchPlayers } from './apiKaraokePlayers';

export default {
    getAllParties: fetchParties,
    getPartyById: fetchPartyById,
    getPartyStatus: fetchPartyStatus,
    createParty: postCreateParty,
    getAllPlayers: fetchPlayers,
    deleteParty,
    addRound: postAddRound,
    addSongToRound: postAddSongToRound,
    filterSongs: fetchSongs,
    saveResults: postSaveResults,
    scanFolder: postScanFolder,
    getSongs: fetchSongs,
    getSongById: fetchSongById,
    parseUltrastar: postParseUltrastar,
    joinParty: postJoinParty,
    fetchRanking,
    fetchUserHistory,
    fetchActivity,
};
