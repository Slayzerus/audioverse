// apiKaraokePlayers.ts — Players (deprecated), Permissions, Teams, Queue, Favorites, Games, Song Picks
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "../audioverseApiClient";
import { KARAOKE_BASE, KARAOKE_QK } from "./apiKaraokeBase";
import { logger } from '../../../utils/logger';

const log = logger.scoped('KaraokePlayers');

import type {
    KaraokePlayer,
    KaraokePartyStatus,
    KaraokeGame,
    KaraokeGameMode,
    KaraokeGameTheme,
    KaraokeTeam,
    KaraokeTeamPlayer,
    AddTeamPlayerRequest,
    SongQueueStatus,
    KaraokeSongQueueItem,
    PlayerFavorite,
    KaraokeSessionSongPick,
    KaraokeSessionSongSignup,
    SongPickRankedResult,
} from "../../../models/modelsKaraoke";

// ══════════════════════════════════════════════════════════════
// === Deprecated Players ===
// ══════════════════════════════════════════════════════════════

/**
 * @deprecated The `/get-all-players` endpoint was removed.
 * Player management now lives under /api/user/profiles/{profileId}/players.
 */
export const fetchPlayers = async (): Promise<KaraokePlayer[]> => {
    log.warn('[apiKaraoke] fetchPlayers: /get-all-players removed. Use profile-scoped player endpoints.');
    return [];
};

/**
 * @deprecated The `/create-player` endpoint was removed.
 * Use ProfilePlayerService or /api/user/profiles/{profileId}/players instead.
 */
export const postCreatePlayer = async (
    _player: KaraokePlayer
): Promise<KaraokePlayer> => {
    log.warn('[apiKaraoke] postCreatePlayer: /create-player removed. Use profile-scoped player endpoints.');
    throw new Error('Endpoint removed: /api/karaoke/create-player — use profile player endpoints');
};

/**
 * @deprecated The `/assign-player-to-party` endpoint was removed.
 * Use `POST /api/events/{eventId}/participants` instead.
 */
export const postAssignPlayerToParty = async (_assignment: {
    partyId: number;
    playerId: number;
}): Promise<void> => {
    log.warn('[apiKaraoke] postAssignPlayerToParty: removed. Use POST /api/events/{eventId}/participants.');
    throw new Error('Endpoint removed: /api/karaoke/assign-player-to-party — use events participants');
};

// ══════════════════════════════════════════════════════════════
// === Permissions (PartyPermission) ===
// ══════════════════════════════════════════════════════════════

export const fetchPlayerPermissions = async (partyId: number, playerId: number): Promise<number> => {
    const { data } = await apiClient.get<number>(apiPath('/api', `/permissions/events/${partyId}/players/${playerId}`));
    return (typeof data === 'number') ? data : Number(data ?? 0);
};

export const postGrantPermission = async (partyId: number, playerId: number, permission: string): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath('/api', `/permissions/events/${partyId}/players/${playerId}/grant`), null, { params: { permission } });
    return data;
};

export const postRevokePermission = async (partyId: number, playerId: number, permission: string): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath('/api', `/permissions/events/${partyId}/players/${playerId}/revoke`), null, { params: { permission } });
    return data;
};

export const postBulkGrantPermissions = async (partyId: number, body: Array<{ playerId: number; permission: string }>): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath('/api', `/permissions/events/${partyId}/players/permissions/bulk`), body);
    return data;
};

export const postBulkRevokePermissions = async (partyId: number, body: Array<{ playerId: number; permission: string }>): Promise<unknown> => {
    const { data } = await apiClient.post(apiPath('/api', `/permissions/events/${partyId}/players/permissions/bulk-revoke`), body);
    return data;
};

export interface PermissionHistoryQuery {
    userId?: number;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
}

export const fetchPermissionHistory = async (partyId: number, query: PermissionHistoryQuery = {}): Promise<{ Items: unknown[]; TotalCount: number }> => {
    const { data } = await apiClient.get(apiPath('/api', `/permissions/readable/events/${partyId}/history/expanded`), { params: query });
    return data ?? { Items: [], TotalCount: 0 };
};

// === Permission Hooks ===

export const usePlayerPermissionsQuery = (partyId: number, playerId?: number) =>
    useQuery({ queryKey: ['party', 'permissions', partyId, playerId], queryFn: () => fetchPlayerPermissions(partyId, playerId as number), enabled: Number.isFinite(partyId) && Number.isFinite(Number(playerId)) });

