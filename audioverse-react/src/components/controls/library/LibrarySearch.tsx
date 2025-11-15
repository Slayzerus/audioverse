// src/components/controls/library/LibrarySearch.tsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { useAudioRecordsQuery } from "../../../scripts/api/apiLibraryStream";
import { useUltrastarSongsQuery } from "../../../scripts/api/apiLibraryUltrastar";
import type { SongRecord } from "../../../models/modelsAudio";
import type { KaraokeSongFile } from "../../../models/modelsKaraoke";

/// Props for the tabbed search box (Audio + Ultrastar).
type Props = {
    /// Input placeholder.
    placeholder?: string;
    /// Max items in the dropdown per tab.
    maxResults?: number;
    /// Autofocus on mount.
    autoFocus?: boolean;
    /// Callback when an AUDIO record is picked.
    onPick?: (record: SongRecord) => void;
    /// Callback when an ULTRASTAR song is picked.
    onPickUltrastar?: (song: KaraokeSongFile) => void;
};

/// Small UI styles.
const box: React.CSSProperties = { border: "1px solid #d1d5db", borderRadius: 8, padding: "6px 10px" };
const listBox: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    marginTop: 6,
    boxShadow: "0 6px 24px rgba(0,0,0,.12)",
    zIndex: 30,
    overflow: "hidden",
};

