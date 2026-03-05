import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Badge, Button, ProgressBar } from "react-bootstrap";
import type { SongSelectionMode } from "../../../models/modelsKaraoke";
import type { Player as GamePlayer } from "../../../models/game/modelsGame";

/* ────────────────────────────────────────────────────────────
   SongSelectionModeManager
   Manages turn-based & free-for-all song selection in the
   karaoke song browser.

   Modes:
   - freeForAll  – any player can pick a song at any time (default)
   - roundRobin  – players pick in order; a turn timer shows who's up
   - hostOnly    – only the party host can pick songs
   - firstCome   – countdown then race; first player to confirm wins
   ──────────────────────────────────────────────────────────── */

export interface SongSelectionModeManagerProps {
    players: GamePlayer[];
    mode: SongSelectionMode;
    onModeChange?: (mode: SongSelectionMode) => void;
    /** Seconds per turn in roundRobin mode (0 = no limit). */
    turnTimeSec?: number;
    /** Index in `players` of current host / organizer (-1 = none). */
    hostIndex?: number;
    /** Called when a player is allowed to pick (index). */
    onActivePlayerChange?: (playerIndex: number) => void;
    /** Optional: the current user's player index. Used for visual feedback. */
    myPlayerIndex?: number;
}

const MODE_ICONS: Record<SongSelectionMode, string> = {
    freeForAll: "🎲",
    roundRobin: "🔄",
    hostOnly: "👑",
    firstCome: "⚡",
};

const MODE_COLORS: Record<SongSelectionMode, string> = {
    freeForAll: "success",
    roundRobin: "warning",
    hostOnly: "info",
    firstCome: "danger",
};

