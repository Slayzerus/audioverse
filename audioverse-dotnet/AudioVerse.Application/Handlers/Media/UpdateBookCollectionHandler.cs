using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a book collection.</summary>
public class UpdateBookCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateBookCollectionCommand, bool>
{ public Task<bool> Handle(UpdateBookCollectionCommand req, CancellationToken ct) => r.UpdateBookCollectionAsync(req.Collection); }
