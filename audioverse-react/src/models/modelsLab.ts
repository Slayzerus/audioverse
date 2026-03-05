/**
 * modelsLab.ts — TypeScript models for the Laboratory module (/api/karaoke/lab).
 *
 * Matches the C# DTOs and JSON responses from LaboratoryController.
 */

// ── Pitch Track ──

export interface PitchTrackPoint {
    t: number;
    hz: number;
}

export interface PitchResult {
    algorithm: 'CREPE' | 'pYIN';
    latencyMs: number;
    medianHz: number;
    noteName: string;
    frameCount: number;
    track: PitchTrackPoint[];
}

// ── Comparison Metrics ──

export interface ComparisonMetrics {
    rmseHz: number;
    rmseCents: number;
    accuracy50c: number;
    pearsonR: number;
    comparedFrames: number;
}

// ── Endpoint Responses ──

export interface PitchCompareResponse {
    crepe: PitchResult;
    pyin: PitchResult;
    comparison: ComparisonMetrics;
}

export interface SeparationEffectResponse {
    original: {
        latencyMs: number;
        medianHz: number;
        frameCount: number;
    };
    separation: {
        latencyMs: number;
        error: string | null;
    };
    afterSeparation: {
        latencyMs: number;
        medianHz: number;
        frameCount: number;
    };
    comparison: ComparisonMetrics;
}

export interface DtwScoreResponse {
    latencyMs: number;
    score: number;
    pitchAccuracy: number;
    rhythmAccuracy: number;
}

export interface BatchPitchRow {
    fileName: string;
    medianHz?: number;
    noteName?: string;
    voicedFrames?: number;
    totalFrames?: number;
    voicedRatio?: number;
    latencyMs?: number;
    error?: string;
}

export interface BatchPitchResponse {
    count: number;
    rows: BatchPitchRow[];
}

// ── Health ──
// Backend returns Dictionary<string, string> — key = service name, value = status text.
export type HealthResponse = Record<string, string>;

// ── Benchmark ──

export interface BenchmarkRow {
    serviceName: string;
    avgMs: number;
    minMs: number;
    maxMs: number;
    stdDevMs: number;
}

export interface BenchmarkResponse {
    runs: number;
    fileSizeKb: number;
    results: BenchmarkRow[];
}

// ── Experiments (History) ──

export interface ExperimentSummary {
    id: number;
    experimentGuid: string;
    title: string;
    operator: string;
    executedAt: string;
    fileCount: number;
    crepeAvgRmseCents: number | null;
    pyinAvgRmseCents: number | null;
    dtwScore: number | null;
}

export interface ExperimentDetail extends ExperimentSummary {
    benchmarkRuns: number;
    resultsJson: string;
    notes: string | null;
    samples: ExperimentSample[];
}

export interface ExperimentSample {
    id: number;
    fileName: string;
    crepeMedianHz: number | null;
    crepeLatencyMs: number | null;
    pyinMedianHz: number | null;
    pyinLatencyMs: number | null;
    rmseHz: number | null;
    rmseCents: number | null;
    accuracy50c: number | null;
    pearsonR: number | null;
    separationLatencyMs: number | null;
    separationRmseHz: number | null;
    separationRmseCents: number | null;
}

// ── Stored Audio Samples (MinIO) ──

export interface ExperimentStoredSample {
    fileName: string;
    fileSizeBytes: number;
    stored: boolean;
    storagePath: string | null;
}

export interface SampleDownloadUrl {
    downloadUrl: string;
    expiresInMinutes: number;
}
