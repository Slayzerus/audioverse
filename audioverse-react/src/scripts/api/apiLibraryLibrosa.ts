import { apiClient, apiPath, LIBRARY_BASE } from "./audioverseApiClient";
import { logger } from "../../utils/logger";
const log = logger.scoped('apiLibraryLibrosa');
import {
  LibrosaAnalyzeResponse,
  LibrosaTempoResponse,
  LibrosaOnsetsResponse,
  LibrosaBeatTrackResponse,
  LibrosaChromagramResponse,
  LibrosaMfccResponse,
  LibrosaSpectralCentroidResponse,
  LibrosaHpssResponse,
  LibrosaMelSpectrogramResponse,
  LibrosaPitchTrackResponse,
  LibrosaPitchPoint,
} from "../../models/modelsLibrosa";

// Utilities
const LIBROSA_BASE = `${LIBRARY_BASE}/librosa`;

function toFormDataFile(file: File, extra?: Record<string, string | number | boolean>) {
  const fd = new FormData();
  fd.append("file", file);
  try { fd.append("File", file); } catch (_e) { /* Expected: duplicate FormData key may fail in some environments */ }
  if (extra) {
    Object.keys(extra).forEach((k) => {
      const v = extra[k];
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
  }
  return fd;
}

/** @internal Generic analyze endpoint */
export const postLibrosaAnalyze = async (file: File): Promise<LibrosaAnalyzeResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/analyze"), toFormDataFile(file));
  const res: LibrosaAnalyzeResponse = {
    durationSeconds: typeof data?.durationSeconds === "number" ? data.durationSeconds : undefined,
    rms: typeof data?.rms === "number" ? data.rms : undefined,
    tempoBpm: typeof data?.tempoBpm === "number" ? data.tempoBpm : (typeof data?.tempo === "number" ? data.tempo : null),
    pitchMedianHz: typeof data?.pitchMedianHz === "number" ? data.pitchMedianHz : null,
  };
  return res;
};

function ensureNumberArray(v: unknown): number[] | null {
  if (!Array.isArray(v)) return null;
  const arr = v.map((x) => (typeof x === "number" ? x : Number(x))).filter((n) => !Number.isNaN(n));
  return arr.length ? arr : null;
}

/** @internal */
export const postLibrosaTempo = async (file: File): Promise<LibrosaTempoResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/tempo"), toFormDataFile(file));
  const res: LibrosaTempoResponse = {
    tempoBpm: typeof data?.tempoBpm === "number" ? data.tempoBpm : (typeof data?.tempo === "number" ? data.tempo : 0),
    beatsSeconds: ensureNumberArray(data?.beatsSeconds ?? data?.beats ?? null),
    onsetsSeconds: ensureNumberArray(data?.onsetsSeconds ?? null),
    durationSeconds: typeof data?.durationSeconds === "number" ? data.durationSeconds : undefined,
  };
  return res;
};

/** @internal */
export const postLibrosaOnsets = async (file: File): Promise<LibrosaOnsetsResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/onsets"), toFormDataFile(file));
  const res: LibrosaOnsetsResponse = {
    tempoBpm: typeof data?.tempoBpm === "number" ? data.tempoBpm : undefined,
    beatsSeconds: ensureNumberArray(data?.beatsSeconds ?? null),
    onsetsSeconds: ensureNumberArray(data?.onsetsSeconds ?? data?.onsets ?? null),
    durationSeconds: typeof data?.durationSeconds === "number" ? data.durationSeconds : undefined,
  };
  return res;
};

/** @internal */
export const postLibrosaBeatTrack = async (file: File): Promise<LibrosaBeatTrackResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/beat-track"), toFormDataFile(file));
  const res: LibrosaBeatTrackResponse = {
    tempoBpm: typeof data?.tempoBpm === "number" ? data.tempoBpm : undefined,
    beatsSeconds: ensureNumberArray(data?.beatsSeconds ?? data?.beats ?? null),
  };
  return res;
};

/** @internal */
export const postLibrosaChromagram = async (file: File): Promise<LibrosaChromagramResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/chromagram"), toFormDataFile(file));
  const chroma = Array.isArray(data?.chromagram) ? (data.chromagram as unknown[]).map((r: unknown) => Array.isArray(r) ? r.map((n: unknown) => Number(n)) : []) : null;
  return { chromagram: chroma } as LibrosaChromagramResponse;
};

/** @internal */
export const postLibrosaMfcc = async (file: File, n_mfcc = 13): Promise<LibrosaMfccResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/mfcc"), toFormDataFile(file, { n_mfcc }));
  const mfcc = Array.isArray(data?.mfcc) ? (data.mfcc as unknown[]).map((r: unknown) => Array.isArray(r) ? r.map((n: unknown) => Number(n)) : []) : null;
  return { mfcc } as LibrosaMfccResponse;
};