export const usePermissionHistoryQuery = (partyId: number, query: PermissionHistoryQuery = {}) =>
    useQuery({ queryKey: ['party', 'permissions', partyId, 'history', query], queryFn: () => fetchPermissionHistory(partyId, query), enabled: Number.isFinite(partyId) });

// ══════════════════════════════════════════════════════════════
// === Deprecated Player Hooks ===
// ══════════════════════════════════════════════════════════════

/** @deprecated Endpoint removed. Returns empty array. */
export const usePlayersQuery = () =>
    useQuery({
        queryKey: KARAOKE_QK.players,
        queryFn: fetchPlayers,
        staleTime: 5 * 60_000,
    });

export const useCreatePlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokePlayer, unknown, KaraokePlayer>({
        mutationFn: (player) => postCreatePlayer(player),
        onSuccess: () => qc.invalidateQueries({ queryKey: KARAOKE_QK.players }),
    });
};

export const useAssignPlayerToPartyMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { partyId: number; playerId: number }, { previous: KaraokePartyStatus | undefined }>({
        mutationFn: (assignment) => postAssignPlayerToParty(assignment),
        // Optimistic update: add player to `partyStatus` cache immediately
        onMutate: async ({ partyId, playerId }) => {
            await qc.cancelQueries({ queryKey: KARAOKE_QK.partyStatus(partyId) });
            const previous = qc.getQueryData<KaraokePartyStatus>(KARAOKE_QK.partyStatus(partyId));
            // Try to append to players array (create if missing)
            qc.setQueryData(KARAOKE_QK.partyStatus(partyId), (old: KaraokePartyStatus | undefined) => {
                const copy = { ...(old ?? {}) } as KaraokePartyStatus;
                copy.players = Array.isArray(copy.players) ? [...copy.players] : [];
                // avoid duplicate
                if (!copy.players.some((p) => p.id === playerId)) {
                    copy.players.push({ id: playerId, name: `#${playerId}` });
                }
                return copy;
            });
            return { previous };
        },
        onError: (_err, vars, context) => {
            // rollback
            if (context?.previous) qc.setQueryData(KARAOKE_QK.partyStatus(vars.partyId), context.previous);
        },
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.parties });
            if (vars?.partyId) {
                qc.invalidateQueries({ queryKey: KARAOKE_QK.party(vars.partyId) });
                qc.invalidateQueries({ queryKey: KARAOKE_QK.partyStatus(vars.partyId) });
            }
        },
        onSettled: (_data, _err, vars) => {
            if (vars?.partyId) qc.invalidateQueries({ queryKey: KARAOKE_QK.partyStatus(vars.partyId) });
        },
    });
};

// ══════════════════════════════════════════════════════════════
// === Teams API ===
// ══════════════════════════════════════════════════════════════

/** POST /api/karaoke/teams — Create a karaoke team */
export const postCreateTeam = async (team: Partial<KaraokeTeam>): Promise<KaraokeTeam> => {
    const { data } = await apiClient.post<KaraokeTeam>(apiPath(KARAOKE_BASE, `/teams`), team);
    return data;
};

/** GET /api/karaoke/teams/{teamId} — Get team by ID */
export const fetchTeamById = async (teamId: number): Promise<KaraokeTeam> => {
    const { data } = await apiClient.get<KaraokeTeam>(apiPath(KARAOKE_BASE, `/teams/${teamId}`));
    return data;
};

/** PUT /api/karaoke/teams/{teamId} — Update a team */
export const putUpdateTeam = async (teamId: number, team: Partial<KaraokeTeam>): Promise<void> => {
    await apiClient.put(apiPath(KARAOKE_BASE, `/teams/${teamId}`), team);
};

