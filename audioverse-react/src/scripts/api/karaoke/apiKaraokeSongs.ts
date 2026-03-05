// apiKaraokeSongs.ts — Songs, Playlists, Collaborators, Versions, Filtering, Cover, Stats, Admin, YouTube, Channel move
import { logger } from '../../../utils/logger';
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "../audioverseApiClient";
import { KARAOKE_BASE, KARAOKE_QK, SongFilters, UltrastarFileData, TopSinging, DynamicFilterRequest, PagedResult } from "./apiKaraokeBase";
import type {
    KaraokeSong,
    KaraokeSongFile,
    KaraokePlaylist,
    SongFilterRequest,
    MoveRequest,
    KaraokeRankingEntry,
    KaraokeHistoryEntry,
    KaraokeActivityEntry,
} from "../../../models/modelsKaraoke";

const log = logger.scoped('KaraokeSongs');

// ══════════════════════════════════════════════════════════════
// === Songs CRUD ===
// ══════════════════════════════════════════════════════════════

export const fetchSongs = async (
    filters: SongFilters = {}
): Promise<KaraokeSong[]> => {
    const { data } = await apiClient.get<KaraokeSong[]>(
        apiPath(KARAOKE_BASE, "/filter-songs"),
        { params: filters }
    );
    return data ?? [];
};

export const fetchSongById = async (id: number): Promise<KaraokeSongFile> => {
    const { data } = await apiClient.get<KaraokeSongFile>(
        apiPath(KARAOKE_BASE, `/get-song/${id}`)
    );
    return data;
};

/** GET /api/karaoke/songs — Get all songs (excludes InDevelopment by default) */
export const fetchAllSongs = async (): Promise<KaraokeSongFile[]> => {
    const { data } = await apiClient.get<KaraokeSongFile[]>(apiPath(KARAOKE_BASE, `/songs`));
    return Array.isArray(data) ? data : [];
};

/** GET /api/karaoke/songs/all — Get ALL songs including InDevelopment (admin/debug) */
export const fetchAllSongsIncludingDev = async (): Promise<KaraokeSongFile[]> => {
    const { data } = await apiClient.get<KaraokeSongFile[]>(apiPath(KARAOKE_BASE, `/songs/all`));
    return Array.isArray(data) ? data : [];
};

// === Song create / update ===
/**
 * @deprecated POST /api/karaoke/songs not in swagger. Use scan-folder or parse-ultrastar instead.
 */
export const postCreateSong = async (_payload: Partial<KaraokeSongFile>): Promise<KaraokeSongFile> => {
    log.warn('[apiKaraoke] postCreateSong: POST /api/karaoke/songs removed from swagger.');
    throw new Error('Endpoint removed: POST /api/karaoke/songs');
};

/**
 * @deprecated PUT /api/karaoke/songs/{songId} not in swagger.
 */
export const putUpdateSong = async (_songId: number, _payload: Partial<KaraokeSongFile>): Promise<KaraokeSongFile> => {
    log.warn('[apiKaraoke] putUpdateSong: PUT /api/karaoke/songs/{id} removed from swagger.');
    throw new Error('Endpoint removed: PUT /api/karaoke/songs/{id}');
};

// === Song flags (admin) ===

/** POST /api/karaoke/songs/{songId}/set-verified */
export const postSetSongVerified = async (songId: number, isVerified: boolean): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/songs/${songId}/set-verified`), isVerified, {
        headers: { 'Content-Type': 'application/json' },
    });
};

/** POST /api/karaoke/songs/{songId}/set-development */
export const postSetSongDevelopment = async (songId: number, inDevelopment: boolean): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/songs/${songId}/set-development`), inDevelopment, {
        headers: { 'Content-Type': 'application/json' },
    });
};

/** POST /api/karaoke/songs/set-verified-bulk — Bulk set IsVerified for multiple songs */
export const postSetVerifiedBulk = async (songIds: number[], isVerified = true): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/songs/set-verified-bulk`), songIds, { params: { isVerified } });
};

/** POST /api/karaoke/songs/set-development-bulk — Bulk set InDevelopment for multiple songs */
export const postSetDevelopmentBulk = async (songIds: number[], inDevelopment = true): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/songs/set-development-bulk`), songIds, { params: { inDevelopment } });
};

