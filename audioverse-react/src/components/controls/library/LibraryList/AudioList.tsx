// src/components/library/LibraryList/AudioList.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { box } from "../../../../utils/libraryStyles.ts";
import { AudioRowItem } from "./LibraryListAudioItem.tsx";
import type { SongRecord } from "../../../../models/modelsAudio.ts";

/// Props for the virtualized table-like Audio list.
type AudioListProps = {
    /// Filtered audio records to render.
    items: SongRecord[];
    /// Map of selected rows by item identifier.
    selected: Record<string, boolean>;
    /// Toggle selection for a given item identifier.
    onToggle: (id: string) => void;
    /// Loading flag from the query hook.
    isLoading?: boolean;
};

/// Scrollable box with audio rows and loading/empty states.
export const AudioList: React.FC<AudioListProps> = ({
                                                        items,
                                                        selected,
                                                        onToggle,
                                                        isLoading,
                                                    }) => {
    const { t } = useTranslation();

    return (
        <div style={{ ...box, padding: 6, maxHeight: 420, overflow: "auto" }}>
            {isLoading && <div style={{ padding: 8, color: "#6b7280" }}>{t("common.loading")}</div>}
            {!isLoading && !items.length && (
                <div style={{ padding: 8, color: "#6b7280" }}>{t("libraryLists.noResults")}</div>
            )}

            <div style={{ overflowX: 'auto' }}><table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr>
                        <th scope="col" style={{ width: 28 }}>{t("libraryLists.select")}</th>
                        <th scope="col" style={{ width: 44 }}>{t("libraryLists.cover")}</th>
                        <th scope="col">{t("libraryLists.title")}</th>
                        <th scope="col">{t("libraryLists.format")}</th>
                    </tr>
                </thead>
                <tbody>
                {items.map((r) => {
                    const id = r.id || r.fileName;
                    const checked = !!selected[id];
                    return (
                        <AudioRowItem
                            key={id}
                            record={r}
                            checked={checked}
                            onToggle={() => onToggle(id)}
                        />
                    );
                })}
                </tbody>
            </table></div>
        </div>
    );
};