/** DELETE /api/karaoke/teams/{teamId} — Delete a team */
export const deleteTeam = async (teamId: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/teams/${teamId}`));
};

/** GET /api/karaoke/events/{eventId}/teams — List teams for an event */
export const fetchEventTeams = async (eventId: number): Promise<KaraokeTeam[]> => {
    const { data } = await apiClient.get<KaraokeTeam[]>(apiPath(KARAOKE_BASE, `/events/${eventId}/teams`));
    return Array.isArray(data) ? data : [];
};

/** POST /api/karaoke/teams/{teamId}/players — Add a player to a team */
export const postAddTeamPlayer = async (teamId: number, payload: AddTeamPlayerRequest): Promise<KaraokeTeamPlayer> => {
    const { data } = await apiClient.post<KaraokeTeamPlayer>(apiPath(KARAOKE_BASE, `/teams/${teamId}/players`), payload);
    return data;
};

/** GET /api/karaoke/teams/{teamId}/players — List players in a team */
export const fetchTeamPlayers = async (teamId: number): Promise<KaraokeTeamPlayer[]> => {
    const { data } = await apiClient.get<KaraokeTeamPlayer[]>(apiPath(KARAOKE_BASE, `/teams/${teamId}/players`));
    return Array.isArray(data) ? data : [];
};

/** DELETE /api/karaoke/teams/{teamId}/players/{playerId} — Remove a player from a team */
export const deleteTeamPlayer = async (teamId: number, playerId: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/teams/${teamId}/players/${playerId}`));
};

// === Teams React Query Hooks ===

export const useEventTeamsQuery = (eventId: number) =>
    useQuery({
        queryKey: KARAOKE_QK.teams(eventId),
        queryFn: () => fetchEventTeams(eventId),
        enabled: Number.isFinite(eventId),
    });

export const useTeamQuery = (teamId: number) =>
    useQuery({
        queryKey: KARAOKE_QK.team(teamId),
        queryFn: () => fetchTeamById(teamId),
        enabled: Number.isFinite(teamId),
    });

export const useTeamPlayersQuery = (teamId: number) =>
    useQuery({
        queryKey: KARAOKE_QK.teamPlayers(teamId),
        queryFn: () => fetchTeamPlayers(teamId),
        enabled: Number.isFinite(teamId),
    });

export const useCreateTeamMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeTeam, unknown, Partial<KaraokeTeam>>({
        mutationFn: (team) => postCreateTeam(team),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['karaoke', 'teams'] });
        },
    });
};

export const useUpdateTeamMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { teamId: number; team: Partial<KaraokeTeam> }>({
        mutationFn: ({ teamId, team }) => putUpdateTeam(teamId, team),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.team(vars.teamId) });
            qc.invalidateQueries({ queryKey: ['karaoke', 'teams'] });
        },
    });
};

export const useDeleteTeamMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (teamId) => deleteTeam(teamId),
        onSuccess: (_data, teamId) => {
            qc.removeQueries({ queryKey: KARAOKE_QK.team(teamId) });
            qc.invalidateQueries({ queryKey: ['karaoke', 'teams'] });
        },
    });
};

export const useAddTeamPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeTeamPlayer, unknown, { teamId: number; payload: AddTeamPlayerRequest }>({
        mutationFn: ({ teamId, payload }) => postAddTeamPlayer(teamId, payload),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.teamPlayers(vars.teamId) });
        },
    });
};

export const useDeleteTeamPlayerMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { teamId: number; playerId: number }>({
        mutationFn: ({ teamId, playerId }) => deleteTeamPlayer(teamId, playerId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.teamPlayers(vars.teamId) });
        },
    });
};

// ══════════════════════════════════════════════════════════════
// === Queue API ===
// ══════════════════════════════════════════════════════════════

/** GET /api/karaoke/events/{eventId}/queue — Get song queue for an event */
export const fetchEventQueue = async (eventId: number): Promise<KaraokeSongQueueItem[]> => {
    const { data } = await apiClient.get<KaraokeSongQueueItem[]>(apiPath(KARAOKE_BASE, `/events/${eventId}/queue`));
    return Array.isArray(data) ? data : [];
};

/** POST /api/karaoke/events/{eventId}/queue — Add a song to the queue */
export const postAddToQueue = async (eventId: number, item: Partial<KaraokeSongQueueItem>): Promise<KaraokeSongQueueItem> => {
    const { data } = await apiClient.post<KaraokeSongQueueItem>(apiPath(KARAOKE_BASE, `/events/${eventId}/queue`), item);
    return data;
};

/** PATCH /api/karaoke/queue/{id}/status — Update queue item status */
export const patchQueueItemStatus = async (id: number, status: SongQueueStatus): Promise<void> => {
    await apiClient.patch(apiPath(KARAOKE_BASE, `/queue/${id}/status`), status, {
        headers: { 'Content-Type': 'application/json' },
    });
};

