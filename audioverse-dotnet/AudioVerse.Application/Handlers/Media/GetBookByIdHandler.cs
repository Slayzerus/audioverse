using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a book by ID.</summary>
public class GetBookByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetBookByIdQuery, Book?>
{ public Task<Book?> Handle(GetBookByIdQuery req, CancellationToken ct) => r.GetBookByIdAsync(req.Id); }
