// AttractionDetailModal.tsx — Proposal detail OR session management form
import React, { useState, useMemo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useNavigate } from "react-router-dom";
import type { PartyAttraction, KaraokeRoundPlayer } from "../../models/modelsKaraoke";
import { KaraokeSessionMode } from "../../models/modelsKaraoke";
import {
    usePartyAttractionsQuery,
    useVoteAttractionMutation,
    useDeleteAttractionMutation,
    useUpdateAttractionStatusMutation,
} from "../../scripts/api/apiPartyAttractions";
import { useAddSessionMutation } from "../../scripts/api/apiKaraoke";
import { useSessionRoundsQuery, useReorderSessionRoundsMutation, useRoundPlayersQuery } from "../../scripts/api/karaoke/apiKaraokeRounds";
import type { SessionRoundDto } from "../../scripts/api/karaoke/apiKaraokeRounds";
import { useEventScheduleQuery } from "../../scripts/api/apiEvents";
import { JoinSessionButton, isUserJoined } from "../controls/party/JoinRoundPanel";
import JoinRoundPopup from "../controls/party/JoinRoundPopup";
import { useUser } from "../../contexts/UserContext";

const TYPE_ICONS: Record<string, string> = {
    karaoke: "🎤", videoGame: "🎮", boardGame: "🎲",
    photoBooth: "📷", danceFloor: "🕺", djSet: "🎧", custom: "⭐",
};

interface Props {
    partyId: number;
    attractionId: string;
    isOrganizer?: boolean;
    onClose: () => void;
    onAddRound?: (sessionId?: number | null) => void;
}

const AttractionDetailModal: React.FC<Props> = ({ partyId, attractionId, isOrganizer, onClose, onAddRound }) => {
    const { t } = useTranslation();
    const { data: attractions = [] } = usePartyAttractionsQuery(partyId);
    const voteMutation = useVoteAttractionMutation(partyId);
    const deleteMutation = useDeleteAttractionMutation(partyId);
    const statusMutation = useUpdateAttractionStatusMutation(partyId);
    const addSessionMut = useAddSessionMutation();

    const attraction = attractions.find(a => a.id === attractionId);

    const [editDesc, setEditDesc] = useState(false);
    const [descDraft, setDescDraft] = useState("");
    const [sessionNameDraft, setSessionNameDraft] = useState("");

    if (!attraction) {
        return (
            <ModalShell onClose={onClose}>
                <div className="card-body text-center py-5">
                    <p className="text-muted">{t("party.attractionNotFound", "Attraction not found.")}</p>
                </div>
            </ModalShell>
        );
    }

    const icon = TYPE_ICONS[attraction.type] ?? "📌";
    const isSession = attraction.status === "approved" || attraction.status === "played";
    const isRejected = attraction.status === "rejected";
    const isProposal = attraction.status === "suggested";

    // ── Handlers ──

    const handleApprove = async () => {
        try {
            const result = await addSessionMut.mutateAsync({
                partyId,
                name: attraction.name,
                eventId: partyId,
            });
            statusMutation.mutate({
                attractionId: attraction.id,
                status: "approved",
                sessionId: result.sessionId,
            });
        } catch {
            statusMutation.mutate({ attractionId: attraction.id, status: "approved" });
        }
    };

    const handleReject = () => {
        statusMutation.mutate({ attractionId: attraction.id, status: "rejected" });
    };

    const handleRestore = () => {
        statusMutation.mutate({ attractionId: attraction.id, status: "suggested" });
    };

    const handleDelete = () => {
        if (confirm(t("common.deleteConfirm", "Are you sure you want to delete?"))) {
            deleteMutation.mutate(attraction.id);
            onClose();
        }
    };

    return (
        <ModalShell onClose={onClose}>
            {/* ═══ Header ═══ */}
            <div className="card-header d-flex align-items-center gap-3" style={{ border: 'none' }}>
                <span style={{ fontSize: 28 }}>{icon}</span>
                <div className="flex-grow-1">
                    <h5 className="mb-0 fw-bold">
                        {isSession
                            ? `${t("party.sessionDetail", "Session")} ${attraction.name}`
                            : isRejected
                                ? t("party.rejectedProposal", "Rejected proposal")
                                : t("party.proposalDetail", "Attraction proposal")}
                    </h5>
                </div>
                <button
                    className="btn-close"
                    onClick={onClose}
                    aria-label={t("common.close")}
                    style={{ filter: 'invert(1) grayscale(100%) brightness(200%)' }}
                />
            </div>

            {/* ═══ Body ═══ */}
            <div className="card-body">
                {/* ─── PROPOSAL VIEW ─── */}
                {isProposal && (
                    <ProposalForm
                        attraction={attraction}
                        isOrganizer={!!isOrganizer}
                        editDesc={editDesc}
                        setEditDesc={setEditDesc}
                        descDraft={descDraft}
                        setDescDraft={setDescDraft}
                        onVote={() => voteMutation.mutate({ attractionId: attraction.id, vote: 1 })}
                        votePending={voteMutation.isPending}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        onDelete={handleDelete}
                        t={t}
                    />
                )}

                {/* ─── SESSION VIEW ─── */}
                {isSession && (
                    <SessionForm
                        attraction={attraction}
                        partyId={partyId}
                        isOrganizer={!!isOrganizer}
                        sessionNameDraft={sessionNameDraft}
                        setSessionNameDraft={setSessionNameDraft}
                        onAddRound={onAddRound}
                        onDelete={handleDelete}
                        onSave={onClose}
                        t={t}
                    />
                )}

                {/* ─── REJECTED VIEW ─── */}
                {isRejected && (
                    <RejectedView
                        attraction={attraction}
                        isOrganizer={!!isOrganizer}
                        onRestore={handleRestore}
                        onDelete={handleDelete}
                        t={t}
                    />
                )}
            </div>
        </ModalShell>
    );
};

