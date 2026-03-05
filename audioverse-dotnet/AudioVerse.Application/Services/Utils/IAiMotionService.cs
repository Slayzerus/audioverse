using AudioVerse.Application.Models.Utils;

namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Text-to-motion generation service.
/// Supports MotionGPT, MDM, and MoMask engines — individually or in parallel for comparison.
/// </summary>
public interface IAiMotionService
{
    /// <summary>Generate motion from text using a specific engine.</summary>
    Task<MotionGenerationResult?> GenerateAsync(string prompt, string engine, double durationSec = 4.0, double fps = 20.0, CancellationToken ct = default);

    /// <summary>Generate motion from all 3 engines in parallel for side-by-side comparison.</summary>
    Task<MotionComparisonResult> CompareAsync(string prompt, double durationSec = 4.0, double fps = 20.0, CancellationToken ct = default);

    /// <summary>Generate motion and return raw BVH file bytes for a specific engine.</summary>
    Task<byte[]?> GenerateBvhAsync(string prompt, string engine, double durationSec = 4.0, CancellationToken ct = default);

    /// <summary>Check which engines are available (health check).</summary>
    Task<IReadOnlyDictionary<string, bool>> HealthCheckAsync(CancellationToken ct = default);
}
