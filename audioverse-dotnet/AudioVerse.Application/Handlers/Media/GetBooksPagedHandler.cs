using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles paged book listing.</summary>
public class GetBooksPagedHandler(IMediaCatalogRepository r) : IRequestHandler<GetBooksPagedQuery, (IEnumerable<Book> Items, int TotalCount)>
{ public Task<(IEnumerable<Book> Items, int TotalCount)> Handle(GetBooksPagedQuery req, CancellationToken ct) => r.GetBooksPagedAsync(req.Page, req.PageSize, req.Query, req.SortBy, req.Descending); }
