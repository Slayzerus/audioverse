using AudioVerse.Domain.Entities.News;
using MediatR;

namespace AudioVerse.Application.Queries.News;

/// <summary>Get a news category by slug.</summary>
public record GetNewsCategoryBySlugQuery(string Slug) : IRequest<NewsFeedCategory?>;
