using AudioVerse.Application.Queries.Audio;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.MediaLibrary.Controllers;

[ApiController]
[Route("api/dance")]
[Produces("application/json")]
[AllowAnonymous]
public class DanceController : ControllerBase
{
    private readonly IMediator _mediator;
    public DanceController(IMediator mediator) => _mediator = mediator;

    /// <summary>Classify dance styles for a song by ID.</summary>
    [HttpGet("song/{songId:int}")]
    public async Task<IActionResult> ClassifySong(int songId)
    {
        var results = await _mediator.Send(new ClassifySongDancesQuery(songId));
        return Ok(new { Success = true, Dances = results });
    }

    /// <summary>Classify dance styles by BPM, time signature, energy and valence.</summary>
    [HttpGet("classify")]
    public async Task<IActionResult> ClassifyByParams(
        [FromQuery] decimal bpm,
        [FromQuery] int timeSignature = 4,
        [FromQuery] decimal? energy = null,
        [FromQuery] decimal? valence = null)
    {
        var results = await _mediator.Send(new ClassifyByParamsQuery(bpm, timeSignature, energy, valence));
        return Ok(new { Success = true, Dances = results });
    }
}
