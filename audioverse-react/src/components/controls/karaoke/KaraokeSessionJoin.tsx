/**
 * KaraokeSessionJoin — player/mic setup, game mode, difficulty, and session
 * preparation panel. Extracted from KaraokeSongBrowser so the browser can
 * focus purely on song listing.
 *
 * Renders:
 *   • KaraokeSettingsPanel (players, mics, mode, difficulty)
 *   • Microphone / input warnings
 *   • SongSelectionModeManager (when >1 player)
 *   • Optional party status tools (collapsible)
 */
import React, { useState, useCallback } from "react";
import KaraokeSettingsPanel from "./KaraokeSettingsPanel";
import { useGameContext } from "../../../contexts/GameContext";
import { useAudioContext } from "../../../contexts/AudioContext";
import type { SongSelectionMode } from "../../../models/modelsKaraoke";
import SongSelectionModeManager from "./SongSelectionModeManager";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// ── Public callback types ──

export interface SessionJoinState {
    /** Currently active song-selection mode */
    selectionMode: SongSelectionMode;
    /** Index of the player whose turn it is (-1 = all) */
    activePickerIndex: number;
    /** Whether every player has a mic assigned */
    allMicsAssigned: boolean;
    /** True when no input devices detected at all */
    noInputDevices: boolean;
}

interface Props {
    /** Called whenever the session-join state changes so the parent (or sibling SongBrowser) can react */
    onChange?: (state: SessionJoinState) => void;
    /** Render variant — 'bar' is compact (default), 'card' has more padding */
    variant?: "bar" | "card";
}

const KaraokeSessionJoin: React.FC<Props> = ({ onChange, variant = "bar" }) => {
    const { t } = useTranslation();
    const { state } = useGameContext();
    const { audioInputs } = useAudioContext();

    const noInputDevices = !audioInputs || audioInputs.length === 0;
    const anyPlayerWithoutMic = state.players.some((p) => !p.micId);
    const allMicsAssigned = !anyPlayerWithoutMic;

    // ── Song selection mode ──
    const [selectionMode, setSelectionMode] = useState<SongSelectionMode>("freeForAll");
    const [activePickerIndex, setActivePickerIndex] = useState<number>(-1);

    const emitChange = useCallback(
        (mode: SongSelectionMode, pickerIdx: number) => {
            onChange?.({
                selectionMode: mode,
                activePickerIndex: pickerIdx,
                allMicsAssigned,
                noInputDevices,
            });
        },
        [onChange, allMicsAssigned, noInputDevices],
    );

    const handleModeChange = useCallback(
        (mode: SongSelectionMode) => {
            setSelectionMode(mode);
            emitChange(mode, activePickerIndex);
        },
        [emitChange, activePickerIndex],
    );

    const handleActivePlayerChange = useCallback(
        (idx: number) => {
            setActivePickerIndex(idx);
            emitChange(selectionMode, idx);
        },
        [emitChange, selectionMode],
    );

    const isCard = variant === "card";

    return (
        <div
            style={{
                marginBottom: 16,
                ...(isCard
                    ? { background: "var(--bg-secondary, #1a1a2e)", borderRadius: 12, padding: 16 }
                    : {}),
            }}
        >
            {/* Settings bar: mode, difficulty, players, mics */}
            <KaraokeSettingsPanel variant="minimal" />

            {/* Warnings */}
            <AnimatePresence>
                {noInputDevices && (
                    <motion.div
                        key="no-mic"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            background: "#ff4444",
                            color: "#fff",
                            padding: 12,
                            borderRadius: 8,
                            fontWeight: 700,
                            marginTop: 8,
                            fontSize: 16,
                            textAlign: "center",
                        }}
                    >
                        {t("karaokeSessionJoin.noInputDevices")}
                        <br />
                        {t("karaokeSessionJoin.noInputDevicesHint")}
                    </motion.div>
                )}
                {!noInputDevices && anyPlayerWithoutMic && (
                    <motion.div
                        key="unassigned-mic"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            background: "#ff9800",
                            color: "#222",
                            padding: 10,
                            borderRadius: 8,
                            fontWeight: 700,
                            marginTop: 8,
                            fontSize: 14,
                            textAlign: "center",
                        }}
                    >
                        {t("karaokeSessionJoin.assignMicWarning")}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Song selection mode (multi-player only) */}
            {state.players.length > 1 && (
                <div style={{ marginTop: 12 }}>
                    <SongSelectionModeManager
                        players={state.players}
                        mode={selectionMode}
                        onModeChange={handleModeChange}
                        onActivePlayerChange={handleActivePlayerChange}
                        turnTimeSec={30}
                        hostIndex={0}
                    />
                </div>
            )}
        </div>
    );
};

export default KaraokeSessionJoin;
