using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Remove a TV show from a collection.</summary>
public record RemoveTvShowFromCollectionCommand(int Id) : IRequest<bool>;
