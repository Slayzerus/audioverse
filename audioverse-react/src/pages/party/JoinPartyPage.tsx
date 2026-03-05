import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Card, Form, Button, Spinner, Alert, Badge } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { usePartyQuery, useJoinPartyMutation } from "../../scripts/api/apiKaraoke";
import { EventAccessType } from "../../models/modelsKaraoke";
import { QRCodeSVG } from "qrcode.react";

/* ────────────────────────────────────────────────────────────
   JoinPartyPage — mobile-first page for joining a karaoke party.
   Routes:  /join          → shows code input
            /join/:partyId → join a specific party (optional ?code= query param)
   ──────────────────────────────────────────────────────────── */

const JoinPartyPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { partyId: partyIdParam } = useParams<{ partyId?: string }>();
    const [searchParams] = useSearchParams();

    const parsedId = partyIdParam ? Number(partyIdParam) : 0;
    const prefilledCode = searchParams.get("code") ?? "";

    // ── Local state ──
    const [manualPartyId, setManualPartyId] = useState("");
    const [code, setCode] = useState(prefilledCode);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [joined, setJoined] = useState(false);

    // ── Effective partyId (from route or manual input) ──
    const effectiveId = parsedId || Number(manualPartyId) || 0;

    // ── Fetch party info when we have an id ──
    const partyQuery = usePartyQuery(effectiveId, { enabled: effectiveId > 0 });
    const party = partyQuery.data;

    const joinMut = useJoinPartyMutation();

    const needsCode = useMemo(
        () => {
            const access = party?.access;
            // Backend now returns numeric EventAccessType values
            const numAccess = typeof access === "number" ? access : undefined;
            return numAccess === EventAccessType.Code || numAccess === EventAccessType.Private;
        },
        [party?.access],
    );

    const handleJoin = useCallback(async () => {
        if (effectiveId <= 0) {
            setJoinError(t("joinParty.providePartyId"));
            return;
        }
        setJoinError(null);
        try {
            await joinMut.mutateAsync({
                partyId: effectiveId,
                request: code ? { code } : undefined,
            });
            setJoined(true);
            // Navigate to party page after short feedback
            setTimeout(() => navigate(`/parties/${effectiveId}`), 1200);
        } catch (e: unknown) {
            const resp = typeof e === 'object' && e !== null && 'response' in e ? (e as { response?: { data?: { detail?: string } } }).response : undefined;
            const msg = resp?.data?.detail ?? (e instanceof Error ? e.message : t("joinParty.joinFailed"));
            setJoinError(String(msg));
        }
    }, [effectiveId, code, joinMut, navigate, t]);

    // Auto-join if code came from URL and party is public/code-based
    const autoJoinAttempted = React.useRef(false);
    useEffect(() => {
        if (
            parsedId > 0 &&
            prefilledCode &&
            party &&
            !autoJoinAttempted.current &&
            !joined
        ) {
            autoJoinAttempted.current = true;
            handleJoin();
        }
    }, [parsedId, prefilledCode, party, joined, handleJoin]);

    // ── Share link builder ──
    const shareLink = useMemo(() => {
        if (effectiveId <= 0) return "";
        const base = `${window.location.origin}/join/${effectiveId}`;
        return code ? `${base}?code=${encodeURIComponent(code)}` : base;
    }, [effectiveId, code]);

    return (
        <div
            style={{
                maxWidth: 480,
                margin: "0 auto",
                padding: "40px 16px",
                minHeight: "60vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
            }}
        >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>
                    🎤 {t("joinParty.title")}
                </h2>
                <p style={{ color: "#aaa", marginTop: 8, fontSize: 14 }}>
                    {t("joinParty.subtitle")}
                </p>
            </div>

            {/* ── Party info card ── */}
            {party && (
                <Card bg="dark" text="white" className="mb-3 border-0" style={{ borderLeft: "4px solid var(--accent-secondary, #7c4dff)" }}>
                    <Card.Body className="d-flex align-items-center gap-3">
                        <div style={{ fontSize: 36 }}>🎉</div>
                        <div>
                            <Card.Title className="mb-1">{party.name ?? t("joinParty.partyFallback", { id: party.id })}</Card.Title>
                            <div className="d-flex gap-2">
                                <Badge bg="secondary">{party.access ?? t("joinParty.public")}</Badge>
                                {party.status && <Badge bg="info">{party.status}</Badge>}
                            </div>
                            {party.description && (
                                <div className="text-muted mt-1" style={{ fontSize: 13 }}>
                                    {party.description}
                                </div>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            )}

            {/* ── Success state ── */}
            {joined && (
                <Alert variant="success" className="text-center">
                    ✅ {t("joinParty.joinedRedirect")}
                </Alert>
            )}

            {/* ── Join form ── */}
            {!joined && (
                <Card bg="dark" text="white" className="border-0">
                    <Card.Body>
                        {/* Party ID input (when not from URL) */}
                        {!parsedId && (
                            <Form.Group className="mb-3">
                                <Form.Label>{t("joinParty.partyIdLabel")}</Form.Label>
                                <Form.Control
                                    type="number"
                                    placeholder={t("joinParty.partyIdPlaceholder")}
                                    value={manualPartyId}
                                    onChange={(e) => setManualPartyId(e.target.value)}
                                    size="lg"
                                    min={1}
                                    autoFocus
                                />
                            </Form.Group>
                        )}

                        {/* Code input (always shown if party needs it, optional otherwise) */}
                        {(needsCode || !parsedId) && (
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    {t("joinParty.accessCodeLabel")} {needsCode && <span className="text-danger">*</span>}
                                </Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder={t("joinParty.accessCodePlaceholder")}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                                    size="lg"
                                    maxLength={32}
                                    autoComplete="off"
                                    style={{ letterSpacing: 2, textAlign: "center", fontFamily: "monospace" }}
                                />
                                {!needsCode && (
                                    <Form.Text className="text-muted">
                                        {t("joinParty.accessCodeOptional")}
                                    </Form.Text>
                                )}
                            </Form.Group>
                        )}

                        {joinError && <Alert variant="danger" className="py-2">{joinError}</Alert>}

                        <Button
                            variant="primary"
                            size="lg"
                            className="w-100"
                            onClick={handleJoin}
                            disabled={joinMut.isPending || effectiveId <= 0}
                        >
                            {joinMut.isPending ? (
                                <>
                                    <Spinner size="sm" animation="border" className="me-2" />
                                    {t("joinParty.joining")}
                                </>
                            ) : (
                                t("joinParty.joinButton")
                            )}
                        </Button>

                        {/* Share link */}
                        {effectiveId > 0 && (
                            <div className="mt-3 text-center">
                                <small className="text-muted">{t("joinParty.shareLinkLabel")}</small>
                                <div
                                    className="mt-1 px-2 py-1"
                                    style={{
                                        background: "var(--page-bg, #1a1a2e)",
                                        borderRadius: 8,
                                        fontSize: 13,
                                        fontFamily: "monospace",
                                        wordBreak: "break-all",
                                        userSelect: "all",
                                    }}
                                >
                                    {shareLink}
                                </div>

                                {/* QR Code */}
                                <div className="mt-3">
                                    <small className="text-muted d-block mb-2">
                                        {t("joinParty.scanQR", "Scan the QR code to join:")}
                                    </small>
                                    <div
                                        style={{
                                            display: "inline-block",
                                            padding: 12,
                                            background: "#fff",
                                            borderRadius: 12,
                                            boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
                                        }}
                                    >
                                        <QRCodeSVG
                                            value={shareLink}
                                            size={200}
                                            level="M"
                                            includeMargin={false}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </Card.Body>
                </Card>
            )}

            {/* ── Loading indicator ── */}
            {partyQuery.isLoading && effectiveId > 0 && (
                <div className="text-center mt-3">
                    <Spinner animation="border" size="sm" /> {t("joinParty.loadingParty")}
                </div>
            )}

            {/* ── Back link ── */}
            <div className="text-center mt-4">
                <Button variant="link" onClick={() => navigate("/parties")} style={{ color: "var(--text-muted, #aaa)" }}>
                    ← {t("joinParty.backToParties")}
                </Button>
            </div>
        </div>
    );
};

export default JoinPartyPage;
