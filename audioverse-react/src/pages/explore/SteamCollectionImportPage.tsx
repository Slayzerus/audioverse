// SteamCollectionImportPage.tsx — Import full Steam library into video games catalog
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useSteamCollectionQuery,
    useImportSteamBatchMutation,
    useImportSteamCollectionMutation,
    useUserConnectionsQuery,
} from "../../scripts/api/apiGames";
import type { VideoGame } from "../../models/modelsKaraoke";

// ── Styles ─────────────────────────────────────────────────────
const page: React.CSSProperties = {
    width: "100%", height: "100%", padding: 20,
    display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
};
const card: React.CSSProperties = {
    border: "1px solid var(--border-color, #ddd)", padding: 20,
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 12,
};
const input: React.CSSProperties = {
    padding: "8px 12px", borderRadius: 4,
    border: "1px solid var(--border-color, #ccc)", fontSize: 14, width: 300,
};
const btn: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 6, border: "none",
    backgroundColor: "var(--accent, #5865F2)", color: "#fff",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const btnSecondary: React.CSSProperties = {
    ...btn, backgroundColor: "transparent",
    border: "1px solid var(--border-color, #ccc)", color: "inherit",
};
const gameCard: React.CSSProperties = {
    border: "1px solid var(--border-color, #eee)", borderRadius: 6,
    padding: 10, display: "flex", gap: 10, alignItems: "center",
};

const SteamCollectionImportPage: React.FC = () => {
    const { t } = useTranslation();
    const [steamId, setSteamId] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // External connections — check if Steam is linked
    const { data: connections } = useUserConnectionsQuery();
    const steamConn = connections?.find((c) => c.platform?.toLowerCase() === "steam");

    // Fetch collection
    const { data: collection, isLoading: collLoading, refetch } = useSteamCollectionQuery(steamId, { enabled: false });

    // Import mutations
    const batchImport = useImportSteamBatchMutation();
    const fullImport = useImportSteamCollectionMutation();

    const handleFetchCollection = () => {
        if (!steamId.trim()) return;
        refetch();
    };

    const toggleSelect = (appId: number) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(appId)) next.delete(appId);
            else next.add(appId);
            return next;
        });
    };

    const selectAll = () => {
        if (!collection) return;
        setSelectedIds(new Set(collection.map((g) => g.steamAppId ?? g.id ?? 0).filter(Boolean)));
    };

    const handleImportSelected = () => {
        if (selectedIds.size === 0) return;
        batchImport.mutate(Array.from(selectedIds));
    };

    const handleImportAll = () => {
        if (!steamId.trim()) return;
        fullImport.mutate(steamId);
    };

    return (
        <div style={page}>
            <h1 style={{ margin: 0 }}><i className="fa-solid fa-gamepad" />{" "}{t("steamImport.title", "Steam Collection Import")}</h1>

            {/* Connection status */}
            <div style={card}>
                <h2 style={{ margin: 0 }}>{t("steamImport.connection", "Steam Connection")}</h2>
                {steamConn?.connected ? (
                    <p style={{ margin: 0, color: "var(--success, #43b581)" }}>
                        <i className="fa-solid fa-check" />{" "}{t("steamImport.connected", "Connected")}
                        {steamConn.username && ` — ${steamConn.username}`}
                    </p>
                ) : (
                    <p style={{ margin: 0, color: "#888", fontSize: 13 }}>
                        {t("steamImport.notConnected", "Steam account is not linked. Enter your Steam ID manually or link your account in settings.")}
                    </p>
                )}
            </div>

            {/* Steam ID input */}
            <div style={card}>
                <h2 style={{ margin: 0 }}>{t("steamImport.fetchCollection", "Load collection")}</h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <input
                        type="text"
                        placeholder={t("steamImport.steamIdPlaceholder", "Steam ID lub profil URL")}
                        value={steamId}
                        onChange={(e) => setSteamId(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleFetchCollection()}
                        style={input}
                    />
                    <button type="button" onClick={handleFetchCollection} disabled={collLoading || !steamId.trim()} style={btn}>
                        {collLoading ? "…" : t("steamImport.fetch", "Fetch")}
                    </button>
                    {steamConn?.username && !steamId && (
                        <button type="button" onClick={() => setSteamId(steamConn.username!)} style={btnSecondary}>
                            {t("steamImport.useLinked", "Use linked")}
                        </button>
                    )}
                </div>
            </div>

            {/* Collection list */}
            {collection && (
                <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <h2 style={{ margin: 0 }}>
                            {t("steamImport.collectionTitle", "Steam Collection")} ({collection.length})
                        </h2>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" onClick={selectAll} style={btnSecondary}>
                                {t("steamImport.selectAll", "Select all")}
                            </button>
                            <button
                                type="button"
                                onClick={handleImportSelected}
                                disabled={selectedIds.size === 0 || batchImport.isPending}
                                style={btn}
                            >
                                {batchImport.isPending ? "…" : t("steamImport.importSelected", `Import selected (${selectedIds.size})`)}
                            </button>
                            <button
                                type="button"
                                onClick={handleImportAll}
                                disabled={fullImport.isPending}
                                style={{ ...btn, backgroundColor: "var(--success, #43b581)" }}
                            >
                                {fullImport.isPending ? "…" : t("steamImport.importAll", "Import entire collection")}
                            </button>
                        </div>
                    </div>

                    {batchImport.isSuccess && (
                        <p style={{ margin: 0, color: "var(--success, #43b581)", fontWeight: 600 }}>
                            <i className="fa-solid fa-check" />{" "}{t("steamImport.imported", "Imported!")} ({(batchImport.data as VideoGame[])?.length ?? 0} gier)
                        </p>
                    )}
                    {fullImport.isSuccess && (
                        <p style={{ margin: 0, color: "var(--success, #43b581)", fontWeight: 600 }}>
                            <i className="fa-solid fa-check" />{" "}{t("steamImport.imported", "Imported!")} ({(fullImport.data as VideoGame[])?.length ?? 0} gier)
                        </p>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
                        {collection.map((g) => {
                            const appId = g.steamAppId ?? g.id ?? 0;
                            const selected = selectedIds.has(appId);
                            return (
                                <div
                                    key={appId}
                                    style={{
                                        ...gameCard,
                                        backgroundColor: selected ? "rgba(88,101,242,0.1)" : "transparent",
                                        cursor: "pointer",
                                    }}
                                    onClick={() => toggleSelect(appId)}
                                >
                                    <input type="checkbox" checked={selected} readOnly />
                                    {(g.coverImageUrl || g.steamHeaderImageUrl) && (
                                        <img src={(g.coverImageUrl || g.steamHeaderImageUrl)!} alt={g.name || 'Game cover'} style={{ width: 60, height: 30, objectFit: "cover", borderRadius: 4 }} />
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <strong>{g.name}</strong>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SteamCollectionImportPage;
