// BaseStreamClient.ts — Shared base class for WebSocket audio streaming clients.
// Extracts common logic from CrepeStreamClient and LibrosaStreamClient:
// - WebSocket lifecycle (connect, reconnect with exponential backoff, queue management)
// - Mic capture, resample to 16 kHz, encode s16le PCM
// - Chunk buffering and sending
// - AudioWorklet with ScriptProcessorNode fallback

// ── Shared DSP helpers ─────────────────────────────────────────────

import { logger } from './logger';

const log = logger.scoped('BaseStreamClient');

export function resampleLinear(src: Float32Array, srcRate: number, dstRate: number): Float32Array {
    if (srcRate === dstRate) return src.slice();
    const dstLength = Math.round((src.length * dstRate) / srcRate);
    const dst = new Float32Array(dstLength);
    const ratio = src.length / dstLength;
    for (let i = 0; i < dstLength; i++) {
        const pos = i * ratio;
        const i0 = Math.floor(pos);
        const i1 = Math.min(src.length - 1, i0 + 1);
        const t = pos - i0;
        dst[i] = src[i0] * (1 - t) + src[i1] * t;
    }
    return dst;
}

export function floatTo16BitPCM(float32: Float32Array): Int16Array {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
        const s = Math.max(-1, Math.min(1, float32[i]));
        out[i] = s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7fff);
    }
    return out;
}

// ── Base options (subclasses extend this) ──────────────────────────

export interface BaseStreamOptions {
    wsUrl: string;
    chunkMs?: number;
    onOpen?: () => void;
    onClose?: (ev?: CloseEvent) => void;
    onError?: (err: unknown) => void;
    onSend?: (bytes: number) => void;
    /** Called when the maximum number of reconnect attempts is exhausted (backend unavailable). */
    onMaxReconnect?: () => void;
}

// ── Subclass hook interface ────────────────────────────────────────

const TARGET_RATE = 16_000;
const DEFAULT_WORKLET_PATH = "/scripts/pitch-worklet.js";

/**
 * Abstract base for WebSocket audio streaming clients.
 * Handles mic capture → resample → chunk → WS send pipeline.
 *
 * Subclasses override:
 * - `get tag()` for log prefix
 * - `handleWsMessage()` for parsing response payloads
 * - `onMaxReconnect()` for fallback behavior (optional)
 * - `get useWorklet()` to opt-in to AudioWorklet (default: true)
 */
export abstract class BaseStreamClient {
    // WebSocket
    protected ws?: WebSocket;
    private sendQueue: ArrayBuffer[] = [];
    private maxQueue = 20;
    private reconnectTimer?: ReturnType<typeof setTimeout>;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;

    // Audio
    protected mediaStream?: MediaStream;
    protected audioCtx?: AudioContext;
    private workletNode?: AudioWorkletNode;
    private proc?: ScriptProcessorNode;
    private buffer: Float32Array = new Float32Array(0);
    private externalStream = false;
    private usingWorklet = false;

    // State
    protected closed = false;
    protected started = false;

    // Stats
    private chunksSent = 0;
    private chunksDropped = 0;
    private responsesReceived = 0;
    private lastStatusLog = 0;

    protected readonly opts: BaseStreamOptions;

    constructor(opts: BaseStreamOptions) {
        this.opts = opts;
    }

    // ── Abstract / overridable hooks ────────────────────────────────

    /** Log prefix, e.g. "CrepeStreamClient" */
    protected abstract get tag(): string;

    /** Handle parsed WS message. Subclass must call onMessage etc. */
    protected abstract handleWsMessage(data: string): void;

    /** Called when max reconnect attempts exhausted. Override for fallback logic. */
    protected onMaxReconnect(): void {
        try { this.opts.onMaxReconnect?.(); } catch { /* Expected: user callback may throw */ }
        this.stopAudioNodes();
    }

    /** Whether to try AudioWorklet before falling back to ScriptProcessor */
    protected get useWorklet(): boolean {
        return true;
    }

    /** Path to the AudioWorklet processor module */
    protected get workletPath(): string {
        return DEFAULT_WORKLET_PATH;
    }

    // ── Timestamp helper ────────────────────────────────────────────

    protected ts(): string {
        return new Date().toISOString().slice(11, 23);
    }

    // ── WebSocket lifecycle ─────────────────────────────────────────

