using System;

namespace AudioVerse.Application.Models.Moderation
{
    public class AbuseReportDto
    {
        public int Id { get; set; }
        public int? ReporterUserId { get; set; }
        public string? ReporterUsername { get; set; }
        public string TargetType { get; set; } = string.Empty;
        public string TargetValue { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool Resolved { get; set; }
        public string? ModeratorComment { get; set; }
        public DateTime? ResolvedAt { get; set; }
    }
}
