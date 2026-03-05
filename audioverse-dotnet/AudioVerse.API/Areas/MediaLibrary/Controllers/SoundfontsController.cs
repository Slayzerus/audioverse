using AudioVerse.Application.Commands.Audio;
using AudioVerse.Application.Queries.Audio;
using AudioVerse.Domain.Entities.Audio;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

/// <summary>
/// Soundfont (SF2/SFZ/DLS) management — CRUD, file upload to MinIO, download URLs.
/// </summary>
[ApiController]
[Route("api/library/soundfonts")]
[Authorize]
[Produces("application/json")]
[Tags("Library - Soundfonts")]
public class SoundfontsController : ControllerBase
{
    private readonly IMediator _mediator;

    public SoundfontsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    // ── CRUD ──

    /// <summary>List soundfonts with paging and optional search/filter.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Soundfont>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? query = null,
        [FromQuery] SoundfontFormat? format = null)
    {
        var result = await _mediator.Send(new GetSoundfontsQuery(page, pageSize, query, format));
        return Ok(result);
    }

    /// <summary>Get a soundfont by ID (including files).</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(Soundfont), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id)
    {
        var sf = await _mediator.Send(new GetSoundfontByIdQuery(id));
        return sf != null ? Ok(sf) : NotFound();
    }

    /// <summary>Create a new soundfont record (metadata only — upload files separately).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] Soundfont soundfont)
    {
        if (soundfont == null) return BadRequest();
        soundfont.UploadedByUserId = GetUserId();
        var id = await _mediator.Send(new CreateSoundfontCommand(soundfont));
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    /// <summary>Update soundfont metadata.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] Soundfont soundfont)
    {
        soundfont.Id = id;
        return await _mediator.Send(new UpdateSoundfontCommand(soundfont)) ? Ok() : NotFound();
    }

    /// <summary>Delete a soundfont and all its files from storage.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id)
    {
        return await _mediator.Send(new DeleteSoundfontCommand(id)) ? NoContent() : NotFound();
    }

    // ── File Upload ──

    /// <summary>Upload one or more files to a soundfont (stored in MinIO "soundfonts" bucket).</summary>
    [HttpPost("{soundfontId:int}/files")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [RequestSizeLimit(500_000_000)] // 500 MB
    public async Task<IActionResult> UploadFiles(int soundfontId, [FromForm] List<IFormFile> files, [FromQuery] SoundfontFileType fileType = SoundfontFileType.SoundfontBank)
    {
        var uploads = files.Select(f => new SoundfontFileUpload(f.FileName, f.ContentType, f.Length, f.OpenReadStream())).ToList();
        var result = await _mediator.Send(new UploadSoundfontFilesCommand(soundfontId, uploads, fileType));
        if (result == null) return NotFound();
        return Ok(new { soundfontId = result.SoundfontId, filesUploaded = result.FilesUploaded, files = result.Files });
    }

    /// <summary>Get all files belonging to a soundfont.</summary>
    [HttpGet("{soundfontId:int}/files")]
    [ProducesResponseType(typeof(IEnumerable<SoundfontFile>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetFiles(int soundfontId)
        => Ok(await _mediator.Send(new GetSoundfontFilesQuery(soundfontId)));

    /// <summary>Get a presigned download URL for a soundfont file (valid 1 hour).</summary>
    [HttpGet("files/{fileId:int}/download")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFileDownloadUrl(int fileId)
    {
        var url = await _mediator.Send(new GetSoundfontFileDownloadUrlQuery(fileId));
        return url != null ? Ok(new { url }) : NotFound();
    }

    /// <summary>Delete a single file from a soundfont.</summary>
    [HttpDelete("files/{fileId:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteFile(int fileId)
    {
        return await _mediator.Send(new DeleteSoundfontFileCommand(fileId)) ? NoContent() : NotFound();
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value, out var id) ? id : null;
}
