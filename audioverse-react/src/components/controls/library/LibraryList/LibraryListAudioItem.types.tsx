// src/components/library/LibraryList/AudioRowItem.types.ts
import type { SongRecord } from "../../../../models/modelsAudio.ts";

/// Props for a single Audio row item in the table.
export type LibraryListAudioItemProps = {
    /// Audio record displayed by the row.
    record: SongRecord;
    /// Whether the row is selected.
    checked: boolean;
    /// Toggle handler for row selection.
    onToggle: () => void;
};
