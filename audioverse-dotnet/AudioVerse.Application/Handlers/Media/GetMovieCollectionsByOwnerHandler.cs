using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles listing movie collections by owner.</summary>
public class GetMovieCollectionsByOwnerHandler(IMediaCatalogRepository r) : IRequestHandler<GetMovieCollectionsByOwnerQuery, IEnumerable<MovieCollection>>
{ public Task<IEnumerable<MovieCollection>> Handle(GetMovieCollectionsByOwnerQuery req, CancellationToken ct) => r.GetMovieCollectionsByOwnerAsync(req.OwnerId); }
