namespace AudioVerse.Application.Models.Moderation
{
    public class ResolveAbuseReportRequest
    {
        public bool Resolved { get; set; }
        public string? ModeratorComment { get; set; }
    }
}
