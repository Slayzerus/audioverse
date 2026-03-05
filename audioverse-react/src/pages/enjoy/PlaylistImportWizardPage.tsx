// PlaylistImportWizardPage.tsx — Step-by-step wizard for importing playlists from external services
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useServiceConnectionsQuery,
    useConnectServiceMutation,
    useDisconnectServiceMutation,
    useExternalPlaylistsQuery,
    useExternalPlaylistTracksQuery,
    useImportExternalPlaylistMutation,
} from "../../scripts/api/apiPlaylistManager";
import { MusicPlatform } from "../../models/modelsMusicPlatform";

// ── Styles ─────────────────────────────────────────────────────
const page: React.CSSProperties = {
    width: "100%", height: "100%", padding: 20,
    display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
};
const card: React.CSSProperties = {
    border: "1px solid var(--border-color, #ddd)", padding: 20,
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 12,
};
const btn: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 6, border: "none",
    backgroundColor: "var(--accent, #5865F2)", color: "#fff",
    cursor: "pointer", fontSize: 13, fontWeight: 600,
};
const btnDanger: React.CSSProperties = {
    ...btn, backgroundColor: "var(--danger, #e74c3c)",
};
const btnSecondary: React.CSSProperties = {
    ...btn, backgroundColor: "transparent",
    border: "1px solid var(--border-color, #ccc)", color: "inherit",
};
const stepIndicator = (active: boolean, done: boolean): React.CSSProperties => ({
    padding: "8px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600,
    backgroundColor: done ? "var(--success, #43b581)" : active ? "var(--accent, #5865F2)" : "var(--bg-secondary, #eee)",
    color: done || active ? "#fff" : "inherit",
});
const playlistCard: React.CSSProperties = {
    border: "1px solid var(--border-color, #eee)", borderRadius: 6,
    padding: 12, display: "flex", gap: 12, alignItems: "center", cursor: "pointer",
};

type Step = 1 | 2 | 3 | 4;

const PLATFORMS: { value: MusicPlatform; label: string; icon: string }[] = [
    { value: MusicPlatform.Spotify, label: "Spotify", icon: "🟢" },
    { value: MusicPlatform.Tidal, label: "Tidal", icon: "🔵" },
    { value: MusicPlatform.YouTube, label: "YouTube Music", icon: "🔴" },
];

