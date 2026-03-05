using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a movie collection.</summary>
public class UpdateMovieCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateMovieCollectionCommand, bool>
{ public Task<bool> Handle(UpdateMovieCollectionCommand req, CancellationToken ct) => r.UpdateMovieCollectionAsync(req.Collection); }
