// src/scripts/models/modelsAiAudio.ts

/* ========== Media Types ========== */
export const AUDIO_WAV = "audio/wav";
export const APP_ZIP = "application/zip";

/* ========== Transcribe ========== */
// POST /api/aiaudio/asr  (multipart: file + language?)
export interface TranscribeRequest {
    /** optional language hint, e.g., "pl", "en" */
    language?: string | null;
}

export interface TranscribeResponse {
    text: string;
    language?: string | null;
}

/* ========== TTS (generic + engines) ========== */
// POST /api/aiaudio/tts (JSON)
export interface SynthesizeRequest {
    text: string;
    voice: string; // default "default"
    rate?: number | null;
}

// POST /api/aiaudio/tts/coqui (JSON)
// POST /api/aiaudio/tts/opentts (JSON)
export interface TtsEngineRequest {
    text: string;
    voice: string; // default "default"
    rate?: number | null;
}

/* ========== Audio Analysis ========== */
// POST /api/aiaudio/analyze (multipart: file)
export interface AudioAnalysisResponse {
    durationSeconds: number;
    rms: number;
    tempoBpm?: number | null;
    pitchMedianHz?: number | null;
}

// POST /api/aiaudio/rhythm (multipart: file)
export interface RhythmResponse {
    tempoBpm: number;
    beatsSeconds: number[];
    onsetsSeconds: number[];
    durationSeconds: number;
}

// POST /api/aiaudio/pitch (multipart: file)
export interface PitchPoint {
    t: number;
    hz: number;
}
export interface PitchResponse {
    medianHz?: number | null;
    track: PitchPoint[];
    voicedMask: number[];
}

// POST /api/aiaudio/vad (multipart: file)
export interface VadSegment {
    start: number;
    end: number;
}

// POST /api/aiaudio/tags (multipart: file)
export interface MusicTag {
    tag: string;
    score: number;
}

/* ========== Separation (Demucs) ========== */
// POST /api/aiaudio/separate (multipart: file, query: stems)
export type SeparateZip = ArrayBuffer; // response: application/zip

/* ========== Singing score (offline + live) ========== */
// POST /api/aiaudio/score (multipart: vocal + reference)
export interface SingingOfflineScoreResponse {
    score: number;
    pitchTrackHz?: number[] | null;
}

// WS /api/aiaudio/score/live  (JSON frames)
export interface SingingLiveUpdate {
    instantScore?: number | null;
    partialText?: string | null;
}

/* ========== Singing Synthesis (SVS) ========== */
// POST /api/aiaudio/sing/diffsinger (multipart)
export type ScoreFormat = "midi" | "musicxml" | "ust" | string;

export interface DiffSingerRequest {
    score: File;               // required
    scoreFormat: ScoreFormat;  // default "midi"
    lyrics?: string;
    voice: string;             // default "default"
    transpose?: number | null;
    bpm?: number | null;
    language?: string | null;  // "en" | "ja" | "zh" | ...
}

// POST /api/aiaudio/sing/visinger (multipart)
export interface ViSingerRequest {
    score: File;               // required
    scoreFormat: ScoreFormat;  // default "midi"
    lyrics?: string;
    voice: string;             // default "default"
    transpose?: number | null;
    bpm?: number | null;
}

/* ========== Voice Conversion (SVC) ========== */
// POST /api/aiaudio/sing/convert/sovits (multipart)
export interface SoVitsConvertRequest {
    audio: File;               // required
    targetSinger: string;      // "speaker"
    key?: number | null;
    indexRate?: number | null;
    filterRadius?: number | null;
    rmsMixRate?: number | null;
    protect?: number | null;
}

// POST /api/aiaudio/sing/convert/rvc (multipart)
export interface RvcConvertRequest {
    audio: File;               // required
    targetSinger: string;
    key?: number | null;
    indexRate?: number | null;
    filterRadius?: number | null;
    rmsMixRate?: number | null;
    protect?: number | null;
}

