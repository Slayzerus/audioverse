namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Internal entry for a single benchmark measurement (N runs of one AI service).</summary>
public record BenchmarkEntry(
    double AvgMs,
    long MinMs,
    long MaxMs,
    double StdDevMs,
    bool Available)
{
    /// <summary>Convert to a named row for the PDF report table.</summary>
    public BenchmarkRow ToRow(string name) => new(name, AvgMs, MinMs, MaxMs, StdDevMs);
}
