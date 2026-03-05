import React, { useMemo, useEffect, useRef } from "react";
import { useKaraokeManager } from "./useKaraokeManager";
import type { GameMode } from "../../../contexts/GameContext";
import { useAudioContext } from "../../../contexts/AudioContext";
import GenericPlayer from "../player/GenericPlayer";
import KaraokeUploader from "./KaraokeUploader";
import KaraokeLyrics from "./KaraokeLyrics";
import KaraokeTimeline from "./KaraokeTimeline";
import Jurors from "../../animations/Jurors";
import CountdownOverlay from "../../common/CountdownOverlay";
import AudioActivationOverlay from "./AudioActivationOverlay";
import KaraokeSummaryOverlay from "./KaraokeSummaryOverlay";
import PadKaraokeOverlay from "./PadKaraokeOverlay";
import CurtainTransition from "../../common/CurtainTransition";
import { Focusable } from "../../common/Focusable";
import { PLAYER_COLORS } from "../../../constants/playerColors";
import { getAlgorithmLabel, getAlgorithmColor } from "../../../utils/karaokeHelpers";
import { loadKaraokeDisplaySettings } from "../../../scripts/karaoke/karaokeDisplaySettings";
import { loadKaraokeSettings, loadAllKaraokeSettings } from "../../../scripts/karaoke/glossyBarRenderer";
import type { PlayerKaraokeSettings } from "../../../scripts/karaoke/glossyBarRenderer";
import { preloadTextures } from "../../../scripts/karaoke/textureCache";
import { ensureFontLoaded } from "../../../scripts/karaoke/fontCatalog";
import type { PadDifficulty } from "../../../scripts/karaoke/padNotePlayer";
import type { MicSettingsSnapshot } from "../../../utils/vocalPerformanceMetrics";
import { logger } from "../../../utils/logger";
import { dkLog } from "../../../constants/debugKaraoke";

const log = logger.scoped('KaraokeManager');
const JURORS_H = 160;

interface KaraokeManagerProps {
    showJurors?: boolean;
    initialSong?: Record<string, unknown>;
    gameMode?: GameMode;
    initialRoundId?: number | null;
    initialRoundPartId?: number | null;
    initialPartyId?: number | null;
}

