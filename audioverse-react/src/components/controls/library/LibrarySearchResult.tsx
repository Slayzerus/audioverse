// src/components/controls/library/LibrarySearchResult.tsx
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAudioRecordsQuery } from "../../../scripts/api/apiLibraryStream";
import { useUltrastarSongsQuery } from "../../../scripts/api/apiLibraryUltrastar";
import type { SongRecord } from "../../../models/modelsAudio";
import type { KaraokeSongFile } from "../../../models/modelsKaraoke";

/// Props for the tabbed results panel (Audio + Ultrastar).
type Props = {
    /// Search query text.
    query: string;
    /// Callback when an AUDIO record is picked.
    onPick?: (record: SongRecord) => void;
    /// Callback when an ULTRASTAR song is picked.
    onPickUltrastar?: (song: KaraokeSongFile) => void;
};

/// Panel styling.
const box: React.CSSProperties = { border: "1px solid var(--border-light, #e5e7eb)", borderRadius: 8, background: "var(--bg, #fff)", padding: 6, maxHeight: 420, overflow: "auto" };

/// Normalizes text for fuzzy match.
const norm = (s?: string) =>
    (s ?? "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

/// Tab identifiers.
type Tab = "audio" | "ultrastar";

/// Results list with tabs switching between Audio and Ultrastar sources.
export const LibrarySearchResult: React.FC<Props> = ({ query, onPick, onPickUltrastar }) => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>("audio");

    const qAudio = useAudioRecordsQuery({ staleTime: 60_000 });
    const audioFiltered = useMemo(() => {
        const t = norm(query);
        if (!t) return [];
        return (qAudio.data ?? []).filter(r =>
            norm(r.title).includes(t) ||
            norm((r.artists ?? []).join(" ")).includes(t) ||
            norm(r.albumDetails?.title).includes(t)
        );
    }, [qAudio.data, query]);

    const qUs = useUltrastarSongsQuery(undefined, true);
    const usFiltered = useMemo(() => {
        const t = norm(query);
        if (!t) return [];
        return (qUs.data ?? []).filter(s =>
            norm(s.title).includes(t) ||
            norm(s.artist).includes(t) ||
            norm(s.filePath).includes(t)
        );
    }, [qUs.data, query]);

    return (
        <div>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <button
                    type="button"
                    onClick={() => setTab("audio")}
                    style={{ border: "1px solid", borderColor: tab === "audio" ? "var(--primary, #4f46e5)" : "var(--border-light, #e5e7eb)", borderRadius: 6, padding: "2px 8px", background: "var(--bg, #fff)", color: tab === "audio" ? "var(--primary, #4f46e5)" : undefined }}
                >
                    Audio
                </button>
                <button
                    type="button"
                    onClick={() => setTab("ultrastar")}
                    style={{ border: "1px solid", borderColor: tab === "ultrastar" ? "var(--primary, #4f46e5)" : "var(--border-light, #e5e7eb)", borderRadius: 6, padding: "2px 8px", background: "var(--bg, #fff)", color: tab === "ultrastar" ? "var(--primary, #4f46e5)" : undefined }}
                >
                    Ultrastar
                </button>
            </div>

            {/* Body */}
            <div style={box}>
                {!query.trim() && <div style={{ padding: 8, color: "var(--muted, #6b7280)" }}>{t('librarySearch.typeToSearch')}</div>}

                {tab === "audio" && qAudio.isLoading && query.trim() && <div style={{ padding: 8, color: "#6b7280" }}>{t('librarySearch.searching')}</div>}
                {tab === "audio" && audioFiltered.length > 0 && (
                    <div style={{ overflowX: 'auto' }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th scope="col" style={{ width: 44 }}>{t('librarySearch.cover')}</th>
                                <th scope="col">{t('librarySearch.colTitle')}</th>
                                <th scope="col">{t('librarySearch.colFormat')}</th>
                            </tr>
                        </thead>
                        <tbody>
                        {audioFiltered.map(r => (
                            <tr key={r.id || r.fileName} style={{ borderBottom: "1px solid var(--row-border, #f1f5f9)", cursor: onPick ? "pointer" : "default" }}
                                onClick={() => onPick?.(r)} tabIndex={0} role="row" onKeyDown={e => { if (e.key === 'Enter') onPick?.(r); }}>
                                <td style={{ padding: 6, width: 44 }}>
                                    {r.albumDetails?.coverUrl ? (
                                        <img alt={r.title || 'Album artwork'} src={r.albumDetails.coverUrl} style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />
                                    ) : <div style={{ width: 36, height: 36, background: "var(--placeholder-bg, #e2e8f0)", borderRadius: 6 }} />}
                                </td>
                                <td style={{ padding: 6 }}>
                                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                                    <div style={{ color: "var(--text-dim, #64748b)", fontSize: 12 }}>{(r.artists ?? []).join(", ")}</div>
                                </td>
                                <td style={{ padding: 6, color: "var(--text-dim, #64748b)", fontSize: 12, textAlign: "right" }}>
                                    {r.bitsPerSample ? `${Math.round(r.sampleRateHz/1000)} kHz / ${r.bitsPerSample}-bit` : r.codecDescription}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table></div>
                )}
                {tab === "audio" && query.trim() && !qAudio.isLoading && audioFiltered.length === 0 && (
                    <div style={{ padding: 8, color: "var(--muted, #6b7280)" }}>{t('librarySearch.noResults')}</div>
                )}

                {tab === "ultrastar" && qUs.isLoading && query.trim() && <div style={{ padding: 8, color: "var(--muted, #6b7280)" }}>{t('librarySearch.searching')}</div>}
                {tab === "ultrastar" && usFiltered.length > 0 && (
                    <div style={{ overflowX: 'auto' }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th scope="col">{t('librarySearch.colTitle')}</th>
                                <th scope="col">{t('librarySearch.colFilePath')}</th>
                            </tr>
                        </thead>
                        <tbody>
                        {usFiltered.map(s => (
                            <tr key={s.filePath ?? `${s.artist ?? ""}-${s.title ?? ""}`} style={{ borderBottom: "1px solid #f1f5f9", cursor: onPickUltrastar ? "pointer" : "default" }}
                                onClick={() => onPickUltrastar?.(s)} tabIndex={0} role="row" onKeyDown={e => { if (e.key === 'Enter') onPickUltrastar?.(s); }}>
                                <td style={{ padding: 6 }}>
                                    <div style={{ fontWeight: 600 }}>{s.title ?? t('librarySearch.noTitle')}</div>
                                    <div style={{ color: "#64748b", fontSize: 12 }}>{s.artist ?? ""}</div>
                                </td>
                                <td style={{ padding: 6, color: "#64748b", fontSize: 12, textAlign: "right" }}>
                                    {s.filePath ?? ""}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table></div>
                )}
                {tab === "ultrastar" && query.trim() && !qUs.isLoading && usFiltered.length === 0 && (
                    <div style={{ padding: 8, color: "var(--muted, #6b7280)" }}>{t('librarySearch.noResults')}</div>
                )}
            </div>
        </div>
    );
};

export default LibrarySearchResult;
