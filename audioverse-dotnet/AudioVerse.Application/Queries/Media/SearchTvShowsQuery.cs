using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Search TV shows by title.</summary>
public record SearchTvShowsQuery(string Query, int Limit = 20) : IRequest<IEnumerable<TvShow>>;
