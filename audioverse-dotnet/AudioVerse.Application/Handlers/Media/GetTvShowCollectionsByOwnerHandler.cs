using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles listing TV show collections by owner.</summary>
public class GetTvShowCollectionsByOwnerHandler(IMediaCatalogRepository r) : IRequestHandler<GetTvShowCollectionsByOwnerQuery, IEnumerable<TvShowCollection>>
{ public Task<IEnumerable<TvShowCollection>> Handle(GetTvShowCollectionsByOwnerQuery req, CancellationToken ct) => r.GetTvShowCollectionsByOwnerAsync(req.OwnerId); }
