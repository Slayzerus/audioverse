// ── Karaoke core domain models ──
// Extracted from modelsKaraoke.ts

import type { Event, UserProfilePlayer, UserProfilePlayerDto, PartyPlayerStatus, PartyPermissionFlag } from './modelsEvent';
import { EventAccessType, EventLocationType } from './modelsEvent';

// Re-export referenced types so consumers can still get them from barrel
export type { Event, UserProfilePlayer, UserProfilePlayerDto, PartyPlayerStatus, PartyPermissionFlag };

// ── Karaoke core models ──

/**
 * @deprecated KaraokeParty has been replaced by Event on the backend.
 * Use `Event` from modelsEvent.ts for new code. This alias is kept for backward compatibility.
 */
export type KaraokeParty = Event;

/** @deprecated Prefer using Event directly. This wraps event + session status. */
export interface KaraokePartyStatus {
    /** @deprecated Use eventId */
    partyId: number;
    /** Alias for partyId */
    eventId?: number;
    status?: string;
    /** @deprecated Use Event directly */
    party?: KaraokeParty;
    /** Alias — the event itself */
    event?: Event;
    players?: KaraokePlayer[];
    rounds?: KaraokePartyRound[];
    [key: string]: unknown;
}

export interface KaraokePlayer {
    id: number;
    name: string;
    color?: string;
}

/**
 * Event-level participant (RSVP / attendance).
 * Maps to backend EventParticipant entity.
 * Players are only at the game-session level (KaraokeRoundPlayer etc.).
 */
export interface EventParticipant {
    id?: number;
    eventId?: number | null;
    userId: number;
    user?: UserProfilePlayer | null;
    /** Status may come as number (enum) or string (\"Registered\", \"Waiting\", etc.) */
    status?: PartyPlayerStatus | string;
    registeredAt?: string | null;
    arrivedAt?: string | null;
}

/**
 * @deprecated Renamed to EventParticipant. Use EventParticipant instead.
 * Kept for backward compatibility during migration.
 */
export type KaraokePartyPlayer = EventParticipant;

export interface KaraokePartyPlaylist {
    partyId: number;
    party?: KaraokeParty | null;
    playlistId: number;
    playlist?: KaraokePlaylist | null;
}

export interface KaraokePlaylist {
    id: number;
    name?: string | null;
    playlistSongs?: KaraokePlaylistSong[] | null;
}

export interface KaraokePlaylistSong {
    playlistId: number;
    playlist?: KaraokePlaylist | null;
    songId: number;
    song?: KaraokeSongFile | null;
}

export interface KaraokePartyRound {
    id: number;
    partyId: number;
    eventId?: number | null;
    party?: KaraokeParty | null;
    sessionId?: number | null;
    session?: KaraokeSession | null;
    gameId?: number | null;
    game?: KaraokeGame | null;
    playlistId?: number | null;
    playlist?: KaraokePlaylist | null;
    songId: number;
    song?: KaraokeSongFile | null;
    number: number;
    startTime?: string | null;
    createdAt?: string;
    performedAt?: string | null;
    singing?: KaraokeSinging[] | null;
    parts?: KaraokeRoundPart[] | null;
    players?: KaraokeRoundPlayer[] | null;
    teamMode?: boolean;
}

// ── Party Attractions ──
export type AttractionType = "karaoke" | "videoGame" | "boardGame" | "photoBooth" | "danceFloor" | "djSet" | "custom";

export interface PartyAttraction {
    id: string;
    partyId: number;
    type: AttractionType;
    referenceId: number | string;
    name: string;
    description?: string;
    imageUrl?: string;
    suggesterName?: string;
    votes: number;
    status: "suggested" | "approved" | "played" | "rejected";
    createdAt: string;
    /** Linked session id — set when proposal is approved and session is created */
    sessionId?: number | null;
}

export interface AttractionVote {
    attractionId: string;
    playerId: number;
    vote: 1 | -1;
}

