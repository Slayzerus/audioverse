/**
 * KaraokeSongBrowser — clean song list with filters, sorting, multiselect.
 *
 * Designed for easy gamepad / arrow-key navigation via the Focusable wrapper.
 * No player or mic settings live here — those are in KaraokeSessionJoin.
 *
 * Props:
 *   onSelect(songs)  — called when the user confirms selection
 *   multiSelect       — enable checkbox multiselect (default false)
 *   onPlay(songId)    — quick-play single song (optional)
 *   maxSelections     — cap for multiselect (0 = unlimited)
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
    fetchFilteredSongs,
    fetchTopSingings,
    fetchPlaylistById,
    fetchMyPlaylists,
    addSongToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
    KARAOKE_QK,
} from "../../../scripts/api/apiKaraoke";
import type { TopSinging } from "../../../scripts/api/apiKaraoke";
import type { KaraokePlaylist, KaraokeSong, SongFilterRequest } from "../../../models/modelsKaraoke";
import { searchAndGetCover } from "../../../services/coverArtService";
import { API_ROOT } from "../../../config/apiConfig";
import { Focusable } from "../../common/Focusable";
import { CarouselNav, type CarouselItem, type CarouselLevel } from "../../common/CarouselNav";
import { useToast } from "../../ui/ToastProvider";
import { parseVideoMetadata, getCoverUrl } from "../../../utils/karaokeMetadata";
import SongBrowserSidebar, { type BrowserNode } from "./SongBrowserSidebar";
import SongRow from "./SongRow";
import { useTranslation } from "react-i18next";

import "bootstrap/dist/css/bootstrap.min.css";

// ── Sort options ──

type SortField = "title" | "artist" | "year" | "genre" | "linkedArtist";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { label: string; field: SortField }[] = [
    { label: "karaoke.sortTitle", field: "title" },
    { label: "karaoke.sortArtist", field: "artist" },
    { label: "karaoke.sortYear", field: "year" },
    { label: "karaoke.sortGenre", field: "genre" },
    { label: "karaoke.sortLinkedArtist", field: "linkedArtist" },
];

// ── Props ──

export interface SongBrowserSelection {
    songs: KaraokeSong[];
}

interface Props {
    /** Emitted when the user confirms multiselect (button click) */
    onSelect?: (selection: SongBrowserSelection) => void;
    /** Emitted on single song play click */
    onPlay?: (songId: number) => void;
    /** Enable checkbox-based multiselect */
    multiSelect?: boolean;
    /** Maximum number of songs (0 = unlimited) */
    maxSelections?: number;
    /** If true, hides the sidebar (useful when embedded) */
    hideSidebar?: boolean;
    /** Disable play buttons (e.g. no mics) */
    disabled?: boolean;
    /** Optional message shown when disabled */
    disabledReason?: string;
}

const NO_COVER_SVG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%23999' font-size='12'%3ENo Cover%3C/text%3E%3C/svg%3E";

