import React from "react";
import { useTranslation } from 'react-i18next';
import type { AutoSaveMode } from "../../../../models/editor/fxTypes";
import type { SnapMode } from "../../../../models/editor/timelineTypes";
import type { MasterEQPreset } from "../../../../models/editor/fxTypes";
import css from './EditorPanels.module.css';

// ── Auto-Save Panel ──────────────────────────────────────────────

interface AutoSavePanelProps {
    autoSaveMode: AutoSaveMode;
    setAutoSaveMode: (m: AutoSaveMode) => void;
    autoSaveInterval: number;
    setAutoSaveInterval: (n: number) => void;
}

export const AutoSavePanel: React.FC<AutoSavePanelProps> = ({
    autoSaveMode,
    setAutoSaveMode,
    autoSaveInterval,
    setAutoSaveInterval,
}) => {
    const { t } = useTranslation();
    return (
    <div className={`card p-3 mb-3 ${css.panelNarrow}`}>
        <h6 className="mb-2">{t('editorPanels.autoSaveTitle', 'Project auto-save')}</h6>
        <div className="mb-2">
            <label className="form-label">{t('editorPanels.autoSaveMode', 'Auto-save mode')}:</label>
            <select
                className="form-select"
                value={autoSaveMode}
                onChange={(e) => setAutoSaveMode(e.target.value as AutoSaveMode)}
            >
                <option value="off">{t('editorPanels.off', 'Off')}</option>
                <option value="onChange">{t('editorPanels.onChange', 'On every change')}</option>
                <option value="interval">{t('editorPanels.interval', 'At set interval')}</option>
                <option value="both">{t('editorPanels.both', 'Both')}</option>
            </select>
        </div>
        {(autoSaveMode === "interval" || autoSaveMode === "both") && (
            <div className="mb-2">
                <label className="form-label">{t('editorPanels.autoSaveFrequency', 'Auto-save frequency (seconds)')}:</label>
                <input
                    type="number"
                    className="form-control"
                    min={5}
                    max={600}
                    value={autoSaveInterval}
                    onChange={(e) =>
                        setAutoSaveInterval(Math.max(5, Math.min(600, Number(e.target.value))))
                    }
                />
            </div>
        )}
        <div className={css.noteText}>
            <b>{t('editorPanels.noteLabel', 'Note')}:</b> {t('editorPanels.autoSaveNote', 'Auto-save works locally (localStorage/browser). Manual save (PUT) always overwrites the project on the server.')}
        </div>
    </div>
    );
};

// ── Undo/Redo Panel ──────────────────────────────────────────────

interface UndoRedoPanelProps {
    undoCount: number;
    redoCount: number;
    onUndo: () => void;
    onRedo: () => void;
}

export const UndoRedoPanel: React.FC<UndoRedoPanelProps> = ({
    undoCount,
    redoCount,
    onUndo,
    onRedo,
}) => {
    const { t } = useTranslation();
    return (
    <div className={`card p-3 mb-3 ${css.panelNarrow}`}>
        <h6 className="mb-2">{t('editorPanels.changeHistory', 'Project change history')}</h6>
        <div className={css.buttonRow}>
            <button
                className="btn btn-secondary"
                onClick={onUndo}
                disabled={undoCount === 0}
                title={t('editorPanels.undoTitle', 'Undo last change (Ctrl+Z)')}
            >
                ↩️ {t('editorPanels.undo', 'Undo')}
            </button>
            <button
                className="btn btn-secondary"
                onClick={onRedo}
                disabled={redoCount === 0}
                title={t('editorPanels.redoTitle', 'Redo change (Ctrl+Y or Ctrl+Shift+Z)')}
            >
                ↪️ {t('editorPanels.redo', 'Redo')}
            </button>
        </div>
        <div className={css.noteTextMargin}>
            {t('editorPanels.undoRedoNote', 'Undo/Redo works on the entire project (all editor changes). After each change Redo is cleared.')}
        </div>
    </div>
    );
};

