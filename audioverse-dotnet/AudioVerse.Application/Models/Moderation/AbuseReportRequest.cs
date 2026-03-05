namespace AudioVerse.Application.Models.Moderation
{
    /// <summary>
    /// DTO do zg?oszenia nadu?ycia.
    /// </summary>
    public class AbuseReportRequest
    {
        public string TargetType { get; set; } = string.Empty; // np. "EventDescription", "Nickname"
        public string TargetValue { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Comment { get; set; }
    }
}
