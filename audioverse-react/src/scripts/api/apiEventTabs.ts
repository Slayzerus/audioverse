// apiEventTabs.ts — CRUD for EventTab (tab visibility per event)
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { EVENTS_BASE, EVENTS_QK } from "./apiEventsKeys";
import type { EventTab } from "../../models/karaoke/modelsEvent";

// ── Fetchers ───────────────────────────────────────────────────

/** GET /api/events/{eventId}/tabs */
export const fetchEventTabs = async (eventId: number): Promise<EventTab[]> => {
    const { data } = await apiClient.get<EventTab[]>(apiPath(EVENTS_BASE, `/${eventId}/tabs`));
    return Array.isArray(data) ? data : [];
};

/** POST /api/events/{eventId}/tabs */
export const postEventTab = async (eventId: number, tab: Partial<EventTab>): Promise<{ id: number }> => {
    const { data } = await apiClient.post<{ id: number }>(apiPath(EVENTS_BASE, `/${eventId}/tabs`), tab);
    return data;
};

/** PUT /api/events/{eventId}/tabs/{id} */
export const putEventTab = async (eventId: number, id: number, tab: Partial<EventTab>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/tabs/${id}`), { ...tab, id, eventId });
};

/** DELETE /api/events/{eventId}/tabs/{id} */
export const deleteEventTab = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/tabs/${id}`));
};

// ── React Query hooks ──────────────────────────────────────────

/** Fetch tabs for an event. */
export const useEventTabsQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventTab[], unknown, EventTab[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENTS_QK.tabs(eventId),
        queryFn: () => fetchEventTabs(eventId),
        enabled: eventId > 0,
        staleTime: 60_000,
        ...options,
    });

/** Save (upsert) a single tab override. */
export const useUpsertEventTabMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (tab: Partial<EventTab> & { key: string }) => {
            if (tab.id && tab.id > 0) {
                await putEventTab(eventId, tab.id, tab);
            } else {
                await postEventTab(eventId, tab);
            }
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.tabs(eventId) });
            // Also refresh the party query so party.tabs stays current
            qc.invalidateQueries({ queryKey: ["karaoke", "party", eventId] });
        },
    });
};

/** Delete a tab override (restores default visibility). */
export const useDeleteEventTabMutation = (eventId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (tabId: number) => {
            await deleteEventTab(eventId, tabId);
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.tabs(eventId) });
            qc.invalidateQueries({ queryKey: ["karaoke", "party", eventId] });
        },
    });
};
