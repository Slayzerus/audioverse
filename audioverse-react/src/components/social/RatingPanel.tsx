// RatingPanel.tsx — Aggregated score + user rating form + reviews list
import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useUser } from "../../contexts/UserContext";
import {
    useRatingAggregateQuery,
    useRatingsQuery,
    useUpsertRatingMutation,
    useDeleteRatingMutation,
} from "../../scripts/api/apiSocial";
import type {
    EntityTypeString,
    UserRatingDto,
} from "../../models/modelsSocial";
import { ENTITY_CRITERIA } from "../../models/modelsSocial";
import PaginationControls from "../ui/PaginationControls";

// ── helpers ────────────────────────────────────────────────────────

const detectPlayerId = (user: unknown): number | undefined => {
    if (!user) return undefined;
    const u = user as Record<string, unknown>;
    const pid =
        (u.userProfileId as number) ??
        (u.profileId as number) ??
        ((u.userProfile as { id?: number })?.id) ??
        ((u.profile as { id?: number })?.id) ??
        (u.userId as number);
    return typeof pid === "number" ? pid : undefined;
};

const star = (filled: boolean) => (filled ? "★" : "☆");

// ── StarInput ──────────────────────────────────────────────────────

const StarInput: React.FC<{
    value: number;
    max?: number;
    onChange: (v: number) => void;
    label?: string;
    size?: string;
}> = ({ value, max = 10, onChange, label, size = "1.3rem" }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="d-flex align-items-center gap-1">
            {label && <span className="small text-muted me-1">{label}</span>}
            {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
                <span
                    key={n}
                    role="button"
                    style={{ fontSize: size, cursor: "pointer", color: "var(--accent-primary, #ffc107)" }}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(n)}
                >
                    {star(n <= (hover || value))}
                </span>
            ))}
            <span className="ms-1 small fw-bold">{value || "–"}/10</span>
        </div>
    );
};

// ── StarDisplay ────────────────────────────────────────────────────

const StarDisplay: React.FC<{ value: number; max?: number }> = ({ value, max = 10 }) => (
    <span style={{ color: "var(--accent-primary, #ffc107)", letterSpacing: 1 }}>
        {Array.from({ length: max }, (_, i) => star(i < Math.round(value))).join("")}
        <span className="ms-1 small fw-bold">{value.toFixed(1)}</span>
    </span>
);

// ── Single Review ──────────────────────────────────────────────────

