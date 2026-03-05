// apiNotifications.ts — In-app notifications + SignalR NotificationHub
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type { Notification } from "../../models/modelsKaraoke";

// === Base path ===
const NOTIFICATIONS_BASE = "/api/user/notifications";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const NOTIFICATIONS_QK = {
    list: (unreadOnly?: boolean) => ["notifications", { unreadOnly }] as const,
    unreadCount: ["notifications", "unread-count"] as const,
};

// === Fetchers ===

/** @internal GET /api/user/notifications?unreadOnly=true — List notifications */
export const fetchNotifications = async (unreadOnly = false): Promise<Notification[]> => {
    const { data } = await apiClient.get<Notification[]>(apiPath(NOTIFICATIONS_BASE, ""), {
        params: unreadOnly ? { unreadOnly: true } : undefined,
    });
    return data ?? [];
};

/** @internal GET /api/user/notifications/unread-count — Unread count */
export const fetchUnreadCount = async (): Promise<number> => {
    const { data } = await apiClient.get<{ count: number }>(apiPath(NOTIFICATIONS_BASE, "/unread-count"));
    return data?.count ?? 0;
};

/** @internal POST /api/user/notifications — Send notification */
export const postSendNotification = async (notification: Partial<Notification>): Promise<Notification> => {
    const { data } = await apiClient.post<Notification>(apiPath(NOTIFICATIONS_BASE, ""), notification);
    return data;
};

/** @internal POST /api/user/notifications/{id}/read — Mark as read */
export const postMarkAsRead = async (id: number): Promise<void> => {
    await apiClient.post(apiPath(NOTIFICATIONS_BASE, `/${id}/read`));
};

/** @internal POST /api/user/notifications/read-all — Mark all as read */
export const postMarkAllAsRead = async (): Promise<void> => {
    await apiClient.post(apiPath(NOTIFICATIONS_BASE, "/read-all"));
};

/** @internal DELETE /api/user/notifications/{id} — Delete notification */
export const deleteNotification = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(NOTIFICATIONS_BASE, `/${id}`));
};

// === React Query Hooks ===

export const useNotificationsQuery = (
    unreadOnly = false,
    options?: Partial<UseQueryOptions<Notification[], unknown, Notification[], QueryKey>>,
) =>
    useQuery({
        queryKey: NOTIFICATIONS_QK.list(unreadOnly),
        queryFn: () => fetchNotifications(unreadOnly),
        staleTime: 30_000,
        ...options,
    });

export const useUnreadCountQuery = (
    options?: Partial<UseQueryOptions<number, unknown, number, QueryKey>>,
) =>
    useQuery({
        queryKey: NOTIFICATIONS_QK.unreadCount,
        queryFn: fetchUnreadCount,
        staleTime: 15_000,
        refetchInterval: 30_000,
        ...options,
    });

export const useSendNotificationMutation = () => {
    const qc = useQueryClient();
    return useMutation<Notification, unknown, Partial<Notification>>({
        mutationFn: (n) => postSendNotification(n),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

export const useMarkAsReadMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => postMarkAsRead(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

export const useMarkAllAsReadMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, void>({
        mutationFn: () => postMarkAllAsRead(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

export const useDeleteNotificationMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (id) => deleteNotification(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["notifications"] });
        },
    });
};

export default {
    fetchNotifications,
    fetchUnreadCount,
    postSendNotification,
    postMarkAsRead,
    postMarkAllAsRead,
    deleteNotification,
};
