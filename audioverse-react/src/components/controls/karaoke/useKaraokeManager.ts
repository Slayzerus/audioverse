import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getAudioContext, resumeAudioContext } from "../../../scripts/audioContext";
import { useNavigate } from "react-router-dom";
import type { GenericPlayerExternal } from "../player/GenericPlayer";
import type { KaraokeSongFile, KaraokeNote } from "../../../models/modelsKaraoke";
import { searchYouTubeByArtistTitle } from "../../../scripts/api/apiLibrary";
import { useGamepadNavigation } from "../../../contexts/GamepadNavigationContext";
import { GameMode, useGameContext } from "../../../contexts/GameContext";
import { useUser } from "../../../contexts/UserContext";
import { ProfilePlayerService } from "../../../services/ProfilePlayerService";
import { useAudioContext } from "../../../contexts/AudioContext";
import { parseNotes } from '../../../scripts/karaoke/karaokeTimeline';
import { rtcService } from '../../../services/rtcService';
import { postCreateParty, postAddRound, postSaveResults, fetchTopSingings, TopSinging } from '../../../scripts/api/apiKaraoke';
import type { PadLane, PadNoteEvent, PadHitFeedback, PadDifficulty } from '../../../scripts/karaoke/padNotePlayer';
import { PadNotePlayer } from '../../../scripts/karaoke/padNotePlayer';
import {
    buildNoteDescriptors,
    toTrack as toTrackHelper,
    convertBrowserSongToKaraokeSongFile,
} from '../../../utils/karaokeHelpers';
import { loadKaraokeDisplaySettings } from '../../../scripts/karaoke/karaokeDisplaySettings';
import { hydrateKaraokeSettingsFromPlayerData } from '../../../scripts/karaoke/karaokeSettings';
import { logger } from '../../../utils/logger';
import { useKaraokePitch } from './useKaraokePitch';
import { useKaraokeTranscription } from './useKaraokeTranscription';
import { useKaraokeScoring } from './useKaraokeScoring';
import { dkLog } from '../../../constants/debugKaraoke';

const log = logger.scoped('KaraokeManager');

// ── Exported types ──
export type PitchPoint = { t: number; hz: number };

export interface SegmentScore {
    start: number;
    end: number;
    pitch: number;
    frac: number;
    isGold?: boolean;
    noteStart?: number;
    noteEnd?: number;
}

export interface ComboState {
    maxCombo: number;
    currentCombo: number;
    totalComboBonus: number;

}

/** Live transcription comparison result. */
export interface TranscriptionMatch {
    /** Transcribed text from the AI. */
    transcribedText: string;
    /** Expected lyrics for the same time window. */
    expectedText: string;
    /** Word overlap ratio 0–1. */
    matchRatio: number;
    /** Time window start (seconds). */
    windowStart: number;
    /** Time window end (seconds). */
    windowEnd: number;
}

export interface VerseRating {
    verseIndex: number;
    hitFraction: number;
    label: string;
    comboBonus: number;
}

// ── Hook props ──
export interface UseKaraokeManagerProps {
    showJurors?: boolean;
    initialSong?: Record<string, unknown>;
    gameMode?: GameMode;
    initialRoundId?: number | null;
    initialRoundPartId?: number | null;
    initialPartyId?: number | null;
}

