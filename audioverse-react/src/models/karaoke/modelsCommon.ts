// ── Common / shared models ──
// Extracted from modelsKaraoke.ts

import type { FilterCondition } from './modelsKaraokeCore';

// ── Bouncer / Event Links ──

export interface ValidateCodeRequest {
    code?: string | null;
}

// ── External Track ──

export interface ExternalTrackResult {
    externalId?: string | null;
    source?: string | null;
    title?: string | null;
    artist?: string | null;
    album?: string | null;
    coverUrl?: string | null;
    previewUrl?: string | null;
    durationMs?: number | null;
    isrc?: string | null;
}

// ── User Settings ──

export interface UpdateUserProfileSettingsRequest {
    developerMode?: boolean;
    jurors?: boolean;
    fullscreen?: boolean;
    theme?: string | null;
    soundEffects?: boolean;
    language?: string | null;
}

// ── User Ban ──

export interface UserBan {
    id: number;
    userId: number;
    reason?: string | null;
    bannedByAdminId?: number | null;
    bannedAt: string;
    expiresAt?: string | null;
    isActive: boolean;
}

// ── Paged result (generic) ──

export interface PagedResult<T> {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
}

// ── Dynamic filter ──

export interface DynamicFilterRequest {
    conditions?: FilterCondition[] | null;
    page: number;
    pageSize: number;
    sortBy?: string | null;
    sortDir?: string | null;
}

// ── Paginated response (backend format) ──

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

// ── Notifications ──

export enum NotificationType {
    General = 0,
    EventInvite = 1,
    EventUpdate = 2,
    KaraokeScore = 3,
    PollCreated = 4,
    CommentReply = 5,
    SystemAlert = 6,
}

export interface Notification {
    id: number;
    userId: number;
    title?: string | null;
    body?: string | null;
    type: NotificationType;
    isRead: boolean;
    createdAt: string;
    readAt?: string | null;
}

// ── Dance Classification ──

export interface DanceStyle {
    id: number;
    name?: string | null;
    namePl?: string | null;
    category?: string | null;
    bpmMin?: number | null;
    bpmMax?: number | null;
    timeSignature?: number | null;
    energyMin?: number | null;
    energyMax?: number | null;
    valenceMin?: number | null;
    valenceMax?: number | null;
    rhythmPattern?: string | null;
    description?: string | null;
}

export interface SongDanceMatch {
    id: number;
    songId: number;
    danceStyleId: number;
    danceStyle?: DanceStyle | null;
    confidence?: number | null;
    source?: string | null;
    analyzedAt?: string | null;
}

export interface AudioAnalysisResult {
    bpm?: number | null;
    key?: string | null;
    loudness?: number | null;
    energy?: number | null;
    timeSignature?: number | null;
    danceability?: number | null;
    valence?: number | null;
    rhythmPattern?: string | null;
}

// ── Audio Effects ──

export enum AudioEffectType {
    Reverb = 0,
    Delay = 1,
    EQ = 2,
    Compressor = 3,
    PitchShift = 4,
    Filter = 5,
    Distortion = 6,
    Chorus = 7,
}

export enum ExportStatus {
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Failed = 3,
}

export enum CollaboratorPermission {
    View = 0,
    Edit = 1,
    Admin = 2,
}

export enum PlaylistAccess {
    Public = 0,
    Unlisted = 1,
    Private = 2,
}

export enum ExternalPlatform {
    Spotify = 1,
    Tidal = 2,
    YouTube = 3,
    Google = 4,
    Steam = 5,
    BoardGameGeek = 6,
    Discord = 7,
    Twitch = 8,
    Apple = 9,
    Facebook = 10,
    Microsoft = 11,
}

export enum DeviceType {
    Unknown = 0,
    Microphone = 1,
    Gamepad = 2,
    Keyboard = 3,
    Mouse = 4,
    Speaker = 5,
    Camera = 6,
}

// ── User External Account ──

export interface UserExternalAccount {
    id: number;
    userProfileId: number;
    platform: ExternalPlatform;
    externalUserId?: string | null;
    displayName?: string | null;
    accessToken?: string | null;
}

// ── Audio Sample (editor) ──

export interface AudioSample {
    id: number;
    packId: number;
    name?: string | null;
    objectKey?: string | null;
    mimeType?: string | null;
    durationMs?: number | null;
    bpm?: number | null;
    key?: string | null;
}

export interface AudioLayerEffect {
    id: number;
    layerId: number;
    effectId: number;
    order: number;
    paramsOverrideJson?: string | null;
}

// ── DMX Scenes ──

export interface DmxSceneSequence {
    id: number;
    name?: string | null;
    loop: boolean;
    steps?: DmxSceneStep[] | null;
}

export interface DmxSceneStep {
    id: number;
    sequenceId: number;
    sceneId: number;
    order: number;
    holdMs: number;
    fadeMs: number;
}
