// models/modelsPlaylists.ts
import { MusicPlatform } from "./modelsMusicPlatform";
import { SongInformation } from "./modelsAudio";

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
    song: SongDescriptorDto;   // przypięty request
    trackId?: string | null;
    url?: string | null;       // katalogowy lub playback URL – w zależności od backendu
    isrc?: string | null;
    duration?: number | null;  // ms/sek. – spójnie z backendem
    album?: string | null;
    reason?: string | null;    // np. "Not found on Tidal"
}

export interface GetTidalStreamsResult {
    items: TidalStreamItem[];
    // foundCount?: number; // jeśli backend to wystawia – można dodać
}
