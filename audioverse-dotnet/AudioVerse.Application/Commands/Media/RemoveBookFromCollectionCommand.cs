using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Remove a book from a collection.</summary>
public record RemoveBookFromCollectionCommand(int Id) : IRequest<bool>;
