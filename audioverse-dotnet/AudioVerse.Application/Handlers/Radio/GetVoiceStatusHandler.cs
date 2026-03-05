using AudioVerse.Application.Queries.Radio;
using AudioVerse.Domain.Repositories;
using MediatR;

namespace AudioVerse.Application.Handlers.Radio;

/// <summary>Handles checking the live voice status.</summary>
public class GetVoiceStatusHandler(IRadioRepository radio) : IRequestHandler<GetVoiceStatusQuery, VoiceStatusDto?>
{
    public async Task<VoiceStatusDto?> Handle(GetVoiceStatusQuery req, CancellationToken ct)
    {
        var session = await radio.GetActiveVoiceSessionAsync(req.RadioStationId, ct);
        if (session == null) return null;
        return new VoiceStatusDto(session.Id, session.SpeakerUserId, session.StartUtc, session.IsLive);
    }
}
