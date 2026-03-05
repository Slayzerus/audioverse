using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Handles stopping a live voice session.</summary>
public class StopVoiceSessionHandler(IRadioRepository radio) : IRequestHandler<StopVoiceSessionCommand, VoiceSession?>
{
    public async Task<VoiceSession?> Handle(StopVoiceSessionCommand req, CancellationToken ct)
    {
        var session = await radio.GetActiveVoiceSessionAsync(req.RadioStationId, ct);
        if (session == null) return null;

        session.IsLive = false;
        session.EndUtc = DateTime.UtcNow;
        await radio.SaveChangesAsync();
        return session;
    }
}
