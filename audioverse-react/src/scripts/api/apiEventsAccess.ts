// apiEventsAccess.ts — Links & access fetchers + hooks
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
    Event,
    ValidateCodeRequest,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal POST /api/events/{eventId}/generate-link — Generate shareable access link token */
export const postGenerateEventLink = async (eventId: number): Promise<string> => {
    const { data } = await apiClient.post<string>(apiPath(EVENTS_BASE, `/${eventId}/generate-link`));
    return data;
};

/** @internal GET /api/events/join/{token} — Join event via access link token (no auth) */
export const fetchJoinEvent = async (token: string): Promise<Event> => {
    const { data } = await apiClient.get<Event>(apiPath(EVENTS_BASE, `/join/${token}`));
    return data;
};

/** @internal POST /api/events/{eventId}/validate-code — Validate a party code */
export const postValidateEventCode = async (eventId: number, payload: ValidateCodeRequest): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/validate-code`), payload);
};

// === React Query hooks ===

export const useGenerateEventLinkMutation = () => {
    const qc = useQueryClient();
    return useMutation<string, unknown, number>({
        mutationFn: (eventId) => postGenerateEventLink(eventId),
        onSuccess: (_data, eventId) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.detail(eventId) });
        },
    });
};

export const useJoinEventQuery = (
    token: string,
    options?: Partial<UseQueryOptions<Event, unknown, Event, QueryKey>>
) =>
    useQuery({
        queryKey: ["events", "join", token] as const,
        queryFn: () => fetchJoinEvent(token),
        enabled: !!token,
        retry: 1,
        ...options,
    });

export const useValidateEventCodeMutation = () =>
    useMutation<void, unknown, { eventId: number; payload: ValidateCodeRequest }>({
        mutationFn: ({ eventId, payload }) => postValidateEventCode(eventId, payload),
    });
