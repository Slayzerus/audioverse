// src/scripts/apiLibraryAiAudio.ts
import { apiClient, apiPath } from "./libraryApiClient";
import {
    AUDIO_WAV,
    APP_ZIP,
    TranscribeRequest,
    TranscribeResponse,
    SynthesizeRequest,
    TtsEngineRequest,
    AudioAnalysisResponse,
    RhythmResponse,
    PitchResponse,
    VadSegment,
    MusicTag,
    SeparateZip,
    SingingOfflineScoreResponse,
    SingingLiveUpdate,
    DiffSingerRequest,
    ViSingerRequest,
    SoVitsConvertRequest,
    RvcConvertRequest,
    MusicGenRequest,
    RiffusionRequest,
    AudioCraftRequest,
    WaveGanRequest,
    toFormDataTranscribe,
    toFormDataAnalyze,
    toFormDataSeparate,
    toFormDataDiffSinger,
    toFormDataViSinger,
    toFormDataSoVits,
    toFormDataRvc,
} from "../../models/modelsAiAudio";

/** Baza ścieżek dla AI audio */
export const AI_BASE = "/api/aiAudio";

/* ============================================================================
   Low-level API (fetchers)
   ========================================================================== */

/* ---- ASR (file) --------------------------------------------------------- */
export const postTranscribe = async (
    file: File,
    req?: TranscribeRequest
): Promise<TranscribeResponse> => {
    const { data } = await apiClient.post<TranscribeResponse>(
        apiPath(AI_BASE, "/asr"),
        toFormDataTranscribe(file, req)
    );
    return data;
};

/* ---- ASR (stream - WebSocket) ------------------------------------------ */
/** Zwraca absolutny URL do WS: /api/aiAudio/asr/stream */
export const getAsrStreamWsUrl = (): string => {
    const loc = window.location;
    const proto = loc.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${loc.host}${apiPath(AI_BASE, "/asr/stream")}`;
};

/* ---- TTS (Piper – ogólny) ---------------------------------------------- */
export const postTts = async (body: SynthesizeRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/tts"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

/* ---- TTS (Coqui / OpenTTS) --------------------------------------------- */
export const postTtsCoqui = async (body: TtsEngineRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/tts/coqui"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

export const postTtsOpenTts = async (body: TtsEngineRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/tts/opentts"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

/* ---- ANALYZE ------------------------------------------------------------ */
export const postAnalyze = async (file: File): Promise<AudioAnalysisResponse> => {
    const { data } = await apiClient.post<AudioAnalysisResponse>(
        apiPath(AI_BASE, "/analyze"),
        toFormDataAnalyze(file)
    );
    return data;
};

export const postRhythm = async (file: File): Promise<RhythmResponse> => {
    const { data } = await apiClient.post<RhythmResponse>(
        apiPath(AI_BASE, "/rhythm"),
        toFormDataAnalyze(file)
    );
    return data;
};

export const postPitch = async (file: File): Promise<PitchResponse> => {
    const { data } = await apiClient.post<PitchResponse>(
        apiPath(AI_BASE, "/pitch"),
        toFormDataAnalyze(file)
    );
    return data;
};

/** VAD – `aggressiveness` to **query param** */
export const postVad = async (file: File, aggressiveness = 2): Promise<VadSegment[]> => {
    const { data } = await apiClient.post<VadSegment[]>(
        apiPath(AI_BASE, `/vad?aggressiveness=${encodeURIComponent(aggressiveness)}`),
        toFormDataAnalyze(file)
    );
    return Array.isArray(data) ? data : [];
};

/* ---- SEPARATION (Demucs) – ZIP ----------------------------------------- */
export const postSeparate = async (file: File, stems = 2): Promise<SeparateZip> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, `/separate?stems=${encodeURIComponent(stems)}`),
        toFormDataSeparate(file),
        { responseType: "arraybuffer" }
    );
    return data;
};

/* ---- TAGS --------------------------------------------------------------- */
export const postTags = async (file: File): Promise<MusicTag[]> => {
    const { data } = await apiClient.post<MusicTag[]>(
        apiPath(AI_BASE, "/tags"),
        toFormDataAnalyze(file)
    );
    return data ?? [];
};

/* ---- SINGING (offline score) ------------------------------------------- */
export const postSingingScore = async (
    vocal: File,
    reference: File
): Promise<SingingOfflineScoreResponse> => {
    const fd = new FormData();
    fd.append("vocal", vocal);
    fd.append("reference", reference);
    const { data } = await apiClient.post<SingingOfflineScoreResponse>(
        apiPath(AI_BASE, "/score"),
        fd
    );
    return data;
};

/* ---- SINGING (live WS) ------------------------------------------------- */
export const getSingingScoreLiveWsUrl = (): string => {
    const loc = window.location;
    const proto = loc.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${loc.host}${apiPath(AI_BASE, "/score/live")}`;
};
// Ramki jakie dostajesz po WS: JSON -> SingingLiveUpdate
export type SingingScoreLiveFrame = SingingLiveUpdate;

/* ---- SVS: DiffSinger / ViSinger (multipart) ---------------------------- */
export const postDiffSinger = async (req: DiffSingerRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/sing/diffsinger"),
        toFormDataDiffSinger(req),
        { responseType: "arraybuffer" }
    );
    return data;
};

export const postViSinger = async (req: ViSingerRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/sing/visinger"),
        toFormDataViSinger(req),
        { responseType: "arraybuffer" }
    );
    return data;
};

/* ---- SVC: So-VITS / RVC (multipart) ----------------------------------- */
export const postSoVits = async (req: SoVitsConvertRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/sing/convert/sovits"),
        toFormDataSoVits(req),
        { responseType: "arraybuffer" }
    );
    return data;
};

export const postRvc = async (req: RvcConvertRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/sing/convert/rvc"),
        toFormDataRvc(req),
        { responseType: "arraybuffer" }
    );
    return data;
};

/* ---- Text → Music / SFX ----------------------------------------------- */
export const postMusicGen = async (body: MusicGenRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/musicgen"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

export const postRiffusion = async (body: RiffusionRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/gen/riffusion"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

export const postAudioCraft = async (body: AudioCraftRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/gen/audiocraft"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

export const postWaveGan = async (body: WaveGanRequest): Promise<ArrayBuffer> => {
    const { data } = await apiClient.post<ArrayBuffer>(
        apiPath(AI_BASE, "/gen/wavegan"),
        body,
        { responseType: "arraybuffer", headers: { "Content-Type": "application/json" } }
    );
    return data;
};

/* ============================================================================
   Typy MIME „dla wygody” — do odtwarzania i pobierania
   ========================================================================== */
export const Mime = {
    wav: AUDIO_WAV,
    zip: APP_ZIP,
};

/* ============================================================================
   (Opcjonalnie) Helpery UI
   ========================================================================== */
/** Tworzy URL do pobrania z ArrayBuffer (WAV/ZIP). Nie zapominać o URL.revokeObjectURL. */
export const bufferToBlobUrl = (buf: ArrayBuffer, mime = AUDIO_WAV): string => {
    const blob = new Blob([buf], { type: mime });
    return URL.createObjectURL(blob);
};
