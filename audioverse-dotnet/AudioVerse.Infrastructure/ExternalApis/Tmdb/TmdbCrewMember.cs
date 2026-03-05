namespace AudioVerse.Infrastructure.ExternalApis.Tmdb;

/// <summary>Crew member (director, writer, etc.) from TMDB.</summary>
public class TmdbCrewMember
{
    public string Name { get; set; } = string.Empty;
    public string? Job { get; set; }
}
