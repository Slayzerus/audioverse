// modelsRadio.ts — Radio station DTOs (voice, chat, schedule, reactions, comments, follow, invites, external)

// ── Voice ──────────────────────────────────────────────────────────

/** POST /api/radio/{id}/voice/start → response */
export interface VoiceSessionResponse {
    voiceSessionId: string;
}

/** GET /api/radio/{id}/voice/status → response */
export interface VoiceStatusDto {
    isLive: boolean;
    djUserId?: string | null;
    djName?: string | null;
    startedAtUtc?: string | null;
}

// ── Archive ────────────────────────────────────────────────────────

/** GET /api/radio/{id}/archive/{date} → timeline entries */
export interface ArchiveTimelineEntry {
    type: "voice" | "track";
    startUtc: string;
    endUtc: string;
    trackId?: number | null;
    trackTitle?: string | null;
    trackArtist?: string | null;
    segmentIndex?: number | null;
    comment?: string | null;
}

/** GET /api/radio/{id}/archive/{date}/segments → segment list */
export interface ArchiveSegmentDto {
    segmentIndex: number;
    url: string; // presigned URL
    durationMs: number;
    startUtc: string;
}

// ── Invites ────────────────────────────────────────────────────────

/** POST /api/radio/{id}/invites — request body */
export interface CreateRadioInviteRequest {
    email: string;
    validFrom: string; // ISO 8601
    validTo: string;   // ISO 8601
    message?: string | null;
}

/** Radio invite DTO */
export interface RadioInviteDto {
    id: number;
    token: string;
    email: string;
    validFrom: string;
    validTo: string;
    message: string | null;
    guestName: string | null;
    isAccepted: boolean;
    createdAt: string;
}

/** GET /api/radio/invites/verify/{token} → response */
export interface InviteVerifyResponse {
    inviteId: number;
    radioStationId: number;
    stationName: string;
    validFrom: string;
    validTo: string;
}

/** POST /api/radio/invites/accept/{token} — request body */
export interface AcceptInviteRequest {
    guestName?: string | null;
}

// ── Schedule ───────────────────────────────────────────────────────

/** Radio schedule slot */
export interface RadioScheduleSlot {
    id: number;
    radioStationId: number;
    title: string;
    description: string | null;
    dayOfWeek: number | null;   // 0-6 (Sunday-Saturday), null for one-off
    specificDate: string | null; // ISO 8601 date, null for recurring
    startTime: string;           // "HH:mm" UTC
    endTime: string;             // "HH:mm" UTC
    playlistId: number | null;
    inviteId: number | null;
    djUserId: string | null;
    djName: string | null;
    isConfirmed: boolean;
    color: string | null;
}

/** POST/PUT /api/radio/{id}/schedule — request body */
export interface CreateScheduleSlotRequest {
    title: string;
    description?: string | null;
    dayOfWeek?: number | null;
    specificDate?: string | null;
    startTime: string;
    endTime: string;
    playlistId?: number | null;
    inviteId?: number | null;
    djUserId?: string | null;
    djName?: string | null;
    isConfirmed?: boolean;
    color?: string | null;
}

// ── Chat ───────────────────────────────────────────────────────────

/** Chat message DTO */
export interface RadioChatMessageDto {
    id: number;
    userId: string | null;
    displayName: string;
    content: string;
    messageType: string;
    sentAtUtc: string;
}

/** POST /api/radio/{id}/chat — request body */
export interface SendChatMessageRequest {
    content: string;
    displayName?: string | null;
}

// ── Reactions ──────────────────────────────────────────────────────

/** Reaction type enum */
export type ReactionType = "like" | "love" | "fire" | "sad" | "laugh" | "clap" | "dislike";

/** POST /api/radio/{id}/reactions — request body */
export interface SendReactionRequest {
    trackId?: number | null;
    externalTrackId?: string | null;
    reactionType: ReactionType;
}

/** GET /api/radio/{id}/reactions/summary → response */
export interface ReactionSummaryDto {
    trackId: number | null;
    like: number;
    love: number;
    fire: number;
    sad: number;
    laugh: number;
    clap: number;
    dislike: number;
    total: number;
}

// ── Comments & Ratings ─────────────────────────────────────────────

/** Station comment DTO */
export interface RadioCommentDto {
    id: number;
    userId: string | null;
    displayName: string;
    content: string;
    rating: number | null; // 1–5
    createdAt: string;
}

/** POST /api/radio/{id}/comments — request body */
export interface PostCommentRequest {
    content: string;
    displayName?: string | null;
    rating?: number | null; // 1–5
}

/** Paginated comments response with average rating */
export interface CommentsPageResponse {
    items: RadioCommentDto[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    averageRating: number | null;
}

// ── Follow ─────────────────────────────────────────────────────────

/** GET /api/radio/{id}/follow/status → response */
export interface FollowStatusDto {
    followersCount: number;
    isFollowing: boolean;
}

// ── External Radio Stations ────────────────────────────────────────

/** External radio station DTO */
export interface ExternalRadioStationDto {
    id: number;
    name: string;
    slug: string;
    streamUrl: string;
    websiteUrl: string | null;
    logoUrl: string | null;
    countryCode: string;
    language: string | null;
    genre: string | null;
    description: string | null;
    isActive: boolean;
}

/** POST /api/radio/external — create station (admin) */
export interface CreateExternalStationRequest {
    name: string;
    slug: string;
    streamUrl: string;
    websiteUrl?: string | null;
    logoUrl?: string | null;
    countryCode: string;
    language?: string | null;
    genre?: string | null;
    description?: string | null;
}

/** GET /api/radio/external/countries → response item */
export interface CountryStationCountDto {
    countryCode: string;
    stationCount: number;
}

/** Paginated response (reuse) */
export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}
