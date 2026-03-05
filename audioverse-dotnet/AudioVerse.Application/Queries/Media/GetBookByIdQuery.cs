using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a single book by ID.</summary>
public record GetBookByIdQuery(int Id) : IRequest<Book?>;
