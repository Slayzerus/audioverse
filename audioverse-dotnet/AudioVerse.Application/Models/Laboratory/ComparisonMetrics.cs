namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Comparison metrics between two pitch trajectories (e.g. CREPE vs pYIN).</summary>
public record ComparisonMetrics(
    double RmseHz,
    double RmseCents,
    double Accuracy50c,
    double PearsonR,
    int ComparedFrames);
