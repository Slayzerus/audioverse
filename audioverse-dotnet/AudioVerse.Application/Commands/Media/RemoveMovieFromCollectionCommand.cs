using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Remove a movie from a collection.</summary>
public record RemoveMovieFromCollectionCommand(int Id) : IRequest<bool>;
