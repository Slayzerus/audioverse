using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Services.User;
using AudioVerse.Application.Validators.Admin;
using AudioVerse.Domain.Enums.Events;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    /// <summary>
    /// Admin panel — dashboard, events overview, scoring presets.
    /// </summary>
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    [Consumes("application/json")]
    public class AdminController(
        IMediator mediator,
        IAuditLogService auditLogService,
        IEventRepository eventRepo) : ControllerBase
    {

        /// <summary>Admin dashboard — aggregated statistics</summary>
        [HttpGet("dashboard")]
        [Microsoft.AspNetCore.OutputCaching.OutputCache(PolicyName = "CacheShort")]
        public async Task<IActionResult> GetDashboard()
            => Ok(await mediator.Send(new AudioVerse.Application.Queries.Admin.GetAdminDashboardQuery()));


        /// <summary>List events with pagination (admin view)</summary>
        [HttpGet("events")]
        public async Task<IActionResult> GetEvents([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? type = null)
        {
            List<EventType>? types = null;
            if (!string.IsNullOrEmpty(type) && Enum.TryParse<EventType>(type, true, out var et))
                types = new List<EventType> { et };
            var (items, total) = await eventRepo.GetEventsPagedAsync(null, null, types, null, null, null, null, page, pageSize, "StartTime", true);
            return Ok(new { Total = total, Page = page, PageSize = pageSize, Items = items });
        }

        /// <summary>Get all karaoke scoring presets.</summary>
        [HttpGet("scoring-presets")]
        public async Task<IActionResult> GetScoringPresets()
        {
            try
            {
                var json = await mediator.Send(new AudioVerse.Application.Queries.Admin.GetScoringPresetsQuery());
                return Ok(new { Success = true, Presets = System.Text.Json.JsonSerializer.Deserialize<object>(json) });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>Save karaoke scoring presets (overwrite all).</summary>
        [HttpPost("scoring-presets")]
        public async Task<IActionResult> SaveScoringPresets([FromBody] AudioVerse.Application.Models.Requests.Admin.ScoringPresetsRequest request)
        {
            try
            {
                // Validate request
                var validator = new ScoringPresetsValidator();
                var validation = validator.Validate(request);
                if (!validation.IsValid)
                {
                    return BadRequest(new { Success = false, Errors = validation.Errors.Select(e => e.ErrorMessage) });
                }

                var userIdClaim = User.FindFirst("id")?.Value;
                int? userId = null;
                string? username = null;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out var parsed)) userId = parsed;
                username = User.FindFirst("username")?.Value;

                // fetch previous presets for audit diff
                var prevJson = await mediator.Send(new AudioVerse.Application.Queries.Admin.GetScoringPresetsQuery());

                var cmd = new AudioVerse.Application.Commands.Admin.SaveScoringPresetsCommand(request, userId, username);
                var result = await mediator.Send(cmd);

                // audit log the change (store small diff)
                try
                {
                    var prev = string.IsNullOrEmpty(prevJson) ? "{}" : prevJson;
                    var next = System.Text.Json.JsonSerializer.Serialize(request);
                    var desc = prev == next ? "No changes" : $"Scoring presets updated. Prev: { (prev.Length>400? prev.Substring(0,400)+"...": prev) } New: { (next.Length>400? next.Substring(0,400)+"...": next) }";
                    await auditLogService.LogActionAsync(userId, username ?? string.Empty, "SaveScoringPresets", desc, true);
                }
                catch (Exception ex) when (ex is not OutOfMemoryException) { /* audit failure shouldn't block main flow */ }

                return Ok(new { Success = result });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}
