using System.Security.Claims;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers
{
    /// <summary>
    /// Manage audio and media files in the library (tracks, videos, covers).
    /// </summary>
    [ApiController]
    [Route("api/library/files")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Library - Files")]
    public class MediaFilesController : ControllerBase
    {
        private readonly ILibrarySongRepository _repo;
        public MediaFilesController(ILibrarySongRepository repo) { _repo = repo; }

        private int? GetCurrentUserId()
        {
            var idClaim = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(idClaim, out var id) ? id : null;
        }

        // ════════════════════════════════════════════════════════════
        //  AUDIO FILES
        // ════════════════════════════════════════════════════════════

        /// <summary>
        /// List audio files visible to the current user (public + own private).
        /// </summary>
        [HttpGet("audio")]
        public async Task<IActionResult> ListAudioFiles([FromQuery] int? songId, [FromQuery] int? albumId)
            => Ok(await _repo.ListAudioFilesAsync(songId, albumId, GetCurrentUserId()));

        /// <summary>Get an audio file by ID (respects privacy).</summary>
        [HttpGet("audio/{id}")]
        public async Task<IActionResult> GetAudioFile(int id)
        {
            var f = await _repo.GetAudioFileByIdAsync(id, GetCurrentUserId());
            return f != null ? Ok(f) : NotFound();
        }

        /// <summary>Create an audio file record.</summary>
        [HttpPost("audio")]
        public async Task<IActionResult> CreateAudioFile([FromBody] AudioFile file)
        {
            if (file == null) return BadRequest();
            var fileId = await _repo.AddAudioFileAsync(file);
            return Ok(new { Id = fileId });
        }

        /// <summary>Delete an audio file (owner only for private files).</summary>
        [HttpDelete("audio/{id}")]
        public async Task<IActionResult> DeleteAudioFile(int id)
            => await _repo.DeleteAudioFileAsync(id, GetCurrentUserId()) ? NoContent() : NotFound();

        // —— Media Files ——

        /// <summary>List all media files.</summary>
        [HttpGet("media")]
        public async Task<IActionResult> ListMediaFiles([FromQuery] int? songId)
            => Ok(await _repo.ListMediaFilesAsync(songId));

        /// <summary>Create a media file record.</summary>
        [HttpPost("media")]
        public async Task<IActionResult> CreateMediaFile([FromBody] MediaFile file)
        {
            if (file == null) return BadRequest();
            var fileId = await _repo.AddMediaFileAsync(file);
            return Ok(new { Id = fileId });
        }

        /// <summary>Delete a media file.</summary>
        [HttpDelete("media/{id}")]
        public async Task<IActionResult> DeleteMediaFile(int id)
            => await _repo.DeleteMediaFileAsync(id) ? NoContent() : NotFound();
    }
}


