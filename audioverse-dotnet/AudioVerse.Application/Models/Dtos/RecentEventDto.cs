namespace AudioVerse.Application.Queries.Admin;

public class RecentEventDto
{
    public int EventId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime? StartTime { get; set; }
    public int ParticipantCount { get; set; }
}
