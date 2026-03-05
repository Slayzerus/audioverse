using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using MediatR;
using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Models;
using System.Security.Claims;
using AudioVerse.Application.Models.Requests.User;
using AudioVerse.Application.Services.User;
using AudioVerse.Application.Services.Security;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// User security — authentication, password management, CAPTCHA, audit logs, HoneyTokens, TOTP 2FA.
    /// </summary>
    [ApiController]
    [Route("api/user")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("Identity - Security")]
    public class UserSecurityController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IAuditLogService _auditLogService;
        private readonly ILoginAttemptService _loginAttemptService;
        private readonly ICaptchaService _captchaService;
        private readonly IHoneyTokenService _honeyTokenService;
        private readonly IRecaptchaService _recaptchaService;
        private readonly IUserProfileRepository _userProfileRepository;

        public UserSecurityController(
            IMediator mediator,
            IAuditLogService auditLogService,
            ILoginAttemptService loginAttemptService,
            ICaptchaService captchaService,
            IHoneyTokenService honeyTokenService,
            IRecaptchaService recaptchaService,
            IUserProfileRepository userProfileRepository)
        {
            _mediator = mediator;
            _auditLogService = auditLogService;
            _loginAttemptService = loginAttemptService;
            _captchaService = captchaService;
            _honeyTokenService = honeyTokenService;
            _recaptchaService = recaptchaService;
            _userProfileRepository = userProfileRepository;
        }

        /// <summary>Guest login — creates a temporary user with Guest role and returns JWT.</summary>
        [HttpPost("guest-login")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> GuestLogin()
        {
            var result = await _mediator.Send(new GuestLoginCommand());
            return Ok(result);
        }

        /// <summary>Register a new user account.</summary>
        [HttpPost("register")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> Register([FromBody] RegisterUserCommand command)
        {
            try
            {
                var userId = await _mediator.Send(command);
                return Ok(new { Success = true, UserId = userId, Message = "User registered successfully. Please check your email to confirm your account." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Confirm user email address.</summary>
        [HttpGet("confirm-email")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmEmail([FromQuery] int userId, [FromQuery] string token)
        {
            var um = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AudioVerse.Domain.Entities.UserProfiles.UserProfile>>();
            var user = await um.FindByIdAsync(userId.ToString());
            if (user == null)
                return BadRequest(new { Success = false, Message = "Invalid user" });

            var decoded = System.Net.WebUtility.UrlDecode(token);
            var result = await um.ConfirmEmailAsync(user, decoded);
            if (!result.Succeeded)
                return BadRequest(new { Success = false, Message = "Invalid or expired confirmation token" });

            return Ok(new { Success = true, Message = "Email confirmed successfully. You can now log in." });
        }

        /// <summary>Resend email confirmation link.</summary>
        [HttpPost("resend-confirmation")]
        [AllowAnonymous]
        public async Task<IActionResult> ResendConfirmation([FromBody] ResendConfirmationRequest request)
        {
            var um = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AudioVerse.Domain.Entities.UserProfiles.UserProfile>>();
            var emailSender = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Email.IEmailSender>();
            var config = HttpContext.RequestServices.GetRequiredService<IConfiguration>();

            var user = await um.FindByEmailAsync(request.Email);
            if (user == null || await um.IsEmailConfirmedAsync(user))
                return Ok(new { Success = true, Message = "If the email exists and is unconfirmed, a new link has been sent." });

            var emailToken = await um.GenerateEmailConfirmationTokenAsync(user);
            var frontend = config["Frontend:Url"] ?? config["FrontendUrl"] ?? "http://localhost:5173";
            var encoded = System.Net.WebUtility.UrlEncode(emailToken);
            var confirmUrl = $"{frontend.TrimEnd('/')}/confirm-email?userId={user.Id}&token={encoded}";
            var body = $"<p>Hi {user.UserName},</p><p>Please confirm your account by clicking the link below:</p><p><a href=\"{confirmUrl}\">Confirm email</a></p>";
            await emailSender.SendAsync(user.Email!, "Confirm your AudioVerse account", body, html: true);

            return Ok(new { Success = true, Message = "If the email exists and is unconfirmed, a new link has been sent." });
        }

        /// <summary>User login with credentials and CAPTCHA.</summary>
        [HttpPost("login")]
        [AllowAnonymous]
        [EnableRateLimiting("AuthStrict")]
        public async Task<IActionResult> Login([FromBody] LoginUserCommand command)
        {
            try
            {
                var response = await _mediator.Send(command);

                if (!response.Success)
                {
                    return BadRequest(new
                    {
                        Success = false,
                        ErrorMessage = response.ErrorMessage,
                        IsBlocked = response.IsBlocked,
                        UserId = response.UserId,
                        Username = response.Username
                    });
                }

                if (response.RequirePasswordChange)
                {
                    return Ok(new
                    {
                        Success = true,
                        RequirePasswordChange = true,
                        TempToken = response.AccessToken,
                        Message = response.ErrorMessage,
                        UserId = response.UserId,
                        Username = response.Username
                    });
                }

                return Ok(new
                {
                    Success = true,
                    RequirePasswordChange = false,
                    TokenPair = new TokenPair(response.AccessToken, response.RefreshToken),
                    UserId = response.UserId,
                    Username = response.Username
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Refresh the JWT token pair.</summary>
        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command)
        {
            try
            {
                var tokens = await _mediator.Send(command);
                return Ok(new { Success = true, Tokens = new { tokens.NewAccessToken, tokens.NewRefreshToken } });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Logout the authenticated user.</summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                var userId = int.Parse(userIdClaim);
                var command = new LogoutUserCommand(userId);
                var result = await _mediator.Send(command);

                return result
                    ? Ok(new { Success = true, Message = "Wylogowano pomyslnie" })
                    : BadRequest(new { Success = false, Message = "Wylogowanie nie powiodlo sie" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Change user's own password.</summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangeOwnPassword([FromBody] ChangeOwnPasswordRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                var userId = int.Parse(userIdClaim);
                var command = new ChangeOwnPasswordCommand(userId, request.OldPassword, request.NewPassword);
                var result = await _mediator.Send(command);

                return Ok(new { Success = result, Message = "Haslo zostalo zmienione pomyslnie" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Change password on first login (when required).</summary>
        [HttpPost("first-login-password-change")]
        [Authorize]
        public async Task<IActionResult> FirstLoginPasswordChange([FromBody] FirstLoginPasswordChangeRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                var requirePasswordChangeClaim = User.FindFirst("requirePasswordChange")?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                if (requirePasswordChangeClaim != "True")
                    return BadRequest(new { Success = false, Message = "Zmiana hasla nie jest wymagana" });

                var userId = int.Parse(userIdClaim);
                var command = new FirstLoginPasswordChangeCommand(userId, request.NewPassword, request.ConfirmPassword);
                var result = await _mediator.Send(command);

                return Ok(new { Success = result, Message = "Haslo zostalo zmienione. Zaloguj sie ponownie." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Change password with Google reCaptcha v3 verification.</summary>
        [HttpPost("change-password-with-recaptcha")]
        [Authorize]
        public async Task<IActionResult> ChangePasswordWithRecaptcha([FromBody] ChangePasswordWithRecaptchaRequest request)
        {
            try
            {
                var recaptchaResult = await _recaptchaService.VerifyTokenAsync(request.RecaptchaToken);
                if (!recaptchaResult.Success)
                    return BadRequest(new { Success = false, Message = "Weryfikacja reCaptcha nie powiodla sie", Errors = recaptchaResult.ErrorCodes });

                if (recaptchaResult.Score < 0.5f)
                    return BadRequest(new { Success = false, Message = $"Podejrzana aktywnosc (score: {recaptchaResult.Score}). Sprobuj ponownie." });

                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                var userId = int.Parse(userIdClaim);
                var command = new ChangeOwnPasswordCommand(userId, request.OldPassword, request.NewPassword);
                var result = await _mediator.Send(command);

                return Ok(new { Success = result, Message = "Haslo zostalo zmienione pomyslnie" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Verify Google reCaptcha v3 token.</summary>
        [HttpPost("recaptcha/verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyRecaptcha([FromBody] VerifyRecaptchaRequest request)
        {
            try
            {
                var result = await _recaptchaService.VerifyTokenAsync(request.Token);
                return Ok(new
                {
                    Success = result.Success, Score = result.Score, Action = result.Action,
                    Message = result.Success ? "reCaptcha weryfikacja powiodla sie" : "reCaptcha weryfikacja nie powiodla sie",
                    ErrorCodes = result.ErrorCodes
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>
        /// Get information about the authenticated user including their players.
        /// Returns userId, username, roles, isAdmin and players[] array.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                var usernameClaim = User.FindFirst("username")?.Value;
                var roleClaims = User.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList();

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                var userId = int.Parse(userIdClaim);

                var playerEntities = await _userProfileRepository.GetPlayersByUserAsync(userId);
                var players = playerEntities
                    .OrderBy(p => p.Name)
                    .Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.ProfileId,
                        p.IsPrimary,
                        p.PreferredColors,
                        p.FillPattern,
                        p.Email,
                        p.Icon,
                        PhotoUrl = !string.IsNullOrEmpty(p.PhotoKey) ? $"/api/user/players/{p.Id}/photo" : (string?)null
                    })
                    .ToList();

                if (players.Count > 0 && !players.Any(p => p.IsPrimary))
                {
                    // Jeśli żaden gracz nie jest primary, oznacz pierwszego
                    var first = players[0];
                    players[0] = first with { IsPrimary = true };
                }

                return Ok(new
                {
                    Success = true,
                    UserId = userId,
                    Username = usernameClaim,
                    Roles = roleClaims,
                    IsAdmin = roleClaims.Any(r => r.Equals("Admin", StringComparison.OrdinalIgnoreCase)),
                    Players = players
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get audit logs for the authenticated user only.</summary>
        [HttpGet("audit-logs")]
        [Authorize]
        public async Task<IActionResult> GetMyAuditLogs()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                var userId = int.Parse(userIdClaim);
                var logs = await _auditLogService.GetUserAuditLogsAsync(userId);
                return Ok(new { Success = true, Logs = logs });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get all audit logs for all users (Admin only).</summary>
        [HttpGet("audit-logs/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllAuditLogs()
        {
            try
            {
                var logs = await _auditLogService.GetAllAuditLogsAsync();
                return Ok(new { Success = true, Logs = logs });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Generate CAPTCHA for login verification.</summary>
        [HttpPost("captcha/generate")]
        [AllowAnonymous]
        public async Task<IActionResult> GenerateCaptcha([FromQuery] int captchaType = 1)
        {
            try
            {
                if (captchaType < 1 || captchaType > 8)
                    return BadRequest(new { Success = false, Message = "Niepoprawny typ CAPTCHA (1-8)" });

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
                var captcha = await _captchaService.GenerateCaptchaAsync(captchaType, ipAddress);

                string challenge = captcha.Challenge;
                string? mediaData = null;
                string mediaType = "image";

                if (captcha.Challenge.Contains('|'))
                {
                    var parts = captcha.Challenge.Split('|');
                    challenge = parts[0];

                    if (parts.Length > 1 && !string.IsNullOrEmpty(parts[1]))
                    {
                        var data = parts[1];
                        if (data.StartsWith("data:audio"))
                        { mediaData = data; mediaType = "audio"; }
                        else
                        { mediaData = $"data:image/png;base64,{data}"; mediaType = "image"; }
                    }
                }

                return Ok(new
                {
                    Success = true, CaptchaId = captcha.Id, Challenge = challenge,
                    Media = mediaData, MediaType = mediaType, Type = captcha.CaptchaType,
                    ExpiresAt = captcha.ExpiresAt, TypeDescription = GetCaptchaTypeDescription(captchaType)
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Validate user's CAPTCHA answer.</summary>
        [HttpPost("captcha/validate")]
        [AllowAnonymous]
        public async Task<IActionResult> ValidateCaptcha([FromBody] ValidateCaptchaRequest request)
        {
            try
            {
                var isValid = await _captchaService.ValidateCaptchaAsync(request.CaptchaId, request.Answer);
                return Ok(new { Success = isValid });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Create a HoneyToken for data breach detection (Admin only).</summary>
        [HttpPost("honeytokens/create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateHoneyToken([FromBody] CreateHoneyTokenRequest request)
        {
            try
            {
                var token = await _honeyTokenService.CreateHoneyTokenAsync(request.Type, request.Description);
                return Ok(new { Success = true, Token = new { Id = token.Id, TokenId = token.TokenId, Type = token.Type } });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get all triggered HoneyTokens — security incidents (Admin only).</summary>
        [HttpGet("honeytokens/triggered")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetTriggeredHoneyTokens()
        {
            try
            {
                var tokens = await _honeyTokenService.GetTriggeredTokensAsync();
                return Ok(new { Success = true, Tokens = tokens });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        // ── TOTP / 2FA ──

        /// <summary>Enable TOTP 2FA — returns secret + provisioning URI for Google Authenticator.</summary>
        [HttpPost("totp/enable")]
        [Authorize]
        public async Task<IActionResult> EnableTotp()
        {
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var totp = HttpContext.RequestServices.GetRequiredService<ITotpService>();
            var um = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AudioVerse.Domain.Entities.UserProfiles.UserProfile>>();
            var user = await um.FindByIdAsync(userId.ToString());
            if (user == null) return NotFound();

            if (user.TotpEnabled) return BadRequest(new { Message = "TOTP already enabled" });

            var secret = totp.GenerateSecret();
            user.TotpSecret = secret;
            await um.UpdateAsync(user);

            var uri = totp.GetProvisioningUri(secret, user.Email ?? user.UserName ?? "user");
            return Ok(new { Secret = secret, ProvisioningUri = uri, Message = "Scan the QR code in Google Authenticator, then call /totp/confirm with a code to finalize." });
        }

        /// <summary>Confirm TOTP setup by verifying the first code.</summary>
        [HttpPost("totp/confirm")]
        [Authorize]
        public async Task<IActionResult> ConfirmTotp([FromBody] TotpCodeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Code)) return BadRequest();
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var totp = HttpContext.RequestServices.GetRequiredService<ITotpService>();
            var um = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AudioVerse.Domain.Entities.UserProfiles.UserProfile>>();
            var user = await um.FindByIdAsync(userId.ToString());
            if (user == null || string.IsNullOrEmpty(user.TotpSecret)) return BadRequest(new { Message = "Call /totp/enable first" });

            if (!totp.VerifyCode(user.TotpSecret, request.Code))
                return Unauthorized(new { Valid = false, Message = "Invalid TOTP code" });

            user.TotpEnabled = true;
            await um.UpdateAsync(user);
            return Ok(new { Valid = true, Message = "TOTP 2FA enabled successfully" });
        }

        /// <summary>Verify a TOTP code (used during login flow).</summary>
        [AllowAnonymous]
        [HttpPost("totp/verify")]
        public async Task<IActionResult> VerifyTotp([FromBody] TotpVerifyRequest request)
        {
            if (request == null) return BadRequest();
            var um = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AudioVerse.Domain.Entities.UserProfiles.UserProfile>>();
            var user = await um.FindByIdAsync(request.UserId.ToString());
            if (user == null || !user.TotpEnabled || string.IsNullOrEmpty(user.TotpSecret))
                return BadRequest(new { Valid = false, Message = "TOTP not enabled" });

            var totp = HttpContext.RequestServices.GetRequiredService<ITotpService>();
            var valid = totp.VerifyCode(user.TotpSecret, request.Code);
            return valid ? Ok(new { Valid = true }) : Unauthorized(new { Valid = false });
        }

        /// <summary>Disable TOTP 2FA.</summary>
        [HttpPost("totp/disable")]
        [Authorize]
        public async Task<IActionResult> DisableTotp()
        {
            var uid = User.FindFirst("id")?.Value;
            if (!int.TryParse(uid, out var userId)) return Unauthorized();

            var um = HttpContext.RequestServices.GetRequiredService<Microsoft.AspNetCore.Identity.UserManager<AudioVerse.Domain.Entities.UserProfiles.UserProfile>>();
            var user = await um.FindByIdAsync(userId.ToString());
            if (user == null) return NotFound();

            user.TotpEnabled = false;
            user.TotpSecret = null;
            await um.UpdateAsync(user);
            return Ok(new { Message = "TOTP 2FA disabled" });
        }

        private static string GetCaptchaTypeDescription(int type) => type switch
        {
            1 => "Odpowiedz na pytanie", 2 => "Przepisz tekst w odwrotnej kolejnosci",
            3 => "Zidentyfikuj obiekt na obrazku", 4 => "Rozwiaz zadanie matematyczne",
            5 => "Zaznacz wskazane obrazki", 6 => "Kliknij na region",
            7 => "Dopasuj element puzzla", 8 => "Posluchaj i przepisz liczbe",
            _ => "Nieznany typ"
        };
    }
}
