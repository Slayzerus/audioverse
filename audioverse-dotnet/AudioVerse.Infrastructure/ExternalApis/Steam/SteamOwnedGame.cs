namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// A game owned by a Steam user (IPlayerService/GetOwnedGames).
/// </summary>
public class SteamOwnedGame
{
    public int AppId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int PlaytimeForeverMinutes { get; set; }
    public int PlaytimeRecentMinutes { get; set; }
    public string? ImgIconUrl { get; set; }
    public long? RtimeLastPlayed { get; set; }

    public DateTime? LastPlayed => RtimeLastPlayed > 0
        ? DateTimeOffset.FromUnixTimeSeconds(RtimeLastPlayed.Value).UtcDateTime
        : null;
}
