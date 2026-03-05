import React, { useEffect, useState, useMemo } from "react";
import type { TFunction } from "i18next";
import type { KaraokeSongFile } from "../../../models/modelsKaraoke";
import type { TopSinging } from "../../../scripts/api/apiKaraoke";
import type { PitchPoint, ComboResult } from "../../../utils/karaokeScoring";
import type { MicSettingsSnapshot, VerseRatingInput } from "../../../utils/vocalPerformanceMetrics";
import { Focusable } from "../../common/Focusable";
import VocalPerformanceReport from "./VocalPerformanceReport";

/** Per-player score data passed from useKaraokeManager */
export interface PlayerScoreEntry {
    id: number;
    name: string;
    color: string;
    classicScore: number;
    bonusScore: number;
    totalScore: number;
}

interface KaraokeSummaryOverlayProps {
    uploadedSong: KaraokeSongFile | null;
    playerScores: PlayerScoreEntry[];
    topSingings: TopSinging[];
    onRestart: () => void;
    onContinue: () => void;
    t: TFunction;
    // Performance report data
    livePitch?: Record<number, PitchPoint[]>;
    liveVerseRatings?: VerseRatingInput[];
    liveCombo?: ComboResult;
    difficulty?: string;
    micSettings?: Record<number, MicSettingsSnapshot>;
}

/* ─── helpers ─── */
const MAX_SCORE = 10_000;
const BASE_DURATION_MS = 5_000; // 5 s for 10 000 pts

/** Lighten a hex color by mixing with white */
function lightenColor(hex: string, amount = 0.35): string {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    const r = Math.min(255, Math.round(parseInt(m[1], 16) + (255 - parseInt(m[1], 16)) * amount));
    const g = Math.min(255, Math.round(parseInt(m[2], 16) + (255 - parseInt(m[2], 16)) * amount));
    const b = Math.min(255, Math.round(parseInt(m[3], 16) + (255 - parseInt(m[3], 16)) * amount));
    return `rgb(${r},${g},${b})`;
}

