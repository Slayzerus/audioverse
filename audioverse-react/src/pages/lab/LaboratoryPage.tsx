/**
 * LaboratoryPage.tsx — Admin page for pitch-detection experiments.
 *
 * Tabs:
 *  1. Health          – check AI microservice status
 *  2. Pitch Detection – CREPE / pYIN / Compare / Separation Effect
 *  3. DTW Score       – singing scoring
 *  4. Batch Pitch     – batch CREPE on multiple files
 *  5. Benchmark       – latency benchmark
 *  6. Report          – generate branded PDF
 *  7. Experiments     – history of saved experiments
 */
import React, { useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ui/ToastProvider";
import {
    useLabHealthQuery,
    usePitchCrepeMutation,
    usePitchPyinMutation,
    usePitchCompareMutation,
    useSeparationEffectMutation,
    useDtwScoreMutation,
    useBatchPitchMutation,
    useBenchmarkLatencyMutation,
    useReportPdfMutation,
    useExperimentsQuery,
    useExperimentDetailQuery,
    useExperimentSamplesQuery,
    fetchExperimentPdf,
    fetchSampleDownloadUrl,
} from "../../scripts/api/apiLab";
import type {
    PitchResult,
    PitchCompareResponse,
    SeparationEffectResponse,
    DtwScoreResponse,
    BatchPitchResponse,
    BenchmarkResponse,
    ExperimentSummary,
    PitchTrackPoint,
} from "../../models/modelsLab";

type Tab = "health" | "pitch" | "dtw" | "batch" | "benchmark" | "report" | "experiments";

const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════════
const LaboratoryPage: React.FC = () => {
    const { t } = useTranslation();
    const [tab, setTab] = useState<Tab>("health");

    const tabs: { key: Tab; label: string }[] = [
        { key: "health", label: t("lab.tabs.health", "Health") },
        { key: "pitch", label: t("lab.tabs.pitch", "Pitch Detection") },
        { key: "dtw", label: t("lab.tabs.dtw", "DTW Score") },
        { key: "batch", label: t("lab.tabs.batch", "Batch Pitch") },
        { key: "benchmark", label: t("lab.tabs.benchmark", "Benchmark") },
        { key: "report", label: t("lab.tabs.report", "Report PDF") },
        { key: "experiments", label: t("lab.tabs.experiments", "Experiments") },
    ];

    return (
        <div className="container-fluid py-4">
            <h2 className="mb-3">
                <i className="bi bi-soundwave me-2" />
                {t("lab.title", "Laboratory — Pitch Detection Experiments")}
            </h2>
            <ul className="nav nav-tabs mb-4">
                {tabs.map((tb) => (
                    <li className="nav-item" key={tb.key}>
                        <button className={`nav-link ${tab === tb.key ? "active" : ""}`} onClick={() => setTab(tb.key)}>{tb.label}</button>
                    </li>
                ))}
            </ul>
            {tab === "health" && <HealthTab />}
            {tab === "pitch" && <PitchTab />}
            {tab === "dtw" && <DtwTab />}
            {tab === "batch" && <BatchTab />}
            {tab === "benchmark" && <BenchmarkTab />}
            {tab === "report" && <ReportTab />}
            {tab === "experiments" && <ExperimentsTab />}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. HealthTab
// ═══════════════════════════════════════════════════════════════════════════════
const HealthTab: React.FC = () => {
    const { t } = useTranslation();
    const { data, isLoading, error, refetch } = useLabHealthQuery();
    return (
        <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
                <span>{t("lab.health.title", "AI Microservice Health")}</span>
                <button className="btn btn-sm btn-outline-primary" onClick={() => refetch()}>
                    <i className="bi bi-arrow-clockwise me-1" />{t("common.refresh", "Refresh")}
                </button>
            </div>
            <div className="card-body">
                {isLoading && <div className="spinner-border spinner-border-sm" />}
                {error && <div className="alert alert-danger">{String(error)}</div>}
                {data && (
                    <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                            <thead><tr><th>{t("lab.health.service", "Service")}</th><th>{t("lab.health.status", "Status")}</th></tr></thead>
                            <tbody>
                                {Object.entries(data).map(([name, status]) => (
                                    <tr key={name}>
                                        <td>{name}</td>
                                        <td><span className={`badge ${status === "ok" ? "bg-success" : status === "not configured" ? "bg-secondary" : "bg-danger"}`}>{status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PitchTab
// ═══════════════════════════════════════════════════════════════════════════════
type PitchMode = "crepe" | "pyin" | "compare" | "separation";

const PitchTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [mode, setMode] = useState<PitchMode>("crepe");
    const fileRef = useRef<HTMLInputElement>(null);
    const [pitchResult, setPitchResult] = useState<PitchResult | null>(null);
    const [compareResult, setCompareResult] = useState<PitchCompareResponse | null>(null);
    const [sepResult, setSepResult] = useState<SeparationEffectResponse | null>(null);

    const crepe = usePitchCrepeMutation();
    const pyin = usePitchPyinMutation();
    const compare = usePitchCompareMutation();
    const separation = useSeparationEffectMutation();
    const busy = crepe.isPending || pyin.isPending || compare.isPending || separation.isPending;

    const handleRun = useCallback(async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) { showToast(t("lab.pitch.noFile", "Select an audio file first."), "error"); return; }
        try {
            setPitchResult(null); setCompareResult(null); setSepResult(null);
            if (mode === "crepe") setPitchResult(await crepe.mutateAsync(file));
            else if (mode === "pyin") setPitchResult(await pyin.mutateAsync(file));
            else if (mode === "compare") setCompareResult(await compare.mutateAsync(file));
            else setSepResult(await separation.mutateAsync(file));
            showToast(t("lab.pitch.done", "Analysis complete."), "success");
        } catch (e: unknown) { showToast(String((e as Error).message ?? e), "error"); }
    }, [mode, crepe, pyin, compare, separation, showToast, t]);

    const modes: { key: PitchMode; label: string }[] = [
        { key: "crepe", label: "CREPE" },
        { key: "pyin", label: "pYIN" },
        { key: "compare", label: t("lab.pitch.compare", "Compare") },
        { key: "separation", label: t("lab.pitch.separation", "Separation Effect") },
    ];

    return (
        <div className="card">
            <div className="card-header">{t("lab.pitch.title", "Pitch Detection")}</div>
            <div className="card-body">
                <div className="btn-group mb-3">
                    {modes.map((m) => (
                        <button key={m.key} className={`btn btn-sm ${mode === m.key ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setMode(m.key)}>{m.label}</button>
                    ))}
                </div>
                <div className="row g-2 mb-3 align-items-end">
                    <div className="col-auto">
                        <label className="form-label">{t("lab.pitch.file", "Audio file")}</label>
                        <input ref={fileRef} type="file" accept="audio/*" className="form-control form-control-sm" />
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-success btn-sm" disabled={busy} onClick={handleRun}>
                            {busy ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                            {t("lab.pitch.run", "Run")}
                        </button>
                    </div>
                </div>
                {pitchResult && <PitchResultCard result={pitchResult} />}
                {compareResult && <CompareResultCard result={compareResult} />}
                {sepResult && <SeparationResultCard result={sepResult} />}
            </div>
        </div>
    );
};

const PitchResultCard: React.FC<{ result: PitchResult }> = ({ result }) => {
    const { t } = useTranslation();
    return (
        <div className="card border-info mt-2">
            <div className="card-body">
                <h6>{result.algorithm}</h6>
                <div className="row">
                    <div className="col-md-3"><strong>{t("lab.pitch.latency", "Latency")}:</strong> {result.latencyMs} ms</div>
                    <div className="col-md-3"><strong>{t("lab.pitch.median", "Median")}:</strong> {result.medianHz?.toFixed(1)} Hz</div>
                    <div className="col-md-3"><strong>{t("lab.pitch.note", "Note")}:</strong> {result.noteName ?? "-"}</div>
                    <div className="col-md-3"><strong>{t("lab.pitch.frames", "Frames")}:</strong> {result.frameCount}</div>
                </div>
                {result.track && result.track.length > 0 && <TrackTable track={result.track} />}
            </div>
        </div>
    );
};

const TrackTable: React.FC<{ track: PitchTrackPoint[] }> = ({ track }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState(false);
    const shown = expanded ? track : track.slice(0, 20);
    return (
        <div className="mt-2">
            <table className="table table-sm table-bordered" style={{ maxWidth: 400 }}>
                <thead><tr><th>{t("lab.pitch.time", "Time (ms)")}</th><th>{t("lab.pitch.freq", "Hz")}</th></tr></thead>
                <tbody>{shown.map((p, i) => <tr key={i}><td>{p.t.toFixed(0)}</td><td>{p.hz.toFixed(1)}</td></tr>)}</tbody>
            </table>
            {track.length > 20 && (
                <button className="btn btn-link btn-sm p-0" onClick={() => setExpanded(!expanded)}>
                    {expanded ? t("common.showLess", "Show less") : t("common.showAll", `Show all ${track.length}`)}
                </button>
            )}
        </div>
    );
};

const CompareResultCard: React.FC<{ result: PitchCompareResponse }> = ({ result }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-2">
            <div className="row">
                {result.crepe && <div className="col-md-6"><PitchResultCard result={result.crepe} /></div>}
                {result.pyin && <div className="col-md-6"><PitchResultCard result={result.pyin} /></div>}
            </div>
            {result.comparison && (
                <div className="card border-warning mt-2">
                    <div className="card-body">
                        <h6>{t("lab.pitch.comparisonMetrics", "Comparison Metrics")}</h6>
                        <div className="row">
                            <div className="col"><strong>RMSE (Hz):</strong> {result.comparison.rmseHz.toFixed(2)}</div>
                            <div className="col"><strong>RMSE (cents):</strong> {result.comparison.rmseCents.toFixed(1)}</div>
                            <div className="col"><strong>Accuracy@50¢:</strong> {(result.comparison.accuracy50c * 100).toFixed(1)}%</div>
                            <div className="col"><strong>Pearson r:</strong> {result.comparison.pearsonR.toFixed(4)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SeparationResultCard: React.FC<{ result: SeparationEffectResponse }> = ({ result }) => {
    const { t } = useTranslation();
    return (
        <div className="mt-2">
            <div className="row g-3">
                <div className="col-md-4">
                    <div className="card border-secondary h-100">
                        <div className="card-header">{t("lab.sep.original", "Original CREPE")}</div>
                        <div className="card-body">
                            {result.original ? (
                                <>
                                    <p><strong>{t("lab.pitch.latency", "Latency")}:</strong> {result.original.latencyMs} ms</p>
                                    <p><strong>{t("lab.pitch.median", "Median")}:</strong> {result.original.medianHz?.toFixed(1)} Hz</p>
                                    <p><strong>{t("lab.pitch.frames", "Frames")}:</strong> {result.original.frameCount}</p>
                                </>
                            ) : <span className="text-muted">N/A</span>}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-secondary h-100">
                        <div className="card-header">{t("lab.sep.separation", "Demucs Separation")}</div>
                        <div className="card-body">
                            <p><strong>{t("lab.pitch.latency", "Latency")}:</strong> {result.separation.latencyMs} ms</p>
                            {result.separation.error && <div className="alert alert-warning py-1">{result.separation.error}</div>}
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card border-secondary h-100">
                        <div className="card-header">{t("lab.sep.afterSep", "After Separation CREPE")}</div>
                        <div className="card-body">
                            {result.afterSeparation ? (
                                <>
                                    <p><strong>{t("lab.pitch.latency", "Latency")}:</strong> {result.afterSeparation.latencyMs} ms</p>
                                    <p><strong>{t("lab.pitch.median", "Median")}:</strong> {result.afterSeparation.medianHz?.toFixed(1)} Hz</p>
                                    <p><strong>{t("lab.pitch.frames", "Frames")}:</strong> {result.afterSeparation.frameCount}</p>
                                </>
                            ) : <span className="text-muted">N/A</span>}
                        </div>
                    </div>
                </div>
            </div>
            {result.comparison && (
                <div className="card border-warning mt-2">
                    <div className="card-body">
                        <h6>{t("lab.sep.comparisonMetrics", "Original vs Separated — Metrics")}</h6>
                        <div className="row">
                            <div className="col"><strong>RMSE (Hz):</strong> {result.comparison.rmseHz.toFixed(2)}</div>
                            <div className="col"><strong>RMSE (cents):</strong> {result.comparison.rmseCents.toFixed(1)}</div>
                            <div className="col"><strong>Accuracy@50¢:</strong> {(result.comparison.accuracy50c * 100).toFixed(1)}%</div>
                            <div className="col"><strong>Pearson r:</strong> {result.comparison.pearsonR.toFixed(4)}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. DtwTab
// ═══════════════════════════════════════════════════════════════════════════════
const DtwTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const vocalRef = useRef<HTMLInputElement>(null);
    const refRef = useRef<HTMLInputElement>(null);
    const [result, setResult] = useState<DtwScoreResponse | null>(null);
    const mutation = useDtwScoreMutation();

    const handleRun = async () => {
        const vocal = vocalRef.current?.files?.[0];
        const reference = refRef.current?.files?.[0];
        if (!vocal || !reference) { showToast(t("lab.dtw.noFiles", "Select both vocal and reference files."), "error"); return; }
        try {
            const res = await mutation.mutateAsync({ vocal, reference });
            setResult(res);
            showToast(t("lab.dtw.done", "DTW scoring complete."), "success");
        } catch (e: unknown) { showToast(String((e as Error).message ?? e), "error"); }
    };

    return (
        <div className="card">
            <div className="card-header">{t("lab.dtw.title", "DTW Singing Score")}</div>
            <div className="card-body">
                <div className="row g-3 mb-3">
                    <div className="col-md-5">
                        <label className="form-label">{t("lab.dtw.vocal", "Vocal file")}</label>
                        <input ref={vocalRef} type="file" accept="audio/*" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-5">
                        <label className="form-label">{t("lab.dtw.reference", "Reference file")}</label>
                        <input ref={refRef} type="file" accept="audio/*" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                        <button className="btn btn-success btn-sm w-100" disabled={mutation.isPending} onClick={handleRun}>
                            {mutation.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                            {t("lab.dtw.run", "Score")}
                        </button>
                    </div>
                </div>
                {result && (
                    <div className="card border-success mt-2">
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col"><h3 className="text-success">{result.score.toFixed(1)}</h3><small>{t("lab.dtw.overallScore", "Overall Score")}</small></div>
                                <div className="col"><h3>{result.pitchAccuracy.toFixed(1)}</h3><small>{t("lab.dtw.pitchAcc", "Pitch Accuracy")}</small></div>
                                <div className="col"><h3>{result.rhythmAccuracy.toFixed(1)}</h3><small>{t("lab.dtw.rhythmAcc", "Rhythm Accuracy")}</small></div>
                                <div className="col"><h5 className="text-muted">{result.latencyMs} ms</h5><small>{t("lab.dtw.latency", "Latency")}</small></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. BatchTab
// ═══════════════════════════════════════════════════════════════════════════════
const BatchTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [result, setResult] = useState<BatchPitchResponse | null>(null);
    const mutation = useBatchPitchMutation();

    const handleRun = async () => {
        const files = fileRef.current?.files;
        if (!files || files.length === 0) { showToast(t("lab.batch.noFiles", "Select audio files (up to 20)."), "error"); return; }
        try {
            const res = await mutation.mutateAsync(Array.from(files));
            setResult(res);
            showToast(t("lab.batch.done", `Batch complete — ${res.count} files.`), "success");
        } catch (e: unknown) { showToast(String((e as Error).message ?? e), "error"); }
    };

    return (
        <div className="card">
            <div className="card-header">{t("lab.batch.title", "Batch CREPE Pitch Detection")}</div>
            <div className="card-body">
                <div className="row g-2 mb-3 align-items-end">
                    <div className="col-auto">
                        <label className="form-label">{t("lab.batch.files", "Audio files (max 20)")}</label>
                        <input ref={fileRef} type="file" accept="audio/*" multiple className="form-control form-control-sm" />
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-success btn-sm" disabled={mutation.isPending} onClick={handleRun}>
                            {mutation.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-play-fill me-1" />}
                            {t("lab.batch.run", "Run Batch")}
                        </button>
                    </div>
                </div>
                {result && (
                    <div className="table-responsive mt-2">
                        <table className="table table-sm table-striped">
                            <thead>
                                <tr>
                                    <th>{t("lab.batch.fileName", "File")}</th>
                                    <th>{t("lab.pitch.median", "Median Hz")}</th>
                                    <th>{t("lab.pitch.note", "Note")}</th>
                                    <th>{t("lab.batch.voiced", "Voiced")}</th>
                                    <th>{t("lab.batch.total", "Total")}</th>
                                    <th>{t("lab.batch.ratio", "Ratio")}</th>
                                    <th>{t("lab.pitch.latency", "Latency (ms)")}</th>
                                    <th>{t("lab.batch.error", "Error")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {result.rows.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.fileName}</td>
                                        <td>{r.medianHz?.toFixed(1) ?? "-"}</td>
                                        <td>{r.noteName ?? "-"}</td>
                                        <td>{r.voicedFrames ?? "-"}</td>
                                        <td>{r.totalFrames ?? "-"}</td>
                                        <td>{r.voicedRatio != null ? (r.voicedRatio * 100).toFixed(1) + "%" : "-"}</td>
                                        <td>{r.latencyMs ?? "-"}</td>
                                        <td>{r.error && <span className="text-danger">{r.error}</span>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BenchmarkTab
// ═══════════════════════════════════════════════════════════════════════════════
const BenchmarkTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);
    const [runs, setRuns] = useState(5);
    const [result, setResult] = useState<BenchmarkResponse | null>(null);
    const mutation = useBenchmarkLatencyMutation();

    const handleRun = async () => {
        const file = fileRef.current?.files?.[0];
        if (!file) { showToast(t("lab.bench.noFile", "Select a short audio file (2-5s)."), "error"); return; }
        try {
            const res = await mutation.mutateAsync({ file, runs });
            setResult(res);
            showToast(t("lab.bench.done", "Benchmark complete."), "success");
        } catch (e: unknown) { showToast(String((e as Error).message ?? e), "error"); }
    };

    return (
        <div className="card">
            <div className="card-header">{t("lab.bench.title", "Latency Benchmark")}</div>
            <div className="card-body">
                <div className="row g-2 mb-3 align-items-end">
                    <div className="col-auto">
                        <label className="form-label">{t("lab.bench.file", "Audio file (2-5s)")}</label>
                        <input ref={fileRef} type="file" accept="audio/*" className="form-control form-control-sm" />
                    </div>
                    <div className="col-auto">
                        <label className="form-label">{t("lab.bench.runs", "Runs")}</label>
                        <input type="number" min={1} max={20} value={runs} onChange={e => setRuns(Number(e.target.value))} className="form-control form-control-sm" style={{ width: 80 }} />
                    </div>
                    <div className="col-auto">
                        <button className="btn btn-success btn-sm" disabled={mutation.isPending} onClick={handleRun}>
                            {mutation.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-speedometer me-1" />}
                            {t("lab.bench.run", "Run Benchmark")}
                        </button>
                    </div>
                </div>
                {result && (
                    <>
                        <p className="text-muted mb-2">{result.runs} runs, file {result.fileSizeKb} KB</p>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>{t("lab.bench.service", "Service")}</th>
                                        <th>{t("lab.bench.avgMs", "Avg (ms)")}</th>
                                        <th>{t("lab.bench.minMs", "Min")}</th>
                                        <th>{t("lab.bench.maxMs", "Max")}</th>
                                        <th>{t("lab.bench.stddev", "StdDev")}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.results.map((r, i) => (
                                        <tr key={i}>
                                            <td>{r.serviceName}</td>
                                            <td>{r.avgMs.toFixed(0)}</td>
                                            <td>{r.minMs}</td>
                                            <td>{r.maxMs}</td>
                                            <td>{r.stdDevMs.toFixed(1)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. ReportTab
// ═══════════════════════════════════════════════════════════════════════════════
const ReportTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const audioRef = useRef<HTMLInputElement>(null);
    const vocalRef = useRef<HTMLInputElement>(null);
    const refRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState("Pitch Detection Algorithm Comparison: CREPE vs pYIN");
    const [operator, setOperator] = useState("");
    const [benchRuns, setBenchRuns] = useState(3);
    const mutation = useReportPdfMutation();

    const handleGenerate = async () => {
        const audioFiles = audioRef.current?.files;
        if (!audioFiles || audioFiles.length === 0) { showToast(t("lab.report.noFiles", "Select at least one audio file."), "error"); return; }
        try {
            const blob = await mutation.mutateAsync({
                audioFiles: Array.from(audioFiles),
                vocalFile: vocalRef.current?.files?.[0],
                referenceFile: refRef.current?.files?.[0],
                reportTitle: title || undefined,
                operatorName: operator || undefined,
                benchmarkRuns: benchRuns,
            });
            downloadBlob(blob, `AudioVerse_Lab_Report_${new Date().toISOString().slice(0, 16).replace(/[:-]/g, "")}.pdf`);
            showToast(t("lab.report.done", "PDF report downloaded."), "success");
        } catch (e: unknown) { showToast(String((e as Error).message ?? e), "error"); }
    };

    return (
        <div className="card">
            <div className="card-header">{t("lab.report.title", "Generate Full PDF Report")}</div>
            <div className="card-body">
                <div className="mb-3">
                    <label className="form-label">{t("lab.report.audioFiles", "Audio files (used for CREPE/pYIN comparison)")}</label>
                    <input ref={audioRef} type="file" accept="audio/*" multiple className="form-control form-control-sm" />
                </div>
                <div className="row g-3 mb-3">
                    <div className="col-md-6">
                        <label className="form-label">{t("lab.report.vocal", "Vocal file (optional, for DTW)")}</label>
                        <input ref={vocalRef} type="file" accept="audio/*" className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">{t("lab.report.reference", "Reference file (optional, for DTW)")}</label>
                        <input ref={refRef} type="file" accept="audio/*" className="form-control form-control-sm" />
                    </div>
                </div>
                <div className="row g-3 mb-3">
                    <div className="col-md-5">
                        <label className="form-label">{t("lab.report.reportTitle", "Report Title")}</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="form-control form-control-sm" />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">{t("lab.report.operator", "Operator Name")}</label>
                        <input type="text" value={operator} onChange={e => setOperator(e.target.value)} className="form-control form-control-sm" placeholder="Administrator" />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">{t("lab.report.benchRuns", "Benchmark Runs")}</label>
                        <input type="number" min={1} max={10} value={benchRuns} onChange={e => setBenchRuns(Number(e.target.value))} className="form-control form-control-sm" />
                    </div>
                </div>
                <button className="btn btn-primary" disabled={mutation.isPending} onClick={handleGenerate}>
                    {mutation.isPending ? <span className="spinner-border spinner-border-sm me-1" /> : <i className="bi bi-file-earmark-pdf me-1" />}
                    {t("lab.report.generate", "Generate & Download PDF")}
                </button>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ExperimentsTab
// ═══════════════════════════════════════════════════════════════════════════════
const ExperimentsTab: React.FC = () => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [take, setTake] = useState(20);
    const { data: experiments, isLoading, error } = useExperimentsQuery(take);
    const [selectedGuid, setSelectedGuid] = useState<string | null>(null);

    return (
        <div>
            <div className="card mb-3">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <span>{t("lab.exp.title", "Experiment History")}</span>
                    <div className="d-flex align-items-center gap-2">
                        <label className="form-label mb-0 small">{t("lab.exp.show", "Show")}</label>
                        <select className="form-select form-select-sm" style={{ width: 80 }} value={take} onChange={e => setTake(Number(e.target.value))}>
                            {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                </div>
                <div className="card-body">
                    {isLoading && <div className="spinner-border spinner-border-sm" />}
                    {error && <div className="alert alert-danger">{String(error)}</div>}
                    {experiments && experiments.length === 0 && <div className="text-muted">{t("lab.exp.empty", "No experiments yet.")}</div>}
                    {experiments && experiments.length > 0 && (
                        <div className="table-responsive">
                            <ExperimentsTable
                                experiments={experiments}
                                selectedGuid={selectedGuid}
                                onSelect={setSelectedGuid}
                                onDownloadPdf={async (guid) => {
                                    try {
                                        const blob = await fetchExperimentPdf(guid);
                                        downloadBlob(blob, `AudioVerse_Lab_${guid}.pdf`);
                                        showToast(t("lab.exp.pdfDownloaded", "PDF downloaded."), "success");
                                    } catch (e: unknown) { showToast(String((e as Error).message ?? e), "error"); }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
            {selectedGuid && <ExperimentDetailPanel guid={selectedGuid} />}
        </div>
    );
};

const ExperimentsTable: React.FC<{
    experiments: ExperimentSummary[];
    selectedGuid: string | null;
    onSelect: (guid: string) => void;
    onDownloadPdf: (guid: string) => void;
}> = ({ experiments, selectedGuid, onSelect, onDownloadPdf }) => {
    const { t } = useTranslation();
    return (
        <table className="table table-sm table-hover align-middle">
            <thead>
                <tr>
                    <th>{t("lab.exp.date", "Date")}</th>
                    <th>{t("lab.exp.expTitle", "Title")}</th>
                    <th>{t("lab.exp.operator", "Operator")}</th>
                    <th>{t("lab.exp.files", "Files")}</th>
                    <th>{t("lab.exp.crepeRmse", "CREPE RMSE¢")}</th>
                    <th>{t("lab.exp.pyinRmse", "pYIN RMSE¢")}</th>
                    <th>{t("lab.exp.dtwScore", "DTW")}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {experiments.map(exp => (
                    <tr key={exp.experimentGuid} className={selectedGuid === exp.experimentGuid ? "table-active" : ""}>
                        <td>{new Date(exp.executedAt).toLocaleString()}</td>
                        <td><button className="btn btn-link btn-sm p-0" onClick={() => onSelect(exp.experimentGuid)}>{exp.title || exp.experimentGuid.slice(0, 8)}</button></td>
                        <td>{exp.operator}</td>
                        <td>{exp.fileCount}</td>
                        <td>{exp.crepeAvgRmseCents?.toFixed(1) ?? "-"}</td>
                        <td>{exp.pyinAvgRmseCents?.toFixed(1) ?? "-"}</td>
                        <td>{exp.dtwScore?.toFixed(1) ?? "-"}</td>
                        <td><button className="btn btn-sm btn-outline-secondary" title="Download PDF" onClick={() => onDownloadPdf(exp.experimentGuid)}><i className="bi bi-file-earmark-pdf" /></button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

const ExperimentDetailPanel: React.FC<{ guid: string }> = ({ guid }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const { data: detail, isLoading, error } = useExperimentDetailQuery(guid);
    const { data: storedSamples, isLoading: samplesLoading } = useExperimentSamplesQuery(guid);

    const handleDownloadSample = async (fileName: string) => {
        try {
            const result = await fetchSampleDownloadUrl(guid, fileName);
            window.open(result.downloadUrl, "_blank");
        } catch (e: unknown) {
            showToast(String((e as Error).message ?? e), "error");
        }
    };

    if (isLoading) return <div className="text-center py-3"><div className="spinner-border" /></div>;
    if (error) return <div className="alert alert-danger">{String(error)}</div>;
    if (!detail) return null;

    return (
        <div className="card border-primary">
            <div className="card-header bg-primary text-white">
                {t("lab.exp.detail", "Experiment Detail")} — {detail.experimentGuid.slice(0, 8)}…
            </div>
            <div className="card-body">
                <div className="row mb-3">
                    <div className="col-md-3"><strong>{t("lab.exp.expTitle", "Title")}:</strong> {detail.title}</div>
                    <div className="col-md-3"><strong>{t("lab.exp.operator", "Operator")}:</strong> {detail.operator}</div>
                    <div className="col-md-3"><strong>{t("lab.exp.date", "Date")}:</strong> {new Date(detail.executedAt).toLocaleString()}</div>
                    <div className="col-md-3"><strong>{t("lab.exp.files", "Files")}:</strong> {detail.fileCount}</div>
                </div>

                {detail.samples && detail.samples.length > 0 && (
                    <>
                        <h6 className="mt-3">{t("lab.exp.samples", "Samples")}</h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>{t("lab.batch.fileName", "File")}</th>
                                        <th>CREPE Hz</th><th>CREPE ms</th>
                                        <th>pYIN Hz</th><th>pYIN ms</th>
                                        <th>RMSE ¢</th><th>Acc@50¢</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {detail.samples.map((s, i) => (
                                        <tr key={i}>
                                            <td>{s.fileName}</td>
                                            <td>{s.crepeMedianHz?.toFixed(1) ?? "-"}</td>
                                            <td>{s.crepeLatencyMs ?? "-"}</td>
                                            <td>{s.pyinMedianHz?.toFixed(1) ?? "-"}</td>
                                            <td>{s.pyinLatencyMs ?? "-"}</td>
                                            <td>{s.rmseCents?.toFixed(1) ?? "-"}</td>
                                            <td>{s.accuracy50c != null ? (s.accuracy50c * 100).toFixed(1) + "%" : "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* Stored audio samples from MinIO */}
                {storedSamples && storedSamples.length > 0 && (
                    <>
                        <h6 className="mt-4">
                            <i className="bi bi-cloud-arrow-down me-1" />
                            {t("lab.exp.storedSamples", "Stored Audio Samples")}
                        </h6>
                        <div className="table-responsive">
                            <table className="table table-sm table-bordered">
                                <thead>
                                    <tr>
                                        <th>{t("lab.batch.fileName", "File")}</th>
                                        <th>{t("lab.exp.fileSize", "Size")}</th>
                                        <th>{t("lab.exp.stored", "Stored")}</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {storedSamples.map((s, i) => (
                                        <tr key={i}>
                                            <td>{s.fileName}</td>
                                            <td>{s.fileSizeBytes > 0 ? `${(s.fileSizeBytes / 1024).toFixed(1)} KB` : "-"}</td>
                                            <td>
                                                {s.stored
                                                    ? <span className="badge bg-success"><i className="bi bi-check-circle me-1" />{t("lab.exp.yes", "Yes")}</span>
                                                    : <span className="badge bg-secondary">{t("lab.exp.no", "No")}</span>}
                                            </td>
                                            <td>
                                                {s.stored && (
                                                    <button className="btn btn-sm btn-outline-primary" onClick={() => handleDownloadSample(s.fileName)}>
                                                        <i className="bi bi-download me-1" />{t("lab.exp.download", "Download")}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {samplesLoading && <div className="spinner-border spinner-border-sm ms-2" />}
                    </>
                )}

                {detail.resultsJson && (
                    <details className="mt-3">
                        <summary className="text-muted">{t("lab.exp.rawJson", "Raw results JSON")}</summary>
                        <pre className="bg-dark text-light p-3 rounded mt-1" style={{ maxHeight: 400, overflow: "auto" }}>
                            {JSON.stringify(JSON.parse(detail.resultsJson), null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
};

export default LaboratoryPage;