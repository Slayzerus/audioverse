using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OpenIddict.Abstractions;
using OpenIddict.Server.AspNetCore;
using System.Security.Claims;
using Microsoft.AspNetCore;
using AudioVerse.Domain.Entities.UserProfiles;
using AudioVerse.IdentityServer.Middleware;

namespace AudioVerse.IdentityServer.Controllers
{
    [ApiController]
    [Route("connect")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<UserProfile> _userManager;
        private readonly SignInManager<UserProfile> _signInManager;

        public AuthController(UserManager<UserProfile> userManager, SignInManager<UserProfile> signInManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
        }

        /// <summary>
        /// Endpoint tokenowy OpenIddict — obsługuje grant_type=password i grant_type=refresh_token.
        /// </summary>
        [HttpPost("token"), Produces("application/json")]
        public async Task<IActionResult> Exchange()
        {
            var request = HttpContext.GetOpenIddictServerRequest();
            if (request == null)
                return BadRequest("Invalid request");

            if (request.IsPasswordGrantType())
                return await HandlePasswordGrant(request);

            if (request.IsRefreshTokenGrantType())
                return await HandleRefreshTokenGrant();

            return BadRequest("Unsupported grant type");
        }

        /// <summary>Wylogowanie — usuwa httpOnly cookie z refresh tokenem.</summary>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(RefreshTokenCookieMiddleware.CookieName, new CookieOptions
            {
                Path = "/connect",
                Secure = true,
                HttpOnly = true,
                SameSite = SameSiteMode.Strict
            });
            return Ok(new { Success = true });
        }

        private async Task<IActionResult> HandlePasswordGrant(OpenIddictRequest request)
        {
            var user = await _userManager.FindByNameAsync(request.Username!);
            if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password!))
                return Unauthorized("Invalid credentials");

            if (!await _userManager.IsEmailConfirmedAsync(user))
                return Unauthorized("Email not confirmed. Please check your inbox or request a new confirmation link.");

            var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            identity.AddClaim(OpenIddictConstants.Claims.Subject, user.Id.ToString());
            identity.AddClaim(OpenIddictConstants.Claims.Name, user.UserName!);

            // Dodaj rolę „id" (używaną przez API do identyfikacji)
            identity.AddClaim("id", user.Id.ToString(), ClaimValueTypes.Integer);

            var principal = new ClaimsPrincipal(identity);
            principal.SetScopes(new[]
            {
                OpenIddictConstants.Scopes.OpenId,
                OpenIddictConstants.Scopes.Profile,
                OpenIddictConstants.Scopes.OfflineAccess // wymagane do refresh_token
            });

            return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }

        private async Task<IActionResult> HandleRefreshTokenGrant()
        {
            // OpenIddict automatycznie waliduje refresh token i odtwarza principal
            var result = await HttpContext.AuthenticateAsync(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            if (result?.Principal == null)
                return Unauthorized("Invalid or expired refresh token");

            var userId = result.Principal.FindFirst(OpenIddictConstants.Claims.Subject)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("Invalid token claims");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return Unauthorized("User not found");

            // Sprawdź czy konto nie zostało zablokowane od czasu wystawienia tokena
            if (await _userManager.IsLockedOutAsync(user))
                return Unauthorized("Account locked");

            // Odśwież claims (mogły się zmienić role itp.)
            var identity = new ClaimsIdentity(OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
            identity.AddClaim(OpenIddictConstants.Claims.Subject, user.Id.ToString());
            identity.AddClaim(OpenIddictConstants.Claims.Name, user.UserName!);
            identity.AddClaim("id", user.Id.ToString(), ClaimValueTypes.Integer);

            var principal = new ClaimsPrincipal(identity);
            principal.SetScopes(result.Principal.GetScopes());

            return SignIn(principal, OpenIddictServerAspNetCoreDefaults.AuthenticationScheme);
        }
    }
}
