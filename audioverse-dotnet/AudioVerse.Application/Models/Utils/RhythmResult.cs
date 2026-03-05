namespace AudioVerse.Application.Models.Utils
{
    public record RhythmResult(
        decimal Bpm,
        decimal[] BeatTimesMs,
        int? TimeSignature = null,
        string? RhythmPattern = null);
}
