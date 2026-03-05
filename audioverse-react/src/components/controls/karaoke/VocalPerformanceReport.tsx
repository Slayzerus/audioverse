/**
 * VocalPerformanceReport.tsx
 *
 * Scientific vocal performance analysis report with charts, tables,
 * microphone settings, statistical metrics, and PDF/PNG download.
 * Designed to look professional and science-grade (for school reports).
 */

import React, { useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    BarChart, Bar, Cell,
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    PieChart, Pie,
    ResponsiveContainer,
    Area, AreaChart,
} from "recharts";
import type { PitchPoint, NoteDescriptor, ComboResult } from "../../../utils/karaokeScoring";
import type { KaraokeSongFile } from "../../../models/modelsKaraoke";
import {
    computeVocalPerformanceReport,
    type VocalPerformanceReport as ReportData,
    type MicSettingsSnapshot,
    type VerseRatingInput,
} from "../../../utils/vocalPerformanceMetrics";
import { buildNoteDescriptors } from "../../../utils/karaokeHelpers";
import { parseNotes } from "../../../scripts/karaoke/karaokeTimeline";
import { getScoringPreset } from "../../../constants/karaokeScoringConfig";
import type { PlayerScoreEntry } from "./KaraokeSummaryOverlay";

/* ═══════════════════════════════════════════
   Props
   ═══════════════════════════════════════════ */

export interface VocalPerformanceReportProps {
    uploadedSong: KaraokeSongFile | null;
    playerScores: PlayerScoreEntry[];
    livePitch: Record<number, PitchPoint[]>;
    liveVerseRatings: VerseRatingInput[];
    liveCombo: ComboResult;
    difficulty: string;
    micSettings: Record<number, MicSettingsSnapshot>;
    onClose: () => void;
}

/* ═══════════════════════════════════════════
   Styles (inline — matching karaoke pattern)
   ═══════════════════════════════════════════ */

const S = {
    overlay: {
        position: "fixed" as const, inset: 0,
        background: "rgba(0,0,0,0.92)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        zIndex: 250, color: "#e2e8f0",
        overflowY: "auto" as const,
        padding: "24px 12px",
    },
    container: {
        background: "#0f172a",
        borderRadius: 16, padding: 32, width: "min(960px, 95vw)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
        fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    },
    header: {
        textAlign: "center" as const, marginBottom: 24, borderBottom: "2px solid #334155",
        paddingBottom: 20,
    },
    title: { fontSize: 28, fontWeight: 800, color: "#f1f5f9", margin: "0 0 4px" },
    subtitle: { fontSize: 14, color: "#64748b", margin: 0 },
    sectionTitle: {
        fontSize: 18, fontWeight: 700, color: "#38bdf8", margin: "28px 0 12px",
        borderBottom: "1px solid #1e293b", paddingBottom: 6,
        display: "flex" as const, alignItems: "center" as const, gap: 8,
    },
    table: {
        width: "100%", borderCollapse: "collapse" as const, fontSize: 13,
        margin: "8px 0",
    },
    th: {
        background: "#1e293b", color: "#94a3b8", padding: "8px 12px",
        textAlign: "left" as const, fontWeight: 600, fontSize: 12,
        textTransform: "uppercase" as const, letterSpacing: 0.5,
        borderBottom: "2px solid #334155",
    },
    thRight: {
        background: "#1e293b", color: "#94a3b8", padding: "8px 12px",
        textAlign: "right" as const, fontWeight: 600, fontSize: 12,
        textTransform: "uppercase" as const, letterSpacing: 0.5,
        borderBottom: "2px solid #334155",
    },
    td: {
        padding: "6px 12px", borderBottom: "1px solid #1e293b", color: "#cbd5e1",
    },
    tdRight: {
        padding: "6px 12px", borderBottom: "1px solid #1e293b",
        textAlign: "right" as const, color: "#e2e8f0", fontWeight: 500,
    },
    tdBold: {
        padding: "6px 12px", borderBottom: "1px solid #1e293b",
        color: "#f1f5f9", fontWeight: 700,
    },
    kpiGrid: {
        display: "grid" as const,
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12, margin: "12px 0",
    },
    kpiCard: {
        background: "#1e293b", borderRadius: 10, padding: "14px 16px",
        textAlign: "center" as const, border: "1px solid #334155",
    },
    kpiValue: { fontSize: 26, fontWeight: 800, color: "#fbbf24" },
    kpiLabel: { fontSize: 11, color: "#64748b", marginTop: 2, textTransform: "uppercase" as const, letterSpacing: 0.8 },
    kpiUnit: { fontSize: 13, fontWeight: 400, color: "#94a3b8", marginLeft: 2 },
    chartWrap: {
        background: "#1e293b", borderRadius: 10, padding: 16,
        margin: "12px 0", border: "1px solid #334155",
    },
    chartTitle: { fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textAlign: "center" as const },
    badge: (color: string) => ({
        display: "inline-block", padding: "2px 10px", borderRadius: 20,
        background: color, color: "#fff", fontSize: 12, fontWeight: 700,
    }),
    btnPrimary: {
        background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8,
        padding: "10px 22px", fontSize: 14, fontWeight: 700, cursor: "pointer",
    },
    btnSecondary: {
        background: "#334155", color: "#e2e8f0", border: "none", borderRadius: 8,
        padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
    },
    row: { display: "flex" as const, gap: 16, flexWrap: "wrap" as const },
    half: { flex: "1 1 45%", minWidth: 280 },
    footer: {
        textAlign: "center" as const, marginTop: 24, paddingTop: 16,
        borderTop: "1px solid #1e293b", color: "#475569", fontSize: 11,
    },
} as const;

