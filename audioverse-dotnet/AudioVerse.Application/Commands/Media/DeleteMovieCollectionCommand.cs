using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a movie collection by ID.</summary>
public record DeleteMovieCollectionCommand(int Id) : IRequest<bool>;
