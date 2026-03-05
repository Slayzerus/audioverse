// apiGenres.ts — Genre catalog + admin CRUD
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===
export interface Genre {
    id: number;
    name: string;
    description?: string | null;
    parentId?: number | null;
}

// === Base paths ===
const GENRES_BASE = "/api/genres";
const ADMIN_GENRES_BASE = "/api/admin/genres";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const GENRES_QK = {
    list: ["genres"] as const,
    single: (id: number) => ["genres", id] as const,
};

// === Fetchers ===

/** @internal GET /api/genres — Public list */
export const fetchGenres = async (): Promise<Genre[]> => {
    const { data } = await apiClient.get<Genre[]>(apiPath(GENRES_BASE, ""));
    return data ?? [];
};

/** @internal GET /api/admin/genres — Admin list */
export const fetchAdminGenres = async (): Promise<Genre[]> => {
    const { data } = await apiClient.get<Genre[]>(apiPath(ADMIN_GENRES_BASE, ""));
    return data ?? [];
};

/** @internal GET /api/admin/genres/{id} */
export const fetchAdminGenreById = async (id: number): Promise<Genre> => {
    const { data } = await apiClient.get<Genre>(apiPath(ADMIN_GENRES_BASE, `/${id}`));
    return data;
};

/** @internal POST /api/admin/genres */
export const postCreateGenre = async (
    dto: Omit<Genre, "id">,
): Promise<Genre> => {
    const { data } = await apiClient.post<Genre>(apiPath(ADMIN_GENRES_BASE, ""), dto);
    return data;
};

/** @internal PUT /api/admin/genres/{id} */
export const putUpdateGenre = async (dto: Genre): Promise<Genre> => {
    const { data } = await apiClient.put<Genre>(apiPath(ADMIN_GENRES_BASE, `/${dto.id}`), dto);
    return data;
};

/** @internal DELETE /api/admin/genres/{id} */
export const deleteGenre = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(ADMIN_GENRES_BASE, `/${id}`));
};

// === React Query Hooks ===

export const useGenresQuery = (
    options?: Partial<UseQueryOptions<Genre[], unknown, Genre[], QueryKey>>,
) =>
    useQuery({
        queryKey: GENRES_QK.list,
        queryFn: fetchGenres,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useAdminGenresQuery = (
    options?: Partial<UseQueryOptions<Genre[], unknown, Genre[], QueryKey>>,
) =>
    useQuery({
        queryKey: ["admin", ...GENRES_QK.list],
        queryFn: fetchAdminGenres,
        ...options,
    });

export const useCreateGenreMutation = () => {
    const qc = useQueryClient();
    return useMutation<Genre, unknown, Omit<Genre, "id">>({
        mutationFn: (dto) => postCreateGenre(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GENRES_QK.list });
        },
    });
};

export const useUpdateGenreMutation = () => {
    const qc = useQueryClient();
    return useMutation<Genre, unknown, Genre>({
        mutationFn: (dto) => putUpdateGenre(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GENRES_QK.list });
        },
    });
};

export const useDeleteGenreMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteGenre(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GENRES_QK.list });
        },
    });
};

export default {
    fetchGenres,
    fetchAdminGenres,
    fetchAdminGenreById,
    postCreateGenre,
    putUpdateGenre,
    deleteGenre,
};
