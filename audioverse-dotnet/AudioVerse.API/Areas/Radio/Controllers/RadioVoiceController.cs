using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Radio;
using AudioVerse.Application.Queries.Radio;
using AudioVerse.API.Models.Requests.Radio;

namespace AudioVerse.API.Areas.Radio.Controllers
{
    /// <summary>
    /// Radio live voice — start/stop voice sessions, status, archive.
    /// </summary>
    [Route("api/radio")]
    [ApiController]
    public class RadioVoiceController(IMediator mediator) : ControllerBase
    {
        /// <summary>Start a live voice session on a station (Admin only). DJ speaks live.</summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/voice/start")]
        public async Task<IActionResult> StartVoice(int id, [FromBody] StartVoiceRequest? req = null)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var session = await mediator.Send(new StartVoiceSessionCommand(id, userId, req?.EnableRecording ?? false));
            return Ok(new { voiceSessionId = session.Id });
        }

        /// <summary>Stop a live voice session on a station (Admin only).</summary>
        [Authorize(Roles = "Admin")]
        [HttpPost("{id}/voice/stop")]
        public async Task<IActionResult> StopVoice(int id)
        {
            var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
            var session = await mediator.Send(new StopVoiceSessionCommand(id, userId));
            if (session == null) return NotFound(new { error = "no_active_voice_session" });
            return Ok(new { voiceSessionId = session.Id, endUtc = session.EndUtc });
        }

        /// <summary>Check if someone is currently speaking live on a station.</summary>
        [HttpGet("{id}/voice/status")]
        public async Task<IActionResult> VoiceStatus(int id)
        {
            var status = await mediator.Send(new GetVoiceStatusQuery(id));
            if (status == null) return Ok(new { isLive = false });
            return Ok(new { isLive = true, status.VoiceSessionId, status.SpeakerUserId, status.StartUtc });
        }

        /// <summary>Get the station day archive timeline (voice segments + timestamps).</summary>
        [HttpGet("{id}/archive/{date}")]
        public async Task<IActionResult> Archive(int id, DateTime date)
        {
            var entries = await mediator.Send(new GetRadioArchiveQuery(id, date));
            return Ok(entries);
        }
    }
}
