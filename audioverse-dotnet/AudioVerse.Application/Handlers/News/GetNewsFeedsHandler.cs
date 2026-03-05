using AudioVerse.Application.Queries.News;
using AudioVerse.Domain.Entities.News;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.News;

/// <summary>Handles retrieving RSS feeds.</summary>
public class GetNewsFeedsHandler(INewsFeedRepository r) : IRequestHandler<GetNewsFeedsQuery, IEnumerable<NewsFeed>>
{ public async Task<IEnumerable<NewsFeed>> Handle(GetNewsFeedsQuery req, CancellationToken ct) => await r.GetFeedsAsync(req.ActiveOnly); }
