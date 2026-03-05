// apiGameSessions.ts — Board game & Video game session tracking
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    BoardGameSession,
    BoardGameSessionRound,
    BoardGameSessionRoundPart,
    BoardGameSessionRoundPartPlayer,
    BoardGamePlayerStats,
    BoardGameStats,
    VideoGameSession,
    VideoGameSessionRound,
    VideoGameSessionRoundPart,
    VideoGameSessionRoundPartPlayer,
    VideoGameSessionPlayer,
} from "../../models/modelsKaraoke";

// === Base paths ===
const BG_SESSIONS_BASE = "/api/games/board/sessions";
const BG_BASE = "/api/games/board";
const VG_SESSIONS_BASE = "/api/games/video/sessions";
const VG_BASE = "/api/games/video";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const GAME_SESSIONS_QK = {
    boardList: (eventId?: number) => ["board-game-sessions", { eventId }] as const,
    boardSingle: (id: number) => ["board-game-sessions", id] as const,
    boardStats: (eventId: number) => ["board-game-stats", eventId] as const,
    boardPlayerStats: (eventId: number) => ["board-game-player-stats", eventId] as const,
    videoList: (eventId?: number) => ["video-game-sessions", { eventId }] as const,
    videoSingle: (id: number) => ["video-game-sessions", id] as const,
    boardRounds: (sessionId: number) => ["board-game-sessions", sessionId, "rounds"] as const,
    videoRounds: (sessionId: number) => ["video-game-sessions", sessionId, "rounds"] as const,
    boardByEvent: (eventId: number) => ["board-game-sessions", "event", eventId] as const,
    videoByEvent: (eventId: number) => ["video-game-sessions", "event", eventId] as const,
};

// === DTOs ===
export interface CreateBoardGameSessionDto {
    eventId: number;
    boardGameId: number;
    playerIds?: number[];
    notes?: string;
}

export interface UpdateBoardGameSessionDto extends Partial<CreateBoardGameSessionDto> {
    id: number;
}

export interface CreateBoardGameRoundDto {
    sessionId: number;
    roundNumber?: number;
    scores?: Record<number, number>; // playerId → score
}

export interface CreateVideoGameSessionDto {
    eventId: number;
    videoGameId: number;
    playerIds?: number[];
    notes?: string;
}

export interface UpdateVideoGameSessionDto extends Partial<CreateVideoGameSessionDto> {
    id: number;
}

export interface CreateVideoGameRoundDto {
    sessionId: number;
    roundNumber?: number;
    scores?: Record<number, number>;
}

export interface CreateRoundPartDto {
    name?: string;
    duration?: string; // TimeSpan string e.g. "00:15:00"
}

export interface CreatePartPlayerDto {
    playerId: number;
}

export interface CreateSessionPlayerDto {
    playerId: number;
}

// ===================== BOARD GAME SESSIONS =====================

/** @internal */
export const fetchBoardGameSessions = async (
    eventId?: number,
): Promise<BoardGameSession[]> => {
    const { data } = await apiClient.get<BoardGameSession[]>(
        apiPath(BG_SESSIONS_BASE, ""),
        { params: eventId ? { eventId } : undefined },
    );
    return data ?? [];
};

/** @internal */
export const fetchBoardGameSession = async (id: number): Promise<BoardGameSession> => {
    const { data } = await apiClient.get<BoardGameSession>(apiPath(BG_SESSIONS_BASE, `/${id}`));
    return data;
};

/** @internal */
export const postCreateBoardGameSession = async (
    dto: CreateBoardGameSessionDto,
): Promise<BoardGameSession> => {
    const { data } = await apiClient.post<BoardGameSession>(apiPath(BG_SESSIONS_BASE, ""), dto);
    return data;
};

/** @internal */
export const putUpdateBoardGameSession = async (
    dto: UpdateBoardGameSessionDto,
): Promise<BoardGameSession> => {
    const { data } = await apiClient.put<BoardGameSession>(
        apiPath(BG_SESSIONS_BASE, `/${dto.id}`),
        dto,
    );
    return data;
};

/** @internal */
export const deleteBoardGameSession = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BG_SESSIONS_BASE, `/${id}`));
};

/** @internal POST /api/games/board/sessions/{sessionId}/rounds — Add round */
export const postBoardGameRound = async (
    dto: CreateBoardGameRoundDto,
): Promise<BoardGameSessionRound> => {
    const { data } = await apiClient.post<BoardGameSessionRound>(
        apiPath(BG_SESSIONS_BASE, `/${dto.sessionId}/rounds`),
        dto,
    );
    return data;
};

