/**
 * songDataHelpers — Shared accessors for cover URL, year, and genre
 * from KaraokeSong / KaraokeSongFile, consolidating linkedSong data.
 *
 * Handles TWO data shapes for linkedSong:
 *   A) DTO shape (from /get-filtered-songs): flat fields like albumCoverUrl, albumReleaseYear, artistName
 *   B) Raw entity shape (from /filter-songs): nested objects like album.coverUrl, album.releaseYear, primaryArtist.name
 *
 * Priority mirrors KaraokeSongBrowser.getSongCover():
 *   1. linkedSong.albumCoverUrl / album.coverUrl  (highest quality, from catalog)
 *   2. linkedSong.externalCoverUrl                 (Spotify / external service)
 *   3. song.externalCoverUrl                       (from import)
 *   4. song.coverPath / coverImage                 (local / YouTube)
 */

/** DTO shape returned by /get-filtered-songs (LinkedSongInfoDto) */
interface LinkedSongDto {
    albumCoverUrl?: string | null;
    externalCoverUrl?: string | null;
    albumReleaseYear?: number | null;
    artistName?: string | null;
}

/** Raw entity shape returned by /filter-songs (Song with nav properties) */
interface LinkedSongRaw {
    album?: { coverUrl?: string | null; releaseYear?: number | null } | null;
    primaryArtist?: { name?: string | null; imageUrl?: string | null } | null;
    externalCoverUrl?: string | null;
}

type LinkedSongAny = (LinkedSongDto & LinkedSongRaw) | null | undefined;

interface SongLike {
    coverPath?: string;
    coverImage?: string;
    externalCoverUrl?: string | null;
    genre?: string;
    year?: number | string;
    linkedSong?: LinkedSongAny;
}

/**
 * Extract album cover URL from linkedSong, handling both DTO and raw entity shapes.
 */
function getLinkedAlbumCoverUrl(ls: LinkedSongAny): string | undefined {
    if (!ls) return undefined;
    // DTO shape (flat)
    if (ls.albumCoverUrl) return ls.albumCoverUrl;
    // Raw entity shape (nested)
    if (ls.album?.coverUrl) return ls.album.coverUrl;
    return undefined;
}

/**
 * Extract external cover URL from linkedSong.
 */
function getLinkedExternalCoverUrl(ls: LinkedSongAny): string | undefined {
    if (!ls) return undefined;
    return ls.externalCoverUrl || undefined;
}

/**
 * Extract album release year from linkedSong, handling both DTO and raw entity shapes.
 */
function getLinkedAlbumYear(ls: LinkedSongAny): number | undefined {
    if (!ls) return undefined;
    // DTO shape (flat)
    if (ls.albumReleaseYear) return ls.albumReleaseYear;
    // Raw entity shape (nested)
    if (ls.album?.releaseYear) return ls.album.releaseYear;
    return undefined;
}

/**
 * Resolve the best available cover URL for a song,
 * including data from the linked Song entity.
 */
export function getSongCoverUrl(s: SongLike): string | undefined {
    return (
        getLinkedAlbumCoverUrl(s.linkedSong) ||
        getLinkedExternalCoverUrl(s.linkedSong) ||
        s.externalCoverUrl ||
        s.coverPath ||
        s.coverImage ||
        undefined
    );
}

/**
 * Resolve the best available year, falling back to linkedSong.albumReleaseYear.
 */
export function getSongYear(s: SongLike): number | undefined {
    const direct = typeof s.year === "string" ? parseInt(s.year, 10) : s.year;
    if (direct && direct > 0) return direct;
    return getLinkedAlbumYear(s.linkedSong);
}

/**
 * Resolve the best available genre.
 * (LinkedSongInfoDto has no genre field, so this is just the direct value,
 *  but centralised here for future expansion.)
 */
export function getSongGenre(s: SongLike): string | undefined {
    return s.genre || undefined;
}
