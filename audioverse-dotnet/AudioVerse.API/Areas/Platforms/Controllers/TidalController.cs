using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Services.Platforms.Tidal;
using AudioVerse.Domain.Repositories;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Application.Models.Platforms.Tidal;
using AudioVerse.Application.Services;
using AudioVerse.API.Models.Requests.Platforms;
using Microsoft.Extensions.Options;

namespace AudioVerse.API.Areas.Platforms.Controllers
{
    [Route("api/platforms/tidal")]
    [ApiController]
    public class TidalController : ControllerBase
    {
        private readonly ITidalService _tidalService;
        private readonly IExternalAccountRepository _extRepo;
        private readonly ICurrentUserService _currentUser;
        private readonly TidalServiceOptions _options;
        private readonly IHttpClientFactory _httpFactory;
        private readonly ILogger<TidalController> _logger;
        private readonly IConfiguration _configuration;

        public TidalController(ITidalService tidalService,
            IExternalAccountRepository extRepo,
            ICurrentUserService currentUser,
            IOptions<TidalServiceOptions> options,
            IHttpClientFactory httpFactory,
            ILogger<TidalController> logger,
            IConfiguration configuration)
        {
            _tidalService = tidalService;
            _extRepo = extRepo;
            _currentUser = currentUser;
            _options = options.Value;
            _httpFactory = httpFactory;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Generuje URL autoryzacji Tidal OAuth. Frontend przekierowuje użytkownika na zwrócony URL.
        /// </summary>
        /// <param name="redirectUri">URI, na który Tidal przekieruje po autoryzacji (musi być skonfigurowany w aplikacji Tidal).</param>
        [HttpGet("auth-url")]
        [Authorize]
        public IActionResult GetAuthUrl([FromQuery] string? redirectUri)
        {
            if (string.IsNullOrEmpty(redirectUri))
                return BadRequest("redirectUri is required");

            var state = Guid.NewGuid().ToString("N");
            var url = new UriBuilder($"{_options.AuthBaseUrl}/oauth2/authorize");
            var qp = System.Web.HttpUtility.ParseQueryString(string.Empty);
            qp["client_id"] = _options.ClientId;
            qp["response_type"] = "code";
            qp["redirect_uri"] = redirectUri;
            qp["state"] = state;
            url.Query = qp.ToString();
            return Ok(new { url = url.ToString(), state });
        }

        /// <summary>
        /// Powiąż konto Tidal z zalogowanym użytkownikiem (wymiana authorization code na tokeny).
        /// </summary>
        /// <param name="req">Authorization code i redirectUri użyte przy autoryzacji.</param>
        /// <param name="returnTo">Opcjonalny URL, na który przekierować po pomyślnym powiązaniu.</param>
        [HttpPost("link")]
        [Authorize]
        public async Task<IActionResult> Link([FromBody] TidalLinkRequest req, [FromQuery] string? returnTo)
        {
            if (string.IsNullOrEmpty(req?.Code) || string.IsNullOrEmpty(req.RedirectUri))
                return BadRequest("code and redirectUri required");

            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            TidalAuthTokens tokens;
            try
            {
                tokens = await _tidalService.AuthenticateWithAuthCodeAsync(req.Code, req.RedirectUri);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Tidal auth failed for user {UserId}", userId);
                return BadRequest(new { error = "token_exchange_failed", detail = ex.Message });
            }

            _tidalService.SetAccessToken(tokens.AccessToken);
            AudioVerse.Application.Models.Platforms.Tidal.UserProfile profile;
            try
            {
                profile = await _tidalService.GetCurrentUserAsync();
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to fetch tidal profile");
                profile = new AudioVerse.Application.Models.Platforms.Tidal.UserProfile { Id = "", Username = "" };
            }

            var account = new UserExternalAccount
            {
                UserProfileId = userId.Value,
                Platform = ExternalPlatform.Tidal,
                ExternalUserId = profile.Id ?? string.Empty,
                DisplayName = profile.Username,
                Email = null,
                AvatarUrl = null,
                AccessToken = tokens.AccessToken,
                RefreshToken = tokens.RefreshToken,
                TokenExpiresAt = tokens.ExpiresAt.UtcDateTime,
                Scopes = null
            };

            var id = await _extRepo.LinkAccountAsync(account);

            if (!string.IsNullOrEmpty(returnTo) && IsRedirectAllowed(returnTo))
            {
                var sep = returnTo.Contains("?") ? "&" : "?";
                var redirect = returnTo + sep + $"platform=tidal&linked=true&id={id}";
                return Redirect(redirect);
            }

            return Ok(new { linked = true, id });
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

        /// <summary>
        /// Odśwież tokeny OAuth dla powiązanego konta Tidal bieżącego użytkownika.
        /// </summary>
        [HttpPost("refresh")]
        [Authorize]
        public async Task<IActionResult> Refresh()
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Tidal);
            if (account == null) return NotFound("tidal_account_not_linked");
            if (string.IsNullOrEmpty(account.RefreshToken)) return BadRequest("no_refresh_token");

            TidalAuthTokens tokens;
            try
            {
                tokens = await _tidalService.RefreshTokenAsync(account.RefreshToken);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to refresh tidal token for user {UserId}", userId);
                return BadRequest(new { error = "refresh_failed", detail = ex.Message });
            }

            await _extRepo.UpdateTokensAsync(account.Id, tokens.AccessToken, tokens.RefreshToken, tokens.ExpiresAt.UtcDateTime);
            return Ok(new { success = true, expiresAt = tokens.ExpiresAt.UtcDateTime });
        }

        /// <summary>
        /// Pobierz URL strumienia Tidal dla podanego TrackId. Wymaga powiązanego konta Tidal.
        /// </summary>
        /// <param name="req">TrackId i opcjonalna jakość dźwięku.</param>
        [HttpPost("play")]
        [Authorize]
        public async Task<IActionResult> Play([FromBody] TidalPlayRequest req)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Tidal);
            if (account == null) return NotFound("tidal_account_not_linked");

            // Refresh if needed
            if (account.TokenExpiresAt == null || account.TokenExpiresAt <= DateTime.UtcNow.AddMinutes(-1))
            {
                if (string.IsNullOrEmpty(account.RefreshToken)) return BadRequest("no_refresh_token");
                try
                {
                    var newTokens = await _tidalService.RefreshTokenAsync(account.RefreshToken!);
                    await _extRepo.UpdateTokensAsync(account.Id, newTokens.AccessToken, newTokens.RefreshToken, newTokens.ExpiresAt.UtcDateTime);
                    account = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.Tidal) ?? account;
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Token refresh failed for user {UserId}", userId);
                }
            }

            if (!string.IsNullOrEmpty(req.TrackId))
            {
                try
                {
                    var stream = await _tidalService.GetStreamUrlAsync(req.TrackId, req.Quality);
                    return Ok(new { url = stream.Url, expiresAt = stream.ExpiresAt });
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to get tidal stream for track {Track}", req.TrackId);
                    return BadRequest(new { error = "tidal_stream_failed", detail = ex.Message });
                }
            }

            return BadRequest("must provide TrackId");
        }
    }
}
