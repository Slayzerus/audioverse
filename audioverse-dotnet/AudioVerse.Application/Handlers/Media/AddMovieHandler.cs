using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a movie to the catalog.</summary>
public class AddMovieHandler(IMediaCatalogRepository r) : IRequestHandler<AddMovieCommand, int>
{ public Task<int> Handle(AddMovieCommand req, CancellationToken ct) => r.AddMovieAsync(req.Movie); }