/** @internal */
export const postLibrosaSpectralCentroid = async (file: File): Promise<LibrosaSpectralCentroidResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/spectral-centroid"), toFormDataFile(file));
  const centroid = ensureNumberArray(data?.spectralCentroid ?? data?.centroid ?? null);
  return { spectralCentroid: centroid } as LibrosaSpectralCentroidResponse;
};

/** @internal */
export const postLibrosaHpss = async (file: File): Promise<LibrosaHpssResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/hpss"), toFormDataFile(file));
  const harmonic = ensureNumberArray(data?.harmonic ?? null);
  const percussive = ensureNumberArray(data?.percussive ?? null);
  return { harmonic, percussive } as LibrosaHpssResponse;
};

/** @internal */
export const postLibrosaMelSpectrogram = async (file: File): Promise<LibrosaMelSpectrogramResponse> => {
  const { data } = await apiClient.post<Record<string, unknown>>(apiPath(LIBROSA_BASE, "/mel-spectrogram"), toFormDataFile(file));
  const mel = Array.isArray(data?.mel) ? (data.mel as unknown[]).map((r: unknown) => Array.isArray(r) ? r.map((n: unknown) => Number(n)) : []) : null;
  return { mel } as LibrosaMelSpectrogramResponse;
};

/** @internal */
export const postLibrosaPitchTrack = async (file: File): Promise<LibrosaPitchTrackResponse> => {
  // Try several candidate endpoints to handle possible backend route differences or proxies.
  // Prefer the canonical backend controller path `/api/librosa/pyin` (POST) which proxies to the librosa service.
  const candidates = [
    "/api/librosa/pyin",
    apiPath(LIBROSA_BASE, "/pyin"),
    apiPath(LIBRARY_BASE, "/librosa/pyin"),
    apiPath(LIBROSA_BASE, "/pitch-track"),
    apiPath(LIBRARY_BASE, "/librosa/pitch-track"),
    "/api/librosa/pitch-track",
    "/api/librosa/pitch_track",
    apiPath(LIBROSA_BASE, "/pitch_track"),
    apiPath(LIBROSA_BASE, "/pitchtrack"),
  ];

  const attempted: string[] = [];
  let lastErr: unknown = null;

  for (const url of candidates) {
    try {
      attempted.push(url);
      const { data } = await apiClient.post<{ track?: Record<string, unknown>[]; medianHz?: number; voicedMask?: number[] | null }>(url, toFormDataFile(file));
      const rawTrack: Record<string, unknown>[] | null = Array.isArray(data?.track) ? data.track : null;
      const track: LibrosaPitchPoint[] | null = rawTrack ? rawTrack.map((p) => ({ t: Number(p?.t ?? p?.time ?? 0), hz: Number(p?.hz ?? p?.frequency ?? 0) })) : null;
      const medianHz = typeof data?.medianHz === "number" ? data.medianHz : null;
      const voicedMask = ensureNumberArray(data?.voicedMask ?? null);
      return { medianHz, track, voicedMask } as LibrosaPitchTrackResponse;
    } catch (e: unknown) {
      lastErr = e;
      // If 404, try next candidate; for other statuses, still collect and continue but record.
      const status = typeof e === 'object' && e !== null && 'response' in e ? ((e as Record<string, unknown>).response as Record<string, unknown> | undefined)?.status as number | undefined : undefined;
      if (status && status !== 404) {
        // Non-404 — still continue trying other candidates but keep lastErr
        log.warn(`attempt ${url} failed with status ${status}`);
      }
      // otherwise for 404 just continue trying
    }
  }

  // All candidates failed — attach attempted URLs to error for easier debugging.
  const err = (lastErr instanceof Error ? lastErr : new Error(String(lastErr ?? "Librosa request failed"))) as Error & { attemptedUrls?: string[] };
  try { err.attemptedUrls = attempted; } catch { /* Best-effort — no action needed on failure */ }
  throw err;
};

// WebSocket path exposed by the backend proxy controller for live pyin streaming
export const LIBROSA_PYIN_WS = "/api/librosa/ws/pyin";

export const LIBROSA_API_BASE = LIBROSA_BASE;

export default {
  postLibrosaAnalyze,
  postLibrosaTempo,
  postLibrosaOnsets,
  postLibrosaBeatTrack,
  postLibrosaChromagram,
  postLibrosaMfcc,
  postLibrosaSpectralCentroid,
  postLibrosaHpss,
  postLibrosaMelSpectrogram,
  postLibrosaPitchTrack,
};
