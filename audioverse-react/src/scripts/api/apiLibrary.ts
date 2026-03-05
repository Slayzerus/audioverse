import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";
import { apiClient } from "./audioverseApiClient";
import { logger } from "../../utils/logger";
const log = logger.scoped('apiLibrary');

// Baza YouTube search (przeniesiona z Library API do AudioVerse API)
const YOUTUBE_BASE = "/api/karaoke/songs/youtube";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const LIB_QK = {
    ytSearch: (artist: string, title: string) =>
        ["library", "yt-search", artist ?? "", title ?? ""] as const,
};

// === Low-level API ===
export const searchYouTubeByArtistTitle = async (
    artist: string,
    title: string
): Promise<string | null> => {
    try {
        const query = `${artist} ${title}`.trim();
        const { data } = await apiClient.get<{ videoId: string }>(`${YOUTUBE_BASE}/search`, {
            params: { query },
        });
        return data?.videoId ?? null;
    } catch (e) {
        log.error("Error searching YouTube:", e);
        return null;
    }
};

// === React Query hook ===
export const useYouTubeSearchQuery = (
    artist: string,
    title: string,
    options?: Partial<UseQueryOptions<string | null, unknown, string | null, QueryKey>>
) =>
    useQuery({
        queryKey: LIB_QK.ytSearch(artist, title),
        queryFn: () => searchYouTubeByArtistTitle(artist, title),
        enabled: Boolean(artist && title),
        staleTime: 5 * 60_000,
        ...options,
    });

// Backward compatibility — apiLibrary is no longer a separate axios instance
export const apiLibrary = apiClient;

// (optional) compatibility default export
export default {
    searchYouTubeByArtistTitle,
};
