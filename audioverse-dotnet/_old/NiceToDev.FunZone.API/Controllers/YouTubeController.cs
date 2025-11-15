using Microsoft.AspNetCore.Mvc;
using NiceToDev.FunZone.Application.Interfaces;

namespace NiceToDev.FunZone.API.Controllers
{
    [ApiController]
    [Route("api/youtube")]
    public class YouTubeController : ControllerBase
    {
        private readonly IYouTubeService _youTubeService;

        public YouTubeController(IYouTubeService youTubeService)
        {
            _youTubeService = youTubeService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchSong([FromQuery] string artist, [FromQuery] string title)
        {
            var videoId = await _youTubeService.SearchSongAsync(artist, title);
            if (videoId == null) return NotFound("Nie znaleziono utworu");

            return Ok(new { videoId });
        }

        [HttpGet("embed")]
        public IActionResult GetEmbedUrl([FromQuery] string videoId)
        {
            string embedUrl = _youTubeService.GetEmbedUrl(videoId);
            return Ok(new { embedUrl });
        }
    }
}
