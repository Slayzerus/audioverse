using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/config")]
    [Produces("application/json")]
    [AllowAnonymous]
    public class ConfigController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ConfigController(IMediator mediator) { _mediator = mediator; }

        // Public endpoint to fetch karaoke scoring presets (no auth)
        /// <summary>Get active karaoke scoring configuration.</summary>
        [HttpGet("karaoke-scoring")]
        public async Task<IActionResult> GetKaraokeScoring()
        {
            var json = await _mediator.Send(new AudioVerse.Application.Queries.Admin.GetScoringPresetsQuery());
            return Ok(new { Success = true, Presets = System.Text.Json.JsonSerializer.Deserialize<object>(json) });
        }
    }
}

