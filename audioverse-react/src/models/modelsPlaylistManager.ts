// modelsPlaylistManager.ts — Advanced Playlist Manager domain models
import { MusicPlatform } from "./modelsMusicPlatform";

// ══════════════════════════════════════════════════════════════
// Enums
// ══════════════════════════════════════════════════════════════

export enum PlaylistType {
    Static = "static",
    Dynamic = "dynamic",
}

export enum ViewMode {
    List = "list",
    Grid = "grid",
    Compact = "compact",
    DualPane = "dual",
}

export enum PaneSide {
    Left = "left",
    Right = "right",
}

export enum DynamicRuleField {
    Artist = "artist",
    Title = "title",
    Album = "album",
    Genre = "genre",
    Year = "year",
    Duration = "duration",
    Rating = "rating",
    PlayCount = "playCount",
    Tag = "tag",
    Source = "source",
    AddedDate = "addedDate",
}

export enum DynamicRuleOperator {
    Equals = "eq",
    NotEquals = "neq",
    Contains = "contains",
    NotContains = "notContains",
    StartsWith = "startsWith",
    GreaterThan = "gt",
    LessThan = "lt",
    Between = "between",
    In = "in",
    NotIn = "notIn",
}

export enum SortField {
    Title = "title",
    Artist = "artist",
    Album = "album",
    Duration = "duration",
    AddedDate = "addedDate",
    Year = "year",
    Rating = "rating",
    Custom = "custom",
}

export enum SortDirection {
    Asc = "asc",
    Desc = "desc",
}

export enum TrackSource {
    Library = "library",
    Spotify = "spotify",
    Tidal = "tidal",
    YouTube = "youtube",
    MusicBrainz = "musicbrainz",
    Import = "import",
    Manual = "manual",
}

// ══════════════════════════════════════════════════════════════
// Folder / Catalog (hierarchical tree)
// ══════════════════════════════════════════════════════════════

export interface PlaylistFolder {
    id: string;
    name: string;
    parentId: string | null;
    icon?: string;
    color?: string;
    sortOrder: number;
    children?: PlaylistFolder[];
    playlistIds?: string[];
    createdAt: string;
    updatedAt: string;
}

// ══════════════════════════════════════════════════════════════
// Tags
// ══════════════════════════════════════════════════════════════

export interface PlaylistTag {
    id: string;
    name: string;
    color: string;
    icon?: string;
}

// ══════════════════════════════════════════════════════════════
// Track (rich song entry in a playlist)
// ══════════════════════════════════════════════════════════════

export interface PlaylistTrack {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number; // seconds
    year?: number;
    genre?: string;
    coverUrl?: string;
    source: TrackSource;
    sourceId?: string; // external ID (Spotify track ID, YT video ID, etc.)
    sourceUrl?: string;
    isrc?: string;
    tags: string[]; // tag IDs
    rating?: number; // 1-5
    playCount?: number;
    addedAt: string;
    customOrder?: number;

    // multi-source resolution
    spotifyId?: string;
    tidalId?: string;
    youtubeId?: string;
    libraryFileId?: string;
}

// ══════════════════════════════════════════════════════════════
// Dynamic playlist rules
// ══════════════════════════════════════════════════════════════

export interface DynamicRule {
    id: string;
    field: DynamicRuleField;
    operator: DynamicRuleOperator;
    value: string;
    value2?: string; // for "between" operator
}

export type DynamicRuleGroup = {
    id: string;
    logic: "and" | "or";
    rules: (DynamicRule | DynamicRuleGroup)[];
};

// ══════════════════════════════════════════════════════════════
// Managed Playlist (rich model)
// ══════════════════════════════════════════════════════════════

export interface ManagedPlaylist {
    id: string;
    name: string;
    description?: string;
    coverUrl?: string;
    type: PlaylistType;
    folderId?: string | null;
    isPublic: boolean;
    isPinned: boolean;
    tags: string[]; // tag IDs

    // tracks (for static playlists)
    tracks: PlaylistTrack[];

    // rules (for dynamic playlists)
    dynamicRules?: DynamicRuleGroup;
    dynamicLimit?: number;
    dynamicSortField?: SortField;
    dynamicSortDir?: SortDirection;

    // source info
    sourcePlatform?: MusicPlatform;
    sourcePlaylistId?: string;
    sourcePlaylistUrl?: string;
    lastSyncedAt?: string;

    // stats
    trackCount: number;
    totalDuration: number; // seconds

    createdAt: string;
    updatedAt: string;
}

// ══════════════════════════════════════════════════════════════
// External service connection status
// ══════════════════════════════════════════════════════════════

export interface ServiceConnection {
    platform: MusicPlatform;
    connected: boolean;
    username?: string;
    avatarUrl?: string;
    expiresAt?: string;
}

// ══════════════════════════════════════════════════════════════
// External playlist (from Spotify/Tidal/YouTube)
// ══════════════════════════════════════════════════════════════

export interface ExternalPlaylist {
    id: string;
    name: string;
    description?: string;
    coverUrl?: string;
    trackCount: number;
    ownerName?: string;
    platform: MusicPlatform;
    url?: string;
}

export interface ExternalPlaylistTrack {
    externalId: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    coverUrl?: string;
    platform: MusicPlatform;
    isrc?: string;
    url?: string;
}

// ══════════════════════════════════════════════════════════════
// Import / Export DTOs
// ══════════════════════════════════════════════════════════════

export interface PlaylistExportFormat {
    version: number;
    exportedAt: string;
    playlists: ManagedPlaylist[];
    folders: PlaylistFolder[];
    tags: PlaylistTag[];
}

export interface PlaylistImportOptions {
    mergeTags: boolean;
    mergeFolders: boolean;
    overwriteExisting: boolean;
    targetFolderId?: string;
}

// ══════════════════════════════════════════════════════════════
// Pane state (for dual-pane Norton Commander view)
// ══════════════════════════════════════════════════════════════

export interface PaneState {
    side: PaneSide;
    currentFolderId: string | null;
    selectedPlaylistId: string | null;
    selectedTrackIds: Set<string>;
    sortField: SortField;
    sortDir: SortDirection;
    filterText: string;
    viewMode: ViewMode;
}

// ══════════════════════════════════════════════════════════════
// Clipboard (for copy/cut operations between panes)
// ══════════════════════════════════════════════════════════════

export interface ClipboardState {
    operation: "copy" | "cut";
    sourcePlaylistId: string;
    trackIds: string[];
}
