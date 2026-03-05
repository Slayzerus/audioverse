namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Global achievement percentage for a game (ISteamUserStats/GetGlobalAchievementPercentagesForApp).
/// </summary>
public class SteamGlobalAchievement
{
    public string Name { get; set; } = string.Empty;
    public double Percent { get; set; }
}
