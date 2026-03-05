// PlaylistManagerPage.tsx — Advanced playlist manager (thin orchestrator)
import React from "react";

import { PlaylistType, ViewMode } from "../../models/modelsPlaylistManager";
import type { DynamicRuleGroup } from "../../models/modelsPlaylistManager";
import { MusicPlatform } from "../../models/modelsMusicPlatform";

import { usePlaylistManager, formatDuration } from "./usePlaylistManager";

// Sub-components
import PlaylistSidebar from "../../components/playlist/PlaylistSidebar";
import PlaylistTrackList from "../../components/playlist/PlaylistTrackList";
import PlaylistDualPane from "../../components/playlist/PlaylistDualPane";
import PlaylistSearchBar from "../../components/playlist/PlaylistSearchBar";
import PlaylistTagEditor from "../../components/playlist/PlaylistTagEditor";
import ServiceConnectorPanel from "../../components/playlist/ServiceConnectorPanel";
import DynamicRuleEditor from "../../components/playlist/DynamicRuleEditor";
import PlaylistOverview from "../../components/playlist/PlaylistOverview";
import PlaylistGridView from "../../components/playlist/PlaylistGridView";

// ── Shared styles ──

const toolbarBtn = (active: boolean): React.CSSProperties => ({
    background: active ? "var(--accent, #3b82f6)" : "transparent",
    color: active ? "var(--btn-text, #fff)" : "var(--text-secondary, #6b7280)",
    border: active ? "none" : "1px solid var(--border-color, #d1d5db)",
    borderRadius: 6,
    padding: "4px 8px",
    fontSize: "0.85rem",
    cursor: "pointer",
    transition: "all 0.12s",
});

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const PlaylistManagerPage: React.FC = () => {
    const pm = usePlaylistManager();
    const { t } = pm;

    // ── RENDER ──

    if (pm.loadingPlaylists) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        border: "3px solid var(--border-color, #e5e7eb)",
                        borderTop: "3px solid var(--accent, #3b82f6)",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite",
                    }}
                />
            </div>
        );
    }

    return (
        <div style={{ display: "flex", height: "calc(100vh - 60px)", overflow: "hidden" }}>
            {/* Sidebar */}
            <PlaylistSidebar
                folders={pm.folders}
                playlists={pm.playlists}
                tags={pm.tags}
                services={pm.services}
                activeFolderId={pm.activeFolderId}
                activePlaylistId={pm.activePlaylistId}
                onSelectFolder={pm.setActiveFolderId}
                onSelectPlaylist={pm.setActivePlaylistId}
                onCreateFolder={pm.handleCreateFolder}
                onRenameFolder={pm.handleUpdateFolder}
                onDeleteFolder={pm.handleDeleteFolder}
                onCreatePlaylist={pm.handleCreatePlaylist}
                onDragPlaylistToFolder={pm.handleMoveToFolder}
                onConnectService={pm.handleConnectService}
                onDisconnectService={pm.handleDisconnectService}
            />

            {/* Main area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                {/* Toolbar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "8px 16px",
                        borderBottom: "1px solid var(--border-color, #e5e7eb)",
                        background: "var(--surface-bg, #f9fafb)",
                        flexWrap: "wrap",
                    }}
                >
                    {/* Title */}
                    <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, marginRight: 12 }}>
                        {pm.activePlaylist ? pm.activePlaylist.name : t("playlistManager.title")}
                    </h2>

                    {/* Stats */}
                    {!pm.activePlaylist && (
                        <div style={{ display: "flex", gap: 12, fontSize: "0.72rem", opacity: 0.5 }}>
                            <span>{pm.stats.totalPlaylists} {t("playlistManager.playlists")}</span>
                            <span>{pm.stats.totalTracks} {t("playlistManager.tracks")}</span>
                            <span>{formatDuration(pm.stats.totalDuration)}</span>
                        </div>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Toggle panels */}
                    <button onClick={() => pm.setShowSearch(!pm.showSearch)} style={toolbarBtn(pm.showSearch)} title={t("playlistManager.search")}>
                        🔍
                    </button>
                    <button onClick={() => pm.setShowTags(!pm.showTags)} style={toolbarBtn(pm.showTags)} title={t("playlistManager.tagManager")}>
                        🏷️
                    </button>
                    <button onClick={() => pm.setShowServices(!pm.showServices)} style={toolbarBtn(pm.showServices)} title={t("playlistManager.services")}>
                        🔗
                    </button>

                    {/* Separator */}
                    <div style={{ width: 1, height: 24, background: "var(--border-color, #e5e7eb)" }} />

                    <input type="file" ref={pm.fileInputRef} accept=".json,.m3u,.m3u8,.csv" style={{ display: "none" }} onChange={pm.handleFileChange} />
                    <button onClick={pm.handleTriggerImport} style={toolbarBtn(false)} title={t("playlistManager.import")}>
                        📥
                    </button>

                    <button onClick={pm.handleExport} style={toolbarBtn(false)} title={t("playlistManager.export")}>
                        📤
                    </button>
                    <div style={{ display: "flex", gap: 2 }}>
                        <button onClick={() => pm.handleExportToService(MusicPlatform.Spotify)} style={toolbarBtn(false)} title={t("playlistManager.exportSpotify", "Export to Spotify")}>🟢</button>
                        <button onClick={() => pm.handleExportToService(MusicPlatform.Tidal)} style={toolbarBtn(false)} title={t("playlistManager.exportTidal", "Export to Tidal")}>⬛</button>
                        <button onClick={() => pm.handleExportToService(MusicPlatform.YouTube)} style={toolbarBtn(false)} title={t("playlistManager.exportYouTube", "Export to YouTube")}>🔴</button>
                    </div>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 80, fontSize: "0.72rem", padding: "2px 4px" }}
                        value={pm.exportFormat}
                        onChange={(e) => pm.setExportFormat(e.target.value as "json" | "m3u" | "csv")}
                        title={t("playlistManager.exportFormat", "Export format")}
                    >
                        <option value="json">JSON</option>
                        <option value="m3u">M3U</option>
                        <option value="csv">CSV</option>
                    </select>

                    {/* Dynamic rules toggle (only for dynamic playlists) */}
                    {pm.activePlaylist?.type === PlaylistType.Dynamic && (
                        <button
                            onClick={() => pm.setShowDynamicRules(!pm.showDynamicRules)}
                            style={toolbarBtn(pm.showDynamicRules)}
                            title={t("playlistManager.dynamicRules", "Dynamic Rules")}
                        >
                            ⚡
                        </button>
                    )}

                    {/* Separator */}
                    <div style={{ width: 1, height: 24, background: "var(--border-color, #e5e7eb)" }} />

                    {/* View modes */}
                    {pm.VIEW_MODES.map((vm) => (
                        <button
                            key={vm.mode}
                            onClick={() => pm.setViewMode(vm.mode)}
                            style={toolbarBtn(pm.viewMode === vm.mode)}
                            title={vm.label}
                        >
                            {vm.icon}
                        </button>
                    ))}
                </div>

                {/* Content area */}
                <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                    {/* Main content */}
                    <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                        {/* Search panel */}
                        {pm.showSearch && (
                            <div style={{ marginBottom: 12 }}>
                                <PlaylistSearchBar
                                    onSearch={pm.handleSearch}
                                    results={pm.searchResults.map((r) => ({
                                        id: r.id || crypto.randomUUID(),
                                        title: r.title,
                                        artist: r.artist,
                                        album: r.album,
                                        duration: r.duration,
                                        source: r.source,
                                        externalId: r.sourceId,
                                        imageUrl: r.coverUrl,
                                    }))}
                                    isSearching={pm.isSearching}
                                    onAddToPlaylist={pm.handleAddSearchResults}
                                />
                            </div>
                        )}

                        {/* Tag editor panel */}
                        {pm.showTags && (
                            <div style={{ marginBottom: 12 }}>
                                <PlaylistTagEditor
                                    tags={pm.tags}
                                    onCreateTag={pm.handleCreateTag}
                                    onUpdateTag={(id, name, color, icon) =>
                                        pm.updateTag.mutate({ id, name, color, icon })
                                    }
                                    onDeleteTag={(id) => pm.deleteTag.mutate(id)}
                                    selectedTracks={pm.selectedTracks}
                                    onAssignTag={(trackIds, tagId) => pm.handleTagTracks(trackIds, [tagId])}
                                    onUnassignTag={pm.handleUntagTracks}
                                />
                            </div>
                        )}

                        {/* Dynamic rules editor panel */}
                        {pm.showDynamicRules && pm.activePlaylist?.type === PlaylistType.Dynamic && (
                            <div style={{ marginBottom: 12 }}>
                                <DynamicRuleEditor
                                    rules={pm.activePlaylist.dynamicRules}
                                    onChange={(rules: DynamicRuleGroup) => {
                                        if (pm.activePlaylist) pm.updatePlaylist.mutate({ id: pm.activePlaylist.id, dynamicRules: rules });
                                    }}
                                    limit={pm.activePlaylist.dynamicLimit}
                                    onLimitChange={(limit) => {
                                        if (pm.activePlaylist) pm.updatePlaylist.mutate({ id: pm.activePlaylist.id, dynamicLimit: limit });
                                    }}
                                />
                            </div>
                        )}

                        {/* Main view content */}
                        {pm.viewMode === ViewMode.DualPane ? (
                            <div style={{ height: "calc(100% - 8px)" }}>
                                <PlaylistDualPane
                                    playlists={pm.playlists}
                                    tags={pm.tags}
                                    onCopyTracks={pm.handleCopyTracks}
                                    onMoveTracks={pm.handleMoveTracks}
                                    onRemoveTracks={(plId, ids) =>
                                        pm.removeTracks.mutate({ playlistId: plId, trackIds: ids })
                                    }
                                    onReorderTracks={(plId, ids) =>
                                        pm.reorderTracks.mutate({ playlistId: plId, trackIds: ids })
                                    }
                                    onPlay={pm.handlePlay}
                                    onTagTracks={pm.handleTagTracks}
                                    initialLeftId={pm.activePlaylistId ?? undefined}
                                />
                            </div>
                        ) : pm.activePlaylist ? (
                            pm.viewMode === ViewMode.Grid ? (
                                <PlaylistGridView
                                    playlist={pm.activePlaylist}
                                    tags={pm.tags}
                                    onPlay={pm.handlePlay}
                                    selectedTrackIds={pm.selectedTrackIds}
                                    onSelectionChange={pm.setSelectedTrackIds}
                                />
                            ) : (
                                <PlaylistTrackList
                                    tracks={pm.activePlaylist.tracks}
                                    tags={pm.tags}
                                    selectedTrackIds={pm.selectedTrackIds}
                                    onSelectionChange={pm.setSelectedTrackIds}
                                    onPlay={pm.handlePlay}
                                    onRemove={pm.handleRemoveTracks}
                                    onReorder={pm.handleReorderTracks}
                                    onTagTracks={pm.handleTagTracks}
                                    sortField={pm.sortField}
                                    sortDir={pm.sortDir}
                                    onSortChange={pm.handleSortChange}
                                    filterText={pm.filterText}
                                    onFilterChange={pm.setFilterText}
                                    compact={pm.viewMode === ViewMode.Compact}
                                    draggable
                                />
                            )
                        ) : (
                            <PlaylistOverview
                                playlists={pm.playlists}
                                folders={pm.folders}
                                tags={pm.tags}
                                activeFolderId={pm.activeFolderId}
                                onSelectPlaylist={pm.setActivePlaylistId}
                                onDeletePlaylist={pm.handleDeletePlaylist}
                                onDuplicatePlaylist={(id) => pm.duplicatePlaylist.mutate(id)}
                            />
                        )}
                    </div>

                    {/* Side panel: services */}
                    {pm.showServices && (
                        <div style={{ width: 340, borderLeft: "1px solid var(--border-color, #e5e7eb)", overflow: "auto", padding: 12 }}>
                            <ServiceConnectorPanel
                                services={pm.services}
                                externalPlaylists={pm.externalPlaylists}
                                loadingPlaylists={false}
                                onConnect={pm.handleConnectService}
                                onDisconnect={pm.handleDisconnectService}
                                onLoadPlaylists={(platform) => pm.setExternalPlatform(platform)}
                                onImportPlaylist={pm.handleImportExternal}
                                onImportAll={pm.handleImportAll}
                                importing={pm.importExternal.isPending}
                                activePlatform={pm.activePlatformTab}
                                onChangePlatform={pm.setActivePlatformTab}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlaylistManagerPage;
