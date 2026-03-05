// SongDetailPage.tsx — Song detail view from Library Catalog
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useLibrarySongQuery,
    useSongDetailsQuery,
    useAudioFilesQuery,
    useMediaFilesQuery,
} from "../../scripts/api/apiLibraryCatalog";
import { SongDetailType } from "../../models/modelsLibrary";

// ── Styles ─────────────────────────────────────────────────────
const page: React.CSSProperties = {
    width: "100%", height: "100%", padding: 20,
    display: "flex", flexDirection: "column", gap: 20, overflow: "auto",
};
const card: React.CSSProperties = {
    border: "1px solid var(--border-color, #ddd)", padding: 20,
    borderRadius: 8, display: "flex", flexDirection: "column", gap: 12,
};
const tag: React.CSSProperties = {
    display: "inline-block", padding: "2px 8px", borderRadius: 12,
    fontSize: 11, backgroundColor: "var(--accent, #5865F2)", color: "#fff",
    marginRight: 4,
};
const fileRow: React.CSSProperties = {
    display: "flex", gap: 12, alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid var(--border-color, #eee)", fontSize: 13,
};

const detailTypeLabel = (type?: SongDetailType): string => {
    switch (type) {
        case SongDetailType.Lyrics: return "\u{1F3A4} Lyrics";
        case SongDetailType.Credits: return "\u{1F465} Credits";
        case SongDetailType.Notes: return "\u{1F4DD} Notes";
        case SongDetailType.ExternalLink: return "\u{1F517} Link";
        case SongDetailType.Misc: return "\u{1F4CC} Misc";
        default: return "\u{1F4CC} Detail";
    }
};

const SongDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { songId } = useParams<{ songId: string }>();
    const id = Number(songId) || 0;

    const { data: song, isLoading } = useLibrarySongQuery(id);
    const { data: details } = useSongDetailsQuery(id);
    const { data: audioFiles } = useAudioFilesQuery(id);
    const { data: mediaFiles } = useMediaFilesQuery(id);

    if (isLoading) return <div style={page}><p>{t("common.loading", "Loading…")}</p></div>;
    if (!song) return <div style={page}><p>{t("common.notFound", "Song not found.")}</p></div>;

    return (
        <div style={page}>
            <Link to="/library-catalog" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                ← {t("library.backToCatalog", "Back to catalog")}
            </Link>

            {/* Header */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                {song.album?.coverUrl && (
                    <img src={song.album.coverUrl} alt="Album cover" style={{ width: 160, height: 160, borderRadius: 8, objectFit: "cover" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h1 style={{ margin: 0 }}><i className="fa-solid fa-music" />{" "}{song.title}</h1>
                    {song.primaryArtist && (
                        <Link to={`/library-catalog/artists/${song.primaryArtist.id}`} style={{ fontSize: 16, color: "var(--accent)", textDecoration: "none" }}>
                            {song.primaryArtist.name}
                        </Link>
                    )}
                    {song.album && (
                        <Link to={`/library-catalog/albums/${song.album.id}`} style={{ fontSize: 14, color: "#888", textDecoration: "none" }}>
                            <i className="fa-solid fa-compact-disc" />{" "}{song.album.title} {song.album.releaseYear ? `(${song.album.releaseYear})` : ""}
                        </Link>
                    )}
                    {song.isrc && <span style={{ fontSize: 12, color: "#888" }}>ISRC: {song.isrc}</span>}
                </div>
            </div>

            {/* Details (lyrics, credits, links) */}
            {details && details.length > 0 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}>{t("songDetail.details", "Details")}</h2>
                    {details.map((d) => (
                        <div key={d.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={tag}>{detailTypeLabel(d.type)}</span>
                            {d.type === SongDetailType.ExternalLink && d.value ? (
                                <a href={d.value} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>{d.value}</a>
                            ) : (
                                <p style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 13 }}>{d.value}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Audio files */}
            {audioFiles && audioFiles.length > 0 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}>🎧 {t("songDetail.audioFiles", "Audio files")} ({audioFiles.length})</h2>
                    {audioFiles.map((f) => (
                        <div key={f.id} style={fileRow}>
                            <strong style={{ flex: 1 }}>{f.fileName || f.filePath}</strong>
                            {f.duration != null && <span>{Math.floor(f.duration / 60)}:{String(Math.round(f.duration % 60)).padStart(2, "0")}</span>}
                            {f.audioMimeType && <span style={tag}>{f.audioMimeType}</span>}
                            {f.sampleRate && <span style={{ color: "#888", fontSize: 11 }}>{f.sampleRate} Hz</span>}
                            {f.channels && <span style={{ color: "#888", fontSize: 11 }}>{f.channels}ch</span>}
                            {f.size != null && <span style={{ color: "#888", fontSize: 11 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Media files */}
            {mediaFiles && mediaFiles.length > 0 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}><i className="fa-solid fa-folder" />{" "}{t("songDetail.mediaFiles", "Media files")} ({mediaFiles.length})</h2>
                    {mediaFiles.map((f) => (
                        <div key={f.id} style={fileRow}>
                            <strong style={{ flex: 1 }}>{f.fileName || f.filePath}</strong>
                            {f.mimeType && <span style={tag}>{f.mimeType}</span>}
                            {f.codec && <span style={{ color: "#888", fontSize: 11 }}>{f.codec}</span>}
                            {f.fileSizeBytes != null && <span style={{ color: "#888", fontSize: 11 }}>{(f.fileSizeBytes / 1024 / 1024).toFixed(1)} MB</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SongDetailPage;
