using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a book to a collection.</summary>
public record AddBookToCollectionCommand(BookCollectionBook Item) : IRequest<int>;
