using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a movie to a collection.</summary>
public record AddMovieToCollectionCommand(MovieCollectionMovie Item) : IRequest<int>;
