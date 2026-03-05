namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Single row showing Demucs separation impact on pitch detection quality.</summary>
public record SeparationRow(
    string FileName,
    double RmseCentsBefore,
    double RmseCentsAfter,
    long SeparationLatencyMs);
