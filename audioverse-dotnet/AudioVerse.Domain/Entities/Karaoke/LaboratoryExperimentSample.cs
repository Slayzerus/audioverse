using AudioVerse.Domain.Diagrams;

namespace AudioVerse.Domain.Entities.Karaoke;

/// <summary>
/// Single audio sample (file) analysed within a <see cref="LaboratoryExperiment"/>.
/// Stores per-file metrics for both algorithms and an optional pitch trajectory snapshot.
/// </summary>
[DiagramNode("Laboratory", FillColor = "#f0f4c3", StrokeColor = "#afb42b", Icon = "🎵", Description = "Audio sample with per-file CREPE/pYIN metrics + MinIO storage")]
public class LaboratoryExperimentSample
{
    public int Id { get; set; }

    public int ExperimentId { get; set; }

    [DiagramRelation(Label = "N:1")]
    public LaboratoryExperiment? Experiment { get; set; }

    /// <summary>Original filename of the uploaded audio.</summary>
    public string FileName { get; set; } = string.Empty;

    /// <summary>File size in bytes.</summary>
    public long FileSizeBytes { get; set; }

    // ── CREPE results ──

    public double? CrepeRmseHz { get; set; }
    public double? CrepeRmseCents { get; set; }
    public double? CrepeAccuracy50c { get; set; }
    public double? CrepePearsonR { get; set; }
    public long? CrepeLatencyMs { get; set; }
    public double? CrepeMedianHz { get; set; }

    // ── pYIN results ──

    public double? PyinRmseHz { get; set; }
    public double? PyinRmseCents { get; set; }
    public double? PyinAccuracy50c { get; set; }
    public double? PyinPearsonR { get; set; }
    public long? PyinLatencyMs { get; set; }
    public double? PyinMedianHz { get; set; }

    // ── Separation ──

    public double? SeparationRmseCentsBefore { get; set; }
    public double? SeparationRmseCentsAfter { get; set; }
    public long? SeparationLatencyMs { get; set; }

    /// <summary>
    /// JSON-serialized pitch trajectory snapshot (e.g. first 200 CREPE frames)
    /// used by the PDF generator to render waveform/pitch charts.
    /// </summary>
    public string? PitchTrajectoryJson { get; set; }

    /// <summary>
    /// MinIO object key where the original audio sample is stored.
    /// Format: lab-experiments/{experimentGuid}/{filename}
    /// Null if storage was unavailable during the experiment.
    /// </summary>
    public string? StoragePath { get; set; }
}
