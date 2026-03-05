using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing TV show collection.</summary>
public record UpdateTvShowCollectionCommand(TvShowCollection Collection) : IRequest<bool>;
