// apiEventsBouncer.ts — Bouncer fetchers + hooks
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
    EventParticipant,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal GET /api/events/{eventId}/bouncer/waiting — Get waiting participants */
export const fetchBouncerWaiting = async (eventId: number): Promise<EventParticipant[]> => {
    const { data } = await apiClient.get<EventParticipant[]>(apiPath(EVENTS_BASE, `/${eventId}/bouncer/waiting`));
    return data;
};

/** @internal POST /api/events/{eventId}/bouncer/validate/{userId} — Move to Validation */
export const postBouncerValidate = async (eventId: number, userId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/bouncer/validate/${userId}`));
};

/** @internal POST /api/events/{eventId}/bouncer/admit/{userId} — Admit participant */
export const postBouncerAdmit = async (eventId: number, userId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/bouncer/admit/${userId}`));
};

/** @internal POST /api/events/{eventId}/bouncer/reject/{userId} — Reject participant */
export const postBouncerReject = async (eventId: number, userId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/bouncer/reject/${userId}`));
};

// === React Query hooks ===

export const useBouncerWaitingQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventParticipant[], unknown, EventParticipant[], QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.bouncerWaiting(eventId),
        queryFn: () => fetchBouncerWaiting(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useBouncerValidateMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; userId: number }>({
        mutationFn: ({ eventId, userId }) => postBouncerValidate(eventId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.bouncerWaiting(vars.eventId) });
        },
    });
};

export const useBouncerAdmitMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; userId: number }>({
        mutationFn: ({ eventId, userId }) => postBouncerAdmit(eventId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.bouncerWaiting(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
        },
    });
};

export const useBouncerRejectMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; userId: number }>({
        mutationFn: ({ eventId, userId }) => postBouncerReject(eventId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.bouncerWaiting(vars.eventId) });
        },
    });
};
