// ServiceConnectorPanel.tsx — Connect & import from Spotify, Tidal, YouTube
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { ServiceConnection, ExternalPlaylist } from "../../models/modelsPlaylistManager";
import { MusicPlatform } from "../../models/modelsMusicPlatform";

// ══════════════════════════════════════════════════════════════
// Props
// ══════════════════════════════════════════════════════════════

export interface ServiceConnectorPanelProps {
    services: ServiceConnection[];
    externalPlaylists: ExternalPlaylist[];
    loadingPlaylists: boolean;
    onConnect: (platform: MusicPlatform) => void;
    onDisconnect: (platform: MusicPlatform) => void;
    onLoadPlaylists: (platform: MusicPlatform) => void;
    onImportPlaylist: (platform: MusicPlatform, externalPlaylistId: string) => void;
    onImportAll: (platform: MusicPlatform) => void;
    importing: boolean;
    activePlatform: MusicPlatform;
    onChangePlatform: (p: MusicPlatform) => void;
}

// ══════════════════════════════════════════════════════════════
// Platform metadata
// ══════════════════════════════════════════════════════════════

const PLATFORMS = [
    { platform: MusicPlatform.Spotify, icon: "🟢", label: "Spotify", color: "var(--source-spotify, #1DB954)", bgLight: "var(--source-spotify-bg, #1DB95418)" },
    { platform: MusicPlatform.Tidal, icon: "⬛", label: "Tidal", color: "var(--source-tidal, #000000)", bgLight: "var(--source-tidal-bg, #00000010)" },
    { platform: MusicPlatform.YouTube, icon: "🔴", label: "YouTube", color: "var(--source-youtube, #FF0000)", bgLight: "var(--source-youtube-bg, #FF000010)" },
];

// ══════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════

