import styles from '../AudioEditor.module.css';
import { useAudioEditor } from "./useAudioEditor";
import { AutoSavePanel, UndoRedoPanel, ZoomSnapControls, MasterFXPanel, RecordingOptionsPanel } from "./panels/EditorPanels";
import { ProjectPanel } from "./panels/ProjectPanel";
import { SectionPanel } from "./panels/SectionPanel";
import { AdvancedEditingPanel, ClipOperationsPanel } from "./panels/AdvancedEditingPanel";
import { DisplayModeSelector } from "./panels/DisplayModeSelector";
import LayerTrack from "./panels/LayerTrack";
import SaveLoadControlsContainer from "./SaveLoadControlsContainer";
import AudioTimelineNavContainer from "./AudioTimelineNavContainer";
import AudioMiniMapContainer from "./AudioMiniMapContainer";
import AudioLayersNavContainer from "./AudioLayersNavContainer";
import AudioLayerDetailsContainer from "./AudioLayerDetailsContainer";
import Oxygen25Demo from "../input/source/Oxygen25Demo";
import { gripStyle } from "../../../constants/ui";
import { EditorTrackProvider, type EditorTrackContextValue } from "../../../contexts/EditorTrackContext";
import { useState } from "react";
import { useCCAutomation } from "../../../hooks/useCCAutomation";
import { useStepSequencer } from "../../../hooks/useStepSequencer";
import CCAutomationLaneEditor from "./panels/CCAutomationLaneEditor";
import StepSequencerPanel from "./panels/StepSequencerPanel";
import ArpeggiatorPanel from "./panels/ArpeggiatorPanel";
import LFOPanel from "./panels/LFOPanel";
import { DEFAULT_ARP_CONFIG, type ArpConfig } from "../../../utils/arpeggiator";
import { createDefaultLFO, type LFOConfig } from "../../../utils/lfoEngine";

