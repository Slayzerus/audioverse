using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a book by ID.</summary>
public record DeleteBookCommand(int Id) : IRequest<bool>;
