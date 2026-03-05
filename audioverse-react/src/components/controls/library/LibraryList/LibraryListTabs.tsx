// src/components/library/LibraryList/Tabs.tsx
import * as React from "react";
import { useTranslation } from 'react-i18next';
import { rowBtn } from "../../../../utils/libraryStyles.ts";
import type { Tab } from "./LibraryList.types.ts";

/// Props for the simple two-button tabs.
type TabsProps = {
    /// Currently active tab.
    tab: Tab;
    /// Change handler for active tab.
    onChange: (tab: Tab) => void;
};

/// Two-button tabs switching between Audio and Ultrastar views.
export const LibraryListTabs: React.FC<TabsProps> = ({ tab, onChange }) => {
    const { t } = useTranslation();
    const active = "#4f46e5";
    return (
        <div style={{ display: "flex", gap: 6 }}>
            <button
                type="button"
                style={{
                    ...rowBtn,
                    borderColor: tab === "audio" ? active : "#d1d5db",
                    color: tab === "audio" ? active : undefined,
                }}
                onClick={() => onChange("audio")}
            >
                {t('libraryTabs.audio', 'Audio')}
            </button>
            <button
                type="button"
                style={{
                    ...rowBtn,
                    borderColor: tab === "ultrastar" ? active : "#d1d5db",
                    color: tab === "ultrastar" ? active : undefined,
                }}
                onClick={() => onChange("ultrastar")}
            >
                {t('libraryTabs.ultrastar', 'Ultrastar')}
            </button>
        </div>
    );
};