const KaraokeManager: React.FC<KaraokeManagerProps> = ({
    showJurors = false,
    initialSong,
    gameMode = "normal",
    initialRoundId = null,
    initialRoundPartId = null,
    initialPartyId = null,
}) => {
    const km = useKaraokeManager({ showJurors, initialSong, gameMode, initialRoundId, initialRoundPartId, initialPartyId });
    const { audioInputs } = useAudioContext();

    // Build mic settings snapshots for the performance report
    const micSettingsMap = useMemo(() => {
        const map: Record<number, MicSettingsSnapshot> = {};
        for (const p of km.players) {
            const devId = p.micId ?? '';
            if (!devId) continue;
            const devInfo = audioInputs.find(d => d.deviceId === devId);
            map[p.id] = {
                deviceId: devId,
                deviceLabel: devInfo?.label ?? devId.slice(0, 16),
                algorithm: km.micAlgorithms[p.id] ?? km.defaultPitchAlgorithm ?? 'pitchy',
                gain: km.micGains[devId] ?? 1,
                rmsThreshold: km.micRmsThresholds[devId] ?? 0.01,
                pitchThreshold: km.micPitchThresholds[devId] ?? 0.8,
                smoothingWindow: km.micSmoothingWindows[devId] ?? 3,
                hysteresisFrames: km.micHysteresisFrames[devId] ?? 2,
                useHanning: km.micUseHanning[devId] ?? false,
                latencyOffsetMs: km.micOffsets[devId] ?? 0,
                monitorEnabled: km.micMonitorEnabled[devId] ?? false,
                monitorVolume: km.micMonitorVolumes[devId] ?? 0.5,
            };
        }
        return map;
    }, [km.players, audioInputs, km.micAlgorithms, km.defaultPitchAlgorithm, km.micGains, km.micRmsThresholds, km.micPitchThresholds, km.micSmoothingWindows, km.micHysteresisFrames, km.micUseHanning, km.micOffsets, km.micMonitorEnabled, km.micMonitorVolumes]);

    // Memoize blob URLs for recordings — avoids creating new URLs on every render and properly revokes old ones
    const prevBlobUrlsRef = useRef<Record<number, string>>({});
    const recordingBlobUrls = useMemo(() => {
        // Revoke old URLs
        for (const url of Object.values(prevBlobUrlsRef.current)) {
            URL.revokeObjectURL(url);
        }
        const urls: Record<number, string> = {};
        for (const [idStr, blob] of Object.entries(km.recordings)) {
            if (blob) urls[Number(idStr)] = URL.createObjectURL(blob);
        }
        prevBlobUrlsRef.current = urls;
        return urls;
    }, [km.recordings]);

    // Cleanup blob URLs on unmount
    useEffect(() => {
        return () => {
            for (const url of Object.values(prevBlobUrlsRef.current)) {
                URL.revokeObjectURL(url);
            }
        };
    }, []);

    // Load animation mode and font from display settings (memoized to avoid re-reads every render)
    const displaySettings = useMemo(() => loadKaraokeDisplaySettings(), []);
    const animationMode = displaySettings.animationMode;
    const globalKaraokeSettings = useMemo(() => {
        const settings = loadKaraokeSettings();
        preloadTextures([
            settings.filledBar.textureUrl, settings.emptyBar.textureUrl,
            settings.goldEmptyBar.textureUrl, settings.goldFilledBar.textureUrl,
        ]);
        return settings;
    }, []);

    // Per-player karaoke settings — load once per player set
    const playerIdsKey = km.players.map(p => p.id).join(',');
    const playerKaraokeSettings = useMemo(() => {
        const ids = km.players.map(p => p.id);
        const map = loadAllKaraokeSettings(ids);
        // Preload textures for all players
        for (const [id, settings] of map.entries()) {
            const pName = km.players.find(p => p.id === id)?.name ?? `id=${id}`;
            log.debug(`Loaded karaoke settings for player ${id}:`,
                'filled.cap:', settings.filledBar.capStyleName,
                'empty.cap:', settings.emptyBar.capStyleName,
                'goldFilled.cap:', settings.goldFilledBar.capStyleName,
                'goldEmpty.cap:', settings.goldEmptyBar.capStyleName);
            dkLog('SETTINGS', `🎵 Ustawienia barów gracza "${pName}" — filled: cap=${settings.filledBar.capStyleName}, pattern=${settings.filledBar.patternName ?? 'brak'} | empty: glass=${settings.emptyBar.glass}, cap=${settings.emptyBar.capStyleName} | gold: pattern=${settings.goldFilledBar.patternName ?? 'brak'}`, { playerId: id, filledBar: settings.filledBar, emptyBar: settings.emptyBar, goldFilledBar: settings.goldFilledBar, goldEmptyBar: settings.goldEmptyBar });
            preloadTextures([
                settings.filledBar.textureUrl, settings.emptyBar.textureUrl,
                settings.goldEmptyBar.textureUrl, settings.goldFilledBar.textureUrl,
            ]);
        }
        return map;
    }, [playerIdsKey]);

    // Font: use player 1's custom font (shared for all timelines = common lyrics text).
    // Falls back to display settings font, then Arial.
    // Build a merged karaokeSettings per player with player-1's font override.
    const player1Font = useMemo(() => {
        const p1Id = km.players[0]?.id;
        const p1Settings = p1Id != null ? playerKaraokeSettings.get(p1Id) : null;
        const fs = p1Settings?.font ?? globalKaraokeSettings.font;
        const family = fs.fontFamily || displaySettings.fontFamily || 'Arial';
        if (family) ensureFontLoaded(family);
        return { ...fs, fontFamily: family };
    }, [km.players, playerKaraokeSettings, globalKaraokeSettings, displaySettings.fontFamily]);

    /** Get effective karaokeSettings for a player, with player 1's font merged in */
    const getPlayerKaraokeSettings = (playerId: number): PlayerKaraokeSettings => {
        const base = playerKaraokeSettings.get(playerId) ?? globalKaraokeSettings;
        return { ...base, font: player1Font };
    };

    const playerHeight = 480;

    return (
        <div
            className="karaoke-manager"
            style={{
                textAlign: "center",
                padding: "20px",
                paddingBottom: km.uploadedSong && showJurors ? JURORS_H + 24 : 20,
                position: "relative",
                minHeight: "100vh",
            }}
        >
            {/* ── Header controls + uploader ── */}
            {!initialSong && (
                <div
                    className="karaoke-header"
                    style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 10 }}
                >
                    {km.uploadedSong && km.audioActivated && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Focusable id="header-play">
                                <button onClick={() => (km.isPlaying ? km.gpRef.current?.pause() : km.gpRef.current?.play())}>
                                    {km.isPlaying ? "⏸ Pause" : "▶ Play"}
                                </button>
                            </Focusable>
                            <Focusable id="header-reset">
                                <button onClick={() => km.gpRef.current?.seekTo(0)}>⏮ Reset</button>
                            </Focusable>
                            <span>⏱️ {km.currentTime.toFixed(1)} s</span>
                        </div>
                    )}
                    <Focusable id="header-uploader">
                        <KaraokeUploader onSongUpload={km.handleSongUpload} />
                    </Focusable>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                        <label style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: 13 }}>
                            <input type="checkbox" checked={km.showRemoteTimelines} onChange={e => km.setShowRemoteTimelines(e.target.checked)} style={{ marginRight: 6 }} />
                            Show timelines
                        </label>
                        <label style={{ color: 'var(--text-secondary, #cbd5e1)', fontSize: 13 }}>
                            <input type="checkbox" checked={km.compactTimelines} onChange={e => km.setCompactTimelines(e.target.checked)} style={{ marginRight: 6 }} />
                            Compact
                        </label>
                        <div style={{ color: 'var(--text-muted, #9ca3af)', fontSize: 12 }}>
                            Offset: {km.clockOffsetMsState} ms
                        </div>
                    </div>
                </div>
            )}

            {/* ── YouTube search status ── */}
            {km.ytSearchStatus && (
                <div
                    style={{
                        margin: "10px auto",
                        padding: "8px 16px",
                        background: km.isSearchingYT ? "var(--primary, #3b82f6)" : km.ytSearchStatus.includes("✅") ? "var(--success, #10b981)" : "var(--error, #ef4444)",
                        color: "var(--btn-text, #fff)",
                        borderRadius: 8,
                        maxWidth: 400,
                        fontSize: 14,
                        fontWeight: 500,
                    }}
                >
                    {km.ytSearchStatus}
                </div>
            )}

            {/* ── Audio activation overlay ── */}
            {km.uploadedSong && !km.audioActivated && (
                <AudioActivationOverlay
                    isPadMode={km.isPadMode}
                    activateAudio={km.activateAudio}
                    activateBtnRef={km.activateBtnRef}
                    t={km.t}
                />
            )}

            {/* ── Countdown 3-2-1 before YouTube ── */}
            <CountdownOverlay seconds={km.playCountdown} />

            {/* ── Mic lost warning ── */}
            {km.micLostWarning && (
                <div
                    style={{
                        position: 'fixed',
                        top: 60,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(244,67,54,0.92)',
                        color: '#fff',
                        padding: '12px 28px',
                        borderRadius: 12,
                        fontSize: 18,
                        fontWeight: 700,
                        zIndex: 400,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                        textAlign: 'center',
                        pointerEvents: 'auto',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                    }}
                    onClick={km.dismissMicWarning}
                >
                    <span>{km.micLostWarning}</span>
                    <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.85 }}>
                        {km.t('karaokeManager.micLostReconnect', 'Reconnect — game will resume automatically. Click to dismiss.')}
                    </span>
                </div>
            )}

            {/* ── Main stage ── */}
            {km.uploadedSong && km.audioActivated && (
                <>
                    <div
                        ref={km.playerContainerRef}
                        style={{
                            width: "100%",
                            maxWidth: 1200,
                            margin: "0 auto 20px",
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                        }}
                    >
                        {/* Player */}
                        <div style={{ width: "100%", zIndex: 10, position: "relative" }}>
                            <GenericPlayer
                                tracks={km.currentTrack ? [km.currentTrack] : []}
                                autoPlay={false}
                                uiMode="nobuttons"
                                onPlayingChange={km.setIsPlaying}
                                onTimeUpdate={km.setCurrentTime}
                                externalRef={km.gpRef}
                                height={playerHeight}
                                onEnded={km.handleTrackEnded}
                            />
                        </div>

                        {/* Player recordings (after summary) */}
                        {km.showSummary && Object.keys(km.recordings).length > 0 && (
                            <div style={{ margin: '24px 0', background: '#222', borderRadius: 12, padding: 16 }}>
                                <h4 style={{ color: '#fff' }}>🎙️ {km.t('karaokeManager.playerRecordings', 'Player Recordings')}</h4>
                                <ul style={{ color: '#fff', listStyle: 'none', padding: 0 }}>
                                    {km.players.map(player => (
                                        <li key={player.id} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <b>{player.name || km.t('karaokeManager.playerN', 'Player {{id}}', { id: player.id })}</b>:
                                            {km.recordings[player.id] ? (
                                                <>
                                                    <audio controls src={recordingBlobUrls[player.id]} style={{ verticalAlign: 'middle', flex: 1, maxWidth: 300 }} />
                                                    <a
                                                        href={recordingBlobUrls[player.id]}
                                                        download={`${(player.name || `player-${player.id}`)}-recording.webm`}
                                                        style={{ color: '#4fc3f7', textDecoration: 'none', fontSize: 13, whiteSpace: 'nowrap' }}
                                                    >
                                                        ⬇️ {km.t('karaokeManager.download', 'Download')}
                                                    </a>
                                                </>
                                            ) : (
                                                <span style={{ color: '#aaa', marginLeft: 8 }}>{km.t('karaokeManager.noRecording', 'No recording')}</span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Subtle transcription match indicator */}
                        {km.isPlaying && km.transcriptionMatches.length > 0 && (() => {
                            const last = km.transcriptionMatches[km.transcriptionMatches.length - 1];
                            const pct = Math.round(last.matchRatio * 100);
                            const color = pct >= 70 ? '#22c55e' : pct >= 40 ? '#eab308' : '#ef4444';
                            return (
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 12,
                                        zIndex: 50,
                                        background: 'rgba(0,0,0,0.6)',
                                        color,
                                        fontSize: 11,
                                        padding: '3px 8px',
                                        borderRadius: 10,
                                        pointerEvents: 'none',
                                        opacity: 0.7,
                                        fontWeight: 600,
                                        letterSpacing: 0.5,
                                    }}
                                    title={`${last.transcribedText}\n${last.expectedText}`}
                                >
                                    🎤 {pct}%
                                </div>
                            );
                        })()}

                        {/* Timeline overlay */}
                        {!gameMode?.includes("no-timeline") && !gameMode?.includes("blind") && (
                            <div
                                style={{
                                    width: "100%",
                                    minHeight: 260,
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    zIndex: 30,
                                    pointerEvents: "none",
                                }}
                            >
                                {(() => {
                                    const playerRect = km.playerContainerRef.current?.getBoundingClientRect();
                                    const canvasWidth = playerRect ? playerRect.width : 600;
                                    const heightMultiplier = km.compactTimelines ? 0.6 : 1;
                                    const canvasHeight = Math.round(canvasWidth * (150 / 600) * heightMultiplier);
                                    const baseTop = 30;
                                    const playersToRender = km.showRemoteTimelines
                                        ? km.players
                                        : [km.players.find(p => !!p.micId) || km.players[0]].filter((p): p is NonNullable<typeof p> => !!p);
                                    const songGapSec = (km.uploadedSong?.gap ?? 0) / 1000;
                                    return (
                                        <>
                                            {playersToRender.map((p, idx) => {
                                                // Gap-adjust pitch timestamps: pitch is recorded in media time
                                                // but timeline renders in gap-adjusted time (media time - gap)
                                                const rawPts = km.livePitch[p.id] || [];
                                                const ptsFor = songGapSec ? rawPts.map(pt => ({ t: pt.t - songGapSec, hz: pt.hz })) : rawPts;
                                                const algP = km.micAlgorithms[p.id] || km.defaultPitchAlgorithm;
                                                const algLabelP = getAlgorithmLabel(algP);
                                                const algColorP = getAlgorithmColor(algP);
                                                const gap = km.compactTimelines ? 6 : 8;
                                                const topPx = baseTop + idx * (canvasHeight + gap);
                                                return (
                                                    <KaraokeTimeline
                                                        key={p.id}
                                                        song={km.uploadedSong!}
                                                        currentTime={km.currentTime}
                                                        playerRef={km.playerContainerRef}
                                                        userPitch={ptsFor}
                                                        segmentScores={km.perPlayerSegmentScores[p.id] ?? km.liveSegmentScores}
                                                        combo={km.perPlayerCombo[p.id] ?? km.liveCombo}
                                                        verseRatings={km.perPlayerVerseRatings[p.id] ?? km.liveVerseRatings}
                                                        config={{
                                                            playerName: `${p.name ?? `Player ${p.id}`} ${km.remoteLatencyMs[p.id] ? `(${km.remoteLatencyMs[p.id]}ms)` : ''}`,
                                                            score: km.perPlayerTotalScores[p.id] ?? 0,
                                                            playerBgColor: p.color || PLAYER_COLORS[idx % PLAYER_COLORS.length],
                                                            difficultyLevel: km.difficulty,
                                                            isPlaying: km.isPlaying,
                                                            playerCount: km.players.length,
                                                            algorithmLabel: algLabelP,
                                                            algorithmColor: algColorP,
                                                            top: topPx,
                                                            latencyMs: km.remoteLatencyMs[p.id] ?? null,
                                                            animationMode,
                                                            karaokeSettings: getPlayerKaraokeSettings(p.id),
                                                        }}
                                                    />
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* Pad mode overlay */}
                        {km.isPadMode && km.padLanes.length > 0 && (
                            <PadKaraokeOverlay
                                lanes={km.padLanes}
                                events={km.padEvents}
                                currentTime={km.currentTime}
                                activeLanes={km.padActiveLanes}
                                difficulty={km.difficulty as PadDifficulty}
                                feedbackQueue={km.padFeedback}
                                isPlaying={km.isPlaying}
                            />
                        )}

                        {/* Lyrics overlay */}
                        {!gameMode?.includes("no-lyrics") && !gameMode?.includes("blind") && (
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 20,
                                    left: 0,
                                    right: 0,
                                    zIndex: 25,
                                    pointerEvents: "none",
                                }}
                            >
                                <KaraokeLyrics song={km.uploadedSong} currentTime={km.currentTime} />
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Jurors ── */}
            {km.uploadedSong && showJurors && (
                <div
                    style={{
                        position: "fixed",
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: JURORS_H,
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        pointerEvents: "none",
                        zIndex: 60,
                        boxShadow: "0 -6px 16px rgba(0,0,0,0.25)",
                    }}
                >
                    <div style={{ transform: "translateY(42%)" }}>
                        <Jurors />
                    </div>
                </div>
            )}

            {/* ── Summary overlay ── */}
            {km.showSummary && (
                <KaraokeSummaryOverlay
                    uploadedSong={km.uploadedSong}
                    playerScores={km.perPlayerScores}
                    topSingings={km.topSingings}
                    onRestart={km.restartSong}
                    onContinue={km.navigateToSongs}
                    t={km.t}
                    livePitch={km.livePitch}
                    liveVerseRatings={km.liveVerseRatings}
                    liveCombo={km.liveCombo}
                    difficulty={km.difficulty}
                    micSettings={micSettingsMap}
                />
            )}

            {/* ── Curtain transition overlay ── */}
            <CurtainTransition
                active={km.curtainState.active}
                effect={displaySettings.transitionEffect}
                phase={km.curtainState.phase}
                primaryColor={displaySettings.curtainPrimaryColor}
                secondaryColor={displaySettings.curtainSecondaryColor}
                durationMs={displaySettings.curtainDurationMs}
                onComplete={km.handleCurtainComplete}
            />
        </div>
    );
};

export default KaraokeManager;
