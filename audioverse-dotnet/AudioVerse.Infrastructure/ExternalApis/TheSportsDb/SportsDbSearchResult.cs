namespace AudioVerse.Infrastructure.ExternalApis.TheSportsDb;

/// <summary>Sport search result from TheSportsDB.</summary>
public class SportsDbSearchResult
{
    public int IdTeam { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Sport { get; set; }
    public string? League { get; set; }
    public string? BadgeUrl { get; set; }
    public string? Description { get; set; }
}
