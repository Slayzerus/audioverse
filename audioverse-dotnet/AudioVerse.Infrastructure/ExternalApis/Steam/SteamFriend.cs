namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Steam friend entry (ISteamUser/GetFriendList).
/// </summary>
public class SteamFriend
{
    public string SteamId { get; set; } = string.Empty;
    public string Relationship { get; set; } = string.Empty;
    public long FriendSince { get; set; }

    public DateTime FriendSinceUtc => DateTimeOffset.FromUnixTimeSeconds(FriendSince).UtcDateTime;
}
