// apiGames.ts — Standalone Board Games & Video Games catalog API
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import { logger } from "../../utils/logger";
const log = logger.scoped('apiGames');
import type {
    BoardGame,
    VideoGame,
    BoardGameGenre,
    VideoGameGenre,
    BoardGameTag,
    BggGameDetails,
    BggHotGame,
    BggCollectionItem,
} from "../../models/modelsKaraoke";

// === Base paths ===
export const BOARD_GAMES_BASE = "/api/games/board";
export const VIDEO_GAMES_BASE = "/api/games/video";
export const USER_CONNECTIONS_BASE = "/api/user/connections";

export interface ExternalConnectionDto {
    platform?: string | null;
    connected?: boolean;
    username?: string | null;
}

// === Query Keys ===
/** @internal  use React Query hooks below */
export const GAMES_QK = {
    boardGames: ["board-games"] as const,
    boardGame: (id: number) => ["board-games", id] as const,
    bggSearch: (query: string) => ["board-games", "bgg", "search", query] as const,
    bggDetail: (bggId: number) => ["board-games", "bgg", bggId] as const,
    bggBatch: (ids: number[]) => ["board-games", "bgg", "batch", ...ids] as const,
    bggHot: ["board-games", "bgg", "hot"] as const,
    bggCollection: (username: string) => ["board-games", "bgg", "collection", username] as const,
    videoGames: ["video-games"] as const,
    videoGame: (id: number) => ["video-games", id] as const,
    steamSearch: (query: string) => ["video-games", "steam", "search", query] as const,
    steamDetail: (steamAppId: number) => ["video-games", "steam", steamAppId] as const,
    steamCollection: (steamId: string) => ["video-games", "steam", "collection", steamId] as const,
    igdbSearch: (query: string) => ["video-games", "igdb", "search", query] as const,
    igdbDetail: (igdbId: number) => ["video-games", "igdb", igdbId] as const,
    boardGameGenres: ["board-games", "genres"] as const,
    videoGameGenres: ["video-games", "genres"] as const,
    boardGameTags: ["board-games", "tags"] as const,
};

// ── Board Games CRUD ──────────────────────────────────────────

/** @internal GET /api/board-games — List all board games in catalog */
export const fetchBoardGames = async (): Promise<BoardGame[]> => {
    const { data } = await apiClient.get<BoardGame[]>(apiPath(BOARD_GAMES_BASE, ""));
    return Array.isArray(data) ? data : [];
};

/** @internal GET /api/board-games/{id} — Get board game by ID */
export const fetchBoardGameById = async (id: number): Promise<BoardGame> => {
    const { data } = await apiClient.get<BoardGame>(apiPath(BOARD_GAMES_BASE, `/${id}`));
    return data;
};

/** @internal POST /api/board-games — Create a board game */
export const postCreateBoardGame = async (game: Partial<BoardGame>): Promise<BoardGame> => {
    const { data } = await apiClient.post<BoardGame>(apiPath(BOARD_GAMES_BASE, ""), game);
    return data;
};

/** @internal PUT /api/board-games/{id} — Update a board game */
export const putUpdateBoardGame = async (id: number, game: Partial<BoardGame>): Promise<void> => {
    await apiClient.put(apiPath(BOARD_GAMES_BASE, `/${id}`), game);
};

/** @internal DELETE /api/board-games/{id} — Delete a board game */
export const deleteBoardGame = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BOARD_GAMES_BASE, `/${id}`));
};

// ── BGG Integration ───────────────────────────────────────────

/** @internal GET /api/board-games/bgg/search?query= — Search BoardGameGeek */
export const fetchBggSearch = async (query: string): Promise<BoardGame[]> => {
    const { data } = await apiClient.get<BoardGame[]>(apiPath(BOARD_GAMES_BASE, "/bgg/search"), {
        params: { query },
    });
    return data;
};

/** @internal GET /api/board-games/bgg/{bggId} — Get BGG details */
export const fetchBggDetail = async (bggId: number): Promise<BoardGame> => {
    const { data } = await apiClient.get<BoardGame>(apiPath(BOARD_GAMES_BASE, `/bgg/${bggId}`));
    return data;
};

