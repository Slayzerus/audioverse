import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getUserMicrophones, updateMicrophone, MicrophoneDto } from '../../../scripts/api/apiUser';
import { estimateLatencyMsFromRecording } from '../../../utils/latencyEstimate';

/** Number of calibration rounds to average */
const ROUNDS = 3;

interface Props {
  deviceId: string;
  onSaved?: (ms: number) => void;
  onClose?: () => void;
}

const LatencyCalibrator: React.FC<Props> = ({ deviceId, onSaved, onClose }) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<string | null>(null);
  const [measuredMs, setMeasuredMs] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [roundResults, setRoundResults] = useState<number[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const runningRef = useRef(false);

  useEffect(() => {
    // load backend value if present
    (async () => {
      try {
        const resp = await getUserMicrophones();
        const mics: MicrophoneDto[] = Array.isArray(resp?.microphones) ? resp.microphones : (resp ?? []);
        const found = mics.find(m => m.deviceId === deviceId);
        if (found) {
          if (typeof found.offsetMs === 'number') setMeasuredMs(found.offsetMs);
        } else {
          const raw = localStorage.getItem(`mic_settings_${deviceId}`);
          if (raw) {
            try { const json = JSON.parse(raw); if (typeof json.offsetMs === 'number') setMeasuredMs(json.offsetMs); } catch (_e) { /* Parse error expected for invalid input */ }
          }
        }
      } catch (_e) { /* Expected: microphone lookup may fail if user is not authenticated */ }
    })();
  }, [deviceId]);

  /** Run a single calibration round using ScriptProcessorNode for sample-accurate recording. */
  const runSingleCalibration = useCallback(async (): Promise<number | null> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });

    const capCtx = new AudioContext();
    const sr = capCtx.sampleRate;
    const capSrc = capCtx.createMediaStreamSource(stream);

    // Use ScriptProcessorNode for sample-accurate capture (better than AnalyserNode polling)
    const bufSize = 2048;
    const processor = capCtx.createScriptProcessor(bufSize, 1, 1);
    capSrc.connect(processor);
    processor.connect(capCtx.destination); // Must be connected to destination for onaudioprocess to fire

    const recordDurationMs = 1200; // record slightly over 1s
    const totalSamples = Math.round((recordDurationMs / 1000) * sr);
    const recordedBuf = new Float32Array(totalSamples);
    let filled = 0;
    let done = false;

    processor.onaudioprocess = (e) => {
      if (done) return;
      const input = e.inputBuffer.getChannelData(0);
      const toCopy = Math.min(input.length, totalSamples - filled);
      if (toCopy > 0) {
        recordedBuf.set(input.subarray(0, toCopy), filled);
        filled += toCopy;
      }
      if (filled >= totalSamples) done = true;
    };

    // Wait a tick to ensure processor is active, then play the click
    await new Promise(r => setTimeout(r, 80));

    // Play calibration click on speakers
    const playCtx = new AudioContext();
    const osc = playCtx.createOscillator();
    const gain = playCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 1000;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(playCtx.destination);

    const now = playCtx.currentTime + 0.05;
    gain.gain.setValueAtTime(0.0001, now - 0.01);
    gain.gain.linearRampToValueAtTime(1.0, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.06);
    osc.start(now - 0.02);
    osc.stop(now + 0.1);

    // Wait for recording to finish
    await new Promise<void>(resolve => {
      const check = () => {
        if (done || filled >= totalSamples) { resolve(); return; }
        setTimeout(check, 50);
      };
      // Also set a hard timeout
      setTimeout(() => { done = true; resolve(); }, recordDurationMs + 500);
      check();
    });

    // Cleanup
    processor.onaudioprocess = null;
    try { processor.disconnect(); } catch (_e) { /* Expected: node may already be disconnected during cleanup */ }
    try { capSrc.disconnect(); } catch (_e) { /* Expected: node may already be disconnected during cleanup */ }
    try { playCtx.close(); } catch (_e) { /* Expected: AudioContext may already be closed */ }
    try { capCtx.close(); } catch (_e) { /* Expected: AudioContext may already be closed */ }
    stream.getTracks().forEach(t => t.stop());

    // Analyze
    const rec = recordedBuf.subarray(0, filled);
    const est = estimateLatencyMsFromRecording(rec, sr, 50 + 80, 30); // click was scheduled ~130ms after recording started (80ms wait + 50ms osc schedule)
    return est;
  }, [deviceId]);

  const calibrate = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setStatus(t('latencyCalibrator.requestingMic', 'Requesting microphone... click allow if prompted'));
    setMeasuredMs(null);
    setRoundResults([]);
    setProgress(0);

    try {
      const results: number[] = [];

      for (let round = 0; round < ROUNDS; round++) {
        setStatus(t('latencyCalibrator.playingTone', 'Playing test tone and recording...') + ` (${round + 1}/${ROUNDS})`);
        setProgress(Math.round(((round) / ROUNDS) * 100));

        const est = await runSingleCalibration();

        if (est !== null) {
          const clamped = Math.max(-500, Math.min(2000, Math.round(est)));
          results.push(clamped);
          setRoundResults([...results]);
        }

        // Short pause between rounds
        if (round < ROUNDS - 1) {
          await new Promise(r => setTimeout(r, 400));
        }
      }

      setProgress(100);

      if (results.length === 0) {
        setStatus(t('latencyCalibrator.noSignal', 'No signal detected — try louder or check microphone'));
        runningRef.current = false;
        return;
      }

      // Average the results, discarding outliers if 3+ measurements
      let avg: number;
      if (results.length >= 3) {
        const sorted = [...results].sort((a, b) => a - b);
        // Remove lowest and highest, average the rest
        const trimmed = sorted.slice(1, -1);
        avg = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length);
      } else {
        avg = Math.round(results.reduce((s, v) => s + v, 0) / results.length);
      }

      setMeasuredMs(avg);
      setStatus(t('latencyCalibrator.measured', `Measured ~${avg} ms (${results.length} samples: ${results.join(', ')} ms)`));
    } catch (err: unknown) {
      setStatus(t('latencyCalibrator.calibrationError', 'Calibration error: ') + (err instanceof Error ? err.message : String(err)));
    }
    runningRef.current = false;
  };

  const saveOffset = async () => {
    if (measuredMs === null) return;
    setSaving(true);
    try {
      const resp = await getUserMicrophones();
      const mics: MicrophoneDto[] = Array.isArray(resp?.microphones) ? resp.microphones : (resp ?? []);
      const found = mics.find(m => m.deviceId === deviceId);
      if (!found || !found.id) {
        // try creating microphone record via update flow in other components; here fallback to localStorage
        const settingsKey = `mic_settings_${deviceId}`;
        try {
          const raw = localStorage.getItem(settingsKey);
          const settings = raw ? JSON.parse(raw) : {};
          settings.offsetMs = measuredMs;
          localStorage.setItem(settingsKey, JSON.stringify(settings));
        } catch (_e) { /* Best-effort — no action needed on failure */ }
        setSaving(false);
        if (onSaved) onSaved(measuredMs);
        setStatus(t('latencyCalibrator.savedLocally', 'Saved locally (no mic record on backend)'));
        return;
      }
      await updateMicrophone(found.id, { offsetMs: Math.round(measuredMs) });
      try {
        const raw = localStorage.getItem(`mic_settings_${deviceId}`);
        const settings = raw ? JSON.parse(raw) : {};
        settings.offsetMs = measuredMs;
        localStorage.setItem(`mic_settings_${deviceId}`, JSON.stringify(settings));
      } catch (_e) { /* Best-effort — no action needed on failure */ }
      setSaving(false);
      setStatus(t('latencyCalibrator.savedBackend', 'Saved to profile (backend)'));
      if (onSaved) onSaved(measuredMs);
    } catch (e) {
      setSaving(false);
      setStatus(t('latencyCalibrator.saveError', 'Save error: ') + String(e));
    }
  };

  return (
    <div style={{ padding: 12 }}>
      <h5>{t('latencyCalibrator.title', 'Latency Calibrator — microphone')}</h5>
      <div>DeviceId: <small style={{ color: '#666' }}>{deviceId}</small></div>
      <div style={{ marginTop: 8 }}>
        <button onClick={calibrate} disabled={runningRef.current} className="btn btn-primary">{t('latencyCalibrator.calibrate', 'Calibrate')}</button>
        <button onClick={() => { setMeasuredMs(null); setStatus(null); setRoundResults([]); setProgress(0); }} style={{ marginLeft: 8 }} className="btn btn-secondary">{t('latencyCalibrator.clear', 'Clear')}</button>
      </div>
      {/* Progress bar */}
      {runningRef.current && (
        <div style={{ marginTop: 6 }}>
          <div className="progress" style={{ height: 6 }}>
            <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      {/* Round results */}
      {roundResults.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
          {t('latencyCalibrator.rounds', 'Rounds')}: {roundResults.map((r, i) => (
            <span key={i} style={{ marginLeft: 4 }}>{r} ms{i < roundResults.length - 1 ? ',' : ''}</span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <div>{t('latencyCalibrator.status', 'Status')}: {status ?? t('latencyCalibrator.none', 'none')}</div>
        <div>{t('latencyCalibrator.measuredOffset', 'Measured offset')}: {measuredMs !== null ? <strong>{measuredMs} ms</strong> : '—'}</div>
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={saveOffset} disabled={measuredMs === null || saving} className="btn btn-success">{t('latencyCalibrator.saveBackend', 'Save (to backend)')}</button>
        <button onClick={() => onClose && onClose()} style={{ marginLeft: 8 }} className="btn btn-outline-secondary">{t('latencyCalibrator.close', 'Close')}</button>
      </div>
    </div>
  );
};

export default LatencyCalibrator;
