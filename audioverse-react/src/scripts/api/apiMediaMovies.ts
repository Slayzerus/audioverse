// apiMediaMovies.ts — Media catalog: movies CRUD + TMDb search/import
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

export interface Movie {
    id: number;
    title?: string;
    originalTitle?: string;
    director?: string;
    description?: string;
    posterUrl?: string;
    backdropUrl?: string;
    releaseDate?: string;
    runtime?: number;
    genres?: string;
    language?: string;
    rating?: number;
    externalId?: string;
    externalSource?: string;
    createdAt?: string;
    createdByUserId?: number;
}

export interface MovieCollection {
    id: number;
    ownerId: number;
    name?: string;
    description?: string;
    createdAt?: string;
    movies?: MovieCollectionMovie[];
}

export interface MovieCollectionMovie {
    id: number;
    collectionId: number;
    movieId: number;
    movie?: Movie;
    addedAt?: string;
}

export interface ExternalMovieResult {
    externalId?: string;
    title?: string;
    originalTitle?: string;
    posterUrl?: string;
    releaseDate?: string;
    overview?: string;
    rating?: number;
}

// === Base path ===
const BASE = "/api/media/movies";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const MOVIES_QK = {
    list: (params?: Record<string, unknown>) => ["media", "movies", params] as const,
    detail: (id: number) => ["media", "movies", id] as const,
    collections: (ownerId: number) => ["media", "movies", "collections", ownerId] as const,
    collection: (id: number) => ["media", "movies", "collection", id] as const,
    searchTmdb: (q: string) => ["media", "movies", "tmdb", q] as const,
};

// ── CRUD ──────────────────────────────────────────────────────

/** @internal GET /api/media/movies */
export const fetchMovies = async (params?: Record<string, unknown>): Promise<Movie[]> => {
    const { data } = await apiClient.get<Movie[]>(apiPath(BASE, ""), { params });
    return data ?? [];
};

/** @internal GET /api/media/movies/{id} */
export const fetchMovieById = async (id: number): Promise<Movie> => {
    const { data } = await apiClient.get<Movie>(apiPath(BASE, `/${id}`));
    return data;
};

/** @internal POST /api/media/movies */
export const postCreateMovie = async (movie: Partial<Movie>): Promise<Movie> => {
    const { data } = await apiClient.post<Movie>(apiPath(BASE, ""), movie);
    return data;
};

/** @internal PUT /api/media/movies/{id} */
export const putUpdateMovie = async (id: number, movie: Partial<Movie>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/${id}`), movie);
};

/** @internal DELETE /api/media/movies/{id} */
export const deleteMovie = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/${id}`));
};

// ── TMDb search / import ──────────────────────────────────────

/** GET /api/media/movies/tmdb/search?query= */
export const searchTmdbMovies = async (query: string): Promise<ExternalMovieResult[]> => {
    const { data } = await apiClient.get<ExternalMovieResult[]>(apiPath(BASE, "/tmdb/search"), { params: { query } });
    return data ?? [];
};

/** POST /api/media/movies/tmdb/import/{tmdbId} */
export const importFromTmdb = async (tmdbId: string): Promise<Movie> => {
    const { data } = await apiClient.post<Movie>(apiPath(BASE, `/tmdb/import/${tmdbId}`));
    return data;
};

// ── Collections ───────────────────────────────────────────────

/** @internal GET /api/media/movies/collections/owner/{ownerId} */
export const fetchMovieCollections = async (ownerId: number): Promise<MovieCollection[]> => {
    const { data } = await apiClient.get<MovieCollection[]>(apiPath(BASE, `/collections/owner/${ownerId}`));
    return data ?? [];
};

/** @internal GET /api/media/movies/collections/{id} */
export const fetchMovieCollectionById = async (id: number): Promise<MovieCollection> => {
    const { data } = await apiClient.get<MovieCollection>(apiPath(BASE, `/collections/${id}`));
    return data;
};

/** @internal POST /api/media/movies/collections */
export const postCreateMovieCollection = async (collection: Partial<MovieCollection>): Promise<MovieCollection> => {
    const { data } = await apiClient.post<MovieCollection>(apiPath(BASE, "/collections"), collection);
    return data;
};

/** @internal PUT /api/media/movies/collections/{id} */
export const putUpdateMovieCollection = async (id: number, collection: Partial<MovieCollection>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/collections/${id}`), collection);
};

/** @internal DELETE /api/media/movies/collections/{id} */
export const deleteMovieCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/collections/${id}`));
};

/** @internal POST /api/media/movies/collections/{collectionId}/movies */
export const postAddMovieToCollection = async (collectionId: number, movieId: number): Promise<void> => {
    await apiClient.post(apiPath(BASE, `/collections/${collectionId}/movies`), { movieId });
};

/** DELETE /api/media/movies/collections/movies/{id} */
export const removeMovieFromCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/collections/movies/${id}`));
};

// === React Query Hooks ===

export const useMoviesQuery = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<Movie[], unknown, Movie[], QueryKey>>) =>
    useQuery({ queryKey: MOVIES_QK.list(params), queryFn: () => fetchMovies(params), ...options });

export const useMovieQuery = (id: number) =>
    useQuery({ queryKey: MOVIES_QK.detail(id), queryFn: () => fetchMovieById(id), enabled: Number.isFinite(id) });

export const useSearchTmdbMoviesQuery = (query: string, options?: Partial<UseQueryOptions<ExternalMovieResult[], unknown, ExternalMovieResult[], QueryKey>>) =>
    useQuery({ queryKey: MOVIES_QK.searchTmdb(query), queryFn: () => searchTmdbMovies(query), enabled: query.length > 1, ...options });

export const useMovieCollectionsQuery = (ownerId: number) =>
    useQuery({ queryKey: MOVIES_QK.collections(ownerId), queryFn: () => fetchMovieCollections(ownerId), enabled: Number.isFinite(ownerId) });

export const useCreateMovieMutation = () => {
    const qc = useQueryClient();
    return useMutation<Movie, unknown, Partial<Movie>>({
        mutationFn: postCreateMovie,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "movies"] }); },
    });
};

export const useUpdateMovieMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; movie: Partial<Movie> }>({
        mutationFn: ({ id, movie }) => putUpdateMovie(id, movie),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: MOVIES_QK.detail(v.id) }); qc.invalidateQueries({ queryKey: ["media", "movies"] }); },
    });
};

export const useDeleteMovieMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: deleteMovie,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "movies"] }); },
    });
};

export const useImportTmdbMovieMutation = () => {
    const qc = useQueryClient();
    return useMutation<Movie, unknown, string>({
        mutationFn: importFromTmdb,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "movies"] }); },
    });
};

export const useCreateMovieCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<MovieCollection, unknown, Partial<MovieCollection>>({
        mutationFn: postCreateMovieCollection,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "movies", "collections"] }); },
    });
};

export const useAddMovieToCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { collectionId: number; movieId: number }>({
        mutationFn: ({ collectionId, movieId }) => postAddMovieToCollection(collectionId, movieId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "movies", "collections"] }); },
    });
};