/** Animated score bar for one player */
const ScoreBar: React.FC<{
    entry: PlayerScoreEntry;
    rank: number;
    animDelay: number;
}> = ({ entry, rank, animDelay }) => {
    const [classicPct, setClassicPct] = useState(0);
    const [bonusPct, setBonusPct] = useState(0);
    const [displayClassic, setDisplayClassic] = useState(0);
    const [displayBonus, setDisplayBonus] = useState(0);

    const clampedClassic = Math.min(entry.classicScore, MAX_SCORE);
    const clampedBonus = Math.min(entry.bonusScore, MAX_SCORE);
    const classicDuration = (clampedClassic / MAX_SCORE) * BASE_DURATION_MS;
    const bonusDuration = clampedBonus > 0
        ? (clampedBonus / MAX_SCORE) * BASE_DURATION_MS
        : 0;

    useEffect(() => {
        let raf: number;
        let start: number | null = null;
        const totalClassicMs = Math.max(classicDuration, 400);
        const totalBonusMs = Math.max(bonusDuration, bonusDuration > 0 ? 300 : 0);

        const animate = (ts: number) => {
            if (start === null) start = ts;
            const elapsed = ts - start - animDelay;
            if (elapsed < 0) { raf = requestAnimationFrame(animate); return; }

            // Phase 1: classic bar
            if (elapsed <= totalClassicMs) {
                const frac = Math.min(1, elapsed / totalClassicMs);
                const eased = 1 - Math.pow(1 - frac, 3); // ease-out cubic
                setClassicPct(Math.min(eased * (clampedClassic / MAX_SCORE) * 100, 100));
                setDisplayClassic(Math.round(eased * entry.classicScore));
                raf = requestAnimationFrame(animate);
                return;
            }

            // Classic done
            setClassicPct(Math.min((clampedClassic / MAX_SCORE) * 100, 100));
            setDisplayClassic(entry.classicScore);

            // Phase 2: bonus bar
            if (totalBonusMs > 0) {
                const bonusElapsed = elapsed - totalClassicMs;
                if (bonusElapsed <= totalBonusMs) {
                    const frac = Math.min(1, bonusElapsed / totalBonusMs);
                    const eased = 1 - Math.pow(1 - frac, 3);
                    setBonusPct(Math.min(eased * (clampedBonus / MAX_SCORE) * 100, 100));
                    setDisplayBonus(Math.round(eased * entry.bonusScore));
                    raf = requestAnimationFrame(animate);
                    return;
                }
                setBonusPct(Math.min((clampedBonus / MAX_SCORE) * 100, 100));
                setDisplayBonus(entry.bonusScore);
            }
        };

        raf = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(raf);
    }, [entry.classicScore, entry.bonusScore, classicDuration, bonusDuration, animDelay]);

    const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;

    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: "100%" }}>
            {/* Rank */}
            <span style={{ width: 32, textAlign: "center", fontSize: 18, flexShrink: 0 }}>{medal}</span>

            {/* Name */}
            <span style={{
                width: 100, flexShrink: 0, fontWeight: 600, fontSize: 14,
                color: entry.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
                {entry.name}
            </span>

            {/* Bar container */}
            <div style={{ flex: 1, position: "relative", height: 28, borderRadius: 6, background: "#0f172a", overflow: "hidden" }}>
                {/* Bonus bar (behind, lighter color) */}
                {entry.bonusScore > 0 && (
                    <div style={{
                        position: "absolute", inset: 0,
                        width: `${Math.min(classicPct + bonusPct, 100)}%`,
                        background: lightenColor(entry.color, 0.45),
                        borderRadius: 6,
                        transition: "none",
                    }} />
                )}
                {/* Classic bar (front, player color) */}
                <div style={{
                    position: "absolute", inset: 0,
                    width: `${classicPct}%`,
                    background: `linear-gradient(90deg, ${entry.color}, ${lightenColor(entry.color, 0.15)})`,
                    borderRadius: 6,
                    boxShadow: `0 0 8px ${entry.color}55`,
                    transition: "none",
                }} />
                {/* Score text on top */}
                <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "flex-end",
                    paddingRight: 8, fontSize: 13, fontWeight: 700, color: "#fff",
                    textShadow: "0 1px 3px rgba(0,0,0,0.7)",
                }}>
                    {displayClassic.toLocaleString()}
                    {displayBonus > 0 && (
                        <span style={{ color: lightenColor(entry.color, 0.5), marginLeft: 4, fontSize: 11 }}>
                            +{displayBonus.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Total */}
            <span style={{ width: 70, textAlign: "right", fontWeight: 700, fontSize: 15, color: "#fbbf24", flexShrink: 0 }}>
                {(displayClassic + displayBonus).toLocaleString()}
            </span>
        </div>
    );
};