/// Normalizes text for fuzzy match.
const norm = (s?: string) =>
    (s ?? "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();

/// Very simple scoring for audio records.
function scoreRecord(q: string, r: SongRecord) {
    const nq = norm(q);
    if (!nq) return 0;
    const title = norm(r.title);
    const artists = norm((r.artists ?? []).join(" "));
    let s = 0;
    if (title === nq) s += 5;
    if (artists === nq) s += 3;
    if (title.includes(nq)) s += 2;
    if (artists.includes(nq)) s += 1;
    return s;
}

/// Very simple scoring for Ultrastar songs.
function scoreUltrastar(q: string, s: KaraokeSongFile) {
    const nq = norm(q);
    if (!nq) return 0;
    const title = norm(s.title);
    const artist = norm(s.artist);
    let sc = 0;
    if (title === nq) sc += 5;
    if (artist === nq) sc += 3;
    if (title.includes(nq)) sc += 2;
    if (artist.includes(nq)) sc += 1;
    return sc;
}

/// Tabs in the search dropdown.
type Tab = "audio" | "ultrastar";

/// Search box that offers results in tabs: Audio and Ultrastar.
export const LibrarySearch: React.FC<Props> = ({ placeholder = "Szukaj…", maxResults = 5, autoFocus, onPick, onPickUltrastar }) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [activeIdx, setActiveIdx] = useState(0);
    const [tab, setTab] = useState<Tab>("audio");

    const qAudio = useAudioRecordsQuery({ staleTime: 60_000 });
    const qUs = useUltrastarSongsQuery(undefined, true);

    const audioResults = useMemo(() => {
        const all = qAudio.data ?? [];
        if (!query.trim()) return [];
        return all
            .map(r => ({ r, s: scoreRecord(query, r) }))
            .filter(x => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .slice(0, maxResults)
            .map(x => x.r);
    }, [qAudio.data, query, maxResults]);

    const usResults = useMemo(() => {
        const all = qUs.data ?? [];
        if (!query.trim()) return [];
        return all
            .map(s => ({ s, sc: scoreUltrastar(query, s) }))
            .filter(x => x.sc > 0)
            .sort((a, b) => b.sc - a.sc)
            .slice(0, maxResults)
            .map(x => x.s);
    }, [qUs.data, query, maxResults]);

    useEffect(() => { if (autoFocus) inputRef.current?.focus(); }, [autoFocus]);
    useEffect(() => { setActiveIdx(0); }, [audioResults.length, usResults.length, tab]);

    /// Keyboard navigation in the dropdown.
    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const results = tab === "audio" ? audioResults : usResults;
        if (!open && (e.key === "ArrowDown" || e.key === "Enter")) setOpen(true);
        if (!results.length) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx(i => Math.min(i + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx(i => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            const pick = results[activeIdx];
            if (pick) {
                if (tab === "audio") onPick?.(pick as SongRecord);
                else onPickUltrastar?.(pick as KaraokeSongFile);
                setOpen(false);
                setQuery("");
            }
        } else if (e.key === "Escape") {
            setOpen(false);
        }
    };

    const renderAudioRow = (r: SongRecord, i: number) => {
        const active = i === activeIdx;
        return (
            <div
                key={r.id || r.fileName}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { onPick?.(r); setOpen(false); setQuery(""); }}
                style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr auto",
                    gap: 8,
                    padding: "6px 8px",
                    cursor: "pointer",
                    alignItems: "center",
                    background: active ? "#eef2ff" : "#fff",
                }}
            >
                <div>
                    {r.albumDetails?.coverUrl ? (
                        <img src={r.albumDetails.coverUrl} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />
                    ) : <div style={{ width: 36, height: 36, background: "#e2e8f0", borderRadius: 6 }} />}
                </div>
                <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{r.title}</div>
                    <div style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                        {(r.artists ?? []).join(", ")}
                    </div>
                </div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {r.bitsPerSample ? `${Math.round(r.sampleRateHz/1000)} kHz / ${r.bitsPerSample}-bit` : r.codecDescription}
                </div>
            </div>
        );
    };

    const renderUsRow = (s: KaraokeSongFile, i: number) => {
        const active = i === activeIdx;
        return (
            <div
                key={s.filePath ?? `${s.artist ?? ""}-${s.title ?? ""}-${i}`}
                role="option"
                aria-selected={active}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { onPickUltrastar?.(s); setOpen(false); setQuery(""); }}
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    padding: "6px 8px",
                    cursor: "pointer",
                    alignItems: "center",
                    background: active ? "#eef2ff" : "#fff",
                }}
            >
                <div style={{ overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{s.title ?? "(brak tytułu)"}</div>
                    <div style={{ color: "#64748b", fontSize: 12, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                        {s.artist ?? ""}
                    </div>
                </div>
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                    {s.filePath ?? ""}
                </div>
            </div>
        );
    };

    const anyResults = (tab === "audio" ? audioResults : usResults).length > 0;

    return (
        <div style={{ position: "relative" }}>
            <input
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
                onKeyDown={onKeyDown}
                onFocus={() => anyResults && setOpen(true)}
                style={{ width: "100%", ...box }}
            />

            {open && (
                <div style={listBox} onMouseDown={(e) => e.preventDefault()}>
                    {/* Tabs header */}
                    <div style={{ display: "flex", gap: 6, padding: "6px 8px", borderBottom: "1px solid #e5e7eb" }}>
                        <button
                            type="button"
                            onClick={() => setTab("audio")}
                            style={{ border: "1px solid", borderColor: tab === "audio" ? "#4f46e5" : "#e5e7eb", borderRadius: 6, padding: "2px 8px", background: "#fff", color: tab === "audio" ? "#4f46e5" : undefined }}
                        >
                            Audio
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab("ultrastar")}
                            style={{ border: "1px solid", borderColor: tab === "ultrastar" ? "#4f46e5" : "#e5e7eb", borderRadius: 6, padding: "2px 8px", background: "#fff", color: tab === "ultrastar" ? "#4f46e5" : undefined }}
                        >
                            Ultrastar
                        </button>
                    </div>

                    {/* Body */}
                    <div>
                        {!query.trim() && <div style={{ padding: 8, color: "#6b7280" }}>Wpisz, aby wyszukać…</div>}
                        {query.trim() && tab === "audio" && qAudio.isLoading && <div style={{ padding: 8, color: "#6b7280" }}>Szukam…</div>}
                        {query.trim() && tab === "ultrastar" && qUs.isLoading && <div style={{ padding: 8, color: "#6b7280" }}>Szukam…</div>}

                        {tab === "audio" && audioResults.length > 0 && audioResults.map(renderAudioRow)}
                        {tab === "audio" && query.trim() && !qAudio.isLoading && audioResults.length === 0 && (
                            <div style={{ padding: 8, color: "#6b7280" }}>Brak wyników.</div>
                        )}

                        {tab === "ultrastar" && usResults.length > 0 && usResults.map(renderUsRow)}
                        {tab === "ultrastar" && query.trim() && !qUs.isLoading && usResults.length === 0 && (
                            <div style={{ padding: 8, color: "#6b7280" }}>Brak wyników.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibrarySearch;
