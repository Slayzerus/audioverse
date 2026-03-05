using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles paged movie listing.</summary>
public class GetMoviesPagedHandler(IMediaCatalogRepository r) : IRequestHandler<GetMoviesPagedQuery, (IEnumerable<Movie> Items, int TotalCount)>
{ public Task<(IEnumerable<Movie> Items, int TotalCount)> Handle(GetMoviesPagedQuery req, CancellationToken ct) => r.GetMoviesPagedAsync(req.Page, req.PageSize, req.Query, req.SortBy, req.Descending); }
