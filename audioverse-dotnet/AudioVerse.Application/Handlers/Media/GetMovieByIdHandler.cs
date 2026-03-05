using AudioVerse.Application.Queries.Media;
using AudioVerse.Domain.Entities.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles retrieving a movie by ID.</summary>
public class GetMovieByIdHandler(IMediaCatalogRepository r) : IRequestHandler<GetMovieByIdQuery, Movie?>
{ public Task<Movie?> Handle(GetMovieByIdQuery req, CancellationToken ct) => r.GetMovieByIdAsync(req.Id); }
