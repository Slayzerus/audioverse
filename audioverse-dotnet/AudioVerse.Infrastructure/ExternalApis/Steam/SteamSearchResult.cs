namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Result from Steam Store search.
/// </summary>
public class SteamSearchResult
{
    public int AppId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LogoUrl { get; set; }
}
