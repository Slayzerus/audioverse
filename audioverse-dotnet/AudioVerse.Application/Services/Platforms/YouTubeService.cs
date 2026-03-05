using System.Net.Http.Headers;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using AudioVerse.Application.Models.Platforms.YouTube;

namespace AudioVerse.Application.Services.Platforms
{
    public class YouTubeService : IYouTubeService
    {
        private readonly HttpClient _httpClient;
        private readonly YouTubeServiceOptions _options;
        private readonly JsonSerializerOptions _json = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public YouTubeService(HttpClient httpClient, YouTubeServiceOptions options)
        {
            _httpClient = httpClient;
            _options = options;
        }

        public void SetAccessToken(string accessToken) => _options.AccessToken = accessToken;

        // ------------------------ SEARCH ------------------------
        public async Task<string?> SearchSongAsync(string artist, string title)
        {
            var resp = await SearchAsync($"{artist} {title} official music video", type: "video", maxResults: 1);
            if (resp.Items.Count == 0) return null;
            return resp.Items[0].Id.VideoId;
        }

        public Task<SearchResponse<SearchItem>> SearchAsync(string query, string type = "video", int maxResults = 25, string? pageToken = null, CancellationToken ct = default)
        {
            var url = new StringBuilder(Combine(_options.ApiBaseUrl, "/search"))
                .Append($"?part=snippet&q={Uri.EscapeDataString(query)}&type={Uri.EscapeDataString(type)}&maxResults={maxResults}&key={_options.ApiKey}");
            if (!string.IsNullOrWhiteSpace(pageToken)) url.Append($"&pageToken={pageToken}");
            return GetAsync<SearchResponse<SearchItem>>(url.ToString(), ct, useOAuth: false);
        }

        public string GetEmbedUrl(string videoId) => $"https://www.youtube.com/embed/{videoId}?enablejsapi=1";

        // ------------------------ VIDEOS -----------------------
        public async Task<Video?> GetVideoAsync(string id, CancellationToken ct = default)
        {
            var list = await GetVideosAsync(new[] { id }, ct);
            return list.Count > 0 ? list[0] : null;
        }

        public Task<List<Video>> GetVideosAsync(IEnumerable<string> ids, CancellationToken ct = default)
        {
            var idParam = string.Join(',', ids);
            var url = Combine(_options.ApiBaseUrl, $"/videos?part={_options.DefaultPartsVideo}&id={idParam}&key={_options.ApiKey}");
            return GetAsyncList<Video>(url, ct, "items");
        }

        // ------------------------ CHANNELS ---------------------
        public async Task<Channel?> GetChannelAsync(string id, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, $"/channels?part={_options.DefaultPartsChannel}&id={id}&key={_options.ApiKey}");
            var list = await GetAsyncList<Channel>(url, ct, "items");
            return list.Count > 0 ? list[0] : null;
        }

