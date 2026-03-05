using AudioVerse.Application.Commands.Media;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Media;

/// <summary>Handles adding a sport activity.</summary>
public class AddSportHandler(IMediaCatalogRepository r) : IRequestHandler<AddSportCommand, int>
{ public Task<int> Handle(AddSportCommand req, CancellationToken ct) => r.AddSportAsync(req.Sport); }