/** @internal GET /api/games/board/sessions/event/{eventId} — Sessions for a specific event */
export const fetchBoardGameSessionsByEvent = async (
    eventId: number,
): Promise<BoardGameSession[]> => {
    const { data } = await apiClient.get<BoardGameSession[]>(
        apiPath(BG_SESSIONS_BASE, `/event/${eventId}`),
    );
    return data ?? [];
};

/** @internal GET /api/games/board/sessions/{sessionId}/rounds — Rounds for a session */
export const fetchBoardGameSessionRounds = async (
    sessionId: number,
): Promise<BoardGameSessionRound[]> => {
    const { data } = await apiClient.get<BoardGameSessionRound[]>(
        apiPath(BG_SESSIONS_BASE, `/${sessionId}/rounds`),
    );
    return data ?? [];
};

/** @internal DELETE /api/games/board/rounds/{roundId} — Delete a round */
export const deleteBoardGameRound = async (roundId: number): Promise<void> => {
    await apiClient.delete(apiPath(BG_BASE, `/rounds/${roundId}`));
};

/** @internal POST /api/games/board/rounds/{roundId}/parts — Add part to round */
export const postBoardGameRoundPart = async (
    roundId: number,
    dto: CreateRoundPartDto,
): Promise<BoardGameSessionRoundPart> => {
    const { data } = await apiClient.post<BoardGameSessionRoundPart>(
        apiPath(BG_BASE, `/rounds/${roundId}/parts`),
        dto,
    );
    return data;
};

/** @internal DELETE /api/games/board/parts/{partId} — Delete a part */
export const deleteBoardGamePart = async (partId: number): Promise<void> => {
    await apiClient.delete(apiPath(BG_BASE, `/parts/${partId}`));
};

/** @internal POST /api/games/board/parts/{partId}/players — Add player to part */
export const postBoardGamePartPlayer = async (
    partId: number,
    dto: CreatePartPlayerDto,
): Promise<BoardGameSessionRoundPartPlayer> => {
    const { data } = await apiClient.post<BoardGameSessionRoundPartPlayer>(
        apiPath(BG_BASE, `/parts/${partId}/players`),
        dto,
    );
    return data;
};

/** @internal PATCH /api/games/board/part-players/{id}/score — Update player score */
export const patchBoardGamePartPlayerScore = async (
    id: number,
    score: number,
): Promise<void> => {
    await apiClient.patch(apiPath(BG_BASE, `/part-players/${id}/score`), score, {
        headers: { "Content-Type": "application/json" },
    });
};

/** @internal DELETE /api/games/board/part-players/{id} — Remove player from part */
export const deleteBoardGamePartPlayer = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BG_BASE, `/part-players/${id}`));
};

/** @internal GET /api/games/board/sessions/stats?eventId={eventId} — Board game stats */
export const fetchBoardGameStats = async (eventId: number): Promise<BoardGameStats> => {
    const { data } = await apiClient.get<BoardGameStats>(
        apiPath(BG_SESSIONS_BASE, "/stats"),
        { params: { eventId } },
    );
    return data;
};

/** @internal GET /api/games/board/sessions/player-stats?eventId={eventId} — Player stats */
export const fetchBoardGamePlayerStats = async (
    eventId: number,
): Promise<BoardGamePlayerStats[]> => {
    const { data } = await apiClient.get<BoardGamePlayerStats[]>(
        apiPath(BG_SESSIONS_BASE, "/player-stats"),
        { params: { eventId } },
    );
    return data ?? [];
};

// ===================== VIDEO GAME SESSIONS =====================

/** @internal */
export const fetchVideoGameSessions = async (
    eventId?: number,
): Promise<VideoGameSession[]> => {
    const { data } = await apiClient.get<VideoGameSession[]>(
        apiPath(VG_SESSIONS_BASE, ""),
        { params: eventId ? { eventId } : undefined },
    );
    return data ?? [];
};

/** @internal */
export const fetchVideoGameSession = async (id: number): Promise<VideoGameSession> => {
    const { data } = await apiClient.get<VideoGameSession>(apiPath(VG_SESSIONS_BASE, `/${id}`));
    return data;
};

/** @internal */
export const postCreateVideoGameSession = async (
    dto: CreateVideoGameSessionDto,
): Promise<VideoGameSession> => {
    const { data } = await apiClient.post<VideoGameSession>(apiPath(VG_SESSIONS_BASE, ""), dto);
    return data;
};

/** @internal */
export const putUpdateVideoGameSession = async (
    dto: UpdateVideoGameSessionDto,
): Promise<VideoGameSession> => {
    const { data } = await apiClient.put<VideoGameSession>(
        apiPath(VG_SESSIONS_BASE, `/${dto.id}`),
        dto,
    );
    return data;
};

