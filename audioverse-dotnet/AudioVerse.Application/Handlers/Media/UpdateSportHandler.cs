using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles updating a sport activity.</summary>
public class UpdateSportHandler(IMediaCatalogRepository r) : IRequestHandler<UpdateSportCommand, bool>
{ public Task<bool> Handle(UpdateSportCommand req, CancellationToken ct) => r.UpdateSportAsync(req.Sport); }
