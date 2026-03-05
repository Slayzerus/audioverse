using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a movie to a collection.</summary>
public class AddMovieToCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<AddMovieToCollectionCommand, int>
{ public Task<int> Handle(AddMovieToCollectionCommand req, CancellationToken ct) => r.AddMovieToCollectionAsync(req.Item); }
