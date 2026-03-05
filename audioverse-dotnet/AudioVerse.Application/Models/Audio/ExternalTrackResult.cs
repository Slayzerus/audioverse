namespace AudioVerse.Application.Models.Audio;

public class ExternalTrackResult
{
    public string ExternalId { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Artist { get; set; } = string.Empty;
    public string? Album { get; set; }
    public string? CoverUrl { get; set; }
    public string? PreviewUrl { get; set; }
    public int? DurationMs { get; set; }
    public string? ISRC { get; set; }
}
