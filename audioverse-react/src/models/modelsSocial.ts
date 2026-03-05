// modelsSocial.ts — Social API DTOs (ratings, tags, comments, user lists)

// ── Entity types ───────────────────────────────────────────────────

export enum RateableEntityType {
    AvGame = 0,
    KaraokeSong = 1,
    RadioStation = 2,
    Event = 3,
    Movie = 4,
    Series = 5,
    Album = 6,
    Artist = 7,
    Playlist = 8,
    BoardGame = 9,
    VideoGame = 10,
    VendorProfile = 11,
    WikiPage = 12,
    MediaItem = 13,
    Other = 99,
}

/** String names the frontend sends → backend maps to int */
export type EntityTypeString =
    | "AvGame"
    | "KaraokeSong"
    | "RadioStation"
    | "Event"
    | "Movie"
    | "Series"
    | "Album"
    | "Artist"
    | "Playlist"
    | "BoardGame"
    | "VideoGame"
    | "VendorProfile"
    | "WikiPage"
    | "MediaItem"
    | "Other";

// ── Rating criteria ────────────────────────────────────────────────

export type RatingCriterion =
    | "Fun"
    | "Replayability"
    | "Presentation"
    | "Arrangement"
    | "Singability"
    | "Lyrics"
    | "MusicSelection"
    | "StreamQuality"
    | "HostQuality"
    | "Organization"
    | "Atmosphere"
    | "ValueForMoney"
    | "Story"
    | "Acting"
    | "Visuals"
    | "ServiceQuality"
    | "Communication"
    | "PriceFairness";

/** Suggested criteria per entity type */
export const ENTITY_CRITERIA: Partial<Record<EntityTypeString, [RatingCriterion, RatingCriterion, RatingCriterion]>> = {
    AvGame:        ["Fun", "Replayability", "Presentation"],
    KaraokeSong:   ["Arrangement", "Singability", "Lyrics"],
    RadioStation:  ["MusicSelection", "StreamQuality", "HostQuality"],
    Event:         ["Organization", "Atmosphere", "ValueForMoney"],
    Movie:         ["Story", "Acting", "Visuals"],
    Series:        ["Story", "Acting", "Visuals"],
    Album:         ["Arrangement", "Lyrics", "Presentation"],
    BoardGame:     ["Fun", "Replayability", "Presentation"],
    VideoGame:     ["Fun", "Replayability", "Presentation"],
    VendorProfile: ["ServiceQuality", "Communication", "PriceFairness"],
};

// ── Reactions ──────────────────────────────────────────────────────

export type ReactionType = "like" | "love" | "fire" | "laugh" | "sad" | "dislike";

export const REACTION_EMOJI: Record<ReactionType, string> = {
    like: "👍",
    love: "❤️",
    fire: "🔥",
    laugh: "😂",
    sad: "😢",
    dislike: "👎",
};

export const ALL_REACTIONS: ReactionType[] = ["like", "love", "fire", "laugh", "sad", "dislike"];

// ── User list names ────────────────────────────────────────────────

export type ListName = "favorites" | "watchlist" | "want-to-play" | "completed" | "dropped" | "backlog";

export const ALL_LIST_NAMES: ListName[] = ["favorites", "watchlist", "want-to-play", "completed", "dropped", "backlog"];

export const LIST_LABELS: Record<ListName, string> = {
    favorites: "Favorites",
    watchlist: "Watchlist",
    "want-to-play": "Want to Play",
    completed: "Completed",
    dropped: "Dropped",
    backlog: "Backlog",
};

export const LIST_ICONS: Record<ListName, string> = {
    favorites: "⭐",
    watchlist: "👁️",
    "want-to-play": "🎮",
    completed: "✅",
    dropped: "❌",
    backlog: "📋",
};

// ── Request DTOs ───────────────────────────────────────────────────

export interface UpsertRatingRequest {
    entityType: EntityTypeString;
    entityId: number;
    playerId: number;
    overallScore: number; // 1–10
    criterion1?: RatingCriterion;
    criterion1Score?: number;
    criterion2?: RatingCriterion;
    criterion2Score?: number;
    criterion3?: RatingCriterion;
    criterion3Score?: number;
    reviewText?: string;
    containsSpoilers?: boolean;
}

export interface AddTagRequest {
    entityType: EntityTypeString;
    entityId: number;
    playerId: number;
    tag: string;
}

export interface AddCommentRequest {
    entityType: EntityTypeString;
    entityId: number;
    playerId: number;
    content: string;
    parentCommentId?: number | null;
    containsSpoilers?: boolean;
}

export interface UpdateCommentRequest {
    content: string;
}

export interface AddToListRequest {
    entityType: EntityTypeString;
    entityId: number;
    playerId: number;
    listName: string;
    note?: string;
}

// ── Response DTOs ──────────────────────────────────────────────────

export interface RatingAggregateDto {
    entityType: number;
    entityId: number;
    ratingCount: number;
    averageOverall: number;
    averageCriterion1: number | null;
    averageCriterion2: number | null;
    averageCriterion3: number | null;
    reviewCount: number;
    lastUpdatedAtUtc: string;
}

export interface UserRatingDto {
    id: number;
    playerId: number;
    playerName: string | null;
    overallScore: number;
    criterion1: string | null;
    criterion1Score: number | null;
    criterion2: string | null;
    criterion2Score: number | null;
    criterion3: string | null;
    criterion3Score: number | null;
    reviewText: string | null;
    containsSpoilers: boolean;
    createdAtUtc: string;
    updatedAtUtc: string;
}

export interface TagCloudEntry {
    tag: string;
    count: number;
}

export interface ReactionCountDto {
    type: string;
    count: number;
}

export interface CommentDto {
    id: number;
    playerId: number;
    playerName: string | null;
    content: string;
    containsSpoilers: boolean;
    isEdited: boolean;
    parentCommentId: number | null;
    createdAtUtc: string;
    updatedAtUtc: string;
    reactions: ReactionCountDto[];
    replies: CommentDto[];
}

export interface CommentPage {
    totalCount: number;
    page: number;
    pageSize: number;
    items: CommentDto[];
}

export interface UserListEntryDto {
    id: number;
    entityType: string;
    entityId: number;
    listName: string;
    note: string | null;
    sortOrder: number;
    createdAtUtc: string;
}

export interface RatingsPage {
    totalCount: number;
    page: number;
    pageSize: number;
    items: UserRatingDto[];
}