/* grade color helper */
function gradeColor(pct: number): string {
    if (pct >= 90) return "#22c55e";
    if (pct >= 70) return "#84cc16";
    if (pct >= 50) return "#eab308";
    if (pct >= 30) return "#f97316";
    return "#ef4444";
}

function verseColor(label: string): string {
    switch (label) {
        case "Perfect": return "#22c55e";
        case "Great": return "#84cc16";
        case "Good": return "#eab308";
        case "OK": return "#f97316";
        default: return "#ef4444";
    }
}

/* ═══════════════════════════════════════════
   Component
   ═══════════════════════════════════════════ */

const VocalPerformanceReport: React.FC<VocalPerformanceReportProps> = ({
    uploadedSong, playerScores, livePitch, liveVerseRatings, liveCombo,
    difficulty, micSettings, onClose,
}) => {
    const { t } = useTranslation();
    const reportRef = useRef<HTMLDivElement>(null);

    // Build note descriptors from the song
    const notes: NoteDescriptor[] = useMemo(() => {
        if (!uploadedSong) return [];
        const parsed = parseNotes(
            uploadedSong.notes.map(n => n.noteLine),
            uploadedSong.bpm ?? undefined,
        );
        const gapSec = (uploadedSong.gap ?? 0) / 1000;
        return buildNoteDescriptors(parsed, gapSec);
    }, [uploadedSong]);

    // Compute reports for each player
    const reports: ReportData[] = useMemo(() => {
        if (!uploadedSong) return [];
        return playerScores.map(ps => {
            const pts = livePitch[ps.id] || [];
            return computeVocalPerformanceReport({
                playerName: ps.name,
                playerColor: ps.color,
                songTitle: uploadedSong.title,
                songArtist: uploadedSong.artist,
                songBpm: uploadedSong.bpm ?? 0,
                difficulty,
                pitchPoints: pts,
                notes,

                verseRatings: liveVerseRatings,
                combo: liveCombo,
                classicScore: ps.classicScore,
                bonusScore: ps.bonusScore,
                totalScore: ps.totalScore,
                micSettings: micSettings[ps.id] ?? null,
            });
        });
    }, [uploadedSong, playerScores, livePitch, liveVerseRatings, liveCombo, difficulty, notes, micSettings]);

    // Download as HTML
    const handleDownloadHTML = useCallback(() => {
        if (!reportRef.current) return;
        const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Vocal Performance Report — ${reports[0]?.songTitle ?? "Karaoke"}</title>
<style>
body{margin:0;padding:24px;background:#0f172a;color:#e2e8f0;font-family:'Segoe UI',system-ui,sans-serif}
table{border-collapse:collapse;width:100%}th,td{padding:6px 10px;border-bottom:1px solid #1e293b;text-align:left}
th{background:#1e293b;color:#94a3b8;font-size:12px;text-transform:uppercase}
.kpi{background:#1e293b;border-radius:10px;padding:14px;text-align:center;border:1px solid #334155}
.val{font-size:24px;font-weight:800;color:#fbbf24}.lbl{font-size:11px;color:#64748b;text-transform:uppercase}
@media print{body{background:#fff;color:#000}th{background:#f0f0f0;color:#333}td{color:#333;border-color:#ddd}}
</style></head><body>
${reportRef.current.innerHTML}
</body></html>`;
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vocal-report-${(reports[0]?.songTitle ?? "karaoke").replace(/[^a-z0-9]/gi, "_")}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }, [reports]);

    // Print (PDF via browser)
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // Download JSON data
    const handleDownloadJSON = useCallback(() => {
        const json = JSON.stringify(reports, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vocal-data-${(reports[0]?.songTitle ?? "karaoke").replace(/[^a-z0-9]/gi, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [reports]);

    if (reports.length === 0) return null;

    // For multi-player, show all; for single show detailed view
    const primary = reports[0];
    const preset = getScoringPreset(difficulty as "easy" | "normal" | "hard");

    // ── Grade computation (scientific, percentile-based) ──
    const overallPct = (
        primary.intonationAccuracyPct * 0.30 +
        primary.perfectHitPct * 0.20 +
        primary.rhythmStabilityPct * 0.15 +
        primary.shimmerProxy * 0.10 +
        Math.min(100, (primary.maxCombo / Math.max(notes.length, 1)) * 100) * 0.10 +
        Math.min(100, (primary.totalScore / 10000) * 100) * 0.15
    );
    const grade = overallPct >= 95 ? "A+" : overallPct >= 90 ? "A" : overallPct >= 85 ? "A−"
        : overallPct >= 80 ? "B+" : overallPct >= 75 ? "B" : overallPct >= 70 ? "B−"
        : overallPct >= 65 ? "C+" : overallPct >= 60 ? "C" : overallPct >= 55 ? "C−"
        : overallPct >= 50 ? "D+" : overallPct >= 45 ? "D" : overallPct >= 40 ? "D−"
        : "F";
    const gradeDescriptions: Record<string, string> = {
        "A+": t('vocalReport.gradeAPlus'),
        "A": t('vocalReport.gradeA'),
        "A−": t('vocalReport.gradeAMinus'),
        "B+": t('vocalReport.gradeBPlus'),
        "B": t('vocalReport.gradeB'),
        "B−": t('vocalReport.gradeBMinus'),
        "C+": t('vocalReport.gradeCPlus'),
        "C": t('vocalReport.gradeC'),
        "C−": t('vocalReport.gradeCMinus'),
        "D+": t('vocalReport.gradeDPlus'),
        "D": t('vocalReport.gradeD'),
        "D−": t('vocalReport.gradeDMinus'),
        "F": t('vocalReport.gradeF'),
    };
    let sec = 0; // section counter

    // Radar chart data
    const radarData = [
        { metric: t('vocalReport.radarIntonation'), value: primary.intonationAccuracyPct, max: 100 },
        { metric: t('vocalReport.radarPerfectHits'), value: primary.perfectHitPct, max: 100 },
        { metric: t('vocalReport.radarRhythm'), value: primary.rhythmStabilityPct, max: 100 },
        { metric: t('vocalReport.radarVocalRange'), value: Math.min(100, (primary.rangeInSemitones / 24) * 100), max: 100 },
        { metric: t('vocalReport.radarStability'), value: primary.shimmerProxy, max: 100 },
        { metric: t('vocalReport.radarCombo'), value: Math.min(100, (primary.maxCombo / Math.max(notes.length, 1)) * 100), max: 100 },
    ];

    // Hit/miss pie data
    const pieData = [
        { name: t('vocalReport.perfLabel'), value: primary.perfectHitPct, fill: "#22c55e" },
        { name: t('vocalReport.goodLabel'), value: primary.intonationAccuracyPct - primary.perfectHitPct, fill: "#84cc16" },
        { name: t('vocalReport.offPitch'), value: 100 - primary.intonationAccuracyPct, fill: "#ef4444" },
    ].filter(d => d.value > 0);

    // Pitch class bar chart data
    const chromaData = primary.pitchClassDistribution
        .filter(pc => pc.count > 0)
        .sort((a, b) => b.pct - a.pct);

    // Verse bar chart
    const verseBarData = primary.verseMetrics.map(vm => ({
        verse: `V${vm.verseIndex + 1}`,
        accuracy: Math.round(vm.hitFraction * 100),
        label: vm.label,
    }));

    // Downsample pitch-over-time for chart (max ~500 points)
    const pitchChartData = (() => {
        const raw = primary.pitchOverTime;
        if (raw.length <= 500) return raw;
        const step = Math.ceil(raw.length / 500);
        return raw.filter((_, i) => i % step === 0);
    })();

    return (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            {/* Print stylesheet */}
            <style>{`
                @media print {
                    body { background: #fff !important; color: #000 !important; }
                    * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
            <div ref={reportRef} style={S.container}>
                {/* ── Header ── */}
                <div style={S.header}>
                    <h1 style={S.title}>📊 {t('vocalReport.title')}</h1>
                    <p style={S.subtitle}>
                        {primary.songArtist} — {primary.songTitle} &nbsp;|&nbsp;
                        {t('vocalReport.difficulty')}: <strong>{primary.difficulty}</strong> &nbsp;|&nbsp;
                        {new Date(primary.timestamp).toLocaleString()}
                    </p>
                    {/* Overall grade badge */}
                    <div style={{ marginTop: 16, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
                        <div style={{
                            width: 72, height: 72, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                            background: `linear-gradient(135deg, ${gradeColor(overallPct)}44, ${gradeColor(overallPct)})`,
                            border: `3px solid ${gradeColor(overallPct)}`,
                            boxShadow: `0 0 20px ${gradeColor(overallPct)}44`,
                        }}>
                            <span style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>{grade}</span>
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: gradeColor(overallPct) }}>
                                {t('vocalReport.overallGrade', { pct: overallPct.toFixed(1) })}
                            </div>
                            <div style={{ fontSize: 12, color: "#94a3b8", maxWidth: 360 }}>
                                {gradeDescriptions[grade] ?? ""}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginBottom: 16, flexWrap: "wrap" }}>
                    <button style={S.btnPrimary} onClick={handleDownloadHTML} title={t('vocalReport.downloadHtml')}>
                        📥 {t('vocalReport.downloadHtml')}
                    </button>
                    <button style={S.btnSecondary} onClick={handlePrint} title={t('vocalReport.printPdf')}>
                        🖨️ {t('vocalReport.printPdf')}
                    </button>
                    <button style={S.btnSecondary} onClick={handleDownloadJSON} title={t('vocalReport.exportJson')}>
                        📋 {t('vocalReport.exportJson')}
                    </button>
                    <button style={S.btnSecondary} onClick={onClose}>
                        ✕ {t('vocalReport.close')}
                    </button>
                </div>

                {/* ═══════════════════════════════════════════
                    Section 1: Score Overview (KPIs)
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>🎯 {++sec}. {t('vocalReport.scoreOverview')}</h2>
                <div style={S.kpiGrid}>
                    <div style={S.kpiCard}>
                        <div style={S.kpiValue}>{primary.totalScore.toLocaleString()}</div>
                        <div style={S.kpiLabel}>{t('vocalReport.totalScore')}</div>
                    </div>
                    <div style={S.kpiCard}>
                        <div style={S.kpiValue}>{primary.classicScore.toLocaleString()}</div>
                        <div style={S.kpiLabel}>{t('vocalReport.classicScore')}</div>
                    </div>
                    <div style={S.kpiCard}>
                        <div style={S.kpiValue}>{primary.bonusScore.toLocaleString()}</div>
                        <div style={S.kpiLabel}>{t('vocalReport.bonusScore')}</div>
                    </div>
                    <div style={S.kpiCard}>
                        <div style={S.kpiValue}>{primary.maxCombo}×</div>
                        <div style={S.kpiLabel}>{t('vocalReport.maxCombo')}</div>
                    </div>
                    <div style={S.kpiCard}>
                        <div style={{ ...S.kpiValue, color: gradeColor(primary.intonationAccuracyPct) }}>
                            {primary.intonationAccuracyPct}%
                        </div>
                        <div style={S.kpiLabel}>{t('vocalReport.intonationAccuracy')}</div>
                    </div>
                    <div style={S.kpiCard}>
                        <div style={{ ...S.kpiValue, color: gradeColor(primary.perfectHitPct) }}>
                            {primary.perfectHitPct}%
                        </div>
                        <div style={S.kpiLabel}>{t('vocalReport.perfectHits')}</div>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    Section 2: Multi-player comparison table
                    ═══════════════════════════════════════════ */}
                {reports.length > 1 && (
                    <>
                        <h2 style={S.sectionTitle}>👥 {++sec}. {t('vocalReport.playerComparison')}</h2>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>#</th>
                                    <th style={S.th}>{t('vocalReport.player')}</th>
                                    <th style={S.thRight}>{t('vocalReport.classic')}</th>
                                    <th style={S.thRight}>{t('vocalReport.bonus')}</th>
                                    <th style={S.thRight}>{t('vocalReport.total')}</th>
                                    <th style={S.thRight}>{t('vocalReport.intonation')}</th>
                                    <th style={S.thRight}>{t('vocalReport.perfect')}</th>
                                    <th style={S.thRight}>{t('vocalReport.range')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.map((r, i) => (
                                    <tr key={i}>
                                        <td style={S.td}>{i + 1}</td>
                                        <td style={{ ...S.tdBold, color: r.playerColor }}>{r.playerName}</td>
                                        <td style={S.tdRight}>{r.classicScore.toLocaleString()}</td>
                                        <td style={S.tdRight}>{r.bonusScore.toLocaleString()}</td>
                                        <td style={{ ...S.tdRight, fontWeight: 700, color: "#fbbf24" }}>{r.totalScore.toLocaleString()}</td>
                                        <td style={S.tdRight}>
                                            <span style={S.badge(gradeColor(r.intonationAccuracyPct))}>{r.intonationAccuracyPct}%</span>
                                        </td>
                                        <td style={S.tdRight}>
                                            <span style={S.badge(gradeColor(r.perfectHitPct))}>{r.perfectHitPct}%</span>
                                        </td>
                                        <td style={S.tdRight}>{r.lowestNote}–{r.highestNote}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ═══════════════════════════════════════════
                    Section 3: Pitch Accuracy Analysis
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>🎵 {++sec}. {t('vocalReport.pitchAccuracy')}</h2>

                {/* Statistical summary table */}
                <table style={S.table}>
                    <thead>
                        <tr>
                            <th style={S.th}>{t('vocalReport.metric')}</th>
                            <th style={S.thRight}>{t('vocalReport.value')}</th>
                            <th style={S.th}>{t('vocalReport.description')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={S.tdBold}>{t('vocalReport.meanAbsDev')}</td>
                            <td style={S.tdRight}>{primary.avgCentDeviation}<span style={S.kpiUnit}> {t('vocalReport.cents')}</span></td>
                            <td style={S.td}>{t('vocalReport.meanAbsDevDesc')}</td>
                        </tr>
                        <tr>
                            <td style={S.tdBold}>{t('vocalReport.medianDev')}</td>
                            <td style={S.tdRight}>{primary.medianCentDeviation}<span style={S.kpiUnit}> {t('vocalReport.cents')}</span></td>
                            <td style={S.td}>{t('vocalReport.medianDevDesc')}</td>
                        </tr>
                        <tr>
                            <td style={S.tdBold}>{t('vocalReport.stdDev')}</td>
                            <td style={S.tdRight}>{primary.stdDevCents}<span style={S.kpiUnit}> {t('vocalReport.cents')}</span></td>
                            <td style={S.td}>{t('vocalReport.stdDevDesc')}</td>
                        </tr>
                        <tr>
                            <td style={S.tdBold}>{t('vocalReport.intonationAccuracyLabel')}</td>
                            <td style={{ ...S.tdRight, color: gradeColor(primary.intonationAccuracyPct) }}>
                                {primary.intonationAccuracyPct}%
                            </td>
                            <td style={S.td}>{t('vocalReport.intonationAccuracyDesc')}</td>
                        </tr>
                        <tr>
                            <td style={S.tdBold}>{t('vocalReport.perfectHitRate')}</td>
                            <td style={{ ...S.tdRight, color: gradeColor(primary.perfectHitPct) }}>
                                {primary.perfectHitPct}%
                            </td>
                            <td style={S.td}>{t('vocalReport.perfectHitRateDesc')}</td>
                        </tr>
                        <tr>
                            <td style={S.tdBold}>{t('vocalReport.totalPitchSamples')}</td>
                            <td style={S.tdRight}>{primary.totalPitchPoints.toLocaleString()}</td>
                            <td style={S.td}>{t('vocalReport.totalPitchSamplesDesc')}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Deviation histogram */}
                <div style={S.chartWrap}>
                    <div style={S.chartTitle}>{t('vocalReport.deviationDistribution')}</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={primary.pitchDeviationHistogram} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="centRange" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                            <Tooltip
                                contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                                formatter={(value, name) => [name === "pct" ? `${Number(value).toFixed(1)}%` : value, name === "pct" ? t('vocalReport.percentage') : t('vocalReport.count')]}
                            />
                            <Bar dataKey="count" name={t('vocalReport.samples')} radius={[4, 4, 0, 0]}>
                                {primary.pitchDeviationHistogram.map((entry, i) => (
                                    <Cell key={i} fill={entry.centRange.includes("−15 to 0") || entry.centRange.includes("0 to +15") ? "#22c55e" : entry.centRange.includes("25") ? "#eab308" : "#ef4444"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Hit-miss pie */}
                <div style={S.row}>
                    <div style={{ ...S.chartWrap, ...S.half }}>
                        <div style={S.chartTitle}>{t('vocalReport.hitClassification')}</div>
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                                    outerRadius={80} label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                                    labelLine={{ stroke: "#64748b" }}
                                    stroke="#0f172a" strokeWidth={2}>
                                    {pieData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Radar chart */}
                    <div style={{ ...S.chartWrap, ...S.half }}>
                        <div style={S.chartTitle}>{t('vocalReport.performanceProfile')}</div>
                        <ResponsiveContainer width="100%" height={220}>
                            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={75}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                <Radar name="Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    Section 4: Pitch over Time
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>📈 {++sec}. {t('vocalReport.pitchTracking')}</h2>
                <div style={S.chartWrap}>
                    <div style={S.chartTitle}>{t('vocalReport.sungVsExpected')}</div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={pitchChartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 11 }}
                                tickFormatter={(v: number) => `${v.toFixed(0)}s`} />
                            <YAxis domain={["auto", "auto"]} tick={{ fill: "#94a3b8", fontSize: 11 }}
                                label={{ value: t('vocalReport.midiNote'), angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                                formatter={(value) => { const v = Number(value); return v > 0 ? v.toFixed(1) : "—"; }} />
                            <Legend wrapperStyle={{ color: "#94a3b8", fontSize: 12 }} />
                            <Line type="monotone" dataKey="expected" name={t('vocalReport.expected')} stroke="#22c55e" dot={false} strokeWidth={2} strokeOpacity={0.6} />
                            <Line type="monotone" dataKey="sung" name={t('vocalReport.sung')} stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Rolling accuracy */}
                <div style={S.chartWrap}>
                    <div style={S.chartTitle}>{t('vocalReport.rollingAccuracy')}</div>
                    <ResponsiveContainer width="100%" height={180}>
                        <AreaChart data={primary.accuracyOverTime} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 11 }}
                                tickFormatter={(v: number) => `${v.toFixed(0)}s`} />
                            <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }}
                                label={{ value: t('vocalReport.accuracyPct'), angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                            <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                                formatter={(value) => `${Number(value).toFixed(1)}%`} />
                            <Area type="monotone" dataKey="accuracy" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* ═══════════════════════════════════════════
                    Section 5: Vocal Range & Chromagram
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>🎤 {++sec}. {t('vocalReport.vocalRange')}</h2>

                <div style={S.row}>
                    {/* Range table */}
                    <div style={S.half}>
                        <table style={S.table}>
                            <tbody>
                                <tr><td style={S.tdBold}>{t('vocalReport.lowestNote')}</td><td style={S.tdRight}>{primary.lowestNote} ({primary.lowestHz} Hz)</td></tr>
                                <tr><td style={S.tdBold}>{t('vocalReport.highestNote')}</td><td style={S.tdRight}>{primary.highestNote} ({primary.highestHz} Hz)</td></tr>
                                <tr><td style={S.tdBold}>{t('vocalReport.rangeLabel')}</td><td style={S.tdRight}>{primary.rangeInSemitones} {t('vocalReport.semitones')}</td></tr>
                                <tr><td style={S.tdBold}>{t('vocalReport.tessitura')}</td><td style={S.tdRight}>{primary.tessituraLow} — {primary.tessituraHigh}</td></tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Chromagram */}
                    <div style={{ ...S.chartWrap, ...S.half }}>
                        <div style={S.chartTitle}>{t('vocalReport.chromagram')}</div>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chromaData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="note" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                                    formatter={(value) => `${Number(value).toFixed(1)}%`} />
                                <Bar dataKey="pct" name={t('vocalReport.usagePct')} radius={[4, 4, 0, 0]} fill="#6366f1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    Section 6: Vibrato Analysis
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>〰️ {++sec}. {t('vocalReport.vibratoStability')}</h2>
                <div style={S.row}>
                    <div style={S.half}>
                        <table style={S.table}>
                            <tbody>
                                <tr>
                                    <td style={S.tdBold}>{t('vocalReport.vibratoDetected')}</td>
                                    <td style={S.tdRight}>
                                        <span style={S.badge(primary.vibrato.detected ? "#22c55e" : "#64748b")}>
                                            {primary.vibrato.detected ? t('vocalReport.yes') : t('vocalReport.no')}
                                        </span>
                                    </td>
                                </tr>
                                {primary.vibrato.detected && (
                                    <>
                                        <tr><td style={S.tdBold}>{t('vocalReport.avgRate')}</td><td style={S.tdRight}>{primary.vibrato.avgRateHz} Hz</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.avgExtent')}</td><td style={S.tdRight}>±{primary.vibrato.avgExtentCents} {t('vocalReport.cents')}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.regularity')}</td><td style={S.tdRight}>{primary.vibrato.regularityPct}%</td></tr>
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div style={S.half}>
                        <table style={S.table}>
                            <tbody>
                                <tr><td style={S.tdBold}>{t('vocalReport.jitter')}</td><td style={S.tdRight}>{primary.jitterPct}%</td></tr>
                                <tr><td style={S.tdBold}>{t('vocalReport.vocalPresence')}</td><td style={S.tdRight}>{primary.shimmerProxy}%</td></tr>
                                <tr><td style={S.tdBold}>{t('vocalReport.avgOnsetDev')}</td><td style={S.tdRight}>{primary.avgOnsetDeviationMs} ms</td></tr>
                                <tr><td style={S.tdBold}>{t('vocalReport.rhythmStability')}</td><td style={S.tdRight}>
                                    <span style={S.badge(gradeColor(primary.rhythmStabilityPct))}>{primary.rhythmStabilityPct}%</span>
                                </td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    Section 7: Per-Verse Breakdown
                    ═══════════════════════════════════════════ */}
                {primary.verseMetrics.length > 0 && (
                    <>
                        <h2 style={S.sectionTitle}>📝 {++sec}. {t('vocalReport.verseBreakdown')}</h2>

                        <div style={S.chartWrap}>
                            <div style={S.chartTitle}>{t('vocalReport.accuracyByVerse')}</div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={verseBarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="verse" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                    <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                                    <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }}
                                        formatter={(value) => `${Number(value)}%`} />
                                    <Bar dataKey="accuracy" name={t('vocalReport.hitPct')} radius={[4, 4, 0, 0]}>
                                        {verseBarData.map((d, i) => (
                                            <Cell key={i} fill={verseColor(d.label)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>{t('vocalReport.verse')}</th>
                                    <th style={S.th}>{t('vocalReport.rating')}</th>
                                    <th style={S.thRight}>{t('vocalReport.hitPct')}</th>
                                    <th style={S.thRight}>{t('vocalReport.avgDeviation')}</th>
                                    <th style={S.thRight}>{t('vocalReport.notes')}</th>
                                    <th style={S.thRight}>{t('vocalReport.notesHit')}</th>
                                    <th style={S.thRight}>{t('vocalReport.comboBonus')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {primary.verseMetrics.map((vm, i) => (
                                    <tr key={i}>
                                        <td style={S.td}>{t('vocalReport.verse')} {vm.verseIndex + 1}</td>
                                        <td style={S.td}>
                                            <span style={S.badge(verseColor(vm.label))}>{vm.label}</span>
                                        </td>
                                        <td style={S.tdRight}>{(vm.hitFraction * 100).toFixed(1)}%</td>
                                        <td style={S.tdRight}>{vm.avgCentDeviation} ¢</td>
                                        <td style={S.tdRight}>{vm.noteCount}</td>
                                        <td style={S.tdRight}>{vm.notesHit}</td>
                                        <td style={S.tdRight}>+{vm.comboBonus}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ═══════════════════════════════════════════
                    Section 8: Scoring Parameters
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>⚙️ {++sec}. {t('vocalReport.scoringConfig')}</h2>
                <table style={S.table}>
                    <thead>
                        <tr>
                            <th style={S.th}>{t('vocalReport.parameter')}</th>
                            <th style={S.thRight}>{t('vocalReport.value')}</th>
                            <th style={S.th}>{t('vocalReport.description')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style={S.tdBold}>{t('vocalReport.difficultyLevel')}</td><td style={S.tdRight}>{primary.difficulty}</td><td style={S.td}>{t('vocalReport.difficultyLevelDesc')}</td></tr>
                        <tr><td style={S.tdBold}>{t('vocalReport.semitoneTolerance')}</td><td style={S.tdRight}>{preset.semitoneTolerance}</td><td style={S.td}>{t('vocalReport.semitoneToleranceDesc')}</td></tr>
                        <tr><td style={S.tdBold}>{t('vocalReport.preWindow')}</td><td style={S.tdRight}>{preset.preWindow} s</td><td style={S.td}>{t('vocalReport.preWindowDesc')}</td></tr>
                        <tr><td style={S.tdBold}>{t('vocalReport.postExtra')}</td><td style={S.tdRight}>{preset.postExtra} s</td><td style={S.td}>{t('vocalReport.postExtraDesc')}</td></tr>
                        <tr><td style={S.tdBold}>{t('vocalReport.difficultyMultiplier')}</td><td style={S.tdRight}>{preset.difficultyMult}×</td><td style={S.td}>{t('vocalReport.difficultyMultiplierDesc')}</td></tr>
                        <tr><td style={S.tdBold}>{t('vocalReport.songBpm')}</td><td style={S.tdRight}>{primary.songBpm}</td><td style={S.td}>{t('vocalReport.songBpmDesc')}</td></tr>
                        <tr><td style={S.tdBold}>{t('vocalReport.totalNotes')}</td><td style={S.tdRight}>{notes.length}</td><td style={S.td}>{t('vocalReport.totalNotesDesc')}</td></tr>
                    </tbody>
                </table>

                {/* ═══════════════════════════════════════════
                    Section 9: Microphone Settings
                    ═══════════════════════════════════════════ */}
                {reports.some(r => r.micSettings) && (
                    <>
                        <h2 style={S.sectionTitle}>🎙️ {++sec}. {t('vocalReport.micConfig')}</h2>
                        {reports.map((r, idx) => r.micSettings && (
                            <div key={idx} style={{ marginBottom: 16 }}>
                                {reports.length > 1 && (
                                    <h4 style={{ color: r.playerColor, margin: "0 0 8px", fontSize: 14 }}>
                                        {r.playerName}
                                    </h4>
                                )}
                                <table style={S.table}>
                                    <thead>
                                        <tr>
                                            <th style={S.th}>{t('vocalReport.setting')}</th>
                                            <th style={S.thRight}>{t('vocalReport.value')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr><td style={S.tdBold}>{t('vocalReport.device')}</td><td style={S.tdRight}>{r.micSettings.deviceLabel || r.micSettings.deviceId}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.pitchAlgorithm')}</td><td style={S.tdRight}>{r.micSettings.algorithm}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.inputGain')}</td><td style={S.tdRight}>{r.micSettings.gain}×</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.rmsThreshold')}</td><td style={S.tdRight}>{r.micSettings.rmsThreshold}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.pitchThreshold')}</td><td style={S.tdRight}>{r.micSettings.pitchThreshold}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.smoothingWindow')}</td><td style={S.tdRight}>{r.micSettings.smoothingWindow} {t('vocalReport.frames')}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.hysteresisFrames')}</td><td style={S.tdRight}>{r.micSettings.hysteresisFrames}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.hanningWindow')}</td><td style={S.tdRight}>{r.micSettings.useHanning ? t('vocalReport.enabled') : t('vocalReport.disabled')}</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.latencyOffset')}</td><td style={S.tdRight}>{r.micSettings.latencyOffsetMs} ms</td></tr>
                                        <tr><td style={S.tdBold}>{t('vocalReport.monitor')}</td><td style={S.tdRight}>{r.micSettings.monitorEnabled ? `${t('vocalReport.on')} (${Math.round(r.micSettings.monitorVolume * 100)}%)` : t('vocalReport.off')}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        ))}
                    </>
                )}

                {/* ═══════════════════════════════════════════
                    Methodology
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>🔬 {++sec}. {t('vocalReport.methodology')}</h2>
                <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong style={{ color: "#cbd5e1" }}>1. {t('vocalReport.methDataAcq')}:</strong> {t('vocalReport.methDataAcqText', { algorithm: primary.micSettings?.algorithm ?? "pitchy" })}
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong style={{ color: "#cbd5e1" }}>2. {t('vocalReport.methPitchAcc')}:</strong> {t('vocalReport.methPitchAccText')}
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong style={{ color: "#cbd5e1" }}>3. {t('vocalReport.methStatAnal')}:</strong> {t('vocalReport.methStatAnalText')}
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong style={{ color: "#cbd5e1" }}>4. {t('vocalReport.methVibrato')}:</strong> {t('vocalReport.methVibratoText')}
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong style={{ color: "#cbd5e1" }}>5. {t('vocalReport.methJitter')}:</strong> {t('vocalReport.methJitterText')}
                    </p>
                    <p style={{ margin: "0 0 8px" }}>
                        <strong style={{ color: "#cbd5e1" }}>6. {t('vocalReport.methGrading')}:</strong> {t('vocalReport.methGradingText')}
                    </p>
                    <p style={{ margin: "0 0 0" }}>
                        <strong style={{ color: "#cbd5e1" }}>{t('vocalReport.references')}:</strong> Sundberg, J. (1987). <em>The Science of the Singing Voice</em>.
                        DeKalb: Northern Illinois University Press. &nbsp;|&nbsp;
                        Boersma, P. (1993). "Accurate short-term analysis of the fundamental period and the harmonics-to-noise ratio of a sampled sound."
                        <em> IFA Proceedings</em>, 17, pp. 97–110.
                    </p>
                </div>

                {/* ═══════════════════════════════════════════
                    Conclusion
                    ═══════════════════════════════════════════ */}
                <h2 style={S.sectionTitle}>📋 {++sec}. {t('vocalReport.conclusion')}</h2>
                <div style={{
                    background: "#1e293b", borderRadius: 10, padding: 20,
                    border: `1px solid ${gradeColor(overallPct)}44`, fontSize: 14, lineHeight: 1.8,
                }}>
                    <p style={{ margin: "0 0 10px", color: "#e2e8f0" }}>
                        {t('vocalReport.conclusionAchieved', { player: primary.playerName, score: primary.totalScore.toLocaleString(), song: `${primary.songArtist} — ${primary.songTitle}`, difficulty: primary.difficulty })}
                    </p>
                    <p style={{ margin: "0 0 10px", color: "#e2e8f0" }}>
                        {t('vocalReport.conclusionPitch', { samples: primary.totalPitchPoints.toLocaleString() })}
                    </p>
                    <ul style={{ margin: "0 0 10px", paddingLeft: 20, color: "#cbd5e1" }}>
                        <li>{t('vocalReport.conclusionIntonation', { accuracy: primary.intonationAccuracyPct, perfect: primary.perfectHitPct })}</li>
                        <li>{t('vocalReport.conclusionDeviation', { avg: primary.avgCentDeviation, std: primary.stdDevCents })}</li>
                        <li>{t('vocalReport.conclusionRange', { semitones: primary.rangeInSemitones, low: primary.lowestNote, high: primary.highestNote })}</li>
                        <li>{t('vocalReport.conclusionCombo', { combo: primary.maxCombo })}</li>
                        <li>{t('vocalReport.conclusionRhythm', { rhythm: primary.rhythmStabilityPct })}</li>
                        {primary.vibrato.detected && (
                            <li>{t('vocalReport.conclusionVibrato', { rate: primary.vibrato.avgRateHz, extent: primary.vibrato.avgExtentCents })}</li>
                        )}
                    </ul>
                    <p style={{ margin: 0, color: "#e2e8f0" }}>
                        <strong>{t('vocalReport.overallAssessment')}:</strong> {t('vocalReport.grade')}{" "}
                        <span style={{
                            display: "inline-block", padding: "2px 12px", borderRadius: 6,
                            background: gradeColor(overallPct), color: "#fff", fontWeight: 800, fontSize: 16,
                        }}>{grade}</span>{" "}
                        ({overallPct.toFixed(1)}%) — {gradeDescriptions[grade] ?? ""}.
                    </p>
                </div>

                {/* ── Footer ── */}
                <div style={S.footer}>
                    <p>{t('vocalReport.footerGenerated', { id: primary.timestamp.replace(/[-:T.Z]/g, "").slice(0, 14) })}</p>
                    <p>© {new Date().getFullYear()} AudioVerse &nbsp;|&nbsp; {t('vocalReport.footerCopyright')}</p>
                </div>
            </div>
        </div>
    );
};

export default VocalPerformanceReport;
