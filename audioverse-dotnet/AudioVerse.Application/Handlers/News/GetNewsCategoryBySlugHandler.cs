using AudioVerse.Application.Queries.News;
using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles retrieving a news category by slug.</summary>
public class GetNewsCategoryBySlugHandler(INewsFeedRepository r) : IRequestHandler<GetNewsCategoryBySlugQuery, NewsFeedCategory?>
{ public async Task<NewsFeedCategory?> Handle(GetNewsCategoryBySlugQuery req, CancellationToken ct) => await r.GetCategoryBySlugAsync(req.Slug); }
