import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, Spinner } from "react-bootstrap";
import { FaMicrophone, FaGamepad, FaTrophy, FaCalendarAlt, FaBroadcastTower } from "react-icons/fa";
import { useRankingQuery } from "../scripts/api/apiKaraoke";
import type { KaraokeRankingEntry } from "../models/karaoke/modelsKaraokeCore";
import { useUser } from "../contexts/UserContext";
import { Focusable } from "../components/common/Focusable";

/* ── animation helpers ── */
const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const pulse = {
    animate: { scale: [1, 1.04, 1], transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } },
};

/* ── Quick-action cards ── */
interface ActionCardProps { icon: React.ReactNode; label: string; to: string; color: string; idx: number; }
const ActionCard: React.FC<ActionCardProps> = ({ icon, label, to, color, idx }) => {
    return (
        <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} style={{ display: "flex", minHeight: 0 }}>
            <Focusable id={`home-action-${label.toLowerCase().replace(/\s/g, "-")}`} highlightMode="glow" style={{ display: "flex", flex: 1 }}>
                <Card
                    as={Link}
                    to={to}
                    className="text-center text-decoration-none"
                    style={{
                        display: "flex",
                        flex: 1,
                        background: "var(--bg-secondary)",
                        border: `1px solid ${color}40`,
                        color: "var(--text-primary)",
                        transition: "transform .2s, box-shadow .2s",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${color}30`; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
                >
                    <Card.Body style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ fontSize: 48, color, marginBottom: 10 }}>{icon}</div>
                        <Card.Title style={{ fontSize: 18, fontWeight: 700 }}>{label}</Card.Title>
                    </Card.Body>
                </Card>
            </Focusable>
        </motion.div>
    );
};

/* ══════════════════════════════════════════════════════════ */

const HomePage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useUser();

    // data queries
    const { data: ranking, isLoading: rankingLoading } = useRankingQuery(10);

    const topRanking = useMemo(() => (Array.isArray(ranking) ? ranking : []).slice(0, 10), [ranking]);

    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr auto",
            gap: 0,
            width: "100%",
            height: "calc(100vh - 200px)",
            overflow: "hidden",
        }}>
            {/* ── TL: App Info ── */}
            <section style={{
                background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)",
                padding: "40px 24px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                borderRight: "1px solid var(--border-primary, rgba(255,255,255,0.08))",
                borderBottom: "1px solid var(--border-primary, rgba(255,255,255,0.08))",
            }}>
                {/* animated background circles */}
                {[...Array(3)].map((_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: "absolute",
                            borderRadius: "50%",
                            border: "1px solid var(--nav-active)",
                            opacity: 0.08,
                            width: 150 + i * 100,
                            height: 150 + i * 100,
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                        }}
                        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    />
                ))}

                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <h1 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: 2, marginBottom: 10 }}>
                        <span style={{ color: "var(--text-primary)" }}>Audio</span>
                        <span style={{ color: "var(--nav-active)" }}>Verse</span>
                    </h1>
                </motion.div>

                <motion.p
                    style={{ maxWidth: 480, margin: "0 auto 14px", fontSize: "1rem", color: "var(--text-secondary)" }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}
                >
                    {t("homePage.lead")}
                </motion.p>

                <motion.div {...pulse}>
                    <FaMicrophone style={{ fontSize: 40, color: "var(--nav-active)", filter: "drop-shadow(0 0 12px var(--nav-active))" }} />
                </motion.div>

                {!isAuthenticated && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                        <Focusable id="home-signup" highlightMode="glow" style={{ display: "inline-block" }}>
                            <Link to="/register" className="btn btn-primary btn-lg mt-3 me-2">{t("nav.signUp")}</Link>
                        </Focusable>
                        <Focusable id="home-signin" highlightMode="glow" style={{ display: "inline-block" }}>
                            <Link to="/login" className="btn btn-outline-secondary btn-lg mt-3">{t("nav.signIn")}</Link>
                        </Focusable>
                    </motion.div>
                )}

                <div style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 16, opacity: 0.7 }}>
                    {t("homePage.secondary")}
                </div>
            </section>

            {/* ── TR: Top Singers ── */}
            <section style={{
                padding: "24px",
                borderBottom: "1px solid var(--border-primary, rgba(255,255,255,0.08))",
                overflow: "auto",
            }}>
                <motion.h5
                    className="mb-3" style={{ color: "var(--text-primary)", fontWeight: 700 }}
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
                >
                    <FaTrophy className="me-2" style={{ color: "#ffa726" }} />
                    {t("homePage.rankings", "Top Singers")}
                </motion.h5>

                {rankingLoading ? (
                    <div className="text-center py-4"><Spinner animation="border" variant="secondary" /></div>
                ) : topRanking.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>{t("homePage.noRanking", "No ranking data yet.")}</p>
                ) : (
                    <div>
                        {topRanking.map((entry: KaraokeRankingEntry, i: number) => {
                            const name = entry.username ?? `#${i + 1}`;
                            const score = entry.totalScore ?? 0;
                            const topScore = topRanking[0]?.totalScore ?? 1;
                            const pct = topRanking.length > 0
                                ? Math.min(100, (score / Math.max(1, topScore)) * 100)
                                : 0;
                            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
                            return (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
                                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}
                                >
                                    <span style={{ width: 28, textAlign: "center", fontSize: i < 3 ? 18 : 13, fontWeight: 600 }}>{medal}</span>
                                    <span style={{ flex: 1, fontWeight: 500, fontSize: 14, color: "var(--text-primary)" }}>{name}</span>
                                    <div style={{ width: 160, height: 12, background: "var(--bg-primary)", borderRadius: 6, overflow: "hidden" }}>
                                        <motion.div
                                            style={{ height: "100%", borderRadius: 6, background: i === 0 ? "#ffa726" : i === 1 ? "#bdbdbd" : i === 2 ? "#cd7f32" : "var(--nav-active)" }}
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${pct}%` }}
                                            viewport={{ once: true }}
                                            transition={{ duration: 0.8, delay: i * 0.05 }}
                                        />
                                    </div>
                                    <span style={{ width: 60, textAlign: "right", fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                                        {score.toLocaleString()}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* ── Bottom: Quick Actions (full-width row) ── */}
            <section style={{
                gridColumn: "1 / -1",
                padding: "16px 24px",
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
                overflow: "hidden",
            }}>
                <ActionCard icon={<FaMicrophone />} label={t("nav.karaoke", "Karaoke")} to="/parties" color="#e040fb" idx={0} />
                <ActionCard icon={<FaCalendarAlt />} label={t("homePage.parties", "Parties")} to="/parties" color="#ffa726" idx={1} />
                <ActionCard icon={<FaBroadcastTower />} label={t("nav.radio", "Radio")} to="/music-player" color="#42a5f5" idx={2} />
                <ActionCard icon={<FaGamepad />} label={t("nav.games", "Games")} to="/play" color="#66bb6a" idx={3} />
            </section>
        </div>
    );
};

export default HomePage;
