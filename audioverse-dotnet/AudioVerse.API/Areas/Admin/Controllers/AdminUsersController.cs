using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Application.Models.Requests.Admin;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities.Admin;
using AudioVerse.Domain.Repositories;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    /// <summary>
    /// Admin user management — CRUD, passwords, OTP, blocking, bans, password requirements.
    /// </summary>
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    [Consumes("application/json")]
    public class AdminUsersController(
        IMediator mediator,
        IAuditLogService auditLogService,
        IOtpService otpService,
        IAuditRepository auditRepo) : ControllerBase
    {
        /// <summary>Change admin's own password.</summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangeAdminPassword([FromBody] ChangeAdminPasswordCommand command)
        {
            try
            {
                var result = await mediator.Send(command);
                return Ok(new { Success = result, Message = "Haslo zostalo zmienione pomyslnie" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Change user's password by admin.</summary>
        [HttpPost("users/{userId}/change-password")]
        public async Task<IActionResult> AdminChangeUserPassword(int userId, [FromBody] AdminChangeUserPasswordRequest request)
        {
            try
            {
                var result = await mediator.Send(new AdminChangeUserPasswordCommand(userId, request.NewPassword));
                return Ok(new { Success = result, Message = "Haslo uzytkownika zostalo zmienione" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Update user account details (name, email, username, password requirements, expiry date).</summary>
        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUserDetails(int userId, [FromBody] UpdateUserDetailsRequest request)
        {
            try
            {
                var command = new UpdateUserDetailsCommand(userId, request.FullName, request.Email,
                    request.UserName, request.RequirePasswordChange, request.PasswordExpiryDate);
                var result = await mediator.Send(command);
                return Ok(new { Success = result, Message = "Dane uzytkownika zostaly zaktualizowane" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Create a new user account.</summary>
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserCommand command)
        {
            try
            {
                var userId = await mediator.Send(command);
                return Ok(new { Success = true, UserId = userId, Message = "Uzytkownik zostal utworzony" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get list of all users with basic details.</summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try { return Ok(await mediator.Send(new GetAllUsersQuery())); }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get user list (admin panel).</summary>
        [HttpGet("users/list")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await mediator.Send(new GetUsersQuery());
            return Ok(new { Success = true, Users = users });
        }

        /// <summary>Block or unblock a user account.</summary>
        [HttpPost("users/{userId}/block")]
        public async Task<IActionResult> BlockUser(int userId, [FromBody] BlockUserRequest request)
        {
            try
            {
                var result = await mediator.Send(new BlockUserCommand(userId, request.IsBlocked));
                var message = !request.IsBlocked ? "Uzytkownik zostal zablokowany" : "Uzytkownik zostal odblokowany";
                return Ok(new { Success = result, Message = message });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Delete a user account permanently.</summary>
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                var adminIdClaim = User.FindFirst("id")?.Value;
                var adminUsernameClaim = User.FindFirst("username")?.Value;
                if (string.IsNullOrEmpty(adminIdClaim) || string.IsNullOrEmpty(adminUsernameClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                int adminId = int.Parse(adminIdClaim);
                if (adminId == userId)
                    return BadRequest(new { Success = false, Message = "Nie mozesz usunac swojego konta" });

                var result = await mediator.Send(new DeleteUserCommand(userId));
                await auditLogService.LogActionAsync(adminId, adminUsernameClaim, "DeleteUser",
                    $"Admin usunal uzytkownika ID: {userId}", true);

                return Ok(new { Success = result, Message = "Uzytkownik zostal usuniety" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Set password validity period (in days) for a user.</summary>
        [HttpPost("users/{userId}/password-validity")]
        public async Task<IActionResult> SetPasswordValidity(int userId, [FromBody] SetPasswordValidityRequest request)
        {
            try
            {
                var result = await mediator.Send(new SetPasswordValidityCommand(userId, request.ValidityDays));
                var message = request.ValidityDays.HasValue
                    ? $"Waznosc hasla ustawiona na {request.ValidityDays} dni"
                    : "Waznosc hasla zostala usunieta";
                return Ok(new { Success = result, Message = message });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Update system password requirements (minimum length, character types).</summary>
        [HttpPost("password-requirements")]
        public async Task<IActionResult> UpdatePasswordRequirements([FromBody] UpdatePasswordRequirementsRequest request)
        {
            try
            {
                var command = new UpdatePasswordRequirementsCommand(request.RequireUppercase, request.RequireLowercase,
                    request.RequireDigit, request.RequireSpecialChar, request.MinLength);
                var result = await mediator.Send(command);
                return Ok(new { Success = result, Message = "Wymagania dotyczace hasel zostaly zaktualizowane" });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Generate a one-time password (OTP) for a user.</summary>
        [HttpPost("users/{userId}/generate-otp")]
        public async Task<IActionResult> GenerateOtpForUser(int userId)
        {
            try
            {
                var adminIdClaim = User.FindFirst("id")?.Value;
                var adminUsernameClaim = User.FindFirst("username")?.Value;
                if (string.IsNullOrEmpty(adminIdClaim) || string.IsNullOrEmpty(adminUsernameClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostep" });

                int adminId = int.Parse(adminIdClaim);
                var otpResult = await otpService.GenerateOtpAsync(userId);
                if (otpResult == null)
                    return BadRequest(new { Success = false, Message = "Nie udalo sie wygenerowac OTP" });

                await auditLogService.LogActionAsync(adminId, adminUsernameClaim, "GenerateOTP",
                    $"Admin wygenerowal jednorazowe haslo dla uzytkownika ID: {userId}", true);

                return Ok(new
                {
                    Success = true, Message = "Jednorazowe haslo zostalo wygenerowane",
                    OtpId = otpResult.Id, Otp = otpResult.Otp, ExpiresAt = otpResult.ExpiresAt,
                    Note = "Admin must deliver this OTP to the user"
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        /// <summary>Get history of all generated OTP tokens for audit purposes.</summary>
        [HttpGet("otp-history")]
        public async Task<IActionResult> GetOtpHistory()
        {
            try
            {
                var otps = await otpService.GetAllOtpsAsync();
                return Ok(new
                {
                    Success = true, Count = otps.Count,
                    Otps = otps.Select(o => new { o.Id, o.UserId, o.CreatedAt, o.ExpiresAt, o.IsUsed, o.UsedAt }).ToList()
                });
            }
            catch (Exception ex) { return BadRequest(new { Success = false, Message = ex.Message }); }
        }

        // ── Bans ──

        /// <summary>Ban a user (temporary or permanent).</summary>
        [HttpPost("users/{userId}/ban")]
        public async Task<IActionResult> BanUser(int userId, [FromBody] UserBan ban)
        {
            if (ban == null) return BadRequest();
            var adminId = User.FindFirst("id")?.Value;
            ban.UserId = userId;
            ban.BannedByAdminId = int.TryParse(adminId, out var aid) ? aid : null;
            ban.BannedAt = DateTime.UtcNow;
            ban.IsActive = true;

            var banId = await auditRepo.AddBanAsync(ban);
            return Ok(new { Success = true, BanId = banId });
        }

        /// <summary>Lift (deactivate) a ban.</summary>
        [HttpDelete("bans/{banId}")]
        public async Task<IActionResult> LiftBan(int banId)
            => await auditRepo.LiftBanAsync(banId) ? Ok(new { Success = true }) : NotFound();

        /// <summary>List active bans for a user.</summary>
        [HttpGet("users/{userId}/bans")]
        public async Task<IActionResult> GetUserBans(int userId)
            => Ok(await auditRepo.GetActiveBansAsync(userId));
    }
}
