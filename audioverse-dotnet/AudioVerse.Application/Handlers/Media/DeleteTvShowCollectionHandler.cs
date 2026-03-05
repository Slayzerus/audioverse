using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a TV show collection.</summary>
public class DeleteTvShowCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteTvShowCollectionCommand, bool>
{ public Task<bool> Handle(DeleteTvShowCollectionCommand req, CancellationToken ct) => r.DeleteTvShowCollectionAsync(req.Id); }
