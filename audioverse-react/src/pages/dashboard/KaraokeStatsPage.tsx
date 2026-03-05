import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Spinner, Badge } from "react-bootstrap";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FaChartLine, FaMicrophone, FaTrophy, FaStar,
    FaCalendarAlt, FaArrowLeft, FaBolt,
} from "react-icons/fa";
import { SimpleLineChart, SimpleBarChart } from "../../components/common/Charts";
import { useRankingQuery, useUserHistoryQuery, useActivityQuery } from "../../scripts/api/apiKaraoke";
import { useUser } from "../../contexts/UserContext";
import type { KaraokeRankingEntry } from "../../models/karaoke/modelsKaraokeCore";

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
            <Card style={{ background: "var(--bg-secondary)", border: `1px solid ${color}40`, color: "var(--text-primary)" }} className="h-100 text-center">
                <Card.Body>
                    <div style={{ fontSize: 28, color, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{label}</div>
                </Card.Body>
            </Card>
        </motion.div>
    </Col>
);

/* ── Section wrapper ── */
const Section: React.FC<{ title: string; icon: React.ReactNode; idx: number; children: React.ReactNode }> = ({ title, icon, idx, children }) => (
    <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-4">
        <h5 style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: 12 }}>
            <span className="me-2">{icon}</span>{title}
        </h5>
        {children}
    </motion.div>
);

/* ══════════════════════════════════════════════════════════════ */

