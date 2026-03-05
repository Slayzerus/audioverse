using AudioVerse.Application.Models.MediaLibrary;
using AudioVerse.Application.Services.MediaLibrary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers
{
    /// <summary>
    /// Download files from external URLs (audio, images, other files).
    /// </summary>
    [ApiController]
    [Route("api/library/download")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Library - Download")]
    public class DownloadController : ControllerBase
    {
        /// <summary>
        /// Download audio file from external URL.
        /// </summary>
        /// <param name="request">Download request with URL and optional filename</param>
        /// <returns>Downloaded file info</returns>
        [HttpPost("audio")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DownloadAudio([FromBody] DownloadRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IDownloadService>();
            if (svc == null) return BadRequest(new { Message = "Download service not configured" });
            var result = await svc.DownloadAudioAsync(request.Url, request.FileName);
            return result != null ? Ok(result) : BadRequest(new { Message = "Download failed" });
        }

        /// <summary>
        /// Download image file from external URL.
        /// </summary>
        /// <param name="request">Download request with URL and optional filename</param>
        /// <returns>Downloaded file info</returns>
        [HttpPost("image")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DownloadImage([FromBody] DownloadRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IDownloadService>();
            if (svc == null) return BadRequest(new { Message = "Download service not configured" });
            var result = await svc.DownloadImageAsync(request.Url, request.FileName);
            return result != null ? Ok(result) : BadRequest(new { Message = "Download failed" });
        }

        /// <summary>
        /// Download any file from external URL.
        /// </summary>
        /// <param name="request">Download request with URL and optional filename</param>
        /// <returns>Downloaded file info</returns>
        [HttpPost("file")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> DownloadFile([FromBody] DownloadRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IDownloadService>();
            if (svc == null) return BadRequest(new { Message = "Download service not configured" });
            var result = await svc.DownloadFileAsync(request.Url, request.FileName);
            return result != null ? Ok(result) : BadRequest(new { Message = "Download failed" });
        }
    }
}

