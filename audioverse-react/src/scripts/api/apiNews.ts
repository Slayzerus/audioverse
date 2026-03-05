// apiNews.ts — News categories, articles, and feed management
import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from "@tanstack/react-query";
import { apiClient, apiPath } from "./audioverseApiClient";
import type {
    NewsCategoryDto,
    NewsArticleDto,
    NewsFeedDto,
    CreateNewsFeedRequest,
    CreateNewsCategoryRequest,
    PaginatedResponse,
} from "../../models/modelsNews";

// === Base path ===
export const NEWS_BASE = "/api/news";

// === Query Keys ===
/** @internal  use React Query hooks below */
export const NEWS_QK = {
    categories: () => ["news", "categories"] as const,
    articles: (categoryId?: number, feedId?: number, page?: number, pageSize?: number) =>
        ["news", "articles", { categoryId, feedId, page, pageSize }] as const,
    bySlug: (slug: string, page?: number, pageSize?: number) =>
        ["news", "bySlug", slug, { page, pageSize }] as const,
    feeds: () => ["news", "feeds"] as const,
};

// ── Public endpoints ──────────────────────────────────────────────

/** @internal GET /api/news/categories */
export const fetchNewsCategories = async (): Promise<NewsCategoryDto[]> => {
    const { data } = await apiClient.get<NewsCategoryDto[]>(apiPath(NEWS_BASE, "/categories"));
    return data ?? [];
};

/** @internal GET /api/news/articles?categoryId=&feedId=&page=&pageSize= */
export const fetchNewsArticles = async (
    categoryId?: number,
    feedId?: number,
    page = 1,
    pageSize = 20,
): Promise<PaginatedResponse<NewsArticleDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<NewsArticleDto>>(
        apiPath(NEWS_BASE, "/articles"),
        { params: { categoryId, feedId, page, pageSize } },
    );
    return data;
};

/** @internal GET /api/news/{slug} — articles by category slug (paginated) */
export const fetchNewsBySlug = async (
    slug: string,
    page = 1,
    pageSize = 20,
): Promise<PaginatedResponse<NewsArticleDto>> => {
    const { data } = await apiClient.get<PaginatedResponse<NewsArticleDto>>(
        apiPath(NEWS_BASE, `/${encodeURIComponent(slug)}`),
        { params: { page, pageSize } },
    );
    return data;
};

/** @internal GET /api/news/feeds */
export const fetchNewsFeeds = async (): Promise<NewsFeedDto[]> => {
    const { data } = await apiClient.get<NewsFeedDto[]>(apiPath(NEWS_BASE, "/feeds"));
    return data ?? [];
};

// ── Admin endpoints ───────────────────────────────────────────────

/** @internal POST /api/news/feeds — create a new RSS feed */
export const postNewsFeed = async (body: CreateNewsFeedRequest): Promise<NewsFeedDto> => {
    const { data } = await apiClient.post<NewsFeedDto>(apiPath(NEWS_BASE, "/feeds"), body);
    return data;
};

/** @internal PATCH /api/news/feeds/{id}/toggle — enable/disable feed */
export const patchToggleNewsFeed = async (id: number): Promise<void> => {
    await apiClient.patch(apiPath(NEWS_BASE, `/feeds/${id}/toggle`));
};

/** @internal DELETE /api/news/feeds/{id} — delete a feed */
export const deleteNewsFeed = async (id: number): Promise<void> => {
    await apiClient.delete(apiPath(NEWS_BASE, `/feeds/${id}`));
};

/** @internal POST /api/news/categories — create a new category */
export const postNewsCategory = async (body: CreateNewsCategoryRequest): Promise<NewsCategoryDto> => {
    const { data } = await apiClient.post<NewsCategoryDto>(apiPath(NEWS_BASE, "/categories"), body);
    return data;
};

/** @internal PATCH /api/news/categories/{id}/toggle — enable/disable category */
export const patchToggleNewsCategory = async (id: number): Promise<void> => {
    await apiClient.patch(apiPath(NEWS_BASE, `/categories/${id}/toggle`));
};

// === React Query Hooks ===

export const useNewsCategoriesQuery = () =>
    useQuery({
        queryKey: NEWS_QK.categories(),
        queryFn: fetchNewsCategories,
        staleTime: 5 * 60 * 1000,
    });

export const useNewsArticlesQuery = (
    categoryId?: number,
    feedId?: number,
    page = 1,
    pageSize = 20,
) =>
    useQuery({
        queryKey: NEWS_QK.articles(categoryId, feedId, page, pageSize),
        queryFn: () => fetchNewsArticles(categoryId, feedId, page, pageSize),
        placeholderData: keepPreviousData,
    });

export const useNewsBySlugQuery = (slug: string, page = 1, pageSize = 20) =>
    useQuery({
        queryKey: NEWS_QK.bySlug(slug, page, pageSize),
        queryFn: () => fetchNewsBySlug(slug, page, pageSize),
        enabled: !!slug,
        placeholderData: keepPreviousData,
    });

export const useNewsFeedsQuery = () =>
    useQuery({
        queryKey: NEWS_QK.feeds(),
        queryFn: fetchNewsFeeds,
    });

// ── Mutations ─────────────────────────────────────────────────────

export const useCreateFeedMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateNewsFeedRequest) => postNewsFeed(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: NEWS_QK.feeds() });
        },
    });
};

export const useToggleFeedMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => patchToggleNewsFeed(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: NEWS_QK.feeds() });
        },
    });
};

export const useDeleteFeedMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => deleteNewsFeed(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: NEWS_QK.feeds() });
            qc.invalidateQueries({ queryKey: NEWS_QK.articles() });
        },
    });
};

export const useCreateCategoryMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: CreateNewsCategoryRequest) => postNewsCategory(body),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: NEWS_QK.categories() });
        },
    });
};

export const useToggleCategoryMutation = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => patchToggleNewsCategory(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: NEWS_QK.categories() });
        },
    });
};

export default {
    fetchNewsCategories,
    fetchNewsArticles,
    fetchNewsBySlug,
    fetchNewsFeeds,
    postNewsFeed,
    patchToggleNewsFeed,
    deleteNewsFeed,
    postNewsCategory,
    patchToggleNewsCategory,
};