export interface KaraokeSinging {
    id: number;
    roundId: number;
    round?: KaraokePartyRound | null;
    roundPartId?: number | null;
    roundPart?: KaraokeRoundPart | null;
    playerId: number;
    player?: UserProfilePlayer | null;
    score: number;
    hits?: number;
    misses?: number;
    good?: number;
    perfect?: number;
    combo?: number;
    recordings?: KaraokeSingingRecording[] | null;
}

export interface KaraokeSingingRecording {
    id: number;
    singingId: number;
    singing?: KaraokeSinging | null;
    fileName?: string | null;
    data?: string | null;
    type?: RecordingType;
}

export enum RecordingType {
    Audio = 0,
    Video = 1,
}

export interface KaraokeSession {
    id: number;
    eventId?: number | null;
    /** @deprecated Use eventId instead */
    partyId?: number;
    party?: KaraokeParty | null;
    name?: string | null;
    createdAt: string;
    startedAt?: string | null;
    endedAt?: string | null;
    mode?: KaraokeSessionMode;
    teamMode?: boolean;
    isLimitedToEventPlaylist?: boolean;
    teams?: KaraokeTeam[] | null;
    rounds?: KaraokePartyRound[] | null;
}

// ── KaraokeGame ──

export type KaraokeGameStatus = 'draft' | 'active' | 'finished' | 'cancelled';
export type KaraokeGameMode = 'classic' | 'blind' | 'elimination' | 'relay' | 'freestyle';

export type SongSelectionMode = 'freeForAll' | 'roundRobin' | 'hostOnly' | 'firstCome';

export interface KaraokeGameTheme {
    primaryColor?: string;
    secondaryColor?: string;
    fontFamily?: string;
    backgroundUrl?: string;
}

export interface KaraokeGame {
    id: number;
    partyId: number;
    party?: KaraokeParty | null;
    name: string;
    mode: KaraokeGameMode;
    status: KaraokeGameStatus;
    maxRounds: number;
    timeLimitPerRound: number;
    theme?: KaraokeGameTheme | null;
    orderIndex: number;
    createdAt: string;
    startedAt?: string | null;
    endedAt?: string | null;
    rounds?: KaraokePartyRound[] | null;
}

export interface KaraokeRoundPart {
    id: number;
    roundId: number;
    round?: KaraokePartyRound | null;
    partNumber: number;
    playerId?: number | null;
    player?: UserProfilePlayer | null;
    performedAt?: string | null;
    singings?: KaraokeSinging[] | null;
}

export interface KaraokeRoundPlayer {
    id: number;
    roundId: number;
    round?: KaraokePartyRound | null;
    playerId: number;
    player?: UserProfilePlayer | null;
    slot?: number | null;
    joinedAt?: string | null;
    micDeviceId?: string | null;
}

export interface KaraokeRoundPlayerDto {
    id: number;
    roundId: number;
    playerId: number;
    slot: number;
    joinedAt?: string | null;
    player?: UserProfilePlayerDto | null;
    micDeviceId?: string | null;
}

export interface AddRoundPlayerRequest {
    playerId: number;
    slot?: number | null;
    micDeviceId?: string | null;
}

export interface UpdateRoundPlayerSlotRequest {
    slot: number;
}

export interface UpdatePartyPlayerStatusRequest {
    status: PartyPlayerStatus;
}

export interface JoinRequest {
    code?: string | null;
}

// ── Linked song data (from audio catalog) ──

/** Detail entry from the audio catalog (raw key-value) */
export interface SongDetailDto {
    type: string;   // "StreamingLinks" | "Identifiers" | "Popularity" | "Credits" | "Lyrics"
    value: string;
}

/** Linked song info from the audio catalog, attached to a karaoke song */
export interface LinkedSongInfoDto {
    songId: number;
    title: string;
    isrc: string | null;
    artistName: string | null;
    artistImageUrl: string | null;
    artistCountry: string | null;
    artistBio: string | null;
    albumTitle: string | null;
    albumReleaseYear: number | null;
    albumCoverUrl: string | null;
    streamingLinks: string[];
    externalCoverUrl: string | null;
    durationSeconds: number | null;
    details: SongDetailDto[];
}

