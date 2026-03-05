using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Models.Requests.User;
using AudioVerse.Domain.Enums;
using AudioVerse.Application.Queries.User;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    /// <summary>
    /// User profile management — players, settings, avatar.
    /// </summary>
    [ApiController]
    [Route("api/user")]
    [Produces("application/json")]
    [Consumes("application/json")]
    [Tags("Identity - User")]
    public class UserController(IMediator mediator) : ControllerBase
    {

        /// <summary>
        /// Get all players for a user profile.
        /// </summary>
        /// <param name="profileId">Profile ID</param>
        /// <returns>List of players</returns>
        [HttpGet("profiles/{profileId}/players")]
        [Authorize]
        public async Task<IActionResult> GetProfilePlayers(int profileId)
        {
            var players = await mediator.Send(new AudioVerse.Application.Queries.User.GetUserProfilePlayersQuery(profileId));
            if (players != null && players.Count > 0 && !players.Any(x => x.IsPrimary))
            {
                players[0].IsPrimary = true;
            }
            return Ok(new { Success = true, Players = players });
        }

        /// <summary>
        /// Create a new player for a profile (multipart form with optional photo).
        /// </summary>
        /// <param name="profileId">Profile ID</param>
        /// <param name="request">Player data with optional photo file</param>
        [HttpPost("profiles/{profileId}/players")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateProfilePlayer(int profileId, [FromForm] CreateUserProfilePlayerRequest request)
        {
            var id = await mediator.Send(new AudioVerse.Application.Commands.User.CreateUserProfilePlayerCommand(profileId, request.Name, request.PreferredColors, request.FillPattern, request.IsMainPlayer, request.Email, request.Icon, request.KaraokeSettings));

            if (request.Photo is { Length: > 0 })
            {
                var fs = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Storage.IFileStorage>();
                var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
                var player = await repo.GetPlayerByIdAsync(id);
                if (player != null)
                {
                    var ext = Path.GetExtension(request.Photo.FileName)?.ToLowerInvariant() ?? ".jpg";
                    var key = $"{id}/{Guid.NewGuid()}{ext}";
                    await fs.EnsureBucketExistsAsync("player-photos");
                    var bytes = new byte[request.Photo.Length];
                    using (var stream = request.Photo.OpenReadStream()) await stream.ReadExactlyAsync(bytes);
                    using var ms = new MemoryStream(bytes);
                    await fs.UploadAsync("player-photos", key, ms, request.Photo.ContentType ?? "image/jpeg");
                    player.PhotoKey = key;
                    await repo.UpdatePlayerAsync(player);
                }
            }

            return Ok(new { Success = true, PlayerId = id });
        }

        /// <summary>Update a player for a profile.</summary>
        [HttpPut("profiles/{profileId}/players/{playerId}")]
        [Authorize]
        public async Task<IActionResult> UpdateProfilePlayer(int profileId, int playerId, [FromBody] UpdateUserProfilePlayerRequest request)
        {
            var result = await mediator.Send(new AudioVerse.Application.Commands.User.UpdateUserProfilePlayerCommand(playerId, profileId, request.Name, request.PreferredColors, request.FillPattern, request.IsMainPlayer, request.Email, request.Icon, request.KaraokeSettings));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Delete a player from a profile.</summary>
        [HttpDelete("profiles/{profileId}/players/{playerId}")]
        [Authorize]
        public async Task<IActionResult> DeleteProfilePlayer(int profileId, int playerId)
        {
            var result = await mediator.Send(new AudioVerse.Application.Commands.User.DeleteUserProfilePlayerCommand(playerId, profileId));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Set the primary player for a profile.</summary>
        [HttpPost("profiles/{profileId}/players/{playerId}/set-primary")]
        [Authorize]
        public async Task<IActionResult> SetPrimaryProfilePlayer(int profileId, int playerId)
        {
            var result = await mediator.Send(new AudioVerse.Application.Commands.User.SetPrimaryUserProfilePlayerCommand(profileId, playerId));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Upload player photo (profile picture).</summary>
        [HttpPost("profiles/{profileId}/players/{playerId}/photo")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadPlayerPhoto(int profileId, int playerId, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest(new { Success = false, Message = "File is required" });

            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
            var fs = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Storage.IFileStorage>();

            var player = await repo.GetPlayerByIdAsync(playerId);
            if (player == null || player.ProfileId != profileId) return NotFound();

            if (!string.IsNullOrEmpty(player.PhotoKey))
                await fs.DeleteAsync("player-photos", player.PhotoKey);

            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";
            var key = $"{playerId}/{Guid.NewGuid()}{ext}";
            await fs.EnsureBucketExistsAsync("player-photos");

            var bytes = new byte[file.Length];
            using (var stream = file.OpenReadStream())
                await stream.ReadExactlyAsync(bytes);
            using var ms = new MemoryStream(bytes);
            await fs.UploadAsync("player-photos", key, ms, file.ContentType ?? "image/jpeg");

            player.PhotoKey = key;
            await repo.UpdatePlayerAsync(player);

            return Ok(new { Success = true, Key = key });
        }

        /// <summary>Get player photo image.</summary>
        [HttpGet("players/{playerId}/photo")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPlayerPhoto(int playerId)
        {
            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
            var fs = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Storage.IFileStorage>();

            var player = await repo.GetPlayerByIdAsync(playerId);
            if (player == null || string.IsNullOrEmpty(player.PhotoKey)) return NotFound();

            var stream = await fs.DownloadAsync("player-photos", player.PhotoKey);
            if (stream == null) return NotFound();

            var ext = Path.GetExtension(player.PhotoKey)?.ToLowerInvariant();
            var contentType = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg"
            };
            return File(stream, contentType);
        }

        // ????????????????????????????????????????????????????????????
        //  PLAYER LINKS
        // ????????????????????????????????????????????????????????????

        /// <summary>
        /// Krok 1 � wyszukanie graczy z innego profilu po uwierzytelnieniu credentials.
        /// </summary>
        [HttpPost("profiles/{profileId}/players/{playerId}/link/search")]
        [Authorize]
        public async Task<IActionResult> SearchPlayersForLink(int profileId, int playerId, [FromBody] PlayerLinkSearchRequest request)
        {
            var players = await mediator.Send(new AudioVerse.Application.Commands.User.SearchPlayersForLinkCommand(playerId, profileId, request.Login, request.Password));
            return Ok(new { Success = true, Players = players });
        }

        /// <summary>
        /// Krok 2 � potwierdzenie linku z wybranym graczem z innego profilu.
        /// </summary>
        [HttpPost("profiles/{profileId}/players/{playerId}/link/confirm")]
        [Authorize]
        public async Task<IActionResult> ConfirmPlayerLink(int profileId, int playerId, [FromBody] PlayerLinkConfirmRequest request)
        {
            var link = await mediator.Send(new AudioVerse.Application.Commands.User.ConfirmPlayerLinkCommand(playerId, profileId, request.TargetPlayerId, request.Scope));
            return link != null
                ? CreatedAtAction(nameof(GetPlayerLinks), new { profileId, playerId }, link)
                : BadRequest(new { Success = false, Message = "Nie uda?o si? utworzy? linku � sprawd? czy gracze istniej?, nie s? z tego samego profilu i nie s? ju? zlinkowane." });
        }

        /// <summary>Pobranie aktywnych link�w gracza.</summary>
        [HttpGet("profiles/{profileId}/players/{playerId}/links")]
        [Authorize]
        public async Task<IActionResult> GetPlayerLinks(int profileId, int playerId)
        {
            var links = await mediator.Send(new AudioVerse.Application.Queries.User.GetPlayerLinksQuery(playerId, profileId));
            return Ok(new { Success = true, Links = links });
        }

        /// <summary>Cofni?cie (revoke) linku.</summary>
        [HttpDelete("profiles/{profileId}/players/{playerId}/links/{linkId}")]
        [Authorize]
        public async Task<IActionResult> RevokePlayerLink(int profileId, int playerId, int linkId)
        {
            var result = await mediator.Send(new AudioVerse.Application.Commands.User.RevokePlayerLinkCommand(linkId, profileId));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>
        /// Update user profile settings (DeveloperMode, Jurors, Fullscreen, Theme, etc.)
        /// </summary>
        [HttpPut("settings")]
        [Authorize]
        public async Task<IActionResult> UpdateUserProfileSettings([FromBody] UpdateUserProfileSettingsRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var command = new UpdateUserProfileSettingsCommand(
                userId,
                request.DeveloperMode,
                request.Jurors,
                request.Fullscreen,
                request.Theme,
                request.SoundEffects,
                request.Language,
                request.Difficulty,
                request.PitchAlgorithm,
                request.CompletedTutorials,
                request.BreadcrumbsEnabled,
                request.KaraokeDisplaySettings,
                request.PlayerKaraokeSettings,
                request.GamepadMapping,
                request.CustomThemes,
                request.LocalPlaylists
            );
            var result = await mediator.Send(command);
            return result ? Ok(new { Success = true }) : BadRequest(new { Success = false });
        }

        /// <summary>
        /// Get user profile settings (all synced preferences)
        /// </summary>
        [HttpGet("settings")]
        [Authorize]
        public async Task<IActionResult> GetUserProfileSettings()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var query = new AudioVerse.Application.Queries.User.GetUserProfileSettingsQuery(userId);
            var settings = await mediator.Send(query);
            if (settings == null)
                return Ok(new
                {
                    Success = true,
                    Settings = new
                    {
                        DeveloperMode = false,
                        Jurors = false,
                        Fullscreen = false,
                        Theme = "light",
                        SoundEffects = true,
                        Language = "pl",
                        BreadcrumbsEnabled = true
                    }
                });

            return Ok(new
            {
                Success = true,
                Settings = new
                {
                    settings.DeveloperMode,
                    settings.Jurors,
                    settings.Fullscreen,
                    settings.Theme,
                    settings.SoundEffects,
                    settings.Language,
                    settings.Difficulty,
                    settings.PitchAlgorithm,
                    settings.CompletedTutorials,
                    settings.BreadcrumbsEnabled,
                    settings.KaraokeDisplaySettings,
                    settings.PlayerKaraokeSettings,
                    settings.GamepadMapping,
                    settings.CustomThemes,
                    settings.LocalPlaylists,
                }
            });
        }

        // ════════════════════════════════════════════════════════════
        //  USER PROFILE PHOTO
        // ════════════════════════════════════════════════════════════

        /// <summary>Upload or replace user profile photo.</summary>
        [HttpPost("photo")]
        [Authorize]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadUserPhoto(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Success = false, Message = "File is required" });

            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized(new { Success = false, Message = "Unauthorized" });

            var userId = int.Parse(userIdClaim);
            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
            var fs = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Storage.IFileStorage>();

            var user = await repo.GetByIdAsync(userId);
            if (user == null) return NotFound();

            // Usuń stare zdjęcie
            if (!string.IsNullOrEmpty(user.PhotoKey))
                await fs.DeleteAsync("user-photos", user.PhotoKey);

            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant() ?? ".jpg";
            var key = $"{userId}/{Guid.NewGuid()}{ext}";
            await fs.EnsureBucketExistsAsync("user-photos");

            using var stream = file.OpenReadStream();
            await fs.UploadAsync("user-photos", key, stream, file.ContentType ?? "image/jpeg");

            user.PhotoKey = key;
            await repo.UpdateAsync(user);

            return Ok(new { Success = true, Key = key });
        }

        /// <summary>Get current user's profile photo.</summary>
        [HttpGet("photo")]
        [Authorize]
        public async Task<IActionResult> GetMyPhoto()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            return await ServeUserPhoto(int.Parse(userIdClaim));
        }

        /// <summary>Get any user's profile photo by user ID (public).</summary>
        [HttpGet("profiles/{userId}/photo")]
        [AllowAnonymous]
        public async Task<IActionResult> GetUserPhoto(int userId)
        {
            return await ServeUserPhoto(userId);
        }

        /// <summary>Delete current user's profile photo.</summary>
        [HttpDelete("photo")]
        [Authorize]
        public async Task<IActionResult> DeleteUserPhoto()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
                return Unauthorized();

            var userId = int.Parse(userIdClaim);
            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
            var fs = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Storage.IFileStorage>();

            var user = await repo.GetByIdAsync(userId);
            if (user == null) return NotFound();

            if (string.IsNullOrEmpty(user.PhotoKey))
                return Ok(new { Success = true, Message = "No photo to delete" });

            await fs.DeleteAsync("user-photos", user.PhotoKey);
            user.PhotoKey = null;
            await repo.UpdateAsync(user);

            return Ok(new { Success = true });
        }

        private async Task<IActionResult> ServeUserPhoto(int userId)
        {
            var repo = HttpContext.RequestServices.GetRequiredService<AudioVerse.Domain.Repositories.IUserProfileRepository>();
            var fs = HttpContext.RequestServices.GetRequiredService<AudioVerse.Infrastructure.Storage.IFileStorage>();

            var user = await repo.GetByIdAsync(userId);
            if (user == null || string.IsNullOrEmpty(user.PhotoKey))
                return NotFound();

            var stream = await fs.DownloadAsync("user-photos", user.PhotoKey);
            if (stream == null) return NotFound();

            var ext = Path.GetExtension(user.PhotoKey)?.ToLowerInvariant();
            var contentType = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg"
            };
            return File(stream, contentType);
        }

    }
}
