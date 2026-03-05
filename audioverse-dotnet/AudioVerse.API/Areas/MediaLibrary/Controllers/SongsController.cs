using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

/// <summary>
/// Media library songs catalog management.
/// </summary>
[ApiController]
[Route("api/library/songs")]
[Authorize]
[Produces("application/json")]
[Tags("Library - Songs")]
public class SongsController : ControllerBase
{
    private readonly ILibrarySongRepository _repo;

    public SongsController(ILibrarySongRepository repo) => _repo = repo;

    /// <summary>
    /// Search songs in the media library.
    /// </summary>
    /// <param name="q">Search query (matches title or artist name)</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page (default 20)</param>
    /// <returns>Paginated list of songs</returns>
    /// <summary>Search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _repo.SearchAsync(q, page, pageSize);
        return Ok(new { Items = items, TotalCount = total, Page = page, PageSize = pageSize });
    }

    /// <summary>
    /// Get a song by ID with full details.
    /// </summary>
    /// <param name="id">Song ID</param>
    /// <returns>Song with details, artist, and album</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Song), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var song = await _repo.GetByIdAsync(id);
        return song != null ? Ok(song) : NotFound();
    }

    /// <summary>
    /// Create a new song in the media library.
    /// </summary>
    /// <param name="song">Song data</param>
    /// <returns>Created song ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] Song song)
    {
        if (song == null || string.IsNullOrWhiteSpace(song.Title)) return BadRequest();
        var id = await _repo.AddAsync(song);
        return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
    }

    /// <summary>
    /// Update an existing song.
    /// </summary>
    /// <param name="id">Song ID</param>
    /// <param name="input">Updated song data</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] Song input)
    {
        input.Id = id;
        return await _repo.UpdateAsync(input) ? Ok(new { Success = true }) : NotFound();
    }

    /// <summary>
    /// Delete a song from the media library.
    /// </summary>
    /// <param name="id">Song ID</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
        => await _repo.DeleteAsync(id) ? NoContent() : NotFound();

    // ------------------------------------------------------------
    //  SONG DETAILS (lyrics, tabs, credits, etc.)
    // ------------------------------------------------------------

    /// <summary>
    /// Get all details for a song (lyrics, tabs, credits, etc.).
    /// </summary>
    /// <param name="songId">Song ID</param>
    /// <returns>List of song details</returns>
    [HttpGet("{songId:int}/details")]
    [ProducesResponseType(typeof(List<SongDetail>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDetails(int songId)
        => Ok(await _repo.GetDetailsAsync(songId));

    /// <summary>
    /// Add a detail to a song (lyrics, tabs, credits, etc.).
    /// </summary>
    /// <param name="songId">Song ID</param>
    /// <param name="detail">Detail data (type and value)</param>
    /// <returns>Created detail ID</returns>
    /// <summary>Add Detail.</summary>
    [HttpPost("{songId:int}/details")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddDetail(int songId, [FromBody] SongDetail detail)
    {
        detail.SongId = songId;
        var id = await _repo.AddDetailAsync(detail);
        return Ok(new { Id = id });
    }

    /// <summary>
    /// Delete a song detail.
    /// </summary>
    /// <param name="id">Detail ID</param>
    [HttpDelete("details/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDetail(int id)
        => await _repo.DeleteDetailAsync(id) ? NoContent() : NotFound();

    /// <summary>
    /// Auto-tag a song using AI analysis (genre, mood, BPM detection).
    /// Requires external AI audio service to be configured.
    /// </summary>
    [HttpPost("{id:int}/auto-tag")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> AutoTag(int id)
    {
        var song = await _repo.GetByIdAsync(id);
        if (song == null) return NotFound();

        // TODO: integrate with external AI service (Essentia/AcousticBrainz/custom model)
        return StatusCode(503, new
        {
            Message = "AI audio analysis service not yet configured. Configure AiAudio section in appsettings.",
            SongId = id,
            SongTitle = song.Title,
            Hint = "POST /api/library/songs/{id}/auto-tag will detect: genre, mood, BPM, key, danceability, valence"
        });
    }
}

