import React from "react";
import type { ClipRegion, EffectType, LayerSettings } from "../../../../models/editor/audioTypes";
import type { MidiCCEvent } from "../../../../models/editor/midiTypes";
import type { TrackType } from "../../../../models/editor/timelineTypes";
import type { AudioLayer } from "../../../../models/modelsEditor";
import { useEditorTrack } from "../../../../contexts/EditorTrackContext";
import AudioTimelineContainer from "../AudioTimelineContainer";
import AudioEditorPianoRollContainer from "../AudioEditorPianoRollContainer";
import CCLaneSelector from "../CCLaneSelector";
import { LAYER_COLORS } from "../../../../constants/audioColors";
import styles from '../../AudioEditor.module.css';
import css from './LayerTrack.module.css';

/** Per-instance props — only data unique to each track */
interface LayerTrackProps {
    layer: AudioLayer;
    idx: number;
    settings: LayerSettings | undefined;
    clips: ClipRegion[];
    waveform: number[] | undefined;
    layerCCType: number;
    ccEvents: MidiCCEvent[];
}

const LayerTrack: React.FC<LayerTrackProps> = ({
    layer,
    idx,
    settings,
    clips,
    waveform,
    layerCCType,
    ccEvents,
}) => {
    // Shared editor state from context (36 props moved here)
    const {
        zoom, duration, isPlaying, isRecording, currentTime, bpm,
        snapEnabled, snapMode,
        showLayerEffects, showMidiPianoRoll, showLayerDragReorder,
        isSoloMode, activeLayerId,
        selectedClip, selectedClips, selectedMidiNote,
        setActiveLayer, addClipToLayer, handleDeleteLayer,
        handleToggleSolo, handleToggleMute, handleVolumeChange,
        handlePanChange, handleColorChange, handleGroupChange,
        handleToggleLock, updateLayerSetting,
        handleDragStart, handleDragEnd, handleDragOver, handleDrop,
        handleClipDragStart, setSelectedClip, makeClipSelectionId,
        handleSeek, handleZoomChange,
        addEffectToLayerWrapper, removeEffectFromLayerWrapper,
        toggleEffectBypassWrapper, updateEffectParamsWrapper,
        setLayerMidiNotes, setSelectedMidiNote,
        handleSelectCCLaneWrapper, handleAddCCEventWrapper,
        handleUpdateCCEventWrapper, handleRemoveCCEventWrapper,
    } = useEditorTrack();
    const accent = settings?.color || LAYER_COLORS[idx % LAYER_COLORS.length];
    const effectiveMuted = (isSoloMode && !settings?.solo) || settings?.mute;
    const isLocked = !!settings?.locked;
    const laneWidth = 30 * zoom * duration;

    return (
        <div
            className={`${styles['audio-timeline']} ${css.trackWrapper}`}
            style={{
                border: `1px solid ${accent}`,
                opacity: isLocked ? 0.7 : 1,
            }}
            draggable={showLayerDragReorder && !isLocked}
            onDragStart={() => handleDragStart(layer.id)}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, layer.id)}
        >
            {/* Header row */}
            <div className={css.headerRow}>
                <div className={css.headerLeft}>
                    <button
                        className={`${styles['layer-button']} ${activeLayerId === layer.id ? styles['active-layer'] : ''}`}
                        onClick={() => setActiveLayer(layer)}
                        style={{ borderColor: accent, color: accent }}
                        title="Select layer"
                    >
                        {layer.name || layer.audioSource || "New Layer"}
                    </button>
                    <div className={css.colorDot} style={{ background: accent }} />
                    {settings?.group && (
                        <span className={css.groupBadge}>
                            Group: {settings.group}
                        </span>
                    )}
                </div>
                <div className={css.headerRight}>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => addClipToLayer(layer.id)} disabled={isLocked} title="Add new clip to layer">
                        + Clip
                    </button>
                    <button title="Delete layer" className={css.deleteBtn} onClick={() => handleDeleteLayer(layer.id)}>
                        ✕
                    </button>
                </div>
            </div>

            {/* Controls row */}
            <div className={`d-flex align-items-center gap-2 flex-wrap ${css.controlsRow}`}>
                <button className={`btn btn-sm ${settings?.solo ? "btn-warning" : "btn-outline-secondary"}`} onClick={() => handleToggleSolo(layer.id)} title="Solo">
                    Solo
                </button>
                <button className={`btn btn-sm ${settings?.mute ? "btn-danger" : "btn-outline-secondary"}`} onClick={() => handleToggleMute(layer.id)} title="Mute">
                    Mute
                </button>
                <div className={`d-flex align-items-center gap-1 ${css.volContainer}`}>
                    <span className={css.smallLabel}>Vol</span>
                    <input type="range" min="0" max="1" step="0.01" value={settings?.volume ?? 1} onChange={(e) => handleVolumeChange(layer.id, Number(e.target.value))} className={css.flexOne} title="Layer volume" />
                    <span className={css.volValue}>{Math.round((settings?.volume ?? 1) * 100)}%</span>
                </div>
                <div className={`d-flex align-items-center gap-1 ${css.panContainer}`}>
                    <span className={css.smallLabel}>Pan</span>
                    <input type="range" min="-1" max="1" step="0.1" value={settings?.pan ?? 0} onChange={(e) => handlePanChange(layer.id, Number(e.target.value))} className={css.flexOne} title="Pan (left/right)" />
                    <span className={css.panValue}>{(settings?.pan ?? 0).toFixed(1)}</span>
                </div>
                <div className={`d-flex align-items-center gap-1 ${css.trackTypeContainer}`}>
                    <span className={css.smallLabel}>Track</span>
                    <select className={`form-select form-select-sm ${css.trackSelect}`} value={settings?.trackType || "audio"} onChange={(e) => updateLayerSetting(layer.id, { trackType: e.target.value as TrackType })} title="Track type: audio or MIDI">
                        <option value="audio">Audio</option>
                        <option value="midi">MIDI</option>
                    </select>
                </div>
                {settings?.trackType === "midi" && (
                    <div className={`d-flex align-items-center gap-1 ${css.instrumentContainer}`}>
                        <span className={css.smallLabel}>Instrument</span>
                        <select className={`form-select form-select-sm ${css.instrumentSelect}`} value={settings.instrument || "sine"} onChange={(e) => updateLayerSetting(layer.id, { instrument: e.target.value as "sine" | "square" | "sawtooth" | "triangle" })} title="MIDI instrument">
                            <option value="sine">Sine</option>
                            <option value="square">Square</option>
                            <option value="sawtooth">Saw</option>
                            <option value="triangle">Triangle</option>
                        </select>
                    </div>
                )}
                <div className="d-flex align-items-center gap-1">
                    <span className={css.smallLabel}>Color</span>
                    <input type="color" value={accent} onChange={(e) => handleColorChange(layer.id, e.target.value)} title="Track color" className={css.colorInput} />
                </div>
                <div className="form-check d-flex align-items-center gap-1">
                    <input id={`lock-${layer.id}`} className="form-check-input" type="checkbox" checked={isLocked} onChange={() => handleToggleLock(layer.id)} title="Lock layer" />
                    <label htmlFor={`lock-${layer.id}`} className={`form-check-label ${css.smallLabel}`}>Lock</label>
                </div>
                <div className="d-flex align-items-center gap-1">
                    <span className={css.smallLabel}>Group</span>
                    <input type="text" value={settings?.group ?? ""} onChange={(e) => handleGroupChange(layer.id, e.target.value)} className={`form-control form-control-sm ${css.groupInput}`} placeholder="A/B/1" title="Layer group" />
                </div>
                {effectiveMuted && <span className={css.mutedWarning}>Muted via Solo/Mute</span>}
                {isLocked && <span className={css.lockedWarning}>Locked (drag/drop disabled)</span>}
            </div>

            {/* Effects Chain */}
            {showLayerEffects && settings?.effectChain && settings.effectChain.length > 0 && (
                <div className={`mt-2 pt-2 ${css.fxChainSection}`}>
                    <div className={css.fxChainTitle}>FX Chain:</div>
                    <div className="d-flex flex-column gap-2">
                        {settings.effectChain.map((effect) => (
                            <div key={effect.id} className={`card p-2 ${css.effectCardBase}`} style={{ background: effect.bypass ? "#f9f9f9" : "#fff" }}>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className={css.effectName}>{effect.type.toUpperCase()}</span>
                                    <button className={`btn btn-sm ${effect.bypass ? "btn-outline-secondary" : "btn-primary"} ${css.effectBtn}`} onClick={() => toggleEffectBypassWrapper(layer.id, effect.id)}>
                                        {effect.bypass ? "Bypassed" : "Active"}
                                    </button>
                                    <button className={`btn btn-sm btn-outline-danger ${css.effectBtn}`} onClick={() => removeEffectFromLayerWrapper(layer.id, effect.id)}>
                                        Remove
                                    </button>
                                </div>
                                {!effect.bypass && (
                                    <div className="d-flex flex-wrap gap-2">
                                        {Object.entries(effect.params).map(([key, value]) => (
                                            <div key={key} className={`d-flex align-items-center gap-1 ${css.effectParamGroup}`}>
                                                <span className={css.effectParamLabel}>{key}:</span>
                                                <input
                                                    type="number"
                                                    className={`form-control form-control-sm ${css.effectParamInput}`}
                                                    value={value}
                                                    step={key.includes("Gain") ? 0.5 : key.includes("time") || key.includes("attack") || key.includes("release") || key.includes("decay") ? 0.01 : key.includes("Freq") ? 10 : 0.1}
                                                    onChange={(e) => updateEffectParamsWrapper(layer.id, effect.id, { [key]: Number(e.target.value) })}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Add FX Buttons */}
            {showLayerEffects && (
            <div className="mt-2">
                <div className={`btn-group ${css.fxBtnGroup}`} role="group">
                    {(["eq3", "compressor", "delay", "reverb", "distortion"] as EffectType[]).map((fx) => (
                        <button key={fx} className="btn btn-sm btn-outline-success" onClick={() => addEffectToLayerWrapper(layer.id, fx)} disabled={isLocked} title={`Add ${fx} effect`}>
                            + {fx === "eq3" ? "EQ3" : fx === "compressor" ? "Comp" : fx.charAt(0).toUpperCase() + fx.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
            )}

            {/* MIDI Piano Roll & CC */}
            {showMidiPianoRoll && settings?.trackType === "midi" && (
                <div>
                    <div className={css.ccLaneRow}>
                        <span className={css.ccLaneLabel}>CC Lane:</span>
                        <CCLaneSelector ccType={layerCCType} onChange={(cc) => handleSelectCCLaneWrapper(layer.id, cc)} />
                    </div>
                    <AudioEditorPianoRollContainer
                        notes={[]}
                        onAddNote={(pitch, start, dur) => {
                            const newNote = { id: Date.now() + Math.floor(Math.random() * 1000), pitch, start, duration: dur, velocity: 100 };
                            setLayerMidiNotes((prev) => ({ ...prev, [layer.id]: [...(prev[layer.id] || []), newNote] }));
                        }}
                        onRemoveNote={(noteId) => {
                            setLayerMidiNotes((prev) => ({ ...prev, [layer.id]: (prev[layer.id] || []).filter((n) => n.id !== noteId) }));
                        }}
                        selectedNoteId={selectedMidiNote?.layerId === layer.id ? selectedMidiNote.noteId : undefined}
                        setSelectedNoteId={(id) => setSelectedMidiNote(id != null ? { layerId: layer.id, noteId: id } : null)}
                        duration={duration}
                        zoom={zoom}
                        ccEvents={ccEvents}
                        onAddCCEvent={(cc, value, time) => handleAddCCEventWrapper(layer.id, cc, value, time)}
                        onUpdateCCEvent={(id, value, time, handleType) => handleUpdateCCEventWrapper(layer.id, id, value, time, handleType)}
                        onRemoveCCEvent={(id) => handleRemoveCCEventWrapper(layer.id, id)}
                        ccType={layerCCType}
                    />
                </div>
            )}

            {/* Timeline with clip overlays */}
            <div className={css.timelineWrapper} style={{ width: `${laneWidth}px` }} title="Timeline: drag clips, edit, change length, use grid and zoom">
                <AudioTimelineContainer
                    zoom={zoom}
                    duration={duration}
                    isPlaying={isPlaying}
                    isRecording={isRecording}
                    currentTime={currentTime}
                    bpm={bpm}
                    snapEnabled={snapEnabled}
                    snapMode={snapMode}
                    waveform={waveform ?? []}
                    waveformColor={accent}
                    onCurrentTimeChange={handleSeek}
                    onZoomChange={handleZoomChange}
                />

                {/* Clip lane overlay */}
                <div className={css.clipLaneOverlay}>
                    {clips.map((clip) => {
                        const left = (clip.start / duration) * laneWidth;
                        const width = (clip.duration / duration) * laneWidth;
                        const isSelected = selectedClip?.clipId === clip.id && selectedClip.layerId === layer.id;
                        const isInMultiSelect = selectedClips.has(makeClipSelectionId(layer.id, clip.id));
                        const highlightColor = isInMultiSelect ? "#ffa726" : isSelected ? "#000" : accent;
                        return (
                            <div
                                key={clip.id}
                                style={{
                                    position: "absolute",
                                    top: 6,
                                    left,
                                    width: Math.max(24, width),
                                    height: "calc(100% - 12px)",
                                    background: `linear-gradient(90deg, ${accent}cc, ${accent}99)`,
                                    border: `2px solid ${highlightColor}`,
                                    borderRadius: 6,
                                    color: "#fff",
                                    fontSize: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 6,
                                    boxShadow: isInMultiSelect ? "0 0 0 2px rgba(255,167,38,0.3)" : isSelected ? "0 0 0 2px rgba(0,0,0,0.15)" : "none",
                                    cursor: isLocked ? "not-allowed" : "grab",
                                    pointerEvents: isLocked ? "none" : "auto",
                                }}
                                onMouseDown={(e) => handleClipDragStart(e, layer.id, clip.id, "move")}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedClip({ layerId: layer.id, clipId: clip.id });
                                }}
                            >
                                <div className={css.clipResizeHandle} onMouseDown={(e) => handleClipDragStart(e, layer.id, clip.id, "resize-left")} />
                                <div className={css.clipContent}>
                                    {clip.label}
                                    {clip.reverse && <span className={css.reverseBadge}>(rev)</span>}
                                </div>
                                <div className={css.clipResizeHandle} onMouseDown={(e) => handleClipDragStart(e, layer.id, clip.id, "resize-right")} />
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default LayerTrack;
