using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a book collection.</summary>
public class DeleteBookCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteBookCollectionCommand, bool>
{ public Task<bool> Handle(DeleteBookCollectionCommand req, CancellationToken ct) => r.DeleteBookCollectionAsync(req.Id); }
