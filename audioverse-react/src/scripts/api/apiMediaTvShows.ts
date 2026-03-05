// apiMediaTvShows.ts — Media catalog: TV shows CRUD + TMDb search/import
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

export interface TvShow {
    id: number;
    title?: string;
    originalTitle?: string;
    creator?: string;
    description?: string;
    posterUrl?: string;
    backdropUrl?: string;
    firstAirDate?: string;
    lastAirDate?: string;
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
    genres?: string;
    language?: string;
    rating?: number;
    status?: string;
    externalId?: string;
    externalSource?: string;
    createdAt?: string;
    createdByUserId?: number;
}

export interface TvShowCollection {
    id: number;
    ownerId: number;
    name?: string;
    description?: string;
    createdAt?: string;
    shows?: TvShowCollectionTvShow[];
}

export interface TvShowCollectionTvShow {
    id: number;
    collectionId: number;
    tvShowId: number;
    tvShow?: TvShow;
    addedAt?: string;
}

export interface ExternalTvShowResult {
    externalId?: string;
    title?: string;
    originalTitle?: string;
    posterUrl?: string;
    firstAirDate?: string;
    overview?: string;
    rating?: number;
}

// === Base path ===
const BASE = "/api/media/tv";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const TV_QK = {
    list: (params?: Record<string, unknown>) => ["media", "tv", params] as const,
    detail: (id: number) => ["media", "tv", id] as const,
    collections: (ownerId: number) => ["media", "tv", "collections", ownerId] as const,
    collection: (id: number) => ["media", "tv", "collection", id] as const,
    searchTmdb: (q: string) => ["media", "tv", "tmdb", q] as const,
};

// ── CRUD ──────────────────────────────────────────────────────

/** @internal GET /api/media/tv */
export const fetchTvShows = async (params?: Record<string, unknown>): Promise<TvShow[]> => {
    const { data } = await apiClient.get<TvShow[]>(apiPath(BASE, ""), { params });
    return data ?? [];
};

/** @internal GET /api/media/tv/{id} */
export const fetchTvShowById = async (id: number): Promise<TvShow> => {
    const { data } = await apiClient.get<TvShow>(apiPath(BASE, `/${id}`));
    return data;
};

/** @internal POST /api/media/tv */
export const postCreateTvShow = async (show: Partial<TvShow>): Promise<TvShow> => {
    const { data } = await apiClient.post<TvShow>(apiPath(BASE, ""), show);
    return data;
};

/** @internal PUT /api/media/tv/{id} */
export const putUpdateTvShow = async (id: number, show: Partial<TvShow>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/${id}`), show);
};

/** @internal DELETE /api/media/tv/{id} */
export const deleteTvShow = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/${id}`));
};

// ── TMDb search / import ──────────────────────────────────────

/** GET /api/media/tv/tmdb/search?query= */
export const searchTmdbTvShows = async (query: string): Promise<ExternalTvShowResult[]> => {
    const { data } = await apiClient.get<ExternalTvShowResult[]>(apiPath(BASE, "/tmdb/search"), { params: { query } });
    return data ?? [];
};

/** POST /api/media/tv/tmdb/import/{tmdbId} */
export const importTvShowFromTmdb = async (tmdbId: string): Promise<TvShow> => {
    const { data } = await apiClient.post<TvShow>(apiPath(BASE, `/tmdb/import/${tmdbId}`));
    return data;
};

// ── Collections ───────────────────────────────────────────────

/** @internal GET /api/media/tv/collections/owner/{ownerId} */
export const fetchTvShowCollections = async (ownerId: number): Promise<TvShowCollection[]> => {
    const { data } = await apiClient.get<TvShowCollection[]>(apiPath(BASE, `/collections/owner/${ownerId}`));
    return data ?? [];
};

/** @internal GET /api/media/tv/collections/{id} */
export const fetchTvShowCollectionById = async (id: number): Promise<TvShowCollection> => {
    const { data } = await apiClient.get<TvShowCollection>(apiPath(BASE, `/collections/${id}`));
    return data;
};

/** @internal POST /api/media/tv/collections */
export const postCreateTvShowCollection = async (collection: Partial<TvShowCollection>): Promise<TvShowCollection> => {
    const { data } = await apiClient.post<TvShowCollection>(apiPath(BASE, "/collections"), collection);
    return data;
};

/** @internal PUT /api/media/tv/collections/{id} */
export const putUpdateTvShowCollection = async (id: number, collection: Partial<TvShowCollection>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/collections/${id}`), collection);
};

/** @internal DELETE /api/media/tv/collections/{id} */
export const deleteTvShowCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/collections/${id}`));
};

/** @internal POST /api/media/tv/collections/{collectionId}/shows */
export const postAddTvShowToCollection = async (collectionId: number, tvShowId: number): Promise<void> => {
    await apiClient.post(apiPath(BASE, `/collections/${collectionId}/shows`), { tvShowId });
};

/** DELETE /api/media/tv/collections/shows/{id} */
export const removeTvShowFromCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/collections/shows/${id}`));
};

// === React Query Hooks ===

export const useTvShowsQuery = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<TvShow[], unknown, TvShow[], QueryKey>>) =>
    useQuery({ queryKey: TV_QK.list(params), queryFn: () => fetchTvShows(params), ...options });

export const useTvShowQuery = (id: number) =>
    useQuery({ queryKey: TV_QK.detail(id), queryFn: () => fetchTvShowById(id), enabled: Number.isFinite(id) });

export const useSearchTmdbTvShowsQuery = (query: string, options?: Partial<UseQueryOptions<ExternalTvShowResult[], unknown, ExternalTvShowResult[], QueryKey>>) =>
    useQuery({ queryKey: TV_QK.searchTmdb(query), queryFn: () => searchTmdbTvShows(query), enabled: query.length > 1, ...options });

export const useTvShowCollectionsQuery = (ownerId: number) =>
    useQuery({ queryKey: TV_QK.collections(ownerId), queryFn: () => fetchTvShowCollections(ownerId), enabled: Number.isFinite(ownerId) });

export const useCreateTvShowMutation = () => {
    const qc = useQueryClient();
    return useMutation<TvShow, unknown, Partial<TvShow>>({
        mutationFn: postCreateTvShow,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "tv"] }); },
    });
};

export const useUpdateTvShowMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; show: Partial<TvShow> }>({
        mutationFn: ({ id, show }) => putUpdateTvShow(id, show),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: TV_QK.detail(v.id) }); qc.invalidateQueries({ queryKey: ["media", "tv"] }); },
    });
};

export const useDeleteTvShowMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: deleteTvShow,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "tv"] }); },
    });
};

export const useImportTmdbTvShowMutation = () => {
    const qc = useQueryClient();
    return useMutation<TvShow, unknown, string>({
        mutationFn: importTvShowFromTmdb,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "tv"] }); },
    });
};

export const useCreateTvShowCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<TvShowCollection, unknown, Partial<TvShowCollection>>({
        mutationFn: postCreateTvShowCollection,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "tv", "collections"] }); },
    });
};

export const useAddTvShowToCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { collectionId: number; tvShowId: number }>({
        mutationFn: ({ collectionId, tvShowId }) => postAddTvShowToCollection(collectionId, tvShowId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "tv", "collections"] }); },
    });
};
