import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Badge, Button, Spinner, Tab, Nav, Modal, Form } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaTrophy, FaLock, FaLockOpen, FaCheckCircle, FaPlus, FaUsers, FaUser, FaPlay } from "react-icons/fa";
import {
    useCampaignTemplatesQuery,
    useMyCampaignsQuery,
    useStartCampaignMutation,
} from "../../scripts/api/apiKaraoke";
import {
    CampaignCoopMode,
    CampaignRoundStatus,
} from "../../models/karaoke/modelsCampaign";
import type { CampaignTemplate, Campaign } from "../../models/karaoke/modelsCampaign";
import { useToast } from "../../components/ui/ToastProvider";
import { Focusable } from "../../components/common/Focusable";
import { useModalFocusTrap } from "../../hooks/useModalFocusTrap";

// ── Animation ──
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

const difficultyStars = (d: number) => "★".repeat(Math.min(d, 5)) + "☆".repeat(Math.max(0, 5 - d));

const coopLabel = (mode: CampaignCoopMode) => {
    switch (mode) {
        case CampaignCoopMode.Solo: return "Solo";
        case CampaignCoopMode.AllMustPass: return "All Must Pass";
        case CampaignCoopMode.AnyOnePass: return "Any One Pass";
        default: return "Solo";
    }
};

const roundStatusIcon = (status: CampaignRoundStatus) => {
    switch (status) {
        case CampaignRoundStatus.Locked: return <FaLock style={{ color: "#999" }} />;
        case CampaignRoundStatus.Unlocked: return <FaLockOpen style={{ color: "#42a5f5" }} />;
        case CampaignRoundStatus.Completed: return <FaCheckCircle style={{ color: "#66bb6a" }} />;
    }
};

// ── Template Card ──
const TemplateCard: React.FC<{
    template: CampaignTemplate;
    idx: number;
    onStart: (t: CampaignTemplate) => void;
}> = ({ template, idx, onStart }) => {
    const { t } = useTranslation();
    return (
        <Col xs={12} sm={6} md={4} className="mb-3">
            <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)" }} className="h-100">
                    <Card.Body>
                        <Card.Title style={{ fontWeight: 600 }}>{template.name}</Card.Title>
                        {template.description && (
                            <Card.Text style={{ fontSize: 13, color: "var(--text-secondary)" }}>{template.description}</Card.Text>
                        )}
                        <div style={{ fontSize: 14, marginBottom: 8 }}>
                            <span style={{ color: "#ffa726" }}>{difficultyStars(template.difficulty)}</span>
                            <Badge bg="secondary" className="ms-2">{template.rounds?.length ?? 0} {t("campaign.rounds", "rounds")}</Badge>
                        </div>
                        <Focusable id={`tmpl-start-${template.id}`} highlightMode="glow">
                            <Button variant="primary" size="sm" onClick={() => onStart(template)}>
                                <FaPlay className="me-1" /> {t("campaign.start", "Start")}
                            </Button>
                        </Focusable>
                    </Card.Body>
                </Card>
            </motion.div>
        </Col>
    );
};

// ── Campaign Card (active) ──
const CampaignCard: React.FC<{ campaign: Campaign; idx: number }> = ({ campaign, idx }) => {
    const { t } = useTranslation();
    const completed = campaign.roundProgress?.filter(r => r.status === CampaignRoundStatus.Completed).length ?? 0;
    const total = campaign.roundProgress?.length ?? 0;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const isFinished = campaign.completedAt != null;

    return (
        <Col xs={12} sm={6} md={4} className="mb-3">
            <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Focusable id={`campaign-card-${campaign.id}`} highlightMode="glow">
                <Card
                    as={Link}
                    to={`/campaigns/${campaign.id}`}
                    className="text-decoration-none h-100"
                    style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: `1px solid ${isFinished ? "#66bb6a" : "var(--border-primary)"}` }}
                >
                    <Card.Body>
                        <Card.Title style={{ fontWeight: 600 }}>
                            {campaign.template?.name ?? `Campaign #${campaign.id}`}
                            {isFinished && <FaCheckCircle className="ms-2" style={{ color: "#66bb6a" }} />}
                        </Card.Title>
                        <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6 }}>
                            {campaign.coopMode === CampaignCoopMode.Solo
                                ? <><FaUser className="me-1" /> Solo</>
                                : <><FaUsers className="me-1" /> {coopLabel(campaign.coopMode)} ({campaign.players?.length ?? 1})</>
                            }
                        </div>
                        {/* progress bar */}
                        <div style={{ background: "var(--bg-primary)", borderRadius: 6, height: 10, overflow: "hidden", marginBottom: 6 }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: isFinished ? "#66bb6a" : "#42a5f5", borderRadius: 6, transition: "width .3s" }} />
                        </div>
                        <small style={{ color: "var(--text-secondary)" }}>
                            {completed}/{total} {t("campaign.roundsCompleted", "rounds completed")}
                            {" · "}
                            <FaTrophy className="me-1" style={{ color: "#ffa726" }} />
                            {campaign.totalScore.toLocaleString()} pts
                        </small>
                        {/* round status dots */}
                        <div className="mt-2" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                            {campaign.roundProgress?.map(rp => (
                                <span key={rp.roundNumber} title={`${t("campaign.round", "Round")} ${rp.roundNumber}`}>
                                    {roundStatusIcon(rp.status)}
                                </span>
                            ))}
                        </div>
                    </Card.Body>
                </Card>
                </Focusable>
            </motion.div>
        </Col>
    );
};

