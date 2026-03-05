// AdminIntegrationsPage.tsx — Hub for managing external integrations (BGG, Books, etc.)
import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
    useBggSyncStatusQuery,
    useStartBggSyncMutation,
    useCancelBggSyncMutation,
    useBggCatalogSearchQuery,
    useBggExportQuery,
    useImportBggCatalogMutation,
    type BggCatalogGame,
} from "../../scripts/api/apiBggCatalog";
import {
    useBookSearchQuery,
    useBookExportQuery,
    useImportBookCatalogMutation,
    type CatalogBook,
} from "../../scripts/api/apiBookCatalog";
import ContentSkeleton from "../../components/common/ContentSkeleton";

// ─── Shared styles ──────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
    background: "var(--bg-secondary, #252525)",
    border: "1px solid var(--border-color, #333)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
};

const btnPrimary: React.CSSProperties = {
    padding: "8px 18px",
    borderRadius: 6,
    border: "none",
    background: "var(--accent, #5865F2)",
    color: "#fff",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
};

const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    background: "#dc3545",
};

const btnOutline: React.CSSProperties = {
    ...btnPrimary,
    background: "transparent",
    border: "1px solid var(--border-color, #555)",
    color: "var(--text-primary, #ccc)",
};

const inputStyle: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid var(--border-color, #444)",
    background: "var(--bg-primary, #1a1a1a)",
    color: "var(--text-primary, #ddd)",
    fontSize: 14,
    flex: 1,
    minWidth: 0,
};

const badgeBase: React.CSSProperties = {
    padding: "3px 10px",
    borderRadius: 10,
    fontSize: 11,
    fontWeight: 700,
    display: "inline-block",
};

type Tab = "bgg" | "books";

