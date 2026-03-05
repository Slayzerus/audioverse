using AudioVerse.Domain.Entities.News;
using MediatR;

namespace AudioVerse.Application.Queries.News;

/// <summary>Get RSS feeds (optionally active only).</summary>
public record GetNewsFeedsQuery(bool ActiveOnly = true) : IRequest<IEnumerable<NewsFeed>>;
