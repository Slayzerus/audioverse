using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get all TV show collections owned by a user.</summary>
public record GetTvShowCollectionsByOwnerQuery(int OwnerId) : IRequest<IEnumerable<TvShowCollection>>;
