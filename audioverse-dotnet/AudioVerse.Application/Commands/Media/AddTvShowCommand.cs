using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Add a new TV show to the catalog.</summary>
public record AddTvShowCommand(TvShow Show) : IRequest<int>;
