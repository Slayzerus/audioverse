using Microsoft.AspNetCore.Mvc;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.API.Areas.Karaoke.Hubs;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    [ApiController]
    [Route("api/permissions")]
    public class PermissionsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly Microsoft.AspNetCore.SignalR.IHubContext<KaraokeHub> _hub;
        public PermissionsController(IMediator mediator, Microsoft.AspNetCore.SignalR.IHubContext<KaraokeHub> hub) { _mediator = mediator; _hub = hub; }

        /// <summary>Grant event permission to a player.</summary>
        [HttpPost("events/{eventId}/players/{playerId}/grant")]
        [Authorize]
        public async Task<IActionResult> GrantPermission(int eventId, int playerId, [FromQuery] EventPermission permission)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            // Only organizer or moderator can grant
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var isOrganizer = ev.OrganizerId == userId;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasModerate = participants.Any(pp => pp.PlayerId == userId && (pp.Permissions & EventPermission.Moderate) == EventPermission.Moderate);
            if (!isOrganizer && !hasModerate) return Forbid();

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.GrantPermissionCommand(eventId, playerId, permission, userId));
            if (ok)
            {
                try { await _hub.Clients.Group($"event:{eventId}:lobby:participants").SendCoreAsync("PermissionsChanged", new object[] { new { eventId = eventId, PlayerId = playerId, Permissions = (int)permission } }, default); } catch (Exception ex) when (ex is IOException or InvalidOperationException) { }
            }
            return ok ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }

        /// <summary>Bulk grant permissions to multiple players.</summary>
        [HttpPost("events/{eventId}/players/permissions/bulk")]
        [Authorize]
        public async Task<IActionResult> BulkGrant(int eventId, [FromBody] List<AudioVerse.Application.Models.Requests.Karaoke.BulkPermissionUpdate> updates)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            // Only organizer or moderator can bulk grant
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var isOrganizer = ev.OrganizerId == userId;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasModerate = participants.Any(pp => pp.PlayerId == userId && (pp.Permissions & EventPermission.Moderate) == EventPermission.Moderate);
            if (!isOrganizer && !hasModerate) return Forbid();

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.BulkUpdatePermissionsCommand(eventId, updates, userId));
            if (ok)
            {
                try { await _hub.Clients.Group($"event:{eventId}:lobby:participants").SendCoreAsync("PermissionsBulkChanged", new object[] { new { eventId = eventId, Count = updates.Count } }, default); } catch (Exception ex) when (ex is IOException or InvalidOperationException) { }
            }
            return Ok(new { Success = ok });
        }

        /// <summary>Get permission change history for an event.</summary>
        [HttpGet("events/{eventId}/history")]
        [Authorize]
        public async Task<IActionResult> GetHistory(int eventId)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();
            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var isOrganizer = ev.OrganizerId == userId;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasModerate = participants.Any(pp => pp.PlayerId == userId && (pp.Permissions & EventPermission.Moderate) == EventPermission.Moderate);
            if (!isOrganizer && !hasModerate && !User.IsInRole("Admin")) return Forbid();

            var logs = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetPermissionChangeHistoryQuery(eventId));
            return Ok(logs);
        }

        /// <summary>Bulk revoke permissions from multiple players.</summary>
        [HttpPost("events/{eventId}/players/permissions/bulk-revoke")]
        [Authorize]
        public async Task<IActionResult> BulkRevoke(int eventId, [FromBody] List<AudioVerse.Application.Models.Requests.Karaoke.BulkPermissionUpdate> updates)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var isOrganizer = ev.OrganizerId == userId;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasModerate = participants.Any(pp => pp.PlayerId == userId && (pp.Permissions & EventPermission.Moderate) == EventPermission.Moderate);
            if (!isOrganizer && !hasModerate) return Forbid();

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.BulkRevokePermissionsCommand(eventId, updates, userId));
            if (ok)
            {
                try { await _hub.Clients.Group($"event:{eventId}:lobby:participants").SendCoreAsync("PermissionsBulkChanged", new object[] { new { eventId = eventId, Count = updates.Count } }, default); } catch (Exception ex) when (ex is IOException or InvalidOperationException) { }
            }
            return Ok(new { Success = ok });
        }

        /// <summary>Revoke event permission from a player.</summary>
        [HttpPost("events/{eventId}/players/{playerId}/revoke")]
        [Authorize]
        public async Task<IActionResult> RevokePermission(int eventId, int playerId, [FromQuery] EventPermission permission)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (!int.TryParse(userIdClaim, out var userId)) return Unauthorized();

            var ev = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetEventByIdQuery(eventId));
            if (ev == null) return NotFound();
            var isOrganizer = ev.OrganizerId == userId;
            var participants = await _mediator.Send(new AudioVerse.Application.Queries.Karaoke.GetKaraokePlayersByEventQuery(eventId));
            var hasModerate = participants.Any(pp => pp.PlayerId == userId && (pp.Permissions & EventPermission.Moderate) == EventPermission.Moderate);
            if (!isOrganizer && !hasModerate) return Forbid();

            var ok = await _mediator.Send(new AudioVerse.Application.Commands.Karaoke.RevokePermissionCommand(eventId, playerId, permission, userId));
            if (ok)
            {
                try { await _hub.Clients.Group($"event:{eventId}:lobby:participants").SendCoreAsync("PermissionsChanged", new object[] { new { eventId = eventId, PlayerId = playerId, Permissions = (int)permission } }, default); } catch (Exception ex) when (ex is IOException or InvalidOperationException) { }
            }
            return ok ? Ok(new { Success = true }) : NotFound(new { Success = false });
        }
    }
}

