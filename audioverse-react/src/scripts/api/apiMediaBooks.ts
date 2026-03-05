// apiMediaBooks.ts — Media catalog: books CRUD + external search/import
import {
    useQuery,
    useMutation,
    useQueryClient,
    type UseQueryOptions,
    type QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Types ===

export interface Book {
    id: number;
    title?: string;
    author?: string;
    isbn?: string;
    description?: string;
    coverUrl?: string;
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    language?: string;
    categories?: string;
    externalId?: string;
    externalSource?: string;
    createdAt?: string;
    createdByUserId?: number;
}

export interface BookCollection {
    id: number;
    ownerId: number;
    name?: string;
    description?: string;
    createdAt?: string;
    books?: BookCollectionBook[];
}

export interface BookCollectionBook {
    id: number;
    collectionId: number;
    bookId: number;
    book?: Book;
    addedAt?: string;
}

export interface ExternalBookResult {
    externalId?: string;
    title?: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
    publisher?: string;
    publishedDate?: string;
    description?: string;
}

// === Base path ===
const BASE = "/api/media/books";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const BOOKS_QK = {
    list: (params?: Record<string, unknown>) => ["media", "books", params] as const,
    detail: (id: number) => ["media", "books", id] as const,
    collections: (ownerId: number) => ["media", "books", "collections", ownerId] as const,
    collection: (id: number) => ["media", "books", "collection", id] as const,
    searchOpenLibrary: (q: string) => ["media", "books", "openlibrary", q] as const,
    searchGoogle: (q: string) => ["media", "books", "google", q] as const,
};

// ── CRUD ──────────────────────────────────────────────────────

/** @internal GET /api/media/books — paged list */
export const fetchBooks = async (params?: Record<string, unknown>): Promise<Book[]> => {
    const { data } = await apiClient.get<Book[]>(apiPath(BASE, ""), { params });
    return data ?? [];
};

/** @internal GET /api/media/books/{id} */
export const fetchBookById = async (id: number): Promise<Book> => {
    const { data } = await apiClient.get<Book>(apiPath(BASE, `/${id}`));
    return data;
};

/** @internal POST /api/media/books */
export const postCreateBook = async (book: Partial<Book>): Promise<Book> => {
    const { data } = await apiClient.post<Book>(apiPath(BASE, ""), book);
    return data;
};

/** @internal PUT /api/media/books/{id} */
export const putUpdateBook = async (id: number, book: Partial<Book>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/${id}`), book);
};

/** @internal DELETE /api/media/books/{id} */
export const deleteBook = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/${id}`));
};

// ── External search / import ──────────────────────────────────

/** GET /api/media/books/openlibrary/search?query= */
export const searchOpenLibrary = async (query: string): Promise<ExternalBookResult[]> => {
    const { data } = await apiClient.get<ExternalBookResult[]>(apiPath(BASE, "/openlibrary/search"), { params: { query } });
    return data ?? [];
};

/** POST /api/media/books/openlibrary/import/isbn/{isbn} */
export const importFromOpenLibrary = async (isbn: string): Promise<Book> => {
    const { data } = await apiClient.post<Book>(apiPath(BASE, `/openlibrary/import/isbn/${isbn}`));
    return data;
};

/** GET /api/media/books/google/search?query= */
export const searchGoogleBooks = async (query: string): Promise<ExternalBookResult[]> => {
    const { data } = await apiClient.get<ExternalBookResult[]>(apiPath(BASE, "/google/search"), { params: { query } });
    return data ?? [];
};

/** POST /api/media/books/google/import/{volumeId} */
export const importFromGoogleBooks = async (volumeId: string): Promise<Book> => {
    const { data } = await apiClient.post<Book>(apiPath(BASE, `/google/import/${volumeId}`));
    return data;
};

// ── Collections ───────────────────────────────────────────────

/** @internal GET /api/media/books/collections/owner/{ownerId} */
export const fetchBookCollections = async (ownerId: number): Promise<BookCollection[]> => {
    const { data } = await apiClient.get<BookCollection[]>(apiPath(BASE, `/collections/owner/${ownerId}`));
    return data ?? [];
};

