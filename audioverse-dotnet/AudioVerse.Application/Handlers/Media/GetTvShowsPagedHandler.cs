using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles paged TV show listing.</summary>
public class GetTvShowsPagedHandler(IMediaCatalogRepository r) : IRequestHandler<GetTvShowsPagedQuery, (IEnumerable<TvShow> Items, int TotalCount)>
{ public Task<(IEnumerable<TvShow> Items, int TotalCount)> Handle(GetTvShowsPagedQuery req, CancellationToken ct) => r.GetTvShowsPagedAsync(req.Page, req.PageSize, req.Query, req.SortBy, req.Descending); }
