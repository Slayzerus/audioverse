// Frontend Crepe streaming client
// Sends mic audio to a backend CREPE pitch detection WebSocket.
// Uses AudioWorklet when available, falls back to ScriptProcessorNode.
// Refactored to extend BaseStreamClient — all shared WS/audio logic is inherited.

import { BaseStreamClient } from "./BaseStreamClient";
import type { BaseStreamOptions } from "./BaseStreamClient";
import { logger } from "./logger";
const log = logger.scoped('CrepeStreaming');

export type CrepeMessage = { hz?: number; confidence?: number; error?: string; [k: string]: unknown };

export type CrepeStreamOptions = BaseStreamOptions & {
  onMessage?: (msg: CrepeMessage) => void;
  /** Called when WS exhausts all reconnect attempts — caller can fall back to local pitch detection */
  onFallback?: () => void;
};

export class CrepeStreamClient extends BaseStreamClient {
  private readonly crepeOpts: CrepeStreamOptions;

  constructor(opts: CrepeStreamOptions) {
    super({ ...opts, chunkMs: opts.chunkMs ?? 200 });
    this.crepeOpts = opts;
  }

  protected get tag(): string {
    return "CrepeStreamClient";
  }

  protected handleWsMessage(data: string): void {
    const obj = JSON.parse(data) as CrepeMessage;
    this.crepeOpts.onMessage?.(obj);
  }

  protected onMaxReconnect(): void {
    log.warn(`[${this.tag}] [${this.ts()}] triggering fallback`);
    this.stopAudioNodes();
    try { this.crepeOpts.onFallback?.(); } catch { /* Expected: user fallback callback may throw */ }
  }
}

export async function startCrepeMicStream(opts: CrepeStreamOptions) {
  const client = new CrepeStreamClient(opts);
  await client.start();
  return client;
}