/* ========== Text → Music / SFX ========== */
// POST /api/aiaudio/musicgen (JSON)
export interface MusicGenRequest {
    prompt: string;
    durationSec?: number | null;
    model?: string | null; // e.g., "small" | "medium" | "melody"
}

// POST /api/aiaudio/gen/riffusion (JSON)
export interface RiffusionRequest {
    prompt: string;
    durationSec?: number | null;
}

// POST /api/aiaudio/gen/audiocraft (JSON)
export interface AudioCraftRequest {
    prompt: string;
    durationSec?: number | null;
    model?: "musicgen" | "audiogen" | string | null; // default "musicgen"
}

// POST /api/aiaudio/gen/wavegan (JSON)
export interface WaveGanRequest {
    category: string;          // e.g., "drums", or checkpoint name
    durationSec?: number | null;
}

/* ========== Helpery do multipart/form-data ========== */
export function toFormDataTranscribe(file: File, req?: TranscribeRequest): FormData {
    const fd = new FormData();
    fd.append("file", file);
    if (req?.language) fd.append("language", req.language);
    return fd;
}

export function toFormDataAnalyze(file: File): FormData {
    const fd = new FormData();
    fd.append("file", file);
    return fd;
}

export function toFormDataVad(file: File, aggressiveness?: number): FormData {
    const fd = new FormData();
    fd.append("file", file);
    // aggressiveness jest query paramem, nie w form-data – dołącz go do URL-a.
    return fd;
}

export function toFormDataSeparate(file: File): FormData {
    const fd = new FormData();
    fd.append("file", file);
    return fd;
}

export function toFormDataDiffSinger(req: DiffSingerRequest): FormData {
    const fd = new FormData();
    fd.append("score", req.score);
    fd.append("scoreFormat", req.scoreFormat ?? "midi");
    fd.append("lyrics", req.lyrics ?? "");
    fd.append("voice", req.voice ?? "default");
    if (req.transpose != null) fd.append("transpose", String(req.transpose));
    if (req.bpm != null) fd.append("bpm", String(req.bpm));
    if (req.language) fd.append("language", req.language);
    return fd;
}

export function toFormDataViSinger(req: ViSingerRequest): FormData {
    const fd = new FormData();
    fd.append("score", req.score);
    fd.append("scoreFormat", req.scoreFormat ?? "midi");
    fd.append("lyrics", req.lyrics ?? "");
    fd.append("voice", req.voice ?? "default");
    if (req.transpose != null) fd.append("transpose", String(req.transpose));
    if (req.bpm != null) fd.append("bpm", String(req.bpm));
    return fd;
}

export function toFormDataSoVits(req: SoVitsConvertRequest): FormData {
    const fd = new FormData();
    fd.append("audio", req.audio);
    fd.append("targetSinger", req.targetSinger);
    if (req.key != null) fd.append("key", String(req.key));
    if (req.indexRate != null) fd.append("indexRate", String(req.indexRate));
    if (req.filterRadius != null) fd.append("filterRadius", String(req.filterRadius));
    if (req.rmsMixRate != null) fd.append("rmsMixRate", String(req.rmsMixRate));
    if (req.protect != null) fd.append("protect", String(req.protect));
    return fd;
}

export function toFormDataRvc(req: RvcConvertRequest): FormData {
    const fd = new FormData();
    fd.append("audio", req.audio);
    fd.append("targetSinger", req.targetSinger);
    if (req.key != null) fd.append("key", String(req.key));
    if (req.indexRate != null) fd.append("indexRate", String(req.indexRate));
    if (req.filterRadius != null) fd.append("filterRadius", String(req.filterRadius));
    if (req.rmsMixRate != null) fd.append("rmsMixRate", String(req.rmsMixRate));
    if (req.protect != null) fd.append("protect", String(req.protect));
    return fd;
}
