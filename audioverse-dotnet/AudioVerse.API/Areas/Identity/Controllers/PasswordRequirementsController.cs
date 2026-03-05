using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using AudioVerse.Application.Services.User;
using AudioVerse.Domain.Entities;
using AudioVerse.Domain.Entities.Auth;
using AudioVerse.Application.Models;

namespace AudioVerse.API.Areas.Identity.Controllers
{
    [ApiController]
    [Route("api/password-requirements")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    [Consumes("application/json")]
    public class PasswordRequirementsController : ControllerBase
    {
        private readonly IPasswordService _passwordService;

        public PasswordRequirementsController(IPasswordService passwordService)
        {
            _passwordService = passwordService;
        }

        /// <summary>
        /// Update system password requirements policy
        /// </summary>
        /// <param name="dto">Password requirements: minimum/maximum length, required character types</param>
        /// <response code="200">Password requirements updated successfully</response>
        /// <response code="400">Update failed - invalid requirements</response>
        /// <summary>Update Password Requirements.</summary>
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
                    Message = "Wymagania dotyczace hasel zostaly zaktualizowane",
                    Requirements = dto
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }

        /// <summary>
        /// Get all active password requirements for the system
        /// </summary>
        /// <response code="200">List of all active password requirements</response>
        /// <response code="404">No active password requirements found</response>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPasswordRequirements()
        {
            try
            {
                var activeRequirements = await _passwordService.GetActivePasswordRequirementsAsync();

                if (activeRequirements == null || activeRequirements.Count == 0)
                {
                    return NotFound(new { Success = false, Message = "Brak aktywnych wymagan dotyczacych hasel" });
                }

                var dtos = activeRequirements.Select(pr => new
                {
                    Id = pr.Id,
                    Description = pr.Description,
                    Active = pr.Active,
                    MinLength = pr.MinLength,
                    MaxLength = pr.MaxLength,
                    RequireUppercase = pr.RequireUppercase,
                    RequireLowercase = pr.RequireLowercase,
                    RequireDigit = pr.RequireDigit,
                    RequireSpecialChar = pr.RequireSpecialChar,
                    RequiredDigitCount = pr.RequiredDigitCount,
                    RequiredSpecialCharCount = pr.RequiredSpecialCharCount,
                    RequiredUppercaseCount = pr.RequiredUppercaseCount,
                    RequireNoRepeatingChars = pr.RequireNoRepeatingChars,
                    RequireOnlyDigitsAndSpecialChars = pr.RequireOnlyDigitsAndSpecialChars,
                    RequireOnlyLettersAndSpecialChars = pr.RequireOnlyLettersAndSpecialChars,
                    RequireOnlyLettersAndDigits = pr.RequireOnlyLettersAndDigits
                }).ToList();

                return Ok(new
                {
                    Success = true,
                    Count = dtos.Count,
                    Requirements = dtos
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { Success = false, Message = ex.Message });
            }
        }
    }
}
