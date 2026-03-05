namespace AudioVerse.Application.Models.Laboratory;

/// <summary>Input data for the laboratory experiment PDF report generator.</summary>
public class LaboratoryReportData
{
    public string? ReportTitle { get; set; }
    public string? Operator { get; set; }
    public DateTime ExperimentDate { get; set; } = DateTime.UtcNow;
    public List<string>? TestedFiles { get; set; }
    public int BenchmarkRuns { get; set; } = 5;
    public string? ApiVersion { get; set; }

    public Dictionary<string, string>? HealthResults { get; set; }
    public List<BenchmarkRow>? BenchmarkResults { get; set; }
    public List<ComparisonRow>? ComparisonRows { get; set; }
    public List<ComparisonRow>? CalibrationRows { get; set; }
    public List<PitchContourSeries>? PitchContours { get; set; }
    public List<SeparationRow>? SeparationRows { get; set; }
    public List<DtwRow>? DtwRows { get; set; }
}
