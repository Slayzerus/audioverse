// src/components/controls/library/PlaylistBrowser.tsx
import React, { useMemo, useState } from "react";
import { useLocalPlaylists, type LocalPlaylist } from "./useLocalPlaylists.ts";
import PlaylistList from "../playlist/PlaylistList";
import LibraryList from "../library/LibraryList/LibraryList.tsx";
import LibrarySearch from "../library/LibrarySearch";
import LibrarySearchResult from "../library/LibrarySearchResult";
import type { SongRecord, PlayerTrack } from "../../../models/modelsAudio";
import type { SongDescriptorDto } from "../../../models/modelsPlaylists";

const colBox: React.CSSProperties = { display: "grid", gap: 12 };

const toDescriptor = (r: SongRecord): SongDescriptorDto => ({
    artist: (r.artists ?? []).join(", "),
    title: r.title,
});

export const PlaylistBrowser: React.FC = () => {
    const store = useLocalPlaylists();
    const [selected, setSelected] = useState<LocalPlaylist | null>(null);
    const [query, setQuery] = useState("");
    const [queue, setQueue] = useState<PlayerTrack[]>([]); // kolejka do playera (opcjonalnie)

    const all = useMemo(() => store.list(), [store]);
    const selectedId = selected?.id;

    // bezpieczne dodawanie do playlisty, niezależnie od implementacji hooka
    const appendToPlaylist = (p: LocalPlaylist, items: SongDescriptorDto[]) => {
        // preferuj metodę addItems(id, items)
        if ((store as any).addItems) {
            (store as any).addItems(p.id, items);
            // odśwież referencję
            const refreshed = store.list().find(x => x.id === p.id) || p;
            setSelected(refreshed);
            return;
        }
        // fallback: update całego obiektu
        if ((store as any).update) {
            const merged = Array.from([...(p.items || []), ...items]);
            (store as any).update({ ...p, items: merged });
            const refreshed = store.list().find(x => x.id === p.id) || { ...p, items: merged };
            setSelected(refreshed);
            return;
        }
        // ultimate fallback: nic – ale pokaż komunikat w konsoli
        console.warn("useLocalPlaylists: brak metody addItems/update – zaktualizuj implementację hooka.");
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
            {/* LEWA KOLUMNA – playlisty */}
            <div style={colBox}>
                <h3 style={{ margin: 0 }}>Playlists</h3>
                <PlaylistList
                    selectedId={selectedId}
                    onSelect={setSelected}
                    // onCreateRemote – możesz podpiąć mutację do API, zostawiamy na później
                />
                {selected && (
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                        Zaznaczona: <strong>{selected.name}</strong> • {selected.items?.length ?? 0} utw.
                    </div>
                )}
            </div>

            {/* PRAWA KOLUMNA – wyszukiwanie i biblioteka */}
            <div style={colBox}>
                <h3 style={{ margin: 0 }}>Library</h3>

                {/* Quick search + dropdown top-5 */}
                <div>
                    <LibrarySearch
                        placeholder="Szukaj i dodaj do playlisty…"
                        onPick={(record) => {
                            if (selected) appendToPlaylist(selected, [toDescriptor(record)]);
                        }}
                    />
                    {/* Podpięty input do pełnych wyników */}
                    <input
                        placeholder="Pełne wyszukiwanie (Enter nie dodaje, poniżej pełna lista)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        style={{ width: "100%", border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px", marginTop: 10 }}
                    />
                </div>

                {/* Full results */}
                <LibrarySearchResult
                    query={query}
                    onPick={(r) => {
                        if (selected) appendToPlaylist(selected, [toDescriptor(r)]);
                    }}
                />

                {/* Przeglądarka biblioteki z multi-selectem */}
                <LibraryList
                    onPlayNow={(tracks) => setQueue(tracks)}
                    onAddToQueue={(tracks) => setQueue((q) => [...q, ...tracks])}
                    onAddDescriptors={(descs) => selected && appendToPlaylist(selected, descs)}
                />
            </div>
        </div>
    );
};

export default PlaylistBrowser;
