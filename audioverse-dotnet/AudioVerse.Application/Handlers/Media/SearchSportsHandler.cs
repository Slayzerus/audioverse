using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles sport activity search.</summary>
public class SearchSportsHandler(IMediaCatalogRepository r) : IRequestHandler<SearchSportsQuery, IEnumerable<SportActivity>>
{ public Task<IEnumerable<SportActivity>> Handle(SearchSportsQuery req, CancellationToken ct) => r.SearchSportsAsync(req.Query, req.Limit); }
