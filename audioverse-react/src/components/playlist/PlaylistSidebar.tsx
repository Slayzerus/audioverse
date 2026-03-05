// PlaylistSidebar.tsx — Folder tree + service connections + playlist list
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type {
    PlaylistFolder,
    ManagedPlaylist,
    PlaylistTag,
    ServiceConnection,
    PlaylistType,
} from "../../models/modelsPlaylistManager";
import { MusicPlatform } from "../../models/modelsMusicPlatform";

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

export interface PlaylistSidebarProps {
    folders: PlaylistFolder[];
    playlists: ManagedPlaylist[];
    tags: PlaylistTag[];
    services: ServiceConnection[];
    activeFolderId: string | null;
    activePlaylistId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onSelectPlaylist: (playlistId: string) => void;
    onCreateFolder: (name: string, parentId: string | null) => void;
    onRenameFolder: (id: string, name: string) => void;
    onDeleteFolder: (id: string) => void;
    onCreatePlaylist: (name: string, type: PlaylistType, folderId: string | null) => void;
    onConnectService: (platform: MusicPlatform) => void;
    onDisconnectService: (platform: MusicPlatform) => void;
    onDragPlaylistToFolder?: (playlistId: string, folderId: string | null) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

// ══════════════════════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════════════════════

const buildTree = (
    folders: PlaylistFolder[],
    parentId: string | null = null,
): PlaylistFolder[] => {
    return folders
        .filter((f) => f.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((f) => ({ ...f, children: buildTree(folders, f.id) }));
};

const PLATFORM_INFO: Record<number, { icon: string; label: string; color: string; bg?: string }> = {
    [MusicPlatform.Spotify]: { icon: "🟢", label: "Spotify", color: "var(--source-spotify, #1DB954)", bg: "var(--source-spotify-bg, #1DB95418)" },
    [MusicPlatform.Tidal]: { icon: "⬛", label: "Tidal", color: "var(--source-tidal, #000000)", bg: "var(--source-tidal-bg, #00000010)" },
    [MusicPlatform.YouTube]: { icon: "🔴", label: "YouTube", color: "var(--source-youtube, #FF0000)", bg: "var(--source-youtube-bg, #FF000010)" },
};

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const PlaylistSidebar: React.FC<PlaylistSidebarProps> = ({
    folders,
    playlists,
    tags,
    services,
    activeFolderId,
    activePlaylistId,
    onSelectFolder,
    onSelectPlaylist,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onCreatePlaylist,
    onConnectService,
    onDisconnectService,
    onDragPlaylistToFolder,
    collapsed = false,
    onToggleCollapse,
}) => {
    const { t } = useTranslation();
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [newFolderParent, setNewFolderParent] = useState<string | null>(null);
    const [showNewPlaylist, setShowNewPlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [newPlaylistType, setNewPlaylistType] = useState<PlaylistType>("static" as PlaylistType);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
    const [showServices, setShowServices] = useState(false);

    const tree = useMemo(() => buildTree(folders), [folders]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const handleCreateFolder = useCallback(() => {
        if (!newFolderName.trim()) return;
        onCreateFolder(newFolderName.trim(), newFolderParent);
        setNewFolderName("");
        setShowNewFolder(false);
    }, [newFolderName, newFolderParent, onCreateFolder]);

    const handleCreatePlaylist = useCallback(() => {
        if (!newPlaylistName.trim()) return;
        onCreatePlaylist(newPlaylistName.trim(), newPlaylistType, activeFolderId);
        setNewPlaylistName("");
        setShowNewPlaylist(false);
    }, [newPlaylistName, newPlaylistType, activeFolderId, onCreatePlaylist]);

    const handleRename = useCallback(
        (id: string) => {
            if (!renameValue.trim()) return;
            onRenameFolder(id, renameValue.trim());
            setRenamingId(null);
            setRenameValue("");
        },
        [renameValue, onRenameFolder],
    );

    // Drag-and-drop: playlist → folder
    const handleDragOver = useCallback((e: React.DragEvent, folderId: string | null) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setDragOverFolderId(folderId);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent, folderId: string | null) => {
            e.preventDefault();
            const playlistId = e.dataTransfer.getData("playlistId");
            if (playlistId && onDragPlaylistToFolder) {
                onDragPlaylistToFolder(playlistId, folderId);
            }
            setDragOverFolderId(null);
        },
        [onDragPlaylistToFolder],
    );

    const handleDragLeave = useCallback(() => setDragOverFolderId(null), []);

    const playlistsInFolder = useCallback(
        (folderId: string | null) =>
            playlists.filter((p) => (p.folderId ?? null) === folderId),
        [playlists],
    );

    // ── Styles ──

    const sidebarStyle: React.CSSProperties = {
        width: collapsed ? 48 : 280,
        minWidth: collapsed ? 48 : 280,
        background: "var(--sidebar-bg, #f8f9fa)",
        borderRight: "1px solid var(--border-color, #e5e7eb)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.2s, min-width 0.2s",
        overflow: "hidden",
        height: "100%",
    };

    const sectionStyle: React.CSSProperties = {
        padding: "8px 12px",
        borderBottom: "1px solid var(--border-color, #e5e7eb)",
    };

    const itemStyle = (isActive: boolean, isDragOver = false): React.CSSProperties => ({
        padding: "6px 12px",
        borderRadius: 6,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: "0.82rem",
        background: isDragOver
            ? "var(--accent-light, #dbeafe)"
            : isActive
              ? "var(--accent, #3b82f6)"
              : "transparent",
        color: isActive ? "var(--btn-text, #fff)" : "var(--text-primary, #1f2937)",
        transition: "background 0.15s",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    });

    const btnSmall: React.CSSProperties = {
        background: "none",
        border: "none",
        cursor: "pointer",
        fontSize: "0.75rem",
        padding: "2px 6px",
        borderRadius: 4,
        color: "var(--text-secondary, #6b7280)",
    };

    const inputSmall: React.CSSProperties = {
        fontSize: "0.8rem",
        padding: "4px 8px",
        borderRadius: 6,
        border: "1px solid var(--border-color, #d1d5db)",
        background: "var(--input-bg, #fff)",
        color: "var(--text-primary, #1f2937)",
        width: "100%",
    };

    // ── Render helper: folder tree ──

    const renderFolder = (folder: PlaylistFolder, depth: number): React.ReactNode => {
        const isExpanded = expandedFolders.has(folder.id);
        const isActive = activeFolderId === folder.id;
        const isDragOver = dragOverFolderId === folder.id;
        const childPlaylists = playlistsInFolder(folder.id);

        return (
            <div key={folder.id}>
                <div
                    style={{ ...itemStyle(isActive, isDragOver), paddingLeft: 12 + depth * 16 }}
                    onClick={() => {
                        onSelectFolder(folder.id);
                        if (folder.children && folder.children.length > 0) toggleExpand(folder.id);
                    }}
                    onDragOver={(e) => handleDragOver(e, folder.id)}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    onDragLeave={handleDragLeave}
                >
                    <span style={{ width: 14, textAlign: "center", flexShrink: 0, fontSize: "0.7rem" }}>
                        {(folder.children?.length || 0) > 0 || childPlaylists.length > 0
                            ? isExpanded ? "▼" : "▶"
                            : "·"}
                    </span>
                    {renamingId === folder.id ? (
                        <input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename(folder.id);
                                if (e.key === "Escape") setRenamingId(null);
                            }}
                            onBlur={() => handleRename(folder.id)}
                            autoFocus
                            style={{ ...inputSmall, flex: 1 }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <>
                            <span>{folder.icon ?? "📁"}</span>
                            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                                {folder.name}
                            </span>
                            <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>
                                {childPlaylists.length}
                            </span>
                            <button
                                style={btnSmall}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRenamingId(folder.id);
                                    setRenameValue(folder.name);
                                }}
                                title={t("common.rename")}
                            >
                                ✏
                            </button>
                            <button
                                style={{ ...btnSmall, color: "var(--error, #ef4444)" }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteFolder(folder.id);
                                }}
                                title={t("common.delete")}
                            >
                                ✕
                            </button>
                        </>
                    )}
                </div>
                {isExpanded && (
                    <>
                        {childPlaylists.map((pl) => renderPlaylistItem(pl, depth + 1))}
                        {folder.children?.map((child) => renderFolder(child, depth + 1))}
                    </>
                )}
            </div>
        );
    };

    const renderPlaylistItem = (pl: ManagedPlaylist, depth: number): React.ReactNode => {
        const isActive = activePlaylistId === pl.id;
        return (
            <div
                key={pl.id}
                style={{ ...itemStyle(isActive), paddingLeft: 12 + depth * 16 + 22 }}
                onClick={() => onSelectPlaylist(pl.id)}
                draggable
                onDragStart={(e) => {
                    e.dataTransfer.setData("playlistId", pl.id);
                    e.dataTransfer.effectAllowed = "move";
                }}
            >
                <span style={{ fontSize: "0.7rem" }}>
                    {pl.type === "dynamic" ? "⚡" : "🎵"}
                </span>
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {pl.name}
                </span>
                <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>{pl.trackCount}</span>
            </div>
        );
    };

    // ── Collapsed view ──

    if (collapsed) {
        return (
            <div style={sidebarStyle}>
                <button
                    style={{ ...btnSmall, padding: "12px 0", fontSize: "1.1rem", width: "100%" }}
                    onClick={onToggleCollapse}
                    title={t("playlistManager.expandSidebar")}
                >
                    ▶
                </button>
            </div>
        );
    }

    const rootPlaylists = playlistsInFolder(null);

    return (
        <div style={sidebarStyle}>
            {/* Header */}
            <div style={{ ...sectionStyle, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: "0.85rem" }}>
                    🎶 {t("playlistManager.title")}
                </span>
                <button style={btnSmall} onClick={onToggleCollapse} title={t("playlistManager.collapseSidebar")}>
                    ◀
                </button>
            </div>

            {/* Quick actions */}
            <div style={{ ...sectionStyle, display: "flex", gap: 4, flexWrap: "wrap" }}>
                <button
                    style={{ ...btnSmall, background: "var(--accent, #3b82f6)", color: "var(--btn-text, #fff)", borderRadius: 6, padding: "4px 10px" }}
                    onClick={() => setShowNewPlaylist(true)}
                >
                    + {t("playlistManager.newPlaylist")}
                </button>
                <button
                    style={{ ...btnSmall, border: "1px solid var(--border-color, #d1d5db)", borderRadius: 6, padding: "4px 10px" }}
                    onClick={() => { setShowNewFolder(true); setNewFolderParent(activeFolderId); }}
                >
                    📁 {t("playlistManager.newFolder")}
                </button>
            </div>

            {/* New playlist inline form */}
            {showNewPlaylist && (
                <div style={{ ...sectionStyle, display: "flex", flexDirection: "column", gap: 6 }}>
                    <input
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder={t("playlistManager.playlistName")}
                        style={inputSmall}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleCreatePlaylist(); if (e.key === "Escape") setShowNewPlaylist(false); }}
                    />
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <label style={{ fontSize: "0.75rem", display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                checked={newPlaylistType === "static"}
                                onChange={() => setNewPlaylistType("static" as PlaylistType)}
                            />
                            {t("playlistManager.static")}
                        </label>
                        <label style={{ fontSize: "0.75rem", display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                            <input
                                type="radio"
                                checked={newPlaylistType === "dynamic"}
                                onChange={() => setNewPlaylistType("dynamic" as PlaylistType)}
                            />
                            ⚡ {t("playlistManager.dynamic")}
                        </label>
                        <div style={{ flex: 1 }} />
                        <button style={{ ...btnSmall, background: "var(--accent, #3b82f6)", color: "var(--btn-text, #fff)", borderRadius: 4, padding: "3px 8px" }} onClick={handleCreatePlaylist} aria-label="Confirm create playlist">✓</button>
                        <button style={btnSmall} onClick={() => setShowNewPlaylist(false)} aria-label="Cancel create playlist">✕</button>
                    </div>
                </div>
            )}

            {/* New folder inline form */}
            {showNewFolder && (
                <div style={{ ...sectionStyle, display: "flex", gap: 6 }}>
                    <input
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder={t("playlistManager.folderName")}
                        style={{ ...inputSmall, flex: 1 }}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleCreateFolder(); if (e.key === "Escape") setShowNewFolder(false); }}
                    />
                    <button style={{ ...btnSmall, background: "var(--accent, #3b82f6)", color: "var(--btn-text, #fff)", borderRadius: 4, padding: "3px 8px" }} onClick={handleCreateFolder} aria-label="Confirm create folder">✓</button>
                    <button style={btnSmall} onClick={() => setShowNewFolder(false)} aria-label="Cancel create folder">✕</button>
                </div>
            )}

            {/* All Playlists (root) */}
            <div style={{ flex: 1, overflow: "auto", padding: "4px 0" }}>
                <div
                    style={itemStyle(activeFolderId === null && activePlaylistId === null, dragOverFolderId === "__root__")}
                    onClick={() => onSelectFolder(null)}
                    onDragOver={(e) => handleDragOver(e, null)}
                    onDrop={(e) => handleDrop(e, null)}
                    onDragLeave={handleDragLeave}
                >
                    <span>🏠</span>
                    <span style={{ flex: 1 }}>{t("playlistManager.allPlaylists")}</span>
                    <span style={{ fontSize: "0.65rem", opacity: 0.5 }}>{playlists.length}</span>
                </div>

                {/* Root playlists (no folder) */}
                {rootPlaylists.map((pl) => renderPlaylistItem(pl, 0))}

                {/* Folder tree */}
                {tree.map((folder) => renderFolder(folder, 0))}
            </div>

            {/* Tags section */}
            {tags.length > 0 && (
                <div style={sectionStyle}>
                    <div style={{ fontSize: "0.7rem", fontWeight: 600, marginBottom: 4, opacity: 0.6 }}>
                        {t("playlistManager.tags")}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {tags.map((tag) => (
                            <span
                                key={tag.id}
                                style={{
                                    fontSize: "0.7rem",
                                    padding: "2px 8px",
                                    borderRadius: 12,
                                    background: tag.color + "22",
                                    color: tag.color,
                                    border: `1px solid ${tag.color}44`,
                                    cursor: "pointer",
                                }}
                            >
                                {tag.icon && `${tag.icon} `}{tag.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Services section */}
            <div style={sectionStyle}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        opacity: 0.6,
                    }}
                    onClick={() => setShowServices(!showServices)}
                >
                    <span>🔗 {t("playlistManager.services")}</span>
                    <span>{showServices ? "▲" : "▼"}</span>
                </div>
                {showServices && (
                    <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                        {[MusicPlatform.Spotify, MusicPlatform.Tidal, MusicPlatform.YouTube].map((platform) => {
                            const info = PLATFORM_INFO[platform];
                            const conn = services.find((s) => s.platform === platform);
                            return (
                                <div
                                    key={platform}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "4px 8px",
                                        borderRadius: 6,
                                        border: "1px solid var(--border-color, #e5e7eb)",
                                        fontSize: "0.78rem",
                                    }}
                                >
                                    <span>{info.icon}</span>
                                    <span style={{ flex: 1 }}>{info.label}</span>
                                    {conn?.connected ? (
                                        <>
                                            <span style={{ fontSize: "0.65rem", opacity: 0.6 }}>
                                                {conn.username ?? t("playlistManager.connected")}
                                            </span>
                                            <button
                                                style={{ ...btnSmall, color: "#ef4444" }}
                                                onClick={() => onDisconnectService(platform)}
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            style={{
                                                ...btnSmall,
                                                background: info.color,
                                                color: "#fff",
                                                borderRadius: 4,
                                                padding: "2px 8px",
                                            }}
                                            onClick={() => onConnectService(platform)}
                                        >
                                            {t("playlistManager.connect")}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistSidebar;
