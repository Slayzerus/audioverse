// src/components/library/LibraryList/SearchBar.tsx
import * as React from "react";
import { rowBtn } from "../../../../utils/libraryStyles.ts";

/// Props for a searchable toolbar with a clear-selection button.
type SearchBarProps = {
    /// Placeholder displayed in the input.
    placeholder: string;
    /// Current input value.
    value: string;
    /// Change handler for the input.
    onChange: (v: string) => void;
    /// Handler to clear current selection map.
    onClearSelection: () => void;
};

/// Search input with a clear-selection button aligned to the right.
export const LibraryListSearchBar: React.FC<SearchBarProps> = ({
                                                        placeholder,
                                                        value,
                                                        onChange,
                                                        onClearSelection,
                                                    }) => {
    return (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    flex: 1,
                    border: "1px solid #d1d5db",
                    borderRadius: 8,
                    padding: "6px 10px",
                }}
            />
            <button type="button" style={rowBtn} onClick={onClearSelection}>
                Wyczyść zazn.
            </button>
        </div>
    );
};
