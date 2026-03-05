// apiKaraokeBase.ts — Shared constants, query keys, and utility types for karaoke API
import type { SongFilterRequest } from "../../../models/modelsKaraoke";

// === Base path ===
export const KARAOKE_BASE = "/api/karaoke";

// === Utility types ===
export type SongFilters = {
    title?: string;
    artist?: string;
    genre?: string;
    language?: string;
    year?: number;
};

export interface UltrastarFileData {
    fileName: string;
    data: string;
}

export interface TopSinging {
    singingId: number;
    roundId: number;
    playerId: number;
    playerName: string;
    score: number;
    hits?: number;
    misses?: number;
    good?: number;
    perfect?: number;
    combo?: number;
    performedAt?: string;
}

// === Dynamic filter types (PascalCase — matches backend API contract) ===
/** Matches backend AudioVerse.Application.Models.Requests.Karaoke.FilterOperator */
export const FilterOperator = {
    Equals: 0,
    In: 1,
    Contains: 2,
    Gte: 3,
    Lte: 4,
    Between: 5,
} as const;

export interface DynamicFilterCondition {
    Field: string;
    Operator: number;
    Values: Array<string | number>;
}

export interface DynamicFilterRequest {
    Conditions?: DynamicFilterCondition[];
    Page?: number;
    PageSize?: number;
    SortBy?: string;
    SortDir?: 'asc' | 'desc';
}

export interface PagedResult<T> {
    Items: T[];
    TotalCount: number;
    Page?: number;
    PageSize?: number;
}

// === Query Keys ===
export const KARAOKE_QK = {
    parties: ["karaoke", "parties"] as const,
    partiesFiltered: (req: DynamicFilterRequest) => ["karaoke", "parties", "filtered", req] as const,
    party: (id: number) => ["karaoke", "party", id] as const,
    partyStatus: (id: number) => ["karaoke", "party", id, "status"] as const,
    players: ["karaoke", "players"] as const,
    songs: (filters: SongFilters = {}) => ["karaoke", "songs", filters] as const,
    songsAll: ["karaoke", "songs", "all"] as const,
    songsFiltered: (req: DynamicFilterRequest | SongFilterRequest) => ["karaoke", "songs", "filtered", req] as const,
    song: (id: number) => ["karaoke", "song", id] as const,
    collaborators: (songId: number) => ["karaoke", "song", songId, "collaborators"] as const,
    versions: (songId: number) => ["karaoke", "song", songId, "versions"] as const,
    version: (songId: number, version: number) => ["karaoke", "song", songId, "version", version] as const,
    topSingings: (songId: number) => ["karaoke", "song", songId, "top-singings"] as const,
    ranking: (top?: number) => ["karaoke", "stats", "ranking", top] as const,
    history: (userId: number) => ["karaoke", "stats", "history", userId] as const,
    activity: (days?: number) => ["karaoke", "stats", "activity", days] as const,
    playlist: (id: number) => ["karaoke", "playlist", id] as const,
    myPlaylists: ["karaoke", "playlists", "mine"] as const,
    onlinePlaylists: ["karaoke", "playlists", "online"] as const,
    adminBuckets: ["karaoke", "admin", "buckets"] as const,
    adminUploadFailures: ["karaoke", "admin", "upload-failures"] as const,
    games: (partyId: number) => ["karaoke", "party", partyId, "games"] as const,
    game: (gameId: number) => ["karaoke", "game", gameId] as const,
    teams: (eventId: number) => ["karaoke", "teams", eventId] as const,
    team: (teamId: number) => ["karaoke", "team", teamId] as const,
    teamPlayers: (teamId: number) => ["karaoke", "team", teamId, "players"] as const,
    queue: (eventId: number) => ["karaoke", "queue", eventId] as const,
    favorites: (playerId: number) => ["karaoke", "favorites", playerId] as const,
    youtubeSearch: (query: string) => ["karaoke", "youtube", "search", query] as const,
    youtubeVideo: (videoId: string) => ["karaoke", "youtube", videoId] as const,
    sessionSongPicks: (sessionId: number) => ["karaoke", "session", sessionId, "song-picks"] as const,
    sessionSongPicksRanked: (sessionId: number) => ["karaoke", "session", sessionId, "song-picks", "ranked"] as const,
    sessionRounds: (sessionId: number) => ["karaoke", "session", sessionId, "rounds"] as const,
};