// ── Zoom & Snap Controls ─────────────────────────────────────────

interface ZoomSnapControlsProps {
    zoom: number;
    setZoom: (n: number) => void;
    uiZoom: number;
    setUiZoom: (n: number) => void;
    snapEnabled: boolean;
    onToggleSnap: () => void;
    snapMode: SnapMode;
    onSnapModeChange: (m: SnapMode) => void;
    bpm: number;
    setBpm: (n: number) => void;
}

export const ZoomSnapControls: React.FC<ZoomSnapControlsProps> = ({
    zoom,
    setZoom,
    uiZoom,
    setUiZoom,
    snapEnabled,
    onToggleSnap,
    snapMode,
    onSnapModeChange,
    bpm,
    setBpm,
}) => {
    const { t } = useTranslation();
    return (
    <div className={`card p-2 mb-3 ${css.panelNarrow}`}>
        <div className="d-flex align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
                <label className={`form-label mb-0 ${css.smallLabel}`}>
                    Zoom:
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className={css.rangeW100}
                />
                <span className={css.zoomValue}>{zoom.toFixed(1)}x</span>
            </div>
            <div className="d-flex align-items-center gap-2">
                <label className={`form-label mb-0 ${css.smallLabel}`}>
                    Zoom UI:
                </label>
                <input
                    type="range"
                    min="1"
                    max="4"
                    step="0.1"
                    value={uiZoom}
                    onChange={(e) => setUiZoom(Number(e.target.value))}
                    className={css.rangeW100}
                />
                <span className={css.zoomValue}>{uiZoom.toFixed(1)}x</span>
            </div>
            <div className="d-flex align-items-center gap-2">
                <input
                    id="snap-toggle"
                    type="checkbox"
                    className="form-check-input"
                    checked={snapEnabled}
                    onChange={onToggleSnap}
                />
                <label htmlFor="snap-toggle" className={`form-check-label mb-0 ${css.smallLabel}`}>
                    Snap
                </label>
            </div>
            {snapEnabled && (
                <select
                    className={`form-select form-select-sm ${css.selectW100}`}
                    value={snapMode}
                    onChange={(e) => onSnapModeChange(e.target.value as SnapMode)}
                >
                    <option value="bar">{t('editorPanels.snapBar', 'Bar')}</option>
                    <option value="beat">{t('editorPanels.snapBeat', 'Beat')}</option>
                    <option value="sub-beat">{t('editorPanels.snap16', '1/16')}</option>
                    <option value="second">{t('editorPanels.snapSecond', 'Second')}</option>
                </select>
            )}
            <div className="d-flex align-items-center gap-2">
                <label className={`form-label mb-0 ${css.smallLabel}`}>
                    BPM:
                </label>
                <input
                    type="number"
                    className={`form-control form-control-sm ${css.inputW70}`}
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    min="20"
                    max="300"
                />
            </div>
        </div>
    </div>
    );
};

// ── Master FX Panel ──────────────────────────────────────────────

interface MasterFXPanelProps {
    masterVolume: number;
    onMasterVolumeChange: (v: number) => void;
    filterType: BiquadFilterType;
    filterFreq: number;
    filterQ: number;
    filterGain: number;
    onFilterChange: (patch: Partial<{ type: BiquadFilterType; frequency: number; q: number; gain: number }>) => void;
    masterEQPresets: MasterEQPreset[];
    customPresets: MasterEQPreset[];
    onLoadPreset: (p: MasterEQPreset) => void;
    onSavePreset: (name: string) => void;
    onDeletePreset: (name: string) => void;
}

