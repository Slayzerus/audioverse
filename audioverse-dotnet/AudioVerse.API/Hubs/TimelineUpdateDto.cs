namespace AudioVerse.API.Hubs;

/// <summary>Aktualizacja osi czasu wysłana przez klienta.</summary>
public record TimelineUpdateDto
(
    int? EventId,
    int PlayerId,
    TimelinePointDto[] Points,
    long? Seq,
    bool? Quantized
);
