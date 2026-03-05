using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing movie.</summary>
public record UpdateMovieCommand(Movie Movie) : IRequest<bool>;
