import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import type { ClipRegion, EffectType, LayerSettings, ClipId } from "../../../models/editor/audioTypes";
import type { MidiNote, MidiCCEvent } from "../../../models/editor/midiTypes";
import type { SnapMode, WaveformData } from "../../../models/editor/timelineTypes";
import type { MasterEQPreset } from "../../../models/editor/fxTypes";
import { useToast } from "../../ui/ToastProvider";
import { useTutorial } from "../../../contexts/TutorialContext";
import { audioEditorTutorial } from "../../../utils/tutorialDefinitions";
import { THEME_KEY } from '../../../constants/ui';
import { useParams } from "react-router-dom";
import { getProjectDetails, addLayer, deleteLayer, updateLayer, updateProject, updateSection } from "../../../scripts/api/apiEditor";
import type { AudioProject, AudioSection, AudioLayer } from "../../../models/modelsEditor.ts";
import { AudioSourceType } from "../../../scripts/audioSource.ts";
import { AudioPlaybackEngine } from "../../../services/audioPlaybackEngine";
import { snapToGrid, mergeWaveforms, generatePlaceholderWaveform } from '../../../utils/audioTimelineUtils';
import {
    handleSelectCCLane,
    handleAddCCEvent,
    handleUpdateCCEvent,
    handleRemoveCCEvent
} from '../../../utils/audioMidiUtils';
import {
    addEffectToLayer,
    removeEffectFromLayer,
    toggleEffectBypass,
    updateEffectParams
} from '../../../utils/audioFxUtils';
import { LAYER_COLORS } from '../../../constants/audioColors';
import { setProjectWithUndo, handleUndo as importedHandleUndo, handleRedo as importedHandleRedo } from '../../../utils/undoRedoUtils';
import { useConfirm } from '../../ui/ConfirmProvider';
import { useAutoSave } from './hooks';
import { DISPLAY_MODES, loadDisplayMode, saveDisplayMode, type EditorDisplayMode } from './editorDisplayModes';
import { logger } from '../../../utils/logger';
import { useEditorRecording } from './useEditorRecording';
import { exportProject as exportProjectIO, importProject as importProjectIO, saveTemplate as saveTemplateIO, loadTemplate as loadTemplateIO } from './editorIO';

const log = logger.scoped('useAudioEditor');

