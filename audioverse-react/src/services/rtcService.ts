import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export type AccessTokenFactory = () => string | Promise<string>;

const resolveDefaultHubUrl = () => {
    try {
        const fromVite = import.meta.env.VITE_AUDIOVERSE_RTC_HUB as string | undefined;
        if (fromVite && fromVite.trim().length > 0) return fromVite;
    } catch {
        // Expected: import.meta.env may not be available (SSR/test)
    }
    return "/hubs/karaoke";
};

export class RTCService {
    private connection?: HubConnection;
    private connectPromise?: Promise<HubConnection>;
    private url: string;

    constructor(url = resolveDefaultHubUrl()) {
        this.url = url;
    }

    async connect(accessTokenFactory?: AccessTokenFactory) {
        if (this.connection && this.connection.state === "Connected") return this.connection;
        if (this.connectPromise) return this.connectPromise;

        const builder = new HubConnectionBuilder();
        if (accessTokenFactory) {
            builder.withUrl(this.url, { accessTokenFactory });
        } else {
            builder.withUrl(this.url);
        }
        builder.withAutomaticReconnect()
            .configureLogging(LogLevel.Information);

        const nextConnection = builder.build();
        this.connection = nextConnection;
        this.connectPromise = (async () => {
            await nextConnection.start();
            return nextConnection;
        })();

        try {
            return await this.connectPromise;
        } finally {
            this.connectPromise = undefined;
        }
    }

    async disconnect() {
        if (!this.connection) return;
        try {
            await this.connection.stop();
        } finally {
            this.connection = undefined;
        }
    }

    isConnected() {
        return !!this.connection && this.connection.state === "Connected";
    }

    // Generic invoke
    async invoke(method: string, ...args: unknown[]) {
        if (!this.connection) throw new Error("RTC connection is not established");
        return await this.connection.invoke(method, ...args);
    }

    // Event binding
    on(event: string, handler: (...args: unknown[]) => void) {
        this.connection?.on(event, handler);
    }

    off(event: string, handler?: (...args: unknown[]) => void) {
        if (!this.connection) return;
        if (handler) this.connection.off(event, handler);
        else this.connection.off(event);
    }

    // Lobby management
    // Server-supported: allow optional `channel`/`mode` parameter so backend can place users into separate groups
    async joinLobby(eventId: number, username: string, channel?: string) {
        if (channel) return this.invoke("JoinLobby", eventId, username, channel);
        return this.invoke("JoinLobby", eventId, username);
    }

    async leaveLobby(eventId: number, channel?: string) {
        if (channel) return this.invoke("LeaveLobby", eventId, channel);
        return this.invoke("LeaveLobby", eventId);
    }

    async getLobbyMembers(eventId: number) {
        return this.invoke("GetLobbyMembers", eventId);
    }

    // Chat
    async sendChatMessage(eventId: number, user: string, message: string) {
        return this.invoke("SendChatMessage", eventId, user, message);
    }

    // WebRTC signaling helpers
    async sendOffer(targetConnectionId: string, offer: RTCSessionDescriptionInit) {
        return this.invoke("SendOffer", targetConnectionId, offer);
    }

    async sendAnswer(targetConnectionId: string, answer: RTCSessionDescriptionInit) {
        return this.invoke("SendAnswer", targetConnectionId, answer);
    }

    async sendIceCandidate(targetConnectionId: string, candidate: RTCIceCandidateInit) {
        return this.invoke("SendIceCandidate", targetConnectionId, candidate);
    }

    // Game events (organizer/admin privileged)
    async startRound(eventId: number, roundNumber: number, metadata?: Record<string, unknown>) {
        return this.invoke("StartRound", eventId, roundNumber, metadata ?? null);
    }

    async endRound(eventId: number, roundNumber: number, results?: Record<string, unknown>) {
        return this.invoke("EndRound", eventId, roundNumber, results ?? null);
    }

    async updateScore(eventId: number, playerId: number, score: number) {
        return this.invoke("UpdateScore", eventId, playerId, score);
    }

    // Timeline synchronization helpers
    async publishTimelineUpdate(payload: Record<string, unknown>) {
        return this.invoke('PublishTimelineUpdate', payload);
    }

    onTimelineUpdate(handler: (...args: unknown[]) => void) {
        this.on('ReceiveTimelineUpdate', handler);
    }

    offTimelineUpdate(handler?: (...args: unknown[]) => void) {
        this.off('ReceiveTimelineUpdate', handler);
    }

    // Clock-sync helpers
    async getServerTime(): Promise<string> {
        const res = await this.invoke('GetServerTime');
        return String(res);
    }

    // Compute clock offset (serverTime - clientTime) in milliseconds (best sample)
    async computeClockOffset(attempts = 3): Promise<number> {
        if (!this.connection) throw new Error('RTC not connected');
        let best: { rtt: number; offset: number } | null = null;
        for (let i = 0; i < attempts; i++) {
            const t0 = Date.now();
            let serverStr: string;
            try {
                serverStr = await this.getServerTime();
            } catch (_e) {
                continue;
            }
            const t1 = Date.now();
            const rtt = t1 - t0;
            const serverMs = Date.parse(serverStr);
            // estimated server time at t1 = serverMs + rtt/2
            const estServerAtRecv = serverMs + rtt / 2;
            const offset = estServerAtRecv - t1; // serverTime - clientTime
            if (!best || rtt < best.rtt) best = { rtt, offset };
            // small delay between attempts
            await new Promise(r => setTimeout(r, 20));
        }
        if (!best) throw new Error('Failed to compute clock offset');
        return best.offset;
    }
}

// Default exported singleton for convenience
export const rtcService = new RTCService();
