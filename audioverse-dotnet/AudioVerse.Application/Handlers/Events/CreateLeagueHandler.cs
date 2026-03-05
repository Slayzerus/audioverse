using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles creating a league.</summary>
public class CreateLeagueHandler(ILeagueRepository repo) : IRequestHandler<CreateLeagueCommand, int>
{
    public Task<int> Handle(CreateLeagueCommand req, CancellationToken ct) =>
        repo.CreateLeagueAsync(req.League);
}
