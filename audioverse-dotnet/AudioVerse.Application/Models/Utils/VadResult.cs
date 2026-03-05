namespace AudioVerse.Application.Models.Utils
{
    public record VadResult(
        VadSegment[] Segments,
        decimal TotalSpeechMs,
        decimal TotalSilenceMs);
}
