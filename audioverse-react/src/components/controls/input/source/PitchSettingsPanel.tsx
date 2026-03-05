/**
 * PitchSettingsPanel — tuning parameters, sliders and action buttons
 * for the AudioPitchLevel component.
 */
import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faFileExport, faFileImport, faArrowRotateLeft, faWrench } from "@fortawesome/free-solid-svg-icons";
import { PitchDetectionMethod } from "../../../../scripts/api/apiUser";
import type { TFunction } from 'i18next';

interface PitchSettingsPanelProps {
    // detection method
    pitchDetectionMethod: PitchDetectionMethod;
    setPitchDetectionMethod: (v: PitchDetectionMethod) => void;
    // tuning params
    smoothingWindow: number;
    setSmoothingWindow: (v: number) => void;
    hysteresisFrames: number;
    setHysteresisFrames: (v: number) => void;
    rmsThreshold: number;
    setRmsThreshold: (v: number) => void;
    useHanning: boolean;
    setUseHanning: (v: boolean) => void;
    // gain & monitor
    micGain: number;
    setMicGain: (v: number) => void;
    monitorEnabled: boolean;
    monitorVolume: number;
    setMonitorVolume: (v: number) => void;
    handleToggleMonitor: (e: React.ChangeEvent<HTMLInputElement>) => void;
    // pitch threshold
    pitchThreshold: number;
    setPitchThreshold: (v: number) => void;
    // actions
    handleSave: () => void;
    handleExport: () => void;
    handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleReset: () => void;
    setShowCalib: (v: boolean) => void;
    importInputRef: React.RefObject<HTMLInputElement>;
    // translation
    t: TFunction;
}

