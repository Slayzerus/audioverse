// apiEventsGamePicks.ts — Game picks fetchers + hooks
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { EVENTS_BASE, EVENTS_QK } from "./apiEventsKeys";
import type {
    EventSessionGamePick,
    EventSessionGameVote,
    GamePickRankedResult,
} from "../../models/modelsKaraoke";

// === Low-level fetchers ===

/** @internal POST /api/events/{eventId}/game-picks — Add a game pick */
export const postGamePick = async (
    eventId: number,
    body: { boardGameId?: number; videoGameId?: number; gameName: string },
): Promise<EventSessionGamePick> => {
    const { data } = await apiClient.post<EventSessionGamePick>(apiPath(EVENTS_BASE, `/${eventId}/game-picks`), body);
    return data;
};

/** @internal GET /api/events/{eventId}/game-picks — List game picks */
export const fetchGamePicks = async (eventId: number): Promise<EventSessionGamePick[]> => {
    const { data } = await apiClient.get<EventSessionGamePick[]>(apiPath(EVENTS_BASE, `/${eventId}/game-picks`));
    return data;
};

/** @internal POST /api/events/{eventId}/game-picks/import — Import picks from a collection */
export const postImportGamePicks = async (eventId: number, body: { sourceCollectionId: number }): Promise<EventSessionGamePick[]> => {
    const { data } = await apiClient.post<EventSessionGamePick[]>(apiPath(EVENTS_BASE, `/${eventId}/game-picks/import`), body);
    return data;
};

/** @internal GET /api/events/{eventId}/game-picks/ranked — Get ranked game pick results */
export const fetchGamePicksRanked = async (eventId: number): Promise<GamePickRankedResult[]> => {
    const { data } = await apiClient.get<GamePickRankedResult[]>(apiPath(EVENTS_BASE, `/${eventId}/game-picks/ranked`));
    return data;
};

/** @internal DELETE /api/events/game-picks/{pickId} — Delete a game pick */
export const deleteGamePick = async (pickId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/game-picks/${pickId}`));
};

/** @internal POST /api/events/game-picks/{pickId}/vote — Vote on a game pick */
export const postGamePickVote = async (pickId: number, body: { priority: number }): Promise<EventSessionGameVote> => {
    const { data } = await apiClient.post<EventSessionGameVote>(apiPath(EVENTS_BASE, `/game-picks/${pickId}/vote`), body);
    return data;
};

/** @internal DELETE /api/events/game-picks/{pickId}/vote/{userId} — Remove vote from a game pick */
export const deleteGamePickVote = async (pickId: number, userId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/game-picks/${pickId}/vote/${userId}`));
};

// === React Query hooks ===

export const useGamePicksQuery = (eventId: number, options?: Partial<UseQueryOptions<EventSessionGamePick[]>>) =>
    useQuery({ queryKey: EVENTS_QK.gamePicks(eventId), queryFn: () => fetchGamePicks(eventId), enabled: eventId > 0, retry: 1, ...options });

export const useGamePicksRankedQuery = (eventId: number, options?: Partial<UseQueryOptions<GamePickRankedResult[]>>) =>
    useQuery({ queryKey: EVENTS_QK.gamePicksRanked(eventId), queryFn: () => fetchGamePicksRanked(eventId), enabled: eventId > 0, retry: 1, ...options });

export const useCreateGamePickMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSessionGamePick, unknown, { eventId: number; body: { boardGameId?: number; videoGameId?: number; gameName: string } }>({
        mutationFn: ({ eventId, body }) => postGamePick(eventId, body),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicks(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicksRanked(vars.eventId) });
        },
    });
};

export const useImportGamePicksMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSessionGamePick[], unknown, { eventId: number; sourceCollectionId: number }>({
        mutationFn: ({ eventId, sourceCollectionId }) => postImportGamePicks(eventId, { sourceCollectionId }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicks(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicksRanked(vars.eventId) });
        },
    });
};

export const useDeleteGamePickMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pickId: number }>({
        mutationFn: ({ pickId }) => deleteGamePick(pickId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicks(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicksRanked(vars.eventId) });
        },
    });
};

export const useGamePickVoteMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSessionGameVote, unknown, { eventId: number; pickId: number; priority: number }>({
        mutationFn: ({ pickId, priority }) => postGamePickVote(pickId, { priority }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicks(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicksRanked(vars.eventId) });
        },
    });
};

export const useDeleteGamePickVoteMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; pickId: number; userId: number }>({
        mutationFn: ({ pickId, userId }) => deleteGamePickVote(pickId, userId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicks(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENTS_QK.gamePicksRanked(vars.eventId) });
        },
    });
};
