// apiWishlists.ts — Wishlists CRUD + Steam sync
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    WishlistDto,
    CreateWishlistRequest,
    UpdateWishlistRequest,
    CreateWishlistItemRequest,
    UpdateWishlistItemRequest,
    WishlistItemDto,
} from "../../models/modelsWishlist";

// === Base path ===
export const WISHLISTS_BASE = "/api/wishlists";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const WISHLISTS_QK = {
    my: () => ["wishlists", "my"] as const,
    detail: (id: number) => ["wishlists", id] as const,
    shared: (token: string) => ["wishlists", "shared", token] as const,
};

// ── Endpoints ──────────────────────────────────────────────────────

/** @internal GET /api/wishlists/my */
export const fetchMyWishlists = async (): Promise<WishlistDto[]> => {
    const { data } = await apiClient.get<WishlistDto[]>(apiPath(WISHLISTS_BASE, "/my"));
    return data ?? [];
};

/** @internal GET /api/wishlists/{id} */
export const fetchWishlist = async (id: number): Promise<WishlistDto> => {
    const { data } = await apiClient.get<WishlistDto>(apiPath(WISHLISTS_BASE, `/${id}`));
    return data;
};

/** @internal GET /api/wishlists/shared/{token} (public) */
export const fetchSharedWishlist = async (token: string): Promise<WishlistDto> => {
    const { data } = await apiClient.get<WishlistDto>(
        apiPath(WISHLISTS_BASE, `/shared/${encodeURIComponent(token)}`),
    );
    return data;
};

/** @internal POST /api/wishlists */
export const postWishlist = async (body: CreateWishlistRequest): Promise<WishlistDto> => {
    const { data } = await apiClient.post<WishlistDto>(apiPath(WISHLISTS_BASE, ""), body);
    return data;
};

/** @internal PUT /api/wishlists/{id} */
export const putWishlist = async (id: number, body: UpdateWishlistRequest): Promise<WishlistDto> => {
    const { data } = await apiClient.put<WishlistDto>(apiPath(WISHLISTS_BASE, `/${id}`), body);
    return data;
};

/** @internal DELETE /api/wishlists/{id} */
export const deleteWishlist = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(WISHLISTS_BASE, `/${id}`));
};

/** @internal POST /api/wishlists/{id}/items */
export const postWishlistItem = async (
    wishlistId: number,
    body: CreateWishlistItemRequest,
): Promise<WishlistItemDto> => {
    const { data } = await apiClient.post<WishlistItemDto>(
        apiPath(WISHLISTS_BASE, `/${wishlistId}/items`),
        body,
    );
    return data;
};

/** @internal PUT /api/wishlists/{id}/items/{itemId} */
export const putWishlistItem = async (
    wishlistId: number,
    itemId: number,
    body: UpdateWishlistItemRequest,
): Promise<WishlistItemDto> => {
    const { data } = await apiClient.put<WishlistItemDto>(
        apiPath(WISHLISTS_BASE, `/${wishlistId}/items/${itemId}`),
        body,
    );
    return data;
};

/** @internal PATCH /api/wishlists/{id}/items/{itemId}/acquired */
export const patchMarkAcquired = async (wishlistId: number, itemId: number): Promise<void> => {
    await apiClient.patch(apiPath(WISHLISTS_BASE, `/${wishlistId}/items/${itemId}/acquired`));
};

/** @internal DELETE /api/wishlists/{id}/items/{itemId} */
export const deleteWishlistItem = async (wishlistId: number, itemId: number): Promise<void> => {
    await apiClient.delete(apiPath(WISHLISTS_BASE, `/${wishlistId}/items/${itemId}`));
};

/** @internal POST /api/wishlists/{id}/sync/steam?steamId=... */
export const postSteamSync = async (wishlistId: number, steamId: string): Promise<void> => {
    await apiClient.post(apiPath(WISHLISTS_BASE, `/${wishlistId}/sync/steam`), null, {
        params: { steamId },
    });
};

// === React Query Hooks ===

export const useMyWishlistsQuery = () =>
    useQuery({
        queryKey: WISHLISTS_QK.my(),
        queryFn: fetchMyWishlists,
    });

export const useWishlistQuery = (id: number, enabled = true) =>
    useQuery({
        queryKey: WISHLISTS_QK.detail(id),
        queryFn: () => fetchWishlist(id),
        enabled: !!id && enabled,
    });

export const useSharedWishlistQuery = (token: string) =>
    useQuery({
        queryKey: WISHLISTS_QK.shared(token),
        queryFn: () => fetchSharedWishlist(token),
        enabled: !!token,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useCreateWishlistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateWishlistRequest) => postWishlist(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.my() }),
    });
};

export const useUpdateWishlistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateWishlistRequest }) =>
            putWishlist(id, body),
        onSuccess: (_d, v) => {
            qc.invalidateQueries({ queryKey: WISHLISTS_QK.my() });
            qc.invalidateQueries({ queryKey: WISHLISTS_QK.detail(v.id) });
        },
    });
};

export const useDeleteWishlistMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteWishlist(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.my() }),
    });
};

export const useAddWishlistItemMutation = (wishlistId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateWishlistItemRequest) => postWishlistItem(wishlistId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.detail(wishlistId) }),
    });
};

export const useUpdateWishlistItemMutation = (wishlistId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, body }: { itemId: number; body: UpdateWishlistItemRequest }) =>
            putWishlistItem(wishlistId, itemId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.detail(wishlistId) }),
    });
};

export const useMarkAcquiredMutation = (wishlistId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemId: number) => patchMarkAcquired(wishlistId, itemId),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.detail(wishlistId) }),
    });
};

export const useDeleteWishlistItemMutation = (wishlistId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (itemId: number) => deleteWishlistItem(wishlistId, itemId),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.detail(wishlistId) }),
    });
};

export const useSteamSyncMutation = (wishlistId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (steamId: string) => postSteamSync(wishlistId, steamId),
        onSuccess: () => qc.invalidateQueries({ queryKey: WISHLISTS_QK.detail(wishlistId) }),
    });
};

export default {
    fetchMyWishlists,
    fetchWishlist,
    fetchSharedWishlist,
    postWishlist,
    putWishlist,
    deleteWishlist,
    postWishlistItem,
    putWishlistItem,
    patchMarkAcquired,
    deleteWishlistItem,
    postSteamSync,
};
