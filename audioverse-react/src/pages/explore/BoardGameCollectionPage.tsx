// BoardGameCollectionPage.tsx — Board game collection management
import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    useBoardGamesQuery,
    useCreateBoardGameMutation,
    useDeleteBoardGameMutation,
    useImportBggMutation,
    useImportBggBatchMutation,
    useImportBggCollectionMutation,
    useRefreshBggMutation,
    useImportBoardGamesJsonMutation,
    fetchBggSearch,
    fetchBggDetail,
} from "../../scripts/api/apiGames";
import type { BoardGame } from "../../models/modelsKaraoke";
import BoardGameCard from "../../components/games/BoardGameCard";
import BggSearchPanel from "../../components/games/BggSearchPanel";

type ViewMode = "grid" | "list";
type SortKey = "name" | "rating" | "year" | "players";

const BoardGameCollectionPage: React.FC = () => {
    const { t } = useTranslation();

    // ── Data ──
    const { data: games = [], isLoading } = useBoardGamesQuery();
    const deleteMutation = useDeleteBoardGameMutation();
    const createMutation = useCreateBoardGameMutation();
    const importSingleMutation = useImportBggMutation();
    const importBatchMutation = useImportBggBatchMutation();
    const importCollectionMutation = useImportBggCollectionMutation();
    const refreshMutation = useRefreshBggMutation();
    const importJsonMutation = useImportBoardGamesJsonMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const anyImporting =
        importSingleMutation.isPending ||
        importBatchMutation.isPending ||
        importCollectionMutation.isPending ||
        importJsonMutation.isPending;

    const handleExport = useCallback(() => {
        const text = JSON.stringify(games, null, 2);
        const blob = new Blob([text], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `board-games-${new Date().toISOString().slice(0, 10)}.json`;
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

    // ── UI state ──
    const [viewMode, setViewMode] = useState<ViewMode>("grid");
    const [sortKey, setSortKey] = useState<SortKey>("name");
    const [filterText, setFilterText] = useState("");
    const [showBggPanel, setShowBggPanel] = useState(false);
    const [showAddManual, setShowAddManual] = useState(false);

    // Manual add form
    const [manualName, setManualName] = useState("");
    const [manualMinP, setManualMinP] = useState(1);
    const [manualMaxP, setManualMaxP] = useState(4);
    const [manualDuration, setManualDuration] = useState(60);
    const [manualGenre, setManualGenre] = useState("");
    const [manualBggId, setManualBggId] = useState<number | null>(null);
    const [manualSuggestions, setManualSuggestions] = useState<BoardGame[]>([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // ── Derived ──
    const existingBggIds = useMemo(
        () => new Set(games.filter((g) => g.bggId != null).map((g) => g.bggId as number)),
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
                case "rating":
                    return (b.bggRating ?? 0) - (a.bggRating ?? 0);
                case "year":
                    return (b.bggYearPublished ?? 0) - (a.bggYearPublished ?? 0);
                case "players":
                    return a.maxPlayers - b.maxPlayers;
                default:
                    return 0;
            }
        });
    }, [games, filterText, sortKey]);

    // ── Handlers ──
    const handleDelete = useCallback(
        (id: number) => {
            if (window.confirm(t("boardGames.confirmDelete"))) {
                deleteMutation.mutate(id);
            }
        },
        [deleteMutation, t],
    );

    const handleRefresh = useCallback(
        (id: number) => refreshMutation.mutate(id),
        [refreshMutation],
    );

    const handleImportSingle = useCallback(
        (bggId: number) => importSingleMutation.mutate(bggId),
        [importSingleMutation],
    );

    const handleImportBatch = useCallback(
        (bggIds: number[]) => importBatchMutation.mutate(bggIds),
        [importBatchMutation],
    );

    const handleImportCollection = useCallback(
        (username: string) => importCollectionMutation.mutate(username),
        [importCollectionMutation],
    );

    const handleAddManual = useCallback(() => {
        if (!manualName.trim()) return;
        createMutation.mutate(
            {
                name: manualName.trim(),
                bggId: manualBggId,
                minPlayers: manualMinP,
                maxPlayers: manualMaxP,
                estimatedDurationMinutes: manualDuration,
                genre: manualGenre.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setManualName("");
                    setManualGenre("");
                    setManualBggId(null);
                    setManualSuggestions([]);
                    setShowAddManual(false);
                },
            },
        );
    }, [createMutation, manualName, manualBggId, manualMinP, manualMaxP, manualDuration, manualGenre]);

    useEffect(() => {
        if (!showAddManual) return;
        const query = manualName.trim();

        if (query.length < 2) {
            setManualSuggestions([]);
            setSuggestionsLoading(false);
            return;
        }

        const timeout = window.setTimeout(async () => {
            setSuggestionsLoading(true);
            try {
                const results = await fetchBggSearch(query);
                setManualSuggestions((results ?? []).slice(0, 6));
            } catch {
                /* Expected: BGG search API may fail; UI shows empty suggestions */
                setManualSuggestions([]);
            } finally {
                setSuggestionsLoading(false);
            }
        }, 300);

        return () => window.clearTimeout(timeout);
    }, [manualName, showAddManual]);

    const handlePickSuggestion = useCallback(async (candidate: BoardGame) => {
        const candidateId = candidate.bggId ?? candidate.id;
        setManualName(candidate.name?.trim() || "");
        setManualBggId(candidateId ?? null);
        setManualSuggestions([]);

        if (!candidateId) return;

        try {
            const details = await fetchBggDetail(candidateId);
            const detailObj = details as unknown as {
                name?: string | null;
                minPlayers?: number | null;
                maxPlayers?: number | null;
                estimatedDurationMinutes?: number | null;
                playingTimeMinutes?: number | null;
                genre?: string | null;
                categories?: string[] | null;
            };

            if (detailObj.name?.trim()) setManualName(detailObj.name.trim());
            if (detailObj.minPlayers && detailObj.minPlayers > 0) setManualMinP(detailObj.minPlayers);
            if (detailObj.maxPlayers && detailObj.maxPlayers > 0) setManualMaxP(detailObj.maxPlayers);

            const duration = detailObj.estimatedDurationMinutes ?? detailObj.playingTimeMinutes;
            if (duration && duration > 0) setManualDuration(duration);

            const nextGenre = detailObj.genre?.trim() || detailObj.categories?.slice(0, 2).join(", ") || "";
            if (nextGenre) setManualGenre(nextGenre);
        } catch {
            // Keep lightweight fallback from search result only
        }
    }, []);

    // ── Stats ──
    const totalGames = games.length;
    const avgRating = useMemo(() => {
        const rated = games.filter((g) => g.bggRating != null && g.bggRating > 0);
        if (rated.length === 0) return 0;
        return rated.reduce((s, g) => s + (g.bggRating ?? 0), 0) / rated.length;
    }, [games]);

    // ── Styles ──
    const btnStyle = {
        background: "var(--accent, #3b82f6)",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: "0.85rem",
        fontWeight: 500,
        cursor: "pointer" as const,
    };

    const outlineBtnStyle = {
        background: "transparent",
        color: "var(--accent, #3b82f6)",
        border: "1px solid var(--accent, #3b82f6)",
        borderRadius: 8,
        padding: "8px 16px",
        fontSize: "0.85rem",
        fontWeight: 500,
        cursor: "pointer" as const,
    };

    const inputStyle = {
        background: "var(--input-bg, #f9fafb)",
        borderColor: "var(--border-color, #d1d5db)",
        color: "var(--text-primary, #1f2937)",
    };

    return (
        <div className="w-full mx-auto p-4 space-y-6" style={{ maxWidth: 1200, color: "var(--text-primary, #1f2937)" }}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold">🎲 {t("boardGames.collection")}</h1>
                    <p className="text-sm opacity-60 mt-1">
                        {t("boardGames.totalGames", { count: totalGames })}
                        {avgRating > 0 && ` · ${t("boardGames.avgRating")}: ⭐${avgRating.toFixed(1)}`}
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button style={btnStyle} onClick={() => setShowBggPanel(!showBggPanel)}>
                        {showBggPanel ? t("boardGames.closeBgg") : "🌐 " + t("boardGames.bggImport")}
                    </button>
                    <button style={outlineBtnStyle} onClick={() => setShowAddManual(!showAddManual)}>
                        ➕ {t("boardGames.addManual")}
                    </button>
                </div>
            </div>

            {/* BGG Import Panel */}
            {showBggPanel && (
                <BggSearchPanel
                    onImportSingle={handleImportSingle}
                    onImportBatch={handleImportBatch}
                    onImportCollection={handleImportCollection}
                    importing={anyImporting}
                    existingBggIds={existingBggIds}
                />
            )}

            {/* Manual Add Form */}
            {showAddManual && (
                <div
                    className="rounded-xl border p-4 space-y-3"
                    style={{ background: "var(--card-bg, #fff)", borderColor: "var(--border-color, #e5e7eb)" }}
                >
                    <h3 className="font-semibold text-sm">{t("boardGames.addManual")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            type="text"
                            value={manualName}
                            onChange={(e) => {
                                setManualName(e.target.value);
                                setManualBggId(null);
                            }}
                            placeholder={t("boardGames.gameName")}
                            className="rounded-lg border px-3 py-2 text-sm"
                            style={inputStyle}
                        />
                        <div className="sm:col-span-2 -mt-1">
                            {suggestionsLoading && (
                                <p className="text-xs opacity-60">{t("boardGames.loadingSuggestions")}</p>
                            )}
                            {!suggestionsLoading && manualName.trim().length >= 2 && manualSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {manualSuggestions.map((candidate) => {
                                        const candidateId = candidate.bggId ?? candidate.id;
                                        const label = candidate.name?.trim() || t("boardGames.untitled");
                                        return (
                                            <button
                                                key={`${candidateId}-${label}`}
                                                type="button"
                                                onClick={() => handlePickSuggestion(candidate)}
                                                className="text-xs rounded border px-2 py-1"
                                                style={{
                                                    background: "var(--surface-bg, #f3f4f6)",
                                                    borderColor: "var(--border-color, #d1d5db)",
                                                    color: "var(--text-primary, #1f2937)",
                                                }}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {!suggestionsLoading && manualName.trim().length >= 2 && manualSuggestions.length === 0 && (
                                <p className="text-xs opacity-60">{t("boardGames.noSuggestions")}</p>
                            )}
                        </div>
                        <input
                            type="text"
                            value={manualGenre}
                            onChange={(e) => setManualGenre(e.target.value)}
                            placeholder={t("boardGames.genre")}
                            className="rounded-lg border px-3 py-2 text-sm"
                            style={inputStyle}
                        />
                        <div className="flex gap-2 items-center">
                            <label className="text-xs opacity-60">{t("boardGames.players")}:</label>
                            <input
                                type="number"
                                value={manualMinP}
                                onChange={(e) => setManualMinP(Number(e.target.value))}
                                min={1}
                                max={99}
                                className="w-16 rounded-lg border px-2 py-1 text-sm text-center"
                                style={inputStyle}
                            />
                            <span>–</span>
                            <input
                                type="number"
                                value={manualMaxP}
                                onChange={(e) => setManualMaxP(Number(e.target.value))}
                                min={1}
                                max={99}
                                className="w-16 rounded-lg border px-2 py-1 text-sm text-center"
                                style={inputStyle}
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            <label className="text-xs opacity-60">{t("boardGames.duration")}:</label>
                            <input
                                type="number"
                                value={manualDuration}
                                onChange={(e) => setManualDuration(Number(e.target.value))}
                                min={1}
                                className="w-20 rounded-lg border px-2 py-1 text-sm text-center"
                                style={inputStyle}
                            />
                            <span className="text-xs opacity-50">min</span>
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

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    style={{ display: "none" }}
                    onChange={handleImportFile}
                />
                <button style={outlineBtnStyle} onClick={handleTriggerImport} title={t("boardGames.import")}>
                    📥
                </button>
                <button style={outlineBtnStyle} onClick={handleExport} title={t("boardGames.export")}>
                    📤
                </button>

                <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder={"🔍 " + t("boardGames.filterPlaceholder")}
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
                        <option value="rating">{t("boardGames.sortRating")}</option>
                        <option value="year">{t("boardGames.sortYear")}</option>
                        <option value="players">{t("boardGames.sortPlayers")}</option>
                    </select>
                    <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border-color, #d1d5db)" }}>
                        <button
                            onClick={() => setViewMode("grid")}
                            className="px-3 py-2 text-sm"
                            style={{
                                background: viewMode === "grid" ? "var(--accent, #3b82f6)" : "transparent",
                                color: viewMode === "grid" ? "#fff" : "var(--text-primary)",
                            }}
                        >
                            ◻
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className="px-3 py-2 text-sm"
                            style={{
                                background: viewMode === "list" ? "var(--accent, #3b82f6)" : "transparent",
                                color: viewMode === "list" ? "#fff" : "var(--text-primary)",
                            }}
                        >
                            ≡
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12 opacity-50">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2" style={{ borderColor: "var(--accent, #3b82f6)" }} />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && games.length === 0 && (
                <div className="text-center py-16 space-y-3 opacity-60">
                    <div className="text-5xl">🎲</div>
                    <p className="text-lg font-medium">{t("boardGames.emptyTitle")}</p>
                    <p className="text-sm">{t("boardGames.emptyDesc")}</p>
                </div>
            )}

            {/* Grid / List of games */}
            {!isLoading && sortedGames.length > 0 && viewMode === "grid" && (
                <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                    {sortedGames.map((game) => (
                        <BoardGameCard
                            key={game.id}
                            game={game}
                            onDelete={handleDelete}
                            onRefresh={handleRefresh}
                        />
                    ))}
                </div>
            )}

            {!isLoading && sortedGames.length > 0 && viewMode === "list" && (
                <div className="space-y-2">
                    {sortedGames.map((game) => (
                        <BoardGameListRow
                            key={game.id}
                            game={game}
                            onDelete={handleDelete}
                            onRefresh={handleRefresh}
                        />
                    ))}
                </div>
            )}

            {/* No results after filtering */}
            {!isLoading && games.length > 0 && sortedGames.length === 0 && filterText.trim() && (
                <p className="text-center py-8 opacity-50 text-sm">{t("boardGames.noResults")}</p>
            )}
        </div>
    );
};

// ── List row sub-component ──

const BoardGameListRow: React.FC<{
    game: BoardGame;
    onDelete: (id: number) => void;
    onRefresh: (id: number) => void;
}> = ({ game, onDelete, onRefresh }) => {
    const { t } = useTranslation();
    const img = game.bggImageUrl || game.imageKey;

    return (
        <div
            className="flex items-center gap-4 px-4 py-3 rounded-xl border hover:opacity-90 transition-opacity"
            style={{ background: "var(--card-bg, #fff)", borderColor: "var(--border-color, #e5e7eb)" }}
        >
            {img ? (
                <img src={img} alt={game.name ?? ""} className="w-14 h-14 rounded-lg object-cover shrink-0" loading="lazy" />
            ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center text-2xl shrink-0" style={{ background: "var(--surface-bg, #f3f4f6)" }}>
                    🎲
                </div>
            )}
            <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm truncate block">{game.name ?? t("boardGames.untitled")}</span>
                <div className="flex gap-3 text-xs opacity-60 mt-0.5">
                    <span>👥 {game.minPlayers}–{game.maxPlayers}</span>
                    {game.estimatedDurationMinutes && <span>⏱ {game.estimatedDurationMinutes} min</span>}
                    {game.bggYearPublished && <span>{game.bggYearPublished}</span>}
                    {game.bggRating != null && game.bggRating > 0 && <span>⭐ {game.bggRating.toFixed(1)}</span>}
                    {game.genre && <span>{game.genre}</span>}
                </div>
            </div>
            <div className="flex gap-2 shrink-0">
                {game.bggId && (
                    <button
                        onClick={() => onRefresh(game.id)}
                        className="text-xs px-2 py-1 rounded border"
                        style={{ borderColor: "var(--border-color, #d1d5db)", color: "var(--text-secondary, #6b7280)" }}
                        title={t("boardGames.refreshBgg")}
                    >
                        🔄
                    </button>
                )}
                <button
                    onClick={() => onDelete(game.id)}
                    className="text-xs px-2 py-1 rounded border"
                    style={{ borderColor: "#f87171", color: "#ef4444" }}
                    title={t("common.delete")}
                >
                    🗑
                </button>
            </div>
        </div>
    );
};

export default BoardGameCollectionPage;
