using System.Net.Http.Json;
using System.Text.Json;

namespace AudioVerse.Application.Services.SongInformations
{
    public class SongLicenseService : ISongLicenseService
    {
        private readonly HttpClient _http;
        public SongLicenseService(HttpClient http) { _http = http; }

        public async Task<IReadOnlyList<SongLicenseInfo>> GetLicenseInfoAsync(string title, string artist, CancellationToken ct)
        {
            var results = new List<SongLicenseInfo>();

            // MusicBrainz lookup
            try
            {
                _http.DefaultRequestHeaders.UserAgent.TryParseAdd("AudioVerse/1.0 (contact@audioverse.local)");
                var q = Uri.EscapeDataString($"{title} AND artist:{artist}");
                var resp = await _http.GetAsync($"https://musicbrainz.org/ws/2/recording?query={q}&fmt=json&limit=1", ct);
                if (resp.IsSuccessStatusCode)
                {
                    var json = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
                    if (json.TryGetProperty("recordings", out var recs) && recs.GetArrayLength() > 0)
                    {
                        var rec = recs[0];
                        var mbId = rec.TryGetProperty("id", out var id) ? id.GetString() : null;
                        results.Add(new SongLicenseInfo("MusicBrainz", null, null, null, mbId != null ? $"https://musicbrainz.org/recording/{mbId}" : null));
                    }
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { /* non-critical */ }

            return results;
        }
    }
}
