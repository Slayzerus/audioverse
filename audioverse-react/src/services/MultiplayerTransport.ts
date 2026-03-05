// MultiplayerTransport.ts — Shared transport abstraction for multiplayer communication.
// Provides a unified interface so game code doesn't care whether the
// backend is SignalR, raw WebSocket, local EventEmitter, or offline queue.

// ══════════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════════

export type TransportState = "disconnected" | "connecting" | "connected" | "reconnecting";
import { logger } from '../utils/logger';
const log = logger.scoped('MultiplayerTransport');

export interface TransportMessage {
    type: string;
    payload: Record<string, unknown>;
    timestamp: number;
    senderId?: string;
}

export type TransportListener = (msg: TransportMessage) => void;

// ══════════════════════════════════════════════════════════════
// Interface
// ══════════════════════════════════════════════════════════════

/**
 * Abstract transport contract — implemented by each backend:
 * - `SignalRTransport` — wraps existing rtcService
 * - `WebSocketTransport` — raw WS for game multiplayer
 * - `LocalTransport` — in-memory EventEmitter for local/couch co-op
 * - `OfflineTransport` — queues events to localStorage/IndexedDB
 */
export interface IMultiplayerTransport {
    readonly state: TransportState;
    connect(url?: string): Promise<void>;
    disconnect(): void;
    send(type: string, payload: Record<string, unknown>): void;
    on(type: string, listener: TransportListener): void;
    off(type: string, listener: TransportListener): void;
    onStateChange(listener: (state: TransportState) => void): void;
}

// ══════════════════════════════════════════════════════════════
// LocalTransport — in-memory event bus (no network needed)
// ══════════════════════════════════════════════════════════════

export class LocalTransport implements IMultiplayerTransport {
    private listeners = new Map<string, Set<TransportListener>>();
    private stateListeners = new Set<(state: TransportState) => void>();
    private _state: TransportState = "disconnected";

    get state(): TransportState {
        return this._state;
    }

    private setState(s: TransportState) {
        this._state = s;
        this.stateListeners.forEach((l) => l(s));
    }

    async connect(): Promise<void> {
        this.setState("connecting");
        // Local transport is instant
        this.setState("connected");
    }

    disconnect(): void {
        this.setState("disconnected");
    }

    send(type: string, payload: Record<string, unknown>): void {
        const msg: TransportMessage = { type, payload, timestamp: Date.now(), senderId: "local" };
        // Immediately dispatch to listeners (synchronous local bus)
        const set = this.listeners.get(type);
        if (set) {
            set.forEach((l) => {
                try { l(msg); } catch { /* Expected: listener callback may throw */ }
            });
        }
        // Also dispatch to wildcard "*" listeners
        const wildcard = this.listeners.get("*");
        if (wildcard) {
            wildcard.forEach((l) => {
                try { l(msg); } catch { /* Expected: listener callback may throw */ }
            });
        }
    }

    on(type: string, listener: TransportListener): void {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type)!.add(listener);
    }

    off(type: string, listener: TransportListener): void {
        this.listeners.get(type)?.delete(listener);
    }

    onStateChange(listener: (state: TransportState) => void): void {
        this.stateListeners.add(listener);
    }
}

// ══════════════════════════════════════════════════════════════
// OfflineTransport — queues events offline, flushes on reconnect
// ══════════════════════════════════════════════════════════════

const OFFLINE_QUEUE_KEY = "multiplayer-offline-queue";

export class OfflineTransport implements IMultiplayerTransport {
    private listeners = new Map<string, Set<TransportListener>>();
    private stateListeners = new Set<(state: TransportState) => void>();
    private _state: TransportState = "disconnected";
    private queue: TransportMessage[] = [];
    private upstream?: IMultiplayerTransport;

    /** Pass an upstream transport to flush to when going online */
    constructor(upstream?: IMultiplayerTransport) {
        this.upstream = upstream;
        this.loadQueue();
    }

    get state(): TransportState {
        return this._state;
    }

    private setState(s: TransportState) {
        this._state = s;
        this.stateListeners.forEach((l) => l(s));
    }

    async connect(): Promise<void> {
        this.setState("connected");
        // If upstream is available, flush queued events
        if (this.upstream && this.queue.length > 0) {
            await this.flush();
        }
    }

    disconnect(): void {
        this.setState("disconnected");
    }

    send(type: string, payload: Record<string, unknown>): void {
        const msg: TransportMessage = { type, payload, timestamp: Date.now() };

        if (this.upstream && this.upstream.state === "connected") {
            // Online — send directly via upstream
            this.upstream.send(type, payload);
        } else {
            // Offline — queue for later
            this.queue.push(msg);
            this.saveQueue();
            console.info(`[OfflineTransport] queued event "${type}" (${this.queue.length} in queue)`);
        }

        // Still dispatch locally so UI stays responsive
        const set = this.listeners.get(type);
        if (set) set.forEach((l) => { try { l(msg); } catch { /* Expected: listener callback may throw */ } });
    }

    on(type: string, listener: TransportListener): void {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type)!.add(listener);
    }

    off(type: string, listener: TransportListener): void {
        this.listeners.get(type)?.delete(listener);
    }

    onStateChange(listener: (state: TransportState) => void): void {
        this.stateListeners.add(listener);
    }

    /** Flush all queued events to upstream transport */
    async flush(): Promise<number> {
        if (!this.upstream || this.upstream.state !== "connected") return 0;
        const toFlush = [...this.queue];
        this.queue = [];
        this.saveQueue();

        let flushed = 0;
        for (const msg of toFlush) {
            try {
                this.upstream.send(msg.type, msg.payload);
                flushed++;
            } catch (err) {
                // Re-queue failed events
                this.queue.push(msg);
                log.warn("flush error, re-queued:", err);
            }
        }
        if (this.queue.length > 0) this.saveQueue();
        console.info(`[OfflineTransport] flushed ${flushed}/${toFlush.length} events`);
        return flushed;
    }

    /** Number of queued events */
    get queueLength(): number {
        return this.queue.length;
    }

    /** Clear the offline queue */
    clearQueue(): void {
        this.queue = [];
        this.saveQueue();
    }

    private saveQueue(): void {
        try {
            localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue));
        } catch { /* localStorage full — silently drop */ }
    }

    private loadQueue(): void {
        try {
            const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
            if (data) this.queue = JSON.parse(data) as TransportMessage[];
        } catch {
            /* Expected: localStorage or JSON.parse may fail */
            this.queue = [];
        }
    }
}
