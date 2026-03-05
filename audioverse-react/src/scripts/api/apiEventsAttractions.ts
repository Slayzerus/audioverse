// apiEventsAttractions.ts — Attractions CRUD
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
    EventAttraction,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal GET /api/events/{eventId}/attractions — List attractions */
export const fetchEventAttractions = async (eventId: number): Promise<EventAttraction[]> => {
    const { data } = await apiClient.get<EventAttraction[]>(apiPath(EVENTS_BASE, `/${eventId}/attractions`));
    return data;
};

/** @internal POST /api/events/{eventId}/attractions — Create an attraction */
export const postCreateAttraction = async (eventId: number, item: Partial<EventAttraction>): Promise<EventAttraction> => {
    const { data } = await apiClient.post<EventAttraction>(apiPath(EVENTS_BASE, `/${eventId}/attractions`), item);
    return data;
};

/** @internal PUT /api/events/{eventId}/attractions/{id} — Update an attraction */
export const putUpdateAttraction = async (eventId: number, id: number, item: Partial<EventAttraction>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/attractions/${id}`), item);
};

/** @internal DELETE /api/events/{eventId}/attractions/{id} — Delete an attraction */
export const deleteAttraction = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/attractions/${id}`));
};

// === React Query hooks ===

export const useEventAttractionsQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventAttraction[], unknown, EventAttraction[], QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.attractions(eventId),
        queryFn: () => fetchEventAttractions(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useCreateAttractionMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventAttraction, unknown, { eventId: number; item: Partial<EventAttraction> }>({
        mutationFn: ({ eventId, item }) => postCreateAttraction(eventId, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.attractions(vars.eventId) });
        },
    });
};

export const useUpdateAttractionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; item: Partial<EventAttraction> }>({
        mutationFn: ({ eventId, id, item }) => putUpdateAttraction(eventId, id, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.attractions(vars.eventId) });
        },
    });
};

export const useDeleteAttractionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteAttraction(eventId, id),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.attractions(vars.eventId) });
        },
    });
};
