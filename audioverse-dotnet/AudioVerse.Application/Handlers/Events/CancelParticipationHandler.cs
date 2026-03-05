using AudioVerse.Application.Commands.Events;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Events;

/// <summary>Cancels a user's participation in an event (withdraw RSVP).</summary>
public class CancelParticipationHandler(IKaraokeRepository repo) : IRequestHandler<CancelParticipationCommand, bool>
{
    public async Task<bool> Handle(CancelParticipationCommand req, CancellationToken ct)
    {
        return await repo.RemoveParticipantFromEventAsync(req.EventId, req.UserId);
    }
}
