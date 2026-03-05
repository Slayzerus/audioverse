using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Infrastructure.ExternalApis.Steam;

/// <summary>
/// Client for Steam Store API (public) and Steam Web API (requires key).
/// </summary>
public class SteamClient : ISteamClient
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;

    private const string WebApi = "https://api.steampowered.com";
    private const string StoreApi = "https://store.steampowered.com/api";

    public SteamClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _http.DefaultRequestHeaders.UserAgent.TryParseAdd("AudioVerse/1.0");
        _apiKey = config["Steam:ApiKey"];
    }

    // ════════════════════════════════════════════════════════════
    //  STORE API (no key needed)
    // ════════════════════════════════════════════════════════════

    public async Task<List<SteamSearchResult>> SearchAsync(string query, CancellationToken ct = default)
    {
        var url = $"{StoreApi}/storesearch/?term={Uri.EscapeDataString(query)}&l=english&cc=US";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamSearchResult>();
        if (doc.RootElement.TryGetProperty("items", out var items))
        {
            foreach (var item in items.EnumerateArray())
            {
                results.Add(new SteamSearchResult
                {
                    AppId = item.GetProperty("id").GetInt32(),
                    Name = item.GetProperty("name").GetString() ?? string.Empty,
                    LogoUrl = item.TryGetProperty("tiny_image", out var img) ? img.GetString() : null
                });
            }
        }

        return results;
    }

    public async Task<SteamGameDetails?> GetDetailsAsync(int appId, CancellationToken ct = default)
    {
        var url = $"{StoreApi}/appdetails?appids={appId}&l=english";
        using var doc = await GetJsonAsync(url, ct);

        if (!doc.RootElement.TryGetProperty(appId.ToString(), out var wrapper)) return null;
        if (!wrapper.TryGetProperty("success", out var success) || !success.GetBoolean()) return null;
        if (!wrapper.TryGetProperty("data", out var data)) return null;

        var details = new SteamGameDetails
        {
            AppId = appId,
            Name = data.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
            ShortDescription = data.TryGetProperty("short_description", out var sd) ? sd.GetString() : null,
            HeaderImageUrl = data.TryGetProperty("header_image", out var hi) ? hi.GetString() : null,
        };

        if (data.TryGetProperty("genres", out var genres))
            foreach (var g in genres.EnumerateArray())
            {
                var desc = g.TryGetProperty("description", out var gd) ? gd.GetString() : null;
                if (!string.IsNullOrEmpty(desc)) details.Genres.Add(desc);
            }

        if (data.TryGetProperty("categories", out var cats))
            foreach (var c in cats.EnumerateArray())
            {
                var desc = c.TryGetProperty("description", out var cd) ? cd.GetString() : null;
                if (!string.IsNullOrEmpty(desc))
                {
                    details.Categories.Add(desc);
                    var lower = desc.ToLowerInvariant();
                    if (lower.Contains("multi-player") || lower.Contains("multiplayer")) details.IsMultiplayer = true;
                    if (lower.Contains("local")) details.IsLocalMultiplayer = true;
                    if (lower.Contains("online") && (lower.Contains("multi") || lower.Contains("co-op"))) details.IsOnlineMultiplayer = true;
                }
            }

        if (data.TryGetProperty("platforms", out var plat))
        {
            if (plat.TryGetProperty("windows", out var w) && w.GetBoolean()) details.Platforms.Add("Windows");
            if (plat.TryGetProperty("mac", out var m) && m.GetBoolean()) details.Platforms.Add("Mac");
            if (plat.TryGetProperty("linux", out var l) && l.GetBoolean()) details.Platforms.Add("Linux");
        }

        return details;
    }

    // ════════════════════════════════════════════════════════════
    //  ISteamUser
    // ════════════════════════════════════════════════════════════

    public async Task<SteamPlayerSummary?> GetPlayerSummaryAsync(string steamId, CancellationToken ct = default)
    {
        var summaries = await GetPlayerSummariesAsync([steamId], ct);
        return summaries.FirstOrDefault();
    }

    public async Task<List<SteamPlayerSummary>> GetPlayerSummariesAsync(IEnumerable<string> steamIds, CancellationToken ct = default)
    {
        EnsureApiKey();
        var ids = string.Join(",", steamIds);
        var url = $"{WebApi}/ISteamUser/GetPlayerSummaries/v0002/?key={_apiKey}&steamids={ids}";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamPlayerSummary>();
        if (doc.RootElement.TryGetProperty("response", out var resp) &&
            resp.TryGetProperty("players", out var players))
        {
            foreach (var p in players.EnumerateArray())
            {
                results.Add(new SteamPlayerSummary
                {
                    SteamId = p.GetProperty("steamid").GetString() ?? "",
                    PersonaName = p.GetProperty("personaname").GetString() ?? "",
                    ProfileUrl = p.TryGetProperty("profileurl", out var pu) ? pu.GetString() : null,
                    AvatarUrl = p.TryGetProperty("avatar", out var av) ? av.GetString() : null,
                    AvatarMediumUrl = p.TryGetProperty("avatarmedium", out var am) ? am.GetString() : null,
                    AvatarFullUrl = p.TryGetProperty("avatarfull", out var af) ? af.GetString() : null,
                    PersonaState = p.TryGetProperty("personastate", out var ps) ? ps.GetInt32() : 0,
                    RealName = p.TryGetProperty("realname", out var rn) ? rn.GetString() : null,
                    LocCountryCode = p.TryGetProperty("loccountrycode", out var lc) ? lc.GetString() : null,
                    TimeCreated = p.TryGetProperty("timecreated", out var tc) ? tc.GetInt64() : null,
                    LastLogoff = p.TryGetProperty("lastlogoff", out var lo) ? lo.GetInt64() : null,
                });
            }
        }
        return results;
    }

    public async Task<List<SteamFriend>> GetFriendListAsync(string steamId, CancellationToken ct = default)
    {
        EnsureApiKey();
        var url = $"{WebApi}/ISteamUser/GetFriendList/v0001/?key={_apiKey}&steamid={steamId}&relationship=friend";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamFriend>();
        if (doc.RootElement.TryGetProperty("friendslist", out var fl) &&
            fl.TryGetProperty("friends", out var friends))
        {
            foreach (var f in friends.EnumerateArray())
            {
                results.Add(new SteamFriend
                {
                    SteamId = f.GetProperty("steamid").GetString() ?? "",
                    Relationship = f.TryGetProperty("relationship", out var r) ? r.GetString() ?? "" : "",
                    FriendSince = f.TryGetProperty("friend_since", out var fs) ? fs.GetInt64() : 0,
                });
            }
        }
        return results;
    }

    public async Task<string?> ResolveVanityUrlAsync(string vanityName, CancellationToken ct = default)
    {
        EnsureApiKey();
        var url = $"{WebApi}/ISteamUser/ResolveVanityURL/v0001/?key={_apiKey}&vanityurl={Uri.EscapeDataString(vanityName)}";
        using var doc = await GetJsonAsync(url, ct);

        if (doc.RootElement.TryGetProperty("response", out var resp))
        {
            if (resp.TryGetProperty("success", out var s) && s.GetInt32() == 1 &&
                resp.TryGetProperty("steamid", out var sid))
                return sid.GetString();
        }
        return null;
    }

    // ════════════════════════════════════════════════════════════
    //  IPlayerService
    // ════════════════════════════════════════════════════════════

    public async Task<List<SteamOwnedGame>> GetOwnedGamesAsync(string steamId, bool includeAppInfo = true, bool includeFreeGames = false, CancellationToken ct = default)
    {
        EnsureApiKey();
        var url = $"{WebApi}/IPlayerService/GetOwnedGames/v0001/?key={_apiKey}&steamid={steamId}" +
                  $"&include_appinfo={BoolParam(includeAppInfo)}&include_played_free_games={BoolParam(includeFreeGames)}&format=json";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamOwnedGame>();
        if (doc.RootElement.TryGetProperty("response", out var resp) &&
            resp.TryGetProperty("games", out var games))
        {
            foreach (var g in games.EnumerateArray())
            {
                var appId = g.GetProperty("appid").GetInt32();
                results.Add(new SteamOwnedGame
                {
                    AppId = appId,
                    Name = g.TryGetProperty("name", out var nm) ? nm.GetString() ?? "" : "",
                    PlaytimeForeverMinutes = g.TryGetProperty("playtime_forever", out var pf) ? pf.GetInt32() : 0,
                    PlaytimeRecentMinutes = g.TryGetProperty("playtime_2weeks", out var p2) ? p2.GetInt32() : 0,
                    ImgIconUrl = g.TryGetProperty("img_icon_url", out var icon) ? $"https://media.steampowered.com/steamcommunity/public/images/apps/{appId}/{icon.GetString()}.jpg" : null,
                    RtimeLastPlayed = g.TryGetProperty("rtime_last_played", out var rtp) ? rtp.GetInt64() : null,
                });
            }
        }
        return results;
    }

    public async Task<List<SteamRecentGame>> GetRecentlyPlayedGamesAsync(string steamId, int count = 10, CancellationToken ct = default)
    {
        EnsureApiKey();
        var url = $"{WebApi}/IPlayerService/GetRecentlyPlayedGames/v0001/?key={_apiKey}&steamid={steamId}&count={count}&format=json";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamRecentGame>();
        if (doc.RootElement.TryGetProperty("response", out var resp) &&
            resp.TryGetProperty("games", out var games))
        {
            foreach (var g in games.EnumerateArray())
            {
                var appId = g.GetProperty("appid").GetInt32();
                results.Add(new SteamRecentGame
                {
                    AppId = appId,
                    Name = g.TryGetProperty("name", out var nm) ? nm.GetString() ?? "" : "",
                    PlaytimeRecentMinutes = g.TryGetProperty("playtime_2weeks", out var p2) ? p2.GetInt32() : 0,
                    PlaytimeForeverMinutes = g.TryGetProperty("playtime_forever", out var pf) ? pf.GetInt32() : 0,
                    ImgIconUrl = g.TryGetProperty("img_icon_url", out var icon) ? $"https://media.steampowered.com/steamcommunity/public/images/apps/{appId}/{icon.GetString()}.jpg" : null,
                });
            }
        }
        return results;
    }

    public async Task<int?> GetSteamLevelAsync(string steamId, CancellationToken ct = default)
    {
        EnsureApiKey();
        var url = $"{WebApi}/IPlayerService/GetSteamLevel/v0001/?key={_apiKey}&steamid={steamId}&format=json";
        using var doc = await GetJsonAsync(url, ct);

        if (doc.RootElement.TryGetProperty("response", out var resp) &&
            resp.TryGetProperty("player_level", out var lvl))
            return lvl.GetInt32();

        return null;
    }

    // ════════════════════════════════════════════════════════════
    //  ISteamUserStats
    // ════════════════════════════════════════════════════════════

    public async Task<List<SteamPlayerAchievement>> GetPlayerAchievementsAsync(string steamId, int appId, CancellationToken ct = default)
    {
        EnsureApiKey();
        var url = $"{WebApi}/ISteamUserStats/GetPlayerAchievements/v0001/?key={_apiKey}&steamid={steamId}&appid={appId}&l=english";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamPlayerAchievement>();
        if (doc.RootElement.TryGetProperty("playerstats", out var ps) &&
            ps.TryGetProperty("achievements", out var achievements))
        {
            foreach (var a in achievements.EnumerateArray())
            {
                results.Add(new SteamPlayerAchievement
                {
                    ApiName = a.TryGetProperty("apiname", out var an) ? an.GetString() ?? "" : "",
                    Name = a.TryGetProperty("name", out var nm) ? nm.GetString() ?? "" : a.TryGetProperty("apiname", out var an2) ? an2.GetString() ?? "" : "",
                    Description = a.TryGetProperty("description", out var desc) ? desc.GetString() : null,
                    Achieved = a.TryGetProperty("achieved", out var ach) && ach.GetInt32() == 1,
                    UnlockTime = a.TryGetProperty("unlocktime", out var ut) ? ut.GetInt64() : 0,
                });
            }
        }
        return results;
    }

    public async Task<List<SteamGlobalAchievement>> GetGlobalAchievementPercentagesAsync(int appId, CancellationToken ct = default)
    {
        var url = $"{WebApi}/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?gameid={appId}&format=json";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamGlobalAchievement>();
        if (doc.RootElement.TryGetProperty("achievementpercentages", out var ap) &&
            ap.TryGetProperty("achievements", out var achievements))
        {
            foreach (var a in achievements.EnumerateArray())
            {
                results.Add(new SteamGlobalAchievement
                {
                    Name = a.GetProperty("name").GetString() ?? "",
                    Percent = a.GetProperty("percent").GetDouble(),
                });
            }
        }
        return results;
    }

    // ════════════════════════════════════════════════════════════
    //  ISteamNews
    // ════════════════════════════════════════════════════════════

    public async Task<List<SteamNewsItem>> GetNewsForAppAsync(int appId, int count = 10, int maxLength = 500, CancellationToken ct = default)
    {
        var url = $"{WebApi}/ISteamNews/GetNewsForApp/v0002/?appid={appId}&count={count}&maxlength={maxLength}&format=json";
        using var doc = await GetJsonAsync(url, ct);

        var results = new List<SteamNewsItem>();
        if (doc.RootElement.TryGetProperty("appnews", out var an) &&
            an.TryGetProperty("newsitems", out var news))
        {
            foreach (var ni in news.EnumerateArray())
            {
                results.Add(new SteamNewsItem
                {
                    Gid = ni.TryGetProperty("gid", out var gid) ? gid.GetString() ?? "" : "",
                    AppId = appId,
                    Title = ni.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                    Url = ni.TryGetProperty("url", out var u) ? u.GetString() ?? "" : "",
                    Author = ni.TryGetProperty("author", out var au) ? au.GetString() ?? "" : "",
                    Contents = ni.TryGetProperty("contents", out var c) ? c.GetString() ?? "" : "",
                    FeedLabel = ni.TryGetProperty("feedlabel", out var fl) ? fl.GetString() ?? "" : "",
                    Date = ni.TryGetProperty("date", out var d) ? d.GetInt64() : 0,
                });
            }
        }
        return results;
    }

    // ════════════════════════════════════════════════════════════
    //  Store Wishlist (public endpoint, no key)
    // ════════════════════════════════════════════════════════════

    public async Task<List<SteamWishlistItem>> GetWishlistAsync(string steamId, CancellationToken ct = default)
    {
        var results = new List<SteamWishlistItem>();
        var page = 0;
        while (true)
        {
            var url = $"https://store.steampowered.com/wishlist/profiles/{steamId}/wishlistdata/?p={page}";
            var json = await _http.GetStringAsync(url, ct);
            if (string.IsNullOrWhiteSpace(json) || json == "[]") break;

            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) break;

            var count = 0;
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                if (!int.TryParse(prop.Name, out var appId)) continue;
                var v = prop.Value;
                results.Add(new SteamWishlistItem
                {
                    AppId = appId,
                    Name = v.TryGetProperty("name", out var nm) ? nm.GetString() ?? "" : "",
                    Priority = v.TryGetProperty("priority", out var pr) ? pr.GetInt32() : 0,
                    DateAdded = v.TryGetProperty("added", out var da) ? da.GetInt64() : 0,
                    CapsuleUrl = v.TryGetProperty("capsule", out var cap) ? cap.GetString() : null,
                    IsFreeToPlay = v.TryGetProperty("is_free_game", out var fg) && fg.GetBoolean(),
                });
                count++;
            }
            if (count == 0) break;
            page++;
        }
        return results;
    }

    // ════════════════════════════════════════════════════════════
    //  HELPERS
    // ════════════════════════════════════════════════════════════

    private void EnsureApiKey()
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new InvalidOperationException("Steam API key not configured. Set 'Steam:ApiKey' in appsettings.");
    }

    private static string BoolParam(bool value) => value ? "1" : "0";

    private async Task<JsonDocument> GetJsonAsync(string url, CancellationToken ct)
    {
        var json = await _http.GetStringAsync(url, ct);
        return JsonDocument.Parse(json);
    }
}
