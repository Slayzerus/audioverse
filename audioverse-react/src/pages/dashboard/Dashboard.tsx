import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Row, Col, Card, Spinner } from "react-bootstrap";
import { motion } from "framer-motion";
import {
    FaMicrophone, FaTrophy, FaChartLine, FaBolt, FaCalendarAlt,
    FaGamepad, FaBook, FaMusic, FaChartBar,
} from "react-icons/fa";
import UserInfo from "../../components/common/UserInfo";
import RoleBasedNavigation from "../../components/common/RoleBasedNavigation";
import LogoutButton from "../../components/common/LogoutButton";
import { useRankingQuery, useUserHistoryQuery, useActivityQuery } from "../../scripts/api/apiKaraoke";
import { useUser } from "../../contexts/UserContext";

/* ── animation ── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45 } }),
};

/* ── Quick link card ── */
interface QuickLinkProps { icon: React.ReactNode; label: string; to: string; color: string; idx: number; }
const QuickLink: React.FC<QuickLinkProps> = ({ icon, label, to, color, idx }) => (
    <Col xs={6} sm={4} md={3} className="mb-3">
        <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <Card
                as={Link}
                to={to}
                className="text-center text-decoration-none h-100"
                style={{ background: "var(--bg-secondary)", border: `1px solid ${color}40`, color: "var(--text-primary)", transition: "transform .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; }}
            >
                <Card.Body style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 8px" }}>
                    <div style={{ fontSize: 28, color, marginBottom: 6 }}>{icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                </Card.Body>
            </Card>
        </motion.div>
    </Col>
);

/* ── Karaoke mini stats ── */
const KaraokeMiniStats: React.FC = () => {
    const { t } = useTranslation();
    const { userId } = useUser();

    const { data: ranking, isLoading: rankingLoading } = useRankingQuery(50);
    const { data: history, isLoading: historyLoading } = useUserHistoryQuery(userId ?? 0, 10);
    const { data: activity, isLoading: activityLoading } = useActivityQuery(30);

    const totalSongs = useMemo(() => (activity ?? []).reduce((s, a) => s + a.songsSung, 0), [activity]);
    const bestScore = useMemo(() => {
        if (!history?.length) return 0;
        return Math.max(...history.map(h => h.score));
    }, [history]);
    const myRank = useMemo(() => {
        if (!ranking || !userId) return null;
        const idx = ranking.findIndex(r => r.userId === userId);
        return idx >= 0 ? idx + 1 : null;
    }, [ranking, userId]);

    const isLoading = rankingLoading || historyLoading || activityLoading;

    if (isLoading) return <div className="text-center py-3"><Spinner animation="border" size="sm" variant="secondary" /></div>;

    return (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#e040fb" }}>{totalSongs}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.songsSung", "Songs (30d)")}</div>
            </div>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#66bb6a" }}>{bestScore.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.bestScore", "Best Score")}</div>
            </div>
            <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#42a5f5" }}>{myRank ? `#${myRank}` : "—"}</div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{t("dashboard.rank", "Rank")}</div>
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div style={{ maxWidth: 900, margin: "40px auto", background: "var(--card-bg)", padding: "clamp(12px, 3vw, 32px)", borderRadius: 12 }}>
            <RoleBasedNavigation />
            <UserInfo />

            {/* ── Karaoke Overview ── */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 mb-4">
                <Card style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                    <Card.Body>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                            <h5 style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
                                <FaMicrophone className="me-2" style={{ color: "#e040fb" }} />
                                {t("dashboard.karaokeOverview", "Karaoke Overview")}
                            </h5>
                            <Link to="/karaoke-stats" className="btn btn-outline-primary btn-sm">
                                <FaChartLine className="me-1" />{t("dashboard.viewStats", "Full Stats")}
                            </Link>
                        </div>
                        <KaraokeMiniStats />
                    </Card.Body>
                </Card>
            </motion.div>

            {/* ── Quick Links ── */}
            <h5 className="mb-3" style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {t("dashboard.quickLinks", "Quick Links")}
            </h5>
            <Row>
                <QuickLink icon={<FaMicrophone />} label={t("nav.karaoke", "Karaoke")} to="/parties" color="#e040fb" idx={0} />
                <QuickLink icon={<FaChartLine />} label={t("dashboard.stats", "Stats")} to="/karaoke-stats" color="#42a5f5" idx={1} />
                <QuickLink icon={<FaBolt />} label={t("dashboard.progress", "Progress")} to="/progress" color="#ffa726" idx={2} />
                <QuickLink icon={<FaTrophy />} label={t("dashboard.ranking", "Ranking")} to="/ranking" color="#66bb6a" idx={3} />
                <QuickLink icon={<FaCalendarAlt />} label={t("dashboard.campaigns", "Campaigns")} to="/campaigns" color="#ef5350" idx={4} />
                <QuickLink icon={<FaGamepad />} label={t("nav.games", "Games")} to="/play" color="#ab47bc" idx={5} />
                <QuickLink icon={<FaMusic />} label={t("nav.radio", "Radio")} to="/music-player" color="#26c6da" idx={6} />
                <QuickLink icon={<FaBook />} label={t("dashboard.library", "Library")} to="/library" color="#8d6e63" idx={7} />
                <QuickLink icon={<FaChartBar />} label={t("dashboard.libraryStats", "Library Stats")} to="/library-stats" color="#78909c" idx={8} />
                <QuickLink icon={<FaCalendarAlt />} label={t("dashboard.eventCalendar", "Calendar")} to="/event-calendar" color="#ff7043" idx={9} />
            </Row>

            <LogoutButton />
        </div>
    );
};

export default Dashboard;
