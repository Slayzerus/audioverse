using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a TV show by ID.</summary>
public class GetTvShowByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetTvShowByIdQuery, TvShow?>
{ public Task<TvShow?> Handle(GetTvShowByIdQuery req, CancellationToken ct) => r.GetTvShowByIdAsync(req.Id); }
