// apiEventsSongPicks.ts — Song picks fetchers + hooks
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { EVENTS_BASE, EVENTS_QK } from "./apiEventsKeys";
import type {
    EventSessionSongPick,
    EventSessionSongSignup,
    SongPickRankedResult,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal POST /api/events/{eventId}/sessions/{sessionId}/song-picks — Add a song pick */
export const postSongPick = async (
    eventId: number,
    sessionId: number,
    body: { songId?: number; songTitle: string },
): Promise<EventSessionSongPick> => {
    const { data } = await apiClient.post<EventSessionSongPick>(apiPath(EVENTS_BASE, `/${eventId}/sessions/${sessionId}/song-picks`), body);
    return data;
};

/** @internal GET /api/events/{eventId}/sessions/{sessionId}/song-picks — List song picks for a session */
export const fetchSongPicks = async (eventId: number, sessionId: number): Promise<EventSessionSongPick[]> => {
    const { data } = await apiClient.get<EventSessionSongPick[]>(apiPath(EVENTS_BASE, `/${eventId}/sessions/${sessionId}/song-picks`));
    return data;
};

/** @internal POST /api/events/{eventId}/sessions/{sessionId}/song-picks/import — Import from playlist */
export const postImportSongPicks = async (eventId: number, sessionId: number, body: { sourcePlaylistId: number }): Promise<EventSessionSongPick[]> => {
    const { data } = await apiClient.post<EventSessionSongPick[]>(apiPath(EVENTS_BASE, `/${eventId}/sessions/${sessionId}/song-picks/import`), body);
    return data;
};

/** @internal GET /api/events/{eventId}/sessions/{sessionId}/song-picks/ranked — Get ranked song pick results */
export const fetchSongPicksRanked = async (eventId: number, sessionId: number): Promise<SongPickRankedResult[]> => {
    const { data } = await apiClient.get<SongPickRankedResult[]>(apiPath(EVENTS_BASE, `/${eventId}/sessions/${sessionId}/song-picks/ranked`));
    return data;
};

/** @internal DELETE /api/events/song-picks/{pickId} — Delete a song pick */
export const deleteSongPick = async (pickId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/song-picks/${pickId}`));
};

/** @internal POST /api/events/song-picks/{pickId}/signup — Sign up for a song pick */
export const postSongPickSignup = async (pickId: number, body: { preferredSlot?: number }): Promise<EventSessionSongSignup> => {
    const { data } = await apiClient.post<EventSessionSongSignup>(apiPath(EVENTS_BASE, `/song-picks/${pickId}/signup`), body);
    return data;
};

/** @internal DELETE /api/events/song-picks/{pickId}/signup/{userId} — Remove signup from a song pick */
export const deleteSongPickSignup = async (pickId: number, userId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/song-picks/${pickId}/signup/${userId}`));
};

// === React Query hooks ===

export const useSongPicksQuery = (eventId: number, sessionId: number, options?: Partial<UseQueryOptions<EventSessionSongPick[]>>) =>
    useQuery({ queryKey: EVENTS_QK.songPicks(eventId, sessionId), queryFn: () => fetchSongPicks(eventId, sessionId), enabled: eventId > 0 && sessionId > 0, retry: 1, ...options });

export const useSongPicksRankedQuery = (eventId: number, sessionId: number, options?: Partial<UseQueryOptions<SongPickRankedResult[]>>) =>
    useQuery({ queryKey: EVENTS_QK.songPicksRanked(eventId, sessionId), queryFn: () => fetchSongPicksRanked(eventId, sessionId), enabled: eventId > 0 && sessionId > 0, retry: 1, ...options });

export const useCreateSongPickMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSessionSongPick, unknown, { eventId: number; sessionId: number; body: { songId?: number; songTitle: string } }>({
        mutationFn: ({ eventId, sessionId, body }) => postSongPick(eventId, sessionId, body),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicks(vars.eventId, vars.sessionId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicksRanked(vars.eventId, vars.sessionId) });
        },
    });
};

export const useImportSongPicksMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSessionSongPick[], unknown, { eventId: number; sessionId: number; sourcePlaylistId: number }>({
        mutationFn: ({ eventId, sessionId, sourcePlaylistId }) => postImportSongPicks(eventId, sessionId, { sourcePlaylistId }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicks(vars.eventId, vars.sessionId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicksRanked(vars.eventId, vars.sessionId) });
        },
    });
};

export const useDeleteSongPickMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; sessionId: number; pickId: number }>({
        mutationFn: ({ pickId }) => deleteSongPick(pickId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicks(vars.eventId, vars.sessionId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicksRanked(vars.eventId, vars.sessionId) });
        },
    });
};

export const useSongPickSignupMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSessionSongSignup, unknown, { eventId: number; sessionId: number; pickId: number; preferredSlot?: number }>({
        mutationFn: ({ pickId, preferredSlot }) => postSongPickSignup(pickId, { preferredSlot }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicks(vars.eventId, vars.sessionId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicksRanked(vars.eventId, vars.sessionId) });
        },
    });
};

export const useDeleteSongPickSignupMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; sessionId: number; pickId: number; userId: number }>({
        mutationFn: ({ pickId, userId }) => deleteSongPickSignup(pickId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicks(vars.eventId, vars.sessionId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.songPicksRanked(vars.eventId, vars.sessionId) });
        },
    });
};