const KaraokeStatsPage: React.FC = () => {
    const { t } = useTranslation();
    const { userId, isAuthenticated } = useUser();

    const { data: ranking, isLoading: rankingLoading } = useRankingQuery(50);
    const { data: history, isLoading: historyLoading } = useUserHistoryQuery(userId ?? 0, 50);
    const { data: activity, isLoading: activityLoading } = useActivityQuery(60);

    /* ── derived stats ── */
    const totalSongs = useMemo(() => (activity ?? []).reduce((s, a) => s + a.songsSung, 0), [activity]);
    const totalScore = useMemo(() => (activity ?? []).reduce((s, a) => s + a.totalScore, 0), [activity]);
    const bestScore = useMemo(() => {
        if (!history?.length) return 0;
        return Math.max(...history.map(h => h.score));
    }, [history]);
    const myRank = useMemo(() => {
        if (!ranking || !userId) return null;
        const idx = ranking.findIndex(r => r.userId === userId);
        return idx >= 0 ? idx + 1 : null;
    }, [ranking, userId]);

    /* ── activity chart data (last 30 days) ── */
    const activityChartData = useMemo(() => {
        if (!activity?.length) return [];
        return [...activity]
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30)
            .map(a => ({
                date: a.date.slice(5), // MM-DD
                songsSung: a.songsSung,
                totalScore: a.totalScore,
            }));
    }, [activity]);

    /* ── score history chart (last 20 performances) ── */
    const historyChartData = useMemo(() => {
        if (!history?.length) return [];
        return [...history]
            .sort((a, b) => a.performedAt.localeCompare(b.performedAt))
            .slice(-20)
            .map(h => ({
                song: h.songTitle.length > 18 ? h.songTitle.slice(0, 16) + "…" : h.songTitle,
                score: h.score,
            }));
    }, [history]);

    /* ── ranking top 10 ── */
    const topRanking = useMemo(() => (ranking ?? []).slice(0, 10), [ranking]);

    if (!isAuthenticated) {
        return (
            <Container className="py-5 text-center">
                <p style={{ color: "var(--text-secondary)" }}>{t("karaokeStats.loginRequired", "Please log in to see your karaoke statistics.")}</p>
            </Container>
        );
    }

    const isLoading = rankingLoading || historyLoading || activityLoading;

    return (
        <Container className="py-4" style={{ maxWidth: 1100 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/dashboard" className="btn btn-outline-secondary btn-sm" title={t("common.back", "Back")}>
                        <FaArrowLeft />
                    </Link>
                    <h2 style={{ color: "var(--text-primary)", margin: 0 }}>
                        <FaChartLine className="me-2" style={{ color: "var(--nav-active)" }} />
                        {t("karaokeStats.title", "Karaoke Stats")}
                    </h2>
                    <Link to="/progress" className="btn btn-outline-primary btn-sm ms-auto" title={t("karaokeStats.viewProgress", "XP & Skills")}>
                        <FaBolt className="me-1" />{t("karaokeStats.viewProgress", "XP & Skills")}
                    </Link>
                </div>
            </motion.div>

            {isLoading && (
                <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
            )}

            {!isLoading && (
                <>
                    {/* ── Summary Cards ── */}
                    <Row className="mb-4">
                        <StatCard icon={<FaMicrophone />} label={t("karaokeStats.songsSung", "Songs Sung (60d)")} value={totalSongs} color="#e040fb" idx={0} />
                        <StatCard icon={<FaStar />} label={t("karaokeStats.totalScore", "Total Score (60d)")} value={totalScore.toLocaleString()} color="#ffa726" idx={1} />
                        <StatCard icon={<FaTrophy />} label={t("karaokeStats.bestScore", "Best Score")} value={bestScore.toLocaleString()} color="#66bb6a" idx={2} />
                        <StatCard icon={<FaTrophy />} label={t("karaokeStats.rank", "Rank")} value={myRank ? `#${myRank}` : "—"} color="#42a5f5" idx={3} />
                    </Row>

                    {/* ── Activity Over Time ── */}
                    <Section title={t("karaokeStats.activityChart", "Activity (last 30 days)")} icon={<FaCalendarAlt style={{ color: "#42a5f5" }} />} idx={4}>
                        {activityChartData.length > 0 ? (
                            <Card style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                <Card.Body>
                                    <SimpleLineChart<{ date: string; songsSung: number; totalScore: number }>
                                        data={activityChartData}
                                        xKey="date"
                                        yKey="songsSung"
                                        color="#e040fb"
                                        height={240}
                                    />
                                </Card.Body>
                            </Card>
                        ) : (
                            <p style={{ color: "var(--text-secondary)" }}>{t("karaokeStats.noActivity", "No activity data yet. Start singing!")}</p>
                        )}
                    </Section>

                    {/* ── Score History ── */}
                    <Section title={t("karaokeStats.scoreHistory", "Recent Scores (last 20)")} icon={<FaMicrophone style={{ color: "#e040fb" }} />} idx={5}>
                        {historyChartData.length > 0 ? (
                            <Card style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                <Card.Body>
                                    <SimpleBarChart<{ song: string; score: number }>
                                        data={historyChartData}
                                        xKey="song"
                                        yKey="score"
                                        color="var(--nav-active)"
                                        height={260}
                                    />
                                </Card.Body>
                            </Card>
                        ) : (
                            <p style={{ color: "var(--text-secondary)" }}>{t("karaokeStats.noHistory", "No singing history yet.")}</p>
                        )}
                    </Section>

                    {/* ── Ranking Table ── */}
                    <Section title={t("karaokeStats.ranking", "Top 10 Ranking")} icon={<FaTrophy style={{ color: "#ffa726" }} />} idx={6}>
                        {topRanking.length > 0 ? (
                            <Card style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                <Card.Body style={{ padding: 0 }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid var(--border-primary)", color: "var(--text-secondary)", fontSize: 12 }}>
                                                <th style={{ padding: "10px 12px", textAlign: "center", width: 50 }}>#</th>
                                                <th style={{ padding: "10px 12px" }}>{t("karaokeStats.singer", "Singer")}</th>
                                                <th style={{ padding: "10px 12px", textAlign: "right" }}>{t("karaokeStats.songs", "Songs")}</th>
                                                <th style={{ padding: "10px 12px", textAlign: "right" }}>{t("karaokeStats.score", "Score")}</th>
                                                <th style={{ padding: "10px 12px", textAlign: "right" }}>{t("karaokeStats.best", "Best")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topRanking.map((entry: KaraokeRankingEntry, i: number) => {
                                                const isMe = entry.userId === userId;
                                                const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`;
                                                return (
                                                    <tr
                                                        key={entry.userId}
                                                        style={{
                                                            borderBottom: "1px solid var(--border-primary)",
                                                            background: isMe ? "var(--nav-active-bg, rgba(100,181,246,0.08))" : undefined,
                                                            color: "var(--text-primary)",
                                                            fontSize: 14,
                                                        }}
                                                    >
                                                        <td style={{ padding: "8px 12px", textAlign: "center", fontSize: i < 3 ? 18 : 14 }}>{medal}</td>
                                                        <td style={{ padding: "8px 12px", fontWeight: isMe ? 700 : 500 }}>
                                                            {entry.username}
                                                            {isMe && <Badge bg="primary" className="ms-2" style={{ fontSize: 10 }}>{t("karaokeStats.you", "You")}</Badge>}
                                                        </td>
                                                        <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{entry.songsSung}</td>
                                                        <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{entry.totalScore.toLocaleString()}</td>
                                                        <td style={{ padding: "8px 12px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{entry.bestScore.toLocaleString()}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </Card.Body>
                            </Card>
                        ) : (
                            <p style={{ color: "var(--text-secondary)" }}>{t("karaokeStats.noRanking", "No ranking data yet.")}</p>
                        )}
                    </Section>
                </>
            )}
        </Container>
    );
};

export default KaraokeStatsPage;
