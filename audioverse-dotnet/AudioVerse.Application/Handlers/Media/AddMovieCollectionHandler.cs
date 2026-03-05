using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles creating a movie collection.</summary>
public class AddMovieCollectionHandler(IMediaCatalogRepository r) : IRequestHandler<AddMovieCollectionCommand, int>
{ public Task<int> Handle(AddMovieCollectionCommand req, CancellationToken ct) => r.AddMovieCollectionAsync(req.Collection); }
