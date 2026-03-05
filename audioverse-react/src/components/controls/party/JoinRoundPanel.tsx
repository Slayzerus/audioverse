/**
 * JoinRoundPanel — Inline panel for joining a karaoke round.
 * Shows player selection, device (mic) picker, and a Join/Play button.
 * Reuses player data from GameContext and device data from UserContext.
 */
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useGameContext } from "../../../contexts/GameContext";
import { useAudioContext } from "../../../contexts/AudioContext";
import {
    useRoundPlayersQuery,
    useAddRoundPlayerMutation,
} from "../../../scripts/api/karaoke/apiKaraokeRounds";
import { useJoinPartyMutation } from "../../../scripts/api/karaoke/apiKaraokeSessions";
import { useUser } from "../../../contexts/UserContext";
import { logger } from "../../../utils/logger";
const log = logger.scoped('JoinRoundPanel');

// ── Types ──

interface JoinRoundPanelProps {
    /** Round ID to join */
    roundId: number;
    /** Session ID the round belongs to */
    sessionId?: number | null;
    /** Party (event) ID — for event-level join */
    partyId: number;
    /** Compact mode — just a button, expand on click */
    compact?: boolean;
    /** Called after successful join to navigate to game */
    onPlay?: (roundId: number) => void;
}

const JoinRoundPanel: React.FC<JoinRoundPanelProps> = ({
    roundId,
    sessionId,
    partyId,
    compact = true,
    onPlay,
}) => {
    const { t } = useTranslation();
    const { state } = useGameContext();
    const { audioInputs } = useAudioContext();
    const { data: roundPlayers = [] } = useRoundPlayersQuery(roundId);
    const addPlayerMutation = useAddRoundPlayerMutation();
    const joinPartyMutation = useJoinPartyMutation();

    const [expanded, setExpanded] = useState(false);
    const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
    const [selectedMicId, setSelectedMicId] = useState<string | null>(null);

    // Current player from GameContext
    const currentPlayer = useMemo(() => {
        if (state.players.length === 0) return null;
        return state.players[0]; // primary player
    }, [state.players]);

    // Auto-select primary player
    useEffect(() => {
        if (currentPlayer?.id && !selectedPlayerId) {
            setSelectedPlayerId(currentPlayer.id);
        }
    }, [currentPlayer, selectedPlayerId]);

    // Auto-select mic if player has one assigned
    useEffect(() => {
        if (currentPlayer?.micId && !selectedMicId) {
            setSelectedMicId(currentPlayer.micId);
        }
    }, [currentPlayer, selectedMicId]);

    // Check if current player is already in the round
    const isJoined = useMemo(() => {
        if (!currentPlayer?.id) return false;
        return roundPlayers.some((rp) => rp.playerId === currentPlayer.id);
    }, [roundPlayers, currentPlayer]);

    const handleJoin = useCallback(async () => {
        if (!selectedPlayerId) return;
        try {
            // First, join the event (idempotent — returns true if already joined)
            await joinPartyMutation.mutateAsync({ partyId });
            // Then join the round
            await addPlayerMutation.mutateAsync({
                roundId,
                payload: { playerId: selectedPlayerId },
                sessionId: sessionId ?? undefined,
            });
            setExpanded(false);
        } catch (e) {
            log.error('Join failed:', e);
        }
    }, [selectedPlayerId, roundId, partyId, sessionId, addPlayerMutation, joinPartyMutation]);

    const handlePlay = useCallback(() => {
        onPlay?.(roundId);
    }, [onPlay, roundId]);

    const isLoading = addPlayerMutation.isPending || joinPartyMutation.isPending;

    // ── Compact mode: just a button ──
    if (compact && !expanded) {
        return isJoined ? (
            <button
                className="btn btn-sm btn-success d-flex align-items-center gap-1"
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}
                onClick={handlePlay}
                title={t("party.playRound", "Play")}
            >
                <i className="fa fa-play" aria-hidden="true" style={{ fontSize: 9 }} />
                {t("party.play", "Play")}
            </button>
        ) : (
            <button
                className="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, whiteSpace: 'nowrap' }}
                onClick={() => setExpanded(true)}
                title={t("party.joinRound", "Join round")}
            >
                <i className="fa fa-play" aria-hidden="true" style={{ fontSize: 9 }} />
                {t("party.join", "Join")}
            </button>
        );
    }

    // ── Expanded: player + mic selection + join button ──
    return (
        <div
            className="rounded-3 p-2 d-flex flex-column gap-2"
            style={{
                background: 'rgba(25,135,84,0.08)',
                border: '1px solid rgba(25,135,84,0.25)',
                minWidth: 200,
            }}
        >
            {/* Player select */}
            <div>
                <label className="form-label mb-1" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7 }}>
                    {t("party.selectPlayer", "Player")}
                </label>
                <select
                    className="form-select form-select-sm"
                    style={{ fontSize: 12 }}
                    value={selectedPlayerId ?? ''}
                    onChange={e => setSelectedPlayerId(Number(e.target.value) || null)}
                >
                    <option value="">{t("party.selectPlayerPlaceholder", "Choose player...")}</option>
                    {state.players.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.name || `Player ${p.id}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Microphone select */}
            <div>
                <label className="form-label mb-1" style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', opacity: 0.7 }}>
                    {t("party.selectMic", "Microphone")}
                </label>
                <select
                    className="form-select form-select-sm"
                    style={{ fontSize: 12 }}
                    value={selectedMicId ?? ''}
                    onChange={e => setSelectedMicId(e.target.value || null)}
                >
                    <option value="">{t("party.noMic", "No microphone")}</option>
                    {(audioInputs ?? []).map((d: MediaDeviceInfo) => (
                        <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                        </option>
                    ))}
                </select>
            </div>

            {/* Action buttons */}
            <div className="d-flex gap-2 justify-content-end">
                <button
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontSize: 11, padding: '3px 10px' }}
                    onClick={() => setExpanded(false)}
                >
                    {t("common.cancel", "Cancel")}
                </button>
                <button
                    className="btn btn-sm btn-success d-flex align-items-center gap-1"
                    style={{ fontSize: 11, padding: '3px 10px', fontWeight: 600 }}
                    onClick={handleJoin}
                    disabled={!selectedPlayerId || isLoading}
                >
                    {isLoading ? (
                        <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
                    ) : (
                        <i className="fa fa-play" aria-hidden="true" style={{ fontSize: 9 }} />
                    )}
                    {t("party.join", "Join")}
                </button>
            </div>
        </div>
    );
};

// ── localStorage helpers for session join persistence ──
// The backend POST /api/karaoke/events/{id}/join is an access-check only (code/link verification).
// It does NOT create a persistent participant record, and GET /api/karaoke/get-event/{id}
// returns KaraokeEventDto which has no players/participants data.
// We persist the join state client-side via localStorage.

const SESSION_JOIN_KEY = 'audioverse_session_joins';

interface SessionJoinRecord {
    partyId: number;
    userId: number;
    joinedAt: string; // ISO timestamp
}

/** Read all join records from localStorage */
const readJoinRecords = (): SessionJoinRecord[] => {
    try {
        const raw = localStorage.getItem(SESSION_JOIN_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

/** Check if a user has joined a party */
export const isUserJoined = (partyId: number, userId: number | null): boolean => {
    if (!userId) return false;
    return readJoinRecords().some(r => r.partyId === partyId && r.userId === userId);
};

/** Persist a join record */
const saveJoinRecord = (partyId: number, userId: number): void => {
    const records = readJoinRecords().filter(r => !(r.partyId === partyId && r.userId === userId));
    records.push({ partyId, userId, joinedAt: new Date().toISOString() });
    try { localStorage.setItem(SESSION_JOIN_KEY, JSON.stringify(records)); } catch { /* Expected: localStorage may be full or unavailable */ }
};

/** Remove a join record (for leave/unjoin) */
export const removeJoinRecord = (partyId: number, userId: number): void => {
    const records = readJoinRecords().filter(r => !(r.partyId === partyId && r.userId === userId));
    try { localStorage.setItem(SESSION_JOIN_KEY, JSON.stringify(records)); } catch { /* Expected: localStorage may be full or unavailable */ }
};

// ── Join Session Button ──

interface JoinSessionButtonProps {
    partyId: number;
    sessionId?: number | null;
    /** Whether the current user has already joined (from external source, e.g. API) */
    alreadyJoined?: boolean;
    /** Called after joining — navigate to session/game */
    onPlay?: () => void;
}

export const JoinSessionButton: React.FC<JoinSessionButtonProps> = ({ partyId, sessionId: _sessionId, alreadyJoined = false, onPlay }) => {
    const { t } = useTranslation();
    const { userId } = useUser();
    const joinPartyMutation = useJoinPartyMutation();

    // Check localStorage for persisted join state
    const persistedJoin = useMemo(() => isUserJoined(partyId, userId), [partyId, userId]);
    const [justJoined, setJustJoined] = useState(false);

    const joined = alreadyJoined || persistedJoin || justJoined;

    const handleJoin = useCallback(async () => {
        try {
            await joinPartyMutation.mutateAsync({ partyId });
            // Persist in localStorage so it survives page refresh
            if (userId) saveJoinRecord(partyId, userId);
            setJustJoined(true);
        } catch (e) {
            log.error('Join failed:', e);
        }
    }, [partyId, userId, joinPartyMutation]);

    const handlePlay = useCallback(() => {
        onPlay?.();
    }, [onPlay]);

    if (joined) {
        return (
            <button
                className="btn btn-success d-flex align-items-center justify-content-center gap-2 w-100"
                style={{ fontWeight: 700, fontSize: 15, borderRadius: 8, padding: '8px 20px' }}
                onClick={handlePlay}
            >
                <i className="fa fa-check" aria-hidden="true" />
                {t("party.alreadyJoined", "Joined ✓")}
            </button>
        );
    }

    return (
        <button
            className="btn btn-outline-success d-flex align-items-center justify-content-center gap-2 w-100"
            style={{ fontWeight: 700, fontSize: 15, borderRadius: 8, padding: '8px 20px' }}
            onClick={handleJoin}
            disabled={joinPartyMutation.isPending}
        >
            {joinPartyMutation.isPending ? (
                <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
            ) : (
                <i className="fa fa-user-plus" aria-hidden="true" />
            )}
            {t("party.signUp", "Sign up")}
        </button>
    );
};

export default React.memo(JoinRoundPanel);