// ═══════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════

// ── Proposal Form ─────────────────────────────────────────────────

interface ProposalFormProps {
    attraction: PartyAttraction;
    isOrganizer: boolean;
    editDesc: boolean;
    setEditDesc: (v: boolean) => void;
    descDraft: string;
    setDescDraft: (v: string) => void;
    onVote: () => void;
    votePending: boolean;
    onApprove: () => void;
    onReject: () => void;
    onDelete: () => void;
    t: TFunction;
}

const ProposalForm: React.FC<ProposalFormProps> = ({
    attraction, isOrganizer, editDesc, setEditDesc, descDraft, setDescDraft,
    onVote, votePending, onApprove, onReject, onDelete, t,
}) => (
    <>
        {/* Info chips */}
        <div className="d-flex gap-2 mb-3 flex-wrap">
            <InfoChip icon="fa-arrow-up" color="rgba(13,110,253,0.08)" borderColor="rgba(13,110,253,0.15)">
                <span className="fw-bold">{attraction.votes}</span>
                <span className="text-muted small">{t("party.votes", "votes")}</span>
                <button
                    className="btn btn-sm btn-outline-primary ms-1"
                    style={{ padding: '2px 10px', fontSize: 12, borderRadius: 6 }}
                    onClick={onVote}
                    disabled={votePending}
                >+1</button>
            </InfoChip>
            {attraction.createdAt && (
                <InfoChip icon="fa-clock">
                    <span className="small">{new Date(attraction.createdAt).toLocaleDateString()}</span>
                </InfoChip>
            )}
            {attraction.suggesterName && (
                <InfoChip icon="fa-user">
                    <span className="small">{attraction.suggesterName}</span>
                </InfoChip>
            )}
        </div>

        {/* Description */}
        <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label mb-0 fw-semibold small text-uppercase text-muted">
                    {t("party.attractionDescription", "Description")}
                </label>
                <button className="btn btn-sm btn-link text-muted p-0" onClick={() => { setEditDesc(!editDesc); setDescDraft(attraction.description ?? ""); }}>
                    <i className={`fa fa-${editDesc ? 'times' : 'pencil'}`} aria-hidden="true" />
                </button>
            </div>
            {editDesc ? (
                <div>
                    <textarea className="form-control form-control-sm mb-2" rows={3} value={descDraft} onChange={e => setDescDraft(e.target.value)}
                        placeholder={t("party.descriptionPlaceholder", "Add attraction description...")} />
                    <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-primary" onClick={() => setEditDesc(false)}>{t("common.save", "Save")}</button>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setEditDesc(false)}>{t("common.cancel", "Cancel")}</button>
                    </div>
                </div>
            ) : (
                <p className={`mb-0 ${attraction.description ? '' : 'text-muted fst-italic'}`} style={{ fontSize: 14 }}>
                    {attraction.description || t("party.noDescription", "No description")}
                </p>
            )}
        </div>

        {/* ── Organizer action bar ── */}
        <div className="d-flex justify-content-between gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
                <i className="fa fa-trash me-1" aria-hidden="true" />
                {t("common.delete", "Delete")}
            </button>
            {isOrganizer && (
                <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-danger" onClick={onReject}>
                        <i className="fa fa-times me-1" aria-hidden="true" />
                        {t("party.reject", "Reject")}
                    </button>
                    <button className="btn btn-sm btn-success" onClick={onApprove}>
                        <i className="fa fa-check me-1" aria-hidden="true" />
                        {t("party.approve", "Approve")}
                    </button>
                </div>
            )}
        </div>
    </>
);

