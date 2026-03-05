// DanceClassificationPanel.tsx — Classify songs into dance styles & view matches
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
    useDanceStylesQuery,
    useSongDanceMatchQuery,
    useDanceClassificationQuery,
    useAudioAnalysisQuery,
} from "../../../scripts/api/apiDance";
import type { DanceStyle, SongDanceMatch } from "../../../models/modelsKaraoke";

const DanceClassificationPanel: React.FC = () => {
    const { t } = useTranslation();
    const [songId, setSongId] = useState<number>(0);
    const [songIdInput, setSongIdInput] = useState<string>("");
    const [mode, setMode] = useState<"match" | "classify" | "analyze">("match");

    const { data: styles = [], isLoading: stylesLoading } = useDanceStylesQuery();
    const { data: matches = [], isLoading: matchLoading } = useSongDanceMatchQuery(
        mode === "match" ? songId : 0,
        { enabled: mode === "match" && songId > 0 },
    );
    const { data: classified = [], isLoading: classifyLoading } = useDanceClassificationQuery(
        mode === "classify" ? songId : 0,
        { enabled: mode === "classify" && songId > 0 },
    );
    const { data: analysis, isLoading: analyzeLoading } = useAudioAnalysisQuery(
        mode === "analyze" ? songId : 0,
        { enabled: mode === "analyze" && songId > 0 },
    );

    const handleLookup = () => {
        const id = Number(songIdInput);
        if (id > 0) setSongId(id);
    };

    const isLoading = matchLoading || classifyLoading || analyzeLoading;
    const results = mode === "classify" ? classified : matches;

    return (
        <div>
            {/* Dance styles reference */}
            <details style={{ marginBottom: 16 }}>
                <summary style={{ cursor: "pointer", fontWeight: 500, fontSize: "0.95rem" }}>
                    {t("dance.stylesReference", "Dance Styles Reference")} ({styles.length})
                </summary>
                {stylesLoading ? (
                    <p style={{ opacity: 0.6, padding: 8 }}>{t("common.loading", "Loading...")}</p>
                ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: "8px 0" }}>
                        {styles.map((s: DanceStyle) => (
                            <span
                                key={s.id}
                                style={{
                                    padding: "4px 10px",
                                    borderRadius: 16,
                                    fontSize: "0.8rem",
                                    backgroundColor: "var(--bs-secondary-bg, #f0f0f0)",
                                    border: "1px solid var(--bs-border-color, #dee2e6)",
                                }}
                            >
                                {s.name}
                                {s.bpmMin != null && s.bpmMax != null && (
                                    <span style={{ opacity: 0.6, marginLeft: 4 }}>
                                        ({s.bpmMin}-{s.bpmMax} BPM)
                                    </span>
                                )}
                            </span>
                        ))}
                    </div>
                )}
            </details>

            {/* Song lookup */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
                <input
                    type="number"
                    min={1}
                    placeholder={t("dance.songIdPlaceholder", "Song ID")}
                    value={songIdInput}
                    onChange={(e) => setSongIdInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    style={{
                        padding: "6px 10px",
                        borderRadius: 4,
                        border: "1px solid var(--bs-border-color, #ced4da)",
                        width: 120,
                    }}
                />

                {/* Mode selector */}
                {(["match", "classify", "analyze"] as const).map((m) => (
                    <button
                        key={m}
                        onClick={() => {
                            setMode(m);
                            handleLookup();
                        }}
                        style={{
                            padding: "6px 14px",
                            borderRadius: 4,
                            border: mode === m ? "2px solid #0d6efd" : "1px solid var(--bs-border-color, #dee2e6)",
                            background: mode === m ? "#0d6efd" : "none",
                            color: mode === m ? "#fff" : "inherit",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: mode === m ? 600 : 400,
                        }}
                    >
                        {m === "match"
                            ? t("dance.modeMatch", "🎵 Match")
                            : m === "classify"
                              ? t("dance.modeClassify", "🏷️ Classify")
                              : t("dance.modeAnalyze", "📊 Analyze")}
                    </button>
                ))}
            </div>

            {/* Results */}
            {songId <= 0 ? (
                <p style={{ opacity: 0.5 }}>
                    {t("dance.enterSongId", "Enter a song ID to look up dance information.")}
                </p>
            ) : isLoading ? (
                <p style={{ opacity: 0.6 }}>{t("common.loading", "Loading...")}</p>
            ) : mode === "analyze" ? (
                /* Audio analysis results */
                analysis ? (
                    <div
                        style={{
                            border: "1px solid var(--bs-border-color, #dee2e6)",
                            borderRadius: 8,
                            padding: 16,
                        }}
                    >
                        <h6>{t("dance.audioAnalysis", "Audio Analysis")}</h6>
                        <table style={{ width: "100%", fontSize: "0.9rem" }}>
                            <tbody>
                                {Object.entries(analysis).map(([key, val]) => (
                                    <tr key={key}>
                                        <td style={{ padding: "4px 8px", fontWeight: 500 }}>{key}</td>
                                        <td style={{ padding: "4px 8px" }}>
                                            {typeof val === "number" ? val.toFixed(2) : String(val ?? "—")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p style={{ opacity: 0.5 }}>{t("dance.noAnalysis", "No analysis data available.")}</p>
                )
            ) : results.length > 0 ? (
                <div>
                    <h6 style={{ marginBottom: 10 }}>
                        {mode === "match"
                            ? t("dance.matchResults", "Dance Matches")
                            : t("dance.classifyResults", "Classification Results")}
                    </h6>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.9rem",
                        }}
                    >
                        <thead>
                            <tr style={{ borderBottom: "2px solid var(--bs-border-color, #dee2e6)" }}>
                                <th style={{ padding: "8px" }}>{t("dance.style", "Style")}</th>
                                <th style={{ padding: "8px", textAlign: "center" }}>{t("dance.confidence", "Confidence")}</th>
                                <th style={{ padding: "8px", textAlign: "center" }}>{t("dance.bpm", "BPM")}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((m: SongDanceMatch, idx: number) => (
                                <tr
                                    key={idx}
                                    style={{ borderBottom: "1px solid var(--bs-border-color, #eee)" }}
                                >
                                    <td style={{ padding: "8px" }}>{m.danceStyle?.name ?? m.danceStyleId}</td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>
                                        <div
                                            style={{
                                                display: "inline-block",
                                                width: 80,
                                                height: 8,
                                                backgroundColor: "var(--bs-secondary-bg, #e0e0e0)",
                                                borderRadius: 4,
                                                overflow: "hidden",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: `${((m.confidence ?? 0) * 100).toFixed(0)}%`,
                                                    height: "100%",
                                                    backgroundColor: (m.confidence ?? 0) > 0.7 ? "#198754" : (m.confidence ?? 0) > 0.4 ? "#ffc107" : "#dc3545",
                                                }}
                                            />
                                        </div>
                                        <span style={{ marginLeft: 6, fontSize: "0.8rem" }}>
                                            {((m.confidence ?? 0) * 100).toFixed(0)}%
                                        </span>
                                    </td>
                                    <td style={{ padding: "8px", textAlign: "center" }}>
                                        {m.danceStyle?.bpmMin ?? "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p style={{ opacity: 0.5 }}>{t("dance.noResults", "No results for this song.")}</p>
            )}
        </div>
    );
};

export default DanceClassificationPanel;
