// modelsNews.ts — News / RSS feed DTOs

/** GET /api/news/categories → NewsCategoryDto[] */
export interface NewsCategoryDto {
    id: number;
    slug: string;
    name: string;
    description: string | null;
    iconUrl: string | null;
    isActive: boolean;
    feedCount: number;
}

/** GET /api/news/articles → paginated NewsArticleDto[] */
export interface NewsArticleDto {
    id: number;
    title: string;
    slug: string;
    summary: string | null;
    content: string | null;
    imageUrl: string | null;
    sourceUrl: string;
    sourceName: string | null;
    publishedAt: string;
    categoryId: number;
    categorySlug: string | null;
    categoryName: string | null;
    feedId: number | null;
}

/** GET /api/news/feeds → NewsFeedDto[] */
export interface NewsFeedDto {
    id: number;
    title: string;
    feedUrl: string;
    siteUrl: string | null;
    logoUrl: string | null;
    language: string | null;
    categoryId: number;
    categorySlug: string | null;
    isActive: boolean;
    lastFetchedAt: string | null;
    articleCount: number;
    refreshIntervalMinutes: number | null;
}

/** POST /api/news/feeds — request body */
export interface CreateNewsFeedRequest {
    title: string;
    feedUrl: string;
    siteUrl?: string | null;
    logoUrl?: string | null;
    language?: string | null;
    categoryId: number;
    refreshIntervalMinutes?: number | null;
}

/** POST /api/news/categories — request body */
export interface CreateNewsCategoryRequest {
    slug: string;
    name: string;
    description?: string | null;
}

/** Paginated API response wrapper */
export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

/** Well-known category slugs */
export const NEWS_CATEGORY_SLUGS = [
    "music",
    "sport",
    "video-games",
    "board-games",
    "movies",
    "tv-series",
    "technology",
    "science",
    "anime-manga",
    "books",
    "automotive",
    "art-design",
    "food",
    "travel",
    "business",
] as const;

export type NewsCategorySlug = (typeof NEWS_CATEGORY_SLUGS)[number];
