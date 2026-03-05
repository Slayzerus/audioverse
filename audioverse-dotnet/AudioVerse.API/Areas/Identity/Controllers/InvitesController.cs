using Microsoft.AspNetCore.Mvc;
using MediatR;
using AudioVerse.Application.Commands.Karaoke;
using AudioVerse.Application.Models.Requests.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    [ApiController]
    [Route("api/invites")]
    public class InvitesController : ControllerBase
    {
        private readonly IMediator _mediator;
        public InvitesController(IMediator mediator) { _mediator = mediator; }

        // Only authenticated users can send invites
        /// <summary>Send an invite to join an event.</summary>
        [HttpPost("events/{eventId}/send")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> SendInvite(int eventId, [FromBody] SendEventInviteRequest req)
        {
            if (req == null) return BadRequest();
            var userIdClaim = User.FindFirst("id")?.Value;
            int? from = null;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsed)) from = parsed;

            // Ensure sender has permission to invite (organizer or granted Invite permission)
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound(new { Success = false, Message = "Event not found" });

            var senderId = from;
            var isOrganizer = senderId.HasValue && ev.OrganizerId == senderId.Value;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasInvitePermission = senderId.HasValue && participants.Any(pp => pp.PlayerId == senderId.Value && (pp.Permissions & EventPermission.Invite) == EventPermission.Invite);

            if (!isOrganizer && !hasInvitePermission) return Forbid();

            var invite = new AudioVerse.Domain.Entities.Events.EventInvite { EventId = ev.Id, FromUserId = from, ToUserId = req.ToUserId, ToEmail = req.ToEmail, Message = req.Message };
            var id = await _mediator.Send(new SendEventInviteCommand(invite));
            return Ok(new { InviteId = id });
        }

        /// <summary>Cancel a pending invite.</summary>
        [HttpPost("{inviteId}/cancel")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> Cancel(int inviteId)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();
            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.CancelEventInviteCommand(inviteId, userId));
            return ok ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        // Only authenticated users can respond to invites (recipient must be authenticated)
        /// <summary>Accept or reject an invite.</summary>
        [HttpPost("{inviteId}/respond")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async Task<IActionResult> Respond(int inviteId, [FromQuery] bool accept)
        {
            // Ensure the authenticated user matches the invite recipient when ToUserId is set
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var uid))
            {
                var invite = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventInviteByIdQuery(inviteId));
                if (invite == null) return NotFound(new { Success = false });
                if (invite.ToUserId.HasValue && invite.ToUserId.Value != uid) return Forbid();
            }

            var result = await _mediator.Send(new RespondToEventInviteCommand(inviteId, accept));
            return result ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }
    }
}

