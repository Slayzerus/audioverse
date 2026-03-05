// usePlaylistManager.ts — Extracted hook: all state, queries, mutations, handlers for PlaylistManagerPage
import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";

import {
    ViewMode,
    PlaylistType,
    TrackSource,
    SortField,
    SortDirection,
} from "../../models/modelsPlaylistManager";
import type {
    PlaylistTrack,
} from "../../models/modelsPlaylistManager";
import { MusicPlatform } from "../../models/modelsMusicPlatform";

import {
    useManagedPlaylistsQuery,
    useCreateManagedPlaylistMutation,
    useDeleteManagedPlaylistMutation,
    useUpdateManagedPlaylistMutation,
    useDuplicatePlaylistMutation,
    useAddTracksMutation,
    useRemoveTracksMutation,
    useReorderTracksMutation,
    useMoveTracksMutation,
    useCopyTracksMutation,
    useFoldersQuery,
    useCreateFolderMutation,
    useUpdateFolderMutation,
    useDeleteFolderMutation,
    useMovePlaylistToFolderMutation,
    useTagsQuery,
    useCreateTagMutation,
    useUpdateTagMutation,
    useDeleteTagMutation,
    useTagTracksMutation,
    useUntagTracksMutation,
    useServiceConnectionsQuery,
    useConnectServiceMutation,
    useDisconnectServiceMutation,
    useExternalPlaylistsQuery,
    useImportExternalPlaylistMutation,
    useExportToServiceMutation,
    useSearchTracksQuery,
    useImportPlaylistFileMutation,
} from "../../scripts/api/apiPlaylistManager";
import { useToast } from "../../components/ui/ToastProvider";

import type { SearchResult } from "../../components/playlist/PlaylistSearchBar";

import {
    exportPlaylistAsM3U,
    exportPlaylistAsCSV,
    exportAsAudioVerseJSON,
    parseM3U,
    parseCSV,
    downloadFile,
    detectFormatFromFilename,
    createPlaylistFromImport,
} from "../../scripts/playlist/playlistFormatUtils";

// ── View mode descriptors (stable) ──

export interface ViewModeDescriptor {
    mode: ViewMode;
    icon: string;
    label: string;
}

// ── Stats helper ──

export const formatDuration = (sec: number): string => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ── Hook ──

