// src/components/controls/library/PlaylistBrowser.tsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocalPlaylists, type LocalPlaylist } from "./useLocalPlaylists.ts";
import PlaylistList from "../playlist/PlaylistList";
import LibraryList from "../library/LibraryList/LibraryList.tsx";
import LibrarySearch from "../library/LibrarySearch";
import LibrarySearchResult from "../library/LibrarySearchResult";
import type { SongRecord, PlayerTrack } from "../../../models/modelsAudio";
import type { SongDescriptorDto } from "../../../models/modelsPlaylists";
import { logger } from "../../../utils/logger";
const log = logger.scoped('PlaylistBrowser');

const colBox: React.CSSProperties = { display: "grid", gap: 12 };

const toDescriptor = (r: SongRecord): SongDescriptorDto => ({
    artist: (r.artists ?? []).join(", "),
    title: r.title,
});

export const PlaylistBrowser: React.FC = () => {
    const { t } = useTranslation();
    const store = useLocalPlaylists();
    const [selected, setSelected] = useState<LocalPlaylist | null>(null);
    const [query, setQuery] = useState("");
    const [, setQueue] = useState<PlayerTrack[]>([]); // queue for the player (optional)

    const selectedId = selected?.id;

    // safe playlist addition, regardless of hook implementation
    const appendToPlaylist = (p: LocalPlaylist, items: SongDescriptorDto[]) => {
        // prefer addItems(id, items) method
        if ('addItems' in store) {
            store.addItems(p.id, items);
            // refresh reference
            const refreshed = store.list().find(x => x.id === p.id) || p;
            setSelected(refreshed);
            return;
        }
        // fallback: update całego obiektu
        const storeRecord = store as Record<string, unknown>;
        if ('update' in store && typeof storeRecord.update === 'function') {
            const merged = Array.from([...(p.items || []), ...items]);
            (storeRecord.update as (pl: LocalPlaylist) => void)({ ...p, items: merged });
            const refreshed = (store as unknown as { list: () => LocalPlaylist[] }).list().find((x: LocalPlaylist) => x.id === p.id) || { ...p, items: merged };
            setSelected(refreshed);
            return;
        }
        // ultimate fallback: nic – ale pokaż komunikat w konsoli
        log.warn("useLocalPlaylists: brak metody addItems/update – zaktualizuj implementację hooka.");
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(min(200px, 100%), 320px) 1fr", gap: 16 }}>
            {/* LEWA KOLUMNA – playlisty */}
            <div style={colBox}>
                <h3 style={{ margin: 0 }}>{t('playlistBrowser.playlists')}</h3>
                <PlaylistList
                    selectedId={selectedId}
                    onSelect={setSelected}
                    // onCreateRemote – możesz podpiąć mutację do API, zostawiamy na później
                />
                {selected && (
                    <div style={{ fontSize: 12, color: "var(--text-dim, #64748b)" }}>
                        {t('playlistBrowser.selected', 'Selected')}: <strong>{selected.name}</strong> • {selected.items?.length ?? 0} {t('playlistBrowser.tracks', 'tracks')}
                    </div>
                )}
            </div>

            {/* PRAWA KOLUMNA – wyszukiwanie i biblioteka */}
            <div style={colBox}>
                <h3 style={{ margin: 0 }}>{t('playlistBrowser.library')}</h3>

                {/* Quick search + dropdown top-5 */}
                <div>
                    <LibrarySearch
                        placeholder={t('playlistBrowser.searchAndAdd', 'Search and add to playlist...')}
                        onPick={(record) => {
                            if (selected) appendToPlaylist(selected, [toDescriptor(record)]);
                        }}
                    />
                    {/* Input connected to full results */}
                    <input
                        placeholder={t('playlistBrowser.fullSearch', 'Full search (Enter does not add, full list below)')}
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

                {/* Library browser with multi-select */}
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
