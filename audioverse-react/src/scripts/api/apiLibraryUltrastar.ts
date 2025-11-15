// src/api/apiLibraryUltrastar.ts
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./libraryApiClient";
import type { KaraokeSongFile } from "../../models/modelsKaraoke";

/// Base API path for Ultrastar endpoints.
export const ULTRASTAR_BASE = "/api/ultrastar";

/// Query keys for React Query caches.
export const US_QK = {
    songs: ["library", "ultrastar", "songs"] as const,
};

/// Triggers a full rescan and returns the refreshed list of songs.
export const postScanUltrastar = async (): Promise<KaraokeSongFile[]> => {
    const { data } = await apiClient.post<KaraokeSongFile[]>(
        apiPath(ULTRASTAR_BASE, "/scan")
    );
    return Array.isArray(data) ? data : [];
};

/// Fetches songs. When ensureScanned is true and cache is empty on the server,
/// the service will perform a one-off scan before returning.
export const fetchUltrastarSongs = async (
    ensureScanned = false
): Promise<KaraokeSongFile[]> => {
    const qs = ensureScanned ? "?ensureScanned=true" : "";
    const { data } = await apiClient.get<KaraokeSongFile[]>(
        apiPath(ULTRASTAR_BASE, `/songs${qs}`)
    );
    return Array.isArray(data) ? data : [];
};

/// Parses an uploaded Ultrastar .txt file (multipart/form-data) and returns a single song model.
/// This is a pure parser; it does not add the song to the index.
export const postParseUltrastar = async (file: File): Promise<KaraokeSongFile> => {
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post<KaraokeSongFile>(
        apiPath(ULTRASTAR_BASE, "/parse"),
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
};

/// React Query hook to fetch Ultrastar songs.
export const useUltrastarSongsQuery = (
    options?: Partial<
        UseQueryOptions<KaraokeSongFile[], unknown, KaraokeSongFile[], QueryKey>
    >,
    ensureScanned = false
) =>
    useQuery({
        queryKey: US_QK.songs,
        queryFn: () => fetchUltrastarSongs(ensureScanned),
        staleTime: 60_000,
        placeholderData: (prev) => prev ?? [],
        ...options,
    });

/// React Query mutation to trigger a rescan.
export const useScanUltrastarMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSongFile[]>({
        mutationFn: () => postScanUltrastar(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: US_QK.songs });
        },
    });
};

/// React Query mutation to parse an uploaded Ultrastar file (no index write).
export const useParseUltrastarMutation = () =>
    useMutation<KaraokeSongFile, unknown, File>({
        mutationFn: (file) => postParseUltrastar(file),
    });

/// Backward-compatible re-exports (if needed elsewhere).
export {
    fetchUltrastarSongs as getAllUltrastarSongs,
    postScanUltrastar as scanUltrastar,
    postParseUltrastar as parseUltrastar,
};

/// Optional default export with the most useful members.
export default {
    // ultrastar
    scanUltrastar: postScanUltrastar,
    getAllUltrastarSongs: fetchUltrastarSongs,
    parseUltrastar: postParseUltrastar,
    useUltrastarSongsQuery,
    useScanUltrastarMutation,
    useParseUltrastarMutation,
};
