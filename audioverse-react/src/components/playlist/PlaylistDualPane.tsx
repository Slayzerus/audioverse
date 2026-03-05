// PlaylistDualPane.tsx — Norton Commander-style dual-pane view
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import PlaylistTrackList from "./PlaylistTrackList";
import type {
    ManagedPlaylist,
    PlaylistTag,
    PlaylistTrack,
    SortField,
    SortDirection,
    PaneSide,
    ClipboardState,
} from "../../models/modelsPlaylistManager";

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

export interface PlaylistDualPaneProps {
    playlists: ManagedPlaylist[];
    tags: PlaylistTag[];
    onCopyTracks: (sourceId: string, targetId: string, trackIds: string[]) => void;
    onMoveTracks: (sourceId: string, targetId: string, trackIds: string[]) => void;
    onRemoveTracks: (playlistId: string, trackIds: string[]) => void;
    onReorderTracks: (playlistId: string, trackIds: string[]) => void;
    onPlay: (track: PlaylistTrack) => void;
    onTagTracks: (trackIds: string[], tagIds: string[]) => void;
    initialLeftId?: string;
    initialRightId?: string;
}

// ══════════════════════════════════════════════════════════════
// Pane internal state
// ══════════════════════════════════════════════════════════════

interface PaneInternalState {
    playlistId: string | null;
    selectedTrackIds: Set<string>;
    sortField: SortField;
    sortDir: SortDirection;
    filterText: string;
}