export const SongSelectionModeManager: React.FC<SongSelectionModeManagerProps> = ({
    players,
    mode,
    onModeChange,
    turnTimeSec = 30,
    hostIndex = 0,
    onActivePlayerChange,
    myPlayerIndex,
}) => {
    const { t } = useTranslation();

    const MODE_LABELS: Record<SongSelectionMode, string> = {
        freeForAll: t('songSelection.freeForAll', 'Free for all'),
        roundRobin: t('songSelection.roundRobin', 'Round robin'),
        hostOnly: t('songSelection.hostOnly', 'Host only'),
        firstCome: t('songSelection.firstCome', 'First come'),
    };

    // ── Round-robin state ──
    const [currentTurn, setCurrentTurn] = useState(0);
    const [timeLeft, setTimeLeft] = useState(turnTimeSec);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── First-come race state ──
    const [countdown, setCountdown] = useState<number | null>(null);  // 3,2,1,null
    const [raceOpen, setRaceOpen] = useState(false);
    const [raceWinnerIdx, setRaceWinnerIdx] = useState<number | null>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const activePlayerIndex = useMemo(() => {
        if (mode === "hostOnly") return hostIndex;
        if (mode === "roundRobin") return currentTurn % Math.max(1, players.length);
        if (mode === "firstCome") return raceOpen ? -1 : (raceWinnerIdx ?? -1);
        return -1; // freeForAll — all players active
    }, [mode, currentTurn, players.length, hostIndex, raceOpen, raceWinnerIdx]);

    // Notify parent of active player
    useEffect(() => {
        onActivePlayerChange?.(activePlayerIndex);
    }, [activePlayerIndex, onActivePlayerChange]);

    // Timer for roundRobin
    useEffect(() => {
        if (mode !== "roundRobin" || turnTimeSec <= 0) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        setTimeLeft(turnTimeSec);
        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Auto-advance to next player
                    setCurrentTurn((t) => t + 1);
                    return turnTimeSec;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [mode, turnTimeSec, currentTurn]);

    // Start firstCome countdown
    const startRace = useCallback(() => {
        setRaceWinnerIdx(null);
        setRaceOpen(false);
        setCountdown(3);
        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev === null || prev <= 1) {
                    if (countdownRef.current) clearInterval(countdownRef.current);
                    setRaceOpen(true);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // Clean up countdown interval
    useEffect(() => {
        return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }, []);

    // Reset race when switching modes
    useEffect(() => {
        if (mode !== 'firstCome') {
            setCountdown(null);
            setRaceOpen(false);
            setRaceWinnerIdx(null);
        }
    }, [mode]);

    /** Manually advance turn (e.g. after song pick). */
    const advanceTurn = useCallback(() => {
        setCurrentTurn((t) => t + 1);
        setTimeLeft(turnTimeSec);
    }, [turnTimeSec]);

    const activePlayer = activePlayerIndex >= 0 && activePlayerIndex < players.length
        ? players[activePlayerIndex]
        : null;

    return (
        <div
            style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
                padding: "8px 12px",
                background: "var(--surface-dark, #1a1a2e)",
                borderRadius: 10,
                border: "1px solid var(--border-secondary, #333)",
                marginBottom: 12,
            }}
        >
            {/* Mode selector */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(["freeForAll", "roundRobin", "hostOnly", "firstCome"] as SongSelectionMode[]).map((m) => (
                    <Button
                        key={m}
                        size="sm"
                        variant={mode === m ? MODE_COLORS[m] : "outline-secondary"}
                        onClick={() => onModeChange?.(m)}
                        style={{ fontSize: 12, padding: "2px 8px" }}
                    >
                        {MODE_ICONS[m]} {MODE_LABELS[m]}
                    </Button>
                ))}
            </div>

            {/* Active player indicator */}
            {mode !== "freeForAll" && mode !== "firstCome" && activePlayer && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Badge bg={activePlayerIndex === myPlayerIndex ? "success" : "secondary"}>
                        🎤 {activePlayer.name || `Gracz ${activePlayerIndex + 1}`}
                    </Badge>
                    {activePlayerIndex === myPlayerIndex && (
                        <span style={{ color: "var(--success, #4caf50)", fontSize: 12, fontWeight: 600 }}>
                            Twoja kolej!
                        </span>
                    )}
                </div>
            )}

            {/* Timer for roundRobin */}
            {mode === "roundRobin" && turnTimeSec > 0 && (
                <div style={{ flex: 1, minWidth: 120, maxWidth: 200 }}>
                    <ProgressBar
                        now={(timeLeft / turnTimeSec) * 100}
                        variant={timeLeft <= 5 ? "danger" : timeLeft <= 10 ? "warning" : "info"}
                        label={`${timeLeft}s`}
                        style={{ height: 16, fontSize: 11 }}
                        animated={timeLeft <= 5}
                    />
                </div>
            )}

            {/* Manual advance button (roundRobin) */}
            {mode === "roundRobin" && (
                <Button
                    size="sm"
                    variant="outline-light"
                    onClick={advanceTurn}
                    style={{ fontSize: 11, padding: "2px 8px" }}
                >
                    Następny ▶
                </Button>
            )}

            {/* First-come race controls */}
            {mode === "firstCome" && (
                <>
                    {countdown !== null && (
                        <div style={{
                            fontSize: 32, fontWeight: 900, color: "var(--danger, #f44336)",
                            animation: "pulse 0.5s ease-in-out",
                            minWidth: 60, textAlign: "center",
                        }}>
                            {countdown}
                        </div>
                    )}
                    {raceOpen && raceWinnerIdx === null && (
                        <Badge bg="danger" style={{ fontSize: 14, padding: "6px 12px" }}>
                            ⚡ {t('songSelection.raceGo', 'GO! Pick a song!')}
                        </Badge>
                    )}
                    {raceWinnerIdx !== null && raceWinnerIdx < players.length && (
                        <Badge bg="success" style={{ fontSize: 14, padding: "6px 12px" }}>
                            🏆 {players[raceWinnerIdx].name || `Player ${raceWinnerIdx + 1}`} {t('songSelection.raceWon', 'picks!')}
                        </Badge>
                    )}
                    <Button
                        size="sm"
                        variant={countdown !== null ? "secondary" : "danger"}
                        onClick={startRace}
                        disabled={countdown !== null}
                        style={{ fontSize: 12, padding: "4px 12px" }}
                    >
                        {raceWinnerIdx !== null ? t('songSelection.raceAgain', '🔄 New race') : t('songSelection.raceStart', '⚡ Start race')}
                    </Button>
                </>
            )}
        </div>
    );
};

/** Hook helper: check if given player index can currently pick a song. */
export function useCanPickSong(
    mode: SongSelectionMode,
    activePlayerIndex: number,
    hostIndex: number,
    playerIndex: number,
): boolean {
    return useMemo(() => {
        if (mode === "freeForAll") return true;
        if (mode === "firstCome") return activePlayerIndex === -1; // race is open for all
        if (mode === "hostOnly") return playerIndex === hostIndex;
        if (mode === "roundRobin") return playerIndex === activePlayerIndex;
        return false;
    }, [mode, activePlayerIndex, hostIndex, playerIndex]);
}

export default SongSelectionModeManager;
