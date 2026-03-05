using System.Xml.Linq;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Infrastructure.ExternalApis.Bgg;

/// <summary>
/// Client for BoardGameGeek XML API2.
/// Docs: https://boardgamegeek.com/wiki/page/BGG_XML_API2
/// Uses API token for authenticated access.
/// </summary>
public class BggClient : IBggClient
{
    private readonly HttpClient _http;
    private const string BaseUrl = "https://boardgamegeek.com/xmlapi2";

    public BggClient(HttpClient http, IConfiguration configuration)
    {
        _http = http;
        _http.DefaultRequestHeaders.UserAgent.TryParseAdd("AudioVerse/1.0");

        var token = configuration["Bgg:ApiToken"];
        if (!string.IsNullOrEmpty(token))
            _http.DefaultRequestHeaders.TryAddWithoutValidation("Authorization", $"Bearer {token}");
    }

    public async Task<List<BggSearchResult>> SearchAsync(string query, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/search?query={Uri.EscapeDataString(query)}&type=boardgame";
        var xml = await _http.GetStringAsync(url, ct);
        var doc = XDocument.Parse(xml);

        return doc.Descendants("item").Select(item => new BggSearchResult
        {
            BggId = int.Parse(item.Attribute("id")!.Value),
            Name = item.Element("name")?.Attribute("value")?.Value ?? string.Empty,
            YearPublished = int.TryParse(item.Element("yearpublished")?.Attribute("value")?.Value, out var y) ? y : null
        }).ToList();
    }

    public async Task<BggGameDetails?> GetDetailsAsync(int bggId, CancellationToken ct = default)
    {
        var results = await GetDetailsBatchAsync([bggId], ct);
        return results.FirstOrDefault();
    }

    public async Task<List<BggGameDetails>> GetDetailsBatchAsync(IEnumerable<int> bggIds, CancellationToken ct = default)
    {
        var ids = string.Join(",", bggIds);
        var url = $"{BaseUrl}/thing?id={ids}&stats=1";
        var xml = await _http.GetStringAsync(url, ct);
        var doc = XDocument.Parse(xml);

        return doc.Descendants("item").Select(item => ParseGameDetails(item)).ToList();
    }

    public async Task<List<BggHotGame>> GetHotGamesAsync(CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/hot?type=boardgame";
        var xml = await _http.GetStringAsync(url, ct);
        var doc = XDocument.Parse(xml);

        return doc.Descendants("item").Select(item => new BggHotGame
        {
            Rank = int.TryParse(item.Attribute("rank")?.Value, out var r) ? r : 0,
            BggId = int.Parse(item.Attribute("id")!.Value),
            Name = item.Element("name")?.Attribute("value")?.Value ?? string.Empty,
            ThumbnailUrl = item.Element("thumbnail")?.Attribute("value")?.Value,
            YearPublished = int.TryParse(item.Element("yearpublished")?.Attribute("value")?.Value, out var y) ? y : null
        }).ToList();
    }

