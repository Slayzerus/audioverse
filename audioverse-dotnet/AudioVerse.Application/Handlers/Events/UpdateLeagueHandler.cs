using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles updating a league.</summary>
public class UpdateLeagueHandler(ILeagueRepository repo) : IRequestHandler<UpdateLeagueCommand, bool>
{
    public Task<bool> Handle(UpdateLeagueCommand req, CancellationToken ct) =>
        repo.UpdateLeagueAsync(req.League);
}
