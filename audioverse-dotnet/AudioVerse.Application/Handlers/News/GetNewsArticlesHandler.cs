using AudioVerse.Application.Queries.News;
using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles retrieving news articles with pagination.</summary>
public class GetNewsArticlesHandler(INewsFeedRepository r) : IRequestHandler<GetNewsArticlesQuery, (IEnumerable<NewsArticle> Items, int TotalCount)>
{
    public async Task<(IEnumerable<NewsArticle> Items, int TotalCount)> Handle(GetNewsArticlesQuery req, CancellationToken ct)
    {
        var items = await r.GetArticlesAsync(req.CategoryId, req.FeedId, req.Page, req.PageSize);
        var total = await r.GetArticlesCountAsync(req.CategoryId, req.FeedId);
        return (items, total);
    }
}
