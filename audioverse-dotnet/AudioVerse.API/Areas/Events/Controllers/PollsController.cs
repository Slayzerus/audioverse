using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Events;
using AudioVerse.Application.Queries.Events;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event polls - create surveys, collect votes, view results.
    /// Supports anonymous voting via token.
    /// </summary>
    [ApiController]
    [Route("api/events")]
    [Produces("application/json")]
    [Tags("Events - Polls")]
    public class PollsController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PollsController(IMediator mediator) => _mediator = mediator;

        // ════════════════════════════════════════════════════════════
        //  EVENT-SCOPED (requires auth)
        // ════════════════════════════════════════════════════════════

        /// <summary>
        /// Create a poll for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="poll">Poll data with options</param>
        /// <returns>Created poll ID and token for anonymous voting</returns>
        [Authorize]
        /// <summary>Create Poll.</summary>
        [HttpPost("{eventId:int}/polls")]
        [ProducesResponseType(typeof(object), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreatePoll(int eventId, [FromBody] EventPoll poll)
        {
            if (poll == null || string.IsNullOrWhiteSpace(poll.Title)) return BadRequest();
            var uid = User.FindFirst("id")?.Value;
            poll.EventId = eventId;
            poll.CreatedByUserId = int.TryParse(uid, out var u) ? u : null;
            var id = await _mediator.Send(new CreatePollCommand(poll));
            return CreatedAtAction(nameof(GetPoll), new { eventId, pollId = id }, new { Id = id, Token = poll.Token });
        }

        /// <summary>
        /// List all polls for an event.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <returns>List of polls</returns>
        [Authorize]
        /// <summary>Get Polls.</summary>
        [HttpGet("{eventId:int}/polls")]
        [ProducesResponseType(typeof(IEnumerable<EventPoll>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetPolls(int eventId)
            => Ok(await _mediator.Send(new GetPollsByEventQuery(eventId)));

        /// <summary>
        /// Get a specific poll with options.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="pollId">Poll ID</param>
        /// <returns>Poll details with options</returns>
        [Authorize]
        /// <summary>Get Poll.</summary>
        [HttpGet("{eventId:int}/polls/{pollId:int}")]
        [ProducesResponseType(typeof(EventPoll), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPoll(int eventId, int pollId)
        {
            var poll = await _mediator.Send(new GetPollByIdQuery(pollId));
            return poll != null ? Ok(poll) : NotFound();
        }

        /// <summary>
        /// Update poll (title, description, active, expiry).
        /// </summary>
        [Authorize]
        [HttpPut("{eventId:int}/polls/{pollId:int}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdatePoll(int eventId, int pollId, [FromBody] EventPoll poll)
        {
            if (poll == null) return BadRequest();
            poll.Id = pollId; poll.EventId = eventId;
            return await _mediator.Send(new UpdatePollCommand(poll)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>
        /// Delete a poll and all its responses.
        /// </summary>
        [Authorize]
        [HttpDelete("{eventId:int}/polls/{pollId:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> DeletePoll(int eventId, int pollId)
            => await _mediator.Send(new DeletePollCommand(pollId)) ? NoContent() : NotFound();

        /// <summary>
        /// Get consolidated results for a poll.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="pollId">Poll ID</param>
        /// <returns>Poll results with vote counts per option</returns>
        [Authorize]
        /// <summary>Get Poll Results.</summary>
        [HttpGet("{eventId:int}/polls/{pollId:int}/results")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetPollResults(int eventId, int pollId)
        {
            var results = await _mediator.Send(new GetPollResultsQuery(pollId));
            return results != null ? Ok(results) : NotFound();
        }

        /// <summary>
        /// Send poll email to a list of addresses.
        /// </summary>
        /// <param name="eventId">Event ID</param>
        /// <param name="pollId">Poll ID</param>
        /// <param name="request">List of email addresses</param>
        [Authorize]
        /// <summary>Send Poll Emails.</summary>
        [HttpPost("{eventId:int}/polls/{pollId:int}/send")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> SendPollEmails(int eventId, int pollId, [FromBody] SendPollEmailsRequest request)
        {
            if (request == null || request.Emails == null || request.Emails.Count == 0)
                return BadRequest(new { Message = "Provide at least one email address" });

            var baseUrl = $"{Request.Scheme}://{Request.Host}";
            var sent = await _mediator.Send(new SendPollEmailsCommand(pollId, request.Emails, baseUrl));
            return Ok(new { Sent = sent, Total = request.Emails.Count });
        }

        // ??????????????????????????????????????????????????
        //  PUBLIC (token-based, no auth required)
        // ??????????????????????????????????????????????????

        /// <summary>View a poll via token link (for email recipients)</summary>
        [AllowAnonymous]
        [HttpGet("polls/view/{token}")]
        public async Task<IActionResult> ViewPollByToken(string token)
        {
            var poll = await _mediator.Send(new GetPollByTokenQuery(token));
            if (poll == null) return NotFound(new { Message = "Poll not found or expired" });
            if (!poll.IsActive) return BadRequest(new { Message = "This poll is no longer active" });
            if (poll.ExpiresAt.HasValue && poll.ExpiresAt.Value < DateTime.UtcNow)
                return BadRequest(new { Message = "This poll has expired" });

            return Ok(new
            {
                poll.Id,
                poll.Title,
                poll.Description,
                Type = poll.Type.ToString(),
                Options = poll.Options.Select(o => new { o.Id, o.Text }),
                poll.ExpiresAt
            });
        }

        /// <summary>Submit vote via token link (no auth required)</summary>
        [AllowAnonymous]
        [HttpPost("polls/vote/{token}")]
        public async Task<IActionResult> VoteByToken(string token, [FromBody] VotePollRequest request)
        {
            if (request == null || request.OptionIds == null || request.OptionIds.Count == 0)
                return BadRequest(new { Message = "Select at least one option" });

            var ok = await _mediator.Send(new SubmitPollResponseCommand(token, request.OptionIds, request.Email, null, request.Quantities));
            return ok ? Ok(new { Success = true, Message = "Dzi?kujemy za g?os!" }) : BadRequest(new { Message = "Vote failed � poll may be inactive or expired" });
        }

        /// <summary>Auto-populate poll options from its OptionSource (BoardGames, VideoGames, Songs, MenuItems, Attractions)</summary>
        [Authorize]
        [HttpPost("events/{eventId}/polls/{pollId}/populate")]
        public async Task<IActionResult> PopulatePollOptions(int eventId, int pollId)
        {
            var count = await _mediator.Send(new PopulatePollOptionsFromSourceCommand(pollId));
            return Ok(new { OptionsAdded = count });
        }
    }
}

