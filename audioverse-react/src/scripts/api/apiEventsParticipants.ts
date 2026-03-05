// apiEventsParticipants.ts — Participants, organizers, RSVP, arrive, cancel
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { EVENTS_BASE, EVENTS_QK, OrganizerDto, RsvpRequest, RsvpResponse } from "./apiEventsKeys";
import type {
    EventParticipant,
} from "../../models/modelsKaraoke";
import { dkLog } from '../../constants/debugKaraoke';

// === Low-level fetchers ===

/** @internal POST /api/events/{eventId}/participants — Add participant to an event */
export const postAddParticipant = async (eventId: number, participant: Partial<EventParticipant>): Promise<EventParticipant> => {
    const { data } = await apiClient.post<EventParticipant>(apiPath(EVENTS_BASE, `/${eventId}/participants`), participant);
    return data;
};

// ── Participants & Organizers ──────────────────────────────────

/** @internal GET /api/events/{eventId}/participants — Get event participants */
export const fetchEventParticipants = async (eventId: number): Promise<EventParticipant[]> => {
    const { data } = await apiClient.get<EventParticipant[]>(apiPath(EVENTS_BASE, `/${eventId}/participants`));
    dkLog('FETCH', `fetchEventParticipants eventId=${eventId} — raw count=${Array.isArray(data) ? data.length : 0}`, data);
    // Normalize backend UserProfile fields → frontend shape.
    // Backend sends UserProfile: `fullName` + `userName` (IdentityUser) + `id`.
    // When User.Contact is loaded, prefer Contact.DisplayName for the participant name.
    // Frontend expects `name` + `displayName` on ep.user.
    // NOTE: ep.user is a UserProfile, NOT a UserProfilePlayer — do NOT use player data here.
    return (Array.isArray(data) ? data : []).map(ep => {
        if (ep.user) {
            const raw = ep.user as unknown as Record<string, unknown>;
            // Contact display name (loaded via .ThenInclude(u => u.Contact))
            const contact = raw.contact as Record<string, unknown> | null | undefined;
            const contactDisplayName = typeof contact?.displayName === 'string' ? contact.displayName.trim() : null;
            // Use trimmed fullName — empty string should NOT count as a value
            const fullName = typeof raw.fullName === 'string' ? raw.fullName.trim() : null;
            const userName = typeof raw.userName === 'string' ? raw.userName.trim() : null;
            // Priority: Contact.DisplayName → UserProfile.FullName → UserProfile.UserName
            const bestName = contactDisplayName || fullName || userName || null;
            dkLog('NORMALIZE', `userId=${raw.id} → contact="${contactDisplayName}", fullName="${fullName}", userName="${userName}" → bestName="${bestName}"`);
            if (!raw.name) {
                raw.name = bestName;
            }
            if (!raw.displayName || !(raw.displayName as string).trim()) {
                raw.displayName = bestName;
            }
        }
        return ep;
    });
};

/** @internal GET /api/events/organizers — Get distinct event organizers */
export const fetchOrganizers = async (): Promise<OrganizerDto[]> => {
    const { data } = await apiClient.get<OrganizerDto[]>(apiPath(EVENTS_BASE, "/organizers"));
    return data;
};

// ── Participant management ────────────────────────────────────

/**
 * Remove participant from an event.
 * Uses POST /api/events/{eventId}/cancel-participation?userId={userId}
 */
export const deleteParticipant = async (eventId: number, userId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/cancel-participation`), null, {
        params: { userId },
    });
};

// ── RSVP & Arrival ────────────────────────────────────────────

/** @internal POST /api/events/{eventId}/rsvp — Self-service sign-up for an event */
export const postEventRsvp = async (eventId: number, req: RsvpRequest): Promise<RsvpResponse> => {
    const { data } = await apiClient.post<RsvpResponse>(apiPath(EVENTS_BASE, `/${eventId}/rsvp`), req);
    return data;
};

/** @internal POST /api/events/{eventId}/arrive — Announce arrival (Registered → Waiting) */
export const postEventArrive = async (eventId: number, req: RsvpRequest): Promise<RsvpResponse> => {
    const { data } = await apiClient.post<RsvpResponse>(apiPath(EVENTS_BASE, `/${eventId}/arrive`), req);
    return data;
};

/** @internal POST /api/events/{eventId}/cancel-participation — Cancel participation */
export const postCancelParticipation = async (eventId: number, userId?: number): Promise<void> => {
    await apiClient.post(apiPath(EVENTS_BASE, `/${eventId}/cancel-participation`), null, {
        params: userId != null ? { userId } : undefined,
    });
};

// === React Query hooks ===

export const useAddParticipantMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventParticipant, unknown, { eventId: number; participant: Partial<EventParticipant> }>({
        mutationFn: ({ eventId, participant }) => postAddParticipant(eventId, participant),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
            // Also invalidate the karaoke party status query so participants list refreshes
            qc.invalidateQueries({ queryKey: ["karaoke", "party", vars.eventId, "status"] });
            qc.invalidateQueries({ queryKey: ["karaoke", "party", vars.eventId] });
        },
    });
};

// ── Participant hooks ─────────────────────────────────────────

export const useDeleteParticipantMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; userId: number }>({
        mutationFn: ({ eventId, userId }) => deleteParticipant(eventId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.participants(vars.eventId) });
        },
    });
};

// ── RSVP / Arrival / Cancel hooks ────────────────────────────

export const useRsvpMutation = () => {
    const qc = useQueryClient();
    return useMutation<RsvpResponse, unknown, { eventId: number; userId: number }>({
        mutationFn: ({ eventId, userId }) => postEventRsvp(eventId, { userId }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.participants(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
        },
    });
};

export const useArriveMutation = () => {
    const qc = useQueryClient();
    return useMutation<RsvpResponse, unknown, { eventId: number; userId: number }>({
        mutationFn: ({ eventId, userId }) => postEventArrive(eventId, { userId }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.participants(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.bouncerWaiting(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
        },
    });
};

export const useCancelParticipationMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; userId?: number }>({
        mutationFn: ({ eventId, userId }) => postCancelParticipation(eventId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.participants(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.party(vars.eventId) });
        },
    });
};

// ── Participants & Organizers hooks ───────────────────────────

export const useEventParticipantsQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventParticipant[], unknown, EventParticipant[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENTS_QK.participants(eventId),
        queryFn: () => fetchEventParticipants(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useOrganizersQuery = (
    options?: Partial<UseQueryOptions<OrganizerDto[], unknown, OrganizerDto[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENTS_QK.organizers,
        queryFn: fetchOrganizers,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
