/**
 * apiLab.ts — API client for the Laboratory module (/api/karaoke/lab).
 *
 * Provides low-level fetchers and React Query hooks for all 12 lab endpoints.
 * File-upload endpoints use multipart/form-data via FormData.
 */
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    PitchResult,
    PitchCompareResponse,
    SeparationEffectResponse,
    DtwScoreResponse,
    BatchPitchResponse,
    HealthResponse,
    BenchmarkResponse,
    ExperimentSummary,
    ExperimentDetail,
    ExperimentStoredSample,
    SampleDownloadUrl,
} from "../../models/modelsLab";

// ── Base paths ──
const LAB_BASE = "/api/karaoke/lab";
const AI_AUDIO_BASE = "/api/ai/audio";

// ── Query keys ──
export const LAB_QK = {
    all: ["lab"] as const,
    health: () => [...LAB_QK.all, "health"] as const,
    experiments: (take?: number) => [...LAB_QK.all, "experiments", take] as const,
    experiment: (guid: string) => [...LAB_QK.all, "experiment", guid] as const,
    samples: (guid: string) => [...LAB_QK.all, "samples", guid] as const,
};

// ── Helper: build FormData with a single file ──
function singleFileForm(file: File, fieldName = "file"): FormData {
    const fd = new FormData();
    fd.append(fieldName, file);
    return fd;
}

// ═══════════════════════════════════════════════════
//  1. GET /health
// ═══════════════════════════════════════════════════
export const fetchLabHealth = async (): Promise<HealthResponse> => {
    const { data } = await apiClient.get<HealthResponse>(apiPath(LAB_BASE, "health"));
    return data;
};

export const useLabHealthQuery = () =>
    useQuery({
        queryKey: LAB_QK.health(),
        queryFn: fetchLabHealth,
        staleTime: 30_000,
    });

