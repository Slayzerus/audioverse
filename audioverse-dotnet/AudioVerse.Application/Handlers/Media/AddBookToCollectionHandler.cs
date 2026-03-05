using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a book to a collection.</summary>
public class AddBookToCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<AddBookToCollectionCommand, int>
{ public Task<int> Handle(AddBookToCollectionCommand req, CancellationToken ct) => r.AddBookToCollectionAsync(req.Item); }
