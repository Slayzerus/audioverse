// apiEventsGames.ts — Board games + Video games CRUD
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
    EventBoardGame,
    EventVideoGame,
} from "../../models/modelsKaraoke";

// ── Event Board Games ─────────────────────────────────────────

/** @internal GET /api/events/{eventId}/board-games — List board games assigned to event */
export const fetchEventBoardGames = async (eventId: number): Promise<EventBoardGame[]> => {
    const { data } = await apiClient.get<EventBoardGame[]>(apiPath(EVENTS_BASE, `/${eventId}/board-games`));
    return data;
};

/** @internal POST /api/events/{eventId}/board-games — Assign a board game to event */
export const postCreateEventBoardGame = async (eventId: number, item: Partial<EventBoardGame>): Promise<EventBoardGame> => {
    const { data } = await apiClient.post<EventBoardGame>(apiPath(EVENTS_BASE, `/${eventId}/board-games`), item);
    return data;
};

/** @internal PUT /api/events/{eventId}/board-games/{id} — Update event board game */
export const putUpdateEventBoardGame = async (eventId: number, id: number, item: Partial<EventBoardGame>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/board-games/${id}`), item);
};

/** @internal DELETE /api/events/{eventId}/board-games/{id} — Remove board game from event */
export const deleteEventBoardGame = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/board-games/${id}`));
};

// ── Event Video Games ─────────────────────────────────────────

/** @internal GET /api/events/{eventId}/video-games — List video games assigned to event */
export const fetchEventVideoGames = async (eventId: number): Promise<EventVideoGame[]> => {
    const { data } = await apiClient.get<EventVideoGame[]>(apiPath(EVENTS_BASE, `/${eventId}/video-games`));
    return data;
};

/** @internal POST /api/events/{eventId}/video-games — Assign a video game to event */
export const postCreateEventVideoGame = async (eventId: number, item: Partial<EventVideoGame>): Promise<EventVideoGame> => {
    const { data } = await apiClient.post<EventVideoGame>(apiPath(EVENTS_BASE, `/${eventId}/video-games`), item);
    return data;
};

/** @internal PUT /api/events/{eventId}/video-games/{id} — Update event video game */
export const putUpdateEventVideoGame = async (eventId: number, id: number, item: Partial<EventVideoGame>): Promise<void> => {
    await apiClient.put(apiPath(EVENTS_BASE, `/${eventId}/video-games/${id}`), item);
};

/** @internal DELETE /api/events/{eventId}/video-games/{id} — Remove video game from event */
export const deleteEventVideoGame = async (eventId: number, id: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENTS_BASE, `/${eventId}/video-games/${id}`));
};

// === React Query hooks ===

// ── Event Board Games hooks ───────────────────────────────────

export const useEventBoardGamesQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventBoardGame[], unknown, EventBoardGame[], QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.boardGames(eventId),
        queryFn: () => fetchEventBoardGames(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useCreateEventBoardGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventBoardGame, unknown, { eventId: number; item: Partial<EventBoardGame> }>({
        mutationFn: ({ eventId, item }) => postCreateEventBoardGame(eventId, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.boardGames(vars.eventId) });
        },
    });
};

export const useUpdateEventBoardGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; item: Partial<EventBoardGame> }>({
        mutationFn: ({ eventId, id, item }) => putUpdateEventBoardGame(eventId, id, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.boardGames(vars.eventId) });
        },
    });
};

export const useDeleteEventBoardGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteEventBoardGame(eventId, id),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.boardGames(vars.eventId) });
        },
    });
};

// ── Event Video Games hooks ───────────────────────────────────

export const useEventVideoGamesQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventVideoGame[], unknown, EventVideoGame[], QueryKey>>
) =>
    useQuery({
        queryKey: EVENTS_QK.videoGames(eventId),
        queryFn: () => fetchEventVideoGames(eventId),
        enabled: Number.isFinite(eventId),
        retry: 1,
        ...options,
    });

export const useCreateEventVideoGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventVideoGame, unknown, { eventId: number; item: Partial<EventVideoGame> }>({
        mutationFn: ({ eventId, item }) => postCreateEventVideoGame(eventId, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.videoGames(vars.eventId) });
        },
    });
};

export const useUpdateEventVideoGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number; item: Partial<EventVideoGame> }>({
        mutationFn: ({ eventId, id, item }) => putUpdateEventVideoGame(eventId, id, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.videoGames(vars.eventId) });
        },
    });
};

export const useDeleteEventVideoGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; id: number }>({
        mutationFn: ({ eventId, id }) => deleteEventVideoGame(eventId, id),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENTS_QK.videoGames(vars.eventId) });
        },
    });
};
