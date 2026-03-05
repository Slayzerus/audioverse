// apiEventSubscriptions.ts — Event Subscriptions & notification settings API
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Base path ===
export const EVENT_SUBS_BASE = "/api/EventSubscriptions";

// === Models ===

export enum EventNotificationLevel {
    Muted = 0,
    Essential = 1,
    Standard = 2,
    All = 3,
}

export enum EventNotificationCategory {
    Cancellation = 1,
    DateTimeChange = 2,
    Reminder24h = 4,
    Reminder1h = 8,
    ScheduleUpdate = 16,
    NewParticipant = 32,
    News = 64,
    Comments = 128,
    Polls = 256,
    Media = 512,
    GameUpdates = 1024,
}

export interface EventSubscription {
    id: number;
    userId: number;
    eventId: number;
    level: EventNotificationLevel;
    customCategories?: number;
    emailEnabled: boolean;
    pushEnabled: boolean;
    createdAt?: string;
}

export interface SubscribeToEventRequest {
    eventId: number;
    level?: EventNotificationLevel;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
}

export interface UpdateSubscriptionRequest {
    level?: EventNotificationLevel;
    customCategories?: number;
    emailEnabled?: boolean;
    pushEnabled?: boolean;
}

export interface SetObservedRequest {
    isObserved: boolean;
    level?: EventNotificationLevel;
}

export interface SubscribeToListRequest {
    level?: EventNotificationLevel;
}

// === Query Keys ===

export const EVENT_SUBS_QK = {
    byEvent: (eventId: number) => ["event-subscriptions", "event", eventId] as const,
    check: (eventId: number) => ["event-subscriptions", "check", eventId] as const,
    my: ["event-subscriptions", "my"] as const,
    subscribers: (eventId: number) => ["event-subscriptions", "subscribers", eventId] as const,
};

// === Fetch functions ===

/** @internal GET /api/EventSubscriptions/events/{eventId} — My subscription for an event */
export const fetchEventSubscription = async (eventId: number): Promise<EventSubscription> => {
    const { data } = await apiClient.get<EventSubscription>(
        apiPath(EVENT_SUBS_BASE, `/events/${eventId}`),
    );
    return data;
};

/** @internal GET /api/EventSubscriptions/events/{eventId}/check — Am I subscribed? */
export const fetchSubscriptionCheck = async (eventId: number): Promise<boolean> => {
    const { data } = await apiClient.get<boolean>(
        apiPath(EVENT_SUBS_BASE, `/events/${eventId}/check`),
    );
    return data;
};

/** @internal GET /api/EventSubscriptions/my — All my subscriptions */
export const fetchMySubscriptions = async (): Promise<EventSubscription[]> => {
    const { data } = await apiClient.get<EventSubscription[]>(apiPath(EVENT_SUBS_BASE, "/my"));
    return data ?? [];
};

/** @internal GET /api/EventSubscriptions/events/{eventId}/subscribers — Subscriber list */
export const fetchEventSubscribers = async (eventId: number): Promise<EventSubscription[]> => {
    const { data } = await apiClient.get<EventSubscription[]>(
        apiPath(EVENT_SUBS_BASE, `/events/${eventId}/subscribers`),
    );
    return data ?? [];
};

/** @internal POST /api/EventSubscriptions — Subscribe */
export const postSubscribeToEvent = async (req: SubscribeToEventRequest): Promise<EventSubscription> => {
    const { data } = await apiClient.post<EventSubscription>(apiPath(EVENT_SUBS_BASE, ""), req);
    return data;
};

/** @internal PUT /api/EventSubscriptions/events/{eventId} — Update settings */
export const putUpdateSubscription = async (
    eventId: number,
    req: UpdateSubscriptionRequest,
): Promise<void> => {
    await apiClient.put(apiPath(EVENT_SUBS_BASE, `/events/${eventId}`), req);
};

/** @internal DELETE /api/EventSubscriptions/events/{eventId} — Unsubscribe */
export const deleteUnsubscribe = async (eventId: number): Promise<void> => {
    await apiClient.delete(apiPath(EVENT_SUBS_BASE, `/events/${eventId}`));
};

