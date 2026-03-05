using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Delete a TV show collection by ID.</summary>
public record DeleteTvShowCollectionCommand(int Id) : IRequest<bool>;
