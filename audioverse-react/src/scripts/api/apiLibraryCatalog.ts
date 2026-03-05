// apiLibraryCatalog.ts — Library catalog CRUD: Songs, Albums, Artists, Files, Scan
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    Song,
    Album,
    Artist,
    ArtistDetail,
    ArtistFact,
    AlbumArtist,
    SongDetail,
    LibraryAudioFile,
    LibraryMediaFile,
    ScanRequest,
} from "../../models/modelsLibrary";

// === Base paths ===
export const LIBRARY_BASE = "/api/library";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const LIBRARY_QK = {
    songs: (q?: string) => ["library", "songs", q ?? ""] as const,
    song: (id: number) => ["library", "song", id] as const,
    songDetails: (songId: number) => ["library", "song", songId, "details"] as const,
    albums: (q?: string) => ["library", "albums", q ?? ""] as const,
    album: (id: number) => ["library", "album", id] as const,
    albumArtists: (albumId: number) => ["library", "album", albumId, "artists"] as const,
    artists: (q?: string) => ["library", "artists", q ?? ""] as const,
    artist: (id: number) => ["library", "artist", id] as const,
    artistFacts: (artistId: number) => ["library", "artist", artistId, "facts"] as const,
    artistDetail: (artistId: number) => ["library", "artist", artistId, "detail"] as const,
    audioFiles: (songId?: number, albumId?: number) => ["library", "files", "audio", songId, albumId] as const,
    audioFile: (id: number) => ["library", "files", "audio", id] as const,
    mediaFiles: (songId?: number) => ["library", "files", "media", songId] as const,
};

// ── Songs CRUD ────────────────────────────────────────────────

/** @internal GET /api/library/songs */
export const fetchLibrarySongs = async (q?: string, page = 1, pageSize = 20): Promise<Song[]> => {
    const { data } = await apiClient.get<Song[]>(apiPath(LIBRARY_BASE, "/songs"), {
        params: { q, page, pageSize },
    });
    return data ?? [];
};

/** @internal POST /api/library/songs */
export const postCreateLibrarySong = async (song: Partial<Song>): Promise<Song> => {
    const { data } = await apiClient.post<Song>(apiPath(LIBRARY_BASE, "/songs"), song);
    return data;
};

/** @internal GET /api/library/songs/{id} */
export const fetchLibrarySongById = async (id: number): Promise<Song> => {
    const { data } = await apiClient.get<Song>(apiPath(LIBRARY_BASE, `/songs/${id}`));
    return data;
};

/** @internal PUT /api/library/songs/{id} */
export const putUpdateLibrarySong = async (id: number, song: Partial<Song>): Promise<void> => {
    await apiClient.put(apiPath(LIBRARY_BASE, `/songs/${id}`), song);
};

/** @internal DELETE /api/library/songs/{id} */
export const deleteLibrarySong = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/songs/${id}`));
};

/** @internal GET /api/library/songs/{songId}/details */
export const fetchSongDetails = async (songId: number): Promise<SongDetail[]> => {
    const { data } = await apiClient.get<SongDetail[]>(apiPath(LIBRARY_BASE, `/songs/${songId}/details`));
    return data ?? [];
};

/** @internal POST /api/library/songs/{songId}/details */
export const postCreateSongDetail = async (songId: number, detail: Partial<SongDetail>): Promise<SongDetail> => {
    const { data } = await apiClient.post<SongDetail>(apiPath(LIBRARY_BASE, `/songs/${songId}/details`), detail);
    return data;
};

/** @internal DELETE /api/library/songs/details/{id} */
export const deleteSongDetail = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/songs/details/${id}`));
};

// ── Albums CRUD ───────────────────────────────────────────────

/** @internal GET /api/library/albums */
export const fetchLibraryAlbums = async (q?: string, page = 1, pageSize = 20): Promise<Album[]> => {
    const { data } = await apiClient.get<Album[]>(apiPath(LIBRARY_BASE, "/albums"), {
        params: { q, page, pageSize },
    });
    return data ?? [];
};

/** @internal POST /api/library/albums */
export const postCreateLibraryAlbum = async (album: Partial<Album>): Promise<Album> => {
    const { data } = await apiClient.post<Album>(apiPath(LIBRARY_BASE, "/albums"), album);
    return data;
};

