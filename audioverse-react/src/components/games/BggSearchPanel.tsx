// BggSearchPanel.tsx — Search BGG and import games into collection
import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import type { BggSearchResult, BggGameDetails, BggCollectionItem, BggHotGame } from "../../models/modelsKaraoke";
import {
    fetchBggSearch,
    fetchBggDetail,
    fetchBggHot,
    fetchBggCollection,
} from "../../scripts/api/apiGames";

// ── Small sub-components ──

const Spinner: React.FC = () => (
    <div className="flex items-center justify-center py-8 opacity-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "var(--accent, #3b82f6)" }} />
    </div>
);

// ── Types ──

type Tab = "search" | "hot" | "collection";

interface BggSearchPanelProps {
    /** Called when the user wants to import a single BGG game by bggId */
    onImportSingle: (bggId: number) => void;
    /** Called when the user wants to import multiple BGG games */
    onImportBatch: (bggIds: number[]) => void;
    /** Called when the user wants to import an entire BGG collection */
    onImportCollection: (username: string) => void;
    /** Whether any import is in progress */
    importing?: boolean;
    /** Set of already-imported bggIds (to dim/disable import buttons) */
    existingBggIds?: Set<number>;
}

// ── Main Component ──

const BggSearchPanel: React.FC<BggSearchPanelProps> = ({
    onImportSingle,
    onImportBatch,
    onImportCollection,
    importing = false,
    existingBggIds = new Set(),
}) => {
    const { t } = useTranslation();

    // Tab state
    const [tab, setTab] = useState<Tab>("search");

    // Search tab
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<BggSearchResult[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedDetail, setSelectedDetail] = useState<BggGameDetails | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Hot tab
    const [hotGames, setHotGames] = useState<BggHotGame[]>([]);
    const [hotLoading, setHotLoading] = useState(false);
    const [hotLoaded, setHotLoaded] = useState(false);

    // Collection tab
    const [bggUsername, setBggUsername] = useState("");
    const [collectionItems, setCollectionItems] = useState<BggCollectionItem[]>([]);
    const [collectionLoading, setCollectionLoading] = useState(false);

    // Multi-select for batch import
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // ── Handlers ──

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setSearchLoading(true);
        setSelectedDetail(null);
        try {
            const results = await fetchBggSearch(searchQuery.trim());
            // Map the response — it may come as BoardGame[] or BggSearchResult[]
            setSearchResults(
                (results ?? []).map((r: unknown) => {
                    const obj = r as Record<string, unknown>;
                    return {
                        bggId: (obj.bggId ?? obj.id ?? 0) as number,
                        name: (obj.name ?? "") as string,
                        yearPublished: (obj.bggYearPublished ?? obj.yearPublished ?? null) as number | null,
                    };
                }),
            );
        } catch {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    }, [searchQuery]);

    const handleOpenDetail = useCallback(async (bggId: number) => {
        setDetailLoading(true);
        try {
            const detail = await fetchBggDetail(bggId) as unknown as BggGameDetails;
            setSelectedDetail(detail);
        } catch {
            setSelectedDetail(null);
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const handleLoadHot = useCallback(async () => {
        if (hotLoaded) return;
        setHotLoading(true);
        try {
            const data = await fetchBggHot();
            setHotGames(data);
            setHotLoaded(true);
        } catch {
            setHotGames([]);
        } finally {
            setHotLoading(false);
        }
    }, [hotLoaded]);

    const handleLoadCollection = useCallback(async () => {
        if (!bggUsername.trim()) return;
        setCollectionLoading(true);
        try {
            const data = await fetchBggCollection(bggUsername.trim());
            setCollectionItems(data);
        } catch {
            setCollectionItems([]);
        } finally {
            setCollectionLoading(false);
        }
    }, [bggUsername]);

    const toggleSelect = (bggId: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(bggId)) next.delete(bggId);
            else next.add(bggId);
            return next;
        });
    };

    const handleImportSelected = () => {
        if (selectedIds.size === 0) return;
        onImportBatch(Array.from(selectedIds));
        setSelectedIds(new Set());
    };

    // ── Tab button style ──
    const tabBtn = (active: boolean) => ({
        padding: "8px 16px",
        fontSize: "0.85rem",
        fontWeight: active ? 600 : 400,
        borderBottom: active ? "2px solid var(--accent, #3b82f6)" : "2px solid transparent",
        background: "none",
        color: active ? "var(--accent, #3b82f6)" : "var(--text-secondary, #6b7280)",
        cursor: "pointer" as const,
    });

    return (
        <div
            className="rounded-xl border p-4 space-y-4"
            style={{ background: "var(--card-bg, #fff)", borderColor: "var(--border-color, #e5e7eb)" }}
        >
            <h2 className="text-lg font-semibold">{t("boardGames.bggImport")}</h2>

            {/* Tabs */}
            <div className="flex gap-1 border-b" style={{ borderColor: "var(--border-color, #e5e7eb)" }}>
                <button style={tabBtn(tab === "search")} onClick={() => setTab("search")}>
                    🔍 {t("boardGames.search")}
                </button>
                <button
                    style={tabBtn(tab === "hot")}
                    onClick={() => {
                        setTab("hot");
                        handleLoadHot();
                    }}
                >
                    🔥 {t("boardGames.hot")}
                </button>
                <button style={tabBtn(tab === "collection")} onClick={() => setTab("collection")}>
                    📦 {t("boardGames.bggCollection")}
                </button>
            </div>

            {/* ── Search Tab ── */}
            {tab === "search" && (
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            placeholder={t("boardGames.searchPlaceholder")}
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
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{
                                background: "var(--accent, #3b82f6)",
                                color: "#fff",
                                opacity: searchLoading || !searchQuery.trim() ? 0.5 : 1,
                            }}
                        >
                            {searchLoading ? "..." : t("boardGames.search")}
                        </button>
                    </div>

                    {searchLoading && <Spinner />}

                    {/* Search Results */}
                    {!searchLoading && searchResults.length > 0 && (
                        <div className="space-y-1 max-h-80 overflow-y-auto">
                            {searchResults.map((r) => {
                                const alreadyOwned = existingBggIds.has(r.bggId);
                                return (
                                    <div
                                        key={r.bggId}
                                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:opacity-80"
                                        style={{
                                            background: alreadyOwned
                                                ? "var(--success-bg, #dcfce7)"
                                                : "var(--surface-bg, #f3f4f6)",
                                            opacity: alreadyOwned ? 0.7 : 1,
                                        }}
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(r.bggId)}
                                                onChange={() => toggleSelect(r.bggId)}
                                                disabled={alreadyOwned}
                                            />
                                            <button
                                                className="text-sm font-medium truncate text-left"
                                                onClick={() => handleOpenDetail(r.bggId)}
                                                style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer" }}
                                            >
                                                {r.name}
                                            </button>
                                            {r.yearPublished && (
                                                <span className="text-xs opacity-50 shrink-0">({r.yearPublished})</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onImportSingle(r.bggId)}
                                            disabled={importing || alreadyOwned}
                                            className="text-xs px-2 py-1 rounded border shrink-0 ml-2"
                                            style={{
                                                borderColor: "var(--accent, #3b82f6)",
                                                color: alreadyOwned ? "var(--text-secondary)" : "var(--accent, #3b82f6)",
                                            }}
                                        >
                                            {alreadyOwned ? "✓" : "+ " + t("boardGames.import")}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Batch import for selected */}
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleImportSelected}
                            disabled={importing}
                            className="px-4 py-2 rounded-lg text-sm font-medium w-full"
                            style={{ background: "var(--accent, #3b82f6)", color: "#fff" }}
                        >
                            {t("boardGames.importSelected")} ({selectedIds.size})
                        </button>
                    )}

                    {/* Detail panel */}
                    {detailLoading && <Spinner />}
                    {selectedDetail && !detailLoading && (
                        <BggDetailCard detail={selectedDetail} onImport={onImportSingle} importing={importing} exists={existingBggIds.has(selectedDetail.bggId)} />
                    )}
                </div>
            )}

            {/* ── Hot Tab ── */}
            {tab === "hot" && (
                <div className="space-y-2">
                    {hotLoading && <Spinner />}
                    {!hotLoading && hotGames.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {hotGames.map((g) => {
                                const alreadyOwned = existingBggIds.has(g.bggId);
                                return (
                                    <div
                                        key={g.bggId}
                                        className="rounded-lg border overflow-hidden flex flex-col"
                                        style={{
                                            background: "var(--surface-bg, #f9fafb)",
                                            borderColor: "var(--border-color, #e5e7eb)",
                                            opacity: alreadyOwned ? 0.6 : 1,
                                        }}
                                    >
                                        {g.thumbnailUrl && (
                                            <img src={g.thumbnailUrl} alt={g.name} className="w-full h-24 object-cover" loading="lazy" />
                                        )}
                                        <div className="p-2 flex flex-col gap-1 flex-1">
                                            <span className="text-xs font-semibold truncate" title={g.name}>
                                                #{g.rank} {g.name}
                                            </span>
                                            {g.yearPublished && <span className="text-xs opacity-50">{g.yearPublished}</span>}
                                            <button
                                                onClick={() => onImportSingle(g.bggId)}
                                                disabled={importing || alreadyOwned}
                                                className="text-xs px-2 py-1 mt-auto rounded border"
                                                style={{
                                                    borderColor: "var(--accent, #3b82f6)",
                                                    color: alreadyOwned ? "var(--text-secondary)" : "var(--accent, #3b82f6)",
                                                }}
                                            >
                                                {alreadyOwned ? "✓ " + t("boardGames.inCollection") : "+ " + t("boardGames.import")}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {!hotLoading && hotGames.length === 0 && hotLoaded && (
                        <p className="text-sm opacity-50 text-center py-4">{t("boardGames.noResults")}</p>
                    )}
                </div>
            )}

            {/* ── Collection Tab ── */}
            {tab === "collection" && (
                <div className="space-y-3">
                    <p className="text-xs opacity-60">{t("boardGames.bggCollectionDesc")}</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={bggUsername}
                            onChange={(e) => setBggUsername(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleLoadCollection()}
                            placeholder={t("boardGames.bggUsernamePlaceholder")}
                            className="flex-1 rounded-lg border px-3 py-2 text-sm"
                            style={{
                                background: "var(--input-bg, #f9fafb)",
                                borderColor: "var(--border-color, #d1d5db)",
                                color: "var(--text-primary, #1f2937)",
                            }}
                        />
                        <button
                            onClick={handleLoadCollection}
                            disabled={collectionLoading || !bggUsername.trim()}
                            className="px-4 py-2 rounded-lg text-sm font-medium"
                            style={{
                                background: "var(--accent, #3b82f6)",
                                color: "#fff",
                                opacity: collectionLoading || !bggUsername.trim() ? 0.5 : 1,
                            }}
                        >
                            {collectionLoading ? "..." : t("boardGames.load")}
                        </button>
                    </div>

                    {collectionLoading && <Spinner />}

                    {!collectionLoading && collectionItems.length > 0 && (
                        <>
                            <div className="space-y-1 max-h-80 overflow-y-auto">
                                {collectionItems.map((item) => {
                                    const alreadyOwned = existingBggIds.has(item.bggId);
                                    return (
                                        <div
                                            key={item.bggId}
                                            className="flex items-center gap-3 px-3 py-2 rounded-lg"
                                            style={{
                                                background: alreadyOwned
                                                    ? "var(--success-bg, #dcfce7)"
                                                    : "var(--surface-bg, #f3f4f6)",
                                            }}
                                        >
                                            {item.thumbnailUrl && (
                                                <img src={item.thumbnailUrl} alt={item.name} className="w-10 h-10 rounded object-cover shrink-0" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium truncate block">{item.name}</span>
                                                <span className="text-xs opacity-50">
                                                    {item.yearPublished && `${item.yearPublished} · `}
                                                    {item.numPlays != null && `${item.numPlays} plays`}
                                                    {item.userRating != null && item.userRating > 0 && ` · ⭐${item.userRating}`}
                                                </span>
                                            </div>
                                            <span className="text-xs opacity-50 shrink-0">
                                                {alreadyOwned ? "✓" : ""}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <button
                                onClick={() => onImportCollection(bggUsername.trim())}
                                disabled={importing}
                                className="px-4 py-2 rounded-lg text-sm font-medium w-full"
                                style={{ background: "var(--accent, #3b82f6)", color: "#fff" }}
                            >
                                {t("boardGames.importEntireCollection")} ({collectionItems.length})
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

// ── BGG Detail Card sub-component ──

const BggDetailCard: React.FC<{
    detail: BggGameDetails;
    onImport: (bggId: number) => void;
    importing: boolean;
    exists: boolean;
}> = ({ detail, onImport, importing, exists }) => {
    const { t } = useTranslation();

    return (
        <div
            className="rounded-xl border p-4 flex gap-4"
            style={{ background: "var(--surface-bg, #f9fafb)", borderColor: "var(--border-color, #e5e7eb)" }}
        >
            {detail.imageUrl && (
                <img src={detail.imageUrl} alt={detail.name} className="w-28 h-36 rounded-lg object-cover shrink-0" />
            )}
            <div className="flex flex-col gap-1 flex-1 min-w-0">
                <h3 className="font-semibold">{detail.name}</h3>
                {detail.yearPublished && <span className="text-xs opacity-50">{detail.yearPublished}</span>}
                <div className="flex flex-wrap gap-3 text-xs opacity-70 mt-1">
                    {detail.minPlayers != null && detail.maxPlayers != null && (
                        <span>👥 {detail.minPlayers}–{detail.maxPlayers}</span>
                    )}
                    {detail.playingTimeMinutes != null && <span>⏱ {detail.playingTimeMinutes} min</span>}
                    {detail.minAge != null && <span>🎂 {detail.minAge}+</span>}
                    {detail.weight != null && <span>⚖ {detail.weight.toFixed(1)}/5</span>}
                </div>
                {detail.averageRating != null && (
                    <span className="text-sm mt-1">⭐ {detail.averageRating.toFixed(2)} ({detail.usersRated ?? 0} ratings)</span>
                )}
                {(detail.categories?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                        {detail.categories!.map((c) => (
                            <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--tag-bg, #e0e7ff)", color: "var(--tag-text, #4338ca)" }}>
                                {c}
                            </span>
                        ))}
                    </div>
                )}
                {detail.description && (
                    <p className="text-xs opacity-60 mt-2 line-clamp-3" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(detail.description) }} />
                )}
                <button
                    onClick={() => onImport(detail.bggId)}
                    disabled={importing || exists}
                    className="mt-auto self-start px-4 py-1.5 rounded-lg text-sm font-medium"
                    style={{
                        background: exists ? "var(--success-bg, #dcfce7)" : "var(--accent, #3b82f6)",
                        color: exists ? "var(--text-secondary)" : "#fff",
                    }}
                >
                    {exists ? "✓ " + t("boardGames.inCollection") : "+ " + t("boardGames.addToCollection")}
                </button>
            </div>
        </div>
    );
};

export default BggSearchPanel;
