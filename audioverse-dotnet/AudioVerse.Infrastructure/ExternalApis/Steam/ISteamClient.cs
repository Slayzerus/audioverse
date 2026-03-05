namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Client interface for Steam Store API and Steam Web API.
/// Store endpoints (Search, Details) require no key.
/// Web API endpoints require a Steam API key configured in appsettings "Steam:ApiKey".
/// </summary>
public interface ISteamClient
{
    // ── Store API (no key) ──

    Task<List<SteamSearchResult>> SearchAsync(string query, CancellationToken ct = default);
    Task<SteamGameDetails?> GetDetailsAsync(int appId, CancellationToken ct = default);

    // ── ISteamUser ──

    Task<SteamPlayerSummary?> GetPlayerSummaryAsync(string steamId, CancellationToken ct = default);
    Task<List<SteamPlayerSummary>> GetPlayerSummariesAsync(IEnumerable<string> steamIds, CancellationToken ct = default);
    Task<List<SteamFriend>> GetFriendListAsync(string steamId, CancellationToken ct = default);
    Task<string?> ResolveVanityUrlAsync(string vanityName, CancellationToken ct = default);

    // ── IPlayerService ──

    Task<List<SteamOwnedGame>> GetOwnedGamesAsync(string steamId, bool includeAppInfo = true, bool includeFreeGames = false, CancellationToken ct = default);
    Task<List<SteamRecentGame>> GetRecentlyPlayedGamesAsync(string steamId, int count = 10, CancellationToken ct = default);
    Task<int?> GetSteamLevelAsync(string steamId, CancellationToken ct = default);

    // ── ISteamUserStats ──

    Task<List<SteamPlayerAchievement>> GetPlayerAchievementsAsync(string steamId, int appId, CancellationToken ct = default);
    Task<List<SteamGlobalAchievement>> GetGlobalAchievementPercentagesAsync(int appId, CancellationToken ct = default);

    // ── ISteamNews ──

    Task<List<SteamNewsItem>> GetNewsForAppAsync(int appId, int count = 10, int maxLength = 500, CancellationToken ct = default);

    // ── Store Wishlist ──

    Task<List<SteamWishlistItem>> GetWishlistAsync(string steamId, CancellationToken ct = default);
}
