using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a TV show to a collection.</summary>
public class AddTvShowToCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<AddTvShowToCollectionCommand, int>
{ public Task<int> Handle(AddTvShowToCollectionCommand req, CancellationToken ct) => r.AddTvShowToCollectionAsync(req.Item); }
