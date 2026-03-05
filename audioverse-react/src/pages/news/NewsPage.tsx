import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Focusable } from "../../components/common/Focusable";
import {
    useNewsCategoriesQuery,
    useNewsArticlesQuery,
} from "../../scripts/api/apiNews";
import type { NewsCategoryDto, NewsArticleDto } from "../../models/modelsNews";

/** Category icons (emoji fallback) */
const categoryIcons: Record<string, string> = {
    music: "🎵",
    sport: "⚽",
    "video-games": "🎮",
    "board-games": "🎲",
    movies: "🎬",
    "tv-series": "📺",
    technology: "💻",
    science: "🔬",
    "anime-manga": "🌸",
    books: "📚",
    automotive: "🚗",
    "art-design": "🎨",
    food: "🍕",
    travel: "✈️",
    business: "💼",
};

const NewsPage: React.FC = () => {
    const { t } = useTranslation();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>(undefined);
    const [page, setPage] = useState(1);
    const pageSize = 20;

    const { data: categories, isLoading: catLoading } = useNewsCategoriesQuery();
    const { data: articlesData, isLoading: artLoading, isFetching } = useNewsArticlesQuery(
        selectedCategoryId,
        undefined,
        page,
        pageSize,
    );

    const activeCategories = useMemo(
        () => (categories ?? []).filter(c => c.isActive),
        [categories],
    );

    const handleCategoryClick = (cat: NewsCategoryDto | null) => {
        setSelectedCategoryId(cat?.id ?? undefined);
        setPage(1);
    };

    const selectedCategory = activeCategories.find(c => c.id === selectedCategoryId);

    return (
        <div style={{ maxWidth: 1100, margin: "32px auto", padding: "0 16px" }}>
            <h1 style={{ textAlign: "center" }}>{t("news.title", "News")}</h1>
            <p className="text-muted text-center mb-4">
                {t("news.subtitle", "Stay up to date with the latest from your favourite topics.")}
            </p>

            {/* ── Category tabs ──────────────────────────────────── */}
            {catLoading ? (
                <p className="text-center">{t("common.loading", "Loading…")}</p>
            ) : (
                <div className="d-flex flex-wrap gap-2 justify-content-center mb-4">
                    <Focusable id="news-cat-all" highlightMode="glow">
                        <button
                            className={`btn btn-sm ${!selectedCategoryId ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => handleCategoryClick(null)}
                        >
                            {t("news.allCategories", "All")}
                        </button>
                    </Focusable>
                    {activeCategories.map(cat => (
                        <Focusable key={cat.id} id={`news-cat-${cat.slug}`} highlightMode="glow">
                            <button
                                className={`btn btn-sm ${selectedCategoryId === cat.id ? "btn-primary" : "btn-outline-secondary"}`}
                                onClick={() => handleCategoryClick(cat)}
                            >
                                {categoryIcons[cat.slug] ?? "📰"} {cat.name}
                            </button>
                        </Focusable>
                    ))}
                </div>
            )}

            {/* ── Selected category header ──────────────────────── */}
            {selectedCategory && (
                <div className="text-center mb-3">
                    <h4>
                        {categoryIcons[selectedCategory.slug] ?? "📰"} {selectedCategory.name}
                    </h4>
                    {selectedCategory.description && (
                        <p className="text-muted">{selectedCategory.description}</p>
                    )}
                </div>
            )}

            {/* ── Articles grid ──────────────────────────────────── */}
            {artLoading ? (
                <p className="text-center">{t("common.loading", "Loading…")}</p>
            ) : !articlesData?.items?.length ? (
                <p className="text-center text-muted">
                    {t("news.noArticles", "No articles found.")}
                </p>
            ) : (
                <>
                    <div className="row g-3">
                        {articlesData.items.map(article => (
                            <div key={article.id} className="col-12 col-md-6 col-lg-4">
                                <NewsArticleCard article={article} />
                            </div>
                        ))}
                    </div>

                    {/* ── Pagination ─────────────────────────────── */}
                    {articlesData.totalPages > 1 && (
                        <nav className="d-flex justify-content-center mt-4">
                            <ul className="pagination">
                                <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                                    <Focusable id="news-prev" highlightMode="glow">
                                        <button className="page-link" onClick={() => setPage(p => Math.max(1, p - 1))}>
                                            {t("news.prev", "← Prev")}
                                        </button>
                                    </Focusable>
                                </li>
                                <li className="page-item disabled">
                                    <span className="page-link">
                                        {t("news.pageOf", "{{page}} / {{total}}", { page, total: articlesData.totalPages })}
                                    </span>
                                </li>
                                <li className={`page-item ${page >= articlesData.totalPages ? "disabled" : ""}`}>
                                    <Focusable id="news-next" highlightMode="glow">
                                        <button className="page-link" onClick={() => setPage(p => Math.min(articlesData.totalPages, p + 1))}>
                                            {t("news.next", "Next →")}
                                        </button>
                                    </Focusable>
                                </li>
                            </ul>
                        </nav>
                    )}
                </>
            )}

            {isFetching && !artLoading && (
                <p className="text-center text-muted mt-2" style={{ fontSize: 12 }}>
                    {t("common.updating", "Updating…")}
                </p>
            )}
        </div>
    );
};

// ── Inline article card component ─────────────────────────────────
const NewsArticleCard: React.FC<{ article: NewsArticleDto }> = ({ article }) => {
    const publishedDate = article.publishedAt
        ? new Date(article.publishedAt).toLocaleDateString()
        : null;

    return (
        <Focusable id={`news-article-${article.id}`} highlightMode="glow">
            <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
            >
                <div className="card h-100" style={{ cursor: "pointer" }}>
                    {article.imageUrl && (
                        <img
                            src={article.imageUrl}
                            alt={article.title}
                            className="card-img-top"
                            style={{ height: 160, objectFit: "cover" }}
                            loading="lazy"
                        />
                    )}
                    <div className="card-body d-flex flex-column">
                        <h6 className="card-title mb-1" style={{ color: "var(--bs-body-color)" }}>
                            {article.title}
                        </h6>
                        {article.summary && (
                            <p className="card-text text-muted small flex-grow-1" style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}>
                                {article.summary}
                            </p>
                        )}
                        <div className="d-flex justify-content-between align-items-center mt-2">
                            <small className="text-muted">
                                {article.categoryName && (
                                    <span className="badge bg-secondary me-1">{article.categoryName}</span>
                                )}
                                {article.sourceName}
                            </small>
                            {publishedDate && (
                                <small className="text-muted">{publishedDate}</small>
                            )}
                        </div>
                    </div>
                </div>
            </a>
        </Focusable>
    );
};

export default NewsPage;