/** @internal */
export const deleteVideoGameSession = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(VG_SESSIONS_BASE, `/${id}`));
};

/** @internal POST /api/games/video/sessions/{sessionId}/rounds — Add round */
export const postVideoGameRound = async (
    dto: CreateVideoGameRoundDto,
): Promise<VideoGameSessionRound> => {
    const { data } = await apiClient.post<VideoGameSessionRound>(
        apiPath(VG_SESSIONS_BASE, `/${dto.sessionId}/rounds`),
        dto,
    );
    return data;
};

/** @internal GET /api/games/video/sessions/event/{eventId} — Sessions for a specific event */
export const fetchVideoGameSessionsByEvent = async (
    eventId: number,
): Promise<VideoGameSession[]> => {
    const { data } = await apiClient.get<VideoGameSession[]>(
        apiPath(VG_SESSIONS_BASE, `/event/${eventId}`),
    );
    return data ?? [];
};

/** @internal GET /api/games/video/sessions/{sessionId}/rounds — Rounds for a session */
export const fetchVideoGameSessionRounds = async (
    sessionId: number,
): Promise<VideoGameSessionRound[]> => {
    const { data } = await apiClient.get<VideoGameSessionRound[]>(
        apiPath(VG_SESSIONS_BASE, `/${sessionId}/rounds`),
    );
    return data ?? [];
};

/** @internal POST /api/games/video/sessions/{sessionId}/players — Add player to session */
export const postVideoGameSessionPlayer = async (
    sessionId: number,
    dto: CreateSessionPlayerDto,
): Promise<VideoGameSessionPlayer> => {
    const { data } = await apiClient.post<VideoGameSessionPlayer>(
        apiPath(VG_SESSIONS_BASE, `/${sessionId}/players`),
        dto,
    );
    return data;
};

/** @internal PATCH /api/games/video/session-players/{id}/score — Update session player score */
export const patchVideoGameSessionPlayerScore = async (
    id: number,
    score: number,
): Promise<void> => {
    await apiClient.patch(apiPath(VG_BASE, `/session-players/${id}/score`), score, {
        headers: { "Content-Type": "application/json" },
    });
};

/** @internal DELETE /api/games/video/session-players/{id} — Remove session player */
export const deleteVideoGameSessionPlayer = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(VG_BASE, `/session-players/${id}`));
};

/** @internal DELETE /api/games/video/rounds/{roundId} — Delete a round */
export const deleteVideoGameRound = async (roundId: number): Promise<void> => {
    await apiClient.delete(apiPath(VG_BASE, `/rounds/${roundId}`));
};

/** @internal POST /api/games/video/rounds/{roundId}/parts — Add part to round */
export const postVideoGameRoundPart = async (
    roundId: number,
    dto: CreateRoundPartDto,
): Promise<VideoGameSessionRoundPart> => {
    const { data } = await apiClient.post<VideoGameSessionRoundPart>(
        apiPath(VG_BASE, `/rounds/${roundId}/parts`),
        dto,
    );
    return data;
};

/** @internal DELETE /api/games/video/parts/{partId} — Delete a part */
export const deleteVideoGamePart = async (partId: number): Promise<void> => {
    await apiClient.delete(apiPath(VG_BASE, `/parts/${partId}`));
};

/** @internal POST /api/games/video/parts/{partId}/players — Add player to part */
export const postVideoGamePartPlayer = async (
    partId: number,
    dto: CreatePartPlayerDto,
): Promise<VideoGameSessionRoundPartPlayer> => {
    const { data } = await apiClient.post<VideoGameSessionRoundPartPlayer>(
        apiPath(VG_BASE, `/parts/${partId}/players`),
        dto,
    );
    return data;
};

/** @internal PATCH /api/games/video/part-players/{id}/score — Update player score */
export const patchVideoGamePartPlayerScore = async (
    id: number,
    score: number,
): Promise<void> => {
    await apiClient.patch(apiPath(VG_BASE, `/part-players/${id}/score`), score, {
        headers: { "Content-Type": "application/json" },
    });
};

/** @internal DELETE /api/games/video/part-players/{id} — Remove player from part */
export const deleteVideoGamePartPlayer = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(VG_BASE, `/part-players/${id}`));
};

// ===================== REACT QUERY HOOKS =====================

// Board Games
export const useBoardGameSessionsQuery = (
    eventId?: number,
    options?: Partial<UseQueryOptions<BoardGameSession[], unknown, BoardGameSession[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.boardList(eventId),
        queryFn: () => fetchBoardGameSessions(eventId),
        ...options,
    });

