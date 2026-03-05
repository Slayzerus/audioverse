import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../scripts/api/audioverseApiClient', () => ({
    apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
    apiPath: (base: string, path: string) => `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`,
}));

import { apiClient } from '../scripts/api/audioverseApiClient';
import {
    fetchBookSearch,
    fetchBookDetails,
    postImportBookCatalog,
    type CatalogBook,
} from '../scripts/api/apiBookCatalog';

const get = apiClient.get as unknown as ReturnType<typeof vi.fn>;
const post = apiClient.post as unknown as ReturnType<typeof vi.fn>;

describe('apiBookCatalog — fetch functions', () => {
    beforeEach(() => vi.resetAllMocks());

    // --- fetchBookSearch ---
    it('fetchBookSearch calls GET /api/books/search with query and limit', async () => {
        const books = [{ id: 1, title: 'Sapiens', author: 'Harari' }];
        get.mockResolvedValueOnce({ data: books });
        const res = await fetchBookSearch('Sapiens', 20);
        expect(res).toEqual(books);
        expect(get).toHaveBeenCalledWith('/api/books/search', { params: { q: 'Sapiens', limit: 20 } });
    });

    it('fetchBookSearch returns [] when data is null', async () => {
        get.mockResolvedValueOnce({ data: null });
        const res = await fetchBookSearch('Nothing', 10);
        expect(res).toEqual([]);
    });

    // --- fetchBookDetails ---
    it('fetchBookDetails calls GET /api/books/google/{id}', async () => {
        const book = { id: 1, title: 'Sapiens', googleBooksId: 'FmyBAwAAQBAJ' };
        get.mockResolvedValueOnce({ data: book });
        const res = await fetchBookDetails('FmyBAwAAQBAJ');
        expect(res).toEqual(book);
        expect(get).toHaveBeenCalledWith('/api/books/google/FmyBAwAAQBAJ');
    });

    // --- postImportBookCatalog ---
    it('postImportBookCatalog calls POST /api/books/import with data', async () => {
        const books: CatalogBook[] = [
            { id: 1, title: 'Sapiens' },
            { id: 2, title: 'Homo Deus' },
        ];
        post.mockResolvedValueOnce({});
        await postImportBookCatalog(books);
        expect(post).toHaveBeenCalledWith('/api/books/import', books);
    });
});
