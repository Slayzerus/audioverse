// playlistFormatUtils.ts — Multi-format import/export for playlists (M3U, CSV, JSON)
import type { ManagedPlaylist, PlaylistTrack, PlaylistFolder, PlaylistTag, PlaylistExportFormat } from "../../models/modelsPlaylistManager";
import { TrackSource, PlaylistType } from "../../models/modelsPlaylistManager";

// ══════════════════════════════════════════════════════════════
// M3U Export
// ══════════════════════════════════════════════════════════════

/**
 * Export a playlist as M3U8 (Extended M3U) format.
 * #EXTM3U header, #EXTINF per track with duration and title - artist.
 */
export function exportPlaylistAsM3U(playlist: ManagedPlaylist): string {
    const lines: string[] = ["#EXTM3U", `#PLAYLIST:${playlist.name}`];

    for (const track of playlist.tracks) {
        const duration = track.duration != null ? Math.round(track.duration) : -1;
        const display = track.artist ? `${track.artist} - ${track.title}` : track.title;
        lines.push(`#EXTINF:${duration},${display}`);

        // Use source URL if available, otherwise construct a reference
        const url =
            track.sourceUrl ||
            (track.youtubeId ? `https://www.youtube.com/watch?v=${track.youtubeId}` : "") ||
            (track.spotifyId ? `spotify:track:${track.spotifyId}` : "") ||
            (track.tidalId ? `tidal:track:${track.tidalId}` : "") ||
            track.title;
        lines.push(url);
    }

    return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════
// M3U Import
// ══════════════════════════════════════════════════════════════

/**
 * Parse an M3U/M3U8 file into a list of PlaylistTrack objects.
 * Supports Extended M3U (#EXTM3U / #EXTINF) and plain URL lists.
 */
export function parseM3U(content: string): { name: string | null; tracks: Partial<PlaylistTrack>[] } {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let name: string | null = null;
    const tracks: Partial<PlaylistTrack>[] = [];
    let pendingInfo: { duration: number; display: string } | null = null;

    for (const line of lines) {
        if (line.startsWith("#EXTM3U")) continue;

        if (line.startsWith("#PLAYLIST:")) {
            name = line.slice("#PLAYLIST:".length).trim();
            continue;
        }

        if (line.startsWith("#EXTINF:")) {
            const rest = line.slice("#EXTINF:".length);
            const commaIdx = rest.indexOf(",");
            const duration = commaIdx >= 0 ? parseInt(rest.slice(0, commaIdx), 10) : -1;
            const display = commaIdx >= 0 ? rest.slice(commaIdx + 1).trim() : rest.trim();
            pendingInfo = { duration: isNaN(duration) || duration < 0 ? 0 : duration, display };
            continue;
        }

        if (line.startsWith("#")) continue; // Skip other directives

        // This line is a URL/path
        const track: Partial<PlaylistTrack> = {
            id: crypto.randomUUID(),
            source: TrackSource.Import,
            sourceUrl: line.trim(),
            tags: [],
            addedAt: new Date().toISOString(),
        };

        if (pendingInfo) {
            track.duration = pendingInfo.duration || undefined;
            // Parse "Artist - Title" format
            const dashIdx = pendingInfo.display.indexOf(" - ");
            if (dashIdx >= 0) {
                track.artist = pendingInfo.display.slice(0, dashIdx).trim();
                track.title = pendingInfo.display.slice(dashIdx + 3).trim();
            } else {
                track.title = pendingInfo.display;
                track.artist = "";
            }
            pendingInfo = null;
        } else {
            // No EXTINF — use URL as title
            track.title = line.trim();
            track.artist = "";
        }

        // Detect YouTube URLs
        const ytMatch = line.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
        if (ytMatch) {
            track.youtubeId = ytMatch[1];
            track.source = TrackSource.YouTube;
        }

        // Detect Spotify URIs
        const spotifyMatch = line.match(/spotify:track:(\w+)/);
        if (spotifyMatch) {
            track.spotifyId = spotifyMatch[1];
            track.source = TrackSource.Spotify;
        }

        tracks.push(track);
    }

    return { name, tracks };
}

// ══════════════════════════════════════════════════════════════
// CSV Export
// ══════════════════════════════════════════════════════════════

const CSV_HEADERS = ["Title", "Artist", "Album", "Duration (s)", "Year", "Genre", "Source", "Source URL", "Rating", "Tags"];

function escapeCsvField(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

/**
 * Export a playlist as CSV with headers.
 */
export function exportPlaylistAsCSV(playlist: ManagedPlaylist, tagMap?: Map<string, PlaylistTag>): string {
    const lines: string[] = [CSV_HEADERS.join(",")];

    for (const track of playlist.tracks) {
        const tagNames = tagMap
            ? track.tags.map((id) => tagMap.get(id)?.name ?? id).join("; ")
            : track.tags.join("; ");

        const row = [
            escapeCsvField(track.title),
            escapeCsvField(track.artist),
            escapeCsvField(track.album ?? ""),
            track.duration != null ? String(Math.round(track.duration)) : "",
            track.year != null ? String(track.year) : "",
            escapeCsvField(track.genre ?? ""),
            track.source,
            escapeCsvField(track.sourceUrl ?? ""),
            track.rating != null ? String(track.rating) : "",
            escapeCsvField(tagNames),
        ];
        lines.push(row.join(","));
    }

    return lines.join("\n");
}

// ══════════════════════════════════════════════════════════════
// CSV Import
// ══════════════════════════════════════════════════════════════

/**
 * Parse a CSV string (with headers) into PlaylistTrack objects.
 * First row must be headers including at least "Title".
 */
export function parseCSV(content: string): Partial<PlaylistTrack>[] {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCsvRow(lines[0]).map((h) => h.toLowerCase().trim());
    const titleIdx = headers.findIndex((h) => h === "title" || h === "name" || h === "track");
    const artistIdx = headers.findIndex((h) => h === "artist" || h === "performer");
    const albumIdx = headers.findIndex((h) => h === "album");
    const durationIdx = headers.findIndex((h) => h.includes("duration"));
    const yearIdx = headers.findIndex((h) => h === "year");
    const genreIdx = headers.findIndex((h) => h === "genre");
    const sourceIdx = headers.findIndex((h) => h === "source");
    const urlIdx = headers.findIndex((h) => h.includes("url") || h.includes("path"));
    const ratingIdx = headers.findIndex((h) => h === "rating");

    const tracks: Partial<PlaylistTrack>[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvRow(lines[i]);
        const title = titleIdx >= 0 ? cols[titleIdx]?.trim() : cols[0]?.trim();
        if (!title) continue;

        const track: Partial<PlaylistTrack> = {
            id: crypto.randomUUID(),
            title,
            artist: artistIdx >= 0 ? cols[artistIdx]?.trim() ?? "" : "",
            album: albumIdx >= 0 ? cols[albumIdx]?.trim() || undefined : undefined,
            duration: durationIdx >= 0 ? parseFloat(cols[durationIdx]) || undefined : undefined,
            year: yearIdx >= 0 ? parseInt(cols[yearIdx], 10) || undefined : undefined,
            genre: genreIdx >= 0 ? cols[genreIdx]?.trim() || undefined : undefined,
            source: sourceIdx >= 0 ? (cols[sourceIdx]?.trim() as TrackSource) || TrackSource.Import : TrackSource.Import,
            sourceUrl: urlIdx >= 0 ? cols[urlIdx]?.trim() || undefined : undefined,
            rating: ratingIdx >= 0 ? parseInt(cols[ratingIdx], 10) || undefined : undefined,
            tags: [],
            addedAt: new Date().toISOString(),
        };

        tracks.push(track);
    }

    return tracks;
}

/** Parse a single CSV row respecting quoted fields */
function parseCsvRow(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"' && line[i + 1] === '"') {
                current += '"';
                i++;
            } else if (ch === '"') {
                inQuotes = false;
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ",") {
                result.push(current);
                current = "";
            } else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}

// ══════════════════════════════════════════════════════════════
// JSON Export (AudioVerse native format)
// ══════════════════════════════════════════════════════════════

export function exportAsAudioVerseJSON(
    playlists: ManagedPlaylist[],
    folders: PlaylistFolder[],
    tags: PlaylistTag[],
): PlaylistExportFormat {
    return {
        version: 1,
        exportedAt: new Date().toISOString(),
        playlists,
        folders,
        tags,
    };
}

// ══════════════════════════════════════════════════════════════
// File download helper
// ══════════════════════════════════════════════════════════════

export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/** Detect file format from filename extension */
export function detectFormatFromFilename(filename: string): "json" | "m3u" | "csv" | "unknown" {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext === "json") return "json";
    if (ext === "m3u" || ext === "m3u8") return "m3u";
    if (ext === "csv" || ext === "tsv") return "csv";
    return "unknown";
}

