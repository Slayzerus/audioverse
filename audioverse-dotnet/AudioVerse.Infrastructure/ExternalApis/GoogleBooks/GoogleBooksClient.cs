using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace AudioVerse.Infrastructure.ExternalApis.GoogleBooks;

/// <summary>Google Books API v1 client. Optional config key GoogleBooks:ApiKey (works without key with lower quota).</summary>
public class GoogleBooksClient : IGoogleBooksClient
{
    private readonly HttpClient _http;
    private readonly string? _apiKey;
    private const string BaseUrl = "https://www.googleapis.com/books/v1";

    public GoogleBooksClient(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["GoogleBooks:ApiKey"];
    }

    public async Task<List<GoogleBooksSearchResult>> SearchAsync(string query, int limit = 20, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/volumes?q={Uri.EscapeDataString(query)}&maxResults={Math.Min(limit, 40)}";
        if (!string.IsNullOrWhiteSpace(_apiKey)) url += $"&key={_apiKey}";

        var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
        if (!doc.TryGetProperty("items", out var items)) return [];

        return items.EnumerateArray().Select(ParseSearchResult).ToList();
    }

    public async Task<GoogleBooksDetails?> GetByIdAsync(string volumeId, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/volumes/{Uri.EscapeDataString(volumeId)}";
        if (!string.IsNullOrWhiteSpace(_apiKey)) url += $"?key={_apiKey}";

        try
        {
            var doc = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            if (!doc.TryGetProperty("volumeInfo", out var vi)) return null;

            return new GoogleBooksDetails
            {
                Id = doc.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
                Title = vi.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                Subtitle = vi.TryGetProperty("subtitle", out var sub) ? sub.GetString() : null,
                Authors = vi.TryGetProperty("authors", out var a) ? a.EnumerateArray().Select(x => x.GetString() ?? "").ToList() : [],
                Publisher = vi.TryGetProperty("publisher", out var p) ? p.GetString() : null,
                PublishedDate = vi.TryGetProperty("publishedDate", out var pd) ? pd.GetString() : null,
                Description = vi.TryGetProperty("description", out var d) ? d.GetString() : null,
                PageCount = vi.TryGetProperty("pageCount", out var pc) ? pc.GetInt32() : null,
                Categories = vi.TryGetProperty("categories", out var c) ? c.EnumerateArray().Select(x => x.GetString() ?? "").ToList() : [],
                ThumbnailUrl = vi.TryGetProperty("imageLinks", out var il) && il.TryGetProperty("thumbnail", out var th) ? th.GetString() : null,
                Language = vi.TryGetProperty("language", out var l) ? l.GetString() : null,
                Isbn13 = ExtractIsbn13(vi),
                AverageRating = vi.TryGetProperty("averageRating", out var ar) ? ar.GetDouble() : null
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return null; }
    }

    private static GoogleBooksSearchResult ParseSearchResult(JsonElement item)
    {
        var vi = item.TryGetProperty("volumeInfo", out var v) ? v : default;
        return new GoogleBooksSearchResult
        {
            Id = item.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
            Title = vi.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
            Authors = vi.TryGetProperty("authors", out var a) ? a.EnumerateArray().Select(x => x.GetString() ?? "").ToList() : [],
            Description = vi.TryGetProperty("description", out var d) ? d.GetString() : null,
            ThumbnailUrl = vi.TryGetProperty("imageLinks", out var il) && il.TryGetProperty("smallThumbnail", out var th) ? th.GetString() : null,
            PublishedDate = vi.TryGetProperty("publishedDate", out var pd) ? pd.GetString() : null,
            PageCount = vi.TryGetProperty("pageCount", out var pc) ? pc.GetInt32() : null,
            Categories = vi.TryGetProperty("categories", out var c) ? c.EnumerateArray().Select(x => x.GetString() ?? "").ToList() : [],
            Isbn13 = ExtractIsbn13(vi)
        };
    }

    private static string? ExtractIsbn13(JsonElement vi)
    {
        if (!vi.TryGetProperty("industryIdentifiers", out var ids)) return null;
        foreach (var ii in ids.EnumerateArray())
        {
            if (ii.TryGetProperty("type", out var tp) && tp.GetString() == "ISBN_13" && ii.TryGetProperty("identifier", out var ident))
                return ident.GetString();
        }
        return null;
    }
}
