using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a paged list of movies with optional filtering.</summary>
public record GetMoviesPagedQuery(int Page, int PageSize, string? Query = null, string? SortBy = null, bool Descending = false)
    : IRequest<(IEnumerable<Movie> Items, int TotalCount)>;
