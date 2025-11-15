// src/components/pages/LibraryPage.tsx
import React from "react";
import { LibraryList } from "../../components/controls/library/LibraryList/LibraryList.tsx";
import GenericPlayer from "../../components/controls/player/GenericPlayer";
import type { PlayerTrack } from "../../models/modelsAudio";

/// Simple modal wrapper for dialogs.
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-[min(100%,900px)] max-h-[90vh] rounded-2xl bg-white shadow-xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
            </div>
            {children}
        </div>
    </div>
);

/// LibraryManager page that fetches data via hooks and renders playable lists.
const LibraryPage: React.FC = () => {
    /// Player modal visibility flag.
    const [playerOpen, setPlayerOpen] = React.useState(false);
    /// Current playlist for the GenericPlayer.
    const [playerTracks, setPlayerTracks] = React.useState<PlayerTrack[]>([]);

    /// Open the player immediately with provided tracks.
    const handlePlayNow = (tracks: PlayerTrack[]) => {
        if (tracks.length === 0) return;
        setPlayerTracks(tracks);
        setPlayerOpen(true);
    };

    /// Add tracks to the current queue (append).
    const handleAddToQueue = (tracks: PlayerTrack[]) => {
        if (tracks.length === 0) return;
        setPlayerTracks(prev => prev.concat(tracks));
        setPlayerOpen(true);
    };

    /// No-op: descriptors can be handled by higher-level playlist feature.
    const handleAddDescriptors = () => {
        // Intentionally left blank – wire to playlist feature if needed.
    };

    return (
        <div className="w-full mx-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Library</h1>
                <div className="text-sm text-gray-500">source: API</div>
            </div>

            <LibraryList
                onPlayNow={handlePlayNow}
                onAddToQueue={handleAddToQueue}
                onAddDescriptors={handleAddDescriptors}
            />

            {playerOpen && (
                <Modal title="Player" onClose={() => setPlayerOpen(false)}>
                    <GenericPlayer
                        tracks={playerTracks}
                        initialIndex={0}
                        autoPlay
                        height={360}
                        uiMode="minimal"
                    />
                </Modal>
            )}
        </div>
    );
};

export default LibraryPage;
