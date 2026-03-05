// Frontend Librosa streaming client
// Sends mic audio to a backend librosa pitch detection WebSocket.
// Refactored to extend BaseStreamClient — all shared WS/audio logic is inherited.

import { BaseStreamClient } from "./BaseStreamClient";
import type { BaseStreamOptions } from "./BaseStreamClient";

export type LibrosaMessage = { hz?: number; confidence?: number; error?: string; [k: string]: unknown };

export type LibrosaStreamOptions = BaseStreamOptions & {
  onMessage?: (msg: LibrosaMessage) => void;
};

export class LibrosaStreamClient extends BaseStreamClient {
  private readonly librosaOpts: LibrosaStreamOptions;

  constructor(opts: LibrosaStreamOptions) {
    super({ ...opts, chunkMs: opts.chunkMs ?? 100 });
    this.librosaOpts = opts;
  }

  protected get tag(): string {
    return "LibrosaStreamClient";
  }

  protected handleWsMessage(data: string): void {
    const obj = JSON.parse(data) as LibrosaMessage;
    this.librosaOpts.onMessage?.(obj);
  }

  // LibrosaStreamClient does not use AudioWorklet — ScriptProcessorNode only
  protected get useWorklet(): boolean {
    return false;
  }
}

export async function startLibrosaMicStream(opts: LibrosaStreamOptions) {
  const client = new LibrosaStreamClient(opts);
  await client.start();
  return client;
}
