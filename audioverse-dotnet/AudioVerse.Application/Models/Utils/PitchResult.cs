namespace AudioVerse.Application.Models.Utils
{
    public record PitchResult(
        decimal[] FrequenciesHz,
        decimal[] TimestampsMs,
        decimal? MedianHz = null,
        string? NoteName = null);
}
