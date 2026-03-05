using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles TV show search.</summary>
public class SearchTvShowsHandler(IMediaCatalogRepository r) : IRequestHandler<SearchTvShowsQuery, IEnumerable<TvShow>>
{ public Task<IEnumerable<TvShow>> Handle(SearchTvShowsQuery req, CancellationToken ct) => r.SearchTvShowsAsync(req.Query, req.Limit); }
