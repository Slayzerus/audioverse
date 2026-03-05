using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles creating a fantasy team.</summary>
public class CreateFantasyTeamHandler(ILeagueRepository repo) : IRequestHandler<CreateFantasyTeamCommand, int>
{
    public Task<int> Handle(CreateFantasyTeamCommand req, CancellationToken ct) =>
        repo.CreateFantasyTeamAsync(req.Team);
}