    public async Task<List<BggCollectionItem>> GetUserCollectionAsync(string username, bool owned = true, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/collection?username={Uri.EscapeDataString(username)}&stats=1";
        if (owned) url += "&own=1";

        // BGG collection API may return 202 (processing), need to retry
        for (int i = 0; i < 5; i++)
        {
            var response = await _http.GetAsync(url, ct);
            if (response.StatusCode == System.Net.HttpStatusCode.Accepted)
            {
                await Task.Delay(2000, ct); // Wait and retry
                continue;
            }
            response.EnsureSuccessStatusCode();

            var xml = await response.Content.ReadAsStringAsync(ct);
            var doc = XDocument.Parse(xml);

            return doc.Descendants("item").Select(item => new BggCollectionItem
            {
                BggId = int.Parse(item.Attribute("objectid")!.Value),
                Name = item.Element("name")?.Value ?? string.Empty,
                YearPublished = int.TryParse(item.Element("yearpublished")?.Value, out var y) ? y : null,
                ThumbnailUrl = item.Element("thumbnail")?.Value,
                Owned = item.Element("status")?.Attribute("own")?.Value == "1",
                WantToPlay = item.Element("status")?.Attribute("wanttoplay")?.Value == "1",
                WantToBuy = item.Element("status")?.Attribute("wanttobuy")?.Value == "1",
                Wishlist = item.Element("status")?.Attribute("wishlist")?.Value == "1",
                NumPlays = int.TryParse(item.Element("numplays")?.Value, out var np) ? np : null,
                UserRating = double.TryParse(
                    item.Element("stats")?.Element("rating")?.Attribute("value")?.Value,
                    System.Globalization.NumberStyles.Float,
                    System.Globalization.CultureInfo.InvariantCulture,
                    out var ur) && ur > 0 ? Math.Round(ur, 2) : null
            }).ToList();
        }

        return [];
    }

    private static BggGameDetails ParseGameDetails(XElement item)
    {
        var bggId = int.Parse(item.Attribute("id")!.Value);

        var details = new BggGameDetails
        {
            BggId = bggId,
            Name = item.Elements("name").FirstOrDefault(n => n.Attribute("type")?.Value == "primary")?.Attribute("value")?.Value ?? string.Empty,
            Description = System.Net.WebUtility.HtmlDecode(item.Element("description")?.Value?.Trim()),
            MinPlayers = int.TryParse(item.Element("minplayers")?.Attribute("value")?.Value, out var mn) ? mn : 1,
            MaxPlayers = int.TryParse(item.Element("maxplayers")?.Attribute("value")?.Value, out var mx) ? mx : 4,
            PlayingTimeMinutes = int.TryParse(item.Element("playingtime")?.Attribute("value")?.Value, out var pt) ? pt : null,
            MinAge = int.TryParse(item.Element("minage")?.Attribute("value")?.Value, out var ma) ? ma : null,
            YearPublished = int.TryParse(item.Element("yearpublished")?.Attribute("value")?.Value, out var yp) ? yp : null,
            ImageUrl = item.Element("image")?.Value?.Trim(),
            ThumbnailUrl = item.Element("thumbnail")?.Value?.Trim(),
        };

        // Statistics
        var ratings = item.Descendants("ratings").FirstOrDefault();
        if (ratings != null)
        {
            if (double.TryParse(ratings.Element("average")?.Attribute("value")?.Value,
                System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var avg))
                details.AverageRating = Math.Round(avg, 2);

            if (int.TryParse(ratings.Element("usersrated")?.Attribute("value")?.Value, out var ur))
                details.UsersRated = ur;

            if (double.TryParse(ratings.Element("averageweight")?.Attribute("value")?.Value,
                System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var w))
                details.Weight = Math.Round(w, 2);

            // Overall rank
            var rankElement = ratings.Descendants("rank")
                .FirstOrDefault(r => r.Attribute("name")?.Value == "boardgame");
            if (rankElement != null && int.TryParse(rankElement.Attribute("value")?.Value, out var rank))
                details.Rank = rank;
        }

        // Links (categories, mechanics, designers, etc.)
        details.Categories = ExtractLinks(item, "boardgamecategory");
        details.Mechanics = ExtractLinks(item, "boardgamemechanic");
        details.Designers = ExtractLinks(item, "boardgamedesigner");
        details.Artists = ExtractLinks(item, "boardgameartist");
        details.Publishers = ExtractLinks(item, "boardgamepublisher");

        return details;
    }

    private static List<string> ExtractLinks(XElement item, string type) =>
        item.Elements("link")
            .Where(l => l.Attribute("type")?.Value == type)
            .Select(l => l.Attribute("value")?.Value ?? "")
            .Where(v => !string.IsNullOrEmpty(v))
            .ToList();
}
