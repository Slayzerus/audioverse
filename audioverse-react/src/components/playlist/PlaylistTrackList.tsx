// PlaylistTrackList.tsx — Sortable, filterable, multi-select track list
import React, { useState, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SortDirection } from "../../models/modelsPlaylistManager";
import type { PlaylistTrack, PlaylistTag, SortField } from "../../models/modelsPlaylistManager";

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

export interface PlaylistTrackListProps {
    tracks: PlaylistTrack[];
    tags: PlaylistTag[];
    selectedTrackIds: Set<string>;
    onSelectionChange: (ids: Set<string>) => void;
    onPlay?: (track: PlaylistTrack) => void;
    onRemove?: (trackIds: string[]) => void;
    onReorder?: (trackIds: string[]) => void;
    onTagTracks?: (trackIds: string[], tagIds: string[]) => void;
    onRateTracks?: (trackIds: string[], rating: number) => void;
    sortField: SortField;
    sortDir: SortDirection;
    onSortChange: (field: SortField, dir: SortDirection) => void;
    filterText: string;
    onFilterChange: (text: string) => void;
    compact?: boolean;
    draggable?: boolean;
    onDragStart?: (trackIds: string[], e: React.DragEvent) => void;
    dropTarget?: boolean;
    onDrop?: (e: React.DragEvent) => void;
}

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

const formatDuration = (sec?: number): string => {
    if (!sec) return "--:--";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
};

