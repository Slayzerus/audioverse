using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get all book collections owned by a user.</summary>
public record GetBookCollectionsByOwnerQuery(int OwnerId) : IRequest<IEnumerable<BookCollection>>;
