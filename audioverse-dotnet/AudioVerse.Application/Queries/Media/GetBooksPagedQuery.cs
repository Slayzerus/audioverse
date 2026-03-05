using AudioVerse.Domain.Entities.Media;
using MediatR;

namespace AudioVerse.Application.Queries.Media;

/// <summary>Get a paged list of books with optional filtering.</summary>
public record GetBooksPagedQuery(int Page, int PageSize, string? Query = null, string? SortBy = null, bool Descending = false)
    : IRequest<(IEnumerable<Book> Items, int TotalCount)>;
