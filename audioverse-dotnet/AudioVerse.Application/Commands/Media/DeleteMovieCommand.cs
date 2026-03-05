using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a movie by ID.</summary>
public record DeleteMovieCommand(int Id) : IRequest<bool>;