const ReviewCard: React.FC<{
    r: UserRatingDto;
    playerId?: number;
    onDelete?: (id: number) => void;
}> = ({ r, playerId, onDelete }) => {
    const [spoilerOpen, setSpoilerOpen] = useState(false);
    const { t } = useTranslation();
    const isOwn = playerId != null && r.playerId === playerId;

    return (
        <div className="border rounded p-2 mb-2" style={{ background: "var(--bg-secondary, #1e1e1e)" }}>
            <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-semibold">{r.playerName ?? `Player ${r.playerId}`}</span>
                <StarDisplay value={r.overallScore} />
            </div>

            {/* Criteria */}
            {[
                { name: r.criterion1, score: r.criterion1Score },
                { name: r.criterion2, score: r.criterion2Score },
                { name: r.criterion3, score: r.criterion3Score },
            ]
                .filter((c) => c.name && c.score != null)
                .map((c) => (
                    <div key={c.name} className="small text-muted">
                        {c.name}: {c.score}/10
                    </div>
                ))}

            {/* Review text */}
            {r.reviewText && (
                <div className="mt-1">
                    {r.containsSpoilers && !spoilerOpen ? (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => setSpoilerOpen(true)}>
                            {t("social.showSpoiler", "Show spoiler")}
                        </button>
                    ) : (
                        <p className="mb-0 small" style={{ whiteSpace: "pre-wrap" }}>
                            {r.reviewText}
                        </p>
                    )}
                </div>
            )}

            {/* Meta */}
            <div className="d-flex justify-content-between mt-1">
                <span className="small text-muted">
                    {new Date(r.createdAtUtc).toLocaleDateString()}
                </span>
                {isOwn && onDelete && (
                    <button className="btn btn-sm btn-outline-danger py-0 px-1" onClick={() => onDelete(r.id)}>
                        {t("common.delete", "Delete")}
                    </button>
                )}
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════
//  RATING PANEL (main)
// ══════════════════════════════════════════════════════════════════

export interface RatingPanelProps {
    entityType: EntityTypeString;
    entityId: number;
}

const RatingPanel: React.FC<RatingPanelProps> = ({ entityType, entityId }) => {
    const { t } = useTranslation();
    const { currentUser, isAuthenticated } = useUser();
    const playerId = detectPlayerId(currentUser);

    // Queries
    const aggQ = useRatingAggregateQuery(entityType, entityId);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const ratingsQ = useRatingsQuery(entityType, entityId, page, pageSize);

    // Mutations
    const upsert = useUpsertRatingMutation(entityType, entityId);
    const del = useDeleteRatingMutation(entityType, entityId);

    // Form state
    const criteria = ENTITY_CRITERIA[entityType];
    const [overall, setOverall] = useState(0);
    const [c1, setC1] = useState(0);
    const [c2, setC2] = useState(0);
    const [c3, setC3] = useState(0);
    const [review, setReview] = useState("");
    const [spoiler, setSpoiler] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Auto-fill if user already rated
    const existingRating = useMemo(
        () => ratingsQ.data?.items.find((r) => playerId && r.playerId === playerId),
        [ratingsQ.data, playerId],
    );

    React.useEffect(() => {
        if (existingRating) {
            setOverall(existingRating.overallScore);
            setC1(existingRating.criterion1Score ?? 0);
            setC2(existingRating.criterion2Score ?? 0);
            setC3(existingRating.criterion3Score ?? 0);
            setReview(existingRating.reviewText ?? "");
            setSpoiler(existingRating.containsSpoilers);
        }
    }, [existingRating]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerId || overall < 1) return;
        upsert.mutate(
            {
                entityType,
                entityId,
                playerId,
                overallScore: overall,
                ...(criteria
                    ? {
                          criterion1: criteria[0],
                          criterion1Score: c1 || undefined,
                          criterion2: criteria[1],
                          criterion2Score: c2 || undefined,
                          criterion3: criteria[2],
                          criterion3Score: c3 || undefined,
                      }
                    : {}),
                reviewText: review || undefined,
                containsSpoilers: spoiler,
            },
            { onSuccess: () => setShowForm(false) },
        );
    };

    const handleDelete = (id: number) => {
        if (!playerId) return;
        del.mutate({ id, playerId });
    };

    // ── Render ──────────────────────────────────────────────────────

    return (
        <div className="mb-3">
            <h6 className="fw-bold">{t("social.ratings", "Ratings")}</h6>

            {/* Aggregate */}
            {aggQ.data && aggQ.data.ratingCount > 0 && (
                <div className="d-flex align-items-center gap-3 mb-2">
                    <StarDisplay value={aggQ.data.averageOverall} />
                    <span className="small text-muted">
                        ({aggQ.data.ratingCount} {t("social.votes", "votes")})
                    </span>
                </div>
            )}

            {/* Rate button / Form */}
            {isAuthenticated && playerId && (
                <>
                    {!showForm ? (
                        <button className="btn btn-sm btn-primary mb-2" onClick={() => setShowForm(true)}>
                            {existingRating
                                ? t("social.editRating", "Edit your rating")
                                : t("social.addRating", "Rate")}
                        </button>
                    ) : (
                        <form onSubmit={handleSubmit} className="border rounded p-3 mb-3" style={{ background: "var(--bg-secondary, #1e1e1e)" }}>
                            <StarInput value={overall} onChange={setOverall} label={t("social.overall", "Overall")} />

                            {criteria && (
                                <div className="mt-2">
                                    <StarInput value={c1} onChange={setC1} label={criteria[0]} size="1rem" />
                                    <StarInput value={c2} onChange={setC2} label={criteria[1]} size="1rem" />
                                    <StarInput value={c3} onChange={setC3} label={criteria[2]} size="1rem" />
                                </div>
                            )}

                            <textarea
                                className="form-control form-control-sm mt-2"
                                rows={3}
                                placeholder={t("social.reviewPlaceholder", "Write a review (optional)…")}
                                value={review}
                                onChange={(e) => setReview(e.target.value)}
                            />

                            <div className="form-check mt-1">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="spoiler-check"
                                    checked={spoiler}
                                    onChange={(e) => setSpoiler(e.target.checked)}
                                />
                                <label className="form-check-label small" htmlFor="spoiler-check">
                                    {t("social.containsSpoilers", "Contains spoilers")}
                                </label>
                            </div>

                            <div className="d-flex gap-2 mt-2">
                                <button type="submit" className="btn btn-sm btn-success" disabled={overall < 1 || upsert.isPending}>
                                    {t("common.save", "Save")}
                                </button>
                                <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowForm(false)}>
                                    {t("common.cancel", "Cancel")}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Ratings list */}
            {ratingsQ.data && ratingsQ.data.items.length > 0 && (
                <>
                    {ratingsQ.data.items.map((r) => (
                        <ReviewCard key={r.id} r={r} playerId={playerId} onDelete={handleDelete} />
                    ))}

                    <PaginationControls
                        page={page}
                        pageSize={pageSize}
                        total={ratingsQ.data.totalCount}
                        onPageChange={setPage}
                        onPageSizeChange={(s) => {
                            setPageSize(s);
                            setPage(1);
                        }}
                    />
                </>
            )}

            {ratingsQ.isLoading && <div className="text-muted small">{t("common.loading", "Loading…")}</div>}
        </div>
    );
};

export default RatingPanel;
