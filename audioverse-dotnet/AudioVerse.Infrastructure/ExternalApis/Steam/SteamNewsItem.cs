namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// News item for a game (ISteamNews/GetNewsForApp).
/// </summary>
public class SteamNewsItem
{
    public string Gid { get; set; } = string.Empty;
    public int AppId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Contents { get; set; } = string.Empty;
    public string FeedLabel { get; set; } = string.Empty;
    public long Date { get; set; }

    public DateTime DateUtc => DateTimeOffset.FromUnixTimeSeconds(Date).UtcDateTime;
}
