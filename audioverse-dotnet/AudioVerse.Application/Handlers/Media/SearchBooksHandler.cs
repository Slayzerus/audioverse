using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles book search.</summary>
public class SearchBooksHandler(IMediaCatalogRepository r) : IRequestHandler<SearchBooksQuery, IEnumerable<Book>>
{ public Task<IEnumerable<Book>> Handle(SearchBooksQuery req, CancellationToken ct) => r.SearchBooksAsync(req.Query, req.Limit); }