// ─── Component ──────────────────────────────────────────────────────
const AdminIntegrationsPage: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<Tab>("bgg");

    const tabBtnStyle = (active: boolean): React.CSSProperties => ({
        padding: "8px 20px",
        borderRadius: 6,
        border: `1px solid ${active ? "var(--accent, #5865F2)" : "var(--border-color, #555)"}`,
        background: active ? "var(--accent, #5865F2)" : "transparent",
        color: active ? "#fff" : "var(--text-primary, #ccc)",
        cursor: "pointer",
        fontSize: 14,
        fontWeight: active ? 700 : 400,
    });

    return (
        <div className="container mt-4" style={{ maxWidth: 1000 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>
                🔗 {t("integrations.title", "Integrations")}
            </h2>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                <button style={tabBtnStyle(activeTab === "bgg")} onClick={() => setActiveTab("bgg")}>
                    <i className="fa-solid fa-dice" />{" "}{t("integrations.bggTab", "BGG Catalog")}
                </button>
                <button style={tabBtnStyle(activeTab === "books")} onClick={() => setActiveTab("books")}>
                    <i className="fa-solid fa-book" />{" "}{t("integrations.booksTab", "Książki")}
                </button>
            </div>

            {activeTab === "bgg" && <BggTab />}
            {activeTab === "books" && <BooksTab />}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// BGG Tab
// ═══════════════════════════════════════════════════════════════════
const BggTab: React.FC = () => {
    return (
        <>
            <BggSyncCard />
            <BggSearchSection />
            <BggExportImportSection />
        </>
    );
};

// ─── Sync status card ───────────────────────────────────────────────
const BggSyncCard: React.FC = () => {
    const { t } = useTranslation();
    const syncQuery = useBggSyncStatusQuery();
    const startSync = useStartBggSyncMutation();
    const cancelSync = useCancelBggSyncMutation();

    const status = syncQuery.data;

    const stateColors: Record<string, { bg: string; fg: string }> = {
        Idle: { bg: "rgba(108,117,125,0.2)", fg: "#888" },
        Running: { bg: "rgba(13,110,253,0.2)", fg: "#0d6efd" },
        Completed: { bg: "rgba(25,135,84,0.2)", fg: "#198754" },
        Cancelled: { bg: "rgba(255,193,7,0.2)", fg: "#ffc107" },
        Failed: { bg: "rgba(220,53,69,0.2)", fg: "#dc3545" },
    };

    return (
        <div style={cardStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 600 }}>
                {t("integrations.bggSync", "BGG Sync")}
            </h4>

            {syncQuery.isLoading && <ContentSkeleton rows={3} />}

            {status && (
                <>
                    {/* State badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                        <span style={{
                            ...badgeBase,
                            background: stateColors[status.state]?.bg ?? stateColors.Idle.bg,
                            color: stateColors[status.state]?.fg ?? stateColors.Idle.fg,
                        }}>
                            {status.state}
                        </span>
                        {status.lastFullSyncUtc && (
                            <span style={{ fontSize: 12, opacity: 0.5 }}>
                                {t("integrations.lastSync", "Last sync")}: {new Date(status.lastFullSyncUtc).toLocaleString()}
                            </span>
                        )}
                    </div>

                    {/* Progress bar */}
                    {status.state === "Running" && (
                        <div style={{ background: "#333", borderRadius: 6, height: 10, marginBottom: 12, overflow: "hidden" }}>
                            <div style={{
                                width: `${Math.min(status.progress * 100, 100)}%`,
                                height: "100%",
                                background: "var(--accent, #5865F2)",
                                borderRadius: 6,
                                transition: "width 0.4s ease",
                            }} />
                        </div>
                    )}

                    {/* Stats */}
                    <div style={{ display: "flex", gap: 24, fontSize: 13, marginBottom: 12, flexWrap: "wrap" }}>
                        <span>
                            {t("integrations.totalGames", "Total")}: <strong>{status.totalGames}</strong>
                        </span>
                        <span>
                            {t("integrations.syncedGames", "Synced")}: <strong>{status.syncedGames}</strong>
                        </span>
                        <span style={{ color: status.failedGames > 0 ? "#dc3545" : undefined }}>
                            {t("integrations.failedGames", "Failed")}: <strong>{status.failedGames}</strong>
                        </span>
                    </div>

                    {status.errorMessage && (
                        <div style={{ fontSize: 12, color: "#dc3545", marginBottom: 12 }}>
                            ⚠️ {status.errorMessage}
                        </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                        {status.state !== "Running" && (
                            <button
                                style={btnPrimary}
                                disabled={startSync.isPending}
                                onClick={() => startSync.mutate()}
                            >
                                {startSync.isPending
                                    ? t("integrations.starting", "Starting…")
                                    : t("integrations.startSync", "Start sync")}
                            </button>
                        )}
                        {status.state === "Running" && (
                            <button
                                style={btnDanger}
                                disabled={cancelSync.isPending}
                                onClick={() => cancelSync.mutate()}
                            >
                                {cancelSync.isPending
                                    ? t("integrations.cancelling", "Cancelling…")
                                    : t("integrations.cancelSync", "Cancel sync")}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// ─── BGG Search ─────────────────────────────────────────────────────
const BggSearchSection: React.FC = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const searchQuery = useBggCatalogSearchQuery(query);
    const results = searchQuery.data ?? [];

    return (
        <div style={cardStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 600 }}>
                <i className="fa-solid fa-magnifying-glass" />{" "}{t("integrations.bggSearch", "Search BGG Catalog")}
            </h4>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    style={inputStyle}
                    placeholder={t("integrations.searchPlaceholder", "Search games…")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {searchQuery.isLoading && <ContentSkeleton rows={3} showHeader={false} />}

            {results.length === 0 && query.length >= 2 && !searchQuery.isLoading && (
                <p style={{ fontSize: 13, opacity: 0.5 }}>
                    {t("integrations.noResults", "No results found.")}
                </p>
            )}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {results.map((g) => (
                        <div key={g.bggId} style={{
                            display: "flex", gap: 12, alignItems: "center",
                            padding: "8px 12px", borderRadius: 8,
                            background: "var(--bg-primary, #1a1a1a)",
                        }}>
                            {g.bggImageUrl && (
                                <img
                                    src={g.bggImageUrl}
                                    alt={g.name}
                                    style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                    {g.name}
                                    {g.bggYearPublished ? ` (${g.bggYearPublished})` : ""}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.6 }}>
                                    {g.bggRating != null && `⭐ ${g.bggRating.toFixed(1)}`}
                                    {g.minPlayers != null && g.maxPlayers != null && ` · 👥 ${g.minPlayers}–${g.maxPlayers}`}
                                    {g.bggWeight != null && ` · ⚖️ ${g.bggWeight.toFixed(1)}`}
                                    {g.bggCategories && ` · ${g.bggCategories}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── BGG Export / Import ────────────────────────────────────────────
const BggExportImportSection: React.FC = () => {
    const { t } = useTranslation();
    const [exportEnabled, setExportEnabled] = useState(false);
    const exportQuery = useBggExportQuery(exportEnabled);
    const importMut = useImportBggCatalogMutation();
    const fileRef = useRef<HTMLInputElement>(null);

    // Download export as JSON once data arrives
    React.useEffect(() => {
        if (exportQuery.data && exportEnabled) {
            const blob = new Blob([JSON.stringify(exportQuery.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "bgg-catalog-export.json";
            a.click();
            URL.revokeObjectURL(url);
            setExportEnabled(false);
        }
    }, [exportQuery.data, exportEnabled]);

    const handleImportFile = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;
        const text = await file.text();
        const games: BggCatalogGame[] = JSON.parse(text);
        importMut.mutate(games);
    };

    return (
        <div style={cardStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 600 }}>
                📦 {t("integrations.bggExportImport", "Export / Import")}
            </h4>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                    style={btnOutline}
                    disabled={exportQuery.isFetching}
                    onClick={() => setExportEnabled(true)}
                >
                    {exportQuery.isFetching
                        ? t("integrations.exporting", "Exporting…")
                        : t("integrations.exportCatalog", "Export catalog")}
                </button>

                <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    style={{ fontSize: 13 }}
                />
                <button
                    style={btnOutline}
                    disabled={importMut.isPending}
                    onClick={handleImportFile}
                >
                    {importMut.isPending
                        ? t("integrations.importing", "Importing…")
                        : t("integrations.importCatalog", "Import catalog")}
                </button>

                {importMut.isSuccess && (
                    <span style={{ fontSize: 12, color: "#198754" }}>
                        <i className="fa-solid fa-check" />{" "}{t("integrations.importSuccess", "Import complete")}
                    </span>
                )}
                {importMut.isError && (
                    <span style={{ fontSize: 12, color: "#dc3545" }}>
                        <i className="fa-solid fa-xmark" />{" "}{t("integrations.importError", "Import failed")}
                    </span>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════
// Books Tab
// ═══════════════════════════════════════════════════════════════════
const BooksTab: React.FC = () => {
    const { t: _t } = useTranslation();

    return (
        <>
            <BooksSearchSection />
            <BooksExportImportSection />
        </>
    );
};

// ─── Books Search ───────────────────────────────────────────────────
const BooksSearchSection: React.FC = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState("");
    const searchQuery = useBookSearchQuery(query);
    const results = searchQuery.data ?? [];

    return (
        <div style={cardStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 600 }}>
                <i className="fa-solid fa-magnifying-glass" />{" "}{t("integrations.bookSearch", "Search Book Catalog")}
            </h4>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                    style={inputStyle}
                    placeholder={t("integrations.searchBooksPlaceholder", "Search books…")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {searchQuery.isLoading && <ContentSkeleton rows={3} showHeader={false} />}

            {results.length === 0 && query.length >= 2 && !searchQuery.isLoading && (
                <p style={{ fontSize: 13, opacity: 0.5 }}>
                    {t("integrations.noResults", "No results found.")}
                </p>
            )}

            {results.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {results.map((b) => (
                        <div key={b.id} style={{
                            display: "flex", gap: 12, alignItems: "center",
                            padding: "8px 12px", borderRadius: 8,
                            background: "var(--bg-primary, #1a1a1a)",
                        }}>
                            {b.coverUrl && (
                                <img
                                    src={b.coverUrl}
                                    alt={b.title}
                                    style={{ width: 36, height: 52, borderRadius: 4, objectFit: "cover" }}
                                />
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 14 }}>
                                    {b.title}
                                    {b.publishedYear ? ` (${b.publishedYear})` : ""}
                                </div>
                                <div style={{ fontSize: 12, opacity: 0.6 }}>
                                    {b.author && `✍️ ${b.author}`}
                                    {b.publisher && ` · 🏢 ${b.publisher}`}
                                    {b.rating != null && ` · ⭐ ${b.rating.toFixed(1)}`}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// ─── Books Export / Import ──────────────────────────────────────────
const BooksExportImportSection: React.FC = () => {
    const { t } = useTranslation();
    const [exportEnabled, setExportEnabled] = useState(false);
    const exportQuery = useBookExportQuery(exportEnabled);
    const importMut = useImportBookCatalogMutation();
    const fileRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (exportQuery.data && exportEnabled) {
            const blob = new Blob([JSON.stringify(exportQuery.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "book-catalog-export.json";
            a.click();
            URL.revokeObjectURL(url);
            setExportEnabled(false);
        }
    }, [exportQuery.data, exportEnabled]);

    const handleImportFile = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) return;
        const text = await file.text();
        const books: CatalogBook[] = JSON.parse(text);
        importMut.mutate(books);
    };

    return (
        <div style={cardStyle}>
            <h4 style={{ marginBottom: 12, fontWeight: 600 }}>
                📦 {t("integrations.bookExportImport", "Export / Import")}
            </h4>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <button
                    style={btnOutline}
                    disabled={exportQuery.isFetching}
                    onClick={() => setExportEnabled(true)}
                >
                    {exportQuery.isFetching
                        ? t("integrations.exporting", "Exporting…")
                        : t("integrations.exportCatalog", "Export catalog")}
                </button>

                <input
                    ref={fileRef}
                    type="file"
                    accept=".json"
                    style={{ fontSize: 13 }}
                />
                <button
                    style={btnOutline}
                    disabled={importMut.isPending}
                    onClick={handleImportFile}
                >
                    {importMut.isPending
                        ? t("integrations.importing", "Importing…")
                        : t("integrations.importCatalog", "Import catalog")}
                </button>

                {importMut.isSuccess && (
                    <span style={{ fontSize: 12, color: "#198754" }}>
                        <i className="fa-solid fa-check" />{" "}{t("integrations.importSuccess", "Import complete")}
                    </span>
                )}
                {importMut.isError && (
                    <span style={{ fontSize: 12, color: "#dc3545" }}>
                        <i className="fa-solid fa-xmark" />{" "}{t("integrations.importError", "Import failed")}
                    </span>
                )}
            </div>
        </div>
    );
};

export default AdminIntegrationsPage;
