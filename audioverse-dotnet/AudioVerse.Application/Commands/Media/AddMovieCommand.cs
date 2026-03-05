using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a new movie to the catalog.</summary>
public record AddMovieCommand(Movie Movie) : IRequest<int>;
