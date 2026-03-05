import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, Badge, Button, Spinner, Modal } from "react-bootstrap";
import { motion } from "framer-motion";
import {
    FaTrophy, FaLock, FaLockOpen, FaCheckCircle, FaPlay, FaMusic, FaUsers, FaUser, FaUserPlus,
} from "react-icons/fa";
import {
    useCampaignQuery,
    useChooseSongMutation,
    useJoinCampaignMutation,
} from "../../scripts/api/apiKaraoke";
import {
    CampaignCoopMode,
    CampaignRoundStatus,
    type CampaignRoundProgress,
    type CampaignTemplateRound,
    type CampaignTemplateRoundSong,
} from "../../models/karaoke/modelsCampaign";
import { KaraokeRoundMode } from "../../models/karaoke/modelsKaraokeCore";
import { useToast } from "../../components/ui/ToastProvider";
import { Focusable } from "../../components/common/Focusable";
import { useModalFocusTrap } from "../../hooks/useModalFocusTrap";

// ── Helpers ──
const modeLabel = (mode: KaraokeRoundMode): string => {
    const map: Record<number, string> = {
        0: "Normal", 1: "Demo", 2: "No Lyrics", 3: "No Timeline",
        4: "Blind", 5: "Speed Run", 6: "Duet", 7: "FreeStyle",
    };
    return map[mode] ?? "Normal";
};

const statusColor = (s: CampaignRoundStatus) =>
    s === CampaignRoundStatus.Completed ? "#66bb6a" : s === CampaignRoundStatus.Unlocked ? "#42a5f5" : "#666";

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

// ══════════════════════════════════════════════════════════════

const CampaignDetailPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { campaignId: rawId } = useParams<{ campaignId: string }>();
    const campaignId = Number(rawId);

    const { data: campaign, isLoading } = useCampaignQuery(campaignId);
    const chooseSongMutation = useChooseSongMutation();
    const joinMutation = useJoinCampaignMutation();

    // Song picker modal
    const [pickerRound, setPickerRound] = useState<number | null>(null);
    const [pickerSongs, setPickerSongs] = useState<CampaignTemplateRoundSong[]>([]);
    const [pickerTemplateRound, setPickerTemplateRound] = useState<CampaignTemplateRound | null>(null);
    useModalFocusTrap(pickerRound != null, "song-pick-", { onDismiss: () => setPickerRound(null) });

    if (isLoading || !campaign) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" variant="secondary" />
            </Container>
        );
    }

    const template = campaign.template;
    const isFinished = campaign.completedAt != null;

    const openSongPicker = (rp: CampaignRoundProgress) => {
        const tRound = template?.rounds?.find(r => r.roundNumber === rp.roundNumber);
        if (!tRound) return;
        setPickerRound(rp.roundNumber);
        setPickerSongs(tRound.songPool ?? []);
        setPickerTemplateRound(tRound);
    };

    const handleChooseSong = async (songId: number) => {
        if (pickerRound == null) return;
        try {
            await chooseSongMutation.mutateAsync({ campaignId, roundNumber: pickerRound, songId });
            setPickerRound(null);
            showToast(t("campaign.songChosen", "Song chosen!"), "success");

            // Navigate to karaoke singing with campaign context
            const tRound = pickerTemplateRound;
            navigate("/rounds", {
                state: {
                    campaignId,
                    campaignRoundNumber: pickerRound,
                    songId,
                    gameMode: tRound?.singingMode ?? KaraokeRoundMode.Normal,
                },
            });
        } catch {
            showToast(t("campaign.chooseSongError", "Failed to choose song"), "error");
        }
    };

    const handleJoin = async () => {
        try {
            await joinMutation.mutateAsync(campaignId);
            showToast(t("campaign.joined", "Joined campaign!"), "success");
        } catch {
            showToast(t("campaign.joinError", "Failed to join"), "error");
        }
    };

    return (
        <Container className="py-4">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h2 style={{ color: "var(--text-primary)" }}>
                    <FaTrophy className="me-2" style={{ color: "#ffa726" }} />
                    {template?.name ?? `Campaign #${campaign.id}`}
                    {isFinished && <Badge bg="success" className="ms-2">{t("campaign.completed", "Completed")}</Badge>}
                </h2>
                {template?.description && (
                    <p style={{ color: "var(--text-secondary)", maxWidth: 600 }}>{template.description}</p>
                )}
                <div className="mb-3" style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
                    <Badge bg="secondary">
                        {campaign.coopMode === CampaignCoopMode.Solo
                            ? <><FaUser className="me-1" /> Solo</>
                            : <><FaUsers className="me-1" /> {campaign.coopMode === CampaignCoopMode.AllMustPass ? "All Must Pass" : "Any One Pass"}</>
                        }
                    </Badge>
                    <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                        {t("campaign.players", "Players")}: {campaign.players?.map(p => p.player?.name ?? `#${p.playerId}`).join(", ")}
                    </span>
                    {campaign.coopMode !== CampaignCoopMode.Solo && !isFinished && (
                        <Focusable id="campaign-join" highlightMode="glow">
                            <Button variant="outline-primary" size="sm" onClick={handleJoin} disabled={joinMutation.isPending}>
                                <FaUserPlus className="me-1" /> {t("campaign.join", "Join")}
                            </Button>
                        </Focusable>
                    )}
                </div>
                {/* Score summary */}
                <div className="mb-4" style={{ display: "flex", gap: 24 }}>
                    <div>
                        <small style={{ color: "var(--text-secondary)" }}>{t("campaign.totalScoreLabel", "Total Score")}</small>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#ffa726" }}>{campaign.totalScore.toLocaleString()}</div>
                    </div>
                    <div>
                        <small style={{ color: "var(--text-secondary)" }}>{t("campaign.xpEarned", "XP Earned")}</small>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#42a5f5" }}>{campaign.totalXpEarned}</div>
                    </div>
                </div>
            </motion.div>

            {/* Round Map */}
            <h4 className="mb-3" style={{ color: "var(--text-primary)" }}>
                {t("campaign.roundMap", "Round Map")}
            </h4>
            <Row>
                {campaign.roundProgress?.map((rp, i) => {
                    const tRound = template?.rounds?.find(r => r.roundNumber === rp.roundNumber);
                    const isUnlocked = rp.status === CampaignRoundStatus.Unlocked;
                    const isCompleted = rp.status === CampaignRoundStatus.Completed;
                    const isLocked = rp.status === CampaignRoundStatus.Locked;

                    return (
                        <Col key={rp.roundNumber} xs={12} sm={6} md={4} lg={3} className="mb-3">
                            <motion.div custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                                <Card
                                    style={{
                                        background: "var(--bg-secondary)",
                                        color: "var(--text-primary)",
                                        border: `2px solid ${statusColor(rp.status)}`,
                                        opacity: isLocked ? 0.5 : 1,
                                    }}
                                    className="h-100"
                                >
                                    <Card.Body>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                            <span style={{ fontWeight: 600, fontSize: 15 }}>
                                                {isLocked ? <FaLock className="me-1" /> : isCompleted ? <FaCheckCircle className="me-1" style={{ color: "#66bb6a" }} /> : <FaLockOpen className="me-1" style={{ color: "#42a5f5" }} />}
                                                {tRound?.name ?? `${t("campaign.round", "Round")} ${rp.roundNumber}`}
                                            </span>
                                            <Badge bg={isCompleted ? "success" : isUnlocked ? "primary" : "secondary"} style={{ fontSize: 10 }}>
                                                {isCompleted ? t("campaign.done", "Done") : isUnlocked ? t("campaign.open", "Open") : t("campaign.locked", "Locked")}
                                            </Badge>
                                        </div>

                                        {tRound && (
                                            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8 }}>
                                                <div>🎤 {modeLabel(tRound.singingMode)}</div>
                                                <div>🏆 {t("campaign.threshold", "Threshold")}: {tRound.scoreThreshold.toLocaleString()}</div>
                                                <div>⭐ {tRound.xpReward} XP</div>
                                                {tRound.rewardSkillDefinition && (
                                                    <div>🎁 {tRound.rewardSkillDefinition.name}</div>
                                                )}
                                                <div><FaMusic className="me-1" /> {tRound.songPool?.length ?? 0} {t("campaign.songs", "songs")}</div>
                                            </div>
                                        )}

                                        {isCompleted && rp.bestScore != null && (
                                            <div style={{ fontSize: 13 }}>
                                                ✅ {rp.bestScore.toLocaleString()} pts · {rp.xpEarned} XP
                                            </div>
                                        )}

                                        {isUnlocked && !isFinished && (
                                            <Focusable id={`campaign-play-${rp.roundNumber}`} highlightMode="glow">
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="mt-2 w-100"
                                                    onClick={() => openSongPicker(rp)}
                                                >
                                                    <FaPlay className="me-1" /> {t("campaign.play", "Play")}
                                                </Button>
                                            </Focusable>
                                        )}
                                    </Card.Body>
                                </Card>
                            </motion.div>
                        </Col>
                    );
                })}
            </Row>

            {/* Song Picker Modal */}
            <Modal show={pickerRound != null} onHide={() => setPickerRound(null)} centered>
                <Modal.Header closeButton style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    <Modal.Title>
                        <FaMusic className="me-2" />
                        {t("campaign.chooseSong", "Choose a Song")}
                        {pickerTemplateRound && ` — ${pickerTemplateRound.name ?? `Round ${pickerRound}`}`}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    {pickerTemplateRound && (
                        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 12 }}>
                            🎤 {modeLabel(pickerTemplateRound.singingMode)} · 🏆 {t("campaign.threshold", "Threshold")}: {pickerTemplateRound.scoreThreshold.toLocaleString()}
                        </p>
                    )}
                    {pickerSongs.length === 0 ? (
                        <p>{t("campaign.noSongsInPool", "No songs in pool.")}</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {pickerSongs.map(s => (
                                <Focusable key={s.songId} id={`song-pick-${s.songId}`} highlightMode="glow">
                                    <Button
                                        variant="outline-primary"
                                        className="text-start w-100"
                                        onClick={() => handleChooseSong(s.songId)}
                                        disabled={chooseSongMutation.isPending}
                                    >
                                        <FaMusic className="me-2" />
                                        <strong>{s.song?.title ?? `Song #${s.songId}`}</strong>
                                        {s.song?.artist && <span style={{ color: "var(--text-secondary)" }}> — {s.song.artist}</span>}
                                    </Button>
                                </Focusable>
                            ))}
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default CampaignDetailPage;
