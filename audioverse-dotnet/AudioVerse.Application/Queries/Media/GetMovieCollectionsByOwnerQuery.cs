using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get all movie collections owned by a user.</summary>
public record GetMovieCollectionsByOwnerQuery(int OwnerId) : IRequest<IEnumerable<MovieCollection>>;