/** @internal POST /api/games/board/bgg/import/{bggId} — Import from BGG into local catalog */
export const postImportBgg = async (bggId: number): Promise<BoardGame> => {
    const { data } = await apiClient.post<BoardGame>(apiPath(BOARD_GAMES_BASE, `/bgg/import/${bggId}`));
    return data;
};

// ── BGG Extended Integration ──────────────────────────────────

/** @internal GET /api/board-games/bgg/batch?bggIds=1,2,3 — Batch BGG details (max 20) */
export const fetchBggBatch = async (bggIds: number[]): Promise<BggGameDetails[]> => {
    const { data } = await apiClient.get<BggGameDetails[]>(apiPath(BOARD_GAMES_BASE, "/bgg/batch"), {
        params: { bggIds: bggIds.join(",") },
    });
    return data ?? [];
};

/** @internal GET /api/board-games/bgg/hot — Hot/trending games from BGG */
export const fetchBggHot = async (): Promise<BggHotGame[]> => {
    const { data } = await apiClient.get<BggHotGame[]>(apiPath(BOARD_GAMES_BASE, "/bgg/hot"));
    return data ?? [];
};

/** @internal GET /api/board-games/bgg/collection/{username}?owned=true — BGG user collection */
export const fetchBggCollection = async (username: string, owned = true): Promise<BggCollectionItem[]> => {
    const { data } = await apiClient.get<BggCollectionItem[]>(
        apiPath(BOARD_GAMES_BASE, `/bgg/collection/${encodeURIComponent(username)}`),
        { params: { owned } },
    );
    return data ?? [];
};

/** @internal POST /api/board-games/bgg/import/batch — Import multiple games from BGG */
export const postImportBggBatch = async (bggIds: number[]): Promise<BoardGame[]> => {
    const { data } = await apiClient.post<BoardGame[]>(apiPath(BOARD_GAMES_BASE, "/bgg/import/batch"), { bggIds });
    return data ?? [];
};

/** @internal POST /api/board-games/bgg/import/collection/{username} — Import user's BGG collection */
export const postImportBggCollection = async (username: string): Promise<BoardGame[]> => {
    const { data } = await apiClient.post<BoardGame[]>(
        apiPath(BOARD_GAMES_BASE, `/bgg/import/collection/${encodeURIComponent(username)}`),
    );
    return data ?? [];
};

/** @internal POST /api/board-games/{id}/refresh-bgg — Refresh BGG data for a game */
export const postRefreshBgg = async (id: number): Promise<BoardGame> => {
    const { data } = await apiClient.post<BoardGame>(apiPath(BOARD_GAMES_BASE, `/${id}/refresh-bgg`));
    return data;
};

// ── Video Games CRUD ──────────────────────────────────────────

/** @internal GET /api/video-games — List all video games in catalog */
export const fetchVideoGames = async (): Promise<VideoGame[]> => {
    const { data } = await apiClient.get<VideoGame[]>(apiPath(VIDEO_GAMES_BASE, ""));
    return Array.isArray(data) ? data : [];
};

/** @internal GET /api/video-games/{id} — Get video game by ID */
export const fetchVideoGameById = async (id: number): Promise<VideoGame> => {
    const { data } = await apiClient.get<VideoGame>(apiPath(VIDEO_GAMES_BASE, `/${id}`));
    return data;
};

/** @internal POST /api/video-games — Create a video game */
export const postCreateVideoGame = async (game: Partial<VideoGame>): Promise<VideoGame> => {
    const { data } = await apiClient.post<VideoGame>(apiPath(VIDEO_GAMES_BASE, ""), game);
    return data;
};

/** @internal PUT /api/video-games/{id} — Update a video game */
export const putUpdateVideoGame = async (id: number, game: Partial<VideoGame>): Promise<void> => {
    await apiClient.put(apiPath(VIDEO_GAMES_BASE, `/${id}`), game);
};

/** @internal DELETE /api/video-games/{id} — Delete a video game */
export const deleteVideoGame = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(VIDEO_GAMES_BASE, `/${id}`));
};

// ── Steam Integration ─────────────────────────────────────────

/** @internal GET /api/video-games/steam/search?query= — Search Steam store */
export const fetchSteamSearch = async (query: string): Promise<VideoGame[]> => {
    const { data } = await apiClient.get<VideoGame[]>(apiPath(VIDEO_GAMES_BASE, "/steam/search"), {
        params: { query },
    });
    return data;
};

