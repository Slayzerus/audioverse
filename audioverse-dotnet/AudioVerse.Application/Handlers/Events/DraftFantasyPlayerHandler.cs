using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles drafting a player to a fantasy team.</summary>
public class DraftFantasyPlayerHandler(ILeagueRepository repo) : IRequestHandler<DraftFantasyPlayerCommand, int>
{
    public Task<int> Handle(DraftFantasyPlayerCommand req, CancellationToken ct) =>
        repo.AddFantasyPlayerAsync(req.Player);
}
