using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing book collection.</summary>
public record UpdateBookCollectionCommand(BookCollection Collection) : IRequest<bool>;
