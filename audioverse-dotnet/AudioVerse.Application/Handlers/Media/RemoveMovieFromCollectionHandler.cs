using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles removing a movie from a collection.</summary>
public class RemoveMovieFromCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<RemoveMovieFromCollectionCommand, bool>
{ public Task<bool> Handle(RemoveMovieFromCollectionCommand req, CancellationToken ct) => r.RemoveMovieFromCollectionAsync(req.Id); }