// ── Hook ──
export function useKaraokeManager({
    initialSong,
    gameMode = "normal",
    initialRoundId = null,
    initialRoundPartId = null,
    initialPartyId = null,
}: UseKaraokeManagerProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setActive, pushFocusTrap, popFocusTrap } = useGamepadNavigation();
    const { state, importPlayers, micAlgorithms, defaultPitchAlgorithm, micRmsThresholds, micOffsets, micGains, micPitchThresholds, micSmoothingWindows, micHysteresisFrames, micUseHanning, micMonitorEnabled, micMonitorVolumes } = useGameContext();
    const { difficulty } = useGameContext();
    const { currentUser, username } = useUser();
    const { audioInputs } = useAudioContext();

    // ── Core state ──
    const [uploadedSong, setUploadedSong] = useState<KaraokeSongFile | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [isSearchingYT, setIsSearchingYT] = useState(false);
    const [ytSearchStatus, setYtSearchStatus] = useState<string>("");
    const [searchTrigger, setSearchTrigger] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const [topSingings, setTopSingings] = useState<TopSinging[]>([]);
    const [audioActivated, setAudioActivated] = useState(false);
    const activateBtnRef = useRef<HTMLButtonElement>(null);

    // ── Clock sync ──
    const clockOffsetMsRef = useRef<number>(0);
    const [clockOffsetMsState, setClockOffsetMsState] = useState<number>(0);

    // ── Party / Round tracking ──
    const currentRoundIdRef = useRef<number | null>(initialRoundId ?? null);
    const currentRoundPartIdRef = useRef<number | null>(initialRoundPartId ?? null);
    const currentPartyIdRef = useRef<number | null>(initialPartyId ?? null);
    const lobbyJoinedForPartyRef = useRef<number | null>(null);
    const resultSavedRef = useRef<boolean>(false);
    const partyCreatedForSongRef = useRef<number | string | null>(null);
    const autoPlayOnActivateRef = useRef(false);

    // Helper: join SignalR lobby for the current party (idempotent)
    const joinLobbyIfNeeded = useCallback(async (partyId: number) => {
        if (lobbyJoinedForPartyRef.current === partyId) return;
        try {
            if (!rtcService.isConnected()) return;
            const uname = username || currentUser?.username || 'Player';
            await rtcService.joinLobby(partyId, uname, 'participants');
            lobbyJoinedForPartyRef.current = partyId;
            log.debug('[KaraokeManager] Joined lobby for party', partyId, 'as', uname);
        } catch (e) {
            log.warn('[KaraokeManager] Failed to join lobby:', e);
        }
    }, [username, currentUser]);

    // ── Countdown ──
    const [playCountdown, setPlayCountdown] = useState<number | null>(null);
    const playCountdownRef = useRef<number | null>(null);

    // ── Stable-identity helpers for effects (avoid stale closures) ──
    const playersMicKey = useMemo(
        () => JSON.stringify(state.players.map(p => ({ id: p.id, micId: p.micId }))),
        [state.players],
    );

    // ── Pad mode state ──
    const padPlayerRef = useRef<PadNotePlayer | null>(null);
    const [padLanes, setPadLanes] = useState<PadLane[]>([]);
    const [padEvents, setPadEvents] = useState<PadNoteEvent[]>([]);
    const [padActiveLanes, setPadActiveLanes] = useState<boolean[]>([]);
    const [padFeedback, setPadFeedback] = useState<PadHitFeedback[]>([]);
    const isPadMode = gameMode === 'pad';

    // ── Refs for JSX ──
    const gpRef = useRef<GenericPlayerExternal | null>(null);
    const playerContainerRef = useRef<HTMLDivElement>(null);

    // ── Mic lost state ──
    const [micLostWarning, setMicLostWarning] = useState<string | null>(null);
    const wasPlayingBeforeMicLostRef = useRef(false);

    // ── Curtain transition state ──
    const [curtainState, setCurtainState] = useState<{ active: boolean; phase: 'cover' | 'reveal' }>({ active: false, phase: 'cover' });
    const curtainActionRef = useRef<(() => void) | null>(null);
    const curtainAutoRevealRef = useRef(true);
    const curtainPhaseRef = useRef<'idle' | 'covering' | 'covered' | 'revealing'>('idle');

    /** Wraps an action in a cover → action → reveal curtain transition. */
    const playCurtain = useCallback((midAction: () => void, autoReveal = true) => {
        const settings = loadKaraokeDisplaySettings();
        if (settings.transitionEffect === 'none') {
            midAction();
            return;
        }
        curtainActionRef.current = midAction;
        curtainAutoRevealRef.current = autoReveal;
        curtainPhaseRef.current = 'covering';
        setCurtainState({ active: true, phase: 'cover' });
    }, []);

    /** Called by CurtainTransition.onComplete when animation finishes. */
    const handleCurtainComplete = useCallback(() => {
        if (curtainPhaseRef.current === 'covering') {
            curtainPhaseRef.current = 'covered';
            curtainActionRef.current?.();
            curtainActionRef.current = null;
            if (curtainAutoRevealRef.current) {
                setTimeout(() => {
                    curtainPhaseRef.current = 'revealing';
                    setCurtainState({ active: true, phase: 'reveal' });
                }, 150);
            } else {
                curtainPhaseRef.current = 'idle';
                setCurtainState({ active: false, phase: 'cover' });
            }
        } else if (curtainPhaseRef.current === 'revealing') {
            curtainPhaseRef.current = 'idle';
            setCurtainState({ active: false, phase: 'cover' });
        }
    }, []);

    // Keep a ref to the latest currentTime so detection loops can record accurate timestamps
    const currentTimeRef = useRef<number>(currentTime);
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    // ═══════════════════════════════════════════════════════════════
    //  Sub-hooks: pitch detection, transcription, scoring
    // ═══════════════════════════════════════════════════════════════
    const {
        livePitch, setLivePitch,
        recordings, recordersRef, unsentPitchRef, pitchCleanupsRef,
        remoteLatencyMs, showRemoteTimelines, setShowRemoteTimelines,
        compactTimelines, setCompactTimelines,
    } = useKaraokePitch({
        isPlaying, gameMode, players: state.players, playersMicKey,
        micAlgorithms, defaultPitchAlgorithm,
        micRmsThresholds, micOffsets, micGains, micPitchThresholds,
        micSmoothingWindows, micHysteresisFrames, micUseHanning,
        micMonitorEnabled, micMonitorVolumes,
        currentTimeRef, isPadMode,
        clockOffsetMsRef, currentPartyIdRef,
    });

    const { transcriptionMatches } = useKaraokeTranscription({
        isPlaying, uploadedSong, gameMode,
        recordersRef, currentTimeRef,
    });

    const {
        liveScore, liveBonusScore, liveTotalScore,
        liveSegmentScores, liveCombo, liveVerseRatings,
        perPlayerScores, perPlayerSegmentScores,
        perPlayerCombo, perPlayerVerseRatings, perPlayerTotalScores,
        perPlayerNoteStats,
    } = useKaraokeScoring({
        livePitch, uploadedSong, isPlaying,
        difficulty, players: state.players, isPadMode,
    });

    // ═══════════════════════════════════════════════════════════════
    //  Audio activation
    // ═══════════════════════════════════════════════════════════════
    const activateAudio = useCallback(() => {
        dkLog('AUDIO', `Użytkownik kliknął 'Aktywuj dźwięk' — tryb: ${isPadMode ? 'pad' : 'mikrofon'}, graczy: ${state.players.length}`);
        // Synchronous audio context activation (must happen in user gesture call-stack)
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => { /* Expected: AudioContext resume may fail silently */ });
            }
            resumeAudioContext();
            const tempCtx = new AudioContext();
            if (tempCtx.state === 'suspended') tempCtx.resume().catch(() => { /* Expected: AudioContext resume may fail silently */ });
            tempCtx.close().catch(() => { /* Expected: AudioContext may already be closed */ });
            log.debug('[KaraokeManager] Audio context activated (synchronous), state:', ctx.state);
        } catch (e) {
            log.warn('[KaraokeManager] Audio activation error (sync phase)', e);
        }

        // Helper: proceed with curtain transition → set audioActivated
        const proceed = () => {
            dkLog('AUDIO', `Dźwięk aktywowany → uruchamiam kurtynę i włączam tryb karaoke (gracze: ${JSON.stringify(state.players.map(p => ({ id: p.id, name: p.name, mic: p.micId ?? 'brak' })))})`);
            playCurtain(() => {
                setAudioActivated(true);
                autoPlayOnActivateRef.current = true;
            });
        };

        if (!isPadMode) {
            // Request mic permission FIRST, then proceed — so that by the time
            // the auto-play effect starts playback the mic is already unlocked.
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    stream.getTracks().forEach(t => t.stop());
                    dkLog('AUDIO', 'Uprawnienie do mikrofonu udzielone ✓');
                })
                .catch(e => { log.warn('[KaraokeManager] Mic permission denied or unavailable', e); dkLog('AUDIO', 'Uprawnienie do mikrofonu odrzucone — karaoke bez mikrofonu', { error: String(e) }); })
                .finally(() => {
                    dkLog('AUDIO', 'Aktywacja dźwięku zakończona — startuję autoplay');
                    proceed();
                });
        } else {
            proceed();
        }
    }, [isPadMode, playCurtain]);

    // ── Immersive mode: hide navbar while singing ──
    useEffect(() => {
        const settings = loadKaraokeDisplaySettings();
        if (audioActivated && settings.immersiveMode) {
            document.body.classList.add('karaoke-immersive');
        }
        return () => {
            document.body.classList.remove('karaoke-immersive');
        };
    }, [audioActivated]);

    // ═══════════════════════════════════════════════════════════════
    //  Auto-join SignalR lobby when partyId is known
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (initialPartyId) {
            joinLobbyIfNeeded(initialPartyId);
        }
    }, [initialPartyId, joinLobbyIfNeeded]);

    // ═══════════════════════════════════════════════════════════════
    //  Clock sync
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const doSync = async () => {
            try {
                if (!rtcService.isConnected()) return;
                const offset = await rtcService.computeClockOffset(4);
                clockOffsetMsRef.current = offset;
                setClockOffsetMsState(Math.round(offset));
            } catch (_e) { /* Expected: clock sync may fail if RTC connection is unstable */ }
        };
        doSync();
        const iv = window.setInterval(doSync, 15000) as unknown as number;
        return () => { if (iv) window.clearInterval(iv); };
    }, []);

    // ═══════════════════════════════════════════════════════════════
    //  Auto-focus activate button
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (uploadedSong && !audioActivated && activateBtnRef.current) {
            activateBtnRef.current.focus();
        }
    }, [uploadedSong, audioActivated]);

    // ═══════════════════════════════════════════════════════════════
    //  Gamepad: any button press activates audio
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (audioActivated || !uploadedSong) return;
        const interval = window.setInterval(() => {
            const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
            for (const pad of pads) {
                if (pad && pad.buttons.some(b => b.pressed)) {
                    activateAudio();
                    return;
                }
            }
        }, 100);
        return () => window.clearInterval(interval);
    }, [audioActivated, uploadedSong, activateAudio]);

    // ═══════════════════════════════════════════════════════════════
    //  Mic lost pause
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!isPlaying) return;
        if (isPadMode) return;
        if (!state?.players?.length) return;
        const availableMicIds = new Set((audioInputs || []).map(m => m.deviceId));
        const missingMic = state.players.find(p => p.micId && !availableMicIds.has(p.micId));
        if (missingMic) {
            wasPlayingBeforeMicLostRef.current = true;
            gpRef.current?.pause();
            pitchCleanupsRef.current.forEach(fn => fn());
            pitchCleanupsRef.current = [];
            const pName = missingMic.name || `Player ${missingMic.id}`;
            setMicLostWarning(`🎤 Microphone ${pName} disconnected — paused`);
        }
    }, [isPlaying, state.players, audioInputs]);

    // ═══════════════════════════════════════════════════════════════
    //  Mic lost auto-dismiss / auto-resume
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!micLostWarning) return;
        if (!state?.players?.length) return;
        const availableMicIds = new Set((audioInputs || []).map(m => m.deviceId));
        const stillMissing = state.players.some(p => p.micId && !availableMicIds.has(p.micId));
        if (!stillMissing) {
            setMicLostWarning(null);
            if (wasPlayingBeforeMicLostRef.current) {
                wasPlayingBeforeMicLostRef.current = false;
                const resumeTimer = window.setTimeout(() => {
                    gpRef.current?.play();
                }, 300);
                return () => window.clearTimeout(resumeTimer);
            }
        } else {
            const timerId = window.setTimeout(() => {
                setMicLostWarning(null);
                wasPlayingBeforeMicLostRef.current = false;
            }, 12000);
            return () => window.clearTimeout(timerId);
        }
    }, [micLostWarning, audioInputs, state.players]);

    // ═══════════════════════════════════════════════════════════════
    //  Pad mode: start/stop PadNotePlayer
    // ═══════════════════════════════════════════════════════════════
    const firstPlayerId = state.players[0]?.id ?? 1;
    useEffect(() => {
        if (!isPadMode || !isPlaying || !uploadedSong) {
            if (padPlayerRef.current) {
                padPlayerRef.current.stop();
                padPlayerRef.current = null;
            }
            setPadLanes([]);
            setPadEvents([]);
            setPadActiveLanes([]);
            setPadFeedback([]);
            return;
        }

        const playerId = firstPlayerId;

        const player = new PadNotePlayer({
            difficulty: difficulty as PadDifficulty,
            noteLines: uploadedSong.notes.map((n: KaraokeNote) => n.noteLine),
            bpm: uploadedSong.bpm ?? undefined,
            gap: uploadedSong.gap ?? 0,
            onPitch: (hz: number) => {
                const t = currentTimeRef.current;
                setLivePitch(prev => {
                    const arr = prev[playerId] || [];
                    return { ...prev, [playerId]: [...arr, { t, hz }] };
                });
                unsentPitchRef.current[playerId] = (unsentPitchRef.current[playerId] || []).concat({ t, hz });
                const buf = unsentPitchRef.current[playerId];
                if (buf.length > 500) unsentPitchRef.current[playerId] = buf.slice(-500);
            },
            onHitFeedback: (fb) => {
                setPadFeedback(prev => [...prev.slice(-20), fb]);
            },
            onLaneActive: (active) => {
                setPadActiveLanes(active);
            },
            onCurrentNote: () => { /* visual only, handled by overlay */ },
        });

        setPadLanes(player.getLanes());
        setPadEvents(player.getEvents());
        setPadActiveLanes(new Array(player.getLanes().length).fill(false));

        player.start(() => currentTimeRef.current);
        padPlayerRef.current = player;

        log.debug(`[KaraokeManager] pad mode started — ${player.getLanes().length} lanes, ${player.getEvents().length} notes`);

        return () => {
            player.stop();
            padPlayerRef.current = null;
        };
    }, [isPadMode, isPlaying, uploadedSong, difficulty, firstPlayerId]);

    // ═══════════════════════════════════════════════════════════════
    //  togglePlayPause
    // ═══════════════════════════════════════════════════════════════
    const togglePlayPause = useCallback(async () => {
        dkLog('PLAYBACK', `Użytkownik nacisnął ${isPlaying || playCountdown !== null ? 'PAUZA' : 'START'} — piosenka: "${uploadedSong?.title ?? 'brak'}", graczy: ${state.players.length}`);
        if (!uploadedSong) return;
        if (!audioActivated) return;
        if (isPlaying || playCountdown !== null) {
            if (playCountdownRef.current) {
                window.clearInterval(playCountdownRef.current);
                playCountdownRef.current = null;
            }
            setPlayCountdown(null);
            gpRef.current?.pause();
            dkLog('PLAYBACK', 'Odtwarzanie zatrzymane ⏸');
            return;
        }

        // Load main profile player — but ONLY in standalone mode.
        // If players were already configured by JoinRoundPopup (with mic assignments),
        // do NOT overwrite them — that would destroy the mic setup.
        const playersAlreadyConfigured = state.players.some(p => !!p.micId);
        log.debug('[KaraokeManager] togglePlayPause: current players:', JSON.stringify(state.players.map(p => ({ id: p.id, name: p.name, micId: p.micId, color: p.color }))));
        log.debug('[KaraokeManager] togglePlayPause: playersAlreadyConfigured (have mics):', playersAlreadyConfigured);

        if (!playersAlreadyConfigured) {
            try {
                const userRecord = currentUser as unknown as Record<string, unknown> | null;
                const detected = (
                    userRecord?.userProfileId ??
                    userRecord?.profileId ??
                    (userRecord?.userProfile as Record<string, unknown> | undefined)?.id ??
                    (userRecord?.profile as Record<string, unknown> | undefined)?.id ??
                    currentUser?.userId
                ) as number | undefined;
                log.debug('[KaraokeManager] togglePlayPause: standalone mode — loading profile player for profileId:', detected);
                if (detected) {
                    const res = (await ProfilePlayerService.getAll(detected)) as Array<{ id?: number; isPrimary?: boolean; name?: string; color?: string; preferredColors?: string | string[]; karaokeSettings?: Record<string, unknown> }> | null;
                    const main = (res || []).find(p => !!p.isPrimary);
                    log.debug('[KaraokeManager] togglePlayPause: profile players loaded:', JSON.stringify(res), 'primary:', JSON.stringify(main));
                    if (main) {
                        // Hydrate karaoke settings from backend into localStorage
                        if (main.id != null && main.karaokeSettings) {
                            hydrateKaraokeSettingsFromPlayerData(main.id, main.karaokeSettings);
                            const ks = main.karaokeSettings as Record<string, unknown>;
                            dkLog('SETTINGS', `🎨 Załadowano ustawienia barów z backendu dla gracza "${main.name}" (id=${main.id}) — filledBar: ${(ks.filledBar as Record<string,unknown>)?.capStyleName ?? '?'}, emptyBar: glass=${(ks.emptyBar as Record<string,unknown>)?.glass ?? '?'}, goldPattern: ${(ks.goldFilledBar as Record<string,unknown>)?.patternName ?? 'brak'}`, { playerId: main.id, karaokeSettings: main.karaokeSettings });
                        } else {
                            dkLog('SETTINGS', `⚠ Gracz "${main.name}" (id=${main.id ?? '?'}) nie ma karaokeSettings w profilu — użyję domyślnych`, { playerId: main.id });
                        }
                        let playerColor = main.color;
                        if (!playerColor && main.preferredColors) {
                            if (typeof main.preferredColors === 'string') {
                                playerColor = main.preferredColors.split(',')[0]?.trim() || undefined;
                            } else if (Array.isArray(main.preferredColors) && main.preferredColors.length > 0) {
                                playerColor = main.preferredColors[0];
                            }
                        }
                        importPlayers([{ id: main.id, name: main.name, color: playerColor }], false, 'backend');
                        log.debug('[KaraokeManager] togglePlayPause: imported profile player:', main.name, 'color:', playerColor);
                    }
                }
            } catch (e) {
                log.warn('[KaraokeManager] togglePlayPause: failed to load profile player', e);
            }
        } else {
            log.debug('[KaraokeManager] togglePlayPause: players already configured from JoinRoundPopup — hydrating their karaoke settings');
            // Hydrate karaoke settings for pre-configured players (from JoinRoundPopup)
            // JoinRoundPopup already hydrates on profile player load, but do it again
            // in case those effects haven't fired or localStorage was cleared.
            try {
                const userRecord = currentUser as unknown as Record<string, unknown> | null;
                const detected = (
                    userRecord?.userProfileId ??
                    userRecord?.profileId ??
                    (userRecord?.userProfile as Record<string, unknown> | undefined)?.id ??
                    (userRecord?.profile as Record<string, unknown> | undefined)?.id ??
                    currentUser?.userId
                ) as number | undefined;
                if (detected) {
                    const res = (await ProfilePlayerService.getAll(detected)) as Array<{ id?: number; name?: string; karaokeSettings?: Record<string, unknown> }> | null;
                    (res || []).forEach(p => {
                        if (p.id != null && p.karaokeSettings) {
                            hydrateKaraokeSettingsFromPlayerData(p.id, p.karaokeSettings);
                            dkLog('SETTINGS', `🎨 Hydratacja ustawień barów dla gracza id=${p.id} (${p.name ?? '?'}) z backendu`, { playerId: p.id, hasSettings: true });
                        }
                    });
                    const withoutSettings = (res || []).filter(p => p.id != null && !p.karaokeSettings);
                    if (withoutSettings.length > 0) {
                        dkLog('SETTINGS', `⚠ ${withoutSettings.length} gracz(y) bez karaokeSettings: ${withoutSettings.map(p => `${p.name ?? '?'}(id=${p.id})`).join(', ')}`, { playerIds: withoutSettings.map(p => p.id) });
                    }
                }
            } catch (e) {
                log.warn('[KaraokeManager] togglePlayPause: failed to hydrate karaoke settings for configured players', e);
            }
        }

        // YouTube countdown
        const isYouTube = uploadedSong?.videoPath && /youtu(\.be|be\.com)/i.test(uploadedSong.videoPath);
        if (isYouTube) {
            if (playCountdownRef.current) {
                window.clearInterval(playCountdownRef.current);
                playCountdownRef.current = null;
            }
            setPlayCountdown(3);
            playCountdownRef.current = window.setInterval(() => {
                setPlayCountdown(prev => {
                    if (!prev || prev <= 1) {
                        if (playCountdownRef.current) {
                            window.clearInterval(playCountdownRef.current);
                            playCountdownRef.current = null;
                        }
                        gpRef.current?.play();
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000) as unknown as number;
        } else {
            gpRef.current?.play();
        }

        // Create Party + Round in background — skip when we already have
        // a round (e.g. launched from PartyPage with an existing event/round).
        const songKey = uploadedSong.id ?? uploadedSong.title ?? 'unknown';
        if (partyCreatedForSongRef.current !== songKey && !currentRoundIdRef.current) {
            partyCreatedForSongRef.current = songKey;
            (async () => {
                try {
                    const songTitle = uploadedSong.title || 'Unknown';
                    const songArtist = uploadedSong.artist || '';
                    const activePlayer = state.players.find(p => !!p.micId) || state.players[0];
                    const playerId = activePlayer?.id ?? 1;
                    const party = await postCreateParty({
                        name: `${songArtist} - ${songTitle}`,
                        description: `Quick play session`,
                        organizerId: playerId,
                        startTime: new Date().toISOString(),
                    });
                    const partyId = (party as typeof party & { partyId?: number }).partyId ?? party.id;
                    currentPartyIdRef.current = partyId ?? null;
                    log.debug('[KaraokeManager] Created party response:', JSON.stringify(party), 'resolved partyId:', partyId);
                    const roundData = {
                        id: 0,
                        partyId: partyId,
                        playlistId: null as number | null,
                        songId: uploadedSong.id ?? 0,
                        playerId: playerId,
                        number: 1,
                        startTime: new Date().toISOString(),
                    };
                    const round = await postAddRound(roundData);
                    currentRoundIdRef.current = (round as typeof round & { roundId?: number }).roundId ?? round.id;
                    resultSavedRef.current = false;
                    log.debug('[KaraokeManager] Created party', partyId, 'round', JSON.stringify(round));
                    // Join the SignalR lobby so timeline updates are accepted
                    if (partyId) joinLobbyIfNeeded(partyId);
                } catch (e) {
                    log.warn('[KaraokeManager] Failed to create party/round:', e);
                    currentRoundIdRef.current = null;
                    currentPartyIdRef.current = null;
                    partyCreatedForSongRef.current = null;
                }
            })();
        }
    }, [uploadedSong, isPlaying, audioActivated, currentUser, importPlayers, state.players, playCountdown]);

    // ═══════════════════════════════════════════════════════════════
    //  Auto-start playback after activation
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!audioActivated || !autoPlayOnActivateRef.current) return;
        autoPlayOnActivateRef.current = false;
        dkLog('PLAYBACK', `Auto-start: dźwięk aktywowany — czekam na gotowość playera (graczy: ${state.players.map(p => `${p.name ?? p.id}${p.micId ? ' 🎤' : ''}`).join(', ')})`);
        const timer = setInterval(() => {
            if (gpRef.current) {
                clearInterval(timer);
                dkLog('PLAYBACK', 'Player gotowy → startuję odtwarzanie 🎵');
                togglePlayPause();
            }
        }, 100);
        const giveUp = setTimeout(() => clearInterval(timer), 3000);
        return () => { clearInterval(timer); clearTimeout(giveUp); };
    }, [audioActivated, togglePlayPause]);

    // ═══════════════════════════════════════════════════════════════
    //  Save singing result
    // ═══════════════════════════════════════════════════════════════
    const saveSingingResult = useCallback(() => {
        dkLog('SAVE', `Zapisuję wynik śpiewania — roundId=${currentRoundIdRef.current}, piosenka: "${uploadedSong?.title ?? '?'}" (id=${uploadedSong?.id})`, { alreadySaved: resultSavedRef.current });
        if (!currentRoundIdRef.current || resultSavedRef.current) return;
        resultSavedRef.current = true;
        const songId = uploadedSong?.id ?? 0;
        const roundId = currentRoundIdRef.current!;

        // Build a payload entry for EVERY player that has a score
        const payload: { id: number; roundId: number; playerId: number; songId: number; score: number; hits?: number; misses?: number; good?: number; perfect?: number; combo?: number; roundPartId?: number | null }[] = [];
        for (const player of state.players) {
            const score = perPlayerTotalScores[player.id] ?? 0;
            if (score <= 0) continue;
            const stats = perPlayerNoteStats[player.id];
            const entry: typeof payload[0] = {
                id: 0,
                roundId,
                playerId: player.id,
                songId,
                score,
                hits: stats?.hits ?? 0,
                misses: stats?.misses ?? 0,
                good: stats?.good ?? 0,
                perfect: stats?.perfect ?? 0,
                combo: stats?.maxCombo ?? 0,
            };
            if (currentRoundPartIdRef.current) entry.roundPartId = currentRoundPartIdRef.current;
            payload.push(entry);
        }
        if (payload.length === 0) return;
        dkLog('SAVE', `Wysyłam wyniki dla ${payload.length} gracz(y)`, payload.map(e => ({ playerId: e.playerId, score: e.score, hits: e.hits, perfect: e.perfect, combo: e.combo })));
        postSaveResults(payload as Parameters<typeof postSaveResults>[0]).then(() => {
            dkLog('SAVE', `Wyniki zapisane na serwerze ✓ (${payload.length} gracz(y))`);
            if (songId > 0) {
                fetchTopSingings(songId).then(setTopSingings).catch(() => { /* Expected: leaderboard fetch is non-critical */ });
            }
        }).catch((_e: unknown) => {
            log.warn('[KaraokeManager] Failed to save singing result:', _e);
            resultSavedRef.current = false;
        });
    }, [state.players, perPlayerTotalScores, perPlayerNoteStats, uploadedSong]);

    const handleTrackEnded = useCallback(() => {
        dkLog('PLAYBACK', `Utwór zakończony — uruchamiam kurtynę, pokażę podsumowanie i zapiszam wynik`, { roundId: currentRoundIdRef.current, song: uploadedSong?.title, players: state.players.map(p => `${p.name ?? p.id}: ${Math.round((perPlayerTotalScores?.[p.id] ?? 0))} pkt`) });
        playCurtain(() => {
            setShowSummary(true);
            saveSingingResult();
        });
    }, [saveSingingResult, playCurtain]);

    // ═══════════════════════════════════════════════════════════════
    //  Demo mode: auto-stop at 12 seconds
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (gameMode === "demo" && isPlaying && currentTime >= 12) {
            gpRef.current?.pause();
            handleTrackEnded();
        }
    }, [gameMode, isPlaying, currentTime, handleTrackEnded]);

    // ═══════════════════════════════════════════════════════════════
    //  Focus trap on summary
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (showSummary) {
            dkLog('SUMMARY', `🏆 Podsumowanie widoczne — wyniki graczy: ${state.players.map(p => `${p.name ?? p.id}: ${Math.round(perPlayerTotalScores?.[p.id] ?? 0)} pkt`).join(' | ')}`);
            pushFocusTrap('summary-');
            setActive("summary-back");
        }
        return () => {
            if (showSummary) {
                popFocusTrap();
            }
        };
    }, [showSummary, pushFocusTrap, popFocusTrap, setActive]);

    // ═══════════════════════════════════════════════════════════════
    //  Spacebar toggles play/pause
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.code !== "Space") return;
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag && ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(tag)) return;
            if (!uploadedSong) return;
            e.preventDefault();
            togglePlayPause();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [uploadedSong, togglePlayPause]);

    // ═══════════════════════════════════════════════════════════════
    //  Gamepad Start (button 9) toggles play/pause
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        let lastStart = false;
        const interval = window.setInterval(() => {
            const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
            if (!pads.length) return;
            const pad = pads[0];
            if (!pad || !pad.buttons?.[9]) return;
            const pressed = !!pad.buttons[9].pressed;
            if (pressed && !lastStart) {
                togglePlayPause();
            }
            lastStart = pressed;
        }, 80);
        return () => window.clearInterval(interval);
    }, [togglePlayPause]);

    // ═══════════════════════════════════════════════════════════════
    //  YouTube search after song upload
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (!uploadedSong || searchTrigger === 0) return;

        const searchYouTube = async () => {
            // Skip if the song already has a YouTube source resolved
            if (uploadedSong.videoPath && (uploadedSong.videoPath.includes('youtube.com/') || uploadedSong.videoPath.startsWith('v='))) {
                log.debug('[KaraokeManager] YT search skipped — videoPath already has YouTube:', uploadedSong.videoPath);
                return;
            }
            if (uploadedSong.youtubeId) {
                // Song has a pre-set youtubeId but no videoPath yet — set it directly
                const youtubeUrl = `https://www.youtube.com/watch?v=${uploadedSong.youtubeId}`;
                setUploadedSong(prev => prev ? { ...prev, videoPath: youtubeUrl } : null);
                log.debug('[KaraokeManager] YT search skipped — used existing youtubeId:', uploadedSong.youtubeId);
                return;
            }
            if (!uploadedSong.artist || !uploadedSong.title) {
                setYtSearchStatus(t('karaokeManager.ytNoData', '⚠️ No artist/title data for search'));
                return;
            }
            setIsSearchingYT(true);
            setYtSearchStatus(t('karaokeManager.ytSearching', '🔍 Searching YouTube...'));

            try {
                const videoId = await searchYouTubeByArtistTitle(uploadedSong.artist, uploadedSong.title);

                if (videoId) {
                    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
                    setUploadedSong(prev => prev ? { ...prev, videoPath: youtubeUrl } : null);
                    setYtSearchStatus(`✅ Znaleziono: ${videoId}`);
                    setTimeout(() => setYtSearchStatus(""), 3000);
                } else {
                    setYtSearchStatus(t('karaokeManager.ytNotFound', '❌ Not found on YouTube'));
                    setTimeout(() => setYtSearchStatus(""), 5000);
                }
            } catch (_error) {
                void _error;
                setYtSearchStatus(t('karaokeManager.ytSearchError', '❌ Search error'));
                setTimeout(() => setYtSearchStatus(""), 5000);
            } finally {
                setIsSearchingYT(false);
            }
        };

        searchYouTube();
    }, [searchTrigger, uploadedSong, t]);

    // ═══════════════════════════════════════════════════════════════
    //  Auto-load initial song from browser
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (initialSong && !uploadedSong) {
            dkLog('SONG', `► Ładuję piosenkę przekazaną z nawigacji: "${initialSong.title as string ?? '?'}" — artysta: ${initialSong.artist as string ?? '?'}, id=${initialSong.id as number ?? '?'}, nut: ${Array.isArray(initialSong.notes) ? initialSong.notes.length : 0}, youtubeId: ${initialSong.youtubeId as string ?? 'brak'}, videoPath: ${initialSong.videoPath as string ?? 'brak'}`);

            const songToLoad = convertBrowserSongToKaraokeSongFile(initialSong);
            dkLog('SONG', `Piosenka przetworzona → videoPath: ${songToLoad.videoPath ?? 'brak'}, audioPath: ${songToLoad.audioPath ?? 'brak'}, nut: ${songToLoad.notes?.length ?? 0}, bpm: ${songToLoad.bpm ?? '?'}, gap: ${songToLoad.gap ?? '?'}`);

            setUploadedSong(songToLoad);
            setCurrentTime(0);
            setYtSearchStatus("");
            setSearchTrigger(prev => prev + 1);
        }
    }, [initialSong]);

    // ═══════════════════════════════════════════════════════════════
    //  currentTrack memo
    // ═══════════════════════════════════════════════════════════════
    const currentTrack = useMemo(() => {
        if (!uploadedSong) return null;
        const trk = toTrackHelper(uploadedSong, gameMode);
        log.debug('[KaraokeManager] toTrack result:', JSON.stringify({ id: trk.id, title: trk.title, sources: trk.sources }));
        log.debug('[KaraokeManager] uploadedSong.videoPath:', uploadedSong.videoPath);
        log.debug('[KaraokeManager] uploadedSong.audioPath:', uploadedSong.audioPath);
        return trk;
    }, [uploadedSong, gameMode]);

    // ═══════════════════════════════════════════════════════════════
    //  Callbacks for JSX
    // ═══════════════════════════════════════════════════════════════
    const handleSongUpload = useCallback((song: KaraokeSongFile) => {
        dkLog('SONG', `Użytkownik wybrał piosenkę: "${song.title}" — artysta: ${song.artist ?? 'nieznany'}, id=${song.id}, nut: ${song.notes?.length ?? 0}, źródło wideo: ${song.videoPath ? 'YouTube/plik' : 'brak'}, audio: ${song.audioPath ? 'tak' : 'brak'}`);
        void song;
        setUploadedSong(song);
        setCurrentTime(0);
        setYtSearchStatus("");
        setSearchTrigger(prev => prev + 1);
    }, []);

    const dismissMicWarning = useCallback(() => {
        setMicLostWarning(null);
        wasPlayingBeforeMicLostRef.current = false;
    }, []);

    const restartSong = useCallback(() => {
        playCurtain(() => {
            setShowSummary(false);
            partyCreatedForSongRef.current = null;
            resultSavedRef.current = false;
            setLivePitch({});
            gpRef.current?.seekTo(0);
            gpRef.current?.play();
        });
    }, [playCurtain, setLivePitch]);

    const navigateToSongs = useCallback(() => {
        playCurtain(() => navigate("/songs"), false); // cover only, no reveal — we're leaving the page
    }, [navigate, playCurtain]);

    // ═══════════════════════════════════════════════════════════════
    //  Fixture export — downloads notes + pitch points as JSON
    //  for use with the Tuning Harness (/tuning-harness)
    // ═══════════════════════════════════════════════════════════════
    const exportFixtureBundle = useCallback(() => {
        if (!uploadedSong) return;

        const activePlayer = isPadMode
            ? state.players[0]
            : (state.players.find(p => !!p.micId) || state.players[0]);
        const playerId = activePlayer?.id;
        const pts = playerId != null ? (livePitch[playerId] || []) : [];

        const noteLines = parseNotes(
            uploadedSong.notes.map(n => n.noteLine),
            uploadedSong.bpm ?? undefined
        );
        const gapSec = (uploadedSong.gap ?? 0) / 1000;
        const notes = buildNoteDescriptors(noteLines, gapSec);

        const bundle = {
            exportedAt: new Date().toISOString(),
            songTitle: uploadedSong.title ?? 'unknown',
            bpm: uploadedSong.bpm,
            gap: uploadedSong.gap,
            notes,
            points: pts,
        };

        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fixture-${(uploadedSong.title ?? 'song').replace(/\s+/g, '_')}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [uploadedSong, livePitch, state.players, isPadMode]);

    // ═══════════════════════════════════════════════════════════════
    //  Return
    // ═══════════════════════════════════════════════════════════════
    return {
        // State
        uploadedSong,
        isPlaying,
        currentTime,
        audioActivated,
        isSearchingYT,
        ytSearchStatus,
        showSummary,
        topSingings,
        playCountdown,
        micLostWarning,
        recordings,
        livePitch,
        liveScore,
        liveBonusScore,
        liveTotalScore,
        liveSegmentScores,
        liveCombo,
        liveVerseRatings,
        perPlayerScores,
        perPlayerSegmentScores,
        perPlayerCombo,
        perPlayerVerseRatings,
        perPlayerTotalScores,
        transcriptionMatches,
        showRemoteTimelines,
        compactTimelines,
        clockOffsetMsState,
        remoteLatencyMs,
        isPadMode,
        padLanes,
        padEvents,
        padActiveLanes,
        padFeedback,
        currentTrack,

        // Curtain transition
        curtainState,
        handleCurtainComplete,

        // Context-derived
        players: state.players,
        micAlgorithms,
        defaultPitchAlgorithm,
        difficulty,

        // Mic settings (for performance report)
        micRmsThresholds,
        micOffsets,
        micGains,
        micPitchThresholds,
        micSmoothingWindows,
        micHysteresisFrames,
        micUseHanning,
        micMonitorEnabled,
        micMonitorVolumes,

        // Setters
        setIsPlaying,
        setCurrentTime,
        setShowRemoteTimelines,
        setCompactTimelines,
        setShowSummary,

        // Callbacks
        activateAudio,
        togglePlayPause,
        handleSongUpload,
        handleTrackEnded,
        dismissMicWarning,
        restartSong,
        navigateToSongs,
        exportFixtureBundle,

        // Refs
        gpRef,
        playerContainerRef,
        activateBtnRef,

        // Utils
        t,
    };
}
