namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Single row in the AI microservice latency benchmark table.</summary>
public record BenchmarkRow(
    string ServiceName,
    double AvgMs,
    long MinMs,
    long MaxMs,
    double StdDevMs);
