// VideoGamesCollectionPage.tsx — Video games collection (Steam/local)
import React, { useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    useVideoGamesQuery,
    useCreateVideoGameMutation,
    useDeleteVideoGameMutation,
    useImportSteamMutation,
    useImportVideoGamesJsonMutation,
} from "../../scripts/api/apiGames";
import { GamePlatform } from "../../models/modelsKaraoke";
import VideoGameCard from "../../components/games/VideoGameCard.tsx";
import SteamSearchPanel from "../../components/games/SteamSearchPanel";

type ViewMode = "grid" | "list";
type SortKey = "name" | "platform" | "players";

const VideoGamesCollectionPage: React.FC = () => {
    const { t } = useTranslation();

    const { data: games = [], isLoading } = useVideoGamesQuery();
    const deleteMutation = useDeleteVideoGameMutation();
    const createMutation = useCreateVideoGameMutation();
    const importSteamMutation = useImportSteamMutation();
    const importJsonMutation = useImportVideoGamesJsonMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const anyImporting = importSteamMutation.isPending || importJsonMutation.isPending;

    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [filterText, setFilterText] = useState("");
    const [showSteamPanel, setShowSteamPanel] = useState(false);
    const [showAddManual, setShowAddManual] = useState(false);

    const [manualName, setManualName] = useState("");
    const [manualPlatform, setManualPlatform] = useState<GamePlatform>(GamePlatform.PC);
    const [manualMinP, setManualMinP] = useState(1);
    const [manualMaxP, setManualMaxP] = useState(4);
    const [manualLocal, setManualLocal] = useState(true);
    const [manualOnline, setManualOnline] = useState(false);

    const existingSteamIds = useMemo(
        () => new Set(games.filter((g) => g.steamAppId != null).map((g) => g.steamAppId as number)),
        [games],
    );

    const sortedGames = useMemo(() => {
        let filtered = games;
        if (filterText.trim()) {
            const q = filterText.toLowerCase();
            filtered = games.filter(
                (g) =>
                    g.name?.toLowerCase().includes(q) ||
                    g.genre?.toLowerCase().includes(q),
            );
        }
        return [...filtered].sort((a, b) => {
            switch (sortKey) {
                case "name":
                    return (a.name ?? "").localeCompare(b.name ?? "");
                case "platform":
                    return (a.platform ?? 0) - (b.platform ?? 0);
                case "players":
                    return a.maxPlayers - b.maxPlayers;
                default:
                    return 0;
            }
        });
    }, [games, filterText, sortKey]);

    const handleImportSteam = useCallback(
        (steamAppId: number) => {
            importSteamMutation.mutate(steamAppId);
        },
        [importSteamMutation],
    );

    const handleAddManual = useCallback(() => {
        if (!manualName.trim()) return;
        createMutation.mutate(
            {
                name: manualName,
                platform: manualPlatform,
                minPlayers: manualMinP,
                maxPlayers: manualMaxP,
                isLocal: manualLocal,
                isOnline: manualOnline,
            },
            {
                onSuccess: () => {
                    setShowAddManual(false);
                    setManualName("");
                },
            },
        );
    }, [createMutation, manualName, manualPlatform, manualMinP, manualMaxP, manualLocal, manualOnline]);

    const handleDelete = useCallback(
        (id: number) => {
            if (window.confirm(t("videoGames.confirmDelete"))) {
                deleteMutation.mutate(id);
            }
        },
        [deleteMutation, t],
    );

    const handleExport = useCallback(() => {
        const text = JSON.stringify(games, null, 2);
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `video-games-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [games]);

    const handleTriggerImport = useCallback(() => {
        if (fileInputRef.current) fileInputRef.current.click();
    }, []);

    const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!window.confirm(t("boardGames.confirmImport"))) {
             e.target.value = "";
             return;
        }
        importJsonMutation.mutate(file, {
            onSuccess: () => { e.target.value = ""; },
            onError: () => { e.target.value = ""; }
        });
    }, [importJsonMutation, t]);

    const btnStyle = {
        background: "var(--accent-primary, #3b82f6)",
        color: "var(--btn-text, #fff)",
        border: "none",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: "0.9rem",
        cursor: "pointer",
        fontWeight: 600,
    };

    const outlineBtnStyle = {
        background: "transparent",
        border: "1px solid var(--border-secondary, #d1d5db)",
        color: "var(--text-primary)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: "0.9rem",
        cursor: "pointer",
    };

    const inputStyle = {
        background: "var(--input-bg, var(--card-bg, #fff))",
        borderColor: "var(--border-secondary, #d1d5db)",
        color: "var(--text-primary, #1f2937)",
    };

    return (
        <div className="p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{t("videoGames.title")}</h1>
                    <p className="text-sm opacity-60">
                        {games.length} {t("boardGames.games")} • {anyImporting ? t("boardGames.importing") : t("common.ready")}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowSteamPanel(!showSteamPanel)}
                        style={showSteamPanel ? btnStyle : outlineBtnStyle}
                    >
                        {showSteamPanel ? t("boardGames.closeBgg") : "🎮 " + t("videoGames.steamImport")}
                    </button>
                    <button onClick={() => setShowAddManual(!showAddManual)} style={outlineBtnStyle}>
                        ➕ {t("videoGames.addManual")}
                    </button>
                </div>
            </div>

            {showSteamPanel && (
                <SteamSearchPanel
                    onImportSingle={handleImportSteam}
                    importing={anyImporting}
                    existingSteamAppIds={existingSteamIds}
                />
            )}

            {showAddManual && (
                <div
                    className="p-4 rounded-xl border flex flex-col gap-4 animate-in fade-in slide-in-from-top-4"
                    style={{ background: "var(--surface-bg, #f9fafb)", borderColor: "var(--border-color, #e5e7eb)", maxWidth: 600 }}
                >
                    <h3 className="font-semibold">{t("videoGames.addManual")}</h3>
                    <div className="flex flex-col gap-3">
                        <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder={t("videoGames.titlePlaceholder")}
                            className="rounded-lg border px-3 py-2 text-sm"
                            style={inputStyle}
                        />
                        <div className="flex gap-2 flex-wrap">
                            <select
                                value={manualPlatform}
                                onChange={(e) => setManualPlatform(Number(e.target.value))}
                                className="rounded-lg border px-3 py-2 text-sm"
                                style={inputStyle}
                            >
                                <option value={GamePlatform.PC}>PC</option>
                                <option value={GamePlatform.PlayStation}>PlayStation</option>
                                <option value={GamePlatform.Xbox}>Xbox</option>
                                <option value={GamePlatform.NintendoSwitch}>Switch</option>
                                <option value={GamePlatform.Mobile}>Mobile</option>
                                <option value={GamePlatform.Web}>Web</option>
                            </select>

                            <div className="flex gap-2 items-center">
                                <label className="text-xs opacity-60">{t("videoGames.minPlayers")}:</label>
                                <input
                                    type="number"
                                    value={manualMinP}
                                    onChange={(e) => setManualMinP(Number(e.target.value))}
                                    min={1} max={99}
                                    className="w-16 rounded-lg border px-2 py-1 text-sm text-center"
                                    style={inputStyle}
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <label className="text-xs opacity-60">{t("videoGames.maxPlayers")}:</label>
                                <input
                                    type="number"
                                    value={manualMaxP}
                                    onChange={(e) => setManualMaxP(Number(e.target.value))}
                                    min={1} max={99}
                                    className="w-16 rounded-lg border px-2 py-1 text-sm text-center"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 text-sm items-center">
                            <label className="flex gap-2 items-center cursor-pointer">
                                <input type="checkbox" checked={manualLocal} onChange={e => setManualLocal(e.target.checked)} />
                                {t("videoGames.local")}
                            </label>
                            <label className="flex gap-2 items-center cursor-pointer">
                                <input type="checkbox" checked={manualOnline} onChange={e => setManualOnline(e.target.checked)} />
                                {t("videoGames.online")}
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button style={btnStyle} onClick={handleAddManual} disabled={!manualName.trim()}>
                            {t("common.save")}
                        </button>
                        <button style={outlineBtnStyle} onClick={() => setShowAddManual(false)}>
                            {t("common.cancel")}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input type="file" ref={fileInputRef} accept=".json" style={{display:"none"}} onChange={handleImportFile} />
                <button style={outlineBtnStyle} onClick={handleTriggerImport} title={t("videoGames.import")}>
                    📥
                </button>
                <button style={outlineBtnStyle} onClick={handleExport} title={t("videoGames.export")}>
                    📤
                </button>

                <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder={"🔍 " + t("videoGames.filterPlaceholder")}
                    className="rounded-lg border px-3 py-2 text-sm flex-1"
                    style={inputStyle}
                />

                <div className="flex gap-2 items-center">
                    <select
                        value={sortKey}
                        onChange={(e) => setSortKey(e.target.value as SortKey)}
                        className="rounded-lg border px-3 py-2 text-sm"
                        style={inputStyle}
                    >
                        <option value="name">{t("boardGames.sortName")}</option>
                        <option value="platform">{t("videoGames.platform")}</option>
                        <option value="players">{t("boardGames.sortPlayers")}</option>
                    </select>

                    <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-secondary, #d1d5db)" }}>
                        <button
                            onClick={() => setViewMode("grid")}
                            className="px-3 py-2 text-sm"
                            style={{
                                background: viewMode === "grid" ? "var(--accent-primary, #3b82f6)" : "transparent",
                                color: viewMode === "grid" ? "var(--btn-text, #fff)" : "var(--text-primary)",
                            }}
                        >
                            ◻
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className="px-3 py-2 text-sm"
                            style={{
                                background: viewMode === "list" ? "var(--accent-primary, #3b82f6)" : "transparent",
                                color: viewMode === "list" ? "var(--btn-text, #fff)" : "var(--text-primary)",
                            }}
                        >
                            ≡
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && (
                <div className="flex justify-center py-20 opacity-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: "var(--accent-primary, #3b82f6)" }} />
                </div>
            )}

            {!isLoading && sortedGames.length === 0 && (
                <div className="text-center py-20 opacity-40">
                    <div className="text-4xl mb-4">🎮</div>
                    <p>{t("videoGames.emptyState")}</p>
                </div>
            )}

            {!isLoading && sortedGames.length > 0 && (
                <div
                    className={
                        viewMode === "grid"
                            ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                            : "flex flex-col gap-2"
                    }
                >
                    {sortedGames.map((game) => (
                        <VideoGameCard
                            key={game.id}
                            game={game}
                            onDelete={handleDelete}
                            compact={viewMode === "list"}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VideoGamesCollectionPage;
