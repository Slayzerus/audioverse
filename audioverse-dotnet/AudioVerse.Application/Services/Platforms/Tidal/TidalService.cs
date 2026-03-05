using AudioVerse.Application.Models.Platforms.Tidal;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Album = AudioVerse.Application.Models.Platforms.Tidal.Album;
using Artist = AudioVerse.Application.Models.Platforms.Tidal.Artist;
using Playlist = AudioVerse.Application.Models.Platforms.Tidal.Playlist;
using SearchResults = AudioVerse.Application.Models.Platforms.Tidal.SearchResults;
using Track = AudioVerse.Application.Models.Platforms.Tidal.Track;

namespace AudioVerse.Application.Services.Platforms.Tidal
{


    public sealed class TidalService : ITidalService
    {
        private readonly HttpClient _http;
        private readonly IOptions<TidalServiceOptions> _options;
        private readonly JsonSerializerOptions _json;


        private string? _accessToken;

        public TidalService(HttpClient httpClient, IOptions<TidalServiceOptions> options)
        {
            _http = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _options = options ?? throw new ArgumentNullException(nameof(options));

            _json = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            };
        }

        public void SetAccessToken(string accessToken)
        {
            _accessToken = accessToken;
        }

        // ------------------------ AUTH ------------------------
        public async Task<TidalAuthTokens> AuthenticateWithAuthCodeAsync(string code, string redirectUri, CancellationToken ct = default)
        {
            // NOTE: Real TIDAL OAuth flows may differ and require a client-gateway. Adjust accordingly.
            var form = new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = redirectUri,
                ["client_id"] = _options.Value.ClientId,
            };
            if (!string.IsNullOrWhiteSpace(_options.Value.ClientSecret))
                form.Add("client_secret", _options.Value.ClientSecret!);

