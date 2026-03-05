using AudioVerse.Application.Models.Audio;
using AudioVerse.Application.Models.SongInformations;
using AudioVerse.Application.Services.Platforms;
using AudioVerse.Application.Services.Platforms.Spotify;
using AudioVerse.Application.Services.Platforms.Tidal;
using System.Net.Http.Json;
using System.Text.Json;

namespace AudioVerse.Application.Services.SongInformations
{
    public class SongInformationService : ISongInformationService
    {
        private readonly HttpClient _http;

        private readonly ISpotifyService _spotify;
        private readonly ITidalService _tidal;
        private readonly IYouTubeService _youtube;

        public SongInformationService(HttpClient http, ISpotifyService spotify, ITidalService tidal, IYouTubeService youtube)
        {
            _http = http;
            _spotify = spotify;
            _tidal = tidal;
            _youtube = youtube;
        }

        public async Task<ExternalTrackResult?> LookupMusicBrainzAsync(string isrc, CancellationToken ct)
        {
            _http.DefaultRequestHeaders.UserAgent.TryParseAdd("AudioVerse/1.0 (contact@audioverse.local)");
            var resp = await _http.GetAsync($"https://musicbrainz.org/ws/2/recording?query=isrc:{isrc}&fmt=json&limit=1", ct);
            if (!resp.IsSuccessStatusCode) return null;
            var json = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
            if (!json.TryGetProperty("recordings", out var recs) || recs.GetArrayLength() == 0) return null;
            var rec = recs[0];
            return new ExternalTrackResult
            {
                ExternalId = rec.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
                Source = "MusicBrainz",
                Title = rec.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                Artist = rec.TryGetProperty("artist-credit", out var ac) && ac.GetArrayLength() > 0 && ac[0].TryGetProperty("name", out var n) ? n.GetString() ?? "" : "",
                ISRC = isrc
            };
        }

        // ---------------------- High-level API ----------------------
        public async Task<SongInformation> GetSongDetailsAsync(string songTitle, string artist, CancellationToken ct = default)
        {
            var info = new SongInformation { Title = songTitle, Artist = artist };
            var phraseStr = BuildPhrase(artist, songTitle, version: null).Phrase;
            await Task.WhenAll(
                EnrichFromSpotifyAsync(info, phraseStr, ct),
                EnrichFromTidalAsync(info, phraseStr, ct),
                EnrichFromYouTubeAsync(info, phraseStr, ct)
            );
            return info;
        }

        public async Task<SearchSongLinksResponse> SearchSongLinksAsync(SearchSongLinksRequest request, CancellationToken ct = default)
        {
            var results = new List<SongInformation>();
            var phrases = BuildPhrases(request);

            // Okresl aktywne platformy i opcje (All = fallback)
            var allOpts = request.Platforms.TryGetValue(MusicPlatform.All, out var all) ? all : new PlatformSearchOptions();
            bool doSpotify = request.Platforms.Keys.Contains(MusicPlatform.Spotify) || request.Platforms.Keys.Contains(MusicPlatform.All);
            bool doTidal = request.Platforms.Keys.Contains(MusicPlatform.Tidal) || request.Platforms.Keys.Contains(MusicPlatform.All);
            bool doYouTube = request.Platforms.Keys.Contains(MusicPlatform.YouTube) || request.Platforms.Keys.Contains(MusicPlatform.All);

            foreach (var p in phrases)
            {
                var info = new SongInformation { Title = p.Title, Artist = p.Artist };

                var tasks = new List<Task>();
                if (doSpotify) tasks.Add(EnrichFromSpotifyAsync(info, p.PhraseWithHints(request.Platforms.GetValueOrDefault(MusicPlatform.Spotify) ?? allOpts), ct));
                if (doTidal) tasks.Add(EnrichFromTidalAsync(info, p.PhraseWithHints(request.Platforms.GetValueOrDefault(MusicPlatform.Tidal) ?? allOpts), ct));
                if (doYouTube) tasks.Add(EnrichFromYouTubeAsync(info, p.PhraseWithHints(request.Platforms.GetValueOrDefault(MusicPlatform.YouTube) ?? allOpts), ct));

                await Task.WhenAll(tasks);
                results.Add(info);
            }

            return new SearchSongLinksResponse { Songs = results };
        }

        // ---------------------- Enrichers ---------------------------
        private async Task EnrichFromSpotifyAsync(SongInformation info, string phrase, CancellationToken ct)
        {
            try
            {
                var search = await _spotify.SearchAsync(phrase, types: "track", limit: 1, offset: 0, ct);
                var track = search.Tracks?.Items?.FirstOrDefault();
                if (track == null) return;

                info.Album ??= track.Album?.Name;
                if (track.DurationMs > 0) info.Duration ??= TimeSpan.FromMilliseconds(track.DurationMs);
                if (track.ExternalIds != null && track.ExternalIds.TryGetValue("isrc", out var isrc) && string.IsNullOrWhiteSpace(info.ISRC))
                    info.ISRC = isrc;

                info.StreamingLinks["Spotify"] = $"https://open.spotify.com/track/{track.Id}";
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                // best-effort; brak wyjatków w agregatorze
            }
        }

