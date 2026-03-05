// apiEventsCrud.ts — Event CRUD fetchers + hooks + poster + invites + sessions + filtered + export
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { logger } from "../../utils/logger";
const log = logger.scoped('apiEventsCrud');
import { EVENTS_BASE, EVENTS_QK, EventFilterParams } from "./apiEventsKeys";
import type {
    Event,
    EventInvite,
    KaraokeParty,
    KaraokeSession,
    PaginatedResponse,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal POST /api/events — Create a new event */
export const postCreateEvent = async (event: Partial<Event>): Promise<Event> => {
    const { data } = await apiClient.post<Event>(apiPath(EVENTS_BASE, ""), event);
    return data;
};

/** @internal GET /api/events/{id} — Get event by ID */
export const fetchEventById = async (id: number): Promise<Event> => {
    const { data } = await apiClient.get<Event>(apiPath(EVENTS_BASE, `/${id}`));
    return data;
};

/** @internal PUT /api/events/{id} — Update event */
export const putUpdateEvent = async (id: number, event: Partial<Event>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${id}`), event);
};

/** @internal DELETE /api/events/{id} — Delete event */
export const deleteEvent = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${id}`));
};
/** @internal DELETE /api/events/{id}/soft — Soft delete event */
export const softDeleteEvent = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${id}/soft`));
};

/** @internal POST /api/events/{id}/cancel — Cancel event (soft-cancel with optional reason) */
export const cancelEvent = async (id: number, reason?: string): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${id}/cancel`), null, {
        params: reason ? { reason } : undefined,
    });
};

/** @internal POST /api/events/{id}/restore — Restore event (admin) */
export const restoreEvent = async (id: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${id}/restore`));
};

/**
 * @deprecated GET /api/events/{eventId}/party removed — Event IS the party now.
 * Use fetchEventById instead.
 */
/** @internal */
export const fetchEventParty = async (eventId: number): Promise<KaraokeParty> => {
    // Event IS the party now, just return the event itself
    const { data } = await apiClient.get<KaraokeParty>(apiPath(EVENTS_BASE, `/${eventId}`));
    return data;
};

/** @internal GET /api/karaoke/events/{id}/poster-url — Get presigned poster URL */
export const fetchEventPosterUrl = async (eventId: number, validSeconds = 300): Promise<string> => {
    const { data } = await apiClient.get<string>(apiPath('/api/karaoke/events', `/${eventId}/poster-url`), {
        params: { validSeconds },
    });
    return data;
};

/** @internal GET /api/events/{eventId}/poster-public-url — Get public poster URL */
export const fetchEventPosterPublicUrl = async (eventId: number): Promise<string> => {
    const { data } = await apiClient.get<string>(apiPath(EVENTS_BASE, `/${eventId}/poster-public-url`));
    return data;
};

/** @internal POST /api/events/{eventId}/invites — Create event invite */
export const postCreateEventInvite = async (eventId: number, invite: Partial<EventInvite>): Promise<EventInvite> => {
    const { data } = await apiClient.post<EventInvite>(apiPath(EVENTS_BASE, `/${eventId}/invites`), invite);
    return data;
};

/** @internal POST /api/events/{eventId}/sessions — Create session for an event */
export const postCreateEventSession = async (eventId: number, session: Partial<KaraokeSession>): Promise<KaraokeSession> => {
    const { data } = await apiClient.post<KaraokeSession>(apiPath(EVENTS_BASE, `/${eventId}/sessions`), session);
    return data;
};

// ── Filtering & Pagination ────────────────────────────────────

/** @internal GET /api/events?page=&pageSize=&type=&... — Filtered/paginated events list */
export const fetchFilteredEvents = async (
    params: EventFilterParams,
): Promise<PaginatedResponse<Event>> => {
    const { data } = await apiClient.get<PaginatedResponse<Event>>(
        apiPath(EVENTS_BASE, ""),
        { params },
    );
    return data;
};

// ── PDF Export ─────────────────────────────────────────────────

/** @internal GET /api/events/{eventId}/export/pdf — Download event summary as PDF */
export const fetchEventPdfExport = async (eventId: number): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>(
        apiPath(EVENTS_BASE, `/${eventId}/export/pdf`),
        { responseType: "blob" },
    );
    return data;
};

/** @internal * @deprecated GET /api/events/{eventId}/export/csv not in swagger. */
export const fetchEventCsvExport = async (_eventId: number): Promise<Blob> => {
    log.warn('fetchEventCsvExport: /export/csv endpoint not in swagger.');
    return new Blob();
};

// === React Query hooks ===

export const useEventQuery = (
    id: number,
    options?: Partial<UseQueryOptions<Event, unknown, Event, QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.detail(id),
        queryFn: () => fetchEventById(id),
        enabled: Number.isFinite(id),
        retry: 1,
        ...options,
    });

export const useEventPartyQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<KaraokeParty, unknown, KaraokeParty, QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.party(eventId),
        queryFn: () => fetchEventParty(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useCreateEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<Event, unknown, Partial<Event>>({
        mutationFn: (event) => postCreateEvent(event),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.all });
        },
    });
};

export const useUpdateEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; event: Partial<Event> }>({
        mutationFn: ({ id, event }) => putUpdateEvent(id, event),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.detail(vars.id) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.all });
        },
    });
};

export const useDeleteEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteEvent(id),
        onSuccess: (_data, id) => {
            qc.removeQueries({ queryKey: EVENTS_QK.detail(id) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.all });
        },
    });
};

export const useSoftDeleteEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => softDeleteEvent(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.detail(id) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.all });
        },
    });
};

export const useCancelEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; reason?: string }>({
        mutationFn: ({ id, reason }) => cancelEvent(id, reason),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.detail(vars.id) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.all });
        },
    });
};

export const useRestoreEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => restoreEvent(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.detail(id) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.all });
        },
    });
};

export const useCreateEventInviteMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventInvite, unknown, { eventId: number; invite: Partial<EventInvite> }>({
        mutationFn: ({ eventId, invite }) => postCreateEventInvite(eventId, invite),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.detail(vars.eventId) });
        },
    });
};

export const useCreateEventSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSession, unknown, { eventId: number; session: Partial<KaraokeSession> }>({
        mutationFn: ({ eventId, session }) => postCreateEventSession(eventId, session),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
        },
    });
};

// ── Filtered Events hook ──────────────────────────────────────

export const useFilteredEventsQuery = (
    params: EventFilterParams,
    options?: Partial<UseQueryOptions<PaginatedResponse<Event>, unknown, PaginatedResponse<Event>, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENTS_QK.filtered(params),
        queryFn: () => fetchFilteredEvents(params),
        retry: 1,
        ...options,
    });

// ── PDF/CSV Export hooks ──────────────────────────────────────

export const useEventPdfExportMutation = () =>
    useMutation<Blob, unknown, number>({
        mutationFn: (eventId) => fetchEventPdfExport(eventId),
    });

export const useEventCsvExportMutation = () =>
    useMutation<Blob, unknown, number>({
        mutationFn: (eventId) => fetchEventCsvExport(eventId),
    });
