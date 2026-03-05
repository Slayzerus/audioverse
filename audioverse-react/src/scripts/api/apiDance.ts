// apiDance.ts — Dance classification & song-dance matching
import {
    useQuery,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    DanceStyle,
    SongDanceMatch,
    AudioAnalysisResult,
} from "../../models/modelsKaraoke";

// === Base path ===
const DANCE_BASE = "/api/dance";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const DANCE_QK = {
    styles: ["dance", "styles"] as const,
    songMatch: (songId: number) => ["dance", "song", songId] as const,
    classify: (songId: number) => ["dance", "classify", songId] as const,
    analyze: (songId: number) => ["dance", "analyze", songId] as const,
};

// === Fetchers ===

/** @internal GET /api/dance/styles — List all dance styles */
export const fetchDanceStyles = async (): Promise<DanceStyle[]> => {
    const { data } = await apiClient.get<DanceStyle[]>(apiPath(DANCE_BASE, "/styles"));
    return data ?? [];
};

/** @internal GET /api/dance/song/{songId} — Get dance matches for a song */
export const fetchSongDanceMatch = async (songId: number): Promise<SongDanceMatch[]> => {
    const { data } = await apiClient.get<SongDanceMatch[]>(
        apiPath(DANCE_BASE, `/song/${songId}`),
    );
    return data ?? [];
};

/** @internal GET /api/dance/classify?songId={songId} — Classify song into dance style */
export const fetchDanceClassification = async (
    songId: number,
): Promise<SongDanceMatch[]> => {
    const { data } = await apiClient.get<SongDanceMatch[]>(
        apiPath(DANCE_BASE, "/classify"),
        { params: { songId } },
    );
    return data ?? [];
};

/** @internal GET /api/dance/analyze/{songId} — Audio analysis for dance parameters */
export const fetchAudioAnalysis = async (
    songId: number,
): Promise<AudioAnalysisResult> => {
    const { data } = await apiClient.get<AudioAnalysisResult>(
        apiPath(DANCE_BASE, `/analyze/${songId}`),
    );
    return data;
};

// === React Query Hooks ===

export const useDanceStylesQuery = (
    options?: Partial<UseQueryOptions<DanceStyle[], unknown, DanceStyle[], QueryKey>>,
) =>
    useQuery({
        queryKey: DANCE_QK.styles,
        queryFn: fetchDanceStyles,
        staleTime: 5 * 60_000, // 5 min — fairly static
        ...options,
    });

export const useSongDanceMatchQuery = (
    songId: number,
    options?: Partial<UseQueryOptions<SongDanceMatch[], unknown, SongDanceMatch[], QueryKey>>,
) =>
    useQuery({
        queryKey: DANCE_QK.songMatch(songId),
        queryFn: () => fetchSongDanceMatch(songId),
        enabled: songId > 0,
        ...options,
    });

export const useDanceClassificationQuery = (
    songId: number,
    options?: Partial<UseQueryOptions<SongDanceMatch[], unknown, SongDanceMatch[], QueryKey>>,
) =>
    useQuery({
        queryKey: DANCE_QK.classify(songId),
        queryFn: () => fetchDanceClassification(songId),
        enabled: songId > 0,
        ...options,
    });

export const useAudioAnalysisQuery = (
    songId: number,
    options?: Partial<UseQueryOptions<AudioAnalysisResult, unknown, AudioAnalysisResult, QueryKey>>,
) =>
    useQuery({
        queryKey: DANCE_QK.analyze(songId),
        queryFn: () => fetchAudioAnalysis(songId),
        enabled: songId > 0,
        ...options,
    });

export default {
    fetchDanceStyles,
    fetchSongDanceMatch,
    fetchDanceClassification,
    fetchAudioAnalysis,
};