// === Filtered songs (advanced) ===

/** POST /api/karaoke/get-filtered-songs — multi-select filter, ranges, pagination */
export const fetchFilteredSongs = async (request: SongFilterRequest): Promise<PagedResult<KaraokeSongFile>> => {
    const { data } = await apiClient.post<PagedResult<KaraokeSongFile>>(apiPath(KARAOKE_BASE, `/get-filtered-songs`), request);
    return data ?? { Items: [], TotalCount: 0 };
};

/** POST /api/karaoke/filtered/{entityName} — generic dynamic-filter endpoint */
export const fetchFilteredEntities = async <T = unknown>(entityName: string, request: DynamicFilterRequest): Promise<PagedResult<T>> => {
    const { data } = await apiClient.post<PagedResult<T>>(apiPath(KARAOKE_BASE, `/filtered/${entityName}`), request);
    return data ?? { Items: [], TotalCount: 0 } as PagedResult<T>;
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

export const fetchTopSingings = async (songId: number): Promise<TopSinging[]> => {
    const { data } = await apiClient.get<TopSinging[]>(
        apiPath(KARAOKE_BASE, `/songs/${songId}/top-singings`)
    );
    return data ?? [];
};

// === Cover image ===

/** GET /api/karaoke/cover?filePath=... */
export const fetchCoverImage = async (filePath: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(KARAOKE_BASE, `/cover`), { params: { filePath } });
    return data;
};

// ══════════════════════════════════════════════════════════════
// === Collaborators API ===
// ══════════════════════════════════════════════════════════════

export const fetchUserSearch = async (term: string): Promise<Array<{ Id: number; UserName: string; Email: string }>> => {
    if (!term || term.trim().length < 3) return [];
    const { data } = await apiClient.get<Array<{ Id: number; UserName: string; Email: string }>>(
        apiPath(KARAOKE_BASE, `/users/search`),
        { params: { term } }
    );
    return data ?? [];
};

export const fetchCollaborators = async (songId: number): Promise<number[]> => {
    const { data } = await apiClient.get<number[]>(
        apiPath(KARAOKE_BASE, `/songs/${songId}/collaborators`)
    );
    return Array.isArray(data) ? data : [];
};

export const postAddCollaborator = async (songId: number, payload: { userId: number; permission?: string | number }): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(KARAOKE_BASE, `/songs/${songId}/collaborators`), payload);
    return data;
};

export const deleteCollaborator = async (songId: number, userId: number): Promise<unknown> => {
    const { data } = await apiClient.delete(apiPath(KARAOKE_BASE, `/songs/${songId}/collaborators/${userId}`));
    return data;
};

export const putUpdateCollaboratorPermission = async (songId: number, userId: number, permission: string | number): Promise<unknown> => {
    const { data } = await apiClient.put(apiPath(KARAOKE_BASE, `/songs/${songId}/collaborators/${userId}`), permission);
    return data;
};

/**
 * @deprecated GET /api/karaoke/songs/{songId}/collaborators/{userId}/permission not in swagger.
 */
export const fetchCollaboratorPermission = async (_songId: number, _userId: number): Promise<string | number | null> => {
    log.warn('[apiKaraoke] fetchCollaboratorPermission: endpoint removed from swagger.');
    return null;
};

// ══════════════════════════════════════════════════════════════
// === Version history API ===
// ══════════════════════════════════════════════════════════════

export interface SongVersionMeta { Version: number; ChangedAt: string; ChangedByUserId: number; Reason?: string }

export const fetchSongVersions = async (songId: number): Promise<SongVersionMeta[]> => {
    const { data } = await apiClient.get<SongVersionMeta[]>(apiPath(KARAOKE_BASE, `/songs/${songId}/versions`));
    return Array.isArray(data) ? data : [];
};

