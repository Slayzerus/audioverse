// apiKaraoke.ts
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

import {
    KaraokeParty,
    KaraokePlayer,
    KaraokePartyRound,
    KaraokeSinging,
    KaraokeSong,
    KaraokeSongFile,
    CreatePartyRequest,
} from "../../models/modelsKaraoke";

// === Baza ścieżek (jak w apiDmx) ===
export const KARAOKE_BASE = "/api/karaoke";

// === Typy pomocnicze ===
export type SongFilters = {
    title?: string;
    artist?: string;
    genre?: string;
    language?: string;
    year?: number;
};

export interface UltrastarFileData {
    fileName: string;
    data: string;
}

// === Query Keys ===
export const KARAOKE_QK = {
    parties: ["karaoke", "parties"] as const,
    party: (id: number) => ["karaoke", "party", id] as const,
    players: ["karaoke", "players"] as const,
    songs: (filters: SongFilters = {}) => ["karaoke", "songs", filters] as const,
    song: (id: number) => ["karaoke", "song", id] as const,
};

// === Low-level API (fetchers) ===
export const fetchParties = async (): Promise<KaraokeParty[]> => {
    const { data } = await apiClient.get<KaraokeParty[]>(
        apiPath(KARAOKE_BASE, "/get-all-parties")
    );
    return Array.isArray(data) ? data : [];
};

export const fetchPartyById = async (id: number): Promise<KaraokeParty> => {
    const { data } = await apiClient.get<KaraokeParty>(
        apiPath(KARAOKE_BASE, `/get-party/${id}`)
    );
    return data;
};

export const postCreateParty = async (
    party: CreatePartyRequest
): Promise<KaraokeParty> => {
    const { data } = await apiClient.post<KaraokeParty>(
        apiPath(KARAOKE_BASE, "/create-party"),
        party
    );
    return data;
};

export const fetchPlayers = async (): Promise<KaraokePlayer[]> => {
    const { data } = await apiClient.get<KaraokePlayer[]>(
        apiPath(KARAOKE_BASE, "/get-all-players")
    );
    return data ?? [];
};

export const postCreatePlayer = async (
    player: KaraokePlayer
): Promise<KaraokePlayer> => {
    const { data } = await apiClient.post<KaraokePlayer>(
        apiPath(KARAOKE_BASE, "/create-player"),
        player
    );
    return data;
};

export const postAssignPlayerToParty = async (assignment: {
    partyId: number;
    playerId: number;
}): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, "/assign-player-to-party"), assignment);
};

export const postAddRound = async (
    round: KaraokePartyRound
): Promise<KaraokePartyRound> => {
    const { data } = await apiClient.post<KaraokePartyRound>(
        apiPath(KARAOKE_BASE, "/add-round"),
        round
    );
    return data;
};

export const postAddSongToRound = async (
    singing: KaraokeSinging
): Promise<KaraokeSinging> => {
    const { data } = await apiClient.post<KaraokeSinging>(
        apiPath(KARAOKE_BASE, "/add-song-to-round"),
        singing
    );
    return data;
};

export const fetchSongs = async (
    filters: SongFilters = {}
): Promise<KaraokeSong[]> => {
    const { data } = await apiClient.get<KaraokeSong[]>(
        apiPath(KARAOKE_BASE, "/filter-songs"),
        { params: filters }
    );
    return data ?? [];
};

export const fetchSongById = async (id: number): Promise<KaraokeSong> => {
    const { data } = await apiClient.get<KaraokeSong>(
        apiPath(KARAOKE_BASE, `/get-song/${id}`)
    );
    return data;
};

export const postSaveResults = async (results: KaraokeSinging[]): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, "/save-results"), results);
};

export const postScanFolder = async (
    folderPath: string
): Promise<KaraokeSong[]> => {
    const { data } = await apiClient.post<KaraokeSong[]>(
        apiPath(KARAOKE_BASE, "/scan-folder"),
        { folderPath }
    );
    return data ?? [];
};

export const postParseUltrastar = async (
    fileData: UltrastarFileData
): Promise<KaraokeSongFile> => {
    const { data } = await apiClient.post<KaraokeSongFile>(
        apiPath(KARAOKE_BASE, "/parse-ultrastar"),
        fileData,
        { headers: { "Content-Type": "application/json" } }
    );
    return data;
};