export function usePlaylistManager() {
    const { t } = useTranslation();

    // ── Data queries ──
    const { data: playlists = [], isLoading: loadingPlaylists } = useManagedPlaylistsQuery();
    const { data: folders = [] } = useFoldersQuery();
    const { data: tags = [] } = useTagsQuery();
    const { data: services = [] } = useServiceConnectionsQuery();

    // ── UI state ──
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.List);
    const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
    const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [showTags, setShowTags] = useState(false);
    const [showServices, setShowServices] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchSources, setSearchSources] = useState<TrackSource[]>([]);
    const [sortField, setSortField] = useState<SortField>("custom" as SortField);
    const [sortDir, setSortDir] = useState<SortDirection>("asc" as SortDirection);
    const [filterText, setFilterText] = useState("");
    const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
    const [externalPlatform, setExternalPlatform] = useState<MusicPlatform>(MusicPlatform.None);
    const [activePlatformTab, setActivePlatformTab] = useState<MusicPlatform>(MusicPlatform.Spotify);
    const [exportFormat, setExportFormat] = useState<"json" | "m3u" | "csv">("json");
    const [showDynamicRules, setShowDynamicRules] = useState(false);

    // ── Derived ──
    const activePlaylist = useMemo(
        () => playlists.find((p) => p.id === activePlaylistId) ?? null,
        [playlists, activePlaylistId],
    );

    const selectedTracks = useMemo(() => {
        if (!activePlaylist) return [] as PlaylistTrack[];
        return activePlaylist.tracks.filter((t) => selectedTrackIds.has(t.id));
    }, [activePlaylist, selectedTrackIds]);

    // ── Search query ──
    const { data: searchResults = [], isFetching: isSearching } = useSearchTracksQuery(
        searchQuery,
        searchSources.length > 0 ? searchSources[0] : "library",
    );

    // ── External playlists ──
    const { data: externalPlaylists = [] } = useExternalPlaylistsQuery(
        externalPlatform,
        externalPlatform !== MusicPlatform.None,
    );

    // ── Mutations ──
    const createPlaylist = useCreateManagedPlaylistMutation();
    const deletePlaylist = useDeleteManagedPlaylistMutation();
    const updatePlaylist = useUpdateManagedPlaylistMutation();
    const duplicatePlaylist = useDuplicatePlaylistMutation();
    const addTracks = useAddTracksMutation();
    const removeTracks = useRemoveTracksMutation();
    const reorderTracks = useReorderTracksMutation();
    const moveTracks = useMoveTracksMutation();
    const copyTracks = useCopyTracksMutation();
    const createFolder = useCreateFolderMutation();
    const updateFolder = useUpdateFolderMutation();
    const deleteFolder = useDeleteFolderMutation();
    const moveToFolder = useMovePlaylistToFolderMutation();
    const createTag = useCreateTagMutation();
    const updateTag = useUpdateTagMutation();
    const deleteTag = useDeleteTagMutation();
    const tagTracks = useTagTracksMutation();
    const untagTracks = useUntagTracksMutation();
    const connectService = useConnectServiceMutation();
    const disconnectService = useDisconnectServiceMutation();
    const importExternal = useImportExternalPlaylistMutation();
    const exportToService = useExportToServiceMutation();

    const importPlaylist = useImportPlaylistFileMutation();
    const { showToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Handlers ──

    const handleExport = useCallback(() => {
        const dateSuffix = new Date().toISOString().slice(0, 10);

        if (exportFormat === "json") {
            const data = exportAsAudioVerseJSON(playlists, folders, tags);
            downloadFile(
                JSON.stringify(data, null, 2),
                `audioverse-playlists-${dateSuffix}.json`,
                "application/json",
            );
        } else if (activePlaylist) {
            if (exportFormat === "m3u") {
                const content = exportPlaylistAsM3U(activePlaylist);
                downloadFile(content, `${activePlaylist.name}-${dateSuffix}.m3u`, "audio/x-mpegurl");
            } else {
                const tagMap = new Map(tags.map((t) => [t.id, t]));
                const content = exportPlaylistAsCSV(activePlaylist, tagMap);
                downloadFile(content, `${activePlaylist.name}-${dateSuffix}.csv`, "text/csv");
            }
        } else {
            const data = exportAsAudioVerseJSON(playlists, folders, tags);
            downloadFile(
                JSON.stringify(data, null, 2),
                `audioverse-playlists-${dateSuffix}.json`,
                "application/json",
            );
        }
    }, [exportFormat, activePlaylist, playlists, folders, tags]);

    const handleTriggerImport = useCallback(() => {
        if (fileInputRef.current) fileInputRef.current.click();
    }, []);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const format = detectFormatFromFilename(file.name);

        if (format === "json") {
            if (!window.confirm(t("playlistManager.confirmOverwrite"))) {
                e.target.value = "";
                return;
            }
            importPlaylist.mutate(
                { file, options: { mergeTags: true, mergeFolders: true, overwriteExisting: true } },
                { onSettled: () => { e.target.value = ""; } },
            );
        } else if (format === "m3u" || format === "csv") {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result as string;
                let importedTracks: Partial<import("../../models/modelsPlaylistManager").PlaylistTrack>[];
                let playlistName: string;

                if (format === "m3u") {
                    const parsed = parseM3U(text);
                    importedTracks = parsed.tracks;
                    playlistName = parsed.name ?? file.name.replace(/\.[^.]+$/, "");
                } else {
                    importedTracks = parseCSV(text);
                    playlistName = file.name.replace(/\.[^.]+$/, "");
                }

                if (importedTracks.length === 0) {
                    alert(t("playlistManager.importEmpty", "No tracks found in file."));
                    return;
                }

                const newPlaylist = createPlaylistFromImport(playlistName, importedTracks);
                createPlaylist.mutate({
                    name: newPlaylist.name,
                    type: PlaylistType.Static,
                    folderId: activeFolderId ?? undefined,
                });

                if (newPlaylist.tracks.length > 0 && activePlaylistId) {
                    addTracks.mutate({
                        playlistId: activePlaylistId,
                        tracks: newPlaylist.tracks as Partial<import("../../models/modelsPlaylistManager").PlaylistTrack>[],
                    });
                }
            };
            reader.readAsText(file);
            e.target.value = "";
        } else {
            alert(t("playlistManager.unsupportedFormat", "Unsupported file format. Use .json, .m3u, .m3u8 or .csv."));
            e.target.value = "";
        }
    }, [importPlaylist, t, createPlaylist, addTracks, activePlaylistId, activeFolderId]);

    const handleCreatePlaylist = useCallback(
        (name: string, type: PlaylistType, folderId: string | null) => {
            createPlaylist.mutate({ name, type, folderId: folderId ?? undefined });
        },
        [createPlaylist],
    );

    const handleDeletePlaylist = useCallback(
        (id: string) => {
            deletePlaylist.mutate(id);
            if (activePlaylistId === id) setActivePlaylistId(null);
        },
        [deletePlaylist, activePlaylistId],
    );

    const handleCreateFolder = useCallback(
        (name: string, parentId: string | null) => {
            createFolder.mutate({ name, parentId: parentId ?? undefined });
        },
        [createFolder],
    );

    const handleUpdateFolder = useCallback(
        (id: string, name: string) => {
            updateFolder.mutate({ id, name });
        },
        [updateFolder],
    );

    const handleDeleteFolder = useCallback(
        (id: string) => {
            deleteFolder.mutate(id);
            if (activeFolderId === id) setActiveFolderId(null);
        },
        [deleteFolder, activeFolderId],
    );

    const handleMoveToFolder = useCallback(
        (playlistId: string, folderId: string | null) => {
            moveToFolder.mutate({ playlistId, folderId });
        },
        [moveToFolder],
    );

    const handlePlay = useCallback((track: PlaylistTrack) => {
        if (track.youtubeId) {
            window.open(`https://www.youtube.com/watch?v=${track.youtubeId}`, "_blank");
        } else if (track.spotifyId) {
            window.open(`https://open.spotify.com/track/${track.spotifyId}`, "_blank");
        } else if (track.tidalId) {
            window.open(`https://tidal.com/browse/track/${track.tidalId}`, "_blank");
        } else if (track.sourceUrl) {
            window.open(track.sourceUrl, "_blank");
        }
    }, []);

    const handleSearch = useCallback((q: string, sources: TrackSource[]) => {
        setSearchQuery(q);
        setSearchSources(sources);
    }, []);

    const handleAddSearchResults = useCallback(
        (results: SearchResult[]) => {
            if (!activePlaylistId) return;
            const newTracks = results.map((r) => ({
                title: r.title,
                artist: r.artist,
                album: r.album,
                duration: r.duration,
                source: r.source,
                externalId: r.externalId,
            }));
            addTracks.mutate({ playlistId: activePlaylistId, tracks: newTracks as Partial<PlaylistTrack>[] });
        },
        [activePlaylistId, addTracks],
    );

    const handleRemoveTracks = useCallback(
        (trackIds: string[]) => {
            if (!activePlaylistId) return;
            removeTracks.mutate({ playlistId: activePlaylistId, trackIds });
            setSelectedTrackIds(new Set());
        },
        [activePlaylistId, removeTracks],
    );

    const handleReorderTracks = useCallback(
        (trackIds: string[]) => {
            if (!activePlaylistId) return;
            reorderTracks.mutate({ playlistId: activePlaylistId, trackIds });
        },
        [activePlaylistId, reorderTracks],
    );

    const handleCopyTracks = useCallback(
        (sourceId: string, targetId: string, trackIds: string[]) => {
            copyTracks.mutate({ sourcePlaylistId: sourceId, targetPlaylistId: targetId, trackIds });
        },
        [copyTracks],
    );

    const handleMoveTracks = useCallback(
        (sourceId: string, targetId: string, trackIds: string[]) => {
            moveTracks.mutate({ sourcePlaylistId: sourceId, targetPlaylistId: targetId, trackIds });
        },
        [moveTracks],
    );

    const handleConnectService = useCallback(
        (platform: MusicPlatform) => {
            connectService.mutate(platform);
        },
        [connectService],
    );

    const handleDisconnectService = useCallback(
        (platform: MusicPlatform) => {
            disconnectService.mutate(platform);
        },
        [disconnectService],
    );

    const handleImportExternal = useCallback(
        (platform: MusicPlatform, externalPlaylistId: string) => {
            importExternal.mutate({ platform, externalPlaylistId });
        },
        [importExternal],
    );

    const handleImportAll = useCallback(
        (platform: MusicPlatform) => {
            externalPlaylists.forEach((ep) => {
                importExternal.mutate({ platform, externalPlaylistId: ep.id });
            });
        },
        [importExternal, externalPlaylists],
    );

    const handleExportToService = useCallback(
        (platform: MusicPlatform) => {
            if (!activePlaylistId) {
                showToast(t("playlistManager.selectPlaylistFirst", "Select a playlist first"), "error");
                return;
            }
            exportToService.mutate(
                { playlistId: activePlaylistId, platform },
                {
                    onSuccess: (result) => {
                        const label = platform === MusicPlatform.Spotify ? "Spotify" : platform === MusicPlatform.Tidal ? "Tidal" : "YouTube";
                        showToast(t("playlistManager.exportedToService", { platform: label }), "success");
                        if (result?.url) window.open(result.url, "_blank");
                    },
                    onError: () => {
                        showToast(t("playlistManager.exportError", "Export failed"), "error");
                    },
                },
            );
        },
        [activePlaylistId, exportToService, showToast, t],
    );

    const handleTagTracks = useCallback(
        (trackIds: string[], tagIds: string[]) => {
            tagTracks.mutate({ trackIds, tagIds });
        },
        [tagTracks],
    );

    const handleUntagTracks = useCallback(
        (trackIds: string[], tagId: string) => {
            untagTracks.mutate({ trackIds, tagIds: [tagId] });
        },
        [untagTracks],
    );

    const handleCreateTag = useCallback(
        (name: string, color: string, icon?: string) => {
            createTag.mutate({ name, color, icon });
        },
        [createTag],
    );

    const handleSortChange = useCallback((f: SortField, d: SortDirection) => {
        setSortField(f);
        setSortDir(d);
    }, []);

    // ── View mode icons ──
    const VIEW_MODES: ViewModeDescriptor[] = [
        { mode: ViewMode.List, icon: "☰", label: t("playlistManager.viewList") },
        { mode: ViewMode.Grid, icon: "▦", label: t("playlistManager.viewGrid") },
        { mode: ViewMode.Compact, icon: "≡", label: t("playlistManager.viewCompact") },
        { mode: ViewMode.DualPane, icon: "◫", label: t("playlistManager.viewDual") },
    ];

    // ── Stats ──
    const stats = useMemo(() => {
        const arr = Array.isArray(playlists) ? playlists : [];
        const totalTracks = arr.reduce((s, p) => s + (p.trackCount || (Array.isArray(p.tracks) ? p.tracks.length : 0)), 0);
        const totalDuration = arr.reduce(
            (s, p) => s + (Array.isArray(p.tracks) ? p.tracks : []).reduce((d: number, tr: { duration?: number }) => d + (tr.duration || 0), 0),
            0,
        );
        return { totalPlaylists: arr.length, totalTracks, totalDuration };
    }, [playlists]);

    return {
        t,
        // Data
        playlists,
        folders,
        tags,
        services,
        loadingPlaylists,
        // UI state
        viewMode,
        setViewMode,
        activePlaylistId,
        setActivePlaylistId,
        activeFolderId,
        setActiveFolderId,
        showSearch,
        setShowSearch,
        showTags,
        setShowTags,
        showServices,
        setShowServices,
        sortField,
        sortDir,
        filterText,
        setFilterText,
        selectedTrackIds,
        setSelectedTrackIds,
        exportFormat,
        setExportFormat,
        showDynamicRules,
        setShowDynamicRules,
        activePlatformTab,
        setActivePlatformTab,
        setExternalPlatform,
        // Derived
        activePlaylist,
        selectedTracks,
        searchResults,
        isSearching,
        externalPlaylists,
        stats,
        VIEW_MODES,
        // Mutation objects (needed for inline calls in JSX)
        updatePlaylist,
        updateTag,
        deleteTag: deleteTag,
        removeTracks,
        reorderTracks,
        duplicatePlaylist,
        importExternal,
        // Handlers
        handleExport,
        handleTriggerImport,
        handleFileChange,
        handleCreatePlaylist,
        handleDeletePlaylist,
        handleCreateFolder,
        handleUpdateFolder,
        handleDeleteFolder,
        handleMoveToFolder,
        handlePlay,
        handleSearch,
        handleAddSearchResults,
        handleRemoveTracks,
        handleReorderTracks,
        handleCopyTracks,
        handleMoveTracks,
        handleConnectService,
        handleDisconnectService,
        handleImportExternal,
        handleImportAll,
        handleExportToService,
        handleTagTracks,
        handleUntagTracks,
        handleCreateTag,
        handleSortChange,
        // Refs
        fileInputRef,
    };
}