export const fetchSongVersion = async (songId: number, version: number): Promise<KaraokeSongFile> => {
    const { data } = await apiClient.get<KaraokeSongFile>(apiPath(KARAOKE_BASE, `/songs/${songId}/versions/${version}`));
    return data;
};

export const postRevertSongVersion = async (songId: number, version: number, reason?: string): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(KARAOKE_BASE, `/songs/${songId}/versions/${version}/revert`), reason ?? null);
    return data;
};

// ══════════════════════════════════════════════════════════════
// === Playlist ===
// ══════════════════════════════════════════════════════════════

/** GET /api/karaoke/playlist/{id} */
export const fetchPlaylistById = async (playlistId: number): Promise<KaraokePlaylist> => {
    const { data } = await apiClient.get<KaraokePlaylist>(apiPath(KARAOKE_BASE, `/playlist/${playlistId}`));
    return data;
};

/**
 * @deprecated GET /api/karaoke/playlists/mine not in swagger.
 */
export const fetchMyPlaylists = async (): Promise<KaraokePlaylist[]> => {
    log.warn('[apiKaraoke] fetchMyPlaylists: /playlists/mine removed from swagger.');
    return [];
};

/**
 * @deprecated GET /api/karaoke/playlists/public not in swagger.
 */
export const fetchOnlinePlaylists = async (): Promise<KaraokePlaylist[]> => {
    log.warn('[apiKaraoke] fetchOnlinePlaylists: /playlists/public removed from swagger.');
    return [];
};

/**
 * @deprecated POST /api/karaoke/playlists not in swagger.
 */
export const createKaraokePlaylist = async (_name: string, _songIds: number[] = []): Promise<KaraokePlaylist> => {
    log.warn('[apiKaraoke] createKaraokePlaylist: /playlists removed from swagger.');
    throw new Error('Endpoint removed: POST /api/karaoke/playlists');
};

/** @deprecated DELETE /api/karaoke/playlists/{id} not in swagger. */
export const deleteKaraokePlaylist = async (_playlistId: number): Promise<void> => {
    log.warn('[apiKaraoke] deleteKaraokePlaylist: /playlists/{id} removed from swagger.');
};

/** @deprecated POST /api/karaoke/playlists/{id}/songs/{songId} not in swagger. */
export const addSongToPlaylist = async (_playlistId: number, _songId: number): Promise<void> => {
    log.warn('[apiKaraoke] addSongToPlaylist: /playlists/{id}/songs/{songId} removed from swagger.');
};

/** @deprecated DELETE /api/karaoke/playlists/{id}/songs/{songId} not in swagger. */
export const removeSongFromPlaylist = async (_playlistId: number, _songId: number): Promise<void> => {
    log.warn('[apiKaraoke] removeSongFromPlaylist: /playlists/{id}/songs/{songId} removed from swagger.');
};

/** @deprecated PUT /api/karaoke/playlists/{id} not in swagger. */
export const updateKaraokePlaylist = async (_playlistId: number, _patch: { name?: string; isPublic?: boolean }): Promise<void> => {
    log.warn('[apiKaraoke] updateKaraokePlaylist: /playlists/{id} removed from swagger.');
};

/** @deprecated POST /api/karaoke/playlists/{id}/publish not in swagger. */
export const publishPlaylist = async (_playlistId: number): Promise<void> => {
    log.warn('[apiKaraoke] publishPlaylist: /playlists/{id}/publish removed from swagger.');
};

/** @deprecated POST /api/karaoke/playlists/{id}/unpublish not in swagger. */
export const unpublishPlaylist = async (_playlistId: number): Promise<void> => {
    log.warn('[apiKaraoke] unpublishPlaylist: /playlists/{id}/unpublish removed from swagger.');
};

/** @deprecated POST /api/karaoke/playlists/{id}/duplicate not in swagger. */
export const duplicatePlaylist = async (_playlistId: number): Promise<KaraokePlaylist> => {
    log.warn('[apiKaraoke] duplicatePlaylist: /playlists/{id}/duplicate removed from swagger.');
    throw new Error('Endpoint removed: POST /api/karaoke/playlists/{id}/duplicate');
};