export const useBoardGameSessionQuery = (
    id: number,
    options?: Partial<UseQueryOptions<BoardGameSession, unknown, BoardGameSession, QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.boardSingle(id),
        queryFn: () => fetchBoardGameSession(id),
        enabled: id > 0,
        ...options,
    });

export const useBoardGameStatsQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<BoardGameStats, unknown, BoardGameStats, QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.boardStats(eventId),
        queryFn: () => fetchBoardGameStats(eventId),
        enabled: eventId > 0,
        ...options,
    });

export const useBoardGamePlayerStatsQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<BoardGamePlayerStats[], unknown, BoardGamePlayerStats[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.boardPlayerStats(eventId),
        queryFn: () => fetchBoardGamePlayerStats(eventId),
        enabled: eventId > 0,
        ...options,
    });

export const useCreateBoardGameSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameSession, unknown, CreateBoardGameSessionDto>({
        mutationFn: (dto) => postCreateBoardGameSession(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardList(dto.eventId) });
        },
    });
};

export const useUpdateBoardGameSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameSession, unknown, UpdateBoardGameSessionDto>({
        mutationFn: (dto) => putUpdateBoardGameSession(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(dto.id) });
            qc.invalidateQueries({ queryKey: ["board-game-sessions"] });
        },
    });
};

export const useDeleteBoardGameSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteBoardGameSession(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["board-game-sessions"] });
        },
    });
};

export const useAddBoardGameRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameSessionRound, unknown, CreateBoardGameRoundDto>({
        mutationFn: (dto) => postBoardGameRound(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(dto.sessionId) });
        },
    });
};

// Video Games
export const useVideoGameSessionsQuery = (
    eventId?: number,
    options?: Partial<UseQueryOptions<VideoGameSession[], unknown, VideoGameSession[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.videoList(eventId),
        queryFn: () => fetchVideoGameSessions(eventId),
        ...options,
    });

export const useVideoGameSessionQuery = (
    id: number,
    options?: Partial<UseQueryOptions<VideoGameSession, unknown, VideoGameSession, QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.videoSingle(id),
        queryFn: () => fetchVideoGameSession(id),
        enabled: id > 0,
        ...options,
    });

export const useCreateVideoGameSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameSession, unknown, CreateVideoGameSessionDto>({
        mutationFn: (dto) => postCreateVideoGameSession(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoList(dto.eventId) });
        },
    });
};

export const useUpdateVideoGameSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameSession, unknown, UpdateVideoGameSessionDto>({
        mutationFn: (dto) => putUpdateVideoGameSession(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(dto.id) });
            qc.invalidateQueries({ queryKey: ["video-game-sessions"] });
        },
    });
};

export const useDeleteVideoGameSessionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteVideoGameSession(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["video-game-sessions"] });
        },
    });
};

export const useAddVideoGameRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameSessionRound, unknown, CreateVideoGameRoundDto>({
        mutationFn: (dto) => postVideoGameRound(dto),
        onSuccess: (_, dto) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(dto.sessionId) });
        },
    });
};

// --- Board Game sub-CRUD hooks ---

export const useBoardGameSessionsByEventQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<BoardGameSession[], unknown, BoardGameSession[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.boardByEvent(eventId),
        queryFn: () => fetchBoardGameSessionsByEvent(eventId),
        enabled: eventId > 0,
        ...options,
    });

export const useBoardGameSessionRoundsQuery = (
    sessionId: number,
    options?: Partial<UseQueryOptions<BoardGameSessionRound[], unknown, BoardGameSessionRound[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.boardRounds(sessionId),
        queryFn: () => fetchBoardGameSessionRounds(sessionId),
        enabled: sessionId > 0,
        ...options,
    });

export const useDeleteBoardGameRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { roundId: number; sessionId: number }>({
        mutationFn: ({ roundId }) => deleteBoardGameRound(roundId),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(sessionId) });
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardRounds(sessionId) });
        },
    });
};

export const useAddBoardGameRoundPartMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameSessionRoundPart, unknown, { roundId: number; sessionId: number; dto: CreateRoundPartDto }>({
        mutationFn: ({ roundId, dto }) => postBoardGameRoundPart(roundId, dto),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(sessionId) });
        },
    });
};

export const useDeleteBoardGamePartMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { partId: number; sessionId: number }>({
        mutationFn: ({ partId }) => deleteBoardGamePart(partId),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(sessionId) });
        },
    });
};

