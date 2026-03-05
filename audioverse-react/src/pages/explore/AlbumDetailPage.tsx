// AlbumDetailPage.tsx — Album detail view from Library Catalog
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    useLibraryAlbumQuery,
    useLibrarySongsQuery,
} from "../../scripts/api/apiLibraryCatalog";
import { AlbumArtistRole } from "../../models/modelsLibrary";

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
const trackRow: React.CSSProperties = {
    display: "flex", gap: 12, alignItems: "center", padding: "8px 0",
    borderBottom: "1px solid var(--border-color, #eee)", fontSize: 13,
};

const roleLabel = (role?: AlbumArtistRole): string => {
    switch (role) {
        case AlbumArtistRole.Primary: return "Primary";
        case AlbumArtistRole.Featured: return "Featured";
        case AlbumArtistRole.Producer: return "Producer";
        default: return "Artist";
    }
};

const AlbumDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const { albumId } = useParams<{ albumId: string }>();
    const id = Number(albumId) || 0;

    const { data: album, isLoading } = useLibraryAlbumQuery(id);
    // Songs list — we pass album title to filter, but the API uses album ID through the song's albumId
    const { data: allSongs } = useLibrarySongsQuery();

    const albumSongs = (allSongs ?? []).filter((s) => s.albumId === id);

    if (isLoading) return <div style={page}><p>{t("common.loading", "Loading…")}</p></div>;
    if (!album) return <div style={page}><p>{t("common.notFound", "Album not found.")}</p></div>;

    return (
        <div style={page}>
            <Link to="/library-catalog" style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>
                ← {t("library.backToCatalog", "Back to catalog")}
            </Link>

            {/* Header */}
            <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                {album.coverUrl && (
                    <img src={album.coverUrl} alt="Album cover" style={{ width: 200, height: 200, borderRadius: 8, objectFit: "cover" }} />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <h1 style={{ margin: 0 }}><i className="fa-solid fa-compact-disc" />{" "}{album.title}</h1>
                    {album.releaseYear && <span style={{ fontSize: 16, color: "#888" }}>{album.releaseYear}</span>}

                    {/* Artists */}
                    {album.albumArtists && album.albumArtists.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {album.albumArtists.map((aa) => (
                                <Link
                                    key={aa.artistId}
                                    to={`/library-catalog/artists/${aa.artistId}`}
                                    style={{ textDecoration: "none", color: "var(--accent)" }}
                                >
                                    {aa.artist?.name || `Artist #${aa.artistId}`}
                                    <span style={tag}>{roleLabel(aa.role)}</span>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* MusicBrainz IDs */}
                    {album.musicBrainzAlbumId && (
                        <a
                            href={`https://musicbrainz.org/release/${album.musicBrainzAlbumId}`}
                            target="_blank" rel="noreferrer"
                            style={{ fontSize: 12, color: "#888" }}
                        >
                            MusicBrainz: {album.musicBrainzAlbumId}
                        </a>
                    )}
                </div>
            </div>

            {/* Track list from album.songs or filtered allSongs */}
            <div style={card}>
                <h2 style={{ margin: 0 }}>
                    <i className="fa-solid fa-music" />{" "}{t("albumDetail.tracks", "Tracks")} ({(album.songs ?? albumSongs).length})
                </h2>
                {(album.songs ?? albumSongs).length === 0 ? (
                    <p style={{ color: "#888", fontSize: 13 }}>{t("albumDetail.noTracks", "No tracks.")}</p>
                ) : (
                    (album.songs ?? albumSongs).map((s, i) => (
                        <Link
                            key={s.id}
                            to={`/library-catalog/songs/${s.id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <div style={trackRow}>
                                <span style={{ width: 24, textAlign: "right", color: "#888" }}>{i + 1}.</span>
                                <strong style={{ flex: 1 }}>{s.title}</strong>
                                {s.primaryArtist && <span style={{ color: "#888" }}>{s.primaryArtist.name}</span>}
                                {s.isrc && <span style={{ ...tag, backgroundColor: "#888" }}>ISRC</span>}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default AlbumDetailPage;
