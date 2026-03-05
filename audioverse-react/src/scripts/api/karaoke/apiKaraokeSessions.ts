// apiKaraokeSessions.ts — Party / Session / Invite / Participant management
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "../audioverseApiClient";
import { KARAOKE_BASE, KARAOKE_QK, DynamicFilterRequest, PagedResult } from "./apiKaraokeBase";
import { logger } from "../../../utils/logger";
const log = logger.scoped('apiKaraokeSessions');
import type {
    KaraokeParty,
    KaraokePartyStatus,
    CreatePartyRequest,
    UpdatePartyPlayerStatusRequest,
    JoinRequest,
    PartyPlayerStatus,
    KaraokeSession,
} from "../../../models/modelsKaraoke";

// === Low-level API (fetchers) ===
/**
 * Fetch all events via the Events API.
 * GET /api/events
 */
export const fetchParties = async (): Promise<KaraokeParty[]> => {
    const { data } = await apiClient.get<KaraokeParty[]>(
        apiPath("/api/events", "")
    );
    // The Events endpoint returns a paged result; extract items if needed
    const wrapped = data as unknown as { items?: KaraokeParty[]; Items?: KaraokeParty[] };
    const items = wrapped?.items ?? wrapped?.Items ?? data;
    return Array.isArray(items) ? items : [];
};

/**
 * Fetch filtered events (formerly karaoke parties) via the generic filtered endpoint.
 * POST /api/karaoke/filtered/Event
 */
export const fetchFilteredParties = async (request: DynamicFilterRequest): Promise<PagedResult<KaraokeParty>> => {
    const { data } = await apiClient.post<PagedResult<KaraokeParty>>(apiPath(KARAOKE_BASE, `/filtered/Event`), request);
    if (!data) return { Items: [], TotalCount: 0 };
    const normalizedItems = (data as unknown as { Items?: KaraokeParty[]; items?: KaraokeParty[] }).Items
        ?? (data as unknown as { Items?: KaraokeParty[]; items?: KaraokeParty[] }).items
        ?? [];
    const normalizedTotal = (data as unknown as { TotalCount?: number; totalCount?: number }).TotalCount
        ?? (data as unknown as { TotalCount?: number; totalCount?: number }).totalCount
        ?? normalizedItems.length;
    return {
        ...data,
        Items: normalizedItems,
        TotalCount: normalizedTotal,
    };
};

export const useFilteredPartiesQuery = (request: DynamicFilterRequest, options?: Partial<UseQueryOptions<PagedResult<KaraokeParty>, unknown, PagedResult<KaraokeParty>, QueryKey>>) =>
    useQuery({ queryKey: KARAOKE_QK.partiesFiltered(request), queryFn: () => fetchFilteredParties(request), enabled: !!request, staleTime: 30_000, ...options });

export const fetchPartyById = async (id: number): Promise<KaraokeParty> => {
    const { data } = await apiClient.get<KaraokeParty>(
        apiPath(KARAOKE_BASE, `/get-event/${id}`)
    );
    // Backend returns PascalCase (Title, Description, …); normalize to match the Event interface
    const raw = data as unknown as Record<string, unknown>;
    if (!raw.name && !raw.title && raw.Title) raw.title = raw.Title;
    if (!raw.name && raw.title) raw.name = raw.title;
    if (!raw.description && raw.Description) raw.description = raw.Description;
    return data;
};

/**
 * Get party status. The old /party/{id}/status was removed.
 * Now fetches the full event and extracts status from it.
 * GET /api/karaoke/get-event/{id}
 */
export const fetchPartyStatus = async (
    id: number
): Promise<KaraokePartyStatus> => {
    const { data } = await apiClient.get<KaraokeParty>(
        apiPath(KARAOKE_BASE, `/get-event/${id}`)
    );
    // Extract status fields from the full event
    return (data as unknown as { status?: KaraokePartyStatus }).status ?? data as unknown as KaraokePartyStatus;
};

/**
 * @deprecated The `/create-party` endpoint was removed. Create parties via Events API:
 * `POST /api/events` with EventType.Karaoke. This wrapper now delegates to the events endpoint.
 */
