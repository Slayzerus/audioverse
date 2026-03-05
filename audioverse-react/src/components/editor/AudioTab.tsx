import React, { useRef, useState, useImperativeHandle, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { analyzeAudioFileWithAlgorithm, PitchAlgorithm, PitchSegment } from "../../utils/audioPitchAnalyzeFile";
import StemSeparator, { StemTrack } from "./StemSeparator";
import SongMetadataLookup, { SongMetadata } from "./SongMetadataLookup";
import { logger } from '../../utils/logger';

const log = logger.scoped('AudioTab');

export type AudioHandle = {
  save: () => void;
  analyze: () => Promise<void>;
  abort: () => void;
};

interface Props {
  audioFile: File | null;
  audioUrl: string | null;
  setAudioFile: (f: File | null) => void;
  setAudioUrl: (u: string | null) => void;
  selectedAlgorithm: string;
  setSelectedAlgorithm: (a: string) => void;
  setUltrastarText: (t: string) => void;
  setActiveTab?: (i: number) => void;
  /** Called when user applies extracted + Spotify metadata. */
  onMetadataApply?: (meta: SongMetadata) => void;
}

const AudioTab = React.forwardRef<AudioHandle, Props>(({ audioFile, audioUrl, setAudioFile, setAudioUrl, selectedAlgorithm, setSelectedAlgorithm, setUltrastarText, setActiveTab, onMetadataApply }, ref) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState<PitchSegment[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const progressRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // Stem separation state
  const [showStemSeparator, setShowStemSeparator] = useState(false);
  const [analysisFile, setAnalysisFile] = useState<File | null>(null);
  const [selectedStemLabel, setSelectedStemLabel] = useState<string | null>(null);
  const [availableMicSettings, setAvailableMicSettings] = useState<{ key: string; label: string; settings: Record<string, unknown> }[]>([]);
  const [selectedMicKey, setSelectedMicKey] = useState<string | null>(null);

  // collect stored mic settings entries for user selection
  useEffect(() => {
    try {
      const list: { key: string; label: string; settings: Record<string, unknown> }[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('mic_settings_')) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const js = JSON.parse(raw);
            const label = js?.userDeviceName || js?.deviceId || key.replace('mic_settings_', '');
            list.push({ key, label, settings: js });
          } catch (_e) { /* Parse error expected for invalid input */ }
        }
      }
      setAvailableMicSettings(list);
      // try persisted selection first
      try {
        const persisted = localStorage.getItem('audioTab_selected_mic');
        if (persisted && list.find(x => x.key === persisted)) {
          setSelectedMicKey(persisted);
        } else if (list.length) {
          setSelectedMicKey(list[0].key);
        }
      } catch (e) {
        log.debug('Failed to read persisted mic selection', e);
        if (list.length) setSelectedMicKey(list[0].key);
      }
    } catch (_e) { /* Best-effort — no action needed on failure */ }
  }, []);

  // persist user choice
  useEffect(() => {
    try {
      if (selectedMicKey) localStorage.setItem('audioTab_selected_mic', selectedMicKey);
      else localStorage.removeItem('audioTab_selected_mic');
    } catch (_e) { /* Best-effort — no action needed on failure */ }
  }, [selectedMicKey]);

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      // basic validation
      if (!file.type.startsWith('audio/')) {
        setErrorMessage(t('audioTab.notAudioFile'));
        return;
      }
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setErrorMessage(t('audioTab.fileTooLarge'));
        return;
      }
      setErrorMessage(null);
      setAudioFile(file);
      // reset stem selection on new upload
      setAnalysisFile(null);
      setSelectedStemLabel(null);
      setShowStemSeparator(false);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      // decode waveform for preview
      try {
        const arrayBuffer = await file.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        const channel = audioBuffer.getChannelData(0);
        drawWaveform(channel);
        // Do NOT auto-analyze; let user choose to separate stems first or analyze directly
      } catch (err) {
        log.warn("Waveform decode failed:", err);
        setErrorMessage(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const drawWaveform = (data: Float32Array) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0,0,w,h);
    ctx.fillStyle = '#111';
    ctx.fillRect(0,0,w,h);
    // improved downsampling: min/max per pixel bin to draw vertical lines (better waveform)
    ctx.fillStyle = '#0ff';
    const samplesPerPixel = Math.max(1, Math.floor(data.length / w));
    for (let x = 0; x < w; x++) {
      const start = x * samplesPerPixel;
      let min = 1, max = -1;
      for (let i = 0; i < samplesPerPixel; i++) {
        const v = data[start + i];
        if (v === undefined) break;
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const y1 = Math.round((1 - max) * (h/2));
      const y2 = Math.round((1 - min) * (h/2));
      ctx.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
  };

  const handleStemSelected = (stem: StemTrack) => {
    setAnalysisFile(stem.file);
    setSelectedStemLabel(stem.label);
    setShowStemSeparator(false);
    // auto-analyze the selected stem
    handleAnalyze(stem.file).catch(err => {
      log.warn('Stem auto-analyze failed', err);
      setErrorMessage(err instanceof Error ? err.message : String(err));
    });
  };

  const handleUseOriginal = () => {
    setAnalysisFile(null);
    setSelectedStemLabel(null);
    setShowStemSeparator(false);
  };

  const handleAnalyze = async (fileArg?: File) => {
    const fileToUse = fileArg ?? analysisFile ?? audioFile;
    if (!fileToUse) return;
    // abort any previous
    if (abortRef.current) {
      try { abortRef.current.abort(); } catch { /* Silent catch — error is expected during cleanup/teardown */ }
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setErrorMessage(null);
    progressRef.current = 0;
    try {
      // build analysis options; if user selected a mic-settings entry, use it
      const analysisOpts: { signal?: AbortSignal; onProgress?: (p: number) => void; smoothingWindow?: number; rmsThreshold?: number; useHanning?: boolean } = { signal: controller.signal, onProgress: (p: number) => { progressRef.current = p; } };
      try {
        if (selectedMicKey) {
          const raw = localStorage.getItem(selectedMicKey);
          if (raw) {
            const js = JSON.parse(raw);
            if (typeof js.smoothingWindow === 'number') analysisOpts.smoothingWindow = js.smoothingWindow;
            if (typeof js.rmsThreshold === 'number') analysisOpts.rmsThreshold = js.rmsThreshold;
            if (typeof js.useHanning === 'boolean') analysisOpts.useHanning = js.useHanning;
          }
        } else {
          // fallback: pick first available mic_settings_* if present
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('mic_settings_')) {
              try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const js = JSON.parse(raw);
                if (typeof js.smoothingWindow === 'number') analysisOpts.smoothingWindow = js.smoothingWindow;
                if (typeof js.rmsThreshold === 'number') analysisOpts.rmsThreshold = js.rmsThreshold;
                if (typeof js.useHanning === 'boolean') analysisOpts.useHanning = js.useHanning;
                break;
              } catch (_e) { /* Parse error expected for invalid input */ }
            }
          }
        }
      } catch (e) { log.debug('Failed to load mic analysis settings', e); }

      let segs = await analyzeAudioFileWithAlgorithm(fileToUse, selectedAlgorithm as PitchAlgorithm, analysisOpts);
      // apply per-mic offset (if selected) so analyzed timings align with playback/scoring
      try {
        let offsetMs: number | undefined = undefined;
        if (selectedMicKey) {
          const raw = localStorage.getItem(selectedMicKey);
          if (raw) {
            const js = JSON.parse(raw);
            if (typeof js.offsetMs === 'number') offsetMs = js.offsetMs;
          }
        }
        if (typeof offsetMs !== 'number') {
          // fallback: look for any mic_settings_* entry
          for (let i = 0; i < localStorage.length && typeof offsetMs !== 'number'; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            if (key.startsWith('mic_settings_')) {
              try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const js = JSON.parse(raw);
                if (typeof js.offsetMs === 'number') offsetMs = js.offsetMs;
              } catch (_e) { /* Parse error expected for invalid input */ }
            }
          }
        }
        if (typeof offsetMs === 'number' && offsetMs !== 0) {
          const offsetSec = offsetMs / 1000;
          segs = segs.map(s => ({ ...s, start: Math.max(0, (s.start || 0) - offsetSec) }));
        }
      } catch (e) { log.debug('Failed to apply mic offset', e); }
      setSegments(segs);
      progressRef.current = 1;
      if (segs.length === 0) {
        setUltrastarText(t('audioTab.noNotesDetected') + "\nE");
      } else {
        const lines = (segs as PitchSegment[]).map(s => `: ${Math.round(s.start * 10)} ${Math.round(s.duration * 10)} ${s.pitch}`);
        setUltrastarText(`#TITLE:Analyzed\n#ARTIST:AI\n${lines.join("\n")}\nE`);
        setActiveTab?.(2);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'aborted') {
        setErrorMessage(t('audioTab.analysisAborted'));
      } else {
        setErrorMessage(t('audioTab.analysisError') + msg);
        setUltrastarText(`# ${t('audioTab.analysisError')}${msg}\nE`);
      }
    } finally {
      setLoading(false);
    }
  };

  const abort = () => {
    if (abortRef.current) abortRef.current.abort();
  };

  const save = () => {
    const payload = {
      audioFileName: audioFile ? audioFile.name : null,
      audioUrl,
      savedAt: new Date().toISOString()
    };
    try { localStorage.setItem('audioverse-audio-backup', JSON.stringify(payload)); } catch (e) { log.warn('audio save failed', e); }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audioverse-audio-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };


  useImperativeHandle(ref, () => ({ save, analyze: () => handleAnalyze(), abort }));

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <label>
          {t('audioTab.selectAudioFile')}
          <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ marginLeft: 8 }} />
        </label>
      </div>
      {audioUrl && (
        <div style={{ marginBottom: 12 }}>
          <audio ref={audioRef} src={audioUrl} controls style={{ display: 'block', marginBottom: 8 }} />
          <canvas ref={canvasRef} width={800} height={80} style={{ width: '100%', background: '#111', borderRadius: 6 }}  role="img" aria-label="Audio Tab canvas"/>
        </div>
      )}

      {/* Metadata extraction + Spotify lookup */}
      <SongMetadataLookup audioFile={audioFile} onApply={onMetadataApply} />

      {/* Stem separation section */}
      {audioFile && !showStemSeparator && (
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowStemSeparator(true)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid var(--border-color, #d1d5db)',
              background: 'var(--card-bg, #fff)',
              cursor: 'pointer',
            }}
          >
            🎛️ {t('audioTab.separateTracks', 'Separate Tracks (Demucs)')}
          </button>
          {selectedStemLabel && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary, #64748b)' }}>
              {t('audioTab.analyzingTrack', 'Analyzing track:')} <strong>{selectedStemLabel}</strong>
            </span>
          )}
        </div>
      )}

      {audioFile && showStemSeparator && (
        <StemSeparator
          sourceFile={audioFile}
          onSelectStem={handleStemSelected}
          onUseOriginal={handleUseOriginal}
        />
      )}

        {errorMessage && (
          <div style={{ marginBottom: 12, padding: 12, background: '#3b0d0d', color: '#ffdede', borderRadius: 6 }}>
            <div style={{ fontWeight: 600 }}>{t('audioTab.errorTitle')}</div>
            <div style={{ marginTop: 6 }}>{errorMessage}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => setErrorMessage(null)}>{t('audioTab.clearError')}</button>
            </div>
          </div>
        )}

      <div style={{ marginBottom: 12 }}>
        <label>{t('audioTab.algorithmLabel')}&nbsp;</label>
        <select value={selectedAlgorithm} onChange={e => setSelectedAlgorithm(e.target.value)} aria-label={t('audioTab.algorithmLabel')}>
          <option value="pitchy">Pitchy</option>
          <option value="crepe">Crepe</option>
          <option value="librosa">Librosa</option>
          <option value="ultrastar-wp">UltrastarWP</option>
        </select>
        <span style={{ marginLeft: 12 }}>
          <label>{t('audioTab.deviceSettings')}&nbsp;</label>
          <select value={selectedMicKey ?? ''} onChange={e => setSelectedMicKey(e.target.value || null)} aria-label={t('audioTab.deviceSettings')}>
            <option value=''>{t('audioTab.noneOption')}</option>
            {availableMicSettings.map(a => (
              <option key={a.key} value={a.key}>{a.label}</option>
            ))}
          </select>
        </span>
        <button onClick={() => handleAnalyze()} style={{ marginLeft: 12 }} disabled={loading}>{loading ? t('audioTab.analyzingBtn') : t('audioTab.analyzeBtn')}</button>
      </div>

      {segments.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <b>{t('audioTab.detectedSegments')}</b>
          <ul>
            {segments.map((s, idx) => (
              <li key={idx}>[{s.start.toFixed(2)}s - {s.duration.toFixed(2)}s] pitch {s.pitch} ({s.freq.toFixed(1)} Hz)</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default AudioTab;