    protected connectWs(): void {
        if (this.ws && this.ws.readyState !== WebSocket.CLOSING && this.ws.readyState !== WebSocket.CLOSED) return;
        console.info(`[${this.tag}] [${this.ts()}] connecting to ${this.opts.wsUrl}`);

        this.ws = new WebSocket(this.opts.wsUrl);
        this.ws.binaryType = "arraybuffer";

        this.ws.onopen = () => {
            try { this.opts.onOpen?.(); } catch { /* Expected: user onOpen callback may throw */ }
            this.reconnectAttempts = 0;
            this.chunksSent = 0;
            this.chunksDropped = 0;
            this.responsesReceived = 0;
            console.info(`[${this.tag}] [${this.ts()}] ws OPEN | worklet=${this.usingWorklet}`);

            // Flush queued chunks
            if (this.ws && this.ws.readyState === WebSocket.OPEN && this.sendQueue.length) {
                const count = this.sendQueue.length;
                try {
                    for (const buf of this.sendQueue) {
                        try {
                            this.ws.send(buf);
                            this.chunksSent++;
                            this.opts.onSend?.(buf.byteLength);
                        } catch (e) {
                            this.opts.onError?.(e);
                            break;
                        }
                    }
                } finally {
                    this.sendQueue = [];
                }
                console.info(`[${this.tag}] [${this.ts()}] flushed ${count} queued chunks`);
            }
        };

        this.ws.onclose = (ev) => {
            try { this.opts.onClose?.(ev); } catch { /* Expected: user onClose callback may throw */ }
            console.info(
                `[${this.tag}] [${this.ts()}] ws CLOSE code=${ev.code} clean=${ev.wasClean}` +
                ` | sent=${this.chunksSent} dropped=${this.chunksDropped} responses=${this.responsesReceived}`,
            );
            this.sendQueue = [];
            this.ws = undefined;

            if (!this.closed && this.started) {
                this.reconnectAttempts++;
                if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                    const delay = Math.min(300 * Math.pow(1.5, this.reconnectAttempts - 1), 5000);
                    console.info(`[${this.tag}] [${this.ts()}] auto-reconnect #${this.reconnectAttempts} in ${delay.toFixed(0)}ms`);
                    this.reconnectTimer = setTimeout(() => {
                        if (!this.closed) this.connectWs();
                    }, delay);
                } else {
                    log.warn(`[${this.tag}] [${this.ts()}] max reconnect attempts reached`);
                    this.onMaxReconnect();
                }
            } else {
                this.stopAudioNodes();
            }
        };

        this.ws.onerror = (ev) => {
            log.warn(`[${this.tag}] [${this.ts()}] ws ERROR`, ev);
            try { this.opts.onError?.(ev); } catch { /* Expected: user onError callback may throw */ }
        };

