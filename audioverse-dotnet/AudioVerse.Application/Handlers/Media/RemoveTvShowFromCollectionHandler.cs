using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles removing a TV show from a collection.</summary>
public class RemoveTvShowFromCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<RemoveTvShowFromCollectionCommand, bool>
{ public Task<bool> Handle(RemoveTvShowFromCollectionCommand req, CancellationToken ct) => r.RemoveTvShowFromCollectionAsync(req.Id); }
