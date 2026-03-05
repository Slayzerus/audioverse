import React, { useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useLocalPlaylists, type LocalPlaylist } from "./useLocalPlaylists";
import {
    MusicPlatform,                              // ⬅️ enum
    type CreatePlaylistOnPlatformRequest,
    type CreatePlaylistResult,
} from "../../../scripts/api/apiPlaylists";
import { logger } from "../../../utils/logger";
const log = logger.scoped('PlaylistList');

type Props = {
    selectedId?: string;
    onSelect?: (p: LocalPlaylist) => void;
    /** opcjonalny sync do API (np. TIDAL/Spotify) */
    onCreateRemote?: (req: CreatePlaylistOnPlatformRequest) => Promise<CreatePlaylistResult>;
};

const box: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" };
const row: React.CSSProperties = { ...box, padding: "8px 10px", cursor: "pointer" };
const btn: React.CSSProperties = { border: "1px solid var(--border-light, #d1d5db)", borderRadius: 8, padding: "6px 10px", background: "var(--bg, #fff)", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "var(--primary, #4f46e5)", borderColor: "var(--primary, #4f46e5)", color: "var(--bg, #fff)" };

export const PlaylistList: React.FC<Props> = ({ selectedId, onSelect, onCreateRemote }) => {
    const { t } = useTranslation();
    const store = useLocalPlaylists();
    const [name, setName] = useState("");
    const all = useMemo(() => store.list(), [store]);

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    placeholder={t('playlistList.playlistName', 'Playlist name...')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px" }}
                    aria-label="Playlist name"
                />
                <button
                    type="button"
                    disabled={!name.trim()}
                    style={name.trim() ? btnPrimary : { ...btn, cursor: "not-allowed", color: "var(--muted, #9ca3af)", background: "var(--bg-muted, #f3f4f6)" }}
                    onClick={async () => {
                        const created = store.create(name.trim());
                        setName("");

                        // opcjonalny sync do zewnętrznej platformy
                        if (onCreateRemote) {
                            try {
                                await onCreateRemote({
                                    platform: MusicPlatform.Tidal,   // ⬅️ enum zamiast "Tidal"
                                    name: created.name,
                                    songs: created.items,
                                });
                            } catch (err) {
                                log.error("Remote playlist create failed:", err); // ⬅️ żadnych pustych catchy
                            }
                        }

                        onSelect?.(created);
                    }}
                >
                    + {t('common.add', 'Add')}
                </button>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
                {all.map((p) => {
                    const active = p.id === selectedId;
                    return (
                        <button key={p.id} onClick={() => onSelect?.(p)} style={{ ...row, background: active ? "var(--active-bg, #eef2ff)" : "var(--bg, #fff)" }}>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ color: "var(--text-dim, #64748b)", fontSize: 12 }}>
                                {t('playlistList.itemCount', '{{count}} songs', { count: p.items.length })} \u2022 {new Date(p.updatedAt).toLocaleString()}
                            </div>
                        </button>
                    );
                })}
                {!all.length && <div style={{ color: "var(--muted, #6b7280)" }}>{t('playlistList.emptyState', 'No playlists. Add the first one ↑')}</div>}
            </div>
        </div>
    );
};

export default PlaylistList;