// ── Session Form (approved attraction) ────────────────────────────

interface SessionFormProps {
    attraction: PartyAttraction;
    partyId: number;
    isOrganizer: boolean;
    sessionNameDraft: string;
    setSessionNameDraft: (v: string) => void;
    onAddRound?: (sessionId?: number | null) => void;
    onDelete: () => void;
    onSave: () => void;
    t: TFunction;
}

/** Format a Date to "HH:mm" local string */
const toHHmm = (d: Date): string => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
};

/** Parse "HH:mm" to minutes-since-midnight */
const hhmmToMins = (s: string): number => {
    const [h, m] = s.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
};

/** Minutes-since-midnight to "HH:mm" */
const minsToHHmm = (mins: number): string => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const MODE_OPTIONS: { value: KaraokeSessionMode; labelKey: string; fallback: string; descKey: string; descFallback: string }[] = [
    { value: KaraokeSessionMode.Classic,    labelKey: "party.sessionModeClassic",    fallback: "Classic",  descKey: "party.sessionModeClassicDesc",    descFallback: "Queue in order, everyone sings" },
    { value: KaraokeSessionMode.Tournament, labelKey: "party.sessionModeTournament", fallback: "Tournament",    descKey: "party.sessionModeTournamentDesc", descFallback: "Elimination rounds, compete" },
    { value: KaraokeSessionMode.Knockout,   labelKey: "party.sessionModeKnockout",   fallback: "Knockout",     descKey: "party.sessionModeKnockoutDesc",   descFallback: "Lose and you're out" },
    { value: KaraokeSessionMode.Casual,     labelKey: "party.sessionModeCasual",     fallback: "Casual",      descKey: "party.sessionModeCasualDesc",     descFallback: "No scores, just fun" },
];