/** DELETE /api/karaoke/queue/{id} — Remove item from queue */
export const deleteQueueItem = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/queue/${id}`));
};

// === Queue React Query Hooks ===

export const useEventQueueQuery = (eventId: number) =>
    useQuery({
        queryKey: KARAOKE_QK.queue(eventId),
        queryFn: () => fetchEventQueue(eventId),
        enabled: Number.isFinite(eventId),
    });

export const useAddToQueueMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSongQueueItem, unknown, { eventId: number; item: Partial<KaraokeSongQueueItem> }>({
        mutationFn: ({ eventId, item }) => postAddToQueue(eventId, item),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.queue(vars.eventId) });
        },
    });
};

export const usePatchQueueItemStatusMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; status: SongQueueStatus; eventId?: number }>({
        mutationFn: ({ id, status }) => patchQueueItemStatus(id, status),
        onSuccess: (_data, vars) => {
            if (vars.eventId) qc.invalidateQueries({ queryKey: KARAOKE_QK.queue(vars.eventId) });
        },
    });
};

export const useDeleteQueueItemMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; eventId?: number }>({
        mutationFn: ({ id }) => deleteQueueItem(id),
        onSuccess: (_data, vars) => {
            if (vars.eventId) qc.invalidateQueries({ queryKey: KARAOKE_QK.queue(vars.eventId) });
        },
    });
};

// ══════════════════════════════════════════════════════════════
// === Favorites API ===
// ══════════════════════════════════════════════════════════════

/** GET /api/karaoke/players/{playerId}/favorites — Get player's favorite songs */
export const fetchPlayerFavorites = async (playerId: number): Promise<PlayerFavorite[]> => {
    const { data } = await apiClient.get<PlayerFavorite[]>(apiPath(KARAOKE_BASE, `/players/${playerId}/favorites`));
    return Array.isArray(data) ? data : [];
};

/** POST /api/karaoke/players/{playerId}/favorites/{songId} — Add song to favorites */
export const postAddFavorite = async (playerId: number, songId: number): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/players/${playerId}/favorites/${songId}`));
};

