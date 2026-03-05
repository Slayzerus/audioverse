// apiEventsSchedule.ts — Schedule CRUD
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
    EventScheduleItem,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal GET /api/events/{eventId}/schedule — List schedule items */
export const fetchEventSchedule = async (eventId: number): Promise<EventScheduleItem[]> => {
    const { data } = await apiClient.get<EventScheduleItem[]>(apiPath(EVENTS_BASE, `/${eventId}/schedule`));
    return data;
};

/** @internal POST /api/events/{eventId}/schedule — Create a schedule item */
export const postCreateScheduleItem = async (eventId: number, item: Partial<EventScheduleItem>): Promise<EventScheduleItem> => {
    const { data } = await apiClient.post<EventScheduleItem>(apiPath(EVENTS_BASE, `/${eventId}/schedule`), item);
    return data;
};

/** @internal PUT /api/events/{eventId}/schedule/{id} — Update a schedule item */
export const putUpdateScheduleItem = async (eventId: number, id: number, item: Partial<EventScheduleItem>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/schedule/${id}`), item);
};

/** @internal DELETE /api/events/{eventId}/schedule/{id} — Delete a schedule item */
export const deleteScheduleItem = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/schedule/${id}`));
};

// === React Query hooks ===

export const useEventScheduleQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventScheduleItem[], unknown, EventScheduleItem[], QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.schedule(eventId),
        queryFn: () => fetchEventSchedule(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useCreateScheduleItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventScheduleItem, unknown, { eventId: number; item: Partial<EventScheduleItem> }>({
        mutationFn: ({ eventId, item }) => postCreateScheduleItem(eventId, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.schedule(vars.eventId) });
        },
    });
};

export const useUpdateScheduleItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; item: Partial<EventScheduleItem> }>({
        mutationFn: ({ eventId, id, item }) => putUpdateScheduleItem(eventId, id, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.schedule(vars.eventId) });
        },
    });
};

export const useDeleteScheduleItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteScheduleItem(eventId, id),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.schedule(vars.eventId) });
        },
    });
};