const PlaylistImportWizardPage: React.FC = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>(1);
    const [selectedPlatform, setSelectedPlatform] = useState<MusicPlatform | null>(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

    // Service connections
    const { data: connections, refetch: refetchConns } = useServiceConnectionsQuery();
    const connectMut = useConnectServiceMutation();
    const disconnectMut = useDisconnectServiceMutation();

    // External playlists
    const { data: playlists, isLoading: playlistsLoading } = useExternalPlaylistsQuery(
        selectedPlatform ?? MusicPlatform.None,
        !!selectedPlatform && step >= 2,
    );

    // Tracks preview
    const { data: tracks, isLoading: tracksLoading } = useExternalPlaylistTracksQuery(
        selectedPlatform ?? MusicPlatform.None,
        selectedPlaylistId ?? "",
    );

    // Import
    const importMut = useImportExternalPlaylistMutation();

    const isConnected = (p: MusicPlatform) =>
        connections?.some((c) => c.platform === p && c.connected);

    const handleConnect = async (platform: MusicPlatform) => {
        try {
            const result = await connectMut.mutateAsync(platform);
            if (result?.authUrl) {
                window.location.href = result.authUrl;
            }
        } catch { /* Expected: connect mutation error is handled by UI state */ }
    };

    const handleDisconnect = async (platform: MusicPlatform) => {
        await disconnectMut.mutateAsync(platform);
        refetchConns();
    };

    const handleSelectPlatform = (p: MusicPlatform) => {
        setSelectedPlatform(p);
        setSelectedPlaylistId(null);
        setStep(2);
    };

    const handleSelectPlaylist = (id: string) => {
        setSelectedPlaylistId(id);
        setStep(3);
    };

    const handleImport = async () => {
        if (!selectedPlatform || !selectedPlaylistId) return;
        await importMut.mutateAsync({
            platform: selectedPlatform,
            externalPlaylistId: selectedPlaylistId,
        });
        setStep(4);
    };

    return (
        <div style={page}>
            <h1 style={{ margin: 0 }}><i className="fa-solid fa-music" />{" "}{t("playlistImport.title", "Import playlists from music services")}</h1>

            {/* Step indicators */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={stepIndicator(step === 1, step > 1)}>1. {t("playlistImport.step1", "Connect service")}</span>
                <span style={stepIndicator(step === 2, step > 2)}>2. {t("playlistImport.step2", "Choose playlist")}</span>
                <span style={stepIndicator(step === 3, step > 3)}>3. {t("playlistImport.step3", "Preview & Import")}</span>
                <span style={stepIndicator(step === 4, false)}>4. {t("playlistImport.step4", "Done")}</span>
            </div>

            {/* ──── Step 1: Connect service ──── */}
            {step === 1 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}>{t("playlistImport.chooseService", "Choose music service")}</h2>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                        {PLATFORMS.map((p) => {
                            const connected = isConnected(p.value);
                            return (
                                <div
                                    key={p.value}
                                    style={{
                                        ...card, padding: 16, width: 180, alignItems: "center",
                                        cursor: connected ? "pointer" : "default",
                                        opacity: connected ? 1 : 0.6,
                                    }}
                                >
                                    <span style={{ fontSize: 32 }}>{p.icon}</span>
                                    <strong>{p.label}</strong>
                                    {connected ? (
                                        <>
                                            <span style={{ color: "var(--success)", fontSize: 12 }}><i className="fa-solid fa-check" />{" "}{t("playlistImport.connected", "Connected")}</span>
                                            <button type="button" style={btn} onClick={() => handleSelectPlatform(p.value)}>
                                                {t("playlistImport.use", "Use")} →
                                            </button>
                                            <button type="button" style={btnDanger} onClick={() => handleDisconnect(p.value)}>
                                                {t("playlistImport.disconnect", "Disconnect")}
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" style={btn} onClick={() => handleConnect(p.value)}>
                                            {t("playlistImport.connect", "Connect")}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ──── Step 2: Choose playlist ──── */}
            {step === 2 && selectedPlatform && (
                <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h2 style={{ margin: 0 }}>
                            {t("playlistImport.yourPlaylists", "Your playlists")}
                            {playlists && ` (${playlists.length})`}
                        </h2>
                        <button type="button" style={btnSecondary} onClick={() => setStep(1)}>
                            ← {t("common.back", "Back")}
                        </button>
                    </div>
                    {playlistsLoading && <p>{t("common.loading", "Loading…")}</p>}
                    {playlists && playlists.length === 0 && (
                        <p style={{ color: "#888", fontSize: 13 }}>{t("playlistImport.noPlaylists", "No playlists found.")}</p>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 500, overflowY: "auto" }}>
                        {playlists?.map((pl) => (
                            <div
                                key={pl.id}
                                style={playlistCard}
                                onClick={() => handleSelectPlaylist(pl.id)}
                            >
                                {pl.coverUrl && (
                                    <img src={pl.coverUrl} alt={`Cover for ${pl.name}`} style={{ width: 48, height: 48, borderRadius: 4, objectFit: "cover" }} />
                                )}
                                <div style={{ flex: 1 }}>
                                    <strong>{pl.name}</strong>
                                    <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>
                                        {pl.trackCount ?? "?"} {t("playlistImport.tracks", "tracks")}
                                    </span>
                                </div>
                                <span style={{ fontSize: 18 }}>→</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ──── Step 3: Preview & Import ──── */}
            {step === 3 && selectedPlatform && selectedPlaylistId && (
                <div style={card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                        <h2 style={{ margin: 0 }}>
                            {t("playlistImport.preview", "Track preview")}
                            {tracks && ` (${tracks.length})`}
                        </h2>
                        <div style={{ display: "flex", gap: 8 }}>
                            <button type="button" style={btnSecondary} onClick={() => setStep(2)}>
                                ← {t("common.back", "Back")}
                            </button>
                            <button
                                type="button"
                                style={btn}
                                onClick={handleImport}
                                disabled={importMut.isPending}
                            >
                                {importMut.isPending ? "…" : t("playlistImport.import", "Import playlist")}
                            </button>
                        </div>
                    </div>
                    {tracksLoading && <p>{t("common.loading", "Loading…")}</p>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 500, overflowY: "auto" }}>
                        {tracks?.map((tr, i) => (
                            <div key={tr.externalId ?? i} style={{ display: "flex", gap: 8, fontSize: 13, padding: "4px 0", borderBottom: "1px solid var(--border-color, #eee)" }}>
                                <span style={{ width: 24, textAlign: "right", color: "#888" }}>{i + 1}.</span>
                                <strong style={{ flex: 1 }}>{tr.title}</strong>
                                <span style={{ color: "#888" }}>{tr.artist || ""}</span>
                                {tr.duration && (
                                    <span style={{ color: "#888", width: 50, textAlign: "right" }}>
                                        {Math.floor(tr.duration / 60000)}:{String(Math.floor((tr.duration % 60000) / 1000)).padStart(2, "0")}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ──── Step 4: Done ──── */}
            {step === 4 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}><i className="fa-solid fa-check" />{" "}{t("playlistImport.done", "Done!")}</h2>
                    <p style={{ margin: 0 }}>
                        {t("playlistImport.doneDesc", "The playlist has been imported to your library.")}
                    </p>
                    {importMut.data && (
                        <p style={{ margin: 0, fontSize: 13 }}>
                            <strong>{importMut.data.name}</strong> — {importMut.data.tracks?.length ?? 0} {t("playlistImport.tracks", "tracks")}
                        </p>
                    )}
                    <div style={{ display: "flex", gap: 8 }}>
                        <button type="button" style={btn} onClick={() => { setStep(2); setSelectedPlaylistId(null); }}>
                            {t("playlistImport.importMore", "Import another")}
                        </button>
                        <button type="button" style={btnSecondary} onClick={() => { setStep(1); setSelectedPlatform(null); setSelectedPlaylistId(null); }}>
                            {t("playlistImport.changePlatform", "Change service")}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaylistImportWizardPage;
