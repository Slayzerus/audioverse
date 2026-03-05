using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a TV show.</summary>
public class UpdateTvShowHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateTvShowCommand, bool>
{ public Task<bool> Handle(UpdateTvShowCommand req, CancellationToken ct) => r.UpdateTvShowAsync(req.Show); }
