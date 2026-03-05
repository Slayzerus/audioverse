using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a TV show.</summary>
public class DeleteTvShowHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteTvShowCommand, bool>
{ public Task<bool> Handle(DeleteTvShowCommand req, CancellationToken ct) => r.DeleteTvShowAsync(req.Id); }