/** Ranking table (local or global) */
const RankingSection: React.FC<{
    title: string;
    entries: { rank: number; name: string; score: number; color?: string }[];
    highlightNames: Set<string>;
    playerColorMap: Map<string, string>;
}> = ({ title, entries, highlightNames, playerColorMap }) => (
    <div style={{ flex: 1, minWidth: 200 }}>
        <h4 style={{ margin: "0 0 6px", fontSize: 14, color: "#94a3b8" }}>{title}</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
                {entries.map((e, i) => {
                    const hl = highlightNames.has(e.name);
                    const playerCol = playerColorMap.get(e.name);
                    return (
                        <tr key={`${e.name}-${i}`} style={{
                            background: hl ? "rgba(251,191,36,0.1)" : "transparent",
                            borderBottom: "1px solid #1e293b",
                        }}>
                            <td style={{ padding: "3px 6px", width: 24, color: i < 3 ? "#fbbf24" : "#64748b", fontWeight: i < 3 ? 700 : 400 }}>
                                {e.rank}
                            </td>
                            <td style={{
                                padding: "3px 6px",
                                color: playerCol ?? (hl ? "#fbbf24" : "#cbd5e1"),
                                fontWeight: hl ? 700 : 400,
                            }}>
                                {hl && "● "}{e.name}
                            </td>
                            <td style={{ padding: "3px 6px", textAlign: "right", color: hl ? "#fbbf24" : "#94a3b8" }}>
                                {e.score.toLocaleString()}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

const KaraokeSummaryOverlay: React.FC<KaraokeSummaryOverlayProps> = ({
    uploadedSong,
    playerScores,
    topSingings,
    onRestart,
    onContinue,
    t,
    livePitch,
    liveVerseRatings,
    liveCombo,
    difficulty,
    micSettings,
}) => {
    const [showReport, setShowReport] = useState(false);
    // Sort players by totalScore descending
    const sorted = useMemo(
        () => [...playerScores].sort((a, b) => b.totalScore - a.totalScore),
        [playerScores],
    );

    // Player name → color map for highlighting in rankings
    const playerColorMap = useMemo(() => {
        const m = new Map<string, string>();
        for (const p of playerScores) m.set(p.name, p.color);
        return m;
    }, [playerScores]);
    const playerNames = useMemo(() => new Set(playerScores.map(p => p.name)), [playerScores]);

    // Local ranking = current session players
    const localRanking = useMemo(
        () => sorted.map((p, i) => ({ rank: i + 1, name: p.name, score: p.totalScore, color: p.color })),
        [sorted],
    );

    // Global ranking = topSingings top 10 with current players injected if they qualify
    const globalRanking = useMemo(() => {
        // Merge session scores into topSingings
        const all: { name: string; score: number }[] = topSingings.map(s => ({ name: s.playerName, score: s.score }));
        // Add current players by id — avoid duplicate entries for the same player
        const addedIds = new Set<number>();
        for (const p of sorted) {
            if (addedIds.has(p.id)) continue;
            addedIds.add(p.id);
            all.push({ name: p.name, score: p.totalScore });
        }
        all.sort((a, b) => b.score - a.score);
        return all.slice(0, 10).map((e, i) => ({ rank: i + 1, name: e.name, score: e.score }));
    }, [topSingings, sorted]);

    return (
        <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 200, color: "#fff", padding: 24,
        }}>
            <div style={{
                background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
                borderRadius: 16, padding: 28, width: "min(700px, 95vw)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                display: "flex", flexDirection: "column", gap: 18, alignItems: "stretch",
                maxHeight: "90vh", overflowY: "auto",
            }}>
                {/* Song title */}
                <p style={{ margin: 0, fontSize: 20, color: "#e2e8f0", textAlign: "center" }}>
                    {uploadedSong?.artist ? `${uploadedSong.artist} — ${uploadedSong.title}` : uploadedSong?.title ?? ""}
                </p>

                {/* ── Animated score bars ── */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {sorted.map((entry, i) => (
                        <ScoreBar key={entry.id} entry={entry} rank={i + 1} animDelay={i * 300} />
                    ))}
                </div>

                {/* ── Rankings side by side ── */}
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {sorted.length > 1 && (
                        <RankingSection
                            title={t('karaokeSummary.localRanking', '🏠 Session Ranking')}
                            entries={localRanking}
                            highlightNames={playerNames}
                            playerColorMap={playerColorMap}
                        />
                    )}
                    {topSingings.length > 0 && (
                        <RankingSection
                            title={t('karaokeSummary.globalRanking', '🏆 Top 10')}
                            entries={globalRanking}
                            highlightNames={playerNames}
                            playerColorMap={playerColorMap}
                        />
                    )}
                </div>

                {/* ── Action buttons ── */}
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
                    {livePitch && (
                        <Focusable id="summary-report">
                            <button
                                className="btn btn-info"
                                style={{ minWidth: 120, fontWeight: 700, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8 }}
                                onClick={() => setShowReport(true)}
                            >
                                📊 {t('karaokeSummary.report', 'Report')}
                            </button>
                        </Focusable>
                    )}
                    <Focusable id="summary-replay">
                        <button className="btn btn-success" style={{ minWidth: 120, fontWeight: 700 }} onClick={onRestart}>
                            {t('karaokeSummary.restart', 'Restart')}
                        </button>
                    </Focusable>
                    <Focusable id="summary-back">
                        <button className="btn btn-light" style={{ minWidth: 120, fontWeight: 700 }} onClick={onContinue}>
                            {t('karaokeSummary.continue', 'Continue')}
                        </button>
                    </Focusable>
                </div>
            </div>

            {/* ── Vocal Performance Report overlay ── */}
            {showReport && livePitch && (
                <VocalPerformanceReport
                    uploadedSong={uploadedSong}
                    playerScores={playerScores}
                    livePitch={livePitch}
                    liveVerseRatings={liveVerseRatings ?? []}
                    liveCombo={liveCombo ?? { maxCombo: 0, currentCombo: 0, totalComboBonus: 0 }}
                    difficulty={difficulty ?? "normal"}
                    micSettings={micSettings ?? {}}
                    onClose={() => setShowReport(false)}
                />
            )}
        </div>
    );
};

export default KaraokeSummaryOverlay;