const SOURCE_ICONS: Record<string, string> = {
    library: "💿",
    spotify: "🟢",
    tidal: "⬛",
    youtube: "🔴",
    musicbrainz: "🎼",
    import: "📥",
    manual: "✏",
};

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const PlaylistTrackList: React.FC<PlaylistTrackListProps> = ({
    tracks,
    tags,
    selectedTrackIds,
    onSelectionChange,
    onPlay,
    onRemove,
    onReorder,
    onTagTracks,
    onRateTracks: _onRateTracks,
    sortField,
    sortDir,
    onSortChange,
    filterText,
    onFilterChange,
    compact = false,
    draggable = false,
    onDragStart,
    dropTarget = false,
    onDrop,
}) => {
    const { t } = useTranslation();
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
    const [showTagMenu, setShowTagMenu] = useState<string | null>(null);
    const lastClickedIdx = useRef<number | null>(null);

    // ── Filter & sort ──

    const filtered = useMemo(() => {
        let list = tracks;
        if (filterText.trim()) {
            const q = filterText.toLowerCase();
            list = list.filter(
                (t) =>
                    t.title.toLowerCase().includes(q) ||
                    t.artist.toLowerCase().includes(q) ||
                    t.album?.toLowerCase().includes(q) ||
                    t.genre?.toLowerCase().includes(q),
            );
        }
        return [...list].sort((a, b) => {
            const dir = sortDir === "asc" ? 1 : -1;
            switch (sortField) {
                case "title": return dir * a.title.localeCompare(b.title);
                case "artist": return dir * a.artist.localeCompare(b.artist);
                case "album": return dir * (a.album ?? "").localeCompare(b.album ?? "");
                case "duration": return dir * ((a.duration ?? 0) - (b.duration ?? 0));
                case "year": return dir * ((a.year ?? 0) - (b.year ?? 0));
                case "rating": return dir * ((a.rating ?? 0) - (b.rating ?? 0));
                case "addedDate": return dir * (a.addedAt ?? "").localeCompare(b.addedAt ?? "");
                case "custom": return dir * ((a.customOrder ?? 0) - (b.customOrder ?? 0));
                default: return 0;
            }
        });
    }, [tracks, filterText, sortField, sortDir]);

    // ── Selection ──

    const handleClick = useCallback(
        (idx: number, e: React.MouseEvent) => {
            const track = filtered[idx];
            if (!track) return;

            if (e.ctrlKey || e.metaKey) {
                const next = new Set(selectedTrackIds);
                next.has(track.id) ? next.delete(track.id) : next.add(track.id);
                onSelectionChange(next);
            } else if (e.shiftKey && lastClickedIdx.current !== null) {
                const start = Math.min(lastClickedIdx.current, idx);
                const end = Math.max(lastClickedIdx.current, idx);
                const next = new Set(selectedTrackIds);
                for (let i = start; i <= end; i++) next.add(filtered[i].id);
                onSelectionChange(next);
            } else {
                onSelectionChange(new Set([track.id]));
            }
            lastClickedIdx.current = idx;
        },
        [filtered, selectedTrackIds, onSelectionChange],
    );

    const handleSelectAll = useCallback(() => {
        if (selectedTrackIds.size === filtered.length) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(filtered.map((t) => t.id)));
        }
    }, [filtered, selectedTrackIds, onSelectionChange]);

    // ── Sort header ──

    const SortHeader: React.FC<{ field: SortField; label: string; width?: number | string }> = ({
        field,
        label,
        width,
    }) => {
        const isActive = sortField === field;
        return (
            <div
                style={{
                    width,
                    flex: width ? undefined : 1,
                    cursor: "pointer",
                    userSelect: "none",
                    fontWeight: isActive ? 700 : 500,
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    opacity: isActive ? 1 : 0.6,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                }}
                onClick={() => {
                    if (isActive) {
                        onSortChange(field, sortDir === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc);
                    } else {
                        onSortChange(field, SortDirection.Asc);
                    }
                }}
            >
                {label}
                {isActive && <span>{sortDir === "asc" ? "↑" : "↓"}</span>}
            </div>
        );
    };

    // ── Drag/drop for reorder ──

    const handleInternalDragStart = useCallback(
        (track: PlaylistTrack, e: React.DragEvent) => {
            const ids = selectedTrackIds.has(track.id)
                ? Array.from(selectedTrackIds)
                : [track.id];
            e.dataTransfer.setData("trackIds", JSON.stringify(ids));
            e.dataTransfer.effectAllowed = "move";
            onDragStart?.(ids, e);
        },
        [selectedTrackIds, onDragStart],
    );

    const handleInternalDragOver = useCallback(
        (idx: number, e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            setDragOverIdx(idx);
        },
        [],
    );

    const handleInternalDrop = useCallback(
        (idx: number, e: React.DragEvent) => {
            e.preventDefault();
            setDragOverIdx(null);
            try {
                const raw = e.dataTransfer.getData("trackIds");
                if (raw && onReorder) {
                    const draggedIds: string[] = JSON.parse(raw);
                    const remaining = filtered.filter((t) => !draggedIds.includes(t.id));
                    const dragged = filtered.filter((t) => draggedIds.includes(t.id));
                    const insertAt = Math.min(idx, remaining.length);
                    remaining.splice(insertAt, 0, ...dragged);
                    onReorder(remaining.map((t) => t.id));
                }
            } catch { /* Expected: drag data JSON may be malformed or incompatible */ }
        },
        [filtered, onReorder],
    );

    const handleDropExternal = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOverIdx(null);
            onDrop?.(e);
        },
        [onDrop],
    );

    // ── Tag menu ──

    const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);
    const sanitizeVar = (s: string) => s.replace(/[^a-z0-9_-]/gi, "-");

    // ── Styles ──

    const rowHeight = compact ? 36 : 48;

    const headerStyle: React.CSSProperties = {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        borderBottom: "1px solid var(--border-color, #e5e7eb)",
        color: "var(--text-secondary, #6b7280)",
    };

    const rowStyle = (isSelected: boolean, isDragOver: boolean): React.CSSProperties => ({
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: compact ? "4px 12px" : "6px 12px",
        height: rowHeight,
        cursor: "pointer",
        background: isDragOver
            ? "var(--accent-light, #dbeafe)"
            : isSelected
              ? "var(--selected-bg, #eff6ff)"
              : "transparent",
        borderBottom: "1px solid var(--border-subtle, #f3f4f6)",
        transition: "background 0.1s",
    });

    const allSelected = filtered.length > 0 && selectedTrackIds.size === filtered.length;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                overflow: "hidden",
            }}
            onDragOver={dropTarget ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; } : undefined}
            onDrop={dropTarget ? handleDropExternal : undefined}
        >
            {/* Filter bar */}
            <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border-color, #e5e7eb)", display: "flex", gap: 8, alignItems: "center" }}>
                <input
                    type="text"
                    value={filterText}
                    onChange={(e) => onFilterChange(e.target.value)}
                    placeholder={"🔍 " + t("playlistManager.filterTracks")}
                    style={{
                        flex: 1,
                        fontSize: "0.82rem",
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid var(--border-color, #d1d5db)",
                        background: "var(--input-bg, #f9fafb)",
                        color: "var(--text-primary, #1f2937)",
                    }}
                />
                <span style={{ fontSize: "0.72rem", opacity: 0.5 }}>
                    {filtered.length}/{tracks.length}
                </span>
                {selectedTrackIds.size > 0 && onRemove && (
                    <button
                        style={{
                            fontSize: "0.72rem",
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--error, #ef4444)",
                            background: "transparent",
                            color: "var(--error, #ef4444)",
                            cursor: "pointer",
                        }}
                        onClick={() => onRemove(Array.from(selectedTrackIds))}
                    >
                        🗑 {selectedTrackIds.size}
                    </button>
                )}
            </div>

            {/* Column headers */}
            <div style={headerStyle}>
                <div style={{ width: 28 }}>
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={handleSelectAll}
                        style={{ cursor: "pointer" }}
                    />
                </div>
                <div style={{ width: 20 }}>#</div>
                {!compact && <div style={{ width: 44 }} />}
                <SortHeader field={"title" as SortField} label={t("playlistManager.colTitle")} />
                <SortHeader field={"artist" as SortField} label={t("playlistManager.colArtist")} />
                {!compact && <SortHeader field={"album" as SortField} label={t("playlistManager.colAlbum")} />}
                <SortHeader field={"duration" as SortField} label={t("playlistManager.colDuration")} width={60} />
                {!compact && <SortHeader field={"year" as SortField} label={t("playlistManager.colYear")} width={50} />}
                <div style={{ width: 30 }} /> {/* source */}
                {!compact && <div style={{ width: 60 }} />} {/* tags */}
                <div style={{ width: 24 }} /> {/* actions */}
            </div>

            {/* Track rows */}
            <div style={{ flex: 1, overflow: "auto" }}>
                {filtered.length === 0 && (
                    <div style={{ padding: 24, textAlign: "center", opacity: 0.4, fontSize: "0.85rem" }}>
                        {tracks.length === 0
                            ? t("playlistManager.emptyPlaylist")
                            : t("playlistManager.noMatchingTracks")}
                    </div>
                )}
                {filtered.map((track, idx) => {
                    const isSelected = selectedTrackIds.has(track.id);
                    const isDragOver = dragOverIdx === idx;
                    return (
                        <div
                            key={track.id}
                            style={rowStyle(isSelected, isDragOver)}
                            onClick={(e) => handleClick(idx, e)}
                            onDoubleClick={() => onPlay?.(track)}
                            draggable={draggable}
                            onDragStart={(e) => handleInternalDragStart(track, e)}
                            onDragOver={(e) => handleInternalDragOver(idx, e)}
                            onDrop={(e) => handleInternalDrop(idx, e)}
                            onDragLeave={() => setDragOverIdx(null)}
                        >
                            <div style={{ width: 28 }}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                        const next = new Set(selectedTrackIds);
                                        isSelected ? next.delete(track.id) : next.add(track.id);
                                        onSelectionChange(next);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ cursor: "pointer" }}
                                />
                            </div>
                            <div style={{ width: 20, fontSize: "0.7rem", opacity: 0.4 }}>{idx + 1}</div>
                            {!compact && (
                                <div style={{ width: 44, height: 36, flexShrink: 0 }}>
                                    {track.coverUrl ? (
                                        <img
                                            src={track.coverUrl}
                                            alt={track.title || t('common.coverArt', 'Cover art')}
                                            style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover" }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                width: 36,
                                                height: 36,
                                                borderRadius: 4,
                                                background: "var(--surface-bg, #f3f4f6)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.9rem",
                                            }}
                                        >
                                            🎵
                                        </div>
                                    )}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.82rem", fontWeight: 500 }}>
                                {track.title}
                            </div>
                            <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.82rem", opacity: 0.7 }}>
                                {track.artist}
                            </div>
                            {!compact && (
                                <div style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.78rem", opacity: 0.5 }}>
                                    {track.album}
                                </div>
                            )}
                            <div style={{ width: 60, fontSize: "0.78rem", opacity: 0.5, textAlign: "right" }}>
                                {formatDuration(track.duration)}
                            </div>
                            {!compact && (
                                <div style={{ width: 50, fontSize: "0.72rem", opacity: 0.4, textAlign: "center" }}>
                                    {track.year || ""}
                                </div>
                            )}
                            <div style={{ width: 30, textAlign: "center", fontSize: "0.75rem" }} title={track.source}>
                                {SOURCE_ICONS[track.source] ?? "?"}
                            </div>
                            {!compact && (
                                <div style={{ width: 60, display: "flex", gap: 2, overflow: "hidden" }}>
                                    {track.tags.slice(0, 2).map((tagId) => {
                                        const tag = tagMap.get(tagId);
                                        if (!tag) return null;
                                        const varBase = `--tag-${sanitizeVar(tagId)}`;
                                        return (
                                            <span
                                                key={tagId}
                                                style={{
                                                    fontSize: "0.6rem",
                                                    padding: "1px 5px",
                                                    borderRadius: 8,
                                                    background: `var(${varBase}-bg, ${tag.color}22)`,
                                                    color: `var(${varBase}, ${tag.color})`,
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {tag.name}
                                            </span>
                                        );
                                    })}
                                    {track.tags.length > 2 && (
                                        <span style={{ fontSize: "0.6rem", opacity: 0.4 }}>+{track.tags.length - 2}</span>
                                    )}
                                </div>
                            )}
                            <div style={{ width: 24, display: "flex", alignItems: "center" }}>
                                <button
                                    style={{
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        fontSize: "0.75rem",
                                        padding: 2,
                                        opacity: 0.5,
                                        position: "relative",
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowTagMenu(showTagMenu === track.id ? null : track.id);
                                    }}
                                    title={t("playlistManager.morActions")}
                                >
                                    ⋮
                                </button>
                                {showTagMenu === track.id && tags.length > 0 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            right: 12,
                                            marginTop: 4,
                                            background: "var(--card-bg, #fff)",
                                            border: "1px solid var(--border-color, #e5e7eb)",
                                            borderRadius: 8,
                                            padding: 8,
                                            zIndex: 100,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                            minWidth: 140,
                                        }}
                                    >
                                        <div style={{ fontSize: "0.7rem", fontWeight: 600, marginBottom: 4, opacity: 0.6 }}>
                                            {t("playlistManager.assignTag")}
                                        </div>
                                        {tags.map((tag) => {
                                            const hasTag = track.tags.includes(tag.id);
                                            return (
                                                <div
                                                    key={tag.id}
                                                    style={{
                                                            padding: "4px 8px",
                                                            borderRadius: 4,
                                                            cursor: "pointer",
                                                            fontSize: "0.78rem",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: 6,
                                                            background: hasTag ? `var(--tag-${sanitizeVar(tag.id)}-bg, ${tag.color}22)` : "transparent",
                                                        }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const ids = selectedTrackIds.size > 0 ? Array.from(selectedTrackIds) : [track.id];
                                                        if (hasTag) {
                                                            // untag — would need onUntagTracks
                                                        } else {
                                                            onTagTracks?.(ids, [tag.id]);
                                                        }
                                                        setShowTagMenu(null);
                                                    }}
                                                >
                                                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: `var(--tag-${sanitizeVar(tag.id)}, ${tag.color})`, flexShrink: 0 }} />
                                                    <span>{tag.name}</span>
                                                    {hasTag && <span style={{ marginLeft: "auto" }}>✓</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer stats */}
            <div
                style={{
                    padding: "6px 12px",
                    borderTop: "1px solid var(--border-color, #e5e7eb)",
                    fontSize: "0.72rem",
                    opacity: 0.5,
                    display: "flex",
                    gap: 16,
                }}
            >
                <span>{filtered.length} {t("playlistManager.tracks")}</span>
                <span>
                    {formatDuration(filtered.reduce((acc, t) => acc + (t.duration ?? 0), 0))}
                </span>
                {selectedTrackIds.size > 0 && (
                    <span>{selectedTrackIds.size} {t("playlistManager.selected")}</span>
                )}
            </div>
        </div>
    );
};

export default PlaylistTrackList;
