using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.User;
using AudioVerse.Application.Models;
using System.Security.Claims;
using AudioVerse.Application.Models.Requests.User;

namespace AudioVerse.API.Controllers
{
    [ApiController]
    [Route("api/user")]
    public class UserController : ControllerBase
    {
        private readonly IMediator _mediator;

        public UserController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Rejestracja nowego użytkownika
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterUserCommand command)
        {
            try
            {
                var userId = await _mediator.Send(command);
                return Ok(new { Success = true, UserId = userId, Message = "Użytkownik został zarejestrowany" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Logowanie użytkownika
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginUserCommand command)
        {
            try
            {
                (string accessToken, string refreshToken) = await _mediator.Send(command);

                // Jeśli refreshToken jest pusty, oznacza to że wymagana jest zmiana hasła
                if (string.IsNullOrEmpty(refreshToken))
                {
                    return Ok(new
                    {
                        Success = true,
                        RequirePasswordChange = true,
                        TempToken = accessToken,
                        Message = "Wymagana zmiana hasła przy pierwszym logowaniu"
                    });
                }

                return Ok(new
                {
                    Success = true,
                    RequirePasswordChange = false,
                    TokenPair = new TokenPair(accessToken, refreshToken)
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Odświeżanie tokena
        /// </summary>
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command)
        {
            try
            {
                var tokens = await _mediator.Send(command);
                return Ok(new { Success = true, Tokens = tokens });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Wylogowanie użytkownika
        /// </summary>
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostęp" });

                var userId = int.Parse(userIdClaim);
                var command = new LogoutUserCommand(userId);
                var result = await _mediator.Send(command);

                return result
                    ? Ok(new { Success = true, Message = "Wylogowano pomyślnie" })
                    : BadRequest(new { Success = false, Message = "Wylogowanie nie powiodło się" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Zmiana własnego hasła przez użytkownika
        /// </summary>
        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangeOwnPassword([FromBody] ChangeOwnPasswordRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostęp" });

                var userId = int.Parse(userIdClaim);
                var command = new ChangeOwnPasswordCommand(userId, request.OldPassword, request.NewPassword);
                var result = await _mediator.Send(command);

                return Ok(new { Success = result, Message = "Hasło zostało zmienione pomyślnie" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Zmiana hasła przy pierwszym logowaniu
        /// </summary>
        [HttpPost("first-login-password-change")]
        [Authorize]
        public async Task<IActionResult> FirstLoginPasswordChange([FromBody] FirstLoginPasswordChangeRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                var requirePasswordChangeClaim = User.FindFirst("requirePasswordChange")?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostęp" });

                if (requirePasswordChangeClaim != "True")
                    return BadRequest(new { Success = false, Message = "Zmiana hasła nie jest wymagana" });

                var userId = int.Parse(userIdClaim);
                var command = new FirstLoginPasswordChangeCommand(userId, request.NewPassword, request.ConfirmPassword);
                var result = await _mediator.Send(command);

                return Ok(new { Success = result, Message = "Hasło zostało zmienione. Zaloguj się ponownie." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Pobranie informacji o zalogowanym użytkowniku
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userIdClaim = User.FindFirst("id")?.Value;
                var usernameClaim = User.FindFirst("username")?.Value;
                var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { Success = false, Message = "Nieautoryzowany dostęp" });

                return Ok(new
                {
                    Success = true,
                    UserId = int.Parse(userIdClaim),
                    Username = usernameClaim,
                    Role = roleClaim
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}