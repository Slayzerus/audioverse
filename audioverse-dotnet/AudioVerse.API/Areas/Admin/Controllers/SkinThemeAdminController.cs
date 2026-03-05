using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MediatR;
using AudioVerse.Application.Commands.Admin;
using AudioVerse.Application.Queries.Admin;
using Microsoft.Extensions.Caching.Memory;
using System.Security.Claims;

namespace AudioVerse.API.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/admin/skins")]
    [Authorize(Roles = "Admin")]
    [Produces("application/json")]
    [Tags("Admin - Skin Themes")]
    public class SkinThemeAdminController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly IMemoryCache _cache;

        private const string ActiveSkinsCacheKey = "active_skins";

        public SkinThemeAdminController(IMediator mediator, IMemoryCache cache)
        {
            _mediator = mediator;
            _cache = cache;
        }

        /// <summary>
        /// Get all skin themes (admin view, includes inactive/deleted).
        /// </summary>
        [HttpGet]
        [ProducesResponseType(StatusCodes.Status200OK)]
        public async Task<IActionResult> GetAll([FromQuery] bool includeDeleted = false)
        {
            var skins = await _mediator.Send(new GetAllSkinThemesQuery(includeDeleted));
            return Ok(new { Success = true, Skins = skins });
        }

        /// <summary>
        /// Get a skin theme by ID.
        /// </summary>
        [HttpGet("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetById(int id)
        {
            var skin = await _mediator.Send(new GetSkinThemeByIdQuery(id));
            return skin != null ? Ok(skin) : NotFound();
        }

        /// <summary>
        /// Create a new skin theme.
        /// </summary>
        [HttpPost]
        [ProducesResponseType(StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> Create([FromBody] CreateSkinThemeRequest request)
        {
            var (userId, username) = GetCurrentUser();
            var id = await _mediator.Send(new CreateSkinThemeCommand(
                request.Name, request.Emoji, request.Description,
                request.IsDark, request.BodyBackground, request.Vars,
                request.IsActive, request.IsSystem, request.SortOrder,
                userId, username));

            InvalidateCache();
            return CreatedAtAction(nameof(GetById), new { id }, new { Id = id });
        }

        /// <summary>
        /// Update an existing skin theme.
        /// </summary>
        [HttpPut("{id:int}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateSkinThemeRequest request)
        {
            var (userId, username) = GetCurrentUser();
            var result = await _mediator.Send(new UpdateSkinThemeCommand(
                id, request.Name, request.Emoji, request.Description,
                request.IsDark, request.BodyBackground, request.Vars,
                request.IsActive, request.SortOrder,
                userId, username));

            if (!result) return NotFound();
            InvalidateCache();
            return Ok(new { Success = true });
        }

        /// <summary>
        /// Delete a skin theme. System themes are soft-deleted, custom themes are hard-deleted.
        /// </summary>
        [HttpDelete("{id:int}")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Delete(int id)
        {
            var (userId, username) = GetCurrentUser();
            var result = await _mediator.Send(new DeleteSkinThemeCommand(id, userId, username));
            if (!result) return NotFound();
            InvalidateCache();
            return NoContent();
        }

        /// <summary>
        /// Activate or deactivate a skin theme.
        /// </summary>
        [HttpPost("{id:int}/activate")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<IActionResult> Activate(int id, [FromQuery] bool active = true)
        {
            var (userId, username) = GetCurrentUser();
            try
            {
                var result = await _mediator.Send(new ActivateSkinThemeCommand(id, active, userId, username));
                if (!result) return NotFound();
                InvalidateCache();
                return Ok(new { Success = true, IsActive = active });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        private (int? userId, string? username) GetCurrentUser()
        {
            var idClaim = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? User.Identity?.Name;
            return (int.TryParse(idClaim, out var id) ? id : null, username);
        }

        private void InvalidateCache() => _cache.Remove(ActiveSkinsCacheKey);
    }
}
