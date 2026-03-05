using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.API.Models.Requests.Events;

namespace AudioVerse.API.Areas.Events.Controllers
{
    /// <summary>
    /// Event invite templates and bulk invitations.
    /// </summary>
    [ApiController]
    [Route("api/events")]
    [Authorize]
    [Produces("application/json")]
    [Tags("Events - Invites")]
    public class EventInvitesController : ControllerBase
    {
        private readonly IMediator _mediator;

        public EventInvitesController(IMediator mediator) => _mediator = mediator;

        /// <summary>Create invite template for event.</summary>
        [HttpPost("{eventId:int}/invite-templates")]
        public async Task<IActionResult> AddInviteTemplate(int eventId, [FromBody] AudioVerse.Domain.Entities.Events.EventInviteTemplate template)
        {
            template.EventId = eventId;
            var id = await _mediator.Send(new AudioVerse.Application.Commands.Events.AddInviteTemplateCommand(template));
            return Created($"/api/events/{eventId}/invite-templates/{id}", new { Id = id });
        }

        /// <summary>Get invite templates for event.</summary>
        [HttpGet("{eventId:int}/invite-templates")]
        public async Task<IActionResult> GetInviteTemplates(int eventId)
            => Ok(await _mediator.Send(new AudioVerse.Application.Queries.Events.GetInviteTemplatesByEventQuery(eventId)));

        /// <summary>Update invite template.</summary>
        [HttpPut("{eventId:int}/invite-templates/{id:int}")]
        public async Task<IActionResult> UpdateInviteTemplate(int eventId, int id, [FromBody] AudioVerse.Domain.Entities.Events.EventInviteTemplate template)
        {
            template.Id = id;
            template.EventId = eventId;
            template.UpdatedAt = DateTime.UtcNow;
            return await _mediator.Send(new AudioVerse.Application.Commands.Events.UpdateInviteTemplateCommand(template)) ? Ok(new { Success = true }) : NotFound();
        }

        /// <summary>Delete invite template.</summary>
        [HttpDelete("{eventId:int}/invite-templates/{id:int}")]
        public async Task<IActionResult> DeleteInviteTemplate(int eventId, int id)
            => await _mediator.Send(new AudioVerse.Application.Commands.Events.DeleteInviteTemplateCommand(id)) ? NoContent() : NotFound();

        /// <summary>Send bulk invites to contacts using a template. Queued via RabbitMQ.</summary>
        [HttpPost("{eventId:int}/bulk-invite")]
        public async Task<IActionResult> SendBulkInvites(int eventId, [FromBody] BulkInviteRequest request)
        {
            if (request.ContactIds == null || request.ContactIds.Length == 0)
                return BadRequest(new { Message = "ContactIds required" });
            var jobId = await _mediator.Send(new AudioVerse.Application.Commands.Events.SendBulkInvitesCommand(eventId, request.TemplateId, request.ContactIds, request.UserId));
            return jobId > 0 ? Ok(new { JobId = jobId }) : BadRequest(new { Message = "Template not found" });
        }

        /// <summary>Get bulk invite job status.</summary>
        [HttpGet("{eventId:int}/bulk-invite/{jobId:int}")]
        public async Task<IActionResult> GetBulkInviteJob(int eventId, int jobId)
        {
            var job = await _mediator.Send(new AudioVerse.Application.Queries.Events.GetBulkInviteJobQuery(jobId));
            return job != null ? Ok(job) : NotFound();
        }
    }
}
