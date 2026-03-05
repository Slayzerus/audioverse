using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Repositories;
using AudioVerse.Application.Services;
using AudioVerse.API.Models.Platforms;
using AudioVerse.Domain.Entities.UserProfiles;

namespace AudioVerse.API.Areas.Platforms.Controllers
{
    [Route("api/platforms")]
    [ApiController]
    public class PlatformsController : ControllerBase
    {
        private readonly IExternalAccountRepository _extRepo;
        private readonly ICurrentUserService _currentUser;
        private readonly ILogger<PlatformsController> _logger;

        public PlatformsController(IExternalAccountRepository extRepo, ICurrentUserService currentUser, ILogger<PlatformsController> logger)
        {
            _extRepo = extRepo;
            _currentUser = currentUser;
            _logger = logger;
        }

        /// <summary>
        /// Get all external accounts linked to current user
        /// </summary>
        [HttpGet("accounts")]
        [Authorize]
        public async Task<IActionResult> GetAccounts()
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            var accounts = await _extRepo.GetUserAccountsAsync(userId.Value);
            var dto = accounts.Select(a => new ExternalAccountDto
            {
                Id = a.Id,
                Platform = a.Platform,
                ExternalUserId = a.ExternalUserId,
                DisplayName = a.DisplayName,
                Email = a.Email,
                AvatarUrl = a.AvatarUrl,
                LinkedAt = a.LinkedAt,
                LastUsedAt = a.LastUsedAt,
                IsActive = a.IsActive,
                TokenExpiresAt = a.TokenExpiresAt,
                Scopes = a.Scopes
            }).ToList();

            return Ok(dto);
        }

        /// <summary>
        /// Get linked account details for a specific platform (spotify|tidal)
        /// </summary>
        [HttpGet("{platform}")]
        [Authorize]
        public async Task<IActionResult> GetByPlatform(string platform)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            if (!Enum.TryParse<ExternalPlatform>(platform, true, out var p))
                return BadRequest("unknown platform");

            var acc = await _extRepo.GetByPlatformAsync(userId.Value, p);
            if (acc == null) return NotFound();

            var dto = new ExternalAccountDto
            {
                Id = acc.Id,
                Platform = acc.Platform,
                ExternalUserId = acc.ExternalUserId,
                DisplayName = acc.DisplayName,
                Email = acc.Email,
                AvatarUrl = acc.AvatarUrl,
                LinkedAt = acc.LinkedAt,
                LastUsedAt = acc.LastUsedAt,
                IsActive = acc.IsActive,
                TokenExpiresAt = acc.TokenExpiresAt,
                Scopes = acc.Scopes
            };

            return Ok(dto);
        }

        /// <summary>
        /// Unlink external account for current user
        /// </summary>
        [HttpDelete("{platform}")]
        [Authorize]
        public async Task<IActionResult> Unlink(string platform)
        {
            var userId = _currentUser.UserId;
            if (userId == null) return Forbid();

            if (!Enum.TryParse<ExternalPlatform>(platform, true, out var p))
                return BadRequest("unknown platform");

            var ok = await _extRepo.UnlinkAccountAsync(userId.Value, p);
            if (!ok) return NotFound();

            _logger.LogInformation("User {UserId} unlinked {Platform}", userId, p);
            return NoContent();
        }
    }
}
