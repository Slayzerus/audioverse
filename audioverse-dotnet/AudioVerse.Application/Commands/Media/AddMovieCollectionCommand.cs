using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Create a new movie collection.</summary>
public record AddMovieCollectionCommand(MovieCollection Collection) : IRequest<int>;
