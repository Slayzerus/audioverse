// apiEventCollages.ts — Event collages: photo/video composition management
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

export interface EventCollage {
    id: number;
    eventId: number;
    name?: string;
    description?: string;
    createdAt?: string;
    items?: EventCollageItem[];
}

export interface EventCollageItem {
    id: number;
    collageId: number;
    photoId?: number;
    videoId?: number;
    x: number;
    y: number;
    z: number;
    width: number;
    height: number;
    rotation: number;
    filtersJson?: string;
}

// === Base path ===
const EVENTS_BASE = "/api/events";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const COLLAGES_QK = {
    list: (eventId: number) => ["events", eventId, "collages"] as const,
    detail: (eventId: number, id: number) => ["events", eventId, "collage", id] as const,
};

// ── CRUD ──────────────────────────────────────────────────────

/** @internal GET /api/events/{eventId}/collages */
export const fetchCollages = async (eventId: number): Promise<EventCollage[]> => {
    const { data } = await apiClient.get<EventCollage[]>(apiPath(EVENTS_BASE, `/${eventId}/collages`));
    return data ?? [];
};

/** @internal GET /api/events/{eventId}/collages/{id} */
export const fetchCollageById = async (eventId: number, id: number): Promise<EventCollage> => {
    const { data } = await apiClient.get<EventCollage>(apiPath(EVENTS_BASE, `/${eventId}/collages/${id}`));
    return data;
};

/** @internal POST /api/events/{eventId}/collages */
export const postCreateCollage = async (eventId: number, collage: Partial<EventCollage>): Promise<EventCollage> => {
    const { data } = await apiClient.post<EventCollage>(apiPath(EVENTS_BASE, `/${eventId}/collages`), collage);
    return data;
};

/** @internal PUT /api/events/{eventId}/collages/{id} */
export const putUpdateCollage = async (eventId: number, id: number, collage: Partial<EventCollage>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/collages/${id}`), collage);
};

/** @internal DELETE /api/events/{eventId}/collages/{id} */
export const deleteCollage = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/collages/${id}`));
};

// ── Collage Items ─────────────────────────────────────────────

/** @internal POST /api/events/{eventId}/collages/{collageId}/items */
export const postAddCollageItem = async (eventId: number, collageId: number, item: Partial<EventCollageItem>): Promise<EventCollageItem> => {
    const { data } = await apiClient.post<EventCollageItem>(apiPath(EVENTS_BASE, `/${eventId}/collages/${collageId}/items`), item);
    return data;
};

/** @internal PUT /api/events/{eventId}/collages/{collageId}/items/{itemId} */
export const putUpdateCollageItem = async (eventId: number, collageId: number, itemId: number, item: Partial<EventCollageItem>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/collages/${collageId}/items/${itemId}`), item);
};

// === React Query Hooks ===

export const useCollagesQuery = (eventId: number, options?: Partial<UseQueryOptions<EventCollage[], unknown, EventCollage[], QueryKey>>) =>
    useQuery({ queryKey: COLLAGES_QK.list(eventId), queryFn: () => fetchCollages(eventId), enabled: Number.isFinite(eventId), ...options });

export const useCollageQuery = (eventId: number, id: number) =>
    useQuery({ queryKey: COLLAGES_QK.detail(eventId, id), queryFn: () => fetchCollageById(eventId, id), enabled: Number.isFinite(eventId) && Number.isFinite(id) });

export const useCreateCollageMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventCollage, unknown, { eventId: number; collage: Partial<EventCollage> }>({
        mutationFn: ({ eventId, collage }) => postCreateCollage(eventId, collage),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: COLLAGES_QK.list(v.eventId) }); },
    });
};

export const useUpdateCollageMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; collage: Partial<EventCollage> }>({
        mutationFn: ({ eventId, id, collage }) => putUpdateCollage(eventId, id, collage),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: COLLAGES_QK.detail(v.eventId, v.id) }); qc.invalidateQueries({ queryKey: COLLAGES_QK.list(v.eventId) }); },
    });
};

export const useDeleteCollageMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteCollage(eventId, id),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: COLLAGES_QK.list(v.eventId) }); },
    });
};

export const useAddCollageItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventCollageItem, unknown, { eventId: number; collageId: number; item: Partial<EventCollageItem> }>({
        mutationFn: ({ eventId, collageId, item }) => postAddCollageItem(eventId, collageId, item),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: COLLAGES_QK.detail(v.eventId, v.collageId) }); },
    });
};

export const useUpdateCollageItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; collageId: number; itemId: number; item: Partial<EventCollageItem> }>({
        mutationFn: ({ eventId, collageId, itemId, item }) => putUpdateCollageItem(eventId, collageId, itemId, item),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: COLLAGES_QK.detail(v.eventId, v.collageId) }); },
    });
};
