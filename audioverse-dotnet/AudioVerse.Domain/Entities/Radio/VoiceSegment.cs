namespace AudioVerse.Domain.Entities.Radio;

/// <summary>
/// Pojedynczy segment nagrania voice session (chunk audio zapisany w storage).
/// </summary>
public class VoiceSegment
{
    public int Id { get; set; }
    public int VoiceSessionId { get; set; }
    public VoiceSession? VoiceSession { get; set; }

    /// <summary>Indeks segmentu w sesji (0, 1, 2…).</summary>
    public int SegmentIndex { get; set; }

    /// <summary>Klucz w storage, np. "voice-archive/{sessionId}/{index}.webm".</summary>
    public string StorageKey { get; set; } = string.Empty;

    /// <summary>Timestamp początku segmentu (UTC).</summary>
    public DateTime TimestampUtc { get; set; }

    /// <summary>Czas trwania segmentu w milisekundach.</summary>
    public int DurationMs { get; set; }

    /// <summary>ID tracka który leciał w tle w momencie nagrania (opcjonalne).</summary>
    public int? BackgroundTrackId { get; set; }

    /// <summary>Komentarz DJ-a (opcjonalny, np. tytuł powiedzianej audycji).</summary>
    public string? DjComment { get; set; }
}
