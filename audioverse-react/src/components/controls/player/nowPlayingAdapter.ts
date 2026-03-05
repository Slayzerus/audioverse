// nowPlayingAdapter.ts — converts a NowPlayingDto into a GenericPlayer PlayerTrack
import type { NowPlayingDto } from "../../../models/modelsPlatforms";
import type { PlayerTrack, PlayerSource } from "./GenericPlayer";

/**
 * Resolve a NowPlayingDto from the backend into a PlayerTrack
 * that GenericPlayer can play.
 *
 * Priority:
 *   1. Internal HLS stream   (streamUrl ending in .m3u8)
 *   2. Pre-signed CDN URL    (presignedUrl — direct audio)
 *   3. External URL           (externalUrl — generic audio)
 *   4. Spotify URI            (spotifyUri — played via Web Playback SDK, not GenericPlayer)
 *
 * The Spotify case returns a track with an empty sources array so the caller
 * knows to delegate to the Spotify SDK instead.
 */
export function nowPlayingToTrack(np: NowPlayingDto): PlayerTrack {
    const sources: PlayerSource[] = [];

    // 1. HLS stream
    if (np.streamUrl) {
        const isHls = /\.m3u8(\?.*)?$/i.test(np.streamUrl);
        sources.push({
            kind: isHls ? "hls" : "audio",
            url: np.streamUrl,
            label: "Stream",
        });
    }

    // 2. Pre-signed CDN URL
    if (np.presignedUrl) {
        sources.push({
            kind: "audio",
            url: np.presignedUrl,
            label: "CDN",
        });
    }

    // 3. External URL (e.g. Tidal HLS)
    if (np.externalUrl) {
        const isHls = /\.m3u8(\?.*)?$/i.test(np.externalUrl);
        sources.push({
            kind: isHls ? "hls" : "audio",
            url: np.externalUrl,
            label: np.externalProvider ?? "External",
        });
    }

    // 4. Spotify URI — no direct audio; caller should use Spotify Web Playback SDK
    // We still return a track so the UI can show metadata, but sources will be empty
    // unless another source was also provided.

    return {
        id: np.songId != null ? String(np.songId) : `np-${Date.now()}`,
        title: np.title,
        artist: np.artist,
        coverUrl: np.albumArt ?? undefined,
        sources,
        startOffset: np.spotifyStartMs != null ? np.spotifyStartMs / 1000 : undefined,
    };
}

/** Check if a NowPlayingDto should be played via Spotify SDK */
export function isSpotifyPlayback(np: NowPlayingDto): boolean {
    return !!np.spotifyUri && !np.streamUrl && !np.presignedUrl && !np.externalUrl;
}
