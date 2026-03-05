import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Container, Row, Col, Card, Badge, Form } from "react-bootstrap";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    FaProjectDiagram, FaArrowLeft, FaServer, FaReact,
    FaSearchPlus, FaExternalLinkAlt, FaFilter,
} from "react-icons/fa";

/* ── animation ── */
const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

/* ── Diagram descriptor ── */
interface DiagramInfo {
    id: string;
    title: string;
    description: string;
    category: "backend" | "frontend";
    /** Relative path from public/ root (for frontend) or external path (for backend reference) */
    filePath: string;
    color: string;
}

const DIAGRAMS: DiagramInfo[] = [
    // ── Backend diagrams (01–12) ──
    { id: "01", title: "System Architecture", description: "Overall system component overview — Frontend, Backend, Database, AI, Infrastructure", category: "backend", filePath: "01-system-architecture.drawio", color: "#42a5f5" },
    { id: "02", title: "Core Data Model", description: "Primary database entities — Users, Songs, Events, Scores and their relationships", category: "backend", filePath: "02-core-data-model.drawio", color: "#66bb6a" },
    { id: "03", title: "Event Lifecycle", description: "Party/event flow — creation, joining, karaoke rounds, scoring, completion", category: "backend", filePath: "03-event-lifecycle.drawio", color: "#ffa726" },
    { id: "04", title: "SignalR Real-Time", description: "WebSocket hubs and real-time communication patterns", category: "backend", filePath: "04-signalr-realtime.drawio", color: "#ab47bc" },
    { id: "05", title: "CI/CD Pipeline", description: "Azure DevOps build, test, and deploy process", category: "backend", filePath: "05-cicd-pipeline.drawio", color: "#26c6da" },
    { id: "06", title: "Auth & JWT Flow", description: "Authentication flow — login, JWT issuance, refresh tokens, OAuth", category: "backend", filePath: "06-auth-jwt-flow.drawio", color: "#ef5350" },
    { id: "07", title: "Events Sub-Resources", description: "Event-related entities — rounds, playlists, subscriptions, shared lists", category: "backend", filePath: "07-events-sub-resources.drawio", color: "#5c6bc0" },
    { id: "08", title: "CQRS Architecture", description: "Command/Query Responsibility Segregation with MediatR pipeline", category: "backend", filePath: "08-cqrs-architecture.drawio", color: "#78909c" },
    { id: "09", title: "Karaoke Session Flow", description: "Real-time karaoke — song selection, pitch analysis, scoring, results", category: "backend", filePath: "09-karaoke-session-flow.drawio", color: "#e040fb" },
    { id: "10", title: "Audio/Radio/Editor Data Model", description: "Audio files, radio stations, editor projects and tracks", category: "backend", filePath: "10-audio-radio-editor-data-model.drawio", color: "#8d6e63" },
    { id: "11", title: "Docker Containers", description: "Container orchestration — Nginx, API, PostgreSQL, Redis, MinIO, AI", category: "backend", filePath: "11-docker-containers.drawio", color: "#00897b" },
    { id: "12", title: "API Areas & Controllers", description: "Backend controller structure organized by API areas", category: "backend", filePath: "12-api-areas-controllers.drawio", color: "#546e7a" },

    // ── Frontend diagrams ──
    { id: "f1", title: "Frontend Architecture", description: "React app layer structure — Router, Layouts, Pages, Components, Hooks, Contexts, API Layer", category: "frontend", filePath: "frontend-architecture.drawio", color: "#1e88e5" },
    { id: "f2", title: "Karaoke Data Flow", description: "Microphone → useKaraokeManager → Pitch/Scoring/Transcription → Timeline → Canvas output", category: "frontend", filePath: "karaoke-data-flow.drawio", color: "#e040fb" },
    { id: "f3", title: "Game State Management", description: "GamepadNavigationContext, game modes, player state, scoring engine, session summary", category: "frontend", filePath: "game-state-management.drawio", color: "#ff7043" },
    { id: "f4", title: "Routing Structure", description: "Complete route tree — RootLayout → Public/AuthLayout/AdminLayout with all 80+ page routes", category: "frontend", filePath: "routing-structure.drawio", color: "#26a69a" },
];

/* ── Diagram card component ── */
interface DiagramCardProps {
    diagram: DiagramInfo;
    idx: number;
    onPreview: (d: DiagramInfo) => void;
}

