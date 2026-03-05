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

public class SendEventInviteHandler(IKaraokeRepository repo, IEmailSender email, IAuditLogService audit) : IRequestHandler<SendEventInviteCommand, int>
{
    public async Task<int> Handle(SendEventInviteCommand req, CancellationToken ct)
    {
        req.Invite.CreatedAt = DateTime.UtcNow;
        req.Invite.Status = EventInviteStatus.Pending;
        var id = await repo.AddEventInviteAsync(req.Invite);

        if (!string.IsNullOrWhiteSpace(req.Invite.ToEmail))
        {
            await email.SendAsync(req.Invite.ToEmail, "Event Invitation", req.Invite.Message ?? "You have been invited!", true);
        }

        await audit.LogActionAsync(req.Invite.FromUserId, "system", "SendInvite", $"Invite {id} sent for event {req.Invite.EventId}", true, null);
        return id;
    }
}
