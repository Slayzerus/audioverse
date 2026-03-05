namespace AudioVerse.Application.Models.Utils
{
    public record AudioAnalysisResult(
        decimal Bpm,
        string? Key,
        decimal? Loudness,
        decimal? Energy,
        int? TimeSignature = null,
        decimal? Danceability = null,
        decimal? Valence = null,
        string? RhythmPattern = null);
}
