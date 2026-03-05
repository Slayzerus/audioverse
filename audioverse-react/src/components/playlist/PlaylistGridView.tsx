// PlaylistGridView.tsx — Grid display of tracks in a selected playlist
import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import type {
    ManagedPlaylist,
    PlaylistTag,
    PlaylistTrack,
} from "../../models/modelsPlaylistManager";

interface PlaylistGridViewProps {
    playlist: ManagedPlaylist;
    tags: PlaylistTag[];
    onPlay: (track: PlaylistTrack) => void;
    selectedTrackIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
}

const PlaylistGridView: React.FC<PlaylistGridViewProps> = ({
    playlist,
    tags: _tags,
    onPlay,
    selectedTrackIds,
    onSelectionChange,
}) => {
    const { t } = useTranslation();

    const toggleSelect = useCallback(
        (id: string) => {
            const next = new Set(selectedTrackIds);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            onSelectionChange(next);
        },
        [selectedTrackIds, onSelectionChange],
    );

    if (playlist.tracks.length === 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 60, opacity: 0.3 }}>
                <span style={{ fontSize: "2rem", marginBottom: 8 }}>🎵</span>
                <span style={{ fontSize: "0.82rem" }}>{t("playlistManager.emptyPlaylist")}</span>
            </div>
        );
    }

    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
            {playlist.tracks.map((track) => {
                const selected = selectedTrackIds.has(track.id);
                return (
                    <div
                        key={track.id}
                        onClick={() => toggleSelect(track.id)}
                        onDoubleClick={() => onPlay(track)}
                        style={{
                            border: selected ? "2px solid var(--accent, #3b82f6)" : "1px solid var(--border-color, #e5e7eb)",
                            borderRadius: 10,
                            padding: 10,
                            cursor: "pointer",
                            background: selected ? "var(--accent-bg, #eff6ff)" : "var(--card-bg, #fff)",
                            transition: "all 0.12s",
                        }}
                    >
                        <div
                            style={{
                                width: "100%",
                                aspectRatio: "1",
                                borderRadius: 6,
                                background: "linear-gradient(135deg, var(--playlist-track-bg1, #6366f140), var(--playlist-track-bg2, #6366f110))",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.5rem",
                                marginBottom: 6,
                            }}
                        >
                            ▶
                        </div>
                        <div
                            style={{
                                fontWeight: 500,
                                fontSize: "0.78rem",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {track.title}
                        </div>
                        <div
                            style={{
                                fontSize: "0.68rem",
                                opacity: 0.5,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {track.artist}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default React.memo(PlaylistGridView);
