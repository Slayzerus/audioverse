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

public class CancelEventInviteHandler(IKaraokeRepository repo, IAuditLogService audit) : IRequestHandler<CancelEventInviteCommand, bool>
{
    public async Task<bool> Handle(CancelEventInviteCommand req, CancellationToken ct)
    {
        var invite = await repo.GetEventInviteByIdAsync(req.InviteId);
        if (invite == null) return false;

        invite.Status = EventInviteStatus.Cancelled;
        await repo.UpdateEventInviteAsync(invite);
        await audit.LogActionAsync(req.CancelledByUserId, "system", "CancelInvite", $"Invite {req.InviteId} cancelled", true, null);
        return true;
    }
}
