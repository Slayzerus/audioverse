using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles movie search.</summary>
public class SearchMoviesHandler(IMediaCatalogRepository r) : IRequestHandler<SearchMoviesQuery, IEnumerable<Movie>>
{ public Task<IEnumerable<Movie>> Handle(SearchMoviesQuery req, CancellationToken ct) => r.SearchMoviesAsync(req.Query, req.Limit); }
