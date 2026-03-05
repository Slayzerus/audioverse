// src/components/library/LibraryList/ActionBar.tsx
import * as React from "react";
import { useTranslation } from 'react-i18next';
import { rowBtn } from "../../../../utils/libraryStyles.ts";

/// Props for the top-right action bar.
type ActionBarProps = {
    /// Whether the Audio tab is active (actions depend on this).
    isAudioTab: boolean;
    /// Number of audio tracks currently selected (for player actions).
    selectedTracksCount: number;
    /// Number of descriptors selected (audio or ultrastar).
    selectedDescriptorsCount: number;
    /// Play selected audio tracks immediately.
    onPlayNow?: () => void;
    /// Add selected audio tracks to the queue.
    onAddToQueue?: () => void;
    /// Add selected items (audio or Ultrastar) as playlist descriptors.
    onAddDescriptors?: () => void;
};

/// Right-aligned actions: Play now, Queue, Add to playlist.
export const ActionBar: React.FC<ActionBarProps> = ({
                                                        isAudioTab,
                                                        selectedTracksCount,
                                                        selectedDescriptorsCount,
                                                        onPlayNow,
                                                        onAddToQueue,
                                                        onAddDescriptors,
                                                    }) => {
    const { t } = useTranslation();
    return (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
                type="button"
                style={{ ...rowBtn, borderColor: "#4f46e5", color: "#4f46e5" }}
                disabled={!isAudioTab || selectedTracksCount === 0}
                onClick={onPlayNow}
            >
                {t('libraryActions.playNow', 'Play now')} ({selectedTracksCount})
            </button>
            <button
                type="button"
                style={rowBtn}
                disabled={!isAudioTab || selectedTracksCount === 0}
                onClick={onAddToQueue}
            >
                {t('libraryActions.addToQueue', 'Add to queue')} ({selectedTracksCount})
            </button>
            <button
                type="button"
                style={rowBtn}
                disabled={selectedDescriptorsCount === 0}
                onClick={onAddDescriptors}
            >
                {t('libraryActions.addToPlaylist', 'Add to playlist')} ({selectedDescriptorsCount})
            </button>
        </div>
    );
};