const SessionForm: React.FC<SessionFormProps> = ({
    attraction, partyId, isOrganizer, sessionNameDraft, setSessionNameDraft,
    onAddRound, onDelete, onSave, t,
}) => {
    // ── Join status ──
    // The backend POST /api/karaoke/events/{id}/join is an access-check only;
    // GET /api/karaoke/get-event/{id} returns KaraokeEventDto with no participants.
    // Join state is persisted via localStorage (see JoinRoundPanel.tsx).
    const { userId } = useUser();

    const alreadyJoined = useMemo(() => {
        return isUserJoined(partyId, userId);
    }, [partyId, userId]);

    // ── Schedule data for time suggestion ──
    const { data: schedule = [] } = useEventScheduleQuery(partyId);

    // ── Session time state ──
    const suggestedStart = useMemo(() => {
        if (schedule.length === 0) return null;
        // Sort schedule items by endTime, find latest endTime = first free slot
        const endTimes = schedule
            .filter(s => s.endTime)
            .map(s => new Date(s.endTime!).getTime())
            .sort((a, b) => a - b);
        if (endTimes.length === 0) {
            // No items with endTime — suggest party start or next full hour
            const starts = schedule.map(s => new Date(s.startTime).getTime()).sort((a, b) => a - b);
            if (starts.length > 0) return toHHmm(new Date(starts[0]));
            return null;
        }
        return toHHmm(new Date(endTimes[endTimes.length - 1]));
    }, [schedule]);

    const defaultStart = useMemo(() => {
        if (attraction.createdAt) {
            // If session has startedAt, use it
        }
        return suggestedStart ?? toHHmm(new Date());
    }, [suggestedStart, attraction.createdAt]);

    const [startTime, setStartTime] = useState(defaultStart);
    const [durationMin, setDurationMin] = useState(60);
    const [endTime, setEndTime] = useState(() => minsToHHmm(hhmmToMins(defaultStart) + 60));

    // ── Session mode & flags ──
    const [mode, setMode] = useState<KaraokeSessionMode>(KaraokeSessionMode.Classic);
    const [teamMode, setTeamMode] = useState(false);
    const [limitToPlaylist, setLimitToPlaylist] = useState(false);

    // ── Teams ──
    const [teams, setTeams] = useState<{ name: string; color: string }[]>([]);
    const [newTeamName, setNewTeamName] = useState("");

    const TEAM_COLORS = ['#dc3545', '#0d6efd', '#198754', '#ffc107', '#6f42c1', '#fd7e14'];

    // ── Sync start ↔ duration ↔ end ──
    const handleStartChange = useCallback((val: string) => {
        setStartTime(val);
        setEndTime(minsToHHmm(hhmmToMins(val) + durationMin));
    }, [durationMin]);

    const handleDurationChange = useCallback((val: number) => {
        const clamped = Math.max(5, Math.min(val, 720));
        setDurationMin(clamped);
        setEndTime(minsToHHmm(hhmmToMins(startTime) + clamped));
    }, [startTime]);

    const handleEndChange = useCallback((val: string) => {
        setEndTime(val);
        const diff = hhmmToMins(val) - hhmmToMins(startTime);
        setDurationMin(diff > 0 ? diff : diff + 1440);
    }, [startTime]);

    const addTeam = () => {
        const name = newTeamName.trim();
        if (!name) return;
        const color = TEAM_COLORS[teams.length % TEAM_COLORS.length];
        setTeams(prev => [...prev, { name, color }]);
        setNewTeamName("");
    };

    const removeTeam = (idx: number) => {
        setTeams(prev => prev.filter((_, i) => i !== idx));
    };

    return (
        <>
            {/* Session name — inline */}
            <div className="mb-3 d-flex align-items-center gap-2">
                <label className="form-label fw-semibold small text-uppercase text-muted mb-0" style={{ whiteSpace: 'nowrap' }}>
                    {t("party.sessionName", "Session name")}
                </label>
                <input
                    type="text"
                    className="form-control form-control-sm"
                    value={sessionNameDraft || attraction.name}
                    onChange={e => setSessionNameDraft(e.target.value)}
                    placeholder={t("party.sessionNamePlaceholder", "E.g. Karaoke - Round 1")}
                />
            </div>

            {/* ═══ Settings Panel (time + mode + flags) ═══ */}
            <div className="mb-3 p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                {suggestedStart && (
                    <div className="mb-2">
                        <small className="text-info">
                            <i className="fa fa-info-circle me-1" aria-hidden="true" />
                            {t("party.suggestedTime", `Hint: first available from ${suggestedStart}`).replace("{{time}}", suggestedStart)}
                        </small>
                    </div>
                )}

                {/* Time row + toggles */}
                <div className="row g-2 mb-3">
                    <div className="col-3">
                        <label className="form-label fw-semibold small text-uppercase text-muted mb-1">
                            {t("party.sessionStartTime", "Start time")}
                        </label>
                        <input
                            type="time"
                            className="form-control form-control-sm"
                            value={startTime}
                            onChange={e => handleStartChange(e.target.value)}
                        />
                    </div>
                    <div className="col-3">
                        <label className="form-label fw-semibold small text-uppercase text-muted mb-1">
                            {t("party.sessionDuration", "Duration (min)")}
                        </label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            value={durationMin}
                            min={5}
                            max={720}
                            step={5}
                            onChange={e => handleDurationChange(Number(e.target.value))}
                        />
                    </div>
                    <div className="col-3">
                        <label className="form-label fw-semibold small text-uppercase text-muted mb-1">
                            {t("party.sessionEndTime", "End time")}
                        </label>
                        <input
                            type="time"
                            className="form-control form-control-sm"
                            value={endTime}
                            onChange={e => handleEndChange(e.target.value)}
                        />
                    </div>
                    <div className="col-3 d-flex flex-column justify-content-end gap-2">
                        <div className="form-check form-switch mb-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="teamModeToggle"
                                checked={teamMode}
                                onChange={e => setTeamMode(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="teamModeToggle">
                                {t("party.teamMode", "Team mode")}
                            </label>
                        </div>
                        <div className="form-check form-switch mb-0">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                id="limitToPlaylistToggle"
                                checked={limitToPlaylist}
                                onChange={e => setLimitToPlaylist(e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor="limitToPlaylistToggle">
                                {t("party.limitToPlaylist", "Limit to event playlist")}
                            </label>
                        </div>
                    </div>
                </div>

                {/* Mode — inline buttons with descriptions */}
                <div className="mb-3">
                    <label className="form-label fw-semibold small text-uppercase text-muted mb-1">
                        {t("party.sessionMode", "Session mode")}
                    </label>
                    <div className="d-flex flex-wrap" style={{ justifyContent: 'space-around', gap: 8 }}>
                        {MODE_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                className={`btn btn-sm ${mode === opt.value ? 'btn-primary' : 'btn-outline-secondary'}`}
                                style={{ borderRadius: 8, fontSize: 13, textAlign: 'left', lineHeight: 1.3, flex: '1 1 0' }}
                                onClick={() => setMode(opt.value)}
                            >
                                <div className="fw-semibold">{t(opt.labelKey, opt.fallback)}</div>
                                <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>{t(opt.descKey, opt.descFallback)}</div>
                            </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* ═══ Teams Section (visible when team mode on) ═══ */}
            {teamMode && (
                <div className="mb-3 p-3 rounded-3" style={{ background: 'rgba(13,110,253,0.04)', border: '1px solid rgba(13,110,253,0.12)' }}>
                    <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2">
                        <i className="fa fa-users" aria-hidden="true" />
                        {t("party.teams", "Teams")}
                        <span className="badge bg-primary rounded-pill" style={{ fontSize: 10 }}>{teams.length}</span>
                    </h6>

                    {teams.length === 0 ? (
                        <p className="text-muted small mb-2 fst-italic">{t("party.noTeamsYet", "No teams yet. Add the first one.")}</p>
                    ) : (
                        <div className="d-flex flex-column gap-1 mb-2">
                            {teams.map((team, idx) => (
                                <div key={idx} className="d-flex align-items-center gap-2 px-2 py-1 rounded" style={{ background: 'rgba(255,255,255,0.04)' }}>
                                    <span
                                        className="rounded-circle d-inline-block"
                                        style={{ width: 14, height: 14, background: team.color, flexShrink: 0 }}
                                    />
                                    <span className="flex-grow-1 small fw-semibold">{team.name}</span>
                                    <button
                                        className="btn btn-sm p-0"
                                        style={{ fontSize: 12, opacity: 0.5, lineHeight: 1 }}
                                        onClick={() => removeTeam(idx)}
                                        title={t("party.removeTeam", "Remove team")}
                                    >
                                        <i className="fa fa-times text-danger" aria-hidden="true" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            value={newTeamName}
                            onChange={e => setNewTeamName(e.target.value)}
                            placeholder={t("party.teamNamePlaceholder", "E.g. Team A")}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTeam(); } }}
                        />
                        <button
                            className="btn btn-sm btn-outline-primary"
                            style={{ whiteSpace: 'nowrap' }}
                            onClick={addTeam}
                            disabled={!newTeamName.trim()}
                        >
                            <i className="fa fa-plus me-1" aria-hidden="true" />
                            {t("party.addTeam", "Add team")}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ Join / Sign Up button — full width ═══ */}
            <div className="mb-3">
                <JoinSessionButton partyId={partyId} sessionId={attraction.sessionId} alreadyJoined={alreadyJoined} />
            </div>

            {/* ═══ Rounds section ═══ */}
            <RoundsSection
                partyId={partyId}
                sessionId={attraction.sessionId}
                isOrganizer={isOrganizer}
                alreadyJoined={alreadyJoined}
                onAddRound={onAddRound}
                t={t}
            />

            {/* Action bar */}
            <div className="d-flex justify-content-between align-items-center pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
                    <i className="fa fa-trash me-1" aria-hidden="true" />
                    {t("party.deleteSession", "Delete session")}
                </button>
                <button className="btn btn-sm btn-success" onClick={onSave}>
                    <i className="fa fa-check me-1" aria-hidden="true" />
                    {t("party.sessionSave", "Save session")}
                </button>
            </div>
        </>
    );
};

// ── Rounds Section (fetches and displays rounds for a session) ────

interface RoundsSectionProps {
    partyId: number;
    sessionId?: number | null;
    isOrganizer?: boolean;
    alreadyJoined?: boolean;
    onAddRound?: (sessionId?: number | null) => void;
    t: TFunction;
}

const RoundsSection: React.FC<RoundsSectionProps> = ({ partyId, sessionId, isOrganizer: _isOrganizer, alreadyJoined: _alreadyJoined, onAddRound, t }) => {
    const navigate = useNavigate();
    const { data: sessionRounds } = useSessionRoundsQuery(sessionId);
    const reorderMutation = useReorderSessionRoundsMutation();
    const [joinRoundId, setJoinRoundId] = useState<number | null>(null);

    /** Build a minimal song object from the round DTO and navigate to karaoke */
    const navigateToRound = useCallback((r: SessionRoundDto) => {
        const song = r.songId ? { id: r.songId, title: r.songTitle ?? '', artist: r.songArtist ?? '' } : undefined;
        navigate('/rounds', {
            state: {
                song,
                gameMode: r.mode?.toLowerCase() || 'normal',
                roundId: r.id,
                partyId,
            },
        });
    }, [navigate, partyId]);

    const rounds: SessionRoundDto[] = useMemo(() => {
        if (!sessionRounds || !Array.isArray(sessionRounds)) return [];
        return sessionRounds;
    }, [sessionRounds]);

    // ── drag-and-drop state ──
    const [localOrder, setLocalOrder] = useState<SessionRoundDto[] | null>(null);
    const dragIdx = useRef<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    const displayRounds = localOrder ?? rounds;

    const handleDragStart = useCallback((idx: number) => {
        dragIdx.current = idx;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setOverIdx(idx);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
        e.preventDefault();
        const from = dragIdx.current;
        if (from == null || from === dropIdx) { setOverIdx(null); return; }
        const list = [...(localOrder ?? rounds)];
        const [moved] = list.splice(from, 1);
        list.splice(dropIdx, 0, moved);
        setLocalOrder(list);
        setOverIdx(null);
        dragIdx.current = null;
        // persist to backend
        if (sessionId) {
            reorderMutation.mutate({ sessionId, roundIds: list.map(r => r.id) });
        }
    }, [localOrder, rounds, sessionId, reorderMutation]);

    const handleDragEnd = useCallback(() => {
        dragIdx.current = null;
        setOverIdx(null);
    }, []);

    // sync local order when server data changes
    const prevRoundsRef = useRef(rounds);
    if (rounds !== prevRoundsRef.current) {
        prevRoundsRef.current = rounds;
        setLocalOrder(null);
    }

    return (
        <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 fw-semibold">
                    <i className="fa fa-list me-2" aria-hidden="true" />
                    {t("party.rounds", "Rounds")}
                    {displayRounds.length > 0 && (
                        <span className="badge bg-secondary ms-2" style={{ fontSize: 10 }}>{displayRounds.length}</span>
                    )}
                </h6>
                {onAddRound && (
                    <button className="btn btn-sm btn-primary" onClick={() => onAddRound(sessionId)}>
                        <i className="fa fa-plus me-1" aria-hidden="true" />
                        {t("party.addRound", "Add round")}
                    </button>
                )}
            </div>
            {displayRounds.length === 0 ? (
                <div className="text-center py-4" style={{ borderRadius: 8, border: '1px dashed rgba(255,255,255,0.2)' }}>
                    <i className="fa fa-inbox mb-2" style={{ fontSize: 24, opacity: 0.3 }} aria-hidden="true" />
                    <p className="text-muted mb-0 small">
                        {t("party.noRoundsYet", "No rounds yet. Add the first one using the button above.")}
                    </p>
                </div>
            ) : (
                <div className="d-flex flex-column gap-2">
                    {displayRounds.map((r, idx) => (
                        <div
                            key={r.id}
                            draggable
                            onDragStart={() => handleDragStart(idx)}
                            onDragOver={(e) => handleDragOver(e, idx)}
                            onDrop={(e) => handleDrop(e, idx)}
                            onDragEnd={handleDragEnd}
                            className="d-flex align-items-center gap-2 p-2 rounded-3"
                            style={{
                                background: overIdx === idx ? 'rgba(99,149,255,0.15)' : 'rgba(255,255,255,0.04)',
                                border: overIdx === idx ? '1px dashed rgba(99,149,255,0.6)' : '1px solid rgba(255,255,255,0.08)',
                                opacity: dragIdx.current === idx ? 0.5 : 1,
                                cursor: 'grab',
                                transition: 'background 0.2s, border 0.2s, transform 0.2s, opacity 0.15s',
                                transform: overIdx === idx ? 'scale(1.02)' : 'scale(1)',
                            }}
                        >
                            <i className="fa fa-grip-vertical" style={{ opacity: 0.3, fontSize: 12, flexShrink: 0, cursor: 'grab' }} aria-hidden="true" />
                            <span className="badge bg-secondary" style={{ width: 28, textAlign: 'center', flexShrink: 0 }}>{idx + 1}</span>
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <div className="fw-semibold text-truncate" style={{ fontSize: 13 }}>
                                    {r.songTitle ?? `${t("party.round", "Round")} ${r.number}`}
                                </div>
                                {r.songArtist && (
                                    <div className="text-muted text-truncate" style={{ fontSize: 11 }}>{r.songArtist}</div>
                                )}
                            </div>
                            {r.mode && r.mode !== 'Normal' && (
                                <span className="badge" style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(224,64,251,0.12)', color: '#e040fb', borderRadius: 4 }}>
                                    {r.mode}
                                </span>
                            )}
                            <RoundPlayersBadge roundId={r.id} playerCount={r.playerCount ?? 0} t={t} />
                            <button
                                className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}
                                onClick={(e) => { e.stopPropagation(); setJoinRoundId(r.id); }}
                                title={t('party.playRound', 'Play')}
                            >
                                <i className="fa fa-play" aria-hidden="true" style={{ fontSize: 9 }} />
                                {t('party.play', 'Play')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Join Round Popup */}
            {joinRoundId != null && (
                <JoinRoundPopup
                    show
                    onHide={() => setJoinRoundId(null)}
                    roundId={joinRoundId}
                    sessionId={sessionId}
                    partyId={partyId}
                    onPlay={(rId) => {
                        const r = rounds.find(rd => rd.id === rId);
                        if (r) navigateToRound(r);
                    }}
                />
            )}
        </div>
    );
};

// ── Round Players Badge (with tooltip showing player names) ───────

const RoundPlayersBadge: React.FC<{
    roundId: number;
    playerCount: number;
    t: TFunction;
}> = ({ roundId, playerCount, t }) => {
    const { data: players = [] } = useRoundPlayersQuery(roundId);

    if (playerCount === 0 && players.length === 0) return null;

    const count = players.length || playerCount;
    const names = players
        .map((p: KaraokeRoundPlayer) => p.player?.name ?? `#${p.playerId}`)
        .join(', ');

    return (
        <span
            className="badge bg-secondary"
            style={{ fontSize: 9, padding: '2px 6px', cursor: 'default' }}
            title={names || `${count} ${t('party.players', 'players')}`}
        >
            <i className="fa fa-users me-1" aria-hidden="true" />{count}
        </span>
    );
};

// ── Rejected View ─────────────────────────────────────────────────

interface RejectedViewProps {
    attraction: PartyAttraction;
    isOrganizer: boolean;
    onRestore: () => void;
    onDelete: () => void;
    t: TFunction;
}

const RejectedView: React.FC<RejectedViewProps> = ({ attraction, isOrganizer, onRestore, onDelete, t }) => (
    <>
        <div className="text-center py-4" style={{ opacity: 0.6 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>🚫</div>
            <p className="text-muted mb-1">{t("party.proposalRejected", "This proposal has been rejected.")}</p>
            {attraction.suggesterName && (
                <p className="text-muted small mb-0">
                    {t("party.suggestedBy", "Suggested by")}: {attraction.suggesterName}
                </p>
            )}
        </div>
        <div className="d-flex justify-content-between gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="btn btn-sm btn-outline-danger" onClick={onDelete}>
                <i className="fa fa-trash me-1" aria-hidden="true" />
                {t("common.delete", "Delete")}
            </button>
            {isOrganizer && (
                <button className="btn btn-sm btn-outline-secondary" onClick={onRestore}>
                    <i className="fa fa-undo me-1" aria-hidden="true" />
                    {t("party.restore", "Restore as proposal")}
                </button>
            )}
        </div>
    </>
);

// ── Shared: InfoChip ──────────────────────────────────────────────

const InfoChip: React.FC<{
    icon: string;
    color?: string;
    borderColor?: string;
    children: React.ReactNode;
}> = ({ icon, color, borderColor, children }) => (
    <div
        className="d-flex align-items-center gap-2 px-3 py-2 rounded-3"
        style={{
            background: color ?? 'rgba(255,255,255,0.04)',
            border: `1px solid ${borderColor ?? 'rgba(255,255,255,0.08)'}`,
        }}
    >
        <i className={`fa ${icon}`} style={{ fontSize: 12 }} aria-hidden="true" />
        {children}
    </div>
);

// ── ModalShell ────────────────────────────────────────────────────

const ModalShell: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
    <div
        className="modal-backdrop"
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1070 }}
        onClick={onClose}
    >
        <div
            className="card shadow-lg"
            style={{ width: '92%', maxWidth: 640, maxHeight: '85vh', overflow: 'auto', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}
        >
            {children}
        </div>
    </div>
);

export default AttractionDetailModal;
