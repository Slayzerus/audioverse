/**
 * TuningHarnessPage — Development tool for analyzing and tuning karaoke scoring.
 *
 * Features:
 * - Import JSON fixture bundles (notes + pitchPoints) or paste raw data
 * - Interactive parameter sliders for scoring params
 * - Instant re-score on param change
 * - Segmentation heatmap view (canvas-based)
 * - CSV / JSON export of results
 * - Batch sweep across difficulty presets
 * - Auto-find best offset via scoring sweep
 * - Telemetry: save/compare tuning runs (localStorage)
 */
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  scoreNotesWithPitchPoints,
  type NoteDescriptor,
  type PitchPoint,
  type ScoringParams,
  type ScoringResult,
} from '../utils/karaokeScoring';
import { DefaultScoringPresets, type DifficultyLevel } from '../constants/karaokeScoringConfig';

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
interface FixtureBundle {
  name: string;
  notes: NoteDescriptor[];
  points: PitchPoint[];
}

interface SweepRow {
  label: string;
  params: ScoringParams;
  result: ScoringResult;
}

interface TuningRun {
  id: string;
  timestamp: number;
  fixtureName: string;
  params: ScoringParams;
  offsetMs: number;
  total: number;
  notesHit: number;
  notesTotal: number;
  maxCombo: number;
  comboBonus: number;
}

const TUNING_RUNS_KEY = 'tuningHarness_runs';

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
function fracToColor(frac: number): string {
  if (frac >= 0.9) return '#4caf50';
  if (frac >= 0.7) return '#8bc34a';
  if (frac >= 0.5) return '#ffeb3b';
  if (frac >= 0.3) return '#ff9800';
  return '#f44336';
}

