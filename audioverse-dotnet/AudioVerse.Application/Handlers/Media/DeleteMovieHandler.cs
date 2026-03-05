using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a movie.</summary>
public class DeleteMovieHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteMovieCommand, bool>
{ public Task<bool> Handle(DeleteMovieCommand req, CancellationToken ct) => r.DeleteMovieAsync(req.Id); }
