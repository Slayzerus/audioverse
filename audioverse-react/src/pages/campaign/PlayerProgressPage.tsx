import React from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Badge, Spinner, ProgressBar } from "react-bootstrap";
import { motion } from "framer-motion";
import {
    FaStar, FaBolt, FaMicrophone, FaGamepad, FaPen, FaUsers, FaGem,
} from "react-icons/fa";
import { usePlayerProgressQuery, usePlayerSkillsQuery } from "../../scripts/api/apiKaraoke";
import { ProgressCategory } from "../../models/karaoke/modelsCampaign";
import type { PlayerProgress, PlayerSkill } from "../../models/karaoke/modelsCampaign";
import { useUser } from "../../contexts/UserContext";

// ── Helpers ──
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.45 } }),
};

const categoryMeta: Record<number, { icon: React.ReactNode; label: string; color: string }> = {
    [ProgressCategory.Karaoke]: { icon: <FaMicrophone />, label: "Karaoke", color: "#e040fb" },
    [ProgressCategory.HonestLiving]: { icon: <FaGamepad />, label: "Honest Living", color: "#66bb6a" },
    [ProgressCategory.Campaign]: { icon: <FaStar />, label: "Campaign", color: "#ffa726" },
    [ProgressCategory.Editor]: { icon: <FaPen />, label: "Editor", color: "#42a5f5" },
    [ProgressCategory.Social]: { icon: <FaUsers />, label: "Social", color: "#ef5350" },
};

// ── XP Card ──
const XpCard: React.FC<{ progress: PlayerProgress; idx: number }> = ({ progress, idx }) => {
    const meta = categoryMeta[progress.category] ?? { icon: <FaStar />, label: "Unknown", color: "#888" };
    const pct = progress.xpToNextLevel > 0
        ? Math.min(100, Math.round((progress.xp / progress.xpToNextLevel) * 100))
        : 100;

    return (
        <Col xs={12} sm={6} md={4} className="mb-3">
            <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: `1px solid ${meta.color}40` }} className="h-100">
                    <Card.Body>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: "50%",
                                background: `${meta.color}20`, display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 20, color: meta.color,
                            }}>
                                {meta.icon}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 15 }}>{meta.label}</div>
                                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                    Level {progress.level}
                                </div>
                            </div>
                            <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                <Badge
                                    pill
                                    style={{
                                        background: meta.color,
                                        fontSize: 16,
                                        padding: "6px 14px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {progress.level}
                                </Badge>
                            </div>
                        </div>

                        {/* XP bar */}
                        <ProgressBar
                            now={pct}
                            style={{ height: 12, background: "var(--bg-primary)", borderRadius: 6 }}
                        >
                            <ProgressBar
                                now={pct}
                                style={{ background: meta.color, borderRadius: 6 }}
                                animated
                            />
                        </ProgressBar>
                        <div className="mt-1" style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-secondary)" }}>
                            <span><FaBolt /> {progress.xp} XP</span>
                            <span>{progress.xpToNextLevel > 0 ? `${progress.xpToNextLevel} to next` : "Max"}</span>
                        </div>
                    </Card.Body>
                </Card>
            </motion.div>
        </Col>
    );
};

// ── Skill Card ──
const SkillCard: React.FC<{ skill: PlayerSkill; idx: number }> = ({ skill, idx }) => {
    const def = skill.skillDefinition;
    return (
        <Col xs={12} sm={6} md={4} lg={3} className="mb-3">
            <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }} className="h-100">
                    <Card.Body className="text-center">
                        <div style={{ fontSize: 32, marginBottom: 8 }}>
                            {def?.iconUrl
                                ? <img src={def.iconUrl} alt={def.name} style={{ width: 40, height: 40 }} />
                                : <FaGem style={{ color: "#e040fb" }} />
                            }
                        </div>
                        <Card.Title style={{ fontSize: 14, fontWeight: 600 }}>{def?.name ?? `Skill #${skill.skillDefinitionId}`}</Card.Title>
                        {def?.description && (
                            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>{def.description}</p>
                        )}
                        <Badge bg={def?.scope === 1 ? "primary" : "secondary"} style={{ fontSize: 10 }}>
                            {def?.scope === 1 ? "Global" : "Campaign"}
                        </Badge>
                        {skill.usageCount > 0 && (
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                                Used {skill.usageCount}×
                            </div>
                        )}
                    </Card.Body>
                </Card>
            </motion.div>
        </Col>
    );
};

// ══════════════════════════════════════════════════════════════

const PlayerProgressPage: React.FC = () => {
    const { t } = useTranslation();
    const { userId } = useUser();
    const playerId = userId ?? 0;

    const { data: progress, isLoading: progressLoading } = usePlayerProgressQuery(playerId);
    const { data: skills, isLoading: skillsLoading } = usePlayerSkillsQuery(playerId);

    if (!userId) {
        return (
            <Container className="py-5 text-center">
                <p style={{ color: "var(--text-secondary)" }}>{t("progress.loginRequired", "Please log in to see your progress.")}</p>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <motion.h2 className="mb-4" style={{ color: "var(--text-primary)" }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <FaStar className="me-2" style={{ color: "#ffa726" }} />
                {t("progress.title", "Your Progress")}
            </motion.h2>

            {/* XP / Levels */}
            <h4 className="mb-3" style={{ color: "var(--text-primary)" }}>
                <FaBolt className="me-2" style={{ color: "#42a5f5" }} />
                {t("progress.xpLevels", "XP & Levels")}
            </h4>

            {progressLoading ? (
                <div className="text-center py-4"><Spinner animation="border" variant="secondary" /></div>
            ) : !progress?.length ? (
                <p style={{ color: "var(--text-secondary)" }}>{t("progress.noProgress", "No progress data yet. Start singing!")}</p>
            ) : (
                <Row>
                    {progress.map((p, i) => <XpCard key={p.category} progress={p} idx={i} />)}
                </Row>
            )}

            {/* Skills */}
            <h4 className="mt-4 mb-3" style={{ color: "var(--text-primary)" }}>
                <FaGem className="me-2" style={{ color: "#e040fb" }} />
                {t("progress.skills", "Unlocked Skills")}
            </h4>

            {skillsLoading ? (
                <div className="text-center py-4"><Spinner animation="border" variant="secondary" /></div>
            ) : !skills?.length ? (
                <p style={{ color: "var(--text-secondary)" }}>{t("progress.noSkills", "No skills unlocked yet. Complete campaign rounds to earn skills!")}</p>
            ) : (
                <Row>
                    {skills.map((s, i) => <SkillCard key={s.id} skill={s} idx={i} />)}
                </Row>
            )}
        </Container>
    );
};

export default PlayerProgressPage;
