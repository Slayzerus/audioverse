// AttractionVotingPanel.tsx — Proposals + approved sessions + rejected collapse
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { PartyAttraction } from "../../models/modelsKaraoke";
import {
    usePartyAttractionsQuery,
    useVoteAttractionMutation,
    useDeleteAttractionMutation,
    useUpdateAttractionStatusMutation,
} from "../../scripts/api/apiPartyAttractions";
import { useAddSessionMutation } from "../../scripts/api/apiKaraoke";

// ── Constants ──

const TYPE_ICONS: Record<string, string> = {
    karaoke: "🎤", videoGame: "🎮", boardGame: "🎲",
    photoBooth: "📷", danceFloor: "🕺", djSet: "🎧", custom: "⭐",
};

// ── Props ──

interface AttractionVotingPanelProps {
    partyId: number;
    currentUserId?: number;
    isOrganizer?: boolean;
    onOpenAttraction?: (attractionId: string) => void;
}

// ── Component ──

const AttractionVotingPanel: React.FC<AttractionVotingPanelProps> = ({
    partyId, isOrganizer, onOpenAttraction,
}) => {
    const { t } = useTranslation();
    const { data: attractions = [], isLoading } = usePartyAttractionsQuery(partyId);
    const voteMutation = useVoteAttractionMutation(partyId);
    const deleteMutation = useDeleteAttractionMutation(partyId);
    const statusMutation = useUpdateAttractionStatusMutation(partyId);
    const addSessionMut = useAddSessionMutation();

    const [showRejected, setShowRejected] = useState(false);

    // ── Categorise ──
    const proposals = attractions.filter(a => a.status === "suggested").sort((a, b) => b.votes - a.votes);
    const sessions  = attractions.filter(a => a.status === "approved" || a.status === "played").sort((a, b) => b.votes - a.votes);
    const rejected  = attractions.filter(a => a.status === "rejected").sort((a, b) => b.votes - a.votes);

    // ── Handlers ──
    const handleApprove = async (attraction: PartyAttraction) => {
        try {
            // Create session from the proposal
            const result = await addSessionMut.mutateAsync({
                partyId: partyId,
                name: attraction.name,
                eventId: partyId,
            });
            // Mark attraction as approved with linked sessionId
            statusMutation.mutate({
                attractionId: attraction.id,
                status: "approved",
                sessionId: result.sessionId,
            });
        } catch {
            // If session creation fails, still approve without session link
            statusMutation.mutate({ attractionId: attraction.id, status: "approved" });
        }
    };

    const handleReject = (attraction: PartyAttraction) => {
        statusMutation.mutate({ attractionId: attraction.id, status: "rejected" });
    };

    const handleRestore = (attraction: PartyAttraction) => {
        statusMutation.mutate({ attractionId: attraction.id, status: "suggested" });
    };

    // ── Loading ──
    if (isLoading) {
        return (
            <div className="d-flex flex-column gap-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="placeholder-glow">
                        <div className="placeholder rounded" style={{ height: 56, width: '100%', opacity: 0.15 }} />
                    </div>
                ))}
            </div>
        );
    }

    // ── Empty ──
    if (attractions.length === 0) {
        return (
            <div className="text-center py-5" style={{ borderRadius: 12, border: '2px dashed rgba(255,255,255,0.15)', padding: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🎭</div>
                <p className="mb-1 fw-semibold">{t("party.noAttractionsYet", "No proposals")}</p>
                <p className="small text-muted mb-0">{t("party.suggestSomething", "Add the first attraction proposal by clicking the + Add button above")}</p>
            </div>
        );
    }

    const maxVotes = Math.max(...proposals.map(a => a.votes), 1);

    return (
        <div className="d-flex flex-column gap-4">
            {/* ═══════════ Proposals ═══════════ */}
            {proposals.length > 0 && (
                <section>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2 d-flex align-items-center gap-2">
                        <i className="fa fa-lightbulb" aria-hidden="true" style={{ color: '#ffc107' }} />
                        {t("party.proposals", "Proposals")}
                        <span className="badge bg-secondary rounded-pill" style={{ fontSize: 10 }}>{proposals.length}</span>
                    </h6>
                    <div className="d-flex flex-column gap-2">
                        {proposals.map((attraction, idx) => (
                            <ProposalRow
                                key={attraction.id}
                                attraction={attraction}
                                rank={idx + 1}
                                maxVotes={maxVotes}
                                isTop={idx === 0 && attraction.votes > 0}
                                isOrganizer={!!isOrganizer}
                                onVote={() => voteMutation.mutate({ attractionId: attraction.id, vote: 1 })}
                                onApprove={() => handleApprove(attraction)}
                                onReject={() => handleReject(attraction)}
                                onDelete={() => { if (confirm(t('common.deleteConfirm', 'Are you sure you want to delete?'))) deleteMutation.mutate(attraction.id); }}
                                onClick={() => onOpenAttraction?.(attraction.id)}
                                t={t}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ═══════════ Approved Sessions ═══════════ */}
            {sessions.length > 0 && (
                <section>
                    <h6 className="text-uppercase text-muted small fw-bold mb-2 d-flex align-items-center gap-2">
                        <i className="fa fa-check-circle" aria-hidden="true" style={{ color: '#198754' }} />
                        {t("party.approved", "Approved")}
                        <span className="badge bg-success rounded-pill" style={{ fontSize: 10 }}>{sessions.length}</span>
                    </h6>
                    <div className="d-flex flex-column gap-2">
                        {sessions.map(attraction => (
                            <SessionRow
                                key={attraction.id}
                                attraction={attraction}
                                onClick={() => onOpenAttraction?.(attraction.id)}
                                t={t}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* ═══════════ Rejected – Collapse ═══════════ */}
            {rejected.length > 0 && (
                <section>
                    <button
                        className="btn btn-sm w-100 d-flex align-items-center gap-2 justify-content-center"
                        style={{
                            background: 'rgba(220,53,69,0.06)',
                            border: '1px solid rgba(220,53,69,0.15)',
                            borderRadius: 8,
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 13,
                        }}
                        onClick={() => setShowRejected(!showRejected)}
                    >
                        <i className={`fa fa-chevron-${showRejected ? 'up' : 'down'}`} aria-hidden="true" style={{ fontSize: 10 }} />
                        {t("party.rejectedProposals", "Rejected proposals")}
                        <span className="badge bg-danger rounded-pill" style={{ fontSize: 10 }}>{rejected.length}</span>
                    </button>
                    {showRejected && (
                        <div className="d-flex flex-column gap-2 mt-2" style={{ opacity: 0.6 }}>
                            {rejected.map(attraction => (
                                <RejectedRow
                                    key={attraction.id}
                                    attraction={attraction}
                                    isOrganizer={!!isOrganizer}
                                    onRestore={() => handleRestore(attraction)}
                                    onDelete={() => { if (confirm(t('common.deleteConfirm', 'Are you sure you want to delete?'))) deleteMutation.mutate(attraction.id); }}
                                    t={t}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};

// ── Proposal Row ──────────────────────────────────────────────────

interface ProposalRowProps {
    attraction: PartyAttraction;
    rank: number;
    maxVotes: number;
    isTop: boolean;
    isOrganizer: boolean;
    onVote: () => void;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
    onClick?: () => void;
    t: TFunction;
}

const ProposalRow: React.FC<ProposalRowProps> = ({
    attraction, rank, maxVotes, isTop, isOrganizer,
    onVote, onApprove, onReject, onDelete, onClick, t,
}) => {
    const icon = TYPE_ICONS[attraction.type] ?? "📌";
    const votePercent = Math.round((attraction.votes / maxVotes) * 100);

    return (
        <div
            className="d-flex align-items-center gap-2 position-relative"
            style={{
                cursor: onClick ? 'pointer' : undefined,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: isTop ? '1px solid rgba(255,193,7,0.3)' : '1px solid rgba(255,255,255,0.06)',
                transition: 'all .15s ease',
                overflow: 'hidden',
            }}
            onClick={onClick}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
        >
            {/* Vote bar background */}
            <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${votePercent}%`,
                background: isTop
                    ? 'linear-gradient(90deg, rgba(255,193,7,0.08), rgba(255,193,7,0.02))'
                    : 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)',
                transition: 'width .3s ease', pointerEvents: 'none',
            }} />

            {/* Rank */}
            <span className="fw-bold" style={{
                fontSize: 13, width: 24, textAlign: 'center', flexShrink: 0,
                color: isTop ? '#ffc107' : 'rgba(255,255,255,0.35)', position: 'relative',
            }}>
                {rank}
            </span>

            {/* Icon */}
            <span style={{ fontSize: 24, flexShrink: 0, position: 'relative' }}>{icon}</span>

            {/* Name & meta */}
            <div className="flex-grow-1" style={{ minWidth: 0, position: 'relative' }}>
                <div className="fw-semibold text-truncate" style={{ fontSize: 14 }}>
                    {attraction.name}
                    {isTop && <span className="ms-1" style={{ fontSize: 12 }}>👑</span>}
                </div>
                {attraction.suggesterName && (
                    <div className="text-muted" style={{ fontSize: 11 }}>
                        {attraction.suggesterName}
                    </div>
                )}
            </div>

            {/* Status badge */}
            <span className="badge bg-secondary" style={{ fontSize: 10, padding: '3px 8px', position: 'relative' }}>
                {t("party.attractionStatus.suggested", "Proposal")}
            </span>

            {/* Vote button */}
            <button
                className="btn btn-sm d-flex align-items-center gap-1"
                style={{
                    minWidth: 48, position: 'relative',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                    padding: '4px 8px', fontSize: 13, transition: 'all .15s',
                }}
                onClick={e => { e.stopPropagation(); onVote(); }}
                title={t("party.voteUp", "Vote")}
            >
                <i className="fa fa-arrow-up" style={{ fontSize: 10 }} aria-hidden="true" />
                <span className="fw-bold">{attraction.votes}</span>
            </button>

            {/* Organizer actions: Approve / Reject */}
            {isOrganizer && (
                <div className="d-flex gap-1" style={{ position: 'relative' }}>
                    <button
                        className="btn btn-sm btn-outline-success"
                        style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6 }}
                        onClick={e => { e.stopPropagation(); onApprove(); }}
                        title={t("party.approve", "Approve")}
                    >
                        <i className="fa fa-check" aria-hidden="true" />
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        style={{ padding: '3px 8px', fontSize: 11, borderRadius: 6 }}
                        onClick={e => { e.stopPropagation(); onReject(); }}
                        title={t("party.reject", "Reject")}
                    >
                        <i className="fa fa-times" aria-hidden="true" />
                    </button>
                </div>
            )}

            {/* Delete */}
            <button
                className="btn btn-sm"
                style={{ position: 'relative', opacity: 0.4, transition: 'opacity .15s', padding: '4px 6px' }}
                onClick={e => { e.stopPropagation(); onDelete(); }}
                title={t("common.delete")}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '0.4'; }}
            >
                <i className="fa fa-trash" style={{ fontSize: 12, color: '#dc3545' }} aria-hidden="true" />
            </button>
        </div>
    );
};

// ── Session Row (approved) ────────────────────────────────────────

interface SessionRowProps {
    attraction: PartyAttraction;
    onClick?: () => void;
    t: TFunction;
}

const SessionRow: React.FC<SessionRowProps> = ({ attraction, onClick, t }) => {
    const icon = TYPE_ICONS[attraction.type] ?? "📌";

    return (
        <div
            className="d-flex align-items-center gap-2"
            style={{
                cursor: onClick ? 'pointer' : undefined,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(25,135,84,0.06)',
                border: '1px solid rgba(25,135,84,0.2)',
                transition: 'all .15s ease',
            }}
            onClick={onClick}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(25,135,84,0.12)';
                (e.currentTarget as HTMLElement).style.transform = 'translateX(2px)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(25,135,84,0.06)';
                (e.currentTarget as HTMLElement).style.transform = 'none';
            }}
        >
            <span style={{ fontSize: 24, flexShrink: 0 }}>{icon}</span>

            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="fw-semibold text-truncate" style={{ fontSize: 14 }}>
                    {attraction.name}
                </div>
                <div className="text-muted" style={{ fontSize: 11 }}>
                    {t("party.sessionActive", "Active session")}
                    {attraction.sessionId && <span className="ms-1">· #{attraction.sessionId}</span>}
                </div>
            </div>

            <span className="badge bg-success" style={{ fontSize: 10, padding: '3px 8px' }}>
                {t("party.attractionStatus.approved", "Session")}
            </span>

            <i className="fa fa-chevron-right text-muted" style={{ fontSize: 12 }} aria-hidden="true" />
        </div>
    );
};

// ── Rejected Row ──────────────────────────────────────────────────

interface RejectedRowProps {
    attraction: PartyAttraction;
    isOrganizer: boolean;
    onRestore: () => void;
    onDelete: () => void;
    t: TFunction;
}

const RejectedRow: React.FC<RejectedRowProps> = ({ attraction, isOrganizer, onRestore, onDelete, t }) => {
    const icon = TYPE_ICONS[attraction.type] ?? "📌";

    return (
        <div
            className="d-flex align-items-center gap-2"
            style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: 'rgba(220,53,69,0.04)',
                border: '1px solid rgba(220,53,69,0.1)',
                textDecoration: 'line-through',
            }}
        >
            <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>

            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                <div className="text-truncate" style={{ fontSize: 13 }}>{attraction.name}</div>
            </div>

            <span className="badge bg-danger" style={{ fontSize: 10, padding: '3px 8px' }}>
                {t("party.attractionStatus.rejected", "Rejected")}
            </span>

            {isOrganizer && (
                <button
                    className="btn btn-sm btn-outline-secondary"
                    style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6 }}
                    onClick={onRestore}
                    title={t("party.restore", "Restore")}
                >
                    <i className="fa fa-undo" aria-hidden="true" />
                </button>
            )}

            <button
                className="btn btn-sm"
                style={{ opacity: 0.4, padding: '4px 6px' }}
                onClick={onDelete}
                title={t("common.delete")}
            >
                <i className="fa fa-trash" style={{ fontSize: 12, color: '#dc3545' }} aria-hidden="true" />
            </button>
        </div>
    );
};

export default React.memo(AttractionVotingPanel);
