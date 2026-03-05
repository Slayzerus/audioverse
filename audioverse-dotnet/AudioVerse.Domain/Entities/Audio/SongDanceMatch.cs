namespace AudioVerse.Domain.Entities.Audio;

/// <summary>
/// Association between a song and a dance style with confidence score.
/// </summary>
public class SongDanceMatch
{
    public int Id { get; set; }
    public int SongId { get; set; }
    public Karaoke.KaraokeSongFiles.KaraokeSongFile? Song { get; set; }
    public int DanceStyleId { get; set; }
    public DanceStyle? DanceStyle { get; set; }
    public decimal Confidence { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime AnalyzedAt { get; set; } = DateTime.UtcNow;
}
