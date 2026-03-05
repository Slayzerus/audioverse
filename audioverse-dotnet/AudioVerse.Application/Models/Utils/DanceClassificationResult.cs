namespace AudioVerse.Application.Models.Utils;

public record DanceClassificationResult(
    string DanceStyleName,
    decimal Confidence,
    string Source,
    int? BpmDetected = null);
