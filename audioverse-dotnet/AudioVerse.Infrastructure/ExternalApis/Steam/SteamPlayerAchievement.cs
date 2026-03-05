namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Player achievement for a game (ISteamUserStats/GetPlayerAchievements).
/// </summary>
public class SteamPlayerAchievement
{
    public string ApiName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Achieved { get; set; }
    public long UnlockTime { get; set; }

    public DateTime? UnlockedAt => Achieved && UnlockTime > 0
        ? DateTimeOffset.FromUnixTimeSeconds(UnlockTime).UtcDateTime
        : null;
}
