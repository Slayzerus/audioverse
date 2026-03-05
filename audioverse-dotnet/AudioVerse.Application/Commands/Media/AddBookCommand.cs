using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a new book to the catalog.</summary>
public record AddBookCommand(Book Book) : IRequest<int>;
