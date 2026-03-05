namespace AudioVerse.Application.Models.Laboratory;

/// <summary>F0 pitch contour time-series for a single file and algorithm (e.g. "CREPE", "pYIN", "Reference").</summary>
public record PitchContourSeries(
    string FileName,
    string Algorithm,
    List<PitchContourPoint> Points);
