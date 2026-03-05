using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles deleting a league.</summary>
public class DeleteLeagueHandler(ILeagueRepository repo) : IRequestHandler<DeleteLeagueCommand, bool>
{
    public Task<bool> Handle(DeleteLeagueCommand req, CancellationToken ct) =>
        repo.DeleteLeagueAsync(req.Id);
}
