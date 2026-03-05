import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
    fetchMyEventLists,
    fetchEventListById,
    fetchSharedEventList,
    postCreateEventList,
    deleteEventList,
    postAddEventToList,
    postToggleFavorite,
    type CreateEventListRequest,
    type AddEventToListRequest,
} from '../scripts/api/apiEventLists';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;
const del = (apiClient as any).delete as unknown as ReturnType<typeof vi.fn>;

describe('apiEventLists — fetch functions', () => {
    beforeEach(() => vi.resetAllMocks());

    // --- fetchMyEventLists ---
    it('fetchMyEventLists calls GET /api/EventLists/my', async () => {
        const lists = [{ id: 1, name: 'Favorites' }];
        get.mockResolvedValueOnce({ data: lists });
        const res = await fetchMyEventLists();
        expect(res).toEqual(lists);
        expect(get).toHaveBeenCalledWith('/api/EventLists/my');
    });

    it('fetchMyEventLists returns [] when data is null', async () => {
        get.mockResolvedValueOnce({ data: null });
        const res = await fetchMyEventLists();
        expect(res).toEqual([]);
    });

    // --- fetchEventListById ---
    it('fetchEventListById calls GET /api/EventLists/{id}', async () => {
        const list = { id: 5, name: 'Weekend events' };
        get.mockResolvedValueOnce({ data: list });
        const res = await fetchEventListById(5);
        expect(res).toEqual(list);
        expect(get).toHaveBeenCalledWith('/api/EventLists/5');
    });

    // --- fetchSharedEventList ---
    it('fetchSharedEventList calls GET /api/EventLists/shared/{token}', async () => {
        const list = { id: 3, name: 'Shared list' };
        get.mockResolvedValueOnce({ data: list });
        const res = await fetchSharedEventList('abc123');
        expect(res).toEqual(list);
        expect(get).toHaveBeenCalledWith('/api/EventLists/shared/abc123');
    });

    // --- postCreateEventList ---
    it('postCreateEventList calls POST /api/EventLists with data', async () => {
        const req: CreateEventListRequest = { name: 'New List' };
        const created = { id: 10, name: 'New List' };
        post.mockResolvedValueOnce({ data: created });
        const res = await postCreateEventList(req);
        expect(res).toEqual(created);
        expect(post).toHaveBeenCalledWith('/api/EventLists/', req);
    });

    // --- deleteEventList ---
    it('deleteEventList calls DELETE /api/EventLists/{id}', async () => {
        del.mockResolvedValueOnce({});
        await deleteEventList(5);
        expect(del).toHaveBeenCalledWith('/api/EventLists/5');
    });

    // --- postAddEventToList ---
    it('postAddEventToList calls POST /api/EventLists/{listId}/events with data', async () => {
        const req: AddEventToListRequest = { eventId: 42, note: 'Important' };
        const item = { id: 1, eventId: 42, note: 'Important', sortOrder: 0 };
        post.mockResolvedValueOnce({ data: item });
        const res = await postAddEventToList(3, req);
        expect(res).toEqual(item);
        expect(post).toHaveBeenCalledWith('/api/EventLists/3/events', req);
    });

    // --- postToggleFavorite ---
    it('postToggleFavorite calls POST /api/EventLists/favorites/toggle/{eventId}', async () => {
        post.mockResolvedValueOnce({});
        await postToggleFavorite(42);
        expect(post).toHaveBeenCalledWith('/api/EventLists/favorites/toggle/42');
    });
});
