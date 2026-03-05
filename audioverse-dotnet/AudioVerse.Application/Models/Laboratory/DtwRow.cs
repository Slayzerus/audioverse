namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Single row with DTW singing score result (vocal vs reference).</summary>
public record DtwRow(
    string VocalFileName,
    double Score,
    double PitchAccuracy,
    double RhythmAccuracy,
    long LatencyMs);
