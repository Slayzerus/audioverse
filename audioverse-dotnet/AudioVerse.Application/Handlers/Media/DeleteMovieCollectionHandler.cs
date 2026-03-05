using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a movie collection.</summary>
public class DeleteMovieCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteMovieCollectionCommand, bool>
{ public Task<bool> Handle(DeleteMovieCollectionCommand req, CancellationToken ct) => r.DeleteMovieCollectionAsync(req.Id); }