// === React Query: Queries ===
export const usePartiesQuery = (
    options?: Partial<UseQueryOptions<KaraokeParty[], unknown, KaraokeParty[], QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.parties,
        queryFn: fetchParties,
        staleTime: 60_000,
        ...options,
    });

export const usePartyQuery = (
    id: number,
    options?: Partial<UseQueryOptions<KaraokeParty, unknown, KaraokeParty, QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.party(id),
        queryFn: () => fetchPartyById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

export const usePlayersQuery = () =>
    useQuery({
        queryKey: KARAOKE_QK.players,
        queryFn: fetchPlayers,
        staleTime: 5 * 60_000,
    });

export const useSongsQuery = (
    filters: SongFilters = {},
    options?: Partial<UseQueryOptions<KaraokeSong[], unknown, KaraokeSong[], QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.songs(filters),
        queryFn: () => fetchSongs(filters),
        // v5: placeholder zamiast keepPreviousData
        placeholderData: (prev) => prev ?? [],
        staleTime: 60_000,
        ...options,
    });

export const useSongQuery = (
    id: number,
    options?: Partial<UseQueryOptions<KaraokeSong, unknown, KaraokeSong, QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.song(id),
        queryFn: () => fetchSongById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

// === React Query: Mutations ===
export const useCreatePartyMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeParty, unknown, CreatePartyRequest>({
        mutationFn: (party) => postCreateParty(party),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if (created?.id != null) {
                qc.setQueryData(KARAOKE_QK.party(created.id), created);
            }
        },
    });
};

export const useCreatePlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokePlayer, unknown, KaraokePlayer>({
        mutationFn: (player) => postCreatePlayer(player),
        onSuccess: () => qc.invalidateQueries({ queryKey: KARAOKE_QK.players }),
    });
};

export const useAssignPlayerToPartyMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { partyId: number; playerId: number }>({
        mutationFn: (assignment) => postAssignPlayerToParty(assignment),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if (vars?.partyId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.party(vars.partyId) });
            }
        },
    });
};

export const useAddRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokePartyRound, unknown, KaraokePartyRound>({
        mutationFn: (round) => postAddRound(round),
        onSuccess: (_created, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if ((vars as any)?.partyId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.party((vars as any).partyId) });
            }
        },
    });
};

export const useAddSongToRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSinging, unknown, KaraokeSinging>({
        mutationFn: (singing) => postAddSongToRound(singing),
        onSuccess: () => {
            // Brak pewnego partyId w payloadzie — odśwież globalnie listę imprez
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
        },
    });
};

export const useSaveResultsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, KaraokeSinging[]>({
        mutationFn: (results) => postSaveResults(results),
        onSuccess: () => qc.invalidateQueries({ queryKey: KARAOKE_QK.parties }),
    });
};

export const useScanFolderMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSong[], unknown, string>({
        mutationFn: (folderPath) => postScanFolder(folderPath),
        onSuccess: () => qc.invalidateQueries({ queryKey: KARAOKE_QK.songs({}) }),
    });
};

export const useParseUltrastarMutation = () =>
    useMutation<KaraokeSongFile, unknown, UltrastarFileData>({
        mutationFn: (file) => postParseUltrastar(file),
    });

// === Re-eksporty kompatybilności (stare nazwy) ===
export {
    fetchParties as getAllParties,
    fetchPartyById as getPartyById,
    postCreateParty as createParty,
    fetchPlayers as getAllPlayers,
    postCreatePlayer as createPlayer,
    postAssignPlayerToParty as assignPlayerToParty,
    postAddRound as addRound,
    postAddSongToRound as addSongToRound,
    fetchSongs as getSongs,
    fetchSongs as filterSongs,
    fetchSongById as getSongById,
    postSaveResults as saveResults,
    postScanFolder as scanFolder,
    postParseUltrastar as parseUltrastar,
};

// (opcjonalnie) default export zgodny ze „starą” strukturą:
export default {
    getAllParties: fetchParties,
    getPartyById: fetchPartyById,
    createParty: postCreateParty,
    getAllPlayers: fetchPlayers,
    createPlayer: postCreatePlayer,
    assignPlayerToParty: postAssignPlayerToParty,
    addRound: postAddRound,
    addSongToRound: postAddSongToRound,
    filterSongs: fetchSongs,
    saveResults: postSaveResults,
    scanFolder: postScanFolder,
    getSongs: fetchSongs,
    getSongById: fetchSongById,
    parseUltrastar: postParseUltrastar,
};
