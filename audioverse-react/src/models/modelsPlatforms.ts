// modelsPlatforms.ts — External platform accounts & streaming DTOs

/** Platforms supported for account linking */
export type PlatformName = "spotify" | "tidal" | "youtube" | "twitch" | "google" | "microsoft" | "discord";

/** GET /api/platforms/accounts → ExternalAccountDto[] */
export interface ExternalAccountDto {
    platform: PlatformName;
    externalId: string | null;
    displayName: string | null;
    email: string | null;
    avatarUrl: string | null;
    linkedAt: string | null;
    scopes: string[] | null;
}

/** GET /api/platforms/{platform}/auth-url → AuthUrlResponse */
export interface AuthUrlResponse {
    url: string;
    state: string;
}

/** POST /api/platforms/{platform}/link — request body */
export interface PlatformLinkRequest {
    code: string;
    redirectUri: string;
}

/** POST /api/platforms/spotify/play — request body */
export interface SpotifyPlayRequest {
    trackUri: string;
    deviceId?: string | null;
    positionMs?: number | null;
}

/** GET /api/platforms/tidal/play?trackId=... → TidalPlayResponse */
export interface TidalPlayResponse {
    url: string;
    expiresAt: string;
}

/** NowPlayingDto — unified DTO for current playback */
export interface NowPlayingDto {
    songId?: number | null;
    title: string;
    artist: string;
    albumArt?: string | null;

    /** Internal HLS/audio stream URL */
    streamUrl?: string | null;
    /** Pre-signed CDN URL */
    presignedUrl?: string | null;
    /** Generic external URL */
    externalUrl?: string | null;

    /** Spotify-specific */
    spotifyUri?: string | null;
    spotifyStartMs?: number | null;

    /** External provider hint: "spotify" | "tidal" | "youtube" | null */
    externalProvider?: string | null;
}
