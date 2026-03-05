using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Services.Platforms;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Application.Models.Platforms.YouTube;
using AudioVerse.Application.Services;
using AudioVerse.API.Models.Requests.Platforms;
using Microsoft.Extensions.Options;

namespace AudioVerse.API.Areas.Platforms.Controllers
{
    [Route("api/platforms/youtube")]
    [ApiController]
    public class YouTubeController : ControllerBase
    {
        private readonly IYouTubeService _youTubeService;
        private readonly IExternalAccountRepository _extRepo;
        private readonly ICurrentUserService _currentUser;
        private readonly YouTubeServiceOptions _options;
        private readonly IHttpClientFactory _httpFactory;
        private readonly ILogger<YouTubeController> _logger;
        private readonly IConfiguration _configuration;

        public YouTubeController(IYouTubeService youTubeService,
            IExternalAccountRepository extRepo,
            ICurrentUserService currentUser,
            IOptions<YouTubeServiceOptions> options,
            IHttpClientFactory httpFactory,
            ILogger<YouTubeController> logger,
            IConfiguration configuration)
        {
            _youTubeService = youTubeService;
            _extRepo = extRepo;
            _currentUser = currentUser;
            _options = options.Value;
            _httpFactory = httpFactory;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// List authenticated user's subscriptions (paginated)
        /// </summary>
        [HttpGet("subscriptions")]
        [Authorize]
        public async Task<IActionResult> ListSubscriptions([FromQuery] int maxResults = 50, [FromQuery] string? pageToken = null)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            try
            {
                using var client = _httpFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", account.AccessToken);
                var url = $"https://www.googleapis.com/youtube/v3/subscriptions?part=snippet,contentDetails&mine=true&maxResults={Math.Clamp(maxResults, 1, 50)}";
                if (!string.IsNullOrEmpty(pageToken)) url += $"&pageToken={pageToken}";

                var res = await client.GetAsync(url);
                var body = await res.Content.ReadAsStringAsync();
                if (!res.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to list subscriptions: {Body}", body);
                    return BadRequest(new { error = "list_failed", detail = body });
                }

                using var doc = System.Text.Json.JsonDocument.Parse(body);
                var result = new
                {
                    items = new System.Collections.Generic.List<AudioVerse.API.Models.Platforms.YouTubeSubscriptionDto>(),
                    nextPageToken = doc.RootElement.TryGetProperty("nextPageToken", out var np) ? np.GetString() : null,
                    prevPageToken = doc.RootElement.TryGetProperty("prevPageToken", out var pp) ? pp.GetString() : null,
                    pageInfo = doc.RootElement.TryGetProperty("pageInfo", out var pi) ? pi.Clone() : default
                };

                if (doc.RootElement.TryGetProperty("items", out var items))
                {
                    foreach (var it in items.EnumerateArray())
                    {
                        var dto = new AudioVerse.API.Models.Platforms.YouTubeSubscriptionDto();
                        if (it.TryGetProperty("id", out var id)) dto.Id = id.GetString() ?? string.Empty;
                        if (it.TryGetProperty("snippet", out var sn))
                        {
                            if (sn.TryGetProperty("resourceId", out var rid) && rid.TryGetProperty("channelId", out var cid)) dto.ChannelId = cid.GetString() ?? string.Empty;
                            if (sn.TryGetProperty("title", out var t)) dto.Title = t.GetString() ?? string.Empty;
                            if (sn.TryGetProperty("description", out var d)) dto.Description = d.GetString();
                            if (sn.TryGetProperty("thumbnails", out var th) && th.ValueKind == System.Text.Json.JsonValueKind.Object)
                            {
                                if (th.TryGetProperty("default", out var df) && df.TryGetProperty("url", out var urlp)) dto.ThumbnailUrl = urlp.GetString();
                                else if (th.TryGetProperty("medium", out var md) && md.TryGetProperty("url", out var mdp)) dto.ThumbnailUrl = mdp.GetString();
                            }
                        }
                        result.items.Add(dto);
                    }
                }

                await _extRepo.UpdateLastUsedAsync(account.Id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to list subscriptions");
                return BadRequest(new { error = "list_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Generuje URL autoryzacji Google/YouTube OAuth2. Frontend przekierowuje u++ytkownika na zwr+¦cony URL.
        /// </summary>
        /// <param name="redirectUri">URI, na kt+¦ry Google przekieruje po autoryzacji.</param>
        [HttpGet("auth-url")]
        [Authorize]
        public IActionResult GetAuthUrl([FromQuery] string? redirectUri)
        {
            if (string.IsNullOrEmpty(redirectUri)) return BadRequest("redirectUri is required");

            var clientId = _configuration["YouTube:ClientId"] ?? string.Empty;
            var scopes = string.Join(' ', new[] { "https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.readonly", "openid", "email" });
            var state = Guid.NewGuid().ToString("N");
            var url = new UriBuilder("https://accounts.google.com/o/oauth2/v2/auth");
            var qp = System.Web.HttpUtility.ParseQueryString(string.Empty);
            qp["client_id"] = clientId;
            qp["response_type"] = "code";
            qp["redirect_uri"] = redirectUri;
            qp["scope"] = scopes;
            qp["access_type"] = "offline"; // request refresh token
            qp["prompt"] = "consent";
            qp["state"] = state;
            url.Query = qp.ToString();
            return Ok(new { url = url.ToString(), state });
        }

        /// <summary>
        /// Powi-à++ konto YouTube/Google z zalogowanym u++ytkownikiem (wymiana authorization code na tokeny OAuth2).
        /// </summary>
        /// <param name="req">Authorization code i redirectUri u++yte przy autoryzacji.</param>
        /// <param name="returnTo">Opcjonalny URL, na kt+¦ry przekierowa-ç po pomy+¢lnym powi-àzaniu.</param>
        [HttpPost("link")]
        [Authorize]
        public async Task<IActionResult> Link([FromBody] YouTubeLinkRequest req, [FromQuery] string? returnTo)
        {
            if (string.IsNullOrEmpty(req?.Code) || string.IsNullOrEmpty(req.RedirectUri))
                return BadRequest("code and redirectUri required");

            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            // Exchange code for tokens
            var clientId = _configuration["YouTube:ClientId"] ?? string.Empty;
            var clientSecret = _configuration["YouTube:ClientSecret"] ?? string.Empty;
            var tokenUrl = "https://oauth2.googleapis.com/token";

            var form = new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = req.Code,
                ["redirect_uri"] = req.RedirectUri,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret
            };

            using var http = _httpFactory.CreateClient();
            var res = await http.PostAsync(tokenUrl, new FormUrlEncodedContent(form));
            var body = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("YouTube token exchange failed: {Body}", body);
                return BadRequest(new { error = "token_exchange_failed", detail = body });
            }

            var tokens = System.Text.Json.JsonSerializer.Deserialize<YouTubeAuthTokens>(body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (tokens == null) return BadRequest("invalid_token_response");
            tokens.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);

            // Try to fetch userinfo
            string? externalId = null; string? displayName = null; string? email = null; string? avatar = null;
            try
            {
                using var userClient = _httpFactory.CreateClient();
                userClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokens.AccessToken);
                var userResp = await userClient.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
                if (userResp.IsSuccessStatusCode)
                {
                    var ub = await userResp.Content.ReadAsStringAsync();
                    using var doc = System.Text.Json.JsonDocument.Parse(ub);
                    if (doc.RootElement.TryGetProperty("sub", out var sub)) externalId = sub.GetString();
                    if (doc.RootElement.TryGetProperty("name", out var name)) displayName = name.GetString();
                    if (doc.RootElement.TryGetProperty("email", out var em)) email = em.GetString();
                    if (doc.RootElement.TryGetProperty("picture", out var pic)) avatar = pic.GetString();
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch YouTube userinfo");
            }

            var account = new UserExternalAccount
            {
                UserProfileId = userId.Value,
                Platform = ExternalPlatform.YouTube,
                ExternalUserId = externalId ?? string.Empty,
                DisplayName = displayName,
                Email = email,
                AvatarUrl = avatar,
                AccessToken = tokens.AccessToken,
                RefreshToken = tokens.RefreshToken,
                TokenExpiresAt = tokens.ExpiresAt.UtcDateTime,
                Scopes = tokens.Scope
            };

            var id = await _extRepo.LinkAccountAsync(account);

            if (!string.IsNullOrEmpty(returnTo) && IsRedirectAllowed(returnTo))
            {
                var sep = returnTo.Contains("?") ? "&" : "?";
                var redirect = returnTo + sep + $"platform=youtube&linked=true&id={id}";
                return Redirect(redirect);
            }

            return Ok(new { linked = true, id });
        }

        /// <summary>
        /// Od+¢wie++ tokeny OAuth2 dla powi-àzanego konta YouTube bie++-àcego u++ytkownika.
        /// </summary>
        [HttpPost("refresh")]
        [Authorize]
        public async Task<IActionResult> Refresh()
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");
            if (string.IsNullOrEmpty(account.RefreshToken)) return BadRequest("no_refresh_token");

            var clientId = _configuration["YouTube:ClientId"] ?? string.Empty;
            var clientSecret = _configuration["YouTube:ClientSecret"] ?? string.Empty;
            var tokenUrl = "https://oauth2.googleapis.com/token";
            var form = new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = account.RefreshToken!,
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret
            };

            using var http = _httpFactory.CreateClient();
            var res = await http.PostAsync(tokenUrl, new FormUrlEncodedContent(form));
            var body = await res.Content.ReadAsStringAsync();
            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("YouTube refresh failed: {Body}", body);
                return BadRequest(new { error = "refresh_failed", detail = body });
            }

            var tokens = System.Text.Json.JsonSerializer.Deserialize<YouTubeAuthTokens>(body, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (tokens == null) return BadRequest("invalid_token_response");
            tokens.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(tokens.ExpiresInSeconds);

            await _extRepo.UpdateTokensAsync(account.Id, tokens.AccessToken, tokens.RefreshToken ?? account.RefreshToken, tokens.ExpiresAt.UtcDateTime);
            return Ok(new { success = true, expiresAt = tokens.ExpiresAt.UtcDateTime });
        }

        /// <summary>
        /// Utw+¦rz now-à playlist-Ö na koncie YouTube powi-àzanym z bie++-àcym u++ytkownikiem.
        /// </summary>
        /// <param name="req">Tytu+é, opis i status prywatno+¢ci playlisty.</param>
        [HttpPost("playlists")]
        [Authorize]
        public async Task<IActionResult> CreatePlaylist([FromBody] CreateYouTubePlaylistRequest req)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            _youTubeService.SetAccessToken(account.AccessToken!);
            try
            {
                var pl = await _youTubeService.CreatePlaylistAsync(req.Title, req.Description, req.PrivacyStatus ?? "private");
                await _extRepo.UpdateLastUsedAsync(account.Id);
                return Ok(pl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to create youtube playlist");
                return BadRequest(new { error = "create_playlist_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Dodaj wideo do playlisty YouTube. Wymaga powi-àzanego konta.
        /// </summary>
        /// <param name="playlistId">ID playlisty YouTube.</param>
        /// <param name="req">ID wideo do dodania.</param>
        [HttpPost("playlists/{playlistId}/items")]
        [Authorize]
        public async Task<IActionResult> AddToPlaylist(string playlistId, [FromBody] AddToYouTubePlaylistRequest req)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            _youTubeService.SetAccessToken(account.AccessToken!);
            try
            {
                var item = await _youTubeService.AddVideoToPlaylistAsync(playlistId, req.VideoId);
                await _extRepo.UpdateLastUsedAsync(account.Id);
                return Ok(item);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to add video to playlist");
                return BadRequest(new { error = "add_to_playlist_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Remove an item from a playlist (requires playlistItemId)
        /// </summary>
        [HttpDelete("playlists/{playlistId}/items/{playlistItemId}")]
        [Authorize]
        public async Task<IActionResult> RemovePlaylistItem(string playlistId, string playlistItemId)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            _youTubeService.SetAccessToken(account.AccessToken!);
            try
            {
                await _youTubeService.RemovePlaylistItemAsync(playlistItemId);
                await _extRepo.UpdateLastUsedAsync(account.Id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to remove playlist item");
                return BadRequest(new { error = "remove_playlist_item_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Subscribe to a channel (creates subscription for authenticated user)
        /// </summary>
        [HttpPost("subscriptions")]
        [Authorize]
        public async Task<IActionResult> Subscribe([FromBody] YouTubeSubscribeRequest req)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            _youTubeService.SetAccessToken(account.AccessToken!);
            try
            {
                await _youTubeService.SubscribeAsync(req.ChannelId);
                await _extRepo.UpdateLastUsedAsync(account.Id);
                return Ok(new { subscribed = true });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to subscribe to channel");
                return BadRequest(new { error = "subscribe_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Unsubscribe by subscription id
        /// </summary>
        [HttpDelete("subscriptions/{subscriptionId}")]
        [Authorize]
        public async Task<IActionResult> Unsubscribe(string subscriptionId)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            _youTubeService.SetAccessToken(account.AccessToken!);
            try
            {
                await _youTubeService.UnsubscribeAsync(subscriptionId);
                await _extRepo.UpdateLastUsedAsync(account.Id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to unsubscribe");
                return BadRequest(new { error = "unsubscribe_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Unsubscribe by channel id - finds subscriptionId for current user and channel, then unsubscribes.
        /// </summary>
        [HttpDelete("subscriptions/by-channel/{channelId}")]
        [Authorize]
        public async Task<IActionResult> UnsubscribeByChannel(string channelId)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            try
            {
                using var client = _httpFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", account.AccessToken);

                // First, try the efficient forChannelId lookup
                var url = $"https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&forChannelId={Uri.EscapeDataString(channelId)}";
                var res = await client.GetAsync(url);
                var body = await res.Content.ReadAsStringAsync();
                if (!res.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to query subscriptions for channel {ChannelId}: {Body}", channelId, body);
                    return BadRequest(new { error = "lookup_failed", detail = body });
                }

                using var doc = System.Text.Json.JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("items", out var items) && items.GetArrayLength() > 0)
                {
                    var first = items[0];
                    if (first.TryGetProperty("id", out var idProp))
                    {
                        var subscriptionId = idProp.GetString();
                        if (!string.IsNullOrEmpty(subscriptionId))
                        {
                            _youTubeService.SetAccessToken(account.AccessToken!);
                            await _youTubeService.UnsubscribeAsync(subscriptionId);
                            await _extRepo.UpdateLastUsedAsync(account.Id);
                            return NoContent();
                        }
                    }
                }

                // Fallback: iterate through user's subscriptions pages to find channelId (handles pagination/multiple entries)
                string? pageToken = null;
                do
                {
                    var listUrl = $"https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50" + (pageToken != null ? $"&pageToken={pageToken}" : string.Empty);
                    var listRes = await client.GetAsync(listUrl);
                    var listBody = await listRes.Content.ReadAsStringAsync();
                    if (!listRes.IsSuccessStatusCode)
                    {
                        _logger.LogWarning("Failed to list subscriptions while searching for channel {ChannelId}: {Body}", channelId, listBody);
                        return BadRequest(new { error = "lookup_failed", detail = listBody });
                    }

                    using var listDoc = System.Text.Json.JsonDocument.Parse(listBody);
                    if (listDoc.RootElement.TryGetProperty("items", out var listItems))
                    {
                        foreach (var it in listItems.EnumerateArray())
                        {
                            if (it.TryGetProperty("snippet", out var sn) && sn.TryGetProperty("resourceId", out var rid) && rid.TryGetProperty("channelId", out var cid))
                            {
                                var cId = cid.GetString();
                                if (string.Equals(cId, channelId, StringComparison.OrdinalIgnoreCase))
                                {
                                    if (it.TryGetProperty("id", out var sid) && !string.IsNullOrEmpty(sid.GetString()))
                                    {
                                        var subscriptionId = sid.GetString()!;
                                        _youTubeService.SetAccessToken(account.AccessToken!);
                                        await _youTubeService.UnsubscribeAsync(subscriptionId);
                                        await _extRepo.UpdateLastUsedAsync(account.Id);
                                        return NoContent();
                                    }
                                }
                            }
                        }
                    }

                    pageToken = listDoc.RootElement.TryGetProperty("nextPageToken", out var next) ? next.GetString() : null;
                }
                while (!string.IsNullOrEmpty(pageToken));

                return NotFound(new { error = "not_subscribed" });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to unsubscribe by channel {ChannelId}", channelId);
                return BadRequest(new { error = "unsubscribe_failed", detail = ex.Message });
            }
        }

        /// <summary>
        /// Pobierz playlisty zalogowanego u++ytkownika z YouTube. Wymaga powi-àzanego konta.
        /// </summary>
        /// <param name="maxResults">Maksymalna liczba wynik+¦w (1GÇô50).</param>
        [HttpGet("playlists/mine")]
        [Authorize]
        public async Task<IActionResult> GetMyPlaylists([FromQuery] int maxResults = 50)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.YouTube);
            if (account == null) return NotFound("youtube_account_not_linked");

            _youTubeService.SetAccessToken(account.AccessToken!);
            try
            {
                var list = await _youTubeService.GetMyPlaylistsAsync(maxResults);
                await _extRepo.UpdateLastUsedAsync(account.Id);
                return Ok(list);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get my youtube playlists");
                return BadRequest(new { error = "get_playlists_failed", detail = ex.Message });
            }
        }

        private bool IsRedirectAllowed(string returnTo)
        {
            if (string.IsNullOrWhiteSpace(returnTo)) return false;
            if (returnTo.StartsWith('/')) return true;
            if (!Uri.TryCreate(returnTo, UriKind.Absolute, out var uri)) return false;

            var allowed = _configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>();
            if (allowed == null || allowed.Length == 0)
            {
                allowed = new[] { "https://audioverse.io", "http://localhost:5173", "http://localhost:5174" };
            }

            return allowed.Any(a => returnTo.StartsWith(a, StringComparison.OrdinalIgnoreCase));
        }
    }
}