function exportFile(content: string, filename: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────
const TuningHarnessPage: React.FC = () => {
  const { t } = useTranslation();

  // Data
  const [bundle, setBundle] = useState<FixtureBundle | null>(null);

  // Scoring params
  const [semitoneTolerance, setSemitoneTolerance] = useState(1);
  const [preWindow, setPreWindow] = useState(0.15);
  const [postExtra, setPostExtra] = useState(0.2);
  const [difficultyMult, setDifficultyMult] = useState(1.0);
  const [completionBonusFactor, setCompletionBonusFactor] = useState(0.15);
  const [goldFullBonusFactor, setGoldFullBonusFactor] = useState(0.30);
  const [offsetMs, setOffsetMs] = useState(0);
  const [autoFinding, setAutoFinding] = useState(false);

  // Telemetry — tuning run history
  const [tuningRuns, setTuningRuns] = useState<TuningRun[]>(() => {
    try {
      const raw = localStorage.getItem(TUNING_RUNS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { /* Expected: localStorage or JSON.parse may fail */ return []; }
  });

  const saveTuningRuns = useCallback((runs: TuningRun[]) => {
    setTuningRuns(runs);
    localStorage.setItem(TUNING_RUNS_KEY, JSON.stringify(runs));
  }, []);

  const params: ScoringParams = useMemo(() => ({
    semitoneTolerance,
    preWindow,
    postExtra,
    difficultyMult,
    completionBonusFactor,
    goldFullBonusFactor,
  }), [semitoneTolerance, preWindow, postExtra, difficultyMult, completionBonusFactor, goldFullBonusFactor]);

  // Apply offset to pitch points
  const shiftedPoints: PitchPoint[] = useMemo(() => {
    if (!bundle) return [];
    if (offsetMs === 0) return bundle.points;
    const shift = offsetMs / 1000;
    return bundle.points.map(p => ({ ...p, t: p.t + shift }));
  }, [bundle, offsetMs]);

  // ─── Auto-find best offset via scoring sweep ───
  const handleAutoFindOffset = useCallback(() => {
    if (!bundle) return;
    setAutoFinding(true);

    // Use requestAnimationFrame to let the UI update (show spinner) before heavy compute
    requestAnimationFrame(() => {
      const { notes, points } = bundle;

      const sweepScore = (ms: number) => {
        const shift = ms / 1000;
        const shifted = ms === 0 ? points : points.map(p => ({ ...p, t: p.t + shift }));
        return scoreNotesWithPitchPoints(notes, shifted, params).total;
      };

      // Coarse sweep: -500..+500 step 10ms
      let bestMs = 0;
      let bestScore = -Infinity;
      for (let ms = -500; ms <= 500; ms += 10) {
        const score = sweepScore(ms);
        if (score > bestScore) { bestScore = score; bestMs = ms; }
      }

      // Fine sweep: ±25ms around coarse best, step 1ms
      const lo = Math.max(-500, bestMs - 25);
      const hi = Math.min(500, bestMs + 25);
      for (let ms = lo; ms <= hi; ms += 1) {
        const score = sweepScore(ms);
        if (score > bestScore) { bestScore = score; bestMs = ms; }
      }

      setOffsetMs(bestMs);
      setAutoFinding(false);
    });
  }, [bundle, params]);

  // Compute result
  const result: ScoringResult | null = useMemo(() => {
    if (!bundle) return null;
    return scoreNotesWithPitchPoints(bundle.notes, shiftedPoints, params);
  }, [bundle, shiftedPoints, params]);

  // ─── Telemetry: save current run ───
  const handleSaveRun = useCallback(() => {
    if (!bundle || !result) return;
    const run: TuningRun = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      fixtureName: bundle.name,
      params: { ...params },
      offsetMs,
      total: result.total,
      notesHit: result.perNote.length,
      notesTotal: bundle.notes.length,
      maxCombo: result.combo?.maxCombo ?? 0,
      comboBonus: result.combo?.totalComboBonus ?? 0,
    };
    saveTuningRuns([run, ...tuningRuns]);
  }, [bundle, result, params, offsetMs, tuningRuns, saveTuningRuns]);

  const handleClearRuns = useCallback(() => {
    saveTuningRuns([]);
  }, [saveTuningRuns]);

  const handleDeleteRun = useCallback((id: string) => {
    saveTuningRuns(tuningRuns.filter(r => r.id !== id));
  }, [tuningRuns, saveTuningRuns]);

  // Sweep results
  const sweepRows: SweepRow[] = useMemo(() => {
    if (!bundle) return [];
    return (Object.keys(DefaultScoringPresets) as DifficultyLevel[]).map(level => {
      const preset = DefaultScoringPresets[level];
      const r = scoreNotesWithPitchPoints(bundle.notes, shiftedPoints, preset);
      return { label: level, params: preset, result: r };
    });
  }, [bundle, shiftedPoints]);

  // ─── Heatmap canvas ─────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !result || !bundle) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const notes = bundle.notes;
    if (notes.length === 0) return;

    const maxTime = Math.max(...notes.map(n => n.startTime + n.duration), 1);
    const pitches = notes.map(n => n.pitch);
    const minPitch = Math.min(...pitches) - 2;
    const maxPitch = Math.max(...pitches) + 2;
    const pitchRange = maxPitch - minPitch || 1;

    const W = cvs.width;
    const H = cvs.height;
    const PAD = 40;
    const drawW = W - PAD * 2;
    const drawH = H - PAD * 2;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, W, H);

    // Draw grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    for (let p = minPitch; p <= maxPitch; p++) {
      const y = PAD + drawH - ((p - minPitch) / pitchRange) * drawH;
      ctx.beginPath();
      ctx.moveTo(PAD, y);
      ctx.lineTo(PAD + drawW, y);
      ctx.stroke();
    }

    // Build a lookup map from noteKey to scored segments
    const scoreMap = new Map<string, Map<number, number>>();
    result.perNote.forEach(pn => {
      const segMap = new Map<number, number>();
      pn.segments.forEach(s => segMap.set(s.segIndex, s.frac));
      scoreMap.set(pn.noteKey, segMap);
    });

    // Draw notes as segmented bars
    notes.forEach((note) => {
      const x = PAD + (note.startTime / maxTime) * drawW;
      const w = Math.max(2, (note.duration / maxTime) * drawW);
      const y = PAD + drawH - ((note.pitch - minPitch) / pitchRange) * drawH;
      const h = Math.max(4, drawH / pitchRange * 0.8);

      const noteKey = `${note.line ?? 0}-${note.idx ?? 0}`;
      const segMap = scoreMap.get(noteKey);

      const segMs = 0.25;
      const segCount = Math.max(1, Math.ceil(note.duration / segMs));
      const segW = w / segCount;

      for (let si = 0; si < segCount; si++) {
        const frac = segMap?.get(si) ?? 0;
        ctx.fillStyle = frac > 0 ? fracToColor(frac) : '#444';
        ctx.fillRect(x + si * segW, y - h / 2, segW - 1, h);
      }

      // Gold note glow
      if (note.isGold) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 1, y - h / 2 - 1, w + 2, h + 2);
      }
    });

    // Draw pitch points as dots
    ctx.fillStyle = 'rgba(0, 200, 255, 0.4)';
    shiftedPoints.forEach(p => {
      if (p.hz <= 0) return;
      const midi = Math.round(12 * Math.log2(p.hz / 440) + 69);
      const px = PAD + (p.t / maxTime) * drawW;
      const py = PAD + drawH - ((midi - minPitch) / pitchRange) * drawH;
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Axis labels
    ctx.fillStyle = '#aaa';
    ctx.font = '11px monospace';
    ctx.fillText('Time →', W / 2, H - 5);
    ctx.save();
    ctx.translate(12, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Pitch ↑', 0, 0);
    ctx.restore();

  }, [result, bundle, shiftedPoints]);

  // ─── File import ────────────────────────
  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      if (data.notes && data.points) {
        setBundle({ name: file.name, notes: data.notes, points: data.points });
      } else if (Array.isArray(data) && data[0]?.startTime !== undefined) {
        // Just notes array
        setBundle(prev => ({ name: file.name, notes: data, points: prev?.points ?? [] }));
      } else if (Array.isArray(data) && data[0]?.t !== undefined) {
        // Just points array
        setBundle(prev => ({ name: file.name, notes: prev?.notes ?? [], points: data }));
      }
    } catch {
      /* Expected: user-selected file may contain invalid JSON */
      alert('Invalid JSON file');
    }
  }, []);

  // ─── Exports ────────────────────────────
  const handleExportJSON = useCallback(() => {
    if (!result || !bundle) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      fixture: bundle.name,
      params,
      result: {
        total: result.total,
        perNoteCount: result.perNote.length,
        combo: result.combo,
        verseRatings: result.verseRatings,
        perNote: result.perNote,
      },
    };
    exportFile(JSON.stringify(payload, null, 2), `tuning-result-${Date.now()}.json`);
  }, [result, bundle, params]);

  const handleExportCSV = useCallback(() => {
    if (!result || !bundle) return;
    const header = 'noteKey,totalAdded,completed,completionBonus,goldFullBonus,segCount';
    const rows = result.perNote.map(pn =>
      [pn.noteKey, pn.totalAdded, pn.completed ? 1 : 0, pn.completionBonus ?? 0, pn.goldFullBonus ?? 0, pn.segments.length].join(',')
    );
    exportFile([header, ...rows].join('\n'), `tuning-result-${Date.now()}.csv`, 'text/csv');
  }, [result, bundle]);

  const handleExportSweepCSV = useCallback(() => {
    if (sweepRows.length === 0) return;
    const header = 'preset,semitoneTolerance,preWindow,postExtra,difficultyMult,total,maxCombo,totalComboBonus';
    const rows = sweepRows.map(r => [
      r.label,
      r.params.semitoneTolerance,
      r.params.preWindow,
      r.params.postExtra,
      r.params.difficultyMult ?? 1,
      r.result.total,
      r.result.combo?.maxCombo ?? 0,
      r.result.combo?.totalComboBonus ?? 0,
    ].join(','));
    exportFile([header, ...rows].join('\n'), `sweep-results-${Date.now()}.csv`, 'text/csv');
  }, [sweepRows]);

  // ─── Demo fixture ───────────────────────
  const handleLoadDemo = useCallback(() => {
    // Generate a demo fixture with 10 notes
    const notes: NoteDescriptor[] = [];
    for (let i = 0; i < 10; i++) {
      notes.push({
        startTime: i * 1.5,
        duration: 1.0,
        pitch: 60 + (i % 5) * 2,
        isGold: i === 3 || i === 7,
        line: Math.floor(i / 3),
        idx: i % 3,
      });
    }
    const points: PitchPoint[] = [];
    for (const n of notes) {
      const hz = 440 * Math.pow(2, (n.pitch - 69) / 12);
      for (let t = n.startTime; t < n.startTime + n.duration; t += 0.04) {
        // Add slight random detuning
        points.push({ t, hz: hz * (0.99 + Math.random() * 0.02) });
      }
    }
    setBundle({ name: 'demo-fixture', notes, points });
  }, []);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: 4 }}>
        🔧 {t('tuningHarness.title', 'Tuning Harness')}
      </h1>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
        {t('tuningHarness.subtitle', 'Analyze and tune karaoke scoring parameters with fixture data')}
      </p>

      {/* ═══════════ IMPORT ═══════════ */}
      <div className="card mb-3 p-3">
        <h5>📂 {t('tuningHarness.import', 'Import Fixture')}</h5>
        <p className="text-muted small">
          Upload a JSON file with <code>{`{ notes: NoteDescriptor[], points: PitchPoint[] }`}</code>
        </p>
        <div className="d-flex gap-2 flex-wrap">
          <input type="file" accept=".json" className="form-control" style={{ maxWidth: 300 }} onChange={handleFileImport} />
          <button className="btn btn-outline-secondary btn-sm" onClick={handleLoadDemo}>
            Load Demo
          </button>
        </div>
        {bundle && (
          <div className="mt-2 small text-success">
            ✓ Loaded: <strong>{bundle.name}</strong> — {bundle.notes.length} notes, {bundle.points.length} pitch points
          </div>
        )}
      </div>

      {bundle && (
        <>
          {/* ═══════════ PARAMS ═══════════ */}
          <div className="card mb-3 p-3">
            <h5><i className="fa-solid fa-gear" />{" "}{t('tuningHarness.params', 'Scoring Parameters')}</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small">Semitone Tolerance: <strong>{semitoneTolerance}</strong></label>
                <input type="range" className="form-range" min={0} max={4} step={0.5}
                  value={semitoneTolerance} onChange={e => setSemitoneTolerance(Number(e.target.value))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Pre Window: <strong>{preWindow.toFixed(2)}s</strong></label>
                <input type="range" className="form-range" min={0} max={0.5} step={0.01}
                  value={preWindow} onChange={e => setPreWindow(Number(e.target.value))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Post Extra: <strong>{postExtra.toFixed(2)}s</strong></label>
                <input type="range" className="form-range" min={0} max={0.5} step={0.01}
                  value={postExtra} onChange={e => setPostExtra(Number(e.target.value))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Difficulty Mult: <strong>{difficultyMult.toFixed(2)}</strong></label>
                <input type="range" className="form-range" min={0.5} max={2} step={0.05}
                  value={difficultyMult} onChange={e => setDifficultyMult(Number(e.target.value))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Completion Bonus: <strong>{(completionBonusFactor * 100).toFixed(0)}%</strong></label>
                <input type="range" className="form-range" min={0} max={0.5} step={0.01}
                  value={completionBonusFactor} onChange={e => setCompletionBonusFactor(Number(e.target.value))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Gold Full Bonus: <strong>{(goldFullBonusFactor * 100).toFixed(0)}%</strong></label>
                <input type="range" className="form-range" min={0} max={0.5} step={0.01}
                  value={goldFullBonusFactor} onChange={e => setGoldFullBonusFactor(Number(e.target.value))} />
              </div>
              <div className="col-md-4">
                <label className="form-label small">Offset: <strong>{offsetMs > 0 ? '+' : ''}{offsetMs} ms</strong></label>
                <input type="range" className="form-range" min={-500} max={500} step={5}
                  value={offsetMs} onChange={e => setOffsetMs(Number(e.target.value))} />
                <button
                  className="btn btn-sm btn-outline-warning mt-1"
                  disabled={!bundle || autoFinding}
                  onClick={handleAutoFindOffset}
                  title={t('tuningHarness.autoFindTooltip', 'Sweep -500..+500 ms to find offset that maximises scoring total')}
                >
                  {autoFinding ? '⏳ …' : <i className="fa-solid fa-bullseye" />} {t('tuningHarness.autoFind', 'Auto-find best offset')}
                </button>
              </div>
            </div>
            {/* Quick preset buttons */}
            <div className="mt-2 d-flex gap-2">
              {(Object.keys(DefaultScoringPresets) as DifficultyLevel[]).map(level => (
                <button
                  key={level}
                  className="btn btn-sm btn-outline-info"
                  onClick={() => {
                    const p = DefaultScoringPresets[level];
                    setSemitoneTolerance(p.semitoneTolerance);
                    setPreWindow(p.preWindow);
                    setPostExtra(p.postExtra);
                    setDifficultyMult(p.difficultyMult);
                  }}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════ RESULT SUMMARY ═══════════ */}
          {result && (
            <div className="card mb-3 p-3">
              <h5><i className="fa-solid fa-chart-bar" />{" "}{t('tuningHarness.results', 'Results')}</h5>
              <div className="d-flex gap-4 flex-wrap mb-3" style={{ fontSize: 16 }}>
                <div>
                  <div className="text-muted small">Total Score</div>
                  <strong>{result.total}</strong>
                </div>
                <div>
                  <div className="text-muted small">Notes Scored</div>
                  <strong>{result.perNote.length} / {bundle.notes.length}</strong>
                </div>
                <div>
                  <div className="text-muted small">Max Combo</div>
                  <strong>🔥 {result.combo?.maxCombo ?? 0}</strong>
                </div>
                <div>
                  <div className="text-muted small">Combo Bonus</div>
                  <strong>+{result.combo?.totalComboBonus ?? 0}</strong>
                </div>
              </div>

              {/* Verse ratings */}
              {result.verseRatings && result.verseRatings.length > 0 && (
                <div className="mb-3">
                  <h6>Verse Ratings</h6>
                  <div className="d-flex gap-2 flex-wrap">
                    {result.verseRatings.map(vr => (
                      <span
                        key={vr.verseIndex}
                        className={`badge ${vr.label === 'Perfect' ? 'bg-success' : vr.label === 'Great' ? 'bg-primary' : vr.label === 'Good' ? 'bg-info' : vr.label === 'OK' ? 'bg-warning text-dark' : 'bg-danger'}`}
                      >
                        V{vr.verseIndex}: {vr.label} ({(vr.hitFraction * 100).toFixed(0)}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Export buttons */}
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-success" onClick={handleExportJSON}>
                  📥 Export JSON
                </button>
                <button className="btn btn-sm btn-outline-success" onClick={handleExportCSV}>
                  📥 Export CSV
                </button>
              </div>
            </div>
          )}

          {/* ═══════════ HEATMAP ═══════════ */}
          <div className="card mb-3 p-3">
            <h5>🗺️ {t('tuningHarness.heatmap', 'Segmentation Heatmap')}</h5>
            <canvas
              ref={canvasRef}
              width={880}
              height={300}
              style={{
                width: '100%',
                height: 300,
                borderRadius: 8,
                border: '1px solid #333',
              }}
              role="img"
              aria-label="Segmentation heatmap canvas"
            />
            <div className="d-flex gap-3 mt-2 small">
              <span>■ <span style={{ color: '#f44336' }}>Miss</span></span>
              <span>■ <span style={{ color: '#ff9800' }}>Poor</span></span>
              <span>■ <span style={{ color: '#ffeb3b' }}>OK</span></span>
              <span>■ <span style={{ color: '#8bc34a' }}>Good</span></span>
              <span>■ <span style={{ color: '#4caf50' }}>Great</span></span>
              <span>■ <span style={{ color: '#ffd700' }}>🌟 Gold note</span></span>
              <span>● <span style={{ color: 'rgba(0,200,255,0.6)' }}>Pitch point</span></span>
            </div>
          </div>

          {/* ═══════════ PRESET SWEEP ═══════════ */}
          <div className="card mb-3 p-3">
            <h5>📈 {t('tuningHarness.sweep', 'Preset Sweep')}</h5>
            <table className="table table-sm table-bordered" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Preset</th>
                  <th>Semitone</th>
                  <th>PreWin</th>
                  <th>PostEx</th>
                  <th>DiffMult</th>
                  <th>Total</th>
                  <th>MaxCombo</th>
                  <th>ComboBonus</th>
                  <th>Notes Hit</th>
                </tr>
              </thead>
              <tbody>
                {sweepRows.map(row => (
                  <tr key={row.label}>
                    <td><strong>{row.label}</strong></td>
                    <td>{row.params.semitoneTolerance}</td>
                    <td>{row.params.preWindow}</td>
                    <td>{row.params.postExtra}</td>
                    <td>{row.params.difficultyMult}</td>
                    <td><strong>{row.result.total}</strong></td>
                    <td>{row.result.combo?.maxCombo ?? 0}</td>
                    <td>{row.result.combo?.totalComboBonus ?? 0}</td>
                    <td>{row.result.perNote.length}/{bundle.notes.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn btn-sm btn-outline-info" onClick={handleExportSweepCSV}>
              📥 Export Sweep CSV
            </button>
          </div>

          {/* ═══════════ TELEMETRY / RUN HISTORY ═══════════ */}
          <div className="card mb-3 p-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0"><i className="fa-solid fa-chart-bar" />{" "}{t('tuningHarness.telemetry', 'Tuning Run History')}</h5>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-success"
                  disabled={!result}
                  onClick={handleSaveRun}
                  title={t('tuningHarness.saveRunTooltip', 'Save current params & score to history')}
                >
                  💾 {t('tuningHarness.saveRun', 'Save Run')}
                </button>
                {tuningRuns.length > 0 && (
                  <button className="btn btn-sm btn-outline-danger" onClick={handleClearRuns}>
                    <i className="fa-solid fa-trash" />{" "}{t('tuningHarness.clearRuns', 'Clear All')}
                  </button>
                )}
              </div>
            </div>

            {tuningRuns.length === 0 ? (
              <p className="text-muted small mb-0">
                {t('tuningHarness.noRuns', 'No saved runs yet. Adjust parameters and click "Save Run" to start comparing.')}
              </p>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <table className="table table-sm table-bordered" style={{ fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Fixture</th>
                      <th>Semi</th>
                      <th>PreWin</th>
                      <th>PostEx</th>
                      <th>DiffMult</th>
                      <th>Offset</th>
                      <th>Total</th>
                      <th>Notes</th>
                      <th>Combo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tuningRuns.map((run) => {
                      const best = tuningRuns.reduce((max, r) => r.total > max.total ? r : max, tuningRuns[0]);
                      const isBest = run.id === best.id;
                      return (
                        <tr key={run.id} style={isBest ? { backgroundColor: 'rgba(76,175,80,0.15)' } : undefined}>
                          <td title={new Date(run.timestamp).toISOString()}>
                            {new Date(run.timestamp).toLocaleTimeString()}
                          </td>
                          <td>{run.fixtureName}</td>
                          <td>{run.params.semitoneTolerance}</td>
                          <td>{run.params.preWindow}</td>
                          <td>{run.params.postExtra}</td>
                          <td>{run.params.difficultyMult}</td>
                          <td>{run.offsetMs > 0 ? '+' : ''}{run.offsetMs}ms</td>
                          <td><strong>{run.total}{isBest && ' ⭐'}</strong></td>
                          <td>{run.notesHit}/{run.notesTotal}</td>
                          <td>🔥{run.maxCombo} (+{run.comboBonus})</td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-secondary py-0 px-1"
                              onClick={() => handleDeleteRun(run.id)}
                              title="Delete run"
                            >✗</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ═══════════ PER-NOTE DETAIL ═══════════ */}
          <div className="card mb-3 p-3">
            <h5><i className="fa-solid fa-pen-to-square" />{" "}{t('tuningHarness.perNote', 'Per-Note Detail')}</h5>
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              <table className="table table-sm" style={{ fontSize: 12 }}>
                <thead>
                  <tr>
                    <th>Key</th>
                    <th>Added</th>
                    <th>Segs</th>
                    <th>Done?</th>
                    <th>CompBonus</th>
                    <th>GoldBonus</th>
                    <th>Avg Frac</th>
                  </tr>
                </thead>
                <tbody>
                  {result?.perNote.map((pn, i) => {
                    const avgFrac = pn.segments.length > 0
                      ? pn.segments.reduce((s, seg) => s + seg.frac, 0) / pn.segments.length
                      : 0;
                    return (
                      <tr key={i}>
                        <td><code>{pn.noteKey}</code></td>
                        <td>{pn.totalAdded}</td>
                        <td>{pn.segments.length}</td>
                        <td>{pn.completed ? '✓' : '✗'}</td>
                        <td>{pn.completionBonus ?? 0}</td>
                        <td>{pn.goldFullBonus ?? 0}</td>
                        <td>
                          <div className="progress" style={{ height: 14, minWidth: 60 }}>
                            <div
                              className="progress-bar"
                              style={{
                                width: `${avgFrac * 100}%`,
                                backgroundColor: fracToColor(avgFrac),
                              }}
                            >
                              {(avgFrac * 100).toFixed(0)}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TuningHarnessPage;
