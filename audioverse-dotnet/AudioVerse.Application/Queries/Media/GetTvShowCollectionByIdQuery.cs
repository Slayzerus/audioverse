using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a TV show collection by ID with optional hierarchy.</summary>
public record GetTvShowCollectionByIdQuery(int Id, bool IncludeChildren = false, int MaxDepth = 1) : IRequest<TvShowCollection?>;