// ══════════════════════════════════════════════════════════════
// === Page ===
// ══════════════════════════════════════════════════════════════

const CampaignsPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const { data: templates, isLoading: templatesLoading } = useCampaignTemplatesQuery();
    const { data: myCampaigns, isLoading: myLoading } = useMyCampaignsQuery();
    const startMutation = useStartCampaignMutation();

    // Start modal
    const [showStartModal, setShowStartModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);
    const [coopMode, setCoopMode] = useState<CampaignCoopMode>(CampaignCoopMode.Solo);
    useModalFocusTrap(showStartModal, "start-campaign-", { onDismiss: () => setShowStartModal(false) });

    const handleStartClick = (tmpl: CampaignTemplate) => {
        setSelectedTemplate(tmpl);
        setCoopMode(CampaignCoopMode.Solo);
        setShowStartModal(true);
    };

    const handleStartConfirm = async () => {
        if (!selectedTemplate) return;
        try {
            const campaign = await startMutation.mutateAsync({ templateId: selectedTemplate.id, coopMode });
            setShowStartModal(false);
            showToast(t("campaign.started", "Campaign started!"), "success");
            navigate(`/campaigns/${campaign.id}`);
        } catch {
            showToast(t("campaign.startError", "Failed to start campaign"), "error");
        }
    };

    return (
        <Container className="py-4">
            <h2 className="mb-4" style={{ color: "var(--text-primary)" }}>
                <FaTrophy className="me-2" style={{ color: "#ffa726" }} />
                {t("campaign.title", "Karaoke Campaigns")}
            </h2>

            <Tab.Container defaultActiveKey="my">
                <Nav variant="tabs" className="mb-3">
                    <Nav.Item>
                        <Nav.Link eventKey="my">{t("campaign.myCampaigns", "My Campaigns")}</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                        <Nav.Link eventKey="templates">{t("campaign.templates", "Templates")}</Nav.Link>
                    </Nav.Item>
                </Nav>

                <Tab.Content>
                    {/* My Campaigns */}
                    <Tab.Pane eventKey="my">
                        {myLoading ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                        ) : !myCampaigns?.length ? (
                            <p style={{ color: "var(--text-secondary)" }}>{t("campaign.noCampaigns", "No campaigns yet. Start one from the Templates tab!")}</p>
                        ) : (
                            <Row>
                                {myCampaigns.map((c, i) => <CampaignCard key={c.id} campaign={c} idx={i} />)}
                            </Row>
                        )}
                    </Tab.Pane>

                    {/* Templates */}
                    <Tab.Pane eventKey="templates">
                        {templatesLoading ? (
                            <div className="text-center py-5"><Spinner animation="border" variant="secondary" /></div>
                        ) : !templates?.length ? (
                            <p style={{ color: "var(--text-secondary)" }}>{t("campaign.noTemplates", "No templates available.")}</p>
                        ) : (
                            <Row>
                                {templates.map((tmpl, i) => <TemplateCard key={tmpl.id} template={tmpl} idx={i} onStart={handleStartClick} />)}
                            </Row>
                        )}
                    </Tab.Pane>
                </Tab.Content>
            </Tab.Container>

            {/* Start Campaign Modal */}
            <Modal show={showStartModal} onHide={() => setShowStartModal(false)} centered>
                <Modal.Header closeButton style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    <Modal.Title>{t("campaign.startTitle", "Start Campaign")}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ background: "var(--bg-secondary)", color: "var(--text-primary)" }}>
                    {selectedTemplate && (
                        <>
                            <h5>{selectedTemplate.name}</h5>
                            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedTemplate.description}</p>
                            <p>
                                <span style={{ color: "#ffa726" }}>{difficultyStars(selectedTemplate.difficulty)}</span>
                                {" · "}
                                {selectedTemplate.rounds?.length ?? 0} {t("campaign.rounds", "rounds")}
                            </p>
                            <Form.Group className="mb-3">
                                <Form.Label>{t("campaign.coopMode", "Co-op Mode")}</Form.Label>
                                <Form.Select
                                    value={coopMode}
                                    onChange={e => setCoopMode(Number(e.target.value))}
                                    style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}
                                >
                                    <option value={CampaignCoopMode.Solo}>{t("campaign.solo", "Solo")}</option>
                                    <option value={CampaignCoopMode.AllMustPass}>{t("campaign.allMustPass", "All Must Pass")}</option>
                                    <option value={CampaignCoopMode.AnyOnePass}>{t("campaign.anyOnePass", "Any One Pass")}</option>
                                </Form.Select>
                            </Form.Group>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer style={{ background: "var(--bg-secondary)" }}>
                    <Button variant="secondary" onClick={() => setShowStartModal(false)}>{t("common.cancel", "Cancel")}</Button>
                    <Button variant="primary" onClick={handleStartConfirm} disabled={startMutation.isPending}>
                        {startMutation.isPending ? <Spinner animation="border" size="sm" /> : <><FaPlus className="me-1" /> {t("campaign.start", "Start")}</>}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default CampaignsPage;
