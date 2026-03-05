import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
    fetchEventSubscription,
    fetchSubscriptionCheck,
    fetchMySubscriptions,
    postSubscribeToEvent,
    deleteUnsubscribe,
    postToggleSubscription,
    type SubscribeToEventRequest,
} from '../scripts/api/apiEventSubscriptions';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as unknown as ReturnType<typeof vi.fn>;

describe('apiEventSubscriptions — fetch functions', () => {
    beforeEach(() => vi.resetAllMocks());

    // --- fetchEventSubscription ---
    it('fetchEventSubscription calls GET /api/EventSubscriptions/events/{eventId}', async () => {
        const sub = { id: 1, userId: 10, eventId: 42, level: 2, emailEnabled: true, pushEnabled: false };
        get.mockResolvedValueOnce({ data: sub });
        const res = await fetchEventSubscription(42);
        expect(res).toEqual(sub);
        expect(get).toHaveBeenCalledWith('/api/EventSubscriptions/events/42');
    });

    // --- fetchSubscriptionCheck ---
    it('fetchSubscriptionCheck calls GET /api/EventSubscriptions/events/{eventId}/check', async () => {
        get.mockResolvedValueOnce({ data: true });
        const res = await fetchSubscriptionCheck(42);
        expect(res).toBe(true);
        expect(get).toHaveBeenCalledWith('/api/EventSubscriptions/events/42/check');
    });

    it('fetchSubscriptionCheck returns false when not subscribed', async () => {
        get.mockResolvedValueOnce({ data: false });
        const res = await fetchSubscriptionCheck(99);
        expect(res).toBe(false);
    });

    // --- fetchMySubscriptions ---
    it('fetchMySubscriptions calls GET /api/EventSubscriptions/my', async () => {
        const subs = [{ id: 1, eventId: 42 }, { id: 2, eventId: 43 }];
        get.mockResolvedValueOnce({ data: subs });
        const res = await fetchMySubscriptions();
        expect(res).toEqual(subs);
        expect(get).toHaveBeenCalledWith('/api/EventSubscriptions/my');
    });

    it('fetchMySubscriptions returns [] when data is null', async () => {
        get.mockResolvedValueOnce({ data: null });
        const res = await fetchMySubscriptions();
        expect(res).toEqual([]);
    });

    // --- postSubscribeToEvent ---
    it('postSubscribeToEvent calls POST /api/EventSubscriptions with data', async () => {
        const req: SubscribeToEventRequest = { eventId: 42, level: 2, emailEnabled: true, pushEnabled: false };
        const sub = { id: 1, ...req };
        post.mockResolvedValueOnce({ data: sub });
        const res = await postSubscribeToEvent(req);
        expect(res).toEqual(sub);
        expect(post).toHaveBeenCalledWith('/api/EventSubscriptions/', req);
    });

    // --- deleteUnsubscribe ---
    it('deleteUnsubscribe calls DELETE /api/EventSubscriptions/events/{eventId}', async () => {
        del.mockResolvedValueOnce({});
        await deleteUnsubscribe(42);
        expect(del).toHaveBeenCalledWith('/api/EventSubscriptions/events/42');
    });

    // --- postToggleSubscription ---
    it('postToggleSubscription calls POST /api/EventSubscriptions/events/{eventId}/toggle', async () => {
        post.mockResolvedValueOnce({});
        await postToggleSubscription(42);
        expect(post).toHaveBeenCalledWith('/api/EventSubscriptions/events/42/toggle');
    });
});
