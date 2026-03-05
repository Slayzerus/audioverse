using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using AudioVerse.Infrastructure.Email;
using MediatR;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Obsługuje tworzenie zaproszenia do stacji radiowej i wysyłkę e-maila.</summary>
public class CreateRadioInviteHandler(IRadioRepository radio, IEmailSender email, IConfiguration config) : IRequestHandler<CreateRadioInviteCommand, RadioStationInvite>
{
    public async Task<RadioStationInvite> Handle(CreateRadioInviteCommand req, CancellationToken ct)
    {
        var station = await radio.GetStationByIdAsync(req.RadioStationId)
            ?? throw new InvalidOperationException("Station not found");

        var invite = new RadioStationInvite
        {
            RadioStationId = req.RadioStationId,
            InvitedByUserId = req.InvitedByUserId,
            Email = req.Email,
            ValidFrom = req.ValidFrom,
            ValidTo = req.ValidTo,
            Message = req.Message,
            Status = RadioInviteStatus.Pending
        };

        await radio.AddInviteAsync(invite, ct);

        var baseUrl = config["App:BaseUrl"] ?? "https://audioverse.local";
        var link = $"{baseUrl}/radio/invite/{invite.Token}";

        var body = $"""
            <h2>Zaproszenie do stacji radiowej: {station.Name}</h2>
            <p>Zostałeś zaproszony do mówienia na żywo na stacji <strong>{station.Name}</strong>.</p>
            <p><strong>Okno czasowe:</strong> {invite.ValidFrom:yyyy-MM-dd HH:mm} — {invite.ValidTo:yyyy-MM-dd HH:mm} UTC</p>
            {(string.IsNullOrEmpty(req.Message) ? "" : $"<p><strong>Wiadomość:</strong> {req.Message}</p>")}
            <p><a href="{link}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;">Zaakceptuj zaproszenie</a></p>
            <p style="color:#666;font-size:12px;">Link do weryfikacji: {link}</p>
            """;

        await email.SendAsync(req.Email, $"Zaproszenie do stacji radiowej: {station.Name}", body);

        return invite;
    }
}
