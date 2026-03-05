using AudioVerse.API.Areas.Utils;
using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Services.MediaLibrary;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Karaoke.Controllers
{
    [ApiController]
    [Route("api/karaoke/ultrastar")]
    [Authorize]
    [Produces("application/json")]
    public class UltrastarController : ControllerBase
    {
        /// <summary>Scan a folder for Ultrastar song files.</summary>
        [HttpGet("scan")]
        public async Task<IActionResult> Scan()
        {
            var svc = HttpContext.RequestServices.GetService<IUltrastarFileService>();
            if (svc == null) return BadRequest(new { Message = "UltraStar service not configured" });
            var songs = await svc.ScanAsync();
            return Ok(new { Count = songs.Count, Songs = songs });
        }

        /// <summary>Parse an uploaded Ultrastar file.</summary>
        [HttpPost("parse")]
        public async Task<IActionResult> ParseFile([FromBody] UltrastarParseRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IUltrastarFileService>();
            if (svc == null) return BadRequest(new { Message = "UltraStar service not configured" });
            var song = await svc.ParseFileAsync(request.FilePath);
            return song != null ? Ok(song) : NotFound();
        }

        /// <summary>Export karaoke song to Ultrastar format.</summary>
        [HttpPost("export")]
        public async Task<IActionResult> Export([FromBody] UltrastarExportRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IUltrastarFileService>();
            if (svc == null) return BadRequest(new { Message = "UltraStar service not configured" });
            await svc.ExportAsync(request.Song, request.OutputPath);
            return Ok(new { Success = true, Path = request.OutputPath });
        }

        /// <summary>Convert LRC lyrics to Ultrastar format.</summary>
        [HttpPost("convert/lrc")]
        public async Task<IActionResult> ConvertLrc([FromBody] LrcConvertRequest request)
        {
            var svc = HttpContext.RequestServices.GetService<IUltrastarConverterService>();
            if (svc == null) return BadRequest(new { Message = "UltraStar converter not configured" });
            var path = await svc.ConvertLrcToUltrastarAsync(request.Artist, request.Title, request.LrcContent);
            return path != null ? Ok(new { Success = true, Path = path }) : BadRequest(new { Message = "Conversion failed" });
        }
    }
}