/** @internal GET /api/media/books/collections/{id} */
export const fetchBookCollectionById = async (id: number): Promise<BookCollection> => {
    const { data } = await apiClient.get<BookCollection>(apiPath(BASE, `/collections/${id}`));
    return data;
};

/** @internal POST /api/media/books/collections */
export const postCreateBookCollection = async (collection: Partial<BookCollection>): Promise<BookCollection> => {
    const { data } = await apiClient.post<BookCollection>(apiPath(BASE, "/collections"), collection);
    return data;
};

/** @internal PUT /api/media/books/collections/{id} */
export const putUpdateBookCollection = async (id: number, collection: Partial<BookCollection>): Promise<void> => {
    await apiClient.put(apiPath(BASE, `/collections/${id}`), collection);
};

/** @internal DELETE /api/media/books/collections/{id} */
export const deleteBookCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/collections/${id}`));
};

/** @internal POST /api/media/books/collections/{collectionId}/books */
export const postAddBookToCollection = async (collectionId: number, bookId: number): Promise<void> => {
    await apiClient.post(apiPath(BASE, `/collections/${collectionId}/books`), { bookId });
};

/** DELETE /api/media/books/collections/books/{id} */
export const removeBookFromCollection = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(BASE, `/collections/books/${id}`));
};

// === React Query Hooks ===

export const useBooksQuery = (params?: Record<string, unknown>, options?: Partial<UseQueryOptions<Book[], unknown, Book[], QueryKey>>) =>
    useQuery({ queryKey: BOOKS_QK.list(params), queryFn: () => fetchBooks(params), ...options });

export const useBookQuery = (id: number) =>
    useQuery({ queryKey: BOOKS_QK.detail(id), queryFn: () => fetchBookById(id), enabled: Number.isFinite(id) });

export const useSearchOpenLibraryQuery = (query: string, options?: Partial<UseQueryOptions<ExternalBookResult[], unknown, ExternalBookResult[], QueryKey>>) =>
    useQuery({ queryKey: BOOKS_QK.searchOpenLibrary(query), queryFn: () => searchOpenLibrary(query), enabled: query.length > 1, ...options });

export const useSearchGoogleBooksQuery = (query: string, options?: Partial<UseQueryOptions<ExternalBookResult[], unknown, ExternalBookResult[], QueryKey>>) =>
    useQuery({ queryKey: BOOKS_QK.searchGoogle(query), queryFn: () => searchGoogleBooks(query), enabled: query.length > 1, ...options });

export const useBookCollectionsQuery = (ownerId: number) =>
    useQuery({ queryKey: BOOKS_QK.collections(ownerId), queryFn: () => fetchBookCollections(ownerId), enabled: Number.isFinite(ownerId) });

export const useCreateBookMutation = () => {
    const qc = useQueryClient();
    return useMutation<Book, unknown, Partial<Book>>({
        mutationFn: postCreateBook,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "books"] }); },
    });
};

export const useUpdateBookMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { id: number; book: Partial<Book> }>({
        mutationFn: ({ id, book }) => putUpdateBook(id, book),
        onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: BOOKS_QK.detail(v.id) }); qc.invalidateQueries({ queryKey: ["media", "books"] }); },
    });
};

export const useDeleteBookMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, number>({
        mutationFn: deleteBook,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "books"] }); },
    });
};

export const useImportOpenLibraryMutation = () => {
    const qc = useQueryClient();
    return useMutation<Book, unknown, string>({
        mutationFn: importFromOpenLibrary,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "books"] }); },
    });
};

export const useImportGoogleBooksMutation = () => {
    const qc = useQueryClient();
    return useMutation<Book, unknown, string>({
        mutationFn: importFromGoogleBooks,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "books"] }); },
    });
};

export const useCreateBookCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<BookCollection, unknown, Partial<BookCollection>>({
        mutationFn: postCreateBookCollection,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "books", "collections"] }); },
    });
};

export const useAddBookToCollectionMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, { collectionId: number; bookId: number }>({
        mutationFn: ({ collectionId, bookId }) => postAddBookToCollection(collectionId, bookId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ["media", "books", "collections"] }); },
    });
};
