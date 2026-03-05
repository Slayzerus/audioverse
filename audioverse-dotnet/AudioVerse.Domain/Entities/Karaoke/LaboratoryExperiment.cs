using AudioVerse.Domain.Diagrams;

namespace AudioVerse.Domain.Entities.Karaoke;

/// <summary>
/// Persisted laboratory experiment comparing pitch detection algorithms.
/// Stores full results, comparison metrics, and a unique experiment identifier
/// so that experiments can be recalled, compared, and linked via QR code.
/// </summary>
[DiagramNode("Laboratory", FillColor = "#dcedc8", StrokeColor = "#689f38", Icon = "🔬", Description = "Pitch detection experiment with CREPE/pYIN metrics")]
public class LaboratoryExperiment
{
    public int Id { get; set; }

    /// <summary>Unique experiment identifier (used in QR codes and cross-references).</summary>
    public Guid ExperimentGuid { get; set; } = Guid.NewGuid();

    /// <summary>Title chosen by the operator (e.g. "CREPE vs pYIN — vocal set A").</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Name of the person who ran the experiment.</summary>
    public string? Operator { get; set; }

    /// <summary>Timestamp when the experiment was executed (UTC).</summary>
    public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Number of benchmark repetitions used.</summary>
    public int BenchmarkRuns { get; set; }

    /// <summary>Number of audio files analysed.</summary>
    public int FileCount { get; set; }

    /// <summary>API version string at the time of the experiment.</summary>
    public string? ApiVersion { get; set; }

    // ── Aggregate CREPE metrics ──

    /// <summary>Average RMSE in cents across all tested files (CREPE trajectory).</summary>
    public double? CrepeAvgRmseCents { get; set; }

    /// <summary>Average Accuracy@50c across all tested files (CREPE).</summary>
    public double? CrepeAvgAccuracy50c { get; set; }

    /// <summary>Average Pearson correlation across all tested files (CREPE).</summary>
    public double? CrepeAvgPearsonR { get; set; }

    /// <summary>Average CREPE latency in ms.</summary>
    public double? CrepeAvgLatencyMs { get; set; }

    // ── Aggregate pYIN metrics ──

    /// <summary>Average RMSE in cents across all tested files (pYIN trajectory).</summary>
    public double? PyinAvgRmseCents { get; set; }

    /// <summary>Average Accuracy@50c across all tested files (pYIN).</summary>
    public double? PyinAvgAccuracy50c { get; set; }

    /// <summary>Average Pearson correlation across all tested files (pYIN).</summary>
    public double? PyinAvgPearsonR { get; set; }

    /// <summary>Average pYIN latency in ms.</summary>
    public double? PyinAvgLatencyMs { get; set; }

    // ── Separation ──

    /// <summary>Average delta RMSE (cents) after Demucs separation (negative = improvement).</summary>
    public double? SeparationAvgDeltaRmseCents { get; set; }

    // ── DTW ──

    /// <summary>DTW singing score (0-100) if vocal/reference pair was provided.</summary>
    public double? DtwScore { get; set; }

    // ── Serialized full data ──

    /// <summary>Full experiment data serialized as JSON (for PDF re-generation).</summary>
    public string? ResultsJson { get; set; }

    /// <summary>Optional notes added by the operator.</summary>
    public string? Notes { get; set; }

    // ── Navigation ──

    /// <summary>Child sample records linked to this experiment.</summary>
    [DiagramRelation(Label = "1:N")]
    public List<LaboratoryExperimentSample> Samples { get; set; } = [];
}
