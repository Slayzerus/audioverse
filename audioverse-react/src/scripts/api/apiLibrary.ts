import axios from "axios";
import { useQuery, UseQueryOptions, QueryKey } from "@tanstack/react-query";

// const API_BASE_URL = "https://libraryapi.audioverse.io/api/youtube";
const API_BASE_URL = "https://localhost:44305/api/youtube";

export const apiLibrary = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// === Query Keys ===
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
        const { data } = await apiLibrary.get<{ videoId: string }>("/search", {
            params: { artist, title },
        });
        return data?.videoId ?? null;
    } catch (e) {
        console.error("Błąd wyszukiwania w YouTube:", e);
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

// (opcjonalne) default export kompatybilności
export default {
    searchYouTubeByArtistTitle,
};
