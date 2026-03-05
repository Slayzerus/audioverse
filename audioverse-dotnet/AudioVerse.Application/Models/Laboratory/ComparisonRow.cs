namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Single row comparing CREPE vs pYIN pitch detection for one audio file.</summary>
public record ComparisonRow(
    string FileName,
    string Algorithm,
    double RmseHz,
    double RmseCents,
    double Accuracy50c,
    double PearsonR,
    long LatencyMs);
