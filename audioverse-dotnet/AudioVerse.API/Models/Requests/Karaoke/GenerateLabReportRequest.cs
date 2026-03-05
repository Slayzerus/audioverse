namespace AudioVerse.API.Models.Requests.Karaoke;

/// <summary>
/// Multipart form model for the PDF report generation endpoint.
/// Groups all file and scalar parameters so Swashbuckle generates
/// a correct OpenAPI schema with file upload support.
/// </summary>
public class GenerateLabReportRequest
{
    /// <summary>Audio files for CREPE vs pYIN analysis (1–10).</summary>
    public List<IFormFile> AudioFiles { get; set; } = [];

    /// <summary>Optional vocal recording for DTW scoring.</summary>
    public IFormFile? VocalFile { get; set; }

    /// <summary>Optional reference track for DTW scoring.</summary>
    public IFormFile? ReferenceFile { get; set; }

    /// <summary>Report title displayed in the PDF header.</summary>
    public string? ReportTitle { get; set; }

    /// <summary>Operator name (defaults to current user login).</summary>
    public string? OperatorName { get; set; }

    /// <summary>Number of benchmark repetitions (1–10, default 3).</summary>
    public int BenchmarkRuns { get; set; } = 3;
}
