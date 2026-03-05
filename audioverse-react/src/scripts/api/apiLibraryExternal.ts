// apiLibraryExternal.ts — External music search (Spotify, YouTube, Tidal, MusicBrainz)
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { ExternalTrackResult } from "../../models/modelsKaraoke";

// === Base path ===
export const EXTERNAL_BASE = "/api/library/external";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const EXTERNAL_QK = {
    spotifySearch: (q: string) => ["external", "spotify", "search", q] as const,
    spotifyTrack: (trackId: string) => ["external", "spotify", "track", trackId] as const,
    spotifyArtist: (artistId: string) => ["external", "spotify", "artist", artistId] as const,
    spotifyAlbum: (albumId: string) => ["external", "spotify", "album", albumId] as const,
    youtubeSearch: (q: string) => ["external", "youtube", "search", q] as const,
    tidalSearch: (q: string) => ["external", "tidal", "search", q] as const,
    tidalTrack: (trackId: string) => ["external", "tidal", "track", trackId] as const,
    mbSearch: (q: string, type: string) => ["external", "musicbrainz", "search", q, type] as const,
    mbRecording: (mbid: string) => ["external", "musicbrainz", "recording", mbid] as const,
    mbArtist: (mbid: string) => ["external", "musicbrainz", "artist", mbid] as const,
    mbRelease: (mbid: string) => ["external", "musicbrainz", "release", mbid] as const,
    mbIsrc: (isrc: string) => ["external", "musicbrainz", "isrc", isrc] as const,
    search: (q: string, source: string) => ["external", "search", source, q] as const,
};

// ── Spotify ───────────────────────────────────────────────────

/** @internal GET /api/library/external/spotify/search */
export const fetchSpotifySearch = async (q: string, limit = 20): Promise<ExternalTrackResult[]> => {
    const { data } = await apiClient.get<ExternalTrackResult[]>(apiPath(EXTERNAL_BASE, "/spotify/search"), {
        params: { q, limit },
    });
    return data ?? [];
};

/** @internal GET /api/library/external/spotify/track/{trackId} */
export const fetchSpotifyTrack = async (trackId: string): Promise<ExternalTrackResult> => {
    const { data } = await apiClient.get<ExternalTrackResult>(apiPath(EXTERNAL_BASE, `/spotify/track/${trackId}`));
    return data;
};

/** @internal GET /api/library/external/spotify/artist/{artistId} */
export const fetchSpotifyArtist = async (artistId: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EXTERNAL_BASE, `/spotify/artist/${artistId}`));
    return data;
};

/** @internal GET /api/library/external/spotify/album/{albumId} */
export const fetchSpotifyAlbum = async (albumId: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EXTERNAL_BASE, `/spotify/album/${albumId}`));
    return data;
};

// ── YouTube ───────────────────────────────────────────────────

/** @internal GET /api/library/external/youtube/search */
export const fetchExternalYoutubeSearch = async (q: string, limit = 10): Promise<ExternalTrackResult[]> => {
    const { data } = await apiClient.get<ExternalTrackResult[]>(apiPath(EXTERNAL_BASE, "/youtube/search"), {
        params: { q, limit },
    });
    return data ?? [];
};

// ── Tidal ─────────────────────────────────────────────────────

/** @internal GET /api/library/external/tidal/search */
export const fetchTidalSearch = async (q: string, limit = 20): Promise<ExternalTrackResult[]> => {
    const { data } = await apiClient.get<ExternalTrackResult[]>(apiPath(EXTERNAL_BASE, "/tidal/search"), {
        params: { q, limit },
    });
    return data ?? [];
};

/** @internal GET /api/library/external/tidal/track/{trackId} */
export const fetchTidalTrack = async (trackId: string): Promise<ExternalTrackResult> => {
    const { data } = await apiClient.get<ExternalTrackResult>(apiPath(EXTERNAL_BASE, `/tidal/track/${trackId}`));
    return data;
};

// ── MusicBrainz ───────────────────────────────────────────────

/** @internal GET /api/library/external/musicbrainz/search */
export const fetchMusicBrainzSearch = async (q: string, type = "recording", limit = 25): Promise<ExternalTrackResult[]> => {
    const { data } = await apiClient.get<ExternalTrackResult[]>(apiPath(EXTERNAL_BASE, "/musicbrainz/search"), {
        params: { q, type, limit },
    });
    return data ?? [];
};

/** @internal GET /api/library/external/musicbrainz/recording/{mbid} */
export const fetchMusicBrainzRecording = async (mbid: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EXTERNAL_BASE, `/musicbrainz/recording/${mbid}`));
    return data;
};

/** @internal GET /api/library/external/musicbrainz/artist/{mbid} */
export const fetchMusicBrainzArtist = async (mbid: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EXTERNAL_BASE, `/musicbrainz/artist/${mbid}`));
    return data;
};

/** @internal GET /api/library/external/musicbrainz/release/{mbid} */
export const fetchMusicBrainzRelease = async (mbid: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EXTERNAL_BASE, `/musicbrainz/release/${mbid}`));
    return data;
};

