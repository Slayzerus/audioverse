// src/hooks/useSelection.ts
import * as React from "react";

/// Map-like selection state where keys are item identifiers.
export type SelectionMap = Record<string, boolean>;

/// Hook that manages a SelectionMap with toggle/clear helpers.
export const useSelection = () => {
    /// Internal selection state.
    const [map, setMap] = React.useState<SelectionMap>({});

    /// Toggle a single key in the selection.
    const toggle = React.useCallback((key: string) => {
        setMap((prev) => ({ ...prev, [key]: !prev[key] }));
    }, []);

    /// Replace the entire selection map.
    const set = React.useCallback((next: SelectionMap) => setMap(next), []);

    /// Clear all selected keys.
    const clear = React.useCallback(() => setMap({}), []);

    return { map, set, toggle, clear };
};