// ═══════════════════════════════════════════════════
//  2. POST /api/ai/audio/pitch  (CREPE – production endpoint)
// ═══════════════════════════════════════════════════
export const fetchPitchCrepe = async (file: File): Promise<PitchResult> => {
    const { data } = await apiClient.post<PitchResult>(
        apiPath(AI_AUDIO_BASE, "pitch"),
        singleFileForm(file, "audio"),
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const usePitchCrepeMutation = () =>
    useMutation({ mutationFn: fetchPitchCrepe });

// ═══════════════════════════════════════════════════
//  3. POST /pitch/pyin
// ═══════════════════════════════════════════════════
export const fetchPitchPyin = async (file: File): Promise<PitchResult> => {
    const { data } = await apiClient.post<PitchResult>(
        apiPath(LAB_BASE, "pitch/pyin"),
        singleFileForm(file),
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const usePitchPyinMutation = () =>
    useMutation({ mutationFn: fetchPitchPyin });

// ═══════════════════════════════════════════════════
//  4. POST /pitch/compare
// ═══════════════════════════════════════════════════
export const fetchPitchCompare = async (file: File): Promise<PitchCompareResponse> => {
    const { data } = await apiClient.post<PitchCompareResponse>(
        apiPath(LAB_BASE, "pitch/compare"),
        singleFileForm(file),
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const usePitchCompareMutation = () =>
    useMutation({ mutationFn: fetchPitchCompare });

// ═══════════════════════════════════════════════════
//  5. POST /pitch/separation-effect
// ═══════════════════════════════════════════════════
export const fetchSeparationEffect = async (file: File): Promise<SeparationEffectResponse> => {
    const { data } = await apiClient.post<SeparationEffectResponse>(
        apiPath(LAB_BASE, "pitch/separation-effect"),
        singleFileForm(file),
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const useSeparationEffectMutation = () =>
    useMutation({ mutationFn: fetchSeparationEffect });

// ═══════════════════════════════════════════════════
//  6. POST /api/ai/audio/score  (DTW – production endpoint)
// ═══════════════════════════════════════════════════
export const fetchDtwScore = async (vocal: File, reference: File): Promise<DtwScoreResponse> => {
    const fd = new FormData();
    fd.append("vocal", vocal);
    fd.append("reference", reference);
    const { data } = await apiClient.post<DtwScoreResponse>(
        apiPath(AI_AUDIO_BASE, "score"),
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const useDtwScoreMutation = () =>
    useMutation({ mutationFn: ({ vocal, reference }: { vocal: File; reference: File }) => fetchDtwScore(vocal, reference) });

// ═══════════════════════════════════════════════════
//  7. POST /batch/pitch
// ═══════════════════════════════════════════════════
export const fetchBatchPitch = async (files: File[]): Promise<BatchPitchResponse> => {
    const fd = new FormData();
    files.forEach(f => fd.append("files", f));
    const { data } = await apiClient.post<BatchPitchResponse>(
        apiPath(LAB_BASE, "batch/pitch"),
        fd,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const useBatchPitchMutation = () =>
    useMutation({ mutationFn: fetchBatchPitch });

// ═══════════════════════════════════════════════════
//  8. POST /benchmark/latency
// ═══════════════════════════════════════════════════
export const fetchBenchmarkLatency = async (file: File, runs = 5): Promise<BenchmarkResponse> => {
    const { data } = await apiClient.post<BenchmarkResponse>(
        apiPath(LAB_BASE, `benchmark/latency?runs=${runs}`),
        singleFileForm(file),
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data;
};

export const useBenchmarkLatencyMutation = () =>
    useMutation({
        mutationFn: ({ file, runs }: { file: File; runs?: number }) =>
            fetchBenchmarkLatency(file, runs),
    });

// ═══════════════════════════════════════════════════
//  9. POST /report/pdf
// ═══════════════════════════════════════════════════
export interface ReportPdfParams {
    audioFiles: File[];
    vocalFile?: File;
    referenceFile?: File;
    reportTitle?: string;
    operatorName?: string;
    benchmarkRuns?: number;
}

export const fetchReportPdf = async (params: ReportPdfParams): Promise<Blob> => {
    const fd = new FormData();
    params.audioFiles.forEach(f => fd.append("audioFiles", f));
    if (params.vocalFile) fd.append("vocalFile", params.vocalFile);
    if (params.referenceFile) fd.append("referenceFile", params.referenceFile);
    if (params.reportTitle) fd.append("reportTitle", params.reportTitle);
    if (params.operatorName) fd.append("operatorName", params.operatorName);
    if (params.benchmarkRuns != null) fd.append("benchmarkRuns", String(params.benchmarkRuns));

    const { data } = await apiClient.post(
        apiPath(LAB_BASE, "report/pdf"),
        fd,
        {
            headers: { "Content-Type": "multipart/form-data" },
            responseType: "blob",
        },
    );
    return data as Blob;
};

export const useReportPdfMutation = () =>
    useMutation({ mutationFn: fetchReportPdf });

// ═══════════════════════════════════════════════════
//  10. GET /experiments?take=N
// ═══════════════════════════════════════════════════
export const fetchExperiments = async (take = 20): Promise<ExperimentSummary[]> => {
    const { data } = await apiClient.get<ExperimentSummary[]>(
        apiPath(LAB_BASE, `experiments?take=${take}`),
    );
    return data;
};

export const useExperimentsQuery = (take = 20) =>
    useQuery({
        queryKey: LAB_QK.experiments(take),
        queryFn: () => fetchExperiments(take),
        staleTime: 60_000,
    });

// ═══════════════════════════════════════════════════
//  11. GET /experiments/{guid}
// ═══════════════════════════════════════════════════
export const fetchExperimentDetail = async (guid: string): Promise<ExperimentDetail> => {
    const { data } = await apiClient.get<ExperimentDetail>(
        apiPath(LAB_BASE, `experiments/${guid}`),
    );
    return data;
};

export const useExperimentDetailQuery = (guid: string) =>
    useQuery({
        queryKey: LAB_QK.experiment(guid),
        queryFn: () => fetchExperimentDetail(guid),
        enabled: !!guid,
    });

// ═══════════════════════════════════════════════════
//  12. GET /experiments/{guid}/pdf
// ═══════════════════════════════════════════════════
export const fetchExperimentPdf = async (guid: string): Promise<Blob> => {
    const { data } = await apiClient.get(
        apiPath(LAB_BASE, `experiments/${guid}/pdf`),
        { responseType: "blob" },
    );
    return data as Blob;
};

export const useExperimentPdfMutation = () =>
    useMutation({ mutationFn: fetchExperimentPdf });

// ═══════════════════════════════════════════════════
//  13. GET /experiments/{guid}/samples
// ═══════════════════════════════════════════════════
export const fetchExperimentSamples = async (guid: string): Promise<ExperimentStoredSample[]> => {
    const { data } = await apiClient.get<ExperimentStoredSample[]>(
        apiPath(LAB_BASE, `experiments/${guid}/samples`),
    );
    return data;
};

export const useExperimentSamplesQuery = (guid: string) =>
    useQuery({
        queryKey: LAB_QK.samples(guid),
        queryFn: () => fetchExperimentSamples(guid),
        enabled: !!guid,
    });

// ═══════════════════════════════════════════════════
//  14. GET /experiments/{guid}/samples/{fileName}
// ═══════════════════════════════════════════════════
export const fetchSampleDownloadUrl = async (guid: string, fileName: string): Promise<SampleDownloadUrl> => {
    const { data } = await apiClient.get<SampleDownloadUrl>(
        apiPath(LAB_BASE, `experiments/${guid}/samples/${encodeURIComponent(fileName)}`),
    );
    return data;
};
