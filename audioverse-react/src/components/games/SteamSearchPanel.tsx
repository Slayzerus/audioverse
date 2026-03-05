// SteamSearchPanel.tsx — Search Steam and import games into collection
import React, { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { VideoGame } from "../../models/modelsKaraoke";
import {
    fetchSteamSearch,
    fetchPlatformAuthUrl,
    useUserConnectionsQuery,
} from "../../scripts/api/apiGames";

// ── Small sub-components ──

const Spinner: React.FC = () => (
    <div className="flex items-center justify-center py-8 opacity-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--accent, #3b82f6)" }} />
    </div>
);

// ── Types ──

interface SteamSearchPanelProps {
    /** Called when the user wants to import a single Steam game by steamAppId */
    onImportSingle: (steamAppId: number) => void;
    /** Whether any import is in progress */
    importing?: boolean;
    /** Set of already-imported steamAppIds (to dim/disable import buttons) */
    existingSteamAppIds?: Set<number>;
}

// ── Main Component ──

const SteamSearchPanel: React.FC<SteamSearchPanelProps> = ({
    onImportSingle,
    importing = false,
    existingSteamAppIds = new Set(),
}) => {
    const { t } = useTranslation();

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<VideoGame[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [_selectedDetail, setSelectedDetail] = useState<VideoGame | null>(null);
    const [_detailLoading] = useState(false);
    const [connectLoading, setConnectLoading] = useState(false);
    const [connectError, setConnectError] = useState("");

    const { data: connections = [] } = useUserConnectionsQuery();

    const steamConnected = useMemo(
        () => connections.some((connection) =>
            String(connection.platform ?? "").toLowerCase() === "steam" && connection.connected !== false,
        ),
        [connections],
    );

    // ── Handlers ──

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSelectedDetail(null);
        try {
            const results = await fetchSteamSearch(searchQuery.trim());
            setSearchResults(results || []);
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery]);

    const handleConnectSteam = useCallback(async () => {
        setConnectError("");
        setConnectLoading(true);
        try {
            const redirectUri = `${window.location.origin}${window.location.pathname}`;
            const authUrl = await fetchPlatformAuthUrl("steam", redirectUri);
            if (!authUrl) {
                setConnectError(t("videoGames.connectSteamError"));
                return;
            }
            window.location.assign(authUrl);
        } catch {
            setConnectError(t("videoGames.connectSteamError"));
        } finally {
            setConnectLoading(false);
        }
    }, [t]);


    return (
        <div
            className="rounded-xl border p-4 space-y-4"
            style={{ background: "var(--card-bg, #fff)", borderColor: "var(--border-color, #e5e7eb)", maxWidth: 600 }}
        >
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <span>🎮</span>
                {t("videoGames.steamImport")}
            </h2>

            <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--border-color, #e5e7eb)", background: "var(--surface-bg, #f9fafb)" }}>
                <p className="mb-2">
                    {steamConnected ? t("videoGames.steamConnected") : t("videoGames.connectSteamPrompt")}
                </p>
                {!steamConnected && (
                    <button
                        type="button"
                        onClick={handleConnectSteam}
                        disabled={connectLoading}
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{ background: "var(--accent, #3b82f6)", color: "#fff", opacity: connectLoading ? 0.6 : 1 }}
                    >
                        {connectLoading ? "..." : t("videoGames.connectSteam")}
                    </button>
                )}
                <p className="mt-2 opacity-70 text-xs">{t("videoGames.steamImportScope")}</p>
                {connectError && <p className="mt-2 text-xs" style={{ color: "var(--danger, #dc2626)" }}>{connectError}</p>}
            </div>

            {/* Search Input */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    placeholder={t("videoGames.searchSteam") + "..."}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    style={{
                        background: "var(--input-bg, #f9fafb)",
                        borderColor: "var(--border-color, #d1d5db)",
                        color: "var(--text-primary, #1f2937)",
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={searchLoading || !searchQuery.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                    style={{
                        background: "var(--accent, #3b82f6)",
                        color: "#fff",
                        opacity: searchLoading || !searchQuery.trim() ? 0.5 : 1,
                    }}
                >
                    {searchLoading ? "..." : "🔍"}
                </button>
            </div>

            {/* Results */}
            {searchLoading && <Spinner />}

            {!searchLoading && searchResults.length > 0 && (
                <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {searchResults.map((game) => {
                        // Assuming API returns steamAppId in the result (it should)
                        const steamAppId = game.steamAppId || game.id; 
                        const gameName = game.name ?? "Unknown";
                        const alreadyOwned = existingSteamAppIds.has(steamAppId);
                        
                        return (
                            <div
                                key={steamAppId}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                style={{
                                    background: alreadyOwned
                                        ? "var(--success-bg, #dcfce7)"
                                        : "var(--surface-bg, #f3f4f6)",
                                    opacity: alreadyOwned ? 0.7 : 1,
                                    border: "1px solid var(--border-color, #e5e7eb)"
                                }}
                            >
                                {/* Thumbnail */}
                                {game.steamHeaderImageUrl ? (
                                    <img 
                                        src={game.steamHeaderImageUrl} 
                                        alt={game.name || t('steam.gameImage', 'Game header image')} 
                                        className="w-16 h-10 object-cover rounded bg-gray-200"
                                    />
                                ) : (
                                    <div className="w-16 h-10 flex items-center justify-center bg-gray-200 rounded text-xs opacity-50">
                                        IMG
                                    </div>
                                )}

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm truncate" title={gameName}>{gameName}</h4>
                                    <div className="text-xs opacity-60 flex gap-2">
                                        <span>AppID: {steamAppId}</span>
                                    </div>
                                </div>

                                {/* Action */}
                                <button
                                    onClick={() => onImportSingle(steamAppId)}
                                    disabled={importing || alreadyOwned}
                                    className="text-xs px-3 py-1.5 rounded-md font-medium border transition-all active:scale-95"
                                    style={{
                                        background: "var(--card-bg, #fff)",
                                        borderColor: alreadyOwned ? "transparent" : "var(--accent, #3b82f6)",
                                        color: alreadyOwned ? "var(--text-secondary, #6b7280)" : "var(--accent, #3b82f6)",
                                    }}
                                >
                                    {alreadyOwned ? "✓" : "+ " + t("common.add")}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            {!searchLoading && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-8 text-sm opacity-50">
                    {t("videoGames.noResults")}
                </div>
            )}
        </div>
    );
};

export default SteamSearchPanel;