            using var req = new HttpRequestMessage(HttpMethod.Post, Combine(_options.Value.AuthBaseUrl, "/oauth2/token"))
            {
                Content = new FormUrlEncodedContent(form)
            };
            var tokens = await SendAsync<TidalAuthTokens>(req, ct);
            tokens.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
            _accessToken = tokens.AccessToken;
            return tokens;
        }

        public async Task<TidalAuthTokens> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
        {
            var form = new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = refreshToken,
                ["client_id"] = _options.Value.ClientId,
            };
            if (!string.IsNullOrWhiteSpace(_options.Value.ClientSecret))
                form.Add("client_secret", _options.Value.ClientSecret!);

            using var req = new HttpRequestMessage(HttpMethod.Post, Combine(_options.Value.AuthBaseUrl, "/oauth2/token"))
            {
                Content = new FormUrlEncodedContent(form)
            };
            var tokens = await SendAsync<TidalAuthTokens>(req, ct);
            tokens.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
            _accessToken = tokens.AccessToken;
            return tokens;
        }

        // --------------------- SEARCH/CATALOG -----------------
        public Task<SearchResults> SearchAsync(string query, int limit = 20, int offset = 0, CancellationToken ct = default)
        {
            var uri = Combine(_options.Value.ApiBaseUrl, $"/search?q={Uri.EscapeDataString(query)}&limit={limit}&offset={offset}&countryCode={_options.Value.CountryCode}");
            return GetAsync<SearchResults>(uri, ct);
        }

        public Task<Track> GetTrackAsync(string trackId, CancellationToken ct = default)
            => GetAsync<Track>(Combine(_options.Value.ApiBaseUrl, $"/tracks/{trackId}?countryCode={_options.Value.CountryCode}"), ct);

        public Task<Album> GetAlbumAsync(string albumId, CancellationToken ct = default)
            => GetAsync<Album>(Combine(_options.Value.ApiBaseUrl, $"/albums/{albumId}?countryCode={_options.Value.CountryCode}"), ct);

        public Task<PagedResponse<Track>> GetAlbumTracksAsync(string albumId, int limit = 50, int offset = 0, CancellationToken ct = default)
            => GetAsync<PagedResponse<Track>>(Combine(_options.Value.ApiBaseUrl, $"/albums/{albumId}/tracks?limit={limit}&offset={offset}&countryCode={_options.Value.CountryCode}"), ct);

        public Task<Artist> GetArtistAsync(string artistId, CancellationToken ct = default)
            => GetAsync<Artist>(Combine(_options.Value.ApiBaseUrl, $"/artists/{artistId}?countryCode={_options.Value.CountryCode}"), ct);

        public Task<PagedResponse<Track>> GetArtistTopTracksAsync(string artistId, int limit = 20, int offset = 0, CancellationToken ct = default)
            => GetAsync<PagedResponse<Track>>(Combine(_options.Value.ApiBaseUrl, $"/artists/{artistId}/top-tracks?limit={limit}&offset={offset}&countryCode={_options.Value.CountryCode}"), ct);

        // ----------------------- USER -------------------------
        public Task<UserProfile> GetCurrentUserAsync(CancellationToken ct = default)
            => GetAsync<UserProfile>(Combine(_options.Value.ApiBaseUrl, "/me"), ct);

        public Task<PagedResponse<Playlist>> GetUserPlaylistsAsync(string? userId = null, int limit = 50, int offset = 0, CancellationToken ct = default)
        {
            var path = userId is null ? "/me/playlists" : $"/users/{userId}/playlists";
            var uri = Combine(_options.Value.ApiBaseUrl, $"{path}?limit={limit}&offset={offset}");
            return GetAsync<PagedResponse<Playlist>>(uri, ct);
        }

        // --------------------- PLAYLISTS ----------------------
        public async Task<Playlist> CreatePlaylistAsync(CreatePlaylistRequest request, CancellationToken ct = default)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, Combine(_options.Value.ApiBaseUrl, "/playlists"))
            {
                Content = JsonContent(request)
            };
            return await SendAsync<Playlist>(req, ct);
        }

        public Task AddTracksToPlaylistAsync(string playlistId, AddTracksRequest request, CancellationToken ct = default)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, Combine(_options.Value.ApiBaseUrl, $"/playlists/{playlistId}/tracks"))
            {
                Content = JsonContent(request)
            };
            return SendNoContentAsync(req, ct);
        }

        public Task RemoveTracksFromPlaylistAsync(string playlistId, RemoveTracksRequest request, CancellationToken ct = default)
        {
            using var req = new HttpRequestMessage(HttpMethod.Delete, Combine(_options.Value.ApiBaseUrl, $"/playlists/{playlistId}/tracks"))
            {
                Content = JsonContent(request)
            };
            return SendNoContentAsync(req, ct);
        }

        public Task<Playlist> GetPlaylistAsync(string playlistId, CancellationToken ct = default)
            => GetAsync<Playlist>(Combine(_options.Value.ApiBaseUrl, $"/playlists/{playlistId}"), ct);

        public Task<PagedResponse<PlaylistItem>> GetPlaylistItemsAsync(string playlistId, int limit = 100, int offset = 0, CancellationToken ct = default)
            => GetAsync<PagedResponse<PlaylistItem>>(Combine(_options.Value.ApiBaseUrl, $"/playlists/{playlistId}/items?limit={limit}&offset={offset}"), ct);

        // --------------------- LIBRARY ------------------------
        public Task LikeTrackAsync(string trackId, CancellationToken ct = default)
            => SendNoContentAsync(new HttpRequestMessage(HttpMethod.Put, Combine(_options.Value.ApiBaseUrl, $"/me/favorites/tracks/{trackId}")), ct);

        public Task UnlikeTrackAsync(string trackId, CancellationToken ct = default)
            => SendNoContentAsync(new HttpRequestMessage(HttpMethod.Delete, Combine(_options.Value.ApiBaseUrl, $"/me/favorites/tracks/{trackId}")), ct);

        // -------------------- STREAMS/EXTRAS ------------------
        public Task<StreamUrlResponse> GetStreamUrlAsync(string trackId, SoundQuality? quality = null, CancellationToken ct = default)
        {
            var q = quality ?? _options.Value.DefaultQuality;
            var uri = Combine(_options.Value.ApiBaseUrl, $"/tracks/{trackId}/stream-url?quality={q}&countryCode={_options.Value.CountryCode}");
            return GetAsync<StreamUrlResponse>(uri, ct);
        }

        public async Task<Lyrics?> GetLyricsAsync(string trackId, CancellationToken ct = default)
            => await GetAsync<Lyrics>(Combine(_options.Value.ApiBaseUrl, $"/tracks/{trackId}/lyrics"), ct);

        // -------------------- DISCOVERY -----------------------
        public Task<PagedResponse<Track>> GetRecommendationsAsync(string? seedTrackId = null, string? seedArtistId = null, int limit = 20, int offset = 0, CancellationToken ct = default)
        {
            var sb = new StringBuilder("/recommendations/tracks?");
            if (!string.IsNullOrWhiteSpace(seedTrackId)) sb.Append($"seed_track={Uri.EscapeDataString(seedTrackId)}&");
            if (!string.IsNullOrWhiteSpace(seedArtistId)) sb.Append($"seed_artist={Uri.EscapeDataString(seedArtistId)}&");
            sb.Append($"limit={limit}&offset={offset}&countryCode={_options.Value.CountryCode}");
            return GetAsync<PagedResponse<Track>>(Combine(_options.Value.ApiBaseUrl, sb.ToString()), ct);
        }

        public Task<IReadOnlyList<string>> GetGenresAsync(CancellationToken ct = default)
            => GetAsync<IReadOnlyList<string>>(Combine(_options.Value.ApiBaseUrl, "/genres"), ct);

        public Task<IReadOnlyList<string>> GetMoodsAndActivitiesAsync(CancellationToken ct = default)
            => GetAsync<IReadOnlyList<string>>(Combine(_options.Value.ApiBaseUrl, "/moods-activities"), ct);

        // -------------------- LOW-LEVEL HELPERS ---------------
        private async Task<T> GetAsync<T>(string uri, CancellationToken ct)
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            return await SendAsync<T>(req, ct);
        }

        private async Task<T> SendAsync<T>(HttpRequestMessage request, CancellationToken ct)
        {
            EnsureAuthHeader(request);
            using var res = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                TryThrow(body, res.StatusCode);
            }
            var result = JsonSerializer.Deserialize<T>(body, _json);
            if (result == null)
                throw new TidalApiException($"Failed to deserialize {typeof(T).Name}", res.StatusCode, body);
            return result;
        }

        private async Task SendNoContentAsync(HttpRequestMessage request, CancellationToken ct)
        {
            EnsureAuthHeader(request);
            using var res = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                TryThrow(body, res.StatusCode);
            }
        }

        private HttpContent JsonContent<T>(T value)
            => new StringContent(JsonSerializer.Serialize(value, _json), Encoding.UTF8, "application/json");

        private void EnsureAuthHeader(HttpRequestMessage req)
        {
            if (!string.IsNullOrWhiteSpace(_accessToken))
            {
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            }
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        private void TryThrow(string? body, HttpStatusCode status)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(body))
                {
                    var err = JsonSerializer.Deserialize<ErrorResponse>(body, _json);
                    if (err != null && (!string.IsNullOrWhiteSpace(err.Error) || !string.IsNullOrWhiteSpace(err.Message)))
                        throw new TidalApiException($"{err.Error ?? err.Message}".Trim(), status, body);
                }
            }
            catch (JsonException)
            {
                // ignore
            }
            throw new TidalApiException($"TIDAL API error ({(int)status} {status})", status, body);
        }

        private static string Combine(string baseUrl, string relative)
        {
            if (string.IsNullOrEmpty(baseUrl)) return relative;
            if (string.IsNullOrEmpty(relative)) return baseUrl;
            return baseUrl.TrimEnd('/') + "/" + relative.TrimStart('/');
        }
    }
}