/** @internal GET /api/library/albums/{id} */
export const fetchLibraryAlbumById = async (id: number): Promise<Album> => {
    const { data } = await apiClient.get<Album>(apiPath(LIBRARY_BASE, `/albums/${id}`));
    return data;
};

/** @internal PUT /api/library/albums/{id} */
export const putUpdateLibraryAlbum = async (id: number, album: Partial<Album>): Promise<void> => {
    await apiClient.put(apiPath(LIBRARY_BASE, `/albums/${id}`), album);
};

/** @internal DELETE /api/library/albums/{id} */
export const deleteLibraryAlbum = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/albums/${id}`));
};

/** @internal POST /api/library/albums/{albumId}/artists — Link artist to album */
export const postAddAlbumArtist = async (albumId: number, link: Partial<AlbumArtist>): Promise<AlbumArtist> => {
    const { data } = await apiClient.post<AlbumArtist>(apiPath(LIBRARY_BASE, `/albums/${albumId}/artists`), link);
    return data;
};

/** @internal DELETE /api/library/albums/{albumId}/artists/{artistId} — Unlink artist from album */
export const deleteAlbumArtist = async (albumId: number, artistId: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/albums/${albumId}/artists/${artistId}`));
};

// ── Artists CRUD ──────────────────────────────────────────────

/** @internal GET /api/library/artists */
export const fetchLibraryArtists = async (q?: string, page = 1, pageSize = 20): Promise<Artist[]> => {
    const { data } = await apiClient.get<Artist[]>(apiPath(LIBRARY_BASE, "/artists"), {
        params: { q, page, pageSize },
    });
    return data ?? [];
};

/** @internal POST /api/library/artists */
export const postCreateLibraryArtist = async (artist: Partial<Artist>): Promise<Artist> => {
    const { data } = await apiClient.post<Artist>(apiPath(LIBRARY_BASE, "/artists"), artist);
    return data;
};

/** @internal GET /api/library/artists/{id} */
export const fetchLibraryArtistById = async (id: number): Promise<Artist> => {
    const { data } = await apiClient.get<Artist>(apiPath(LIBRARY_BASE, `/artists/${id}`));
    return data;
};

/** @internal PUT /api/library/artists/{id} */
export const putUpdateLibraryArtist = async (id: number, artist: Partial<Artist>): Promise<void> => {
    await apiClient.put(apiPath(LIBRARY_BASE, `/artists/${id}`), artist);
};

/** @internal DELETE /api/library/artists/{id} */
export const deleteLibraryArtist = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/artists/${id}`));
};

/** @internal GET /api/library/artists/{artistId}/facts */
export const fetchArtistFacts = async (artistId: number): Promise<ArtistFact[]> => {
    const { data } = await apiClient.get<ArtistFact[]>(apiPath(LIBRARY_BASE, `/artists/${artistId}/facts`));
    return data ?? [];
};

/** @internal POST /api/library/artists/{artistId}/facts */
export const postCreateArtistFact = async (artistId: number, fact: Partial<ArtistFact>): Promise<ArtistFact> => {
    const { data } = await apiClient.post<ArtistFact>(apiPath(LIBRARY_BASE, `/artists/${artistId}/facts`), fact);
    return data;
};

/** @internal DELETE /api/library/artists/facts/{id} */
export const deleteArtistFact = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/artists/facts/${id}`));
};

/** @internal PUT /api/library/artists/{artistId}/detail */
export const putUpdateArtistDetail = async (artistId: number, detail: Partial<ArtistDetail>): Promise<void> => {
    await apiClient.put(apiPath(LIBRARY_BASE, `/artists/${artistId}/detail`), detail);
};

// ── Files ─────────────────────────────────────────────────────

/** @internal GET /api/library/files/audio */
export const fetchAudioFiles = async (songId?: number, albumId?: number): Promise<LibraryAudioFile[]> => {
    const { data } = await apiClient.get<LibraryAudioFile[]>(apiPath(LIBRARY_BASE, "/files/audio"), {
        params: { songId, albumId },
    });
    return data ?? [];
};

