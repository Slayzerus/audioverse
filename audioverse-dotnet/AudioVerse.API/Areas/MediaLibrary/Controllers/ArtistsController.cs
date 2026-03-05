using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Domain.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

/// <summary>
/// Media library artists catalog management.
/// </summary>
[ApiController]
[Route("api/library/artists")]
[Authorize]
[Produces("application/json")]
[Tags("Library - Artists")]
public class ArtistsController : ControllerBase
{
    private readonly ILibraryArtistRepository _repo;

    public ArtistsController(ILibraryArtistRepository repo) => _repo = repo;

    /// <summary>
    /// Search artists in the media library.
    /// </summary>
    /// <param name="q">Search query (matches name)</param>
    /// <param name="page">Page number (1-based)</param>
    /// <param name="pageSize">Items per page (default 20)</param>
    /// <returns>Paginated list of artists</returns>
    /// <summary>Search.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> Search([FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var (items, total) = await _repo.SearchAsync(q, page, pageSize);
        return Ok(new { Items = items, TotalCount = total, Page = page, PageSize = pageSize });
    }

    /// <summary>
    /// Get an artist by ID with details and facts.
    /// </summary>
    /// <param name="id">Artist ID</param>
    /// <returns>Artist with details and facts</returns>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Artist), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var a = await _repo.GetByIdAsync(id);
        return a != null ? Ok(a) : NotFound();
    }

    /// <summary>
    /// Create a new artist in the media library.
    /// </summary>
    /// <param name="artist">Artist data</param>
    /// <returns>Created artist ID</returns>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create([FromBody] Artist artist)
    {
        if (artist == null || string.IsNullOrWhiteSpace(artist.Name)) return BadRequest();
        var id = await _repo.AddAsync(artist);
        return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
    }

    /// <summary>
    /// Update an existing artist.
    /// </summary>
    /// <param name="id">Artist ID</param>
    /// <param name="input">Updated artist data</param>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] Artist input)
    {
        input.Id = id;
        return await _repo.UpdateAsync(input) ? Ok(new { Success = true }) : NotFound();
    }

    /// <summary>
    /// Delete an artist from the media library.
    /// </summary>
    /// <param name="id">Artist ID</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
        => await _repo.DeleteAsync(id) ? NoContent() : NotFound();

    // ------------------------------------------------------------
    //  ARTIST FACTS
    // ------------------------------------------------------------

    /// <summary>
    /// Get all facts for an artist.
    /// </summary>
    /// <param name="artistId">Artist ID</param>
    /// <returns>List of artist facts</returns>
    [HttpGet("{artistId:int}/facts")]
    [ProducesResponseType(typeof(List<ArtistFact>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFacts(int artistId)
        => Ok(await _repo.GetFactsAsync(artistId));

    /// <summary>
    /// Add a fact to an artist.
    /// </summary>
    /// <param name="artistId">Artist ID</param>
    /// <param name="fact">Fact data (type and value)</param>
    /// <returns>Created fact ID</returns>
    /// <summary>Add Fact.</summary>
    [HttpPost("{artistId:int}/facts")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddFact(int artistId, [FromBody] ArtistFact fact)
    {
        fact.ArtistId = artistId;
        var id = await _repo.AddFactAsync(fact);
        return Ok(new { Id = id });
    }

    /// <summary>
    /// Delete an artist fact.
    /// </summary>
    /// <param name="id">Fact ID</param>
    [HttpDelete("facts/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFact(int id)
        => await _repo.DeleteFactAsync(id) ? NoContent() : NotFound();

    // ------------------------------------------------------------
    //  ARTIST DETAIL (bio, country, image)
    // ------------------------------------------------------------

    /// <summary>
    /// Create or update artist detail (bio, country, image URL).
    /// </summary>
    /// <param name="artistId">Artist ID</param>
    /// <param name="detail">Detail data</param>
    [HttpPut("{artistId:int}/detail")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpsertDetail(int artistId, [FromBody] ArtistDetail detail)
    {
        await _repo.UpsertDetailAsync(artistId, detail);
        return Ok(new { Success = true });
    }
}

