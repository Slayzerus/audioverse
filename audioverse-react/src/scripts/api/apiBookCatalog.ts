// apiBookCatalog.ts — Book Catalog search & management API
import {
    useQuery,
    useMutation,
    useQueryClient,
    UseQueryOptions,
    QueryKey,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";

// === Base path ===
export const BOOKS_BASE = "/api/books";

// === Models ===

export interface CatalogBook {
    id: number;
    title: string;
    author?: string;
    description?: string;
    isbn?: string;
    pageCount?: number;
    publishedYear?: number;
    publisher?: string;
    coverUrl?: string;
    genre?: string;
    rating?: number;
    language?: string;
    googleBooksId?: string;
    openLibraryId?: string;
}

// === Query Keys ===

export const BOOK_CATALOG_QK = {
    search: (query: string, limit?: number) => ["book-catalog", "search", query, limit] as const,
    details: (googleBooksId: string) => ["book-catalog", "details", googleBooksId] as const,
    export: ["book-catalog", "export"] as const,
};

// === Fetch functions ===

/** @internal GET /api/books/search?q=...&limit=20 — Cache-through search */
export const fetchBookSearch = async (query: string, limit = 20): Promise<CatalogBook[]> => {
    const { data } = await apiClient.get<CatalogBook[]>(apiPath(BOOKS_BASE, "/search"), {
        params: { q: query, limit },
    });
    return data ?? [];
};

/** @internal GET /api/books/google/{googleBooksId} — Details by Google Books ID */
export const fetchBookDetails = async (googleBooksId: string): Promise<CatalogBook> => {
    const { data } = await apiClient.get<CatalogBook>(
        apiPath(BOOKS_BASE, `/google/${encodeURIComponent(googleBooksId)}`),
    );
    return data;
};

/** @internal GET /api/books/export — Export catalog */
export const fetchBookExport = async (): Promise<CatalogBook[]> => {
    const { data } = await apiClient.get<CatalogBook[]>(apiPath(BOOKS_BASE, "/export"));
    return data ?? [];
};

/** @internal POST /api/books/import — Import catalog */
export const postImportBookCatalog = async (books: CatalogBook[]): Promise<void> => {
    await apiClient.post(apiPath(BOOKS_BASE, "/import"), books);
};

// === React Query hooks ===

/** GET /api/books/search — enabled when query.length >= 2 */
export const useBookSearchQuery = (
    query: string,
    limit?: number,
    options?: Partial<UseQueryOptions<CatalogBook[], unknown, CatalogBook[], QueryKey>>,
) =>
    useQuery({
        queryKey: BOOK_CATALOG_QK.search(query, limit),
        queryFn: () => fetchBookSearch(query, limit),
        enabled: query.length >= 2,
        ...options,
    });

/** GET /api/books/google/{googleBooksId} — Details by Google Books ID */
export const useBookDetailsQuery = (
    googleBooksId: string,
    options?: Partial<UseQueryOptions<CatalogBook, unknown, CatalogBook, QueryKey>>,
) =>
    useQuery({
        queryKey: BOOK_CATALOG_QK.details(googleBooksId),
        queryFn: () => fetchBookDetails(googleBooksId),
        enabled: !!googleBooksId,
        ...options,
    });

/** GET /api/books/export — manually enabled */
export const useBookExportQuery = (
    enabled: boolean,
    options?: Partial<UseQueryOptions<CatalogBook[], unknown, CatalogBook[], QueryKey>>,
) =>
    useQuery({
        queryKey: BOOK_CATALOG_QK.export,
        queryFn: fetchBookExport,
        enabled,
        ...options,
    });

/** POST /api/books/import — import catalog (body: CatalogBook[]) */
export const useImportBookCatalogMutation = () => {
    const qc = useQueryClient();
    return useMutation<void, unknown, CatalogBook[]>({
        mutationFn: (books) => postImportBookCatalog(books),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: BOOK_CATALOG_QK.search("") });
            qc.invalidateQueries({ queryKey: BOOK_CATALOG_QK.export });
        },
    });
};
