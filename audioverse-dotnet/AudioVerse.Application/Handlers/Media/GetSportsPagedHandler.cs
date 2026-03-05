using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles paged sport activity listing.</summary>
public class GetSportsPagedHandler(IMediaCatalogRepository r) : IRequestHandler<GetSportsPagedQuery, (IEnumerable<SportActivity> Items, int TotalCount)>
{ public Task<(IEnumerable<SportActivity> Items, int TotalCount)> Handle(GetSportsPagedQuery req, CancellationToken ct) => r.GetSportsPagedAsync(req.Page, req.PageSize, req.Query, req.SortBy, req.Descending); }
