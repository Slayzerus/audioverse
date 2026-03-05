using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a single TV show by ID.</summary>
public record GetTvShowByIdQuery(int Id) : IRequest<TvShow?>;