/** @internal GET /api/video-games/steam/{steamAppId} — Get Steam store details */
export const fetchSteamDetail = async (steamAppId: number): Promise<VideoGame> => {
    const { data } = await apiClient.get<VideoGame>(apiPath(VIDEO_GAMES_BASE, `/steam/${steamAppId}`));
    return data;
};

/** @internal POST /api/video-games/steam/import/{steamAppId} — Import from Steam into local catalog */
export const postImportSteam = async (steamAppId: number): Promise<VideoGame> => {
    const { data } = await apiClient.post<VideoGame>(apiPath(VIDEO_GAMES_BASE, `/steam/import/${steamAppId}`));
    return data;
};

/** @internal GET /api/video-games/steam/collection/{steamId} — Get user's Steam library */
export const fetchSteamCollection = async (steamId: string): Promise<VideoGame[]> => {
    const { data } = await apiClient.get<VideoGame[]>(
        apiPath(VIDEO_GAMES_BASE, `/steam/collection/${encodeURIComponent(steamId)}`),
    );
    return data ?? [];
};

/** @internal POST /api/video-games/steam/import/batch — Import multiple Steam games at once */
export const postImportSteamBatch = async (steamAppIds: number[]): Promise<VideoGame[]> => {
    const { data } = await apiClient.post<VideoGame[]>(
        apiPath(VIDEO_GAMES_BASE, "/steam/import/batch"),
        { steamAppIds },
    );
    return data ?? [];
};

/** @internal POST /api/video-games/steam/import/collection/{steamId} — Import user's whole Steam library */
export const postImportSteamCollection = async (steamId: string): Promise<VideoGame[]> => {
    const { data } = await apiClient.post<VideoGame[]>(
        apiPath(VIDEO_GAMES_BASE, `/steam/import/collection/${encodeURIComponent(steamId)}`),
    );
    return data ?? [];
};

// ── IGDB Integration ──────────────────────────────────────────

/** @internal GET /api/games/video/igdb/search?query= — Search IGDB */
export const fetchIgdbSearch = async (query: string): Promise<VideoGame[]> => {
    const { data } = await apiClient.get<VideoGame[]>(apiPath(VIDEO_GAMES_BASE, "/igdb/search"), {
        params: { query },
    });
    return data ?? [];
};

/** @internal GET /api/games/video/igdb/{igdbId} — Get IGDB detail */
export const fetchIgdbDetail = async (igdbId: number): Promise<VideoGame> => {
    const { data } = await apiClient.get<VideoGame>(apiPath(VIDEO_GAMES_BASE, `/igdb/${igdbId}`));
    return data;
};

/** @internal POST /api/games/video/igdb/import/{igdbId} — Import from IGDB into catalog */
export const postImportIgdb = async (igdbId: number): Promise<VideoGame> => {
    const { data } = await apiClient.post<VideoGame>(apiPath(VIDEO_GAMES_BASE, `/igdb/import/${igdbId}`));
    return data;
};

// ── Board Game Genres & Tags ──────────────────────────────────

/** @internal GET /api/games/board/genres — List board game genres */
export const fetchBoardGameGenres = async (): Promise<BoardGameGenre[]> => {
    const { data } = await apiClient.get<BoardGameGenre[]>(apiPath(BOARD_GAMES_BASE, "/genres"));
    return data ?? [];
};

/** @internal POST /api/games/board/genres — Create board game genre */
export const postCreateBoardGameGenre = async (genre: Partial<BoardGameGenre>): Promise<BoardGameGenre> => {
    const { data } = await apiClient.post<BoardGameGenre>(apiPath(BOARD_GAMES_BASE, "/genres"), genre);
    return data;
};

/** @internal GET /api/games/board/tags — List board game tags */
export const fetchBoardGameTags = async (): Promise<BoardGameTag[]> => {
    const { data } = await apiClient.get<BoardGameTag[]>(apiPath(BOARD_GAMES_BASE, "/tags"));
    return data ?? [];
};

/** @internal POST /api/games/board/tags — Create board game tag */
export const postCreateBoardGameTag = async (tag: Partial<BoardGameTag>): Promise<BoardGameTag> => {
    const { data } = await apiClient.post<BoardGameTag>(apiPath(BOARD_GAMES_BASE, "/tags"), tag);
    return data;
};

