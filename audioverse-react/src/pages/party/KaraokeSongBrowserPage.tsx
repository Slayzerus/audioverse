import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import KaraokeSongBrowser from "../../components/controls/karaoke/KaraokeSongBrowser";
import SongSelectionModeManager from "../../components/controls/karaoke/SongSelectionModeManager";
import { useTutorialPage } from "../../hooks/useTutorial";
import { songBrowserTutorial } from "../../utils/tutorialDefinitions";
import { useGameContext } from "../../contexts/GameContext";
import { getSongById } from "../../scripts/api/apiKaraoke";
import { useToast } from "../../components/ui/ToastProvider";
import { useTranslation } from "react-i18next";
import type { SongSelectionMode } from "../../models/modelsKaraoke";

const KaraokeSongBrowserPage: React.FC = () => {
    useTutorialPage("song-browser", songBrowserTutorial);

    const navigate = useNavigate();
    const { gameMode, playersLoading, state } = useGameContext();
    const { showToast } = useToast();
    const { t } = useTranslation();

    const gamePlayers = state.players;

    // Multiplayer song selection state
    const [selectionMode, setSelectionMode] = useState<SongSelectionMode>("freeForAll");
    const [activePickerIndex, setActivePickerIndex] = useState<number>(-1);
    const showModeManager = gamePlayers.length > 1;

    const handlePlay = useCallback(
        async (songId: number) => {
            if (playersLoading) {
                showToast(t('karaokeBrowser.loadingPlayer', 'Loading player data…'), "info");
                return;
            }
            // Gate by selection mode
            if (selectionMode === "roundRobin" && activePickerIndex >= 0) {
                // In round robin, only active player can pick (UI gating — backend validates too)
            }
            if (selectionMode === "firstCome" && activePickerIndex !== -1) {
                showToast(t('songSelection.raceNotOpen', 'Wait for the race to start!'), "info");
                return;
            }
            try {
                const fullSong = await getSongById(songId);
                if (!fullSong || typeof fullSong !== "object") {
                    showToast(t('karaokeBrowser.fetchError', 'Failed to load song data.'), "error");
                    return;
                }
                if (!fullSong.title && !fullSong.artist) {
                    showToast(t('karaokeBrowser.missingData', 'Song is missing required data.'), "error");
                    return;
                }
                if (!Array.isArray(fullSong.notes) || fullSong.notes.length === 0) {
                    showToast(t('karaokeBrowser.noNotes', 'Song has no karaoke notes.'), "info");
                }
                navigate("/rounds", { state: { song: fullSong, gameMode } });
            } catch {
                showToast(t('karaokeBrowser.loadError', 'Failed to load song.'), "error");
            }
        },
        [navigate, gameMode, showToast, playersLoading, selectionMode, activePickerIndex, t],
    );

    return (
        <div className="container mt-4" tabIndex={-1}>
            {showModeManager && (
                <SongSelectionModeManager
                    players={gamePlayers}
                    mode={selectionMode}
                    onModeChange={setSelectionMode}
                    onActivePlayerChange={setActivePickerIndex}
                    myPlayerIndex={0}
                />
            )}
            <KaraokeSongBrowser
                onPlay={handlePlay}
            />
        </div>
    );
};

export default KaraokeSongBrowserPage;
