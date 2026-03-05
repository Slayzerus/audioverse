// useOfflineQueue.ts — React hook for managing an offline event queue.
// Buffers multiplayer/real-time events when the user is offline,
// then flushes them to the upstream transport on reconnect.

import { useState, useEffect, useCallback, useRef } from "react";
import type { IMultiplayerTransport } from "../services/MultiplayerTransport";
import { OfflineTransport } from "../services/MultiplayerTransport";

interface UseOfflineQueueResult {
    /** Current queue length */
    queueLength: number;
    /** Whether we are currently offline (queuing events) */
    isOffline: boolean;
    /** Send an event — auto-queued if offline */
    send: (type: string, payload: Record<string, unknown>) => void;
    /** Manually flush the queue (normally happens automatically on reconnect) */
    flush: () => Promise<number>;
    /** Clear all queued events */
    clearQueue: () => void;
    /** The offline transport instance (for advanced usage) */
    transport: OfflineTransport;
}

/**
 * Hook that wraps an upstream transport with offline queueing.
 *
 * @param upstream - The real transport (SignalR, WebSocket, etc.)
 *                   When `undefined`, all events are queued locally.
 *
 * Usage:
 * ```tsx
 * const rtc = useContext(RTCContext);
 * const { send, queueLength, isOffline } = useOfflineQueue(rtc);
 * send("score-update", { score: 42 }); // auto-queued if offline
 * ```
 */
export function useOfflineQueue(upstream?: IMultiplayerTransport): UseOfflineQueueResult {
    const transportRef = useRef<OfflineTransport>(new OfflineTransport(upstream));
    const [queueLength, setQueueLength] = useState(transportRef.current.queueLength);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);

    // Keep upstream reference up to date
    useEffect(() => {
        transportRef.current = new OfflineTransport(upstream);
        setQueueLength(transportRef.current.queueLength);
    }, [upstream]);

    // Listen for online/offline events
    useEffect(() => {
        const handleOnline = async () => {
            setIsOffline(false);
            // Auto-connect and flush
            await transportRef.current.connect();
            const flushed = await transportRef.current.flush();
            if (flushed > 0) {
                setQueueLength(transportRef.current.queueLength);
            }
        };

        const handleOffline = () => {
            setIsOffline(true);
            transportRef.current.disconnect();
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const send = useCallback((type: string, payload: Record<string, unknown>) => {
        transportRef.current.send(type, payload);
        setQueueLength(transportRef.current.queueLength);
    }, []);

    const flush = useCallback(async () => {
        const flushed = await transportRef.current.flush();
        setQueueLength(transportRef.current.queueLength);
        return flushed;
    }, []);

    const clearQueue = useCallback(() => {
        transportRef.current.clearQueue();
        setQueueLength(0);
    }, []);

    return {
        queueLength,
        isOffline,
        send,
        flush,
        clearQueue,
        transport: transportRef.current,
    };
}
