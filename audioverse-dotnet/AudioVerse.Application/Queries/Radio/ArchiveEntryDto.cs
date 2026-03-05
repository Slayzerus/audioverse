namespace AudioVerse.Application.Queries.Radio;

/// <summary>Archive timeline entry — voice segment or track.</summary>
public record ArchiveEntryDto(string Type, DateTime TimestampUtc, int DurationMs, int? TrackId, string? TrackTitle, int? VoiceSegmentId, string? DjComment, string? AudioUrl);
