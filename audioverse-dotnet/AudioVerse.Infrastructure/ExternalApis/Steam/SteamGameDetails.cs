namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Detailed game info from Steam Store.
/// </summary>
public class SteamGameDetails
{
    public int AppId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? HeaderImageUrl { get; set; }
    public List<string> Genres { get; set; } = new();
    public List<string> Categories { get; set; } = new();
    public bool IsMultiplayer { get; set; }
    public bool IsLocalMultiplayer { get; set; }
    public bool IsOnlineMultiplayer { get; set; }
    public List<string> Platforms { get; set; } = new();
}
