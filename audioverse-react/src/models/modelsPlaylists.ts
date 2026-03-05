// models/modelsPlaylists.ts
import { MusicPlatform } from "./modelsMusicPlatform";
import { SongInformation } from "./modelsAudio";

// ---- Playlist DTOs (from backend /api/playlists) ----

export enum PlaylistAccess {
    Private = 0,
    Public = 1,
    Code = 2,
}

export enum RequestMechanism {
    None = 0,
    Open = 1,
    Moderated = 2,
}

export interface PlaylistItemDto {
    id: number;
    playlistId: number;
    orderNumber: number;
    skipMs: number;
    songId: number;
    isRequest: boolean;
}

export interface PlaylistLinkDto {
    sourcePlaylistId: number;
    targetPlaylistId: number;
    orderNumberStart: number;
    orderNumberTake: number;
    orderNumber: number;
    randomizeOrder: boolean;
}

export interface PlaylistDto {
    id: number;
    name: string;
    description?: string | null;
    access: PlaylistAccess;
    accessCode?: string | null;
    requestMechanism: RequestMechanism;
    created: string;
    createdBy?: number | null;
    modified: string;
    modifiedBy?: number | null;
    parentId?: number | null;
    parent?: PlaylistDto | null;
    children?: PlaylistDto[] | null;
    items?: PlaylistItemDto[] | null;
    links?: PlaylistLinkDto[] | null;
    /** Frontend-only: may be present when returned by list endpoint */
    cover?: string | null;
    /** Frontend-only: may be present with item count */
    itemCount?: number;
    /** Alias used by some views */
    playlistSongs?: unknown[] | null;
}

// ---- Song Descriptor ----

export interface SongDescriptorDto {
    artist: string;
    title: string;
    version?: string | null;
}

export interface FailedPlaylistItem {
    song: SongDescriptorDto;
    reason: string;
}

export interface CreatePlaylistResult {
    platform: MusicPlatform;
    playlistId: string;
    playlistUrl?: string | null;
    addedCount: number;
    failed: FailedPlaylistItem[];
}

export interface CreatePlaylistOnPlatformRequest {
    platform: MusicPlatform;
    name: string;
    description?: string | null;
    public?: boolean;                // Spotify/Tidal
    youTubePrivacyStatus?: string;   // "private" | "unlisted" | "public"
    songs: SongDescriptorDto[];
}

/** Wariant tworzenia z SongInformation[] (jak w kontrolerze /from-infos). */
export interface CreateFromInfosRequest {
    platform: MusicPlatform;
    name: string;
    description?: string | null;
    isPublic?: boolean;
    youTubePrivacy?: string; // "private" | "unlisted" | "public"
    songs: SongInformation[];
}

// ---- TIDAL Streams DTOs ----
export interface TidalStreamItem {
    song: SongDescriptorDto;   // pinned request
    trackId?: string | null;
    url?: string | null;       // catalog or playback URL – depending on the backend
    isrc?: string | null;
    duration?: number | null;  // ms/sec – consistent with the backend
    album?: string | null;
    reason?: string | null;    // np. "Not found on Tidal"
}

export interface GetTidalStreamsResult {
    items: TidalStreamItem[];
    // foundCount?: number; // if backend exposes this – can be added
}
