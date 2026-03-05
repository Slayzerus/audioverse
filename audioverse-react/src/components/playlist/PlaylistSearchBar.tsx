// PlaylistSearchBar.tsx — Multi-source unified search across Library, Spotify, Tidal, YouTube, MusicBrainz
import React, { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { TrackSource } from "../../models/modelsPlaylistManager";

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

export interface SearchResult {
    id: string;
    title: string;
    artist: string;
    album?: string;
    duration?: number;
    source: TrackSource;
    externalId?: string;
    imageUrl?: string;
}

export interface PlaylistSearchBarProps {
    onSearch: (query: string, sources: TrackSource[]) => void;
    results: SearchResult[];
    isSearching: boolean;
    onAddToPlaylist: (results: SearchResult[]) => void;
    onPlayPreview?: (result: SearchResult) => void;
}

// ══════════════════════════════════════════════════════════════
// Source definitions
// ══════════════════════════════════════════════════════════════

const SOURCES: { value: TrackSource; label: string; icon: string; hex: string; css: string; cssBg: string }[] = [
    { value: TrackSource.Library, label: "Library", icon: "💿", hex: "#6366f1", css: "var(--source-library, #6366f1)", cssBg: "var(--source-library-bg, #6366f118)" },
    { value: TrackSource.Spotify, label: "Spotify", icon: "🟢", hex: "#1db954", css: "var(--source-spotify, #1db954)", cssBg: "var(--source-spotify-bg, #1db95418)" },
    { value: TrackSource.Tidal, label: "Tidal", icon: "⬛", hex: "#000000", css: "var(--source-tidal, #000000)", cssBg: "var(--source-tidal-bg, #00000018)" },
    { value: TrackSource.YouTube, label: "YouTube", icon: "🔴", hex: "#ff0000", css: "var(--source-youtube, #ff0000)", cssBg: "var(--source-youtube-bg, #ff000018)" },
    { value: TrackSource.MusicBrainz, label: "MusicBrainz", icon: "🎼", hex: "#ba478f", css: "var(--source-musicbrainz, #ba478f)", cssBg: "var(--source-musicbrainz-bg, #ba478f18)" },
];

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const PlaylistSearchBar: React.FC<PlaylistSearchBarProps> = ({
    onSearch,
    results,
    isSearching,
    onAddToPlaylist,
    onPlayPreview,
}) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const [activeSources, setActiveSources] = useState<Set<TrackSource>>(
        new Set([TrackSource.Library, TrackSource.Spotify, TrackSource.Tidal, TrackSource.YouTube]),
    );
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toggleSource = useCallback((src: TrackSource) => {
        setActiveSources((prev) => {
            const next = new Set(prev);
            if (next.has(src)) next.delete(src);
            else next.add(src);
            return next;
        });
    }, []);

    const handleInput = useCallback(
        (value: string) => {
            setQuery(value);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            if (value.trim().length >= 2) {
                debounceRef.current = setTimeout(() => {
                    onSearch(value.trim(), Array.from(activeSources));
                }, 350);
            }
        },
        [activeSources, onSearch],
    );

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (query.trim().length >= 2) {
                onSearch(query.trim(), Array.from(activeSources));
            }
        },
        [query, activeSources, onSearch],
    );

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const selectAll = useCallback(() => {
        if (selectedIds.size === results.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(results.map((r) => r.id)));
        }
    }, [selectedIds, results]);

    const handleAddSelected = useCallback(() => {
        const sel = results.filter((r) => selectedIds.has(r.id));
        if (sel.length > 0) {
            onAddToPlaylist(sel);
            setSelectedIds(new Set());
        }
    }, [results, selectedIds, onAddToPlaylist]);

    const formatDuration = (sec?: number) => {
        if (!sec) return "--:--";
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const sourceIcon = (src: TrackSource) => {
        const s = SOURCES.find((s) => s.value === src);
        return s ? s.icon : "?";
    };

    return (
        <div
            style={{
                border: "1px solid var(--border-color, #e5e7eb)",
                borderRadius: 10,
                background: "var(--card-bg, #fff)",
                overflow: "hidden",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 12px",
                    gap: 8,
                    cursor: "pointer",
                    background: "var(--surface-bg, #f9fafb)",
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <span style={{ fontSize: "1rem" }}>🔍</span>
                <span style={{ fontWeight: 600, fontSize: "0.85rem" }}>{t("playlistManager.search")}</span>
                <span style={{ marginLeft: "auto", fontSize: "0.75rem", opacity: 0.5 }}>{expanded ? "▲" : "▼"}</span>
            </div>

            {expanded && (
                <div style={{ padding: "0 12px 12px" }}>
                    {/* Source toggles */}
                    <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                        {SOURCES.map((src) => {
                            const active = activeSources.has(src.value);
                            return (
                                <button
                                    key={src.value}
                                    onClick={() => toggleSource(src.value)}
                                        style={{
                                        padding: "4px 10px",
                                        borderRadius: 20,
                                        border: active ? `2px solid ${src.css}` : "1px solid var(--border-color, #d1d5db)",
                                        background: active ? src.cssBg : "transparent",
                                        color: active ? src.css : "var(--text-secondary, #6b7280)",
                                        fontSize: "0.72rem",
                                        cursor: "pointer",
                                        fontWeight: active ? 600 : 400,
                                        transition: "all 0.15s",
                                    }}
                                >
                                    {src.icon} {src.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Search input */}
                    <form onSubmit={handleSubmit} style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => handleInput(e.target.value)}
                            placeholder={t("playlistManager.searchPlaceholder")}
                            style={{
                                flex: 1,
                                padding: "6px 12px",
                                borderRadius: 8,
                                border: "1px solid var(--border-color, #d1d5db)",
                                background: "var(--input-bg, #fff)",
                                color: "var(--text-primary, #1f2937)",
                                fontSize: "0.82rem",
                            }}
                        />
                        <button
                            type="submit"
                            disabled={query.trim().length < 2 || isSearching}
                            style={{
                                padding: "6px 14px",
                                borderRadius: 8,
                                border: "none",
                                background: "var(--accent, #3b82f6)",
                                color: "var(--btn-text, #fff)",
                                fontSize: "0.82rem",
                                cursor: "pointer",
                                opacity: query.trim().length < 2 ? 0.5 : 1,
                            }}
                        >
                            {isSearching ? "⏳" : "🔍"}
                        </button>
                    </form>

                    {/* Results */}
                    {results.length > 0 && (
                        <div>
                            {/* Bulk actions */}
                            <div style={{ display: "flex", gap: 6, marginBottom: 4, alignItems: "center" }}>
                                <label style={{ fontSize: "0.72rem", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === results.length && results.length > 0}
                                        onChange={selectAll}
                                    />
                                    {t("playlistManager.selectAll")}
                                </label>
                                <span style={{ fontSize: "0.72rem", opacity: 0.5 }}>
                                    {results.length} {t("playlistManager.results")}
                                </span>
                                <div style={{ flex: 1 }} />
                                {selectedIds.size > 0 && (
                                    <button
                                        onClick={handleAddSelected}
                                        style={{
                                            padding: "3px 10px",
                                            borderRadius: 6,
                                            border: "none",
                                            background: "var(--accent, #3b82f6)",
                                            color: "var(--btn-text, #fff)",
                                            fontSize: "0.72rem",
                                            cursor: "pointer",
                                        }}
                                    >
                                        ➕ {t("playlistManager.addSelected")} ({selectedIds.size})
                                    </button>
                                )}
                            </div>

                            {/* Result rows */}
                            <div style={{ maxHeight: 300, overflowY: "auto", borderRadius: 6, border: "1px solid var(--border-color, #e5e7eb)" }}>
                                {results.map((r) => (
                                    <div
                                        key={r.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 8,
                                            padding: "6px 10px",
                                            borderBottom: "1px solid var(--border-color, #f3f4f6)",
                                            background: selectedIds.has(r.id) ? "var(--accent-bg, #eff6ff)" : "transparent",
                                            cursor: "pointer",
                                            fontSize: "0.78rem",
                                        }}
                                        onClick={() => toggleSelect(r.id)}
                                    >
                                        <input type="checkbox" checked={selectedIds.has(r.id)} readOnly />
                                        <span>{sourceIcon(r.source)}</span>
                                        {r.imageUrl && (
                                            <img
                                                src={r.imageUrl}
                                                alt={r.title || t('common.coverArt', 'Cover art')}
                                                style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }}
                                            />
                                        )}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {r.title}
                                            </div>
                                            <div style={{ fontSize: "0.7rem", opacity: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {r.artist}
                                                {r.album ? ` — ${r.album}` : ""}
                                            </div>
                                        </div>
                                        <span style={{ opacity: 0.5, fontSize: "0.7rem", flexShrink: 0 }}>{formatDuration(r.duration)}</span>
                                        {onPlayPreview && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onPlayPreview(r);
                                                }}
                                                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                                                title={t("playlistManager.preview")}
                                            >
                                                ▶
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isSearching && (
                        <div style={{ textAlign: "center", padding: 20, opacity: 0.5, fontSize: "0.82rem" }}>
                            ⏳ {t("playlistManager.searching")}...
                        </div>
                    )}

                    {!isSearching && query.trim().length >= 2 && results.length === 0 && (
                        <div style={{ textAlign: "center", padding: 20, opacity: 0.4, fontSize: "0.82rem" }}>
                            {t("playlistManager.noResults")}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PlaylistSearchBar;