        // ------------------------ PLAYLISTS --------------------
        public async Task<Playlist?> GetPlaylistAsync(string id, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, $"/playlists?part={_options.DefaultPartsPlaylist}&id={id}&key={_options.ApiKey}");
            var list = await GetAsyncList<Playlist>(url, ct, "items");
            return list.Count > 0 ? list[0] : null;
        }

        public Task<SearchResponse<PlaylistItem>> GetPlaylistItemsAsync(string playlistId, int maxResults = 50, string? pageToken = null, CancellationToken ct = default)
        {
            var sb = new StringBuilder(Combine(_options.ApiBaseUrl, "/playlistItems"))
                .Append($"?part={_options.DefaultPartsPlaylistItems}&playlistId={playlistId}&maxResults={maxResults}&key={_options.ApiKey}");
            if (!string.IsNullOrWhiteSpace(pageToken)) sb.Append($"&pageToken={pageToken}");
            return GetAsync<SearchResponse<PlaylistItem>>(sb.ToString(), ct, useOAuth: false);
        }

        public Task<SearchResponse<Playlist>> ListChannelPlaylistsAsync(string channelId, int maxResults = 50, string? pageToken = null, CancellationToken ct = default)
        {
            var sb = new StringBuilder(Combine(_options.ApiBaseUrl, "/playlists"))
                .Append($"?part={_options.DefaultPartsPlaylist}&channelId={channelId}&maxResults={maxResults}&key={_options.ApiKey}");
            if (!string.IsNullOrWhiteSpace(pageToken)) sb.Append($"&pageToken={pageToken}");
            return GetAsync<SearchResponse<Playlist>>(sb.ToString(), ct, useOAuth: false);
        }

        // ------------------------ COMMENTS --------------------
        public Task<SearchResponse<CommentThread>> GetCommentsAsync(string videoId, string order = "relevance", int maxResults = 20, string? pageToken = null, CancellationToken ct = default)
        {
            var sb = new StringBuilder(Combine(_options.ApiBaseUrl, "/commentThreads"))
                .Append($"?part=snippet,replies&videoId={videoId}&maxResults={maxResults}&order={order}&key={_options.ApiKey}");
            if (!string.IsNullOrWhiteSpace(pageToken)) sb.Append($"&pageToken={pageToken}");
            return GetAsync<SearchResponse<CommentThread>>(sb.ToString(), ct, useOAuth: false);
        }

        // ------------------ CAPTIONS & CATEGORIES -------------
        public Task<SearchResponse<Caption>> GetCaptionsAsync(string videoId, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, $"/captions?part=snippet&videoId={videoId}&key={_options.ApiKey}");
            return GetAsync<SearchResponse<Caption>>(url, ct, useOAuth: false);
        }

        public Task<SearchResponse<VideoCategory>> GetVideoCategoriesAsync(string regionCode = "PL", CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, $"/videoCategories?part=snippet&regionCode={regionCode}&key={_options.ApiKey}");
            return GetAsync<SearchResponse<VideoCategory>>(url, ct, useOAuth: false);
        }

        // ------------------ OAUTH-PROTECTED ACTIONS -----------
        public Task RateVideoAsync(string videoId, string rating, CancellationToken ct = default)
        {
            // rating: like|dislike|none
            var url = Combine(_options.ApiBaseUrl, $"/videos/rate?id={videoId}&rating={rating}");
            using var req = new HttpRequestMessage(HttpMethod.Post, url);
            return SendNoContentAsync(req, ct, requireOAuth: true);
        }

        public async Task<Playlist> CreatePlaylistAsync(string title, string? description = null, string privacyStatus = "private", CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, "/playlists?part=snippet,status");
            var body = new
            {
                snippet = new { title, description },
                status = new { privacyStatus }
            };
            using var req = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent(body)
            };
            return await SendAsync<Playlist>(req, ct, requireOAuth: true);
        }

        public async Task<PlaylistItem> AddVideoToPlaylistAsync(string playlistId, string videoId, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, "/playlistItems?part=snippet");
            var body = new
            {
                snippet = new
                {
                    playlistId,
                    resourceId = new { kind = "youtube#video", videoId }
                }
            };
            using var req = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent(body)
            };
            return await SendAsync<PlaylistItem>(req, ct, requireOAuth: true);
        }

        public Task RemovePlaylistItemAsync(string playlistItemId, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, $"/playlistItems?id={playlistItemId}");
            using var req = new HttpRequestMessage(HttpMethod.Delete, url);
            return SendNoContentAsync(req, ct, requireOAuth: true);
        }

        public Task<SearchResponse<Playlist>> GetMyPlaylistsAsync(int maxResults = 50, string? pageToken = null, CancellationToken ct = default)
        {
            var sb = new StringBuilder(Combine(_options.ApiBaseUrl, "/playlists"))
                .Append($"?part={_options.DefaultPartsPlaylist}&mine=true&maxResults={maxResults}");
            if (!string.IsNullOrWhiteSpace(pageToken)) sb.Append($"&pageToken={pageToken}");
            return GetAsync<SearchResponse<Playlist>>(sb.ToString(), ct, useOAuth: true);
        }

        public Task SubscribeAsync(string channelId, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, "/subscriptions?part=snippet");
            var body = new { snippet = new { resourceId = new { kind = "youtube#channel", channelId } } };
            using var req = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = JsonContent(body)
            };
            return SendNoContentAsync(req, ct, requireOAuth: true);
        }

        public Task UnsubscribeAsync(string subscriptionId, CancellationToken ct = default)
        {
            var url = Combine(_options.ApiBaseUrl, $"/subscriptions?id={subscriptionId}");
            using var req = new HttpRequestMessage(HttpMethod.Delete, url);
            return SendNoContentAsync(req, ct, requireOAuth: true);
        }

        // ------------------ LOW-LEVEL HELPERS -----------------
        private async Task<T> GetAsync<T>(string url, CancellationToken ct, bool useOAuth)
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            return await SendAsync<T>(req, ct, requireOAuth: useOAuth);
        }

        private async Task<List<T>> GetAsyncList<T>(string url, CancellationToken ct, string itemsProperty)
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, url);
            EnsureHeaders(req, requireOAuth: false);
            using var res = await _httpClient.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode) ThrowError(body, res.StatusCode);

            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty(itemsProperty, out var items)) return new List<T>();
            var list = new List<T>();
            foreach (var el in items.EnumerateArray())
            {
                var parsed = el.Deserialize<T>(_json);
                if (parsed != null) list.Add(parsed);
            }
            return list;
        }

        private async Task<T> SendAsync<T>(HttpRequestMessage request, CancellationToken ct, bool requireOAuth)
        {
            EnsureHeaders(request, requireOAuth);
            using var res = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode) ThrowError(body, res.StatusCode);
            var result = JsonSerializer.Deserialize<T>(body, _json);
            if (result == null) throw new YouTubeApiException($"Failed to deserialize {typeof(T).Name}", res.StatusCode, body);
            return result;
        }

        private async Task SendNoContentAsync(HttpRequestMessage request, CancellationToken ct, bool requireOAuth)
        {
            EnsureHeaders(request, requireOAuth);
            using var res = await _httpClient.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct).ConfigureAwait(false);
            if (!res.IsSuccessStatusCode)
            {
                var body = await res.Content.ReadAsStringAsync(ct).ConfigureAwait(false);
                ThrowError(body, res.StatusCode);
            }
        }

        private HttpContent JsonContent<T>(T value)
            => new StringContent(JsonSerializer.Serialize(value, _json), Encoding.UTF8, "application/json");

        private void EnsureHeaders(HttpRequestMessage req, bool requireOAuth)
        {
            if (requireOAuth)
            {
                if (string.IsNullOrWhiteSpace(_options.AccessToken))
                    throw new YouTubeApiException("This endpoint requires an OAuth access token (call SetAccessToken).", HttpStatusCode.Unauthorized);
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.AccessToken);
            }
            req.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        private static string Combine(string baseUrl, string relative)
        {
            if (string.IsNullOrEmpty(baseUrl)) return relative;
            if (string.IsNullOrEmpty(relative)) return baseUrl;
            return baseUrl.TrimEnd('/') + "/" + relative.TrimStart('/');
        }

        private static void ThrowError(string? body, HttpStatusCode status)
        {
            string msg = $"YouTube API error ({(int)status} {status})";
            try
            {
                if (!string.IsNullOrWhiteSpace(body))
                {
                    using var doc = JsonDocument.Parse(body);
                    if (doc.RootElement.TryGetProperty("error", out var err))
                    {
                        if (err.ValueKind == JsonValueKind.Object && err.TryGetProperty("message", out var m))
                            msg = m.GetString() ?? msg;
                    }
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or System.Text.Json.JsonException) { /* ignore */ }
            throw new YouTubeApiException(msg, status, body);
        }
    }
}
