// apiGiftRegistry.ts — Gift registry / group gifts CRUD
import {
    useQuery,
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    GiftRegistryDto,
    CreateGiftRegistryRequest,
    UpdateGiftRegistryRequest,
    CreateGiftItemRequest,
    UpdateGiftItemRequest,
    GiftItemDto,
    ContributeRequest,
    ContributeResponse,
} from "../../models/modelsGiftRegistry";

// === Base path ===
export const GIFTS_BASE = "/api/gift-registry";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const GIFTS_QK = {
    my: () => ["gift-registry", "my"] as const,
    shared: (token: string) => ["gift-registry", "shared", token] as const,
};

// ── Endpoints ──────────────────────────────────────────────────────

/** @internal GET /api/gift-registry/my */
export const fetchMyRegistries = async (): Promise<GiftRegistryDto[]> => {
    const { data } = await apiClient.get<GiftRegistryDto[]>(apiPath(GIFTS_BASE, "/my"));
    return data ?? [];
};

/** @internal GET /api/gift-registry/shared/{token} (public) */
export const fetchSharedRegistry = async (token: string): Promise<GiftRegistryDto> => {
    const { data } = await apiClient.get<GiftRegistryDto>(
        apiPath(GIFTS_BASE, `/shared/${encodeURIComponent(token)}`),
    );
    return data;
};

/** @internal POST /api/gift-registry */
export const postRegistry = async (body: CreateGiftRegistryRequest): Promise<GiftRegistryDto> => {
    const { data } = await apiClient.post<GiftRegistryDto>(apiPath(GIFTS_BASE, ""), body);
    return data;
};

/** @internal PUT /api/gift-registry/{id} */
export const putRegistry = async (
    id: number,
    body: UpdateGiftRegistryRequest,
): Promise<GiftRegistryDto> => {
    const { data } = await apiClient.put<GiftRegistryDto>(apiPath(GIFTS_BASE, `/${id}`), body);
    return data;
};

/** @internal PATCH /api/gift-registry/{id}/toggle */
export const patchToggleRegistry = async (id: number): Promise<void> => {
    await apiClient.patch(apiPath(GIFTS_BASE, `/${id}/toggle`));
};

/** @internal DELETE /api/gift-registry/{id} */
export const deleteRegistry = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(GIFTS_BASE, `/${id}`));
};

/** @internal POST /api/gift-registry/{id}/items */
export const postGiftItem = async (
    registryId: number,
    body: CreateGiftItemRequest,
): Promise<GiftItemDto> => {
    const { data } = await apiClient.post<GiftItemDto>(
        apiPath(GIFTS_BASE, `/${registryId}/items`),
        body,
    );
    return data;
};

/** @internal PUT /api/gift-registry/{id}/items/{itemId} */
export const putGiftItem = async (
    registryId: number,
    itemId: number,
    body: UpdateGiftItemRequest,
): Promise<GiftItemDto> => {
    const { data } = await apiClient.put<GiftItemDto>(
        apiPath(GIFTS_BASE, `/${registryId}/items/${itemId}`),
        body,
    );
    return data;
};

/** @internal DELETE /api/gift-registry/{id}/items/{itemId} */
export const deleteGiftItem = async (registryId: number, itemId: number): Promise<void> => {
    await apiClient.delete(apiPath(GIFTS_BASE, `/${registryId}/items/${itemId}`));
};

/** @internal POST /api/gift-registry/items/{itemId}/contribute (public) */
export const postContribute = async (
    itemId: number,
    body: ContributeRequest,
): Promise<ContributeResponse> => {
    const { data } = await apiClient.post<ContributeResponse>(
        apiPath(GIFTS_BASE, `/items/${itemId}/contribute`),
        body,
    );
    return data;
};

/** @internal DELETE /api/gift-registry/contributions/{contributionId} */
export const deleteContribution = async (contributionId: number): Promise<void> => {
    await apiClient.delete(apiPath(GIFTS_BASE, `/contributions/${contributionId}`));
};

// === React Query Hooks ===

export const useMyRegistriesQuery = () =>
    useQuery({
        queryKey: GIFTS_QK.my(),
        queryFn: fetchMyRegistries,
    });

export const useSharedRegistryQuery = (token: string) =>
    useQuery({
        queryKey: GIFTS_QK.shared(token),
        queryFn: () => fetchSharedRegistry(token),
        enabled: !!token,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useCreateRegistryMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateGiftRegistryRequest) => postRegistry(body),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useUpdateRegistryMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: number; body: UpdateGiftRegistryRequest }) =>
            putRegistry(id, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useToggleRegistryMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => patchToggleRegistry(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useDeleteRegistryMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteRegistry(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useAddGiftItemMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ registryId, body }: { registryId: number; body: CreateGiftItemRequest }) =>
            postGiftItem(registryId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useUpdateGiftItemMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            registryId,
            itemId,
            body,
        }: { registryId: number; itemId: number; body: UpdateGiftItemRequest }) =>
            putGiftItem(registryId, itemId, body),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useDeleteGiftItemMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ registryId, itemId }: { registryId: number; itemId: number }) =>
            deleteGiftItem(registryId, itemId),
        onSuccess: () => qc.invalidateQueries({ queryKey: GIFTS_QK.my() }),
    });
};

export const useContributeMutation = () =>
    useMutation({
        mutationFn: ({ itemId, body }: { itemId: number; body: ContributeRequest }) =>
            postContribute(itemId, body),
    });

export const useDeleteContributionMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (contributionId: number) => deleteContribution(contributionId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GIFTS_QK.my() });
        },
    });
};

export default {
    fetchMyRegistries,
    fetchSharedRegistry,
    postRegistry,
    putRegistry,
    patchToggleRegistry,
    deleteRegistry,
    postGiftItem,
    putGiftItem,
    deleteGiftItem,
    postContribute,
    deleteContribution,
};
