using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Handles adding a participant to a league.</summary>
public class AddLeagueParticipantHandler(ILeagueRepository repo) : IRequestHandler<AddLeagueParticipantCommand, int>
{
    public Task<int> Handle(AddLeagueParticipantCommand req, CancellationToken ct) =>
        repo.AddParticipantAsync(req.Participant);
}