/** @deprecated PUT /api/karaoke/playlists/{id}/songs/reorder not in swagger. */
export const reorderPlaylistSongs = async (_playlistId: number, _songIds: number[]): Promise<void> => {
    log.warn('[apiKaraoke] reorderPlaylistSongs: /playlists/{id}/songs/reorder removed from swagger.');
};

// ══════════════════════════════════════════════════════════════
// === Stats / ranking ===
// ══════════════════════════════════════════════════════════════

/** GET /api/karaoke/stats/ranking — global ranking (top N by total score) */
export const fetchRanking = async (top = 20): Promise<KaraokeRankingEntry[]> => {
    const { data } = await apiClient.get<{ ranking?: KaraokeRankingEntry[] } | KaraokeRankingEntry[]>(apiPath(KARAOKE_BASE, `/stats/ranking`), { params: { top } });
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.ranking) ? data.ranking : [];
};

/** GET /api/karaoke/stats/history/{userId} — singing history for a user */
export const fetchUserHistory = async (userId: number, take = 20): Promise<KaraokeHistoryEntry[]> => {
    const { data } = await apiClient.get<{ history?: KaraokeHistoryEntry[] } | KaraokeHistoryEntry[]>(apiPath(KARAOKE_BASE, `/stats/history/${userId}`), { params: { take } });
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.history) ? data.history : [];
};

/** GET /api/karaoke/stats/activity — songs-per-day, score-per-day */
export const fetchActivity = async (days = 30): Promise<KaraokeActivityEntry[]> => {
    const { data } = await apiClient.get<{ activity?: KaraokeActivityEntry[] } | KaraokeActivityEntry[]>(apiPath(KARAOKE_BASE, `/stats/activity`), { params: { days } });
    if (Array.isArray(data)) return data;
    return Array.isArray(data?.activity) ? data.activity : [];
};

// ══════════════════════════════════════════════════════════════
// === Admin endpoints ===
// ══════════════════════════════════════════════════════════════

/** GET /api/karaoke/admin/metrics/upload-failures */
export const fetchAdminUploadFailures = async (): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(KARAOKE_BASE, `/admin/metrics/upload-failures`));
    return data;
};

/** GET /api/karaoke/admin/buckets */
export const fetchAdminBuckets = async (): Promise<string[]> => {
    const { data } = await apiClient.get<string[]>(apiPath(KARAOKE_BASE, `/admin/buckets`));
    return data ?? [];
};

/** GET /api/karaoke/admin/buckets/{bucket}/public */
export const fetchAdminBucketPublic = async (bucket: string): Promise<boolean> => {
    const { data } = await apiClient.get<boolean>(apiPath(KARAOKE_BASE, `/admin/buckets/${bucket}/public`));
    return !!data;
};

