// liveScoreStreaming.ts — Live singing score WebSocket client.
// Extends BaseStreamClient: captures mic → resamples → 16 kHz s16le PCM → WS.
// Server responds with JSON { instantScore, partialText }.

import { BaseStreamClient } from "./BaseStreamClient";
import { logger } from "./logger";
const log = logger.scoped('LiveScoreStreaming');
import type { BaseStreamOptions } from "./BaseStreamClient";
import type { SingingLiveUpdate } from "../models/modelsAiAudio";

export interface LiveScoreMessage extends SingingLiveUpdate {
    error?: string;
}

export interface LiveScoreStreamOptions extends BaseStreamOptions {
    /** Called with each score update from the server */
    onScore?: (msg: LiveScoreMessage) => void;
    /** Called when max reconnection attempts exhausted */
    onFallback?: () => void;
}

export class LiveScoreStreamClient extends BaseStreamClient {
    private readonly scoreOpts: LiveScoreStreamOptions;

    constructor(opts: LiveScoreStreamOptions) {
        super({ ...opts, chunkMs: opts.chunkMs ?? 200 });
        this.scoreOpts = opts;
    }

    protected get tag(): string {
        return "LiveScoreStreamClient";
    }

    protected handleWsMessage(data: string): void {
        try {
            const obj = JSON.parse(data) as LiveScoreMessage;
            this.scoreOpts.onScore?.(obj);
        } catch (e) {
            this.scoreOpts.onScore?.({ error: String(e) });
        }
    }

    protected onMaxReconnect(): void {
        log.warn(`[${this.tag}] [${this.ts()}] triggering fallback`);
        this.stopAudioNodes();
        try { this.scoreOpts.onFallback?.(); } catch { /* Expected: user fallback callback may throw */ }
    }
}

/**
 * Start a live score streaming session.
 * Returns the client instance — call client.stop() to close.
 */
export async function startLiveScoreStream(opts: LiveScoreStreamOptions): Promise<LiveScoreStreamClient> {
    const client = new LiveScoreStreamClient(opts);
    await client.start();
    return client;
}

/**
 * Start live score using an existing MediaStream (e.g., mic already open).
 */
export async function startLiveScoreWithStream(
    stream: MediaStream,
    opts: LiveScoreStreamOptions,
): Promise<LiveScoreStreamClient> {
    const client = new LiveScoreStreamClient(opts);
    await client.startWithMediaStream(stream);
    return client;
}
