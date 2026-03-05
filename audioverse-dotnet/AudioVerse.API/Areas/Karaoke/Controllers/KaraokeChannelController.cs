using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Queries.Karaoke;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using AudioVerse.API.Areas.Karaoke.Hubs;

namespace AudioVerse.API.Areas.Karaoke.Controllers
{
    [ApiController]
    [Route("api/karaoke/channel")]
    [Authorize]
    public class KaraokeChannelController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<KaraokeHub> _hubContext;

        public KaraokeChannelController(IMediator mediator, Microsoft.AspNetCore.SignalR.IHubContext<KaraokeHub> hubContext)
        {
            _mediator = mediator;
            _hubContext = hubContext;
        }

        // Promote or demote a player between channels
        /// <summary>Move a player between karaoke channel slots.</summary>
        [HttpPost("move")]
        public async Task<IActionResult> MovePlayer([FromBody] MoveRequest req)
        {
            if (req == null) return BadRequest();
            // authorization: only organizer or admin
            var ev = await _mediator.Send(new GetEventByIdQuery(req.EventId));
            var userIdClaim = User.FindFirst("id")?.Value;
            int? uid = null;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsed)) uid = parsed;
            var isAdmin = User.IsInRole("Admin");
            if (!isAdmin && (ev == null || ev.OrganizerId != uid)) return Forbid();

            // Notify clients in both channels
            await _hubContext.Clients.Group($"event:{req.EventId}:lobby:{req.FromChannel ?? "default"}").SendAsync("PlayerMovedOut", new { EventId = req.EventId, PlayerId = req.PlayerId, From = req.FromChannel, To = req.ToChannel });
            await _hubContext.Clients.Group($"event:{req.EventId}:lobby:{req.ToChannel ?? "default"}").SendAsync("PlayerMovedIn", new { EventId = req.EventId, PlayerId = req.PlayerId, From = req.FromChannel, To = req.ToChannel });

            return Ok(new { Success = true });
        }
    }
}

