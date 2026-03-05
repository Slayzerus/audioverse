namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Recently played game entry (IPlayerService/GetRecentlyPlayedGames).
/// </summary>
public class SteamRecentGame
{
    public int AppId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PlaytimeRecentMinutes { get; set; }
    public int PlaytimeForeverMinutes { get; set; }
    public string? ImgIconUrl { get; set; }
}
