using AudioVerse.Application.Queries.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Obsługuje pobieranie zaproszeń dla stacji.</summary>
public class GetRadioInvitesHandler(IRadioRepository radio) : IRequestHandler<GetRadioInvitesQuery, IEnumerable<RadioInviteDto>>
{
    public async Task<IEnumerable<RadioInviteDto>> Handle(GetRadioInvitesQuery req, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var invites = await radio.GetInvitesByStationAsync(req.RadioStationId, ct);

        return invites.Select(i => new RadioInviteDto(
            i.Id,
            i.Email,
            i.GuestName,
            i.ValidFrom,
            i.ValidTo,
            i.ValidTo < now && i.Status == Domain.Entities.Radio.RadioInviteStatus.Pending ? "Expired" : i.Status.ToString(),
            i.CreatedAt,
            i.Message));
    }
}
