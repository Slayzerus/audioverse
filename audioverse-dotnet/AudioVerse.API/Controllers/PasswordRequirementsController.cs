using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Domain.Settings;
using AudioVerse.Application.Services;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Application.Models;

namespace AudioVerse.API.Controllers
{
    [ApiController]
    [Route("api/password-requirements")]
    [Authorize(Roles = "Admin")]
    public class PasswordRequirementsController : ControllerBase
    {
        private readonly IPasswordService _passwordService;

        public PasswordRequirementsController(IPasswordService passwordService)
        {
            _passwordService = passwordService;
        }

        /// <summary>
        /// Aktualizacja wymagań dotyczących haseł
        /// </summary>
        [HttpPost]
        public IActionResult UpdatePasswordRequirements([FromBody] PasswordRequirementsDto dto)
        {
            try
            {
                var requirements = new PasswordRequirements
                {
                    RequireUppercase = dto.RequireUppercase,
                    RequireLowercase = dto.RequireLowercase,
                    RequireDigit = dto.RequireDigit,
                    RequireSpecialChar = dto.RequireSpecialChar,
                    MinLength = dto.MinLength,
                    MaxLength = dto.MaxLength
                };

                _passwordService.UpdatePasswordRequirements(requirements);

                return Ok(new
                {
                    Success = true,
                    Message = "Wymagania dotyczące haseł zostały zaktualizowane",
                    Requirements = dto
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Pobieranie aktualnych wymagań dotyczących haseł
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public IActionResult GetPasswordRequirements()
        {
            // W prawdziwej implementacji należałoby przechowywać te ustawienia w bazie danych
            // Tutaj zwracamy domyślne wymagania
            var requirements = new PasswordRequirementsDto
            {
                RequireUppercase = true,
                RequireLowercase = true,
                RequireDigit = true,
                RequireSpecialChar = true,
                MinLength = 8,
                MaxLength = 128
            };

            return Ok(requirements);
        }
    }
}