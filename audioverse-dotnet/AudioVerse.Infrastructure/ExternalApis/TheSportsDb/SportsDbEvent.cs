namespace AudioVerse.Infrastructure.ExternalApis.TheSportsDb;

/// <summary>Upcoming sporting event from TheSportsDB.</summary>
public class SportsDbEvent
{
    public int IdEvent { get; set; }
    public string EventName { get; set; } = string.Empty;
    public string? Sport { get; set; }
    public string? League { get; set; }
    public string? HomeTeam { get; set; }
    public string? AwayTeam { get; set; }
    public string? DateEvent { get; set; }
    public string? TimeEvent { get; set; }
    public string? Venue { get; set; }
    public string? ThumbUrl { get; set; }
}
