using AudioVerse.Application.Commands.Radio;
using AudioVerse.Domain.Entities.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Handles starting a live voice session.</summary>
public class StartVoiceSessionHandler(IRadioRepository radio) : IRequestHandler<StartVoiceSessionCommand, VoiceSession>
{
    public async Task<VoiceSession> Handle(StartVoiceSessionCommand req, CancellationToken ct)
    {
        var existing = await radio.GetActiveVoiceSessionAsync(req.RadioStationId, ct);
        if (existing != null)
        {
            existing.IsLive = false;
            existing.EndUtc = DateTime.UtcNow;
        }

        var activeSession = await radio.GetActiveSessionAsync(req.RadioStationId);

        var session = new VoiceSession
        {
            RadioStationId = req.RadioStationId,
            BroadcastSessionId = activeSession?.Id,
            SpeakerUserId = req.SpeakerUserId,
            StartUtc = DateTime.UtcNow,
            IsLive = true,
            EnableRecording = req.EnableRecording
        };
        await radio.AddVoiceSessionAsync(session, ct);
        return session;
    }
}
