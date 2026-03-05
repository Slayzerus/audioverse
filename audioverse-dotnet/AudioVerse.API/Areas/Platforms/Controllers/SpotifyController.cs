using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Services.Platforms.Spotify;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Application.Models.Platforms.Spotify;
using AudioVerse.Application.Services;
using Microsoft.Extensions.Options;
using AudioVerse.API.Models.Requests.Platforms;

namespace AudioVerse.API.Areas.Platforms.Controllers
{
    [Route("api/platforms/spotify")]
    [ApiController]
    public class SpotifyController : ControllerBase
    {
        private readonly ISpotifyService _spotifyService;
        private readonly IExternalAccountRepository _extRepo;
        private readonly ICurrentUserService _currentUser;
        private readonly SpotifyServiceOptions _options;
        private readonly IHttpClientFactory _httpFactory;
        private readonly ILogger<SpotifyController> _logger;
        private readonly IConfiguration _configuration;

        public SpotifyController(ISpotifyService spotifyService,
            IExternalAccountRepository extRepo,
            ICurrentUserService currentUser,
            IOptions<SpotifyServiceOptions> options,
            IHttpClientFactory httpFactory,
            ILogger<SpotifyController> logger,
            IConfiguration configuration)
        {
            _spotifyService = spotifyService;
            _extRepo = extRepo;
            _currentUser = currentUser;
            _options = options.Value;
            _httpFactory = httpFactory;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Generate Spotify authorization URL for user to authorize Web Playback.
        /// Client should provide redirectUri matching Spotify app settings.
        /// </summary>
        [HttpGet("auth-url")]
        [Authorize]
        public IActionResult GetAuthUrl([FromQuery] string? redirectUri)
        {
            if (string.IsNullOrEmpty(redirectUri))
            {
                return BadRequest("redirectUri is required and must match a redirect URI configured in Spotify App settings");
            }

            var scopes = string.Join(' ', new[] {
                "user-read-private",
                "user-read-email",
                "streaming",
                "user-read-playback-state",
                "user-modify-playback-state"
            });

            var state = Guid.NewGuid().ToString("N");
            var url = new UriBuilder($"{_options.AccountsBaseUrl}/authorize");
            var qp = System.Web.HttpUtility.ParseQueryString(string.Empty);
            qp["client_id"] = _options.ClientId;
            qp["response_type"] = "code";
            qp["redirect_uri"] = redirectUri;
            qp["scope"] = scopes;
            qp["state"] = state;
            qp["show_dialog"] = "true";
            url.Query = qp.ToString();

            return Ok(new { url = url.ToString(), state });
        }

        /// <summary>
        /// Link Spotify account for currently authenticated user by exchanging authorization code.
        /// </summary>
        [HttpPost("link")]
        [Authorize]
        public async Task<IActionResult> Link([FromBody] SpotifyLinkRequest req, [FromQuery] string? returnTo)
        {
            if (string.IsNullOrEmpty(req?.Code) || string.IsNullOrEmpty(req.RedirectUri))
                return BadRequest("code and redirectUri are required");

            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            SpotifyAuthTokens tokens;
            try
            {
                tokens = await _spotifyService.AuthenticateWithAuthCodeAsync(req.Code, req.RedirectUri);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Spotify auth failed for user {UserId}", userId);
                return BadRequest(new { error = "token_exchange_failed", detail = ex.Message });
            }

            _spotifyService.SetAccessToken(tokens.AccessToken);
            AudioVerse.Application.Models.Platforms.Spotify.UserProfile profile;
            try
            {
                profile = await _spotifyService.GetCurrentUserAsync();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to fetch spotify profile");
                profile = new AudioVerse.Application.Models.Platforms.Spotify.UserProfile { Id = "", DisplayName = "" };
            }

            var account = new UserExternalAccount
            {
                UserProfileId = userId.Value,
                Platform = ExternalPlatform.Spotify,
                ExternalUserId = profile.Id ?? string.Empty,
                DisplayName = profile.DisplayName,
                Email = null,
                AvatarUrl = null,
                AccessToken = tokens.AccessToken,
                RefreshToken = tokens.RefreshToken,
                TokenExpiresAt = tokens.ExpiresAt.UtcDateTime,
                Scopes = tokens.Scope
            };

            var id = await _extRepo.LinkAccountAsync(account);

            // If frontend requested a post-link redirect, validate and redirect
            if (!string.IsNullOrEmpty(returnTo) && IsRedirectAllowed(returnTo))
            {
                var uri = new Uri(returnTo, UriKind.RelativeOrAbsolute);
                var sep = returnTo.Contains("?") ? "&" : "?";
                var redirect = returnTo + sep + $"platform=spotify&linked=true&id={id}";
                return Redirect(redirect);
            }

            return Ok(new { linked = true, id });
        }

        private bool IsRedirectAllowed(string returnTo)
        {
            if (string.IsNullOrWhiteSpace(returnTo)) return false;
            // allow relative paths
            if (returnTo.StartsWith('/')) return true;

            if (!Uri.TryCreate(returnTo, UriKind.Absolute, out var uri)) return false;

            var allowed = _configuration.GetSection("Frontend:AllowedOrigins").Get<string[]>();
            if (allowed == null || allowed.Length == 0)
            {
                allowed = new[] { "https://audioverse.io", "http://localhost:5173", "http://localhost:5174" };
            }

            return allowed.Any(a => returnTo.StartsWith(a, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Refresh tokens for current user's Spotify link
        /// </summary>
        [HttpPost("refresh")]
        [Authorize]
        public async Task<IActionResult> Refresh()
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Spotify);
            if (account == null) return NotFound("spotify_account_not_linked");
            if (string.IsNullOrEmpty(account.RefreshToken)) return BadRequest("no_refresh_token");

            SpotifyAuthTokens tokens;
            try
            {
                tokens = await _spotifyService.RefreshTokenAsync(account.RefreshToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh spotify token for user {UserId}", userId);
                return BadRequest(new { error = "refresh_failed", detail = ex.Message });
            }

            await _extRepo.UpdateTokensAsync(account.Id, tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresAt.UtcDateTime);
            return Ok(new { success = true, expiresAt = tokens.ExpiresAt.UtcDateTime });
        }

        /// <summary>
        /// Returns a short-lived access token for the currently linked Spotify account (for Web Playback SDK use).
        /// Token will be refreshed if expired.
        /// </summary>
        [HttpGet("token")]
        [Authorize]
        public async Task<IActionResult> GetToken()
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Spotify);
            if (account == null) return NotFound("spotify_account_not_linked");

            // Refresh if needed
            if (account.TokenExpiresAt == null || account.TokenExpiresAt <= DateTime.UtcNow.AddMinutes(-1))
            {
                if (string.IsNullOrEmpty(account.RefreshToken)) return BadRequest("no_refresh_token");
                try
                {
                    var newTokens = await _spotifyService.RefreshTokenAsync(account.RefreshToken!);
                    await _extRepo.UpdateTokensAsync(account.Id, newTokens.AccessToken, newTokens.RefreshToken, newTokens.ExpiresAt.UtcDateTime);
                    account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Spotify) ?? account;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Token refresh failed for user {UserId}", userId);
                    return BadRequest(new { error = "refresh_failed", detail = ex.Message });
                }
            }

            return Ok(new { accessToken = account.AccessToken, expiresAt = account.TokenExpiresAt });
        }

