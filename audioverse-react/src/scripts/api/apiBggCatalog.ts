// apiBggCatalog.ts — BGG Catalog sync & search API
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Base path ===
export const BGG_BASE = "/api/bgg";

// === Models ===

export interface BggCatalogGame {
    bggId: number;
    name: string;
    description?: string;
    minPlayers?: number;
    maxPlayers?: number;
    estimatedDurationMinutes?: number;
    bggImageUrl?: string;
    bggRating?: number;
    bggYearPublished?: number;
    bggWeight?: number;
    bggRank?: number;
    bggCategories?: string;
    bggMechanics?: string;
}

export interface BggSyncStatus {
    state: "Idle" | "Running" | "Completed" | "Cancelled" | "Failed";
    totalGames: number;
    syncedGames: number;
    failedGames: number;
    progress: number;
    lastSyncedBggId?: number;
    startedAtUtc?: string;
    finishedAtUtc?: string;
    lastFullSyncUtc?: string;
    errorMessage?: string;
}

// === Query Keys ===

export const BGG_CATALOG_QK = {
    search: (query: string, limit?: number) => ["bgg-catalog", "search", query, limit] as const,
    syncStatus: ["bgg-catalog", "sync-status"] as const,
    export: ["bgg-catalog", "export"] as const,
};

// === Fetch functions ===

/** @internal GET /api/bgg/search?q=...&limit=20 — Cache-through search */
export const fetchBggCatalogSearch = async (query: string, limit = 20): Promise<BggCatalogGame[]> => {
    const { data } = await apiClient.get<BggCatalogGame[]>(apiPath(BGG_BASE, "/search"), {
        params: { q: query, limit },
    });
    return data ?? [];
};

/** @internal GET /api/bgg/sync/status — Sync status */
export const fetchBggSyncStatus = async (): Promise<BggSyncStatus> => {
    const { data } = await apiClient.get<BggSyncStatus>(apiPath(BGG_BASE, "/sync/status"));
    return data;
};

/** @internal POST /api/bgg/sync/start — Start full sync */
export const postStartBggSync = async (): Promise<void> => {
    await apiClient.post(apiPath(BGG_BASE, "/sync/start"));
};

/** @internal POST /api/bgg/sync/cancel — Cancel sync */
export const postCancelBggSync = async (): Promise<void> => {
    await apiClient.post(apiPath(BGG_BASE, "/sync/cancel"));
};

/** @internal GET /api/bgg/export — Export catalog JSON */
export const fetchBggExport = async (): Promise<BggCatalogGame[]> => {
    const { data } = await apiClient.get<BggCatalogGame[]>(apiPath(BGG_BASE, "/export"));
    return data ?? [];
};

/** @internal POST /api/bgg/import — Import catalog JSON */
export const postImportBggCatalog = async (games: BggCatalogGame[]): Promise<void> => {
    await apiClient.post(apiPath(BGG_BASE, "/import"), games);
};

// === React Query hooks ===

/** GET /api/bgg/search — enabled only when query.length >= 2 */
export const useBggCatalogSearchQuery = (
    query: string,
    limit?: number,
    options?: Partial<UseQueryOptions<BggCatalogGame[], unknown, BggCatalogGame[], QueryKey>>,
) =>
    useQuery({
        queryKey: BGG_CATALOG_QK.search(query, limit),
        queryFn: () => fetchBggCatalogSearch(query, limit),
        enabled: query.length >= 2,
        ...options,
    });

/** GET /api/bgg/sync/status — refetchInterval 3000 when state=Running */
export const useBggSyncStatusQuery = (
    options?: Partial<UseQueryOptions<BggSyncStatus, unknown, BggSyncStatus, QueryKey>>,
) =>
    useQuery({
        queryKey: BGG_CATALOG_QK.syncStatus,
        queryFn: fetchBggSyncStatus,
        refetchInterval: (query) => {
            const state = query.state.data?.state;
            return state === "Running" ? 3000 : false;
        },
        ...options,
    });

/** POST /api/bgg/sync/start */
export const useStartBggSyncMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, void>({
        mutationFn: () => postStartBggSync(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BGG_CATALOG_QK.syncStatus });
        },
    });
};

/** POST /api/bgg/sync/cancel */
export const useCancelBggSyncMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, void>({
        mutationFn: () => postCancelBggSync(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BGG_CATALOG_QK.syncStatus });
        },
    });
};

/** GET /api/bgg/export — manually enabled */
export const useBggExportQuery = (
    enabled: boolean,
    options?: Partial<UseQueryOptions<BggCatalogGame[], unknown, BggCatalogGame[], QueryKey>>,
) =>
    useQuery({
        queryKey: BGG_CATALOG_QK.export,
        queryFn: fetchBggExport,
        enabled,
        ...options,
    });

/** POST /api/bgg/import — import catalog JSON (body: BggCatalogGame[]) */
export const useImportBggCatalogMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, BggCatalogGame[]>({
        mutationFn: (games) => postImportBggCatalog(games),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BGG_CATALOG_QK.search("") });
            qc.invalidateQueries({ queryKey: BGG_CATALOG_QK.export });
        },
    });
};
