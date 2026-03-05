using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Commands.Media;

/// <summary>Update an existing TV show.</summary>
public record UpdateTvShowCommand(TvShow Show) : IRequest<bool>;