/** DELETE /api/karaoke/players/{playerId}/favorites/{songId} — Remove song from favorites */
export const deleteFavorite = async (playerId: number, songId: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/players/${playerId}/favorites/${songId}`));
};

/** POST /api/karaoke/players/{playerId}/favorites/{songId}/queue/{eventId} — Add favorite to event queue */
export const postFavoriteToQueue = async (playerId: number, songId: number, eventId: number): Promise<void> => {
    await apiClient.post(apiPath(KARAOKE_BASE, `/players/${playerId}/favorites/${songId}/queue/${eventId}`));
};

// === Favorites React Query Hooks ===

export const usePlayerFavoritesQuery = (playerId: number) =>
    useQuery({
        queryKey: KARAOKE_QK.favorites(playerId),
        queryFn: () => fetchPlayerFavorites(playerId),
        enabled: Number.isFinite(playerId),
    });

export const useAddFavoriteMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { playerId: number; songId: number }>({
        mutationFn: ({ playerId, songId }) => postAddFavorite(playerId, songId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.favorites(vars.playerId) });
        },
    });
};

export const useDeleteFavoriteMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { playerId: number; songId: number }>({
        mutationFn: ({ playerId, songId }) => deleteFavorite(playerId, songId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.favorites(vars.playerId) });
        },
    });
};

export const useFavoriteToQueueMutation = () =>
    useMutation<void, unknown, { playerId: number; songId: number; eventId: number }>({
        mutationFn: ({ playerId, songId, eventId }) => postFavoriteToQueue(playerId, songId, eventId),
    });

// ══════════════════════════════════════════════════════════════
// === KaraokeGame API ===
// ══════════════════════════════════════════════════════════════

export interface CreateGameRequest {
    name: string;
    mode?: KaraokeGameMode;
    maxRounds?: number;
    timeLimitPerRound?: number;
    theme?: KaraokeGameTheme;
}

export const fetchGamesByParty = async (partyId: number): Promise<KaraokeGame[]> => {
    const { data } = await apiClient.get<KaraokeGame[]>(
        apiPath('/api', `/events/${partyId}/video-games`)
    );
    return Array.isArray(data) ? data : [];
};

/**
 * @deprecated Single video-game GET not available. Use fetchGamesByParty and filter.
 */
export const fetchGameById = async (gameId: number, eventId?: number): Promise<KaraokeGame> => {
    if (eventId) {
        // No single-game GET endpoint; fetch all and filter
        const games = await fetchGamesByParty(eventId);
        const found = games.find(g => g.id === gameId);
        if (found) return found;
    }
    log.warn('[apiKaraoke] fetchGameById: no direct GET endpoint in swagger; returning stub');
    throw new Error('Endpoint removed: single video-game GET — use fetchGamesByParty');
};

export const postCreateGame = async (partyId: number, request: CreateGameRequest): Promise<KaraokeGame> => {
    const { data } = await apiClient.post<KaraokeGame>(
        apiPath('/api', `/events/${partyId}/video-games`),
        request
    );
    return data;
};

export const putUpdateGame = async (eventId: number, gameId: number, patch: Partial<CreateGameRequest>): Promise<void> => {
    await apiClient.put(apiPath('/api', `/events/${eventId}/video-games/${gameId}`), patch);
};

export const deleteGame = async (eventId: number, gameId: number): Promise<void> => {
    await apiClient.delete(apiPath('/api', `/events/${eventId}/video-games/${gameId}`));
};

/** @deprecated /games/{id}/start removed from swagger */
export const postStartGame = async (_gameId: number): Promise<void> => {
    log.warn('[apiKaraoke] postStartGame: /games/{id}/start endpoint removed from swagger.');
};

/** @deprecated /games/{id}/end removed from swagger */
export const postEndGame = async (_gameId: number): Promise<void> => {
    log.warn('[apiKaraoke] postEndGame: /games/{id}/end endpoint removed from swagger.');
};

/** @deprecated /games/{id}/cancel removed from swagger */
export const postCancelGame = async (_gameId: number): Promise<void> => {
    log.warn('[apiKaraoke] postCancelGame: /games/{id}/cancel endpoint removed from swagger.');
};

// === KaraokeGame React Query Hooks ===

export const useGamesQuery = (partyId: number, options?: Partial<UseQueryOptions<KaraokeGame[], unknown, KaraokeGame[], QueryKey>>) =>
    useQuery({
        queryKey: KARAOKE_QK.games(partyId),
        queryFn: () => fetchGamesByParty(partyId),
        enabled: partyId > 0,
        staleTime: 30_000,
        ...options,
    });

export const useGameQuery = (gameId: number, options?: Partial<UseQueryOptions<KaraokeGame, unknown, KaraokeGame, QueryKey>>) =>
    useQuery({
        queryKey: KARAOKE_QK.game(gameId),
        queryFn: () => fetchGameById(gameId),
        enabled: gameId > 0,
        staleTime: 30_000,
        ...options,
    });

export const useCreateGameMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: CreateGameRequest) => postCreateGame(partyId, input),
        onSuccess: () => { qc.invalidateQueries({ queryKey: KARAOKE_QK.games(partyId) }); },
    });
};

export const useUpdateGameMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ gameId, patch }: { gameId: number; patch: Partial<CreateGameRequest> }) => putUpdateGame(partyId, gameId, patch),
        onSuccess: () => { qc.invalidateQueries({ queryKey: KARAOKE_QK.games(partyId) }); },
    });
};

export const useDeleteGameMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (gameId: number) => deleteGame(partyId, gameId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: KARAOKE_QK.games(partyId) }); },
    });
};

export const useStartGameMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (gameId: number) => postStartGame(gameId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: KARAOKE_QK.games(partyId) }); },
    });
};

export const useEndGameMutation = (partyId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (gameId: number) => postEndGame(gameId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: KARAOKE_QK.games(partyId) }); },
    });
};

// ══════════════════════════════════════════════════════════════
// === Karaoke Song Picks ===
// ══════════════════════════════════════════════════════════════

/** POST /api/karaoke/sessions/{sessionId}/song-picks — Add a karaoke song pick */
export const postKaraokeSongPick = async (
    sessionId: number,
    body: { songId?: number; songTitle: string },
): Promise<KaraokeSessionSongPick> => {
    const { data } = await apiClient.post<KaraokeSessionSongPick>(apiPath(KARAOKE_BASE, `/sessions/${sessionId}/song-picks`), body);
    return data;
};

/** GET /api/karaoke/sessions/{sessionId}/song-picks — List karaoke song picks */
export const fetchKaraokeSongPicks = async (sessionId: number): Promise<KaraokeSessionSongPick[]> => {
    const { data } = await apiClient.get<KaraokeSessionSongPick[]>(apiPath(KARAOKE_BASE, `/sessions/${sessionId}/song-picks`));
    return data;
};

/** POST /api/karaoke/sessions/{sessionId}/song-picks/import — Import from playlist */
export const postImportKaraokeSongPicks = async (sessionId: number, body: { sourcePlaylistId: number }): Promise<KaraokeSessionSongPick[]> => {
    const { data } = await apiClient.post<KaraokeSessionSongPick[]>(apiPath(KARAOKE_BASE, `/sessions/${sessionId}/song-picks/import`), body);
    return data;
};

/** GET /api/karaoke/sessions/{sessionId}/song-picks/ranked — Get ranked karaoke song pick results */
export const fetchKaraokeSongPicksRanked = async (sessionId: number): Promise<SongPickRankedResult[]> => {
    const { data } = await apiClient.get<SongPickRankedResult[]>(apiPath(KARAOKE_BASE, `/sessions/${sessionId}/song-picks/ranked`));
    return data;
};

/** DELETE /api/karaoke/song-picks/{pickId} — Delete a karaoke song pick */
export const deleteKaraokeSongPick = async (pickId: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/song-picks/${pickId}`));
};