const PitchSettingsPanel: React.FC<PitchSettingsPanelProps> = ({
    pitchDetectionMethod, setPitchDetectionMethod,
    smoothingWindow, setSmoothingWindow,
    hysteresisFrames, setHysteresisFrames,
    rmsThreshold, setRmsThreshold,
    useHanning, setUseHanning,
    micGain, setMicGain,
    monitorEnabled, monitorVolume, setMonitorVolume, handleToggleMonitor,
    pitchThreshold, setPitchThreshold,
    handleSave, handleExport, handleImport, handleReset, setShowCalib,
    importInputRef,
    t,
}) => {
    const usesLocalDetector =
        pitchDetectionMethod === PitchDetectionMethod.UltrastarWP ||
        pitchDetectionMethod === PitchDetectionMethod.Pitchy;

    return (
        <>
            {/* Detection method selector */}
            <div style={{ marginBottom: 8 }}>
                <label>{t('pitch.detectionMethod')}</label>
                <select
                    value={pitchDetectionMethod}
                    onChange={e => setPitchDetectionMethod(Number(e.target.value))}
                    aria-label={t('pitch.detectionMethod')}
                >
                    <option value={PitchDetectionMethod.UltrastarWP}>{t('pitch.methodUltrastarWP')}</option>
                    <option value={PitchDetectionMethod.Crepe}>{t('pitch.methodCrepe')}</option>
                    <option value={PitchDetectionMethod.Pitchy}>{t('pitch.methodPitchy')}</option>
                    <option value={PitchDetectionMethod.Librosa}>{t('pitch.methodLibrosa')}</option>
                </select>
            </div>

            {/* Tuning parameters (local detectors only) */}
            {usesLocalDetector && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label title="Number of recent pitch frames to average for smoothing (e.g., 5).">{t('pitch.smoothing')}</label>
                    <input title="Number of recent pitch frames to average for smoothing (e.g., 5)." type="number" min={1} max={20} value={smoothingWindow} onChange={e => setSmoothingWindow(Number(e.target.value))} style={{ width: 40 }} aria-label={t('pitch.smoothing')} />
                    <label title="Number of consecutive frames without pitch before considering pitch lost (e.g., 5).">{t('pitch.hysteresis')}</label>
                    <input title="Number of consecutive frames without pitch before considering pitch lost (e.g., 5)." type="number" min={1} max={20} value={hysteresisFrames} onChange={e => setHysteresisFrames(Number(e.target.value))} style={{ width: 40 }} aria-label={t('pitch.hysteresis')} />
                    <label title="Root-mean-square amplitude threshold under which audio is considered silent (e.g., 0.02).">{t('pitch.rms')}</label>
                    <input title="Root-mean-square amplitude threshold under which audio is considered silent (e.g., 0.02)." type="number" step={0.001} min={0.001} max={0.1} value={rmsThreshold} onChange={e => setRmsThreshold(Number(e.target.value))} style={{ width: 60 }} aria-label={t('pitch.rms')} />
                    <label title="Apply a Hanning window to the analysis buffer to reduce spectral leakage.">{t('pitch.hanning')}</label>
                    <input title="Apply a Hanning window to the analysis buffer to reduce spectral leakage." type="checkbox" checked={useHanning} onChange={e => setUseHanning(e.target.checked)} aria-label={t('pitch.hanning')} />
                </div>
            )}

            {/* Mic gain */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label>{t('pitch.micGain')}</label>
                <input type="range" min={0} max={24} step={1} value={micGain} onChange={e => setMicGain(Number(e.target.value))} aria-label={t('pitch.micGain')} />
                <span>+{micGain} dB</span>
            </div>

            {/* Monitor */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label>
                    <input type="checkbox" checked={monitorEnabled} onChange={handleToggleMonitor} /> {t('pitch.monitor')}
                </label>
                <label>{t('pitch.monitorVolume')}</label>
                <input type="range" min={0} max={200} step={1} value={monitorVolume} onChange={e => setMonitorVolume(Number(e.target.value))} disabled={!monitorEnabled} aria-label={t('pitch.monitorVolume')} />
                <span>{monitorVolume}%</span>
            </div>

            {/* Pitch threshold */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label>{t('pitch.pitchThreshold')}</label>
                <input type="range" min={0} max={1000} step={1} value={Math.round(pitchThreshold * 1000)} onChange={e => setPitchThreshold(Number(e.target.value) / 1000)} aria-label={t('pitch.pitchThreshold')} />
                <span>{pitchThreshold.toFixed(3)}</span>
            </div>

            {/* Action buttons */}
            <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                    <button className="btn btn-sm btn-outline-light" onClick={handleSave} title="Save">
                        <FontAwesomeIcon icon={faFloppyDisk} className="me-1" />{t('pitch.saveBtn', 'Save')}
                    </button>
                    <button className="btn btn-sm btn-outline-light" onClick={handleExport} title="Export">
                        <FontAwesomeIcon icon={faFileExport} className="me-1" />{t('pitch.exportBtn', 'Export')}
                    </button>
                    <button className="btn btn-sm btn-outline-light" onClick={handleReset} title="Reset">
                        <FontAwesomeIcon icon={faArrowRotateLeft} className="me-1" />{t('pitch.resetBtn', 'Reset')}
                    </button>
                    <button className="btn btn-sm btn-outline-light" onClick={() => importInputRef.current?.click()} title="Import">
                        <FontAwesomeIcon icon={faFileImport} className="me-1" />{t('pitch.importBtn', 'Import')}
                    </button>
                    <button className="btn btn-sm btn-outline-light" onClick={() => setShowCalib(true)} title="Calibrate latency" style={{ marginLeft: 6 }}>
                        <FontAwesomeIcon icon={faWrench} className="me-1" />{t('pitch.calibrateLatency', 'Calibrate latency')}
                    </button>
                    <input
                        type="file"
                        accept="application/json,.json"
                        style={{ display: 'none' }}
                        ref={importInputRef}
                        onChange={handleImport}
                    />
                </div>
            </div>
        </>
    );
};

export default React.memo(PitchSettingsPanel);
