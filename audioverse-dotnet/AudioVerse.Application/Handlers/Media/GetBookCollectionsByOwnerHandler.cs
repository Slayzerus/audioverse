using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles listing book collections by owner.</summary>
public class GetBookCollectionsByOwnerHandler(IMediaCatalogRepository r) : IRequestHandler<GetBookCollectionsByOwnerQuery, IEnumerable<BookCollection>>
{ public Task<IEnumerable<BookCollection>> Handle(GetBookCollectionsByOwnerQuery req, CancellationToken ct) => r.GetBookCollectionsByOwnerAsync(req.OwnerId); }
