using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    [ApiController]
    [Route("api/permissions/readable")]
    public class PermissionsReadableController : ControllerBase
    {
        private readonly IMediator _mediator;
        public PermissionsReadableController(IMediator mediator) { _mediator = mediator; }

        /// <summary>Get human-readable expanded permission history.</summary>
        [HttpGet("events/{eventId}/history/expanded")]
        [Authorize]
        public async Task<IActionResult> GetExpandedHistory(int eventId, [FromQuery] int? userId = null, [FromQuery] string? action = null, [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? sortBy = null, [FromQuery] string? sortDir = null)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var callerId)) return Unauthorized();

            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var isOrganizer = ev.OrganizerId == callerId;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasModerate = participants.Any(pp => pp.PlayerId == callerId && (pp.Permissions & EventPermission.Moderate) == EventPermission.Moderate);
            if (!isOrganizer && !hasModerate && !User.IsInRole("Admin")) return Forbid();

            // Controller handles total count by requesting via the same query but with pagination parameters
            var paged = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetPermissionChangeHistoryQuery(eventId, userId, action, from, to, page, pageSize, sortBy, sortDir));
            return Ok(paged);
        }
    }
}

