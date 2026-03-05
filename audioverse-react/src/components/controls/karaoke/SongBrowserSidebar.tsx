import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    KARAOKE_QK,
    fetchMyPlaylists,
    fetchOnlinePlaylists,
    createKaraokePlaylist,
    deleteKaraokePlaylist,
    updateKaraokePlaylist,
    publishPlaylist,
    duplicatePlaylist,
} from "../../../scripts/api/apiKaraoke";
import type { KaraokePlaylist } from "../../../models/modelsKaraoke";
import { Focusable } from "../../common/Focusable";

// --- Types ---

export type BrowserNode =
    | { type: "all" }
    | { type: "genre" }
    | { type: "year" }
    | { type: "myPlaylist"; id: number; name: string }
    | { type: "onlinePlaylist"; id: number; name: string };

interface Props {
    activeNode: BrowserNode;
    onSelect: (node: BrowserNode) => void;
}

// --- Styles ---

const sidebarStyle: React.CSSProperties = {
    width: 'min(230px, 100%)',
    minWidth: 'min(200px, 100%)',
    borderRight: "1px solid var(--border-primary, #333)",
    padding: "12px 0",
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflowY: "auto",
    flexShrink: 0,
};

const nodeBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 16px",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    color: "var(--text-primary, #eee)",
    fontSize: 14,
    fontWeight: 500,
    width: "100%",
    textAlign: "left",
    borderRadius: 6,
    transition: "background 0.12s",
};

const nodeActive: React.CSSProperties = {
    ...nodeBase,
    background: "var(--accent-bg, rgba(255,215,0,0.15))",
    fontWeight: 700,
    color: "goldenrod",
};

const sectionTitle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    padding: "14px 16px 4px",
    opacity: 0.5,
    color: "var(--text-secondary, #aaa)",
};

// --- Helpers ---

function isEqual(a: BrowserNode, b: BrowserNode): boolean {
    if (a.type !== b.type) return false;
    if (a.type === "myPlaylist" && b.type === "myPlaylist") return a.id === b.id;
    if (a.type === "onlinePlaylist" && b.type === "onlinePlaylist") return a.id === b.id;
    return true;
}

// --- Component ---

