using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Queries.Karaoke;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities.Events;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Email;
using MediatR;

namespace AudioVerse.Application.Handlers.Karaoke;

public class RespondToEventInviteHandler(IKaraokeRepository repo) : IRequestHandler<RespondToEventInviteCommand, bool>
{
    public async Task<bool> Handle(RespondToEventInviteCommand req, CancellationToken ct)
    {
        var invite = await repo.GetEventInviteByIdAsync(req.InviteId);
        if (invite == null) return false;

        invite.Status = req.Accept ? EventInviteStatus.Accepted : EventInviteStatus.Declined;
        await repo.UpdateEventInviteAsync(invite);

        if (req.Accept && invite.ToUserId.HasValue)
        {
            await repo.AssignPlayerToEventAsync(new KaraokeSessionPlayer
            {
                EventId = invite.EventId,
                PlayerId = invite.ToUserId.Value
            });
        }
        return true;
    }
}
