namespace AudioVerse.Application.Models.Utils;

/// <summary>
/// Combined result from parallel text-to-motion generation across multiple engines.
/// Used for side-by-side comparison.
/// </summary>
public record MotionComparisonResult(
    string Prompt,
    double RequestedDurationSec,
    IReadOnlyList<MotionGenerationResult> Results,
    double TotalTimeSec
);
