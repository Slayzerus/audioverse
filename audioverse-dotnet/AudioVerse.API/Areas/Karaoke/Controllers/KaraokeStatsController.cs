using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Queries.Karaoke;

namespace AudioVerse.API.Areas.Karaoke.Controllers
{
    /// <summary>
    /// Karaoke statistics — ranking, history, activity.
    /// </summary>
    [ApiController]
    [Route("api/karaoke/stats")]
    [Produces("application/json")]
    [Authorize]
    [Tags("Karaoke - Stats")]
    public class KaraokeStatsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public KaraokeStatsController(IMediator mediator) => _mediator = mediator;

        /// <summary>Get karaoke global ranking (TOP N users by total score).</summary>
        [HttpGet("ranking")]
        [AllowAnonymous]
        public async Task<IActionResult> GetKaraokeRanking([FromQuery] int top = 20)
        {
            var ranking = await _mediator.Send(new GetKaraokeRankingQuery(top));
            return Ok(new { Success = true, Ranking = ranking });
        }

        /// <summary>Get karaoke singing history for a user.</summary>
        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetKaraokeHistory(int userId, [FromQuery] int take = 20)
        {
            var history = await _mediator.Send(new GetKaraokeHistoryQuery(userId, take));
            return Ok(new { Success = true, History = history });
        }

        /// <summary>Get karaoke activity (songs sung per day, total score per day).</summary>
        [HttpGet("activity")]
        public async Task<IActionResult> GetKaraokeActivity([FromQuery] int days = 30)
        {
            var activity = await _mediator.Send(new GetKaraokeActivityQuery(days));
            return Ok(new { Success = true, Activity = activity });
        }
    }
}