const defaultPaneState = (playlistId: string | null): PaneInternalState => ({
    playlistId,
    selectedTrackIds: new Set(),
    sortField: "custom" as SortField,
    sortDir: "asc" as SortDirection,
    filterText: "",
});

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const PlaylistDualPane: React.FC<PlaylistDualPaneProps> = ({
    playlists,
    tags,
    onCopyTracks,
    onMoveTracks,
    onRemoveTracks,
    onReorderTracks,
    onPlay,
    onTagTracks,
    initialLeftId,
    initialRightId,
}) => {
    const { t } = useTranslation();

    const [leftPane, setLeftPane] = useState<PaneInternalState>(() => defaultPaneState(initialLeftId ?? null));
    const [rightPane, setRightPane] = useState<PaneInternalState>(() => defaultPaneState(initialRightId ?? null));
    const [activePane, setActivePane] = useState<PaneSide>("left" as PaneSide);
    const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
    const [dividerPos, setDividerPos] = useState(50); // percentage
    const [isDraggingDivider, setIsDraggingDivider] = useState(false);

    const leftPlaylist = useMemo(() => playlists.find((p) => p.id === leftPane.playlistId), [playlists, leftPane.playlistId]);
    const rightPlaylist = useMemo(() => playlists.find((p) => p.id === rightPane.playlistId), [playlists, rightPane.playlistId]);

    // ── Pane actions ──

    const updatePane = useCallback(
        (side: PaneSide, patch: Partial<PaneInternalState>) => {
            if (side === "left") setLeftPane((p) => ({ ...p, ...patch }));
            else setRightPane((p) => ({ ...p, ...patch }));
        },
        [],
    );

    const getPaneState = useCallback(
        (side: PaneSide): PaneInternalState => (side === "left" ? leftPane : rightPane),
        [leftPane, rightPane],
    );

    const getOtherSide = (side: PaneSide): PaneSide => (side === "left" ? "right" : "left") as PaneSide;

    // ── Transfer operations ──

    const handleCopy = useCallback(
        (side: PaneSide) => {
            const pane = getPaneState(side);
            const otherPane = getPaneState(getOtherSide(side));
            if (!pane.playlistId || !otherPane.playlistId || pane.selectedTrackIds.size === 0) return;
            onCopyTracks(pane.playlistId, otherPane.playlistId, Array.from(pane.selectedTrackIds));
            updatePane(side, { selectedTrackIds: new Set() });
        },
        [getPaneState, onCopyTracks, updatePane],
    );

    const handleMove = useCallback(
        (side: PaneSide) => {
            const pane = getPaneState(side);
            const otherPane = getPaneState(getOtherSide(side));
            if (!pane.playlistId || !otherPane.playlistId || pane.selectedTrackIds.size === 0) return;
            onMoveTracks(pane.playlistId, otherPane.playlistId, Array.from(pane.selectedTrackIds));
            updatePane(side, { selectedTrackIds: new Set() });
        },
        [getPaneState, onMoveTracks, updatePane],
    );

    const handleClipboardCopy = useCallback(
        (side: PaneSide) => {
            const pane = getPaneState(side);
            if (!pane.playlistId || pane.selectedTrackIds.size === 0) return;
            setClipboard({
                operation: "copy",
                sourcePlaylistId: pane.playlistId,
                trackIds: Array.from(pane.selectedTrackIds),
            });
        },
        [getPaneState],
    );

    const handleClipboardCut = useCallback(
        (side: PaneSide) => {
            const pane = getPaneState(side);
            if (!pane.playlistId || pane.selectedTrackIds.size === 0) return;
            setClipboard({
                operation: "cut",
                sourcePlaylistId: pane.playlistId,
                trackIds: Array.from(pane.selectedTrackIds),
            });
        },
        [getPaneState],
    );

    const handleClipboardPaste = useCallback(
        (side: PaneSide) => {
            const pane = getPaneState(side);
            if (!clipboard || !pane.playlistId) return;
            if (clipboard.operation === "copy") {
                onCopyTracks(clipboard.sourcePlaylistId, pane.playlistId, clipboard.trackIds);
            } else {
                onMoveTracks(clipboard.sourcePlaylistId, pane.playlistId, clipboard.trackIds);
            }
            setClipboard(null);
        },
        [clipboard, getPaneState, onCopyTracks, onMoveTracks],
    );

    // ── Keyboard shortcuts ──

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault();
                setActivePane((p) => getOtherSide(p));
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "c") {
                handleClipboardCopy(activePane);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "x") {
                handleClipboardCut(activePane);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === "v") {
                handleClipboardPaste(activePane);
            }
        },
        [activePane, handleClipboardCopy, handleClipboardCut, handleClipboardPaste],
    );

    // ── Divider drag ──

    const handleDividerMouseDown = useCallback(() => setIsDraggingDivider(true), []);

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!isDraggingDivider) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            setDividerPos(Math.max(20, Math.min(80, pct)));
        },
        [isDraggingDivider],
    );

    const handleMouseUp = useCallback(() => setIsDraggingDivider(false), []);

    // ── Render a single pane ──

    const renderPane = (side: PaneSide) => {
        const pane = getPaneState(side);
        const playlist = side === "left" ? leftPlaylist : rightPlaylist;
        const isActive = activePane === side;
        const otherPane = getPaneState(getOtherSide(side));
        const hasTarget = !!otherPane.playlistId;

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                            border: isActive ? "2px solid var(--accent, #3b82f6)" : "2px solid transparent",
                    borderRadius: 8,
                    overflow: "hidden",
                    background: "var(--card-bg, #fff)",
                }}
                onClick={() => setActivePane(side)}
            >
                {/* Pane header */}
                <div
                    style={{
                        padding: "8px 12px",
                        background: isActive ? "var(--accent, #3b82f6)" : "var(--surface-bg, #f3f4f6)",
                        color: isActive ? "var(--btn-text, #fff)" : "var(--text-primary, #1f2937)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <select
                        value={pane.playlistId ?? ""}
                        onChange={(e) => updatePane(side, { playlistId: e.target.value || null, selectedTrackIds: new Set() })}
                        style={{
                            flex: 1,
                            fontSize: "0.82rem",
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: "1px solid var(--border-color, #d1d5db)",
                            background: isActive ? "var(--accent-overlay, #ffffff30)" : "var(--input-bg, #fff)",
                            color: isActive ? "var(--btn-text, #fff)" : "var(--text-primary, #1f2937)",
                        }}
                    >
                        <option value="">{t("playlistManager.selectPlaylist")}</option>
                        {playlists.map((pl) => (
                            <option key={pl.id} value={pl.id}>
                                {pl.name} ({pl.trackCount})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Transfer buttons */}
                <div
                    style={{
                        display: "flex",
                        gap: 4,
                        padding: "4px 8px",
                        borderBottom: "1px solid var(--border-color, #e5e7eb)",
                        flexWrap: "wrap",
                    }}
                >
                    <button
                        style={actionBtn(false)}
                        onClick={() => handleCopy(side)}
                        disabled={!pane.playlistId || !hasTarget || pane.selectedTrackIds.size === 0}
                        title={t("playlistManager.copyToOther")}
                    >
                        {side === "left" ? "📋→" : "←📋"} {t("playlistManager.copy")}
                    </button>
                    <button
                        style={actionBtn(false)}
                        onClick={() => handleMove(side)}
                        disabled={!pane.playlistId || !hasTarget || pane.selectedTrackIds.size === 0}
                        title={t("playlistManager.moveToOther")}
                    >
                        {side === "left" ? "✂→" : "←✂"} {t("playlistManager.move")}
                    </button>
                    <div style={{ flex: 1 }} />
                    {clipboard && (
                        <button
                            style={actionBtn(true)}
                            onClick={() => handleClipboardPaste(side)}
                            disabled={!pane.playlistId}
                        >
                            📌 {t("playlistManager.paste")} ({clipboard.trackIds.length})
                        </button>
                    )}
                </div>

                {/* Track list */}
                {playlist ? (
                    <PlaylistTrackList
                        tracks={playlist.tracks}
                        tags={tags}
                        selectedTrackIds={pane.selectedTrackIds}
                        onSelectionChange={(ids) => updatePane(side, { selectedTrackIds: ids })}
                        onPlay={onPlay}
                        onRemove={(ids) => onRemoveTracks(playlist.id, ids)}
                        onReorder={(ids) => onReorderTracks(playlist.id, ids)}
                        onTagTracks={onTagTracks}
                        sortField={pane.sortField}
                        sortDir={pane.sortDir}
                        onSortChange={(f, d) => updatePane(side, { sortField: f, sortDir: d })}
                        filterText={pane.filterText}
                        onFilterChange={(text) => updatePane(side, { filterText: text })}
                        compact
                        draggable
                    />
                ) : (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3, fontSize: "0.85rem" }}>
                        {t("playlistManager.selectPlaylistPrompt")}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            style={{
                display: "flex",
                height: "100%",
                userSelect: isDraggingDivider ? "none" : "auto",
            }}
            onKeyDown={handleKeyDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            tabIndex={0}
        >
            {/* Left pane */}
            <div style={{ width: `${dividerPos}%`, minWidth: 200 }}>{renderPane("left" as PaneSide)}</div>

            {/* Divider */}
                <div
                style={{
                    width: 6,
                    cursor: "col-resize",
                    background: isDraggingDivider ? "var(--accent, #3b82f6)" : "var(--border-color, #e5e7eb)",
                    transition: isDraggingDivider ? "none" : "background 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
                onMouseDown={handleDividerMouseDown}
            >
                <div
                    style={{
                        width: 2,
                        height: 40,
                        borderRadius: 1,
                            background: isDraggingDivider ? "var(--btn-text, #fff)" : "var(--text-secondary, #9ca3af)",
                    }}
                />
            </div>

            {/* Right pane */}
            <div style={{ flex: 1, minWidth: 200 }}>{renderPane("right" as PaneSide)}</div>
        </div>
    );
};

// ── Shared button style ──

const actionBtn = (accent: boolean): React.CSSProperties => ({
    background: accent ? "var(--accent, #3b82f6)" : "transparent",
    color: accent ? "var(--btn-text, #fff)" : "var(--text-secondary, #6b7280)",
    border: accent ? "none" : "1px solid var(--border-color, #d1d5db)",
    borderRadius: 6,
    padding: "3px 8px",
    fontSize: "0.72rem",
    cursor: "pointer",
    whiteSpace: "nowrap",
});

export default PlaylistDualPane;
