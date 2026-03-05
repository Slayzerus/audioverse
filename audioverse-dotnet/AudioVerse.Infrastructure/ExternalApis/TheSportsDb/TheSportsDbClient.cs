using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Infrastructure.ExternalApis.TheSportsDb;

/// <summary>TheSportsDB API v1 client. Free tier uses key "3" — or set TheSportsDb:ApiKey for Patreon key.</summary>
public class TheSportsDbClient : ITheSportsDbClient
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private string BaseUrl => $"https://www.thesportsdb.com/api/v1/json/{_apiKey}";

    public TheSportsDbClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["TheSportsDb:ApiKey"] ?? "3";
    }

    public async Task<List<SportsDbSearchResult>> SearchSportsAsync(string query, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/searchteams.php?t={Uri.EscapeDataString(query)}";
        try
        {
            var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!doc.TryGetProperty("teams", out var teams) || teams.ValueKind == JsonValueKind.Null) return [];
            return teams.EnumerateArray().Select(t => new SportsDbSearchResult
            {
                IdTeam = t.TryGetProperty("idTeam", out var id) ? int.TryParse(id.GetString(), out var i) ? i : 0 : 0,
                Name = t.TryGetProperty("strTeam", out var n) ? n.GetString() ?? "" : "",
                Sport = t.TryGetProperty("strSport", out var s) ? s.GetString() : null,
                League = t.TryGetProperty("strLeague", out var l) ? l.GetString() : null,
                BadgeUrl = t.TryGetProperty("strBadge", out var b) ? b.GetString() : null,
                Description = t.TryGetProperty("strDescriptionEN", out var d) ? d.GetString() : null
            }).ToList();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return []; }
    }

    public async Task<List<SportsDbEvent>> GetUpcomingEventsAsync(int leagueId, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/eventsnextleague.php?id={leagueId}";
        try
        {
            var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!doc.TryGetProperty("events", out var events) || events.ValueKind == JsonValueKind.Null) return [];
            return events.EnumerateArray().Select(e => new SportsDbEvent
            {
                IdEvent = e.TryGetProperty("idEvent", out var id) ? int.TryParse(id.GetString(), out var i) ? i : 0 : 0,
                EventName = e.TryGetProperty("strEvent", out var n) ? n.GetString() ?? "" : "",
                Sport = e.TryGetProperty("strSport", out var s) ? s.GetString() : null,
                League = e.TryGetProperty("strLeague", out var l) ? l.GetString() : null,
                HomeTeam = e.TryGetProperty("strHomeTeam", out var ht) ? ht.GetString() : null,
                AwayTeam = e.TryGetProperty("strAwayTeam", out var at) ? at.GetString() : null,
                DateEvent = e.TryGetProperty("dateEvent", out var de) ? de.GetString() : null,
                TimeEvent = e.TryGetProperty("strTime", out var te) ? te.GetString() : null,
                Venue = e.TryGetProperty("strVenue", out var v) ? v.GetString() : null,
                ThumbUrl = e.TryGetProperty("strThumb", out var th) ? th.GetString() : null
            }).ToList();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return []; }
    }

    public async Task<List<SportsDbLeague>> GetAllLeaguesAsync(CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/all_leagues.php";
        try
        {
            var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!doc.TryGetProperty("leagues", out var leagues) || leagues.ValueKind == JsonValueKind.Null) return [];
            return leagues.EnumerateArray().Select(l => new SportsDbLeague
            {
                IdLeague = l.TryGetProperty("idLeague", out var id) ? int.TryParse(id.GetString(), out var i) ? i : 0 : 0,
                Name = l.TryGetProperty("strLeague", out var n) ? n.GetString() ?? "" : "",
                Sport = l.TryGetProperty("strSport", out var s) ? s.GetString() : null,
                Country = l.TryGetProperty("strCountry", out var c) ? c.GetString() : null
            }).ToList();
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return []; }
    }
}
