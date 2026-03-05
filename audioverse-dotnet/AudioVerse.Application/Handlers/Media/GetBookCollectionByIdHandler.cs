using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a book collection by ID.</summary>
public class GetBookCollectionByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetBookCollectionByIdQuery, BookCollection?>
{ public Task<BookCollection?> Handle(GetBookCollectionByIdQuery req, CancellationToken ct) => r.GetBookCollectionByIdAsync(req.Id, req.IncludeChildren, req.MaxDepth); }
