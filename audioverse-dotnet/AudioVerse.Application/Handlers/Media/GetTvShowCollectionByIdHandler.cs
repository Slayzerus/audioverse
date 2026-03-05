using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a TV show collection by ID.</summary>
public class GetTvShowCollectionByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetTvShowCollectionByIdQuery, TvShowCollection?>
{ public Task<TvShowCollection?> Handle(GetTvShowCollectionByIdQuery req, CancellationToken ct) => r.GetTvShowCollectionByIdAsync(req.Id, req.IncludeChildren, req.MaxDepth); }
