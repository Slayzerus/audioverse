// src/utils/libraryMappers.ts
import { buildStreamUrl } from "../scripts/api/apiLibraryStream";
import type { SongRecord, PlayerTrack } from "../models/modelsAudio";
import type { SongDescriptorDto } from "../models/modelsPlaylists";
import type { KaraokeSongFile } from "../models/modelsKaraoke";

/// Maps an audio SongRecord to a GenericPlayer track.
export const toTrack = (r: SongRecord): PlayerTrack => ({
    id: r.id || r.fileName,
    title: r.title,
    artist: (r.artists ?? []).join(", "),
    coverUrl: r.albumDetails?.coverUrl || undefined,
    sources: r.id
        ? [
            {
                kind: "audio",
                url: buildStreamUrl(r.id),
                label: "Library",
                codec: r.codecDescription,
                quality: r.bitsPerSample
                    ? `${Math.round(r.sampleRateHz / 1000)} kHz / ${r.bitsPerSample}-bit`
                    : undefined,
                withCredentials: true,
            },
        ]
        : [],
});

/// Maps an audio SongRecord to a playlist descriptor.
export const toDescAudio = (r: SongRecord): SongDescriptorDto => ({
    artist: (r.artists ?? []).join(", "),
    title: r.title,
});

/// Maps an Ultrastar song to a playlist descriptor.
export const toDescUltrastar = (s: KaraokeSongFile): SongDescriptorDto => ({
    artist: s.artist ?? "",
    title: s.title ?? "",
});
