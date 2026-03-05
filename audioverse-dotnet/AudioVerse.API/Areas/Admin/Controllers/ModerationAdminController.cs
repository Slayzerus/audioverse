using AudioVerse.Application.Commands.Moderation;
using AudioVerse.Application.Models.Moderation;
using AudioVerse.Application.Queries.Moderation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/moderation/admin")]
    [Produces("application/json")]
    [Authorize(Roles = "Moderator,Admin")]
    public class ModerationAdminController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ModerationAdminController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Pobierz zg?oszenia nadu?y? (panel moderatora)
        /// </summary>
        [HttpGet("reports")]
        public async Task<IActionResult> GetAbuseReports([FromQuery] string? status = null, [FromQuery] int take = 100)
        {
            var reports = await _mediator.Send(new GetAbuseReportsQuery(status, take));
            return Ok(new { Success = true, Reports = reports });
        }

        /// <summary>
        /// Rozpatrz zg?oszenie nadu?ycia (zatwierd?/odrzu?, komentarz moderatora)
        /// </summary>
        [HttpPut("report/{id}/resolve")]
        public async Task<IActionResult> ResolveAbuseReport(int id, [FromBody] ResolveAbuseReportRequest request)
        {
            var moderatorId = int.TryParse(User.FindFirst("userId")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : 0;
            var result = await _mediator.Send(new ResolveAbuseReportCommand(id, request.Resolved, request.ModeratorComment, moderatorId));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }
    }
}

