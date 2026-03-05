using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a TV show collection.</summary>
public class UpdateTvShowCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateTvShowCollectionCommand, bool>
{ public Task<bool> Handle(UpdateTvShowCollectionCommand req, CancellationToken ct) => r.UpdateTvShowCollectionAsync(req.Collection); }
