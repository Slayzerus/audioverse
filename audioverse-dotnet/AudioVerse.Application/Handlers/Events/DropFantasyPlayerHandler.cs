using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles dropping a player from a fantasy team.</summary>
public class DropFantasyPlayerHandler(ILeagueRepository repo) : IRequestHandler<DropFantasyPlayerCommand, bool>
{
    public Task<bool> Handle(DropFantasyPlayerCommand req, CancellationToken ct) =>
        repo.RemoveFantasyPlayerAsync(req.PlayerId);
}