        private async Task EnrichFromTidalAsync(SongInformation info, string phrase, CancellationToken ct)
        {
            try
            {
                var search = await _tidal.SearchAsync(phrase, limit: 1, offset: 0, ct);
                var track = search.Tracks?.Items?.FirstOrDefault();
                if (track == null) return;

                info.Album ??= track.Album?.Title;
                if (track.DurationMs.HasValue && track.DurationMs.Value > 0)
                    info.Duration ??= TimeSpan.FromMilliseconds(track.DurationMs.Value);
                if (!string.IsNullOrWhiteSpace(track.Isrc) && string.IsNullOrWhiteSpace(info.ISRC))
                    info.ISRC = track.Isrc!;

                info.StreamingLinks["Tidal"] = $"https://tidal.com/browse/track/{track.Id}";
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                // swallow – agregator
            }
        }

        private async Task EnrichFromYouTubeAsync(SongInformation info, string phrase, CancellationToken ct)
        {
            try
            {
                var videoId = await _youtube.SearchSongAsync(
                    info.Artist,
                    info.Title + (string.IsNullOrWhiteSpace(info.Album) ? string.Empty : $" {info.Album}")
                );

                if (string.IsNullOrWhiteSpace(videoId))
                {
                    // fallback: cala fraze potraktuj jako tytul, bez artysty
                    videoId = await _youtube.SearchSongAsync(string.Empty, phrase);
                }

                if (string.IsNullOrWhiteSpace(videoId)) return;
                info.StreamingLinks["YouTube"] = $"https://www.youtube.com/watch?v={videoId}";
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                // swallow – agregator
            }
        }


        // ---------------------- Helpers ----------------------------
        private static (string Phrase, string Artist, string Title) BuildPhrase(string artist, string title, string? version)
        {
            var sb = new System.Text.StringBuilder();
            if (!string.IsNullOrWhiteSpace(artist)) sb.Append(artist).Append(' ');
            if (!string.IsNullOrWhiteSpace(title)) sb.Append(title).Append(' ');
            if (!string.IsNullOrWhiteSpace(version)) sb.Append(version);
            var phrase = sb.ToString().Trim();
            return (phrase, artist, title);
        }

        private static List<PhraseItem> BuildPhrases(SearchSongLinksRequest req)
        {
            if (!string.IsNullOrWhiteSpace(req.Phrase))
            {
                return new List<PhraseItem>
                {
                    new PhraseItem(
                        req.Phrase!,
                        req.Artists.FirstOrDefault() ?? string.Empty,
                        req.Titles.FirstOrDefault() ?? string.Empty
                    )
                };
            }

            var artists = req.Artists.Count > 0 ? req.Artists : new List<string> { string.Empty };
            var titles = req.Titles.Count > 0 ? req.Titles : new List<string> { string.Empty };
            var phrases = new List<PhraseItem>();

            foreach (var a in artists)
                foreach (var t in titles)
                {
                    var built = BuildPhrase(a, t, req.Version);
                    phrases.Add(new PhraseItem(built.Phrase, a, t));
                }
            return phrases;
        }

        private sealed record PhraseItem(string Phrase, string Artist, string Title)
        {
            public string PhraseWithHints(PlatformSearchOptions opts)
            {
                if (opts == null || string.IsNullOrWhiteSpace(opts.QueryHint)) return Phrase;
                return string.Concat(Phrase, " ", opts.QueryHint).Trim();
            }
        }

        // ---------------------- MusicBrainz API ---------------------

        private const string MusicBrainzBaseUrl = "https://musicbrainz.org/ws/2";
        private static readonly JsonSerializerOptions MbJsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.KebabCaseLower
        };

        private void EnsureMusicBrainzUserAgent()
        {
            if (!_http.DefaultRequestHeaders.UserAgent.Any())
            {
                _http.DefaultRequestHeaders.UserAgent.TryParseAdd("AudioVerse/1.0 (contact@audioverse.io)");
            }
        }

