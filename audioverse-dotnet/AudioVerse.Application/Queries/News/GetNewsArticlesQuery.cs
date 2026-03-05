using AudioVerse.Domain.Entities.News;
using MediatR;

namespace AudioVerse.Application.Queries.News;

/// <summary>Get news articles with pagination and optional category/feed filter.</summary>
public record GetNewsArticlesQuery(int? CategoryId = null, int? FeedId = null, int Page = 1, int PageSize = 20)
    : IRequest<(IEnumerable<NewsArticle> Items, int TotalCount)>;
