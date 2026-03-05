using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a book collection by ID with optional hierarchy.</summary>
public record GetBookCollectionByIdQuery(int Id, bool IncludeChildren = false, int MaxDepth = 1) : IRequest<BookCollection?>;
