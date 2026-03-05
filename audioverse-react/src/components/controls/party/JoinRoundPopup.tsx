/**
 * JoinRoundPopup — Modal popup for joining a karaoke round.
 * 
 * Layout (3 zones):
 *  1. LEFT  – Profile players as small focusable cards + (+) card to create new
 *  2. CENTER – Assignment zone: assigned player→device pairs + auto-assign checkbox
 *  3. RIGHT – Devices: microphone cards (with live volume) + gamepad row if detected
 *
 * Workflow:
 *  - Click a player card on the left → player moves to center (assignment zone)
 *  - If auto-assign is checked and a mic is free → auto-assigns
 *  - Pads must be assigned manually
 *  - Colors propagate from player to assigned devices
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Modal } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import { useGameContext } from "../../../contexts/GameContext";
import { useAudioContext } from "../../../contexts/AudioContext";
import { useUser } from "../../../contexts/UserContext";
import {
    useAddRoundPlayerMutation,
    useDeleteRoundPlayerMutation,
    fetchRoundPlayers,
    patchRoundPlayerMic,
} from "../../../scripts/api/karaoke/apiKaraokeRounds";
import { useJoinPartyMutation } from "../../../scripts/api/karaoke/apiKaraokeSessions";
import { PlayerService } from "../../../services/PlayerService";
import { hydrateKaraokeSettingsFromPlayerData } from "../../../scripts/karaoke/karaokeSettings";
import { Focusable } from "../../common/Focusable";
import AudioVolumeLevel from "../input/source/AudioVolumeLevel";
import PlayerForm from "../../forms/PlayerForm";
import { PLAYER_COLORS } from "../../../constants/playerColors";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faPlus, faMicrophone, faGamepad, faTimes, faPlay } from "@fortawesome/free-solid-svg-icons";
import CurtainTransition from "../../common/CurtainTransition";
import { API_ROOT } from "../../../config/apiConfig";
import { logger } from "../../../utils/logger";
import { dkLog } from "../../../constants/debugKaraoke";
import css from './JoinRoundPopup.module.css';

const log = logger.scoped('JoinRoundPopup');

// ── Types ──

interface ProfilePlayer {
    id: number;
    name?: string | null;
    color?: string | null;
    preferredColors?: string | null;
    isPrimary?: boolean;
    email?: string | null;
    icon?: string | null;
    photoUrl?: string | null;
}

interface Assignment {
    player: ProfilePlayer;
    micDeviceId?: string;
    padIndex?: number;
}

interface JoinRoundPopupProps {
    show: boolean;
    onHide: () => void;
    roundId: number;
    sessionId?: number | null;
    partyId: number;
    onPlay?: (roundId: number) => void;
}

// ── Helpers ──

function getPlayerColor(player: ProfilePlayer, fallbackIdx: number): string {
    if (player.color) return player.color;
    if (player.preferredColors) {
        const first = player.preferredColors.split(",")[0]?.trim();
        if (first) return first;
    }
    return PLAYER_COLORS[fallbackIdx % PLAYER_COLORS.length];
}

// ── Component ──

const JoinRoundPopup: React.FC<JoinRoundPopupProps> = ({
    show,
    onHide,
    roundId,
    sessionId,
    partyId,
    onPlay,
}) => {
    const { t } = useTranslation();
    const { userId } = useUser();
    const { importPlayers } = useGameContext();
    const { audioInputs } = useAudioContext();
    const addPlayerMutation = useAddRoundPlayerMutation();
    const deletePlayerMutation = useDeleteRoundPlayerMutation();
    const joinPartyMutation = useJoinPartyMutation();

    // ── State ──
    const [profilePlayers, setProfilePlayers] = useState<ProfilePlayer[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [autoAssign, setAutoAssign] = useState(true);
    const [showCreatePlayer, setShowCreatePlayer] = useState(false);
    const [gamepads, setGamepads] = useState<Gamepad[]>([]);
    const [joining, setJoining] = useState(false);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [joinTarget, setJoinTarget] = useState<'join' | 'play' | null>(null);
    const [curtainActive, setCurtainActive] = useState(false);
    const [curtainPhase, setCurtainPhase] = useState<"cover" | "reveal">("cover");
    const padPollRef = useRef<number>(0);
    /** Round-player IDs (backend assignment IDs) for players already joined in this round */
    const [existingRoundPlayerIds, setExistingRoundPlayerIds] = useState<Map<number, number>>(new Map());

    // ── Load profile players + hydrate karaoke settings ──
    useEffect(() => {
        if (!show || !userId) return;
        let cancelled = false;
        PlayerService.getAll(userId).then((players: unknown[]) => {
            if (cancelled) return;
            const list = (Array.isArray(players) ? players : []) as (ProfilePlayer & { karaokeSettings?: Record<string, unknown> })[];
            setProfilePlayers(list);
            // Hydrate karaoke settings from backend for each player
            list.forEach(p => {
                if (p.id != null && p.karaokeSettings) {
                    hydrateKaraokeSettingsFromPlayerData(p.id, p.karaokeSettings);
                }
            });
        }).catch(() => { /* Expected: player list fetch is best-effort */ });
        return () => { cancelled = true; };
    }, [show, userId]);

    // ── Load existing round players (already joined) ──
    useEffect(() => {
        if (!show || !roundId) return;
        let cancelled = false;
        fetchRoundPlayers(roundId).then(rps => {
            if (cancelled) return;
            // Map playerId → round-player assignment id (for delete API)
            const idMap = new Map<number, number>();
            const existingAssignments: Assignment[] = [];
            rps.forEach(rp => {
                idMap.set(rp.playerId, rp.id);
                if (rp.player) {
                    existingAssignments.push({
                        player: {
                            id: rp.player.id,
                            name: rp.player.name ?? null,
                            color: rp.player.preferredColors ?? rp.player.color ?? null,
                            preferredColors: rp.player.preferredColors ?? null,
                            isPrimary: rp.player.isPrimary,
                        },
                        micDeviceId: rp.micDeviceId ?? undefined,
                        padIndex: undefined,
                    });
                }
            });
            setExistingRoundPlayerIds(idMap);
            if (existingAssignments.length > 0) {
                setAssignments(existingAssignments);
            }
        }).catch(err => {
            log.warn('Failed to load existing round players:', err);
        });
        return () => { cancelled = true; };
    }, [show, roundId]);

    // ── Poll gamepads ──
    useEffect(() => {
        if (!show) return;
        const poll = () => {
            const raw = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) as Gamepad[] : [];
            setGamepads(raw);
            padPollRef.current = requestAnimationFrame(poll);
        };
        poll();
        return () => cancelAnimationFrame(padPollRef.current);
    }, [show]);

    // Reset state when popup opens (assignments will be loaded from existing round players)
    useEffect(() => {
        if (show) {
            setAssignments([]); // will be populated by round players effect
            setExistingRoundPlayerIds(new Map());
            setJoining(false);
            setJoinTarget(null);
            setCurtainActive(false);
            setCurtainPhase("cover");
            setShowCreatePlayer(false);
        }
    }, [show]);

    // ── Derived ──
    const mics = audioInputs ?? [];
    const hasPads = gamepads.length > 0;

    // Players that are NOT assigned yet
    const unassignedPlayers = useMemo(() => {
        const assignedIds = new Set(assignments.map(a => a.player.id));
        return profilePlayers.filter(p => !assignedIds.has(p.id));
    }, [profilePlayers, assignments]);

    // ── Actions ──

    const addPlayerToAssignments = useCallback((player: ProfilePlayer) => {
        // Don't add duplicates
        if (assignments.some(a => a.player.id === player.id)) return;

        const usedMicIds = new Set(assignments.map(a => a.micDeviceId).filter(Boolean));
        const freeMic = autoAssign
            ? mics.find(m => !usedMicIds.has(m.deviceId))
            : undefined;
        const micDeviceId = freeMic?.deviceId;

        // Update local state immediately
        setAssignments(prev => {
            if (prev.some(a => a.player.id === player.id)) return prev;
            return [...prev, { player, micDeviceId, padIndex: undefined }];
        });

        // POST to backend immediately (including mic assignment)
        addPlayerMutation.mutateAsync({
            roundId,
            payload: { playerId: player.id, micDeviceId: micDeviceId ?? null },
            sessionId: sessionId ?? undefined,
        }).then(res => {
            if (res?.id) {
                setExistingRoundPlayerIds(prev => {
                    const next = new Map(prev);
                    next.set(player.id, res.id);
                    return next;
                });
                log.debug(`Added player ${player.id} to round ${roundId} with backend id=${res.id}, mic=${micDeviceId}`);
            }
        }).catch(err => {
            log.warn('Failed to add player to round:', err);
        });
    }, [autoAssign, mics, assignments, roundId, sessionId, addPlayerMutation]);

    const removeFromAssignments = useCallback((playerId: number) => {
        // If this player is already joined in the round, delete from backend
        const roundPlayerId = existingRoundPlayerIds.get(playerId);
        if (roundPlayerId) {
            deletePlayerMutation.mutate(
                { roundId, id: roundPlayerId },
                { onSuccess: () => log.debug(`Removed round player ${roundPlayerId} from round ${roundId}`) },
            );
            setExistingRoundPlayerIds(prev => {
                const next = new Map(prev);
                next.delete(playerId);
                return next;
            });
        }
        setAssignments(prev => prev.filter(a => a.player.id !== playerId));
    }, [existingRoundPlayerIds, roundId, deletePlayerMutation]);

    const toggleMicForPlayer = useCallback((playerId: number, micDeviceId: string) => {
        setAssignments(prev => {
            // If already assigned to this player → unassign
            const current = prev.find(a => a.player.id === playerId);
            if (current?.micDeviceId === micDeviceId) {
                // Persist removal to backend if player already in round
                const rpId = existingRoundPlayerIds.get(playerId);
                if (rpId) patchRoundPlayerMic(roundId, rpId, null).catch(err => log.warn('Failed to clear mic:', err));
                return prev.map(a => a.player.id === playerId ? { ...a, micDeviceId: undefined } : a);
            }
            // If assigned to another player → steal it
            const stolenFromPlayerId = prev.find(a => a.micDeviceId === micDeviceId && a.player.id !== playerId)?.player.id;
            if (stolenFromPlayerId) {
                const stolenRpId = existingRoundPlayerIds.get(stolenFromPlayerId);
                if (stolenRpId) patchRoundPlayerMic(roundId, stolenRpId, null).catch(err => log.warn('Failed to clear stolen mic:', err));
            }
            // Persist assignment to backend if player already in round
            const rpId = existingRoundPlayerIds.get(playerId);
            if (rpId) patchRoundPlayerMic(roundId, rpId, micDeviceId).catch(err => log.warn('Failed to set mic:', err));
            return prev.map(a => {
                if (a.player.id === playerId) return { ...a, micDeviceId };
                if (a.micDeviceId === micDeviceId) return { ...a, micDeviceId: undefined };
                return a;
            });
        });
    }, [existingRoundPlayerIds, roundId]);

    const togglePadForPlayer = useCallback((playerId: number, padIdx: number) => {
        setAssignments(prev => {
            const current = prev.find(a => a.player.id === playerId);
            if (current?.padIndex === padIdx) {
                return prev.map(a => a.player.id === playerId ? { ...a, padIndex: undefined } : a);
            }
            // If assigned to another player → steal it
            return prev.map(a => {
                if (a.player.id === playerId) return { ...a, padIndex: padIdx };
                if (a.padIndex === padIdx) return { ...a, padIndex: undefined };
                return a;
            });
        });
    }, []);

    // ── Join handlers ──
    const { assignMic: contextAssignMic } = useGameContext();

    /** Shared core: API calls + GameContext import (no navigation) */
    const performJoin = useCallback(async () => {
        dkLog('JOIN', 'performJoin start', { partyId, roundId, sessionId, assignments: assignments.map(a => ({ name: a.player.name, id: a.player.id, mic: a.micDeviceId })) });
        log.debug('performJoin: assignments=', JSON.stringify(assignments.map(a => ({
            playerName: a.player.name, playerId: a.player.id, micDeviceId: a.micDeviceId,
        }))));

        // Skip joining a party when there is no real party (e.g. Quick Karaoke passes partyId=0)
        if (partyId > 0) {
            dkLog('JOIN', `joinParty → partyId=${partyId}`);
            await joinPartyMutation.mutateAsync({ partyId });
            dkLog('JOIN', 'joinParty ✓', { partyId });
        } else {
            dkLog('JOIN', `partyId=${partyId} — skipping joinParty (Quick Karaoke / no event)`);
        }

        // Re-fetch current round players from backend to avoid stale local state
        // (e.g. after page refresh the existingRoundPlayerIds closure may be outdated)
        let serverPlayerIds: Set<number>;
        try {
            dkLog('JOIN', `fetchRoundPlayers roundId=${roundId}…`);
            const currentRoundPlayers = await fetchRoundPlayers(roundId);
            serverPlayerIds = new Set(currentRoundPlayers.map(rp => rp.playerId));
            dkLog('JOIN', `fetchRoundPlayers ✓ — existing playerIds:`, [...serverPlayerIds]);
            log.debug('performJoin: fresh round players from server:', JSON.stringify([...serverPlayerIds]));
        } catch {
            // Fallback to local state if network fails
            serverPlayerIds = new Set(existingRoundPlayerIds.keys());
            dkLog('JOIN', 'fetchRoundPlayers failed — using local state', [...serverPlayerIds]);
            log.warn('performJoin: failed to re-fetch round players, using local state');
        }

        // Only add players that aren't already in the round
        for (const a of assignments) {
            if (!serverPlayerIds.has(a.player.id)) {
                dkLog('JOIN', `addPlayer playerId=${a.player.id} name="${a.player.name}" mic=${a.micDeviceId ?? 'none'}`);
                await addPlayerMutation.mutateAsync({
                    roundId,
                    payload: { playerId: a.player.id, micDeviceId: a.micDeviceId ?? null },
                    sessionId: sessionId ?? undefined,
                });
                dkLog('JOIN', `addPlayer ✓ playerId=${a.player.id}`);
            } else {
                dkLog('JOIN', `addPlayer SKIP playerId=${a.player.id} — already in round`);
            }
        }
        const toImport = assignments.map(a => ({
            id: a.player.id,
            name: a.player.name ?? undefined,
            color: getPlayerColor(a.player, 0),
        }));
        dkLog('JOIN', 'importPlayers →', toImport);
        log.debug('importPlayers:', JSON.stringify(toImport));
        importPlayers(toImport, false, 'backend');

        // Assign mics after a microtask tick — importPlayers uses setPlayers which
        // batches with React. We need one frame for the new player IDs to settle.
        await new Promise(resolve => setTimeout(resolve, 60));
        dkLog('JOIN', 'assigning mics…', { count: assignments.filter(a => a.micDeviceId && a.player.id).length });
        log.debug('assigning mics after await...');
        assignments.forEach(a => {
            if (a.micDeviceId && a.player.id) {
                dkLog('JOIN', `assignMic playerId=${a.player.id} mic=${a.micDeviceId}`);
                log.debug(`assignMic(playerId=${a.player.id}, micDeviceId=${a.micDeviceId})`);
                contextAssignMic(a.player.id, a.micDeviceId);
            }
        });
        dkLog('JOIN', 'performJoin complete ✓', { partyId, roundId, sessionId, playerCount: assignments.length });
    }, [assignments, roundId, partyId, sessionId, existingRoundPlayerIds, addPlayerMutation, joinPartyMutation, importPlayers, contextAssignMic]);

    /** "Dołącz i graj" – join, then play curtain animation */
    const handleJoinAndPlay = useCallback(async () => {
        if (assignments.length === 0) return;
        dkLog('JOIN', 'handleJoinAndPlay — starting curtain flow', { roundId, partyId, playerCount: assignments.length });
        setJoinTarget('play');
        setJoining(true);
        try {
            await performJoin();
            dkLog('JOIN', 'handleJoinAndPlay — performJoin done, triggering curtain cover', { roundId });
            setCurtainPhase("cover");
            setCurtainActive(true);
        } catch (e) {
            dkLog('JOIN', 'handleJoinAndPlay — ERROR', e);
            log.error("Join+Play failed:", e);
            setJoining(false);
            setJoinTarget(null);
        }
    }, [assignments, performJoin]);

    /** Curtain animation phase handler */
    const handleCurtainComplete = useCallback(() => {
        if (curtainPhase === "cover") {
            dkLog('JOIN', `curtain cover complete — calling onPlay(roundId=${roundId})`);
            if (onPlay) document.body.classList.add("karaoke-immersive");
            onPlay?.(roundId);
            setCurtainPhase("reveal");
        } else {
            dkLog('JOIN', 'curtain reveal complete — popup closing', { roundId });
            setCurtainActive(false);
            setJoining(false);
            setJoinTarget(null);
            onHide();
        }
    }, [curtainPhase, onPlay, roundId, onHide]);

    // ── Create-player callback ──
    const handlePlayerCreated = useCallback((_saved: { name?: string; color?: string }) => {
        setShowCreatePlayer(false);
        // Reload profile players
        if (userId) {
            PlayerService.getAll(userId).then((players: ProfilePlayer[]) => {
                setProfilePlayers(Array.isArray(players) ? players : []);
            }).catch(() => { /* Expected: player list reload is best-effort */ });
        }
    }, [userId]);

    // ── Render ──

    if (showCreatePlayer) {
        return (
            <>
            <style>{`.join-round-popup-backdrop.modal-backdrop { z-index: 1079 !important; }`}</style>
            <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" className={css.modalOverlay} backdropClassName="join-round-popup-backdrop">
                <Modal.Header closeButton className={css.createModalHeader}>
                    <Modal.Title className={css.modalTitle}>
                        {t('karaoke.addPlayer', 'Nowy gracz')}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body className={css.createModalBody}>
                    <PlayerForm
                        onSuccess={() => setShowCreatePlayer(false)}
                        onSaved={handlePlayerCreated}
                    />
                </Modal.Body>
            </Modal>
            </>
        );
    }

    return (
        <>
        <style>{`
            .join-round-popup-backdrop.modal-backdrop { z-index: 1079 !important; }
            ${curtainActive ? '.ct-root { z-index: 9999 !important; }' : ''}
        `}</style>
        <Modal show={show} onHide={onHide} size="lg" centered backdrop="static" dialogClassName="join-round-popup" className={css.modalOverlay} style={curtainActive ? { visibility: 'hidden' } : undefined} backdropClassName="join-round-popup-backdrop">
            <Modal.Header closeButton className={css.mainModalHeader}>
                <Modal.Title className={css.modalTitle}>
                    <FontAwesomeIcon icon={faPlay} className={`me-2 ${css.titleIcon}`} />
                    {t('party.joinRound', 'Dołącz do rundy')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className={css.modalBody}>
                <div className={`d-flex ${css.bodyWrapper}`}>

                    {/* ═══ ZONE 1: Players ═══ */}
                    <div className={css.zoneLeft}>
                        <div className={css.sectionLabel}>
                            {t('party.players', 'Gracze')}
                        </div>
                        <div className={`d-flex flex-wrap gap-2 ${css.playerGrid}`}>
                            {unassignedPlayers.map((p, idx) => {
                                const color = getPlayerColor(p, idx);
                                const hasPhoto = !!p.photoUrl;
                                const photoSrc = hasPhoto ? `${API_ROOT}${p.photoUrl}` : null;
                                return (
                                    <Focusable id={`jrp-player-${p.id}`} key={p.id}>
                                        <div
                                            onClick={() => addPlayerToAssignments(p)}
                                            className={css.playerCard}
                                            style={{
                                                background: photoSrc
                                                    ? `url(${photoSrc}) center / cover no-repeat`
                                                    : color,
                                                justifyContent: hasPhoto ? 'flex-end' : 'center',
                                                gap: hasPhoto ? 0 : 2,
                                            }}
                                            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#fff'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.05)'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'transparent'; (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                                            title={p.name ?? `Player ${p.id}`}
                                        >
                                            {!hasPhoto && (
                                                p.icon
                                                    ? <i className={`fa ${p.icon} ${css.playerIcon}`} aria-hidden="true" />
                                                    : <FontAwesomeIcon icon={faUser} className={css.playerIcon} />
                                            )}
                                            <div
                                                className={`${css.playerName} ${hasPhoto ? css.playerNameOverlay : ''}`}
                                                style={{ maxWidth: hasPhoto ? '100%' : 80 }}
                                            >
                                                {p.name ?? `Player ${p.id}`}
                                            </div>
                                        </div>
                                    </Focusable>
                                );
                            })}
                            {/* (+) New player card */}
                            <Focusable id="jrp-player-add">
                                <div
                                    onClick={() => setShowCreatePlayer(true)}
                                    className={css.addCard}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.5)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                    title={t('karaoke.addPlayer', 'Nowy gracz')}
                                >
                                    <FontAwesomeIcon icon={faPlus} className={css.addCardIcon} />
                                    <div className={css.addCardLabel}>
                                        {t('common.add', 'Dodaj')}
                                    </div>
                                </div>
                            </Focusable>
                        </div>
                    </div>

                    {/* ═══ ZONE 2: Assignments ═══ */}
                    <div className={css.zoneCenter}>
                        <div className={css.sectionLabel}>
                            {t('party.assignments', 'Przypisania')}
                        </div>
                        <div className={css.assignmentsList}>
                            {assignments.length === 0 && (
                                <div className={css.emptyState}>
                                    {t('party.noAssignments', 'Kliknij gracza aby dodać')}
                                </div>
                            )}
                            {assignments.map((a, idx) => {
                                const color = getPlayerColor(a.player, idx);
                                const isSelected = selectedAssignmentId === a.player.id;
                                const assignedMic = a.micDeviceId ? mics.find(m => m.deviceId === a.micDeviceId) : null;
                                const assignedPad = a.padIndex != null ? gamepads[a.padIndex] : null;
                                return (
                                    <div
                                        key={a.player.id}
                                        onClick={() => setSelectedAssignmentId(isSelected ? null : a.player.id)}
                                        className={css.assignmentRow}
                                        style={{
                                            background: isSelected ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `2px solid ${isSelected ? color : 'transparent'}`,
                                        }}
                                    >
                                        {/* Player mini icon */}
                                        <div
                                            className={css.assignmentAvatar}
                                            style={{
                                                background: a.player.photoUrl
                                                    ? `url(${API_ROOT}${a.player.photoUrl}) center / cover no-repeat`
                                                    : color,
                                            }}
                                        >
                                            {!a.player.photoUrl && (
                                                a.player.icon
                                                    ? <i className={`fa ${a.player.icon} ${css.assignmentIcon}`} aria-hidden="true" />
                                                    : <FontAwesomeIcon icon={faUser} className={css.assignmentIcon} />
                                            )}
                                        </div>
                                        {/* Name + devices */}
                                        <div className={css.assignmentNameWrap}>
                                            <div className={css.assignmentPlayerName}>
                                                {a.player.name ?? `Player ${a.player.id}`}
                                            </div>
                                            <div className={`d-flex gap-1 flex-wrap ${css.assignmentDevices}`}>
                                                {assignedMic && (
                                                    <span className={`badge ${css.deviceBadge}`} style={{ background: color }}>
                                                        <FontAwesomeIcon icon={faMicrophone} className={`me-1 ${css.badgeIcon}`} />
                                                        {assignedMic.label?.split(' ').slice(0, 2).join(' ') || `Mic`}
                                                    </span>
                                                )}
                                                {assignedPad && (
                                                    <span className={`badge ${css.deviceBadge}`} style={{ background: color }}>
                                                        <FontAwesomeIcon icon={faGamepad} className={`me-1 ${css.badgeIcon}`} />
                                                        Pad {(a.padIndex ?? 0) + 1}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Remove button */}
                                        <button
                                            className={`btn btn-sm p-0 ${css.removeBtn}`}
                                            onClick={e => { e.stopPropagation(); removeFromAssignments(a.player.id); }}
                                            title={t('common.delete', 'Usuń')}
                                        >
                                            <FontAwesomeIcon icon={faTimes} className={css.removeIcon} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Auto-assign checkbox */}
                        <div className={css.autoAssignDivider}>
                            <label className={`d-flex align-items-center gap-2 ${css.autoAssignLabel}`}>
                                <input
                                    type="checkbox"
                                    checked={autoAssign}
                                    onChange={e => setAutoAssign(e.target.checked)}
                                    className={css.autoAssignCheckbox}
                                />
                                {t('party.autoAssign', 'Auto przypisanie')}
                            </label>
                        </div>
                    </div>

                    {/* ═══ ZONE 3: Devices ═══ */}
                    <div className={css.zoneRight}>
                        {/* Microphones */}
                        <div className={css.micSection} style={{ flex: hasPads ? '0 0 auto' : 1 }}>
                            <div className={css.sectionLabel}>
                                <FontAwesomeIcon icon={faMicrophone} className={`me-1 ${css.labelIcon}`} />
                                {t('party.microphones', 'Mikrofony')}
                            </div>
                            <div className="d-flex flex-wrap gap-2">
                                {mics.map((mic, idx) => {
                                    // Find which assignment owns this mic
                                    const ownerAssignment = assignments.find(a => a.micDeviceId === mic.deviceId);
                                    const ownerColor = ownerAssignment
                                        ? getPlayerColor(ownerAssignment.player, assignments.indexOf(ownerAssignment))
                                        : 'rgba(255,255,255,0.15)';
                                    const isClickable = selectedAssignmentId != null;
                                    return (
                                        <Focusable id={`jrp-mic-${idx}`} key={mic.deviceId}>
                                            <div
                                                onClick={() => {
                                                    if (selectedAssignmentId != null) {
                                                        toggleMicForPlayer(selectedAssignmentId, mic.deviceId);
                                                    }
                                                }}
                                                className={`${css.deviceCard} ${css.micCard}`}
                                                style={{
                                                    border: `2px solid ${ownerColor}`,
                                                    cursor: isClickable ? 'pointer' : 'default',
                                                }}
                                                title={mic.label || `Microphone ${idx + 1}`}
                                            >
                                                {/* Ordinal number */}
                                                <div className={css.cardOrdinal} style={{ color: ownerColor }}>
                                                    {idx + 1}
                                                </div>
                                                {/* Live volume level */}
                                                <AudioVolumeLevel deviceId={mic.deviceId} size={24} waveformWidth={72} waveformHeight={16} direction="vertical" />
                                                {/* Owner name badge */}
                                                {ownerAssignment && (
                                                    <div className={css.ownerBadge} style={{ background: ownerColor }}>
                                                        {ownerAssignment.player.name ?? 'Player'}
                                                    </div>
                                                )}
                                                {!ownerAssignment && (
                                                    <div className={css.micUnownedLabel}>
                                                        {mic.label?.split(' ').slice(0, 2).join(' ') || `Mic ${idx + 1}`}
                                                    </div>
                                                )}
                                            </div>
                                        </Focusable>
                                    );
                                })}
                                {mics.length === 0 && (
                                    <div className={css.noDevicesMsg}>
                                        {t('party.noMicsDetected', 'Brak wykrytych mikrofonów')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gamepads */}
                        {hasPads && (
                            <div className={css.gamepadsSection}>
                                <div className={css.sectionLabel}>
                                    <FontAwesomeIcon icon={faGamepad} className={`me-1 ${css.labelIcon}`} />
                                    {t('party.gamepads', 'Pady')}
                                </div>
                                <div className="d-flex flex-wrap gap-2">
                                    {gamepads.map((pad, idx) => {
                                        const ownerAssignment = assignments.find(a => a.padIndex === idx);
                                        const ownerColor = ownerAssignment
                                            ? getPlayerColor(ownerAssignment.player, assignments.indexOf(ownerAssignment))
                                            : PLAYER_COLORS[idx % PLAYER_COLORS.length];
                                        const anyButtonPressed = pad.buttons?.some(b => b.pressed);
                                        return (
                                            <div
                                                key={pad.index}
                                                onClick={() => {
                                                    if (selectedAssignmentId != null) {
                                                        togglePadForPlayer(selectedAssignmentId, idx);
                                                    }
                                                }}
                                                className={`${css.deviceCard} ${css.padCard}`}
                                                style={{
                                                    background: anyButtonPressed ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.3)',
                                                    border: `2px solid ${ownerColor}`,
                                                    cursor: selectedAssignmentId != null ? 'pointer' : 'default',
                                                }}
                                                title={pad.id || `Pad ${idx + 1}`}
                                            >
                                                <div className={css.cardOrdinal} style={{ color: ownerColor }}>
                                                    {idx + 1}
                                                </div>
                                                <FontAwesomeIcon icon={faGamepad} className={css.padIcon} style={{ color: ownerColor }} />
                                                {ownerAssignment && (
                                                    <div className={css.ownerBadge} style={{ background: ownerColor }}>
                                                        {ownerAssignment.player.name ?? 'Player'}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </Modal.Body>
            <Modal.Footer className={css.footer}>
                <button className="btn btn-outline-secondary btn-sm" onClick={onHide} disabled={joining}>
                    {t('common.cancel', 'Anuluj')}
                </button>
                <button
                    className={`btn btn-primary btn-sm d-flex align-items-center gap-2 ${css.playBtnWeight}`}
                    onClick={handleJoinAndPlay}
                    disabled={joining || assignments.length === 0}
                >
                    {joinTarget === 'play' ? (
                        <span className={`spinner-border spinner-border-sm ${css.spinner}`} />
                    ) : (
                        <FontAwesomeIcon icon={faPlay} className={css.playIcon} />
                    )}
                    {t('party.play', 'Play')}
                </button>
            </Modal.Footer>
        </Modal>
        <CurtainTransition
            active={curtainActive}
            effect="theaterCurtain"
            phase={curtainPhase}
            primaryColor="#0a0a0a"
            secondaryColor="#8b0000"
            durationMs={700}
            onComplete={handleCurtainComplete}
        />
        </>
    );
};

export default JoinRoundPopup;
