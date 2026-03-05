using AudioVerse.Application.Models.Platforms.Spotify;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace AudioVerse.Application.Services.Platforms.Spotify
{
    public sealed class SpotifyService : ISpotifyService
    {
        private readonly HttpClient _http;
        private readonly SpotifyServiceOptions _options;
        private readonly JsonSerializerOptions _json;
        private string? _accessToken;

        public SpotifyService(HttpClient httpClient, SpotifyServiceOptions options)
        {
            _http = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
            _options = options ?? throw new ArgumentNullException(nameof(options));

            _json = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            };
        }

        public void SetAccessToken(string accessToken) => _accessToken = accessToken;

        // ------------------------ AUTH ------------------------
        public async Task<SpotifyAuthTokens> AuthenticateWithAuthCodeAsync(string code, string redirectUri, CancellationToken ct = default)
        {
            var form = new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = redirectUri,
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
            };
            var tokenUrl = Combine(_options.AccountsBaseUrl, "/api/token");
            using var req = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
            {
                Content = new FormUrlEncodedContent(form)
            };
            var tokens = await SendTokenAsync(req, ct);
            tokens.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
            _accessToken = tokens.AccessToken;
            return tokens;
        }

        public async Task<SpotifyAuthTokens> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
        {
            var form = new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = refreshToken,
                ["client_id"] = _options.ClientId,
                ["client_secret"] = _options.ClientSecret,
            };
            var tokenUrl = Combine(_options.AccountsBaseUrl, "/api/token");
            using var req = new HttpRequestMessage(HttpMethod.Post, tokenUrl)
            {
                Content = new FormUrlEncodedContent(form)
            };
            var tokens = await SendTokenAsync(req, ct);
            tokens.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
            if (!string.IsNullOrWhiteSpace(tokens.AccessToken))
                _accessToken = tokens.AccessToken;
            return tokens;
        }

        // --------------------- SEARCH/CATALOG -----------------
        public Task<SearchResults> SearchAsync(string query, string types = "track,album,artist,playlist", int limit = 20, int offset = 0, CancellationToken ct = default)
        {
            var uri = Combine(_options.ApiBaseUrl, $"/search?q={Uri.EscapeDataString(query)}&type={Uri.EscapeDataString(types)}&limit={limit}&offset={offset}&market={_options.Market}");
            return GetAsync<SearchResults>(uri, ct);
        }

        public Task<Track> GetTrackAsync(string trackId, CancellationToken ct = default)
            => GetAsync<Track>(Combine(_options.ApiBaseUrl, $"/tracks/{trackId}?market={_options.Market}"), ct);

        public Task<Album> GetAlbumAsync(string albumId, CancellationToken ct = default)
            => GetAsync<Album>(Combine(_options.ApiBaseUrl, $"/albums/{albumId}?market={_options.Market}"), ct);

        public Task<PagedResponse<Track>> GetAlbumTracksAsync(string albumId, int limit = 50, int offset = 0, CancellationToken ct = default)
            => GetAsync<PagedResponse<Track>>(Combine(_options.ApiBaseUrl, $"/albums/{albumId}/tracks?limit={limit}&offset={offset}&market={_options.Market}"), ct);

        public Task<Artist> GetArtistAsync(string artistId, CancellationToken ct = default)
            => GetAsync<Artist>(Combine(_options.ApiBaseUrl, $"/artists/{artistId}"), ct);

        public Task<PagedResponse<Track>> GetArtistTopTracksAsync(string artistId, string? market = null, CancellationToken ct = default)
            => GetAsync<PagedResponse<Track>>(Combine(_options.ApiBaseUrl, $"/artists/{artistId}/top-tracks?market={(market ?? _options.Market)}"), ct);

        // ----------------------- USER -------------------------
        public Task<UserProfile> GetCurrentUserAsync(CancellationToken ct = default)
            => GetAsync<UserProfile>(Combine(_options.ApiBaseUrl, "/me"), ct);

        public Task<PagedResponse<Playlist>> GetUserPlaylistsAsync(string? userId = null, int limit = 50, int offset = 0, CancellationToken ct = default)
        {
            var path = userId is null ? "/me/playlists" : $"/users/{userId}/playlists";
            var uri = Combine(_options.ApiBaseUrl, $"{path}?limit={limit}&offset={offset}");
            return GetAsync<PagedResponse<Playlist>>(uri, ct);
        }

        // --------------------- PLAYLISTS ----------------------
        public async Task<Playlist> CreatePlaylistAsync(string userId, CreatePlaylistRequest request, CancellationToken ct = default)
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, Combine(_options.ApiBaseUrl, $"/users/{userId}/playlists"))
            {
                Content = JsonContent(request)
            };
            return await SendAsync<Playlist>(req, ct);
        }

        public Task AddTracksToPlaylistAsync(string playlistId, AddTracksRequest request, CancellationToken ct = default)
        {
            var uris = NormalizeTrackUris(request.TrackUrisOrIds);
            var body = new { uris };
            using var req = new HttpRequestMessage(HttpMethod.Post, Combine(_options.ApiBaseUrl, $"/playlists/{playlistId}/tracks"))
            {
                Content = JsonContent(body)
            };
            return SendNoContentAsync(req, ct);
        }

        public Task RemoveTracksFromPlaylistAsync(string playlistId, RemoveTracksRequest request, CancellationToken ct = default)
        {
            var tracks = NormalizeTrackUris(request.TrackUrisOrIds).Select(u => new { uri = u }).ToList();
            var body = new { tracks };
            using var req = new HttpRequestMessage(HttpMethod.Delete, Combine(_options.ApiBaseUrl, $"/playlists/{playlistId}/tracks"))
            {
                Content = JsonContent(body)
            };
            return SendNoContentAsync(req, ct);
        }

        public Task<Playlist> GetPlaylistAsync(string playlistId, CancellationToken ct = default)
            => GetAsync<Playlist>(Combine(_options.ApiBaseUrl, $"/playlists/{playlistId}"), ct);

        public Task<PagedResponse<PlaylistItem>> GetPlaylistItemsAsync(string playlistId, int limit = 100, int offset = 0, CancellationToken ct = default)
            => GetAsync<PagedResponse<PlaylistItem>>(Combine(_options.ApiBaseUrl, $"/playlists/{playlistId}/tracks?limit={limit}&offset={offset}&market={_options.Market}"), ct);

        // --------------------- LIBRARY ------------------------
        public Task LikeTracksAsync(IEnumerable<string> trackIds, CancellationToken ct = default)
        {
            var ids = string.Join(',', trackIds);
            using var req = new HttpRequestMessage(HttpMethod.Put, Combine(_options.ApiBaseUrl, $"/me/tracks?ids={ids}"));
            return SendNoContentAsync(req, ct);
        }

        public Task UnlikeTracksAsync(IEnumerable<string> trackIds, CancellationToken ct = default)
        {
            var ids = string.Join(',', trackIds);
            using var req = new HttpRequestMessage(HttpMethod.Delete, Combine(_options.ApiBaseUrl, $"/me/tracks?ids={ids}"));
            return SendNoContentAsync(req, ct);
        }

        public Task<PagedResponse<Track>> GetUserSavedTracksAsync(int limit = 50, int offset = 0, CancellationToken ct = default)
            => GetAsync<PagedResponse<Track>>(Combine(_options.ApiBaseUrl, $"/me/tracks?limit={limit}&offset={offset}&market={_options.Market}"), ct);

        // ---------------------- EXTRAS ------------------------
        public Task<AudioFeatures> GetAudioFeaturesAsync(string trackId, CancellationToken ct = default)
            => GetAsync<AudioFeatures>(Combine(_options.ApiBaseUrl, $"/audio-features/{trackId}"), ct);

        public Task<RecommendationsResponse> GetRecommendationsAsync(IEnumerable<string>? seedTracks = null, IEnumerable<string>? seedArtists = null, IEnumerable<string>? seedGenres = null, int limit = 20, CancellationToken ct = default)
        {
            var qs = new List<string> { $"limit={limit}", $"market={_options.Market}" };
            if (seedTracks != null)
            {
                var s = string.Join(',', seedTracks);
                if (!string.IsNullOrWhiteSpace(s)) qs.Add($"seed_tracks={Uri.EscapeDataString(s)}");
            }
            if (seedArtists != null)
            {
                var s = string.Join(',', seedArtists);
                if (!string.IsNullOrWhiteSpace(s)) qs.Add($"seed_artists={Uri.EscapeDataString(s)}");
            }
            if (seedGenres != null)
            {
                var s = string.Join(',', seedGenres);
                if (!string.IsNullOrWhiteSpace(s)) qs.Add($"seed_genres={Uri.EscapeDataString(s)}");
            }
            var uri = Combine(_options.ApiBaseUrl, "/recommendations?" + string.Join('&', qs));
            return GetAsync<RecommendationsResponse>(uri, ct);
        }

        public Task<IReadOnlyList<string>> GetAvailableGenreSeedsAsync(CancellationToken ct = default)
            => GetAsync<IReadOnlyList<string>>(Combine(_options.ApiBaseUrl, "/recommendations/available-genre-seeds"), ct);

        // -------------------- FOLLOWING -----------------------
        public Task FollowArtistAsync(string artistId, CancellationToken ct = default)
        {
            using var req = new HttpRequestMessage(HttpMethod.Put, Combine(_options.ApiBaseUrl, $"/me/following?type=artist&ids={artistId}"));
            return SendNoContentAsync(req, ct);
        }

        public Task UnfollowArtistAsync(string artistId, CancellationToken ct = default)
        {
            using var req = new HttpRequestMessage(HttpMethod.Delete, Combine(_options.ApiBaseUrl, $"/me/following?type=artist&ids={artistId}"));
            return SendNoContentAsync(req, ct);
        }

        // -------------------- LOW-LEVEL HELPERS ---------------
        private async Task<T> GetAsync<T>(string uri, CancellationToken ct)
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, uri);
            return await SendAsync<T>(req, ct);
        }

        private async Task<SpotifyAuthTokens> SendTokenAsync(HttpRequestMessage request, CancellationToken ct)
        {
            // For token endpoint we use Basic Auth recommended by Spotify as well as body client_id/secret already provided.
            var auth = System.Convert.ToBase64String(Encoding.UTF8.GetBytes($"{_options.ClientId}:{_options.ClientSecret}"));
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", auth);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

            using var res = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                TryThrow(body, res.StatusCode);
            }
            var tokens = JsonSerializer.Deserialize<SpotifyAuthTokens>(body, _json);
            if (tokens == null)
                throw new SpotifyApiException($"Failed to deserialize {nameof(SpotifyAuthTokens)}", res.StatusCode, body);
            return tokens;
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
                throw new SpotifyApiException($"Failed to deserialize {typeof(T).Name}", res.StatusCode, body);
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
                    // Spotify wraps error as { error: { status, message } } or string
                    var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("error", out var err))
                    {
                        string message = err.ValueKind switch
                        {
                            JsonValueKind.String => err.GetString()!,
                            JsonValueKind.Object when err.TryGetProperty("message", out var msg) => msg.GetString() ?? $"HTTP {(int)status}",
                            _ => $"HTTP {(int)status}"
                        };
                        throw new SpotifyApiException(message, status, body);
                    }
                }
            }
            catch (JsonException)
            {
                // ignore
            }
            throw new SpotifyApiException($"Spotify API error ({(int)status} {status})", status, body);
        }

        private static string Combine(string baseUrl, string relative)
        {
            if (string.IsNullOrEmpty(baseUrl)) return relative;
            if (string.IsNullOrEmpty(relative)) return baseUrl;
            return baseUrl.TrimEnd('/') + "/" + relative.TrimStart('/');
        }

        private static List<string> NormalizeTrackUris(IEnumerable<string> urisOrIds)
        {
            return urisOrIds
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(s => s!.StartsWith("spotify:track:", StringComparison.OrdinalIgnoreCase) ? s! : $"spotify:track:{s}")
                .ToList();
        }
    }
}
