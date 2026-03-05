namespace AudioVerse.Application.Models.Utils;

/// <summary>
/// Result of a single text-to-motion generation from one engine.
/// Contains the generated motion frames, BVH data, and metadata.
/// </summary>
public record MotionGenerationResult(
    string Engine,
    string Prompt,
    double DurationSec,
    double Fps,
    int TotalFrames,
    int JointCount,
    IReadOnlyList<MotionFrame> Frames,
    string? BvhData,
    double GenerationTimeSec,
    string? Error
);