// ── Video Game Genres ─────────────────────────────────────────

/** @internal GET /api/games/video/genres — List video game genres */
export const fetchVideoGameGenres = async (): Promise<VideoGameGenre[]> => {
    const { data } = await apiClient.get<VideoGameGenre[]>(apiPath(VIDEO_GAMES_BASE, "/genres"));
    return data ?? [];
};

/** @internal POST /api/games/video/genres — Create video game genre */
export const postCreateVideoGameGenre = async (genre: Partial<VideoGameGenre>): Promise<VideoGameGenre> => {
    const { data } = await apiClient.post<VideoGameGenre>(apiPath(VIDEO_GAMES_BASE, "/genres"), genre);
    return data;
};

// ── External Connections (Steam OAuth) ──────────────────────

/** @internal */
export const fetchUserConnections = async (): Promise<ExternalConnectionDto[]> => {
    const { data } = await apiClient.get<ExternalConnectionDto[]>(apiPath(USER_CONNECTIONS_BASE, ""));
    return data ?? [];
};

/** @internal */
export const fetchPlatformAuthUrl = async (platform: string, redirectUri?: string): Promise<string> => {
    const { data } = await apiClient.get<unknown>(
        apiPath(USER_CONNECTIONS_BASE, `/${encodeURIComponent(platform)}/auth-url`),
        { params: redirectUri ? { redirectUri } : undefined },
    );

    if (typeof data === "string") return data;
    if (data && typeof data === "object") {
        const maybe = data as Record<string, unknown>;
        const authUrl = maybe.authUrl ?? maybe.url;
        if (typeof authUrl === "string") return authUrl;
    }

    return "";
};

export interface OAuthCallbackRequest {
    code?: string | null;
    accessToken?: string | null;
    redirectUri?: string | null;
    state?: string | null;
}

/** @internal */
export const postOAuthCallback = async (
    platform: string,
    body: OAuthCallbackRequest,
): Promise<void> => {
    await apiClient.post(
        apiPath(USER_CONNECTIONS_BASE, `/${encodeURIComponent(platform)}/callback`),
        body,
    );
};

// === React Query hooks ===

// ── Board Games hooks ─────────────────────────────────────────

export const useBoardGamesQuery = (
    options?: Partial<UseQueryOptions<BoardGame[], unknown, BoardGame[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.boardGames,
        queryFn: fetchBoardGames,
        ...options,
    });

