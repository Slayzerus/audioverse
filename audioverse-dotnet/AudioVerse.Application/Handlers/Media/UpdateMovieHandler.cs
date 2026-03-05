using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a movie.</summary>
public class UpdateMovieHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateMovieCommand, bool>
{ public Task<bool> Handle(UpdateMovieCommand req, CancellationToken ct) => r.UpdateMovieAsync(req.Movie); }
