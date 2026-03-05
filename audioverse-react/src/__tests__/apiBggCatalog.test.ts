import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
    fetchBggCatalogSearch,
    fetchBggSyncStatus,
    postStartBggSync,
    postCancelBggSync,
    postImportBggCatalog,
    type BggCatalogGame,
} from '../scripts/api/apiBggCatalog';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('apiBggCatalog — fetch functions', () => {
    beforeEach(() => vi.resetAllMocks());

    // --- fetchBggCatalogSearch ---
    it('fetchBggCatalogSearch calls GET /api/bgg/search with query and limit', async () => {
        get.mockResolvedValueOnce({ data: [{ bggId: 1, name: 'Catan' }] });
        const res = await fetchBggCatalogSearch('Catan', 20);
        expect(res).toEqual([{ bggId: 1, name: 'Catan' }]);
        expect(get).toHaveBeenCalledWith('/api/bgg/search', { params: { q: 'Catan', limit: 20 } });
    });

    it('fetchBggCatalogSearch returns [] when data is null', async () => {
        get.mockResolvedValueOnce({ data: null });
        const res = await fetchBggCatalogSearch('Nothing', 10);
        expect(res).toEqual([]);
    });

    // --- fetchBggSyncStatus ---
    it('fetchBggSyncStatus calls GET /api/bgg/sync/status', async () => {
        const status = { state: 'Idle', totalGames: 100, syncedGames: 50, failedGames: 0, progress: 0.5 };
        get.mockResolvedValueOnce({ data: status });
        const res = await fetchBggSyncStatus();
        expect(res).toEqual(status);
        expect(get).toHaveBeenCalledWith('/api/bgg/sync/status');
    });

    // --- postStartBggSync ---
    it('postStartBggSync calls POST /api/bgg/sync/start', async () => {
        post.mockResolvedValueOnce({});
        await postStartBggSync();
        expect(post).toHaveBeenCalledWith('/api/bgg/sync/start');
    });

    // --- postCancelBggSync ---
    it('postCancelBggSync calls POST /api/bgg/sync/cancel', async () => {
        post.mockResolvedValueOnce({});
        await postCancelBggSync();
        expect(post).toHaveBeenCalledWith('/api/bgg/sync/cancel');
    });

    // --- postImportBggCatalog ---
    it('postImportBggCatalog calls POST /api/bgg/import with data', async () => {
        const games: BggCatalogGame[] = [
            { bggId: 1, name: 'Catan' },
            { bggId: 2, name: 'Pandemic' },
        ];
        post.mockResolvedValueOnce({});
        await postImportBggCatalog(games);
        expect(post).toHaveBeenCalledWith('/api/bgg/import', games);
    });
});
