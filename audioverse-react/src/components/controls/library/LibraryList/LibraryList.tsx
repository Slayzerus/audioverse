// src/components/library/LibraryList/LibraryList.tsx
import * as React from "react";
import { useAudioRecordsQuery } from "../../../../scripts/api/apiLibraryStream.ts";
import { useUltrastarSongsQuery } from "../../../../scripts/api/apiLibraryUltrastar.ts";
import { useSelection } from "../../../../hooks/useSelection.ts";
import { LibraryListTabs } from "./LibraryListTabs.tsx";
import { LibraryListSearchBar } from "./LibraryListSearchBar.tsx";
import { ActionBar } from "./LibraryListActionBar.tsx";
import { AudioList } from "./AudioList.tsx";
import { UltrastarList } from "../UltrastarList.tsx";
import { useFilteredAudio, useFilteredUltrastar } from "./LibraryList.logic.ts";
import { toDescAudio, toDescUltrastar, toTrack } from "../../../../utils/libraryMappers.ts";
import type { LibraryListProps, Tab } from "./LibraryList.types.ts";

/// Main tabbed list component for Audio and Ultrastar sources.
export const LibraryList: React.FC<LibraryListProps> = ({
                                                            onPlayNow,
                                                            onAddToQueue,
                                                            onAddDescriptors,
                                                        }) => {
    /// Currently active tab.
    const [tab, setTab] = React.useState<Tab>("audio");

    // AUDIO
    /// Query state for Audio filter.
    const [queryAudio, setQueryAudio] = React.useState("");
    /// Query hook for audio records.
    const qAudio = useAudioRecordsQuery({ staleTime: 60_000 });
    /// Audio selection map and helpers.
    const audioSel = useSelection();
    /// Audio records (fallback to empty array).
    const audioData = qAudio.data ?? [];
    /// Audio records filtered by query.
    const filteredAudio = useFilteredAudio(audioData, queryAudio);
    /// Selected audio records based on current filter.
    const selectedAudioRecords = React.useMemo(
        () => filteredAudio.filter((r) => audioSel.map[r.id || r.fileName]),
        [filteredAudio, audioSel.map]
    );
    /// Tracks mapped from selected audio records.
    const tracks = selectedAudioRecords.map(toTrack);
    /// Playlist descriptors from selected audio records.
    const audioDescs = selectedAudioRecords.map(toDescAudio);

    // ULTRASTAR
    /// Query state for Ultrastar filter.
    const [queryUs, setQueryUs] = React.useState("");
    /// Query hook for Ultrastar songs.
    const qUs = useUltrastarSongsQuery(undefined, true);
    /// Ultrastar selection map and helpers.
    const usSel = useSelection();
    /// Ultrastar items (fallback to empty array).
    const usData = qUs.data ?? [];
    /// Ultrastar items filtered by query.
    const filteredUs = useFilteredUltrastar(usData, queryUs);
    /// Selected Ultrastar items based on current filter.
    const selectedUsRecords = React.useMemo(
        () => filteredUs.filter((s) => usSel.map[s.filePath ?? s.title ?? ""]),
        [filteredUs, usSel.map]
    );
    /// Playlist descriptors from selected Ultrastar items.
    const usDescs = selectedUsRecords.map(toDescUltrastar);

    /// Handler: play selected audio now.
    const handlePlayNow = React.useCallback(() => {
        if (!tracks.length) return;
        onPlayNow?.(tracks);
    }, [tracks, onPlayNow]);

    /// Handler: add selected audio to queue.
    const handleAddToQueue = React.useCallback(() => {
        if (!tracks.length) return;
        onAddToQueue?.(tracks);
    }, [tracks, onAddToQueue]);

    /// Handler: add selected items to playlist descriptors.
    const handleAddDescriptors = React.useCallback(() => {
        const payload = tab === "audio" ? audioDescs : usDescs;
        if (!payload.length) return;
        onAddDescriptors?.(payload);
    }, [tab, audioDescs, usDescs, onAddDescriptors]);

    return (
        <div style={{ display: "grid", gap: 10 }}>
            <LibraryListTabs tab={tab} onChange={setTab} />

            {tab === "audio" ? (
                <LibraryListSearchBar
                    placeholder="Szukaj w bibliotece (Audio)…"
                    value={queryAudio}
                    onChange={setQueryAudio}
                    onClearSelection={audioSel.clear}
                />
            ) : (
                <LibraryListSearchBar
                    placeholder="Szukaj w Ultrastar…"
                    value={queryUs}
                    onChange={setQueryUs}
                    onClearSelection={usSel.clear}
                />
            )}

            <ActionBar
                isAudioTab={tab === "audio"}
                selectedTracksCount={tracks.length}
                selectedDescriptorsCount={
                    tab === "audio" ? audioDescs.length : usDescs.length
                }
                onPlayNow={handlePlayNow}
                onAddToQueue={handleAddToQueue}
                onAddDescriptors={handleAddDescriptors}
            />

            {tab === "audio" ? (
                <AudioList
                    items={filteredAudio}
                    selected={audioSel.map}
                    onToggle={audioSel.toggle}
                    isLoading={qAudio.isLoading}
                />
            ) : (
                <UltrastarList
                    items={filteredUs}
                    selected={usSel.map}
                    onToggle={usSel.toggle}
                    isLoading={qUs.isLoading}
                />
            )}
        </div>
    );
};

export default LibraryList;
