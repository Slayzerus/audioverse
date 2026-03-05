// apiSkins.ts — Skin themes: public list + admin CRUD
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===
export interface Skin {
    id: number;
    name: string;
    cssClass?: string | null;
    thumbnailUrl?: string | null;
    isDefault?: boolean;
}

// === Base paths ===
const SKINS_BASE = "/api/skins";
const ADMIN_SKINS_BASE = "/api/admin/skins";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const SKINS_QK = {
    list: ["skins"] as const,
    adminList: ["admin", "skins"] as const,
};

// === Fetchers ===

/** @internal GET /api/skins — Public list of available skins */
export const fetchSkins = async (): Promise<Skin[]> => {
    const { data } = await apiClient.get<Skin[]>(apiPath(SKINS_BASE, ""));
    return data ?? [];
};

/** @internal GET /api/admin/skins — Admin list */
export const fetchAdminSkins = async (): Promise<Skin[]> => {
    const { data } = await apiClient.get<Skin[]>(apiPath(ADMIN_SKINS_BASE, ""));
    return data ?? [];
};

/** @internal POST /api/admin/skins */
export const postCreateSkin = async (dto: Omit<Skin, "id">): Promise<Skin> => {
    const { data } = await apiClient.post<Skin>(apiPath(ADMIN_SKINS_BASE, ""), dto);
    return data;
};

/** @internal PUT /api/admin/skins/{id} */
export const putUpdateSkin = async (dto: Skin): Promise<Skin> => {
    const { data } = await apiClient.put<Skin>(apiPath(ADMIN_SKINS_BASE, `/${dto.id}`), dto);
    return data;
};

/** @internal DELETE /api/admin/skins/{id} */
export const deleteSkin = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(ADMIN_SKINS_BASE, `/${id}`));
};

// === React Query Hooks ===

export const useSkinsQuery = (
    options?: Partial<UseQueryOptions<Skin[], unknown, Skin[], QueryKey>>,
) =>
    useQuery({
        queryKey: SKINS_QK.list,
        queryFn: fetchSkins,
        staleTime: 10 * 60_000,
        ...options,
    });

export const useAdminSkinsQuery = (
    options?: Partial<UseQueryOptions<Skin[], unknown, Skin[], QueryKey>>,
) =>
    useQuery({
        queryKey: SKINS_QK.adminList,
        queryFn: fetchAdminSkins,
        ...options,
    });

export const useCreateSkinMutation = () => {
    const qc = useQueryClient();
    return useMutation<Skin, unknown, Omit<Skin, "id">>({
        mutationFn: (dto) => postCreateSkin(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SKINS_QK.list });
            qc.invalidateQueries({ queryKey: SKINS_QK.adminList });
        },
    });
};

export const useUpdateSkinMutation = () => {
    const qc = useQueryClient();
    return useMutation<Skin, unknown, Skin>({
        mutationFn: (dto) => putUpdateSkin(dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SKINS_QK.list });
            qc.invalidateQueries({ queryKey: SKINS_QK.adminList });
        },
    });
};

export const useDeleteSkinMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteSkin(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SKINS_QK.list });
            qc.invalidateQueries({ queryKey: SKINS_QK.adminList });
        },
    });
};

export default {
    fetchSkins,
    fetchAdminSkins,
    postCreateSkin,
    putUpdateSkin,
    deleteSkin,
};
