using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Create a new book collection (book club shelf, reading list).</summary>
public record AddBookCollectionCommand(BookCollection Collection) : IRequest<int>;
