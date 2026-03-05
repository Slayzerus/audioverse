using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a movie collection by ID.</summary>
public class GetMovieCollectionByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetMovieCollectionByIdQuery, MovieCollection?>
{ public Task<MovieCollection?> Handle(GetMovieCollectionByIdQuery req, CancellationToken ct) => r.GetMovieCollectionByIdAsync(req.Id, req.IncludeChildren, req.MaxDepth); }
