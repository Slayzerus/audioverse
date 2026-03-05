import React, { useRef, useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { useToast } from "../../ui/ToastProvider";
import { PitchDetector } from "pitchy";
// Aubio integration disabled for now - commented out per request
// import Aubio from "aubiojs";
import { postPitch } from "../../../scripts/api/apiLibraryAiAudio";
import * as apiLibrosa from "../../../scripts/api/apiLibraryLibrosa";
import { logger } from '../../../utils/logger';

const log = logger.scoped('AudioPitchAnalyzer');

interface PitchSegment {
  start: number; // seconds
  duration: number; // seconds
  pitch: number; // Ultrastar pitch number
  freq: number; // Hz
}

interface AudioPitchAnalyzerProps {
  onSegments?: (segments: PitchSegment[]) => void;
  defaultCompareAll?: boolean;
  externalFile?: File | null;
}

export default function AudioPitchAnalyzer({ onSegments, defaultCompareAll = false, externalFile = null }: AudioPitchAnalyzerProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [algorithm, setAlgorithm] = useState<'pitchy' | 'crepe' | 'ultrastar-wp' | 'librosa'>('pitchy');
  const [waveform, setWaveform] = useState<Float32Array | null>(null);
  const [compareAll, setCompareAll] = useState(defaultCompareAll);
  const [compareResults, setCompareResults] = useState<{ [alg: string]: PitchSegment[] }>({});
  const [compareErrors, setCompareErrors] = useState<{ [alg: string]: string | null }>({});
  const [rmsList, setRmsList] = useState<number[]>([]);
  const [segments, setSegments] = useState<PitchSegment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aubioDebug] = useState<string | null>(null);
  const [aubioProbeResult] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function formatError(e: unknown) {
    try {
      if (e instanceof Error) {
        let out = `${e.message}\n${e.stack ?? ''}`;
        const errWithUrls = e as Error & { attemptedUrls?: string[] | string };
        if (errWithUrls?.attemptedUrls) {
          try { out += `\nAttempted URLs: ${Array.isArray(errWithUrls.attemptedUrls) ? errWithUrls.attemptedUrls.join(', ') : String(errWithUrls.attemptedUrls)}`; } catch { out += `\nAttempted URLs: ${String(errWithUrls.attemptedUrls)}`; }
        }
        return out;
      }
      const errObj = e as { message?: string; attemptedUrls?: string[] | string } | undefined;
      if (errObj?.attemptedUrls) return `Error: ${String(errObj.message ?? errObj)}\nAttempted URLs: ${Array.isArray(errObj.attemptedUrls) ? errObj.attemptedUrls.join(', ') : String(errObj.attemptedUrls)}`;
      return String(e);
    } catch {
      return 'Unknown error';
    }
  }

  // Helper: Convert Hz to Ultrastar pitch (C4=48)
  function hzToUltrastarPitch(hz: number) {
    if (!hz || hz <= 0) return null;
    const midi = 12 * Math.log2(hz / 440) + 69;
    return Math.round(midi - 12); // Ultrastar scale
  }

  // Aubio integration temporarily disabled - aubioCallDo is preserved but commented out for future work
  /*
  // Try multiple aubio calling conventions and return hz or throw
  function aubioCallDo(aubio: AubioWasmModule, pitchDetector: AubioPitchDetector, slice: Float32Array, sampleRate: number): number {
    const traces: string[] = [];
    // 1) direct call with Float32Array
    try {
      traces.push('try: pitchDetector.do(Float32Array)');
      return pitchDetector.do(slice);
    } catch (e1) {
      traces.push('fail: Float32Array -> ' + String(e1));
    }
    // 2) Array.from
    try {
      traces.push('try: pitchDetector.do(Array.from)');
      return pitchDetector.do(Array.from(slice));
    } catch (e2) {
      traces.push('fail: Array.from -> ' + String(e2));
    }
    // 3) new Float32Array copy
    try {
      traces.push('try: pitchDetector.do(new Float32Array)');
      return pitchDetector.do(new Float32Array(slice));
    } catch (e3) {
      traces.push('fail: copy -> ' + String(e3));
    }
    // 4) HEAPF32 pointer-based calls
    try {
      const aubioModule: AubioWasmModule = aubio;
      if (aubioModule && typeof aubioModule._malloc === 'function' && aubioModule.HEAPF32) {
        const bytes = slice.length * 4;
        const ptr = aubioModule._malloc(bytes);
        try {
          aubioModule.HEAPF32.set(slice, ptr / 4);
          traces.push('try: pitchDetector.do(ptr)');
          try { return pitchDetector.do(ptr); } catch (e4a) { traces.push('fail: do(ptr) -> ' + String(e4a)); }
          traces.push('try: pitchDetector.do(ptr,len)');
          try { return pitchDetector.do(ptr, slice.length); } catch (e4b) { traces.push('fail: do(ptr,len) -> ' + String(e4b)); }
          traces.push('try: pitchDetector.do(ptr,len,sr)');
          try { return pitchDetector.do(ptr, slice.length, sampleRate); } catch (e4c) { traces.push('fail: do(ptr,len,sr) -> ' + String(e4c)); }
        } finally {
          try { aubioModule._free(ptr); } catch {}
        }
      } else {
        traces.push('no _malloc/HEAPF32');
      }
    } catch (eHeapAll) {
      traces.push('heap attempts threw: ' + String(eHeapAll));
    }
    // 5) ccall / cwrap attempts for common symbol names
    try {
      const aubioModule2: AubioWasmModule = aubio;
      const names = ['Pitch_do', 'pitch_do', 'aubio_pitch_do', 'pitchDetector_do', 'do_pitch', 'do'];
      for (const name of names) {
        try {
          if (typeof aubioModule2.cwrap === 'function') {
            const fn = aubioModule2.cwrap(name, 'number', ['number','number','number']);
            if (fn) {
              // allocate heap and call
              const ptr = aubioModule2._malloc(slice.length * 4);
              aubioModule2.HEAPF32.set(slice, ptr / 4);
              try {
                const res = fn(ptr, slice.length, sampleRate);
                return res;
              } finally {
                try { aubioModule2._free(ptr); } catch {}
              }
            }
          }
          if (typeof aubioModule2.ccall === 'function') {
            const ptr = aubioModule2._malloc(slice.length * 4);
            aubioModule2.HEAPF32.set(slice, ptr / 4);
            try {
              const res = aubioModule2.ccall(name, 'number', ['number','number','number'], [ptr, slice.length, sampleRate]);
              return res;
            } finally {
              try { aubioModule2._free(ptr); } catch {}
            }
          }
        } catch (ccErr) {
          traces.push('ccall/cwrap ' + name + ' failed: ' + String(ccErr));
        }
      }
    } catch (eCcall) {
      traces.push('ccall attempts threw: ' + String(eCcall));
    }
    // If reached here, aggregate traces into aubioDebug and throw
    const diag = 'aubioCallDo failed. Traces:\n' + traces.join('\n');
    try { setAubioDebug((prev) => (prev ? prev + '\n\n' + diag : diag)); } catch {}
    console.error('[AudioPitchAnalyzer][aubioCallDo] ' + diag);
    throw new Error('aubio: all calling conventions failed');
  }
  */

  // Aubio CDN loader disabled for now
  /*
  // Attempt to load a UMD/standalone aubio build from CDN (tries multiple candidate paths)
  function loadAubioFromCdn(version = '0.2.0'): Promise<AubioWasmModule> {
    const candidates = [
      `https://unpkg.com/aubiojs@${version}/dist/aubio.js`,
      `https://unpkg.com/aubiojs@${version}/build/aubio.js`,
      `https://cdn.jsdelivr.net/npm/aubiojs@${version}/dist/aubio.js`,
      `https://cdn.jsdelivr.net/npm/aubiojs@${version}/build/aubio.js`,
      `https://unpkg.com/aubiojs@${version}`,
    ];
    return new Promise((resolve, reject) => {
      let tried = 0;
      const tryNext = () => {
        if (tried >= candidates.length) return reject(new Error('No CDN candidate succeeded'));
        const url = candidates[tried++];
        const existing = document.querySelector(`script[data-aubio-cdn][src="${url}"]`);
        if (existing) {
          // already requested, wait a bit
          setTimeout(() => {
            const mod = window.Aubio ?? window.Module ?? window.aubio;
            if (mod) return resolve(mod);
            tryNext();
          }, 300);
          return;
        }
        const s = document.createElement('script');
        s.src = url;
        s.async = true;
        s.setAttribute('data-aubio-cdn', '1');
        s.onload = () => {
          const mod = window.Aubio ?? window.Module ?? window.aubio;
          if (mod) return resolve(mod);
          // sometimes the module attaches later; wait a short while
          setTimeout(() => {
            const mod2 = window.Aubio ?? window.Module ?? window.aubio;
            if (mod2) return resolve(mod2);
            tryNext();
          }, 200);
        };
        s.onerror = () => {
          tryNext();
        };
        document.head.appendChild(s);
      };
      tryNext();
    });
  }
  */

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await analyzeFile(file, compareAll);
  }

  async function analyzeFile(file: File, compareFlag: boolean) {
    setError(null);
    setSegments([]);
    setLoading(true);
    try {
      // Decode audio
      const arrayBuffer = await file.arrayBuffer();
      const AudioCtxClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const channel = audioBuffer.getChannelData(0);
      setWaveform(channel);
      const sampleRate = audioBuffer.sampleRate;
      // Analyze pitch in 100ms windows
      const windowSize = Math.floor(sampleRate * 0.1);
      const hopSize = windowSize;
      // Helper analyzers to reuse in compare mode
      const analyzePitchy = () => {
        const segments: PitchSegment[] = [];
        const pitchDetector = PitchDetector.forFloat32Array(windowSize);
        for (let i = 0; i < channel.length - windowSize; i += hopSize) {
          const slice = channel.slice(i, i + windowSize);
          const [hz, clarity] = pitchDetector.findPitch(slice, sampleRate);
          const pitch = hzToUltrastarPitch(hz);
          if (pitch && hz > 50 && hz < 2000 && clarity > 0.7) {
            segments.push({ start: i / sampleRate, duration: windowSize / sampleRate, pitch, freq: hz });
          }
        }
        return segments;
      };
      /*
      // Aubio analysis disabled for now. The original implementation is preserved here for future re-enable.
      const analyzeAubioFn = async () => {
        // (implementation removed)
        throw new Error('aubio disabled');
      };
      */
      const analyzeUltrastarFn = () => {
        const segments: PitchSegment[] = [];
        for (let i = 0; i < channel.length - windowSize; i += hopSize) {
          const slice = channel.slice(i, i + windowSize);
          const hz = detectPitch(slice, sampleRate);
          const pitch = hzToUltrastarPitch(hz);
          if (pitch && hz > 50 && hz < 2000) segments.push({ start: i / sampleRate, duration: windowSize / sampleRate, pitch, freq: hz });
        }
        return segments;
      };

      if (compareFlag) {
        setLoading(true);
        setError(null);
        const results: { [alg: string]: PitchSegment[] } = {};
        // Run each analyzer separately so we can identify failures
        try {
          const errs: { [alg: string]: string | null } = {};
          try { results['pitchy'] = analyzePitchy(); errs['pitchy'] = null; } catch (e) { results['pitchy'] = []; errs['pitchy'] = formatError(e); log.warn('pitchy failed', e); }
          try { results['ultrastar-wp'] = analyzeUltrastarFn(); errs['ultrastar-wp'] = null; } catch (e) { results['ultrastar-wp'] = []; errs['ultrastar-wp'] = formatError(e); log.warn('ultrastar-wp failed', e); }
          // aubio disabled: skip analysis for now
          results['aubio'] = [];
          errs['aubio'] = 'disabled';
          try {
            const crepeRes = await postPitch(file);
            const crepeTrack = crepeRes.track ?? [];
            results['crepe'] = crepeTrack.map((pt, idx) => ({ start: pt.t, duration: crepeTrack[idx + 1]?.t ? crepeTrack[idx + 1].t - pt.t : 0.1, pitch: hzToUltrastarPitch(pt.hz) ?? 0, freq: pt.hz }));
            errs['crepe'] = null;
          } catch (e) { results['crepe'] = []; errs['crepe'] = formatError(e); log.warn('crepe failed', e); }
          try {
            const libRes = await apiLibrosa.postLibrosaPitchTrack(new File([file], file.name, { type: file.type }));
            const libTrack = libRes.track ?? [];
            results['librosa'] = libTrack.map((pt, idx) => ({ start: pt.t, duration: libTrack[idx + 1]?.t ? libTrack[idx + 1].t - pt.t : 0.1, pitch: hzToUltrastarPitch(pt.hz) ?? 0, freq: pt.hz }));
            errs['librosa'] = null;
          } catch (e) { results['librosa'] = []; errs['librosa'] = formatError(e); log.warn('librosa failed', e); }
          setCompareErrors(errs);
          setCompareResults(results);
          setSegments(results[algorithm] ?? []);
        } catch (err) {
          log.error('[AudioPitchAnalyzer] compareAll overall failed', err);
          const msg = err instanceof Error ? err.message : String(err);
          setError(t('audioPitch.errorComparing') + msg);
        } finally {
          setLoading(false);
        }
        return;
      }
      const segments: PitchSegment[] = [];
      const rmsArr: number[] = [];
      let _detectedCount = 0;
      if (algorithm === 'pitchy') {
        const pitchDetector = PitchDetector.forFloat32Array(windowSize);
        for (let i = 0; i < channel.length - windowSize; i += hopSize) {
          const slice = channel.slice(i, i + windowSize);
          let rms = 0;
          for (let j = 0; j < slice.length; j++) rms += slice[j] * slice[j];
          rms = Math.sqrt(rms / slice.length);
          rmsArr.push(rms);
          const [hz, clarity] = pitchDetector.findPitch(slice, sampleRate);
          const pitch = hzToUltrastarPitch(hz);
          if (pitch && hz > 50 && hz < 2000 && clarity > 0.7) {
            segments.push({
              start: i / sampleRate,
              duration: windowSize / sampleRate,
              pitch,
              freq: hz,
            });
            _detectedCount++;
          }
        }
      } else if (algorithm === 'crepe') {
        // Use backend pitch detection (crepe)
        try {
          const response = await postPitch(file);
          if (!response.track || response.track.length === 0) {
            setError(t('audioPitch.crepeNoNotes'));
            log.warn('[AudioPitchAnalyzer] Crepe: No notes detected in audio file.');
          } else {
            const segs: PitchSegment[] = response.track
              .map((pt, idx) => {
                const pitch = hzToUltrastarPitch(pt.hz);
                return pitch && pt.hz > 50 && pt.hz < 2000 ? {
                  start: pt.t,
                  duration: idx < response.track.length - 1 ? response.track[idx + 1].t - pt.t : 0.1,
                  pitch,
                  freq: pt.hz,
                } : null;
              })
              .filter((seg): seg is PitchSegment => seg !== null);
            setSegments(segs);
            if (onSegments) {
              try { onSegments(segs); } catch (err) { log.error('[AudioPitchAnalyzer] Error in onSegments:', err); }
            }
            setRmsList([]);
            setWaveform(null);
            return;
          }
        } catch (err) {
          setError(t('audioPitch.crepeBackendError'));
          setDetailedError(formatError(err));
          log.error('[AudioPitchAnalyzer] Crepe: Error calling backend:', err);
        }
      } else if (algorithm === 'librosa') {
        // Use backend librosa pitch detection
        try {
          await analyzeWithLibrosa(file);
          setRmsList([]);
          setWaveform(null);
          return;
        } catch (err) {
          setError(t('audioPitch.librosaBackendError'));
          setDetailedError(formatError(err));
          log.error('[AudioPitchAnalyzer] Librosa: Error calling backend:', err);
        }
      } else if (algorithm === 'ultrastar-wp') {
        // Worldparty-style autocorrelation
        for (let i = 0; i < channel.length - windowSize; i += hopSize) {
          const slice = channel.slice(i, i + windowSize);
          let rms = 0;
          for (let j = 0; j < slice.length; j++) rms += slice[j] * slice[j];
          rms = Math.sqrt(rms / slice.length);
          rmsArr.push(rms);
          const hz = detectPitch(slice, sampleRate);
          const pitch = hzToUltrastarPitch(hz);
          if (pitch && hz > 50 && hz < 2000) {
            segments.push({
              start: i / sampleRate,
              duration: windowSize / sampleRate,
              pitch,
              freq: hz,
            });
            _detectedCount++;
          }
        }
      }
      setRmsList(rmsArr);
      const merged = mergeSegments(segments);
      setSegments(merged);
      if (onSegments) {
        try {
          onSegments(merged);
        } catch (err) {
          log.error('[AudioPitchAnalyzer] Error in onSegments:', err);
        }
      }
      if (merged.length === 0 && algorithm !== 'crepe') {
        setError(t('audioPitch.noNotesDetected'));
        log.warn('[AudioPitchAnalyzer] No notes detected in audio file.');
      }
    } catch (err) {
      setError(t('audioPitch.errorAnalyzing') + (err instanceof Error ? err.message : String(err)));
      setDetailedError(formatError(err));
      log.error('[AudioPitchAnalyzer] Error analyzing audio file:', err);
    } finally {
      setLoading(false);
    }
  }

  // react to externalFile prop
  useEffect(() => {
    if (externalFile) void analyzeFile(externalFile, true);
  }, [externalFile]);

  // aubio probe disabled
  /*
  // run aubio probe once on mount
  useEffect(() => {
    void probeAubio();
  }, []);
  */

  // If backend-based librosa is selected, upload the recorded buffer and fetch pitch track
  async function analyzeWithLibrosa(blob: Blob) {
    try {
      const file = new File([blob], "capture.wav", { type: "audio/wav" });
      const res = await apiLibrosa.postLibrosaPitchTrack(file);
      // Normalize into local expected format: array of {t,hz}
      const points = (res.track ?? []).map((p) => ({ t: p.t, hz: p.hz }));
      // call existing consumer to apply points
      if (onSegments) {
        // convert points to PitchSegment[] with short durations
        const segs: PitchSegment[] = points.map((pt, idx) => {
          const nextT = points[idx + 1]?.t ?? (pt.t + 0.1);
          const pitch = hzToUltrastarPitch(pt.hz) ?? 0;
          return { start: pt.t, duration: Math.max(0.05, nextT - pt.t), pitch, freq: pt.hz };
        });
        onSegments(segs);
        setSegments(segs);
      }
    } catch (err: unknown) {
      // fallback: log and continue using in-browser detectors
      log.warn("Librosa analysis failed, falling back to local detectors", err);
      const errObj = typeof err === 'object' && err !== null ? err as Record<string, unknown> : {};
      const attemptedUrls = errObj.attemptedUrls;
      if (attemptedUrls) log.error('[AudioPitchAnalyzer] Librosa attempted URLs:', attemptedUrls);
      const urls = attemptedUrls ? (Array.isArray(attemptedUrls) ? attemptedUrls.join(', ') : String(attemptedUrls)) : null;
        const msg = err instanceof Error ? err.message : String(err);
        setError(t('audioPitch.librosaBackendError') + ': ' + msg + (urls ? ' (attempted: ' + urls + ')' : ''));
        setDetailedError(formatError(err));
    }
  }

  // Simple autocorrelation pitch detection
  function detectPitch(buffer: Float32Array, sampleRate: number): number {
    // Normalized autocorrelation pitch detection (simpler, more robust)
    const minFreq = 50; // Hz
    const maxFreq = 2000; // Hz
    const maxLag = Math.floor(sampleRate / minFreq);
    const minLag = Math.max(2, Math.floor(sampleRate / maxFreq));
    let energy = 0;
    for (let i = 0; i < buffer.length; i++) energy += buffer[i] * buffer[i];
    if (energy <= 1e-8) return 0;

    let bestOffset = -1;
    let bestCorr = 0;
    // Precompute denominator (energy) to normalize
    const eps = 1e-10;
    for (let offset = minLag; offset <= Math.min(maxLag, buffer.length - 2); offset++) {
      let corr = 0;
      const N = buffer.length - offset;
      for (let i = 0; i < N; i++) corr += buffer[i] * buffer[i + offset];
      // Normalize by energy (roughly)
      const value = corr / (N + eps) / (energy / (buffer.length) + eps);
      // Track best normalized correlation
      if (value > bestCorr) {
        bestCorr = value;
        bestOffset = offset;
      }
    }

    // Require a modest correlation to accept pitch
    if (bestOffset > 0 && bestCorr > 0.01) {
      return sampleRate / bestOffset;
    }
    return 0;
  }

  // Merge consecutive segments with same pitch
  function mergeSegments(segments: PitchSegment[]): PitchSegment[] {
    if (segments.length === 0) return [];
    const merged: PitchSegment[] = [];
    let last = segments[0];
    for (let i = 1; i < segments.length; i++) {
      const seg = segments[i];
      if (seg.pitch === last.pitch && Math.abs(seg.freq - last.freq) < 1) {
        last.duration += seg.duration;
      } else {
        merged.push(last);
        last = seg;
      }
    }
    merged.push(last);
    return merged;
  }

  // Build a detailed scientific Markdown report and trigger download
  function generateScientificReport() {
    try {
      const algs = Object.keys(compareResults).length > 0 ? Object.keys(compareResults) : ['pitchy','ultrastar-wp','aubio','crepe','librosa'];
      const totalDuration = (() => {
        let maxEnd = 0;
        for (const alg of algs) {
          const segs = compareResults[alg] ?? [];
          for (const s of segs) maxEnd = Math.max(maxEnd, s.start + (s.duration || 0));
        }
        return maxEnd || 0;
      })();

      const freqCentsDiff = (f1: number, f2: number) => {
        if (!f1 || !f2) return Infinity;
        return 1200 * Math.log2(f1 / f2);
      };

      const isOctaveError = (fRef: number, fTest: number) => {
        if (!fRef || !fTest) return false;
        const octNearest = Math.round(Math.log2(fTest / fRef));
        const expected = fRef * Math.pow(2, octNearest);
        const cents = Math.abs(freqCentsDiff(expected, fTest));
        return Math.abs(octNearest) >= 1 && cents < 50;
      };

      const computeStats = (segs: PitchSegment[]): { count: number; totalDur: number; meanFreq: number; stdFreq: number; meanDur: number; voicedFraction: number | null } => {
        const out = { count: 0, totalDur: 0, meanFreq: 0, stdFreq: 0, meanDur: 0, voicedFraction: null as number | null };
        if (!segs || segs.length === 0) return out;
        out.count = segs.length;
        out.totalDur = segs.reduce((a, b) => a + (b.duration || 0), 0);
        const freqs = segs.map(s => s.freq).filter(Boolean);
        if (freqs.length === 0) return out;
        const mean = freqs.reduce((a, b) => a + b, 0) / freqs.length;
        const variance = freqs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / freqs.length;
        out.meanFreq = mean;
        out.stdFreq = Math.sqrt(variance || 0);
        out.meanDur = out.totalDur / out.count;
        out.voicedFraction = totalDuration > 0 ? out.totalDur / totalDuration : null;
        return out;
      };

      const pairwiseCompare = (refSegs: PitchSegment[], testSegs: PitchSegment[]) => {
        let matches = 0;
        let octaveErrors = 0;
        const freqDiffs: number[] = [];
        for (const r of refSegs) {
          const rStart = r.start;
          const rEnd = r.start + (r.duration || 0.05);
          let best: PitchSegment | null = null;
          let bestOverlap = 0;
          for (const t of testSegs) {
            const tStart = t.start;
            const tEnd = t.start + (t.duration || 0.05);
            const overlap = Math.max(0, Math.min(rEnd, tEnd) - Math.max(rStart, tStart));
            if (overlap > bestOverlap) { bestOverlap = overlap; best = t; }
          }
          if (best && bestOverlap > 0) {
            const cents = Math.abs(freqCentsDiff(r.freq, best.freq));
            freqDiffs.push(cents);
            if (cents < 50) matches++;
            if (isOctaveError(r.freq, best.freq)) octaveErrors++;
          }
        }
        const meanCents = freqDiffs.length ? (freqDiffs.reduce((a,b)=>a+b,0)/freqDiffs.length) : null;
        return { matches, compared: refSegs.length, meanCents, octaveErrors };
      };

      const lines: string[] = [];
      lines.push('# AudioPitchAnalyzer — Comparative Report');
      lines.push(`Generated: ${new Date().toISOString()}`);
      lines.push('');
      lines.push('## Summary');
      lines.push(`- Selected algorithm in UI: **${algorithm}**`);
      lines.push(`- Total analyzed duration (approx): **${totalDuration.toFixed(3)} s**`);
      lines.push('');
      lines.push('## Per-algorithm statistics');
      lines.push('| Algorithm | Segments | Total voiced (s) | Voiced fraction | Mean freq (Hz) | Std freq (Hz) | Mean dur (s) |');
      lines.push('|---|---:|---:|---:|---:|---:|---:|');
      const statsMap: Record<string, ReturnType<typeof computeStats>> = {};
      for (const alg of algs) {
        const segs = compareResults[alg] ?? [];
        const st = computeStats(segs);
        statsMap[alg] = st;
        lines.push(`| ${alg} | ${st.count || 0} | ${(st.totalDur || 0).toFixed(3)} | ${st.voicedFraction !== null ? (st.voicedFraction * 100).toFixed(1) + '%' : 'N/A'} | ${st.meanFreq ? st.meanFreq.toFixed(1) : 'N/A'} | ${st.stdFreq ? st.stdFreq.toFixed(1) : 'N/A'} | ${st.meanDur ? st.meanDur.toFixed(3) : 'N/A'} |`);
      }

      lines.push('');
      lines.push('## Pairwise agreement (reference -> test)');
      const refAlg = algs.includes('crepe') ? 'crepe' : (algs.includes('librosa') ? 'librosa' : (algs.includes('pitchy') ? 'pitchy' : algs[0]));
      lines.push(`Reference algorithm: **${refAlg}**`);
      lines.push('');
      lines.push('| Reference -> Test | Matches | Compared (ref) | Match % | Mean cents diff | Octave errors |');
      lines.push('|---|---:|---:|---:|---:|---:|');
      for (const alg of algs) {
        if (alg === refAlg) continue;
        const cmp = pairwiseCompare(compareResults[refAlg] ?? [], compareResults[alg] ?? []);
        const matchPerc = cmp.compared ? (cmp.matches / cmp.compared * 100).toFixed(1) + '%' : 'N/A';
        lines.push(`| ${refAlg} -> ${alg} | ${cmp.matches} | ${cmp.compared} | ${matchPerc} | ${cmp.meanCents !== null ? cmp.meanCents.toFixed(1) : 'N/A'} | ${cmp.octaveErrors} |`);
      }

      lines.push('');
      lines.push('## Observations and analysis');
      lines.push('- The table above gives an overview of voiced coverage and per-algorithm mean frequencies. High voiced fraction indicates the algorithm detected many tonal regions; low fraction indicates conservative voicing or failures in noisy/quiet sections.');
      lines.push('- Pairwise match rate shows how often algorithms agree on the same regions (within ~50 cents). Octave error counts highlight typical autocorrelation octave mistakes.');
      lines.push('- Mean cents difference (reference vs test) indicates systematic tuning offsets or frequency bias; values <50 cents are generally acceptable for musical content, but for scoring you may want <20 cents.');
      lines.push('');
      for (const alg of algs) {
        lines.push(`### ${alg}`);
        const st = statsMap[alg];
        lines.push(`- Segments: ${st.count || 0}`);
        lines.push(`- Total voiced (s): ${(st.totalDur || 0).toFixed(3)}`);
        lines.push(`- Voiced fraction: ${st.voicedFraction !== null ? (st.voicedFraction * 100).toFixed(1) + '%' : 'N/A'}`);
        lines.push(`- Mean frequency: ${st.meanFreq ? st.meanFreq.toFixed(2) + ' Hz' : 'N/A'}`);
        lines.push(`- Std frequency: ${st.stdFreq ? st.stdFreq.toFixed(2) + ' Hz' : 'N/A'}`);
        lines.push('');
      }

      lines.push('## Conclusions & recommendation');
      const ranking: Array<{ alg: string; score: number }> = [];
      for (const alg of algs) {
        if (alg === refAlg) { ranking.push({ alg, score: 100 }); continue; }
        const cmp = pairwiseCompare(compareResults[refAlg] ?? [], compareResults[alg] ?? []);
        const matchRate = cmp.compared ? (cmp.matches / cmp.compared) : 0;
        const octavePenalty = cmp.compared ? (cmp.octaveErrors / cmp.compared) : 0;
        const score = matchRate - octavePenalty * 0.5; ranking.push({ alg, score });
      }
      ranking.sort((a,b)=>b.score-a.score);
      lines.push(`- Based on this recording, recommended authoritative detector: **${ranking[0].alg}** (best agreement with reference).`);
      lines.push('- For live, low-latency feedback use Pitchy (YIN) with smoothing/hysteresis; use Crepe/Librosa for authoritative scoring or post-processing.');
      lines.push('- If octave errors are frequent, consider octave-correction heuristics (prefer lower octave when ambiguity) or combine detectors via voting.');
      lines.push('');
      lines.push('## Raw data (per-algorithm segments)');
      for (const alg of algs) {
        const segs = compareResults[alg] ?? [];
        lines.push(`### ${alg} — ${segs.length} segments`);
        for (const s of segs) lines.push(`- ${s.start.toFixed(3)} .. ${(s.start + (s.duration||0)).toFixed(3)} : ${s.freq.toFixed(2)} Hz (pitch ${s.pitch})`);
        const err = compareErrors[alg]; if (err) lines.push(`- Error: ${err}`); lines.push('');
      }

      const md = lines.join('\n');
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audiopitch_scientific_report_' + (externalFile ? externalFile.name : 'capture') + '.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      log.error('[AudioPitchAnalyzer] generateScientificReport error', err);
      showToast(t('audioPitch.reportError') + String(err), 'error');
    }
  }

  return (
    <div style={{ marginTop: 32, padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
      <h3>{t('audioPitch.title')}</h3>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="pitch-algorithm-select" style={{ marginRight: 8 }}>{t('audioPitch.algorithm')}</label>
        <select id="pitch-algorithm-select" value={algorithm} onChange={e => setAlgorithm(e.target.value as typeof algorithm)} style={{ marginRight: 16 }}>
          <option value="ultrastar-wp">Ultrastar WP (autokorelacja)</option>
          <option value="crepe">crepe (AI)</option>
          <option value="pitchy">pitchy (YIN)</option>
          {/*<option value="aubio">aubio.js (różne, wolniejszy)</option>*/}
          <option value="librosa">Librosa (PYIN)</option>
        </select>
        <label style={{ marginRight: 8 }}>
          <input type="checkbox" checked={compareAll} onChange={e => setCompareAll(e.target.checked)} /> {t('audioPitch.compareAll')}
        </label>
        <input
          type="file"
          accept="audio/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          disabled={loading}
        />
      </div>
      {loading && <div>{t('audioPitch.analyzing')}</div>}
      <div style={{ marginTop: 8 }}>
        <b>{t('audioPitch.method')}</b> {algorithm}
      </div>
      {error && (
        <div style={{ color: "red", marginTop: 8 }}>
          <b>{algorithm}: </b>
          <div>{error}</div>
          {detailedError && (
            <pre style={{ background: '#111', color: '#f88', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap', marginTop: 8 }}>{detailedError}</pre>
          )}
        </div>
      )}
        {aubioDebug && (
          <div style={{ marginTop: 12 }}>
            <b>Aubio diagnostics</b>
            <pre style={{ background: '#111', color: '#f88', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap' }}>{aubioDebug}</pre>
            {aubioProbeResult && (
              <div style={{ marginTop: 8 }}><b>Probe:</b> {aubioProbeResult}</div>
            )}
          </div>
        )}
      {(Object.keys(compareResults).length > 0 || Object.keys(compareErrors).length > 0) && (
        <div style={{ marginTop: 12 }}>
          <button onClick={() => generateScientificReport()}>{t('audioPitch.downloadReport')}</button>
          {Object.entries(compareErrors).length > 0 && (
            <div style={{ marginTop: 8 }}>
              <b>Per-algorithm errors:</b>
              {Object.entries(compareErrors).filter(([_,v])=>v).map(([alg, msg]) => (
                <div key={alg} style={{ marginTop: 6 }}>
                  <b>{alg}:</b>
                  <pre style={{ background: '#111', color: '#f88', padding: 8, borderRadius: 4, whiteSpace: 'pre-wrap' }}>{msg}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {segments.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <b>{t('audioPitch.resultUltrastar')}</b>
          <pre style={{ background: "#222", color: "#fff", padding: 8, borderRadius: 4 }}>
            {segments.map(seg => `: ${Math.round(seg.start * 10)} ${Math.round(seg.duration * 10)} ${seg.pitch} [${seg.freq.toFixed(1)} Hz]`).join("\n")}
            {"\n-"}
          </pre>
        </div>
      )}
      {/* Wizualizacja waveformu i RMS */}
      {waveform && waveform.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <b>{t('audioPitch.waveformRms')}</b>
          <canvas
            width={600}
            height={100}
            style={{ background: '#222', borderRadius: 4, width: '100%', maxWidth: 600, display: 'block' }}
            role="img"
            aria-label="Waveform and RMS visualization canvas"
            ref={el => {
              if (!el) return;
              const ctx = el.getContext('2d');
              if (!ctx) return;
              ctx.clearRect(0, 0, 600, 100);
              // Draw waveform
              ctx.strokeStyle = '#0ff';
              ctx.beginPath();
              for (let i = 0; i < waveform.length; i += Math.ceil(waveform.length / 600)) {
                const x = i / waveform.length * 600;
                const y = 50 - waveform[i] * 48;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.stroke();
              // Draw RMS
              if (rmsList.length > 0) {
                ctx.strokeStyle = '#ff0';
                ctx.beginPath();
                for (let i = 0; i < rmsList.length; i++) {
                  const x = i / rmsList.length * 600;
                  const y = 100 - rmsList[i] * 90;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.stroke();
              }
            }}
          />
          <div style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>
            <span style={{ color: '#0ff' }}>Waveform</span> &nbsp;|&nbsp; <span style={{ color: '#ff0' }}>RMS</span>
          </div>
        </div>
      )}
      {(!loading && segments.length === 0 && !error) && (
        <div style={{ marginTop: 16, color: '#aaa' }}>
          <i>{t('audioPitch.noNotesDetected')}</i>
        </div>
      )}
      {compareAll && Object.keys(compareResults).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h4>{t('audioPitch.algorithmComparison')}</h4>
          {Object.entries(compareResults).map(([alg, segs]) => (
            <div key={alg} style={{ marginBottom: 12 }}>
              <b>{alg}</b>: {t('audioPitch.detectedSegments')} {segs.length}
              <pre style={{ background: '#111', color: '#ddd', padding: 8, borderRadius: 4, marginTop: 8 }}>
                {segs.map(s => `: ${Math.round(s.start * 10)} ${Math.round(s.duration * 10)} ${s.pitch} [${s.freq.toFixed(1)} Hz]`).join('\n')}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