        /// <summary>
        /// Start playback on user's device (requires Spotify account linked and appropriate scopes).
        /// </summary>
        [HttpPost("play")]
        [Authorize]
        public async Task<IActionResult> Play([FromBody] SpotifyPlayRequest req)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Spotify);
            if (account == null) return NotFound("spotify_account_not_linked");

            // Refresh token if expired
            if (account.TokenExpiresAt == null || account.TokenExpiresAt <= DateTime.UtcNow.AddMinutes(-1))
            {
                if (string.IsNullOrEmpty(account.RefreshToken)) return BadRequest("no_refresh_token");
                try
                {
                    var newTokens = await _spotifyService.RefreshTokenAsync(account.RefreshToken!);
                    await _extRepo.UpdateTokensAsync(account.Id, newTokens.AccessToken, newTokens.RefreshToken, newTokens.ExpiresAt.UtcDateTime);
                    account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Spotify) ?? account;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Token refresh failed for user {UserId}", userId);
                }
            }

            // Build playback request
            var client = _httpFactory.CreateClient();
            var apiBase = _options.ApiBaseUrl.TrimEnd('/');
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", account.AccessToken);

            var url = $"{apiBase}/me/player/play";
            if (!string.IsNullOrEmpty(req.DeviceId)) url += $"?device_id={Uri.EscapeDataString(req.DeviceId)}";

            object body;
            if (!string.IsNullOrEmpty(req.TrackUri))
            {
                body = new { uris = new[] { req.TrackUri }, position_ms = req.PositionMs };
            }
            else if (!string.IsNullOrEmpty(req.ContextUri))
            {
                body = new { context_uri = req.ContextUri, offset = req.Offset != null ? new { position = req.Offset } : null, position_ms = req.PositionMs };
            }
            else
            {
                return BadRequest("must provide TrackUri or ContextUri");
            }

            var content = new StringContent(System.Text.Json.JsonSerializer.Serialize(body));
            content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/json");

            var resp = await client.PutAsync(url, content);
            if (!resp.IsSuccessStatusCode)
            {
                var text = await resp.Content.ReadAsStringAsync();
                return StatusCode((int)resp.StatusCode, new { error = "spotify_play_failed", detail = text });
            }

            await _extRepo.UpdateLastUsedAsync(account.Id);
            return Ok(new { success = true });
        }
    }
}
