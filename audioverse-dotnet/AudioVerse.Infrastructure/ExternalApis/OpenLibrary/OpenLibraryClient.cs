using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AudioVerse.Infrastructure.ExternalApis.OpenLibrary;

/// <summary>Open Library API client. No API key required.</summary>
public class OpenLibraryClient : IOpenLibraryClient
{
    private readonly HttpClient _http;
    private const string BaseUrl = "https://openlibrary.org";
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

    public OpenLibraryClient(HttpClient http) => _http = http;

    public async Task<List<OpenLibrarySearchResult>> SearchAsync(string query, int limit = 20, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/search.json?q={Uri.EscapeDataString(query)}&limit={limit}";
        var resp = await _http.GetFromJsonAsync<OlSearchResponse>(url, JsonOpts, ct);
        return resp?.Docs?.Select(d => new OpenLibrarySearchResult
        {
            Key = d.Key ?? "",
            Title = d.Title ?? "",
            Authors = d.AuthorName ?? [],
            FirstPublishYear = d.FirstPublishYear,
            CoverId = d.CoverI?.ToString(),
            Isbn = d.Isbn ?? []
        }).ToList() ?? [];
    }

    public async Task<OpenLibraryBookDetails?> GetByIsbnAsync(string isbn, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}/isbn/{Uri.EscapeDataString(isbn)}.json";
        return await FetchBookAsync(url, ct);
    }

    public async Task<OpenLibraryBookDetails?> GetByOlIdAsync(string olId, CancellationToken ct = default)
    {
        var url = $"{BaseUrl}{olId}.json";
        return await FetchBookAsync(url, ct);
    }

    private async Task<OpenLibraryBookDetails?> FetchBookAsync(string url, CancellationToken ct)
    {
        try
        {
            var raw = await _http.GetFromJsonAsync<JsonElement>(url, ct);
            return new OpenLibraryBookDetails
            {
                Key = raw.TryGetProperty("key", out var k) ? k.GetString() ?? "" : "",
                Title = raw.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                NumberOfPages = raw.TryGetProperty("number_of_pages", out var p) ? p.GetInt32() : null,
                Description = raw.TryGetProperty("description", out var d)
                    ? d.ValueKind == JsonValueKind.String ? d.GetString() : d.TryGetProperty("value", out var dv) ? dv.GetString() : null
                    : null
            };
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { return null; }
    }

    private class OlSearchResponse
    {
        [JsonPropertyName("docs")]
        public List<OlDoc>? Docs { get; set; }
    }

    private class OlDoc
    {
        [JsonPropertyName("key")] public string? Key { get; set; }
        [JsonPropertyName("title")] public string? Title { get; set; }
        [JsonPropertyName("author_name")] public List<string>? AuthorName { get; set; }
        [JsonPropertyName("first_publish_year")] public int? FirstPublishYear { get; set; }
        [JsonPropertyName("cover_i")] public int? CoverI { get; set; }
        [JsonPropertyName("isbn")] public List<string>? Isbn { get; set; }
    }
}
