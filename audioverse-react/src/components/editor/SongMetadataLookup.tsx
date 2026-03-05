/**
 * SongMetadataLookup — extracts metadata (ID3, Vorbis, etc.) from an uploaded
 * audio file and allows Spotify search to fill in artist, genre, cover, lyrics.
 */
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import * as mmb from "music-metadata-browser";
import { fetchSpotifySearch } from "../../scripts/api/apiLibraryExternal";
import type { ExternalTrackResult } from "../../models/modelsKaraoke";
import { logger } from "../../utils/logger";
const log = logger.scoped('SongMetadataLookup');

// ── Extracted metadata shape ──
export interface SongMetadata {
    title?: string;
    artist?: string;
    album?: string;
    genre?: string;
    year?: number;
    bpm?: number;
    coverDataUrl?: string;
    durationSec?: number;
    // from Spotify lookup
    spotifyId?: string;
    spotifyCoverUrl?: string;
    isrc?: string;
}

interface Props {
    audioFile: File | null;
    /** Called when user confirms metadata — EditorShell can inject into #TITLE, #ARTIST, etc. */
    onApply?: (meta: SongMetadata) => void;
}

const SongMetadataLookup: React.FC<Props> = ({ audioFile, onApply }) => {
    const { t } = useTranslation();
    const [meta, setMeta] = useState<SongMetadata>({});
    const [parsing, setParsing] = useState(false);
    const [parseError, setParseError] = useState<string | null>(null);

    // Spotify search
    const [spotifyQuery, setSpotifyQuery] = useState("");
    const [spotifyResults, setSpotifyResults] = useState<ExternalTrackResult[]>([]);
    const [spotifyLoading, setSpotifyLoading] = useState(false);
    const [spotifyError, setSpotifyError] = useState<string | null>(null);
    const [selectedTrack, setSelectedTrack] = useState<ExternalTrackResult | null>(null);

    // ── Extract metadata when audioFile changes ──
    useEffect(() => {
        if (!audioFile) {
            setMeta({});
            setParseError(null);
            setSelectedTrack(null);
            return;
        }
        let cancelled = false;
        const extract = async () => {
            setParsing(true);
            setParseError(null);
            try {
                const parsed = await mmb.parseBlob(audioFile);
                if (cancelled) return;
                const c = parsed.common;
                const extracted: SongMetadata = {};
                if (c.title) extracted.title = c.title;
                if (c.artist) extracted.artist = c.artist;
                if (c.album) extracted.album = c.album;
                if (c.genre && c.genre.length > 0) extracted.genre = c.genre.join(", ");
                if (c.year) extracted.year = c.year;
                if (c.bpm) extracted.bpm = Math.round(c.bpm);
                if (parsed.format.duration) extracted.durationSec = parsed.format.duration;

                // Extract embedded cover art
                if (c.picture && c.picture.length > 0) {
                    const pic = c.picture[0];
                    const blob = new Blob([new Uint8Array(pic.data)], { type: pic.format });
                    extracted.coverDataUrl = URL.createObjectURL(blob);
                }

                setMeta(extracted);
                // Auto-set Spotify search query
                const q = [extracted.artist, extracted.title].filter(Boolean).join(" ");
                setSpotifyQuery(q);
            } catch (err) {
                if (!cancelled) {
                    log.warn("parse error:", err);
                    setParseError(err instanceof Error ? err.message : String(err));
                    // Try to derive title/artist from filename
                    const name = audioFile.name.replace(/\.[^.]+$/, "");
                    const parts = name.split(/\s*[-–—]\s*/);
                    if (parts.length >= 2) {
                        const fallback: SongMetadata = { artist: parts[0].trim(), title: parts.slice(1).join(" - ").trim() };
                        setMeta(fallback);
                        setSpotifyQuery(`${fallback.artist} ${fallback.title}`);
                    } else {
                        setMeta({ title: name });
                        setSpotifyQuery(name);
                    }
                }
            } finally {
                if (!cancelled) setParsing(false);
            }
        };
        extract();
        return () => { cancelled = true; };
    }, [audioFile]);

    // ── Spotify search ──
    const handleSpotifySearch = useCallback(async () => {
        if (!spotifyQuery.trim()) return;
        setSpotifyLoading(true);
        setSpotifyError(null);
        try {
            const results = await fetchSpotifySearch(spotifyQuery.trim(), 8);
            setSpotifyResults(results);
        } catch (err) {
            setSpotifyError(err instanceof Error ? err.message : String(err));
        } finally {
            setSpotifyLoading(false);
        }
    }, [spotifyQuery]);

    // Auto-search when query is set from metadata extraction
    useEffect(() => {
        if (spotifyQuery && spotifyQuery.length > 2) {
            // debounce
            const timer = setTimeout(() => {
                handleSpotifySearch();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [spotifyQuery, handleSpotifySearch]);

    const handleSelectTrack = (track: ExternalTrackResult) => {
        setSelectedTrack(track);
        setMeta(prev => ({
            ...prev,
            title: track.title || prev.title,
            artist: track.artist || prev.artist,
            album: track.album || prev.album,
            spotifyId: track.externalId || undefined,
            spotifyCoverUrl: track.coverUrl || undefined,
            isrc: track.isrc || undefined,
            durationSec: track.durationMs ? track.durationMs / 1000 : prev.durationSec,
        }));
    };

    const handleApply = () => {
        onApply?.(meta);
    };

    if (!audioFile) return null;

    return (
        <div style={{ margin: "12px 0", padding: 12, border: "1px solid var(--border-color, #374151)", borderRadius: 8, background: "var(--card-bg, #1e293b)" }}>
            <h5 style={{ margin: "0 0 8px" }}>🎵 {t("editor.songMetadata", "Song Metadata")}</h5>

            {parsing && <div style={{ color: "var(--text-secondary, #94a3b8)" }}>{t("common.loading", "Loading...")}</div>}
            {parseError && <div style={{ fontSize: 12, color: "#f59e0b", marginBottom: 4 }}>{t("editor.metadataParseWarning", "Metadata parse warning:")} {parseError}</div>}

            {/* Extracted metadata fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", marginBottom: 10, fontSize: 13 }}>
                <label>
                    {t("editor.title", "Title")}
                    <input type="text" value={meta.title || ""} onChange={e => setMeta(p => ({ ...p, title: e.target.value }))} style={{ width: "100%", marginTop: 2 }} />
                </label>
                <label>
                    {t("editor.artist", "Artist")}
                    <input type="text" value={meta.artist || ""} onChange={e => setMeta(p => ({ ...p, artist: e.target.value }))} style={{ width: "100%", marginTop: 2 }} />
                </label>
                <label>
                    {t("editor.album", "Album")}
                    <input type="text" value={meta.album || ""} onChange={e => setMeta(p => ({ ...p, album: e.target.value }))} style={{ width: "100%", marginTop: 2 }} />
                </label>
                <label>
                    {t("editor.genre", "Genre")}
                    <input type="text" value={meta.genre || ""} onChange={e => setMeta(p => ({ ...p, genre: e.target.value }))} style={{ width: "100%", marginTop: 2 }} />
                </label>
                <label>
                    {t("editor.year", "Year")}
                    <input type="number" value={meta.year || ""} onChange={e => setMeta(p => ({ ...p, year: parseInt(e.target.value) || undefined }))} style={{ width: "100%", marginTop: 2 }} />
                </label>
                <label>
                    BPM
                    <input type="number" value={meta.bpm || ""} onChange={e => setMeta(p => ({ ...p, bpm: parseInt(e.target.value) || undefined }))} style={{ width: "100%", marginTop: 2 }} />
                </label>
            </div>

            {/* Cover art preview */}
            {(meta.coverDataUrl || meta.spotifyCoverUrl) && (
                <div style={{ marginBottom: 8 }}>
                    <img
                        src={meta.spotifyCoverUrl || meta.coverDataUrl}
                        alt="Cover"
                        style={{ width: 80, height: 80, borderRadius: 6, objectFit: "cover" }}
                    />
                </div>
            )}

            {/* Spotify search */}
            <div style={{ borderTop: "1px solid var(--border-color, #374151)", paddingTop: 8, marginTop: 4 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>🔍 Spotify</span>
                    <input
                        type="text"
                        value={spotifyQuery}
                        onChange={e => setSpotifyQuery(e.target.value)}
                        placeholder={t("editor.spotifySearchPlaceholder", "Search artist / title...")}
                        style={{ flex: 1, fontSize: 13 }}
                        onKeyDown={e => { if (e.key === "Enter") handleSpotifySearch(); }}
                    />
                    <button onClick={handleSpotifySearch} disabled={spotifyLoading} style={{ fontSize: 12, padding: "4px 10px" }}>
                        {spotifyLoading ? "..." : t("common.search", "Search")}
                    </button>
                </div>
                {spotifyError && <div style={{ color: "#ef4444", fontSize: 12 }}>{spotifyError}</div>}
                {spotifyResults.length > 0 && (
                    <div style={{ maxHeight: 200, overflowY: "auto", fontSize: 12 }}>
                        {spotifyResults.map((tr, i) => (
                            <div
                                key={tr.externalId || i}
                                onClick={() => handleSelectTrack(tr)}
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                    padding: "4px 6px",
                                    cursor: "pointer",
                                    borderRadius: 4,
                                    background: selectedTrack?.externalId === tr.externalId ? "var(--primary-bg, #2563eb20)" : "transparent",
                                }}
                            >
                                {tr.coverUrl && <img src={tr.coverUrl} alt={`Cover art for ${tr.title}`} style={{ width: 32, height: 32, borderRadius: 4 }} />}
                                <div>
                                    <div style={{ fontWeight: 600 }}>{tr.title}</div>
                                    <div style={{ color: "var(--text-secondary, #94a3b8)" }}>{tr.artist} — {tr.album}</div>
                                </div>
                                {tr.durationMs && <span style={{ marginLeft: "auto", color: "var(--text-secondary, #94a3b8)" }}>{Math.floor(tr.durationMs / 60000)}:{String(Math.floor((tr.durationMs % 60000) / 1000)).padStart(2, "0")}</span>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Apply button */}
            <div style={{ marginTop: 8, textAlign: "right" }}>
                <button onClick={handleApply} style={{ padding: "6px 16px", borderRadius: 6 }}>
                    ✅ {t("editor.applyMetadata", "Apply to Song")}
                </button>
            </div>
        </div>
    );
};

export default SongMetadataLookup;
