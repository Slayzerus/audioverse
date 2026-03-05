/**
 * QuickKaraokeJoinPage — Standalone quick karaoke entry point.
 *
 * Flow:
 *  1. Creates a karaoke session on mount (backend).
 *  2. Shows a song browser (reuses KaraokeSongBrowser).
 *  3. User picks a song → a round is created for it.
 *  4. JoinRoundPopup opens for player/mic assignment.
 *  5. Play → navigates to /rounds with the same state as PartyPage.
 *
 * Also includes a difficulty selector (GameContext).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "bootstrap/dist/css/bootstrap.min.css";
import { useUser } from "../../contexts/UserContext";
import { useGameContext, type Difficulty } from "../../contexts/GameContext";
import { useToast } from "../../components/ui/ToastProvider";
import { postAddSession } from "../../scripts/api/karaoke/apiKaraokeSessions";
import { postAddRound, postAddRoundPart } from "../../scripts/api/karaoke/apiKaraokeRounds";
import { getSongById } from "../../scripts/api/apiKaraoke";
import KaraokeSongBrowser from "../../components/controls/karaoke/KaraokeSongBrowser";
import JoinRoundPopup from "../../components/controls/party/JoinRoundPopup";
import { logger } from "../../utils/logger";
import { dkLog } from "../../constants/debugKaraoke";

const log = logger.scoped("QuickKaraokeJoinPage");

const QuickKaraokeJoinPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { userId } = useUser();
    const { difficulty, setDifficulty } = useGameContext();
    const { showToast } = useToast();

    // ── Session/round state ──
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [roundId, setRoundId] = useState<number | null>(null);
    const [selectedSong, setSelectedSong] = useState<Record<string, unknown> | null>(null);
    const [creating, setCreating] = useState(false);
    const sessionCreatedRef = useRef(false);

    // ── Create session on mount ──
    useEffect(() => {
        if (!userId || sessionCreatedRef.current) return;
        sessionCreatedRef.current = true;
        dkLog('QUICK-KARAOKE', 'Step 1 — creating karaoke session', { userId });

        postAddSession({
            name: t("quickKaraoke.sessionName", "Quick Karaoke"),
        })
            .then((res) => {
                if (res?.sessionId) {
                    setSessionId(res.sessionId);
                    dkLog('QUICK-KARAOKE', 'Step 1 ✓ — session created', { sessionId: res.sessionId });
                    log.debug("Created quick session:", res.sessionId);
                } else {
                    dkLog('QUICK-KARAOKE', 'Step 1 ✗ — no sessionId in response', res);
                }
            })
            .catch((err) => {
                dkLog('QUICK-KARAOKE', 'Step 1 ✗ — session creation failed', err);
                log.error("Failed to create session:", err);
                showToast(
                    t("quickKaraoke.createError", "Failed to create karaoke session"),
                    "error",
                );
            });
    }, [userId, t, showToast]);

    // ── Song selected → create round ──
    const handleSongPlay = useCallback(
        async (songId: number) => {
            dkLog('QUICK-KARAOKE', 'Step 2 — song selected', { songId, sessionId });
            if (!sessionId) {
                dkLog('QUICK-KARAOKE', 'Step 2 ✗ — session not ready yet', { sessionId, songId });
                showToast(
                    t("quickKaraoke.waitSession", "Creating session, please wait..."),
                    "info",
                );
                return;
            }
            if (creating) return;
            setCreating(true);

            try {
                dkLog('QUICK-KARAOKE', 'Step 3 — fetching song data', { songId });
                const fullSong = await getSongById(songId);
                if (!fullSong?.title) {
                    dkLog('QUICK-KARAOKE', 'Step 3 ✗ — song has no title', fullSong);
                    showToast(
                        t("quickKaraoke.fetchError", "Failed to load song data."),
                        "error",
                    );
                    return;
                }
                dkLog('QUICK-KARAOKE', 'Step 3 ✓ — song loaded', { id: fullSong.id, title: fullSong.title, notes: (fullSong.notes as unknown[])?.length ?? 0 });
                if (!Array.isArray(fullSong.notes) || fullSong.notes.length === 0) {
                    dkLog('QUICK-KARAOKE', 'Step 3 ⚠ — song has no notes (scoring disabled)', { songId: fullSong.id, title: fullSong.title });
                    showToast(
                        t("quickKaraoke.noNotes", "Song has no karaoke notes — can't score."),
                        "info",
                    );
                }

                // Create round
                dkLog('QUICK-KARAOKE', 'Step 4 — creating round', { sessionId, songId: fullSong.id ?? songId });
                const round = await postAddRound({
                    id: 0,
                    partyId: 0,
                    sessionId,
                    songId: fullSong.id ?? songId,
                    number: 1,
                    startTime: new Date().toISOString(),
                });

                const createdRoundId =
                    (round as typeof round & { roundId?: number }).roundId ??
                    round.id;
                dkLog('QUICK-KARAOKE', 'Step 4 ✓ — round created', { roundId: createdRoundId });

                // Also create a round part for scoring persistence
                dkLog('QUICK-KARAOKE', 'Step 5 — creating round part', { roundId: createdRoundId });
                let roundPartId: number | null = null;
                try {
                    const partRes = await postAddRoundPart({
                        roundId: createdRoundId,
                        partNumber: 1,
                    });
                    roundPartId = partRes?.roundPartId ?? null;
                    dkLog('QUICK-KARAOKE', 'Step 5 ✓ — round part created', { roundPartId });
                } catch {
                    // Round part is optional — scoring still works
                    dkLog('QUICK-KARAOKE', 'Step 5 ⚠ — round part creation failed (non-critical, scoring still works)', { roundId: createdRoundId });
                    log.warn("Failed to create round part (non-critical)");
                }

                dkLog('QUICK-KARAOKE', 'Step 6 — opening JoinRoundPopup', { roundId: createdRoundId, sessionId });
                setRoundId(createdRoundId);
                setSelectedSong({
                    ...fullSong,
                    _roundPartId: roundPartId,
                } as unknown as Record<string, unknown>);

                log.debug(
                    "Created round",
                    createdRoundId,
                    "part",
                    roundPartId,
                    "for song",
                    fullSong.title,
                );
            } catch (err) {
                dkLog('QUICK-KARAOKE', 'Step 4/5 ✗ — round creation failed', err);
                log.error("Failed to create round:", err);
                showToast(
                    t("quickKaraoke.roundError", "Failed to prepare round."),
                    "error",
                );
            } finally {
                setCreating(false);
            }
        },
        [sessionId, creating, showToast, t],
    );

    // ── Play callback (from JoinRoundPopup) ──
    const handlePlay = useCallback(
        (playRoundId: number) => {
            dkLog('QUICK-KARAOKE', 'Step 7 — Play pressed, navigating to /rounds', { playRoundId, song: (selectedSong as Record<string, unknown>)?.title });
            if (!selectedSong) return;
            navigate("/rounds", {
                state: {
                    song: selectedSong,
                    gameMode: "normal",
                    roundId: playRoundId,
                    roundPartId:
                        (selectedSong as Record<string, unknown>)?._roundPartId ??
                        null,
                    partyId: null,
                    partyName: t("quickKaraoke.sessionName", "Quick Karaoke"),
                },
            });
        },
        [selectedSong, navigate, t],
    );

    // ── Close popup → allow picking another song ──
    const handlePopupHide = useCallback(() => {
        dkLog('QUICK-KARAOKE', 'popup closed — resetting round/song selection', { roundId, songTitle: (selectedSong as Record<string, unknown>)?.title });
        setRoundId(null);
        setSelectedSong(null);
    }, []);

    // ── Guard: not logged in ──
    if (!userId) {
        return (
            <div className="container mt-4 text-center">
                <p>{t("quickKaraoke.loginRequired", "Please sign in to use Quick Karaoke.")}</p>
            </div>
        );
    }

    return (
        <div className="container-fluid mt-3" style={{ maxWidth: 1400 }}>
            {/* ── Header ── */}
            <div
                className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3"
                style={{ padding: "0 8px" }}
            >
                <h4 className="mb-0" style={{ fontWeight: 700 }}>
                    🎤 {t("quickKaraoke.title", "Quick Karaoke")}
                </h4>

                {/* ── Difficulty selector ── */}
                <div className="d-flex align-items-center gap-2">
                    <label
                        htmlFor="qk-difficulty"
                        style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap" }}
                    >
                        {t("karaoke.difficulty", "Difficulty")}:
                    </label>
                    <select
                        id="qk-difficulty"
                        className="form-select form-select-sm"
                        style={{ width: 130 }}
                        value={difficulty}
                        onChange={(e) =>
                            setDifficulty(e.target.value as Difficulty)
                        }
                    >
                        <option value="easy">
                            {t("karaoke.difficulties.easy", "Easy")}
                        </option>
                        <option value="normal">
                            {t("karaoke.difficulties.normal", "Normal")}
                        </option>
                        <option value="hard">
                            {t("karaoke.difficulties.hard", "Hard")}
                        </option>
                    </select>
                </div>
            </div>

            {/* ── Status bar ── */}
            {!sessionId && (
                <div className="alert alert-info d-flex align-items-center gap-2 py-2">
                    <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                    />
                    {t(
                        "quickKaraoke.creatingSession",
                        "Creating karaoke session...",
                    )}
                </div>
            )}

            {creating && (
                <div className="alert alert-info d-flex align-items-center gap-2 py-2">
                    <div
                        className="spinner-border spinner-border-sm"
                        role="status"
                    />
                    {t("quickKaraoke.preparingRound", "Preparing round...")}
                </div>
            )}

            {/* ── Song browser (reused) ── */}
            <KaraokeSongBrowser
                onPlay={handleSongPlay}
                disabled={!sessionId || creating}
                disabledReason={
                    !sessionId
                        ? t(
                              "quickKaraoke.waitSession",
                              "Creating session, please wait...",
                          )
                        : creating
                          ? t(
                                "quickKaraoke.preparingRound",
                                "Preparing round...",
                            )
                          : undefined
                }
            />

            {/* ── Join popup (reused from PartyPage) ── */}
            {roundId != null && (
                <JoinRoundPopup
                    show
                    onHide={handlePopupHide}
                    roundId={roundId}
                    sessionId={sessionId}
                    partyId={0}
                    onPlay={handlePlay}
                />
            )}
        </div>
    );
};

export default QuickKaraokeJoinPage;
