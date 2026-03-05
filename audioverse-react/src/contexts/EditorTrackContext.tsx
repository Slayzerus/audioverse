/**
 * EditorTrackContext — shared state for all LayerTrack instances.
 *
 * Instead of passing 46 props through AudioEditor → LayerTrack,
 * the context provides the 36 props that are identical across all tracks.
 * LayerTrack only receives ~10 per-instance props directly.
 */
import React, { createContext, useContext, useMemo } from "react";
import type { ClipId, EffectType, LayerSettings } from "../models/editor/audioTypes";
import type { MidiNote } from "../models/editor/midiTypes";
import type { SnapMode } from "../models/editor/timelineTypes";
import type { AudioLayer } from "../models/modelsEditor";

/** Shared editor state consumed by all LayerTrack instances */
export interface EditorTrackContextValue {
    // Transport
    isPlaying: boolean;
    isRecording: boolean;
    currentTime: number;
    duration: number;
    bpm: number;
    // Config
    zoom: number;
    snapEnabled: boolean;
    snapMode: SnapMode;
    // Display flags
    showLayerEffects: boolean;
    showMidiPianoRoll: boolean;
    showLayerDragReorder: boolean;
    // Selection
    isSoloMode: boolean;
    activeLayerId: number | undefined;
    selectedClip: { layerId: number; clipId: ClipId } | null;
    selectedClips: Set<string>;
    selectedMidiNote: { layerId: number; noteId: number } | null;
    // Layer actions (all take layerId as first arg — identical callbacks for every track)
    setActiveLayer: (l: AudioLayer) => void;
    addClipToLayer: (layerId: number) => void;
    handleDeleteLayer: (layerId: number) => void;
    handleToggleSolo: (layerId: number) => void;
    handleToggleMute: (layerId: number) => void;
    handleVolumeChange: (layerId: number, v: number) => void;
    handlePanChange: (layerId: number, v: number) => void;
    handleColorChange: (layerId: number, c: string) => void;
    handleGroupChange: (layerId: number, g: string) => void;
    handleToggleLock: (layerId: number) => void;
    updateLayerSetting: (layerId: number, patch: Partial<LayerSettings>) => void;
    // Drag
    handleDragStart: (layerId: number) => void;
    handleDragEnd: () => void;
    handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
    handleDrop: (e: React.DragEvent<HTMLDivElement>, targetId: number) => void;
    // Clip interaction
    handleClipDragStart: (e: React.MouseEvent, layerId: number, clipId: ClipId, mode: "move" | "resize-left" | "resize-right") => void;
    setSelectedClip: (v: { layerId: number; clipId: ClipId } | null) => void;
    makeClipSelectionId: (layerId: number, clipId: ClipId) => string;
    // Timeline
    handleSeek: (t: number) => void;
    handleZoomChange: (z: number) => void;
    // Effects
    addEffectToLayerWrapper: (layerId: number, type: EffectType) => void;
    removeEffectFromLayerWrapper: (layerId: number, effectId: string) => void;
    toggleEffectBypassWrapper: (layerId: number, effectId: string) => void;
    updateEffectParamsWrapper: (layerId: number, effectId: string, params: Record<string, number>) => void;
    // MIDI
    setLayerMidiNotes: React.Dispatch<React.SetStateAction<Record<number, MidiNote[]>>>;
    setSelectedMidiNote: (v: { layerId: number; noteId: number } | null) => void;
    handleSelectCCLaneWrapper: (layerId: number, cc: number) => void;
    handleAddCCEventWrapper: (layerId: number, cc: number, value: number, time: number) => void;
    handleUpdateCCEventWrapper: (layerId: number, id: number, value: number, time: number, handleType?: "linear" | "step" | "exp") => void;
    handleRemoveCCEventWrapper: (layerId: number, id: number) => void;
}

const EditorTrackContext = createContext<EditorTrackContextValue | null>(null);

export function useEditorTrack(): EditorTrackContextValue {
    const ctx = useContext(EditorTrackContext);
    if (!ctx) throw new Error("useEditorTrack must be used within EditorTrackProvider");
    return ctx;
}

export const EditorTrackProvider: React.FC<{ value: EditorTrackContextValue; children: React.ReactNode }> = ({ value, children }) => {
    // Memoize the context value to prevent unnecessary re-renders
    const memoized = useMemo(() => value, [
        value.isPlaying, value.isRecording, value.currentTime, value.duration, value.bpm,
        value.zoom, value.snapEnabled, value.snapMode,
        value.showLayerEffects, value.showMidiPianoRoll, value.showLayerDragReorder,
        value.isSoloMode, value.activeLayerId,
        value.selectedClip, value.selectedClips, value.selectedMidiNote,
        // Callbacks are assumed stable (from useAudioEditor)
        value.setActiveLayer, value.addClipToLayer, value.handleDeleteLayer,
        value.handleToggleSolo, value.handleToggleMute, value.handleVolumeChange,
        value.handlePanChange, value.handleColorChange, value.handleGroupChange,
        value.handleToggleLock, value.updateLayerSetting,
        value.handleDragStart, value.handleDragEnd, value.handleDragOver, value.handleDrop,
        value.handleClipDragStart, value.setSelectedClip, value.makeClipSelectionId,
        value.handleSeek, value.handleZoomChange,
        value.addEffectToLayerWrapper, value.removeEffectFromLayerWrapper,
        value.toggleEffectBypassWrapper, value.updateEffectParamsWrapper,
        value.setLayerMidiNotes, value.setSelectedMidiNote,
        value.handleSelectCCLaneWrapper, value.handleAddCCEventWrapper,
        value.handleUpdateCCEventWrapper, value.handleRemoveCCEventWrapper,
    ]);

    return <EditorTrackContext.Provider value={memoized}>{children}</EditorTrackContext.Provider>;
};
