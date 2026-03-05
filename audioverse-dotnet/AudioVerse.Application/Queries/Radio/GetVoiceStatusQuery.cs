using MediatR;

namespace AudioVerse.Application.Queries.Radio;

/// <summary>Check if someone is currently speaking live on a station.</summary>
public record GetVoiceStatusQuery(int RadioStationId) : IRequest<VoiceStatusDto?>;
