using AudioVerse.Application.Models.Audio;
using AudioVerse.Application.Services.DMX;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers
{
    /// <summary>
    /// Create and manage playlists (local or platform-specific).
    /// </summary>
    [ApiController]
    [Route("api/library/playlists")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Library - Playlists")]
    public class PlaylistController : ControllerBase
    {
        /// <summary>
        /// Create a new playlist.
        /// </summary>
        /// <param name="request">Playlist details (platform, name, track IDs)</param>
        /// <returns>Created playlist info</returns>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreatePlaylist([FromBody] CreatePlaylistRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IPlaylistService>();
            if (svc == null) return BadRequest(new { Message = "Playlist service not configured" });
            var result = await svc.CreatePlaylistAsync(request.Platform, request.Name, request.TrackIds, request.Description);
            return Ok(result);
        }
    }
}