export default function AudioEditor() {
    const ed = useAudioEditor();
    const ccAutomation = useCCAutomation();
    const stepSeq = useStepSequencer();
    const [arpConfig, setArpConfig] = useState<ArpConfig>(DEFAULT_ARP_CONFIG);
    const [arpActive, setArpActive] = useState(false);
    const [editorLFOs, setEditorLFOs] = useState<LFOConfig[]>([createDefaultLFO()]);

    return (
        <div className={`${styles['audio-editor']} ${ed.theme === "dark" ? "audioverse-dark" : "audioverse-light"}`} style={{ display: "flex", flexDirection: "row", height: "100vh", minHeight: 700 }}>
            {/* Theme toggle */}
            <button
                className="btn btn-sm btn-outline-secondary"
                style={{ position: "fixed", top: 12, left: 12, zIndex: 999 }}
                title={ed.theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                onClick={() => ed.setTheme(ed.theme === "dark" ? "light" : "dark")}
            >
                {ed.theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </button>

            {/* Tutorial button */}
            <button
                className="btn btn-sm btn-outline-info"
                style={{ position: "fixed", bottom: 16, right: 16, zIndex: 999 }}
                title="Show editor tutorial"
                onClick={ed.launchEditorTutorial}
            >
                ?
            </button>

            {/* Shortcuts help modal */}
            {ed.showShortcuts && (
                <div style={{ position: "fixed", top: 40, right: 40, zIndex: 9999, background: "#fff", border: "2px solid #1976d2", borderRadius: 8, padding: 24, boxShadow: "0 4px 24px #0002" }}>
                    <h5 style={{ marginTop: 0 }}>Keyboard Shortcuts</h5>
                    <ul style={{ fontSize: 15, marginBottom: 8 }}>
                        <li><b>Ctrl+Z</b> – Undo</li>
                        <li><b>Ctrl+Y</b> or <b>Ctrl+Shift+Z</b> – Redo</li>
                        <li><b>Ctrl+S</b> – Save project</li>
                        <li><b>Space</b> – Play/Pause</li>
                        <li><b>Shift+?</b> – Show/hide this help</li>
                    </ul>
                    <button className="btn btn-outline-secondary" onClick={() => ed.setShowShortcuts(false)}>Close</button>
                </div>
            )}

            {/* ─── Sidebar ─── */}
            <div style={{ width: ed.sidebarWidth, minWidth: 180, maxWidth: 600, background: "#f8f9fa", borderRight: "1px solid #ddd", height: "100%", overflowY: "auto", padding: 0 }}>
                {/* Display Mode Selector — always visible */}
                <DisplayModeSelector mode={ed.displayMode} onChange={ed.handleDisplayModeChange} />

                {ed.modeConfig.showAutoSave && (
                    <AutoSavePanel
                        autoSaveMode={ed.autoSaveMode}
                        setAutoSaveMode={ed.setAutoSaveMode}
                        autoSaveInterval={ed.autoSaveInterval}
                        setAutoSaveInterval={ed.setAutoSaveInterval}
                    />
                )}

                {/* Shortcuts toggle */}
                <button className="btn btn-sm btn-outline-info" style={{ position: "fixed", top: 12, right: 12, zIndex: 999 }} title="Keyboard shortcuts (Shift+?)" aria-label="Show keyboard shortcuts" onClick={() => ed.setShowShortcuts((s) => !s)}>?</button>

                {ed.modeConfig.showUndoRedo && (
                    <UndoRedoPanel
                        undoCount={ed.undoStack.length}
                        redoCount={ed.redoStack.length}
                        onUndo={ed.handleUndoWrapper}
                        onRedo={ed.handleRedoWrapper}
                    />
                )}

                {ed.modeConfig.showSaveLoad && (
                    <SaveLoadControlsContainer project={ed.project} onLoadProject={ed.handleLoadProject} />
                )}

                {ed.modeConfig.showProjectSettings && ed.project && (
                    <ProjectPanel
                        project={ed.project}
                        projectName={ed.projectName}
                        setProjectName={ed.setProjectName}
                        projectIsTemplate={ed.projectIsTemplate}
                        setProjectIsTemplate={ed.setProjectIsTemplate}
                        projectVolume={ed.projectVolume}
                        setProjectVolume={ed.setProjectVolume}
                        handleSaveProject={ed.handleSaveProject}
                        bounceProject={ed.bounceProject}
                        saveTemplate={ed.saveTemplate}
                        loadTemplate={ed.loadTemplate}
                        exportProject={ed.exportProject}
                        importInputRef={ed.importInputRef}
                        importProject={ed.importProject}
                    />
                )}

                {ed.modeConfig.showSectionSettings && ed.project && (
                    <SectionPanel
                        sectionName={ed.sectionName}
                        setSectionName={ed.setSectionName}
                        sectionOrder={ed.sectionOrder}
                        setSectionOrder={ed.setSectionOrder}
                        handleSaveSection={ed.handleSaveSection}
                    />
                )}

                {ed.modeConfig.showZoomSnap && (
                    <ZoomSnapControls
                    zoom={ed.zoom}
                    setZoom={ed.setZoom}
                    uiZoom={ed.uiZoom}
                    setUiZoom={ed.setUiZoom}
                    snapEnabled={ed.snapEnabled}
                    snapMode={ed.snapMode}
                    onToggleSnap={ed.handleToggleSnap}
                    onSnapModeChange={ed.handleSnapModeChange}
                    bpm={ed.bpm}
                    setBpm={ed.setBpm}
                />
                )}

                {ed.modeConfig.showMasterFX && (
                    <MasterFXPanel
                    masterVolume={ed.masterVolume}
                    onMasterVolumeChange={ed.handleMasterVolumeChange}
                    filterType={ed.filterType}
                    filterFreq={ed.filterFreq}
                    filterQ={ed.filterQ}
                    filterGain={ed.filterGain}
                    onFilterChange={ed.updateFilter}
                    masterEQPresets={ed.masterEQPresets}
                    customPresets={ed.customPresets}
                    onLoadPreset={ed.loadMasterEQPreset}
                    onSavePreset={ed.saveMasterEQPreset}
                    onDeletePreset={ed.deleteCustomPreset}
                />
                )}

                {ed.modeConfig.showAdvancedEditing && (
                    <AdvancedEditingPanel
                    selectedClips={ed.selectedClips}
                    clearSelection={ed.clearSelection}
                    rippleMode={ed.rippleMode}
                    setRippleMode={ed.setRippleMode}
                    quantizeSelectedClips={ed.quantizeSelectedClips}
                    deleteSelectedClips={ed.deleteSelectedClips}
                    applyTimeStretch={ed.applyTimeStretch}
                />
                )}

                {ed.modeConfig.showRecordingOptions && (
                    <RecordingOptionsPanel
                    countInBars={ed.countInBars}
                    setCountInBars={ed.setCountInBars}
                    isCountIn={ed.isCountIn}
                    countInRemaining={ed.countInRemaining}
                    overdubEnabled={ed.overdubEnabled}
                    setOverdubEnabled={ed.setOverdubEnabled}
                    punchIn={ed.punchIn}
                    setPunchIn={ed.setPunchIn}
                    punchOut={ed.punchOut}
                    setPunchOut={ed.setPunchOut}
                    monitorLevel={ed.monitorLevel}
                />
                )}

                {/* Transport */}
                <div title="Transport: Play, Stop, Loop, Record, timeline navigation">
                    <AudioTimelineNavContainer
                        isPlaying={ed.isPlaying}
                        isLooping={ed.isLooping}
                        currentTime={ed.currentTime}
                        duration={ed.duration}
                        onPlayPause={ed.handlePlayPause}
                        onRecord={ed.handleRecord}
                        onLoop={ed.handleToggleLoop}
                        onAdjustDuration={ed.handleAdjustDuration}
                    />

                    {ed.modeConfig.showClipOperations && (
                        <ClipOperationsPanel
                        selectedClip={ed.selectedClip}
                        clipboardClip={ed.clipboardClip}
                        activeLayerId={ed.activeLayer?.id}
                        layerClips={ed.layerClips}
                        handleSplitClip={ed.handleSplitClip}
                        handleDeleteClip={ed.handleDeleteClip}
                        handleCopyClip={ed.handleCopyClip}
                        handlePasteClip={ed.handlePasteClip}
                        handleToggleReverse={ed.handleToggleReverse}
                        handleFadeChange={ed.handleFadeChange}
                    />
                    )}

                    {/* MiniMap */}
                    {ed.modeConfig.showMiniMap && (
                        <div className="mb-3" style={{ maxWidth: 800 }} title="Project mini-map (timeline overview)">
                            <AudioMiniMapContainer duration={ed.duration} currentTime={ed.currentTime} bpm={ed.bpm} waveform={ed.miniMapWaveform} />
                        </div>
                    )}

                    <AudioLayersNavContainer onAddLayer={ed.handleAddLayer} onLoadPreset={() => {}} onSavePreset={() => {}} />
                </div>

                {/* Layer List */}
                <div className={styles['layer-selection']} style={{ maxHeight: 460, overflowY: "auto", paddingRight: 6 }}>
                    <EditorTrackProvider value={{
                        isPlaying: ed.isPlaying,
                        isRecording: ed.isRecording,
                        currentTime: ed.currentTime,
                        duration: ed.duration,
                        bpm: ed.bpm,
                        zoom: ed.zoom,
                        snapEnabled: ed.snapEnabled,
                        snapMode: ed.snapMode,
                        showLayerEffects: ed.modeConfig.showLayerEffects ?? true,
                        showMidiPianoRoll: ed.modeConfig.showMidiPianoRoll ?? true,
                        showLayerDragReorder: ed.modeConfig.showLayerDragReorder ?? true,
                        isSoloMode: ed.isSoloMode,
                        activeLayerId: ed.activeLayer?.id,
                        selectedClip: ed.selectedClip,
                        selectedClips: ed.selectedClips,
                        selectedMidiNote: ed.selectedMidiNote,
                        setActiveLayer: ed.setActiveLayer,
                        addClipToLayer: ed.addClipToLayer,
                        handleDeleteLayer: ed.handleDeleteLayer,
                        handleToggleSolo: ed.handleToggleSolo,
                        handleToggleMute: ed.handleToggleMute,
                        handleVolumeChange: ed.handleVolumeChange,
                        handlePanChange: ed.handlePanChange,
                        handleColorChange: ed.handleColorChange,
                        handleGroupChange: ed.handleGroupChange,
                        handleToggleLock: ed.handleToggleLock,
                        updateLayerSetting: ed.updateLayerSetting,
                        handleDragStart: ed.handleDragStart,
                        handleDragEnd: ed.handleDragEnd,
                        handleDragOver: ed.handleDragOver,
                        handleDrop: ed.handleDrop,
                        handleClipDragStart: ed.handleClipDragStart,
                        setSelectedClip: ed.setSelectedClip,
                        makeClipSelectionId: ed.makeClipSelectionId,
                        handleSeek: ed.handleSeek,
                        handleZoomChange: ed.handleZoomChange,
                        addEffectToLayerWrapper: ed.addEffectToLayerWrapper,
                        removeEffectFromLayerWrapper: ed.removeEffectFromLayerWrapper,
                        toggleEffectBypassWrapper: ed.toggleEffectBypassWrapper,
                        updateEffectParamsWrapper: ed.updateEffectParamsWrapper,
                        setLayerMidiNotes: ed.setLayerMidiNotes,
                        setSelectedMidiNote: ed.setSelectedMidiNote,
                        handleSelectCCLaneWrapper: ed.handleSelectCCLaneWrapper,
                        handleAddCCEventWrapper: ed.handleAddCCEventWrapper,
                        handleUpdateCCEventWrapper: ed.handleUpdateCCEventWrapper,
                        handleRemoveCCEventWrapper: ed.handleRemoveCCEventWrapper,
                    } satisfies EditorTrackContextValue}>
                    {ed.layers.map((layer, idx) => (
                        <LayerTrack
                            key={layer.id}
                            layer={layer}
                            idx={idx}
                            settings={ed.layerSettings[layer.id]}
                            clips={ed.layerClips[layer.id] || []}
                            waveform={ed.waveforms[layer.id]}
                            layerCCType={ed.layerCCType[layer.id] ?? 1}
                            ccEvents={(ed.layerMidiCC[layer.id] || []).filter((ev) => ev.cc === (ed.layerCCType[layer.id] ?? 1))}
                        />
                    ))}
                    </EditorTrackProvider>
                </div>

                {/* Active layer details */}
                {ed.activeLayer && (
                    <AudioLayerDetailsContainer
                        layer={ed.activeLayer}
                        onLayerChange={(updatedLayer) => {
                            ed.setActiveLayer((prev) => (prev?.id === updatedLayer.id ? updatedLayer : prev));
                        }}
                        onSave={ed.handleSaveLayer}
                    />
                )}

                <Oxygen25Demo />

                {/* ─── MIDI Automation & Tools ─── */}
                {ed.modeConfig.showMidiAutomation && ed.activeLayer && (
                    <div className="p-2">
                        <CCAutomationLaneEditor
                            layerId={ed.activeLayer.id}
                            ccNumber={ed.layerCCType[ed.activeLayer.id] ?? 1}
                            duration={ed.duration || 60}
                            zoom={ed.zoom}
                            automation={ccAutomation}
                            onChangeCCNumber={(cc) => ed.handleSelectCCLaneWrapper(ed.activeLayer!.id, cc)}
                        />
                        <StepSequencerPanel seq={stepSeq} />
                        <ArpeggiatorPanel
                            config={arpConfig}
                            onChange={setArpConfig}
                            active={arpActive}
                            onToggleActive={() => setArpActive(a => !a)}
                        />
                        {editorLFOs.map((lfo, i) => (
                            <LFOPanel
                                key={i}
                                index={i}
                                config={lfo}
                                onChange={(updated) => setEditorLFOs(prev => prev.map((l, idx) => idx === i ? updated : l))}
                                onRemove={editorLFOs.length > 1 ? () => setEditorLFOs(prev => prev.filter((_, idx) => idx !== i)) : undefined}
                            />
                        ))}
                        <button
                            className="btn btn-sm btn-outline-primary w-100 mb-2"
                            onClick={() => setEditorLFOs(prev => [...prev, createDefaultLFO()])}
                        >
                            + Add LFO
                        </button>
                    </div>
                )}
            </div>

            {/* Grip for sidebar resize */}
            <div style={gripStyle} onMouseDown={() => { ed.resizingSidebar.current = true; }} title="Drag to resize sidebar" />

            {/* Main content area */}
            <div style={{ flex: 1, minWidth: 0, background: "#fff", height: "100%", overflow: "auto", position: "relative" }}>
                {/* Timeline and other UI goes here */}
            </div>
        </div>
    );
}