export interface KaraokeSong {
    id: number;
    title: string;
    artist: string;
    genre: string;
    language: string;
    year: number;
    coverPath?: string;
    videoPath?: string;
    filePath?: string;
    youtubeId?: string;
    coverImage?: string;
    backgroundImage?: string;
    mbid?: string;
    musicbrainzReleaseId?: string;
    releaseMbid?: string;
    releaseId?: string;
    release_id?: string;
    /** External import source: "Spotify" | "YouTube" | null */
    externalSource?: string | null;
    /** External ID (Spotify track ID / YouTube video ID) */
    externalId?: string | null;
    /** Cover URL from external service */
    externalCoverUrl?: string | null;
    /** FK to Song in audio catalog */
    linkedSongId?: number | null;
    /** Full linked song details (null if unlinked or not requested) */
    linkedSong?: LinkedSongInfoDto | null;
}

export interface CreatePartyRequest {
    name: string;
    description: string;
    /**
     * ID of the organizing entity.
     * MIGRATION: Transitioning from UserProfile.Id to Player (UserProfilePlayer) ID.
     * After backend migration, pass the Player.Id of the organizer.
     */
    organizerId: number;
    startTime?: string;
    endTime?: string;
    status?: PartyStatus;
    type?: KaraokePartyType;
    access?: KaraokePartyAccess;
    code?: string;
}

export interface CreatePlayerRequest {
    name: string;
    avatarUrl?: string;
}

export interface AssignPlayerToPartyRequest {
    partyId: number;
    playerId: number;
}

export interface AddRoundRequest {
    partyId: number;
    roundNumber: number;
}

export interface AddSongToRoundRequest {
    roundId: number;
    songId: number;
}

export interface SaveResultsRequest {
    results: KaraokeSinging[];
}

export interface KaraokeSongFile {
    id?: number;
    title: string;
    artist: string;
    genre?: string;
    language?: string;
    year?: string;
    coverPath?: string;
    audioPath?: string;
    videoPath?: string;
    instrumentalPath?: string;
    format: KaraokeFormat;
    filePath?: string;
    notes: KaraokeNote[];
    gap?: number;
    bpm?: number;
    videoGap?: number;
    start?: number;
    end?: number;
    isVerified?: boolean;
    inDevelopment?: boolean;
    ownerId?: number | null;
    canBeModifiedByAll?: boolean | null;
    externalSource?: string | null;
    externalId?: string | null;
    externalCoverUrl?: string | null;
    /** FK to Song in audio catalog */
    linkedSongId?: number | null;
    /** Full linked song details */
    linkedSong?: LinkedSongInfoDto | null;
    youtubeId?: string;
    coverImage?: string;
    backgroundImage?: string;
}

export interface KaraokeNote {
    id?: number;
    songId?: number;
    song?: KaraokeSongFile;
    noteLine: string;
}

export enum KaraokeFormat {
    Ultrastar = 0,
}

/** @deprecated Use EventStatus */
export enum PartyStatus {
    Draft = "Draft",
    Active = "Active",
    Paused = "Paused",
    Finished = "Finished",
}

/** @deprecated Use EventLocationType */
export const KaraokePartyType = EventLocationType;
/** @deprecated Use EventLocationType */
export type KaraokePartyType = EventLocationType;

/** @deprecated Use EventAccessType */
export const KaraokePartyAccess = EventAccessType;
/** @deprecated Use EventAccessType */
export type KaraokePartyAccess = EventAccessType;

// ── Dynamic filtering ──

export enum FilterOperator {
    Equals = 0,
    In = 1,
    Contains = 2,
    Gte = 3,
    Lte = 4,
    Between = 5,
}

export interface FilterCondition {
    field?: string | null;
    operator: FilterOperator;
    values?: string[] | null;
}