export function useAudioEditor() {
    const confirm = useConfirm();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const { startTutorial, isTutorialCompleted, resetTutorials } = useTutorial();
    const { projectId } = useParams<{ projectId: string }>();

    // ── Display mode ──
    const [displayMode, setDisplayMode] = useState<EditorDisplayMode>(loadDisplayMode);
    const modeConfig = DISPLAY_MODES[displayMode];
    const handleDisplayModeChange = (m: EditorDisplayMode) => { setDisplayMode(m); saveDisplayMode(m); };

    // ── MIDI CC Lane state ──
    const [layerCCType, setLayerCCType] = useState<Record<number, number>>({});

    // ── Tutorial ──
    const launchEditorTutorial = () => {
        if (isTutorialCompleted('audio-editor')) resetTutorials();
        startTutorial({ pageId: 'audio-editor', steps: audioEditorTutorial });
    };

    useEffect(() => {
        if (!isTutorialCompleted('audio-editor')) {
            const timeout = setTimeout(() => {
                startTutorial({ pageId: 'audio-editor', steps: audioEditorTutorial });
            }, 800);
            return () => clearTimeout(timeout);
        }
        // Mount-only: auto-start tutorial on first visit
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Master EQ presets ──
    const [masterEQPresets] = useState<MasterEQPreset[]>([
        { name: 'Flat', type: 'peaking', frequency: 1000, q: 0.7, gain: 0 },
        { name: 'Bass Boost', type: 'lowshelf', frequency: 200, q: 0.7, gain: 6 },
        { name: 'Vocal Presence', type: 'peaking', frequency: 3000, q: 1.5, gain: 4 },
        { name: 'Bright', type: 'highshelf', frequency: 6000, q: 0.7, gain: 5 },
        { name: 'De-Esser', type: 'peaking', frequency: 8000, q: 2.0, gain: -6 }
    ]);

    // ── Clip / edit state ──
    const [clipboardClip, setClipboardClip] = useState<ClipRegion | null>(null);
    const [rippleMode, setRippleMode] = useState(false);
    const dragLayerId = useRef<number | null>(null);
    const clipDragRef = useRef<{
        layerId: number;
        clipId: ClipId;
        mode: 'move' | 'resize-left' | 'resize-right';
        startX: number;
        originalStart: number;
        originalDuration: number;
    } | null>(null);
    const [selectedMidiNote, setSelectedMidiNote] = useState<{ layerId: number; noteId: number } | null>(null);

    // ── Core project state ──
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [project, setProject] = useState<AudioProject | null>(null);
    const [undoStack, setUndoStack] = useState<AudioProject[]>([]);
    const [redoStack, setRedoStack] = useState<AudioProject[]>([]);
    const [activeSection, setActiveSection] = useState<AudioSection | null>(null);
    const [layers, setLayers] = useState<AudioLayer[]>([]);
    const [activeLayer, setActiveLayer] = useState<AudioLayer | null>(null);
    const [projectName, setProjectName] = useState<string>("");
    const [projectIsTemplate, setProjectIsTemplate] = useState<boolean>(false);
    const [projectVolume, setProjectVolume] = useState<string>("");
    const [sectionName, setSectionName] = useState<string>("");
    const [_statusMessage, setStatusMessage] = useState<string>("");
    const [_statusType, setStatusType] = useState<"success" | "error" | "">("");
    const { autoSaveMode, setAutoSaveMode, autoSaveInterval, setAutoSaveInterval } = useAutoSave(project, setStatusMessage, setStatusType);

    // ── Layer state ──
    const [layerSettings, setLayerSettings] = useState<Record<number, LayerSettings>>({});
    const [layerClips, setLayerClips] = useState<Record<number, ClipRegion[]>>({});
    const [layerMidiNotes, setLayerMidiNotes] = useState<Record<number, MidiNote[]>>({});
    const [selectedClip, setSelectedClip] = useState<{ layerId: number; clipId: ClipId } | null>(null);

    // ── Zoom / Snap ──
    const [zoom, setZoom] = useState(1);
    const [uiZoom, setUiZoom] = useState(2);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [snapMode, setSnapMode] = useState<SnapMode>('beat');

    // ── Master FX ──
    const [masterVolume, setMasterVolume] = useState(0.8);
    const [filterType, setFilterType] = useState<BiquadFilterType>('peaking');
    const [filterFreq, setFilterFreq] = useState(1200);
    const [filterQ, setFilterQ] = useState(0.7);
    const [filterGain, setFilterGain] = useState(0);
    const [customPresets, setCustomPresets] = useState<MasterEQPreset[]>([]);

    // ── Multi-select / waveform ──
    const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());
    const [waveforms, setWaveforms] = useState<Record<number, WaveformData>>({});
    const [sectionOrder, setSectionOrder] = useState<string>("");
    const [layerMidiCC, setLayerMidiCC] = useState<Record<number, MidiCCEvent[]>>({});

    // ── Playback ──
    const playbackEngine = useRef<AudioPlaybackEngine | null>(null);
    const [isPlaying, _setIsPlaying] = useState(false);
    const [currentTime, _setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(10);
    const [isLooping, setIsLooping] = useState(false);
    const [bpm, setBpm] = useState(120);
    const importInputRef = useRef<HTMLInputElement>(null);

    // ── Theme / sidebar ──
    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
    const [sidebarWidth, setSidebarWidth] = useState(320);
    const resizingSidebar = useRef(false);

    // ═══════════════════════════════════════════════════════════════
    //  Undo/Redo
    // ═══════════════════════════════════════════════════════════════
    const handleUndoWrapper = () => importedHandleUndo(project, setUndoStack, setRedoStack, setProject);
    const handleRedoWrapper = () => importedHandleRedo(project, setUndoStack, setRedoStack, setProject);

    // ═══════════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════════
    const getSnapValue = (mode: SnapMode): 'bar' | 'beat' | 'off' => {
        if (mode === 'bar' || mode === 'beat') return mode;
        return 'off';
    };

    // Removed unused makeEngineClipId
    const makeClipSelectionId = (layerId: number, clipId: ClipId) => `${layerId}:${clipId}`;

    const upsertEngineClip = useCallback((layerId: number, clip: ClipRegion) => {
        if (!playbackEngine.current || !clip.audioBuffer) return;
        const id = `L${layerId}-C${clip.id}`;
        const settings = layerSettings[layerId];
        playbackEngine.current.addClip({
            id,
            buffer: clip.audioBuffer,
            startTime: clip.start,
            offset: 0,
            duration: clip.duration,
            layerId,
            volume: settings?.volume ?? 1,
            pan: settings?.pan ?? 0,
            stretchFactor: clip.stretchFactor || 1.0,
            effectChain: settings?.effectChain || [],
        });
    }, [layerSettings]);

    const removeEngineClip = useCallback((layerId: number, clipId: ClipId) => {
        if (!playbackEngine.current) return;
        playbackEngine.current.removeClip(`L${layerId}-C${clipId}`);
    }, []);

    // ── Recording sub-hook ──
    const {
        isRecording, isCountIn, countInBars, setCountInBars, countInRemaining,
        overdubEnabled, setOverdubEnabled, punchIn, setPunchIn, punchOut, setPunchOut,
        monitorLevel, handleRecord, bounceProject,
    } = useEditorRecording({
        activeLayer, currentTime, isPlaying, playbackEngine,
        layerClips, layerSettings, project, duration,
        showToast, t, bpm, upsertEngineClip,
        setLayerClips, setSelectedClip, setWaveforms,
        setStatusMessage, setStatusType,
    });

    const applyClipUpdate = (layerId: number, clipId: ClipId, updater: (clip: ClipRegion) => ClipRegion) => {
        let updatedClip: ClipRegion | null = null;
        setLayerClips((prev) => {
            const list = prev[layerId] || [];
            const idx = list.findIndex((c) => c.id === clipId);
            if (idx === -1) return prev;
            const updated = updater(list[idx]);
            updatedClip = updated;
            const nextList = [...list];
            nextList[idx] = updated;
            return { ...prev, [layerId]: nextList };
        });
        if (updatedClip) {
            upsertEngineClip(layerId, updatedClip);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    //  Selection / Clips
    // ═══════════════════════════════════════════════════════════════
    const clearSelection = () => setSelectedClips(new Set());

    const deleteSelectedClips = () => {
        if (selectedClips.size === 0) return;
        if (!project) return;
        setProjectWithUndo(project, project, setUndoStack, setRedoStack, setProject);
        setLayerClips(prev => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
                const layerId = Number(key);
                const clips = next[layerId];
                if (clips) {
                    next[layerId] = clips.filter(c => !selectedClips.has(`${layerId}-${c.id}`));
                    clips.filter(c => selectedClips.has(`${layerId}-${c.id}`)).forEach(c => {
                        playbackEngine.current?.removeClip(String(c.id));
                    });
                }
            }
            return next;
        });
        setSelectedClips(new Set());
        showToast(t('editor.clipsDeleted', { count: selectedClips.size }), 'success');
    };

    const quantizeSelectedClips = () => {
        if (selectedClips.size === 0) return;
        if (!project) return;
        setProjectWithUndo(project, project, setUndoStack, setRedoStack, setProject);
        const currentBpm = bpm || 120;
        setLayerClips(prev => {
            const next = { ...prev };
            for (const key of Object.keys(next)) {
                const layerId = Number(key);
                const clips = next[layerId];
                if (clips) {
                    next[layerId] = clips.map(c => {
                        if (!selectedClips.has(`${layerId}-${c.id}`)) return c;
                        const snappedStart = snapToGrid(c.start, snapMode === 'sub-beat' || snapMode === 'second' ? 'beat' : snapMode, currentBpm);
                        const snappedDuration = snapToGrid(c.duration, snapMode === 'sub-beat' || snapMode === 'second' ? 'beat' : snapMode, currentBpm);
                        return { ...c, start: snappedStart, duration: Math.max(snappedDuration, 0.01) };
                    });
                }
            }
            return next;
        });
        showToast(t('editor.clipsQuantized', { count: selectedClips.size }), 'success');
    };

    const addClipToLayer = (layerId: number, atTime?: number) => {
        const startRaw = atTime ?? currentTime;
        const start = snapToGrid(startRaw, getSnapValue(snapMode), bpm);
        const newClip: ClipRegion = {
            id: Date.now() + Math.floor(Math.random() * 1000),
            label: `Clip ${Math.floor(start)}s`,
            start: Math.max(0, Math.min(start, duration - 0.5)),
            duration: Math.min(4, Math.max(1, duration / 8)),
            fadeIn: 0,
            fadeOut: 0,
            reverse: false,
            stretchFactor: 1.0,
            color: layerSettings[layerId]?.color,
        };
        setLayerClips((prev) => ({
            ...prev,
            [layerId]: [...(prev[layerId] || []), newClip],
        }));
        setSelectedClip({ layerId, clipId: newClip.id });
        upsertEngineClip(layerId, newClip);
    };

    const handleSplitClip = () => {
        if (!selectedClip) return;
        const { layerId, clipId } = selectedClip;
        const clips = layerClips[layerId] || [];
        const clip = clips.find((c) => c.id === clipId);
        if (!clip) return;
        const within = currentTime > clip.start && currentTime < clip.start + clip.duration;
        if (!within) return;
        const leftDur = currentTime - clip.start;
        const rightDur = clip.duration - leftDur;
        if (leftDur < 0.25 || rightDur < 0.25) return;
        const first: ClipRegion = { ...clip, duration: leftDur };
        const second: ClipRegion = { ...clip, id: Date.now(), start: currentTime, duration: rightDur, label: `${clip.label}-part` };
        setLayerClips((prev) => ({
            ...prev,
            [layerId]: clips.flatMap((c) => (c.id === clipId ? [first, second] : [c])),
        }));
        upsertEngineClip(layerId, first);
        upsertEngineClip(layerId, second);
        setSelectedClip({ layerId, clipId: second.id });
    };

    const handleDeleteClip = () => {
        if (!selectedClip) return;
        const { layerId, clipId } = selectedClip;
        setLayerClips((prev) => ({
            ...prev,
            [layerId]: (prev[layerId] || []).filter((c) => c.id !== clipId),
        }));
        removeEngineClip(layerId, clipId);
        setSelectedClip(null);
    };

    const handleCopyClip = () => {
        if (!selectedClip) return;
        const { layerId, clipId } = selectedClip;
        const clip = (layerClips[layerId] || []).find((c) => c.id === clipId);
        if (!clip) return;
        setClipboardClip({ ...clip, id: Date.now() });
    };

    const handlePasteClip = () => {
        if (!clipboardClip || !activeLayer) return;
        const start = snapToGrid(currentTime, getSnapValue(snapMode), bpm);
        const newClip = { ...clipboardClip, id: Date.now(), start };
        setLayerClips((prev) => ({
            ...prev,
            [activeLayer.id]: [...(prev[activeLayer.id] || []), newClip],
        }));
        upsertEngineClip(activeLayer.id, newClip);
        setSelectedClip({ layerId: activeLayer.id, clipId: newClip.id });
    };

    const handleToggleReverse = () => {
        if (!selectedClip) return;
        const { layerId, clipId } = selectedClip;
        applyClipUpdate(layerId, clipId, (clip) => ({ ...clip, reverse: !clip.reverse }));
    };

    const handleFadeChange = (type: 'in' | 'out', value: number) => {
        if (!selectedClip) return;
        const { layerId, clipId } = selectedClip;
        applyClipUpdate(layerId, clipId, (clip) => ({
            ...clip,
            fadeIn: type === 'in' ? Math.max(0, value) : clip.fadeIn,
            fadeOut: type === 'out' ? Math.max(0, value) : clip.fadeOut,
        }));
    };

    const applyTimeStretch = (factor: number) => {
        if (selectedClips.size === 0 || factor <= 0) return;
        setLayerClips(prev => {
            const next = { ...prev };
            selectedClips.forEach(selId => {
                const [layerIdStr, clipIdStr] = selId.split(':');
                const layerId = Number(layerIdStr);
                const clipId = Number(clipIdStr);
                const clips = next[layerId] || [];
                const clipIndex = clips.findIndex(c => c.id === clipId);
                if (clipIndex >= 0) {
                    const clip = clips[clipIndex];
                    const originalDuration = clip.audioBuffer ? clip.audioBuffer.duration : clip.duration;
                    next[layerId] = clips.map(c =>
                        c.id === clipId ? { ...c, stretchFactor: factor, duration: originalDuration * factor } : c
                    );
                }
            });
            return next;
        });
    };

    // ═══════════════════════════════════════════════════════════════
    //  Clip drag
    // ═══════════════════════════════════════════════════════════════
    const handleClipDragStart = (
        e: React.MouseEvent,
        layerId: number,
        clipId: ClipId,
        mode: 'move' | 'resize-left' | 'resize-right'
    ) => {
        e.stopPropagation();
        if (e.ctrlKey || e.metaKey) {
            setSelectedClips((prev) => {
                const id = makeClipSelectionId(layerId, clipId);
                const next = new Set(prev);
                if (next.has(id)) next.delete(id); else next.add(id);
                return next;
            });
            return;
        }
        const list = layerClips[layerId] || [];
        const clip = list.find((c) => c.id === clipId);
        if (!clip) return;
        setSelectedClip({ layerId, clipId });
        setSelectedClips(new Set([makeClipSelectionId(layerId, clipId)]));
        clipDragRef.current = { layerId, clipId, mode, startX: e.clientX, originalStart: clip.start, originalDuration: clip.duration };
        window.addEventListener('mousemove', handleClipDragMove);
        window.addEventListener('mouseup', handleClipDragEnd);
    };

    const handleClipDragMove = (e: MouseEvent) => {
        const state = clipDragRef.current;
        if (!state) return;
        const { layerId, clipId, mode, startX, originalStart, originalDuration } = state;
        const deltaPx = e.clientX - startX;
        const pxPerSecond = (30 * zoom * duration) / duration;
        const deltaSecRaw = deltaPx / pxPerSecond;
        const deltaSec = snapToGrid(deltaSecRaw + originalStart, getSnapValue(snapMode), bpm) - originalStart;

        if (mode === 'move') {
            applyClipUpdate(layerId, clipId, (clip) => {
                const nextStart = Math.min(Math.max(0, originalStart + deltaSec), duration - clip.duration);
                return { ...clip, start: nextStart };
            });
        } else if (mode === 'resize-left') {
            applyClipUpdate(layerId, clipId, (_clip) => {
                const nextStart = Math.max(0, originalStart + deltaSec);
                const delta = originalStart - nextStart;
                const nextDuration = Math.max(0.25, originalDuration + delta);
                return { ..._clip, start: nextStart, duration: Math.min(duration - nextStart, nextDuration) };
            });
        } else if (mode === 'resize-right') {
            applyClipUpdate(layerId, clipId, (clip) => {
                const nextDuration = Math.max(0.25, originalDuration + deltaSec);
                return { ...clip, duration: Math.min(duration - clip.start, nextDuration) };
            });
        }
    };

    const handleClipDragEnd = () => {
        clipDragRef.current = null;
        window.removeEventListener('mousemove', handleClipDragMove);
        window.removeEventListener('mouseup', handleClipDragEnd);
    };

    // ═══════════════════════════════════════════════════════════════
    //  Layer settings
    // ═══════════════════════════════════════════════════════════════
    const updateLayerSetting = (layerId: number, patch: Partial<LayerSettings>) => {
        setLayerSettings((prev) => {
            const current = prev[layerId];
            const defaults: LayerSettings = {
                mute: false, solo: false, volume: 1, pan: 0,
                color: LAYER_COLORS[0], locked: false, group: "",
                effectChain: [], trackType: 'audio', instrument: 'sine',
            };
            return { ...prev, [layerId]: { ...defaults, ...current, ...patch } };
        });
    };

    const handleToggleSolo = (layerId: number) => updateLayerSetting(layerId, { solo: !layerSettings[layerId]?.solo });
    const handleToggleMute = (layerId: number) => updateLayerSetting(layerId, { mute: !layerSettings[layerId]?.mute });
    const handleVolumeChange = (layerId: number, value: number) => updateLayerSetting(layerId, { volume: Math.min(1, Math.max(0, value)) });
    const handlePanChange = (layerId: number, value: number) => updateLayerSetting(layerId, { pan: Math.min(1, Math.max(-1, value)) });
    const handleColorChange = (layerId: number, color: string) => updateLayerSetting(layerId, { color });
    const handleGroupChange = (layerId: number, group: string) => updateLayerSetting(layerId, { group });
    const handleToggleLock = (layerId: number) => updateLayerSetting(layerId, { locked: !layerSettings[layerId]?.locked });

    // ═══════════════════════════════════════════════════════════════
    //  Layer drag & drop reorder
    // ═══════════════════════════════════════════════════════════════
    const handleDragStart = (layerId: number) => { if (layerSettings[layerId]?.locked) return; dragLayerId.current = layerId; };
    const handleDragEnd = () => { dragLayerId.current = null; };
    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); };
    const handleDrop = (event: React.DragEvent<HTMLDivElement>, targetId: number) => {
        event.preventDefault();
        const sourceId = dragLayerId.current;
        dragLayerId.current = null;
        if (sourceId === null || sourceId === undefined || sourceId === targetId) return;
        setLayers((prev) => {
            const sourceIndex = prev.findIndex((l) => l.id === sourceId);
            const targetIndex = prev.findIndex((l) => l.id === targetId);
            if (sourceIndex === -1 || targetIndex === -1) return prev;
            const next = [...prev];
            const [moved] = next.splice(sourceIndex, 1);
            next.splice(targetIndex, 0, moved);
            setActiveLayer((curr) => (curr?.id === sourceId ? moved : curr));
            return next;
        });
    };

    // ═══════════════════════════════════════════════════════════════
    //  FX wrappers
    // ═══════════════════════════════════════════════════════════════
    const addEffectToLayerWrapper = (layerId: number, effectType: EffectType) => addEffectToLayer(setLayerSettings, layerId, effectType);
    const removeEffectFromLayerWrapper = (layerId: number, effectId: string) => removeEffectFromLayer(setLayerSettings, layerId, effectId);
    const toggleEffectBypassWrapper = (layerId: number, effectId: string) => toggleEffectBypass(setLayerSettings, layerId, effectId);
    const updateEffectParamsWrapper = (layerId: number, effectId: string, params: Record<string, number>) => updateEffectParams(setLayerSettings, layerId, effectId, params);

    // ═══════════════════════════════════════════════════════════════
    //  MIDI CC wrappers
    // ═══════════════════════════════════════════════════════════════
    const handleSelectCCLaneWrapper = (layerId: number, cc: number) => handleSelectCCLane(setLayerCCType, layerId, cc);
    const handleAddCCEventWrapper = (layerId: number, cc: number, value: number, time: number) => handleAddCCEvent(setLayerMidiCC, layerId, cc, value, time);
    const handleUpdateCCEventWrapper = (layerId: number, id: number, value: number, time: number, handleType?: 'linear' | 'step' | 'exp') => handleUpdateCCEvent(setLayerMidiCC, layerId, id, value, time, handleType);
    const handleRemoveCCEventWrapper = (layerId: number, id: number) => handleRemoveCCEvent(setLayerMidiCC, layerId, id);

    // ═══════════════════════════════════════════════════════════════
    //  Transport
    // ═══════════════════════════════════════════════════════════════
    const handlePlayPause = () => {
        if (!playbackEngine.current) return;
        if (isPlaying) playbackEngine.current.pause(); else playbackEngine.current.play();
    };
    const handleSeek = (time: number) => { if (playbackEngine.current) playbackEngine.current.seek(time); };
    const handleToggleLoop = () => {
        if (!playbackEngine.current) return;
        const newLoopState = !isLooping;
        setIsLooping(newLoopState);
        playbackEngine.current.setLoopRegion(0, duration, newLoopState);
    };
    const handleAdjustDuration = (amount: number) => {
        const newDuration = Math.max(1, duration + amount);
        setDuration(newDuration);
        if (playbackEngine.current) playbackEngine.current.setLoopRegion(0, newDuration, isLooping);
    };
    const handleZoomChange = (newZoom: number) => setZoom(newZoom);
    const handleToggleSnap = () => setSnapEnabled(!snapEnabled);
    const handleSnapModeChange = (mode: SnapMode) => setSnapMode(mode);

    // ═══════════════════════════════════════════════════════════════
    //  Master FX
    // ═══════════════════════════════════════════════════════════════
    const handleMasterVolumeChange = (value: number) => {
        const v = Math.max(0, Math.min(1, value));
        setMasterVolume(v);
        playbackEngine.current?.setMasterVolume(v);
    };
    const updateFilter = (patch: Partial<{ type: BiquadFilterType; frequency: number; q: number; gain: number }>) => {
        const nextType = patch.type ?? filterType;
        const nextFreq = patch.frequency ?? filterFreq;
        const nextQ = patch.q ?? filterQ;
        const nextGain = patch.gain ?? filterGain;
        setFilterType(nextType); setFilterFreq(nextFreq); setFilterQ(nextQ); setFilterGain(nextGain);
        playbackEngine.current?.setMasterFilter({ type: nextType, frequency: nextFreq, q: nextQ, gain: nextGain });
    };
    const loadMasterEQPreset = (preset: MasterEQPreset) => {
        setFilterType(preset.type); setFilterFreq(preset.frequency); setFilterQ(preset.q); setFilterGain(preset.gain);
        playbackEngine.current?.setMasterFilter({ type: preset.type, frequency: preset.frequency, q: preset.q, gain: preset.gain });
    };
    const saveMasterEQPreset = (name: string) => {
        const newPreset: MasterEQPreset = { name, type: filterType, frequency: filterFreq, q: filterQ, gain: filterGain };
        const updated = [...customPresets, newPreset];
        setCustomPresets(updated);
        localStorage.setItem('audioEditor.masterEQPresets', JSON.stringify(updated));
        setStatusMessage(t('editor.presetSaved', { name })); setStatusType('success');
        setTimeout(() => setStatusMessage(''), 2000);
    };
    const deleteCustomPreset = (name: string) => {
        const updated = customPresets.filter(p => p.name !== name);
        setCustomPresets(updated);
        localStorage.setItem('audioEditor.masterEQPresets', JSON.stringify(updated));
    };

    // ═══════════════════════════════════════════════════════════════
    //  Import / Export / Template (delegated to editorIO.ts)
    // ═══════════════════════════════════════════════════════════════
    const exportProject = () => exportProjectIO(project, projectName);
    const importProject = (e: React.ChangeEvent<HTMLInputElement>) => importProjectIO(e, project, setUndoStack, setRedoStack, setProject, setStatusMessage, setStatusType, t);
    const saveTemplate = () => saveTemplateIO(project, setStatusMessage, setStatusType, t);
    const loadTemplate = () => loadTemplateIO(project, setUndoStack, setRedoStack, setProject, setStatusMessage, setStatusType, t);

    // ═══════════════════════════════════════════════════════════════
    //  Project / Section / Layer CRUD
    // ═══════════════════════════════════════════════════════════════
    const handleLoadProject = (loadedProject: AudioProject) => {
        setProject(loadedProject);
        setActiveSection(loadedProject.sections?.[0] || null);
    };

    const handleAddLayer = async () => {
        if (!activeSection) return;
        const optimistic: AudioLayer = {
            id: -Date.now(), name: t('editor.defaultLayerName'), sectionId: activeSection.id,
            audioSource: AudioSourceType.AudioClip, audioSourceParameters: JSON.stringify({ clipId: null }), items: [],
        };
        setLayers((prev) => [...prev, optimistic]);
        setActiveLayer(optimistic);
        try {
            const newId = await addLayer(activeSection.id, optimistic.name, optimistic.audioSource, optimistic.audioSourceParameters);
            setLayers((prev) => prev.map((l) => (l.id === optimistic.id ? { ...optimistic, id: newId } : l)));
            if (project) {
                setProjectWithUndo({
                    ...project,
                    sections: project.sections?.map((s) =>
                        s.id === activeSection.id
                            ? { ...s, layers: [...(s.layers ?? []).filter((l) => l.id !== newId), { ...optimistic, id: newId }] }
                            : s
                    ) ?? [],
                }, project, setUndoStack, setRedoStack, setProject);
            }
        } catch (e) {
            setLayers((prev) => prev.filter((l) => l.id !== optimistic.id));
            log.error("Nie udało się dodać warstwy:", e);
        }
    };

    const handleDeleteLayer = async (layerId: number) => {
        if (layerSettings[layerId]?.locked) { showToast(t('editor.layerLocked'), 'error'); return; }
        const ok = await confirm(t('editor.deleteLayerConfirm'));
        if (!ok) return;
        (layerClips[layerId] || []).forEach((clip) => removeEngineClip(layerId, clip.id));
        setLayerMidiNotes((prev) => { const next = { ...prev }; delete next[layerId]; return next; });
        await deleteLayer(layerId);
        setLayers((prev) => prev.filter((l) => l.id !== layerId));
        setActiveLayer((prev) => (prev?.id === layerId ? null : prev));
        if (project) {
            setProjectWithUndo({
                ...project,
                sections: project.sections?.map((s) =>
                    s.id === activeSection?.id ? { ...s, layers: (s.layers ?? []).filter((l) => l.id !== layerId) } : s
                ) ?? [],
            }, project, setUndoStack, setRedoStack, setProject);
        }
    };

    const handleSaveProject = async () => {
        if (!project) return;
        const nextVolume = projectVolume === "" ? undefined : Number(projectVolume);
        if (Number.isNaN(nextVolume as number)) { setStatusType("error"); setStatusMessage(t('editor.volumeMustBeNumber')); return; }
        if (!projectName.trim()) { setStatusType("error"); setStatusMessage(t('editor.projectNameRequired')); return; }
        await updateProject(project.id, { name: projectName || project.name, isTemplate: projectIsTemplate, volume: nextVolume });
        setProjectWithUndo({ ...project, name: projectName || project.name, isTemplate: projectIsTemplate, volume: nextVolume }, project, setUndoStack, setRedoStack, setProject);
        setStatusType("success"); setStatusMessage(t('editor.projectSaved'));
    };

    const handleSaveSection = async () => {
        if (!activeSection) return;
        const nextName = sectionName || activeSection.name;
        const nextOrder = sectionOrder === "" ? activeSection.orderNumber : Number(sectionOrder);
        if (!nextName.trim()) { setStatusType("error"); setStatusMessage(t('editor.sectionNameRequired')); return; }
        if (Number.isNaN(nextOrder)) { setStatusType("error"); setStatusMessage(t('editor.orderMustBeNumber')); return; }
        await updateSection(activeSection.id, { name: nextName, orderNumber: nextOrder });
        setActiveSection({ ...activeSection, name: nextName, orderNumber: nextOrder });
        if (project) {
            setProjectWithUndo({
                ...project,
                sections: project.sections?.map((s) =>
                    s.id === activeSection.id ? { ...s, name: nextName, orderNumber: nextOrder } : s
                ) ?? [],
            }, project, setUndoStack, setRedoStack, setProject);
        }
        setStatusType("success"); setStatusMessage(t('editor.sectionSaved'));
    };

    const handleSaveLayer = async (layerToSave: AudioLayer) => {
        if (!layerToSave?.id) return;
        const audioClipId = (typeof layerToSave.audioClipId !== 'undefined') ? layerToSave.audioClipId : undefined;
        await updateLayer(layerToSave.id, { name: layerToSave.name, audioClipId });
        setLayers((prev) => prev.map((l) => (l.id === layerToSave.id ? { ...layerToSave, audioClipId } : l)));
        setActiveLayer((prev) => (prev?.id === layerToSave.id ? { ...layerToSave, audioClipId } : prev));
        if (project) {
            setProjectWithUndo({
                ...project,
                sections: project.sections?.map((s) =>
                    s.id === activeSection?.id
                        ? { ...s, layers: (s.layers ?? []).map((l) => l.id === layerToSave.id ? { ...layerToSave, audioClipId } : l) }
                        : s
                ) ?? [],
            }, project, setUndoStack, setRedoStack, setProject);
        }
    };

    // ═══════════════════════════════════════════════════════════════
    //  Effects (synced)
    // ═══════════════════════════════════════════════════════════════
    useEffect(() => {
        if (project && playbackEngine.current) {
            const projectDuration = project.sections?.reduce((max, section) => {
                return Math.max(max, (section.duration ? parseFloat(section.duration) : 10));
            }, 10) || 10;
            setDuration(projectDuration);
        }
    }, [project]);

    useEffect(() => {
        setLayerSettings((prev) => {
            const next = { ...prev }; let changed = false;
            const ids = new Set(layers.map((l) => l.id));
            Object.keys(next).forEach((key) => { if (!ids.has(Number(key))) { delete next[Number(key)]; changed = true; } });
            layers.forEach((layer, idx) => {
                if (!next[layer.id]) {
                    next[layer.id] = { mute: false, solo: false, volume: 1, pan: 0, color: LAYER_COLORS[idx % LAYER_COLORS.length], locked: false, group: "", effectChain: [], trackType: 'audio', instrument: 'sine' };
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [layers]);

    useEffect(() => {
        setLayerClips((prev) => {
            const next = { ...prev }; let changed = false;
            const ids = new Set(layers.map((l) => l.id));
            Object.keys(next).forEach((key) => { if (!ids.has(Number(key))) { delete next[Number(key)]; changed = true; } });
            layers.forEach((layer) => { if (!next[layer.id]) { next[layer.id] = []; changed = true; } });
            return changed ? next : prev;
        });
    }, [layers]);

    useEffect(() => {
        setLayerMidiNotes((prev) => {
            const next = { ...prev } as Record<number, MidiNote[]>; let changed = false;
            const ids = new Set(layers.map((l) => l.id));
            Object.keys(next).forEach((key) => { if (!ids.has(Number(key))) { delete next[Number(key)]; changed = true; } });
            layers.forEach((layer) => { if (!next[layer.id]) { next[layer.id] = []; changed = true; } });
            return changed ? next : prev;
        });
    }, [layers]);

    useEffect(() => {
        if (!selectedClip) return;
        if (!layers.some((l) => l.id === selectedClip.layerId)) setSelectedClip(null);
    }, [layers, selectedClip]);

    useEffect(() => {
        const stored = localStorage.getItem('audioEditor.masterEQPresets');
        if (stored) {
            try { setCustomPresets(JSON.parse(stored) as MasterEQPreset[]); }
            catch (e) { log.warn('Failed to parse stored presets:', e); }
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') { if (selectedClips.size > 0) { e.preventDefault(); deleteSelectedClips(); } }
            if ((e.key === 'q' || e.key === 'Q') && selectedClips.size > 0 && !e.ctrlKey && !e.metaKey) { e.preventDefault(); quantizeSelectedClips(); }
            if (e.key === 'Escape') clearSelection();
            const isMod = e.ctrlKey || e.metaKey;
            if (isMod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); if (e.shiftKey) handleRedoWrapper(); else handleUndoWrapper(); }
            if (isMod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); handleRedoWrapper(); }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedClips]);

    useEffect(() => {
        Object.entries(layerClips).forEach(([layerIdStr, clips]) => {
            const layerId = Number(layerIdStr);
            clips?.forEach((clip) => upsertEngineClip(layerId, clip));
        });
    }, [layerClips, layerSettings]);

    useEffect(() => {
        // MIDI track sync stub
    }, [layerMidiNotes, layerSettings]);

    useEffect(() => {
        if (!playbackEngine.current) return;
        Object.entries(layerMidiCC).forEach(([layerIdStr, ccEvents]) => {
            const layerId = Number(layerIdStr);
            playbackEngine.current!.setMidiCCEvents(layerId, ccEvents);
        });
    }, [layerMidiCC]);

    useEffect(() => {
        if (!layers?.length) { setWaveforms({}); return; }
        setWaveforms((prev) => {
            const next = { ...prev }; let changed = false;
            const ids = new Set(layers.map((l) => l.id));
            Object.keys(next).forEach((key) => { if (!ids.has(Number(key))) { delete next[Number(key)]; changed = true; } });
            layers.forEach((layer) => { if (!next[layer.id]) { next[layer.id] = generatePlaceholderWaveform(4); changed = true; } });
            return changed ? next : prev;
        });
    }, [layers]);

    useEffect(() => {
        const fetchProject = async () => {
            if (!projectId) return;
            const projectData = await getProjectDetails(parseInt(projectId));
            setProject(projectData);
            setActiveSection(projectData.sections?.[0] || null);
        };
        fetchProject();
    }, [projectId]);

    useEffect(() => {
        if (project) {
            setProjectName(project.name ?? "");
            setProjectIsTemplate(!!project.isTemplate);
            setProjectVolume(project.volume != null ? String(project.volume) : "");
        }
    }, [project]);

    useEffect(() => {
        if (activeSection) {
            setLayers(activeSection.layers || []);
            setActiveLayer(activeSection.layers?.[0] || null);
            setSectionName(activeSection.name ?? "");
            setSectionOrder(activeSection.orderNumber != null ? String(activeSection.orderNumber) : "");
        } else {
            setSectionName(""); setSectionOrder("");
        }
    }, [activeSection]);

    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', handleClipDragMove);
            window.removeEventListener('mouseup', handleClipDragEnd);
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle("audioverse-dark", theme === "dark");
        document.body.classList.toggle("audioverse-light", theme === "light");
        localStorage.setItem(THEME_KEY, theme);
    }, [theme]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => { if (resizingSidebar.current) setSidebarWidth(Math.max(180, Math.min(window.innerWidth - 300, e.clientX))); };
        const handleMouseUp = () => { resizingSidebar.current = false; };
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
    }, []);

    // ── Computed ──
    const isSoloMode = useMemo(() => Object.values(layerSettings).some((s) => s?.solo), [layerSettings]);
    const miniMapWaveform = useMemo(() => mergeWaveforms(Object.values(waveforms)), [waveforms]);

    // ═══════════════════════════════════════════════════════════════
    //  Return
    // ═══════════════════════════════════════════════════════════════
    return {
        // Translation
        t,
        // Display mode
        displayMode, modeConfig, handleDisplayModeChange,
        // Tutorial
        launchEditorTutorial,
        // Project
        project, projectName, setProjectName, projectIsTemplate, setProjectIsTemplate,
        projectVolume, setProjectVolume,
        undoStack, redoStack, handleUndoWrapper, handleRedoWrapper,
        handleLoadProject, handleSaveProject, bounceProject,
        exportProject, importProject, importInputRef,
        saveTemplate, loadTemplate,
        // Section
        activeSection, setActiveSection, sectionName, setSectionName, sectionOrder, setSectionOrder,
        handleSaveSection,
        // Layers
        layers, activeLayer, setActiveLayer, layerSettings, layerClips, layerMidiNotes,
        handleAddLayer, handleDeleteLayer, handleSaveLayer,
        updateLayerSetting, handleToggleSolo, handleToggleMute,
        handleVolumeChange, handlePanChange, handleColorChange, handleGroupChange, handleToggleLock,
        handleDragStart, handleDragEnd, handleDragOver, handleDrop,
        addEffectToLayerWrapper, removeEffectFromLayerWrapper, toggleEffectBypassWrapper, updateEffectParamsWrapper,
        isSoloMode,
        // Clips
        selectedClip, setSelectedClip, selectedClips, setSelectedClips,
        clipboardClip, rippleMode, setRippleMode,
        addClipToLayer, handleSplitClip, handleDeleteClip, handleCopyClip, handlePasteClip,
        handleToggleReverse, handleFadeChange, handleClipDragStart,
        clearSelection, deleteSelectedClips, quantizeSelectedClips, applyTimeStretch,
        makeClipSelectionId,
        // MIDI
        selectedMidiNote, setSelectedMidiNote,
        layerCCType, layerMidiCC, setLayerMidiNotes,
        handleSelectCCLaneWrapper, handleAddCCEventWrapper, handleUpdateCCEventWrapper, handleRemoveCCEventWrapper,
        // Transport
        isPlaying, currentTime, duration, isLooping, bpm, setBpm,
        handlePlayPause, handleSeek, handleToggleLoop, handleAdjustDuration,
        // Recording
        isRecording, isCountIn, countInBars, setCountInBars, countInRemaining,
        overdubEnabled, setOverdubEnabled, punchIn, setPunchIn, punchOut, setPunchOut,
        monitorLevel, handleRecord,
        // Zoom / Snap
        zoom, setZoom, uiZoom, setUiZoom, snapEnabled, snapMode,
        handleZoomChange, handleToggleSnap, handleSnapModeChange,
        // Master FX
        masterVolume, handleMasterVolumeChange,
        filterType, filterFreq, filterQ, filterGain, updateFilter,
        masterEQPresets, customPresets, loadMasterEQPreset, saveMasterEQPreset, deleteCustomPreset,
        // Auto-save
        autoSaveMode, setAutoSaveMode, autoSaveInterval, setAutoSaveInterval,
        // Waveforms
        waveforms, miniMapWaveform,
        // UI
        showShortcuts, setShowShortcuts,
        theme, setTheme, sidebarWidth, resizingSidebar,
    };
}