const SongBrowserSidebar: React.FC<Props> = ({ activeNode, onSelect }) => {
    const { t } = useTranslation();
    const qc = useQueryClient();
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [showNewInput, setShowNewInput] = useState(false);
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState("");

    const { data: myPlaylists = [] } = useQuery<KaraokePlaylist[]>({
        queryKey: KARAOKE_QK.myPlaylists,
        queryFn: fetchMyPlaylists,
        staleTime: 60_000,
    });

    const { data: onlinePlaylists = [] } = useQuery<KaraokePlaylist[]>({
        queryKey: KARAOKE_QK.onlinePlaylists,
        queryFn: fetchOnlinePlaylists,
        staleTime: 60_000,
    });

    const createMutation = useMutation({
        mutationFn: (name: string) => createKaraokePlaylist(name),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            setNewPlaylistName("");
            setShowNewInput(false);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteKaraokePlaylist(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            // If deleted playlist was active, switch to all
            if (activeNode.type === "myPlaylist") onSelect({ type: "all" });
        },
    });

    const renameMutation = useMutation({
        mutationFn: ({ id, name }: { id: number; name: string }) => updateKaraokePlaylist(id, { name }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            setRenamingId(null);
            setRenameValue("");
        },
    });

    const publishMutation = useMutation({
        mutationFn: (id: number) => publishPlaylist(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
            qc.invalidateQueries({ queryKey: KARAOKE_QK.onlinePlaylists });
        },
    });

    const duplicateMutation = useMutation({
        mutationFn: (id: number) => duplicatePlaylist(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: KARAOKE_QK.myPlaylists });
        },
    });

    const handleShareLink = (pl: KaraokePlaylist) => {
        const url = `${window.location.origin}/karaoke-playlists?playlist=${pl.id}`;
        navigator.clipboard.writeText(url).catch(() => { /* fallback: ignore */ });
    };

    const renderNode = (node: BrowserNode, icon: string, label: string, focusId: string) => (
        <Focusable key={focusId} id={focusId}>
            <button
                style={isEqual(activeNode, node) ? nodeActive : nodeBase}
                onClick={() => onSelect(node)}
            >
                <span>{icon}</span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
            </button>
        </Focusable>
    );

    return (
        <div style={sidebarStyle}>
            {/* Static categories */}
            <div style={sectionTitle}>{t('songBrowser.browse', 'Browse')}</div>
            {renderNode({ type: "all" }, "🎵", t('songBrowser.allSongs', 'All Songs'), "sb-all")}
            {renderNode({ type: "genre" }, "🎸", t('songBrowser.byGenre', 'By Genre'), "sb-genre")}
            {renderNode({ type: "year" }, "📅", t('songBrowser.byYear', 'By Year'), "sb-year")}

            {/* My Playlists */}
            <div style={{ ...sectionTitle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>{t('songBrowser.myPlaylists', 'My Playlists')}</span>
                <button
                    onClick={() => setShowNewInput(!showNewInput)}
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 16,
                        color: "goldenrod",
                        padding: 0,
                        lineHeight: 1,
                    }}
                    title={t('songBrowser.createPlaylist', 'Create playlist')}
                >
                    +
                </button>
            </div>
            {showNewInput && (
                <div style={{ padding: "0 12px 6px", display: "flex", gap: 4 }}>
                    <input
                        type="text"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder={t('songBrowser.playlistName', 'Playlist name…')}
                        style={{
                            flex: 1,
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--border-primary, #555)",
                            background: "var(--bg-secondary, #222)",
                            color: "var(--text-primary, #eee)",
                            fontSize: 13,
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && newPlaylistName.trim()) {
                                createMutation.mutate(newPlaylistName.trim());
                            }
                        }}
                    />
                    <button
                        onClick={() => newPlaylistName.trim() && createMutation.mutate(newPlaylistName.trim())}
                        disabled={!newPlaylistName.trim() || createMutation.isPending}
                        style={{
                            padding: "4px 10px",
                            borderRadius: 4,
                            border: "none",
                            background: "goldenrod",
                            color: "#000",
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                        }}
                    >
                        {createMutation.isPending ? "…" : "Add"}
                    </button>
                </div>
            )}
            {myPlaylists.length === 0 && !showNewInput && (
                <div style={{ padding: "4px 16px", fontSize: 12, opacity: 0.4 }}>{t('songBrowser.noPlaylists', 'No playlists yet')}</div>
            )}
            {myPlaylists.map((pl) => (
                <div key={pl.id} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        {renamingId === pl.id ? (
                            <div style={{ padding: "4px 12px", display: "flex", gap: 4 }}>
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => setRenameValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && renameValue.trim()) {
                                            renameMutation.mutate({ id: pl.id, name: renameValue.trim() });
                                        } else if (e.key === "Escape") {
                                            setRenamingId(null);
                                        }
                                    }}
                                    autoFocus
                                    style={{
                                        flex: 1,
                                        padding: "3px 6px",
                                        borderRadius: 4,
                                        border: "1px solid goldenrod",
                                        background: "var(--bg-secondary, #222)",
                                        color: "var(--text-primary, #eee)",
                                        fontSize: 13,
                                    }}
                                />
                                <button
                                    onClick={() => renameValue.trim() && renameMutation.mutate({ id: pl.id, name: renameValue.trim() })}
                                    disabled={!renameValue.trim() || renameMutation.isPending}
                                    style={{ background: "goldenrod", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer", fontSize: 12 }}
                                >
                                    ✓
                                </button>
                            </div>
                        ) : (
                            renderNode(
                                { type: "myPlaylist", id: pl.id, name: pl.name ?? `Playlist #${pl.id}` },
                                "📋",
                                pl.name ?? `Playlist #${pl.id}`,
                                `sb-my-${pl.id}`
                            )
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 1, paddingRight: 4 }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setRenamingId(pl.id); setRenameValue(pl.name ?? ""); }}
                            title={t('songBrowser.renamePlaylist', 'Rename')}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-secondary, #aaa)", padding: "3px 4px", opacity: 0.6 }}
                        >
                            ✏️
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); publishMutation.mutate(pl.id); }}
                            title={t('songBrowser.publishPlaylist', 'Publish (make public)')}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-secondary, #aaa)", padding: "3px 4px", opacity: 0.6 }}
                        >
                            🌐
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShareLink(pl); }}
                            title={t('songBrowser.sharePlaylist', 'Copy share link')}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-secondary, #aaa)", padding: "3px 4px", opacity: 0.6 }}
                        >
                            🔗
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(pl.id); }}
                            title={t('songBrowser.duplicatePlaylist', 'Duplicate')}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-secondary, #aaa)", padding: "3px 4px", opacity: 0.6 }}
                        >
                            📄
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                deleteMutation.mutate(pl.id);
                            }}
                            title={t('songBrowser.deletePlaylist', 'Delete playlist')}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: 12,
                                color: "#f44",
                                padding: "4px 4px",
                                opacity: 0.6,
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}

            {/* Online Playlists */}
            <div style={sectionTitle}>{t('songBrowser.onlinePlaylists', 'Online Playlists')}</div>
            {onlinePlaylists.length === 0 && (
                <div style={{ padding: "4px 16px", fontSize: 12, opacity: 0.4 }}>{t('songBrowser.noOnlinePlaylists', 'No online playlists')}</div>
            )}
            {onlinePlaylists.map((pl) => (
                <div key={pl.id} style={{ display: "flex", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        {renderNode(
                            { type: "onlinePlaylist", id: pl.id, name: pl.name ?? `Playlist #${pl.id}` },
                            "🌐",
                            pl.name ?? `Playlist #${pl.id}`,
                            `sb-online-${pl.id}`
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 1, paddingRight: 4 }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); duplicateMutation.mutate(pl.id); }}
                            title={t('songBrowser.saveToMyPlaylists', 'Save to My Playlists')}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-secondary, #aaa)", padding: "3px 4px", opacity: 0.6 }}
                        >
                            💾
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleShareLink(pl); }}
                            title={t('songBrowser.sharePlaylist', 'Copy share link')}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-secondary, #aaa)", padding: "3px 4px", opacity: 0.6 }}
                        >
                            🔗
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SongBrowserSidebar;
