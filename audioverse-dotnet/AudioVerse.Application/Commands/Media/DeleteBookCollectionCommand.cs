using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a book collection by ID.</summary>
public record DeleteBookCollectionCommand(int Id) : IRequest<bool>;