const DiagramCard = React.memo<DiagramCardProps>(({ diagram, idx, onPreview }) => {
    const { t } = useTranslation();
    const categoryColor = diagram.category === "backend" ? "#42a5f5" : "#66bb6a";
    const categoryLabel = diagram.category === "backend"
        ? t("diagrams.backend", "Backend")
        : t("diagrams.frontend", "Frontend");

    return (
        <Col xs={12} sm={6} lg={4} className="mb-3">
            <motion.div custom={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Card
                    className="h-100"
                    style={{
                        background: "var(--bg-secondary)",
                        border: `1px solid ${diagram.color}40`,
                        color: "var(--text-primary)",
                        cursor: "pointer",
                        transition: "transform .2s, box-shadow .2s",
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${diagram.color}30`;
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = "";
                        (e.currentTarget as HTMLElement).style.boxShadow = "";
                    }}
                    onClick={() => onPreview(diagram)}
                    data-testid={`diagram-card-${diagram.id}`}
                >
                    <Card.Body style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <FaProjectDiagram style={{ fontSize: 20, color: diagram.color, flexShrink: 0 }} />
                            <div style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{diagram.id}. {diagram.title}</div>
                            <Badge bg="none" style={{ background: `${categoryColor}30`, color: categoryColor, fontSize: 10, fontWeight: 600 }}>
                                {categoryLabel}
                            </Badge>
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{diagram.description}</div>
                        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                            <Badge bg="none" style={{ background: "var(--bg-primary)", color: "var(--text-secondary)", fontSize: 10 }}>
                                <FaSearchPlus className="me-1" />{t("diagrams.preview", "Preview")}
                            </Badge>
                        </div>
                    </Card.Body>
                </Card>
            </motion.div>
        </Col>
    );
});
DiagramCard.displayName = "DiagramCard";

/* ── Preview overlay ── */
interface PreviewOverlayProps {
    diagram: DiagramInfo;
    onClose: () => void;
}

const PreviewOverlay: React.FC<PreviewOverlayProps> = ({ diagram, onClose }) => {
    const { t } = useTranslation();

    // For frontend diagrams, embed via diagrams.net viewer
    // For backend diagrams, show info card since files are in backend repo
    const isFrontend = diagram.category === "frontend";
    const viewerUrl = isFrontend
        ? `https://viewer.diagrams.net/?highlight=0000ff&nav=1&title=${encodeURIComponent(diagram.title)}&url=${encodeURIComponent(window.location.origin + "/diagrams/" + diagram.filePath)}`
        : null;

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                background: "rgba(0,0,0,0.8)",
                display: "flex",
                flexDirection: "column",
            }}
            onClick={onClose}
            data-testid="diagram-preview-overlay"
        >
            {/* Header bar */}
            <div
                style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 20px",
                    background: "var(--bg-secondary)",
                    borderBottom: "1px solid var(--border-color)",
                }}
                onClick={e => e.stopPropagation()}
            >
                <FaProjectDiagram style={{ color: diagram.color, fontSize: 20 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{diagram.id}. {diagram.title}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{diagram.description}</div>
                </div>
                {viewerUrl && (
                    <a
                        href={viewerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--text-primary)", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
                        data-testid="diagram-external-link"
                    >
                        <FaExternalLinkAlt /> {t("diagrams.openExternal", "Open in diagrams.net")}
                    </a>
                )}
                <button
                    onClick={onClose}
                    style={{
                        background: "none", border: "1px solid var(--border-color)",
                        color: "var(--text-primary)", borderRadius: 6, padding: "4px 14px",
                        fontSize: 13, cursor: "pointer",
                    }}
                    data-testid="diagram-close-btn"
                >
                    ✕ {t("common.close", "Close")}
                </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                {isFrontend && viewerUrl ? (
                    <iframe
                        src={viewerUrl}
                        title={diagram.title}
                        style={{ width: "100%", height: "100%", border: "none" }}
                        data-testid="diagram-iframe"
                    />
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 40 }}>
                        <Card style={{ maxWidth: 500, background: "var(--bg-secondary)", color: "var(--text-primary)", border: `1px solid ${diagram.color}40` }}>
                            <Card.Body className="text-center" style={{ padding: 30 }}>
                                <FaServer style={{ fontSize: 48, color: diagram.color, marginBottom: 16 }} />
                                <h5>{diagram.title}</h5>
                                <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>
                                    {t("diagrams.backendOnly", "This diagram is located in the backend repository.")}
                                </p>
                                <code style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                                    audioverse-dotnet/AudioVerse.API/Docs/diagrams/{diagram.filePath}
                                </code>
                            </Card.Body>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════ */

const DiagramsGalleryPage: React.FC = () => {
    const { t } = useTranslation();
    const [filter, setFilter] = useState<"all" | "backend" | "frontend">("all");
    const [preview, setPreview] = useState<DiagramInfo | null>(null);
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        let list = DIAGRAMS;
        if (filter !== "all") list = list.filter(d => d.category === filter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(d =>
                d.title.toLowerCase().includes(q) ||
                d.description.toLowerCase().includes(q) ||
                d.id.toLowerCase().includes(q)
            );
        }
        return list;
    }, [filter, search]);

    const backendCount = DIAGRAMS.filter(d => d.category === "backend").length;
    const frontendCount = DIAGRAMS.filter(d => d.category === "frontend").length;

    return (
        <Container fluid className="px-3 px-md-4 py-4" style={{ maxWidth: 1200 }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <Link to="/admin" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: 13 }}>
                    <FaArrowLeft className="me-1" /> {t("common.backToAdmin", "Back to Admin")}
                </Link>
                <h3 className="mt-2 mb-1" style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                    <FaProjectDiagram className="me-2" style={{ color: "#42a5f5" }} />
                    {t("diagrams.gallery", "Diagrams Gallery")}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 16 }}>
                    {t("diagrams.galleryDesc", "Browse all architecture & data model diagrams. Click a card to preview.")}
                </p>
            </motion.div>

            {/* Stats row */}
            <Row className="mb-3 gx-2">
                <Col xs="auto">
                    <Badge bg="none" style={{ background: "#42a5f520", color: "#42a5f5", fontSize: 13, padding: "6px 14px" }}>
                        <FaServer className="me-1" /> {backendCount} {t("diagrams.backend", "Backend")}
                    </Badge>
                </Col>
                <Col xs="auto">
                    <Badge bg="none" style={{ background: "#66bb6a20", color: "#66bb6a", fontSize: 13, padding: "6px 14px" }}>
                        <FaReact className="me-1" /> {frontendCount} {t("diagrams.frontend", "Frontend")}
                    </Badge>
                </Col>
                <Col xs="auto">
                    <Badge bg="none" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: 13, padding: "6px 14px" }}>
                        {DIAGRAMS.length} {t("diagrams.total", "Total")}
                    </Badge>
                </Col>
            </Row>

            {/* Filter + search */}
            <Row className="mb-4 gx-2 align-items-center">
                <Col xs={12} sm={6} md={4} className="mb-2 mb-sm-0">
                    <Form.Control
                        type="text"
                        placeholder={t("diagrams.search", "Search diagrams…")}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", fontSize: 13 }}
                        data-testid="diagram-search"
                    />
                </Col>
                <Col xs="auto">
                    <div style={{ display: "flex", gap: 6 }}>
                        {(["all", "backend", "frontend"] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: "4px 14px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                                    border: filter === f ? "1px solid #42a5f5" : "1px solid var(--border-color)",
                                    background: filter === f ? "#42a5f520" : "var(--bg-secondary)",
                                    color: filter === f ? "#42a5f5" : "var(--text-secondary)",
                                }}
                                data-testid={`filter-${f}`}
                            >
                                <FaFilter className="me-1" style={{ fontSize: 10 }} />
                                {f === "all" ? t("diagrams.all", "All") : f === "backend" ? t("diagrams.backend", "Backend") : t("diagrams.frontend", "Frontend")}
                            </button>
                        ))}
                    </div>
                </Col>
            </Row>

            {/* Grid */}
            <Row>
                {filtered.map((d, i) => (
                    <DiagramCard key={d.id} diagram={d} idx={i} onPreview={setPreview} />
                ))}
                {filtered.length === 0 && (
                    <Col xs={12}>
                        <div className="text-center py-5" style={{ color: "var(--text-secondary)" }}>
                            {t("diagrams.noResults", "No diagrams match your search.")}
                        </div>
                    </Col>
                )}
            </Row>

            {/* Preview overlay */}
            {preview && <PreviewOverlay diagram={preview} onClose={() => setPreview(null)} />}
        </Container>
    );
};

export default DiagramsGalleryPage;
