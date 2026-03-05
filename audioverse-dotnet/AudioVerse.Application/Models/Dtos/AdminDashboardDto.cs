namespace AudioVerse.Application.Queries.Admin;

public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int ActiveEvents { get; set; }
    public int TotalSongs { get; set; }
    public int TotalParties { get; set; }
    public int TotalAbuseReports { get; set; }
    public int PendingAbuseReports { get; set; }
    public int ActiveBans { get; set; }
    public List<TopSongDto> TopSongs { get; set; } = new();
    public List<RecentEventDto> RecentEvents { get; set; } = new();
}
