/**
 * AudioPitchLevel — thin orchestrator that delegates all logic to
 * useAudioPitchLevel hook and renders sub-components.
 *
 * Extracted sub-modules:
 *  - useAudioPitchLevel  (hook — all state / effects / handlers)
 *  - PitchDisplay        (start button + pitch bar + note readout)
 *  - FFTCanvas           (FFT spectrum + note-timeline canvases)
 *  - PitchSettingsPanel  (tuning sliders, monitor, action buttons)
 */
import React from "react";
import { Modal } from 'react-bootstrap';
import LatencyCalibrator from '../../karaoke/LatencyCalibrator';
import { useAudioPitchLevel } from './useAudioPitchLevel';
import type { AudioPitchLevelProps } from './useAudioPitchLevel';
import PitchDisplay from './PitchDisplay';
import FFTCanvas from './FFTCanvas';
import PitchSettingsPanel from './PitchSettingsPanel';

const AudioPitchLevel: React.FC<AudioPitchLevelProps> = (props) => {
    const h = useAudioPitchLevel(props);

    return (
        <>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", fontSize: 12, width: "100%" }}>
                {/* Row 1: Settings panel (method, tuning, sliders, buttons) */}
                <PitchSettingsPanel
                    pitchDetectionMethod={h.pitchDetectionMethod}
                    setPitchDetectionMethod={h.setPitchDetectionMethod}
                    smoothingWindow={h.smoothingWindow}
                    setSmoothingWindow={h.setSmoothingWindow}
                    hysteresisFrames={h.hysteresisFrames}
                    setHysteresisFrames={h.setHysteresisFrames}
                    rmsThreshold={h.rmsThreshold}
                    setRmsThreshold={h.setRmsThreshold}
                    useHanning={h.useHanning}
                    setUseHanning={h.setUseHanning}
                    micGain={h.micGain}
                    setMicGain={h.setMicGain}
                    monitorEnabled={h.monitorEnabled}
                    monitorVolume={h.monitorVolume}
                    setMonitorVolume={h.setMonitorVolume}
                    handleToggleMonitor={h.handleToggleMonitor}
                    pitchThreshold={h.pitchThreshold}
                    setPitchThreshold={h.setPitchThreshold}
                    handleSave={h.handleSave}
                    handleExport={h.handleExport}
                    handleImport={h.handleImport}
                    handleReset={h.handleReset}
                    setShowCalib={h.setShowCalib}
                    importInputRef={h.importInputRef}
                    t={h.t}
                />

                {/* Row 2: Pitch display (start + pitch bar + note) */}
                <PitchDisplay
                    analysisActive={h.analysisActive}
                    startAnalysis={h.startAnalysis}
                    barWidth={h.barWidth}
                    note={h.note}
                    pitch={h.pitch}
                    t={h.t}
                    backendUnavailable={h.backendUnavailable}
                />

                {/* Row 3: FFT + timeline canvases */}
                <FFTCanvas fftData={h.fftData} noteHistory={h.noteHistory} />
            </div>

            {/* Latency calibration modal */}
            <Modal show={h.showCalib} onHide={() => h.setShowCalib(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{h.t('latency.modalTitle')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <LatencyCalibrator deviceId={props.deviceId} onClose={() => h.setShowCalib(false)} />
                </Modal.Body>
            </Modal>
        </>
    );
};

export default React.memo(AudioPitchLevel);