export const useBoardGameQuery = (
    id: number,
    options?: Partial<UseQueryOptions<BoardGame, unknown, BoardGame, QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.boardGame(id),
        queryFn: () => fetchBoardGameById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

export const useCreateBoardGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGame, unknown, Partial<BoardGame>>({
        mutationFn: (game) => postCreateBoardGame(game),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

export const useUpdateBoardGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; game: Partial<BoardGame> }>({
        mutationFn: ({ id, game }) => putUpdateBoardGame(id, game),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGame(vars.id) });
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

export const useDeleteBoardGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteBoardGame(id),
        onSuccess: (_data, id) => {
            qc.removeQueries({ queryKey: GAMES_QK.boardGame(id) });
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

export const useBggSearchQuery = (
    query: string,
    options?: Partial<UseQueryOptions<BoardGame[], unknown, BoardGame[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.bggSearch(query),
        queryFn: () => fetchBggSearch(query),
        enabled: !!query,
        ...options,
    });

export const useBggDetailQuery = (
    bggId: number,
    options?: Partial<UseQueryOptions<BoardGame, unknown, BoardGame, QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.bggDetail(bggId),
        queryFn: () => fetchBggDetail(bggId),
        enabled: Number.isFinite(bggId),
        ...options,
    });

export const useImportBggMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGame, unknown, number>({
        mutationFn: (bggId) => postImportBgg(bggId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

export const useImportBoardGamesJsonMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGame[], unknown, File>({
        mutationFn: async (file) => {
            const text = await file.text();
            const games = JSON.parse(text) as Partial<BoardGame>[];
            const results: BoardGame[] = [];
            for (const game of games) {
                const { id: _id, ...rest } = game;
                try {
                    const res = await postCreateBoardGame(rest);
                    results.push(res);
                } catch (e) {
                    log.error("Failed to import game", game, e);
                }
            }
            return results;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

// ── BGG Extended hooks ────────────────────────────────────────

export const useBggBatchQuery = (
    bggIds: number[],
    options?: Partial<UseQueryOptions<BggGameDetails[], unknown, BggGameDetails[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.bggBatch(bggIds),
        queryFn: () => fetchBggBatch(bggIds),
        enabled: bggIds.length > 0,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useBggHotQuery = (
    options?: Partial<UseQueryOptions<BggHotGame[], unknown, BggHotGame[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.bggHot,
        queryFn: fetchBggHot,
        staleTime: 10 * 60_000,
        ...options,
    });

export const useBggCollectionQuery = (
    username: string,
    options?: Partial<UseQueryOptions<BggCollectionItem[], unknown, BggCollectionItem[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.bggCollection(username),
        queryFn: () => fetchBggCollection(username),
        enabled: !!username,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useImportBggBatchMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGame[], unknown, number[]>({
        mutationFn: (bggIds) => postImportBggBatch(bggIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

export const useImportBggCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGame[], unknown, string>({
        mutationFn: (username) => postImportBggCollection(username),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

export const useRefreshBggMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGame, unknown, number>({
        mutationFn: (id) => postRefreshBgg(id),
        onSuccess: (_data, id) => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGame(id) });
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGames });
        },
    });
};

// ── Video Games hooks ─────────────────────────────────────────

export const useVideoGamesQuery = (
    options?: Partial<UseQueryOptions<VideoGame[], unknown, VideoGame[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.videoGames,
        queryFn: fetchVideoGames,
        ...options,
    });

export const useVideoGameQuery = (
    id: number,
    options?: Partial<UseQueryOptions<VideoGame, unknown, VideoGame, QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.videoGame(id),
        queryFn: () => fetchVideoGameById(id),
        enabled: Number.isFinite(id),
        ...options,
    });

export const useCreateVideoGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGame, unknown, Partial<VideoGame>>({
        mutationFn: (game) => postCreateVideoGame(game),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

export const useUpdateVideoGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; game: Partial<VideoGame> }>({
        mutationFn: ({ id, game }) => putUpdateVideoGame(id, game),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGame(vars.id) });
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

export const useDeleteVideoGameMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteVideoGame(id),
        onSuccess: (_data, id) => {
            qc.removeQueries({ queryKey: GAMES_QK.videoGame(id) });
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

export const useSteamSearchQuery = (
    query: string,
    options?: Partial<UseQueryOptions<VideoGame[], unknown, VideoGame[], QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.steamSearch(query),
        queryFn: () => fetchSteamSearch(query),
        enabled: !!query,
        ...options,
    });

export const useSteamDetailQuery = (
    steamAppId: number,
    options?: Partial<UseQueryOptions<VideoGame, unknown, VideoGame, QueryKey>>
) =>
    useQuery({
        queryKey: GAMES_QK.steamDetail(steamAppId),
        queryFn: () => fetchSteamDetail(steamAppId),
        enabled: Number.isFinite(steamAppId),
        ...options,
    });

export const useImportSteamMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGame, unknown, number>({
        mutationFn: (steamAppId) => postImportSteam(steamAppId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

export const useSteamCollectionQuery = (
    steamId: string,
    options?: Partial<UseQueryOptions<VideoGame[], unknown, VideoGame[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAMES_QK.steamCollection(steamId),
        queryFn: () => fetchSteamCollection(steamId),
        enabled: !!steamId,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useImportSteamBatchMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGame[], unknown, number[]>({
        mutationFn: (steamAppIds) => postImportSteamBatch(steamAppIds),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

export const useImportSteamCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGame[], unknown, string>({
        mutationFn: (steamId) => postImportSteamCollection(steamId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

export const useUserConnectionsQuery = (
    options?: Partial<UseQueryOptions<ExternalConnectionDto[], unknown, ExternalConnectionDto[], QueryKey>>,
) =>
    useQuery({
        queryKey: ["user-connections"],
        queryFn: fetchUserConnections,
        ...options,
    });

export const useImportVideoGamesJsonMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGame[], unknown, File>({
        mutationFn: async (file) => {
            const text = await file.text();
            const games = JSON.parse(text) as Partial<VideoGame>[];
            const results: VideoGame[] = [];
            for (const game of games) {
                const { id: _id, ...rest } = game;
                try {
                    const res = await postCreateVideoGame(rest);
                    results.push(res);
                } catch (e) {
                    log.error("Failed to import game", game, e);
                }
            }
            return results;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

// ── IGDB hooks ────────────────────────────────────────────────

export const useIgdbSearchQuery = (
    query: string,
    options?: Partial<UseQueryOptions<VideoGame[], unknown, VideoGame[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAMES_QK.igdbSearch(query),
        queryFn: () => fetchIgdbSearch(query),
        enabled: !!query && query.length >= 2,
        staleTime: 60_000,
        ...options,
    });

export const useIgdbDetailQuery = (
    igdbId: number,
    options?: Partial<UseQueryOptions<VideoGame, unknown, VideoGame, QueryKey>>,
) =>
    useQuery({
        queryKey: GAMES_QK.igdbDetail(igdbId),
        queryFn: () => fetchIgdbDetail(igdbId),
        enabled: Number.isFinite(igdbId) && igdbId > 0,
        ...options,
    });

export const useImportIgdbMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGame, unknown, number>({
        mutationFn: (igdbId) => postImportIgdb(igdbId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGames });
        },
    });
};

// ── Genre & Tag hooks ─────────────────────────────────────────

export const useBoardGameGenresQuery = (
    options?: Partial<UseQueryOptions<BoardGameGenre[], unknown, BoardGameGenre[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAMES_QK.boardGameGenres,
        queryFn: fetchBoardGameGenres,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useCreateBoardGameGenreMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameGenre, unknown, Partial<BoardGameGenre>>({
        mutationFn: (genre) => postCreateBoardGameGenre(genre),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGameGenres });
        },
    });
};

export const useBoardGameTagsQuery = (
    options?: Partial<UseQueryOptions<BoardGameTag[], unknown, BoardGameTag[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAMES_QK.boardGameTags,
        queryFn: fetchBoardGameTags,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useCreateBoardGameTagMutation = () => {
    const qc = useQueryClient();
    return useMutation<BoardGameTag, unknown, Partial<BoardGameTag>>({
        mutationFn: (tag) => postCreateBoardGameTag(tag),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.boardGameTags });
        },
    });
};

export const useVideoGameGenresQuery = (
    options?: Partial<UseQueryOptions<VideoGameGenre[], unknown, VideoGameGenre[], QueryKey>>,
) =>
    useQuery({
        queryKey: GAMES_QK.videoGameGenres,
        queryFn: fetchVideoGameGenres,
        staleTime: 5 * 60_000,
        ...options,
    });

export const useCreateVideoGameGenreMutation = () => {
    const qc = useQueryClient();
    return useMutation<VideoGameGenre, unknown, Partial<VideoGameGenre>>({
        mutationFn: (genre) => postCreateVideoGameGenre(genre),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: GAMES_QK.videoGameGenres });
        },
    });
};

export default {
    // Board Games
    fetchBoardGames,
    fetchBoardGameById,
    postCreateBoardGame,
    putUpdateBoardGame,
    deleteBoardGame,
    fetchBggSearch,
    fetchBggDetail,
    postImportBgg,
    // BGG Extended
    fetchBggBatch,
    fetchBggHot,
    fetchBggCollection,
    postImportBggBatch,
    postImportBggCollection,
    postRefreshBgg,
    // Board Game Genres & Tags
    fetchBoardGameGenres,
    postCreateBoardGameGenre,
    fetchBoardGameTags,
    postCreateBoardGameTag,
    // Video Games
    fetchVideoGames,
    fetchVideoGameById,
    postCreateVideoGame,
    putUpdateVideoGame,
    deleteVideoGame,
    fetchSteamSearch,
    fetchSteamDetail,
    postImportSteam,
    fetchSteamCollection,
    postImportSteamBatch,
    postImportSteamCollection,
    // IGDB
    fetchIgdbSearch,
    fetchIgdbDetail,
    postImportIgdb,
    // Video Game Genres
    fetchVideoGameGenres,
    postCreateVideoGameGenre,
};
