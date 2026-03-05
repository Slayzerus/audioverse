using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Application.Models.Requests.Admin;
using AudioVerse.Application.Services.User;
using System.Security.Claims;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    /// <summary>
    /// Admin audit and security — system configuration, login attempts, audit log.
    /// </summary>
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    [Consumes("application/json")]
    public class AdminAuditController(
        IMediator mediator,
        ILoginAttemptService loginAttemptService) : ControllerBase
    {
        /// <summary>Get current active system configuration.</summary>
        [HttpGet("system-config")]
        public async Task<IActionResult> GetSystemConfiguration()
        {
            try
            {
                var config = await mediator.Send(new GetSystemConfigurationQuery());
                return Ok(new { Success = true, Configuration = config });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Update system configuration (session timeout, captcha option).</summary>
        [HttpPut("system-config")]
        public async Task<IActionResult> UpdateSystemConfiguration([FromBody] UpdateSystemConfigurationRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                var usernameClaim = User.FindFirst(ClaimTypes.Name)?.Value ?? User.FindFirst("username")?.Value;

                int? userId = null;
                if (int.TryParse(userIdClaim, out var parsedId))
                    userId = parsedId;

                var command = new UpdateSystemConfigurationCommand(
                    request.SessionTimeoutMinutes, request.CaptchaOption,
                    request.MaxMicrophonePlayers, userId, usernameClaim, request.Active);

                var result = await mediator.Send(command);
                return Ok(new { Success = result, Message = "System configuration updated" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get all login attempts from all users.</summary>
        [HttpGet("login-attempts")]
        public async Task<IActionResult> GetAllLoginAttempts()
        {
            try
            {
                var attempts = await loginAttemptService.GetAllLoginAttemptsAsync();
                return Ok(new
                {
                    Success = true, Count = attempts.Count,
                    Attempts = attempts.Select(a => new { a.Id, a.UserId, a.Username, a.Success, a.AttemptTime, a.IpAddress }).ToList()
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get login attempts for a specific user.</summary>
        [HttpGet("login-attempts/{userId}")]
        public async Task<IActionResult> GetUserLoginAttempts(int userId)
        {
            try
            {
                var attempts = await loginAttemptService.GetUserLoginAttemptsAsync(userId);
                var successCount = attempts.Count(a => a.Success);
                var failCount = attempts.Count(a => !a.Success);

                return Ok(new
                {
                    Success = true, UserId = userId, TotalAttempts = attempts.Count,
                    SuccessfulAttempts = successCount, FailedAttempts = failCount,
                    Attempts = attempts.Select(a => new { a.Id, a.Success, a.AttemptTime, a.IpAddress }).ToList()
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get recent failed login attempts (suspicious activity detection).</summary>
        [HttpGet("login-attempts/recent-failed")]
        public async Task<IActionResult> GetRecentFailedAttempts([FromQuery] int minutes = 15)
        {
            try
            {
                var attempts = await loginAttemptService.GetRecentFailedAttemptsAsync(minutes);

                var groupedByUser = attempts
                    .GroupBy(a => a.Username)
                    .Select(g => new
                    {
                        Username = g.Key, FailedAttempts = g.Count(),
                        LastAttempt = g.Max(a => a.AttemptTime),
                        IpAddresses = g.Select(a => a.IpAddress).Distinct().ToList()
                    })
                    .OrderByDescending(g => g.FailedAttempts).ToList();

                return Ok(new
                {
                    Success = true, TimeWindowMinutes = minutes,
                    TotalFailedAttempts = attempts.Count, UniqueUsersAffected = groupedByUser.Count,
                    SuspiciousActivity = groupedByUser,
                    AllAttempts = attempts.Select(a => new { a.Id, a.Username, a.AttemptTime, a.IpAddress }).ToList()
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get entity change audit log with optional filtering by entity name and ID.</summary>
        [HttpGet("audit")]
        public async Task<IActionResult> GetAuditLog([FromQuery] string? entity, [FromQuery] string? entityId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var result = await mediator.Send(new GetEntityChangeLogQuery(entity, entityId, page, pageSize));
            return Ok(result);
        }
    }
}