export const MasterFXPanel: React.FC<MasterFXPanelProps> = ({
    masterVolume,
    onMasterVolumeChange,
    filterType,
    filterFreq,
    filterQ,
    filterGain,
    onFilterChange,
    masterEQPresets,
    customPresets,
    onLoadPreset,
    onSavePreset,
    onDeletePreset,
}) => {
    const { t } = useTranslation();
    return (
    <div className={`card p-2 mb-3 ${css.panelWide}`}>
        <div className="d-flex align-items-center flex-wrap gap-3">
            <div className={`d-flex align-items-center gap-2 ${css.masterVolGroup}`}>
                <label className={`form-label mb-0 ${css.smallLabel}`}>
                    Master Vol
                </label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={masterVolume}
                    onChange={(e) => onMasterVolumeChange(Number(e.target.value))}
                    className={css.rangeW140}
                />
                <span className={css.volumeValue}>
                    {Math.round(masterVolume * 100)}%
                </span>
            </div>
            <div className="d-flex align-items-center gap-2">
                <label className={`form-label mb-0 ${css.smallLabel}`}>
                    Filter
                </label>
                <select
                    className={`form-select form-select-sm ${css.selectW140}`}
                    value={filterType}
                    onChange={(e) => onFilterChange({ type: e.target.value as BiquadFilterType })}
                >
                    {["peaking", "lowpass", "highpass", "lowshelf", "highshelf", "notch", "bandpass"].map((ft) => (
                        <option key={ft} value={ft}>
                            {ft}
                        </option>
                    ))}
                </select>
            </div>
            <div className={`d-flex align-items-center gap-2 ${css.freqGroup}`}>
                <span className={css.smallLabel}>Freq</span>
                <input
                    type="range"
                    min="40"
                    max="12000"
                    step="10"
                    value={filterFreq}
                    onChange={(e) => onFilterChange({ frequency: Number(e.target.value) })}
                    className={css.rangeW140}
                />
                <span className={css.freqValue}>
                    {Math.round(filterFreq)} Hz
                </span>
            </div>
            <div className={`d-flex align-items-center gap-2 ${css.narrowGroup}`}>
                <span className={css.smallLabel}>Q</span>
                <input
                    type="range"
                    min="0.1"
                    max="12"
                    step="0.1"
                    value={filterQ}
                    onChange={(e) => onFilterChange({ q: Number(e.target.value) })}
                    className={css.rangeW120}
                />
                <span className={css.smallValue}>{filterQ.toFixed(1)}</span>
            </div>
            {(filterType === "peaking" || filterType === "lowshelf" || filterType === "highshelf") && (
                <div className={`d-flex align-items-center gap-2 ${css.narrowGroup}`}>
                    <span className={css.smallLabel}>Gain</span>
                    <input
                        type="range"
                        min="-18"
                        max="18"
                        step="0.5"
                        value={filterGain}
                        onChange={(e) => onFilterChange({ gain: Number(e.target.value) })}
                        className={css.rangeW120}
                    />
                    <span className={css.smallValue}>{filterGain.toFixed(1)} dB</span>
                </div>
            )}
        </div>
        {/* EQ Presets */}
        <div className={`mt-2 pt-2 ${css.presetDivider}`}>
            <div className="d-flex align-items-center gap-2 mb-2">
                <span className={css.presetLabel}>{t('editorPanels.eqPresets', 'EQ Presets')}:</span>
                {[...masterEQPresets, ...customPresets].map((preset) => (
                    <button
                        key={preset.name}
                        className={`btn btn-sm btn-outline-secondary ${css.presetBtn}`}
                        onClick={() => onLoadPreset(preset)}
                    >
                        {preset.name}
                    </button>
                ))}
                {customPresets.length > 0 && (
                    <select
                        className={`form-select form-select-sm ${css.deletePresetSelect}`}
                        onChange={(e) => {
                            if (e.target.value) {
                                onDeletePreset(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="">{t('editorPanels.deletePreset', 'Delete preset...')}</option>
                        {customPresets.map((p) => (
                            <option key={p.name} value={p.name}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <div className="d-flex align-items-center gap-2">
                <input
                    type="text"
                    className={`form-control form-control-sm ${css.presetNameInput}`}
                    placeholder={t('editorPanels.presetName', 'Preset name...')}
                    id="presetNameInput"
                />
                <button
                    className={`btn btn-sm btn-success ${css.savePresetBtn}`}
                    onClick={() => {
                        const input = document.getElementById("presetNameInput") as HTMLInputElement;
                        if (input?.value.trim()) {
                            onSavePreset(input.value.trim());
                            input.value = "";
                        }
                    }}
                >
                    {t('editorPanels.saveCurrent', 'Save Current')}
                </button>
            </div>
        </div>
    </div>
    );
};

// ── Recording Options Panel ──────────────────────────────────────

interface RecordingOptionsPanelProps {
    countInBars: number;
    setCountInBars: (n: number) => void;
    isCountIn: boolean;
    countInRemaining: number;
    overdubEnabled: boolean;
    setOverdubEnabled: (b: boolean) => void;
    punchIn: number | null;
    setPunchIn: (n: number | null) => void;
    punchOut: number | null;
    setPunchOut: (n: number | null) => void;
    monitorLevel: number;
}

export const RecordingOptionsPanel: React.FC<RecordingOptionsPanelProps> = ({
    countInBars,
    setCountInBars,
    isCountIn,
    countInRemaining,
    overdubEnabled,
    setOverdubEnabled,
    punchIn,
    setPunchIn,
    punchOut,
    setPunchOut,
    monitorLevel,
}) => {
    const { t } = useTranslation();
    return (
    <div className={`card p-2 mb-3 ${css.panelWide}`}>
        <div className="d-flex align-items-center flex-wrap gap-3">
            <div className="d-flex align-items-center gap-2">
                <label className={`form-label mb-0 ${css.smallLabel}`}>
                    {t('editorPanels.countIn', 'Count-in (bars)')}:
                </label>
                <input
                    type="number"
                    min="0"
                    max="8"
                    step="1"
                    className={`form-control form-control-sm ${css.inputW70}`}
                    value={countInBars}
                    onChange={(e) => setCountInBars(Number(e.target.value))}
                />
                {isCountIn && (
                    <span className={css.countInAlert}>
                        Count-in: {countInRemaining.toFixed(1)}s
                    </span>
                )}
            </div>
            <div className="form-check d-flex align-items-center gap-2">
                <input
                    id="overdub-toggle"
                    className="form-check-input"
                    type="checkbox"
                    checked={overdubEnabled}
                    onChange={(e) => setOverdubEnabled(e.target.checked)}
                />
                <label htmlFor="overdub-toggle" className={`form-check-label ${css.smallLabel}`}>
                    {t('editorPanels.overdub', 'Overdub (play background)')}
                </label>
            </div>
            <div className="d-flex align-items-center gap-1">
                <span className={css.smallLabel}>Punch In</span>
                <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={`form-control form-control-sm ${css.inputW80}`}
                    value={punchIn ?? ""}
                    onChange={(e) => setPunchIn(e.target.value === "" ? null : Number(e.target.value))}
                />
                <span className={css.smallLabel}>s</span>
            </div>
            <div className="d-flex align-items-center gap-1">
                <span className={css.smallLabel}>Punch Out</span>
                <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={`form-control form-control-sm ${css.inputW80}`}
                    value={punchOut ?? ""}
                    onChange={(e) => setPunchOut(e.target.value === "" ? null : Number(e.target.value))}
                />
                <span className={css.smallLabel}>s</span>
            </div>
            <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => {
                    setPunchIn(null);
                    setPunchOut(null);
                }}
            >
                {t('editorPanels.clearPunch', 'Clear punch')}
            </button>
            <div className={css.levelLabel}>Level</div>
            <div className={css.levelMeter}>
                <div
                    className={css.levelBar}
                    style={{
                        width: `${Math.min(1, monitorLevel * 2) * 100}%`,
                        background: monitorLevel > 0.7 ? "#f44336" : "#4caf50",
                    }}
                />
            </div>
        </div>
    </div>
    );
};