/** @internal POST /api/library/files/audio */
export const postCreateAudioFile = async (file: Partial<LibraryAudioFile>): Promise<LibraryAudioFile> => {
    const { data } = await apiClient.post<LibraryAudioFile>(apiPath(LIBRARY_BASE, "/files/audio"), file);
    return data;
};

/** @internal GET /api/library/files/audio/{id} */
export const fetchAudioFileById = async (id: number): Promise<LibraryAudioFile> => {
    const { data } = await apiClient.get<LibraryAudioFile>(apiPath(LIBRARY_BASE, `/files/audio/${id}`));
    return data;
};

/** @internal DELETE /api/library/files/audio/{id} */
export const deleteAudioFile = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/files/audio/${id}`));
};

/** @internal GET /api/library/files/media */
export const fetchMediaFiles = async (songId?: number): Promise<LibraryMediaFile[]> => {
    const { data } = await apiClient.get<LibraryMediaFile[]>(apiPath(LIBRARY_BASE, "/files/media"), {
        params: { songId },
    });
    return data ?? [];
};

/** @internal POST /api/library/files/media */
export const postCreateMediaFile = async (file: Partial<LibraryMediaFile>): Promise<LibraryMediaFile> => {
    const { data } = await apiClient.post<LibraryMediaFile>(apiPath(LIBRARY_BASE, "/files/media"), file);
    return data;
};

/** @internal DELETE /api/library/files/media/{id} */
export const deleteMediaFile = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(LIBRARY_BASE, `/files/media/${id}`));
};

// ── Scan ──────────────────────────────────────────────────────

/** @internal POST /api/library/scan — Scan a folder for audio files */
export const postLibraryScan = async (request: ScanRequest): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(LIBRARY_BASE, "/scan"), request);
    return data;
};

/** @internal POST /api/library/scan/import — Scan and auto-import into library */
export const postLibraryScanImport = async (request: ScanRequest): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(LIBRARY_BASE, "/scan/import"), request);
    return data;
};

/** @internal POST /api/library/songs/{id}/auto-tag — Auto-tag a song using AI */
export const postAutoTagSong = async (songId: number): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(LIBRARY_BASE, `/songs/${songId}/auto-tag`));
    return data;
};

// === React Query Hooks ===

// ── Songs hooks ───────────────────────────────────────────────

export const useLibrarySongsQuery = (q?: string, options?: Partial<UseQueryOptions<Song[], unknown, Song[], QueryKey>>) =>
    useQuery({ queryKey: LIBRARY_QK.songs(q), queryFn: () => fetchLibrarySongs(q), ...options });

export const useLibrarySongQuery = (id: number) =>
    useQuery({ queryKey: LIBRARY_QK.song(id), queryFn: () => fetchLibrarySongById(id), enabled: Number.isFinite(id) });

export const useSongDetailsQuery = (songId: number) =>
    useQuery({ queryKey: LIBRARY_QK.songDetails(songId), queryFn: () => fetchSongDetails(songId), enabled: Number.isFinite(songId) });

export const useCreateLibrarySongMutation = () => {
    const qc = useQueryClient();
    return useMutation<Song, unknown, Partial<Song>>({
        mutationFn: (song) => postCreateLibrarySong(song),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "songs"] }); },
    });
};

export const useUpdateLibrarySongMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; song: Partial<Song> }>({
        mutationFn: ({ id, song }) => putUpdateLibrarySong(id, song),
        onSuccess: (_d, v) => {
            qc.invalidateQueries({ queryKey: LIBRARY_QK.song(v.id) });
            qc.invalidateQueries({ queryKey: ["library", "songs"] });
        },
    });
};

export const useDeleteLibrarySongMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteLibrarySong(id),
        onSuccess: (_d, id) => {
            qc.removeQueries({ queryKey: LIBRARY_QK.song(id) });
            qc.invalidateQueries({ queryKey: ["library", "songs"] });
        },
    });
};

export const useCreateSongDetailMutation = () => {
    const qc = useQueryClient();
    return useMutation<SongDetail, unknown, { songId: number; detail: Partial<SongDetail> }>({
        mutationFn: ({ songId, detail }) => postCreateSongDetail(songId, detail),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: LIBRARY_QK.songDetails(v.songId) }); },
    });
};

export const useDeleteSongDetailMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; songId: number }>({
        mutationFn: ({ id }) => deleteSongDetail(id),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: LIBRARY_QK.songDetails(v.songId) }); },
    });
};

// ── Albums hooks ──────────────────────────────────────────────

export const useLibraryAlbumsQuery = (q?: string, options?: Partial<UseQueryOptions<Album[], unknown, Album[], QueryKey>>) =>
    useQuery({ queryKey: LIBRARY_QK.albums(q), queryFn: () => fetchLibraryAlbums(q), ...options });

export const useLibraryAlbumQuery = (id: number) =>
    useQuery({ queryKey: LIBRARY_QK.album(id), queryFn: () => fetchLibraryAlbumById(id), enabled: Number.isFinite(id) });

export const useCreateLibraryAlbumMutation = () => {
    const qc = useQueryClient();
    return useMutation<Album, unknown, Partial<Album>>({
        mutationFn: (album) => postCreateLibraryAlbum(album),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "albums"] }); },
    });
};

export const useUpdateLibraryAlbumMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; album: Partial<Album> }>({
        mutationFn: ({ id, album }) => putUpdateLibraryAlbum(id, album),
        onSuccess: (_d, v) => {
            qc.invalidateQueries({ queryKey: LIBRARY_QK.album(v.id) });
            qc.invalidateQueries({ queryKey: ["library", "albums"] });
        },
    });
};

export const useDeleteLibraryAlbumMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteLibraryAlbum(id),
        onSuccess: (_d, id) => {
            qc.removeQueries({ queryKey: LIBRARY_QK.album(id) });
            qc.invalidateQueries({ queryKey: ["library", "albums"] });
        },
    });
};

export const useAddAlbumArtistMutation = () => {
    const qc = useQueryClient();
    return useMutation<AlbumArtist, unknown, { albumId: number; link: Partial<AlbumArtist> }>({
        mutationFn: ({ albumId, link }) => postAddAlbumArtist(albumId, link),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: LIBRARY_QK.album(v.albumId) }); },
    });
};

export const useDeleteAlbumArtistMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { albumId: number; artistId: number }>({
        mutationFn: ({ albumId, artistId }) => deleteAlbumArtist(albumId, artistId),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: LIBRARY_QK.album(v.albumId) }); },
    });
};

// ── Artists hooks ─────────────────────────────────────────────

export const useLibraryArtistsQuery = (q?: string, options?: Partial<UseQueryOptions<Artist[], unknown, Artist[], QueryKey>>) =>
    useQuery({ queryKey: LIBRARY_QK.artists(q), queryFn: () => fetchLibraryArtists(q), ...options });

export const useLibraryArtistQuery = (id: number) =>
    useQuery({ queryKey: LIBRARY_QK.artist(id), queryFn: () => fetchLibraryArtistById(id), enabled: Number.isFinite(id) });

export const useCreateLibraryArtistMutation = () => {
    const qc = useQueryClient();
    return useMutation<Artist, unknown, Partial<Artist>>({
        mutationFn: (artist) => postCreateLibraryArtist(artist),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "artists"] }); },
    });
};

export const useUpdateLibraryArtistMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; artist: Partial<Artist> }>({
        mutationFn: ({ id, artist }) => putUpdateLibraryArtist(id, artist),
        onSuccess: (_d, v) => {
            qc.invalidateQueries({ queryKey: LIBRARY_QK.artist(v.id) });
            qc.invalidateQueries({ queryKey: ["library", "artists"] });
        },
    });
};

export const useDeleteLibraryArtistMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteLibraryArtist(id),
        onSuccess: (_d, id) => {
            qc.removeQueries({ queryKey: LIBRARY_QK.artist(id) });
            qc.invalidateQueries({ queryKey: ["library", "artists"] });
        },
    });
};

export const useArtistFactsQuery = (artistId: number) =>
    useQuery({ queryKey: LIBRARY_QK.artistFacts(artistId), queryFn: () => fetchArtistFacts(artistId), enabled: Number.isFinite(artistId) });

export const useCreateArtistFactMutation = () => {
    const qc = useQueryClient();
    return useMutation<ArtistFact, unknown, { artistId: number; fact: Partial<ArtistFact> }>({
        mutationFn: ({ artistId, fact }) => postCreateArtistFact(artistId, fact),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: LIBRARY_QK.artistFacts(v.artistId) }); },
    });
};

export const useDeleteArtistFactMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; artistId: number }>({
        mutationFn: ({ id }) => deleteArtistFact(id),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: LIBRARY_QK.artistFacts(v.artistId) }); },
    });
};

export const useUpdateArtistDetailMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { artistId: number; detail: Partial<ArtistDetail> }>({
        mutationFn: ({ artistId, detail }) => putUpdateArtistDetail(artistId, detail),
        onSuccess: (_d, v) => {
            qc.invalidateQueries({ queryKey: LIBRARY_QK.artist(v.artistId) });
            qc.invalidateQueries({ queryKey: LIBRARY_QK.artistDetail(v.artistId) });
        },
    });
};

// ── Files hooks ───────────────────────────────────────────────

export const useAudioFilesQuery = (songId?: number, albumId?: number) =>
    useQuery({ queryKey: LIBRARY_QK.audioFiles(songId, albumId), queryFn: () => fetchAudioFiles(songId, albumId) });

export const useAudioFileQuery = (id: number) =>
    useQuery({ queryKey: LIBRARY_QK.audioFile(id), queryFn: () => fetchAudioFileById(id), enabled: Number.isFinite(id) });

export const useCreateAudioFileMutation = () => {
    const qc = useQueryClient();
    return useMutation<LibraryAudioFile, unknown, Partial<LibraryAudioFile>>({
        mutationFn: (file) => postCreateAudioFile(file),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "files"] }); },
    });
};

export const useDeleteAudioFileMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteAudioFile(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "files"] }); },
    });
};

export const useMediaFilesQuery = (songId?: number) =>
    useQuery({ queryKey: LIBRARY_QK.mediaFiles(songId), queryFn: () => fetchMediaFiles(songId) });

export const useCreateMediaFileMutation = () => {
    const qc = useQueryClient();
    return useMutation<LibraryMediaFile, unknown, Partial<LibraryMediaFile>>({
        mutationFn: (file) => postCreateMediaFile(file),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "files"] }); },
    });
};

export const useDeleteMediaFileMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteMediaFile(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library", "files"] }); },
    });
};

// ── Scan hooks ────────────────────────────────────────────────

export const useLibraryScanMutation = () =>
    useMutation<unknown, unknown, ScanRequest>({
        mutationFn: (request) => postLibraryScan(request),
    });

export const useLibraryScanImportMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, ScanRequest>({
        mutationFn: (request) => postLibraryScanImport(request),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library"] }); },
    });
};

export const useAutoTagSongMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, number>({
        mutationFn: (songId) => postAutoTagSong(songId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["library"] }); },
    });
};

export default {
    // Songs
    fetchLibrarySongs,
    fetchLibrarySongById,
    postCreateLibrarySong,
    putUpdateLibrarySong,
    deleteLibrarySong,
    fetchSongDetails,
    postCreateSongDetail,
    deleteSongDetail,
    // Albums
    fetchLibraryAlbums,
    fetchLibraryAlbumById,
    postCreateLibraryAlbum,
    putUpdateLibraryAlbum,
    deleteLibraryAlbum,
    postAddAlbumArtist,
    deleteAlbumArtist,
    // Artists
    fetchLibraryArtists,
    fetchLibraryArtistById,
    postCreateLibraryArtist,
    putUpdateLibraryArtist,
    deleteLibraryArtist,
    fetchArtistFacts,
    postCreateArtistFact,
    deleteArtistFact,
    putUpdateArtistDetail,
    // Files
    fetchAudioFiles,
    fetchAudioFileById,
    postCreateAudioFile,
    deleteAudioFile,
    fetchMediaFiles,
    postCreateMediaFile,
    deleteMediaFile,
    // Scan
    postLibraryScan,
    postLibraryScanImport,
    postAutoTagSong,
};
