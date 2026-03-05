namespace AudioVerse.Infrastructure.ExternalApis.TheSportsDb;

/// <summary>League info from TheSportsDB.</summary>
public class SportsDbLeague
{
    public int IdLeague { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Sport { get; set; }
    public string? Country { get; set; }
    public string? BadgeUrl { get; set; }
}
