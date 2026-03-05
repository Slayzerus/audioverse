// apiEventsKeys.ts — Shared constants & types for apiEvents sub-modules

// === Base path ===
export const EVENTS_BASE = "/api/events";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const EVENTS_QK = {
    all: ["events"] as const,
    detail: (id: number) => ["events", id] as const,
    party: (eventId: number) => ["events", eventId, "party"] as const,
    posterUrl: (eventId: number) => ["events", eventId, "poster-url"] as const,
    posterPublicUrl: (eventId: number) => ["events", eventId, "poster-public-url"] as const,
    schedule: (eventId: number) => ["events", eventId, "schedule"] as const,
    menu: (eventId: number) => ["events", eventId, "menu"] as const,
    attractions: (eventId: number) => ["events", eventId, "attractions"] as const,
    boardGames: (eventId: number) => ["events", eventId, "board-games"] as const,
    videoGames: (eventId: number) => ["events", eventId, "video-games"] as const,
    bouncerWaiting: (eventId: number) => ["events", eventId, "bouncer", "waiting"] as const,
    photos: (eventId: number) => ["events", eventId, "photos"] as const,
    comments: (eventId: number) => ["events", eventId, "comments"] as const,
    participants: (eventId: number) => ["events", eventId, "participants"] as const,
    filtered: (params: Record<string, unknown>) => ["events", "filtered", params] as const,
    dateProposals: (eventId: number) => ["events", eventId, "dates"] as const,
    dateBest: (eventId: number) => ["events", eventId, "dates", "best"] as const,
    gamePicks: (eventId: number) => ["events", eventId, "game-picks"] as const,
    gamePicksRanked: (eventId: number) => ["events", eventId, "game-picks", "ranked"] as const,
    songPicks: (eventId: number, sessionId: number) => ["events", eventId, "sessions", sessionId, "song-picks"] as const,
    songPicksRanked: (eventId: number, sessionId: number) => ["events", eventId, "sessions", sessionId, "song-picks", "ranked"] as const,
    tabs: (eventId: number) => ["events", eventId, "tabs"] as const,
    organizers: ["events", "organizers"] as const,
};

/**
 * Lightweight DTO returned by GET /api/events/organizers.
 * MIGRATION: `id` is transitioning from UserProfile.Id to Player (UserProfilePlayer) ID.
 * After backend migration, `id` will be a Player.Id and `name` will be the Player name.
 */
export interface OrganizerDto {
    id: number;
    name: string;
}

/** Request body for RSVP and arrival endpoints.
 *  Users join events (not players). Players join sessions/rounds within attractions. */
export interface RsvpRequest {
    userId: number;
}

/** Response from RSVP/Arrive endpoints */
export interface RsvpResponse {
    success: boolean;
    status?: string;
    message?: string;
}

export interface EventFilterParams {
    page?: number;
    pageSize?: number;
    type?: number;
    status?: number;
    search?: string;
    from?: string; // ISO date
    to?: string;   // ISO date
    sortBy?: string;
    sortDesc?: boolean;
    [key: string]: unknown; // index signature for queryKey compatibility
}
