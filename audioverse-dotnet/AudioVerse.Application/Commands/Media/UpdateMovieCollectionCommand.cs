using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing movie collection.</summary>
public record UpdateMovieCollectionCommand(MovieCollection Collection) : IRequest<bool>;
