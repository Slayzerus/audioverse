using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Models;
using AudioVerse.Application.Queries.Admin;
using AudioVerse.Application.Models.Requests.Admin;

namespace AudioVerse.API.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AdminController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Zmiana hasła administratora
        /// </summary>
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangeAdminPassword([FromBody] ChangeAdminPasswordCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(new { Success = result, Message = "Hasło zostało zmienione pomyślnie" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Zmiana hasła użytkownika przez administratora
        /// </summary>
        [HttpPost("users/{userId}/change-password")]
        public async Task<IActionResult> AdminChangeUserPassword(int userId, [FromBody] AdminChangeUserPasswordRequest request)
        {
            try
            {
                var command = new AdminChangeUserPasswordCommand(userId, request.NewPassword);
                var result = await _mediator.Send(command);
                return Ok(new { Success = result, Message = "Hasło użytkownika zostało zmienione" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Modyfikacja szczegółów konta użytkownika
        /// </summary>
        [HttpPut("users/{userId}")]
        public async Task<IActionResult> UpdateUserDetails(int userId, [FromBody] UpdateUserDetailsRequest request)
        {
            try
            {
                var command = new UpdateUserDetailsCommand(
                    userId,
                    request.FullName,
                    request.Email,
                    request.UserName
                );
                var result = await _mediator.Send(command);
                return Ok(new { Success = result, Message = "Dane użytkownika zostały zaktualizowane" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Dodawanie nowego użytkownika
        /// </summary>
        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserCommand command)
        {
            try
            {
                var userId = await _mediator.Send(command);
                return Ok(new { Success = true, UserId = userId, Message = "Użytkownik został utworzony" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Pobieranie listy wszystkich użytkowników
        /// </summary>
        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var query = new GetAllUsersQuery();
                var users = await _mediator.Send(query);
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Blokowanie/Odblokowanie konta użytkownika
        /// </summary>
        [HttpPost("users/{userId}/block")]
        public async Task<IActionResult> BlockUser(int userId, [FromBody] BlockUserRequest request)
        {
            try
            {
                var command = new BlockUserCommand(userId, request.IsBlocked);
                var result = await _mediator.Send(command);
                var message = request.IsBlocked ? "Użytkownik został zablokowany" : "Użytkownik został odblokowany";
                return Ok(new { Success = result, Message = message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Usuwanie konta użytkownika
        /// </summary>
        [HttpDelete("users/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            try
            {
                var command = new DeleteUserCommand(userId);
                var result = await _mediator.Send(command);
                return Ok(new { Success = result, Message = "Użytkownik został usunięty" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Ustawienie ważności hasła użytkownika (w dniach)
        /// </summary>
        [HttpPost("users/{userId}/password-validity")]
        public async Task<IActionResult> SetPasswordValidity(int userId, [FromBody] SetPasswordValidityRequest request)
        {
            try
            {
                var command = new SetPasswordValidityCommand(userId, request.ValidityDays);
                var result = await _mediator.Send(command);
                var message = request.ValidityDays.HasValue
                    ? $"Ważność hasła ustawiona na {request.ValidityDays} dni"
                    : "Ważność hasła została usunięta";
                return Ok(new { Success = result, Message = message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}