        public async Task<List<ExternalTrackResult>> SearchMusicBrainzAsync(string query, string type = "recording", int limit = 25, CancellationToken ct = default)
        {
            EnsureMusicBrainzUserAgent();
            var results = new List<ExternalTrackResult>();

            try
            {
                var url = $"{MusicBrainzBaseUrl}/{type}?query={Uri.EscapeDataString(query)}&fmt=json&limit={limit}";
                var resp = await _http.GetAsync(url, ct);
                if (!resp.IsSuccessStatusCode) return results;

                var json = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
                var arrayName = type == "recording" ? "recordings" : type == "artist" ? "artists" : "releases";

                if (!json.TryGetProperty(arrayName, out var items)) return results;

                foreach (var item in items.EnumerateArray())
                {
                    var result = new ExternalTrackResult
                    {
                        Source = "MusicBrainz",
                        ExternalId = item.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
                        Title = item.TryGetProperty("title", out var t) ? t.GetString() ?? "" :
                                item.TryGetProperty("name", out var n) ? n.GetString() ?? "" : ""
                    };

                    // Artist from artist-credit
                    if (item.TryGetProperty("artist-credit", out var ac) && ac.GetArrayLength() > 0)
                    {
                        var artistNames = new List<string>();
                        foreach (var credit in ac.EnumerateArray())
                        {
                            if (credit.TryGetProperty("name", out var artistName))
                                artistNames.Add(artistName.GetString() ?? "");
                            else if (credit.TryGetProperty("artist", out var artistObj) && artistObj.TryGetProperty("name", out var an))
                                artistNames.Add(an.GetString() ?? "");
                        }
                        result.Artist = string.Join(", ", artistNames);
                    }

                    // ISRC if available
                    if (item.TryGetProperty("isrcs", out var isrcs) && isrcs.GetArrayLength() > 0)
                    {
                        result.ISRC = isrcs[0].GetString();
                    }

                    // Duration
                    if (item.TryGetProperty("length", out var length) && length.TryGetInt32(out var ms))
                    {
                        result.DurationMs = ms;
                    }

                    results.Add(result);
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                // best-effort
            }

            return results;
        }

        public async Task<MusicBrainzRecording?> GetMusicBrainzRecordingAsync(string mbid, CancellationToken ct = default)
        {
            EnsureMusicBrainzUserAgent();
            try
            {
                var url = $"{MusicBrainzBaseUrl}/recording/{mbid}?inc=artist-credits+releases+isrcs&fmt=json";
                var resp = await _http.GetAsync(url, ct);
                if (!resp.IsSuccessStatusCode) return null;

                var json = await resp.Content.ReadAsStringAsync(ct);
                return JsonSerializer.Deserialize<MusicBrainzRecording>(json, MbJsonOptions);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                return null;
            }
        }

        public async Task<MusicBrainzArtist?> GetMusicBrainzArtistAsync(string mbid, CancellationToken ct = default)
        {
            EnsureMusicBrainzUserAgent();
            try
            {
                var url = $"{MusicBrainzBaseUrl}/artist/{mbid}?inc=tags&fmt=json";
                var resp = await _http.GetAsync(url, ct);
                if (!resp.IsSuccessStatusCode) return null;

                var json = await resp.Content.ReadAsStringAsync(ct);
                return JsonSerializer.Deserialize<MusicBrainzArtist>(json, MbJsonOptions);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                return null;
            }
        }

        public async Task<MusicBrainzRelease?> GetMusicBrainzReleaseAsync(string mbid, CancellationToken ct = default)
        {
            EnsureMusicBrainzUserAgent();
            try
            {
                var url = $"{MusicBrainzBaseUrl}/release/{mbid}?inc=artist-credits+release-groups&fmt=json";
                var resp = await _http.GetAsync(url, ct);
                if (!resp.IsSuccessStatusCode) return null;

                var json = await resp.Content.ReadAsStringAsync(ct);
                return JsonSerializer.Deserialize<MusicBrainzRelease>(json, MbJsonOptions);
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                return null;
            }
        }

        public async Task<List<ExternalTrackResult>> LookupByISRCAsync(string isrc, CancellationToken ct = default)
        {
            EnsureMusicBrainzUserAgent();
            var results = new List<ExternalTrackResult>();

            try
            {
                var url = $"{MusicBrainzBaseUrl}/recording?query=isrc:{isrc}&fmt=json&limit=10";
                var resp = await _http.GetAsync(url, ct);
                if (!resp.IsSuccessStatusCode) return results;

                var json = await resp.Content.ReadFromJsonAsync<JsonElement>(ct);
                if (!json.TryGetProperty("recordings", out var recs)) return results;

                foreach (var rec in recs.EnumerateArray())
                {
                    var result = new ExternalTrackResult
                    {
                        Source = "MusicBrainz",
                        ExternalId = rec.TryGetProperty("id", out var id) ? id.GetString() ?? "" : "",
                        Title = rec.TryGetProperty("title", out var t) ? t.GetString() ?? "" : "",
                        ISRC = isrc
                    };

                    if (rec.TryGetProperty("artist-credit", out var ac) && ac.GetArrayLength() > 0)
                    {
                        var names = new List<string>();
                        foreach (var c in ac.EnumerateArray())
                        {
                            if (c.TryGetProperty("artist", out var a) && a.TryGetProperty("name", out var n))
                                names.Add(n.GetString() ?? "");
                        }
                        result.Artist = string.Join(", ", names);
                    }

                    if (rec.TryGetProperty("length", out var len) && len.TryGetInt32(out var ms))
                        result.DurationMs = ms;

                    results.Add(result);
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) {
                // best-effort
            }

            return results;
        }
    }
}