/** Create a default ManagedPlaylist shell from imported tracks */
export function createPlaylistFromImport(
    name: string,
    tracks: Partial<PlaylistTrack>[],
): ManagedPlaylist {
    const now = new Date().toISOString();
    return {
        id: crypto.randomUUID(),
        name,
        type: PlaylistType.Static,
        isPublic: false,
        isPinned: false,
        tags: [],
        tracks: tracks.map((t, i) => ({
            id: t.id ?? crypto.randomUUID(),
            title: t.title ?? "Unknown",
            artist: t.artist ?? "",
            album: t.album,
            duration: t.duration,
            year: t.year,
            genre: t.genre,
            coverUrl: t.coverUrl,
            source: t.source ?? TrackSource.Import,
            sourceId: t.sourceId,
            sourceUrl: t.sourceUrl,
            isrc: t.isrc,
            tags: t.tags ?? [],
            rating: t.rating,
            playCount: t.playCount,
            addedAt: t.addedAt ?? now,
            customOrder: i,
            spotifyId: t.spotifyId,
            tidalId: t.tidalId,
            youtubeId: t.youtubeId,
            libraryFileId: t.libraryFileId,
        })),
        trackCount: tracks.length,
        totalDuration: tracks.reduce((sum, t) => sum + (t.duration ?? 0), 0),
        createdAt: now,
        updatedAt: now,
    };
}
