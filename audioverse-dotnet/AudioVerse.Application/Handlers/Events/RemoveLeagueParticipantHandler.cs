using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles removing a participant from a league.</summary>
public class RemoveLeagueParticipantHandler(ILeagueRepository repo) : IRequestHandler<RemoveLeagueParticipantCommand, bool>
{
    public Task<bool> Handle(RemoveLeagueParticipantCommand req, CancellationToken ct) =>
        repo.RemoveParticipantAsync(req.Id);
}
