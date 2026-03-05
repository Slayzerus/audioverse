using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Search movies by title.</summary>
public record SearchMoviesQuery(string Query, int Limit = 20) : IRequest<IEnumerable<Movie>>;
