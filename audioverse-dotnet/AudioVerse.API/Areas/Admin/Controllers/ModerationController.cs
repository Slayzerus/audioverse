using AudioVerse.Application.Commands.Moderation;
using AudioVerse.Application.Models.Moderation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/moderation")]
    [Produces("application/json")]
    public class ModerationController : ControllerBase
    {
        private readonly IMediator _mediator;
        public ModerationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Zg?o? nadu?ycie lub nieodpowiedni? tre?? (nick, opis party, itp.)
        /// </summary>
        [HttpPost("report")]
        [Authorize]
        public async Task<IActionResult> ReportAbuse([FromBody] AbuseReportRequest request)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            int? userId = null;
            string? username = null;
            if (!string.IsNullOrEmpty(userIdClaim))
            {
                userId = int.Parse(userIdClaim);
                username = User.FindFirst("username")?.Value;
            }
            var command = new ReportAbuseCommand(userId, username, request.TargetType, request.TargetValue, request.Reason, request.Comment);
            var result = await _mediator.Send(command);
            return result ? Ok(new { Success = true }) : BadRequest(new { Success = false });
        }
    }
}

