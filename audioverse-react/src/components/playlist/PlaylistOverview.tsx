// PlaylistOverview.tsx — Card grid showing all playlists when no playlist is selected
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { PlaylistType } from "../../models/modelsPlaylistManager";
import type {
    ManagedPlaylist,
    PlaylistFolder,
    PlaylistTag,
} from "../../models/modelsPlaylistManager";

const sanitizeVar = (s: string) => s.replace(/[^a-z0-9_-]/gi, "-");

const cardAction: React.CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "0.78rem",
    padding: "2px 4px",
    opacity: 0.4,
};

interface PlaylistOverviewProps {
    playlists: ManagedPlaylist[];
    folders: PlaylistFolder[];
    tags: PlaylistTag[];
    activeFolderId: string | null;
    onSelectPlaylist: (id: string) => void;
    onDeletePlaylist: (id: string) => void;
    onDuplicatePlaylist: (id: string) => void;
}

const PlaylistOverview: React.FC<PlaylistOverviewProps> = ({
    playlists,
    folders,
    tags,
    activeFolderId,
    onSelectPlaylist,
    onDeletePlaylist,
    onDuplicatePlaylist,
}) => {
    const { t } = useTranslation();

    const filtered = useMemo(() => {
        if (activeFolderId) return playlists.filter((p) => p.folderId === activeFolderId);
        return playlists;
    }, [playlists, activeFolderId]);

    if (filtered.length === 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60, opacity: 0.4 }}>
                <span style={{ fontSize: "2.5rem", marginBottom: 12 }}>🎵</span>
                <span style={{ fontSize: "0.85rem" }}>{t("playlistManager.emptyState")}</span>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {filtered.map((pl) => {
                const folder = folders.find((f) => f.id === pl.folderId);
                return (
                    <div
                        key={pl.id}
                        onClick={() => onSelectPlaylist(pl.id)}
                        style={{
                            border: "1px solid var(--border-color, #e5e7eb)",
                            borderRadius: 12,
                            padding: 16,
                            cursor: "pointer",
                            background: "var(--card-bg, #fff)",
                            transition: "box-shadow 0.15s, transform 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)");
                            (e.currentTarget.style.transform = "translateY(-1px)");
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget.style.boxShadow = "none");
                            (e.currentTarget.style.transform = "none");
                        }}
                    >
                        {/* Cover */}
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "1",
                                borderRadius: 8,
                                background: `linear-gradient(135deg, var(--playlist-cover-bg1, #6366f140), var(--playlist-cover-bg2, #6366f110))`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "2.5rem",
                                marginBottom: 10,
                            }}
                        >
                            {pl.type === PlaylistType.Dynamic ? "⚡" : "🎵"}
                        </div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 2 }}>
                            {pl.name}
                        </div>
                        <div style={{ fontSize: "0.72rem", opacity: 0.5 }}>
                            {pl.trackCount} {t("playlistManager.tracks")}
                            {folder && ` · 📁 ${folder.name}`}
                        </div>
                        {/* Tags */}
                        {pl.tags.length > 0 && (
                            <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                                {pl.tags.slice(0, 3).map((tagId) => {
                                    const tag = tags.find((t) => t.id === tagId);
                                    if (!tag) return null;
                                    return (
                                        <span
                                            key={tagId}
                                            style={{
                                                padding: "1px 8px",
                                                borderRadius: 12,
                                                background: `var(--tag-${sanitizeVar(tagId)}-bg, ${tag.color}18)`,
                                                color: `var(--tag-${sanitizeVar(tagId)}, ${tag.color})`,
                                                fontSize: "0.65rem",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {tag.name}
                                        </span>
                                    );
                                })}
                            </div>
                        )}
                        {/* Actions */}
                        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDuplicatePlaylist(pl.id);
                                }}
                                style={cardAction}
                                title={t("playlistManager.duplicate")}
                            >
                                📋
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePlaylist(pl.id);
                                }}
                                style={cardAction}
                                title={t("playlistManager.delete")}
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(PlaylistOverview);
