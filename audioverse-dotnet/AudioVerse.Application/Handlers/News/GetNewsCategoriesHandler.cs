using AudioVerse.Application.Queries.News;
using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles retrieving news categories.</summary>
public class GetNewsCategoriesHandler(INewsFeedRepository r) : IRequestHandler<GetNewsCategoriesQuery, IEnumerable<NewsFeedCategory>>
{ public async Task<IEnumerable<NewsFeedCategory>> Handle(GetNewsCategoriesQuery req, CancellationToken ct) => await r.GetCategoriesAsync(req.ActiveOnly); }
