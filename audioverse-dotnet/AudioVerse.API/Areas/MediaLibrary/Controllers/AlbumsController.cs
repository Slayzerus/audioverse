using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

/// <summary>
/// Media library albums catalog management.
/// </summary>
[ApiController]
[Route("api/library/albums")]
[Authorize]
[Produces("application/json")]
[Tags("Library - Albums")]
public class AlbumsController : ControllerBase
{
    private readonly ILibraryAlbumRepository _repo;

    public AlbumsController(ILibraryAlbumRepository repo) => _repo = repo;

    /// <summary>
    /// Search albums in the media library.
    /// </summary>
    /// <param name="q">Search query (matches title)</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page (default 20)</param>
    /// <returns>Paginated list of albums</returns>
    /// <summary>Search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _repo.SearchAsync(q, page, pageSize);
        return Ok(new { Items = items, TotalCount = total, Page = page, PageSize = pageSize });
    }

    /// <summary>
    /// Get an album by ID with songs and artists.
    /// </summary>
    /// <param name="id">Album ID</param>
    /// <returns>Album with songs and album artists</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Album), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var album = await _repo.GetByIdAsync(id);
        return album != null ? Ok(album) : NotFound();
    }

    /// <summary>
    /// Create a new album in the media library.
    /// </summary>
    /// <param name="album">Album data</param>
    /// <returns>Created album ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] Album album)
    {
        if (album == null || string.IsNullOrWhiteSpace(album.Title)) return BadRequest();
        var id = await _repo.AddAsync(album);
        return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
    }

    /// <summary>
    /// Update an existing album.
    /// </summary>
    /// <param name="id">Album ID</param>
    /// <param name="input">Updated album data</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] Album input)
    {
        input.Id = id;
        return await _repo.UpdateAsync(input) ? Ok(new { Success = true }) : NotFound();
    }

    /// <summary>
    /// Delete an album from the media library.
    /// </summary>
    /// <param name="id">Album ID</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
        => await _repo.DeleteAsync(id) ? NoContent() : NotFound();

    // ------------------------------------------------------------
    //  ALBUM ARTISTS
    // ------------------------------------------------------------

    /// <summary>
    /// Add an artist to an album with a specific role.
    /// </summary>
    /// <param name="albumId">Album ID</param>
    /// <param name="aa">Album artist data (artistId, role, order)</param>
    [HttpPost("{albumId:int}/artists")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddArtist(int albumId, [FromBody] AlbumArtist aa)
    {
        aa.AlbumId = albumId;
        await _repo.AddAlbumArtistAsync(aa);
        return Ok(new { Success = true });
    }

    /// <summary>
    /// Remove an artist from an album.
    /// </summary>
    /// <param name="albumId">Album ID</param>
    /// <param name="artistId">Artist ID</param>
    [HttpDelete("{albumId:int}/artists/{artistId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveArtist(int albumId, int artistId)
        => await _repo.RemoveAlbumArtistAsync(albumId, artistId) ? NoContent() : NotFound();
}

