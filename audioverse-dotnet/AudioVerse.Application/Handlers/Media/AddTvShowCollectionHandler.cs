using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles creating a TV show collection.</summary>
public class AddTvShowCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<AddTvShowCollectionCommand, int>
{ public Task<int> Handle(AddTvShowCollectionCommand req, CancellationToken ct) => r.AddTvShowCollectionAsync(req.Collection); }
