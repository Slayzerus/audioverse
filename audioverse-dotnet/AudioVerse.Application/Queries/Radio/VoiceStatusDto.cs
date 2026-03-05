namespace AudioVerse.Application.Queries.Radio;

/// <summary>Live voice status DTO for a radio station.</summary>
public record VoiceStatusDto(int VoiceSessionId, int SpeakerUserId, DateTime StartUtc, bool IsLive);