const KaraokeSongBrowser: React.FC<Props> = ({
    onSelect,
    onPlay,
    multiSelect = false,
    maxSelections = 0,
    hideSidebar = false,
    disabled = false,
    disabledReason,
}) => {
    const { showToast } = useToast();
    const { t } = useTranslation();

    // ── Filter state ──
    const [search, setSearch] = useState("");
    const [filterGenre, setFilterGenre] = useState("");
    const [filterLanguage, setFilterLanguage] = useState("");
    const [filterYear, setFilterYear] = useState<number | undefined>();
    const [filterSource, setFilterSource] = useState("");
    const [filterHasLinked, setFilterHasLinked] = useState<string>("");
    const [filterDurationFrom, setFilterDurationFrom] = useState<string>("");
    const [filterDurationTo, setFilterDurationTo] = useState<string>("");
    const [showFilters, setShowFilters] = useState(false);

    // ── Sort state ──
    const [sortField, setSortField] = useState<SortField>("artist");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // ── Sidebar ──
    const [activeNode, setActiveNode] = useState<BrowserNode>({ type: "all" });

    // ── Multiselect ──
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // ── Cover cache ──
    const [coverCache, setCoverCache] = useState<Record<number, string>>({});
    const [topScores, setTopScores] = useState<Record<number, TopSinging | null>>({});

    // ── Loading state ──
    const [loadingPlayId, setLoadingPlayId] = useState<number | null>(null);

    // ── Debounced search ──
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    // ── API filters (sent to backend via POST) ──
    const apiFilters = useMemo((): SongFilterRequest => {
        const q = debouncedSearch.trim() || undefined;
        return {
            searchQuery: q,
            genres: filterGenre ? [filterGenre] : undefined,
            languages: filterLanguage ? [filterLanguage] : undefined,
            years: filterYear ? [filterYear] : undefined,
            externalSource: filterSource || undefined,
            hasLinkedSong: filterHasLinked === "true" ? true : filterHasLinked === "false" ? false : undefined,
            durationFromSec: filterDurationFrom ? Number(filterDurationFrom) * 60 : undefined,
            durationToSec: filterDurationTo ? Number(filterDurationTo) * 60 : undefined,
            includeLinkedSongDetails: true,
            sortBy: sortField === "linkedArtist" ? "LinkedArtist" : sortField.charAt(0).toUpperCase() + sortField.slice(1),
            sortDir: sortDir,
            pageSize: 200,
        };
    }, [debouncedSearch, filterGenre, filterLanguage, filterYear, filterSource, filterHasLinked, filterDurationFrom, filterDurationTo, sortField, sortDir]);

    const { data: filteredResult, isLoading, error } = useQuery({
        queryKey: ["songs", "filtered", apiFilters],
        queryFn: () => fetchFilteredSongs(apiFilters),
    });
    const songs: KaraokeSong[] = useMemo(() => {
        if (!filteredResult) return [];
        // fetchFilteredSongs returns PagedResult<KaraokeSongFile>, map to KaraokeSong[]
            const result = filteredResult as unknown as { Items?: Record<string, unknown>[]; items?: Record<string, unknown>[] };
            const rawItems = result.Items ?? result.items ?? [];
            // Normalize year to number and ensure shape matches KaraokeSong
            const items = rawItems.map(it => ({ ...it, year: it.year ? Number(it.year) : undefined })) as KaraokeSong[];
            return items;
    }, [filteredResult]);

    // ── Playlist songs query ──
    const playlistId =
        activeNode.type === "myPlaylist" || activeNode.type === "onlinePlaylist"
            ? activeNode.id
            : 0;
    const { data: playlistData } = useQuery({
        queryKey: KARAOKE_QK.playlist(playlistId),
        queryFn: () => fetchPlaylistById(playlistId),
        enabled: playlistId > 0,
    });

    const displaySongsRaw = useMemo(() => {
        if (activeNode.type === "myPlaylist" || activeNode.type === "onlinePlaylist") {
            return (
                (playlistData?.playlistSongs?.map((ps) => ps.song).filter(Boolean) ?? []) as unknown as KaraokeSong[]
            );
        }
        return songs;
    }, [activeNode, songs, playlistData]);

    const isViewingMyPlaylist = activeNode.type === "myPlaylist";

    // ── Client-side sort ──
    // When viewing a user's own playlist, allow custom reorder via customSongOrder state.
    // customSongOrder holds the song IDs in the user's desired order (null = server default).
    const [customSongOrder, setCustomSongOrder] = useState<number[] | null>(null);

    // Reset custom order when switching playlists
    useEffect(() => { setCustomSongOrder(null); }, [playlistId]);

    const displaySongs: KaraokeSong[] = useMemo(() => {
        const list = [...displaySongsRaw];
        if (customSongOrder && isViewingMyPlaylist) {
            // Sort by custom order
            const orderMap = new Map(customSongOrder.map((id, i) => [id, i]));
            list.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
        } else {
            list.sort((a, b) => {
                let va: string | number = "";
                let vb: string | number = "";
                switch (sortField) {
                    case "title":
                        va = a.title ?? ""; vb = b.title ?? ""; break;
                    case "artist":
                        va = a.artist ?? ""; vb = b.artist ?? ""; break;
                    case "year":
                        va = a.year ?? 0; vb = b.year ?? 0; break;
                    case "genre":
                        va = a.genre ?? ""; vb = b.genre ?? ""; break;
                    case "linkedArtist":
                        va = a.linkedSong?.artistName ?? a.artist ?? ""; vb = b.linkedSong?.artistName ?? b.artist ?? ""; break;
                    default:
                        va = ((a as unknown as Record<string, unknown>)[sortField] ?? "") as string | number; vb = ((b as unknown as Record<string, unknown>)[sortField] ?? "") as string | number; break;
                }
                if (typeof va === "string") va = va.toLowerCase();
                if (typeof vb === "string") vb = vb.toLowerCase();
                if (va < vb) return sortDir === "asc" ? -1 : 1;
                if (va > vb) return sortDir === "asc" ? 1 : -1;
                return 0;
            });
        }
        return list;
    }, [displaySongsRaw, sortField, sortDir, customSongOrder, isViewingMyPlaylist]);

    // ── Playlist mutations ──
    const queryClient = useQueryClient();
    const { data: myPlaylists = [] } = useQuery({
        queryKey: KARAOKE_QK.myPlaylists,
        queryFn: fetchMyPlaylists,
        staleTime: 60_000,
    });

    const addToPlaylistMut = useMutation({
        mutationFn: ({ plId, songId }: { plId: number; songId: number }) =>
            addSongToPlaylist(plId, songId),
        onSuccess: (_d, vars) => {
            queryClient.invalidateQueries({ queryKey: KARAOKE_QK.playlist(vars.plId) });
            showToast(t('karaoke.addedToPlaylist'), "success");
        },
        onError: () => showToast(t('karaoke.addToPlaylistFailed'), "error"),
    });

    const removeFromPlaylistMut = useMutation({
        mutationFn: ({ plId, songId }: { plId: number; songId: number }) =>
            removeSongFromPlaylist(plId, songId),
        onSuccess: (_d, vars) => {
            queryClient.invalidateQueries({ queryKey: KARAOKE_QK.playlist(vars.plId) });
            showToast(t('karaoke.removedFromPlaylist'), "success");
        },
        onError: () => showToast(t('karaoke.removeFromPlaylistFailed'), "error"),
    });

    const [addMenuSongId, setAddMenuSongId] = useState<number | null>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!addMenuSongId) return;
        const handler = (e: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node))
                setAddMenuSongId(null);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [addMenuSongId]);

    // ── Cover helpers ──
    const resolve = useCallback(
        (url: string) => (url.startsWith("/api/") ? `${API_ROOT}${url}` : url),
        [],
    );

    const getSongCover = useCallback(
        (song: KaraokeSong): string => {
            // Priority 1: linked song album cover (highest quality from catalog)
            if (song.linkedSong?.albumCoverUrl) {
                return song.linkedSong.albumCoverUrl;
            }
            // Priority 2: linked song external cover
            if (song.linkedSong?.externalCoverUrl) {
                return song.linkedSong.externalCoverUrl;
            }
            // Priority 3: song-level external cover (from import)
            if (song.externalCoverUrl) {
                return song.externalCoverUrl;
            }
            if (song.coverPath) {
                return song.coverPath.startsWith("http")
                    ? song.coverPath
                    : resolve(
                          `/api/karaoke/cover?filePath=${encodeURIComponent(song.coverPath)}`,
                      );
            }
            if (song.youtubeId || song.coverImage || song.backgroundImage) {
                return resolve(
                    getCoverUrl({
                        youtubeId: song.youtubeId,
                        coverImage: song.coverImage,
                        backgroundImage: song.backgroundImage,
                    }),
                );
            }
            if (song.videoPath) {
                const metadata = parseVideoMetadata(song.videoPath);
                if (metadata.youtubeId || metadata.coverImage) {
                    return resolve(getCoverUrl(metadata));
                }
            }
            if (coverCache[song.id]) return coverCache[song.id];
            if (song.filePath) {
                return resolve(
                    `/api/karaoke/cover?filePath=${encodeURIComponent(song.filePath)}`,
                );
            }
            return NO_COVER_SVG;
        },
        [coverCache, resolve],
    );

    // Async MusicBrainz cover lookup
    useEffect(() => {
        let cancelled = false;
        const toSearch: { id: number; artist: string; title: string }[] = [];
        for (const song of songs) {
            if (
                song.coverPath ||
                song.coverImage ||
                song.youtubeId ||
                song.filePath
            )
                continue;
            if (song.videoPath) {
                const meta = parseVideoMetadata(song.videoPath);
                if (meta.youtubeId || meta.coverImage) continue;
            }
            if (coverCache[song.id]) continue;
            if (song.artist && song.title) {
                toSearch.push({ id: song.id, artist: song.artist, title: song.title });
            }
        }
        if (toSearch.length === 0) return;
        (async () => {
            for (const { id, artist, title } of toSearch) {
                if (cancelled) return;
                try {
                    const url = await searchAndGetCover(artist, title);
                    if (cancelled) return;
                    setCoverCache((m) => ({ ...m, [id]: url || NO_COVER_SVG }));
                } catch {
                    if (cancelled) return;
                    setCoverCache((m) => ({ ...m, [id]: NO_COVER_SVG }));
                }
                await new Promise((r) => setTimeout(r, 1100));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [songs, coverCache]);

    // Top scores
    useEffect(() => {
        let cancelled = false;
        const toFetch = songs.filter(
            (s) => s.id && topScores[s.id] === undefined,
        );
        if (toFetch.length === 0) return;
        (async () => {
            for (const song of toFetch) {
                if (cancelled) return;
                try {
                    const results = await fetchTopSingings(song.id);
                    if (cancelled) return;
                    setTopScores((prev) => ({
                        ...prev,
                        [song.id]: results.length > 0 ? results[0] : null,
                    }));
                } catch {
                    if (cancelled) return;
                    setTopScores((prev) => ({ ...prev, [song.id]: null }));
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [songs]);

    // ── Selection logic ──
    const toggleSelect = useCallback(
        (songId: number) => {
            setSelectedIds((prev) => {
                const next = new Set(prev);
                if (next.has(songId)) {
                    next.delete(songId);
                } else {
                    if (maxSelections > 0 && next.size >= maxSelections) {
                        showToast(
                            t('karaoke.maxSongs', { count: maxSelections }),
                            "info",
                        );
                        return prev;
                    }
                    next.add(songId);
                }
                return next;
            });
        },
        [maxSelections, showToast],
    );

    const confirmSelection = useCallback(() => {
        const selected = displaySongs.filter((s) => selectedIds.has(s.id));
        onSelect?.({ songs: selected });
    }, [displaySongs, selectedIds, onSelect]);

    const handlePlayClick = useCallback(
        async (songId: number) => {
            if (disabled) {
                if (disabledReason) showToast(disabledReason, "info");
                return;
            }
            setLoadingPlayId(songId);
            try {
                onPlay?.(songId);
            } finally {
                setLoadingPlayId(null);
            }
        },
        [disabled, disabledReason, onPlay, showToast],
    );

    // ── Unique values for filter dropdowns ──
    const genres = useMemo(() => {
        const set = new Set<string>();
        for (const s of songs) if (s.genre) set.add(s.genre);
        return Array.from(set).sort();
    }, [songs]);

    const languages = useMemo(() => {
        const set = new Set<string>();
        for (const s of songs) if (s.language) set.add(s.language);
        return Array.from(set).sort();
    }, [songs]);

    const years = useMemo(() => {
        const set = new Set<number>();
        for (const s of songs) if (s.year) set.add(Number(s.year));
        return Array.from(set).sort((a, b) => b - a);
    }, [songs]);

    // ── Handle sort click ──
    const handleSort = useCallback(
        (field: SortField) => {
            if (sortField === field) {
                setSortDir((d) => (d === "asc" ? "desc" : "asc"));
            } else {
                setSortField(field);
                setSortDir("asc");
            }
        },
        [sortField],
    );

    // ── Carousel filter levels (gamepad-friendly alternative to dropdowns) ──
    const [carouselCategory, setCarouselCategory] = useState<string | null>(null);

    const carouselLevels = useMemo((): CarouselLevel[] => {
        const rootItems: CarouselItem[] = [
            { id: "all", label: t('karaoke.genreAll', 'All'), icon: "🎵", color: "#42a5f5" },
            { id: "genre", label: t('karaoke.genre', 'Genre'), icon: "🎸", color: "#e040fb" },
            { id: "year", label: t('karaoke.year', 'Year'), icon: "📅", color: "#ffa726" },
            { id: "language", label: t('karaoke.language', 'Language'), icon: "🌍", color: "#66bb6a" },
        ];
        const result: CarouselLevel[] = [{ title: t('karaoke.browseBy', 'Browse by'), items: rootItems }];

        if (carouselCategory === "genre" && genres.length > 0) {
            result.push({
                title: t('karaoke.genre', 'Genre'),
                items: genres.map(g => ({ id: `g-${g}`, label: g, icon: "🎸", color: "#e040fb", data: g })),
            });
        } else if (carouselCategory === "year" && years.length > 0) {
            result.push({
                title: t('karaoke.year', 'Year'),
                items: years.map(y => ({ id: `y-${y}`, label: String(y), icon: "📅", color: "#ffa726", data: y })),
            });
        } else if (carouselCategory === "language" && languages.length > 0) {
            result.push({
                title: t('karaoke.language', 'Language'),
                items: languages.map(l => ({ id: `l-${l}`, label: l, icon: "🌍", color: "#66bb6a", data: l })),
            });
        }

        return result;
    }, [t, genres, years, languages, carouselCategory]);

    const handleCarouselSelect = useCallback((item: CarouselItem, levelIndex: number) => {
        if (levelIndex === 0) {
            // Root level: select category or "all"
            if (item.id === "all") {
                setCarouselCategory(null);
                setFilterGenre(""); setFilterLanguage(""); setFilterYear(undefined);
            } else {
                setCarouselCategory(item.id);
            }
        } else {
            // Sub-level: apply filter
            if (carouselCategory === "genre") { setFilterGenre(item.data as string); }
            else if (carouselCategory === "year") { setFilterYear(item.data as number); }
            else if (carouselCategory === "language") { setFilterLanguage(item.data as string); }
        }
    }, [carouselCategory]);

    // ── Playlist mutation callbacks (stable for SongRow) ──
    const handleRemoveFromPlaylist = useCallback(
        (plId: number, songId: number) => removeFromPlaylistMut.mutate({ plId, songId }),
        [removeFromPlaylistMut],
    );

    const handleAddToPlaylist = useCallback(
        (plId: number, songId: number) => addToPlaylistMut.mutate({ plId, songId }),
        [addToPlaylistMut],
    );

    const handleToggleAddMenu = useCallback(
        (songId: number | null) => setAddMenuSongId(songId),
        [],
    );

    // ── Reorder callbacks ──
    const handleMoveUp = useCallback(
        (songId: number) => {
            const ids = customSongOrder ?? displaySongs.map(s => s.id);
            const idx = ids.indexOf(songId);
            if (idx <= 0) return;
            const next = [...ids];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            setCustomSongOrder(next);
            if (playlistId > 0) reorderPlaylistSongs(playlistId, next).catch(() => { /* backend not ready yet */ });
        },
        [customSongOrder, displaySongs, playlistId],
    );
    const handleMoveDown = useCallback(
        (songId: number) => {
            const ids = customSongOrder ?? displaySongs.map(s => s.id);
            const idx = ids.indexOf(songId);
            if (idx < 0 || idx >= ids.length - 1) return;
            const next = [...ids];
            [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
            setCustomSongOrder(next);
            if (playlistId > 0) reorderPlaylistSongs(playlistId, next).catch(() => { /* backend not ready yet */ });
        },
        [customSongOrder, displaySongs, playlistId],
    );

    // ── Keyboard handler for list items ──
    const handleRowKeyDown = useCallback(
        (e: React.KeyboardEvent, songId: number) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (multiSelect) {
                    toggleSelect(songId);
                } else {
                    handlePlayClick(songId);
                }
            }
        },
        [multiSelect, toggleSelect, handlePlayClick],
    );

    return (
        <div style={{ display: "flex", gap: 0, minHeight: 400 }}>
            {/* Sidebar */}
            {!hideSidebar && (
                <SongBrowserSidebar activeNode={activeNode} onSelect={setActiveNode} />
            )}

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0, paddingLeft: hideSidebar ? 0 : 16 }}>
                {/* ── Search + sort bar ── */}
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                        marginBottom: 12,
                    }}
                >
                    {/* Search input */}
                    <Focusable id="song-search">
                        <input
                            type="text"
                            className="form-control"
                            placeholder={t('karaoke.searchPlaceholder')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                flex: "1 1 200px",
                                minWidth: 180,
                                background: "var(--bg-secondary, #1a1a2e)",
                                color: "var(--text-primary, #eee)",
                                border: "1px solid var(--border-primary, #333)",
                                borderRadius: 8,
                            }}
                        />
                    </Focusable>

                    {/* Sort buttons */}
                    {SORT_OPTIONS.map((opt) => (
                        <Focusable key={opt.field} id={`sort-${opt.field}`}>
                            <button
                                className={`btn btn-sm ${sortField === opt.field ? "btn-outline-warning" : "btn-outline-secondary"}`}
                                onClick={() => handleSort(opt.field)}
                                style={{ whiteSpace: "nowrap", fontSize: 13 }}
                            >
                                {t(opt.label)}{" "}
                                {sortField === opt.field
                                    ? sortDir === "asc"
                                        ? "▲"
                                        : "▼"
                                    : ""}
                            </button>
                        </Focusable>
                    ))}

                    {/* Filters toggle */}
                    <Focusable id="song-filters-toggle">
                        <button
                            className="btn btn-sm btn-outline-info"
                            onClick={() => setShowFilters((f) => !f)}
                            style={{ fontSize: 13 }}
                        >
                            {showFilters ? t('common.hideFilters') : t('common.showFilters')}
                        </button>
                    </Focusable>

                    {/* Multiselect confirm */}
                    {multiSelect && selectedIds.size > 0 && (
                        <Focusable id="song-confirm-selection">
                            <button
                                className="btn btn-sm btn-success"
                                onClick={confirmSelection}
                                style={{ fontWeight: 700 }}
                            >
                                {t('karaoke.confirmSelection', { count: selectedIds.size })}
                            </button>
                        </Focusable>
                    )}
                </div>

                {/* ── Carousel filter strip (gamepad-friendly) ── */}
                <CarouselNav
                    levels={carouselLevels}
                    onSelect={handleCarouselSelect}
                    idPrefix="song-carousel-"
                    visibleCount={6}
                    cardHeight={72}
                    hierarchical={false}
                    style={{ marginBottom: 12 }}
                />

                {/* ── Expanded filters ── */}
                {showFilters && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                            gap: 8,
                            marginBottom: 16,
                            padding: 12,
                            background: "var(--bg-secondary, #1a1a2e)",
                            borderRadius: 8,
                        }}
                    >
                        <Focusable id="filter-genre">
                            <select
                                className="form-select form-select-sm"
                                value={filterGenre}
                                onChange={(e) => setFilterGenre(e.target.value)}
                                style={{
                                    background: "var(--bg-primary, #222)",
                                    color: "var(--text-primary, #eee)",
                                    border: "1px solid var(--border-primary, #555)",
                                }}
                            >
                                <option value="">{t('karaoke.genreAll')}</option>
                                {genres.map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </Focusable>
                        <Focusable id="filter-language">
                            <select
                                className="form-select form-select-sm"
                                value={filterLanguage}
                                onChange={(e) => setFilterLanguage(e.target.value)}
                                style={{
                                    background: "var(--bg-primary, #222)",
                                    color: "var(--text-primary, #eee)",
                                    border: "1px solid var(--border-primary, #555)",
                                }}
                            >
                                <option value="">{t('karaoke.languageAll')}</option>
                                {languages.map((l) => (
                                    <option key={l} value={l}>
                                        {l}
                                    </option>
                                ))}
                            </select>
                        </Focusable>
                        <Focusable id="filter-year">
                            <select
                                className="form-select form-select-sm"
                                value={filterYear ?? ""}
                                onChange={(e) =>
                                    setFilterYear(
                                        e.target.value ? Number(e.target.value) : undefined,
                                    )
                                }
                                style={{
                                    background: "var(--bg-primary, #222)",
                                    color: "var(--text-primary, #eee)",
                                    border: "1px solid var(--border-primary, #555)",
                                }}
                            >
                                <option value="">{t('karaoke.yearAll')}</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </Focusable>
                        <Focusable id="filter-source">
                            <select
                                className="form-select form-select-sm"
                                value={filterSource}
                                onChange={(e) => setFilterSource(e.target.value)}
                                style={{
                                    background: "var(--bg-primary, #222)",
                                    color: "var(--text-primary, #eee)",
                                    border: "1px solid var(--border-primary, #555)",
                                }}
                            >
                                <option value="">{t('karaoke.sourceAll', 'All sources')}</option>
                                <option value="Spotify">🎵 Spotify</option>
                                <option value="YouTube">▶️ YouTube</option>
                            </select>
                        </Focusable>
                        <Focusable id="filter-linked">
                            <select
                                className="form-select form-select-sm"
                                value={filterHasLinked}
                                onChange={(e) => setFilterHasLinked(e.target.value)}
                                style={{
                                    background: "var(--bg-primary, #222)",
                                    color: "var(--text-primary, #eee)",
                                    border: "1px solid var(--border-primary, #555)",
                                }}
                            >
                                <option value="">{t('karaoke.linkedAll', 'All songs')}</option>
                                <option value="true">{t('karaoke.linkedOnly', 'With metadata')}</option>
                                <option value="false">{t('karaoke.unlinkedOnly', 'Without metadata')}</option>
                            </select>
                        </Focusable>
                        <Focusable id="filter-duration">
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder={t('karaoke.durationFromMin', 'Min (min)')}
                                    value={filterDurationFrom}
                                    onChange={(e) => setFilterDurationFrom(e.target.value)}
                                    min={0}
                                    max={30}
                                    style={{
                                        width: 70,
                                        background: "var(--bg-primary, #222)",
                                        color: "var(--text-primary, #eee)",
                                        border: "1px solid var(--border-primary, #555)",
                                    }}
                                />
                                <span style={{ opacity: 0.5 }}>–</span>
                                <input
                                    type="number"
                                    className="form-control form-control-sm"
                                    placeholder={t('karaoke.durationToMin', 'Max (min)')}
                                    value={filterDurationTo}
                                    onChange={(e) => setFilterDurationTo(e.target.value)}
                                    min={0}
                                    max={30}
                                    style={{
                                        width: 70,
                                        background: "var(--bg-primary, #222)",
                                        color: "var(--text-primary, #eee)",
                                        border: "1px solid var(--border-primary, #555)",
                                    }}
                                />
                            </div>
                        </Focusable>
                        <Focusable id="filter-clear">
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => {
                                    setSearch("");
                                    setFilterGenre("");
                                    setFilterLanguage("");
                                    setFilterYear(undefined);
                                    setFilterSource("");
                                    setFilterHasLinked("");
                                    setFilterDurationFrom("");
                                    setFilterDurationTo("");
                                }}
                            >
                                {t('common.clearFilters')}
                            </button>
                        </Focusable>
                    </div>
                )}

                {/* ── Playlist header ── */}
                {(activeNode.type === "myPlaylist" || activeNode.type === "onlinePlaylist") && (
                    <h2
                        style={{
                            fontSize: 22,
                            fontWeight: 700,
                            marginBottom: 12,
                            color: "goldenrod",
                        }}
                    >
                        {activeNode.type === "myPlaylist" ? "📋" : "🌐"} {activeNode.name}
                        <span
                            style={{
                                fontSize: 14,
                                fontWeight: 400,
                                marginLeft: 12,
                                opacity: 0.6,
                            }}
                        >
                            ({t('karaoke.songCount', { count: displaySongs.length })})
                        </span>
                    </h2>
                )}

                {/* ── Stats bar ── */}
                <div
                    style={{
                        fontSize: 13,
                        opacity: 0.6,
                        marginBottom: 8,
                        display: "flex",
                        gap: 16,
                    }}
                >
                    <span>{t('karaoke.songCount', { count: displaySongs.length })}</span>
                    {multiSelect && (
                        <span style={{ color: "goldenrod", fontWeight: 600 }}>
                            {t('karaoke.selectedCount', { count: selectedIds.size })}
                        </span>
                    )}
                    <span>
                        {t('karaoke.sorting')} {t(SORT_OPTIONS.find((o) => o.field === sortField)?.label ?? '')}{" "}
                        {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                </div>

                {/* ── Loading / error ── */}
                {isLoading && (
                    <p className="text-center" style={{ opacity: 0.6 }}>
                        {t('karaoke.loadingSongs')}
                    </p>
                )}
                {error && (
                    <p className="text-danger text-center">{t('karaoke.loadError')}</p>
                )}

                {/* ── Song list ── */}
                <div
                    className="d-flex flex-column gap-1"
                    role="listbox"
                    aria-multiselectable={multiSelect}
                    aria-label={t('karaoke.songsList')}
                >
                    {displaySongs.map((song, index) => (
                        <SongRow
                            key={song.id}
                            song={song}
                            index={index}
                            coverUrl={getSongCover(song)}
                            topScore={topScores[song.id]}
                            isSelected={selectedIds.has(song.id)}
                            multiSelect={multiSelect}
                            disabled={disabled}
                            loadingPlayId={loadingPlayId}
                            isViewingMyPlaylist={isViewingMyPlaylist}
                            myPlaylists={myPlaylists as KaraokePlaylist[]}
                            addMenuSongId={addMenuSongId}
                            addMenuRef={addMenuRef}
                            activeNode={activeNode}
                            onPlay={onPlay}
                            onToggleSelect={toggleSelect}
                            onPlayClick={handlePlayClick}
                            onRowKeyDown={handleRowKeyDown}
                            onRemoveFromPlaylist={handleRemoveFromPlaylist}
                            onAddToPlaylist={handleAddToPlaylist}
                            onToggleAddMenu={handleToggleAddMenu}
                            totalSongs={displaySongs.length}
                            onMoveUp={isViewingMyPlaylist ? handleMoveUp : undefined}
                            onMoveDown={isViewingMyPlaylist ? handleMoveDown : undefined}
                        />
                    ))}
                </div>

                {/* Empty state */}
                {!isLoading && displaySongs.length === 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "48px 0",
                            opacity: 0.5,
                            fontSize: 16,
                        }}
                    >
                        {t('karaoke.noSongsMatch')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(KaraokeSongBrowser);
