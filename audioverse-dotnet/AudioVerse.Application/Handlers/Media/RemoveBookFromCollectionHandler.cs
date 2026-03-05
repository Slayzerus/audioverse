using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles removing a book from a collection.</summary>
public class RemoveBookFromCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<RemoveBookFromCollectionCommand, bool>
{ public Task<bool> Handle(RemoveBookFromCollectionCommand req, CancellationToken ct) => r.RemoveBookFromCollectionAsync(req.Id); }
