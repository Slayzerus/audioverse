// src/components/library/LibraryList/LibraryList.types.ts
import type { PlayerTrack } from "../../../../models/modelsAudio.ts";
import type { SongDescriptorDto } from "../../../../models/modelsPlaylists.ts";

/// Tab identifiers available in Library view.
export type Tab = "audio" | "ultrastar";

/// Props for the tabbed LibraryList view.
export type LibraryListProps = {
    /// Play selected audio tracks immediately.
    onPlayNow?: (tracks: PlayerTrack[]) => void;
    /// Add selected audio tracks to the queue.
    onAddToQueue?: (tracks: PlayerTrack[]) => void;
    /// Add selected items (audio or Ultrastar) as playlist descriptors.
    onAddDescriptors?: (songs: SongDescriptorDto[]) => void;
};
