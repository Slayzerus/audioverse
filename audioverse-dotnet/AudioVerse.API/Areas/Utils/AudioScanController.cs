using AudioVerse.Application.Models.Karaoke;
using AudioVerse.Application.Services.Audio;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Utils;

/// <summary>
/// Scan directories for audio files and import them to the media library.
/// </summary>
[ApiController]
[Route("api/library/scan")]
[Authorize]
[Produces("application/json")]
[Tags("Library - Scan")]
public class AudioScanController : ControllerBase
{
    private readonly ILibrarySongRepository _repo;
    public AudioScanController(ILibrarySongRepository repo) => _repo = repo;

    /// <summary>
    /// Scan a directory for audio files without importing.
    /// </summary>
    /// <param name="request">Scan request with directory path</param>
    /// <returns>List of discovered audio files with metadata</returns>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ScanDirectory([FromBody] ScanRequest request)
    {
        var svc = HttpContext.RequestServices.GetService<IAudioFilesService>();
        if (svc == null) return BadRequest(new { Message = "AudioFiles service not configured" });
        var files = await svc.ScanDirectoryAsync(request.Path);
        return Ok(new { Count = files.Count, Files = files });
    }

    /// <summary>
    /// Scan a directory and import discovered audio files to the media library.
    /// Creates artists and songs automatically based on file metadata.
    /// </summary>
    /// <param name="request">Scan request with directory path</param>
    /// <returns>Number of imported files</returns>
    /// <summary>Scan And Import.</summary>
    [HttpPost("import")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ScanAndImport([FromBody] ScanRequest request)
    {
        var svc = HttpContext.RequestServices.GetService<IAudioFilesService>();
        if (svc == null) return BadRequest(new { Message = "AudioFiles service not configured" });

        var files = await svc.ScanDirectoryAsync(request.Path);
        var imported = 0;

        foreach (var f in files)
        {
            Artist? artist = null;
            if (!string.IsNullOrEmpty(f.Artist))
                artist = await _repo.GetOrCreateArtistByNameAsync(f.Artist);

            var song = new Song { Title = f.Title ?? f.FileName, PrimaryArtistId = artist?.Id };
            var songId = await _repo.AddAsync(song);

            await _repo.AddAudioFileAsync(new AudioFile
            {
                FilePath = f.FilePath,
                FileName = f.FileName,
                SongId = songId,
                SampleRate = f.SampleRate,
                Channels = f.Channels,
                Genre = f.Genre,
                Year = f.Year
            });
            imported++;
        }

        return Ok(new { Imported = imported });
    }
}

