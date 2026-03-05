using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>
/// OAuth integration for external accounts (Spotify, Tidal, Google, Steam, etc.)
/// Link and manage external service connections.
/// </summary>
[ApiController]
[Route("api/user/connections")]
[Authorize]
[Produces("application/json")]
[Tags("Identity - External Connections")]
public class ExternalConnectionsController : ControllerBase
{
    private readonly IExternalAccountRepository _extRepo;
    private readonly ILogger<ExternalConnectionsController> _logger;

    public ExternalConnectionsController(IExternalAccountRepository extRepo, ILogger<ExternalConnectionsController> logger)
    {
        _extRepo = extRepo;
        _logger = logger;
    }

    /// <summary>
    /// Get all external accounts linked to the current user.
    /// </summary>
    /// <returns>List of connected platforms with status</returns>
    [HttpGet]
    [ProducesResponseType(typeof(List<ExternalConnectionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConnections()
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var connections = (await _extRepo.GetActiveAccountsAsync(userId.Value))
            .Select(x => new ExternalConnectionDto
            {
                Platform = x.Platform.ToString(),
                ExternalUserId = x.ExternalUserId,
                DisplayName = x.DisplayName,
                Email = x.Email,
                AvatarUrl = x.AvatarUrl,
                LinkedAt = x.LinkedAt,
                LastUsedAt = x.LastUsedAt,
                IsExpired = x.TokenExpiresAt.HasValue && x.TokenExpiresAt < DateTime.UtcNow,
                Scopes = x.Scopes
            })
            .ToList();

        return Ok(new { Connections = connections });
    }

    /// <summary>
    /// Get OAuth authorization URL for a platform.
    /// Frontend should redirect user to this URL.
    /// </summary>
    /// <param name="platform">Platform: spotify, tidal, google, youtube, steam, discord</param>
    /// <param name="redirectUri">URI to redirect back after authorization</param>
    /// <param name="scopes">Optional: specific scopes to request</param>
    /// <returns>Authorization URL</returns>
    /// <summary>Get Auth Url.</summary>
    [HttpGet("{platform}/auth-url")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult GetAuthUrl(string platform, [FromQuery] string redirectUri, [FromQuery] string? scopes = null)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        var state = GenerateState(userId.Value, platform);

        var authUrl = platform.ToLowerInvariant() switch
        {
            "spotify" => BuildSpotifyAuthUrl(redirectUri, state, scopes),
            "tidal" => BuildTidalAuthUrl(redirectUri, state, scopes),
            "google" or "youtube" => BuildGoogleAuthUrl(redirectUri, state, scopes),
            "discord" => BuildDiscordAuthUrl(redirectUri, state, scopes),
            "twitch" => BuildTwitchAuthUrl(redirectUri, state, scopes),
            "microsoft" => BuildMicrosoftAuthUrl(redirectUri, state, scopes),
            "steam" => new { Url = $"https://steamcommunity.com/openid/login?openid.ns=http://specs.openid.net/auth/2.0&openid.mode=checkid_setup&openid.return_to={Uri.EscapeDataString(redirectUri)}&openid.realm={Uri.EscapeDataString(GetBaseUrl())}&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select" },
            "bgg" => new { Message = "BGG uses username-based access, no OAuth required", RequiresUsername = true },
            _ => null
        };

        if (authUrl == null)
            return BadRequest(new { Message = $"Unknown platform: {platform}" });

        return Ok(authUrl);
    }

    /// <summary>
    /// Complete OAuth flow with authorization code.
    /// Called after user authorizes on external platform.
    /// </summary>
    /// <param name="platform">Platform name</param>
    /// <param name="request">OAuth callback data</param>
    /// <summary>Handle Callback.</summary>
    [HttpPost("{platform}/callback")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> HandleCallback(string platform, [FromBody] OAuthCallbackRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrEmpty(request.Code) && string.IsNullOrEmpty(request.AccessToken))
            return BadRequest(new { Message = "Authorization code or access token required" });

        try
        {
            var connection = platform.ToLowerInvariant() switch
            {
                "spotify" => await HandleSpotifyCallback(userId.Value, request),
                "tidal" => await HandleTidalCallback(userId.Value, request),
                "google" or "youtube" => await HandleGoogleCallback(userId.Value, request, platform),
                "discord" => await HandleDiscordCallback(userId.Value, request),
                "twitch" => await HandleTwitchCallback(userId.Value, request),
                "microsoft" => await HandleMicrosoftCallback(userId.Value, request),
                _ => null
            };

            if (connection == null)
                return BadRequest(new { Message = $"Failed to connect {platform}" });

            return Ok(new
            {
                Success = true,
                Platform = platform,
                DisplayName = connection.DisplayName,
                Email = connection.Email
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "OAuth callback failed for {Platform}", platform);
            return BadRequest(new { Message = "Authorization failed", Error = ex.Message });
        }
    }

    /// <summary>
    /// Link a BoardGameGeek account by username.
    /// </summary>
    /// <param name="request">BGG username</param>
    [HttpPost("bgg/link")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LinkBggAccount([FromBody] BggLinkRequest request)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Username))
            return BadRequest(new { Message = "Username is required" });

        // Verify BGG username exists by fetching collection
        var bggClient = HttpContext.RequestServices.GetService<Infrastructure.ExternalApis.Bgg.IBggClient>();
        if (bggClient != null)
        {
            try
            {
                var collection = await bggClient.GetUserCollectionAsync(request.Username, owned: true);
                // If we get here, username is valid
            }
            catch (HttpRequestException) {
                return BadRequest(new { Message = "BGG username not found or collection is private" });
            }
        }

        var existing = await _extRepo.GetByPlatformAsync(userId.Value, ExternalPlatform.BoardGameGeek);

        if (existing != null)
        {
            existing.ExternalUserId = request.Username;
            existing.DisplayName = request.Username;
            existing.LastUsedAt = DateTime.UtcNow;
            existing.IsActive = true;
            await _extRepo.SaveChangesAsync();
        }
        else
        {
            await _extRepo.LinkAccountAsync(new UserExternalAccount
            {
                UserProfileId = userId.Value,
                Platform = ExternalPlatform.BoardGameGeek,
                ExternalUserId = request.Username,
                DisplayName = request.Username,
                IsActive = true
            });
        }

        return Ok(new { Success = true, Username = request.Username });
    }

    /// <summary>
    /// Disconnect an external account.
    /// </summary>
    /// <param name="platform">Platform to disconnect</param>
    [HttpDelete("{platform}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Disconnect(string platform)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!Enum.TryParse<ExternalPlatform>(platform, ignoreCase: true, out var platformEnum))
            return BadRequest(new { Message = $"Unknown platform: {platform}" });

        var connection = await _extRepo.GetByPlatformAsync(userId.Value, platformEnum);

        if (connection == null)
            return NotFound();

        await _extRepo.RemoveAsync(connection);

        return NoContent();
    }

    /// <summary>
    /// Refresh OAuth tokens for a platform.
    /// </summary>
    /// <param name="platform">Platform to refresh</param>
    [HttpPost("{platform}/refresh")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshTokens(string platform)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!Enum.TryParse<ExternalPlatform>(platform, ignoreCase: true, out var platformEnum))
            return BadRequest(new { Message = $"Unknown platform: {platform}" });

        var connection = await _extRepo.GetByPlatformAsync(userId.Value, platformEnum);

        if (connection == null || !connection.IsActive)
            return NotFound(new { Message = "No active connection found" });

        if (string.IsNullOrEmpty(connection.RefreshToken))
            return BadRequest(new { Message = "No refresh token available. Please re-authorize." });

        try
        {
            var success = platform.ToLowerInvariant() switch
            {
                "spotify" => await RefreshSpotifyToken(connection),
                "tidal" => await RefreshTidalToken(connection),
                "google" or "youtube" => await RefreshGoogleToken(connection),
                _ => false
            };

            if (!success)
                return BadRequest(new { Message = "Token refresh failed. Please re-authorize." });

            await _extRepo.SaveChangesAsync();
            return Ok(new { Success = true, ExpiresAt = connection.TokenExpiresAt });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token refresh failed for {Platform}", platform);
            return BadRequest(new { Message = "Token refresh failed", Error = ex.Message });
        }
    }

    /// <summary>
    /// Get the current user's connected account for a specific platform.
    /// </summary>
    [HttpGet("{platform}")]
    [ProducesResponseType(typeof(ExternalConnectionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetConnection(string platform)
    {
        var userId = GetCurrentUserId();
        if (userId == null) return Unauthorized();

        if (!Enum.TryParse<ExternalPlatform>(platform, ignoreCase: true, out var platformEnum))
            return BadRequest(new { Message = $"Unknown platform: {platform}" });

        var conn = await _extRepo.GetByPlatformAsync(userId.Value, platformEnum);
        if (conn == null || !conn.IsActive) return NotFound();

        var connection = new ExternalConnectionDto
        {
            Platform = conn.Platform.ToString(),
            ExternalUserId = conn.ExternalUserId,
            DisplayName = conn.DisplayName,
            Email = conn.Email,
            AvatarUrl = conn.AvatarUrl,
            LinkedAt = conn.LinkedAt,
            LastUsedAt = conn.LastUsedAt,
            IsExpired = conn.TokenExpiresAt.HasValue && conn.TokenExpiresAt < DateTime.UtcNow,
            Scopes = conn.Scopes
        };

        return Ok(connection);
    }

    // ????????????????????????????????????????????????????????????
    //  PRIVATE HELPERS
    // ????????????????????????????????????????????????????????????

    private int? GetCurrentUserId()
    {
        var claim = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out var id) ? id : null;
    }

    private string GetBaseUrl()
    {
        return $"{Request.Scheme}://{Request.Host}";
    }

    private static string GenerateState(int userId, string platform)
    {
        var data = $"{userId}:{platform}:{Guid.NewGuid():N}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(data));
    }

    private string GetConfigValue(string envName, string configKey)
    {
        var v = Environment.GetEnvironmentVariable(envName);
        if (!string.IsNullOrEmpty(v)) return v;
        var cfg = HttpContext?.RequestServices.GetService<Microsoft.Extensions.Configuration.IConfiguration>();
        return cfg?[configKey] ?? string.Empty;
    }

    private object BuildSpotifyAuthUrl(string redirectUri, string state, string? scopes)
    {
        var defaultScopes = "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private user-library-read user-library-modify";
        var clientId = GetConfigValue("SPOTIFY_CLIENT_ID", "Spotify:ClientId");

        var url = $"https://accounts.spotify.com/authorize?" +
            $"client_id={clientId}&response_type=code&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope={Uri.EscapeDataString(scopes ?? defaultScopes)}&state={state}";

        return new { Url = url, Provider = "Spotify" };
    }

    private object BuildTidalAuthUrl(string redirectUri, string state, string? scopes)
    {
        var clientId = GetConfigValue("TIDAL_CLIENT_ID", "Tidal:ClientId");

        var url = $"https://login.tidal.com/authorize?" +
            $"client_id={clientId}&response_type=code&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope={Uri.EscapeDataString(scopes ?? "r_usr w_usr")}&state={state}";

        return new { Url = url, Provider = "Tidal" };
    }

    private object BuildGoogleAuthUrl(string redirectUri, string state, string? scopes)
    {
        var defaultScopes = "openid email profile https://www.googleapis.com/auth/youtube.readonly";
        var clientId = GetConfigValue("GOOGLE_CLIENT_ID", "Google:ClientId");

        var url = $"https://accounts.google.com/o/oauth2/v2/auth?" +
            $"client_id={clientId}&response_type=code&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope={Uri.EscapeDataString(scopes ?? defaultScopes)}&state={state}&access_type=offline&prompt=consent";

        return new { Url = url, Provider = "Google" };
    }

    private object BuildDiscordAuthUrl(string redirectUri, string state, string? scopes)
    {
        var defaultScopes = "identify email guilds";
        var clientId = GetConfigValue("DISCORD_CLIENT_ID", "Discord:ClientId");

        var url = $"https://discord.com/api/oauth2/authorize?" +
            $"client_id={clientId}&response_type=code&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope={Uri.EscapeDataString(scopes ?? defaultScopes)}&state={state}";

        return new { Url = url, Provider = "Discord" };
    }

    private object BuildTwitchAuthUrl(string redirectUri, string state, string? scopes)
    {
        var defaultScopes = "user:read:email";
        var clientId = GetConfigValue("TWITCH_CLIENT_ID", "Twitch:ClientId");

        var url = $"https://id.twitch.tv/oauth2/authorize?" +
            $"client_id={clientId}&response_type=code&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope={Uri.EscapeDataString(scopes ?? defaultScopes)}&state={state}";

        return new { Url = url, Provider = "Twitch" };
    }

    private object BuildMicrosoftAuthUrl(string redirectUri, string state, string? scopes)
    {
        var defaultScopes = "openid email profile User.Read";
        var clientId = GetConfigValue("MICROSOFT_CLIENT_ID", "Microsoft:ClientId");
        var tenantId = GetConfigValue("MICROSOFT_TENANT_ID", "Microsoft:TenantId");

        var url = $"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/authorize?" +
            $"client_id={clientId}&response_type=code&redirect_uri={Uri.EscapeDataString(redirectUri)}" +
            $"&scope={Uri.EscapeDataString(scopes ?? defaultScopes)}&state={state}&response_mode=query";

        return new { Url = url, Provider = "Microsoft" };
    }

    private async Task<UserExternalAccount?> HandleSpotifyCallback(int userId, OAuthCallbackRequest request)
    {
        var spotify = HttpContext.RequestServices.GetService<Application.Services.Platforms.Spotify.ISpotifyService>();
        if (spotify == null) return null;

        var tokens = await spotify.AuthenticateWithAuthCodeAsync(request.Code!, request.RedirectUri!);
        spotify.SetAccessToken(tokens.AccessToken);

        var profile = await spotify.GetCurrentUserAsync();

        return await SaveOrUpdateConnection(userId, ExternalPlatform.Spotify, new UserExternalAccount
        {
            ExternalUserId = profile.Id,
            DisplayName = profile.DisplayName,
            AccessToken = tokens.AccessToken,
            RefreshToken = tokens.RefreshToken,
            TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokens.ExpiresInSeconds),
            Scopes = tokens.Scope
        });
    }

    private async Task<UserExternalAccount?> HandleTidalCallback(int userId, OAuthCallbackRequest request)
    {
        var tidal = HttpContext.RequestServices.GetService<Application.Services.Platforms.Tidal.ITidalService>();
        if (tidal == null) return null;

        var tokens = await tidal.AuthenticateWithAuthCodeAsync(request.Code!, request.RedirectUri!);
        tidal.SetAccessToken(tokens.AccessToken);

        var profile = await tidal.GetCurrentUserAsync();

        return await SaveOrUpdateConnection(userId, ExternalPlatform.Tidal, new UserExternalAccount
        {
            ExternalUserId = profile.Id.ToString(),
            DisplayName = profile.Username,
            AccessToken = tokens.AccessToken,
            RefreshToken = tokens.RefreshToken,
            TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokens.ExpiresInSeconds)
        });
    }

    private async Task<UserExternalAccount?> HandleGoogleCallback(int userId, OAuthCallbackRequest request, string platform)
    {
        // Google OAuth token exchange - simplified, would use proper client in production
        var clientId = GetConfigValue("GOOGLE_CLIENT_ID", "Google:ClientId");
        var clientSecret = GetConfigValue("GOOGLE_CLIENT_SECRET", "Google:ClientSecret");

        using var http = new HttpClient();
        var tokenResponse = await http.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = request.Code!,
                ["client_id"] = clientId ?? "",
                ["client_secret"] = clientSecret ?? "",
                ["redirect_uri"] = request.RedirectUri ?? "",
                ["grant_type"] = "authorization_code"
            }));

        if (!tokenResponse.IsSuccessStatusCode) return null;

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<GoogleTokenResponse>();
        if (tokenData == null) return null;

        // Get user info
        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
        var userInfo = await http.GetFromJsonAsync<GoogleUserInfo>("https://www.googleapis.com/oauth2/v2/userinfo");

        var platformEnum = platform.ToLowerInvariant() == "youtube" ? ExternalPlatform.YouTube : ExternalPlatform.Google;

        return await SaveOrUpdateConnection(userId, platformEnum, new UserExternalAccount
        {
            ExternalUserId = userInfo?.Id ?? "",
            DisplayName = userInfo?.Name,
            Email = userInfo?.Email,
            AvatarUrl = userInfo?.Picture,
            AccessToken = tokenData.AccessToken,
            RefreshToken = tokenData.RefreshToken,
            TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokenData.ExpiresIn)
        });
    }

    private async Task<UserExternalAccount?> HandleDiscordCallback(int userId, OAuthCallbackRequest request)
    {
        var clientId = GetConfigValue("DISCORD_CLIENT_ID", "Discord:ClientId");
        var clientSecret = GetConfigValue("DISCORD_CLIENT_SECRET", "Discord:ClientSecret");

        using var http = new HttpClient();
        var tokenResponse = await http.PostAsync("https://discord.com/api/oauth2/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = request.Code!,
                ["client_id"] = clientId ?? "",
                ["client_secret"] = clientSecret ?? "",
                ["redirect_uri"] = request.RedirectUri ?? "",
                ["grant_type"] = "authorization_code"
            }));

        if (!tokenResponse.IsSuccessStatusCode) return null;

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<DiscordTokenResponse>();
        if (tokenData == null) return null;

        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
        var userInfo = await http.GetFromJsonAsync<DiscordUser>("https://discord.com/api/users/@me");

        return await SaveOrUpdateConnection(userId, ExternalPlatform.Discord, new UserExternalAccount
        {
            ExternalUserId = userInfo?.Id ?? "",
            DisplayName = userInfo?.Username,
            Email = userInfo?.Email,
            AvatarUrl = userInfo?.Id != null && userInfo.Avatar != null
                ? $"https://cdn.discordapp.com/avatars/{userInfo.Id}/{userInfo.Avatar}.png"
                : null,
            AccessToken = tokenData.AccessToken,
            RefreshToken = tokenData.RefreshToken,
            TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokenData.ExpiresIn),
            Scopes = tokenData.Scope
        });
    }

    private async Task<UserExternalAccount?> HandleTwitchCallback(int userId, OAuthCallbackRequest request)
    {
        var clientId = GetConfigValue("TWITCH_CLIENT_ID", "Twitch:ClientId");
        var clientSecret = GetConfigValue("TWITCH_CLIENT_SECRET", "Twitch:ClientSecret");

        using var http = new HttpClient();
        var tokenResponse = await http.PostAsync("https://id.twitch.tv/oauth2/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = request.Code!,
                ["client_id"] = clientId ?? "",
                ["client_secret"] = clientSecret ?? "",
                ["redirect_uri"] = request.RedirectUri ?? "",
                ["grant_type"] = "authorization_code"
            }));

        if (!tokenResponse.IsSuccessStatusCode) return null;

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<TwitchTokenResponse>();
        if (tokenData == null) return null;

        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
        http.DefaultRequestHeaders.Add("Client-Id", clientId);
        var usersResponse = await http.GetFromJsonAsync<TwitchUsersResponse>("https://api.twitch.tv/helix/users");
        var userInfo = usersResponse?.Data?.FirstOrDefault();

        return await SaveOrUpdateConnection(userId, ExternalPlatform.Twitch, new UserExternalAccount
        {
            ExternalUserId = userInfo?.Id ?? "",
            DisplayName = userInfo?.DisplayName ?? userInfo?.Login,
            Email = userInfo?.Email,
            AvatarUrl = userInfo?.ProfileImageUrl,
            AccessToken = tokenData.AccessToken,
            RefreshToken = tokenData.RefreshToken,
            TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokenData.ExpiresIn),
            Scopes = string.Join(" ", tokenData.Scope ?? Array.Empty<string>())
        });
    }

    private async Task<UserExternalAccount?> HandleMicrosoftCallback(int userId, OAuthCallbackRequest request)
    {
        var clientId = GetConfigValue("MICROSOFT_CLIENT_ID", "Microsoft:ClientId");
        var clientSecret = GetConfigValue("MICROSOFT_CLIENT_SECRET", "Microsoft:ClientSecret");
        var tenantId = GetConfigValue("MICROSOFT_TENANT_ID", "Microsoft:TenantId");

        using var http = new HttpClient();
        var tokenResponse = await http.PostAsync($"https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["code"] = request.Code!,
                ["client_id"] = clientId ?? "",
                ["client_secret"] = clientSecret ?? "",
                ["redirect_uri"] = request.RedirectUri ?? "",
                ["grant_type"] = "authorization_code",
                ["scope"] = "openid email profile User.Read"
            }));

        if (!tokenResponse.IsSuccessStatusCode) return null;

        var tokenData = await tokenResponse.Content.ReadFromJsonAsync<MicrosoftTokenResponse>();
        if (tokenData == null) return null;

        http.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tokenData.AccessToken);
        var userInfo = await http.GetFromJsonAsync<MicrosoftUser>("https://graph.microsoft.com/v1.0/me");

        return await SaveOrUpdateConnection(userId, ExternalPlatform.Microsoft, new UserExternalAccount
        {
            ExternalUserId = userInfo?.Id ?? "",
            DisplayName = userInfo?.DisplayName,
            Email = userInfo?.Mail ?? userInfo?.UserPrincipalName,
            AccessToken = tokenData.AccessToken,
            RefreshToken = tokenData.RefreshToken,
            TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokenData.ExpiresIn),
            Scopes = tokenData.Scope
        });
    }

    private async Task<UserExternalAccount> SaveOrUpdateConnection(int userId, ExternalPlatform platform, UserExternalAccount data)
    {
        return await _extRepo.SaveOrUpdateConnectionAsync(userId, platform, data);
    }

    private async Task<bool> RefreshSpotifyToken(UserExternalAccount connection)
    {
        var spotify = HttpContext.RequestServices.GetService<Application.Services.Platforms.Spotify.ISpotifyService>();
        if (spotify == null || string.IsNullOrEmpty(connection.RefreshToken)) return false;

        var tokens = await spotify.RefreshTokenAsync(connection.RefreshToken);
        connection.AccessToken = tokens.AccessToken;
        connection.TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
        if (!string.IsNullOrEmpty(tokens.RefreshToken))
            connection.RefreshToken = tokens.RefreshToken;
        connection.LastUsedAt = DateTime.UtcNow;
        return true;
    }

    private async Task<bool> RefreshTidalToken(UserExternalAccount connection)
    {
        var tidal = HttpContext.RequestServices.GetService<Application.Services.Platforms.Tidal.ITidalService>();
        if (tidal == null || string.IsNullOrEmpty(connection.RefreshToken)) return false;

        var tokens = await tidal.RefreshTokenAsync(connection.RefreshToken);
        connection.AccessToken = tokens.AccessToken;
        connection.TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokens.ExpiresInSeconds);
        if (!string.IsNullOrEmpty(tokens.RefreshToken))
            connection.RefreshToken = tokens.RefreshToken;
        connection.LastUsedAt = DateTime.UtcNow;
        return true;
    }

    private async Task<bool> RefreshGoogleToken(UserExternalAccount connection)
    {
        var clientId = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_ID");
        var clientSecret = Environment.GetEnvironmentVariable("GOOGLE_CLIENT_SECRET");

        using var http = new HttpClient();
        var response = await http.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["refresh_token"] = connection.RefreshToken!,
                ["client_id"] = clientId ?? "",
                ["client_secret"] = clientSecret ?? "",
                ["grant_type"] = "refresh_token"
            }));

        if (!response.IsSuccessStatusCode) return false;

        var tokenData = await response.Content.ReadFromJsonAsync<GoogleTokenResponse>();
        if (tokenData == null) return false;

        connection.AccessToken = tokenData.AccessToken;
        connection.TokenExpiresAt = DateTime.UtcNow.AddSeconds(tokenData.ExpiresIn);
        connection.LastUsedAt = DateTime.UtcNow;
        return true;
    }
}

// External API response models
file class GoogleTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
    public string? TokenType { get; set; }
}

file class GoogleUserInfo
{
    public string Id { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Name { get; set; }
    public string? Picture { get; set; }
}

file class DiscordTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
    public string? Scope { get; set; }
}

file class DiscordUser
{
    public string Id { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? Avatar { get; set; }
}

file class TwitchTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
    public string[]? Scope { get; set; }
    public string? TokenType { get; set; }
}

file class TwitchUsersResponse
{
    public List<TwitchUser>? Data { get; set; }
}

file class TwitchUser
{
    public string Id { get; set; } = string.Empty;
    public string? Login { get; set; }
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? ProfileImageUrl { get; set; }
}

file class MicrosoftTokenResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string? RefreshToken { get; set; }
    public int ExpiresIn { get; set; }
    public string? Scope { get; set; }
    public string? TokenType { get; set; }
}

file class MicrosoftUser
{
    public string Id { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Mail { get; set; }
    public string? UserPrincipalName { get; set; }
}