/** @internal POST /api/EventSubscriptions/events/{eventId}/toggle — Toggle subscription */
export const postToggleSubscription = async (eventId: number): Promise<void> => {
    await apiClient.post(apiPath(EVENT_SUBS_BASE, `/events/${eventId}/toggle`));
};

/** @internal POST /api/EventSubscriptions/lists/{listId}/subscribe — Bulk subscribe to list */
export const postSubscribeToList = async (
    listId: number,
    req?: SubscribeToListRequest,
): Promise<void> => {
    await apiClient.post(apiPath(EVENT_SUBS_BASE, `/lists/${listId}/subscribe`), req ?? {});
};

/** @internal PUT /api/EventSubscriptions/list-items/{itemId}/observe — Set isObserved */
export const putSetObserved = async (
    itemId: number,
    req: SetObservedRequest,
): Promise<void> => {
    await apiClient.put(apiPath(EVENT_SUBS_BASE, `/list-items/${itemId}/observe`), req);
};

// === React Query hooks ===

/** GET /api/EventSubscriptions/events/{eventId} — My subscription for an event */
export const useEventSubscriptionQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventSubscription, unknown, EventSubscription, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_SUBS_QK.byEvent(eventId),
        queryFn: () => fetchEventSubscription(eventId),
        enabled: Number.isFinite(eventId),
        ...options,
    });

/** GET /api/EventSubscriptions/events/{eventId}/check — Am I subscribed? */
export const useSubscriptionCheckQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<boolean, unknown, boolean, QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_SUBS_QK.check(eventId),
        queryFn: () => fetchSubscriptionCheck(eventId),
        enabled: Number.isFinite(eventId),
        ...options,
    });

/** GET /api/EventSubscriptions/my — All my subscriptions */
export const useMySubscriptionsQuery = (
    options?: Partial<UseQueryOptions<EventSubscription[], unknown, EventSubscription[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_SUBS_QK.my,
        queryFn: fetchMySubscriptions,
        ...options,
    });

/** GET /api/EventSubscriptions/events/{eventId}/subscribers — Subscriber list */
export const useEventSubscribersQuery = (
    eventId: number,
    options?: Partial<UseQueryOptions<EventSubscription[], unknown, EventSubscription[], QueryKey>>,
) =>
    useQuery({
        queryKey: EVENT_SUBS_QK.subscribers(eventId),
        queryFn: () => fetchEventSubscribers(eventId),
        enabled: Number.isFinite(eventId),
        ...options,
    });

/** POST /api/EventSubscriptions — Subscribe to an event */
export const useSubscribeToEventMutation = () => {
    const qc = useQueryClient();
    return useMutation<EventSubscription, unknown, SubscribeToEventRequest>({
        mutationFn: (req) => postSubscribeToEvent(req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.byEvent(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.check(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.my });
        },
    });
};

/** PUT /api/EventSubscriptions/events/{eventId} — Update subscription settings */
export const useUpdateSubscriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { eventId: number; req: UpdateSubscriptionRequest }>({
        mutationFn: ({ eventId, req }) => putUpdateSubscription(eventId, req),
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.byEvent(vars.eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.my });
        },
    });
};

/** DELETE /api/EventSubscriptions/events/{eventId} — Unsubscribe */
export const useUnsubscribeMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (eventId) => deleteUnsubscribe(eventId),
        onSuccess: (_data, eventId) => {
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.byEvent(eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.check(eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.my });
        },
    });
};

/** POST /api/EventSubscriptions/events/{eventId}/toggle — Toggle subscription */
export const useToggleSubscriptionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: (eventId) => postToggleSubscription(eventId),
        onSuccess: (_data, eventId) => {
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.byEvent(eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.check(eventId) });
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.my });
        },
    });
};

/** POST /api/EventSubscriptions/lists/{listId}/subscribe — Bulk subscribe to list events */
export const useSubscribeToListMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { listId: number; req?: SubscribeToListRequest }>({
        mutationFn: ({ listId, req }) => postSubscribeToList(listId, req),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.my });
        },
    });
};

/** PUT /api/EventSubscriptions/list-items/{itemId}/observe — Set isObserved */
export const useSetObservedMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { itemId: number; req: SetObservedRequest }>({
        mutationFn: ({ itemId, req }) => putSetObserved(itemId, req),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: EVENT_SUBS_QK.my });
        },
    });
};
