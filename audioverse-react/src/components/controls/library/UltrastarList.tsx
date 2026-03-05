// src/components/library/LibraryList/UltrastarList.tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { box } from "../../../utils/libraryStyles";
import { UltrastarRowItem } from "./UltrastarRowItem";
import type { KaraokeSongFile } from "../../../models/modelsKaraoke";

/// Props for the virtualized table-like Ultrastar list.
type UltrastarListProps = {
    /// Filtered Ultrastar items to render.
    items: KaraokeSongFile[];
    /// Map of selected rows by item identifier.
    selected: Record<string, boolean>;
    /// Toggle selection for a given item identifier.
    onToggle: (id: string) => void;
    /// Loading flag from the query hook.
    isLoading?: boolean;
};

/// Scrollable box with Ultrastar rows and loading/empty states.
export const UltrastarList: React.FC<UltrastarListProps> = ({
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
                        <th scope="col">{t("libraryLists.title")}</th>
                        <th scope="col">{t("libraryLists.filePath")}</th>
                        <th scope="col" style={{ width: 50, textAlign: 'center' }}>{t("common.edit")}</th>
                    </tr>
                </thead>
                <tbody>
                {items.map((s) => {
                    const id = s.filePath ?? `${s.artist ?? ""} - ${s.title ?? ""}`;
                    const checked = !!selected[id];
                    return (
                        <UltrastarRowItem
                            key={id}
                            song={s}
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
