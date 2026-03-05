using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a TV show to a collection.</summary>
public record AddTvShowToCollectionCommand(TvShowCollectionTvShow Item) : IRequest<int>;
