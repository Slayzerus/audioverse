using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Create a new TV show collection.</summary>
public record AddTvShowCollectionCommand(TvShowCollection Collection) : IRequest<int>;