/** POST /api/karaoke/song-picks/{pickId}/signup — Sign up for a karaoke song pick */
export const postKaraokeSongPickSignup = async (pickId: number, body: { playerId: number; preferredSlot?: number }): Promise<KaraokeSessionSongSignup> => {
    const { data } = await apiClient.post<KaraokeSessionSongSignup>(apiPath(KARAOKE_BASE, `/song-picks/${pickId}/signup`), body);
    return data;
};

/** DELETE /api/karaoke/song-picks/{pickId}/signup — Remove signup from a karaoke song pick */
export const deleteKaraokeSongPickSignup = async (pickId: number): Promise<void> => {
    await apiClient.delete(apiPath(KARAOKE_BASE, `/song-picks/${pickId}/signup`));
};

// === Song Picks React Query Hooks ===

export const useKaraokeSongPicksQuery = (sessionId: number, options?: Partial<UseQueryOptions<KaraokeSessionSongPick[]>>) =>
    useQuery({ queryKey: KARAOKE_QK.sessionSongPicks(sessionId), queryFn: () => fetchKaraokeSongPicks(sessionId), enabled: sessionId > 0, ...options });

export const useKaraokeSongPicksRankedQuery = (sessionId: number, options?: Partial<UseQueryOptions<SongPickRankedResult[]>>) =>
    useQuery({ queryKey: KARAOKE_QK.sessionSongPicksRanked(sessionId), queryFn: () => fetchKaraokeSongPicksRanked(sessionId), enabled: sessionId > 0, ...options });

export const useCreateKaraokeSongPickMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSessionSongPick, unknown, { sessionId: number; body: { songId?: number; songTitle: string } }>({
        mutationFn: ({ sessionId, body }) => postKaraokeSongPick(sessionId, body),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicks(vars.sessionId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicksRanked(vars.sessionId) });
        },
    });
};

export const useImportKaraokeSongPicksMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSessionSongPick[], unknown, { sessionId: number; sourcePlaylistId: number }>({
        mutationFn: ({ sessionId, sourcePlaylistId }) => postImportKaraokeSongPicks(sessionId, { sourcePlaylistId }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicks(vars.sessionId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicksRanked(vars.sessionId) });
        },
    });
};

export const useDeleteKaraokeSongPickMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { sessionId: number; pickId: number }>({
        mutationFn: ({ pickId }) => deleteKaraokeSongPick(pickId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicks(vars.sessionId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicksRanked(vars.sessionId) });
        },
    });
};

export const useKaraokeSongPickSignupMutation = () => {
    const qc = useQueryClient();
    return useMutation<KaraokeSessionSongSignup, unknown, { sessionId: number; pickId: number; playerId: number; preferredSlot?: number }>({
        mutationFn: ({ pickId, playerId, preferredSlot }) => postKaraokeSongPickSignup(pickId, { playerId, preferredSlot }),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicks(vars.sessionId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicksRanked(vars.sessionId) });
        },
    });
};

export const useDeleteKaraokeSongPickSignupMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { sessionId: number; pickId: number }>({
        mutationFn: ({ pickId }) => deleteKaraokeSongPickSignup(pickId),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicks(vars.sessionId) });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.sessionSongPicksRanked(vars.sessionId) });
        },
    });
};
