namespace AudioVerse.API.Hubs;

/// <summary>Aktualizacja osi czasu rozesłana przez serwer.</summary>
public record ServerTimelineUpdateDto
(
    int PlayerId,
    TimelinePointDto[] Points,
    string? ServerTimeUtc,
    long? Seq,
    string? SenderConnectionId
);
