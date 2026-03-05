// modelsLibrary.ts — Library catalog entity models (Songs, Albums, Artists, Files)

// === Enums ===

export enum ArtistFactType {
    BirthDate = 1,
    DeathDate = 2,
    Genre = 3,
    Award = 4,
    Trivia = 5,
    ExternalLink = 6,
    Misc = 7,
}

export enum AlbumArtistRole {
    Primary = 1,
    Featured = 2,
    Producer = 3,
}

export enum SongDetailType {
    Lyrics = 1,
    Credits = 2,
    Notes = 3,
    ExternalLink = 4,
    Misc = 5,
}

// === Artist ===

export interface ArtistDetail {
    id?: number;
    artistId?: number;
    artist?: Artist | null;
    bio?: string | null;
    imageUrl?: string | null;
    country?: string | null;
}

export interface ArtistFact {
    id?: number;
    artistId?: number;
    artist?: Artist | null;
    type?: ArtistFactType;
    value?: string | null;
    dateValue?: string | null;
    intValue?: number | null;
    source?: string | null;
}

export interface Artist {
    id?: number;
    name?: string | null;
    normalizedName?: string | null;
    detail?: ArtistDetail | null;
    facts?: ArtistFact[] | null;
}

// === Album ===

export interface AlbumArtist {
    albumId?: number;
    album?: Album | null;
    artistId?: number;
    artist?: Artist | null;
    role?: AlbumArtistRole;
    order?: number;
}

export interface Album {
    id?: number;
    title?: string | null;
    releaseYear?: number | null;
    musicBrainzAlbumId?: string | null;
    musicBrainzReleaseGroupId?: string | null;
    coverUrl?: string | null;
    primaryArtistId?: number | null;
    albumArtists?: AlbumArtist[] | null;
    songs?: Song[] | null;
}

// === Song ===

export interface SongDetail {
    id?: number;
    songId?: number;
    song?: Song | null;
    type?: SongDetailType;
    value?: string | null;
}

export interface Song {
    id?: number;
    title?: string | null;
    albumId?: number | null;
    album?: Album | null;
    isrc?: string | null;
    primaryArtistId?: number | null;
    primaryArtist?: Artist | null;
    details?: SongDetail[] | null;
}

// === Media files ===

export interface LibraryAudioFile {
    id?: number;
    filePath?: string | null;
    fileName?: string | null;
    duration?: number | null;
    sampleRate?: number | null;
    channels?: number | null;
    bitDepth?: number | null;
    audioMimeType?: string | null;
    genre?: string | null;
    year?: number | null;
    lyrics?: string | null;
    size?: number | null;
    songId?: number | null;
    song?: Song | null;
    albumId?: number | null;
    album?: Album | null;
}

export interface LibraryMediaFile {
    id?: number;
    filePath?: string | null;
    fileName?: string | null;
    fileSizeBytes?: number | null;
    mimeType?: string | null;
    codec?: string | null;
    createdAt?: string | null;
    modifiedAt?: string | null;
    songId?: number | null;
    song?: Song | null;
    albumId?: number | null;
    album?: Album | null;
}

// === Scan ===

export interface ScanRequest {
    folderPath?: string | null;
    recursive?: boolean;
}
