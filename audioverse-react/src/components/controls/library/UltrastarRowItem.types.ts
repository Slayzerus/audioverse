// src/components/library/LibraryList/UltrastarRowItem.types.ts
import type { KaraokeSongFile } from "../../../models/modelsKaraoke";

/// Props for a single Ultrastar row item in the table.
export type UltrastarRowItemProps = {
    /// Ultrastar file metadata.
    song: KaraokeSongFile;
    /// Whether the row is selected.
    checked: boolean;
    /// Toggle handler for row selection.
    onToggle: () => void;
};
