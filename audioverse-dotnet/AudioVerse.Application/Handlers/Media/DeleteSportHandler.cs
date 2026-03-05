using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles deleting a sport activity.</summary>
public class DeleteSportHandler(IMediaCatalogRepository r) : IRequestHandler<DeleteSportCommand, bool>
{ public Task<bool> Handle(DeleteSportCommand req, CancellationToken ct) => r.DeleteSportAsync(req.Id); }
