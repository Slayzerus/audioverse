// src/components/library/LibraryList/LibraryList.logic.ts
import * as React from "react";
import type { SongRecord } from "../../../../models/modelsAudio.ts";
import type { KaraokeSongFile } from "../../../../models/modelsKaraoke.ts";

/// Returns audio records filtered by a simple text query (title/artist/album).
export const useFilteredAudio = (data: SongRecord[], query: string) => {
    return React.useMemo(() => {
        const t = query.trim().toLowerCase();
        if (!t) return data;
        return data.filter(
            (r) =>
                r.title?.toLowerCase().includes(t) ||
                (r.artists ?? []).join(" ").toLowerCase().includes(t) ||
                r.albumDetails?.title?.toLowerCase().includes(t)
        );
    }, [data, query]);
};

/// Returns Ultrastar songs filtered by text query (title/artist/filePath).
export const useFilteredUltrastar = (
    data: KaraokeSongFile[],
    query: string
) => {
    return React.useMemo(() => {
        const t = query.trim().toLowerCase();
        if (!t) return data;
        return data.filter(
            (s) =>
                (s.title ?? "").toLowerCase().includes(t) ||
                (s.artist ?? "").toLowerCase().includes(t) ||
                (s.filePath ?? "").toLowerCase().includes(t)
        );
    }, [data, query]);
};
