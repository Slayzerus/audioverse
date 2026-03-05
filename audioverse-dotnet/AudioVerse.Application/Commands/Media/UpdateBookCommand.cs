using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing book.</summary>
public record UpdateBookCommand(Book Book) : IRequest<bool>;
