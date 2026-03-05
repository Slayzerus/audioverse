import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Spinner, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FaMusic, FaCompactDisc, FaUserAlt, FaFileAudio,
    FaChartBar, FaArrowLeft, FaExclamationTriangle, FaClock,
} from "react-icons/fa";
import { SimpleBarChart } from "../../components/common/Charts";
import {
    useLibrarySongsQuery,
    useLibraryAlbumsQuery,
    useLibraryArtistsQuery,
    useAudioFilesQuery,
} from "../../scripts/api/apiLibraryCatalog";
import { useUser } from "../../contexts/UserContext";
import type { Song, Album, LibraryAudioFile } from "../../models/modelsLibrary";
import css from './LibraryStatsPage.module.css';

/* ── animation ── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

/* ── Stat card ── */
interface StatCardProps { icon: React.ReactNode; label: string; value: string | number; color: string; idx: number; }
const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, idx }) => (
    <Col xs={6} md={3} className="mb-3">
        <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Card style={{ border: `1px solid ${color}40` }} className={`h-100 text-center ${css.statCard}`}>
                <Card.Body>
                    <div className={css.statCardIcon} style={{ color }}>{icon}</div>
                    <div className={css.statCardValue}>{value}</div>
                    <div className={css.statCardLabel}>{label}</div>
                </Card.Body>
            </Card>
        </motion.div>
    </Col>
);

/* ── Section wrapper ── */
const Section: React.FC<{ title: string; icon: React.ReactNode; idx: number; children: React.ReactNode }> = ({ title, icon, idx, children }) => (
    <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-4">
        <h5 className={css.sectionTitle}>
            <span className="me-2">{icon}</span>{title}
        </h5>
        {children}
    </motion.div>
);

/* ══════════════════════════════════════════════════════════════ */

const LibraryStatsPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useUser();

    /* Fetch with large pages to get aggregate counts */
    const { data: songs, isLoading: songsLoading } = useLibrarySongsQuery(undefined, { staleTime: 60_000 });
    const { data: albums, isLoading: albumsLoading } = useLibraryAlbumsQuery(undefined, { staleTime: 60_000 });
    const { data: artists, isLoading: artistsLoading } = useLibraryArtistsQuery(undefined, { staleTime: 60_000 });
    const { data: audioFiles, isLoading: filesLoading } = useAudioFilesQuery();

    /* ── derived stats ── */
    const totalSongs = songs?.length ?? 0;
    const totalAlbums = albums?.length ?? 0;
    const totalArtists = artists?.length ?? 0;
    const totalFiles = audioFiles?.length ?? 0;

    /* ── genre distribution (from audio files) ── */
    const genreChartData = useMemo(() => {
        if (!audioFiles?.length) return [];
        const counts: Record<string, number> = {};
        audioFiles.forEach((f: LibraryAudioFile) => {
            const g = f.genre?.trim() || t("libraryStats.unknownGenre", "Unknown");
            counts[g] = (counts[g] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 15)
            .map(([genre, count]) => ({ genre: genre.length > 20 ? genre.slice(0, 18) + "…" : genre, count }));
    }, [audioFiles, t]);

    /* ── missing metadata ── */
    const missingMetadata = useMemo(() => {
        const issues: { label: string; count: number; total: number; color: string }[] = [];

        if (songs?.length) {
            const noArtist = songs.filter((s: Song) => !s.primaryArtistId).length;
            if (noArtist > 0) issues.push({ label: t("libraryStats.songsNoArtist", "Songs without artist"), count: noArtist, total: songs.length, color: "#ef5350" });

            const noAlbum = songs.filter((s: Song) => !s.albumId).length;
            if (noAlbum > 0) issues.push({ label: t("libraryStats.songsNoAlbum", "Songs without album"), count: noAlbum, total: songs.length, color: "#ffa726" });

            const noIsrc = songs.filter((s: Song) => !s.isrc).length;
            if (noIsrc > 0) issues.push({ label: t("libraryStats.songsNoISRC", "Songs without ISRC"), count: noIsrc, total: songs.length, color: "#ab47bc" });
        }

        if (albums?.length) {
            const noCover = albums.filter((a: Album) => !a.coverUrl).length;
            if (noCover > 0) issues.push({ label: t("libraryStats.albumsNoCover", "Albums without cover"), count: noCover, total: albums.length, color: "#42a5f5" });

            const noYear = albums.filter((a: Album) => !a.releaseYear).length;
            if (noYear > 0) issues.push({ label: t("libraryStats.albumsNoYear", "Albums without release year"), count: noYear, total: albums.length, color: "#66bb6a" });
        }

        return issues;
    }, [songs, albums, t]);

    /* ── recently added songs (last 10 by ID, assuming  higher ID = newer) ── */
    const recentSongs = useMemo(() => {
        if (!songs?.length) return [];
        return [...songs]
            .sort((a: Song, b: Song) => (b.id ?? 0) - (a.id ?? 0))
            .slice(0, 10);
    }, [songs]);

    /* ── year distribution (from albums with releaseYear) ── */
    const yearChartData = useMemo(() => {
        if (!albums?.length) return [];
        const counts: Record<number, number> = {};
        albums.forEach((a: Album) => {
            if (a.releaseYear) counts[a.releaseYear] = (counts[a.releaseYear] || 0) + 1;
        });
        return Object.entries(counts)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .slice(-20)
            .map(([year, count]) => ({ year, count }));
    }, [albums]);

    if (!isAuthenticated) {
        return (
            <Container className="py-5 text-center">
                <p className={css.textSecondary}>{t("libraryStats.loginRequired", "Please log in to see library statistics.")}</p>
            </Container>
        );
    }

    const isLoading = songsLoading || albumsLoading || artistsLoading || filesLoading;

    return (
        <Container className={`py-4 ${css.container}`}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <div className={css.headerFlex}>
                    <Link to="/dashboard" className="btn btn-outline-secondary btn-sm" title={t("common.back", "Back")}>
                        <FaArrowLeft />
                    </Link>
                    <h2 className={css.pageTitle}>
                        <FaChartBar className={`me-2 ${css.iconNavActive}`} />
                        {t("libraryStats.title", "Library Stats")}
                    </h2>
                </div>
            </motion.div>

            {isLoading && (
                <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
            )}

            {!isLoading && (
                <>
                    {/* ── Summary Cards ── */}
                    <Row className="mb-4">
                        <StatCard icon={<FaMusic />} label={t("libraryStats.songs", "Songs")} value={totalSongs} color="#e040fb" idx={0} />
                        <StatCard icon={<FaCompactDisc />} label={t("libraryStats.albums", "Albums")} value={totalAlbums} color="#42a5f5" idx={1} />
                        <StatCard icon={<FaUserAlt />} label={t("libraryStats.artists", "Artists")} value={totalArtists} color="#66bb6a" idx={2} />
                        <StatCard icon={<FaFileAudio />} label={t("libraryStats.audioFiles", "Audio Files")} value={totalFiles} color="#ffa726" idx={3} />
                    </Row>

                    {/* ── Genre Distribution ── */}
                    <Section title={t("libraryStats.topGenres", "Top Genres")} icon={<FaChartBar className={css.iconPink} />} idx={4}>
                        {genreChartData.length > 0 ? (
                            <Card className={css.card}>
                                <Card.Body>
                                    <SimpleBarChart<{ genre: string; count: number }>
                                        data={genreChartData}
                                        xKey="genre"
                                        yKey="count"
                                        color="#e040fb"
                                        height={260}
                                    />
                                </Card.Body>
                            </Card>
                        ) : (
                            <p className={css.textSecondary}>{t("libraryStats.noGenres", "No genre data available.")}</p>
                        )}
                    </Section>

                    {/* ── Album Years Distribution ── */}
                    <Section title={t("libraryStats.albumsByYear", "Albums by Release Year")} icon={<FaCompactDisc className={css.iconBlue} />} idx={5}>
                        {yearChartData.length > 0 ? (
                            <Card className={css.card}>
                                <Card.Body>
                                    <SimpleBarChart<{ year: string; count: number }>
                                        data={yearChartData}
                                        xKey="year"
                                        yKey="count"
                                        color="#42a5f5"
                                        height={220}
                                    />
                                </Card.Body>
                            </Card>
                        ) : (
                            <p className={css.textSecondary}>{t("libraryStats.noYearData", "No release year data available.")}</p>
                        )}
                    </Section>

                    {/* ── Missing Metadata ── */}
                    <Section title={t("libraryStats.missingMetadata", "Missing Metadata")} icon={<FaExclamationTriangle className={css.iconOrange} />} idx={6}>
                        {missingMetadata.length > 0 ? (
                            <Card className={css.card}>
                                <Card.Body className={css.cardBodyNoPadding}>
                                    <table className={css.table}>
                                        <thead>
                                            <tr className={css.tableHeadRow}>
                                                <th className={css.th}>{t("libraryStats.issue", "Issue")}</th>
                                                <th className={css.thRight}>{t("libraryStats.affected", "Affected")}</th>
                                                <th className={css.thRight}>{t("libraryStats.total", "Total")}</th>
                                                <th className={css.thRight}>{t("libraryStats.coverage", "Coverage")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {missingMetadata.map((issue, i) => {
                                                const pct = issue.total > 0 ? Math.round(((issue.total - issue.count) / issue.total) * 100) : 100;
                                                return (
                                                    <tr key={i} className={css.tableBodyRow}>
                                                        <td className={css.td}>
                                                            <span className={css.colorDot} style={{ background: issue.color }} />
                                                            {issue.label}
                                                        </td>
                                                        <td className={css.issueCount} style={{ color: issue.color }}>
                                                            {issue.count}
                                                        </td>
                                                        <td className={css.tdRightTabular}>
                                                            {issue.total}
                                                        </td>
                                                        <td className={css.tdRight}>
                                                            <Badge bg={pct >= 80 ? "success" : pct >= 50 ? "warning" : "danger"} className={css.badgeSmall}>
                                                                {pct}%
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </Card.Body>
                            </Card>
                        ) : (
                            <p className={css.textSecondary}>
                                {(totalSongs + totalAlbums) > 0
                                    ? t("libraryStats.allComplete", "All metadata is complete!")
                                    : t("libraryStats.noData", "No library data available.")}
                            </p>
                        )}
                    </Section>

                    {/* ── Recently Added Songs ── */}
                    <Section title={t("libraryStats.recentSongs", "Recently Added Songs")} icon={<FaClock className={css.iconGreen} />} idx={7}>
                        {recentSongs.length > 0 ? (
                            <Card className={css.card}>
                                <Card.Body className={css.cardBodyNoPadding}>
                                    <table className={css.table}>
                                        <thead>
                                            <tr className={css.tableHeadRow}>
                                                <th className={css.thNumbered}>#</th>
                                                <th className={css.th}>{t("libraryStats.songTitle", "Title")}</th>
                                                <th className={css.th}>{t("libraryStats.artist", "Artist")}</th>
                                                <th className={css.th}>{t("libraryStats.album", "Album")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSongs.map((song: Song, i: number) => (
                                                <tr key={song.id} className={css.tableBodyRow}>
                                                    <td className={css.tdCenter}>{i + 1}</td>
                                                    <td className={css.tdTitle}>{song.title || "—"}</td>
                                                    <td className={css.tdSecondary}>{song.primaryArtist?.name || "—"}</td>
                                                    <td className={css.tdSecondary}>{song.album?.title || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </Card.Body>
                            </Card>
                        ) : (
                            <p className={css.textSecondary}>{t("libraryStats.noSongs", "No songs in the library yet.")}</p>
                        )}
                    </Section>
                </>
            )}
        </Container>
    );
};

export default LibraryStatsPage;
