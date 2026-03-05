// radioHubService.ts — SignalR RadioHub connection (voice, chat, reactions)
import {
    HubConnectionBuilder,
    HubConnection,
    LogLevel,
} from "@microsoft/signalr";

import { API_ROOT } from "../config/apiConfig";
import { logger } from "../utils/logger";
const log = logger.scoped('RadioHub');

const HUB_URL = `${API_ROOT}/hubs/radio`;

// ── Callback types ─────────────────────────────────────────────────

export interface VoiceLiveStartedData {
    radioId: number;
    djUserId: string;
    djName: string;
}

export interface ChatMessageData {
    id: number;
    displayName: string;
    content: string;
    messageType: string;
    sentAtUtc: string;
    userId: string | null;
}

export interface SongReactionData {
    radioId: number;
    reactionType: string;
    userId: string | null;
}

type VoiceLiveStartedCallback = (data: VoiceLiveStartedData) => void;
type VoiceChunkCallback = (chunk: Uint8Array) => void;
type VoiceLiveStoppedCallback = () => void;
type ChatMessageCallback = (msg: ChatMessageData) => void;
type SongReactionCallback = (reaction: SongReactionData) => void;

// ── Service ────────────────────────────────────────────────────────

class RadioHubService {
    private connection: HubConnection | null = null;

    private onVoiceStarted: VoiceLiveStartedCallback[] = [];
    private onVoiceChunk: VoiceChunkCallback[] = [];
    private onVoiceStopped: VoiceLiveStoppedCallback[] = [];
    private onChatMessage: ChatMessageCallback[] = [];
    private onSongReaction: SongReactionCallback[] = [];

    /** Connect to the RadioHub */
    async connect(accessToken?: string): Promise<void> {
        if (this.connection) return;

        const builder = new HubConnectionBuilder();
        if (accessToken) {
            builder.withUrl(HUB_URL, { accessTokenFactory: () => accessToken });
        } else {
            builder.withUrl(HUB_URL);
        }
        builder.withAutomaticReconnect()
            .configureLogging(LogLevel.Warning);

        this.connection = builder.build();

        // Server → Client events
        this.connection.on("VoiceLiveStarted", (...args: unknown[]) => {
            const data = args[0] as VoiceLiveStartedData;
            this.onVoiceStarted.forEach((cb) => cb(data));
        });

        this.connection.on("VoiceChunk", (...args: unknown[]) => {
            const chunk = args[0] as Uint8Array;
            this.onVoiceChunk.forEach((cb) => cb(chunk));
        });

        this.connection.on("VoiceLiveStopped", () => {
            this.onVoiceStopped.forEach((cb) => cb());
        });

        this.connection.on("ChatMessage", (...args: unknown[]) => {
            const msg = args[0] as ChatMessageData;
            this.onChatMessage.forEach((cb) => cb(msg));
        });

        this.connection.on("SongReaction", (...args: unknown[]) => {
            const reaction = args[0] as SongReactionData;
            this.onSongReaction.forEach((cb) => cb(reaction));
        });

        try {
            await this.connection.start();
            log.debug("Connected");
        } catch (e) {
            log.error("Failed to connect:", e);
        }
    }

    /** Disconnect from the hub */
    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
        this.onVoiceStarted = [];
        this.onVoiceChunk = [];
        this.onVoiceStopped = [];
        this.onChatMessage = [];
        this.onSongReaction = [];
    }

    // ── Client → Server invocations ────────────────────────────────

    /** DJ starts voice session */
    async startVoice(radioId: number): Promise<void> {
        await this.connection?.invoke("StartVoice", radioId);
    }

    /** DJ sends audio chunk */
    async sendVoiceChunk(radioId: number, chunk: Uint8Array): Promise<void> {
        await this.connection?.invoke("SendVoiceChunk", radioId, chunk);
    }

    /** DJ stops voice session */
    async stopVoice(radioId: number): Promise<void> {
        await this.connection?.invoke("StopVoice", radioId);
    }

    /** Send chat message */
    async sendChatMessage(radioId: number, content: string): Promise<void> {
        await this.connection?.invoke("SendChatMessage", radioId, content);
    }

    /** Send song reaction */
    async sendReaction(radioId: number, reactionType: string): Promise<void> {
        await this.connection?.invoke("SendReaction", radioId, reactionType);
    }

    /** Guest joins voice using invite token */
    async joinVoiceAsGuest(radioId: number, inviteToken: string): Promise<void> {
        await this.connection?.invoke("JoinVoiceAsGuest", radioId, inviteToken);
    }

    // ── Event subscriptions (return unsubscribe fn) ────────────────

    onVoiceLiveStarted(cb: VoiceLiveStartedCallback): () => void {
        this.onVoiceStarted.push(cb);
        return () => {
            this.onVoiceStarted = this.onVoiceStarted.filter((x) => x !== cb);
        };
    }

    onVoiceChunkReceived(cb: VoiceChunkCallback): () => void {
        this.onVoiceChunk.push(cb);
        return () => {
            this.onVoiceChunk = this.onVoiceChunk.filter((x) => x !== cb);
        };
    }

    onVoiceLiveStopped(cb: VoiceLiveStoppedCallback): () => void {
        this.onVoiceStopped.push(cb);
        return () => {
            this.onVoiceStopped = this.onVoiceStopped.filter((x) => x !== cb);
        };
    }

    onChatMessageReceived(cb: ChatMessageCallback): () => void {
        this.onChatMessage.push(cb);
        return () => {
            this.onChatMessage = this.onChatMessage.filter((x) => x !== cb);
        };
    }

    onSongReactionReceived(cb: SongReactionCallback): () => void {
        this.onSongReaction.push(cb);
        return () => {
            this.onSongReaction = this.onSongReaction.filter((x) => x !== cb);
        };
    }

    get isConnected(): boolean {
        return this.connection !== null;
    }
}

// Singleton
export const radioHub = new RadioHubService();
export default radioHub;
