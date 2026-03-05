using AudioVerse.Application.Models.Laboratory;
using AudioVerse.Domain.Entities.Karaoke;

namespace AudioVerse.Application.Services.Laboratory;

/// <summary>
/// Orchestrates pitch detection experiments: runs CREPE/pYIN, computes comparison
/// metrics, benchmarks latency, and collects AI health status.
/// Used by LaboratoryController endpoints and the PDF report generator.
/// </summary>
public interface ILaboratoryService
{
    /// <summary>Run CREPE pitch detection on raw audio bytes.</summary>
    Task<(Models.Utils.PitchResult? Result, long LatencyMs)> DetectPitchCrepeAsync(byte[] audio, CancellationToken ct);

    /// <summary>Run pYIN pitch detection via the audio_pitch microservice.</summary>
    Task<(PitchRawResponse? Result, long LatencyMs)> DetectPitchPyinAsync(byte[] audio, string fileName, CancellationToken ct);

    /// <summary>Compute comparison metrics between two F0 trajectories.</summary>
    ComparisonMetrics ComputeMetrics(double[] a, double[] b);

    /// <summary>Measure average latency of an async action over N runs.</summary>
    Task<BenchmarkEntry> MeasureAsync(int runs, Func<Task> action);

    /// <summary>Collect health status of all configured AI microservices.</summary>
    Task<Dictionary<string, string>> CollectHealthAsync(CancellationToken ct);

    /// <summary>Run latency benchmark for all AI microservices.</summary>
    Task<List<BenchmarkRow>> CollectBenchmarkAsync(byte[] audio, int runs, CancellationToken ct);

    /// <summary>Extract vocal track from a Demucs ZIP output.</summary>
    byte[] ExtractVocalFromZip(byte[] zipBytes);

    /// <summary>Persist a completed experiment with aggregate metrics and per-sample data.</summary>
    Task<LaboratoryExperiment> SaveExperimentAsync(LaboratoryReportData data, CancellationToken ct);

    /// <summary>Persist experiment and upload audio samples to MinIO storage.</summary>
    Task<LaboratoryExperiment> SaveExperimentAsync(
        LaboratoryReportData data,
        Dictionary<string, byte[]> audioSamples,
        CancellationToken ct);

    /// <summary>Get a presigned download URL for a stored audio sample.</summary>
    Task<string?> GetSampleDownloadUrlAsync(Guid experimentGuid, string fileName, CancellationToken ct);

    /// <summary>Load a previously saved experiment by its unique GUID.</summary>
    Task<LaboratoryExperiment?> GetExperimentAsync(Guid experimentGuid, CancellationToken ct);

    /// <summary>List recent experiments (newest first).</summary>
    Task<List<LaboratoryExperiment>> ListExperimentsAsync(int take, CancellationToken ct);
}