        this.ws.onmessage = (ev) => {
            this.responsesReceived++;
            try {
                const text = typeof ev.data === "string" ? ev.data : new TextDecoder().decode(ev.data as ArrayBuffer);
                this.handleWsMessage(text);
            } catch (e) {
                this.opts.onError?.(e);
            }
        };
    }

    // ── Audio frame processing ──────────────────────────────────────

    private handleAudioFrame(input: Float32Array): void {
        const tmp = new Float32Array(this.buffer.length + input.length);
        tmp.set(this.buffer, 0);
        tmp.set(input, this.buffer.length);
        this.buffer = tmp;

        const srcRate = this.audioCtx!.sampleRate;
        const chunkSamples = Math.round(((this.opts.chunkMs ?? 200) * TARGET_RATE) / 1000);
        const possibleTargetSamples = Math.floor((this.buffer.length * TARGET_RATE) / srcRate);
        const blocks = Math.floor(possibleTargetSamples / chunkSamples);
        if (blocks <= 0) return;

        const neededTargetSamples = blocks * chunkSamples;
        const takeSrcCount = Math.floor((neededTargetSamples * srcRate) / TARGET_RATE);
        const toSendSrc = this.buffer.slice(0, takeSrcCount);
        this.buffer = this.buffer.slice(takeSrcCount);

        const resampled = resampleLinear(toSendSrc, srcRate, TARGET_RATE);
        let offset = 0;
        while (offset + chunkSamples <= resampled.length) {
            const block = resampled.subarray(offset, offset + chunkSamples);
            const int16 = floatTo16BitPCM(block);
            const buf = int16.buffer as ArrayBuffer;
            const ws = this.ws;

            if (ws && ws.readyState === WebSocket.OPEN) {
                try {
                    ws.send(buf);
                    this.chunksSent++;
                    this.opts.onSend?.(buf.byteLength);
                } catch (e) {
                    this.opts.onError?.(e);
                }
            } else if (ws && ws.readyState === WebSocket.CONNECTING) {
                if (this.sendQueue.length < this.maxQueue) {
                    this.sendQueue.push(buf);
                    this.opts.onSend?.(0);
                }
            } else {
                this.chunksDropped++;
                this.opts.onSend?.(0);
            }

            // Periodic status log every 5 s
            const now = Date.now();
            if (now - this.lastStatusLog > 5000) {
                this.lastStatusLog = now;
                console.info(
                    `[${this.tag}] [${this.ts()}] STATUS: sent=${this.chunksSent} dropped=${this.chunksDropped}` +
                    ` responses=${this.responsesReceived} ws=${ws?.readyState ?? "none"} worklet=${this.usingWorklet}`,
                );
            }

            offset += chunkSamples;
        }

        // Put back leftover
        if (offset < resampled.length) {
            const leftover = resampled.subarray(offset);
            const back = resampleLinear(leftover, TARGET_RATE, srcRate);
            const tmp2 = new Float32Array(back.length + this.buffer.length);
            tmp2.set(back, 0);
            tmp2.set(this.buffer, back.length);
            this.buffer = tmp2;
        }
    }

    // ── Audio node setup ────────────────────────────────────────────

    private async setupAudioNodes(source: MediaStreamAudioSourceNode): Promise<void> {
        if (this.useWorklet) {
            try {
                await this.audioCtx!.audioWorklet.addModule(this.workletPath);
                const worklet = new AudioWorkletNode(this.audioCtx!, "pitch-processor");
                worklet.port.onmessage = (e: MessageEvent<Float32Array>) => {
                    this.handleAudioFrame(e.data);
                };
                source.connect(worklet);
                worklet.connect(this.audioCtx!.destination);
                this.workletNode = worklet;
                this.usingWorklet = true;
                console.info(`[${this.tag}] [${this.ts()}] using AudioWorklet (pitch-processor)`);
                return;
            } catch (err) {
                log.warn(`[${this.tag}] [${this.ts()}] AudioWorklet unavailable, falling back to ScriptProcessorNode`, err);
            }
        }

        // Fallback: ScriptProcessorNode
        const bufferSize = 4096;
        this.proc = this.audioCtx!.createScriptProcessor(bufferSize, 1, 1);
        source.connect(this.proc);
        this.proc.connect(this.audioCtx!.destination);
        this.proc.onaudioprocess = (e: AudioProcessingEvent) => {
            this.handleAudioFrame(e.inputBuffer.getChannelData(0));
        };
        this.usingWorklet = false;
        console.info(`[${this.tag}] [${this.ts()}] using ScriptProcessorNode fallback`);
    }

    protected stopAudioNodes(): void {
        try {
            if (this.workletNode) {
                this.workletNode.port.close();
                this.workletNode.disconnect();
                this.workletNode = undefined;
            }
        } catch { /* Expected: worklet/processor may already be disconnected during cleanup */ }
        try {
            if (this.proc) {
                this.proc.onaudioprocess = null;
                this.proc.disconnect();
                this.proc = undefined;
            }
        } catch { /* Expected: processor may already be disconnected during cleanup */ }
    }

    // ── Public API ──────────────────────────────────────────────────

    async start(): Promise<void> {
        if (this.closed) throw new Error("client closed");
        if (this.started) return;
        this.started = true;
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) this.connectWs();
        if (!this.mediaStream) this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioCtx = new AudioContext();
        const src = this.audioCtx.createMediaStreamSource(this.mediaStream);
        await this.setupAudioNodes(src);
    }

    async startWithMediaStream(stream: MediaStream): Promise<void> {
        if (this.closed) throw new Error("client closed");
        if (this.started) return;
        this.started = true;
        this.externalStream = true;
        if (!this.ws || this.ws.readyState === WebSocket.CLOSED) this.connectWs();
        this.mediaStream = stream;
        this.audioCtx = new AudioContext();
        const src = this.audioCtx.createMediaStreamSource(this.mediaStream);
        await this.setupAudioNodes(src);
    }

    stop(): void {
        console.info(`[${this.tag}] [${this.ts()}] stop() called | closed=${this.closed} started=${this.started} sent=${this.chunksSent} responses=${this.responsesReceived}`);
        this.closed = true;
        this.started = false;
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        this.stopAudioNodes();
        if (this.audioCtx && this.audioCtx.state !== 'closed') { this.audioCtx.close().catch(() => { /* Expected: AudioContext may already be closed */ }); }
        if (!this.externalStream) {
            try { this.mediaStream?.getTracks().forEach((t) => t.stop()); } catch { /* Expected: tracks may already be stopped */ }
        }
        try { this.ws?.close(); } catch { /* Expected: WebSocket may already be closed */ }
        this.ws = undefined;
        this.sendQueue = [];
    }
}
