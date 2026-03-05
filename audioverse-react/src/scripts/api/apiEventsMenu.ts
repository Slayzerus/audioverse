// apiEventsMenu.ts — Menu CRUD
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { EVENTS_BASE, EVENTS_QK } from "./apiEventsKeys";
import type {
    EventMenuItem,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal GET /api/events/{eventId}/menu — List menu items */
export const fetchEventMenu = async (eventId: number): Promise<EventMenuItem[]> => {
    const { data } = await apiClient.get<EventMenuItem[]>(apiPath(EVENTS_BASE, `/${eventId}/menu`));
    return data;
};

/** @internal POST /api/events/{eventId}/menu — Create a menu item */
export const postCreateMenuItem = async (eventId: number, item: Partial<EventMenuItem>): Promise<EventMenuItem> => {
    const { data } = await apiClient.post<EventMenuItem>(apiPath(EVENTS_BASE, `/${eventId}/menu`), item);
    return data;
};

/** @internal PUT /api/events/{eventId}/menu/{id} — Update a menu item */
export const putUpdateMenuItem = async (eventId: number, id: number, item: Partial<EventMenuItem>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/menu/${id}`), item);
};

/** @internal DELETE /api/events/{eventId}/menu/{id} — Delete a menu item */
export const deleteMenuItem = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/menu/${id}`));
};

// === React Query hooks ===

export const useEventMenuQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventMenuItem[], unknown, EventMenuItem[], QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.menu(eventId),
        queryFn: () => fetchEventMenu(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useCreateMenuItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventMenuItem, unknown, { eventId: number; item: Partial<EventMenuItem> }>({
        mutationFn: ({ eventId, item }) => postCreateMenuItem(eventId, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.menu(vars.eventId) });
        },
    });
};

export const useUpdateMenuItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; item: Partial<EventMenuItem> }>({
        mutationFn: ({ eventId, id, item }) => putUpdateMenuItem(eventId, id, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.menu(vars.eventId) });
        },
    });
};

export const useDeleteMenuItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteMenuItem(eventId, id),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.menu(vars.eventId) });
        },
    });
};
