using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a paged list of sport activities with optional filtering.</summary>
public record GetSportsPagedQuery(int Page, int PageSize, string? Query = null, string? SortBy = null, bool Descending = false)
    : IRequest<(IEnumerable<SportActivity> Items, int TotalCount)>;
