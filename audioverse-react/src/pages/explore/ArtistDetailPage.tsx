// ArtistDetailPage.tsx — Artist detail view from Library Catalog
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useLibraryArtistQuery,
    useArtistFactsQuery,
    useLibrarySongsQuery,
    useLibraryAlbumsQuery,
} from "../../scripts/api/apiLibraryCatalog";
import { ArtistFactType } from "../../models/modelsLibrary";

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
    marginRight: 4, marginBottom: 4,
};
const factRow: React.CSSProperties = {
    display: "flex", gap: 8, alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid var(--border-color, #eee)", fontSize: 13,
};
const gridCards: React.CSSProperties = {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 12,
};
const albumCard: React.CSSProperties = {
    border: "1px solid var(--border-color, #eee)", borderRadius: 8,
    overflow: "hidden", textDecoration: "none", color: "inherit",
};

const factTypeLabel = (type?: ArtistFactType): string => {
    switch (type) {
        case ArtistFactType.BirthDate: return "🎂 Birth Date";
        case ArtistFactType.DeathDate: return "✝️ Death Date";
        case ArtistFactType.Genre: return "🎸 Genre";
        case ArtistFactType.Award: return "🏆 Award";
        case ArtistFactType.Trivia: return "💡 Trivia";
        case ArtistFactType.ExternalLink: return "🔗 Link";
        case ArtistFactType.Misc: return "\u{1F4CC} Misc";
        default: return "\u{1F4CC} Fact";
    }
};

const ArtistDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { artistId } = useParams<{ artistId: string }>();
    const id = Number(artistId) || 0;

    const { data: artist, isLoading } = useLibraryArtistQuery(id);
    const { data: facts } = useArtistFactsQuery(id);
    const { data: allSongs } = useLibrarySongsQuery();
    const { data: allAlbums } = useLibraryAlbumsQuery();

    const artistSongs = (allSongs ?? []).filter((s) => s.primaryArtistId === id);
    const artistAlbums = (allAlbums ?? []).filter((a) =>
        a.primaryArtistId === id || a.albumArtists?.some((aa) => aa.artistId === id),
    );

    if (isLoading) return <div style={page}><p>{t("common.loading", "Loading…")}</p></div>;
    if (!artist) return <div style={page}><p>{t("common.notFound", "Artist not found.")}</p></div>;

    const detail = artist.detail;

    return (
        <div style={page}>
            <Link to="/library-catalog" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                ← {t("library.backToCatalog", "Back to catalog")}
            </Link>

            {/* Header */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                {detail?.imageUrl && (
                    <img src={detail.imageUrl} alt={artist.name ?? ""} style={{ width: 180, height: 180, borderRadius: "50%", objectFit: "cover" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h1 style={{ margin: 0 }}><i className="fa-solid fa-microphone" />{" "}{artist.name}</h1>
                    {detail?.country && <span style={{ fontSize: 14, color: "#888" }}>🌍 {detail.country}</span>}
                    {detail?.bio && (
                        <p style={{ margin: 0, maxWidth: 600, fontSize: 14, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                            {detail.bio}
                        </p>
                    )}
                </div>
            </div>

            {/* Facts */}
            {facts && facts.length > 0 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}>📖 {t("artistDetail.facts", "Facts")} ({facts.length})</h2>
                    {facts.map((f) => (
                        <div key={f.id} style={factRow}>
                            <span style={tag}>{factTypeLabel(f.type)}</span>
                            <span style={{ flex: 1 }}>
                                {f.value}
                                {f.dateValue && ` (${new Date(f.dateValue).toLocaleDateString()})`}
                                {f.intValue != null && ` — ${f.intValue}`}
                            </span>
                            {f.source && (
                                <a href={f.source} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: "#888" }}>
                                    🔗 {t("common.source", "Source")}
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Albums */}
            {artistAlbums.length > 0 && (
                <div style={card}>
                    <h2 style={{ margin: 0 }}><i className="fa-solid fa-compact-disc" />{" "}{t("artistDetail.albums", "Albums")} ({artistAlbums.length})</h2>
                    <div style={gridCards}>
                        {artistAlbums.map((a) => (
                            <Link key={a.id} to={`/library-catalog/albums/${a.id}`} style={albumCard}>
                                {a.coverUrl ? (
                                    <img src={a.coverUrl} alt={a.title ?? ""} style={{ width: "100%", height: 150, objectFit: "cover" }} />
                                ) : (
                                    <div style={{ width: "100%", height: 150, backgroundColor: "var(--bg-secondary, #eee)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}><i className="fa-solid fa-compact-disc" /></div>
                                )}
                                <div style={{ padding: 8 }}>
                                    <strong style={{ fontSize: 13 }}>{a.title}</strong>
                                    {a.releaseYear && <span style={{ fontSize: 12, color: "#888", marginLeft: 6 }}>({a.releaseYear})</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Songs */}
            <div style={card}>
                <h2 style={{ margin: 0 }}><i className="fa-solid fa-music" />{" "}{t("artistDetail.songs", "Songs")} ({artistSongs.length})</h2>
                {artistSongs.length === 0 ? (
                    <p style={{ color: "#888", fontSize: 13 }}>{t("artistDetail.noSongs", "No songs in catalog.")}</p>
                ) : (
                    artistSongs.map((s, i) => (
                        <Link key={s.id} to={`/library-catalog/songs/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <div style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-color, #eee)", fontSize: 13 }}>
                                <span style={{ width: 24, textAlign: "right", color: "#888" }}>{i + 1}.</span>
                                <strong style={{ flex: 1 }}>{s.title}</strong>
                                {s.album && <span style={{ color: "#888" }}>{s.album.title}</span>}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default ArtistDetailPage;