export interface SongFilterRequest {
    artists?: string[] | null;
    genres?: string[] | null;
    languages?: string[] | null;
    years?: number[] | null;
    ownerIds?: number[] | null;
    isVerified?: boolean | null;
    inDevelopment?: boolean | null;
    titleContains?: string | null;
    bpmFrom?: number | null;
    bpmTo?: number | null;
    /** Full-text search across title, artist, and linked song data */
    searchQuery?: string | null;
    /** true = only linked, false = only unlinked, null = all */
    hasLinkedSong?: boolean | null;
    /** Filter by external source: "Spotify" | "YouTube" */
    externalSource?: string | null;
    /** Min duration in seconds (requires linked song) */
    durationFromSec?: number | null;
    /** Max duration in seconds */
    durationToSec?: number | null;
    /** Search by catalog artist name */
    linkedArtistName?: string | null;
    /** Filter by ISRC code */
    isrc?: string | null;
    /** Include full linkedSong object in response (default: true) */
    includeLinkedSongDetails?: boolean | null;
    page?: number;
    pageSize?: number;
    sortBy?: string | null;
    sortDir?: string | null;
}

// ── Collaboration ──

export enum CollaborationPermission {
    ReadOnly = 0,
    Edit = 1,
    Owner = 2,
}

export interface CollaboratorAddRequest {
    userId: number;
    permission: CollaborationPermission;
}

// ── Moderation ──

export interface AbuseReportRequest {
    targetType?: string | null;
    targetValue?: string | null;
    reason?: string | null;
    comment?: string | null;
}

export interface ResolveAbuseReportRequest {
    resolved: boolean;
    moderatorComment?: string | null;
}

// ── Channel move ──

export interface MoveRequest {
    partyId: number;
    playerId: number;
    fromChannel?: string | null;
    toChannel?: string | null;
}

// ── Teams ──

export interface KaraokeTeam {
    id: number;
    name?: string | null;
    eventId?: number | null;
    createdByPlayerId: number;
    avatarKey?: string | null;
    color?: string | null;
    createdByPlayer?: UserProfilePlayer | null;
    players?: KaraokeTeamPlayer[] | null;
}

export interface KaraokeTeamPlayer {
    id: number;
    playerId: number;
    player?: UserProfilePlayer | null;
    teamId: number;
    team?: KaraokeTeam | null;
    joinedAt: string;
    role?: string | null;
}

export interface AddTeamPlayerRequest {
    playerId: number;
    role?: string | null;
}

// ── Song Queue ──

export enum SongQueueStatus {
    Pending = 0,
    Playing = 1,
    Done = 2,
    Skipped = 3,
    /** @deprecated Use Pending */
    Waiting = 0,
    /** @deprecated Use Done */
    Played = 2,
}

export interface KaraokeSongQueueItem {
    id: number;
    eventId: number;
    songId: number;
    song?: KaraokeSongFile | null;
    requestedByPlayerId: number;
    requestedByPlayer?: UserProfilePlayer | null;
    position: number;
    status: SongQueueStatus;
    requestedAt: string;
}

// ── Favorites ──

export interface PlayerFavorite {
    playerId: number;
    songId: number;
    song?: KaraokeSongFile | null;
}

// ── Karaoke Session / Round modes ──

export enum KaraokeSessionMode {
    Classic = 0,
    Tournament = 1,
    Knockout = 2,
    Casual = 3,
}

export enum KaraokeRoundMode {
    Normal = 0,
    Demo = 1,
    NoLyrics = 2,
    NoTimeline = 3,
    Blind = 4,
    SpeedRun = 5,
    Duet = 6,
    FreeStyle = 7,
}

// ── Karaoke Song Picks ──

export interface KaraokeSessionSongPick {
    id: number;
    sessionId: number;
    sourcePlaylistId?: number | null;
    songId?: number | null;
    songTitle: string;
    createdAt: string;
    signups?: KaraokeSessionSongSignup[] | null;
}

export interface KaraokeSessionSongSignup {
    id: number;
    pickId: number;
    playerId: number;
    preferredSlot?: number | null;
    signedUpAt: string;
}

// ── Stats / Ranking DTOs ──

export interface KaraokeRankingEntry {
    userId: number;
    username: string;
    totalScore: number;
    songsSung: number;
    bestScore: number;
}

export interface KaraokeHistoryEntry {
    singingId: number;
    songTitle: string;
    score: number;
    performedAt: string;
}

export interface KaraokeActivityEntry {
    date: string;
    songsSung: number;
    totalScore: number;
}
