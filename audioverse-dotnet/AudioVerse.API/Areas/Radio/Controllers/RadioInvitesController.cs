using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Radio;
using AudioVerse.Application.Queries.Radio;
using AudioVerse.API.Models.Requests.Radio;

namespace AudioVerse.API.Areas.Radio.Controllers
{
    /// <summary>
    /// Radio station invites — create, list, revoke, verify and accept guest invitations.
    /// </summary>
    [Route("api/radio")]
    [ApiController]
    public class RadioInvitesController(IMediator mediator) : ControllerBase
    {
        /// <summary>Send a radio station invite via email. The guest can speak live during the designated time window.</summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/invites")]
        public async Task<IActionResult> CreateInvite(int id, [FromBody] CreateRadioInviteRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Email)) return BadRequest("Email is required");
            if (req.ValidFrom >= req.ValidTo) return BadRequest("ValidFrom must be before ValidTo");

            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var invite = await mediator.Send(new CreateRadioInviteCommand(id, userId, req.Email, req.ValidFrom, req.ValidTo, req.Message));
            return Ok(new { invite.Id, invite.Token, invite.Email, invite.ValidFrom, invite.ValidTo });
        }

        /// <summary>Get invites for a station (Admin only).</summary>
        [Authorize(Roles = "Admin")]
        [HttpGet("{id}/invites")]
        public async Task<IActionResult> ListInvites(int id)
        {
            var invites = await mediator.Send(new GetRadioInvitesQuery(id));
            return Ok(invites);
        }

        /// <summary>Revoke an invite (Admin only).</summary>
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id}/invites/{inviteId}")]
        public async Task<IActionResult> RevokeInvite(int id, int inviteId)
        {
            var ok = await mediator.Send(new RevokeRadioInviteCommand(id, inviteId));
            if (!ok) return NotFound();
            return NoContent();
        }

        /// <summary>Verify an invite by token (public — guest clicks link from email).</summary>
        [HttpGet("invites/verify/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyInvite(string token)
        {
            var result = await mediator.Send(new VerifyRadioInviteCommand(token));
            if (result == null) return NotFound(new { error = "invalid_or_expired_invite" });
            return Ok(result);
        }

        /// <summary>Accept an invite — guest confirms participation (optionally providing a name).</summary>
        [HttpPost("invites/accept/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> AcceptInvite(string token, [FromBody] AcceptRadioInviteRequest? req = null)
        {
            var result = await mediator.Send(new AcceptRadioInviteCommand(token, req?.GuestName));
            if (result == null) return NotFound(new { error = "invalid_or_expired_invite" });
            return Ok(result);
        }
    }
}