const ServiceConnectorPanel: React.FC<ServiceConnectorPanelProps> = ({
    services,
    externalPlaylists,
    loadingPlaylists,
    onConnect,
    onDisconnect,
    onLoadPlaylists,
    onImportPlaylist,
    onImportAll,
    importing,
    activePlatform,
    onChangePlatform,
}) => {
    const { t } = useTranslation();
    const [selectedExternal, setSelectedExternal] = useState<Set<string>>(new Set());

    const isConnected = useCallback(
        (p: MusicPlatform) => services.find((s) => s.platform === p)?.connected ?? false,
        [services],
    );

    const handleToggleSelect = useCallback(
        (id: string) => {
            setSelectedExternal((prev) => {
                const next = new Set(prev);
                next.has(id) ? next.delete(id) : next.add(id);
                return next;
            });
        },
        [],
    );

    const handleImportSelected = useCallback(() => {
        selectedExternal.forEach((id) => onImportPlaylist(activePlatform, id));
        setSelectedExternal(new Set());
    }, [selectedExternal, activePlatform, onImportPlaylist]);

    const btnStyle: React.CSSProperties = {
        border: "none",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: "0.82rem",
        fontWeight: 500,
        cursor: "pointer",
    };

    return (
        <div
            style={{
                border: "1px solid var(--border-color, #e5e7eb)",
                borderRadius: 12,
                background: "var(--card-bg, #fff)",
                overflow: "hidden",
            }}
        >
            {/* Platform tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border-color, #e5e7eb)" }}>
                {PLATFORMS.map((p) => {
                    const active = activePlatform === p.platform;
                    const connected = isConnected(p.platform);
                    return (
                        <button
                            key={p.platform}
                            style={{
                                ...btnStyle,
                                flex: 1,
                                borderRadius: 0,
                                background: active ? p.bgLight : "transparent",
                                borderBottom: active ? `3px solid ${p.color}` : "3px solid transparent",
                                color: active ? p.color : "var(--text-secondary, #6b7280)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 6,
                            }}
                            onClick={() => onChangePlatform(p.platform)}
                        >
                            <span>{p.icon}</span>
                            <span>{p.label}</span>
                            {connected && <span style={{ fontSize: "0.6rem", color: "var(--success, #22c55e)" }}>●</span>}
                        </button>
                    );
                })}
            </div>

            {/* Content for active platform */}
            <div style={{ padding: 16 }}>
                {!isConnected(activePlatform) ? (
                    /* Not connected */
                    <div style={{ textAlign: "center", padding: "24px 0" }}>
                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>
                            {PLATFORMS.find((p) => p.platform === activePlatform)?.icon}
                        </div>
                        <p style={{ fontSize: "0.85rem", opacity: 0.6, marginBottom: 16 }}>
                            {t("playlistManager.connectDesc", { platform: PLATFORMS.find((p) => p.platform === activePlatform)?.label })}
                        </p>
                        <button
                            style={{
                                ...btnStyle,
                                background: PLATFORMS.find((p) => p.platform === activePlatform)?.color,
                                color: "var(--btn-text, #fff)",
                            }}
                            onClick={() => onConnect(activePlatform)}
                        >
                            🔗 {t("playlistManager.connectBtn", { platform: PLATFORMS.find((p) => p.platform === activePlatform)?.label })}
                        </button>
                    </div>
                ) : (
                    /* Connected */
                    <div>
                        {/* Connection status */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ color: "var(--success, #22c55e)", fontSize: "0.8rem" }}>● {t("playlistManager.connected")}</span>
                                <span style={{ fontSize: "0.75rem", opacity: 0.5 }}>
                                    {services.find((s) => s.platform === activePlatform)?.username}
                                </span>
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    style={{ ...btnStyle, background: "var(--accent, #3b82f6)", color: "var(--btn-text, #fff)", padding: "6px 12px" }}
                                    onClick={() => onLoadPlaylists(activePlatform)}
                                    disabled={loadingPlaylists}
                                >
                                    {loadingPlaylists ? "⏳" : "🔄"} {t("playlistManager.loadPlaylists")}
                                </button>
                                <button
                                    style={{ ...btnStyle, background: "transparent", color: "var(--error, #ef4444)", border: "1px solid var(--error, #ef4444)", padding: "6px 12px" }}
                                    onClick={() => onDisconnect(activePlatform)}
                                >
                                    {t("playlistManager.disconnect")}
                                </button>
                            </div>
                        </div>

                        {/* External playlists */}
                        {loadingPlaylists && (
                            <div style={{ textAlign: "center", padding: 24, opacity: 0.5 }}>
                                <div className="animate-spin" style={{ width: 24, height: 24, border: "2px solid var(--accent)", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 8px" }} />
                                {t("playlistManager.loadingPlaylists")}
                            </div>
                        )}

                        {!loadingPlaylists && externalPlaylists.length === 0 && (
                            <div style={{ textAlign: "center", padding: 24, opacity: 0.4, fontSize: "0.85rem" }}>
                                {t("playlistManager.noExternalPlaylists")}
                            </div>
                        )}

                        {!loadingPlaylists && externalPlaylists.length > 0 && (
                            <>
                                {/* Bulk actions */}
                                <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
                                    <span style={{ fontSize: "0.78rem", opacity: 0.6 }}>
                                        {externalPlaylists.length} {t("playlistManager.playlistsFound")}
                                    </span>
                                    <div style={{ flex: 1 }} />
                                    {selectedExternal.size > 0 && (
                                        <button
                                            style={{ ...btnStyle, background: "var(--accent, #3b82f6)", color: "var(--btn-text, #fff)", padding: "6px 12px" }}
                                            onClick={handleImportSelected}
                                            disabled={importing}
                                        >
                                            📥 {t("playlistManager.importSelected")} ({selectedExternal.size})
                                        </button>
                                    )}
                                    <button
                                        style={{
                                            ...btnStyle,
                                            background: "transparent",
                                            color: "var(--accent, #3b82f6)",
                                            border: "1px solid var(--accent, #3b82f6)",
                                            padding: "6px 12px",
                                        }}
                                        onClick={() => onImportAll(activePlatform)}
                                        disabled={importing}
                                    >
                                        📦 {t("playlistManager.importAll")}
                                    </button>
                                </div>

                                {/* Playlist list */}
                                <div style={{ maxHeight: 360, overflow: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
                                    {externalPlaylists.map((ep) => {
                                        const isSelected = selectedExternal.has(ep.id);
                                        return (
                                            <div
                                                key={ep.id}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 10,
                                                    padding: "8px 12px",
                                                    borderRadius: 8,
                                                    border: isSelected ? "2px solid var(--accent, #3b82f6)" : "1px solid var(--border-color, #e5e7eb)",
                                                    cursor: "pointer",
                                                    background: isSelected ? "var(--accent-light, #eff6ff)" : "transparent",
                                                    transition: "all 0.15s",
                                                }}
                                                onClick={() => handleToggleSelect(ep.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleSelect(ep.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ cursor: "pointer" }}
                                                />
                                                {ep.coverUrl ? (
                                                    <img
                                                        src={ep.coverUrl}
                                                        alt={ep.name || t('common.coverArt', 'Cover art')}
                                                        style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0 }}
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 6,
                                                            background: "var(--surface-bg, #f3f4f6)",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            fontSize: "1.1rem",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        🎵
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontWeight: 600, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {ep.name}
                                                    </div>
                                                    <div style={{ fontSize: "0.72rem", opacity: 0.5 }}>
                                                        {ep.trackCount} {t("playlistManager.tracks")}
                                                        {ep.ownerName && ` · ${ep.ownerName}`}
                                                    </div>
                                                </div>
                                                <button
                                                    style={{
                                                        ...btnStyle,
                                                        background: "var(--accent, #3b82f6)",
                                                        color: "var(--btn-text, #fff)",
                                                        padding: "4px 10px",
                                                        fontSize: "0.72rem",
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onImportPlaylist(activePlatform, ep.id);
                                                    }}
                                                    disabled={importing}
                                                >
                                                    📥
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ServiceConnectorPanel;
