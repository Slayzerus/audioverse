using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Obsługuje akceptację zaproszenia przez gościa.</summary>
public class AcceptRadioInviteHandler(IRadioRepository radio) : IRequestHandler<AcceptRadioInviteCommand, RadioInviteAcceptResult?>
{
    public async Task<RadioInviteAcceptResult?> Handle(AcceptRadioInviteCommand req, CancellationToken ct)
    {
        var invite = await radio.GetInviteByTokenAsync(req.Token, ct);
        if (invite == null) return null;

        if (invite.Status == RadioInviteStatus.Revoked) return null;
        if (invite.ValidTo < DateTime.UtcNow)
        {
            invite.Status = RadioInviteStatus.Expired;
            await radio.SaveChangesAsync();
            return null;
        }

        invite.Status = RadioInviteStatus.Accepted;
        invite.AcceptedAt = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(req.GuestName))
            invite.GuestName = req.GuestName;
        await radio.SaveChangesAsync();

        var station = await radio.GetStationByIdAsync(invite.RadioStationId);

        return new RadioInviteAcceptResult(
            invite.Id,
            invite.RadioStationId,
            station?.Name ?? "Unknown",
            invite.ValidFrom,
            invite.ValidTo);
    }
}
