import React, { useMemo, useState } from "react";
import { useLocalPlaylists, type LocalPlaylist } from "./useLocalPlaylists";
import {
    MusicPlatform,                              // ⬅️ enum
    type CreatePlaylistOnPlatformRequest,
    type CreatePlaylistResult,
} from "../../../scripts/api/apiPlaylists";

type Props = {
    selectedId?: string;
    onSelect?: (p: LocalPlaylist) => void;
    /** opcjonalny sync do API (np. TIDAL/Spotify) */
    onCreateRemote?: (req: CreatePlaylistOnPlatformRequest) => Promise<CreatePlaylistResult>;
};

const box: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff" };
const row: React.CSSProperties = { ...box, padding: "8px 10px", cursor: "pointer" };
const btn: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px", background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, background: "#4f46e5", borderColor: "#4f46e5", color: "#fff" };

export const PlaylistList: React.FC<Props> = ({ selectedId, onSelect, onCreateRemote }) => {
    const store = useLocalPlaylists();
    const [name, setName] = useState("");
    const all = useMemo(() => store.list(), [store]);

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
                <input
                    placeholder="Nazwa playlisty…"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ flex: 1, border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px" }}
                />
                <button
                    type="button"
                    disabled={!name.trim()}
                    style={name.trim() ? btnPrimary : { ...btn, cursor: "not-allowed", color: "#9ca3af", background: "#f3f4f6" }}
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
                                console.error("Remote playlist create failed:", err); // ⬅️ żadnych pustych catchy
                            }
                        }

                        onSelect?.(created);
                    }}
                >
                    + Dodaj
                </button>
            </div>

            <div style={{ display: "grid", gap: 6 }}>
                {all.map((p) => {
                    const active = p.id === selectedId;
                    return (
                        <button key={p.id} onClick={() => onSelect?.(p)} style={{ ...row, background: active ? "#eef2ff" : "#fff" }}>
                            <div style={{ fontWeight: 600 }}>{p.name}</div>
                            <div style={{ color: "#64748b", fontSize: 12 }}>
                                {p.items.length} utw. • {new Date(p.updatedAt).toLocaleString()}
                            </div>
                        </button>
                    );
                })}
                {!all.length && <div style={{ color: "#6b7280" }}>Brak playlist. Dodaj pierwszą ↑</div>}
            </div>
        </div>
    );
};

export default PlaylistList;