/** POST /api/karaoke/admin/buckets/{bucket}/public?makePublic=... */
export const postAdminSetBucketPublic = async (bucket: string, makePublic = true): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/admin/buckets/${bucket}/public`), null, { params: { makePublic } });
};

// ══════════════════════════════════════════════════════════════
// === Channel move ===
// ══════════════════════════════════════════════════════════════

/** POST /api/karaoke/channel/move */
export const postChannelMove = async (request: MoveRequest): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(KARAOKE_BASE, `/channel/move`), request);
    return data;
};

// ══════════════════════════════════════════════════════════════
// === YouTube Import API ===
// ══════════════════════════════════════════════════════════════

/** GET /api/karaoke/songs/youtube/search?query= — Search YouTube for song metadata */
export const fetchYoutubeSearch = async (query: string): Promise<unknown[]> => {
    const { data } = await apiClient.get<unknown[]>(apiPath(KARAOKE_BASE, `/songs/youtube/search`), {
        params: { query },
    });
    return data ?? [];
};

/** GET /api/karaoke/songs/youtube/{videoId} — Get YouTube video metadata by ID */
export const fetchYoutubeVideo = async (videoId: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(KARAOKE_BASE, `/songs/youtube/${videoId}`));
    return data;
};

/** POST /api/karaoke/songs/import-youtube/{videoId} — Import song from YouTube */
export const postImportYoutube = async (videoId: string): Promise<KaraokeSongFile> => {
    const { data } = await apiClient.post<KaraokeSongFile>(apiPath(KARAOKE_BASE, `/songs/import-youtube/${videoId}`));
    return data;
};

// ══════════════════════════════════════════════════════════════
// === React Query Hooks ===
// ══════════════════════════════════════════════════════════════

export const useCollaboratorPermissionQuery = (songId: number, userId?: number | null) =>
    useQuery({ queryKey: ['karaoke', 'song', songId, 'collaborator', userId], queryFn: () => fetchCollaboratorPermission(songId, userId as number), enabled: Number.isFinite(songId) && Number.isFinite(Number(userId)) });

export const useCollaboratorsQuery = (songId: number) =>
    useQuery({ queryKey: KARAOKE_QK.collaborators(songId), queryFn: () => fetchCollaborators(songId), enabled: Number.isFinite(songId) });

export const useAddCollaboratorMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, { songId: number; payload: { userId: number; permission?: string | number } }>({
        mutationFn: ({ songId, payload }) => postAddCollaborator(songId, payload),
        onSuccess: (_data, vars) => {
            if (vars?.songId) qc.invalidateQueries({ queryKey: KARAOKE_QK.collaborators(vars.songId) });
        }
    });
};

export const useRemoveCollaboratorMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, { songId: number; userId: number }>({
        mutationFn: ({ songId, userId }) => deleteCollaborator(songId, userId),
        onSuccess: (_data, vars) => { if (vars?.songId) qc.invalidateQueries({ queryKey: KARAOKE_QK.collaborators(vars.songId) }); }
    });
};

export const useUpdateCollaboratorPermissionMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, { songId: number; userId: number; permission: string | number }>({
        mutationFn: ({ songId, userId, permission }) => putUpdateCollaboratorPermission(songId, userId, permission),
        onSuccess: (_data, vars) => { if (vars?.songId) qc.invalidateQueries({ queryKey: KARAOKE_QK.collaborators(vars.songId) }); }
    });
};

export const useSongVersionsQuery = (songId: number) =>
    useQuery({ queryKey: KARAOKE_QK.versions(songId), queryFn: () => fetchSongVersions(songId), enabled: Number.isFinite(songId) });

export const useSongVersionQuery = (songId: number, version: number) =>
    useQuery({ queryKey: KARAOKE_QK.version(songId, version), queryFn: () => fetchSongVersion(songId, version), enabled: Number.isFinite(songId) && Number.isFinite(version) });

export const useRevertSongVersionMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, { songId: number; version: number; reason?: string }>({
        mutationFn: ({ songId, version, reason }) => postRevertSongVersion(songId, version, reason),
        onSuccess: (_data, vars) => {
            if (vars?.songId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.song(vars.songId) });
                qc.invalidateQueries({ queryKey: KARAOKE_QK.versions(vars.songId) });
            }
        }
    });
};

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
    options?: Partial<UseQueryOptions<KaraokeSongFile, unknown, KaraokeSongFile, QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.song(id),
        queryFn: () => fetchSongById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

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

export const useCreateSongMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSongFile, unknown, Partial<KaraokeSongFile>>({
        mutationFn: (payload) => postCreateSong(payload),
        onSuccess: (created) => {
            if (created?.id != null) qc.setQueryData(KARAOKE_QK.song(created.id), created);
            qc.invalidateQueries({ queryKey: KARAOKE_QK.songs({}) });
        }
    });
};

export const useUpdateSongMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSongFile, unknown, { songId: number; payload: Partial<KaraokeSongFile> }>({
        mutationFn: ({ songId, payload }) => putUpdateSong(songId, payload),
        onSuccess: (_updated, vars) => {
            if (vars?.songId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.song(vars.songId) });
                qc.invalidateQueries({ queryKey: KARAOKE_QK.songs({}) });
            }
        }
    });
};

export const useRankingQuery = (top = 20) =>
    useQuery<KaraokeRankingEntry[]>({ queryKey: KARAOKE_QK.ranking(top), queryFn: () => fetchRanking(top), staleTime: 60_000 });

export const useUserHistoryQuery = (userId: number, take = 20) =>
    useQuery<KaraokeHistoryEntry[]>({ queryKey: KARAOKE_QK.history(userId), queryFn: () => fetchUserHistory(userId, take), enabled: Number.isFinite(userId) });

export const useActivityQuery = (days = 30) =>
    useQuery<KaraokeActivityEntry[]>({ queryKey: KARAOKE_QK.activity(days), queryFn: () => fetchActivity(days), staleTime: 60_000 });

export const usePlaylistQuery = (playlistId: number) =>
    useQuery({ queryKey: KARAOKE_QK.playlist(playlistId), queryFn: () => fetchPlaylistById(playlistId), enabled: Number.isFinite(playlistId) });

export const useUpdatePlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { playlistId: number; patch: { name?: string; isPublic?: boolean } }>({
        mutationFn: ({ playlistId, patch }) => updateKaraokePlaylist(playlistId, patch),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.onlinePlaylists });
        },
    });
};

export const usePublishPlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (playlistId) => publishPlaylist(playlistId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.onlinePlaylists });
        },
    });
};

export const useUnpublishPlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (playlistId) => unpublishPlaylist(playlistId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.onlinePlaylists });
        },
    });
};

export const useDuplicatePlaylistMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokePlaylist, unknown, number>({
        mutationFn: (playlistId) => duplicatePlaylist(playlistId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
        },
    });
};

export const useReorderPlaylistSongsMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { playlistId: number; songIds: number[] }>({
        mutationFn: ({ playlistId, songIds }) => reorderPlaylistSongs(playlistId, songIds),
        onSuccess: (_d, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.playlist(vars.playlistId) });
        },
    });
};

export const useFilteredSongsQuery = (request: SongFilterRequest, options?: Partial<UseQueryOptions<PagedResult<KaraokeSongFile>, unknown, PagedResult<KaraokeSongFile>, QueryKey>>) =>
    useQuery({ queryKey: KARAOKE_QK.songsFiltered(request), queryFn: () => fetchFilteredSongs(request), enabled: !!request, staleTime: 30_000, ...options });

export const useAllSongsQuery = () =>
    useQuery({ queryKey: KARAOKE_QK.songsAll, queryFn: fetchAllSongs, staleTime: 60_000 });

export const useTopSingingsQuery = (songId: number) =>
    useQuery({ queryKey: KARAOKE_QK.topSingings(songId), queryFn: () => fetchTopSingings(songId), enabled: Number.isFinite(songId) });

export const useSetSongVerifiedMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { songId: number; isVerified: boolean }>({
        mutationFn: ({ songId, isVerified }) => postSetSongVerified(songId, isVerified),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.song(vars.songId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.songsAll });
        },
    });
};

export const useSetSongDevelopmentMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { songId: number; inDevelopment: boolean }>({
        mutationFn: ({ songId, inDevelopment }) => postSetSongDevelopment(songId, inDevelopment),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.song(vars.songId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.songsAll });
        },
    });
};

export const useYoutubeSearchQuery = (query: string) =>
    useQuery({
        queryKey: KARAOKE_QK.youtubeSearch(query),
        queryFn: () => fetchYoutubeSearch(query),
        enabled: !!query,
    });

export const useYoutubeVideoQuery = (videoId: string) =>
    useQuery({
        queryKey: KARAOKE_QK.youtubeVideo(videoId),
        queryFn: () => fetchYoutubeVideo(videoId),
        enabled: !!videoId,
    });

export const useImportYoutubeMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSongFile, unknown, string>({
        mutationFn: (videoId) => postImportYoutube(videoId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.songsAll });
        },
    });
};
