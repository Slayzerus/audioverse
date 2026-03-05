import { useState, useEffect, useRef, useCallback } from "react";
import { AutoSaveMode } from "../../../../models/editor/fxTypes";
import type { AudioProject } from "../../../../models/modelsEditor";

/**
 * Hook managing auto-save behaviour for the AudioEditor.
 * Supports 'off', 'onChange', 'interval', and 'both' modes.
 */
export function useAutoSave(
    project: AudioProject | null,
    setStatusMessage: (msg: string) => void,
    setStatusType: (t: "success" | "error" | "") => void,
) {
    const [autoSaveMode, setAutoSaveMode] = useState<AutoSaveMode>("interval");
    const [autoSaveInterval, setAutoSaveInterval] = useState<number>(30);
    const autoSaveTimer = useRef<number | null>(null);

    const autoSaveProject = useCallback(() => {
        if (!project) return;
        try {
            localStorage.setItem("audioEditor.autoSave", JSON.stringify(project));
            setStatusMessage("Project auto-saved locally");
            setStatusType("success");
            setTimeout(() => setStatusMessage(""), 2000);
        } catch (e) {
            setStatusMessage("Auto-save error: " + (e as Error).message);
            setStatusType("error");
        }
    }, [project, setStatusMessage, setStatusType]);

    // Auto-save on change
    useEffect(() => {
        if (autoSaveMode === "onChange" || autoSaveMode === "both") {
            autoSaveProject();
        }
    }, [project, autoSaveMode, autoSaveProject]);

    // Auto-save on interval
    useEffect(() => {
        if (autoSaveTimer.current) {
            clearInterval(autoSaveTimer.current);
            autoSaveTimer.current = null;
        }
        if ((autoSaveMode === "interval" || autoSaveMode === "both") && autoSaveInterval > 0) {
            autoSaveTimer.current = window.setInterval(autoSaveProject, autoSaveInterval * 1000);
        }
        return () => {
            if (autoSaveTimer.current) {
                clearInterval(autoSaveTimer.current);
                autoSaveTimer.current = null;
            }
        };
    }, [autoSaveMode, autoSaveInterval, autoSaveProject]);

    return { autoSaveMode, setAutoSaveMode, autoSaveInterval, setAutoSaveInterval };
}
