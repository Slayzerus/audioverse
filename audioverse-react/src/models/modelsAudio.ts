// models/modelsAudio.ts
export interface ArtistInformation {
    name: string;
    fullName?: string | null;
    nationality?: string | null;
    birthDate?: string | null;   // ISO string
    biography?: string | null;
    socialMediaLinks?: Record<string, string>;
}

export interface AlbumInformation {
    title?: string;
    upc?: string | null;
    label?: string | null;
    releaseDate?: string | null; // ISO string
}

export interface SongSource {
    platform: string;
    url: string;
    availability?: string;
    price?: number;
}

export interface SongInformation {
    title: string;
    artist: string;

    album?: string;
    releaseYear?: number | null;
    genre?: string;
    /**
     * Czas trwania – liczba (ms). Jeśli Twój backend serializuje TimeSpan inaczej,
     * dostosuj do sekund.
     */
    duration?: number | null;

    isrc?: string;
    lyrics?: string;
    popularity?: number;
    awards?: string[];

    albumDetails?: AlbumInformation;
    artistDetails?: ArtistInformation;
    sources?: SongSource[];
    streamingLinks?: Record<string, string>;
}

export type SongFileDetails = {
    durationAnalyzedSec?: number;
    rmsDbfs?: number;
    peakDbfs?: number;
    zeroCrossingRate?: number;
    estimatedBpm?: number;
    estimatedPitchHz?: number;
    loudnessHint?: string;
};

export type SongFileInformation = {
    filePath: string;
    fileName: string;
    fileSizeBytes: number;
    createdAt: string;
    modifiedAt: string;
    audioMimeType?: string;
    codecDescription?: string;
    durationSeconds?: number;
    bitrateKbps?: number;
    sampleRateHz?: number;
    channels?: number;
    bitsPerSample?: number | null;
    title?: string;
    album?: string;
    year?: number | null;
    artists?: string[];
    albumArtists?: string[];
    composers?: string[];
    genres?: string[];
    track?: number | null;
    trackCount?: number | null;
    disc?: number | null;
    discCount?: number | null;
    musicBrainzTrackId?: string | null;
    musicBrainzAlbumId?: string | null;
    musicBrainzArtistId?: string | null;
    musicBrainzReleaseArtistId?: string | null;
    musicBrainzReleaseGroupId?: string | null;
    musicIpId?: string | null;
    isrc?: string | null;
    comment?: string | null;
    lyrics?: string | null;
    hasEmbeddedCover?: boolean;
    embeddedCoverMimeType?: string | null;
    embeddedCoverByteLength?: number | null;
    details?: SongFileDetails;
    extra?: Record<string, string>;
};

export type SongRecord = {
    // kanoniczne
    id?: string; // base64url – klucz do streamu
    title: string;
    artists: string[];
    album: string;
    year?: number | null;
    durationSeconds?: number | null;
    genres: string[];
    isrc: string;
    lyrics: string;

    // plik/techniczne
    filePath: string;
    fileName: string;
    fileSizeBytes: number;
    createdAt: string; // ISO
    modifiedAt: string; // ISO
    audioMimeType: string;
    codecDescription: string;
    bitrateKbps: number;
    sampleRateHz: number;
    channels: number;
    bitsPerSample?: number | null;

    // mbids
    musicBrainzTrackId?: string | null;
    musicBrainzAlbumId?: string | null;
    musicBrainzArtistId?: string | null;
    musicBrainzReleaseArtistId?: string | null;
    musicBrainzReleaseGroupId?: string | null;

    // okładka
    hasEmbeddedCover: boolean;
    embeddedCoverMimeType?: string | null;
    embeddedCoverByteLength?: number | null;

    // analiza
    analysis?: SongFileDetails | null;

    // enrichment
    streamingLinks: Record<string, string>;
    albumDetails: {
        title: string;
        artist: string;
        releaseDate?: string | null;
        genre: string;
        label: string;
        trackList: string[];
        coverUrl: string;
    };
    artistDetails: {
        name: string;
        fullName: string;
        nationality: string;
        birthDate?: string | null;
        biography: string;
        profilePictureUrl: string;
        socialMediaLinks: Record<string, string>;
        albums: string[];
        songs: string[];
    };

    // extras
    extra: Record<string, string>;
};

export interface PlayerSource {
    kind: "youtube" | "hls" | "audio";
    url?: string;
    videoId?: string;
    headers?: Record<string, string>;   // np. { Authorization: "Bearer …" } – jeśli MUSISZ (lepiej proxy)
    withCredentials?: boolean;          // true jeśli trzeba wysyłać cookies
    proxyUrl?: string;                  // np. "/api/streams/tidal/track/123?quality=HiFi"
    quality?: string;
    codec?: string;
    label?: string;
}

export interface PlayerTrack {
    id: string;
    title: string;
    artist: string;
    coverUrl?: string;
    sources: PlayerSource[];
}