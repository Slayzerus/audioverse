using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Obsługuje odwołanie zaproszenia.</summary>
public class RevokeRadioInviteHandler(IRadioRepository radio) : IRequestHandler<RevokeRadioInviteCommand, bool>
{
    public async Task<bool> Handle(RevokeRadioInviteCommand req, CancellationToken ct)
    {
        var invite = await radio.GetInviteByIdAsync(req.InviteId, req.RadioStationId, ct);
        if (invite == null) return false;

        invite.Status = RadioInviteStatus.Revoked;
        invite.RevokedAt = DateTime.UtcNow;
        await radio.SaveChangesAsync();
        return true;
    }
}
