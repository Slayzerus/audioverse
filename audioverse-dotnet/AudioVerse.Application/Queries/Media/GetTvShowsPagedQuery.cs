using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a paged list of TV shows with optional filtering.</summary>
public record GetTvShowsPagedQuery(int Page, int PageSize, string? Query = null, string? SortBy = null, bool Descending = false)
    : IRequest<(IEnumerable<TvShow> Items, int TotalCount)>;