export const useAddBoardGamePartPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameSessionRoundPartPlayer, unknown, { partId: number; sessionId: number; dto: CreatePartPlayerDto }>({
        mutationFn: ({ partId, dto }) => postBoardGamePartPlayer(partId, dto),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(sessionId) });
        },
    });
};

export const usePatchBoardGamePartPlayerScoreMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; score: number; sessionId: number }>({
        mutationFn: ({ id, score }) => patchBoardGamePartPlayerScore(id, score),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(sessionId) });
        },
    });
};

export const useDeleteBoardGamePartPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; sessionId: number }>({
        mutationFn: ({ id }) => deleteBoardGamePartPlayer(id),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.boardSingle(sessionId) });
        },
    });
};

// --- Video Game sub-CRUD hooks ---

export const useVideoGameSessionsByEventQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<VideoGameSession[], unknown, VideoGameSession[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.videoByEvent(eventId),
        queryFn: () => fetchVideoGameSessionsByEvent(eventId),
        enabled: eventId > 0,
        ...options,
    });

export const useVideoGameSessionRoundsQuery = (
    sessionId: number,
    options?: Partial<UseQueryOptions<VideoGameSessionRound[], unknown, VideoGameSessionRound[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAME_SESSIONS_QK.videoRounds(sessionId),
        queryFn: () => fetchVideoGameSessionRounds(sessionId),
        enabled: sessionId > 0,
        ...options,
    });

export const useAddVideoGameSessionPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameSessionPlayer, unknown, { sessionId: number; dto: CreateSessionPlayerDto }>({
        mutationFn: ({ sessionId, dto }) => postVideoGameSessionPlayer(sessionId, dto),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const usePatchVideoGameSessionPlayerScoreMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; score: number; sessionId: number }>({
        mutationFn: ({ id, score }) => patchVideoGameSessionPlayerScore(id, score),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const useDeleteVideoGameSessionPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; sessionId: number }>({
        mutationFn: ({ id }) => deleteVideoGameSessionPlayer(id),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const useDeleteVideoGameRoundMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { roundId: number; sessionId: number }>({
        mutationFn: ({ roundId }) => deleteVideoGameRound(roundId),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoRounds(sessionId) });
        },
    });
};

export const useAddVideoGameRoundPartMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameSessionRoundPart, unknown, { roundId: number; sessionId: number; dto: CreateRoundPartDto }>({
        mutationFn: ({ roundId, dto }) => postVideoGameRoundPart(roundId, dto),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const useDeleteVideoGamePartMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { partId: number; sessionId: number }>({
        mutationFn: ({ partId }) => deleteVideoGamePart(partId),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const useAddVideoGamePartPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameSessionRoundPartPlayer, unknown, { partId: number; sessionId: number; dto: CreatePartPlayerDto }>({
        mutationFn: ({ partId, dto }) => postVideoGamePartPlayer(partId, dto),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const usePatchVideoGamePartPlayerScoreMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; score: number; sessionId: number }>({
        mutationFn: ({ id, score }) => patchVideoGamePartPlayerScore(id, score),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export const useDeleteVideoGamePartPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; sessionId: number }>({
        mutationFn: ({ id }) => deleteVideoGamePartPlayer(id),
        onSuccess: (_, { sessionId }) => {
            qc.invalidateQueries({ queryKey: GAME_SESSIONS_QK.videoSingle(sessionId) });
        },
    });
};

export default {
    fetchBoardGameSessions,
    fetchBoardGameSession,
    postCreateBoardGameSession,
    putUpdateBoardGameSession,
    deleteBoardGameSession,
    postBoardGameRound,
    fetchBoardGameStats,
    fetchBoardGamePlayerStats,
    fetchVideoGameSessions,
    fetchVideoGameSession,
    postCreateVideoGameSession,
    putUpdateVideoGameSession,
    deleteVideoGameSession,
    postVideoGameRound,
    fetchBoardGameSessionsByEvent,
    fetchBoardGameSessionRounds,
    deleteBoardGameRound,
    postBoardGameRoundPart,
    deleteBoardGamePart,
    postBoardGamePartPlayer,
    patchBoardGamePartPlayerScore,
    deleteBoardGamePartPlayer,
    fetchVideoGameSessionsByEvent,
    fetchVideoGameSessionRounds,
    postVideoGameSessionPlayer,
    patchVideoGameSessionPlayerScore,
    deleteVideoGameSessionPlayer,
    deleteVideoGameRound,
    postVideoGameRoundPart,
    deleteVideoGamePart,
    postVideoGamePartPlayer,
    patchVideoGamePartPlayerScore,
    deleteVideoGamePartPlayer,
};
