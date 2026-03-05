// notificationHubService.ts — SignalR NotificationHub connection
import {
    HubConnectionBuilder,
    HubConnection,
    LogLevel,
} from "@microsoft/signalr";
import type { Notification } from "../models/modelsKaraoke";

import { API_ROOT } from "../config/apiConfig";
import { logger } from "../utils/logger";
const log = logger.scoped('NotificationHub');

const HUB_URL = `${API_ROOT}/hubs/notifications`;

type NotificationCallback = (notification: Notification) => void;
type UnreadCountCallback = (count: number) => void;

class NotificationHubService {
    private connection: HubConnection | null = null;
    private onNotificationCallbacks: NotificationCallback[] = [];
    private onUnreadCountCallbacks: UnreadCountCallback[] = [];

    /** Start hub connection */
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
        this.connection.on("ReceiveNotification", (...args: unknown[]) => {
            const notification = args[0] as Notification;
            if (notification) {
                this.onNotificationCallbacks.forEach((cb) => cb(notification));
            }
        });

        this.connection.on("UnreadCountChanged", (...args: unknown[]) => {
            const count = typeof args[0] === "number" ? args[0] : 0;
            this.onUnreadCountCallbacks.forEach((cb) => cb(count));
        });

        try {
            await this.connection.start();
            log.debug("Connected");
        } catch (e) {
            log.error("Failed to connect:", e);
        }
    }

    /** Stop hub connection */
    async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.stop();
            this.connection = null;
        }
        this.onNotificationCallbacks = [];
        this.onUnreadCountCallbacks = [];
    }

    /** Subscribe to new notifications */
    onNotification(callback: NotificationCallback): () => void {
        this.onNotificationCallbacks.push(callback);
        return () => {
            this.onNotificationCallbacks = this.onNotificationCallbacks.filter(
                (cb) => cb !== callback,
            );
        };
    }

    /** Subscribe to unread count changes */
    onUnreadCount(callback: UnreadCountCallback): () => void {
        this.onUnreadCountCallbacks.push(callback);
        return () => {
            this.onUnreadCountCallbacks = this.onUnreadCountCallbacks.filter(
                (cb) => cb !== callback,
            );
        };
    }

    /** Check connection state */
    get isConnected(): boolean {
        return this.connection !== null;
    }
}

// Singleton
export const notificationHub = new NotificationHubService();
export default notificationHub;
