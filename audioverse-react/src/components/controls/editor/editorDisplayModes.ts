/**
 * AudioEditor display modes — progressive complexity levels.
 *
 * Fun        – Minimal playback & layers (explore mode)
 * Beginner   – Adds auto-save, undo/redo, zoom/snap
 * Mid        – Adds recording, clip editing, project settings
 * Expert     – Adds Master FX, effects chain, MIDI
 * Master     – Everything visible (full DAW mode)
 */

export type EditorDisplayMode = 'fun' | 'beginner' | 'mid' | 'expert' | 'master';

export interface DisplayModeConfig {
    label: string;
    description: string;
    /** Sidebar panel visibility flags */
    showAutoSave: boolean;
    showUndoRedo: boolean;
    showSaveLoad: boolean;
    showProjectSettings: boolean;
    showSectionSettings: boolean;
    showZoomSnap: boolean;
    showMasterFX: boolean;
    showAdvancedEditing: boolean;
    showRecordingOptions: boolean;
    showClipOperations: boolean;
    showMiniMap: boolean;
    showLayerEffects: boolean;
    showMidiPianoRoll: boolean;
    showTemplateButtons: boolean;
    showImportExport: boolean;
    showLayerDragReorder: boolean;
    showMidiAutomation: boolean;
}

export const DISPLAY_MODES: Record<EditorDisplayMode, DisplayModeConfig> = {
    fun: {
        label: '🎵 Fun',
        description: 'Minimal – odtwarzaj, przeglądaj warstwy',
        showAutoSave: false,
        showUndoRedo: false,
        showSaveLoad: false,
        showProjectSettings: false,
        showSectionSettings: false,
        showZoomSnap: false,
        showMasterFX: false,
        showAdvancedEditing: false,
        showRecordingOptions: false,
        showClipOperations: false,
        showMiniMap: false,
        showLayerEffects: false,
        showMidiPianoRoll: false,
        showTemplateButtons: false,
        showImportExport: false,
        showLayerDragReorder: false,
        showMidiAutomation: false,
    },
    beginner: {
        label: '🟢 Beginner',
        description: 'Adds: undo/redo, zoom, snap',
        showAutoSave: true,
        showUndoRedo: true,
        showSaveLoad: false,
        showProjectSettings: false,
        showSectionSettings: false,
        showZoomSnap: true,
        showMasterFX: false,
        showAdvancedEditing: false,
        showRecordingOptions: false,
        showClipOperations: false,
        showMiniMap: true,
        showLayerEffects: false,
        showMidiPianoRoll: false,
        showTemplateButtons: false,
        showImportExport: false,
        showLayerDragReorder: false,
        showMidiAutomation: false,
    },
    mid: {
        label: '🟡 Mid',
        description: 'Adds: recording, clip editing, save',
        showAutoSave: true,
        showUndoRedo: true,
        showSaveLoad: true,
        showProjectSettings: true,
        showSectionSettings: true,
        showZoomSnap: true,
        showMasterFX: false,
        showAdvancedEditing: false,
        showRecordingOptions: true,
        showClipOperations: true,
        showMiniMap: true,
        showLayerEffects: false,
        showMidiPianoRoll: false,
        showTemplateButtons: false,
        showImportExport: false,
        showLayerDragReorder: true,
        showMidiAutomation: false,
    },
    expert: {
        label: '🔵 Expert',
        description: 'Adds: Master FX, effects, MIDI',
        showAutoSave: true,
        showUndoRedo: true,
        showSaveLoad: true,
        showProjectSettings: true,
        showSectionSettings: true,
        showZoomSnap: true,
        showMasterFX: true,
        showAdvancedEditing: true,
        showRecordingOptions: true,
        showClipOperations: true,
        showMiniMap: true,
        showLayerEffects: true,
        showMidiPianoRoll: true,
        showTemplateButtons: false,
        showImportExport: false,
        showLayerDragReorder: true,
        showMidiAutomation: true,
    },
    master: {
        label: '🔴 Master',
        description: 'Wszystko widoczne — pełny DAW',
        showAutoSave: true,
        showUndoRedo: true,
        showSaveLoad: true,
        showProjectSettings: true,
        showSectionSettings: true,
        showZoomSnap: true,
        showMasterFX: true,
        showAdvancedEditing: true,
        showRecordingOptions: true,
        showClipOperations: true,
        showMiniMap: true,
        showLayerEffects: true,
        showMidiPianoRoll: true,
        showTemplateButtons: true,
        showImportExport: true,
        showLayerDragReorder: true,
        showMidiAutomation: true,
    },
};

export const DISPLAY_MODE_ORDER: EditorDisplayMode[] = ['fun', 'beginner', 'mid', 'expert', 'master'];

const STORAGE_KEY = 'audioEditor.displayMode';

export function loadDisplayMode(): EditorDisplayMode {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in DISPLAY_MODES) return stored as EditorDisplayMode;
    return 'mid';
}

export function saveDisplayMode(mode: EditorDisplayMode): void {
    localStorage.setItem(STORAGE_KEY, mode);
}
