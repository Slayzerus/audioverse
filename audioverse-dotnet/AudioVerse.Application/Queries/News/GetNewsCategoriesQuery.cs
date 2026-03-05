using AudioVerse.Domain.Entities.News;
using MediatR;

namespace AudioVerse.Application.Queries.News;

/// <summary>Get news categories (optionally active only).</summary>
public record GetNewsCategoriesQuery(bool ActiveOnly = true) : IRequest<IEnumerable<NewsFeedCategory>>;