/** @internal GET /api/library/external/musicbrainz/isrc/{isrc} */
export const fetchMusicBrainzIsrc = async (isrc: string): Promise<unknown> => {
    const { data } = await apiClient.get(apiPath(EXTERNAL_BASE, `/musicbrainz/isrc/${isrc}`));
    return data;
};

// ── Universal search & import ─────────────────────────────────

/** @internal GET /api/library/external/search — Unified search across sources */
export const fetchExternalSearch = async (q: string, source: string, limit = 20): Promise<ExternalTrackResult[]> => {
    const { data } = await apiClient.get<ExternalTrackResult[]>(apiPath(EXTERNAL_BASE, "/search"), {
        params: { q, source, limit },
    });
    return data ?? [];
};

/** @internal POST /api/library/external/import — Import an external track into library */
export const postExternalImport = async (track: ExternalTrackResult): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(EXTERNAL_BASE, "/import"), track);
    return data;
};

// === React Query Hooks ===

export const useSpotifySearchQuery = (q: string, limit = 20, options?: Partial<UseQueryOptions<ExternalTrackResult[], unknown, ExternalTrackResult[], QueryKey>>) =>
    useQuery({ queryKey: EXTERNAL_QK.spotifySearch(q), queryFn: () => fetchSpotifySearch(q, limit), enabled: !!q, ...options });

export const useSpotifyTrackQuery = (trackId: string) =>
    useQuery({ queryKey: EXTERNAL_QK.spotifyTrack(trackId), queryFn: () => fetchSpotifyTrack(trackId), enabled: !!trackId });

export const useSpotifyArtistQuery = (artistId: string) =>
    useQuery({ queryKey: EXTERNAL_QK.spotifyArtist(artistId), queryFn: () => fetchSpotifyArtist(artistId), enabled: !!artistId });

export const useSpotifyAlbumQuery = (albumId: string) =>
    useQuery({ queryKey: EXTERNAL_QK.spotifyAlbum(albumId), queryFn: () => fetchSpotifyAlbum(albumId), enabled: !!albumId });

export const useExternalYoutubeSearchQuery = (q: string, limit = 10) =>
    useQuery({ queryKey: EXTERNAL_QK.youtubeSearch(q), queryFn: () => fetchExternalYoutubeSearch(q, limit), enabled: !!q });

export const useTidalSearchQuery = (q: string, limit = 20) =>
    useQuery({ queryKey: EXTERNAL_QK.tidalSearch(q), queryFn: () => fetchTidalSearch(q, limit), enabled: !!q });

export const useTidalTrackQuery = (trackId: string) =>
    useQuery({ queryKey: EXTERNAL_QK.tidalTrack(trackId), queryFn: () => fetchTidalTrack(trackId), enabled: !!trackId });

export const useMusicBrainzSearchQuery = (q: string, type = "recording", limit = 25) =>
    useQuery({ queryKey: EXTERNAL_QK.mbSearch(q, type), queryFn: () => fetchMusicBrainzSearch(q, type, limit), enabled: !!q });

export const useMusicBrainzRecordingQuery = (mbid: string) =>
    useQuery({ queryKey: EXTERNAL_QK.mbRecording(mbid), queryFn: () => fetchMusicBrainzRecording(mbid), enabled: !!mbid });

export const useMusicBrainzArtistQuery = (mbid: string) =>
    useQuery({ queryKey: EXTERNAL_QK.mbArtist(mbid), queryFn: () => fetchMusicBrainzArtist(mbid), enabled: !!mbid });

export const useMusicBrainzReleaseQuery = (mbid: string) =>
    useQuery({ queryKey: EXTERNAL_QK.mbRelease(mbid), queryFn: () => fetchMusicBrainzRelease(mbid), enabled: !!mbid });

export const useMusicBrainzIsrcQuery = (isrc: string) =>
    useQuery({ queryKey: EXTERNAL_QK.mbIsrc(isrc), queryFn: () => fetchMusicBrainzIsrc(isrc), enabled: !!isrc });

export const useExternalSearchQuery = (q: string, source: string, limit = 20) =>
    useQuery({ queryKey: EXTERNAL_QK.search(q, source), queryFn: () => fetchExternalSearch(q, source, limit), enabled: !!q && !!source });

export const useExternalImportMutation = () => {
    const qc = useQueryClient();
    return useMutation<unknown, unknown, ExternalTrackResult>({
        mutationFn: (track) => postExternalImport(track),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["library"] });
        },
    });
};

export default {
    fetchSpotifySearch,
    fetchSpotifyTrack,
    fetchSpotifyArtist,
    fetchSpotifyAlbum,
    fetchExternalYoutubeSearch,
    fetchTidalSearch,
    fetchTidalTrack,
    fetchMusicBrainzSearch,
    fetchMusicBrainzRecording,
    fetchMusicBrainzArtist,
    fetchMusicBrainzRelease,
    fetchMusicBrainzIsrc,
    fetchExternalSearch,
    postExternalImport,
};