export const postCreateParty = async (
    party: CreatePartyRequest | FormData
): Promise<KaraokeParty> => {
    // New flow: create an Event of type Karaoke, which creates the party on the backend
    const isForm = party instanceof FormData;
    const url = isForm ? apiPath("/api/events", "/with-poster") : apiPath("/api/events", "");
    const { data } = await apiClient.post<KaraokeParty>(
        url,
        party as CreatePartyRequest | FormData,
        isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
};

/**
 * Update party via Events API.
 * PUT /api/events/{id} (JSON) or PUT /api/events/{id}/with-poster (multipart)
 */
export const putUpdateParty = async (id: number, request: CreatePartyRequest | FormData): Promise<void> => {
    const isForm = request instanceof FormData;
    const url = isForm ? apiPath("/api/events", `/${id}/with-poster`) : apiPath("/api/events", `/${id}`);
    await apiClient.put(url, request, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined);
};

/**
 * Delete party via Events API.
 * DELETE /api/events/{id}
 */
export const deleteParty = async (partyId: number): Promise<void> => {
    await apiClient.delete(apiPath("/api/events", `/${partyId}`));
};

/**
 * Remove a participant from an event (replaces old party-based player deletion).
 * DELETE /api/karaoke/events/{eventId}/participants/{playerId}
 */
export const deleteParticipantFromEvent = async (eventId: number, playerId: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/events/${eventId}/participants/${playerId}`));
};

/**
 * @deprecated Use `deleteParticipantFromEvent(eventId, playerId)` instead.
 * This wrapper attempts the new event-based endpoint.
 */
export const deleteAssignPlayerFromParty = async (partyId: number, playerId: number): Promise<void> => {
    // The old /parties/{partyId}/players/{playerId} endpoint was removed.
    // Attempt the new event-based route; callers should migrate to deleteParticipantFromEvent.
    await apiClient.delete(apiPath(KARAOKE_BASE, `/events/${partyId}/participants/${playerId}`));
};

/**
 * PATCH /api/karaoke/events/{eventId}/participants/{playerId}/status
 * Update participant status (e.g. Waiting → Inside).
 */
export const patchParticipantStatus = async (
    eventId: number,
    playerId: number,
    request: UpdatePartyPlayerStatusRequest
): Promise<void> => {
    await apiClient.patch(apiPath(KARAOKE_BASE, `/events/${eventId}/participants/${playerId}/status`), request);
};

/** POST /api/karaoke/events/{id}/join — Join a party (verifying code if required) */
export const postJoinParty = async (partyId: number, request?: JoinRequest): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath(KARAOKE_BASE, `/events/${partyId}/join`), request ?? {});
    return data;
};

/**
 * Create a karaoke session. The old /add-session endpoint still exists,
 * but the new Events API also supports POST /api/events/{eventId}/sessions.
 * Keep using /add-session as it's still in swagger.
 */
export const postAddSession = async (
    session: Partial<KaraokeSession>
): Promise<{ sessionId: number }> => {
    const { data } = await apiClient.post<{ sessionId: number }>(
        apiPath(KARAOKE_BASE, "/add-session"),
        session
    );
    return data;
};

// === Invites (uses /api/invites/{...} endpoints) ===
export interface EventInviteDto {
    id: number;
    eventId?: number | null;
    fromUserId?: number | null;
    toUserId?: number | null;
    toEmail?: string | null;
    message?: string | null;
    status?: number; // EventInviteStatus: 0=Pending, 1=Accepted, 2=Rejected, 3=Cancelled
    createdAt?: string;
    respondedAt?: string | null;
}

/** @deprecated Use EventInviteDto instead */
export type PartyInviteDto = EventInviteDto;

export const fetchPartyInvites = async (partyId: number): Promise<EventInviteDto[]> => {
    try {
        const { data } = await apiClient.get<EventInviteDto[]>(apiPath('/api/events', `/${partyId}/invites`));
        return Array.isArray(data) ? data : [];
    } catch {
        // Backend may not expose a GET endpoint for invites — return empty gracefully
        return [];
    }
};

/**
 * Send an invite for an event.
 * POST /api/invites/events/{eventId}/send
 */
export const postSendPartyInvite = async (partyId: number, body: { ToUserId?: number; ToEmail?: string; Message?: string }) => {
    const { data } = await apiClient.post(apiPath('/api/invites', `/events/${partyId}/send`), body);
    return data;
};

/** POST /api/invites/{inviteId}/respond?accept={bool} — Accept or reject an invite */
export const postRespondInvite = async (inviteId: number, accept: boolean) => {
    const { data } = await apiClient.post(apiPath('/api/invites', `/${inviteId}/respond`), null, {
        params: { accept },
    });
    return data;
};

/** POST /api/invites/{inviteId}/cancel — Cancel a pending invite */
export const postCancelInvite = async (inviteId: number) => {
    const { data } = await apiClient.post(apiPath('/api/invites', `/${inviteId}/cancel`));
    return data;
};

/** GET /api/karaoke/events/{id}/poster-url — presigned poster URL */
export const fetchPartyPosterUrl = async (partyId: number, validSeconds = 300): Promise<string> => {
    const { data } = await apiClient.get<string>(apiPath(KARAOKE_BASE, `/events/${partyId}/poster-url`), {
        params: { validSeconds },
    });
    return data;
};

/** GET /api/karaoke/events/{id}/poster-public-url */
export const fetchPartyPosterPublicUrl = async (partyId: number): Promise<string> => {
    const { data } = await apiClient.get<string>(apiPath(KARAOKE_BASE, `/events/${partyId}/poster-public-url`));
    return data;
};

/**
 * Upload/delete event poster.
 * POST /api/karaoke/event/{id}/poster (upload) exists in swagger.
 * Deletion not available as separate endpoint — use event update instead.
 * @deprecated Poster deletion endpoint removed; retained as no-op.
 */
export const deletePartyPoster = async (partyId: number): Promise<void> => {
    void partyId;
    log.warn('deletePartyPoster: endpoint removed — use event update to clear poster');
};

// === React Query: Queries ===
export const usePartiesQuery = (
    options?: Partial<UseQueryOptions<KaraokeParty[], unknown, KaraokeParty[], QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.parties,
        queryFn: fetchParties,
        staleTime: 60_000,
        ...options,
    });

export const usePartyQuery = (
    id: number,
    options?: Partial<UseQueryOptions<KaraokeParty, unknown, KaraokeParty, QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.party(id),
        queryFn: () => fetchPartyById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

export const usePartyStatusQuery = (
    id: number,
    options?: Partial<UseQueryOptions<KaraokePartyStatus, unknown, KaraokePartyStatus, QueryKey>>
) =>
    useQuery({
        queryKey: KARAOKE_QK.partyStatus(id),
        queryFn: () => fetchPartyStatus(id),
        enabled: Number.isFinite(id),
        staleTime: 30_000,
        ...options,
    });

// === React Query: Mutations ===
export const useCreatePartyMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeParty, unknown, CreatePartyRequest | FormData>({
        mutationFn: (party) => postCreateParty(party),
        onSuccess: (created) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if (created?.id != null) {
                qc.setQueryData(KARAOKE_QK.party(created.id), created);
            }
        },
    });
};

export const useDeleteAssignPlayerFromPartyMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { partyId: number; playerId: number }>(
        { mutationFn: ({ partyId, playerId }) => deleteAssignPlayerFromParty(partyId, playerId),
          onSuccess: (_data, vars) => {
              if (vars?.partyId) {
                  qc.invalidateQueries({ queryKey: KARAOKE_QK.party(vars.partyId) });
                  qc.invalidateQueries({ queryKey: KARAOKE_QK.partyStatus(vars.partyId) });
              }
              qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
          }
        }
    );
};

export const useDeletePartyMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (partyId) => deleteParty(partyId),
        onSuccess: (_data, partyId) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if (partyId != null) {
                qc.removeQueries({ queryKey: KARAOKE_QK.party(partyId) });
                qc.removeQueries({ queryKey: KARAOKE_QK.partyStatus(partyId) });
            }
        },
    });
};

export const useAddSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<{ sessionId: number }, unknown, Partial<KaraokeSession>>({
        mutationFn: (session) => postAddSession(session),
        onSuccess: (_data, vars) => {
            if (vars?.partyId) qc.invalidateQueries({ queryKey: KARAOKE_QK.party(vars.partyId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
        }
    });
};

export const useJoinPartyMutation = () =>
    useMutation<unknown, unknown, { partyId: number; request?: JoinRequest }>({
        mutationFn: ({ partyId, request }) => postJoinParty(partyId, request),
    });

export const useDeleteParticipantMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; playerId: number }>({
        mutationFn: ({ eventId, playerId }) => deleteParticipantFromEvent(eventId, playerId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
        },
    });
};

export const usePatchParticipantStatusMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; playerId: number; status: PartyPlayerStatus }>({
        mutationFn: ({ eventId, playerId, status }) => patchParticipantStatus(eventId, playerId, { status }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
        },
    });
};
