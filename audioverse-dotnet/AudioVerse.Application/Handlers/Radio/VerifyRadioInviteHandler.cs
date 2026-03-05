using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Obsługuje weryfikację zaproszenia po tokenie.</summary>
public class VerifyRadioInviteHandler(IRadioRepository radio) : IRequestHandler<VerifyRadioInviteCommand, RadioInviteVerifyResult?>
{
    public async Task<RadioInviteVerifyResult?> Handle(VerifyRadioInviteCommand req, CancellationToken ct)
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

        var station = await radio.GetStationByIdAsync(invite.RadioStationId);

        return new RadioInviteVerifyResult(
            invite.Id,
            invite.RadioStationId,
            station?.Name ?? "Unknown",
            invite.Email,
            invite.ValidFrom,
            invite.ValidTo,
            invite.Message,
            invite.Status.ToString());
    }
}
